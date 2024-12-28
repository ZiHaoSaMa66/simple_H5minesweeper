let rows = 10;
let cols = 10;
let mineCount = 15;
let board = [];
let minePositions = [];
let isFirstClick = true;  // 新增：是否是第一次点击的标记

var isDead = false;  // 新增：游戏是否结束的标记

let gameUseTime = 0;
var timerInterval;

function stoptimer() {
    clearInterval(timerInterval);
}
function starttimer() {
    gameUseTime = 0;
    timerInterval = setInterval(() => {
        gameUseTime++;
        document.getElementById('game-time').textContent = gameUseTime;
    }, 1000);
}

function from_url_get_param(name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
    var r = window.location.search.substr(1).match(reg);
    if (r != null) return unescape(r[2]);
    return null;
}

// 从 URL 中获取游戏难度
const difficulty = from_url_get_param('difficulty') || 'hard';

// 设置游戏难度
if (difficulty === 'easy') {
    rows = 8;
    cols = 8;
    mineCount = 10;
} else if (difficulty === 'normal') {
    rows = 16;
    cols = 16;
    mineCount = 40;
} else if (difficulty === 'hard') {
    rows = 16;
    cols = 30;
    mineCount = 99;
}

// 调试模式下，显示地雷并标出相关信息
function dbg() {
    // 如果游戏已经结束，不再执行调试操作
    if (isDead || isFirstClick) {
        console.error('Start Debug mode faild.');
        return;
    }

    // 遍历所有格子，将地雷可视化
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const cell = board[row][col];
            if (cell.isMine) {
                // 如果是地雷，设置格子的样式为红色，并显示"M"表示地雷

                cell.element.classList.add('mine');
                cell.element.textContent = 'M';  // 在格子中显示地雷
            } else {
                // 如果不是地雷，显示该格子周围的地雷数量
                cell.element.classList.remove('mine');
                if (cell.nearbyMines > 0) {
                    cell.element.textContent = cell.nearbyMines;  // 显示数字
                } else {
                    cell.element.textContent = '';  // 如果周围没有地雷，不显示任何内容
                }
            }
        }
    }
    console.log('Debug mode enabled.');
}

// 初始化游戏
function initGame() {
    board = [];
    minePositions = [];
    isFirstClick = true;  // 重置首次点击标记

    const gameContainer = document.getElementById('game');
    gameContainer.innerHTML = '';
    gameContainer.style.gridTemplateColumns = `repeat(${cols}, 30px)`;

    // 创建游戏格子
    for (let row = 0; row < rows; row++) {
        board[row] = [];
        for (let col = 0; col < cols; col++) {
            const cell = createCell(row, col);
            gameContainer.appendChild(cell);
            board[row][col] = {
                element: cell,
                isMine: false,
                isRevealed: false,
                nearbyMines: 0,
                isFlagged: false
            };
        }
    }
}

// 创建单个格子
function createCell(row, col) {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    cell.dataset.row = row;
    cell.dataset.col = col;

    cell.addEventListener('click', () => handleClick(row, col));
    cell.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        toggleFlag(row, col);
    });

    return cell;
}

// 随机放置地雷
function placeMines(excludeRow, excludeCol) {
    let minesPlaced = 0;
    while (minesPlaced < mineCount) {
        const row = Math.floor(Math.random() * rows);
        const col = Math.floor(Math.random() * cols);
        // 确保第一次点击的格子及其周围区域不包含地雷
        if (!board[row][col].isMine && !(row === excludeRow && col === excludeCol)) {
            board[row][col].isMine = true;
            minePositions.push([row, col]);
            minesPlaced++;
        }
    }
}

// 计算每个格子周围的地雷数
function calculateNumbers() {
    const directions = getDirections();

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (board[row][col].isMine) continue;
            board[row][col].nearbyMines = countNearbyMines(row, col, directions);
        }
    }
}

// 获取周围方向数组
function getDirections() {
    return [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1], [0, 1],
        [1, -1], [1, 0], [1, 1]
    ];
}

// 计算周围的地雷数量
function countNearbyMines(row, col, directions) {
    return directions.reduce((count, [dr, dc]) => {
        const newRow = row + dr;
        const newCol = col + dc;
        return count + (isInBounds(newRow, newCol) && board[newRow][newCol].isMine ? 1 : 0);
    }, 0);
}

// 检查坐标是否在边界内
function isInBounds(row, col) {
    return row >= 0 && row < rows && col >= 0 && col < cols;
}

// 展开相邻格子
function revealAdjacentCells(row, col) {
    const directions = getDirections();
  
    for (const [dr, dc] of directions) {
      const newRow = row + dr;
      const newCol = col + dc;
  
      if (isInBounds(newRow, newCol)) {
        const neighbor = board[newRow][newCol];
  
        // 如果相邻格子被标记为地雷且标记错误，游戏结束
        if (neighbor.isFlagged && !neighbor.isMine) {
          stoptimer();
          alert('你标记错了地雷！游戏结束！');
          revealAllMines();
          isDead = true;
          return;
        }
  
        // 如果格子未被揭示且不是旗帜，则揭示它
        if (!neighbor.isRevealed && !neighbor.isFlagged) {
          neighbor.isRevealed = true;
          neighbor.element.classList.add('revealed');
          neighbor.element.textContent = neighbor.nearbyMines > 0 ? neighbor.nearbyMines : '';
  
          // 如果相邻格子没有地雷，继续展开空白格子
          if (neighbor.nearbyMines === 0) {
            revealEmptyCells(newRow, newCol);
          }
        }
      }
    }
  }
  


// 处理点击事件
function handleClick(row, col) {
    if (isDead) {
        return;
    }

    if (isFirstClick) {
        placeMines(row, col);  // 首次点击后生成雷
        calculateNumbers();
        isFirstClick = false;  // 设置首次点击标记为 false
        starttimer();  // 开始计时
    }

    const cell = board[row][col];
    // if (cell.isRevealed || cell.isFlagged) return;
    if (cell.isFlagged) return;


      // 检查是否点击了错误标记的格子
    if (cell.isFlagged && !cell.isMine) {
        stoptimer();  // 停止计时
        alert('你标记错了地雷！游戏结束！');
        revealAllMines();  // 显示所有地雷
        isDead = true;  // 游戏结束
        return;
    }

    
    cell.isRevealed = true;
    cell.element.classList.add('revealed');

    if (cell.isMine) {
        cell.element.classList.add('mine');
        stoptimer();  // 停止计时
        alert('游戏结束！你踩到了地雷。');
        revealAllMines();
        isDead = true;  // 游戏结束标记为 true
    } else {
        cell.element.textContent = cell.nearbyMines > 0 ? cell.nearbyMines : '';
        if (cell.nearbyMines === 0) {
            revealEmptyCells(row, col);
        }

        // 如果数字周围的标记数量等于该数字，自动展开所有相邻的未揭开的格子
        console.log('cell.nearbyMines', cell.nearbyMines);
        console.log('countFlagsAround(row, col)', countFlagsAround(row, col));
        if (cell.nearbyMines > 0 && countFlagsAround(row, col) === cell.nearbyMines) {
            console.warn("触发自动开空！");
            revealAdjacentCells(row, col);
        }

        checkWin();
    }
}


// 计算周围的标记数量
function countFlagsAround(row, col) {
    const directions = getDirections();

    let flagCount = 0;
    for (const [dr, dc] of directions) {
        const newRow = row + dr;
        const newCol = col + dc;
        if (isInBounds(newRow, newCol)) {
            const neighbor = board[newRow][newCol];
            if (neighbor.isFlagged) {
                flagCount++;
            }
        }
    }
    return flagCount;
}

// 展开空白区域
function revealEmptyCells(row, col) {
    console.warn("触发展开空白区域function");
    const directions = getDirections();

    for (const [dr, dc] of directions) {
        const newRow = row + dr;
        const newCol = col + dc;

        if (isInBounds(newRow, newCol)) {
            const neighbor = board[newRow][newCol];
            if (!neighbor.isRevealed && !neighbor.isMine) {
                neighbor.isRevealed = true;
                neighbor.element.classList.add('revealed');
                neighbor.element.textContent = neighbor.nearbyMines > 0 ? neighbor.nearbyMines : '';
                if (neighbor.nearbyMines === 0) {
                    revealEmptyCells(newRow, newCol);
                }
            }
        }
    }
}



// 标记或取消标记地雷
function toggleFlag(row, col) {
    const cell = board[row][col];

    if (isDead) {
        return;
    }

    if (cell.isRevealed) return;

    // 仅在当前格子标记为地雷时允许取消标记
    if (cell.isFlagged || !cell.isRevealed) {
        cell.isFlagged = !cell.isFlagged;
        cell.element.classList.toggle('flag', cell.isFlagged);
    }
}

// 展示所有地雷
function revealAllMines() {
    minePositions.forEach(([row, col]) => {
        const mineCell = board[row][col];
        mineCell.element.classList.add('mine');
    });
}

// 展开空白区域
function revealEmptyCells(row, col) {
    const directions = getDirections();

    for (const [dr, dc] of directions) {
        const newRow = row + dr;
        const newCol = col + dc;

        if (isInBounds(newRow, newCol)) {
            const neighbor = board[newRow][newCol];
            if (!neighbor.isRevealed && !neighbor.isMine) {
                neighbor.isRevealed = true;
                neighbor.element.classList.add('revealed');
                neighbor.element.textContent = neighbor.nearbyMines > 0 ? neighbor.nearbyMines : '';
                if (neighbor.nearbyMines === 0) {
                    revealEmptyCells(newRow, newCol);
                }
            }
        }
    }
}

// 检查是否获胜
function checkWin() {
    let revealedCount = 0;
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (board[row][col].isRevealed) revealedCount++;
        }
    }
    if (revealedCount === rows * cols - mineCount) {
        stoptimer();  // 停止计时
        alert('恭喜你获胜了！');
    }
}

initGame();

// 屏蔽右键菜单
document.oncontextmenu = (e) => e.preventDefault();
