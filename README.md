# 🐍 Vue 3 Snake Game with AI (Deep Q-Learning)

![Screencast from 06-13-2025 08-37-07 PM (1)](https://github.com/user-attachments/assets/c27ff911-acab-413d-a4a2-f554e55e338a)


A browser-based Snake Game built with **Vue 3**, **TypeScript**, and a custom **Deep Q-Network (DQN)** AI. The AI learns to play the game by rewarding itself for eating food and penalizing for crashing.

---

## 🎮 Features

- Classic snake gameplay with smooth rendering.
- AI agent trained using Q-Learning with experience replay.
- Color palette themes: `classic`, `modern`, `neon`.
- Reactive game state using Vue `ref`.
- Supports both keyboard input and automatic AI play.

---

## 🧠 How the AI Works

The AI uses a Deep Q-Network (DQN) agent with the following:

### State Vector (8 Features):
1. Danger in the top cell
2. Danger in the right cell
3. Danger in the left cell
4. Danger in the bottom cell  
5. Food is above
6. Food is right
7. Food is left
8. Food is below

Each is encoded as `1` or `-1` based on the game state.

### Actions:
- `'top'`
- `'right'`
- `'left'`
- `'bottom'`

### Rewards:
- `+1`: Eat food  
- `-1`: Game over  
- `0`: Normal move

  ### Methodology:
  - Use custom method to gain some experience
  - Update Q network using custom experience
  - Use epsillon to move from random action to Q network result

---

## 📂 Project Structure

- `SnakeGame` class: handles logic for snake movement, collisions, food placement.
- `Agent` class: handles experience replay, Q-learning training, action selection.
- Game rendered using Vue template and CSS.
- Game state updated using intervals and reactive `ref`.

---

## 🛠 Methods Overview

### SnakeGame Class

| Method | Description |
|--------|-------------|
| `constructor(gridWidth)` | Initializes the snake and food |
| `getSnake()` | Returns snake body |
| `getFood()` | Returns food coordinates |
| `checkPositionIsSnake(x, y)` | Checks if cell is part of the snake |
| `checkPositionIsSnakeHead(x, y)` | Checks if cell is the snake’s head |
| `checkPositionIsFood(x, y)` | Checks if cell has food |
| `moveSnake(snake, direction)` | Moves the snake and returns `{ reward, eat, lost, snake }` |
| `thisMoveSnake(direction)` | Updates the main snake state and places food if needed |
| `checkLose(snake)` | Checks for loss (collision or wall) |
| `AIMoveSnakeRandomMove()` | Chooses a random safe move |
| `AIMoveSnakeSelectBestCore()` | Chooses best move based on distance to food |
| `AIMoveSnakeSelectBest()` | Moves snake using best heuristic |
| `handleKey(e)` | Handles arrow key inputs |

### AI Functions

| Function | Description |
|----------|-------------|
| `getState(snake, food)` | Builds 8-element state vector |
| `AIQLAction()` | Main AI loop: chooses action, trains agent, updates game |

---

## 🚀 Getting Started

### 1. Clone the Repo

```bash
git clone https://github.com/your-username/vue-ai-snake.git
cd vue-ai-snake
npm install
npm run dev
