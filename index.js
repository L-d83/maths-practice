const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  }
});

// Room storage
let rooms = {};

// On client connect
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("joinRoom", (code) => {
    if (!rooms[code]) rooms[code] = {};

    rooms[code][socket.id] = { x: 100, y: 100 };

    socket.join(code);
    console.log(`Player ${socket.id} joined room ${code}`);

    socket.emit("currentPlayers", rooms[code]);

    socket.to(code).emit("playerJoined", {
      id: socket.id,
      pos: rooms[code][socket.id]
    });
  });

  socket.on("move", (data) => {
    const { code, pos } = data;

    if (rooms[code] && rooms[code][socket.id]) {
      rooms[code][socket.id] = pos;

      socket.to(code).emit("playerMoved", {
        id: socket.id,
        pos
      });
    }
  });

  socket.on("disconnect", () => {
    for (const code in rooms) {
      if (rooms[code][socket.id]) {
        delete rooms[code][socket.id];
        socket.to(code).emit("playerLeft", socket.id);

        if (Object.keys(rooms[code]).length === 0) {
          delete rooms[code];
        }
        break;
      }
    }
    console.log("Client disconnected:", socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
