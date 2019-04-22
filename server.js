const express = require('express');
var bodyParser = require('body-parser');
var path = require("path");
const app = express();
app.use(express.static(__dirname + "/public"));
var counter = 0;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "./static")));
app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'ejs');

app.get('/', function (req, res) {
  res.render("index");
});

var server = app.listen(8000, function () {
  console.log("listening on port 8000");
});

var io = require('socket.io').listen(server);
var clients = io.sockets.clients();
    
  io.sockets.on('connection', function (socket) {
    console.log("Client/socket id is: ", socket.id);
    socket.on('connect', function() { connectCounter++; });
    socket.emit('connection_response',{ response : socket.id});

    socket.on("new_user", function (user) {
        io.emit('display_new_user', { response: user.name });
    });
    
});