import "reflect-metadata";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { createServer } from "http";
import express from "express";
import { Server } from "socket.io";
import { WebSocketServer } from "ws";
// @ts-ignore
import { useServer } from "graphql-ws/use/ws";
import { buildSchema } from "type-graphql";
import dotenv from "dotenv";
import { UserResolver } from "./resolvers/UserResolver.ts";
import { authChecker, MyContext } from "./middleware/authMiddleware.ts";
import { TeamResolver } from "./resolvers/TeamResolver.ts";
import { TaskResolver } from "./resolvers/TaskResolver.ts";
import { AppDataSource } from "./config/db.ts";
import cors from "cors";
import jwt from "jsonwebtoken";
import { registerMessageHandlers } from "./sockets/messageHandlers.ts";
import { User } from "./entities/User.ts";
import { registerNotificationsHandlers } from "./sockets/notificationHandlers.ts";
import { initDeadlineCron } from "./cron/deadlineCron.ts";

dotenv.config();

async function main() {
  try {
    await AppDataSource.initialize();
    console.log("Database connected successfully");

    const schema = await buildSchema({
      resolvers: [UserResolver, TeamResolver, TaskResolver],
      authChecker: authChecker,
      validate: false,
    });

    const app = express();
    app.use(
      cors({
        origin: "http://localhost:5173",
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
        optionsSuccessStatus: 200,
      }),
    );
    const httpServer = createServer(app);

    const io = new Server(httpServer, {
      path: "/socket.io/",
      cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
        optionsSuccessStatus: 200,
      },
    });

    initDeadlineCron(io);

    io.use((socket, next) => {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(" ")[1];

      if (!token) {
        return next(new Error("Authentication Error: Token missing"));
      }

      try {
        const decoded = jwt.verify(token, String(process.env.JWT_SECRET));
        (socket as any).user = decoded;
        next();
      } catch (err) {
        return next(new Error("Authentication Error: Validation failed"));
      }
    });

    io.on("connection", (socket) => {
      console.log(`Socket connected: ${socket.id}`);

      const authUserId = (socket as any).user?.userId;
      if (authUserId) {
        socket.join(`user_${authUserId}`);
      }

      socket.on("join_team", async (teamId: string) => {
        if (!authUserId) return;

        for (const room of socket.rooms) {
          if (room !== socket.id && room !== `user_${authUserId}`) {
            socket.leave(room);
            console.log(`User ${socket.id} left room: ${room}`);
          }
        }

        socket.join(teamId);
        console.log(`User ${socket.id} joined room: ${teamId}`);

        try {
          await AppDataSource.query(
            `INSERT INTO user_team_chat_read (user_id, team_id, last_read_at)
              VALUES ($1, $2, CURRENT_TIMESTAMP)
              ON CONFLICT (user_id, team_id) 
              DO UPDATE SET last_read_at = CURRENT_TIMESTAMP`,
            [authUserId, teamId],
          );
          
          socket.emit("unread_count_update", { teamId, unreadCount: 0 });
        } catch (err) {
          console.error("Failed to update read status:", err);
        }
      });

      socket.on("typing", async (data) => {
        console.log(data)
        const userRepo = AppDataSource.getRepository(User)
        const user = await userRepo.findOne({where: {id: data.senderId}})

        socket.to(data.teamId).emit("user_typing", {id: data.senderId, name: user?.name});
      });

      registerMessageHandlers(io, socket);
      registerNotificationsHandlers(io, socket);

      socket.on("disconnect", () => {
        console.log(`Socket disconnected: ${socket.id}`);
      });
    });

    const wsServer = new WebSocketServer({
      noServer: true,
    });

    const serverCleanup = useServer({ schema }, wsServer);

    httpServer.on("upgrade", (request, socket, head) => {
      const { pathname } = new URL(request.url || "", `http://${request.headers.host}`);
      if (pathname && pathname.startsWith("/graphql")) {
        wsServer.handleUpgrade(request, socket, head, (ws) => {
          wsServer.emit("connection", ws, request);
        });
      }
    });

    const server = new ApolloServer({
      schema,
      plugins: [
        ApolloServerPluginDrainHttpServer({ httpServer }),
        {
          async serverWillStart() {
            return {
              async drainServer() {
                await serverCleanup.dispose();
              },
            };
          },
        },
      ],
    });

    await server.start();

    app.use(
      "/graphql",
      express.json(),
      expressMiddleware(server, {
        context: async ({ req, res }: { req: any; res: any }): Promise<MyContext> => ({ req, res, io }),
      }),
    );

    const PORT = Number(process.env.PORT);
    httpServer.listen(PORT, () => {
      console.log(`Server running at: http://localhost:${PORT}/graphql`);
    });
  } catch (error: any) {
    console.error("Server setup error:", error.message);
  }
}

main();
