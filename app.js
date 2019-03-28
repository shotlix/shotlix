const express = require('express');
const app = express();
const router = express.Router();
const http = require('http').Server(app);
const PORT = process.env.PORT || 8000;
const helmet = require('helmet');

app.use(helmet());
app.use(express.static(__dirname + '/public'));
app.use(require('body-parser').urlencoded({ extended: true }));
app.set('view engine', 'pug');

app.get('/', function(req, res, next){
    res.render('index', {
        isPlayed: false,
    });
});

app.post('/', function(req, res, next) {
    res.render('index', {
        isPlayed: true,
        name: req.body.name,
        score: req.body.score
    });
});

app.post('/game', function(req, res, next) {
    res.render('game', {
        name: req.body.name,
    });
});

http.listen(PORT, function(){
    console.log('Server listening. Port:' + PORT);
});
