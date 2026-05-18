// ===== SKINS — Player / Trails / Specials panel =====

let currentSkinCategory = 'player';

function getSelectedSkin() {
  return SKINS.find(s => s.id === selectedSkinId) || SKINS[0];
}

function setSelectedSkin(id) {
  selectedSkinId = id;
  try { localStorage.setItem('nw_flappy_selected_skin', id); } catch (e) {}
  try { if (window.NWCloudSave && typeof window.NWCloudSave.queueCloudSave === 'function') window.NWCloudSave.queueCloudSave('skin-select'); } catch (e) {}
}

function isSelectedSkin(id) { return selectedSkinId === id; }

function toggleSkinsPanel(forceOpen) {
  const panel = document.getElementById('skinsPanel');
  if (!panel) return;
  const open = typeof forceOpen === 'boolean' ? forceOpen : !panel.classList.contains('active');
  if (open && gameState === 'playing') {
    activeVoiceLine = t('panel.skinsBlocked');
    activeVoiceLineUntil = performance.now() + 2800;
    return;
  }
  if (typeof closeOtherPanels === 'function') closeOtherPanels('skinsPanel');
  panel.classList.toggle('active', open);
  if (open) renderSkinsPanel();
}

function setSkinCategory(cat) {
  if (cat !== 'player' && cat !== 'trails' && cat !== 'specials') return;
  currentSkinCategory = cat;
  document.querySelectorAll('.skin-tab, .skins-tab').forEach(b => {
    b.classList.toggle('active', b.dataset.skinTab === cat);
  });
  renderSkinsPanel();
}

const _detailFocusedId = { player: null, trails: null, specials: null };

function renderSkinsPanel() {
  const grid = document.getElementById('skinsGrid');
  const detail = document.getElementById('skinsDetail');
  if (!grid || !detail) return;
  grid.innerHTML = '';

  const items = currentSkinCategory === 'player' ? SKINS
              : currentSkinCategory === 'trails' ? TRAILS
              : SPECIALS;

  if (!_detailFocusedId[currentSkinCategory]) {
    if (currentSkinCategory === 'player') _detailFocusedId.player = selectedSkinId || (items[0] && items[0].id) || null;
    else if (currentSkinCategory === 'trails') _detailFocusedId.trails = selectedTrailId || (items[0] && items[0].id) || null;
    else _detailFocusedId.specials = selectedSpecialIds[selectedSpecialIds.length - 1] || (items[0] && items[0].id) || null;
  }
  const focusId = _detailFocusedId[currentSkinCategory];

  for (const item of items) {
    const tile = document.createElement('div');
    tile.className = 'skin-tile';
    if (currentSkinCategory === 'player') {
      if (!item.unlocked) tile.classList.add('locked');
      if (item.id === selectedSkinId) tile.classList.add('equipped');
    } else if (currentSkinCategory === 'trails') {
      if (!item.unlocked) tile.classList.add('locked');
      if (item.id === selectedTrailId) tile.classList.add('equipped');
    } else {
      if (!item.unlocked) tile.classList.add('locked');
      if (isSpecialEquipped(item.id)) tile.classList.add('equipped');
    }
    if (item.id === focusId) tile.classList.add('selected');
    tile.onclick = () => { _detailFocusedId[currentSkinCategory] = item.id; renderSkinsPanel(); };

    const thumb = document.createElement('div');
    thumb.className = 'skin-tile-thumb';
    thumb.appendChild(buildTilePreview(item));
    tile.appendChild(thumb);

    const name = document.createElement('div');
    name.className = 'skin-tile-name';
    name.textContent = item.name;
    tile.appendChild(name);

    grid.appendChild(tile);
  }

  renderSkinDetail(detail, items.find(x => x.id === focusId) || items[0]);
}

function buildTilePreview(item) {
  if (item.category === 'player') {
    const img = document.createElement('img');
    const src = (skinImages.get(item.id) || headImg).src;
    img.src = src;
    return img;
  }
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const cx = c.getContext('2d');
  drawMiniPreview(cx, item, 32, 32, 26);
  return c;
}

function drawMiniPreview(cx, item, ox, oy, r) {
  cx.save();
  cx.beginPath(); cx.arc(ox, oy, r, 0, Math.PI*2);
  cx.fillStyle = '#3a2e1a'; cx.fill();
  cx.strokeStyle = '#c9a84c'; cx.lineWidth = 1.5; cx.stroke();
  if (item.category === 'trails') {
    if (item.type === 'glow') {
      const color = item.id === selectedTrailId ? selectedTrailColor : '#3aa7ff';
      for (let i = 0; i < 4; i++) {
        const x = ox - r - 6 - i * 8;
        const y = oy + (i % 2 === 0 ? -3 : 3);
        cx.fillStyle = trailHexToRgba(color, 0.6 - i * 0.12);
        cx.beginPath(); cx.arc(x, y, 5 - i * 0.7, 0, Math.PI*2); cx.fill();
      }
    } else {
      for (let i = 0; i < 4; i++) {
        const x = ox - r - 4 - i * 7;
        const y = oy + (Math.sin(i) * 4);
        cx.fillStyle = i === 0 ? '#ffd860' : (i < 2 ? '#ff8a30' : '#5a1a08');
        cx.beginPath(); cx.ellipse(x, y, 4 - i * 0.6, 5 - i * 0.7, 0, 0, Math.PI*2); cx.fill();
      }
    }
  } else if (item.category === 'specials') {
    if (item.id === 'ghost-rider') {
      cx.fillStyle = 'rgba(255,140,40,0.85)';
      cx.beginPath(); cx.ellipse(ox, oy - r + 4, r * 0.32, r * 0.55, 0, 0, Math.PI*2); cx.fill();
      cx.fillStyle = 'rgba(255,240,160,0.9)';
      cx.beginPath(); cx.ellipse(ox, oy - r, r * 0.16, r * 0.32, 0, 0, Math.PI*2); cx.fill();
    } else if (item.id === 'wraith-eyes') {
      for (const sign of [-1, 1]) {
        cx.fillStyle = 'rgba(190,120,255,0.9)';
        cx.beginPath(); cx.arc(ox + sign * r * 0.32, oy - r * 0.12, r * 0.13, 0, Math.PI*2); cx.fill();
      }
    }
  }
  cx.restore();
}

function renderSkinDetail(host, item) {
  host.innerHTML = '';
  if (!item) return;

  const preview = document.createElement('div');
  preview.className = 'detail-preview';
  preview.appendChild(buildDetailPreview(item));
  host.appendChild(preview);

  const name = document.createElement('div');
  name.className = 'detail-name';
  name.textContent = item.name;
  host.appendChild(name);

  const desc = document.createElement('div');
  desc.className = 'detail-desc';
  desc.textContent = item.desc || '';
  host.appendChild(desc);

  const meta = document.createElement('div');
  meta.className = 'detail-meta';
  meta.textContent = (item.category === 'player') ? '' : 'Kosmetický efekt — bez vlivu na gameplay';
  host.appendChild(meta);

  const status = document.createElement('div');
  const itemStatus = getSkinItemStatus(item);
  status.className = 'detail-status' + (itemStatus.kind === 'locked' ? ' locked' : '');
  status.textContent = itemStatus.label;
  host.appendChild(status);

  const cost = document.createElement('div');
  cost.className = 'detail-cost';
  if (!item.unlocked) {
    if (item.category === 'player' && item.priceWallets) {
      const pill = document.createElement('span');
      const can = wallets >= item.priceWallets;
      pill.className = 'cost-pill' + (can ? '' : ' unaffordable');
      pill.textContent = `${item.priceWallets} Peněženky`;
      cost.appendChild(pill);
    } else if (item.cost) {
      appendCostPills(cost, item.cost);
    }
  }
  host.appendChild(cost);

  if (item.category === 'trails' && item.customizableColor && item.unlocked) {
    const pick = document.createElement('div');
    pick.className = 'trail-color-picker';
    for (const c of TRAIL_COLOR_PALETTE) {
      const sw = document.createElement('div');
      sw.className = 'trail-color-swatch' + (c.hex.toLowerCase() === selectedTrailColor.toLowerCase() ? ' selected' : '');
      sw.style.background = c.hex;
      sw.title = c.id;
      sw.onclick = () => { setTrailColor(c.hex); renderSkinsPanel(); };
      pick.appendChild(sw);
    }
    host.appendChild(pick);
  }

  const actions = document.createElement('div');
  actions.className = 'detail-actions';
  appendDetailActions(actions, item);
  host.appendChild(actions);
}

function appendCostPills(host, cost) {
  const map = [
    { k: 'yang', label: 'Yang', cur: () => yang },
    { k: 'wallets', label: 'Peněženky', cur: () => wallets },
    { k: 'dragonCoins', label: 'Dračí mince', cur: () => dragonCoins },
    { k: 'errCubes', label: 'Err kostky', cur: () => errCubes }
  ];
  for (const m of map) {
    const v = cost[m.k];
    if (!v) continue;
    const pill = document.createElement('span');
    pill.className = 'cost-pill' + (m.cur() < v ? ' unaffordable' : '');
    pill.textContent = `${v} ${m.label}`;
    host.appendChild(pill);
  }
}

function appendDetailActions(host, item) {
  if (item.category === 'player') {
    if (!item.unlocked) {
      if (item.unlockMethod === 'cheat') {
        host.appendChild(makeBtn(t('skins.lockedCheatBtn'), null, true));
        return;
      }
      const price = item.priceWallets || 0;
      const can = wallets >= price;
      host.appendChild(makeBtn(t('skins.buy', { price }), () => tryBuyPlayerSkin(item.id), !can));
    } else if (item.id === selectedSkinId) {
      host.appendChild(makeBtn('Aktivn\u00ed', null, true));
    } else {
      host.appendChild(makeBtn(t('skins.select'), () => { setSelectedSkin(item.id); renderSkinsPanel(); }));
    }
  } else if (item.category === 'trails') {
    if (!item.unlocked) {
      host.appendChild(makeBtn('Koupit', () => { if (buyTrail(item.id)) renderSkinsPanel(); }, !canAffordTrail(item)));
    } else if (item.id === selectedTrailId) {
      host.appendChild(makeBtn('Sundat', () => { unequipTrail(); renderSkinsPanel(); }));
    } else {
      host.appendChild(makeBtn('Nasadit', () => { equipTrail(item.id); renderSkinsPanel(); }));
    }
  } else if (item.category === 'specials') {
    if (!item.unlocked) {
      host.appendChild(makeBtn('Koupit', () => { if (buySpecial(item.id)) renderSkinsPanel(); }, !canAffordSpecial(item)));
    } else if (isSpecialEquipped(item.id)) {
      host.appendChild(makeBtn('Sundat', () => { unequipSpecial(item.id); renderSkinsPanel(); }));
    } else {
      host.appendChild(makeBtn('Nasadit', () => { equipSpecial(item.id); renderSkinsPanel(); }));
    }
  }
}

function getSkinItemStatus(item) {
  if (!item || !item.unlocked) return { kind: 'locked', label: 'Zam\u010deno' };
  if (item.category === 'player' && item.id === selectedSkinId) return { kind: 'active', label: 'Aktivn\u00ed' };
  if (item.category === 'trails' && item.id === selectedTrailId) return { kind: 'active', label: 'Aktivn\u00ed' };
  if (item.category === 'specials' && isSpecialEquipped(item.id)) return { kind: 'active', label: 'Aktivn\u00ed' };
  return { kind: 'owned', label: 'Vlastn\u011bno' };
}

function makeBtn(label, onclick, disabled) {
  const b = document.createElement('button');
  b.className = 'game-btn primary';
  b.textContent = label;
  if (disabled) { b.disabled = true; b.classList.add('disabled'); }
  if (onclick) b.onclick = onclick;
  return b;
}

function buildDetailPreview(item) {
  if (item.category === 'player') {
    const img = document.createElement('img');
    img.src = (skinImages.get(item.id) || headImg).src;
    return img;
  }
  const c = document.createElement('canvas');
  c.width = 110; c.height = 110;
  const cx = c.getContext('2d');
  drawMiniPreview(cx, item, 55, 55, 42);
  return c;
}

function tryBuyPlayerSkin(id) {
  const skin = SKINS.find(s => s.id === id);
  if (!skin || skin.unlocked) return;
  if (skin.unlockMethod === 'cheat') return;
  const price = skin.priceWallets || 0;
  if (wallets < price) {
    activeVoiceLine = t('skins.notEnoughMsg', { price });
    activeVoiceLineUntil = performance.now() + 2800;
    renderSkinsPanel();
    return;
  }
  wallets -= price;
  skin.unlocked = true;
  saveUnlockedSkins();
  saveEconomy();
  updateEconomyUi();
  handleSkinUnlocked(skin);
  renderSkinsPanel();
}

function handleSkinUnlocked(skin) {
  if (!skin) return;
  const skinTrans = window.NWI18n ? window.NWI18n.getSkinTranslation(skin.id) : null;
  const displayName = skinTrans && skinTrans.name ? skinTrans.name : skin.name;
  showUnlockToast(t('toast.skinUnlocked'), t('skins.unlockedToast', { name: displayName }), 'skin');
  checkSkinAchievements(skin.id);
}

// ===== Legacy gameplay efekty Player skinů — beze změny =====

function applySelectedSkinEndGameEffects() {
  if (!isSelectedSkin(CRASHIS_SMAZENY_SKIN_ID)) return;
  if (Math.random() < 0.25) {
    const stolen = Math.min(2, yang);
    if (stolen > 0) {
      yang -= stolen;
      saveEconomy();
      updateEconomyUi();
      showUnlockToast(`-${stolen} Yangy`, t('toast.crashisYangLost'), 'achievement');
    }
  }
}

function applySelectedSkinStartEffects() {
  if (isSelectedSkin(MARTIN_SLUNECNY_SKIN_ID)) {
    doubleYangUntil = performance.now() + MARTIN_SLUNECNY_BUFF_MS;
    showUnlockToast(t('toast.solarStart'), t('toast.solarSub'), 'wallet');
  }
  if (typeof DOMI_DISKO_SKIN_ID !== 'undefined' && isSelectedSkin(DOMI_DISKO_SKIN_ID)) {
    if (typeof startDomiDiskoEffect === 'function') startDomiDiskoEffect();
  } else {
    if (typeof stopDomiDiskoEffect === 'function') stopDomiDiskoEffect();
  }
}

function applySelectedSkinRunStopEffects() {
  if (typeof stopDomiDiskoEffect === 'function') stopDomiDiskoEffect();
}

// Backwards-compat stuby — staré onclick handlery v jiných místech kódu mohou stále volat.
function nextSkin() {}
function previousSkin() {}
function selectCurrentSkin() {}
function tryBuyCurrentSkin() {}
