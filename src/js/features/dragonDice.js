// Dračí kostka — sázky pouze v dračích mincích.
// Typy sázek: přesné číslo (výhra 3× vklad) nebo sudé/liché (výhra 2× vklad).
// Animace hodu trvá ~3 sekundy, během ní nelze znovu hodit.

const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

let dragonDiceRolling = false;
let dragonDiceAnimInterval = null;

function setDragonDiceStatus(msg, type) {
  const el = document.getElementById('dragonDiceStatus');
  if (!el) return;
  el.textContent = msg;
  el.className = 'dragon-dice-status' + (type ? ' ' + type : '');
}

function updateDragonDiceFace(faceChar) {
  const el = document.getElementById('dragonDiceFace');
  if (el) el.textContent = faceChar;
}

function setDragonDiceUiDisabled(disabled) {
  const ids = ['dragonDiceRollBtn', 'dragonDiceBetInput'];
  for (const id of ids) {
    const el = document.getElementById(id);
    if (el) el.disabled = disabled;
  }
  document.querySelectorAll('.dice-bet-type-btn, .dice-num-btn, .dice-parity-btn').forEach(b => {
    b.disabled = disabled;
  });
}

function selectDiceBetType(type) {
  if (dragonDiceRolling) return;
  document.querySelectorAll('.dice-bet-type-btn').forEach(b => {
    b.classList.toggle('selected', b.dataset.type === type);
  });
  // Vymaž výběr čísla/parity při přepnutí
  document.querySelectorAll('.dice-num-btn, .dice-parity-btn').forEach(b => b.classList.remove('selected'));

  const numSel = document.getElementById('dragonDiceNumberSelector');
  const parSel = document.getElementById('dragonDiceParitySelector');
  if (numSel) numSel.style.display = type === 'number' ? 'flex' : 'none';
  if (parSel) parSel.style.display = type === 'parity' ? 'flex' : 'none';
}

function selectDiceNumber(num) {
  if (dragonDiceRolling) return;
  document.querySelectorAll('.dice-num-btn').forEach(b => {
    b.classList.toggle('selected', parseInt(b.dataset.num, 10) === num);
  });
}

function selectDiceParity(parity) {
  if (dragonDiceRolling) return;
  document.querySelectorAll('.dice-parity-btn').forEach(b => {
    b.classList.toggle('selected', b.dataset.parity === parity);
  });
}

function rollDragonDice() {
  if (dragonDiceRolling) return;

  // Validace sázky
  const betInput = document.getElementById('dragonDiceBetInput');
  const raw = betInput ? betInput.value : '';
  if (!/^[1-9][0-9]*$/.test(String(raw).trim())) {
    setDragonDiceStatus('Zadej platnou sázku (kladné celé číslo).', 'error');
    return;
  }
  const bet = parseInt(raw, 10);
  if (bet > dragonCoins) {
    setDragonDiceStatus('Nemáš dost dračích mincí.', 'error');
    return;
  }

  // Validace typu sázky
  const betTypeBtn = document.querySelector('.dice-bet-type-btn.selected');
  if (!betTypeBtn) {
    setDragonDiceStatus('Vyber typ sázky (číslo nebo sudé/liché).', 'error');
    return;
  }
  const betType = betTypeBtn.dataset.type;

  let betValue = null;
  if (betType === 'number') {
    const numBtn = document.querySelector('.dice-num-btn.selected');
    if (!numBtn) {
      setDragonDiceStatus('Vyber číslo (1–6).', 'error');
      return;
    }
    betValue = parseInt(numBtn.dataset.num, 10);
  } else {
    const parBtn = document.querySelector('.dice-parity-btn.selected');
    if (!parBtn) {
      setDragonDiceStatus('Vyber sudé nebo liché.', 'error');
      return;
    }
    betValue = parBtn.dataset.parity;
  }

  // Odečti sázku
  if (!spendDragonCoins(bet)) {
    setDragonDiceStatus('Nemáš dost dračích mincí.', 'error');
    return;
  }

  dragonDiceRolling = true;
  if (typeof unlockAchievement === 'function') unlockAchievement('dragon_gambler');
  setDragonDiceUiDisabled(true);
  setDragonDiceStatus('Kostka se kutálí...', 'rolling');

  const diceEl = document.getElementById('dragonDiceFace');
  if (diceEl) diceEl.classList.add('rolling');

  let frame = 0;
  dragonDiceAnimInterval = setInterval(() => {
    frame++;
    updateDragonDiceFace(DICE_FACES[Math.floor(Math.random() * 6)]);

    if (frame >= 20) {
      clearInterval(dragonDiceAnimInterval);
      dragonDiceAnimInterval = null;
      if (diceEl) diceEl.classList.remove('rolling');

      const finalNum = Math.floor(Math.random() * 6) + 1;
      updateDragonDiceFace(DICE_FACES[finalNum - 1]);

      let won = false;
      let payout = 0;

      if (betType === 'number') {
        if (finalNum === betValue) {
          won = true;
          payout = bet * 3;
        }
      } else {
        const isEven = finalNum % 2 === 0;
        if ((betValue === 'even' && isEven) || (betValue === 'odd' && !isEven)) {
          won = true;
          payout = bet * 2;
        }
      }

      if (won) {
        addDragonCoins(payout);
        const typeName = betType === 'number'
          ? `číslo ${betValue}`
          : (betValue === 'even' ? 'sudé' : 'liché');
        setDragonDiceStatus(
          `Padla ${finalNum}! Trefil jsi ${typeName} a vyhráváš ${payout} dračích mincí.`,
          'win'
        );
      } else {
        const typeName = betType === 'number'
          ? `číslo ${betValue}`
          : (betValue === 'even' ? 'sudé' : 'liché');
        setDragonDiceStatus(
          `Padla ${finalNum}. Netrefil jsi ${typeName}. Sázka nevyšla.`,
          'lose'
        );
      }

      dragonDiceRolling = false;
      setDragonDiceUiDisabled(false);
    }
  }, 150);
}

function initDragonDice() {
  if (dragonDiceAnimInterval) {
    clearInterval(dragonDiceAnimInterval);
    dragonDiceAnimInterval = null;
  }
  dragonDiceRolling = false;
  updateDragonDiceFace('🎲');
  setDragonDiceStatus('Vyber typ sázky, zadej počet dračích mincí a hoď kostkou.', 'info');
  document.querySelectorAll('.dice-bet-type-btn, .dice-num-btn, .dice-parity-btn').forEach(b => b.classList.remove('selected'));
  const numSel = document.getElementById('dragonDiceNumberSelector');
  const parSel = document.getElementById('dragonDiceParitySelector');
  if (numSel) numSel.style.display = 'none';
  if (parSel) parSel.style.display = 'none';
  const betInput = document.getElementById('dragonDiceBetInput');
  if (betInput) betInput.value = '';
}
