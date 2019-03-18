phina.globalize();

const BLOCK_SIZE = 25,
      SCREEN_WIDTH = 1800,
      SCREEN_HEIGHT = 960,
      GRID_SIZE = 30,
      GRID_NUM_X = SCREEN_WIDTH/GRID_SIZE,
      GRID_NUM_Y = SCREEN_HEIGHT/GRID_SIZE,
      SNAKE_SPEED = 6,
      direction_array = ['right', 'up', 'left', 'down'];

let game_array = [],
    game_array_element = [];

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
  init: function() {
    this.superInit({
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
    });
    this.backgroundColor = '#41404B';
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
    const blockGroup = DisplayElement().addChildTo(this);
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
    const snake = Snake().addChildTo(this);
    snake.setPosition(blockGridX.span(snake.livePositionX), blockGridY.span(snake.livePositionY));
    this.snake = snake;
    this.blockGroup = blockGroup;
    this.blockGridX = blockGridX;
    this.blockGridY = blockGridY;
  },
  update: function(app) { //todo  赤に衝突で死亡判定 
    const snake = this.snake;
    snake.moveBy(snake.speedX, snake.speedY);
    const self = this
    this.blockGroup.children.some(function(block) {
      if (snake.x === block.x && snake.y === block.y) {
        switch (snake.beforedirection) {
          case 'right':
            snake.livePositionX += 1;
            break;
          case 'left':
            snake.livePositionX -= 1;
            break;
          case 'up':
            snake.livePositionY -= 1;
            break;
          case 'down':
            snake.livePositionY += 1;
            break;
        }
        if (game_array[snake.livePositionY][snake.livePositionX] === null) {
          snake.remove();
          self.revival();
          return true;
        }
        switch (snake.afterdirection) {
          case 'right':
            snake.speedX = SNAKE_SPEED;
            snake.speedY = 0;
            snake.beforedirection = 'right';
            game_array[(block.y-BLOCK_SIZE/2-(GRID_SIZE-BLOCK_SIZE)/2)/GRID_SIZE] 
                      [(block.x-BLOCK_SIZE/2-(GRID_SIZE-BLOCK_SIZE)/2)/GRID_SIZE] = 1;
            block.fill = "pink";
            break;
          case 'left':
            snake.speedX = -SNAKE_SPEED;
            snake.speedY = 0;
            snake.beforedirection = 'left';
            game_array[(block.y-BLOCK_SIZE/2-(GRID_SIZE-BLOCK_SIZE)/2)/GRID_SIZE] 
                      [(block.x-BLOCK_SIZE/2-(GRID_SIZE-BLOCK_SIZE)/2)/GRID_SIZE] = 1;
            block.fill = "pink";
            break;
          case 'up':
            snake.speedX = 0;
            snake.speedY = -SNAKE_SPEED;
            snake.beforedirection = 'up';
            game_array[(block.y-BLOCK_SIZE/2-(GRID_SIZE-BLOCK_SIZE)/2)/GRID_SIZE] 
                      [(block.x-BLOCK_SIZE/2-(GRID_SIZE-BLOCK_SIZE)/2)/GRID_SIZE] = 1;
            block.fill = "pink";
            break;
          case 'down':
            snake.speedX = 0;
            snake.speedY = SNAKE_SPEED;
            snake.beforedirection = 'down';
            game_array[(block.y-BLOCK_SIZE/2-(GRID_SIZE-BLOCK_SIZE)/2)/GRID_SIZE] 
                      [(block.x-BLOCK_SIZE/2-(GRID_SIZE-BLOCK_SIZE)/2)/GRID_SIZE] = 1;
            block.fill = "pink";
            break;
          } 
        }
      } 
    )
    const key = app.keyboard;
    for (i=0; i<4; i++) {
      if (key.getKey(direction_array[i]) && snake.beforedirection !== direction_array[(i+2)%4]) {
        snake.afterdirection = direction_array[i];
      }
    }
  },
  revival: function() {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const snake = Snake().addChildTo(this);
        snake.setPosition(this.blockGridX.span(snake.livePositionX),
                          this.blockGridY.span(snake.livePositionY));
        this.snake = snake;
        resolve();
      }, 1000*5);
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
      radius: 10,
      fill: 'black'
    });
    this.beforedirection = 'right';
    this.afterdirection = 'right';
    this.speedX = SNAKE_SPEED;
    this.speedY = 0;
    this.livePositionX = 1;
    this.livePositionY = 1;
  }
})

phina.main(function() {
  GameApp({
    startLabel: 'main',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  }).run();
});
