import { Resolver, Query, Mutation, Arg, Authorized, Ctx } from "type-graphql";
import { GraphQLUpload, type FileUpload } from "graphql-upload-ts";
import csv from "csv-parser";
import { Parser } from "json2csv";
import bcrypt from "bcrypt";
import { Team } from "../entities/Team.ts";
import { AppDataSource } from "../config/db.ts";
import { User } from "../entities/User.ts";
import { TeamMember, UserRole } from "../entities/TeamMember.ts";
import { type MyContext } from "../middleware/authMiddleware.ts";

@Resolver()
export class ImportExportTeamResolver {
  @Authorized()
  @Query(() => String)
  async exportTeam(
    @Arg("teamId", () => String) teamId: string,
  ): Promise<string> {
    const team = await AppDataSource.getRepository(Team).findOne({
      where: { id: teamId },
      relations: { members: { user: true } },
    });

    if (!team) throw new Error("Team not found!");

    const data = team.members.map((m) => ({
      teamId: team.id,
      teamName: team.name,
      memberName: m.user?.name || "",
      memberEmail: m.user?.email || "",
      memberRole: m.role,
    }));

    return new Parser({
      fields: ["teamId", "teamName", "memberName", "memberEmail", "memberRole"],
    }).parse(data);
  }

  @Authorized()
  @Mutation(() => Boolean)
  async importTeams(
    @Arg("teamId", () => String) teamId: string,
    @Arg("file", () => GraphQLUpload) file: FileUpload,
    @Ctx() ctx: MyContext
  ): Promise<boolean> {
    const loggedInUser = ctx.user;

    if (!loggedInUser || !loggedInUser.userId) {
      throw new Error("Unauthorized");
    }

    const { createReadStream, filename } = await file;
    const rows: any[] = [];

    await new Promise((resolve, reject) => {
      createReadStream().pipe(csv())
        .on('data', (row: any) => rows.push(row))
        .on('end', resolve)
        .on('error', reject);
    });

    const teamRepo = AppDataSource.getRepository(Team);
    const userRepo = AppDataSource.getRepository(User);
    const memberRepo = AppDataSource.getRepository(TeamMember);

    const teamGroups: { [key: string]: any[] } = {};
    const defaultTeamName = filename ? filename.replace('.csv', '') : 'Imported Team';

    for (const row of rows) {
      const email = row.memberEmail || row.email;
      if (!email) continue;

      if(!row.password) throw new Error(`${row.email} Password is required in csv otherwise provide google_id`)

      const targetTeamId = row.teamId || teamId;
      const tName = row.teamName || defaultTeamName;
      const groupKey = (targetTeamId && targetTeamId.trim() !== "") ? `ID:${targetTeamId}` : `NAME:${tName}`;

      if (!teamGroups[groupKey]) {
        teamGroups[groupKey] = [];
      }
      teamGroups[groupKey].push(row);
    }

    for (const groupKey of Object.keys(teamGroups)) {
      const currentRows = teamGroups[groupKey];
      let teamInstance: Team | null = null;

      if (groupKey.startsWith('ID:')) {
        const existingId = groupKey.replace('ID:', '');
        teamInstance = await teamRepo.findOneBy({ id: existingId });
      }

      if (!teamInstance) {
        let adminUserInstance: User | null = null;
        const currentTeamName = groupKey.startsWith('NAME:') ? groupKey.replace('NAME:', '') : defaultTeamName;

        for (const row of currentRows!) {
          const rowRole = row.memberRole || row.role || 'MEMBER';
          if (rowRole === 'ADMIN') {
            const email = row.memberEmail || row.email;
            let existingUser = await userRepo.findOne({
              where: [{ email: email }, { google_id: email }]
            });

            if (!existingUser) {
              const plainPassword = row.password;
              const googleId = row.google_id;
              if (!plainPassword && !googleId) continue;

              const fallbackName = email.split('@')[0] || 'Unknown Member';
              const name = row.memberName || row.name || fallbackName;

              const userProps: any = { name: String(name), email: String(email) };
              if (plainPassword) userProps.password_hash = await bcrypt.hash(plainPassword, 10);
              if (googleId) userProps.google_id = googleId;

              existingUser = await userRepo.save(userProps);
            }
            
            adminUserInstance = existingUser;
            break;
          }
        }

        if (!adminUserInstance) {
          const firstRow = currentRows![0];
          const fallbackEmail = firstRow?.memberEmail || firstRow?.email;
          
          if (fallbackEmail) {
            let firstRowUser = await userRepo.findOne({
              where: [{ email: fallbackEmail }, { google_id: fallbackEmail }]
            });

            if (!firstRowUser) {
              const plainPassword = firstRow.password;
              const googleId = firstRow.google_id;
              if (plainPassword || googleId) {
                const fallbackName = fallbackEmail.split('@')[0] || 'Unknown Member';
                const name = firstRow.memberName || firstRow.name || fallbackName;

                const userProps: any = { name: String(name), email: String(fallbackEmail) };
                if (plainPassword) userProps.password_hash = await bcrypt.hash(plainPassword, 10);
                if (googleId) userProps.google_id = googleId;

                firstRowUser = await userRepo.save(userProps);
              }
            }
            adminUserInstance = firstRowUser;
          }
        }

        const teamProperties: any = {
          name: currentTeamName,
          description: 'Automatically created during CSV import',
          is_public: true
        };

        if (adminUserInstance && adminUserInstance.id) {
          teamProperties.created_by = { id: adminUserInstance.id } as User;
        } else {
          teamProperties.created_by = { id: loggedInUser.userId } as User;
        }

        teamInstance = await teamRepo.save(teamProperties);
      }

      for (const row of currentRows!) {
        const email = row.memberEmail || row.email;
        let dbUser = await userRepo.findOne({
          where: [{ email: email }, { google_id: email }]
        });

        if (!dbUser) {
          const plainPassword = row.password;
          const googleId = row.google_id;
          if (!plainPassword && !googleId) continue;

          const fallbackName = email.split('@')[0] || 'Unknown Member';
          const name = row.memberName || row.name || fallbackName;

          const userProperties: any = { name: String(name), email: String(email) };
          if (plainPassword) userProperties.password_hash = await bcrypt.hash(plainPassword, 10);
          if (googleId) userProperties.google_id = googleId;

          dbUser = await userRepo.save(userProperties);
        }

        if (!dbUser || !dbUser.id) continue;

        const exists = await memberRepo.findOne({
          where: {
            team: { id: teamInstance!.id },
            user: { id: dbUser.id }
          }
        });

        if (!exists) {
          let parsedRole = UserRole.MEMBER;
          if (row.memberRole === 'ADMIN' || row.role === 'ADMIN') {
            parsedRole = UserRole.ADMIN;
          }

          await memberRepo.save(memberRepo.create({
            team: { id: teamInstance!.id },
            user: { id: dbUser.id },
            role: parsedRole
          }));
        }
      }
    }

    return true;
  }
}