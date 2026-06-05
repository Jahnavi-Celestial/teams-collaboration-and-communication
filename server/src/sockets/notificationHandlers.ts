import { Server, Socket } from "socket.io";
import { AppDataSource } from "../config/db.ts";
import { Notification, NotificationType } from "../entities/Notification.ts";
import { DeadlineExtensionRequest, RequestStatus } from "../entities/DeadLineExtensionRequest.ts";
import { Task, TaskStatus } from "../entities/Task.ts";
import { TeamMember } from "../entities/TeamMember.ts";
import { Message } from "../entities/Message.ts";
import { User } from "../entities/User.ts";
import { Team } from "../entities/Team.ts";
import { UserTeamChatRead } from "../entities/UserTeamChatRead.ts";
import { MoreThan } from "typeorm";

export const registerNotificationsHandlers = (io: Server, socket: Socket) => {
  const userId = (socket as any).user?.userId;

  socket.on("sync_initial_unread_counts", async () => {
    try {
      if (!userId) return;
      const teamMemberRepo = AppDataSource.getRepository(TeamMember);
      const messageRepo = AppDataSource.getRepository(Message);
      const chatReadRepo = AppDataSource.getRepository(UserTeamChatRead);

      const members = await teamMemberRepo.find({
        where: { user: { id: userId } },
        relations: {
            team: true,
        },
      });

      for (const member of members) {
        const teamId = member.team.id;
        
        const readRecord = await chatReadRepo.findOne({
          where: { user: { id: userId }, team: { id: teamId } }
        });

        let unreadCount = 0;
        if (!readRecord) {
          unreadCount = await messageRepo.count({
            where: { team: { id: teamId } }
          });
        } else {
          unreadCount = await messageRepo.count({
            where: { team: { id: teamId }, created_at: MoreThan(readRecord.last_read_at) }
          });
        }

        socket.emit("unread_count_update", { teamId, unreadCount });
      }
    } catch (err: any) {
        console.log(err.message)
    }
  });

  socket.on("mark_team_chat_as_read", async (data: { teamId: string }) => {
    try {
      if (!userId || !data.teamId) return;
      const chatReadRepo = AppDataSource.getRepository(UserTeamChatRead);

      const existingRecord = await chatReadRepo.findOne({
        where: { user: { id: userId }, team: { id: data.teamId } }
      });

      if (existingRecord) {
        existingRecord.last_read_at = new Date();
        await chatReadRepo.save(existingRecord);
      } else {
        await chatReadRepo.save({
          user: { id: userId } as User,
          team: { id: data.teamId } as Team,
          last_read_at: new Date()
        });
      }

      socket.emit("unread_count_update", { teamId: data.teamId, unreadCount: 0 });
    } catch (err: any) {
        console.log(err.message)
    }
  });

  socket.on("submit_deadline_extension", async (data: { taskId: string; message: string }) => {
    try {
      if (!userId) return;

      const taskRepo = AppDataSource.getRepository(Task);
      const requestRepo = AppDataSource.getRepository(DeadlineExtensionRequest);
      const notifRepo = AppDataSource.getRepository(Notification);

      const task = await taskRepo.findOne({
        where: { id: data.taskId },
        relations: {
            team: true,
            assigned_to: true,
            assigned_by: true
        }
      });

      if (!task || !task.assigned_to || task.assigned_to.id !== userId) {
        socket.emit("error", { message: "Task invalid or unauthorized" });
        return;
      }

      await requestRepo.save({
        task: { id: data.taskId } as Task,
        requested_by: { id: userId } as User,
        message: data.message,
        status: RequestStatus.PENDING
      });

      const bodyWithReason = `Reason: "${data.message}"`;

      const newNotifi = await notifRepo.save({
        user: { id: task.assigned_by.id } as User,
        type: NotificationType.EXTENSION_REQUESTED,
        title: "Extension Requested",
        body: bodyWithReason,
        team: { id: task.team.id } as Team,
        task: { id: task.id } as Task,
        is_read: false
      });

      const notifId = newNotifi.id

      io.to(`user_${task.assigned_by.id}`).emit("incoming_system_notification", {
        id: notifId,
        type: "EXTENSION_REQUESTED",
        title: "Extension Requested",
        body: bodyWithReason,
        team_id: task.team.id,
        task_id: task.id,
        is_read: false,
        created_at: new Date().toISOString()
      });

      socket.emit("extension_submitted_success", { taskId: data.taskId });
    } catch (err) {
      socket.emit("error", { message: "Execution failure" });
    }
  });


  socket.on("mark_notification_as_read", async (data: { notifId: string }) => {
    try {
      if (!userId || !data.notifId) return;

      const notifRepo = AppDataSource.getRepository(Notification);
      
      await notifRepo.update(
        { id: data.notifId, user: { id: userId } },
        { is_read: true }
      );
      
      const notifications = await notifRepo.find({
        where: { user: { id: userId } },
        relations: {
            team: true,
            task: true
        },
        order: { created_at: "DESC" }
      });

      const processedNotifs = notifications.map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        team_id: n.team?.id,
        task_id: n.task?.id,
        is_read: n.is_read,
        created_at: n.created_at
      }));

      socket.emit("my_notifications_fetched", processedNotifs);
    } catch (err: any) {
        console.log(err.message)
    }
  });

  socket.on("live_update_task_status", async (data: { taskId: string; status: 'IN_PROGRESS' | 'COMPLETED' }) => {
    try {
      if (!userId) return;

      const taskRepo = AppDataSource.getRepository(Task);
      const task = await taskRepo.findOne({
        where: { id: data.taskId },
        relations: {
            team: true,
            assigned_to: true
        }
      });

      if (!task || !task.assigned_to || task.assigned_to.id !== userId) {
        socket.emit("error", { message: "Unauthorized task update mapping" });
        return;
      }

      task.status = data.status as TaskStatus;
      await taskRepo.save(task);

      io.to(task.team.id).emit("task_status_live_changed", { taskId: data.taskId, status: data.status });
      socket.emit("task_status_live_changed_success", { taskId: data.taskId, status: data.status });
      io.to(task.team.id).emit("REFETCH_GLOBAL_DATA")
    } catch (err: any) {
        console.log(err.message)
    }
  });

  socket.on("update_task_deadline_live", async (data: { taskId: string; newDeadline: string }) => {
    try {
      if (!userId) return;

      const taskRepo = AppDataSource.getRepository(Task);
      const notifRepo = AppDataSource.getRepository(Notification);

      const task = await taskRepo.findOne({
        where: { id: data.taskId },
        relations: {
            team: true,
            assigned_by: true,
            assigned_to: true
        }
      });

      if (!task || !task.assigned_by || task.assigned_by.id !== userId) {
        socket.emit("error", { message: "Unauthorized action context" });
        return;
      }

      task.deadline = new Date(data.newDeadline);
      task.status = TaskStatus.PENDING;
      task.deadline_unlocked = true;
      task.deadline_missed_at = new Date();;
      await taskRepo.save(task);

      io.to(task.team.id).emit("task_deadline_updated_broadcast", { taskId: data.taskId, deadline: data.newDeadline });
      
      const newNotifi = await notifRepo.save({
        user: { id: task.assigned_to.id } as User,
        type: NotificationType.ROLE_CHANGED,
        title: "Deadline Adjusted",
        body: `Your task "${task.subject}" deadline was modified.`,
        team: { id: task.team.id } as Team,
        task: { id: task.id } as Task,
        is_read: false
      });

      const notifId = newNotifi.id;

      io.to(`user_${task.assigned_to.id}`).emit("incoming_system_notification", {
        id: notifId,
        type: "ROLE_CHANGED",
        title: "Deadline Adjusted",
        body: `Your task "${task.subject}" deadline was modified.`,
        team_id: task.team.id,
        task_id: task.id,
        is_read: false,
        created_at: new Date().toISOString()
      });
      io.to(task.team.id).emit("REFETCH_GLOBAL_DATA")
    } catch (err: any) {
        console.log(err.message)
    }
  });

  socket.on("fetch_my_notifications", async () => {
    try {
      if (!userId) return;

      const notifRepo = AppDataSource.getRepository(Notification);
      const notifications = await notifRepo.find({
        where: { user: { id: userId } },
        relations: {
            team: true,
            task: true
        },
        order: { created_at: "DESC" }
      });

      const processedNotifs = notifications.map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        team_id: n.team?.id,
        task_id: n.task?.id,
        is_read: n.is_read,
        created_at: n.created_at
      }));

      socket.emit("my_notifications_fetched", processedNotifs);
    } catch (err: any) {
        console.log(err.message)
    }
  });
};