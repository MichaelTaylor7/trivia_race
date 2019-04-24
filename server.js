const express = require('express');
var bodyParser = require('body-parser');
var path = require("path");
const app = express();
app.engine("html", require("ejs").renderFile);
// app.use(express.static(__dirname + "/public"));
var users = [];
var user = {};






app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "./static")));
app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'ejs');

app.get('/', function (req, res) {
  // let readyUser = 0;
  // for (let i=0; i<users.length; i++){
  //   if (users[i].ready == true){
  //     readyUser++;
  //   }
  // }
  // if (readyUser == users.length){
  //   res.render("progress", {users: users})
  // }
  res.render("index", { users: users });
});


var server = app.listen(8000, function () {
  console.log("listening on port 8000");
});

var io = require('socket.io').listen(server);

io.sockets.on('connection', function (socket) {
  let trueId = socket.id
  console.log("Client/socket id is: ", socket.id);
  socket.emit('connection_response', { response: socket.id });

  socket.on("new_user", function (newuser) {
    user = {
      _id: trueId,
      name: newuser.name,
      score: 0,
      ready: false,
      answered: false
    }
    users.push(user);
    console.log(user)
    user = {};
    console.log("user id" + socket.id)
    console.log(users)
    socket.emit('connect_user', { response: newuser.name });
    io.emit('display_update_users', { response: newuser.name });
  });

  socket.on("disconnect", function () {
    var name;
    console.log("this diconnect: " + socket.id)
    for (let i = 0; i < users.length; i++) {
      if (users[i]._id == socket.id) {
        name = users[i].name
        users.splice(i, 1);
      }
    }
    console.log(users)
    io.emit('disconnect_user', { response: name });
  });

  socket.on("readybutton", function (id) {
    console.log('--------------------')
    console.log(id)
    for (let i = 0; i < users.length; i++) {
      if (users[i]._id == id) {
        users[i].ready = true;
      }
    }
    console.log(users)
  });

});