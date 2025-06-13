<script lang="ts" setup>
import { ref } from 'vue'
import { Agent } from './DQN/DQN'






const palettes = {
  'classic': {
    'background': '#003300',
    'snake': '#00FF00',
    'head': '#39FF14',
    'food': '#FF0000',
    'gridLines': '#004d00',
  },
  'modern': {
    'background': '#2c3e50',
    'snake': '#2ecc71',
    'head': '#27ae60',
    'food': '#f1c40f',
    'gridLines': '#34495e',
  },
  'neon': {
    'background': '#000000',
    'snake': '#00FFFF',
    'head': '#FF00FF',
    'food': '#FFFF33',
    'gridLines': '#1a0033',
  }
}

type selectedPaletteName = 'classic' | 'modern' | 'neon'
type selectedElementName = 'background' | 'snake' | 'head' | 'food' | 'gridLines'
type Direction = 'top' | 'right' | 'left' | 'bottom'
const actions: Direction[] = ['top', 'right', 'left', 'bottom']
const palette = palettes['neon']
function intializeColors() {
  const root = document.documentElement
  for (const name in palette) {
    root.style.setProperty('--' + name, palette[name as selectedElementName])
  }
}
intializeColors()


class SnakeGame {
  private gridWidth: number
  private snakeBody: number[][]
  private foodPosition: { x: number, y: number }
  private direction: Direction
  private isLost = false

  constructor(gridWidth: number) {
    this.gridWidth = gridWidth
    const half = Math.floor(gridWidth / 2)
    const quarter = Math.floor(gridWidth / 4)
    this.snakeBody = [[quarter + 1, quarter], [quarter, quarter], [quarter - 1, quarter], [quarter - 2, quarter]]
    this.direction = 'right'
    this.foodPosition = { x: half, y: half }
  }

  getWidth() {
    return this.gridWidth
  }
  getSnake() {
    return this.snakeBody
  }
  getFood() {
    return [this.foodPosition.x, this.foodPosition.y]
  }
  checkPositionIsSnake(x: number, y: number) {
    return this.snakeBody.some(cell => cell[0] == x && cell[1] == y)
  }
  checkPositionIsSnakeHead(x: number, y: number) {
    return this.snakeBody[0][0] == x && this.snakeBody[0][1] == y
  }
  checkPositionIsFood(x: number, y: number) {
    return this.foodPosition.x == x && this.foodPosition.y == y
  }

  checkLose(snake: number[][]) {
    const head = snake[0]
    let snakeCopy = snake.map(p => [...p])
    snakeCopy.shift()

    if (head[0] >= this.gridWidth ||
      head[1] >= this.gridWidth ||
      head[0] < 0 ||
      head[1] < 0 ||
      snakeCopy.some(p => p[0] == head[0] && p[1] == head[1])
    ) {
      return true
    }
    return false
  }

  moveSnake(snake: number[][], direction: Direction) {
    let snakeCopy = snake.map(p => [...p])
    const head = snake[0]

    const moveX = direction == 'left' ? -1 : (direction == 'right' ? 1 : 0)
    const moveY = direction == 'top' ? -1 : (direction == 'bottom' ? 1 : 0)

    if (this.foodPosition.x == head[0] + moveX && this.foodPosition.y == head[1] + moveY) {
      snakeCopy.unshift([this.foodPosition.x, this.foodPosition.y])
      return { reward: 1, eat: true, lost: false, snake: snakeCopy }
    }

    snakeCopy.unshift([head[0] + moveX, head[1] + moveY])
    const isLost = this.checkLose(snakeCopy)
    snakeCopy.pop()

    return { reward: isLost ? -1 : 0, eat: false, lost: isLost, snake: snakeCopy }
  }
  private getEmptyPosition(snake: number[][]) {
    const emptyPositions: number[][] = []
    for (let i = 0; i < this.gridWidth; i++) {
      for (let j = 0; j < this.gridWidth; j++) {
        if (!snake.some(p => p[0] == i && p[1] == j)) {
          emptyPositions.push([i, j])
        }
      }
    }
    return emptyPositions
  }

  private addFood() {
    const emptyPositions = this.getEmptyPosition(this.snakeBody)
    const randomEmptyCell = emptyPositions[Math.floor(Math.random() * emptyPositions.length)]
    this.foodPosition = { x: randomEmptyCell[0], y: randomEmptyCell[1] }
  }
  private calcHamiltDistance(p1: number[], p2: number[]) {
    return Math.abs(p1[0] - p2[0]) + Math.abs(p1[1] - p2[1])
  }

  private calcEclDistance(p1: number[], p2: number[]) {
    return Math.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2)
  }

  thisMoveSnake(dir: Direction) {
    const retObj = this.moveSnake(this.snakeBody, dir)
    this.isLost = retObj.lost
    this.snakeBody = retObj.snake
    if (retObj.eat) this.addFood()
    return retObj

  }
  thisIsLost() {
    return this.isLost
  }

  handleKey(e: KeyboardEvent) {

    const map: { [key: string]: Direction } = {
      ArrowLeft: 'left',
      ArrowRight: 'right',
      ArrowUp: 'top',
      ArrowDown: 'bottom',
    };
    const dir = map[e.key];
    if (dir) this.thisMoveSnake(dir);
    console.log(getState(this.snakeBody, this.getFood()))
  }




  AIMoveSnakeRandomMove() {
    while (true) {
      const action = actions[Math.floor(Math.random() * 4)]
      const retuObj = this.moveSnake(this.snakeBody, action as Direction)
      if (!retuObj.lost) {
        this.thisMoveSnake(action as Direction)
        return
      }
    }

  }
  AIMoveSnakeSelectBestCore() {
    if (this.isLost) {
      return
    }
    let actionScore: Record<Direction, number> = {
      'top': 0,
      'bottom': 0,
      'left': 0,
      'right': 0
    }
    const previousHead = this.snakeBody[0]
    for (const action of actions) {
      const retuObj = this.moveSnake(this.snakeBody, action as Direction)
      const newHead = retuObj.snake[0]
      const food = [this.foodPosition.x, this.foodPosition.y]
      const prevDistance = this.calcHamiltDistance(previousHead, food)
      const newDitance = this.calcHamiltDistance(newHead, food)
      actionScore[action] = retuObj.lost ? -(this.gridWidth ** 2) : (prevDistance - newDitance)
    }
    const bestAction = Object.entries(actionScore).reduce((maxEnt, currEnt) => { return maxEnt[1] > currEnt[1] ? maxEnt : currEnt })[0]
    return bestAction

  }
  AIMoveSnakeSelectBest() {

    this.thisMoveSnake(this.AIMoveSnakeSelectBestCore() as Direction)
  }

}


// [isDangerTop isDangerRight isDangerLeft isDangerBottom isFoodTop isFoodRight isFoodLeft isFoodBottom]

const agent = new Agent(1, 0.01, 0.5, [8, 4])

function getState(snakeBody: number[][], food: number[]) {
  const snakeHead = snakeBody[0]
  let state = [0, 0, 0, 0, 0, 0, 0, 0]
  for (let i = 0; i < 4; i++) {
    const dir = actions[i]
    const retObj = snake.value.moveSnake(snakeBody, dir as Direction)
    state[i] = retObj.lost ? 1 : -1
  }
  state[4] = snakeHead[1] > food[1] ? 1 : -1
  state[5] = snakeHead[0] < food[0] ? 1 : -1
  state[6] = snakeHead[0] > food[0] ? 1 : -1
  state[7] = snakeHead[1] < food[1] ? 1 : -1
  return state
}

const count = ref(0)
const maxExpBeforeAI = 500
function AIQLAction() {
  let state = getState(snake.value.getSnake(), snake.value.getFood())
  const actionOrder = count.value > maxExpBeforeAI ? agent.selectAction(state) : actions.indexOf(snake.value.AIMoveSnakeSelectBestCore() as Direction)
  const selectedAction = actions[actionOrder]
  const retObj = snake.value.thisMoveSnake(selectedAction)
  let newState = getState(snake.value.getSnake(), snake.value.getFood())

  agent.store({ state: state, action: actionOrder, reward: retObj.reward, nextState: newState, done: (retObj.reward > 0) })
  agent.train()

  if (retObj.lost) {
    snake.value = new SnakeGame(20)
  }
  count.value += 1
}






const snake = ref(new SnakeGame(20))

window.addEventListener('keydown', (e) => { snake.value.handleKey(e) })
// setInterval(() => { snake.value.AIMoveSnakeSelectBest(); }, 50)
setInterval(() => { AIQLAction() }, 100)
</script>

<template>


  <main>
    <h1 v-if="snake.thisIsLost()" style="color: var(--head);">You Lost</h1>
    <h1  style="color: var(--head);"> Exp: {{ count }}</h1>
    <div id="grid">
      <div class="row" v-for="_, indexR in snake.getWidth()">
        <div class="cell" v-for="_, indexC in snake.getWidth()" :class="{ snake: snake.checkPositionIsSnake(indexC, indexR), head: snake.checkPositionIsSnakeHead(indexC, indexR), food: snake.checkPositionIsFood(indexC, indexR) }"> </div>
      </div>

    </div>

  </main>


</template>

<style>
body,
html {
  background-color: var(--background);
}

#grid {
  margin-inline: auto;
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 2px;
}

.row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2px;
  margin: 0;
}

.cell {
  background-color: var(--gridLines);
  width: 1rem;
  height: 1rem;
  border-radius: 4px;
  margin: 0;
}

.snake {
  background-color: var(--snake);
}

.head {
  background-color: var(--head);
}

.food {
  background-color: var(--food);
}
</style>
