const express = require('express');
const app = express();
const http = require('http').Server(app);
const PORT = process.env.PORT || 8000;
const helmet = require('helmet');
const cons = require("consolidate");
const path = require("path");

app.use(helmet());
app.use(express.static(__dirname + '/public'));

app.engine("html", cons.swig);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "html");

app.get('/', function (req, res, next) {
    res.render('index.html');
});

app.get("/game", function (req, res, next) {
    res.render("game.html");
})

http.listen(PORT, function () {
    console.log('Server listening. Port:' + PORT);
});
