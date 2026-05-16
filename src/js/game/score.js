// Centralised score increment so pipe-pass, Crown Bonus and Amazon double-score
// all share the same win-trigger / particle / sound / voice-line logic.
function addScore(amount) {
  if (!Number.isFinite(amount) || amount <= 0) return;
  if (gameState !== 'playing') return;
  const before = score;
  score += amount;
  const gameScoreEl = document.getElementById('gameScore');
  if (gameScoreEl) gameScoreEl.textContent = score;
  difficultyLevel = getDifficultyStep();
  if (score >= WIN_SCORE) unlockAchievement('survived_amazon');

  // HMM sound when crossing any new multiple of 10.
  if (Math.floor(score / 10) > Math.floor(before / 10) && score >= 10) {
    playHmm();
  }

  // Random taunting voice line milestone.
  if (score >= nextVoiceLineScore) {
    showVoiceLine();
    setNextVoiceLineScore();
  }

  // Burst of gold particles.
  for (let i = 0; i < 8; i++) {
    particles.push({
      x: player.x,
      y: player.y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      life: 35,
      size: 1.5 + Math.random() * 2,
      color: '#f0d080'
    });
  }

  // Win trigger fires exactly once when the score crosses WIN_SCORE.
  if (before < WIN_SCORE && score >= WIN_SCORE && !endlessMode) {
    awardShield();
    winGame();
  }

  // Pojistka: pokud bychom někdy získali skóre >= 20 v endless módu bez aktivace,
  // event fáze nakopne sama. Hlavní trigger je v continueGame().
  maybeActivateEventPhase();

  // Score 60: tichá modrá fáze, bez modalu / bez pauzy.
  if (before < FROST_PHASE_TRIGGER_SCORE && score >= FROST_PHASE_TRIGGER_SCORE) {
    maybeActivateFrostPhase();
  }

  // Score 100: boss Bezos milestone — pauza + modal.
  if (before < BEZOS_MILESTONE_SCORE && score >= BEZOS_MILESTONE_SCORE && !score100MilestoneShown) {
    triggerBezosMilestone();
  }
  if (score >= BEZOS_MILESTONE_SCORE) {
    unlockAchievement('hero_of_new_world');
  }

  // Score 500: final milestone — pauza + modal.
  if (before < FINAL_MILESTONE_SCORE && score >= FINAL_MILESTONE_SCORE && !score500FinalShown) {
    triggerFinalMilestone();
  }
}
function hasAdminSkinInvincibility() {
  return typeof ADMIN_SKIN_ID !== 'undefined' && selectedSkinId === ADMIN_SKIN_ID;
}
function isInvincible() {
  return performance.now() < invincibleUntil;
}
function hasActiveProtection() {
  return isInvincible() || performance.now() < shieldPhaseUntil || hasAdminSkinInvincibility();
}
function setNextVoiceLineScore() {
  nextVoiceLineScore = score + 15 + Math.floor(Math.random() * 16);
}

const VOICE_LINES = [
  "Amazon hlásí: server je stabilní. Lež detekována.",
  "Jeff Bezos šeptá: kup si ještě jeden skin.",
  "Aeternum support: zkusil jsi to vypnout a zapnout? My taky.",
  "Quarterly report incoming. Hráči, držte si klobouky.",
  "New World update: opravili jsme jednu věc a rozbili tři.",
  "Systém hlásí: tvoje důstojnost má nízké HP.",
  "Amazon Games gratuluje. Tohle skoro vypadalo jako gameplay.",
  "Server maintenance začíná za nikdy. Končí za ještě později.",
  "Aeternum tě sleduje. A trochu se stydí.",
  "Tvůj kamarád by řekl, že tohle je skill issue."
];

const EVENT_VOICE_LINES = [
  "Teď už nejde o výhru. Teď přežíváš.",
  "Aeternum se probouzí.",
  "Amazon tě vidí.",
  "Fáze 2: už žádné slitování.",
  "Sloupy jsou corrupted. Ty brzo taky.",
  "Server tě teď zná. A nemá tě rád.",
  "Tohle není endless. Tohle je trest.",
  "Bezos se směje. Slyšíš to?",
  "Krev v gridu. Crash v kódu. Tvoje smrt na queue.",
  "Aeternum krvácí. Ty taky budeš."
];

function showVoiceLine() {
  if (!settings.voiceLines) return;
  const csPool = eventPhaseActive ? EVENT_VOICE_LINES : VOICE_LINES;
  const enPool = eventPhaseActive
    ? (window.NWI18n && window.NWI18n.getEventVoiceLines())
    : (window.NWI18n && window.NWI18n.getVoiceLines());
  const pool = enPool || csPool;
  const line = pool[Math.floor(Math.random() * pool.length)];
  activeVoiceLine = line;
  activeVoiceLineUntil = performance.now() + 4200;

  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(line);
      utterance.lang = window.NWI18n && window.NWI18n.getCurrentLanguage() === 'en' ? 'en-US' : 'cs-CZ';
      utterance.rate = 0.92;
      utterance.pitch = 0.75;
      utterance.volume = 0.45;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      // Visual text still works when speech synthesis is unavailable.
    }
  }
}

function awardShield() {
  if (shieldCount >= getMaxShields()) return;
  shieldCount++;
  hasShield = true;
  for (let i = 0; i < 36; i++) {
    particles.push({
      x: player.x,
      y: player.y,
      vx: (Math.random() - 0.5) * 7,
      vy: (Math.random() - 0.5) * 7,
      life: 55 + Math.random() * 25,
      size: 2 + Math.random() * 2.5,
      color: Math.random() > 0.4 ? '#80d8ff' : '#f0d080'
    });
  }
  activeVoiceLine = t('event.shieldGained');
  activeVoiceLineUntil = performance.now() + 3600;
}

function consumeShield(pipe, speed) {
  shieldCount = Math.max(0, shieldCount - 1);
  hasShield = shieldCount > 0;
  unlockAchievement('not_bug_feature');
  const remainingPipeDistance = Math.max(0, pipe.x + PIPE_WIDTH - (player.x - player.r));
  const framesToClearPipe = remainingPipeDistance / Math.max(0.1, speed);
  shieldPhaseUntil = performance.now() + Math.max(900, framesToClearPipe * 16.7 + 350);
  invincibleUntil = Math.max(invincibleUntil, shieldPhaseUntil);
  activeVoiceLine = t('event.shieldBroken');
  activeVoiceLineUntil = performance.now() + 3200;

  for (let i = 0; i < 44; i++) {
    particles.push({
      x: player.x,
      y: player.y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      life: 45 + Math.random() * 25,
      size: 2 + Math.random() * 3,
      color: Math.random() > 0.5 ? '#80d8ff' : '#f0d080'
    });
  }
}

const DEATH_QUOTES = [
  "Amazon ti vypnul server. Žádné dlevání to nezachrání.",
  "Padl jsi jako New World. Slavně, ale úplně.",
  "Tvoje postava skončila v Connection Timeout.",
  "Patch notes #404: Hráč nenalezen.",
  "Bezos se právě usmál. Někde. V superyachtu.",
  "Quarterly report tě sejmul rychleji než Corrupted Brute.",
  "Aeternum mělo věčnost. Tys měl 3 vteřiny.",
  "Tvůj build to nezvládl. Stejně jako celý New World.",
  "Tvůj kamarád by to dohrál. Tedy... teoreticky.",
  "Game Over. Stejně jako celá hra v lednu 2027.",
  "Servery padly dřív než ty. Lehce dřív.",
  "Marks of Fortune ti nevrátí life. Nikdy.",
  "Tvůj level: maxed. Tvoje šance: 0.",
  "RIP. Ale aspoň to nebylo Amazonem zrušeno. Tentokrát.",
  "Tvůj postavu právě požral algoritmus Amazonu.",
  "Skončil jsi rychleji než Nighthaven season.",
  "Tvůj kamarád ti právě poslal screenshot smrti.",
  "Lag? Ne. To byl tvůj reaction time.",
  "Spadl jsi jako akcie Amazonu po oznámení konce.",
  "Tvoje DPS bylo na úrovni serveru: nulové.",
  "Aeternum vzpomíná. Server tě nezná.",
  "Twoja postavička se rozpadla na pixely. Doslova.",
  "GG. WP. RIP. Vyber si.",
  "Tvůj endgame: prázdný server v lednu 2027.",
  "Padl jsi tak rychle, že stream přerušil reklamou.",
  "Tvůj kamarád ti zrovna píše: 'Vidíš? Já ti to říkal.'",
  "Amazon Customer Service: 'Vaše smrt je důležitá. Čekejte.'",
  "Sloupy: 1, Hrdina: 0. Klasika.",
  "Tvoje aim assist byl vypnut. Permanentně.",
  "Server status: 200 OK. Hráč status: 500 Internal Skill Error.",
  "Tohle byl tvůj loadout? Vážně? Tohle?",
  "Spadl jsi mezi sloupy jako reputace Amazonu mezi gamery.",
  "Tvůj guildmaster právě dropnul z gildy. Stud.",
  "Patch 1.2.7 ti rozbil reflexy. Není fix.",
  "Tvoje smrt: oficiálně endorse'd by Jeff Bezos.",
  "Refund? Ne. Respawn? Ne. Tohle je váš nový normál.",
  "Hraješ hru o ničem. Nevyhraješ nic. Vítej v New Worldu.",
  "Tvoje rodina ti právě napsala. Ignoruj. Hraj znovu.",
  "Hashtag JustNewWorldThings — i tahle hra umírá.",
  "Tvoje skóre by ostudilo i lvl 5 boty z launche.",
  "Corrupted portály měly lepší stats než tvůj jump.",
  "Tvoje hra se uložila. Do koše Amazonu.",
  "Servery jsou stabilnější než tvoje létání.",
  "Tvůj kamarád teď leží na zemi smíchy. Hrej znovu.",
  "Aeternum si tě nebude pamatovat. Ani Amazon.",
  "Tvoje fall damage: ego, dignity, plus 1 botton.",
  "Dev team už dávno odešel z Amazonu. Ty taky můžeš.",
  "Tvoje strategie 'spam mezerník' selhala. Šokující.",
  "Bezos ti právě prodal NFT tvé smrti.",
  "Hra skončila. Brzy taky celá hra. Bonding moment.",
  "Tvoje postava se připojila k Lost Souls of Aeternum.",
  "Spadl jsi. Amazon spadl. New World spadl. Trend.",
  "Tvoje pípání ve sluchátkách bylo srdce, ne notifikace.",
  "Replikovat tuto smrt v laboratorních podmínkách: snadné.",
  "Tvoje WASD selhalo. Tvůj space selhal. Tvoje sny selhaly.",
  "Hráč nenalezen v leaderboardu. Ani v paměti.",
  "Tvoje 5000 hodin v New Worldu tě nepřipravilo na tohle.",
  "Tohle je důvod, proč si rodiče mysleli, že gaming není kariéra.",
  "Jeff Bezos: 'Mám lepší hry doma.' Doma má jen yachty.",
  "Tvůj kamarád právě otevřel jiný server. Aspoň někdo.",
  "Tvůj clutch nebyl. Tvůj boss kill nebyl. Tvůj jump nebyl.",
  "Game Over Screen je teď tvoje domovská obrazovka.",
  "Recenzenti dali tvé smrti 6/10. 'Generic, but functional.'",
  "Tvoje postavička šla do Valhally. Místo bylo zavřené.",
  "Errored out. Like Amazon Games division.",
  "Hra ti právě poslala faktury za prémiové respawny."
];

// Quotes shown when player wins (reaches WIN_SCORE)
const WIN_SCORE = 20;
const WIN_QUOTES = [
  "Zachránil jsi servery! Amazon zrušil zrušení. Hráči pláčou štěstím.",
  "VÍTĚZSTVÍ! Bezos právě podepsal smlouvu na dalších 100 let New Worldu.",
  "Tvůj kamarád ti právě posílá pivo. Přes server. Funguje to.",
  "Aeternum žije! Tvůj heroický let zastavil quarterly report.",
  "Amazon Games tě právě najal jako CEO. Plat: nekonečno gold.",
  "Hra zachráněna! New World přejmenován na 'Old World, But Better'.",
  "Servery se rozsvítily zpět. Hráči se vrátili. Dokonce i ti gerychlení.",
  "VÍTĚZSTVÍ ETERNAL! Aeternum bylo oficiálně přejmenováno po tobě.",
  "Tvoje skóre rozbilo Amazon servery. Ironicky tím vypnulo zrušení.",
  "Bezos napsal: 'OK fine, hra zůstane.' Pak zmizel v helikoptéře.",
  "ZACHRÁNĚN! Tvůj kamarád ti právě poslal save game. Konečně.",
  "Servery běží. Hráči farmí. Vše je v pořádku. Aspoň na chvíli.",
  "TRIUMF! Amazon CEO právě roztřásl ruce a oznámil expansion pack.",
  "Aeternum tě prohlašuje za Wardena. Plat: 0 gold, ale je to čest.",
  "Vyhrál jsi! Tvůj kamarád teď může dohrát všechny questy. Konečně."
];
