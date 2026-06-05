import { io } from "socket.io-client";

export const socket = io(import.meta.env.VITE_WS_URL, {
  path: "/socket.io/",
  transports: ["websocket"],
  autoConnect: false,
  upgrade: false,
  auth: (cb) => {
    cb({ token: localStorage.getItem("token") || "" });
  },
});
