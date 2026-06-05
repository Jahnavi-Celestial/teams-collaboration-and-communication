import { Server, Socket } from "socket.io";
import { AppDataSource } from "../config/db.ts";
import { Message } from "../entities/Message.ts";
import { TeamMember } from "../entities/TeamMember.ts";
import { UserTeamChatRead } from "../entities/UserTeamChatRead.ts";
import * as crypto from "crypto";
import { User } from "../entities/User.ts";
import { MoreThan } from "typeorm";

interface SendMessagePayload {
  teamId: string;
  content: string;
}

interface DeleteMessagePayload {
  messageId: string;
}

interface FetchMessagesPayload {
  teamId: string;
  limit?: number;
  offset?: number;
}

export const registerMessageHandlers = (io: Server, socket: Socket) => {
  const userId = (socket as any).user?.userId;

  socket.on("send_message", async (data: SendMessagePayload) => {
    try {
      const { teamId, content } = data;
      if (!userId || !teamId || !content) {
        socket.emit("error", { message: "Invalid message payload parameters" });
        return;
      }

      const teamMemberRepo = AppDataSource.getRepository(TeamMember);
      const isStillMember = await teamMemberRepo.findOne({
        where: { team: { id: teamId }, user: { id: userId } },
      });

      if (!isStillMember) {
        socket.emit("error", {
          message: "Access Denied: You are no longer a member of this team.",
        });
        socket.leave(teamId);
        return;
      }

      const key = crypto.createHash("sha256").update(String(process.env.ENCRYPTION_KEY)).digest();
      const iv = crypto.randomBytes(16);

      const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(key), iv);
      let encrypted = cipher.update(content, "utf8", "hex");
      encrypted += cipher.final("hex");

      const userRepo = AppDataSource.getRepository(User);
      const user = await userRepo.findOne({ where: { id: userId } });
      if (!user) {
        socket.emit("error", { message: "User profile context not found" });
        return;
      }

      const messageRepo = AppDataSource.getRepository(Message);
      const newMessage = await messageRepo.save({
        team: { id: teamId },
        sender: { id: userId },
        content_encrypted: encrypted,
        initialization_vector: iv.toString("hex"),
      });

      io.to(teamId).emit("receive_message", {
        id: newMessage.id,
        sender: {
          id: userId,
          name: user.name,
        },
        content,
        created_at: newMessage.created_at ? newMessage.created_at.toISOString() : new Date().toISOString(),
      });

      const chatReadRepo = AppDataSource.getRepository(UserTeamChatRead);

      const teamMembers = await teamMemberRepo.find({
        where: { team: { id: teamId } },
        relations: { user: true },
      });

      for (const row of teamMembers) {
        if (row.user.id === userId) continue;

        const readRecord = await chatReadRepo.findOne({
          where: { user: { id: row.user.id }, team: { id: teamId } },
        });

        let unreadCount = 0;
        if (!readRecord) {
          unreadCount = await messageRepo.count({
            where: { team: { id: teamId } },
          });
        } else {
          unreadCount = await messageRepo.count({
            where: {
              team: { id: teamId },
              created_at: MoreThan(readRecord.last_read_at),
            },
          });
        }

        io.to(`user_${row.user.id}`).emit("unread_count_update", {
          teamId,
          unreadCount,
        });
      }
    } catch (error: any) {
      socket.emit("error", { message: error.message || "Failed to deliver message" });
    }
  });

  socket.on("delete_message", async (data: DeleteMessagePayload) => {
    try {
      const { messageId } = data;
      if (!userId || !messageId) {
        socket.emit("error", { message: "Missing required identifier fields" });
        return;
      }

      const messageRepo = AppDataSource.getRepository(Message);
      const msg = await messageRepo.findOne({
        where: { id: messageId },
        relations: { team: true, sender: true },
      });

      if (!msg) {
        socket.emit("error", { message: "Message targeting reference not found" });
        return;
      }

      const teamId = msg.team?.id;
      const messageCreatorId = msg.sender?.id;

      if (!teamId) {
        socket.emit("error", { message: "Associated team context missing from message" });
        return;
      }

      const teamMemberRepo = AppDataSource.getRepository(TeamMember);
      const member = await teamMemberRepo.findOne({
        where: { user: { id: userId }, team: { id: msg.team.id } },
      });

      const isAdmin = member?.role?.toUpperCase() === "ADMIN";
      const isCreator = messageCreatorId === userId;

      if (!isCreator && !isAdmin) {
        socket.emit("error", { message: "Permission Denied: Unauthorized deletion attempt" });
        return;
      }

      await messageRepo.delete(messageId);
      io.to(msg.team.id).emit("message_deleted", { messageId });
    } catch (error: any) {
      socket.emit("error", { message: error.message || "Failed to drop message profile" });
    }
  });

  socket.on("get_all_messages", async (data: FetchMessagesPayload) => {
    try {
      const { teamId, limit = 20, offset = 0 } = data;
      if (!userId || !teamId) {
        socket.emit("error", { message: "Target contextual identifiers missing" });
        return;
      }

      const messageRepo = AppDataSource.getRepository(Message);
      const messages = await messageRepo.find({
        where: { team: { id: teamId } },
        relations: { sender: true },
        order: { created_at: "DESC" },
        take: limit,
        skip: offset,
      });

      messages.reverse();

      const key = crypto.createHash("sha256").update(String(process.env.ENCRYPTION_KEY)).digest();

      const transformedMessages = messages.map((msg) => {
        try {
          const decipher = crypto.createDecipheriv(
            "aes-256-cbc",
            Buffer.from(key),
            Buffer.from(msg.initialization_vector, "hex"),
          );

          let decrypted = decipher.update(msg.content_encrypted, "hex", "utf8");
          decrypted += decipher.final("utf8");

          return {
            id: msg.id,
            content: decrypted,
            created_at: msg.created_at,
            sender: msg.sender,
          };
        } catch (err) {
          return {
            id: msg.id,
            content: "[Decryption Failed]",
            created_at: msg.created_at,
            sender: msg.sender,
          };
        }
      });

      socket.emit("all_messages_fetched", { teamId, messages: transformedMessages });
    } catch (error: any) {
      socket.emit("error", { message: error.message || "Failed to retrieve history logs" });
    }
  });

  socket.on("kick_user_from_room", async (data: { targetUserId: string; teamId: string }) => {
      try {
        const { targetUserId, teamId } = data;
        if (!userId || !targetUserId || !teamId) return;

        const teamMemberRepo = AppDataSource.getRepository(TeamMember);
        const member = await teamMemberRepo.findOne({
          where: { user: { id: userId }, team: { id: teamId } },
        });

        if (member?.role?.toUpperCase() !== "ADMIN") {
          socket.emit("error", {
            message: "Unauthorized kick command execution",
          });
          return;
        }

        io.to(teamId).emit("force_leave_team", {
          teamId: String(teamId),
          kickedUserId: String(targetUserId), 
        });

        io.to(`user_${targetUserId}`).socketsLeave(teamId);

      } catch (error: any) {
        socket.emit("error", { message: "Failed to remove member socket context" });
      }
    },
  );
};
