// Skořápkář — kámen / nůžky / papír o Yangy.
// Sázka se odečte při uzamčení (locked bet model).
// Výhra připíše bet * 2 (čistý zisk +bet). Prohra už nic neodečítá.
// Remíza pokračuje dalším kolem se stejnou aktivní sázkou.

let shellGameActiveBet = 0;
let shellGameLastResult = null; // 'win' | 'lose' | 'draw' | null
let shellGameStatusKey = null;
let shellGameStatusParams = null;
let shellGameLastPlayerChoice = null;
let shellGameLastEnemyChoice = null;

const SHELL_CHOICES = ['rock', 'paper', 'scissors'];

function getRandomShellGameChoice() {
  return SHELL_CHOICES[Math.floor(Math.random() * SHELL_CHOICES.length)];
}

function resolveRockPaperScissors(playerChoice, enemyChoice) {
  if (playerChoice === enemyChoice) return 'draw';
  if (
    (playerChoice === 'rock' && enemyChoice === 'scissors') ||
    (playerChoice === 'scissors' && enemyChoice === 'paper') ||
    (playerChoice === 'paper' && enemyChoice === 'rock')
  ) return 'win';
  return 'lose';
}

function setShellGameStatus(key, params) {
  shellGameStatusKey = key || null;
  shellGameStatusParams = params || null;
  renderShellGamePanel();
}

function resetShellGameRound() {
  shellGameActiveBet = 0;
  shellGameLastResult = null;
  shellGameLastPlayerChoice = null;
  shellGameLastEnemyChoice = null;
  setShellGameStatus('shellGame.ready');
}

function startShellGameBet() {
  const input = document.getElementById('shellGameBetInput');
  if (!input) return;
  const raw = input.value;
  // Reject non-integer / negative / zero / NaN / floats.
  if (!/^[0-9]+$/.test(String(raw).trim())) {
    setShellGameStatus('shellGame.invalidBet');
    return;
  }
  const amount = parseInt(raw, 10);
  if (!Number.isFinite(amount) || amount <= 0) {
    setShellGameStatus('shellGame.invalidBet');
    return;
  }
  if (amount > yang) {
    setShellGameStatus('shellGame.notEnoughYangs');
    return;
  }
  yang -= amount;
  saveEconomy();
  shellGameActiveBet = amount;
  shellGameLastResult = null;
  shellGameLastPlayerChoice = null;
  shellGameLastEnemyChoice = null;
  setShellGameStatus('shellGame.chooseHand');
  updateEconomyUi();
}

function playShellGameChoice(choice) {
  if (!SHELL_CHOICES.includes(choice)) return;
  if (shellGameActiveBet <= 0) {
    setShellGameStatus('shellGame.invalidBet');
    return;
  }
  const enemy = getRandomShellGameChoice();
  const result = resolveRockPaperScissors(choice, enemy);
  shellGameLastPlayerChoice = choice;
  shellGameLastEnemyChoice = enemy;
  shellGameLastResult = result;

  if (result === 'win') {
    addYangs(shellGameActiveBet * 2);
    shellGameActiveBet = 0;
    setShellGameStatus('shellGame.win');
    saveEconomy();
  } else if (result === 'lose') {
    shellGameActiveBet = 0;
    setShellGameStatus('shellGame.lose');
  } else {
    // Draw — keep the active bet, allow another choice.
    setShellGameStatus('shellGame.draw');
  }
  updateEconomyUi();
}

function shellChoiceLabel(choice) {
  if (choice === 'rock') return t('shellGame.rock');
  if (choice === 'paper') return t('shellGame.paper');
  if (choice === 'scissors') return t('shellGame.scissors');
  return '—';
}

function renderShellGamePanel() {
  const panel = document.getElementById('shellGamePanel');
  if (!panel) return;
  const betInput = document.getElementById('shellGameBetInput');
  const placeBtn = document.getElementById('shellGamePlaceBetBtn');
  const newBetBtn = document.getElementById('shellGameNewBetBtn');
  const rockBtn = document.getElementById('shellGameRockBtn');
  const paperBtn = document.getElementById('shellGamePaperBtn');
  const scissorsBtn = document.getElementById('shellGameScissorsBtn');
  const statusEl = document.getElementById('shellGameStatus');
  const activeBetEl = document.getElementById('shellGameActiveBet');
  const yourChoiceEl = document.getElementById('shellGameYourChoice');
  const enemyChoiceEl = document.getElementById('shellGameEnemyChoice');

  const hasBet = shellGameActiveBet > 0;

  if (betInput) betInput.disabled = hasBet;
  if (placeBtn) placeBtn.disabled = hasBet || yang <= 0;
  if (newBetBtn) newBetBtn.disabled = hasBet;
  if (rockBtn) rockBtn.disabled = !hasBet;
  if (paperBtn) paperBtn.disabled = !hasBet;
  if (scissorsBtn) scissorsBtn.disabled = !hasBet;

  if (activeBetEl) activeBetEl.textContent = String(shellGameActiveBet);
  if (yourChoiceEl) yourChoiceEl.textContent = shellGameLastPlayerChoice ? shellChoiceLabel(shellGameLastPlayerChoice) : '—';
  if (enemyChoiceEl) enemyChoiceEl.textContent = shellGameLastEnemyChoice ? shellChoiceLabel(shellGameLastEnemyChoice) : '—';

  if (statusEl) {
    statusEl.textContent = shellGameStatusKey ? t(shellGameStatusKey, shellGameStatusParams || {}) : '';
    statusEl.classList.toggle('win', shellGameLastResult === 'win');
    statusEl.classList.toggle('lose', shellGameLastResult === 'lose');
    statusEl.classList.toggle('draw', shellGameLastResult === 'draw');
  }
}

function initShellGameDefaults() {
  if (shellGameStatusKey === null) setShellGameStatus('shellGame.ready');
}
