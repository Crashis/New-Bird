// === BASE PARAMETERS (very gentle start) ===
const GRAVITY_BASE = 0.08;
const JUMP_POWER = -4.6;
const MAX_FALL_SPEED = 4.8; // terminal velocity — slow even at max fall
const PIPE_SPEED_BASE = 1.05;
const PIPE_GAP_BASE = 320;
const PIPE_WIDTH = 80;
const PIPE_INTERVAL_BASE = 255; // big gaps between pipes — calm start
const COIN_RADIUS = 18;
const YANG_RADIUS = 15;
const YANG_VALUE = 2;
const YANG_MIN_PIPES = 3;
const YANG_FORCE_PIPES = 8;
const YANG_CHANCE = 0.22;
const UPGRADE_COST = 100; // used for one-time shield purchase
const UPGRADE_LEVEL_COSTS = [100, 150, 200]; // legacy fallback (shield + first tiers)
const INVINCIBLE_DURATION_MS = 2000;
const DOUBLE_YANG_BASE_MS = 8000;
const DOUBLE_YANG_BONUS_MS = 2000; // bonus for original levels 1–2
const CROWN_BONUS_BASE = 1;

// Invincibility upgrade — original levels 1–3 add +0.5s each (cost 100/150/200),
// levels 4–10 add +0.2s each, cost steps by +75.
const INVINCIBILITY_MAX_LEVEL = 10;
const INVINCIBILITY_COSTS = [100, 150, 200, 275, 350, 425, 500, 575, 650, 725];

// Double Yang upgrade — original levels 1–2 add +2.0s each (cost 100/150),
// levels 3–10 add +0.2s each, cost steps by +100.
const DOUBLE_YANG_MAX_LEVEL = 10;
const DOUBLE_YANG_COSTS = [100, 150, 250, 350, 450, 550, 650, 750, 850, 950];

// Crown bonus — original levels 1–2 each add +1 score (cost 100/150),
// extended levels 3–5 continue with +1 score per level and +50 cost step.
const CROWN_BONUS_MAX_LEVEL = 5;
const CROWN_BONUS_COSTS = [100, 150, 200, 250, 300];
const AMAZON_NERF_DURATION_MS = 5000;
const AMAZON_NERF_SLOW_MULT = 0.85;
const AMAZON_NERF_SPEED_MULT = 1.15;
const AMAZON_NERF_SLOW_CHANCE = 0.425;
const AMAZON_NERF_SPEED_CHANCE = 0.425; // doubleScore = 1 - slow - speed = 0.15
const POWERUP_MIN_PIPES = 4;
const POWERUP_FORCE_PIPES = 14;
const POWERUP_CHANCE = 0.18;
const ERR_CUBE_CHANCE = 0.02;
const ERR_CUBE_VOICE_LINE = 'Rock and Stones, brothers!';
// Distribution of power-up types when a power-up slot fires.
// Weights must sum to 1.0.
const POWERUP_TYPE_WEIGHTS = [
  ['invincibility', 0.35],
  ['doubleYang',    0.30],
  ['crownBonus',    0.25],
  ['amazonNerf',    0.10]
];

// === DIFFICULTY SCALING (gradual ramp, one step per 4 passed pipes) ===
function getDifficultyStep() {
  return Math.floor(score / 4);
}
function getEffectiveDifficulty() {
  // Obtížnost roste jen po blocích 4 sloupů. Po 16 bodech dál roste pozvolně,
  // takže se hra zrychlí citelněji, ale sloupy se nepřilepí hned k sobě.
  const step = getDifficultyStep();
  return step <= 4 ? step : 4 + (step - 4) * 0.45;
}
function getGravity() {
  const d = getEffectiveDifficulty();
  return GRAVITY_BASE + Math.min(0.075, d * 0.012);
}
function getPipeSpeed() {
  const d = getEffectiveDifficulty();
  return (PIPE_SPEED_BASE + Math.min(1.35, d * 0.13)) * getAmazonNerfSpeedMultiplier();
}
function getPipeGap() {
  const d = getEffectiveDifficulty();
  return Math.max(230, PIPE_GAP_BASE - d * 7);
}
function getPipeInterval() {
  const d = getEffectiveDifficulty();
  return Math.max(165, Math.round(PIPE_INTERVAL_BASE - d * 7));
}
function getNextPipeDelay() {
  // Dedicated delay avoids the old modulo bug where a changed interval could spawn
  // two pipe pairs almost next to each other.
  // Divide interval by Amazon Nerf multiplier so the pixel spacing between pipes
  // stays the same (faster speed → shorter frame countdown, slower speed → longer).
  // This keeps the safe horizontal gap pattern intact even during the effect.
  const mult = getAmazonNerfSpeedMultiplier();
  return Math.max(80, Math.round(getPipeInterval() / mult));
}
