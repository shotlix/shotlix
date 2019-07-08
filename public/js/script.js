phina.globalize();

const BLOCK_SIZE = 55,
      SCREEN_WIDTH = 1740,
      SCREEN_HEIGHT = 960,
      GRID_SIZE = 60,
      GRID_NUM_X = SCREEN_WIDTH/GRID_SIZE,
      GRID_NUM_Y = SCREEN_HEIGHT/GRID_SIZE,
      SNAKE_SPEED = 6,
      SNAKE_SIZE = 20,
      BULLET_SPEED = 10,
      BULLET_SIZE = 10,
      NUM_EVENT_RANGE = 2000, // 数字を出すイベント�?�間隔
      ROD_EVENT_RANGE = 5000, // 棒を出すイベント�?�間隔
      BULLET_EVENT_RANGE = 30000, //�?弾補�??アイ�?�?を�?�すイベント�?�間隔
      POINT_TWICE_EVENT_RANGE = 45000, //ポイント２倍アイ�?�?を�?�すイベント�?�間隔
      BULLET_FOUR_EVENT_RANGE = 37500, //�?弾4つになるアイ�?�?を�?�すイベント�?�感�?
      POINT_TWICE_TIME = 10000, //ポイントが?��倍になる時�?
      BULLET_FOUR_TIME = 7000, //�?弾�?4つになる時�?
      BULLET_PLUS = 5,
      NUM_STRICT = 7, // 一度に出る数字�?�個数
      direction_array = ['right', 'up', 'left', 'down'],
      MY_COLOR = "white",
      background_color_array = [['#FF837B', '#FFB29A', '#A14848'], ['#7C90F9', '#ACC3FF', '#545895'],
                                ['#75AE66', '#A1CA93', '#427B44'], ['#977CE1', '#BF9FEE', '#715495']],
      BACKGROUND_COLOR = background_color_array[Math.floor(Math.random() * background_color_array.length)],
      BLOCK_COLOR = BACKGROUND_COLOR[2];

let game_array = [], // フィールド�?�二次�?配�??
    game_array_element = [],
    num_position_array = [], // 数字�?�位置の二次�?配�??
    time = 0, // 全体�?�タイマ�?�
    rod_start_position = [], //邪魔する棒を出すとき�?�位置を�?�納す�?
    before_rod_event_time = 0, // 前回棒を出した時刻
    before_bullet_event_time = 0,
    can_num_write = true,
    point_twice_start_time = 0,
    bullet_four_start_time = 0,
    score = 0,
    is_submitted = false,
    is_finished = false;

//よく使�?関数を定義
const randRange = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);
const createSnakeInfo = () => {
  let handle = direction_array[Math.floor(Math.random()*4)];
  let speed_array =[];
  switch (handle) {
    case 'right':
      speed_array.push(SNAKE_SPEED);
      speed_array.push(0);
      break;
    case 'up':
      speed_array.push(0);
      speed_array.push(-SNAKE_SPEED);
      break;
    case 'left':
      speed_array.push(-SNAKE_SPEED);
      speed_array.push(0);
      break;
    case 'down':
      speed_array.push(0);
      speed_array.push(SNAKE_SPEED);
      break;
  }
  return [handle, speed_array[0], speed_array[1]];
}

//外周がnull,�?側�?0の二次�?配�?�をgame_arrayに格納す�?
for (let i=0; i<GRID_NUM_Y; i++) {
  game_array_element = [];
  for (let j=0; j<GRID_NUM_X; j++) {
    if (i == 0 || i == GRID_NUM_Y-1 || i == 1) {
      game_array_element.push(null);
    } else {
      if (j == 0 || j == GRID_NUM_X-1) {
        game_array_element.push(null);
      } else {
        game_array_element.push(0);
      }
    }
  }
  game_array.push(game_array_element);
}

//ASSET定義
const ASSETS = {
  image: {
    'bulletItem': '../assets/images/bulletItem.png',
    'pointTwiceItem': '../assets/images/pointTwiceItem.png',
    'bulletFourItem': '../assets/images/bulletFourItem.png',
  },
  sound: {
    'getBullet': '../assets/sounds/getBullet.mp3',
    'shotBullet': '../assets/sounds/shotBullet.mp3',
    'dead': '../assets/sounds/dead.mp3',
    'getNum': '../assets/sounds/getNum.mp3',
    'alert': '../assets/sounds/alert.mp3',
    'rodEvent': '../assets/sounds/rodEvent.mp3',
    'getTwiceItem': '../assets/sounds/getTwiceItem.mp3',
    'finishLoad': '../assets/sounds/finishLoad.mp3',
    'getBulletFourItem': '../assets/sounds/getBulletFourItem.mp3'
  },
};

phina.define('LoadingScene', {
  superClass: 'DisplayScene',

  init: function(options) {
    this.superInit(options);
    var self = this;
    this.backgroundColor = BACKGROUND_COLOR[1];

    // view
    var baseLayer = DisplayElement(options).addChildTo(this);

    // ラベル
    var label = Label({
      text: "NOW LOADING...",
      fontFamily: "'Orbitron', 'MS ゴシ�?ク'",
      fill: "white",
    })
    .addChildTo(baseLayer)
    .setPosition(this.width*0.5, this.height*0.25)
    label.tweener.clear()
    .setLoop(1)
    .to({alpha:0}, 500)
    .to({alpha:1}, 500)
    ;
    
    // くるくるまわる�?
    var circle = phina.display.CircleShape({
      stroke: "white",
      fill: false,
      radius: 100,
      strokeWidth: 16,
    })
    .addChildTo(baseLayer)
    .setPosition(this.width*0.5, this.height*0.45)
    circle.tweener.clear()
    .setLoop(1)
    .to({scaleX: -1}, 900, "easeInOutCubic")
    .to({scaleX: 1}, 900, "easeInOutCubic");
    
    // ゲージ
    var gauge = phina.ui.Gauge({
      value: 0,
      gaugeColor: BACKGROUND_COLOR[2],
      strokeWidth: 0,
    })
    .setPosition(this.width*0.5, this.height*0.75)
    .addChildTo(baseLayer);
    gauge.animationTime = 5000;


    // フロー
    var flows = [];

    // ローダー処�?
    var loader = phina.asset.AssetLoader();
    var loaderFlow = phina.util.Flow(function(resolve) {

      // 進�?
      loader.onprogress = function(e) {
       gauge.value = e.progress * 80;
      };

      // ロード完�?
      loader.onload = function() {
        resolve("loader loaded!");
      };
    });
    flows.push(loaderFlow);
    loader.load(options.assets);

    // 時間稼ぎ用の仮処�?
    var otherFlow = phina.util.Flow(function(resolve) {
      setTimeout(function() {
        resolve("owari!");
      }, 3000)
    });
    flows.push(otherFlow);

    // 全て終わったら
    phina.util.Flow.all(flows).then(function(args) {

      SoundManager.play('finishLoad');
      //ゲージ即座に100?�?に
      gauge.animationTime = 1;
      gauge.value = 100;

      // くるくる止める
      circle.stroke = BACKGROUND_COLOR[0];
      circle.tweener.clear()
      .to({scaleX: 1}, 350)

      label.text = "LOAD COMPLETE";
      label.tweener.clear()
      .to({alpha:0}, 100)
      .to({alpha:1}, 100)
      .to({alpha:0}, 100)
      .to({alpha:1}, 100)
      .to({alpha:0}, 100)
      .to({alpha:1}, 100)
      .wait(750)
      .call(function() {
        baseLayer.tweener.clear()
        .by({alpha: -1, y:-70}, 300, 'easeInQuad')
        .wait(300)
        .call(function() {
          // self.replaceScene(scene);
          // self.app.popScene();
          self.flare('loaded');
        });
      });
    });
  },
});


phina.define('MainScene', {
  superClass: 'DisplayScene',
  //初期化�?��?
  init: function(options) {
    this.superInit(options);
    this.backgroundColor = BACKGROUND_COLOR[1];
    //X方向、Y方向�?�Gridをスクリーン�?に応じて作�??
    const blockGridX = Grid({
      width: SCREEN_WIDTH,
      columns: GRID_NUM_X,
      offset: GRID_SIZE/2
    }),
          blockGridY = Grid({
      width: SCREEN_HEIGHT,
      columns: GRID_NUM_Y,
      offset: GRID_SIZE/2
    });
    //ブロ�?クを�?�置する。周りに赤のブロ�?クを置�?
    const blockGroup = DisplayElement().addChildTo(this),
          bulletGroup = DisplayElement().addChildTo(this);
    let numGroup = DisplayElement().addChildTo(this);
    for (i=0; i<GRID_NUM_Y; i++) {
      for (j=0; j<GRID_NUM_X; j++) {
        if (i == 0 || i == GRID_NUM_Y-1 || i == 1) {
          Block("transparent", j, i).addChildTo(blockGroup)
                      .setPosition(blockGridX.span(j), blockGridY.span(i));
        } else {
          if (j == 0 || j == GRID_NUM_X-1) {
            Block("transparent", j, i).addChildTo(blockGroup)
                      .setPosition(blockGridX.span(j), blockGridY.span(i));
          } else {
            Block(BACKGROUND_COLOR[0], j, i).addChildTo(blockGroup)
                      .setPosition(blockGridX.span(j), blockGridY.span(i));
          }
        }
      }
    }

    //点数表示
    let scoreLabel = Label({
      text: 0,
      fontSize: 30,
      fill: "white",
      fontFamily: "'Orbitron', '?��?�� ゴシ�?ク'"
    }).addChildTo(this).setPosition(blockGridX.span(1), 70);
    this.scoreLabel = scoreLabel;

    let scoreBar = RectangleShape({
      width: 0,
      height: 10,
      strokeWidth: 0,
      fill: "white",
      radius: 100
    }).addChildTo(this).setPosition(53, 100);
    scoreBar.setOrigin(0, 0.5);
    this.scoreBar = scoreBar;

    Label({
      text: '残弾数',
      fontSize: 18,
      fontFamily: "Yuanti TC",
      fill: "white"
    }).addChildTo(this).setPosition(blockGridX.span(GRID_NUM_X-3), 50);

    //弾数表示
    let bulletLabel = Label({
      text: 30,
      fontSize: 40,
      fill: "white",
      fontFamily: "'Orbitron', '?��?�� ゴシ�?ク'"
    }).addChildTo(this).setPosition(blockGridX.span(GRID_NUM_X-3), 90);
    this.bulletLabel = bulletLabel;

    //ユーザー?�?snake?��を作�??
    let [handle, speedX, speedY] = createSnakeInfo();
    const snake = Snake(handle, speedX, speedY).addChildTo(this);
    snake.setPosition(blockGridX.span(snake.livePosition[0]), blockGridY.span(snake.livePosition[1]));

    //他�?�関数からでも参照できるようにする
    this.snake = snake;
    this.blockGroup = blockGroup;
    this.bulletGroup = bulletGroup;
    this.numGroup = numGroup;
    this.blockGridX = blockGridX;
    this.blockGridY = blockGridY;

    //数字を作�??
    this.makeNum(NUM_STRICT);
    const self = this;
    setTimeout(function() {
      self.makeBulletItem();
    }, 10000);

    //点数?��倍アイ�?�?を作�??
    setTimeout(function() {
      self.makePointTwiceItem();
    }, 20000);

    setTimeout(function() {
      self.makeBulletFourItem();
    }, 15000);

    //�?弾のタイマ�?�
    this.bulletTimer = 0; 
  },
  //毎フレー�?実行する�?��?
  update: function(app) {
    const snake = this.snake;
    const key = app.keyboard;
    const self = this;
    time += app.deltaTime;
    // ポイント２倍期間が過ぎるとそれを止め、一定時間後にまた�?��?
    if (time-point_twice_start_time > POINT_TWICE_TIME && snake.isPointTwice) {
      snake.fill = "white";
      snake.isPointTwice = false;
      point_twice_start_time = time;
      setTimeout(function() {
        self.makePointTwiceItem();
      }, POINT_TWICE_EVENT_RANGE);
    }
    if (time-bullet_four_start_time > BULLET_FOUR_TIME && snake.isBulletFour) {
      snake.fill = "white";
      snake.isBulletFour = false;
      bullet_four_start_time = time;
      setTimeout(function() {
        self.makeBulletFourItem();
      }, BULLET_FOUR_EVENT_RANGE);
    }
    // 前回棒を出した時刻から一定時間経つと棒を出すイベントを発火
    if (time-before_rod_event_time > ROD_EVENT_RANGE) {
      if (time % 2 == 0) {
        rod_start_position = [0, randRange(2, GRID_NUM_Y-2)];
      } else {
        rod_start_position = [randRange(1, GRID_NUM_X-2), 1];
      }
      switch (rod_start_position[0]) {
        case 0:
          let adviceLeftCircle = AdviceCircle().addChildTo(this)
                                               .setPosition(this.blockGridX.span(rod_start_position[0]),
                                                            this.blockGridY.span(rod_start_position[1]));
          let adviceRightCircle = AdviceCircle().addChildTo(this)
                                                .setPosition(this.blockGridX.span(GRID_NUM_X-1),
                                                             this.blockGridY.span(rod_start_position[1]));
          this.flash(adviceLeftCircle);
          this.flash(adviceRightCircle);
          setTimeout(function() {
            self.blockGroup.children.some(function(block) {
              if (block.blockPosition[1] == rod_start_position[1] && 
                  block.blockPosition[0] !== 0 && 
                  block.blockPosition[0] !== GRID_NUM_X-1) {
                if (game_array[rod_start_position[1]][block.blockPosition[0]] == 0 && game_array[rod_start_position[1]][block.blockPosition[0]] !== 100) {
                  game_array[rod_start_position[1]][block.blockPosition[0]] = -1;
                }
                block.fill = BLOCK_COLOR;
              }
            });
            SoundManager.play("rodEvent");
          }, 3000);
          break;
        default:
          let adviceOverCircle = AdviceCircle().addChildTo(this)
                                               .setPosition(this.blockGridX.span(rod_start_position[0]),
                                                            this.blockGridY.span(rod_start_position[1]));
          let adviceUnderCircle = AdviceCircle().addChildTo(this)
                                                .setPosition(this.blockGridX.span(rod_start_position[0]),
                                                             this.blockGridY.span(GRID_NUM_Y-1));
          this.flash(adviceOverCircle);
          this.flash(adviceUnderCircle);
          setTimeout(function() {
            self.blockGroup.children.some(function(block) {
              if (block.blockPosition[0] == rod_start_position[0] && 
                  block.blockPosition[1] !== 0 && 
                  block.blockPosition[1] !== GRID_NUM_Y-1 &&
                  block.blockPosition[1] !== 1) {
                if (game_array[block.blockPosition[1]][rod_start_position[0]] == 0 && game_array[block.blockPosition[1]][rod_start_position[0]] !== 100) {
                  game_array[block.blockPosition[1]][rod_start_position[0]] = -1;
                }
                block.fill = BLOCK_COLOR;
              }
            });
            SoundManager.play("rodEvent");
          }, 3000);
          break;
      }
      before_rod_event_time = time;
    }
    snake.moveBy(snake.speed[0], snake.speed[1]);
    this.blockGroup.children.some(function(block) {
      //snakeとblockが重なった�?�合�?�処�?
      if (snake.x == block.x && snake.y == block.y) {
        //前�?�ブロ�?クから進んだ方向をbeforedirectionで取得し、位置に反映させ�?
        switch (snake.beforedirection) {
          case 'right':
            snake.livePosition[0] += 1;
            break;
          case 'left':
            snake.livePosition[0] -= 1;
            break;
          case 'up':
            snake.livePosition[1] -= 1;
            break;
          case 'down':
            snake.livePosition[1] += 1;
            break;
        }
        //場外に出た時
        if (game_array[snake.livePosition[1]][snake.livePosition[0]] == null || block.fill == BLOCK_COLOR) {
          if (!snake.isDead) {
            SoundManager.play('dead');
          }
          score = snake.score;
          self.killSnake(snake);
          self.gameover();
        } else if (game_array[snake.livePosition[1]][snake.livePosition[0]] == 100 && !snake.isDead) {
          SoundManager.play('getBullet');
          snake.bullets += BULLET_PLUS;
          self.bulletLabel.text = snake.bullets;
          self.bulletItem.tweener.clear()
                                 .to({
                                   scaleX: 0.1,
                                   scaleY: 0.1,
                                   rotation: 360
                                 }, 500)
                                 .call(function() {
                                   setTimeout(function() {
                                     self.makeBulletItem();
                                   }, BULLET_EVENT_RANGE);
                                   self.bulletItem.remove();
                                 });
          game_array[snake.livePosition[1]][snake.livePosition[0]] = 0;
        } else if (game_array[snake.livePosition[1]][snake.livePosition[0]] == 200 && !snake.isDead) {
          SoundManager.play('getTwiceItem');
          snake.fill = "yellow";
          self.pointTwiceItem.tweener.clear()
                                     .to({
                                       scaleX: 0.1,
                                       scaleY: 0.1,
                                       rotation: 360
                                     }, 500)
                                     .call(function() {
                                       snake.isPointTwice = true;
                                       self.pointTwiceItem.remove();
                                       point_twice_start_time = time;
                                     });
          game_array[snake.livePosition[1]][snake.livePosition[0]] = 0;
        } else if (game_array[snake.livePosition[1]][snake.livePosition[0]] == 300 && !snake.isDead) {
          SoundManager.play('getBulletFourItem');
          snake.fill = "red";
          self.bulletFourItem.tweener.clear()
                                     .to({
                                       scaleX: 0.1,
                                       scaleY: 0.1,
                                       rotation: 360
                                     }, 500)
                                     .call(function() {
                                       snake.isBulletFour = true;
                                       self.bulletFourItem.remove();
                                       bullet_four_start_time = time;
                                     });
          game_array[snake.livePosition[1]][snake.livePosition[0]] = 0;
        } else if (!snake.isDead) {
          if (game_array[snake.livePosition[1]][snake.livePosition[0]] !== 0) {
            if (snake.isPointTwice) {
              let pointTwiceLabel = Label({
                text: "�?2",
                fill: "white",
                fontSize: (BLOCK_SIZE-30)/4*3,
                fontFamily: "'Orbitron', 'MS ゴシ�?ク",
              }).addChildTo(self).setPosition(snake.x+SNAKE_SIZE, snake.y-SNAKE_SIZE);
              setTimeout(function() {
                pointTwiceLabel.remove();
              }, 500);
            }
            SoundManager.play('getNum');
            if (snake.isPointTwice) {
              snake.score += game_array[snake.livePosition[1]][snake.livePosition[0]]*2;
            } else {
              snake.score += game_array[snake.livePosition[1]][snake.livePosition[0]];
            }
            self.scoreLabel.text = snake.score;
            self.scoreBar.tweener.clear()
                                 .to({
                                   width: snake.score/5
                                 }, (snake.score-game_array[snake.livePosition[1]][snake.livePosition[0]])*2);
            game_array[snake.livePosition[1]][snake.livePosition[0]] = 0;
          }
          self.numGroup.children.some(function(num) {
            if (num.num_position_array[0] == snake.livePosition[0] && num.num_position_array[1] == snake.livePosition[1]) {
              num.tweener.clear()
                         .to({
                           scaleX: 0.1,
                           scaleY: 0.1,
                           rotation: 360
                         }, 500)
                         .call(function() {
                           setTimeout(function() {
                             self.makeNum(1);
                           }, NUM_EVENT_RANGE);
                           num.remove();
                         });
            }
          });
        }
        //次に進む方向による処�?,snake自体�?�スピ�?�ドを変え�?
        switch (snake.afterdirection) {
          case 'right':
            snake.speed[0] = SNAKE_SPEED;
            snake.speed[1] = 0;
            snake.beforedirection = 'right';
            break;
          case 'left':
            snake.speed[0] = -SNAKE_SPEED;
            snake.speed[1] = 0;
            snake.beforedirection = 'left';
            break;
          case 'up':
            snake.speed[0] = 0;
            snake.speed[1] = -SNAKE_SPEED;
            snake.beforedirection = 'up';
            break;
          case 'down':
            snake.speed[0] = 0;
            snake.speed[1] = SNAKE_SPEED;
            snake.beforedirection = 'down';
            break;
          } 
        }
      } 
    )
    //ここは毎フレー�?行う。押された十字キーがbeforedirectionと反対でな�?ならafterdirectionを更新
    for (i=0; i<4; i++) {
      if (key.getKey(direction_array[i]) && snake.beforedirection !== direction_array[(i+2)%4]) {
        snake.afterdirection = direction_array[i];
      }
    }
    //ここから�?弾の処�?
    this.bulletTimer += app.deltaTime;
    if (key.getKey('space') && snake.bullets > 0 && this.bulletTimer > 500 && !snake.isDead) {
      if (snake.isBulletFour) {
        SoundManager.play('shotBullet');
        for (let i=0; i<4; i++) {
          let bullet = Bullet().addChildTo(this.bulletGroup);
          bullet.direction = direction_array[i];
          bullet.setPosition(snake.x, snake.y);
        }
        snake.bullets--;
        this.bulletLabel.text = snake.bullets;
        this.bulletTimer = 0;
      } else {
        SoundManager.play('shotBullet');
        const bullet = Bullet().addChildTo(this.bulletGroup)
        bullet.direction = snake.beforedirection;
        bullet.setPosition(snake.x, snake.y);
        snake.bullets--;
        this.bulletLabel.text = snake.bullets;
        this.bulletTimer = 0;
      }
    }
    this.bulletGroup.children.some(function(bullet) {
      switch (bullet.direction) {
        case 'right':
          bullet.moveBy(BULLET_SPEED,0);
          break;
        case 'up':
          bullet.moveBy(0, -BULLET_SPEED);
          break;
        case 'left':
          bullet.moveBy(-BULLET_SPEED, 0);
          break;
        case 'down':
          bullet.moveBy(0, BULLET_SPEED);
          break;
      }
      self.blockGroup.children.some(function(block) {
        if (Math.abs(bullet.x-block.x) < BLOCK_SIZE/4*3 && Math.abs(bullet.y-block.y) < BLOCK_SIZE/4*3 && 
            block.blockPosition[0] !== 0 && block.blockPosition[1] !== 0 && block.blockPosition[0] !== GRID_NUM_X-1 && block.blockPosition[1] !== GRID_NUM_Y-1 &&
            block.fill == BLOCK_COLOR) {
          if (game_array[block.blockPosition[1]][block.blockPosition[0]] == -1) {
            game_array[block.blockPosition[1]][block.blockPosition[0]] = 0;
          }
          block.fill = BACKGROUND_COLOR[0];
        }
      })
      if (bullet.x > SCREEN_WIDTH || bullet.x < 0 || bullet.y < 0 || bullet.y > SCREEN_HEIGHT) {
        bullet.remove();
      }
    });
  }, 
  gameover: function() {
    if (!is_finished) {
      is_finished = true;
      $("body").append("<div id='black-cover'></div>").hide().fadeIn(500);
      $("#black-cover").append("<h1>Your Score was " + String(this.snake.score) + "</h1>").hide().fadeIn(1000);
    }
    const self = this;
    setTimeout(function() {
      // 少し�?ってからタイトル画面へ
      if (!is_submitted) {
        $("#hidden_form").append($("<input />", {
          type: 'hidden',
          name: 'score',
          value: score
        }));
        $("#hidden_form").submit();
        is_submitted = true;
      }
    }, 2000);
  },
  // 被らな�?場所に数字を出�?
  makeNum: function(count) {
    for (i=0; i<count; i++) {
      let [numPositionX, numPositionY] = [randRange(1, GRID_NUM_X-2), randRange(2, GRID_NUM_Y-2)];
      for (j=0; j<num_position_array.length; j++) {
        if (numPositionX == num_position_array[j][0] && numPositionY == num_position_array[j][1]) {
            i -= 1;
            can_num_write = false;
        }
      }
      if (game_array[numPositionY][numPositionX] == 100 | game_array[numPositionY][numPositionX] == 200 || game_array[numPositionY][numPositionX] == 300) {
        i -= 1;
        can_num_write = false;
      }
      if (!can_num_write) {
        can_num_write = true;
        continue;
      }
      num_position_array.push([numPositionX, numPositionY]);
      let num = randRange(1,99);
      game_array[numPositionY][numPositionX] = num;
      let label = Label({
        text: num,
        fontSize: BLOCK_SIZE-30,
        fontFamily: "'Orbitron', '?��?�� ゴシ�?ク'",
        fill: "white"
      }).addChildTo(this.numGroup).setPosition(this.blockGridX.span(numPositionX), this.blockGridY.span(numPositionY));
      label.num_position_array = [numPositionX, numPositionY];
      }
  },
  // 棒を出す前に両端で点�?させ�?
  flash: function(object) {
    object.tweener.clear()
                  .call(function() {
                    object.fill = BLOCK_COLOR;
                    SoundManager.play("alert");
                  })
                  .wait(500)
                  .call(function() {
                    object.fill = "transparent";
                  })
                  .wait(500)
                  .call(function() {
                    object.fill = BLOCK_COLOR;
                    SoundManager.play("alert");
                  })
                  .wait(500)
                  .call(function() {
                    object.fill = "transparent";
                  })
                  .wait(500)
                  .call(function() {
                    object.fill = BLOCK_COLOR;
                    SoundManager.play("alert");
                  })
                  .wait(500)
                  .call(function() {
                    object.remove();
                  });
  },
  //ユーザをアニメーションと共に殺�?
  killSnake: function(snake) {
    snake.tweener.clear()
                       .scaleTo(0.1, 50)
                       .call(function() {
                         snake.isDead = true
                         snake.remove();
                       });
  },
  makeBulletItem: function() {
    let bulletFlag = true;
    let bulletItemPosition = []
    while (bulletFlag) {
      bulletItemPosition = [randRange(1, GRID_NUM_X-2), randRange(2, GRID_NUM_Y-2)];
      if (game_array[bulletItemPosition[1]][bulletItemPosition[0]] == 0 || game_array[bulletItemPosition[1]][bulletItemPosition[0]] == -1) {
        bulletFlag = false; 
      }
    }
    let bulletItem = Sprite('bulletItem').addChildTo(this)
                                         .setPosition(this.blockGridX.span(bulletItemPosition[0]), this.blockGridY.span(bulletItemPosition[1]));
    game_array[bulletItemPosition[1]][bulletItemPosition[0]] = 100;
    this.bulletItem = bulletItem;
  },
  makePointTwiceItem: function() {
    let pointFlag = true;
    let pointTwiceItemPosition = []
    while (pointFlag) {
      pointTwiceItemPosition = [randRange(1, GRID_NUM_X-2), randRange(2, GRID_NUM_Y-2)];
      if (game_array[pointTwiceItemPosition[1]][pointTwiceItemPosition[0]] == 0 || game_array[pointTwiceItemPosition[1]][pointTwiceItemPosition[0]] == -1) {
        pointFlag = false; 
      }
    }
    let pointTwiceItem = Sprite('pointTwiceItem').addChildTo(this)
                                                 .setPosition(this.blockGridX.span(pointTwiceItemPosition[0]), this.blockGridY.span(pointTwiceItemPosition[1]));
    game_array[pointTwiceItemPosition[1]][pointTwiceItemPosition[0]] = 200;
    this.pointTwiceItem = pointTwiceItem;
  },
  makeBulletFourItem: function() {
    let bulletFlag = true;
    let bulletFourItemPosition = [];
    while (bulletFlag) {
      bulletFourItemPosition = [randRange(1, GRID_NUM_X-2), randRange(2, GRID_NUM_Y-2)];
      if (game_array[bulletFourItemPosition[1]][bulletFourItemPosition[0]] == 0 || game_array[bulletFourItemPosition[1]][bulletFourItemPosition[0]] == -1) {
        bulletFlag = false;
      }
    }
    let bulletFourItem = Sprite('bulletFourItem').addChildTo(this).setPosition(this.blockGridX.span(bulletFourItemPosition[0]), this.blockGridY.span(bulletFourItemPosition[1]));
    game_array[bulletFourItemPosition[1]][bulletFourItemPosition[0]] = 300;
    this.bulletFourItem = bulletFourItem;
  }
});

phina.define('Block', {
  superClass: 'RectangleShape',
  init: function(color, blockPositionX, blockPositionY) {
    this.superInit({
      width: BLOCK_SIZE,
      height: BLOCK_SIZE,
      fill: color,
      strokeWidth: 0,
      cornerRadius: 7
    });
    this.blockPosition = [blockPositionX, blockPositionY];
  }
});

phina.define('AdviceCircle', {
  superClass: 'CircleShape',
  init: function() {
    this.superInit({
      radius: BLOCK_SIZE/4,
      fill: "transparent",
      strokeWidth: 0
    });
  }
});

phina.define('Snake', {
  superClass: 'CircleShape',
  init: function(handle, speedX, speedY) {
    this.superInit({
      radius: SNAKE_SIZE,
      fill: MY_COLOR,
      strokeWidth: 0
    });
    this.beforedirection = handle; //今進んで�?る方�?
    this.afterdirection = handle; //次ブロ�?クと重なった時に進む方�?
    this.speed = [speedX, speedY];
    this.livePosition = [randRange(GRID_NUM_X/4, GRID_NUM_X/4*3), randRange(GRID_NUM_Y/4, GRID_NUM_Y/4*3)];
    this.bullets = 30;
    this.score = 0;
    this.isDead = false;
    this.isPointTwice = false;
    this.isBulletFour = false;
  }
});

phina.define('Bullet', {
  superClass: 'RectangleShape',
  init: function() {
    this.superInit({
      width: BULLET_SIZE,
      height: BULLET_SIZE,
      fill: "white",
      strokeWidth: 2,
      stroke: "black"
    });
    this.direction = '';
  }
});

phina.main(function() {
  GameApp({
    startLabel: 'main',
    width: 1760,
    height: SCREEN_HEIGHT,
    assets: ASSETS
  }).run();
});
