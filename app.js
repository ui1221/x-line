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
const blastGauge = document.querySelector("#blastGauge");
const blastGaugeFill = document.querySelector("#blastGaugeFill");
const blastGaugeLabel = document.querySelector("#blastGaugeLabel");
const titleOptionsButton = document.querySelector("#titleOptionsButton");
const optionButton = document.querySelector("#optionButton");
const optionsDialog = document.querySelector("#optionsDialog");
const colorSchemeInputs = document.querySelectorAll("input[name='colorScheme']");
const resumeButton = document.querySelector("#resumeButton");
const restartButton = document.querySelector("#restartButton");
const quitButton = document.querySelector("#quitButton");
const gameOverOverlay = document.querySelector("#gameOverOverlay");
const retryButton = document.querySelector("#retryButton");
const gameOverMenuButton = document.querySelector("#gameOverMenuButton");
const resultTitle = document.querySelector("#resultTitle");
const finalScoreLabel = document.querySelector("#finalScoreLabel");
const finalLinesLabel = document.querySelector("#finalLinesLabel");
const achievementBannerStack = document.querySelector("#achievementBannerStack");
const achievementButton = document.querySelector("#achievementButton");
const achievementsDialog = document.querySelector("#achievementsDialog");
const achievementCloseButton = document.querySelector("#achievementCloseButton");
const achievementGrid = document.querySelector("#achievementGrid");
const achievementSummary = document.querySelector("#achievementSummary");
const achievementProgressText = document.querySelector("#achievementProgressText");
const totalPlayTimeLabel = document.querySelector("#totalPlayTimeLabel");
const averagePlayTimeLabel = document.querySelector("#averagePlayTimeLabel");
const achievementDetailIcon = document.querySelector("#achievementDetailIcon");
const achievementDetailTitle = document.querySelector("#achievementDetailTitle");
const achievementDetailDescription = document.querySelector("#achievementDetailDescription");
const achievementDetailMeta = document.querySelector("#achievementDetailMeta");

const modes = {
  endless: { label: "Endless", baseDropMs: 820, seedGarbage: false, targetLines: null, usesLevel: true },
  lines200: { label: "200 Lines", baseDropMs: 820, seedGarbage: false, targetLines: 200, usesLevel: true },
  cleanup: { label: "Clean Up", baseDropMs: 700, cleanup: true, targetLines: null, usesLevel: false },
  longLine: { label: "Long Line", baseDropMs: 620, seedGarbage: false, targetLines: null, usesLevel: false },
  blast: { label: "Blast", baseDropMs: 700, blast: true, targetLines: null, usesLevel: true, speedCurve: "blast" },
};

const modeAchievementLabels = {
  endless: { label: "Endless", icon: "E", image: "assets/modes/endless.png" },
  lines200: { label: "200 Lines", icon: "200", image: "assets/modes/lines200.png" },
  cleanup: { label: "Clean Up", icon: "C", image: "assets/modes/cleanup.png" },
  longLine: { label: "Long Line", icon: "L", image: "assets/modes/longline.png" },
  blast: { label: "Blast", icon: "B", image: "assets/modes/blast.png" },
};
const achievementImages = {
  days: "assets/achievements/play-days.png",
  lines: "assets/modes/lines200.png",
  cleanup: "assets/modes/cleanup.png",
  zero: "assets/achievements/zero-clear.png",
};
const achievementStorageKey = "x-line-achievements-v1";
const colorSchemeStorageKey = "x-line-color-scheme-v1";
const playDayAchievementTiers = [1, 3, 7, 15, 30, 60, 77, 100];
const modePlayAchievementTiers = [1, 3, 5, 10, 20, 30, 40, 50];
const totalLineAchievementTiers = [1, 10, 25, 50, 100, 250, 500, 1000, 2000, 3000, 5000, 7500, 9999];
const cleanupLineAchievementTiers = [1, 10, 25, 50, 100, 150, 200, 300];
const blastGaugeAchievementTiers = [1, 3, 5, 10, 20, 30, 50, 75, 100];
const playtimeSaveIntervalMs = 5000;

const cols = 10;
const rows = 20;
const cell = 30;
const lockDelayMs = 460;
const entryDelayMs = 120;
const lineClearDelayMs = 420;
const cleanupRiseDelayMs = 720;
const softDropMs = 44;
const previewCell = 18;
const blastHighStackRate = 0.5;
const blastLineGain = 2;
const blastHardDropGain = 0.08;
const blastSoftDropGain = 0.05;
const blastGaugeWarningThreshold = 80;
const pieceTypes = ["I", "O", "T", "S", "Z", "J", "L"];
const levelSpeedCurve = [
  820, 760, 700, 640, 590, 540, 500, 460, 430, 400,
  380, 360, 340, 320, 300, 285, 270, 255, 240, 225,
];
const blastLevelSpeedCurve = [
  700, 670, 640, 610, 580, 550, 525, 500, 475, 450,
  430, 410, 390, 370, 350, 335, 320, 305, 290, 275,
];

const colorSchemes = {
  classic: {
    label: "Classic",
    colors: {
      I: "#53d7d2",
      O: "#f6d85a",
      T: "#a679d8",
      S: "#68c96b",
      Z: "#e4666d",
      J: "#5f83d7",
      L: "#e79a4f",
      G: "#8b98a4",
      B: "#ffb238",
    },
  },
  colorA: {
    label: "Color A",
    colors: {
      I: "#56b4e9",
      O: "#f0e442",
      T: "#cc79a7",
      S: "#009e73",
      Z: "#d55e00",
      J: "#0072b2",
      L: "#e69f00",
      G: "#8b98a4",
      B: "#ffb238",
    },
  },
};

let currentColorSchemeKey = loadColorSchemeKey();
let colors = colorSchemes[currentColorSchemeKey].colors;

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
let blastCharge = 0;
let blastBursts = [];
let currentRunLines = 0;
let selectedAchievementId = "";
let playtimeUnsavedMs = 0;
let pendingAchievementUnlocks = [];
let gameHistoryGuardActive = false;

function createBoard() {
  return Array.from({ length: rows }, () => Array(cols).fill(""));
}

function cloneMatrix(matrix) {
  return matrix.map((row) => [...row]);
}

function loadColorSchemeKey() {
  try {
    const saved = localStorage.getItem(colorSchemeStorageKey);
    return colorSchemes[saved] ? saved : "classic";
  } catch {
    return "classic";
  }
}

function updateColorSchemeInputs() {
  colorSchemeInputs.forEach((input) => {
    input.checked = input.value === currentColorSchemeKey;
  });
}

function applyColorScheme(key, save = true) {
  if (!colorSchemes[key]) return;
  currentColorSchemeKey = key;
  colors = colorSchemes[key].colors;
  updateColorSchemeInputs();

  if (save) {
    try {
      localStorage.setItem(colorSchemeStorageKey, key);
    } catch {
      // The selected palette still applies for this session if storage is unavailable.
    }
  }

  draw(0);
}

function buildAchievements() {
  const definitions = [
    ...playDayAchievementTiers.map((tier) => ({
      id: `play_days_${tier}`,
      icon: "D",
      title: `${tier} Days`,
      description: `${tier}日プレイする`,
      metric: "playDays",
      target: tier,
      image: achievementImages.days,
      badge: `${tier}d`,
    })),
    ...totalLineAchievementTiers.map((tier) => ({
      id: `total_lines_${tier}`,
      icon: "LN",
      title: `${tier} Lines`,
      description: `合計${tier}ライン消す`,
      metric: "totalLines",
      target: tier,
      image: achievementImages.lines,
      badge: String(tier),
    })),
    ...cleanupLineAchievementTiers.map((tier) => ({
      id: `cleanup_lines_${tier}`,
      icon: "CL",
      title: `Clean ${tier}`,
      description: `お邪魔ブロックを含むラインを${tier}ライン消す`,
      metric: "cleanupLines",
      target: tier,
      image: achievementImages.cleanup,
      badge: String(tier),
    })),
    ...blastGaugeAchievementTiers.map((tier) => ({
      id: `blast_gauge_${tier}`,
      icon: "B",
      title: `Blast Gauge x${tier}`,
      description: `Blastゲージを${tier}回ためる`,
      metric: "blastGaugeFills",
      target: tier,
      image: modeAchievementLabels.blast.image,
      badge: String(tier),
    })),
    {
      id: "no_clear_game_over",
      icon: "0",
      title: "Zero Clear",
      description: "一度もラインを消せずにゲームオーバーになる",
      metric: "noClearGameOvers",
      target: 1,
      image: achievementImages.zero,
      badge: "0",
    },
  ];

  Object.entries(modeAchievementLabels).forEach(([modeKey, mode]) => {
    modePlayAchievementTiers.forEach((tier) => {
      definitions.push({
        id: `mode_${modeKey}_${tier}`,
        icon: mode.icon,
        title: `${mode.label} x${tier}`,
        description: `${mode.label}を${tier}回遊ぶ`,
        metric: "modePlays",
        modeKey,
        target: tier,
        image: mode.image,
        badge: String(tier),
      });
    });
  });

  return definitions;
}

function defaultAchievementState() {
  return {
    playDates: [],
    totalLines: 0,
    cleanupLines: 0,
    blastGaugeFills: 0,
    totalPlayMs: 0,
    dailyPlayMs: {},
    modePlays: Object.fromEntries(Object.keys(modes).map((modeKey) => [modeKey, 0])),
    noClearGameOvers: 0,
    unlocked: {},
  };
}

function loadAchievementState() {
  const fallback = defaultAchievementState();

  try {
    const saved = JSON.parse(localStorage.getItem(achievementStorageKey) || "{}");
    return {
      ...fallback,
      ...saved,
      playDates: Array.isArray(saved.playDates) ? saved.playDates : fallback.playDates,
      blastGaugeFills: Number(saved.blastGaugeFills) || 0,
      totalPlayMs: Number(saved.totalPlayMs) || 0,
      dailyPlayMs: saved.dailyPlayMs || fallback.dailyPlayMs,
      modePlays: { ...fallback.modePlays, ...(saved.modePlays || {}) },
      unlocked: saved.unlocked || fallback.unlocked,
    };
  } catch {
    return fallback;
  }
}

function saveAchievementState() {
  try {
    localStorage.setItem(achievementStorageKey, JSON.stringify(achievementState));
  } catch {
    // Achievements can still work for the current session if storage is unavailable.
  }
}

function todayKey() {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatDateTime(value) {
  if (!value) return "未取得";
  return new Date(value).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatDuration(ms) {
  const totalMinutes = Math.floor(ms / 60000);
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
}

function achievementProgress(definition) {
  if (definition.metric === "playDays") return achievementState.playDates.length;
  if (definition.metric === "totalLines") return achievementState.totalLines;
  if (definition.metric === "cleanupLines") return achievementState.cleanupLines;
  if (definition.metric === "blastGaugeFills") return achievementState.blastGaugeFills;
  if (definition.metric === "modePlays") return achievementState.modePlays[definition.modeKey] || 0;
  if (definition.metric === "noClearGameOvers") return achievementState.noClearGameOvers;
  return 0;
}

function checkAchievements() {
  let changed = false;

  achievements.forEach((definition) => {
    if (!achievementState.unlocked[definition.id] && achievementProgress(definition) >= definition.target) {
      achievementState.unlocked[definition.id] = new Date().toISOString();
      pendingAchievementUnlocks.push(definition);
      changed = true;
    }
  });

  if (changed) {
    saveAchievementState();
    renderAchievements();
  }
}

function recordGameStart(modeKey) {
  const today = todayKey();
  if (!achievementState.playDates.includes(today)) {
    achievementState.playDates.push(today);
  }

  achievementState.modePlays[modeKey] = (achievementState.modePlays[modeKey] || 0) + 1;
  saveAchievementState();
  checkAchievements();
}

function recordLineClear(clearedRows, cleanupLineCount) {
  achievementState.totalLines += clearedRows.length;
  achievementState.cleanupLines += cleanupLineCount;
  saveAchievementState();
  checkAchievements();
}

function recordBlastGaugeFill() {
  achievementState.blastGaugeFills += 1;
  saveAchievementState();
  checkAchievements();
}

function recordPlayTime(delta) {
  if (delta <= 0) return;

  const today = todayKey();
  achievementState.totalPlayMs += delta;
  achievementState.dailyPlayMs[today] = (achievementState.dailyPlayMs[today] || 0) + delta;
  playtimeUnsavedMs += delta;

  if (playtimeUnsavedMs >= playtimeSaveIntervalMs) {
    playtimeUnsavedMs = 0;
    saveAchievementState();
    renderAchievementSummary();
  }
}

function flushPlayTime() {
  if (!playtimeUnsavedMs) return;
  playtimeUnsavedMs = 0;
  saveAchievementState();
  renderAchievementSummary();
}

function recordNoClearGameOver() {
  achievementState.noClearGameOvers += 1;
  saveAchievementState();
  checkAchievements();
}

function renderAchievementSummary() {
  const unlockedCount = achievements.filter((definition) => achievementState.unlocked[definition.id]).length;
  achievementSummary.textContent = `${unlockedCount} / ${achievements.length}`;
  achievementProgressText.textContent =
    unlockedCount === achievements.length ? "Complete" : `${achievements.length - unlockedCount}個の実績が残っています`;
  totalPlayTimeLabel.textContent = formatDuration(achievementState.totalPlayMs);
  averagePlayTimeLabel.textContent = formatDuration(
    achievementState.playDates.length ? achievementState.totalPlayMs / achievementState.playDates.length : 0,
  );
}

function selectAchievement(id) {
  selectedAchievementId = id;
  renderAchievementDetail();
}

function renderAchievementDetail() {
  const definition = achievements.find((item) => item.id === selectedAchievementId) || achievements[0];
  if (!definition) return;

  const acquiredAt = achievementState.unlocked[definition.id];
  const progress = Math.min(achievementProgress(definition), definition.target);
  achievementDetailIcon.classList.toggle("has-image", Boolean(definition.image));
  if (definition.image) {
    achievementDetailIcon.style.setProperty("--achievement-image", `url("${definition.image}")`);
  } else {
    achievementDetailIcon.style.removeProperty("--achievement-image");
  }
  achievementDetailIcon.textContent = definition.badge || (acquiredAt ? definition.icon : "?");
  achievementDetailTitle.textContent = definition.title;
  achievementDetailDescription.textContent = definition.description;
  achievementDetailMeta.textContent = acquiredAt
    ? `取得日 ${formatDateTime(acquiredAt)}`
    : `進行中 ${progress} / ${definition.target}`;
}

function renderAchievements() {
  if (!achievementGrid) return;

  renderAchievementSummary();

  achievementGrid.innerHTML = "";
  achievements.forEach((definition) => {
    const unlocked = Boolean(achievementState.unlocked[definition.id]);
    const button = document.createElement("button");
    button.className = `achievement-card${unlocked ? " is-unlocked" : ""}`;
    button.type = "button";
    button.setAttribute("aria-label", definition.title);
    if (definition.image) {
      button.style.setProperty("--achievement-image", `url("${definition.image}")`);
    }
    button.innerHTML = `
      <span class="achievement-icon${definition.image ? " has-image" : ""}">
        <span class="achievement-badge">${definition.badge || definition.icon}</span>
      </span>
      <span class="achievement-card-title">${definition.title}</span>
    `;
    button.addEventListener("click", () => selectAchievement(definition.id));
    achievementGrid.append(button);
  });

  if (!selectedAchievementId) selectedAchievementId = achievements[0]?.id || "";
  renderAchievementDetail();
}

function clearAchievementBanners() {
  achievementBannerStack.innerHTML = "";
}

function showAchievementBanners() {
  clearAchievementBanners();

  if (!pendingAchievementUnlocks.length) return;

  const visibleUnlocks = pendingAchievementUnlocks.slice(0, 3);
  const hiddenCount = pendingAchievementUnlocks.length - visibleUnlocks.length;

  visibleUnlocks.forEach((definition) => {
    const banner = document.createElement("div");
    banner.className = "achievement-banner";
    if (definition.image) {
      banner.style.setProperty("--achievement-image", `url("${definition.image}")`);
    }
    banner.innerHTML = `
      <span class="achievement-banner-icon${definition.image ? " has-image" : ""}">
        <span class="achievement-badge">${definition.badge || definition.icon}</span>
      </span>
      <div>
        <strong>Achievement Unlocked</strong>
        <small>${definition.title}</small>
      </div>
    `;
    achievementBannerStack.append(banner);
  });

  if (hiddenCount > 0) {
    const banner = document.createElement("div");
    banner.className = "achievement-banner achievement-banner-more";
    banner.innerHTML = `
      <span>+</span>
      <div>
        <strong>Achievement Unlocked</strong>
        <small>ほか${hiddenCount}個の実績</small>
      </div>
    `;
    achievementBannerStack.append(banner);
  }

  pendingAchievementUnlocks = [];
}

const achievements = buildAchievements();
let achievementState = loadAchievementState();

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
  const speedCurve = mode.speedCurve === "blast" ? blastLevelSpeedCurve : levelSpeedCurve;
  return speedCurve[Math.min(level - 1, speedCurve.length - 1)];
}

function updateBlastGauge() {
  const active = Boolean(currentMode().blast);
  blastGauge.hidden = !active;
  blastGaugeFill.style.height = `${Math.max(0, Math.min(100, blastCharge))}%`;
  blastGaugeLabel.textContent = `${Math.floor(blastCharge)}%`;
  blastGauge.classList.toggle("is-ready", active && blastCharge >= blastGaugeWarningThreshold);
  blastGauge.classList.toggle("is-full", active && blastCharge >= 100);
}

function showBlastGaugeBurst() {
  if (!blastGauge || blastGauge.hidden) return;
  blastGauge.classList.remove("is-firing");
  void blastGauge.offsetWidth;
  blastGauge.classList.add("is-firing");

  for (let i = 0; i < 16; i += 1) {
    const spark = document.createElement("span");
    const angle = (Math.PI * 2 * i) / 16 + Math.random() * 0.28;
    const distance = 26 + Math.random() * 18;
    spark.className = "blast-gauge-spark";
    spark.style.setProperty("--spark-x", `${Math.cos(angle) * distance}px`);
    spark.style.setProperty("--spark-y", `${Math.sin(angle) * distance}px`);
    spark.style.animationDelay = `${Math.random() * 80}ms`;
    blastGauge.append(spark);
    window.setTimeout(() => spark.remove(), 760);
  }

  window.setTimeout(() => blastGauge.classList.remove("is-firing"), 520);
}

function stackIsAboveHalf() {
  return board.slice(0, Math.floor(rows / 2)).some((row) => row.some(Boolean));
}

function enclosedSpaces() {
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
  const queue = [];

  const push = (x, y) => {
    if (x < 0 || x >= cols || y < 0 || y >= rows || visited[y][x] || board[y][x]) return;
    visited[y][x] = true;
    queue.push({ x, y });
  };

  for (let x = 0; x < cols; x += 1) {
    push(x, 0);
    push(x, rows - 1);
  }
  for (let y = 0; y < rows; y += 1) {
    push(0, y);
    push(cols - 1, y);
  }

  while (queue.length) {
    const { x, y } = queue.shift();
    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }

  const spaces = [];
  board.forEach((row, y) => {
    row.forEach((cellValue, x) => {
      if (!cellValue && !visited[y][x]) spaces.push({ x, y });
    });
  });
  return spaces;
}

function spawnBlastBurst(x, y, radius = 68) {
  blastBursts.push({ x, y, age: 0, duration: 520, radius });
  for (let i = 0; i < 34; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 80 + Math.random() * 220;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 40,
      life: 360 + Math.random() * 260,
      maxLife: 620,
      size: 2.4 + Math.random() * 4,
      color: Math.random() > 0.45 ? "#ffb238" : "#fff1a8",
    });
  }
}

function placeBlastBomb(spaces) {
  const deepestY = Math.max(...spaces.map((space) => space.y));
  const deepest = spaces.filter((space) => space.y === deepestY);
  const target = deepest[Math.floor(Math.random() * deepest.length)];
  board[target.y][target.x] = "B";
  spawnBlastBurst((target.x + 0.5) * cell, (target.y + 0.5) * cell, 58);
  notices.push({ text: "BOMB", age: 0, duration: 820 });
  score += 250;
  scoreLabel.textContent = String(score);
}

function blastBottomRows() {
  const blastedRows = [rows - 2, rows - 1];
  blastedRows.forEach((row) => clearSweeps.push({ row, age: 0, duration: 560 }));
  spawnBlastBurst(canvas.width / 2, canvas.height - cell, 130);
  board = board.slice(0, rows - 2);
  while (board.length < rows) {
    board.unshift(Array(cols).fill(""));
  }
  score += 400;
  scoreLabel.textContent = String(score);
  notices.push({ text: "BLAST", age: 0, duration: 880 });
}

function triggerBlastEffect() {
  if (!currentMode().blast) return;
  recordBlastGaugeFill();
  showBlastGaugeBurst();
  blastCharge = 0;
  updateBlastGauge();

  const spaces = enclosedSpaces();
  if (spaces.length) {
    placeBlastBomb(spaces);
  } else {
    blastBottomRows();
  }
}

function addBlastCharge(amount) {
  if (!currentMode().blast || gameOver || amount <= 0) return;
  blastCharge = Math.min(100, blastCharge + amount);
  updateBlastGauge();
}

function triggerBlastIfReady() {
  if (!currentMode().blast || gameOver || blastCharge < 100) return false;
  triggerBlastEffect();
  return true;
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
  pendingAchievementUnlocks = [];
  clearAchievementBanners();
  board = createBoard();
  nextQueue = [];
  refillQueue();
  holdType = "";
  holdUsed = false;
  score = 0;
  lines = 0;
  currentRunLines = 0;
  level = 1;
  comboCount = -1;
  backToBackActive = false;
  piece = takeNextPiece();
  dropCounter = 0;
  lockStart = 0;
  softDropActive = false;
  particles = [];
  clearSweeps = [];
  blastBursts = [];
  blastCharge = 0;
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
  updateBlastGauge();

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

function expandBlastRows(clearedRows) {
  if (!currentMode().blast) return clearedRows;
  const expanded = new Set(clearedRows);
  const bombRows = clearedRows.filter((y) => board[y]?.includes("B"));

  bombRows.forEach((row) => {
    for (let y = row - 2; y <= row + 2; y += 1) {
      if (y >= 0 && y < rows) expanded.add(y);
    }
    const bombX = board[row].findIndex((cellValue) => cellValue === "B");
    spawnBlastBurst((Math.max(0, bombX) + 0.5) * cell, (row + 0.5) * cell, 112);
  });

  if (bombRows.length) notices.push({ text: "BOMB BLAST", age: 0, duration: 920 });
  return [...expanded].sort((a, b) => a - b);
}

function applyLineClear(clearedRows) {
  const rowsToClear = clearedRows;
  const cleanupLineCount = rowsToClear.filter((y) => board[y]?.includes("G")).length;
  board = board.filter((_, y) => !rowsToClear.includes(y));

  while (board.length < rows) {
    board.unshift(Array(cols).fill(""));
  }

  lines += rowsToClear.length;
  currentRunLines += rowsToClear.length;
  recordLineClear(rowsToClear, cleanupLineCount);
  updateLevel();
  score += [0, 100, 300, 500, 800][rowsToClear.length] ?? rowsToClear.length * 250;
  scoreLabel.textContent = String(score);
  linesLabel.textContent = String(lines);
  return rowsToClear.length;
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
  const rowsToAnimate = expandBlastRows(clearedRows);
  pendingLineClear = {
    age: 0,
    duration: lineClearDelayMs,
    rows: rowsToAnimate,
    wasTSpin,
  };
  rowsToAnimate.forEach((row) => clearSweeps.push({ row, age: 0, duration: lineClearDelayMs }));
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
  addBlastCharge(cleared * blastLineGain);
  if (currentMode().targetLines && lines >= currentMode().targetLines) {
    completeGame();
    return;
  }

  if (currentMode().cleanup && !hasCleanupBlocks()) {
    startCleanupRiseDelay();
    return;
  }

  triggerBlastIfReady();
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
  if (triggerBlastIfReady()) {
    piece = null;
  }
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
    if (softDropActive) addBlastCharge(blastSoftDropGain);
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
  addBlastCharge(dropped * blastHardDropGain);
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
  flushPlayTime();
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
  showAchievementBanners();
}

function endGame() {
  if (!gameOver && currentRunLines === 0) {
    recordNoClearGameOver();
  }
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

function drawBombBlock(x, y, alpha = 1) {
  const px = x * cell;
  const py = y * cell;
  drawBlock(ctx, px, py, cell, colors.B, alpha);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#4b210e";
  ctx.beginPath();
  ctx.arc(px + cell * 0.5, py + cell * 0.58, cell * 0.24, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#fff1a8";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(px + cell * 0.5, py + cell * 0.58, cell * 0.15, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "#ffefe0";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(px + cell * 0.58, py + cell * 0.36);
  ctx.quadraticCurveTo(px + cell * 0.72, py + cell * 0.2, px + cell * 0.84, py + cell * 0.3);
  ctx.stroke();
  ctx.fillStyle = "#fff1a8";
  ctx.fillRect(px + cell * 0.82, py + cell * 0.25, 3, 3);
  ctx.restore();
}

function drawCell(x, y, type, alpha = 1) {
  if (type === "B") {
    drawBombBlock(x, y, alpha);
    return;
  }

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

function drawBlastBursts(delta) {
  blastBursts = blastBursts.filter((burst) => {
    burst.age += delta;
    const t = Math.min(1, burst.age / burst.duration);
    const ease = 1 - Math.pow(1 - t, 3);
    const radius = burst.radius * ease;
    const alpha = Math.max(0, 1 - t);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = `rgba(255, 178, 56, ${0.8 * alpha})`;
    ctx.lineWidth = 7 * (1 - t) + 1;
    ctx.beginPath();
    ctx.arc(burst.x, burst.y, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = `rgba(255, 241, 168, ${0.65 * alpha})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(burst.x, burst.y, radius * 0.55, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = `rgba(255, 104, 45, ${0.24 * alpha})`;
    ctx.beginPath();
    ctx.arc(burst.x, burst.y, radius * 0.72, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    return burst.age < burst.duration;
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
  drawBlastBursts(delta);
  drawCleanupRise(delta);
  drawParticles(delta);
  drawNotices(delta);
  drawPreviews();
}

function update(time = 0) {
  const delta = Math.min(64, time - lastTime);
  lastTime = time;

  if (!paused && !gameOver) {
    recordPlayTime(delta);

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

    if (currentMode().blast && stackIsAboveHalf()) {
      addBlastCharge(blastHighStackRate * (delta / 1000));
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

function beginGame(modeKey) {
  resetGame(modeKey);
  recordGameStart(modeKey);
}

function armGameHistoryGuard() {
  if (gameHistoryGuardActive || !window.history?.pushState) return;
  try {
    history.pushState({ xLineGameGuard: true }, "", location.href);
    gameHistoryGuardActive = true;
  } catch {
    gameHistoryGuardActive = false;
  }
}

function startMode(modeKey) {
  beginGame(modeKey);
  titleScreen.classList.remove("is-active");
  gameScreen.classList.add("is-active");
  armGameHistoryGuard();
}

function returnToTitle() {
  flushPlayTime();
  pendingAchievementUnlocks = [];
  clearAchievementBanners();
  gameHistoryGuardActive = false;
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

achievementButton.addEventListener("click", () => {
  flushPlayTime();
  renderAchievements();
  achievementsDialog.showModal();
});

achievementCloseButton.addEventListener("click", () => {
  achievementsDialog.close();
});

titleOptionsButton.addEventListener("click", () => {
  optionsDialog.dataset.context = "title";
  optionsDialog.showModal();
});

optionButton.addEventListener("click", () => {
  if (gameOver) return;
  flushPlayTime();
  paused = true;
  softDropActive = false;
  optionsDialog.dataset.context = "game";
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

colorSchemeInputs.forEach((input) => {
  input.addEventListener("change", () => {
    if (input.checked) applyColorScheme(input.value);
  });
});

restartButton.addEventListener("click", () => {
  beginGame(currentModeKey);
  optionsDialog.close();
});

quitButton.addEventListener("click", returnToTitle);
retryButton.addEventListener("click", () => beginGame(currentModeKey));
gameOverMenuButton.addEventListener("click", returnToTitle);

window.addEventListener("pagehide", flushPlayTime);

window.addEventListener("popstate", () => {
  if (!gameScreen.classList.contains("is-active")) {
    gameHistoryGuardActive = false;
    return;
  }

  gameHistoryGuardActive = false;
  armGameHistoryGuard();
});

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
  const startThresholdPx = 34;
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
  let refreshingForUpdate = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshingForUpdate) return;
    refreshingForUpdate = true;
    window.location.reload();
  });

  navigator.serviceWorker.register("sw.js").then((registration) => {
    registration.update();
  });
}

resetGame("endless");
paused = true;
updateColorSchemeInputs();
renderAchievements();
requestAnimationFrame(update);
