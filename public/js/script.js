phina.globalize();

const BLOCK_SIZE = 60,
      SCREEN_WIDTH = 2100,
      SCREEN_HEIGHT = 1050,
      GRID_SIZE = 70,
      GRID_NUM_X = SCREEN_WIDTH/GRID_SIZE,
      GRID_NUM_Y = SCREEN_HEIGHT/GRID_SIZE,
      SNAKE_SPEED = 7,
      SNAKE_SIZE = 20,
      BULLET_SPEED = 10,
      BULLET_SIZE = 10,
      NUM_EVENT_RANGE = 2000, // 数字を出すイベントの間隔
      ROD_EVENT_RANGE = 5000, // 棒を出すイベントの間隔
      BULLET_EVENT_RANGE = 30000, //銃弾補充アイテムを出すイベントの感覚
      NUM_STRICT = 5, // 一度に出る数字の個数
      direction_array = ['right', 'up', 'left', 'down'],
      color_array = ['blue', 'green', 'yellow', 'purple', 'white', 'orange', 'pink'],
      MY_COLOR = color_array[Math.floor(Math.random() * color_array.length)];

let game_array = [], // フィールドの二次元配列
    game_array_element = [],
    num_position_array = [], // 数字の位置の二次元配列
    time = 0, // 全体のタイマー
    rod_start_position = [], //邪魔する棒を出すときの位置を格納する
    before_rod_event_time = 0, // 前回棒を出した時刻
    before_bullet_event_time = 0,
    canNumWrite = true;

//よく使う関数を定義
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

//外周がnull,内側が0の二次元配列をgame_arrayに格納する
for (let i=0; i<GRID_NUM_Y; i++) {
  game_array_element = [];
  for (let j=0; j<GRID_NUM_X; j++) {
    if (i === 0 || i === GRID_NUM_Y-1) {
      game_array_element.push(null);
    } else {
      if (j === 0 || j === GRID_NUM_X-1) {
        game_array_element.push(null);
      } else {
        game_array_element.push(0);
      }
    }
  }
  game_array.push(game_array_element);
}

phina.define('MainScene', {
  superClass: 'DisplayScene',
  //初期化処理
  init: function() {
    this.superInit({
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
    });
    this.backgroundColor = '#41404B';
    //X方向、Y方向のGridをスクリーン幅に応じて作成
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
    //ブロックを配置する。周りに赤のブロックを置く
    const blockGroup = DisplayElement().addChildTo(this),
          bulletGroup = DisplayElement().addChildTo(this);
    let numGroup = DisplayElement().addChildTo(this);
    for (i=0; i<GRID_NUM_Y; i++) {
      for (j=0; j<GRID_NUM_X; j++) {
        if (i === 0 || i === GRID_NUM_Y-1) {
          Block("transparent", j, i).addChildTo(blockGroup)
                      .setPosition(blockGridX.span(j), blockGridY.span(i));
        } else {
          if (j === 0 || j === GRID_NUM_X-1) {
            Block("transparent", j, i).addChildTo(blockGroup)
                      .setPosition(blockGridX.span(j), blockGridY.span(i));
          } else {
            Block("#D5D5D7", j, i).addChildTo(blockGroup)
                      .setPosition(blockGridX.span(j), blockGridY.span(i));
          }
        }
      }
    }

    //点数表示
    let scoreLabel = Label({
      text: 0 + "点",
      fontSize: 50,
      fill: "red"
    }).addChildTo(this).setPosition(blockGridX.span(1), 25);
    this.scoreLabel = scoreLabel;

    //弾数表示
    let bulletLabel = Label({
      text: "残り30弾",
      fontSize: 50,
      fill: "red"
    }).addChildTo(this).setPosition(blockGridX.span(GRID_NUM_X-3), 25);
    this.bulletLabel = bulletLabel;

    //ユーザー（snake）を作成
    let [handle, speedX, speedY] = createSnakeInfo();
    const snake = Snake(handle, speedX, speedY).addChildTo(this);
    snake.setPosition(blockGridX.span(snake.livePosition[0]), blockGridY.span(snake.livePosition[1]));

    //他の関数からでも参照できるようにする
    this.snake = snake;
    this.blockGroup = blockGroup;
    this.bulletGroup = bulletGroup;
    this.numGroup = numGroup;
    this.blockGridX = blockGridX;
    this.blockGridY = blockGridY;

    //数字を作成
    this.makeNum(5);
    const self = this;
    setTimeout(function() {
      self.makeBulletItem();
    }, 5000);

    //銃弾のタイマー
    this.bulletTimer = 0; 
  },
  //毎フレーム実行する処理
  update: function(app) {
    const self = this;
    time += app.deltaTime;
    // 前回棒を出した時刻から一定時間経つと棒を出すイベントを発火
    if (time-before_rod_event_time > ROD_EVENT_RANGE) {
      if (time % 2 === 0) {
        rod_start_position = [0, randRange(1, GRID_NUM_Y-2)];
      } else {
        rod_start_position = [randRange(1, GRID_NUM_X-2), 0];
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
              if (block.blockPosition[1] === rod_start_position[1] && block.blockPosition[0] !== 0 && block.blockPosition[0] !== GRID_NUM_X-1) {
                if (game_array[rod_start_position[1]][block.blockPosition[0]] !== 100) {
                  game_array[rod_start_position[1]][block.blockPosition[0]] = -1;
                }
                block.fill = "red";
              }
            });
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
              if (block.blockPosition[0] === rod_start_position[0] && block.blockPosition[1] !== 0 && block.blockPosition[1] !== GRID_NUM_Y-1) {
                game_array[block.blockPosition[1]][rod_start_position[0]] = -1;
                block.fill = "red";
              }
            });
          }, 3000);
          break;
      }
      before_rod_event_time = time;
    }
    const snake = this.snake;
    const key = app.keyboard;
    snake.moveBy(snake.speed[0], snake.speed[1]);
    this.blockGroup.children.some(function(block) {
      //snakeとblockが重なった場合の処理
      if (snake.x === block.x && snake.y === block.y) {
        //前のブロックから進んだ方向をbeforedirectionで取得し、位置に反映させる
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
        if (game_array[snake.livePosition[1]][snake.livePosition[0]] === null || block.fill === "red" || game_array[snake.livePosition[1]][snake.livePosition[0]] === -1) {
          self.killSnake(snake);
          self.gameover();
        } else if (game_array[snake.livePosition[1]][snake.livePosition[0]] === 100) {
          snake.bullets += 10;
          self.bulletLabel.text = "残り" + snake.bullets + "弾";
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
        } else {
          snake.score += game_array[snake.livePosition[1]][snake.livePosition[0]];
          self.scoreLabel.text = snake.score + "点";
          game_array[snake.livePosition[1]][snake.livePosition[0]] = 0;
          self.numGroup.children.some(function(num) {
            if (num.num_position_array[0] === snake.livePosition[0] && num.num_position_array[1] === snake.livePosition[1]) {
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
        //次に進む方向による処理,snake自体のスピードを変える
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
    //ここは毎フレーム行う。押された十字キーがbeforedirectionと反対でないならafterdirectionを更新
    for (i=0; i<4; i++) {
      if (key.getKey(direction_array[i]) && snake.beforedirection !== direction_array[(i+2)%4]) {
        snake.afterdirection = direction_array[i];
      }
    }
    //ここから銃弾の処理
    this.bulletTimer += app.deltaTime;
    if (key.getKey('space') && snake.bullets > 0 && this.bulletTimer > 500 && !snake.isDead) {
      const bullet = Bullet(snake.fill).addChildTo(this.bulletGroup)
      bullet.direction = snake.beforedirection;
      bullet.setPosition(snake.x, snake.y);
      snake.bullets--;
      this.bulletLabel.text = "残り" + snake.bullets + "弾";
      this.bulletTimer = 0;
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
            game_array[block.blockPosition[1]][block.blockPosition[0]] !== 0) {
          if (game_array[block.blockPosition[1]][block.blockPosition[0]] !== 100) {
            game_array[block.blockPosition[1]][block.blockPosition[0]] = 0;
          }
          block.fill = "#D5D5D7";
        }
      })
      if (bullet.x > SCREEN_WIDTH || bullet.x < 0 || bullet.y < 0 || bullet.y > SCREEN_HEIGHT) {
        bullet.remove();
      }
    });
  }, 
  gameover: function() {
    const self = this;
    var label = Label({
      text: 'GAME OVER',
      fill: 'yellow',
      fontSize: 64,
    }).addChildTo(this);
    label.setPosition(this.gridX.center(), this.gridY.center());
    // 少し待ってからタイトル画面へ
    label.tweener.clear()
                 .wait(5000)
                 .call(function() {
                   location.href = "/";
                 });
  },
  // 被らない場所に数字を出す
  makeNum: function(count) {
    for (i=0; i<count; i++) {
      let [numPositionX, numPositionY] = [randRange(1, GRID_NUM_X-2), randRange(1, GRID_NUM_Y-2)];
      for (j=0; j<num_position_array.length; j++) {
        if (numPositionX === num_position_array[j][0] && numPositionY === num_position_array[j][1]) {
          if (game_array[numPositionY][numPositionX] === -1) {
            i -= 1;
            canNumWrite = false;
          }
        }
      }
      if (!canNumWrite) {
        canNumWrite = true;
        continue;
      }
      num_position_array.push([numPositionX, numPositionY]);
      let num = randRange(1,99);
      game_array[numPositionY][numPositionX] = num;
      let label = Label({
        text: num,
        fontSize: BLOCK_SIZE-20
      }).addChildTo(this.numGroup).setPosition(this.blockGridX.span(numPositionX), this.blockGridY.span(numPositionY));
      label.num_position_array = [numPositionX, numPositionY];
      }
  },
  // 棒を出す前に両端で点滅させる
  flash: function(object) {
    object.tweener.clear()
                  .wait(500)
                  .call(function() {
                    object.fill = "transparent";
                  })
                  .wait(500)
                  .call(function() {
                    object.fill = "red";
                  })
                  .wait(500)
                  .call(function() {
                    object.fill = "transparent";
                  })
                  .wait(500)
                  .call(function() {
                    object.fill = "red";
                  })
                  .wait(500)
                  .call(function() {
                    object.remove();
                  });
  },
  //ユーザをアニメーションと共に殺す
  killSnake: function(snake) {
    snake.tweener.clear()
                       .scaleTo(0.1, 50)
                       .call(function() {
                         snake.isDead = true
                         snake.remove();
                       });
  },
  makeBulletItem: function() {
    let bulletItemPosition = [randRange(1, GRID_NUM_X-2), randRange(1, GRID_NUM_Y-2)];
    let bulletItem = CircleShape({
      radius: BLOCK_SIZE/4,
      fill: "blue"
    }).addChildTo(this).setPosition(this.blockGridX.span(bulletItemPosition[0]), this.blockGridY.span(bulletItemPosition[1]));
    game_array[bulletItemPosition[1]][bulletItemPosition[0]] = 100;
    this.bulletItem = bulletItem;
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
      fill: "red",
      strokeWidth: 0
    });
  }
});

phina.define('Snake', {
  superClass: 'CircleShape',
  init: function(handle, speedX, speedY) {
    this.superInit({
      radius: SNAKE_SIZE,
      fill: MY_COLOR
    });
    this.beforedirection = handle; //今進んでいる方向
    this.afterdirection = handle; //次ブロックと重なった時に進む方向
    this.speed = [speedX, speedY];
    this.livePosition = [randRange(GRID_NUM_X/4, GRID_NUM_X/4*3), randRange(GRID_NUM_Y/4, GRID_NUM_Y/4*3)];
    this.bullets = 30;
    this.score = 0;
    this.isDead = false;
  }
});

phina.define('Bullet', {
  superClass: 'RectangleShape',
  init: function(color) {
    this.superInit({
      width: BULLET_SIZE,
      height: BULLET_SIZE,
      fill: color,
      stroke: 'black',
      strokeWidth: 2
    });
    this.direction = '';
  }
});

phina.main(function() {
  GameApp({
    startLabel: 'main',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  }).run();
});