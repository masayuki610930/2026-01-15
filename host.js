(() => {
  const TOTAL_NUMBERS = 75;
  const currentNumberEl = document.getElementById("currentNumber");
  const remainingEl = document.getElementById("remainingCount");
  const historyGridOrder = document.getElementById("historyGridOrder");
  const historyGridSorted = document.getElementById("historyGridSorted");
  const historyCountEl = document.getElementById("historyCount");
  const cardButtons = Array.from(document.querySelectorAll(".draw-card"));
  const prizeButtons = Array.from(document.querySelectorAll(".prize-card"));
  const holdState = new Map();
  const randomButton = document.getElementById("randomReveal");
  const hostTimestamp = document.getElementById("hostTimestamp");
  const prizeModal = document.getElementById("prizeModal");
  const openPrizeModalBtn = document.getElementById("openPrizeModal");
  const closePrizeModalBtn = document.getElementById("closePrizeModal");
  const savePrizeModalBtn = document.getElementById("savePrizeModal");
  const remoteCountSelect = document.getElementById("remoteCountSelect");
  const totalPrizeCountSelect = document.getElementById("totalPrizeCountSelect");
  const prizeInputsContainer = document.getElementById("prizeInputsContainer");
  const prizeTextArea = document.getElementById("prizeText");
  const importPrizeTextBtn = document.getElementById("importPrizeText");
  const exportPrizeTextBtn = document.getElementById("exportPrizeText");

  let deck = [];
  let history = [];
  let isRevealing = false;
  let cardNumbers = [];
  let remoteCount = 0;
  let totalPrizes = prizeButtons.length;
  let hostTimestampSet = false;
  const PRIZE_KEYS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
  const prizeMap = PRIZE_KEYS.reduce((acc, key) => {
    acc[key] = `${key}賞`;
    return acc;
  }, {});

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
    hostTimestampSet = false;
    if (hostTimestamp) hostTimestamp.textContent = "";
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

    if (!hostTimestampSet) {
      setHostTimestamp();
      hostTimestampSet = true;
    }
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
    prizeButtons.forEach((btn) => {
      btn.addEventListener("click", () => revealPrize(btn));
    });
    if (openPrizeModalBtn) openPrizeModalBtn.addEventListener("click", showPrizeModal);
    if (closePrizeModalBtn) closePrizeModalBtn.addEventListener("click", hidePrizeModal);
    if (savePrizeModalBtn) savePrizeModalBtn.addEventListener("click", savePrizeSettings);
    if (importPrizeTextBtn) importPrizeTextBtn.addEventListener("click", importPrizeText);
    if (exportPrizeTextBtn) exportPrizeTextBtn.addEventListener("click", exportPrizeText);
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
    setPrizeLabels();
    renderPrizeInputs();
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

  function revealPrize(button) {
    if (button.classList.contains("prize-card--hidden")) return;
    const key = button.dataset.prize;
    const idx = prizeButtons.indexOf(button);
    const isRemote = idx > -1 && idx < remoteCount;
    const defaultLabel = `${key}${isRemote ? " ※" : ""}`;

    if (button.classList.contains("revealed")) {
      button.classList.remove("revealed");
      button.classList.toggle("prize-card--remote", isRemote);
      const inner = button.querySelector(".prize__inner");
      if (inner) inner.textContent = defaultLabel;
      return;
    }

    const text = `${prizeMap[key] || `${key}賞`}${isRemote ? " ※" : ""}`;
    button.classList.add("revealed");
    const inner = button.querySelector(".prize__inner");
    if (inner) inner.textContent = text;
  }

  function setPrizeLabels() {
    prizeButtons.forEach((btn, idx) => {
      const key = btn.dataset.prize;
      const inner = btn.querySelector(".prize__inner");
      const isRemote = idx < remoteCount;
      if (idx >= totalPrizes) {
        btn.classList.add("prize-card--hidden");
        btn.classList.remove("revealed", "prize-card--remote");
        if (inner) inner.textContent = `${key}賞`;
        return;
      }
      btn.classList.remove("prize-card--hidden");
      btn.classList.remove("revealed");
      btn.classList.toggle("prize-card--remote", isRemote);
      if (inner) inner.textContent = `${key}${isRemote ? " ※" : ""}`;
    });
  }

  function showPrizeModal() {
    if (!prizeModal) return;
    prizeModal.classList.remove("hidden");
    if (remoteCountSelect) remoteCountSelect.value = remoteCount;
    if (totalPrizeCountSelect) totalPrizeCountSelect.value = totalPrizes;
    renderPrizeInputs();
  }

  function hidePrizeModal() {
    if (!prizeModal) return;
    prizeModal.classList.add("hidden");
  }

  function savePrizeSettings() {
    const remoteVal = remoteCountSelect ? Number(remoteCountSelect.value) : 0;
    const totalVal = totalPrizeCountSelect ? Number(totalPrizeCountSelect.value) : prizeButtons.length;
    totalPrizes = Number.isInteger(totalVal) ? Math.max(0, Math.min(totalVal, prizeButtons.length)) : prizeButtons.length;
    remoteCount = Number.isInteger(remoteVal) ? Math.max(0, Math.min(remoteVal, totalPrizes)) : 0;
    const inputs = prizeInputsContainer ? Array.from(prizeInputsContainer.querySelectorAll("[data-prize-input]")) : [];
    inputs.forEach((input) => {
      const key = input.dataset.prizeInput;
      if (!key) return;
      const val = input.value.trim();
      if (val) prizeMap[key] = val;
    });
    setPrizeLabels();
    hidePrizeModal();
  }

  function renderPrizeInputs() {
    if (!prizeInputsContainer) return;
    prizeInputsContainer.innerHTML = "";
    const fragment = document.createDocumentFragment();
    PRIZE_KEYS.slice(0, totalPrizes).forEach((key) => {
      const label = document.createElement("label");
      label.textContent = ` ${key}: `;
      const input = document.createElement("input");
      input.type = "text";
      input.dataset.prizeInput = key;
      input.value = prizeMap[key] || `${key}賞`;
      label.appendChild(input);
      fragment.appendChild(label);
    });
    prizeInputsContainer.appendChild(fragment);
  }

  function exportPrizeText() {
    if (!prizeTextArea) return;
    const lines = [];
    lines.push(`total=${totalPrizes}`);
    lines.push(`remote=${remoteCount}`);
    PRIZE_KEYS.slice(0, totalPrizes).forEach((key) => {
      lines.push(`${key}:${prizeMap[key] || `${key}賞`}`);
    });
    prizeTextArea.value = lines.join("\n");
  }

  function importPrizeText() {
    if (!prizeTextArea) return;
    const text = prizeTextArea.value || "";
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    let newTotal = totalPrizes;
    let newRemote = remoteCount;
    const newMap = { ...prizeMap };
    lines.forEach((line) => {
      if (line.startsWith("total=")) {
        const val = Number(line.split("=")[1]);
        if (Number.isInteger(val)) newTotal = Math.max(0, Math.min(val, prizeButtons.length));
      } else if (line.startsWith("remote=")) {
        const val = Number(line.split("=")[1]);
        if (Number.isInteger(val)) newRemote = Math.max(0, Math.min(val, prizeButtons.length));
      } else {
        const [keyRaw, ...rest] = line.split(":");
        const key = keyRaw ? keyRaw.trim().toUpperCase() : "";
        const val = rest.join(":").trim();
        if (PRIZE_KEYS.includes(key) && val) {
          newMap[key] = val;
        }
      }
    });
    totalPrizes = newTotal;
    remoteCount = Math.min(newRemote, totalPrizes);
    Object.assign(prizeMap, newMap);
    if (remoteCountSelect) remoteCountSelect.value = remoteCount;
    if (totalPrizeCountSelect) totalPrizeCountSelect.value = totalPrizes;
    renderPrizeInputs();
    setPrizeLabels();
  }
})();
