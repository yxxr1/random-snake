let POSITION_CHECK_ENABLED = true;
let BORDERS_CHECK_ENABLED = true;
const FIELD_SIZE = {
  cols: 51,
  rows: 51
};
const START_POSITION = {
  x: 25,
  y: 25,
};
let STEP_TIME = 100;
let SNAKE_LENGTH = 20;

const container = document.querySelector('#field');
const statsContainer = document.querySelector('#stats');
const configContainer = document.querySelector('#config');

let renderParams;

class Stats {
  constructor(container) {
    this.container = container;
    this.value = {
      time: 0,
      steps: 0,
      log: [],
    };
    this.timer = null;
  }
  TIMER_REFRESH_INTERVAL = 100;
  LOG_LENGTH = 50;

  startTimer() {
    this.timer = window.setInterval(() => {
      this.value.time += this.TIMER_REFRESH_INTERVAL;
      this.render();
    }, this.TIMER_REFRESH_INTERVAL);
  }
  stopTimer() {
    window.clearInterval(this.timer);
    this.timer = null;
  }

  reset(isCleanLog) {
    this.stopTimer();

    this.value = {
      time: 0,
      steps: 0,
      log: isCleanLog ? [] : this.value.log,
    };
  }

  addLog() {
    this.value.log.push({
      time: this.value.time,
      steps: this.value.steps,
    });
    this.value.log.sort((a, b) => a.steps < b.steps);
    this.value.log.splice(this.LOG_LENGTH);
    this.render();
  }
  addStep() {
    this.value.steps++;
    this.render();
  }

  render() {
    const { time, steps, log } = this.value;

    this.container.innerHTML = `
    <div><b>Time: </b><i>${time / 1000} sec</i></div>
    <div><b>Steps: </b><i>${steps}</i></div>
    <h3>Log</h3>
    <table>
        <tr><td>index</td><td>time</td><td>steps</td></tr>
        ${log.map(({ time, steps }, index) => `
          <tr><td>${index + 1}</td><td>${time}</td><td>${steps}</td></tr>
        `).join('')}
    </table>
  `;
  }
}

class Config {
  constructor(container) {
    this.container = container;
  }

  addInputListener(input, handler, onValidationFailed) {
    input.addEventListener('change', e => {
      const { value } = e.target;
      const numberValue = +value;

      if (numberValue && numberValue > 0) {
        handler(numberValue);
      } else {
        onValidationFailed(e);
      }
    });
  }

  render() {
    const createNumberInput = () => {
      const input = document.createElement('input');
      input.className = 'config-input';

      return input;
    }
    const createBooleanInput = () => {
      const input = document.createElement('input');
      input.type = 'checkbox';

      return input;
    }

    const rowsInput = createNumberInput();
    rowsInput.value = FIELD_SIZE.rows;
    this.addInputListener(rowsInput, value => {
      FIELD_SIZE.rows = value;

      if (START_POSITION.y >= value) {
        START_POSITION.y = value - 1;
      }
    }, e => e.target.value = FIELD_SIZE.rows);

    const colsInput = createNumberInput();
    colsInput.value = FIELD_SIZE.cols;
    this.addInputListener(colsInput, value => {
      FIELD_SIZE.cols = value;

      if (START_POSITION.x >= value) {
        START_POSITION.x = value - 1;
      }
    }, e => e.target.value = FIELD_SIZE.cols);

    const stepTimeInput = createNumberInput();
    stepTimeInput.value = STEP_TIME;
    this.addInputListener(
      stepTimeInput,
      value => STEP_TIME = value,
      e => e.target.value = STEP_TIME,
    );

    const snakeLengthInput = createNumberInput();
    snakeLengthInput.value = SNAKE_LENGTH;
    this.addInputListener(
      snakeLengthInput,
      value => SNAKE_LENGTH = value,
      e => e.target.value = SNAKE_LENGTH,
    );

    const positionCheckInput = createBooleanInput();
    positionCheckInput.checked = POSITION_CHECK_ENABLED;
    positionCheckInput.addEventListener('input', e => POSITION_CHECK_ENABLED = e.target.checked);

    const bordersCheckInput = createBooleanInput();
    bordersCheckInput.checked = BORDERS_CHECK_ENABLED;
    bordersCheckInput.addEventListener('input', e => BORDERS_CHECK_ENABLED = e.target.checked);

    this.container.innerHTML = `
      <h3>Config</h3>
      <div>
        <b>Field size: </b>
      </div>
      <div><b>Step time: </b></div>
      <div><b>Snake length: </b></div>
      <div><b>Position check: </b></div>
      <div><b>Borders check: </b></div>
      <button onclick="initialize()">restart</button>
    `;

    this.container.children[1].appendChild(rowsInput);
    this.container.children[1].appendChild(document.createTextNode('×'));
    this.container.children[1].appendChild(colsInput);
    this.container.children[2].appendChild(stepTimeInput);
    this.container.children[3].appendChild(snakeLengthInput);
    this.container.children[4].appendChild(positionCheckInput);
    this.container.children[5].appendChild(bordersCheckInput);
  }
}

class PositionsLog {
  constructor(initialPosition) {
    this.value = [initialPosition];
  }

  checkPosition({ x: checkX, y: checkY }) {
    return !!this.value.find(({ x, y }) => x === checkX && y === checkY)
  }

  addPosition(position) {
    this.value.push(position);

    if (this.value.length > renderParams.SNAKE_LENGTH) {
      this.value.shift();
    }
  }
}

let isInitializing = true;
let currentPosition;
let positionsLog;
let stats = new Stats(statsContainer);
let config = new Config(configContainer);
config.render();

const setPositionIsActive = ({ x, y }, isActive) => {
  container.children[y].children[x].classList.toggle('active', isActive);
}

const initialize = (isClearLog = true) => {
  isInitializing = true;
  container.innerHTML = '';

  renderParams = {
    FIELD_SIZE: { ...FIELD_SIZE },
    START_POSITION: { ...START_POSITION },
    STEP_TIME,
    SNAKE_LENGTH,
    POSITION_CHECK_ENABLED,
    BORDERS_CHECK_ENABLED,
  };

  currentPosition = renderParams.START_POSITION;
  positionsLog = new PositionsLog(currentPosition);
  stats.reset(isClearLog);

  const transitionDuration = `${renderParams.STEP_TIME * (renderParams.SNAKE_LENGTH - 1)}ms`;

  for (let row = 0; row < renderParams.FIELD_SIZE.rows; row++) {
    const row = document.createElement('div');
    row.className = 'row';

    for (let col = 0; col < renderParams.FIELD_SIZE.cols; col++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.style.transitionDuration = transitionDuration;

      row.appendChild(cell);
    }

    container.appendChild(row);
  }

  setPositionIsActive(currentPosition, true);

  stats.startTimer();

  isInitializing = false;
}

const generateRandom = (min, max) => Math.round(Math.random() * (max - min) + min);

const calculateNextPosition = ({ x: curX, y: curY }) => {
  const possiblePositions = (renderParams.BORDERS_CHECK_ENABLED ? [
    { x: curX + 1, y: curY },
    { x: curX - 1, y: curY },
    { x: curX, y: curY + 1 },
    { x: curX, y: curY - 1 },
  ] : [
    { x: (curX + 1) % renderParams.FIELD_SIZE.cols, y: curY },
    { x: curX === 0 ? renderParams.FIELD_SIZE.cols - 1 : curX - 1, y: curY },
    { x: curX, y: (curY + 1) % renderParams.FIELD_SIZE.rows },
    { x: curX, y: curY === 0 ? renderParams.FIELD_SIZE.rows - 1 : curY - 1 },
  ]).filter(({ x, y }) =>
    x > -1 && y > -1
    && x < renderParams.FIELD_SIZE.cols && y < renderParams.FIELD_SIZE.rows
    && (!renderParams.POSITION_CHECK_ENABLED || !positionsLog.checkPosition({ x, y }))
  );

  if (!possiblePositions.length) {
    return null;
  }

  const newDirection = generateRandom(0, possiblePositions.length - 1);

  return possiblePositions[newDirection];
}

const render = () => {
  if (!isInitializing) {
    const nextPosition = calculateNextPosition(currentPosition);

    if (nextPosition === null) {
      stats.addLog();

      initialize(false);
    } else {
      stats.addStep();

      setPositionIsActive(currentPosition, false);
      setPositionIsActive(nextPosition, true);
      currentPosition = nextPosition;
      positionsLog.addPosition(nextPosition);
    }
  }

  setTimeout(() => {
    window.requestAnimationFrame(render);
  }, renderParams.STEP_TIME);
}

window.addEventListener('DOMContentLoaded', () => {
  initialize();
  window.requestAnimationFrame(render);
});
