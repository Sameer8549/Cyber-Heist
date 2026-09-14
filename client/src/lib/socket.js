import { io } from "socket.io-client";

// Single socket.io client instance
// In dev: Vite proxy handles the ws:// upgrade to localhost:3000
// In prod: same origin
const socket = io(window.location.origin, {
  autoConnect: false,
  reconnectionDelay: 1000,
  reconnectionAttempts: 10
});

export default socket;
