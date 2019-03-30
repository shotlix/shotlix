const express = require('express');
const app = express();
const router = express.Router();
const http = require('http').Server(app);
const PORT = process.env.PORT || 8000;
const helmet = require('helmet');

const DATABASE_URL = require('./database-url.config.json').database.url;
const Sequelize = require('sequelize');
const sequelize = new Sequelize(DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
        ssl: true
    }
});
const Ranking = sequelize.define('ranking', {
    name: {
        type: Sequelize.STRING,
    },
    score: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    createdAt: {
        type: Sequelize.DATE,
        allowNull: false
    }
}, {
    freezeTableName: true,
    timestamps: false
});
Ranking.sync();

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
    const name = req.body.name.slice(0, 10);
    const score = parseInt(req.body.score);
    Ranking.create({
        name: name,
        score: score,
        createdAt: new Date()
    }).then(() => {
        res.redirect('/ranking');
    });
});

app.get('/ranking', function(req, res, next) {
    Ranking.findAll().then((ranking) => {
        ranking.sort((a, b) => {
            if (a.score > b.score) return -1;
            if (a.score < b.score) return 1;
            return 0;
        });
        let count = 1;
        ranking.forEach(function(rank) {
            rank.rank = count;
            count++;
        });
        res.render('ranking', {
            isPlayed: true,
            name: req.body.name,
            score: req.body.score,
            ranking: ranking,
        });
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
