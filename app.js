const express = require('express');
const app = express();
const http = require('http').Server(app);
const PORT = process.env.PORT || 8000;
const helmet = require('helmet');

const DATABASE_URL = 'postgres://awierqzkwwyumj:e6567e66d6c8c7e6311d317f8b9da41f1450a46f890f60b9792b9d6e4704a688@ec2-54-225-95-183.compute-1.amazonaws.com:5432/d52k7kfp7so72u'
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
    res.render('index');
});

app.post('/ranking', (req, res, next) => {
    const name = req.body.name.slice(0, 10);
    const score = parseInt(req.body.score);
    const date = new Date();
    Ranking.create({
        name: name,
        score: score,
        createdAt: date
    }).then(() => {
        const nameBuffer = new Buffer(name);
        const scoreBuffer = new Buffer(String(score));
        res.redirect('/ranking?name='+nameBuffer.toString('base64')+'&score='+scoreBuffer.toString('base64'));
    }).catch((err) => {
        const error = "データが生成できませんでした";
        error.status = 500;
        next(error);
    });
});

app.get('/ranking', (req, res, next) => {
    const name = req.query.name ? new Buffer(req.query.name, 'base64').toString('utf-8') : "";
    const score = req.query.score ? new Buffer(req.query.score, 'base64').toString('utf-8') : "";
    if (name == "" && score == "") {
        res.redirect("/");
    } else {
        Ranking.findAll().then((ranking) => {
            ranking.sort((a, b) => {
                if (a.score > b.score) return -1;
                if (a.score < b.score) return 1;
                return 0;
            });
            let duplicatedNum = 0;
            ranking[0].rank = 1;
            let myRankId = 0;
            let isExist = false;
            for (let i=0; i<ranking.length; i++) {
                if (i == 0) {
                    ranking[i].rank = 1;
                } else {
                    if (ranking[i].score < ranking[i-1].score) {
                        ranking[i].rank = ranking[i-1].rank+duplicatedNum+1;
                        duplicatedNum = 0;
                    } else {
                        ranking[i].rank = ranking[i-1].rank;
                        duplicatedNum++;
                    }
                }
                if (name == ranking[i].name && score == ranking[i].score) {
                    myRankId = i;
                    isExist = true;
                }
            }
            if (isExist) {
                res.render('ranking', {
                    myRank: ranking[myRankId],
                    ranking: ranking
                });
            } else {
                res.redirect("/");
            }
        }).catch((err) => {
            const error = new Error("何らかのエラーが起きました");
            error.status = 404;
            next(error);
        });
    }
});

app.post('/game', function(req, res, next) {
    res.render('game', {
        name: req.body.name,
    });
});

http.listen(PORT, function(){
    console.log('Server listening. Port:' + PORT);
});
