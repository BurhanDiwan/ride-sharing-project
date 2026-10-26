const { Server } = require('socket.io')

let io

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  })

  io.on('connection', (socket) => {
    console.log('Client connected: ' + socket.id)

    socket.on("join_room", (roomId) => {
      socket.join(roomId)
    })

    socket.on('leave_room', function(roomId) {
      socket.leave(roomId)
    })

    socket.on('disconnect', () => {
      console.log("Client disconnected: " + socket.id)
    })
  })

  return io
}

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized')
  }
  return io
}

module.exports = { initSocket, getIO }
