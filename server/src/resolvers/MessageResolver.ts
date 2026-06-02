import { Arg, Authorized, Ctx, Mutation, Query, Resolver } from "type-graphql";
import { type MyContext } from "../middleware/authMiddleware.ts";
import { AppDataSource } from "../config/db.ts";
import { Message } from "../entities/Message.ts";
import * as crypto from "crypto";
import { TeamMember } from "../entities/TeamMember.ts";

@Resolver()
export class MessageResolver {
  @Authorized()
  @Mutation(() => Boolean)
  async sendMessage(
    @Arg("teamId", () => String) teamId: string,
    @Arg("content", () => String) content: string,
    @Ctx() { io, user }: MyContext,
  ) {
    const senderId = user!.userId;
    const key = crypto.createHash('sha256').update(String(process.env.ENCRYPTION_KEY)).digest();
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(key), iv);
    let encrypted = cipher.update(content, "utf8", "hex");
    encrypted += cipher.final("hex");

    const messageRepo = AppDataSource.getRepository(Message);
    const newMessage = await messageRepo.save({
      team: { id: teamId },
      sender: { id: senderId },
      content_encrypted: encrypted,
      initialization_vector: iv.toString("hex"),
    });

    io.to(teamId).emit("receive_message", {
      id: newMessage.id,
      senderId,
      content,
      created_at: newMessage.created_at,
    });

    return true;
  }

  @Authorized()
  @Mutation(() => Boolean)
  async deleteMesssage(
    @Arg("messageId", () => String) messageId: string,
    @Ctx() { io, user }: MyContext,
  ) {
    const messageRepo = AppDataSource.getRepository(Message);
    const msg = await messageRepo.findOne({
      where: { id: messageId },
      relations: {
        team: true,
        sender: true,
      },
    });
    if (!msg) throw new Error("Message not found");

    const teamMemberRepo = AppDataSource.getRepository(TeamMember);
    const member = await teamMemberRepo.findOne({
      where: { user: { id: user!.userId }, team: { id: msg.team.id } },
    });

    const isAdmin = member?.role === "ADMIN";
    const isCreator = msg?.sender.id === user!.userId;
    if (!isCreator && !isAdmin) {
      throw new Error("Permission Denied");
    }

    await messageRepo.delete(messageId);

    io.to(msg?.team.id).emit("message_deleted", { messageId });

    return true;
  }

  @Authorized()
  @Query(() => [Message])
  async getAllMessages(
    @Arg("teamId", ()=>String) teamId: string,
    @Ctx() context: MyContext,
  ) {
    const messageRepo = AppDataSource.getRepository(Message);
    const messages = await messageRepo.find({
      where: { team: { id: teamId } },
      relations: {sender: true},
      order: { created_at: "ASC" },
    });

    const key = process.env.ENCRYPTION_KEY!;

    return messages.map((msg) => {
      const decipher = crypto.createDecipheriv(
        "aes-256-cbc",
        Buffer.from(key),
        Buffer.from(msg.initialization_vector, "hex"),
      );

      let decrypted = decipher.update(msg.content_encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");

      return {
        ...msg,
        content: decrypted,
      };
    });
  }
}
