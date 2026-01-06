(() => {
  const TOTAL_NUMBERS = 75;
  const currentNumberEl = document.getElementById("currentNumber");
  const remainingEl = document.getElementById("remainingCount");
  const historyGridOrder = document.getElementById("historyGridOrder");
  const historyGridSorted = document.getElementById("historyGridSorted");
  const historyCountEl = document.getElementById("historyCount");
  const cardButtons = Array.from(document.querySelectorAll(".draw-card"));
  const holdState = new Map();
  const randomButton = document.getElementById("randomReveal");
  const hostTimestamp = document.getElementById("hostTimestamp");

  let deck = [];
  let history = [];
  let isRevealing = false;
  let cardNumbers = [];

  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  function initDeck() {
    deck = Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1);
    shuffle(deck);
    history = [];
    cardNumbers = cardButtons.map(() => takeFromDeck());
    currentNumberEl.textContent = "--";
    historyGridOrder.innerHTML = "";
    historyGridSorted.innerHTML = "";
    historyCountEl.textContent = "0 個";
    setHostTimestamp();
  }

  function revealFromDeck(card) {
    if (isRevealing) return;
    const idx = cardButtons.indexOf(card);
    if (idx === -1) return;
    const assigned = cardNumbers[idx];
    if (assigned === undefined) {
      if (!deck.length) {
        markCardInactive(card);
        updateRemaining();
        return;
      }
      cardNumbers[idx] = takeFromDeck();
    }
    isRevealing = true;
    resetCards();
    const number = cardNumbers[idx];
    showNumber(card, number, idx);
  }

  function renderHistory() {
    historyGridOrder.innerHTML = "";
    historyGridSorted.innerHTML = "";
    historyCountEl.textContent = `${history.length} 個`;
    const latest = history[history.length - 1];

    history.forEach((num, idx) => {
      const div = document.createElement("div");
      div.className = "history__item";
      if (idx === history.length - 1) div.classList.add("history__item--latest");
      div.textContent = num;
      historyGridOrder.appendChild(div);
    });

    const sorted = [...history].sort((a, b) => a - b);
    sorted.forEach((num) => {
      const div = document.createElement("div");
      div.className = "history__item";
      if (num === latest) div.classList.add("history__item--latest");
      div.textContent = num;
      historyGridSorted.appendChild(div);
    });
  }

  function bindEvents() {
    cardButtons.forEach((btn) => {
      holdState.set(btn, { timer: null, triggered: false });
      btn.addEventListener("pointerdown", (e) => {
        if (e.button !== 0) return;
        startHold(btn);
      });
      btn.addEventListener("pointerup", (e) => {
        if (e.button !== 0) return;
        releaseHold(btn, true);
      });
      btn.addEventListener("pointerleave", (e) => {
        if (e.button !== 0) return;
        releaseHold(btn, false);
      });
      btn.addEventListener("pointercancel", (e) => {
        if (e.button !== 0) return;
        releaseHold(btn, false);
      });
      btn.addEventListener("contextmenu", (e) => e.preventDefault());
      btn.addEventListener("touchstart", () => startHold(btn), { passive: true });
      btn.addEventListener("touchend", () => releaseHold(btn, true));
      btn.addEventListener("touchcancel", () => releaseHold(btn, false));
    });
    if (randomButton) {
      randomButton.addEventListener("click", revealRandomCard);
    }
  }

  function resetCards() {
    cardButtons.forEach((btn) => {
      if (btn.classList.contains("card--inactive")) return;
      btn.classList.remove("revealed");
      const numEl = btn.querySelector(".card__number");
      numEl.textContent = "--";
    });
    isRevealing = false;
  }

  function showNumber(card, number, idx) {
    card.classList.add("revealed");
    const numEl = card.querySelector(".card__number");
    numEl.textContent = number;
    currentNumberEl.textContent = "--";

    setTimeout(() => {
      currentNumberEl.textContent = number;
      history.push(number);
      cardNumbers[idx] = takeFromDeck();
      if (cardNumbers[idx] === undefined) {
        markCardInactive(card);
      }
      renderHistory();
    }, 550);

    setTimeout(() => {
      resetCards();
      isRevealing = false;
    }, 1200);
  }

  function promptCustomNumber(card) {
    const idx = cardButtons.indexOf(card);
    if (idx === -1) return;
    const input = window.prompt("カードに設定する番号 (1-75):", "");
    if (!input) return;
    const num = Number(input);
    if (!Number.isInteger(num) || num < 1 || num > 75) return;
    assignNumber(idx, num);
  }

  function startHold(card) {
    if (card.classList.contains("card--inactive")) return;
    const state = holdState.get(card);
    if (!state) return;
    clearTimeout(state.timer);
    state.triggered = false;
    state.timer = setTimeout(() => {
      state.triggered = true;
      promptCustomNumber(card);
    }, 650);
  }

  function releaseHold(card, shouldReveal) {
    if (card.classList.contains("card--inactive")) return;
    const state = holdState.get(card);
    if (!state) return;
    clearTimeout(state.timer);
    if (state.triggered) {
      state.triggered = false;
      return;
    }
    if (shouldReveal) {
      revealFromDeck(card);
    }
  }

  function revealRandomCard() {
    const available = cardButtons.filter((btn) => !btn.classList.contains("card--inactive"));
    if (!available.length) return;
    const pick = available[Math.floor(Math.random() * available.length)];
    revealFromDeck(pick);
  }

  function updateRemaining() {
    const pending = cardNumbers.filter((n) => n !== undefined).length;
    // remaining display removed
  }

  function takeFromDeck() {
    return deck.length ? deck.pop() : undefined;
  }

  function assignNumber(idx, num) {
    if (history.includes(num)) {
      alert("既に出た番号は指定できません。");
      return;
    }
    const otherIdx = cardNumbers.findIndex((n, i) => i !== idx && n === num);
    const previous = cardNumbers[idx];

    // remove desired number from deck if it exists there
    const deckIdx = deck.indexOf(num);
    if (deckIdx !== -1) deck.splice(deckIdx, 1);

    cardNumbers[idx] = num;

    if (otherIdx !== -1) {
      const replacement = previous !== undefined ? previous : takeFromDeck();
      cardNumbers[otherIdx] = replacement;
    } else if (previous !== undefined && previous !== num) {
      deck.push(previous);
    }

    shuffle(deck);
    resetCards();
  }

  function markCardInactive(card) {
    card.classList.add("card--inactive");
    card.setAttribute("disabled", "disabled");
    const numEl = card.querySelector(".card__number");
    if (numEl) numEl.textContent = "--";
  }

  function init() {
    if (!cardButtons.length) return;
    bindEvents();
    initDeck();
    setHostTimestamp();
  }

  init();

  function setHostTimestamp() {
    if (!hostTimestamp) return;
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const hh = String(now.getHours()).padStart(2, "0");
    const mi = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    hostTimestamp.textContent = `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
  }
})();
