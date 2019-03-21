phina.globalize();

const BLOCK_SIZE = 25,
      SCREEN_WIDTH = 1800,
      SCREEN_HEIGHT = 960,
      GRID_SIZE = 30,
      GRID_NUM_X = SCREEN_WIDTH/GRID_SIZE,
      GRID_NUM_Y = SCREEN_HEIGHT/GRID_SIZE,
      SNAKE_SPEED = 6,
      SNAKE_SIZE = 10,
      BULLET_SPEED = 12,
      BULLET_SIZE = 10;
      direction_array = ['right', 'up', 'left', 'down'];

let game_array = [],
    game_array_element = [];

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
    for (i=0; i<GRID_NUM_Y; i++) {
      for (j=0; j<GRID_NUM_X; j++) {
        if (i === 0 || i === GRID_NUM_Y-1) {
          Block("red").addChildTo(blockGroup)
                      .setPosition(blockGridX.span(j), blockGridY.span(i));
        } else {
          if (j === 0 || j === GRID_NUM_X-1) {
            Block("red").addChildTo(blockGroup)
                      .setPosition(blockGridX.span(j), blockGridY.span(i));
          } else {
            Block("27269c").addChildTo(blockGroup)
                      .setPosition(blockGridX.span(j), blockGridY.span(i));
          }
        }
      }
    }
    //ユーザー（snake）を作成
    const snake = Snake().addChildTo(this);
    snake.setPosition(blockGridX.span(snake.livePosition[0]), blockGridY.span(snake.livePosition[1]));
    //他の関数からでも参照できるようにする
    this.snake = snake;
    this.blockGroup = blockGroup;
    this.bulletGroup = bulletGroup;
    this.blockGridX = blockGridX;
    this.blockGridY = blockGridY;
    //銃弾のタイマー
    this.bulletTimer = 0;
    //死亡時のタイマー
    let deathTimer = 0;
    this.deathTimer = deathTimer;
    // ToDo フォントとか変える
    this.label = Label({
      text: '',
      fontSize: 100,
      fill: 'red'
    }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.center());
  },
  //毎フレーム実行する処理
  update: function(app) {
    const snake = this.snake;
    const key = app.keyboard;
    const self = this;
    snake.moveBy(snake.speed[0], snake.speed[1]);
    if (snake.isDead) {
      this.deathTimer += app.deltaTime;
      let progressedTime = 5-Math.round(this.deathTimer/1000);
      this.label.text = '復活まであと' + progressedTime + '秒';
      if (progressedTime === 0) {
        this.label.remove();
        let deathTimer = 0;
        this.deathTimer = deathTimer;
        this.label = Label({
          text: '',
          fontSize: 100,
          fill: 'red'
        }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.center());
        snake.isDead = false;
      }
    } else {
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
          //枠外に出た時の処理
          if (game_array[snake.livePosition[1]][snake.livePosition[0]] === null) {
            snake.isDead = true;
            snake.tweener.clear()
                         .to({ scaleX: 0.1, scaleY: 0.1 }, 50)
                         .call(function() {
                           snake.remove();
                           self.revival();
                         });
            return true;
          }
          //次に進む方向による処理,snake自体のスピードを変える
          switch (snake.afterdirection) {
            case 'right':
              snake.speed[0] = SNAKE_SPEED;
              snake.speed[1] = 0;
              snake.beforedirection = 'right';
              game_array[(block.y-BLOCK_SIZE/2-(GRID_SIZE-BLOCK_SIZE)/2)/GRID_SIZE] 
                        [(block.x-BLOCK_SIZE/2-(GRID_SIZE-BLOCK_SIZE)/2)/GRID_SIZE] = 1;
              block.fill = "pink";
              break;
            case 'left':
              snake.speed[0] = -SNAKE_SPEED;
              snake.speed[1] = 0;
              snake.beforedirection = 'left';
              game_array[(block.y-BLOCK_SIZE/2-(GRID_SIZE-BLOCK_SIZE)/2)/GRID_SIZE] 
                        [(block.x-BLOCK_SIZE/2-(GRID_SIZE-BLOCK_SIZE)/2)/GRID_SIZE] = 1;
              block.fill = "pink";
              break;
            case 'up':
              snake.speed[0] = 0;
              snake.speed[1] = -SNAKE_SPEED;
              snake.beforedirection = 'up';
              game_array[(block.y-BLOCK_SIZE/2-(GRID_SIZE-BLOCK_SIZE)/2)/GRID_SIZE] 
                        [(block.x-BLOCK_SIZE/2-(GRID_SIZE-BLOCK_SIZE)/2)/GRID_SIZE] = 1;
              block.fill = "pink";
              break;
            case 'down':
              snake.speed[0] = 0;
              snake.speed[1] = SNAKE_SPEED;
              snake.beforedirection = 'down';
              game_array[(block.y-BLOCK_SIZE/2-(GRID_SIZE-BLOCK_SIZE)/2)/GRID_SIZE] 
                        [(block.x-BLOCK_SIZE/2-(GRID_SIZE-BLOCK_SIZE)/2)/GRID_SIZE] = 1;
              block.fill = "pink";
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
    }
    //ここから銃弾の処理
    this.bulletTimer += app.deltaTime;
    if (key.getKey('space') && snake.bullets > 0 && this.bulletTimer > 500 && !snake.isDead) {
      const bullet = Bullet().addChildTo(this.bulletGroup)
      bullet.direction = snake.beforedirection;
      switch(bullet.direction) {
        case 'right':
          bullet.setPosition(snake.x+SNAKE_SIZE+BULLET_SIZE/2+1, snake.y);
          break;
        case 'up':
          bullet.setPosition(snake.x, snake.y-SNAKE_SIZE-BULLET_SIZE/2-1);
          break;
        case 'left':
          bullet.setPosition(snake.x-SNAKE_SIZE-BULLET_SIZE/2-1, snake.y);
          break;
        case 'down':
          bullet.setPosition(snake.x, snake.y+SNAKE_SIZE+BULLET_SIZE/2+1);
          break;
      }
      snake.bullets--;
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
      if (bullet.x > SCREEN_WIDTH || bullet.x < 0 || bullet.y < 0 || bullet.y > SCREEN_HEIGHT) {
        bullet.remove();
      }
      if (bullet.x === snake.x && bullet.y === snake.y) {
        snake.isDead = true;
        snake.tweener.clear()
                     .to({ scaleX: 0.1, scaleY: 0.1 }, 50)
                     .call(function() {
                       snake.remove();
                       self.revival();
                     });
        return true;
      }
    });
  }, 
  //死亡時の関数。5秒待って再び復活させる 
  revival: function(snake) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const snake = Snake().addChildTo(this);
        snake.bullets = 5;
        snake.setPosition(this.blockGridX.span(snake.livePosition[0]),
                          this.blockGridY.span(snake.livePosition[1]));
        this.snake = snake;
        resolve();
      }, 1000*4.5);
    });
  }
});

phina.define('Block', {
  superClass: 'RectangleShape',
  init: function(color) {
    this.superInit({
      width: BLOCK_SIZE,
      height: BLOCK_SIZE,
      fill: color,
      strokeWidth: 0,
      cornerRadius: 7
    });
  }
});

phina.define('Snake', {
  superClass: 'CircleShape',
  init: function() {
    this.superInit({
      radius: SNAKE_SIZE,
      fill: 'black'
    });
    this.beforedirection = 'right'; //今進んでいる方向
    this.afterdirection = 'right'; //次ブロックと重なった時に進む方向
    this.speed = [SNAKE_SPEED, 0];
    this.livePosition = [1, 1];
    this.bullets = 30;
    this.isDead = false;
  }
});

phina.define('Bullet', {
  superClass: 'RectangleShape',
  init: function() {
    this.superInit({
      width: BULLET_SIZE,
      height: BULLET_SIZE,
      fill: 'yellow',
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
