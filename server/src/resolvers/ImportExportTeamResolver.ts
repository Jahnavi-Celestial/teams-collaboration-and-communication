import { Resolver, Query, Mutation, Arg, Authorized, Ctx } from "type-graphql";
import { GraphQLUpload, type FileUpload } from "graphql-upload-ts";
import csv from "csv-parser";
import { Parser } from "json2csv";
import bcrypt from "bcrypt";
import { In } from "typeorm"; 
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

    if (rows.length === 0) return true;

    await Promise.all(
      rows.map(async (row) => {
        const email = row.memberEmail || row.email;
        if (email && row.password) {
          row.hashedPassword = await bcrypt.hash(row.password, 10);
        }
      })
    );

    const emails = rows.map((r) => r.memberEmail || r.email).filter(Boolean);
    const userRepo = AppDataSource.getRepository(User);
    
    const existingUsers = await userRepo.find({
      where: [{ email: In(emails) }, { google_id: In(emails) }],
    });
    
    const userCache = new Map<string, User>();
    existingUsers.forEach((u) => {
      if (u.email) userCache.set(u.email.toLowerCase(), u);
      if (u.google_id) userCache.set(u.google_id.toLowerCase(), u);
    });

    const defaultTeamName = filename ? filename.replace('.csv', '') : 'Imported Team';
    const teamGroups: { [key: string]: any[] } = {};

    for (const row of rows) {
      const email = row.memberEmail || row.email;
      if (!email) continue;

      if (!row.password && !row.google_id) {
        throw new Error(`${email}: Password or google_id is required in CSV.`);
      }

      const targetTeamId = row.teamId || teamId;
      const tName = row.teamName || defaultTeamName;
      const groupKey = (targetTeamId && targetTeamId.trim() !== "") ? `ID:${targetTeamId}` : `NAME:${tName}`;

      if (!teamGroups[groupKey]) {
        teamGroups[groupKey] = [];
      }
      teamGroups[groupKey].push(row);
    }

    await AppDataSource.transaction(async (transactionalEntityManager) => {
      for (const groupKey of Object.keys(teamGroups)) {
        const currentRows = teamGroups[groupKey]!;
        let teamInstance: Team | null = null;

        if (groupKey.startsWith('ID:')) {
          const existingId = groupKey.replace('ID:', '');
          teamInstance = await transactionalEntityManager.findOneBy(Team, { id: existingId });
        }

        if (!teamInstance) {
          let adminUserInstance: User | null = null;
          const currentTeamName = groupKey.startsWith('NAME:') ? groupKey.replace('NAME:', '') : defaultTeamName;

          for (const row of currentRows) {
            const rowRole = row.memberRole || row.role || 'MEMBER';
            if (rowRole === 'ADMIN') {
              const email = (row.memberEmail || row.email).toLowerCase();
              adminUserInstance = userCache.get(email) || null;

              if (!adminUserInstance) {
                const name = row.memberName || row.name || email.split('@')[0];
                const newUser = transactionalEntityManager.create(User, {
                  name: String(name),
                  email: String(email),
                  password_hash: row.hashedPassword || undefined,
                  google_id: row.google_id || undefined,
                });
                adminUserInstance = await transactionalEntityManager.save(User, newUser);
                userCache.set(email, adminUserInstance);
              }
              break;
            }
          }

          if (!adminUserInstance) {
            const firstRow = currentRows[0];
            const fallbackEmail = (firstRow?.memberEmail || firstRow?.email)?.toLowerCase();
            if (fallbackEmail) {
              adminUserInstance = userCache.get(fallbackEmail) || null;
              if (!adminUserInstance && (firstRow.hashedPassword || firstRow.google_id)) {
                const name = firstRow.memberName || firstRow.name || fallbackEmail.split('@')[0];
                const newUser = transactionalEntityManager.create(User, {
                  name: String(name),
                  email: String(fallbackEmail),
                  password_hash: firstRow.hashedPassword || undefined,
                  google_id: firstRow.google_id || undefined,
                });
                adminUserInstance = await transactionalEntityManager.save(User, newUser);
                userCache.set(fallbackEmail, adminUserInstance);
              }
            }
          }

          const teamProperties = transactionalEntityManager.create(Team, {
            name: currentTeamName,
            description: 'Automatically created during CSV import',
            is_public: true,
            created_by: adminUserInstance ? { id: adminUserInstance.id } as User : { id: loggedInUser.userId } as User,
          });

          teamInstance = await transactionalEntityManager.save(Team, teamProperties);
        }

        for (const row of currentRows) {
          const email = (row.memberEmail || row.email).toLowerCase();
          let dbUser = userCache.get(email) || null;

          if (!dbUser) {
            const name = row.memberName || row.name || email.split('@')[0];
            const newUser = transactionalEntityManager.create(User, {
              name: String(name),
              email: String(email),
              password_hash: row.hashedPassword || undefined,
              google_id: row.google_id || undefined,
            });
            dbUser = await transactionalEntityManager.save(User, newUser);
            userCache.set(email, dbUser);
          }

          if (!dbUser || !dbUser.id) continue;

          const exists = await transactionalEntityManager.findOne(TeamMember, {
            where: {
              team: { id: teamInstance.id },
              user: { id: dbUser.id }
            }
          });

          if (!exists) {
            let parsedRole = UserRole.MEMBER;
            if (row.memberRole === 'ADMIN' || row.role === 'ADMIN') {
              parsedRole = UserRole.ADMIN;
            }

            const newMember = transactionalEntityManager.create(TeamMember, {
              team: { id: teamInstance.id },
              user: { id: dbUser.id },
              role: parsedRole
            });
            await transactionalEntityManager.save(TeamMember, newMember);
          }
        }
      }
    });

    return true;
  }
}
