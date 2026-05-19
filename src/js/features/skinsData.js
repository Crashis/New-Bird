const HEAD_B64 = "data:image/png;base64,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";

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const headImg = new Image();
headImg.src = HEAD_B64;

const UNLOCKED_SKINS_KEY = 'nw_flappy_unlocked_skins';
const SKIN_PRICE_WALLETS = 10;
const CRASHIS_SMAZENY_SKIN_ID = 'crashis-smazeny';
const MARTIN_SLUNECNY_SKIN_ID = 'martin-slunecny';
const MOUCHA_SKIN_ID = 'moucha';
const MARTIN_SLUNECNY_BUFF_MS = 10000;
const DOMI_DISKO_SKIN_ID = 'domi-disko';
const PULPRDELAC_SKIN_ID = 'pulprdelac';
const ADMIN_SKIN_ID = 'admin';
const ADMIN_SKIN_PLACEHOLDER_SVG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><radialGradient id='g' cx='50%25' cy='50%25' r='60%25'><stop offset='0%25' stop-color='%232a1f12'/><stop offset='100%25' stop-color='%23120a05'/></radialGradient></defs><rect width='100' height='100' fill='url(%23g)'/><circle cx='50' cy='50' r='44' fill='none' stroke='%23c9a84c' stroke-width='2'/><text x='50' y='68' text-anchor='middle' font-family='Cinzel Decorative,Georgia,serif' font-size='60' fill='%23f0d080' font-weight='bold'>A</text></svg>";

const SKINS = [
  {
    id: 'godias-zubaty',
    name: 'Godias Zubatý',
    desc: 'Původní New World hrdina. Zubatý úsměv straší Amazonce ve snech.',
    src: null,
    priceWallets: 0,
    unlockedByDefault: true
  },
  {
    id: 'saradyn-z-hoodu',
    name: 'Saradyn z Hoodu',
    desc: 'Záhadný lukostřelec z temných lesů. Střílí šípy, NE dotazy na zásoby.',
    src: 'assets/skins/saradyn-z-hoodu.png',
    priceWallets: 0,
    unlockedByDefault: true
  },
  {
    id: 'crashis-confused',
    name: 'Crashis Confused',
    desc: 'Nikdo neví, jak se sem dostal. Ani on sám. Přesto nějak přežívá.',
    src: 'assets/skins/crashis-confused.png',
    priceWallets: 0,
    unlockedByDefault: true
  },
  {
    id: CRASHIS_SMAZENY_SKIN_ID,
    name: 'Crashis Smažený',
    desc: 'Usmažený build, usmažené nervy.',
    src: 'assets/skins/Crashis-Smažený.png',
    priceWallets: SKIN_PRICE_WALLETS,
    unlockedByDefault: false,
    effectDescription: '25% šance ztratit 2 Yangy po smrti.'
  },
  {
    id: 'dominik-nemrkaci',
    name: 'Dominik Nemrkací',
    desc: 'Nemrkne ani když mu Amazon vypne server.',
    src: 'assets/skins/Dominik-Nemrkací.png',
    priceWallets: SKIN_PRICE_WALLETS,
    unlockedByDefault: false
  },
  {
    id: 'godias-prekvapeny',
    name: 'Godias Překvapený',
    desc: 'Někdo mu právě řekl o datu vypnutí serverů.',
    src: 'assets/skins/Godias-Překvapený.png',
    priceWallets: SKIN_PRICE_WALLETS,
    unlockedByDefault: false
  },
  {
    id: 'kolurklaster',
    name: 'Kolurklášter',
    desc: 'Mnich z kláštera, kde se modlí za stabilní ping.',
    src: 'assets/skins/Kolurklášter.png',
    priceWallets: SKIN_PRICE_WALLETS,
    unlockedByDefault: false
  },
  {
    id: MARTIN_SLUNECNY_SKIN_ID,
    name: 'Martin Slunečný',
    desc: 'Svítí tak moc, že i bugy radši utečou.',
    src: 'assets/skins/Martin-Slunečný.png',
    priceWallets: 10,
    unlockedByDefault: false,
    effectDescription: 'Prvních 10 sekund runu máš dvojnásobné Yangy.'
  },
  {
    id: 'moucha',
    name: 'Moucha',
    desc: 'Aeternum ji nikdo nezval. Stejně tu pořád lítá.',
    src: 'assets/skins/Moucha.png',
    priceWallets: 25,
    unlockedByDefault: false
  },
  {
    id: 'pavel-ocko',
    name: 'Pavel Očko',
    desc: 'Vidí lag na míli daleko. Stejně do něj naletí.',
    src: 'assets/skins/Pavel-Očko.png',
    priceWallets: SKIN_PRICE_WALLETS,
    unlockedByDefault: false
  },
  {
    id: 'saradyn-dlouhokrk',
    name: 'Saradyn DlouhoKrk',
    desc: 'Vyhlíží další patch. Pořád.',
    src: 'assets/skins/Saradyn-DlouhoKrk.png',
    priceWallets: SKIN_PRICE_WALLETS,
    unlockedByDefault: false
  },
  {
    id: 'skleny-hydratovany',
    name: 'Skleny Hydratovaný',
    desc: 'Dvě deci vody, jedna deci kódu.',
    src: 'assets/skins/Skleny-Hydratovaný.png',
    priceWallets: SKIN_PRICE_WALLETS,
    unlockedByDefault: false
  },
  {
    id: 'sklenar-holoprd',
    name: 'Sklenář Holoprd',
    desc: 'Legenda říká, že tenhle skin dropnul z produkce.',
    src: 'assets/skins/Sklenář-Holoprd.png',
    priceWallets: SKIN_PRICE_WALLETS,
    unlockedByDefault: false
  },
  {
    id: 'vseho-s-mirou',
    name: 'Všeho s Mírou',
    desc: 'Amazon mu dovolil jeden respawn. Použil ho na nákup LEGO.',
    src: 'assets/skins/Všeho-s-Mírou.png',
    priceWallets: SKIN_PRICE_WALLETS,
    unlockedByDefault: false,
    buffText: 'Má LEGO Barad-dûr.',
    debuffText: 'Nemá webkameru.'
  },
  {
    id: DOMI_DISKO_SKIN_ID,
    name: 'Domi Disko',
    desc: 'Disko nikdy nekončí. Hudba si s tebou bude dělat, co chce.',
    src: 'assets/skins/Domi-Disko.png',
    priceWallets: 10,
    unlockedByDefault: false,
    effectDescription: 'Během runu se hudbě každých ~10 s náhodně mění hlasitost.'
  },
  {
    id: PULPRDELAC_SKIN_ID,
    name: 'Půlprdeláč',
    desc: 'Legenda sjezdovek. Kdo mu zkříží stopu, odjíždí s natrženýma půlkama.',
    src: 'assets/skins/pulprdelac.png',
    priceWallets: 10,
    unlockedByDefault: false
  },
  {
    id: ADMIN_SKIN_ID,
    name: 'Admin',
    desc: 'Testovací skin pro bohy debugování.',
    src: ADMIN_SKIN_PLACEHOLDER_SVG,
    priceWallets: 0,
    unlockedByDefault: false,
    unlockMethod: 'cheat',
    excludeFromSkinAchievements: true,
    effectDescription: 'Testovací efekt: nesmrtelnost po celou dobu runu.'
  }
];

for (const s of SKINS) {
  if (!s.category) s.category = 'player';
}

// ===== TRAILS — čistě kosmetické stopy za hráčem =====
const UNLOCKED_TRAILS_KEY = 'nw_flappy_unlocked_trails';
const SELECTED_TRAIL_KEY = 'nw_flappy_selected_trail';
const SELECTED_TRAIL_COLOR_KEY = 'nw_flappy_selected_trail_color';

const TRAIL_COLOR_PALETTE = [
  { id: 'green',  hex: '#34d36a' },
  { id: 'blue',   hex: '#3aa7ff' },
  { id: 'violet', hex: '#a86bff' },
  { id: 'red',    hex: '#ff5a4a' },
  { id: 'yellow', hex: '#ffd84a' },
  { id: 'orange', hex: '#ff9430' },
  { id: 'pink',   hex: '#ff7ad0' },
  { id: 'white',  hex: '#f6efe0' }
];
const TRAIL_DEFAULT_COLOR = '#3aa7ff';

const TRAILS = [
  {
    id: 'arcane-glow',
    name: 'Arcane Glow',
    desc: 'Záře z dávných esencí Aeterna. Vybereš barvu, hra zazáří.',
    category: 'trails',
    type: 'glow',
    customizableColor: true,
    cost: { yang: 555, wallets: 15, errCubes: 3 }
  },
  {
    id: 'ember-trail',
    name: 'Ember Trail',
    desc: 'Drobné jiskry a plamínky — Aeternum hoří za tvými zády.',
    category: 'trails',
    type: 'fire',
    customizableColor: false,
    cost: { yang: 1000, wallets: 50, dragonCoins: 10, errCubes: 6 }
  }
];

// ===== SPECIALS — overlay efekty na postavu =====
const UNLOCKED_SPECIALS_KEY = 'nw_flappy_unlocked_specials';
const SELECTED_SPECIALS_KEY = 'nw_flappy_selected_specials';

const SPECIALS = [
  {
    id: 'ghost-rider',
    name: 'Ghost Rider',
    desc: 'Vlasy v plamenech. Lebka zůstává tvoje (zatím).',
    category: 'specials',
    cost: { yang: 1000, wallets: 50, dragonCoins: 15, errCubes: 10 }
  },
  {
    id: 'wraith-eyes',
    name: 'Wraith Eyes',
    desc: 'Oči, ve kterých svítí Korupce. Občas se rozhoří víc.',
    category: 'specials',
    cost: { yang: 888, wallets: 35, dragonCoins: 10, errCubes: 8 }
  }
];

(function applyUnlockedTrailsFromStorage() {
  let saved = [];
  try {
    const raw = localStorage.getItem(UNLOCKED_TRAILS_KEY);
    if (raw) { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) saved = parsed; }
  } catch (e) {}
  const set = new Set(saved);
  for (const t of TRAILS) t.unlocked = set.has(t.id);
})();

(function applyUnlockedSpecialsFromStorage() {
  let saved = [];
  try {
    const raw = localStorage.getItem(UNLOCKED_SPECIALS_KEY);
    if (raw) { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) saved = parsed; }
  } catch (e) {}
  const set = new Set(saved);
  for (const s of SPECIALS) s.unlocked = set.has(s.id);
})();

function saveUnlockedTrails() {
  try {
    const ids = TRAILS.filter(t => t.unlocked).map(t => t.id);
    localStorage.setItem(UNLOCKED_TRAILS_KEY, JSON.stringify(ids));
  } catch (e) {}
  try { if (window.NWCloudSave && typeof window.NWCloudSave.queueCloudSave === 'function') window.NWCloudSave.queueCloudSave('trail'); } catch (e) {}
}

function saveUnlockedSpecials() {
  try {
    const ids = SPECIALS.filter(s => s.unlocked).map(s => s.id);
    localStorage.setItem(UNLOCKED_SPECIALS_KEY, JSON.stringify(ids));
  } catch (e) {}
  try { if (window.NWCloudSave && typeof window.NWCloudSave.queueCloudSave === 'function') window.NWCloudSave.queueCloudSave('special'); } catch (e) {}
}

(function applyUnlockedSkinsFromStorage() {
  let saved = [];
  try {
    const raw = localStorage.getItem(UNLOCKED_SKINS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) saved = parsed;
    }
  } catch (e) {}
  const savedSet = new Set(saved);
  for (const skin of SKINS) {
    skin.unlocked = !!skin.unlockedByDefault || savedSet.has(skin.id);
  }
})();

function saveUnlockedSkins() {
  try {
    const ids = SKINS.filter(s => s.unlocked && !s.unlockedByDefault).map(s => s.id);
    localStorage.setItem(UNLOCKED_SKINS_KEY, JSON.stringify(ids));
  } catch (e) {}
  try { if (window.NWCloudSave && typeof window.NWCloudSave.queueCloudSave === 'function') window.NWCloudSave.queueCloudSave('skin'); } catch (e) {}
}

const ACHIEVEMENT_REWARD_YANG = 25;
const ACHIEVEMENT_STORAGE_KEY = 'nw_flappy_achievements';
const IMMORTALITY_USES_KEY = 'nw_flappy_immortality_uses';
const CRASHIS_CONFUSED_SKIN_ID = (SKINS.find(s => s.name === 'Crashis Confused') || {}).id || 'crashis-confused';
const ACHIEVEMENTS = [
  {
    id: 'first_run',
    title: 'První let',
    description: 'Zahraj první run.',
    rewardYang: ACHIEVEMENT_REWARD_YANG
  },
  {
    id: 'survived_amazon',
    title: 'Přežil jsem Amazon',
    description: 'Dosáhni skóre 20.',
    rewardYang: ACHIEVEMENT_REWARD_YANG
  },
  {
    id: 'bezos_rich',
    title: 'Bohatý jak Bezos',
    description: 'Nasbírej 500 Yangů.',
    rewardYang: ACHIEVEMENT_REWARD_YANG
  },
  {
    id: 'immortal_mamrd',
    title: 'Nesmrtelný mamrd',
    description: 'Použij nesmrtelnost 10×.',
    rewardYang: ACHIEVEMENT_REWARD_YANG
  },
  {
    id: 'not_bug_feature',
    title: 'Tohle nebyl bug, to byl feature',
    description: 'Přežij náraz díky štítu.',
    rewardYang: ACHIEVEMENT_REWARD_YANG
  },
  {
    id: 'typicooo',
    title: 'Typičooo',
    description: 'Odemkni skin Moucha.',
    rewardYang: ACHIEVEMENT_REWARD_YANG
  },
  {
    id: 'hero_of_new_world',
    title: 'Hrdina New Worldu',
    description: 'Dosáhni 100 bodů a poraz bosse Bezose.',
    rewardYang: 100,
    rewardWallets: 10
  },
  {
    id: 'unlock_all_regular_skins',
    title: 'Šatník Aeterna',
    description: 'Odemkni všechny běžné skiny.',
    rewardYang: ACHIEVEMENT_REWARD_YANG
  },
  {
    id: 'chest_hunter',
    title: 'Lovec truhel',
    description: 'Zahraj si poprvé Tři truhly v Taverně.',
    rewardYang: ACHIEVEMENT_REWARD_YANG
  },
  {
    id: 'dragon_gambler',
    title: 'Dračí hazardér',
    description: 'Hoď si poprvé Dračí kostkou.',
    rewardYang: ACHIEVEMENT_REWARD_YANG
  },
  {
    id: 'big_better',
    title: 'Velký hráč',
    description: 'Vsaď u Skořápkáře 100 nebo více yangů najednou.',
    rewardYang: ACHIEVEMENT_REWARD_YANG
  },
  {
    id: 'meeting_survived',
    title: 'Meeting přežit',
    description: 'Přežij meeting s nejvyšším bossem v Dungeons.',
    rewardYang: ACHIEVEMENT_REWARD_YANG
  },
  {
    id: 'bought_any_trail',
    title: 'Nebeská záře',
    description: 'Koupil sis stopu za sebou.',
    rewardYang: 50
  },
  {
    id: 'bought_any_special',
    title: 'Cítíš se výjimečně',
    description: 'Koupil sis speciální skin.',
    rewardYang: 50
  },
  {
    id: 'bezos_low_damage',
    title: 'Ten tvrdej chleba má',
    description: 'Poraz bosse Bezose s více než 50 % HP.',
    rewardYang: 100
  },
  {
    id: 'bought_kotlar_security',
    title: 'La Casa Nostra',
    description: 'Najal sis Kotlár Security.',
    rewardYang: 25
  }
];

const skinImages = new Map();
for (const skin of SKINS) {
  if (skin.src) {
    const img = new Image();
    img.onerror = () => { skinImages.set(skin.id, null); };
    img.src = skin.src;
    skinImages.set(skin.id, img);
  } else {
    skinImages.set(skin.id, headImg);
  }
}
