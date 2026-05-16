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

  const reward = Number(achievement.rewardYang) || 0;
  if (reward > 0 && !unlockedAchievements[id].rewardClaimed) {
    yang += reward;
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

function checkAchievements() {
  if (score >= WIN_SCORE) unlockAchievement('survived_amazon');
  if (yang >= 500) unlockAchievement('bezos_rich');
  if (immortalityUses >= 10) unlockAchievement('immortal_mamrd');
}

function renderAchievementsPanel() {
  const list = document.getElementById('achievementsList');
  if (!list) return;
  list.innerHTML = ACHIEVEMENTS.map(achievement => {
    const unlocked = isAchievementUnlocked(achievement.id);
    const reward = Number(achievement.rewardYang) || 0;
    const titleKey = 'ach.' + achievement.id + '.title';
    const descKey  = 'ach.' + achievement.id + '.desc';
    return `
      <div class="achievement-card ${unlocked ? 'unlocked' : 'locked'}">
        <div class="achievement-top">
          <div class="achievement-title">${t(titleKey)}</div>
          <div class="achievement-badge">${unlocked ? t('achievements.unlocked') : t('achievements.locked')}</div>
        </div>
        <div class="achievement-description">${t(descKey)}</div>
        <div class="achievement-bottom">
          <div class="achievement-reward">${t('achievements.reward', { amount: reward })}</div>
        </div>
      </div>
    `;
  }).join('');
}
