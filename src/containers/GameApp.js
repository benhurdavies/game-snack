import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Layer } from 'react-konva';

import Food from '../components/game/Food';
import Snake from '../components/game/Snake';

import { coordinateForMove, getRandomPosition } from '../util/helper';

class GameApp extends Component {
  constructor(props) {
    super(props);
    const snake = this.initSnake();
    this.state = {
      snake: snake,
      food: this.newFood(snake)
    };
    document.addEventListener('keydown', this.handleKeyPress, false);
    this.gameLoop();
  }

  handleKeyPress = event => {
    const key = event.key;
    const { params } = this.props;
    if (params.keysWhitelist[key]) {
      this.moveSnake(params.keysWhitelist[key]);
    }
  };

  initSnake(snakeSize = 4) {
    const { params } = this.props;
    const snakeY = Math.floor(params.heightInBlocks / 2);
    const snakeTailX =
      Math.floor(params.widthInBlocks / 2) - Math.floor(snakeSize / 2);
    let snake = Array(snakeSize);
    for (let x = snakeTailX, i = 0; i < snakeSize; x++, i++) {
      snake[i] = this.defaultSnakeBody(x, snakeY);
      if (i === 0) this.snakeTail(snake[i]);
      else if (i === snakeSize - 1) this.snakeHead(snake[i]);
    }
    return snake;
  }

  gameLoop = () => {
    const snakeHead = this.state.snake[this.state.snake.length - 1];
    const { params } = this.props;
    const nextPosition = coordinateForMove(
      snakeHead.x,
      snakeHead.y,
      snakeHead.towards
    );
    if (this.checkCollision(nextPosition)) {
      this.gameOver();
      return;
    } else {
      this.moveSnake(snakeHead.towards);
      let timeout = setTimeout(this.gameLoop, params.initialFrameLegth);
    }
  };

  moveSnake = direction => {
    if (!this.validateMove(direction)) return;

    const { snake } = this.state;
    const newSnake = [...snake];
    const oldHead = newSnake.pop();
    const nextPosition = coordinateForMove(oldHead.x, oldHead.y, direction);
    const oldHeadToBody = this.defaultSnakeBody(oldHead.x, oldHead.y);
    const newHead = this.snakeHead(
      this.defaultSnakeBody(nextPosition.x, nextPosition.y),
      direction
    );
    if (this.goingToEat(nextPosition)) {
      this.ateFood();
      this.setState({ snake: [...newSnake, oldHeadToBody, newHead] });
    } else {
      this.setState({ snake: [...newSnake.slice(1), oldHeadToBody, newHead] });
    }
  };

  goingToEat = nextPosition => {
    const { food } = this.state;
    return food.id === `f_${nextPosition.x}|${nextPosition.y}`;
  };

  validateMove = direction => {
    const { params } = this.props;
    const snakeHead = this.state.snake[this.state.snake.length - 1];
    if (params.invalidMove[snakeHead.towards] === direction) return false;
    else return true;
  };

  gameOver = () => {
    this.reset();
  };

  reset = () => {
    this.setState({ snake: this.initSnake() });
  };

  checkCollision = nextPosition => {
    let IsOutOfArea = false;
    const { params } = this.props;
    let hitBody = false;
    if (
      nextPosition.x > params.widthInBlocks ||
      nextPosition.y > params.heightInBlocks ||
      nextPosition.x < 0 ||
      nextPosition.y < 0
    ) {
      IsOutOfArea = true;
    } else if (
      this.state.snake.find(
        snakeBody => snakeBody.id === `s_${nextPosition.x}|${nextPosition.y}`
      )
    ) {
      hitBody = true;
    }
    return IsOutOfArea || hitBody;
  };

  newFood = snake => {
    const { params } = this.props;
    var newPosition = getRandomPosition(
      params.widthInBlocks,
      params.heightInBlocks
    );
    if (
      snake.find(
        snakeBody => snakeBody.id === `s_${newPosition.x}|${newPosition.y}`
      )
    ) {
      return this.newFood();
    } else {
      return this.defaultFood(newPosition.x, newPosition.y);
    }
  };

  ateFood = () => {
    const { snake } = this.state;
    this.setState({ food: this.newFood(snake) });
  };

  defaultSnakeBody = (x, y) => {
    const { params } = this.props;
    return {
      x,
      y,
      id: `s_${x}|${y}`,
      name: 'snake',
      blockSize: params.blockSize
    };
  };

  defaultFood = (x, y) => {
    const { params } = this.props;
    return {
      x,
      y,
      id: `f_${x}|${y}`,
      name: 'food',
      blockSize: params.blockSize
    };
  };

  snakeTail = snakeBody => {
    snakeBody.isTail = true;
    return snakeBody;
  };

  snakeHead = (snakeBody, towards = 'right') => {
    snakeBody.isHead = true;
    snakeBody.towards = towards;
    return snakeBody;
  };

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyPress);
  }

  render() {
    return (
      <Layer>
        <Snake snake={this.state.snake} theme={this.props.theme} />
        <Food {...this.state.food} theme={this.props.theme} />
      </Layer>
    );
  }
}

function mapStateToProps(state) {
  return {
    theme: state.app.theme
  };
}

export default connect(mapStateToProps)(GameApp);
