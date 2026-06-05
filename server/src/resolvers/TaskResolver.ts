import { Arg, Authorized, Ctx, Mutation, Query, Resolver } from "type-graphql";
import { Task, TaskStatus } from "../entities/Task.ts";
import { type MyContext } from "../middleware/authMiddleware.ts";
import { TeamMember, UserRole } from "../entities/TeamMember.ts";
import { Team } from "../entities/Team.ts";
import { User } from "../entities/User.ts";
import { ILike } from "typeorm";
import { AppDataSource } from "../config/db.ts";
import { Notification, NotificationType } from "../entities/Notification.ts";

@Resolver()
export class TaskResolver {
  @Authorized()
  @Mutation(() => Task)
  async createTask(
    @Arg("teamId", () => String) teamId: string,
    @Arg("subject", () => String) subject: string,
    @Arg("description", () => String) description: string,
    @Arg("assignedToUserId", () => String) assignedToUserId: string,
    @Arg("deadline", () => Date) deadline: Date,
    @Ctx() context: MyContext,
  ) {
    const creatorId = context.user!.userId;
    const teamMemberRepo = AppDataSource.getRepository(TeamMember);
    const taskRepo = AppDataSource.getRepository(Task);
    const notifRepo = AppDataSource.getRepository(Notification);

    const isCreatorMember = await teamMemberRepo.findOne({
      where: { team: { id: teamId }, user: { id: creatorId } },
      relations: {
        user: true,
      },
    });
    if (!isCreatorMember) throw new Error("You are not a member of team");

    const isAssigneeMember = await teamMemberRepo.findOne({
      where: { team: { id: teamId }, user: { id: assignedToUserId } },
      relations: {
        user: true,
      },
    });
    if (!isAssigneeMember) {
      throw new Error("You are not team member");
    }

    const task = taskRepo.create({
      subject,
      description,
      team: { id: teamId } as Team,
      assigned_to: { id: assignedToUserId } as User,
      assigned_by: { id: creatorId } as User,
      deadline: deadline,
      status: TaskStatus.PENDING,
    });

    const savedTask = await taskRepo.save(task);

    const bodyMessage = `You have been assigned a new task: "${subject}"`;
    
    const newNotifi = await notifRepo.save({
      user: { id: assignedToUserId } as User,
      type: NotificationType.TASK_ASSIGNED,
      title: "New Task Assigned",
      body: bodyMessage,
      team: { id: teamId } as Team,
      task: { id: savedTask.id } as Task,
      is_read: false
    }as any);

    context.io.to(teamId).emit("REFETCH_GLOBAL_DATA", { teamId });
    context.io.to(`user_${assignedToUserId}`).emit("REFETCH_GLOBAL_DATA", { teamId });

    context.io.to(`user_${assignedToUserId}`).emit("incoming_system_notification", {
      id: newNotifi.id,
      type: "TASK_ASSIGNED",
      title: "New Task Assigned",
      body: bodyMessage,
      team_id: teamId,
      task_id: savedTask.id,
      is_read: false,
      created_at: new Date().toISOString()
    });

    return savedTask;
  }

  @Authorized()
  @Query(() => [Task])
  async getAllAssignedTask(
    @Arg("userId", () => String) userId: string,
    @Ctx() context: MyContext,
    @Arg("teamId", () => String, {nullable: true}) teamId?: string,
    @Arg("searchTerm", () => String, { nullable: true }) searchTerm?: string,
    @Arg("status", () => TaskStatus, { nullable: true }) status?: TaskStatus,
  ) {
    const currentUserId = context.user!.userId;

    if (currentUserId !== userId) {
      throw new Error("Invalid User");
    }

    const taskRepo = AppDataSource.getRepository(Task);

    const whereCond: any = { assigned_to: { id: userId } };

    if (teamId) {
      whereCond.team = { id: teamId };
    }

    if (searchTerm) {
      whereCond.subject = ILike(`%${searchTerm}%`);
    }

    if (status) {
      whereCond.status = status;
    }

    const tasks = await taskRepo.find({
      where: whereCond,
      relations: {
        team: true,
        assigned_to: true,
        assigned_by: true,
      },
      order: { created_at: "DESC" },
    });

    return tasks;
  }

  @Authorized()
  @Query(() => [Task])
  async getAllCreatedTask(
    @Arg("userId", () => String) userId: string,
    @Ctx() context: MyContext,
    @Arg("teamId", () => String, {nullable: true}) teamId?: string,
    @Arg("searchTerm", () => String, { nullable: true }) searchTerm?: string,
    @Arg("status", () => TaskStatus, { nullable: true }) status?: TaskStatus,
  ) {
    const currentUserId = context.user!.userId;

    if (currentUserId !== userId) {
      throw new Error("Invalid User");
    }

    const taskRepo = AppDataSource.getRepository(Task);

    const whereCond: any = { assigned_by: { id: userId } };

    if (teamId) {
      whereCond.team = { id: teamId };
    }

    if (searchTerm) {
      whereCond.subject = ILike(`%${searchTerm}%`);
    }

    if (status) {
      whereCond.status = status;
    }

    const tasks = await taskRepo.find({
      where: whereCond,
      relations: {
        team: true,
        assigned_to: true,
        assigned_by: true,
      },
      order: { created_at: "DESC" },
    });

    if (tasks.length === 0) {
      throw new Error("No task created by you");
    }

    return tasks;
  }

  @Authorized()
  @Query(() => Task)
  async getTaskDetail(
    @Arg("taskId", () => String) taskId: string,
    @Ctx() context: MyContext,
  ) {
    const currentUserId = context.user!.userId;

    const taskRepo = AppDataSource.getRepository(Task);

    const task = await taskRepo.findOne({
      where: { id: taskId },
      relations: {
        team: true,
        assigned_by: true,
        assigned_to: true,
      },
    });

    if (!task) {
      throw new Error("task not found");
    }

    const teamMemberRepo = AppDataSource.getRepository(TeamMember);
    const isMember = await teamMemberRepo.findOne({
      where: { team: { id: task.team.id }, user: { id: currentUserId } },
    });

    if (!isMember) {
      throw new Error();
    }

    return task;
  }

  @Authorized()
  @Mutation(() => Boolean)
  async deleteTask(
    @Arg("taskId", () => String) taskId: string,
    @Ctx() context: MyContext,
  ) {
    const currentUserId = context.user!.userId;

    const taskRepo = AppDataSource.getRepository(Task);
    const teamMemberRepo = AppDataSource.getRepository(TeamMember);

    const task = await taskRepo.findOne({
      where: { id: taskId },
      relations: {
        team: true,
        assigned_by: true,
      },
    });

    if (!task) {
      throw new Error("Task not found or deleted");
    }

    const member = await teamMemberRepo.findOne({
      where: { user: { id: currentUserId }, team: { id: task.team.id } },
    });

    if (!member) {
      throw new Error("You are not a member of this team");
    }

    const isCreator = task.assigned_by.id === currentUserId;
    const isAdmin = member.role === UserRole.ADMIN;

    if (!isCreator && !isAdmin) {
      throw new Error("You are not allowed");
    }

    const teamId = task.team.id;
    const assignedToUserId = task.assigned_to?.id;
    const result = await taskRepo.delete(taskId);

    if (result.affected !== 0) {
      if (assignedToUserId) {
        context.io.to(`user_${task.assigned_to.id}`).emit("REFETCH_GLOBAL_DATA", { teamId });
      }
      
      context.io.to(teamId).emit("REFETCH_GLOBAL_DATA", { teamId });
    }

    return result.affected !== 0;
  }
}
