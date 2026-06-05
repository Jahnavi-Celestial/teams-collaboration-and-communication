import {
  Arg,
  Authorized,
  Ctx,
  Int,
  Mutation,
  Query,
  Resolver,
} from "type-graphql";
import { type MyContext } from "../middleware/authMiddleware.ts";
import { Team } from "../entities/Team.ts";
import { TeamMember, UserRole } from "../entities/TeamMember.ts";
import { User } from "../entities/User.ts";
import { ILike, In, Not } from "typeorm";
import { AppDataSource } from "../config/db.ts";
import { Notification } from "../entities/Notification.ts";

@Resolver()
export class TeamResolver {
  @Authorized()
  @Mutation(() => Team)
  async createTeamWithMembers(
    @Arg("name", () => String) name: string,
    @Arg("description", () => String, { nullable: true }) description: string,
    @Arg("memberIds", () => [String]) memberIds: string[],
    @Arg("isPublic", () => Boolean) isPublic: Boolean,
    @Ctx() context: MyContext,
  ) {
    const creatorId = context.user!.userId;

    return await AppDataSource.transaction(async (tm) => {
      const team = tm.create(Team, {
        name,
        description,
        is_public: !!isPublic,
        created_by: { id: creatorId } as User,
      });
      const savedTeam = await tm.save(team);

      const uniqueMemberIds = Array.from(new Set([creatorId, ...memberIds]));

      const teamMembers = uniqueMemberIds.map((userId) => {
        return tm.create(TeamMember, {
          team: savedTeam,
          user: { id: userId } as User,
          role: userId === creatorId ? UserRole.ADMIN : UserRole.MEMBER,
        });
      });

      await tm.save(teamMembers);

      const newTeam = (await tm.findOne(Team, {
        where: { id: savedTeam.id },
        relations: {
          created_by: true,
          members: {
            user: true,
          },
        },
      })) as Team;

      for (const targetUid of uniqueMemberIds) {
        context.io.to(`user_${targetUid}`).emit("REFETCH_GLOBAL_DATA", { teamId: savedTeam.id });
      }

      return newTeam
    });
  }

  @Authorized()
  @Query(() => [Team])
  async getAllPublicTeams(
    @Arg("searchTerm", () => String, { nullable: true }) searchTerm?: string,
  ) {
    const teamsRepo = AppDataSource.getRepository(Team);

    const condition = searchTerm
      ? { is_public: true, name: ILike(`%${searchTerm}%`) }
      : { is_public: true };

    const teams = await teamsRepo.find({
      where: condition,
      relations: {
        created_by: true,
        members: {
          user: true,
        },
      },
    });

    return teams;
  }

  @Authorized()
  @Query(() => [Team])
  async getTeams(
    @Ctx() context: MyContext,
    @Arg("skip", () => Int, { defaultValue: 0 }) skip: number,
    @Arg("take", () => Int, { defaultValue: 9 }) take: number,
  ) {
    const teamsRepo = AppDataSource.getRepository(Team);

    const teams = await teamsRepo.find({
      where: { members: { user: { id: context.user!.userId } } },
      relations: {
        created_by: true,
        members: {
          user: true,
        },
      },
      order: { created_at: "DESC" },
      skip: skip, 
      take: take,
    });

    return teams;
  }

  @Authorized()
  @Mutation(() => [TeamMember])
  async joinTeams(
    @Arg("teamIds", () => [String]) teamIds: string[],
    @Ctx() context: MyContext,
  ) {
    const userId = context.user!.userId;

    const teamRepo = AppDataSource.getRepository(Team);
    const teamMemberRepo = AppDataSource.getRepository(TeamMember);const notifRepo = AppDataSource.getRepository(Notification);
    const userRepo = AppDataSource.getRepository(User);

    const currentUser = await userRepo.findOne({ where: { id: userId } })

    const teams = await teamRepo.find({
      where: { id: In(teamIds), is_public: true },
    });

    const existingMembers = await teamMemberRepo.find({
      where: { user: { id: userId }, team: { id: In(teamIds) } },
      relations: {
        team: true,
        user: true,
      },
    });

    const existingTeamIds = existingMembers.map((m) => m.team.id);

    const teamsToJoin = teams.filter(
      (team) => !existingTeamIds.includes(team.id),
    );

    if (teamsToJoin.length === 0) {
      throw new Error("You already is the member of this team");
    }

    const newMembers = teamsToJoin.map((team) =>
      teamMemberRepo.create({
        team: { id: team.id } as Team,
        user: { id: userId } as User,
        role: UserRole.MEMBER,
      }),
    );

    const teamMember = await teamMemberRepo.save(newMembers);

    for (const team of teamsToJoin) {
      const admins = await teamMemberRepo.find({
        where: { team: { id: team.id }, role: UserRole.ADMIN },
        relations: {user: true}
      });

      for (const admin of admins) {
        const notifId = crypto.randomUUID();
        const alertMsg = await notifRepo.save({
          id: notifId,
          user: { id: admin.user.id } as User,
          type: "MEMBER_ADDED" as any,
          title: "New Team Member",
          body: `${currentUser?.name || 'A user'} has joined team: ${team.name}`,
          team: { id: team.id } as Team,
          is_read: false
        });

        context.io.to(`user_${admin.user.id}`).emit("incoming_system_notification", {
          id: notifId,
          type: "MEMBER_ADDED",
          title: "New Team Member",
          body: `${currentUser?.name || 'A user'} has joined team: ${team.name}`,
          team_id: team.id,
          is_read: false,
          created_at: new Date().toISOString()
        });
      }
    }

    context.io.to(`user_${userId}`).emit("REFETCH_GLOBAL_DATA");
    for (const tid of teamIds) {
      context.io.to(tid).emit("REFETCH_GLOBAL_DATA", { teamId: tid });
    }

    return teamMember
  }

  @Authorized()
  @Mutation(() => Boolean)
  async deleteTeam(
    @Arg("teamId", () => String) teamId: string,
    @Ctx() context: MyContext,
  ) {
    const userId = context.user!.userId;
    const teamMemberRepo = AppDataSource.getRepository(TeamMember);
    const teamRepo = AppDataSource.getRepository(Team);

    const member = await teamMemberRepo.findOne({
      where: {
        team: { id: teamId },
        user: { id: userId },
      },
    });

    if (!member || member.role !== UserRole.ADMIN) {
      throw new Error("Access Denied: Only Admin can delete Team!");
    }

    const currentMembers = await teamMemberRepo.find({
      where: { team: { id: teamId } },
      relations: {user: true}
    });

    const result = await teamRepo.delete(teamId);

    context.io.to(teamId).emit("REFETCH_GLOBAL_DATA", { teamId, deleted: true });
    for (const m of currentMembers) {
      context.io.to(`user_${m.user.id}`).emit("REFETCH_GLOBAL_DATA", { teamId, deleted: true });
    }

    context.io.to(teamId).emit("team_deleted_live", { teamId: teamId });

    return result.affected !== 0;
  }

  @Query(() => [TeamMember])
  async getMembersOfTeam(@Arg("teamId", () => String) teamId: string) {
    const teamMemberRepo = AppDataSource.getRepository(TeamMember);

    const members = await teamMemberRepo.find({
      where: { team: { id: teamId } },
      relations: {
        user: true,
      },
    });

    return members;
  }

  @Query(() => [User])
  async userNotInTeam(
    @Arg("teamId", () => String) teamId: string,
    @Arg("search", () => String, { nullable: true }) search?: string,
  ) {
    const teamMemberRepo = AppDataSource.getRepository(TeamMember);
    const userRepo = AppDataSource.getRepository(User);

    const members = await teamMemberRepo.find({
      where: { team: { id: teamId } },
      relations: { user: true },
    });

    const memberUserIds = members.map((member) => member.user.id);

    const whereCondition: any = {};
    if (memberUserIds.length > 0) {
      whereCondition.id = Not(In(memberUserIds));
    }

    if (search && search.trim() !== "") {
      whereCondition.name = ILike(`%${search.trim()}%`);
    }

    return await userRepo.find({ where: whereCondition });
  }

  @Authorized()
  @Mutation(() => Boolean)
  async addMembersToTeam(
    @Arg("teamId", () => String) teamId: string,
    @Arg("userIds", () => [String]) userIds: string[],
    @Ctx() context: MyContext,
  ) {
    const currentUserId = context.user!.userId;
    const teamMemberRepo = AppDataSource.getRepository(TeamMember);
    const notifRepo = AppDataSource.getRepository(Notification);
    const teamRepo = AppDataSource.getRepository(Team);
    const userRepo = AppDataSource.getRepository(User);

    const currentTeam = await teamRepo.findOne({ where: { id: teamId } });
    const callerMember = await teamMemberRepo.findOne({
      where: { team: { id: teamId }, user: { id: currentUserId } },
    });

    if (!callerMember || callerMember.role !== UserRole.ADMIN) {
      throw new Error("Access Denied: Only admin can add members");
    }

    const existingMembers = await teamMemberRepo.find({
      where: { team: { id: teamId } },
      relations: { user: true },
    });

    const existingUserIds = new Set(existingMembers.map((m) => m.user.id));

    const newUserIdsToInsert = userIds.filter((id) => !existingUserIds.has(id));

    if (newUserIdsToInsert.length === 0) {
      throw new Error("All selected users are already in the team");
    }

    const newMembers = newUserIdsToInsert.map((id) => {
      return teamMemberRepo.create({
        team: { id: teamId } as Team,
        user: { id: id } as User,
        role: UserRole.MEMBER,
      });
    });

    await teamMemberRepo.save(newMembers);

    for (const addedId of newUserIdsToInsert) {
      const targetUser = await userRepo.findOne({ where: { id: addedId } });
      const admins = await teamMemberRepo.find({
        where: { team: { id: teamId }, role: UserRole.ADMIN },
        relations: {user: true}
      });

      for (const admin of admins) {
        if (admin.user.id === currentUserId) continue;
        const notifId = crypto.randomUUID();
        await notifRepo.save({
          id: notifId,
          user: { id: admin.user.id } as User,
          type: "MEMBER_ADDED" as any,
          title: "Member Added",
          body: `${targetUser?.name || 'User'} was appended to team: ${currentTeam?.name}`,
          team: { id: teamId } as Team,
          is_read: false
        });

        context.io.to(`user_${admin.user.id}`).emit("incoming_system_notification", {
          id: notifId,
          type: "MEMBER_ADDED",
          title: "Member Added",
          body: `${targetUser?.name || 'User'} was appended to team: ${currentTeam?.name}`,
          team_id: teamId,
          is_read: false,
          created_at: new Date().toISOString()
        });
      }

      const userNotifId = crypto.randomUUID();
      await notifRepo.save({
        id: userNotifId,
        user: { id: addedId } as User,
        type: "TEAM_JOINED" as any,
        title: "Added to Team",
        body: `You have been added to team: ${currentTeam?.name}`,
        team: { id: teamId } as Team,
        is_read: false
      });

      context.io.to(`user_${addedId}`).emit("incoming_system_notification", {
        id: userNotifId,
        type: "TEAM_JOINED",
        title: "Added to Team",
        body: `You have been added to team: ${currentTeam?.name}`,
        team_id: teamId,
        is_read: false,
        created_at: new Date().toISOString()
      });
    }

    context.io.to(teamId).emit("REFETCH_GLOBAL_DATA", { teamId });
    
    for (const addedId of newUserIdsToInsert) {
      context.io.to(`user_${addedId}`).emit("REFETCH_GLOBAL_DATA", { teamId });
    }

    return true;
  }

  @Authorized()
  @Mutation(() => Boolean)
  async changeMemberRole(
    @Arg("teamId", () => String) teamId: string,
    @Arg("memberId", () => String) memberId: string,
    @Arg("newRole", () => UserRole) newRole: UserRole,
    @Ctx() context: MyContext,
  ) {
    const currentUserId = context.user!.userId;

    const teamMemberRepo = AppDataSource.getRepository(TeamMember);

    const callerMember = await teamMemberRepo.findOne({
      where: { team: { id: teamId }, user: { id: currentUserId } },
    });

    if (!callerMember || callerMember.role !== UserRole.ADMIN) {
      throw new Error("Access Denied: Only admin can change role");
    }

    const targetMember = await teamMemberRepo.findOne({
      where: { id: memberId },
      relations: {
        user: true,
      },
    });

    if (!targetMember) {
      throw new Error("Member not found");
    }

    if (targetMember.role === UserRole.ADMIN && newRole !== UserRole.ADMIN) {
      const adminCount = await teamMemberRepo.count({
        where: {
          team: { id: teamId } as Team,
          role: UserRole.ADMIN,
        },
      });
      if (adminCount <= 1) throw new Error("Cannot change role of last admin");
    }

    await teamMemberRepo.update({ id: memberId }, { role: newRole });

    context.io.to(teamId).emit("REFETCH_GLOBAL_DATA", { teamId });
    context.io.to(`user_${targetMember.user.id}`).emit("REFETCH_GLOBAL_DATA", { teamId });

    return true;
  }

  @Authorized()
  @Mutation(() => Boolean)
  async removeMemberFromTeam(
    @Arg("teamId", () => String) teamId: string,
    @Arg("memberId", () => String) memberId: string,
    @Ctx() context: MyContext,
  ) {
    const currentUserId = context.user!.userId;

    const teamMemberRepo = AppDataSource.getRepository(TeamMember);

    const callerMember = await teamMemberRepo.findOne({
      where: { team: { id: teamId }, user: { id: currentUserId } },
    });

    if (!callerMember || callerMember.role !== UserRole.ADMIN) {
      throw new Error("Access Denied: Only admin can remove member");
    }

    const targetMember = await teamMemberRepo.findOne({
      where: { id: memberId },
      relations: {
        user: true,
      },
    });

    if (!targetMember) {
      throw new Error("Member not found");
    }

    if (targetMember.role === UserRole.ADMIN) {
      const adminCount = await teamMemberRepo.count({
        where: {
          team: { id: teamId } as Team,
          role: UserRole.ADMIN,
        },
      });
      if (adminCount <= 1) throw new Error("Cannot change role of last admin");
    }

    const targetUserId = targetMember.user.id;
    await teamMemberRepo.delete({ id: memberId });

    context.io.to(teamId).emit("REFETCH_GLOBAL_DATA", { teamId });
    context.io.to(`user_${targetUserId}`).emit("REFETCH_GLOBAL_DATA", { teamId, removed: true });

    return true;
  }

  @Authorized()
  @Mutation(() => Boolean)
  async exitTeam(
    @Arg("teamId", () => String) teamId: string,
    @Ctx() context: MyContext,
  ) {
    const currentUserId = context.user!.userId;
    const teamMemberRepo = AppDataSource.getRepository(TeamMember);

    const callerMember = await teamMemberRepo.findOne({
      where: { team: { id: teamId }, user: { id: currentUserId } },
    });

    if (!callerMember) {
      throw new Error("You are not a member of this team");
    }

    if (callerMember.role === UserRole.ADMIN) {
      const adminCount = await teamMemberRepo.count({
        where: { team: { id: teamId } as Team, role: UserRole.ADMIN },
      });
      if (adminCount <= 1) {
        throw new Error("You are the last admin. Assign another admin before exiting.");
      }
    }

    await teamMemberRepo.delete({ id: callerMember.id });

    context.io.to(teamId).emit("REFETCH_GLOBAL_DATA", { teamId });
    context.io.to(`user_${currentUserId}`).emit("REFETCH_GLOBAL_DATA", { teamId, removed: true });

    return true;
  }

  @Authorized()
  @Query(() => User, { nullable: true })
  async getMemberProfile(
    @Arg("userId", () => String) userId: string,
  ) {
    const userRepo = AppDataSource.getRepository(User);
    return await userRepo.findOne({ where: { id: userId } });
  }
}
