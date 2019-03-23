const express = require('express')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)
const PORT = process.env.PORT || 3000
const helmet = require('helmet')

app.use(helmet())
app.use(express.static(__dirname + '/public'))

app.get('/' , function(req, res){
    res.sendFile(__dirname+'/index.html')
})

io.on('connection',function(socket){
    socket.on('message',function(msg){
        console.log('message: ' + msg)
        io.emit('message', msg)
    })
})

http.listen(PORT, function(){
    console.log('Server listening. Port:' + PORT)
})
