(() => {
  const TOTAL_NUMBERS = 75;
  const FREE_INDEX = 12; // center of 5x5 grid
  const boardGrid = document.getElementById("boardGrid");
  const linesChip = document.getElementById("linesComplete");
  const boardHint = document.getElementById("boardHint");
  const newBoardButton = document.getElementById("newBoard");
  const newBoardHero = document.getElementById("newBoardHero");
  const progressHeadline = document.getElementById("progressHeadline");
  const progressDetail = document.getElementById("progressDetail");

  let boardState = [];

  const commentary = {
    bingo: [
      "祝・大当たり！一気に花火が上がった！",
      "きたー！ビンゴ達成、会場ざわつく！",
      "ビンゴ成立！さあ賞品コールの準備を。",
      "爆発演出！ビンゴでスクリーンがまぶしい！",
      "歓声が止まらない！ビンゴに突入！",
    ],
    reach: [
      "あと1マス、手に汗にぎる…！",
      "リーチ！会場の空気が一段と熱くなる。",
      "リーチ状態、次の一撃で決めよう！",
      "光が走る…リーチ中！",
      "リーチ点灯、次の数字に全集中！",
    ],
    near: [
      "じわじわ攻めよう、盤面が温まってきた。",
      "静かな立ち上がり、次で弾みをつけよう。",
      "まだ序盤、落ち着いてマスを埋めよう。",
      "準備運動完了、そろそろリーチが見えるかも。",
      "流れを待とう、次の数字が鍵になる。",
    ],
  };

  const LINES = [
    [0, 1, 2, 3, 4],
    [5, 6, 7, 8, 9],
    [10, 11, 12, 13, 14],
    [15, 16, 17, 18, 19],
    [20, 21, 22, 23, 24],
    [0, 5, 10, 15, 20],
    [1, 6, 11, 16, 21],
    [2, 7, 12, 17, 22],
    [3, 8, 13, 18, 23],
    [4, 9, 14, 19, 24],
    [0, 6, 12, 18, 24],
    [4, 8, 12, 16, 20],
  ];

  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  function buildColumn(start, end) {
    const range = Array.from({ length: end - start + 1 }, (_, i) => start + i);
    shuffle(range);
    return range.slice(0, 5);
  }

  function generateBoard() {
    const columns = [
      buildColumn(1, 15),
      buildColumn(16, 30),
      buildColumn(31, 45),
      buildColumn(46, 60),
      buildColumn(61, 75),
    ];

    boardState = [];
    for (let row = 0; row < 5; row += 1) {
      for (let col = 0; col < 5; col += 1) {
        const index = row * 5 + col;
        const value = index === FREE_INDEX ? "FREE" : columns[col][row];
        boardState.push({ value, checked: index === FREE_INDEX });
      }
    }

    renderBoard();
    updateLines();
  }

  function renderBoard() {
    boardGrid.innerHTML = "";
    boardState.forEach((cell, index) => {
      const div = document.createElement("button");
      div.type = "button";
      div.className = "board__cell";
      if (cell.checked) div.classList.add("checked");
      if (cell.value === "FREE") div.classList.add("free");
      div.dataset.index = index;
      div.textContent = cell.value;
      div.addEventListener("click", () => toggleCell(index));
      boardGrid.appendChild(div);
    });
  }

  function toggleCell(index) {
    const cell = boardState[index];
    if (cell.value === "FREE") return;
    cell.checked = !cell.checked;
    renderBoard();
    updateLines();
  }

  function updateLines() {
    const missingPerLine = LINES.map((line) =>
      line
        .filter((idx) => !boardState[idx].checked)
        .map((idx) => boardState[idx].value)
        .filter((v) => v !== "FREE")
    );
    const missingCounts = missingPerLine.map((arr) => arr.length);
    const bingoCount = missingCounts.filter((count) => count === 0).length;
    const reachCount = missingCounts.filter((count) => count === 1).length;

    linesChip.textContent = `ビンゴ ${bingoCount} / リーチ ${reachCount}`;

    const reachNumbers = Array.from(
      new Set(
        missingPerLine
          .filter((arr) => arr.length === 1)
          .flat()
      )
    ).sort((a, b) => a - b);
    const toReachNumbers = Array.from(
      new Set(
        missingPerLine
          .filter((arr) => arr.length === 2)
          .flat()
      )
    ).sort((a, b) => a - b);

    progressHeadline.classList.remove("pulse");
    progressHeadline.classList.remove("burst");

    if (bingoCount > 0) {
      progressHeadline.textContent = `ビンゴ ${bingoCount} 本！`;
      progressHeadline.classList.add("burst");
      progressDetail.textContent =
        reachCount > 0
          ? `さらに ${reachCount} 本がリーチ中。次の番号で連鎖ビンゴの予感。`
          : "おめでとう！続けてラインを狙おう。";
      progressDetail.textContent = `${pickCommentary("bingo")} ${progressDetail.textContent}`;
    } else if (reachCount > 0) {
      progressHeadline.textContent = `リーチ ${reachCount} ライン！`;
      progressHeadline.classList.add("pulse");
      const picks = reachNumbers.slice(0, 5).join(", ");
      progressDetail.textContent = picks
        ? `次に ${picks} が出たらビンゴ！`
        : "次の番号で一気に揃うかも。目が離せない！";
      progressDetail.textContent = `${pickCommentary("reach")} ${progressDetail.textContent}`;
    } else {
      if (toReachNumbers.length) {
        progressHeadline.textContent = "もうすぐリーチ。";
        const picks = toReachNumbers.slice(0, 5).join(", ");
        progressDetail.textContent = picks
          ? `次に ${picks} が出たらリーチに入ります。`
          : "次に出る番号でリーチが見えてきます。";
        progressDetail.textContent = `${pickCommentary("near")} ${progressDetail.textContent}`;
      } else {
        progressHeadline.textContent = "まだ序盤。マスを埋めよう。";
        progressDetail.textContent = "出た番号をタップして進行してください。";
        progressDetail.textContent = `${pickCommentary("near")} ${progressDetail.textContent}`;
      }
    }

    boardHint.textContent = "";
  }

  function pickCommentary(type) {
    const list = commentary[type] || commentary.near;
    const index = Math.floor(Math.random() * list.length);
    return list[index];
  }

  function bindEvents() {
  }

  function init() {
    if (!boardGrid) return;
    if (boardHint) boardHint.style.display = "none";
    bindEvents();
    generateBoard();
  }

  init();
})();
