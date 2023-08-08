const config = {
  startBtn: document.getElementById("start_btn"),
  resetBtn: document.getElementById("reset_btn"),
  initialPage: document.getElementById("initialPage"),
  mainPage: document.getElementById("mainPage"),
  finalPage: document.getElementById("finalPage"),
  pauseBtn: document.getElementById("pause_btn"),
  score: document.getElementById("score"),
  bestScore: document.getElementById("best-score"),
  move: document.getElementById("move"),
  rotate: document.getElementById("rotate"),
  bgm: document.getElementById("background_mp3"),
  quitBtn: document.getElementById("quit_btn"),
  replayBtn: document.getElementById("replay_btn"),
  sliderVolume: document.getElementById("volume"),

  // ページ切り替え
  switchPages: function switchPages(page1, page2) {
    page1.style.display = "none";
    page2.style.display = "block";
  },

};

// ブロックの色の定義
const COLORS = {
  1: "#FF0000", // Red
  2: "#00FF00", // Green
  3: "#0000FF", // Blue
  4: "#FFFF00", // Yellow
};

// テトリミノの形状の定義
const SHAPES = {
  // L-shape
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],

  // // T-shape
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],

  // // I-shape
  I: [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
  ],

  // Square-shape
  Square: [
    [1, 1],
    [1, 1],
  ],
};


let gameBoard;
let tetoriminoBoard;
let gameRunning = true;
let isPaused = false; // ポーズ状態を管理するフラグ
let autoMoveInterval;
let started = 0
// const AUTO_MOVE_INTERVAL = 500; // テトリミノのスピード調整

// テトリミノを表示するためのクラス
class TetoriminoBoard {
  constructor(gameBoard, shape, color) {
    this.gameBoard = gameBoard;
    this.cvs = document.getElementById("tetorimino");
    this.ctx = this.cvs.getContext("2d");
    this.boardRow = 20;
    this.boardCol = 10;
    this.blockSize = 30;
    this.canvasW = this.blockSize * this.boardCol;
    this.canvasH = this.blockSize * this.boardRow;
    this.currentShape = shape;
    this.color = color;
    this.move = config.move;
    this.rotate = config.rotate;
    this.AUTO_MOVE_INTERVAL = this.chooseDifficulty();
    this.setupCanvas();
    this.setupInitialPosition();
    this.drawRandomBlock();
    this.startGame();
  }

  // ゲーム開始時に選択した難易度を受け取る
  chooseDifficulty() {
    this.difficulty = document.getElementById("difficultyOption");
    console.log(this.difficulty.value); // 難易度レベルを確認
    this.playSpeed = this.difficulty.value;
    return this.playSpeed;
  }
  // キャンバスのセットアップ
  setupCanvas() {
    this.cvs.width = this.canvasW;
    this.cvs.height = this.canvasH;
    this.cvs.style.width = this.canvasW + "px";
    this.ctx.strokeStyle = "rgba(0, 0, 0, 1)";
  }

  // テトリミノの初期位置のセットアップ
  setupInitialPosition() {
    this.x = 4;
    this.y = 0;
  }

  startGame() {
    this.switchToMainPage();
    this.initializeGameLoop();
    this.initializePauseButton();
    this.initializeKeyListeners();
  }

  switchToMainPage() {
    config.switchPages(config.initialPage, config.mainPage);
    this.gameBoard.drawGameArea();
  }

  initializeGameLoop() {
    // 自動でテトリミノを下に移動する間隔（ミリ秒）
    if (gameRunning && !isPaused) {
      config.bgm.play();
      config.bgm.loop = true;

      autoMoveInterval = setInterval(() => {
        this.moveDown(this.gameBoard);
        runGameLoop(tetoriminoBoard, gameBoard);
      }, this.AUTO_MOVE_INTERVAL);
    }
  }

  initializePauseButton() {
    config.pauseBtn.addEventListener("click", () => {
      this.togglePause();
      if (isPaused) {
        this.pauseGame();
      } else {
        this.resumeGame();
      }
    });
  }

  initializeKeyListeners() {
    window.addEventListener("keydown", (event) => {
      if (!isPaused) {
        handleKeyPress(event, tetoriminoBoard, gameBoard);
      }
    });
  }

  pauseGame() {
    clearInterval(autoMoveInterval);
    config.bgm.pause();
    config.pauseBtn.innerHTML = "再開";
  }

  resumeGame() {
    autoMoveInterval = setInterval(() => {
      this.moveDown(this.gameBoard);
      runGameLoop(tetoriminoBoard, gameBoard);
    }, this.AUTO_MOVE_INTERVAL);
    config.bgm.play();
    config.pauseBtn.innerHTML = "ポーズ";
  }

  // ポーズの切り替え
  togglePause() {
    isPaused = !isPaused;
  }

  // ランダムなテトリミノを描画
  drawRandomBlock() {
    const shapeKeys = Object.keys(SHAPES);
    const randomShapeKey =
      shapeKeys[Math.floor(Math.random() * shapeKeys.length)];
    const randomShape = SHAPES[randomShapeKey];
    const randomColor =
      COLORS[Math.floor(Math.random() * Object.keys(COLORS).length) + 1];
    this.currentShape = randomShape;
    this.color = randomColor;
  }

  // テトリミノを描画
  drawBlock(gameBoard) {
    this.clearCanvas();
    const blockSize = this.blockSize;

    // 通常のテトリミノを描画
    for (let row = 0; row < this.currentShape.length; row++) {
      for (let col = 0; col < this.currentShape[row].length; col++) {
        if (this.currentShape[row][col] === 1) {
          const x = (col + this.x) * blockSize;
          const y = (row + this.y) * blockSize;
          this.drawSquare(x, y, blockSize, this.color);
        }
      }
    }

    // 落下予測位置を取得
    const fallPreviewY = this.getFallPreviewPosition(gameBoard);

    // 落下予測のテトリミノを描画
    for (let row = 0; row < this.currentShape.length; row++) {
      for (let col = 0; col < this.currentShape[row].length; col++) {
        if (this.currentShape[row][col] === 1) {
          const x = (col + this.x) * blockSize;
          const y = (row + fallPreviewY) * blockSize;
          this.drawSquare(x, y, blockSize, "rgba(255, 255, 255, 0.5)");
        }
      }
    }

    // テトリミノが画面上に到達したかをチェックし、ゲームオーバーとする
    if (this.checkCollision(gameBoard, this.currentShape, this.x, this.y)) {
      handleGameOver(gameBoard);
    }
  }

  // キャンバスをクリア
  clearCanvas() {
    this.ctx.clearRect(0, 0, this.cvs.width, this.cvs.height);
  }

  // 正方形を描画
  drawSquare(x, y, size, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, size, size);
    this.ctx.strokeRect(x, y, size, size);
  }

  // ブロックの回転
  rotateBlock(gameBoard) {
    // 回転ロジックの実装
    const originalShape = this.currentShape; // 現在の形状を保存
    const rotationStates = this.getRotationStates(originalShape);
    const currentIndex = rotationStates.indexOf(this.currentShape);
    const nextIndex = (currentIndex + 1) % rotationStates.length;
    const rotatedShape = rotationStates[nextIndex];
    this.currentShape = rotatedShape;

    // 衝突判定を行い、回転した形状が設置不可能なら、位置を調整
    if (this.checkCollision(gameBoard, rotatedShape, this.x, this.y)) {
      this.adjustPosition(gameBoard);
    }

    this.drawBlock(gameBoard);
  }

  // テトリミノの位置をゲーム画面の枠内に調整
  adjustPosition(gameBoard) {
    const shapeWidth = this.currentShape[0].length;
    const shapeHeight = this.currentShape.length;
    const maxRight = gameBoard.boardCol - shapeWidth;
    const maxBottom = gameBoard.boardRow - shapeHeight;

    if (this.x < 0) {
      this.x = 0;
    } else if (this.x > maxRight) {
      this.x = maxRight;
    }

    if (this.y > maxBottom) {
      this.y = maxBottom;
    }
  }

  // 回転可能な状態の生成
  getRotationStates(shape) {
    const rotationStates = [shape];
    let rotatedShape = shape;

    // 90度ずつ回転状態を生成
    for (let i = 0; i < 3; i++) {
      rotatedShape = this.rotate90Degrees(rotatedShape);
      rotationStates.push(rotatedShape);
    }

    return rotationStates;
  }

  // 90度回転
  rotate90Degrees(shape) {
    const numRows = shape.length;
    const numCols = shape[0].length;
    const rotatedShape = [];

    for (let col = 0; col < numCols; col++) {
      const newRow = [];
      for (let row = numRows - 1; row >= 0; row--) {
        newRow.push(shape[row][col]);
      }
      rotatedShape.push(newRow);
    }

    return rotatedShape;
  }

  // 右に移動
  moveRight(gameBoard) {
    // 移動先が衝突しないかチェック
    if (
      !this.checkCollision(gameBoard, this.currentShape, this.x + 1, this.y)
    ) {
      this.x++;
    }
  }

  // 下に移動
  moveDown(gameBoard) {
    // 移動先が衝突しないかチェック
    if (
      !this.checkCollision(gameBoard, this.currentShape, this.x, this.y + 1)
    ) {
      this.y++;
    }
  }

  // 左に移動
  moveLeft(gameBoard) {
    // 移動先が衝突しないかチェック
    if (
      !this.checkCollision(gameBoard, this.currentShape, this.x - 1, this.y)
    ) {
      this.x--;
    }
  }

  checkCollision(gameBoard, shape, targetX, targetY) {
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col] === 1) {
          const boardX = targetX + col;
          const boardY = targetY + row;

          // ゲームボードの範囲内かをチェック
          if (
            boardX < 0 ||
            boardX >= gameBoard.boardCol ||
            boardY >= gameBoard.boardRow
          ) {
            return true; // 衝突
          }

          // ゲームボード上で既に占有されているかをチェック
          if (gameBoard.gameArea[boardY][boardX] !== 0) {
            return true; // 衝突
          }
        }
      }
    }
    return false; // 衝突なし
  }

  getFallPreviewPosition(gameBoard) {
    let fallPreviewY = this.y;
    while (
      !this.checkCollision(
        gameBoard,
        this.currentShape,
        this.x,
        fallPreviewY + 1
      )
    ) {
      fallPreviewY++;
    }
    return fallPreviewY;
  }
}

// ゲームボードを表示するためのクラス
class GameBoard {
  constructor() {
    this.cvs = document.getElementById("game");
    this.ctx = this.cvs.getContext("2d");
    this.blockSize = 30;
    this.boardRow = 20;
    this.boardCol = 10;
    this.canvasW = this.blockSize * this.boardCol;
    this.canvasH = this.blockSize * this.boardRow;
    this.setupCanvas();
    this.gameArea = this.createEmptyArea();
    this.score = 0;
    this.bestScore = 0;
  }

  // キャンバスのセットアップ
  setupCanvas() {
    this.cvs.width = this.canvasW;
    this.cvs.height = this.canvasH;
    this.cvs.style.width = this.canvasW + "px";
    this.ctx.fillStyle = "#000";
    this.ctx.strokeStyle = "rgba(0, 0, 0, 1)";
  }

  // 空のゲームエリアを作成
  createEmptyArea() {
    return Array.from({ length: this.boardRow }, () =>
      Array(this.boardCol).fill(0)
    );
  }

  // 正方形を描画
  drawBlock(x, y, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, this.blockSize, this.blockSize);
    this.ctx.strokeRect(x, y, this.blockSize, this.blockSize);
  }

  // ゲームエリアを描画
  drawGameArea(tetoriminoBoard) {
    for (let row = 0; row < this.gameArea.length; row++) {
      for (let col = 0; col < this.gameArea[row].length; col++) {
        const blockX = col * this.blockSize;
        const blockY = row * this.blockSize;
        if (this.gameArea[row][col] === 0) {
          this.drawBlock(blockX, blockY, "#000");
        } else {
          // マージされた部分をテトリミノの色で描画
          const colorIndex = this.gameArea[row][col];
          const color = COLORS[colorIndex];
          this.drawBlock(blockX, blockY, color);
        }
      }
    }
  }

  mergeBlock(tetoriminoBoard, gameBoard) {
    const shape = tetoriminoBoard.currentShape;
    const x = tetoriminoBoard.x;
    const y = tetoriminoBoard.y;
    const colorIndex = Object.keys(COLORS).find(
      (key) => COLORS[key] === tetoriminoBoard.color
    );

    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col] === 1) {
          const boardX = x + col;
          const boardY = y + row;

          // ゲームボード上で占有されるように設定
          this.gameArea[boardY][boardX] = colorIndex;
        }
      }
    }

    // 横一列が揃ったかどうかをチェックし、揃った行を削除
    this.checkAndClearLines();

    // 新しいテトリミノを生成し、初期位置を設定
    tetoriminoBoard.drawRandomBlock();
    tetoriminoBoard.setupInitialPosition();
  }

  // 横一列が揃ったかどうかをチェックし、揃った行を削除
  checkAndClearLines() {
    let linesCleared = 0;
    let rowsToClear = [];

    for (let row = this.gameArea.length - 1; row >= 0; row--) {
      if (this.isLineFull(row)) {
        rowsToClear.push(row);
        linesCleared++;
      }
    }

    if (linesCleared > 0) {
      rowsToClear.forEach((row) => this.clearLines(row));
      this.score += this.calculateScore(linesCleared);
      this.updateScoreDisplay();

      // 初回の行をクリアした後、追加のクリア行があるか再帰的にチェックします
      this.checkAndClearLines();
    }

    return linesCleared;
  }

  // 指定された行がすべて埋まっているかをチェック
  isLineFull(row) {
    return this.gameArea[row].every((cell) => cell !== 0);
  }

  // 指定された行を削除し、上の行を下に詰める
  clearLines(row) {
    this.gameArea.splice(row, 1);
    this.gameArea.unshift(Array(this.boardCol).fill(0));
  }

  // 削除された行に基づいて、ポイントを計算する
  calculateScore(linesCleared) {
    const pointsPerLine = 100;
    return linesCleared * pointsPerLine;
  }

  // ページ上のスコア表示要素を更新する
  updateScoreDisplay() {
    config.score.textContent = `${this.score}`;
  }

  // ページ上のベストスコア表示要素を更新する
  updateBestScoreDisplay() {
    config.bestScore.textContent = `${this.bestScore}`;
  }
}



// ゲームを開始する
function startGame() {
  gameBoard = new GameBoard();
  tetoriminoBoard = new TetoriminoBoard(gameBoard);
  runGameLoop(tetoriminoBoard, gameBoard);
}

function runGameLoop(tetoriminoBoard, gameBoard) {
  // ゲームループの実行
  const gameLoop = () => {
    if (gameRunning && !isPaused) {
      if (
        tetoriminoBoard.checkCollision(
          gameBoard,
          tetoriminoBoard.currentShape,
          tetoriminoBoard.x,
          tetoriminoBoard.y + 1
        )
      ) {
        // テトリミノをゲームボードにマージ
        gameBoard.mergeBlock(tetoriminoBoard, gameBoard);
        gameBoard.drawGameArea(tetoriminoBoard);
      }

      tetoriminoBoard.drawBlock(gameBoard);
      requestAnimationFrame(gameLoop);
    }
  };

  // ゲームループを開始
  gameLoop();
}

// ゲームをリセットする
function resetGame(gameBoard, tetoriminoBoard) {
  gameRunning = true;
  isPaused = false;
  config.pauseBtn.innerHTML = "ポーズ";
  //tetoriminoBoard.togglePause();
  //tetoriminoBoard.initializeGameLoop();
  gameBoard.gameArea = gameBoard.createEmptyArea();
  gameBoard.updateScoreDisplay();
  tetoriminoBoard.drawRandomBlock();
  tetoriminoBoard.setupInitialPosition();
  gameBoard.drawGameArea(tetoriminoBoard);

  gameBoard.score = 0;
  gameBoard.updateScoreDisplay();

}

// ゲームオーバーの処理
function handleGameOver(gameBoard) {
  //alert("gameover");
  config.switchPages(config.mainPage, config.finalPage);
  gameRunning = false;
  if (gameBoard.score > gameBoard.bestScore) {
    gameBoard.bestScore = gameBoard.score;
    gameBoard.updateBestScoreDisplay();
  }
  // resetGame(gameBoard, tetoriminoBoard);
}

// キー入力の処理
function handleKeyPress(event, tetoriminoBoard, gameBoard) {
  switch (event.keyCode) {
    case 37: // 左矢印キー
      config.move.play();
      tetoriminoBoard.moveLeft(gameBoard);
      break;
    case 38: // 上矢印キー
      config.rotate.play();
      tetoriminoBoard.rotateBlock(gameBoard);
      break;
    case 39: // 右矢印キー
      config.move.play();
      tetoriminoBoard.moveRight(gameBoard);
      break;
    case 40: // 下矢印キー
      config.move.play();
      tetoriminoBoard.moveDown(gameBoard);
      break;
  }
}

config.startBtn.addEventListener("click", function () {
  startGame();
});

config.resetBtn.addEventListener("click", function () {
  resetGame(gameBoard, tetoriminoBoard);
});

config.quitBtn.addEventListener("click", function () {
  // ページを再ロード
  location.reload();
})

config.replayBtn.addEventListener("click", function () {
  // リスタート関数を実行
  config.switchPages(config.finalPage, config.mainPage);
  resetGame(gameBoard, tetoriminoBoard);
})

config.sliderVolume.addEventListener("input", e => {
  config.bgm.volume = config.sliderVolume.value;
})