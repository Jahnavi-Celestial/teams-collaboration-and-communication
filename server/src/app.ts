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
import { MessageResolver } from "./resolvers/MessageResolver.ts";
import cors  from "cors";
import * as crypto from "crypto";

dotenv.config();

async function main() {
  try {
    await AppDataSource.initialize();
    console.log("Database connected successfully");

    const schema = await buildSchema({
      resolvers: [UserResolver, TeamResolver, TaskResolver, MessageResolver],
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
    )
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

    io.on("connection", (socket) => {
      console.log(`Socket connected: ${socket.id}`);

      socket.on("join_team", (teamId: string) => {
        socket.join(teamId);
        console.log(`User ${socket.id} joined room: ${teamId}`);
      });

      socket.on("typing", (data) => {
        socket.to(data.teamId).emit("user_typing", data.senderId);
      });

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
        context: async ({
          req,
          res,
        }: {
          req: any;
          res: any;
        }): Promise<MyContext> => ({ req, res, io }),
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
