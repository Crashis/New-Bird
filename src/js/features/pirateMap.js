// Pirátská mapa — 3×3 mřížka, vstup 1 Err kostka, náhodný poklad / past / nic.

const PIRATE_MAP_ENTRY_COST = 1;

let pirateMapState = 'idle'; // 'idle' | 'active' | 'done'
let pirateMapTiles = [];     // pole 9 typů: 'big' | 'small' | 'trap' | 'empty' | 'err'
let pirateMapOpenedIndex = -1;
let pirateMapBusy = false;

function pirateRandInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function shuffleArr(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function generatePirateMapTiles() {
  // 1 velký poklad, 1 malý poklad, 2 pasti, zbytek prázdno.
  // 10–15 % šance, že jedno prázdné pole bude Err kostka (max 1).
  const tiles = ['big', 'small', 'trap', 'trap'];
  while (tiles.length < 9) tiles.push('empty');
  shuffleArr(tiles);

  if (Math.random() < 0.125) {
    const emptyIdx = tiles.findIndex(t => t === 'empty');
    if (emptyIdx !== -1) tiles[emptyIdx] = 'err';
  }
  return tiles;
}

function setPirateMapStatus(msg, type) {
  const el = document.getElementById('pirateMapStatus');
  if (!el) return;
  el.textContent = msg;
  el.className = 'pirate-map-status' + (type ? ' ' + type : '');
}

function renderPirateMapGrid() {
  const container = document.getElementById('pirateMapGrid');
  if (!container) return;
  container.innerHTML = '';

  for (let i = 0; i < 9; i++) {
    const div = document.createElement('div');
    div.className = 'pirate-map-tile';

    if (pirateMapState === 'active' && pirateMapOpenedIndex === -1) {
      div.classList.add('clickable');
      div.textContent = '?';
      div.onclick = () => openPirateMapTile(i);
    } else if (pirateMapState === 'done') {
      const t = pirateMapTiles[i] || 'empty';
      if (i === pirateMapOpenedIndex) {
        div.classList.add('revealed');
        div.textContent = pirateMapTileEmoji(t);
      } else {
        div.classList.add('dimmed');
        div.textContent = pirateMapTileEmoji(t);
      }
    } else {
      div.textContent = '·';
      div.classList.add('locked');
    }
    container.appendChild(div);
  }

  const startBtn = document.getElementById('pirateMapStartBtn');
  if (startBtn) {
    startBtn.disabled = pirateMapBusy || pirateMapState === 'active';
    startBtn.classList.toggle('disabled', startBtn.disabled);
  }
}

function pirateMapTileEmoji(t) {
  switch (t) {
    case 'big': return '💰';
    case 'small': return '🪙';
    case 'trap': return '💀';
    case 'err': return '🎲';
    case 'empty':
    default: return '·';
  }
}

function startPirateMapAttempt() {
  if (pirateMapBusy) return;
  if (pirateMapState === 'active') return;
  pirateMapBusy = true;

  if ((typeof errCubes !== 'number') || errCubes < PIRATE_MAP_ENTRY_COST) {
    setPirateMapStatus("You don't have any Err Cubes.", 'error');
    pirateMapBusy = false;
    renderPirateMapGrid();
    return;
  }

  errCubes -= PIRATE_MAP_ENTRY_COST;
  saveErrCubes();
  if (typeof updateEconomyUi === 'function') updateEconomyUi();

  pirateMapTiles = generatePirateMapTiles();
  pirateMapOpenedIndex = -1;
  pirateMapState = 'active';
  setPirateMapStatus('Pick one tile on the map.', 'info');
  renderPirateMapGrid();
  pirateMapBusy = false;
}

function openPirateMapTile(index) {
  if (pirateMapState !== 'active') return;
  if (pirateMapOpenedIndex !== -1) return;
  if (pirateMapBusy) return;
  pirateMapBusy = true;

  pirateMapOpenedIndex = index;
  pirateMapState = 'done';
  const t = pirateMapTiles[index] || 'empty';

  let msg = '';
  let kind = 'info';

  if (t === 'big') {
    const reward = pirateRandInt(20, 40);
    yang += reward;
    saveEconomy();
    msg = `💰 Big treasure! +${reward} Yang.`;
    kind = 'win';
  } else if (t === 'small') {
    const reward = pirateRandInt(10, 20);
    yang += reward;
    saveEconomy();
    msg = `🪙 Small treasure! +${reward} Yang.`;
    kind = 'win';
  } else if (t === 'trap') {
    const lost = Math.min(5, yang);
    yang = Math.max(0, yang - 5);
    saveEconomy();
    msg = `💀 Trap! You lost ${lost} Yang.`;
    kind = 'lose';
  } else if (t === 'err') {
    errCubes += 1;
    saveErrCubes();
    msg = '🎲 You found another Err Cube!';
    kind = 'win';
  } else {
    msg = 'Nothing… the chest was empty.';
    kind = 'info';
  }

  if (typeof updateEconomyUi === 'function') updateEconomyUi();
  setPirateMapStatus(msg, kind);
  renderPirateMapGrid();
  pirateMapBusy = false;
}

function initPirateMap() {
  pirateMapState = 'idle';
  pirateMapOpenedIndex = -1;
  pirateMapTiles = [];
  pirateMapBusy = false;
  setPirateMapStatus('Pay 1 Err Cube, pick one tile on the map and hope for treasure.', 'info');
  renderPirateMapGrid();
}
