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
const linesLabel = document.querySelector("#linesLabel");
const optionButton = document.querySelector("#optionButton");
const optionsDialog = document.querySelector("#optionsDialog");
const resumeButton = document.querySelector("#resumeButton");
const restartButton = document.querySelector("#restartButton");
const quitButton = document.querySelector("#quitButton");
const gameOverOverlay = document.querySelector("#gameOverOverlay");
const retryButton = document.querySelector("#retryButton");
const gameOverMenuButton = document.querySelector("#gameOverMenuButton");
const resultTitle = document.querySelector("#resultTitle");
const finalScoreLabel = document.querySelector("#finalScoreLabel");
const finalLinesLabel = document.querySelector("#finalLinesLabel");

const modes = {
  endless: { label: "Endless", baseDropMs: 820, seedGarbage: false, targetLines: null, usesLevel: true },
  lines200: { label: "200 Lines", baseDropMs: 820, seedGarbage: false, targetLines: 200, usesLevel: true },
  cleanup: { label: "Clean Up", baseDropMs: 700, cleanup: true, targetLines: null, usesLevel: false },
  longLine: { label: "Long Line", baseDropMs: 620, seedGarbage: false, targetLines: null, usesLevel: false },
};

const cols = 10;
const rows = 20;
const cell = 30;
const lockDelayMs = 460;
const entryDelayMs = 120;
const lineClearDelayMs = 420;
const cleanupRiseDelayMs = 720;
const softDropMs = 44;
const previewCell = 18;
const pieceTypes = ["I", "O", "T", "S", "Z", "J", "L"];
const levelSpeedCurve = [
  820, 760, 700, 640, 590, 540, 500, 460, 430, 400,
  380, 360, 340, 320, 300, 285, 270, 255, 240, 225,
];

const colors = {
  I: "#53d7d2",
  O: "#f6d85a",
  T: "#a679d8",
  S: "#68c96b",
  Z: "#e4666d",
  J: "#5f83d7",
  L: "#e79a4f",
  G: "#8b98a4",
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
    [0, 0, 0],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
};

const fiveLineShapes = {
  ...shapes,
  I: [[1, 1, 1, 1, 1]],
};

const normalKickTable = {
  "0>1": [
    [0, 0],
    [-1, 0],
    [-1, -1],
    [0, 2],
    [-1, 2],
  ],
  "1>0": [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, -2],
    [1, -2],
  ],
  "1>2": [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, -2],
    [1, -2],
  ],
  "2>1": [
    [0, 0],
    [-1, 0],
    [-1, -1],
    [0, 2],
    [-1, 2],
  ],
  "2>3": [
    [0, 0],
    [1, 0],
    [1, -1],
    [0, 2],
    [1, 2],
  ],
  "3>2": [
    [0, 0],
    [-1, 0],
    [-1, 1],
    [0, -2],
    [-1, -2],
  ],
  "3>0": [
    [0, 0],
    [-1, 0],
    [-1, 1],
    [0, -2],
    [-1, -2],
  ],
  "0>3": [
    [0, 0],
    [1, 0],
    [1, -1],
    [0, 2],
    [1, 2],
  ],
};

const iKickTable = {
  "0>1": [
    [0, 0],
    [-2, 0],
    [1, 0],
    [-2, 1],
    [1, -2],
  ],
  "1>0": [
    [0, 0],
    [2, 0],
    [-1, 0],
    [2, -1],
    [-1, 2],
  ],
  "1>2": [
    [0, 0],
    [-1, 0],
    [2, 0],
    [-1, -2],
    [2, 1],
  ],
  "2>1": [
    [0, 0],
    [1, 0],
    [-2, 0],
    [1, 2],
    [-2, -1],
  ],
  "2>3": [
    [0, 0],
    [2, 0],
    [-1, 0],
    [2, -1],
    [-1, 2],
  ],
  "3>2": [
    [0, 0],
    [-2, 0],
    [1, 0],
    [-2, 1],
    [1, -2],
  ],
  "3>0": [
    [0, 0],
    [1, 0],
    [-2, 0],
    [1, 2],
    [-2, -1],
  ],
  "0>3": [
    [0, 0],
    [-1, 0],
    [2, 0],
    [-1, -2],
    [2, 1],
  ],
};

let board = createBoard();
let piece = null;
let nextQueue = [];
let holdType = "";
let holdUsed = false;
let score = 0;
let lines = 0;
let level = 1;
let comboCount = -1;
let backToBackActive = false;
let currentModeKey = "endless";
let paused = true;
let gameOver = false;
let lastTime = 0;
let dropCounter = 0;
let lockStart = 0;
let softDropActive = false;
let particles = [];
let clearSweeps = [];
let notices = [];
let pendingLineClear = null;
let pendingEntryDelay = null;
let pendingCleanupRise = null;
let pendingSpawnInput = { hold: false, rotate: 0 };
let touchState = null;

function createBoard() {
  return Array.from({ length: rows }, () => Array(cols).fill(""));
}

function cloneMatrix(matrix) {
  return matrix.map((row) => [...row]);
}

function activeShapes() {
  return currentModeKey === "longLine" ? fiveLineShapes : shapes;
}

function currentMode() {
  return modes[currentModeKey] ?? modes.endless;
}

function updateLevel() {
  const mode = currentMode();
  level = mode.usesLevel ? Math.floor(lines / 10) + 1 : 1;
  modeLabel.textContent = mode.usesLevel ? `${mode.label} Lv ${level}` : mode.label;
}

function currentDropMs() {
  const mode = currentMode();
  if (!mode.usesLevel) return mode.baseDropMs;
  return levelSpeedCurve[Math.min(level - 1, levelSpeedCurve.length - 1)];
}

function hasCleanupBlocks() {
  return board.some((row) => row.some((cellValue) => cellValue === "G"));
}

function makeCleanupRow() {
  const row = Array(cols).fill("G");
  const holes = 2 + Math.floor(Math.random() * 2);
  const holeColumns = new Set();

  while (holeColumns.size < holes) {
    holeColumns.add(Math.floor(Math.random() * cols));
  }

  holeColumns.forEach((x) => {
    row[x] = "";
  });

  return row;
}

function addCleanupRows(count) {
  if (board.slice(0, count).some((row) => row.some(Boolean))) {
    endGame();
    return false;
  }

  board = board.slice(count);
  for (let i = 0; i < count; i += 1) {
    board.push(makeCleanupRow());
  }

  return true;
}

function seedCleanupRows(count) {
  for (let y = rows - count; y < rows; y += 1) {
    board[y] = makeCleanupRow();
  }
}

function pieceFromType(type) {
  const matrix = activeShapes()[type];
  return {
    type,
    matrix: cloneMatrix(matrix),
    x: Math.floor(cols / 2) - Math.ceil(matrix[0].length / 2),
    y: 0,
    rotation: 0,
    tSpin: false,
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

function queueEntryDelay(duration = entryDelayMs) {
  piece = null;
  softDropActive = false;
  pendingEntryDelay = { age: 0, duration };
}

function bufferSpawnHold() {
  if (pendingLineClear || pendingEntryDelay || !piece) {
    pendingSpawnInput.hold = true;
    return true;
  }

  return false;
}

function bufferSpawnRotation(direction) {
  if (pendingLineClear || pendingEntryDelay || !piece) {
    pendingSpawnInput.rotate = direction;
    return true;
  }

  return false;
}

function spawnNextPiece() {
  pendingEntryDelay = null;
  piece = takeNextPiece();
  holdUsed = false;
  lockStart = 0;
  dropCounter = 0;

  if (collide(piece)) {
    endGame();
    return;
  }

  const buffered = { ...pendingSpawnInput };
  pendingSpawnInput = { hold: false, rotate: 0 };

  if (buffered.hold) holdPiece();
  if (!gameOver && buffered.rotate) rotatePiece(buffered.rotate);
}

function resetGame(modeKey = currentModeKey) {
  currentModeKey = modeKey;
  const mode = currentMode();
  board = createBoard();
  nextQueue = [];
  refillQueue();
  holdType = "";
  holdUsed = false;
  score = 0;
  lines = 0;
  level = 1;
  comboCount = -1;
  backToBackActive = false;
  piece = takeNextPiece();
  dropCounter = 0;
  lockStart = 0;
  softDropActive = false;
  particles = [];
  clearSweeps = [];
  notices = [];
  pendingLineClear = null;
  pendingEntryDelay = null;
  pendingCleanupRise = null;
  pendingSpawnInput = { hold: false, rotate: 0 };
  paused = false;
  gameOver = false;
  gameOverOverlay.hidden = true;
  resultTitle.textContent = "GAME OVER";
  updateLevel();
  scoreLabel.textContent = String(score);
  linesLabel.textContent = String(lines);

  if (mode.cleanup) seedCleanupRows(3);

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

function isCellBlocked(x, y) {
  return x < 0 || x >= cols || y >= rows || Boolean(board[y]?.[x]);
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

function completedRows() {
  return board.reduce((clearedRows, row, y) => {
    if (row.every(Boolean)) clearedRows.push(y);
    return clearedRows;
  }, []);
}

function applyLineClear(clearedRows) {
  board = board.filter((_, y) => !clearedRows.includes(y));

  while (board.length < rows) {
    board.unshift(Array(cols).fill(""));
  }

  lines += clearedRows.length;
  updateLevel();
  score += [0, 100, 300, 500, 800][clearedRows.length] ?? clearedRows.length * 250;
  scoreLabel.textContent = String(score);
  linesLabel.textContent = String(lines);
  return clearedRows.length;
}

function awardLineClearBonuses(cleared, wasTSpin) {
  const difficultClear = cleared >= 4 || wasTSpin;
  comboCount += 1;

  if (comboCount > 0) {
    score += comboCount * 50;
    notices.push({ text: `COMBO ${comboCount}`, age: 0, duration: 620 });
  }

  if (difficultClear) {
    if (backToBackActive) {
      score += 400;
      notices.push({ text: "BACK-TO-BACK", age: 0, duration: 760 });
    }
    backToBackActive = true;
  } else {
    backToBackActive = false;
  }

  if (board.every((row) => row.every((cellValue) => !cellValue))) {
    score += 1000;
    notices.push({ text: "PERFECT CLEAR", age: 0, duration: 920 });
  }

  scoreLabel.textContent = String(score);
}

function startLineClearDelay(clearedRows, wasTSpin) {
  pendingLineClear = {
    age: 0,
    duration: lineClearDelayMs,
    rows: clearedRows,
    wasTSpin,
  };
  clearedRows.forEach((row) => clearSweeps.push({ row, age: 0, duration: lineClearDelayMs }));
  piece = null;
  softDropActive = false;
}

function finishLineClearDelay() {
  if (!pendingLineClear) return;
  const { rows: clearedRows, wasTSpin } = pendingLineClear;
  pendingLineClear = null;
  const cleared = applyLineClear(clearedRows);

  if (wasTSpin) {
    score += [0, 800, 1200, 1600, 2000][cleared] ?? cleared * 600;
    scoreLabel.textContent = String(score);
    notices.push({ text: `T-SPIN x${cleared}`, age: 0, duration: 760 });
  }

  awardLineClearBonuses(cleared, wasTSpin);
  if (currentMode().targetLines && lines >= currentMode().targetLines) {
    completeGame();
    return;
  }

  if (currentMode().cleanup && !hasCleanupBlocks()) {
    startCleanupRiseDelay();
    return;
  }

  spawnNextPiece();
}

function startCleanupRiseDelay() {
  score += 500;
  scoreLabel.textContent = String(score);
  notices.push({ text: "CLEAN", age: 0, duration: 840 });
  pendingCleanupRise = { age: 0, duration: cleanupRiseDelayMs, rows: 2 };
  piece = null;
  softDropActive = false;
}

function finishCleanupRiseDelay() {
  if (!pendingCleanupRise) return;
  const { rows: rowCount } = pendingCleanupRise;
  pendingCleanupRise = null;

  if (addCleanupRows(rowCount)) {
    notices.push({ text: "NEW FLOOR", age: 0, duration: 760 });
    spawnNextPiece();
  }
}

function lockPiece() {
  if (!piece || gameOver) return;
  const landedCells = pieceCells();
  const landedColor = colors[piece.type];
  const wasTSpin = piece.tSpin;
  mergePiece();
  spawnLockParticles(landedCells, landedColor);
  const clearedRows = completedRows();

  if (clearedRows.length) {
    startLineClearDelay(clearedRows, wasTSpin);
    return;
  }

  if (wasTSpin) {
    score += 400;
    scoreLabel.textContent = String(score);
    notices.push({ text: "T-SPIN", age: 0, duration: 760 });
  }

  comboCount = -1;
  queueEntryDelay();
}

function rotateMatrix(matrix, direction) {
  if (direction > 0) {
    return matrix[0].map((_, index) => matrix.map((row) => row[index]).reverse());
  }

  return matrix[0].map((_, index) => matrix.map((row) => row[row.length - 1 - index]));
}

function kickTableFor(target) {
  if (target.type === "O") return [[0, 0]];
  if (target.type === "I" && currentModeKey !== "longLine") return iKickTable;
  return normalKickTable;
}

function kicksFor(target, from, to) {
  const table = kickTableFor(target);
  const base = Array.isArray(table) ? table : table[`${from}>${to}`] ?? [[0, 0]];

  if (target.type !== "T") return base;

  const forgivingTSpinKicks = [
    [0, -1],
    [-1, -1],
    [1, -1],
    [0, -2],
    [-1, -2],
    [1, -2],
    [-2, 0],
    [2, 0],
    [-2, -1],
    [2, -1],
  ];
  const seen = new Set();
  return [...base, ...forgivingTSpinKicks].filter(([dx, dy]) => {
    const key = `${dx},${dy}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function detectTSpin(target) {
  if (target.type !== "T") return false;
  const centerX = target.x + 1;
  const centerY = target.y + 1;
  const corners = [
    [centerX - 1, centerY - 1],
    [centerX + 1, centerY - 1],
    [centerX - 1, centerY + 1],
    [centerX + 1, centerY + 1],
  ];

  return corners.filter(([x, y]) => isCellBlocked(x, y)).length >= 3;
}

function rotatePiece(direction) {
  if (paused || gameOver) return;
  if (!piece) {
    bufferSpawnRotation(direction);
    return;
  }
  const rotated = rotateMatrix(piece.matrix, direction);
  const from = piece.rotation ?? 0;
  const to = (from + (direction > 0 ? 1 : 3)) % 4;

  for (const [dx, dy] of kicksFor(piece, from, to)) {
    const candidate = {
      ...piece,
      matrix: rotated,
      x: piece.x + dx,
      y: piece.y + dy,
      rotation: to,
    };
    if (!collide(candidate)) {
      piece = {
        ...candidate,
        tSpin: detectTSpin(candidate),
      };
      lockStart = touchingGround() ? performance.now() : 0;
      return;
    }
  }
}

function movePiece(dx) {
  if (!piece || paused || gameOver) return;
  const candidate = { ...piece, x: piece.x + dx };
  if (!collide(candidate)) {
    piece = { ...candidate, tSpin: false };
    lockStart = touchingGround() ? performance.now() : 0;
  }
}

function moveDown(forceLock = false) {
  if (!piece || paused || gameOver) return;
  const candidate = { ...piece, y: piece.y + 1 };

  if (!collide(candidate)) {
    piece = { ...candidate, tSpin: false };
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
  let dropped = 0;
  while (!collide({ ...piece, y: piece.y + 1 })) {
    piece.y += 1;
    dropped += 1;
    score += 2;
  }
  if (dropped) piece.tSpin = false;
  scoreLabel.textContent = String(score);
  lockPiece();
}

function holdPiece() {
  if (paused || gameOver) return;
  if (!piece) {
    bufferSpawnHold();
    return;
  }
  if (holdUsed) return;

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

function showResult(title) {
  gameOver = true;
  paused = true;
  softDropActive = false;
  pendingEntryDelay = null;
  pendingLineClear = null;
  pendingCleanupRise = null;
  resultTitle.textContent = title;
  finalScoreLabel.textContent = String(score);
  finalLinesLabel.textContent = String(lines);
  gameOverOverlay.hidden = false;
}

function endGame() {
  showResult("GAME OVER");
}

function completeGame() {
  score += 5000;
  scoreLabel.textContent = String(score);
  notices.push({ text: "CLEAR", age: 0, duration: 1200 });
  showResult("CLEAR");
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

function drawCleanupRise(delta) {
  if (!pendingCleanupRise) return;
  const t = Math.min(1, pendingCleanupRise.age / pendingCleanupRise.duration);
  const height = cell * pendingCleanupRise.rows * (0.45 + t * 0.55);
  const y = canvas.height - height;
  const gradient = ctx.createLinearGradient(0, y, 0, canvas.height);
  gradient.addColorStop(0, "rgba(221,246,255,0)");
  gradient.addColorStop(0.48, "rgba(221,246,255,0.2)");
  gradient.addColorStop(1, "rgba(139,152,164,0.46)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, y, canvas.width, height);
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

function drawNotices(delta) {
  notices = notices.filter((notice) => {
    notice.age += delta;
    const t = Math.min(1, notice.age / notice.duration);
    const alpha = Math.sin((1 - t) * Math.PI * 0.5);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#f6d85a";
    ctx.font = "900 28px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0,0,0,0.7)";
    ctx.shadowBlur = 8;
    ctx.fillText(notice.text, canvas.width / 2, canvas.height * 0.42 - t * 30);
    ctx.restore();
    return notice.age < notice.duration;
  });
}

function drawPreview(context, type, yOffset = 0) {
  if (!type) return;
  const matrix = activeShapes()[type];
  const filled = matrix.flatMap((row, y) =>
    row.map((value, x) => (value ? { x, y } : null)).filter(Boolean),
  );
  const minX = Math.min(...filled.map((cell) => cell.x));
  const maxX = Math.max(...filled.map((cell) => cell.x));
  const minY = Math.min(...filled.map((cell) => cell.y));
  const maxY = Math.max(...filled.map((cell) => cell.y));
  const width = (maxX - minX + 1) * previewCell;
  const height = (maxY - minY + 1) * previewCell;
  const startX = Math.floor((context.canvas.width - width) / 2);
  const startY = yOffset + Math.floor((52 - height) / 2);

  filled.forEach(({ x, y }) => {
    drawBlock(
      context,
      startX + (x - minX) * previewCell,
      startY + (y - minY) * previewCell,
      previewCell,
      colors[type],
    );
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
  drawCleanupRise(delta);
  drawParticles(delta);
  drawNotices(delta);
  drawPreviews();
}

function update(time = 0) {
  const delta = Math.min(64, time - lastTime);
  lastTime = time;

  if (!paused && !gameOver) {
    if (pendingLineClear) {
      pendingLineClear.age += delta;
      if (pendingLineClear.age >= pendingLineClear.duration) {
        finishLineClearDelay();
      }
      draw(delta);
      requestAnimationFrame(update);
      return;
    }

    if (pendingEntryDelay) {
      pendingEntryDelay.age += delta;
      if (pendingEntryDelay.age >= pendingEntryDelay.duration) {
        spawnNextPiece();
      }
      draw(delta);
      requestAnimationFrame(update);
      return;
    }

    if (pendingCleanupRise) {
      pendingCleanupRise.age += delta;
      if (pendingCleanupRise.age >= pendingCleanupRise.duration) {
        finishCleanupRiseDelay();
      }
      draw(delta);
      requestAnimationFrame(update);
      return;
    }

    const interval = softDropActive ? softDropMs : currentDropMs();
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
  resultTitle.textContent = "GAME OVER";
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

resetGame("endless");
paused = true;
requestAnimationFrame(update);
