const titleScreen = document.querySelector("#titleScreen");
const gameScreen = document.querySelector("#gameScreen");
const gameStage = document.querySelector("#gameStage");
const canvas = document.querySelector("#gameCanvas");
const ctx = canvas.getContext("2d");
const holdCanvas = document.querySelector("#holdCanvas");
const holdCtx = holdCanvas.getContext("2d");
const nextCanvas = document.querySelector("#nextCanvas");
const nextCtx = nextCanvas.getContext("2d");
const modeLabel = document.querySelector("#modeLabel");
const scoreLabel = document.querySelector("#scoreLabel");
const goalLabel = document.querySelector("#goalLabel");
const optionButton = document.querySelector("#optionButton");
const optionsDialog = document.querySelector("#optionsDialog");
const resumeButton = document.querySelector("#resumeButton");
const restartButton = document.querySelector("#restartButton");
const quitButton = document.querySelector("#quitButton");
const gameOverOverlay = document.querySelector("#gameOverOverlay");
const retryButton = document.querySelector("#retryButton");
const gameOverMenuButton = document.querySelector("#gameOverMenuButton");
const finalScoreLabel = document.querySelector("#finalScoreLabel");
const finalLinesLabel = document.querySelector("#finalLinesLabel");

const modes = {
  classic: { label: "Classic", dropMs: 820, seedGarbage: false, goal: null },
  stage: { label: "Stage 1", dropMs: 700, seedGarbage: true, goal: 10 },
  arcade: { label: "5-Line", dropMs: 620, seedGarbage: false, goal: 40 },
};

const cols = 10;
const rows = 20;
const cell = 30;
const lockDelayMs = 460;
const softDropMs = 44;
const previewCell = 18;
const pieceTypes = ["I", "O", "T", "S", "Z", "J", "L"];

const colors = {
  I: "#53d7d2",
  O: "#f6d85a",
  T: "#a679d8",
  S: "#68c96b",
  Z: "#e4666d",
  J: "#5f83d7",
  L: "#e79a4f",
};

const shapes = {
  I: [[1, 1, 1, 1]],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
  ],
};

const fiveLineShapes = {
  ...shapes,
  I: [[1, 1, 1, 1, 1]],
};

let board = createBoard();
let piece = null;
let nextQueue = [];
let holdType = "";
let holdUsed = false;
let score = 0;
let lines = 0;
let currentModeKey = "classic";
let paused = true;
let gameOver = false;
let lastTime = 0;
let dropCounter = 0;
let lockStart = 0;
let softDropActive = false;
let particles = [];
let clearSweeps = [];
let touchState = null;

function createBoard() {
  return Array.from({ length: rows }, () => Array(cols).fill(""));
}

function cloneMatrix(matrix) {
  return matrix.map((row) => [...row]);
}

function activeShapes() {
  return currentModeKey === "arcade" ? fiveLineShapes : shapes;
}

function pieceFromType(type) {
  const matrix = activeShapes()[type];
  return {
    type,
    matrix: cloneMatrix(matrix),
    x: Math.floor(cols / 2) - Math.ceil(matrix[0].length / 2),
    y: 0,
  };
}

function shuffledBag() {
  const bag = [...pieceTypes];
  for (let i = bag.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

function refillQueue() {
  while (nextQueue.length < 5) {
    nextQueue.push(...shuffledBag());
  }
}

function takeNextPiece() {
  refillQueue();
  const next = nextQueue.shift();
  refillQueue();
  return pieceFromType(next);
}

function resetGame(modeKey = currentModeKey) {
  currentModeKey = modeKey;
  const mode = modes[currentModeKey] ?? modes.classic;
  board = createBoard();
  nextQueue = [];
  refillQueue();
  holdType = "";
  holdUsed = false;
  score = 0;
  lines = 0;
  piece = takeNextPiece();
  dropCounter = 0;
  lockStart = 0;
  softDropActive = false;
  particles = [];
  clearSweeps = [];
  paused = false;
  gameOver = false;
  gameOverOverlay.hidden = true;
  modeLabel.textContent = mode.label;
  scoreLabel.textContent = String(score);
  goalLabel.textContent = mode.goal ? String(mode.goal) : "--";

  if (mode.seedGarbage) {
    for (let y = rows - 3; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        board[y][x] = Math.random() > 0.22 ? "Z" : "";
      }
    }
  }

  if (collide(piece)) {
    endGame();
  }
}

function collide(testPiece = piece) {
  return testPiece.matrix.some((row, y) =>
    row.some((value, x) => {
      if (!value) return false;
      const boardY = testPiece.y + y;
      const boardX = testPiece.x + x;
      return boardX < 0 || boardX >= cols || boardY >= rows || board[boardY]?.[boardX];
    }),
  );
}

function pieceCells(target = piece) {
  const cells = [];
  target.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) cells.push({ x: target.x + x, y: target.y + y });
    });
  });
  return cells;
}

function touchingGround() {
  return collide({ ...piece, y: piece.y + 1 });
}

function mergePiece() {
  pieceCells().forEach(({ x, y }) => {
    if (board[y]) board[y][x] = piece.type;
  });
}

function spawnLockParticles(cells, color) {
  cells.forEach(({ x, y }) => {
    for (let i = 0; i < 5; i += 1) {
      particles.push({
        x: (x + 0.5) * cell,
        y: (y + 0.5) * cell,
        vx: (Math.random() - 0.5) * 130,
        vy: -40 - Math.random() * 140,
        life: 360 + Math.random() * 220,
        maxLife: 580,
        size: 2 + Math.random() * 3.5,
        color,
      });
    }
  });
}

function clearLines() {
  const clearedRows = [];
  board.forEach((row, y) => {
    if (row.every(Boolean)) clearedRows.push(y);
  });

  if (!clearedRows.length) return;

  clearedRows.forEach((row) => clearSweeps.push({ row, age: 0, duration: 430 }));
  board = board.filter((_, y) => !clearedRows.includes(y));

  while (board.length < rows) {
    board.unshift(Array(cols).fill(""));
  }

  lines += clearedRows.length;
  score += [0, 100, 300, 500, 800][clearedRows.length] ?? clearedRows.length * 250;
  scoreLabel.textContent = String(score);
}

function lockPiece() {
  if (!piece || gameOver) return;
  const landedCells = pieceCells();
  const landedColor = colors[piece.type];
  mergePiece();
  spawnLockParticles(landedCells, landedColor);
  clearLines();
  piece = takeNextPiece();
  holdUsed = false;
  lockStart = 0;
  dropCounter = 0;

  if (collide(piece)) {
    endGame();
  }
}

function rotateMatrix(matrix, direction) {
  if (direction > 0) {
    return matrix[0].map((_, index) => matrix.map((row) => row[index]).reverse());
  }

  return matrix[0].map((_, index) => matrix.map((row) => row[row.length - 1 - index]));
}

function rotatePiece(direction) {
  if (!piece || paused || gameOver) return;
  const rotated = rotateMatrix(piece.matrix, direction);
  const offsets = [0, -1, 1, -2, 2];

  for (const offset of offsets) {
    const candidate = { ...piece, matrix: rotated, x: piece.x + offset };
    if (!collide(candidate)) {
      piece = candidate;
      lockStart = touchingGround() ? performance.now() : 0;
      return;
    }
  }
}

function movePiece(dx) {
  if (!piece || paused || gameOver) return;
  const candidate = { ...piece, x: piece.x + dx };
  if (!collide(candidate)) {
    piece = candidate;
    lockStart = touchingGround() ? performance.now() : 0;
  }
}

function moveDown(forceLock = false) {
  if (!piece || paused || gameOver) return;
  const candidate = { ...piece, y: piece.y + 1 };

  if (!collide(candidate)) {
    piece = candidate;
    lockStart = 0;
    return;
  }

  if (forceLock) {
    lockPiece();
    return;
  }

  if (!lockStart) lockStart = performance.now();
}

function hardDrop() {
  if (!piece || paused || gameOver) return;
  while (!collide({ ...piece, y: piece.y + 1 })) {
    piece.y += 1;
    score += 2;
  }
  scoreLabel.textContent = String(score);
  lockPiece();
}

function holdPiece() {
  if (!piece || paused || gameOver || holdUsed) return;

  const outgoing = piece.type;
  if (holdType) {
    piece = pieceFromType(holdType);
    holdType = outgoing;
  } else {
    holdType = outgoing;
    piece = takeNextPiece();
  }

  holdUsed = true;
  lockStart = 0;

  if (collide(piece)) {
    endGame();
  }
}

function endGame() {
  gameOver = true;
  paused = true;
  softDropActive = false;
  finalScoreLabel.textContent = String(score);
  finalLinesLabel.textContent = String(lines);
  gameOverOverlay.hidden = false;
}

function drawBlock(context, x, y, size, color, alpha = 1) {
  context.save();
  context.globalAlpha = alpha;
  context.fillStyle = color;
  context.fillRect(x + 1, y + 1, size - 2, size - 2);
  context.fillStyle = "rgba(255,255,255,0.34)";
  context.fillRect(x + 3, y + 3, size - 6, Math.max(2, size * 0.18));
  context.fillStyle = "rgba(0,0,0,0.22)";
  context.fillRect(x + size - 5, y + 4, 2, size - 8);
  context.restore();
}

function drawCell(x, y, type, alpha = 1) {
  drawBlock(ctx, x * cell, y * cell, cell, colors[type], alpha);
}

function drawBoardGrid() {
  ctx.fillStyle = "#0c1b2b";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(185, 233, 243, 0.14)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= cols; x += 1) {
    ctx.beginPath();
    ctx.moveTo(x * cell + 0.5, 0);
    ctx.lineTo(x * cell + 0.5, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= rows; y += 1) {
    ctx.beginPath();
    ctx.moveTo(0, y * cell + 0.5);
    ctx.lineTo(canvas.width, y * cell + 0.5);
    ctx.stroke();
  }

  const glow = ctx.createRadialGradient(150, 330, 30, 150, 330, 260);
  glow.addColorStop(0, "rgba(221,246,255,0.07)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawGhost() {
  if (!piece) return;
  const ghost = { ...piece, matrix: cloneMatrix(piece.matrix) };
  while (!collide({ ...ghost, y: ghost.y + 1 })) {
    ghost.y += 1;
  }
  pieceCells(ghost).forEach(({ x, y }) => drawCell(x, y, piece.type, 0.22));
}

function drawClearSweeps(delta) {
  clearSweeps = clearSweeps.filter((sweep) => {
    sweep.age += delta;
    const t = Math.min(1, sweep.age / sweep.duration);
    const width = canvas.width * (0.26 + t * 1.2);
    const x = -canvas.width * 0.22 + canvas.width * t;
    const y = sweep.row * cell;
    const gradient = ctx.createLinearGradient(x, y, x + width, y);
    gradient.addColorStop(0, "rgba(255,255,255,0)");
    gradient.addColorStop(0.42, "rgba(255,255,255,0.95)");
    gradient.addColorStop(0.66, "rgba(255,232,104,0.85)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y + 3, width, cell - 6);
    return sweep.age < sweep.duration;
  });
}

function drawParticles(delta) {
  particles = particles.filter((particle) => {
    particle.life -= delta;
    particle.vy += 360 * (delta / 1000);
    particle.x += particle.vx * (delta / 1000);
    particle.y += particle.vy * (delta / 1000);
    const alpha = Math.max(0, particle.life / particle.maxLife);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;
    ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
    ctx.globalAlpha = 1;
    return particle.life > 0;
  });
}

function drawPreview(context, type, yOffset = 0) {
  if (!type) return;
  const matrix = activeShapes()[type];
  const width = matrix[0].length * previewCell;
  const height = matrix.length * previewCell;
  const startX = Math.floor((context.canvas.width - width) / 2);
  const startY = yOffset + Math.floor((52 - height) / 2);

  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) drawBlock(context, startX + x * previewCell, startY + y * previewCell, previewCell, colors[type]);
    });
  });
}

function drawPreviews() {
  holdCtx.clearRect(0, 0, holdCanvas.width, holdCanvas.height);
  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  drawPreview(holdCtx, holdType, 8);
  nextQueue.slice(0, 3).forEach((type, index) => drawPreview(nextCtx, type, 6 + index * 48));
}

function draw(delta = 0) {
  drawBoardGrid();

  board.forEach((row, y) => {
    row.forEach((type, x) => {
      if (type) drawCell(x, y, type);
    });
  });

  drawGhost();

  if (piece) {
    pieceCells().forEach(({ x, y }) => drawCell(x, y, piece.type));
  }

  drawClearSweeps(delta);
  drawParticles(delta);
  drawPreviews();
}

function update(time = 0) {
  const delta = Math.min(64, time - lastTime);
  lastTime = time;

  if (!paused && !gameOver) {
    const interval = softDropActive ? softDropMs : (modes[currentModeKey] ?? modes.classic).dropMs;
    dropCounter += delta;
    if (dropCounter > interval) {
      moveDown(false);
      dropCounter = 0;
    }

    if (piece && touchingGround()) {
      if (!lockStart) lockStart = time;
      if (time - lockStart > lockDelayMs) lockPiece();
    }
  }

  draw(delta);
  requestAnimationFrame(update);
}

function startMode(modeKey) {
  resetGame(modeKey);
  titleScreen.classList.remove("is-active");
  gameScreen.classList.add("is-active");
}

function returnToTitle() {
  paused = true;
  gameOver = false;
  gameOverOverlay.hidden = true;
  optionsDialog.close();
  gameScreen.classList.remove("is-active");
  titleScreen.classList.add("is-active");
}

document.querySelectorAll("[data-mode]").forEach((button) => {
  button.addEventListener("click", () => startMode(button.dataset.mode));
});

optionButton.addEventListener("click", () => {
  if (gameOver) return;
  paused = true;
  softDropActive = false;
  optionsDialog.showModal();
});

optionsDialog.addEventListener("close", () => {
  if (!gameOver && gameScreen.classList.contains("is-active")) {
    paused = false;
  }
});

resumeButton.addEventListener("click", () => {
  paused = false;
  optionsDialog.close();
});

restartButton.addEventListener("click", () => {
  resetGame(currentModeKey);
  optionsDialog.close();
});

quitButton.addEventListener("click", returnToTitle);
retryButton.addEventListener("click", () => resetGame(currentModeKey));
gameOverMenuButton.addEventListener("click", returnToTitle);

gameStage.addEventListener("pointerdown", (event) => {
  if (paused || gameOver) return;
  gameStage.setPointerCapture(event.pointerId);
  touchState = {
    id: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    lastX: event.clientX,
    horizontalActive: false,
    moved: false,
  };
});

gameStage.addEventListener("pointermove", (event) => {
  if (!touchState || event.pointerId !== touchState.id || paused || gameOver) return;
  const totalX = event.clientX - touchState.startX;
  const totalDy = event.clientY - touchState.startY;
  const absTotalX = Math.abs(totalX);
  const absTotalY = Math.abs(totalDy);
  const startThresholdPx = 42;
  const stepPx = 30;

  if (!touchState.horizontalActive && absTotalX >= startThresholdPx && absTotalX > absTotalY * 1.15) {
    touchState.horizontalActive = true;
    touchState.lastX = touchState.startX + Math.sign(totalX) * startThresholdPx;
    movePiece(Math.sign(totalX));
    touchState.moved = true;
  }

  if (touchState.horizontalActive) {
    const dx = event.clientX - touchState.lastX;
    const steps = Math.trunc(dx / stepPx);
    for (let i = 0; i < Math.abs(steps); i += 1) {
      movePiece(Math.sign(steps));
    }
    if (steps) {
      touchState.lastX += steps * stepPx;
      touchState.moved = true;
    }
  }

  softDropActive = totalDy > 22 && absTotalY > absTotalX * 0.85;
  if (softDropActive) touchState.moved = true;
});

gameStage.addEventListener("pointerup", (event) => {
  if (!touchState || event.pointerId !== touchState.id) return;
  const dx = event.clientX - touchState.startX;
  const dy = event.clientY - touchState.startY;
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  const rect = gameStage.getBoundingClientRect();
  softDropActive = false;

  if (!paused && !gameOver) {
    if (dy > 58 && absY > absX * 1.15) {
      hardDrop();
    } else if (dy < -54 && absY > absX * 1.05) {
      holdPiece();
    } else if (absX < 12 && absY < 12 && !touchState.moved) {
      rotatePiece(event.clientX < rect.left + rect.width / 2 ? -1 : 1);
    }
  }

  touchState = null;
});

gameStage.addEventListener("pointercancel", () => {
  softDropActive = false;
  touchState = null;
});

window.addEventListener("keydown", (event) => {
  if (paused || gameOver) return;
  if (event.key === "ArrowLeft") movePiece(-1);
  if (event.key === "ArrowRight") movePiece(1);
  if (event.key === "ArrowUp") rotatePiece(1);
  if (event.key === "z" || event.key === "Z") rotatePiece(-1);
  if (event.key === "ArrowDown") moveDown(false);
  if (event.key === " ") hardDrop();
  if (event.key === "Shift") holdPiece();
});

document.addEventListener(
  "touchmove",
  (event) => {
    if (gameScreen.classList.contains("is-active")) event.preventDefault();
  },
  { passive: false },
);

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").then((registration) => registration.update());
}

resetGame("classic");
paused = true;
requestAnimationFrame(update);
