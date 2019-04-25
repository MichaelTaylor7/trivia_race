const express = require('express');
var bodyParser = require('body-parser');
var path = require("path");
const app = express();
app.engine("html", require("ejs").renderFile);
var request = require('request');
// app.use(express.static(__dirname + "/public"));
var users = [];
var user = {};
var questions;
var count = 0;
var question_count = 0;
var answers = [];
var count_answered = 0;

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

  socket.on("action", function (id) {
    console.log('--------------------')
    console.log(id)
    for (let i = 0; i < users.length; i++) {
      if (users[i]._id == id) {
        users[i].ready = true;
        count += 1;
      }
      console.log(count, users.length)
      if (count == users.length) {
        request({ url: 'https://opentdb.com/api.php?amount=12&type=multiple', json: true }, function (err, res, json) {
          if (err) {
            throw err;
          }
          questions = json;
          io.emit("questions", { questions: json }, users)
        });
      }
    }
    console.log(users)
  });

  socket.on("ques", function () {
    answers = [];
    count_answered = 0;
    ques = questions.results[question_count]
    question_count++
    answers.push(ques.correct_answer)
    answers.push(ques.incorrect_answers[0])
    answers.push(ques.incorrect_answers[1])
    answers.push(ques.incorrect_answers[2])

    answers.sort(() => Math.random() - 0.5);

    console.log(ques)
    console.log(answers)

    io.emit("question_options", ques, answers)
  });

  socket.on("answer", function (answer) {
    console.log(answer)
    console.log("///////////////////////////////////////////")
    console.log(questions.results[question_count - 1].correct_answer)
    console.log("Question number: ", question_count)
    for (let i = 0; i < users.length; i++) {
      if (socket.id == users[i]._id) {
        users[i].answered = true;
        if (users[i].answered == true) {
          count_answered++
          console.log("Count answered: ", count_answered)
          if (count_answered == users.length) {
            if (question_count == 2) {
              console.log("is it fucking coming here???")
              let winner = users[0]
              for (let i = 0; i < users.length; i++) {
                if (users[i].score > winner.score) {
                  winner = users[i];
                }

              }
              console.log(winner)
              io.emit("end_game", winner)
              return;
            }
            for (let i = 0; i < users.length; i++) {
              console.log("Change this persons: ", users[i].name)
              users[i].answered = false;
            }
            console.log('update scores')
            io.emit("update", users)
          }
        }
        if (answer == questions.results[question_count - 1].correct_answer) {
          users[i].score += 10;
        }
      }


    }
    console.log(users)
  });

});