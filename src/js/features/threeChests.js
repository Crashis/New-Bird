// Tři truhly — 5 truhel, výběr 1, odměna dle náhody, 1× denně, vstup 10 yangů.

const THREE_CHESTS_DATE_KEY = 'threeChestsLastPlayedDate';
const CHEST_ENTRY_COST = 10;

const THREE_CHESTS_REWARDS = [
  { yang: 225, wallets: 15, dragonCoins: 8  },
  { yang: 150, wallets: 9,  dragonCoins: 5  },
  { yang: 113, wallets: 5,  dragonCoins: 3  },
  { yang: 99,  wallets: 3,  dragonCoins: 2  },
  { yang: 75,  wallets: 0,  dragonCoins: 0  },
];

let threeChestsState = 'idle'; // 'idle' | 'active' | 'done'
let threeChestsRewardMap = [];  // shuffled reward indices [0..4] for each chest slot
let threeChestsOpenedIndex = -1;

function getLocalDateString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function threeChestsPlayedToday() {
  try {
    return localStorage.getItem(THREE_CHESTS_DATE_KEY) === getLocalDateString();
  } catch (e) { return false; }
}

function saveThreeChestsPlayed() {
  try { localStorage.setItem(THREE_CHESTS_DATE_KEY, getLocalDateString()); } catch (e) {}
}

function setThreeChestsStatus(msg, type) {
  const el = document.getElementById('threeChestsStatus');
  if (!el) return;
  el.textContent = msg;
  el.className = 'three-chests-status' + (type ? ' ' + type : '');
}

function startThreeChests() {
  if (threeChestsPlayedToday()) {
    setThreeChestsStatus(t('threeChests.playedToday'), 'error');
    return;
  }
  if (yang < CHEST_ENTRY_COST) {
    setThreeChestsStatus(t('threeChests.notEnough', { cost: CHEST_ENTRY_COST }), 'error');
    return;
  }

  yang -= CHEST_ENTRY_COST;
  saveEconomy();
  updateEconomyUi();

  // Fisher-Yates shuffle reward indices
  const indices = [0, 1, 2, 3, 4];
  for (let i = 4; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  threeChestsRewardMap = indices;
  threeChestsOpenedIndex = -1;
  threeChestsState = 'active';
  setThreeChestsStatus(t('threeChests.pickOne'), 'info');
  renderThreeChestsGrid();
}

function openChest(chestIndex) {
  if (threeChestsState !== 'active') return;
  if (threeChestsOpenedIndex !== -1) return;

  threeChestsOpenedIndex = chestIndex;
  threeChestsState = 'done';

  const rewardIdx = threeChestsRewardMap[chestIndex];
  const reward = THREE_CHESTS_REWARDS[rewardIdx];

  yang += reward.yang;
  if (reward.wallets)     wallets += reward.wallets;
  if (reward.dragonCoins) dragonCoins += reward.dragonCoins;
  saveEconomy();
  if (reward.dragonCoins) saveDragonCoins();
  updateEconomyUi();
  saveThreeChestsPlayed();

  const wTxt = reward.wallets > 0 ? t('threeChests.openedWallets', { amount: reward.wallets }) : '';
  const dcTxt = reward.dragonCoins > 0 ? t('threeChests.openedDragonCoins', { amount: reward.dragonCoins }) : '';
  setThreeChestsStatus(t('threeChests.opened', { y: reward.yang, wallets: wTxt, dragonCoins: dcTxt }), 'win');

  if (typeof unlockAchievement === 'function') unlockAchievement('chest_hunter');

  renderThreeChestsGrid();
}

function renderThreeChestsGrid() {
  const container = document.getElementById('threeChestsList');
  if (!container) return;

  container.innerHTML = '';

  for (let i = 0; i < 5; i++) {
    const div = document.createElement('div');
    div.className = 'chest-item';

    const opened = threeChestsState === 'done' && i === threeChestsOpenedIndex;
    const dimmed  = threeChestsState === 'done' && i !== threeChestsOpenedIndex;

    if (opened) {
      div.classList.add('opened');
      const r = THREE_CHESTS_REWARDS[threeChestsRewardMap[i]];
      div.innerHTML = `<div class="chest-emoji">📦</div><div class="chest-label">${r.yang}Y · ${r.wallets}P · ${r.dragonCoins}DC</div>`;
    } else if (dimmed) {
      div.classList.add('dimmed');
      div.innerHTML = `<div class="chest-emoji">🧰</div>`;
    } else {
      div.innerHTML = `<div class="chest-emoji">🧰</div>`;
      if (threeChestsState === 'active') {
        div.classList.add('clickable');
        div.onclick = () => openChest(i);
      }
    }

    container.appendChild(div);
  }

  const startBtn = document.getElementById('threeChestsStartBtn');
  if (startBtn) {
    startBtn.style.display = (threeChestsState === 'idle') ? '' : 'none';
  }
}

function initThreeChests() {
  threeChestsState = 'idle';
  threeChestsOpenedIndex = -1;
  threeChestsRewardMap = [];

  if (threeChestsPlayedToday()) {
    setThreeChestsStatus(t('threeChests.playedToday'), 'error');
  } else {
    setThreeChestsStatus(t('threeChests.statusInit', { cost: CHEST_ENTRY_COST }), 'info');
  }
  renderThreeChestsGrid();
}
