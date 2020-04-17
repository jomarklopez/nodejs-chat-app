const express = require('express')
const http = require('http')
const path = require('path')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirPath = path.join(__dirname, '../public')
app.use(express.static(publicDirPath))

io.on('connection', (socket) => {
    console.log('New WebSocket connection');

    socket.on('joinRoom', ({ username, room }, callback) => {
        const { user, error } = addUser({ id: socket.id, username, room })

        if (error) {
            return callback(error)
        }

        socket.join(user.room)

        socket.emit('message', generateMessage('Welcome to Chat', 'Admin'))
        socket.broadcast.to(user.room).emit('message', generateMessage(`${user.username} has joined!`, 'Admin'))
        io.to(user.room).emit('roomDetails', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })

    socket.on('sendMessage', (newMessage, callback) => {
        const filter = new Filter()
        const user = getUser(socket.id)

        if (filter.isProfane(newMessage)) {
            return callback('No bad words please')
        }

        io.to(user.room).emit('message', generateMessage(newMessage, user.username))
        callback()
    })

    socket.on('sendLocation', (location, callback) => {
        const user = getUser(socket.id)

        io.to(user.room).emit('sendLocation', generateLocationMessage(`https://google.com/maps?q=${location.latitude},${location.longitude}`, user.username))
        callback('Location was shared!')
    })

    socket.on('disconnect', () => {
        // remove user returns the removed user
        const user = removeUser(socket.id)
        if (user) {
            io.to(user.room).emit('message', generateMessage(`${user.username} has left!`, 'Admin'))
            io.to(user.room).emit('roomDetails', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

server.listen(port, () => {
    console.log('Server is up on port ' + port);
})