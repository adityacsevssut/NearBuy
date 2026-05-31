let io;

module.exports = {
  init: (server, options) => {
    const { Server } = require("socket.io");
    io = new Server(server, options);
    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error("Socket.io not initialized!");
    }
    return io;
  }
};
