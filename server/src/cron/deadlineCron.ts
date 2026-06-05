import cron from "node-cron";
import { Server } from "socket.io";
import { AppDataSource } from "../config/db.ts";
import { Task, TaskStatus } from "../entities/Task.ts";
import { Notification, NotificationType } from "../entities/Notification.ts";
import { User } from "../entities/User.ts";
import { Team } from "../entities/Team.ts";
import { LessThan, In } from "typeorm";

export const initDeadlineCron = (io: Server) => {
  cron.schedule("*/1 * * * *", async () => {
    try {
      const taskRepo = AppDataSource.getRepository(Task);
      const notifRepo = AppDataSource.getRepository(Notification);

      const expiredTasks = await taskRepo.find({
        where: {
          deadline: LessThan(new Date()), 
          status: In([TaskStatus.PENDING, TaskStatus.IN_PROGRESS]),
        },
        relations: {
          team: true,
          assigned_to: true,
        },
      });

      if (expiredTasks.length === 0) return;

      for (const task of expiredTasks) {
        const teamId = task.team?.id;
        const assignedToUserId = task.assigned_to?.id;

        if (!teamId) continue; 

        task.status = TaskStatus.MISSED_DEADLINE;
        task.deadline_missed_at = new Date();
        await taskRepo.save(task);

        let newNotifId = "";
        const bodyMessage = `You missed the deadline for task: "${task.subject}"`;

        if (assignedToUserId) {
          const savedNotif = await notifRepo.save({
            user: { id: assignedToUserId } as User,
            type: NotificationType.TASK_DEADLINE_MISSED,
            title: "Task Deadline Missed",
            body: bodyMessage,
            team: { id: teamId } as Team,
            task: { id: task.id } as Task,
            is_read: false
          } as any);
          newNotifId = savedNotif.id;
        }

        io.to(teamId).emit("REFETCH_GLOBAL_DATA", { teamId });

        if (assignedToUserId) {
          io.to(`user_${assignedToUserId}`).emit("REFETCH_GLOBAL_DATA", { teamId });
          
          io.to(`user_${assignedToUserId}`).emit("incoming_system_notification", {
            id: newNotifId,
            type: "TASK_DEADLINE_MISSED",
            title: "Task Deadline Missed",
            body: bodyMessage,
            team_id: teamId,
            task_id: task.id,
            is_read: false,
            created_at: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.error("Error running deadline cron job:", error);
    }
  });
};
