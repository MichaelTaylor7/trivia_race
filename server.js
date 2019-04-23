const express = require('express');
var bodyParser = require('body-parser');
var path = require("path");
const app = express();
app.engine("html", require("ejs").renderFile);
app.use(express.static(__dirname + "/public"));
var users = {};

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "./static")));
app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'ejs');

app.get('/', function (req, res) {
  res.render("index", { users: users });
});

var server = app.listen(8000, function () {
  console.log("listening on port 8000");
});

var io = require('socket.io').listen(server);

io.sockets.on('connection', function (socket) {
  console.log("Client/socket id is: ", socket.id);
  socket.emit('connection_response', { response: socket.id });

  socket.on("new_user", function (user) {
    users[socket.id] = user.name
    console.log("user id" + socket.id)
    console.log(users)
    socket.emit('connect_user', { response: user.name });
    io.emit('display_update_users', { response: user.name });
  });

  socket.on("disconnect", function () {
    name = users[socket.id]
    console.log("User disconnected " + name)
    delete users[socket.id];
    console.log(users)
    io.emit('disconnect_user', { response: name });
  });
});