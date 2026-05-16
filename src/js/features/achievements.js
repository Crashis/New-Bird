function getAchievement(id) {
  return ACHIEVEMENTS.find(a => a.id === id) || null;
}

function isAchievementUnlocked(id) {
  return !!(unlockedAchievements[id] && unlockedAchievements[id].unlocked);
}

function addYangs(amount, checkAfter = true) {
  if (!Number.isFinite(amount) || amount <= 0) return;
  yang += Math.floor(amount);
  saveEconomy();
  updateEconomyUi();
  if (checkAfter) checkAchievements();
}

function unlockAchievement(id) {
  const achievement = getAchievement(id);
  if (!achievement || isAchievementUnlocked(id)) return false;

  unlockedAchievements[id] = {
    unlocked: true,
    rewardClaimed: false,
    unlockedAt: Date.now()
  };

  const rewardYang = Number(achievement.rewardYang) || 0;
  const rewardWallets = Number(achievement.rewardWallets) || 0;
  if ((rewardYang > 0 || rewardWallets > 0) && !unlockedAchievements[id].rewardClaimed) {
    if (rewardYang > 0) yang += rewardYang;
    if (rewardWallets > 0) wallets += rewardWallets;
    unlockedAchievements[id].rewardClaimed = true;
    saveEconomy();
  }
  saveAchievements();

  updateEconomyUi();
  renderAchievementsPanel();
  showUnlockToast(t('achievements.toast'), t('ach.' + achievement.id + '.title'), 'achievement');
  checkAchievements();
  return true;
}

function areAllRegularSkinsUnlocked() {
  if (typeof SKINS === 'undefined') return false;
  return SKINS
    .filter(s => !s.excludeFromSkinAchievements)
    .every(s => !!s.unlocked);
}

function checkSkinAchievements(unlockedSkinId) {
  if (typeof MOUCHA_SKIN_ID !== 'undefined' && unlockedSkinId === MOUCHA_SKIN_ID) {
    unlockAchievement('typicooo');
  }
  if (areAllRegularSkinsUnlocked()) {
    unlockAchievement('unlock_all_regular_skins');
  }
}

function checkAchievements() {
  if (score >= WIN_SCORE) unlockAchievement('survived_amazon');
  if (yang >= 500) unlockAchievement('bezos_rich');
  if (immortalityUses >= 10) unlockAchievement('immortal_mamrd');
  if (typeof BEZOS_MILESTONE_SCORE !== 'undefined' && score >= BEZOS_MILESTONE_SCORE) {
    unlockAchievement('hero_of_new_world');
  }
  if (areAllRegularSkinsUnlocked()) {
    unlockAchievement('unlock_all_regular_skins');
  }
}

function renderAchievementsPanel() {
  const list = document.getElementById('achievementsList');
  if (!list) return;
  list.innerHTML = ACHIEVEMENTS.map(achievement => {
    const unlocked = isAchievementUnlocked(achievement.id);
    const rewardYang = Number(achievement.rewardYang) || 0;
    const rewardWallets = Number(achievement.rewardWallets) || 0;
    const titleKey = 'ach.' + achievement.id + '.title';
    const descKey  = 'ach.' + achievement.id + '.desc';
    const parts = [];
    if (rewardYang > 0) parts.push(t('achievements.reward', { amount: rewardYang }));
    if (rewardWallets > 0) parts.push(t('achievements.rewardWallets', { amount: rewardWallets }));
    const rewardText = parts.join(' · ');
    return `
      <div class="achievement-card ${unlocked ? 'unlocked' : 'locked'}">
        <div class="achievement-top">
          <div class="achievement-title">${t(titleKey)}</div>
          <div class="achievement-badge">${unlocked ? t('achievements.unlocked') : t('achievements.locked')}</div>
        </div>
        <div class="achievement-description">${t(descKey)}</div>
        <div class="achievement-bottom">
          <div class="achievement-reward">${rewardText}</div>
        </div>
      </div>
    `;
  }).join('');
}
