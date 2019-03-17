phina.globalize();

const BLOCK_WIDTH = 60;
const BLOCK_HEIGHT = 60;
const SCREEN_SIZE = 2400;

let direction_array = ['right', 'up', 'left', 'down'];

let game_array = [];
let game_array_element = [];
for (let i=0; i<SCREEN_SIZE/80; i++) {
  game_array_element.push(0);
}
for (let j=0; j<SCREEN_SIZE/80; j++) {
  game_array.push(game_array_element);
}

phina.define('MainScene', {
  superClass: 'DisplayScene',
  init: function() {
    this.superInit({
      width: SCREEN_SIZE,
      height: SCREEN_SIZE,
    });
    this.backgroundColor = '#41404B';
    let blockGroup = DisplayElement().addChildTo(this);
    let blockGrid = Grid({
      width: SCREEN_SIZE,
      columns: SCREEN_SIZE/80,
      offset: 40
    });
    for (let i=0; i<SCREEN_SIZE/80; i++) {
      for (let j=0; j<SCREEN_SIZE/80; j++) {
        Block("#27262C").addChildTo(blockGroup)
               .setPosition(blockGrid.span(i), blockGrid.span(j))
      }
    }
    let snake = Snake().addChildTo(this);
    snake.setPosition(blockGrid.span(snake.livePositionX), blockGrid.span(snake.livePositionY));
    this.snake = snake;
    this.blockGroup = blockGroup;
  },
  update: function(app) { //todo livePosition更新
    let snake = this.snake;
    snake.moveBy(snake.speedX, snake.speedY);
    this.blockGroup.children.some(function(block) {
      if (snake.x === block.x && snake.y === block.y) {
        if (game_array[(block.y-BLOCK_HEIGHT/2-10)/80][(block.x-BLOCK_WIDTH/2-10)/80] === 1) {
          
        }
        switch (snake.afterdirection) {
          case 'right':
            snake.speedX = 16;
            snake.speedY = 0;
            snake.beforedirection = 'right';
            game_array[(block.y-BLOCK_HEIGHT/2-10)/80][(block.x-BLOCK_WIDTH/2-10)/80] = 1;
            block.fill = "pink";
            break;
          case 'left':
            snake.speedX = -16;
            snake.speedY = 0;
            snake.beforedirection = 'left';
            game_array[(block.y-BLOCK_HEIGHT/2-10)/80][(block.x-BLOCK_WIDTH/2-10)/80] = 1;
            block.fill = "pink";
            break;
          case 'up':
            snake.speedX = 0;
            snake.speedY = -16;
            snake.beforedirection = 'up';
            game_array[(block.y-BLOCK_HEIGHT/2-10)/80][(block.x-BLOCK_WIDTH/2-10)/80] = 1;
            block.fill = "pink";
            break;
          case 'down':
            snake.speedX = 0;
            snake.speedY = 16;
            snake.beforedirection = 'down';
            game_array[(block.y-BLOCK_HEIGHT/2-10)/80][(block.x-BLOCK_WIDTH/2-10)/80] = 1;
            block.fill = "pink";
            break;
          } 
        }
      } 
    )
    let key = app.keyboard;
    for (let i=0; i<4; i++) {
      if (key.getKey(direction_array[i]) && snake.beforedirection !== direction_array[(i+2)%4]) {
        snake.afterdirection = direction_array[i];
      }
    }
  }
});

phina.define('Block', {
  superClass: 'RectangleShape',
  init: function(color) {
    this.superInit({
      width: BLOCK_WIDTH,
      height: BLOCK_HEIGHT,
      fill: color,
      strokeWidth: 0,
      cornerRadius: 10
    });
  }
});

phina.define('Snake', {
  superClass: 'CircleShape',
  init: function() {
    this.superInit({
      radius: 40,
      fill: 'black'
    });
    this.beforedirection = 'right';
    this.afterdirection = 'right';
    this.speedX = 16;
    this.speedY = 0;
    this.livePositionX = 0;
    this.livePositionY = 0;
  }
})

phina.main(function() {
  GameApp({
    startLabel: 'main',
    width: SCREEN_SIZE,
    height: SCREEN_SIZE
  }).run();
});