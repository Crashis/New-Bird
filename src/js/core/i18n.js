// ===== LOCALIZATION (i18n) — New World: Aeternum =====
window.NWI18n = window.NWI18n || {};

(function (NWI18n) {
  const LANGUAGE_KEY = 'nw_flappy_language';
  let currentLanguage = 'cs';

  // ── UI TRANSLATIONS ────────────────────────────────────────────────────────
  const translations = {
    cs: {
      // Countdown page
      'countdown.subtitle': 'Amazonian Chronicles — Konec věků',
      'countdown.sub': 'Odpočítávání do věčné tmy',
      'countdown.days': 'Dní',
      'countdown.hours': 'Hodin',
      'countdown.minutes': 'Minut',
      'countdown.seconds': 'Sekund',
      'countdown.launch': 'Launch: 28. 9. 2021',
      'countdown.end': 'Konec: 31. 1. 2027',
      'countdown.loading': 'Načítám proroctví starověkého Aeterna...',
      'countdown.offline': 'Servery jsou offline. Aeternum padlo. Bylo to skutečné.',
      'countdown.dateInfo': 'Servery se navždy vypnou <strong>31. ledna 2027 v 00:00 UTC</strong> — Amazon to stvrdil 15. 1. 2026',
      'countdown.newQuote': '⚡ Nové proroctví',
      'countdown.fightBtn': '⚔️ Bojovat proti Amazonu',
      'countdown.pctLost': '% prohráno',

      // HUD
      'hud.header': '⚔️ Boj o Aeternum ⚔️',
      'hud.score': 'Skóre:',
      'hud.best': 'Rekord:',
      'hud.yang': 'Yangy:',
      'hud.wallets': 'Peněženky:',
      'hud.controls': 'Mezerník · Klik · Tap pro skok',
      'rotate.hint': 'Pro lepší hraní otoč mobil na šířku.',

      // Main menu
      'menu.kicker': 'Endless grind simulator',
      'menu.title': 'BOJ O AETERNUM',
      'menu.subtitle': 'Aeternum čeká. Amazon taky.',
      'menu.start': '⚔ Start',
      'menu.shop': '🛒 Shop',
      'menu.skins': '🎭 Skiny',
      'menu.achievements': '🏆 Achievementy',
      'menu.settings': '⚙ Settings',
      'menu.cheats': '⌨ Cheat Codes',
      'menu.quit': '✕ Zavřít hru',
      'menu.hint': 'Mezerník · Klik · Tap pro skok',

      // Game over
      'gameover.title': 'Server Disconnected',
      'gameover.newRecord': '⚜ NOVÝ REKORD ⚜',
      'gameover.again': '⚔️ Znovu',
      'gameover.end': '✕ Konec',

      // Win panel
      'win.title': '⚜ AETERNUM ZACHRÁNĚNO ⚜',
      'win.subtitle': 'Servery žijí. Hrdina dohrál.',
      'win.continue': '▶ Pokračovat (Endless)',
      'win.again': '⚔️ Znovu',
      'win.end': '✕ Konec',

      // Shop
      'shop.title': '🛒 Amazon Shop',
      'shop.subtitle': 'Upgrady se ukládají lokálně v prohlížeči. Cena roste s levelem: 100 → 150 → 200 Yangů.',
      'shop.yang': 'Yangy:',
      'shop.wallets': 'Peněženky:',
      'shop.close': '✕ Zavřít shop',
      'shop.shield.title': '🛡 Shield Start',
      'shop.shield.desc': 'Každý nový run začne s jedním štítem. Maximum zůstává 1/1.',
      'shop.inv.title': '⚜ Delší nesmrtelnost',
      'shop.inv.desc': 'Každý level prodlouží power-up nesmrtelnosti o 0,5 sekundy. Maximum jsou 3 levely.',
      'shop.dy.title': '⚡ Delší Double Yang',
      'shop.dy.desc': 'Power-up Double Yang dává po dobu efektu dvojnásobek Yangů. Každý level prodlouží trvání o 2 sekundy. Základ 8s. Maximum 2 levely.',
      'shop.crown.title': '👑 Silnější Crown Bonus',
      'shop.crown.desc': 'Power-up koruny okamžitě přičte skóre. Každý level přidá +1 skóre. Základ +1, max 2 levely (+3 skóre).',
      'shop.noYang': 'Nemáš dost Yangů. Potřebuješ 100.',
      'shop.noYangFor': 'Nemáš dost Yangů. Potřebuješ {cost}.',
      'shop.shieldBought': 'Shield Start koupen. Další run začne se štítem.',
      'shop.invExtended': 'Nesmrtelnost prodloužena na {dur}s.',
      'shop.dyExtended': 'Double Yang prodloužen na {dur}s.',
      'shop.crownUp': 'Crown Bonus zvýšen na +{val} skóre.',

      // Economy display
      'economy.owned': 'Vlastníš',
      'economy.notOwned': 'Nevlastníš',
      'economy.bought': 'Koupeno',
      'economy.maximum': 'Maximum',
      'economy.buy100': 'Koupit — 100 Yangů',
      'economy.buyFor': 'Koupit — {cost} Yangů',
      'economy.invLevel': 'Level {cur}/3 (+{bonus}s)',
      'economy.dyLevel': 'Level {cur}/{max} ({dur}s)',
      'economy.crownLevel': 'Level {cur}/{max} (+{val} skóre)',

      // Skins panel
      'skins.title': '🎭 Výběr postavy',
      'skins.subtitle': 'Vyber si skin pro svého hrdinu. Odemykej nové postavy hraním.',
      'skins.close': '✕ Zavřít',
      'skins.select': 'Vybrat',
      'skins.selected': 'Vybráno ✓',
      'skins.statusSelected': 'Vybráno',
      'skins.statusUnlocked': 'Odemčeno',
      'skins.locked': '🔒 {price} Peněženky',
      'skins.buy': 'Koupit za {price} Peněženky',
      'skins.notEnough': 'Nedostatek Peněženek',
      'skins.effect': 'Efekt: {text}',
      'skins.buff': 'Buff: {text}',
      'skins.debuff': 'Debuff: {text}',
      'skins.notEnoughMsg': 'Potřebuješ {price} Peněženky. Aeternum levně nedává.',
      'skins.unlockedToast': '{name} je tvůj. Teď už aspoň vypadáš draze.',

      // Achievements panel
      'achievements.title': '🏆 Achievementy',
      'achievements.subtitle': 'Sběratelské zářezy z Aeterna. Odměny se připíšou automaticky při odemčení.',
      'achievements.unlocked': 'Splněno',
      'achievements.locked': 'Zamčeno',
      'achievements.reward': '+{amount} Yangů',
      'achievements.rewardWallets': '+{amount} Peněženek',
      'achievements.toast': 'ACHIEVEMENT ODEMČEN',

      'ach.first_run.title': 'První let',
      'ach.first_run.desc': 'Zahraj první run.',
      'ach.survived_amazon.title': 'Přežil jsem Amazon',
      'ach.survived_amazon.desc': 'Dosáhni skóre 20.',
      'ach.bezos_rich.title': 'Bohatý jak Bezos',
      'ach.bezos_rich.desc': 'Nasbírej 500 Yangů.',
      'ach.immortal_mamrd.title': 'Nesmrtelný mamrd',
      'ach.immortal_mamrd.desc': 'Použij nesmrtelnost 10×.',
      'ach.not_bug_feature.title': 'Tohle nebyl bug, to byl feature',
      'ach.not_bug_feature.desc': 'Přežij náraz díky štítu.',
      'ach.typicooo.title': 'Typičooo',
      'ach.typicooo.desc': 'Odemkni skin Moucha.',
      'ach.hero_of_new_world.title': 'Hrdina New Worldu',
      'ach.hero_of_new_world.desc': 'Dosáhni 100 bodů a poraz bosse Bezose.',
      'ach.unlock_all_regular_skins.title': 'Šatník Aeterna',
      'ach.unlock_all_regular_skins.desc': 'Odemkni všechny běžné skiny.',

      // Cheat codes panel
      'cheats.title': '⌨ Cheat Codes',
      'cheats.subtitle': 'Zadej tajný kód a uvidíme, co Aeternum dovolí.',
      'cheats.wip': 'Cheat Codes — Work in progress',
      'cheats.close': '✕ Zavřít',
      'cheats.placeholder': 'Zadej cheat code...',
      'cheats.apply': 'Použít',
      'cheats.unknown': 'Neznámý cheat code.',
      'cheats.adminUnlocked': 'Admin skin odemčen.',
      'cheats.adminAlready': 'Admin skin už je odemčený.',
      'cheats.adminToastTitle': 'ADMIN SKIN ODEMČEN',
      'cheats.adminToastSub': 'Debug bohové ti dali nesmrtelnost.',
      'skins.lockedCheat': '🔒 Odemkneš cheatem',
      'skins.lockedCheatBtn': 'Zamčeno',

      // Settings panel
      'settings.title': '⚙ Settings',
      'settings.subtitle': 'Tvoje nastavení se ukládá lokálně v prohlížeči.',
      'settings.sfx': 'Zvuky',
      'settings.sfxHint': 'Herní SFX — Hmmm, sběr, štít',
      'settings.music': 'Hudba',
      'settings.musicHint': 'Background soundtrack',
      'settings.voiceLines': 'Hlášky',
      'settings.voiceLinesHint': 'Náhodné voice lines během hry',
      'settings.effects': 'Efekty',
      'settings.effectsHint': 'Glow, particles, flash',
      'settings.footer': 'Víc si toho nenastavíš ty mamrde',
      'settings.close': '✕ Zavřít',

      // Bottom buttons
      'bottom.shopHint': 'Upgrady za Yangy',
      'bottom.skinsHint': 'Výběr postavy',
      'bottom.achievementsHint': 'Odměny za postup',
      'bottom.cheatsHint': 'Work in progress',
      'bottom.settingsHint': 'Zvuky · Hudba · Efekty',
      'bottom.close': '✕ Zavřít hru',

      // Fullscreen
      'btn.fullscreen': '⛶ Fullscreen',
      'btn.exitFullscreen': '⛶ Ukončit fullscreen',

      // Panel voice line messages (canvas text during play)
      'panel.shopBlocked': 'Shop otevřeš až mimo aktivní let. Amazon nechce refund během boje.',
      'panel.cheatsBlocked': 'Cheat Codes mimo aktivní let. Amazon nemá rád zkratky.',
      'panel.achievementsBlocked': 'Achievementy si prohlédneš až po přistání. Teď se padá profesionálně.',
      'panel.settingsBlocked': 'Settings mimo aktivní let. Teď není čas na ladění.',
      'panel.skinsBlocked': 'Skiny si vybereš až mimo aktivní let. Amazon módní přehlídku v letu neplatí.',

      // Canvas status text
      'canvas.yang': 'Yangy {yang}  ·  Peněženky {wallets}',
      'canvas.invincible': 'NESMRTELNOST {time}s',
      'canvas.doubleYang': 'DOUBLE YANG {time}s',
      'canvas.amazonSlow': 'AMAZON SLOW {time}s',
      'canvas.amazonSpeed': 'AMAZON SPEED {time}s',
      'canvas.shield': 'ŠTÍT AKTIVNÍ 1/1',

      // Game events
      'event.shieldGained': 'ŠTÍT ZÍSKÁN — jeden náraz přežiješ.',
      'event.shieldBroken': 'ŠTÍT PRASKL — proletěl jsi skrz překážku.',
      'event.eventPhase': 'FÁZE 2 AKTIVOVÁNA',
      'event.eventPhaseVoice': 'Fáze 2: už žádné slitování.',
      'event.walletWon': '+1 Peněženka',
      'event.walletWonSub': 'První výplata z Aeterna.',
      'event.walletVoice': '+1 Peněženka za záchranu Aeterna',

      // Phase milestones (score 60 / 100 / 500)
      'milestone.frost.toast': 'FÁZE 3 — FROST CORE',
      'milestone.void.toast': 'FÁZE 4 — VOID PROTOCOL',
      'milestone.bezos.title': 'BEZOS PORAŽEN',
      'milestone.bezos.subtitle': 'Jeff právě rozbil další raketu. Pokračuj, než ti zdaní i skok.',
      'milestone.bezos.quote': 'Bezos křičí na CFO. Server pláče v rohu.',
      'milestone.final.title': 'FINÁLE AETERNA',
      'milestone.final.subtitle': 'Došel jsi dál než celý roadmap tým. Bezos uninstalluje realitu.',
      'milestone.final.quote': 'Tohle je strop. Hrej dál, nebo si dej čaj.',
      'milestone.continue': '▶ Pokračovat',
      'milestone.keepPlaying': '▶ Hrát dál',
      'milestone.end': '✕ Konec',

      // Toast titles
      'toast.upgradeUnlocked': 'UPGRADE ODEMČEN',
      'toast.upgradeSubtitle': 'Amazon účetní oddělení nesouhlasí.',
      'toast.skinUnlocked': 'SKIN ODEMČEN',
      'toast.solarStart': 'SOLÁRNÍ START',
      'toast.solarSub': 'Martin Slunečný zapnul dvojnásobné Yangy na 10 sekund.',
      'toast.crashisYangLost': 'Crashis Smažený ti sežral výplatu.',

      // Quit game
      'quit.tabClose': 'ZAVŘENÍ ZÁLOŽKY',
      'quit.tabCloseMsg': 'Prohlížeč mi to zatrhl. Zavři záložku ručně.',
    },

    en: {
      // Countdown page
      'countdown.subtitle': 'Amazonian Chronicles — End of Ages',
      'countdown.sub': 'Countdown to Eternal Darkness',
      'countdown.days': 'Days',
      'countdown.hours': 'Hours',
      'countdown.minutes': 'Minutes',
      'countdown.seconds': 'Seconds',
      'countdown.launch': 'Launch: Sep 28, 2021',
      'countdown.end': 'End: Jan 31, 2027',
      'countdown.loading': 'Loading the prophecy of ancient Aeternum...',
      'countdown.offline': 'Servers are offline. Aeternum has fallen. It was real.',
      'countdown.dateInfo': 'Servers will shut down forever on <strong>January 31, 2027 at 00:00 UTC</strong> — Amazon confirmed this on Jan 15, 2026',
      'countdown.newQuote': '⚡ New Prophecy',
      'countdown.fightBtn': '⚔️ Fight Against Amazon',
      'countdown.pctLost': '% lost',

      // HUD
      'hud.header': '⚔️ Battle for Aeternum ⚔️',
      'hud.score': 'Score:',
      'hud.best': 'Best:',
      'hud.yang': 'Yangs:',
      'hud.wallets': 'Wallets:',
      'hud.controls': 'Space · Click · Tap to jump',
      'rotate.hint': 'For a better experience, rotate your phone sideways.',

      // Main menu
      'menu.kicker': 'Endless grind simulator',
      'menu.title': 'BATTLE FOR AETERNUM',
      'menu.subtitle': 'Aeternum waits. Amazon does too.',
      'menu.start': '⚔ Start',
      'menu.shop': '🛒 Shop',
      'menu.skins': '🎭 Skins',
      'menu.achievements': '🏆 Achievements',
      'menu.settings': '⚙ Settings',
      'menu.cheats': '⌨ Cheat Codes',
      'menu.quit': '✕ Close game',
      'menu.hint': 'Space · Click · Tap to jump',

      // Game over
      'gameover.title': 'Server Disconnected',
      'gameover.newRecord': '⚜ NEW RECORD ⚜',
      'gameover.again': '⚔️ Again',
      'gameover.end': '✕ Menu',

      // Win panel
      'win.title': '⚜ AETERNUM SAVED ⚜',
      'win.subtitle': 'Servers live. The hero finished.',
      'win.continue': '▶ Continue (Endless)',
      'win.again': '⚔️ Again',
      'win.end': '✕ Menu',

      // Shop
      'shop.title': '🛒 Amazon Shop',
      'shop.subtitle': 'Upgrades are stored locally in your browser. Price increases with level: 100 → 150 → 200 Yangs.',
      'shop.yang': 'Yangs:',
      'shop.wallets': 'Wallets:',
      'shop.close': '✕ Close shop',
      'shop.shield.title': '🛡 Shield Start',
      'shop.shield.desc': 'Every new run starts with one shield. Maximum remains 1/1.',
      'shop.inv.title': '⚜ Longer Immortality',
      'shop.inv.desc': 'Each level extends the immortality power-up by 0.5 seconds. Maximum 3 levels.',
      'shop.dy.title': '⚡ Longer Double Yang',
      'shop.dy.desc': 'The Double Yang power-up doubles your Yangs during its effect. Each level extends it by 2 seconds. Base 8s. Maximum 2 levels.',
      'shop.crown.title': '👑 Stronger Crown Bonus',
      'shop.crown.desc': 'The crown power-up immediately adds score. Each level adds +1 score. Base +1, max 2 levels (+3 score).',
      'shop.noYang': "You don't have enough Yangs. You need 100.",
      'shop.noYangFor': "You don't have enough Yangs. You need {cost}.",
      'shop.shieldBought': 'Shield Start purchased. Next run will start with a shield.',
      'shop.invExtended': 'Immortality extended to {dur}s.',
      'shop.dyExtended': 'Double Yang extended to {dur}s.',
      'shop.crownUp': 'Crown Bonus increased to +{val} score.',

      // Economy display
      'economy.owned': 'Owned',
      'economy.notOwned': 'Not owned',
      'economy.bought': 'Bought',
      'economy.maximum': 'Maximum',
      'economy.buy100': 'Buy — 100 Yangs',
      'economy.buyFor': 'Buy — {cost} Yangs',
      'economy.invLevel': 'Level {cur}/3 (+{bonus}s)',
      'economy.dyLevel': 'Level {cur}/{max} ({dur}s)',
      'economy.crownLevel': 'Level {cur}/{max} (+{val} score)',

      // Skins panel
      'skins.title': '🎭 Character Select',
      'skins.subtitle': 'Choose a skin for your hero. Unlock new characters by playing.',
      'skins.close': '✕ Close',
      'skins.select': 'Select',
      'skins.selected': 'Selected ✓',
      'skins.statusSelected': 'Selected',
      'skins.statusUnlocked': 'Unlocked',
      'skins.locked': '🔒 {price} Wallets',
      'skins.buy': 'Buy for {price} Wallets',
      'skins.notEnough': 'Not enough Wallets',
      'skins.effect': 'Effect: {text}',
      'skins.buff': 'Buff: {text}',
      'skins.debuff': 'Debuff: {text}',
      'skins.notEnoughMsg': 'You need {price} Wallets. Aeternum does not come cheap.',
      'skins.unlockedToast': '{name} is yours. At least you look expensive now.',

      // Achievements panel
      'achievements.title': '🏆 Achievements',
      'achievements.subtitle': 'Collectible notches from Aeternum. Rewards granted automatically upon unlock.',
      'achievements.unlocked': 'Completed',
      'achievements.locked': 'Locked',
      'achievements.reward': '+{amount} Yangs',
      'achievements.rewardWallets': '+{amount} Wallets',
      'achievements.toast': 'ACHIEVEMENT UNLOCKED',

      'ach.first_run.title': 'First Flight',
      'ach.first_run.desc': 'Play your first run.',
      'ach.survived_amazon.title': 'I Survived Amazon',
      'ach.survived_amazon.desc': 'Reach a score of 20.',
      'ach.bezos_rich.title': 'Rich Like Bezos',
      'ach.bezos_rich.desc': 'Collect 500 Yangs.',
      'ach.immortal_mamrd.title': 'Immortal Bastard',
      'ach.immortal_mamrd.desc': 'Use immortality 10 times.',
      'ach.not_bug_feature.title': "That Wasn't a Bug, It Was a Feature",
      'ach.not_bug_feature.desc': 'Survive a crash thanks to a shield.',
      'ach.typicooo.title': 'Typičooo',
      'ach.typicooo.desc': 'Unlock the Moucha skin.',
      'ach.hero_of_new_world.title': 'Hero of New World',
      'ach.hero_of_new_world.desc': 'Reach a score of 100 and defeat boss Bezos.',
      'ach.unlock_all_regular_skins.title': 'Aeternum Wardrobe',
      'ach.unlock_all_regular_skins.desc': 'Unlock all regular skins.',

      // Cheat codes panel
      'cheats.title': '⌨ Cheat Codes',
      'cheats.subtitle': 'Type a secret code and see what Aeternum allows.',
      'cheats.wip': 'Cheat Codes — Work in progress',
      'cheats.close': '✕ Close',
      'cheats.placeholder': 'Enter cheat code...',
      'cheats.apply': 'Apply',
      'cheats.unknown': 'Unknown cheat code.',
      'cheats.adminUnlocked': 'Admin skin unlocked.',
      'cheats.adminAlready': 'Admin skin is already unlocked.',
      'cheats.adminToastTitle': 'ADMIN SKIN UNLOCKED',
      'cheats.adminToastSub': 'The debug gods granted you immortality.',
      'skins.lockedCheat': '🔒 Unlock via cheat code',
      'skins.lockedCheatBtn': 'Locked',

      // Settings panel
      'settings.title': '⚙ Settings',
      'settings.subtitle': 'Your settings are stored locally in your browser.',
      'settings.sfx': 'Sounds',
      'settings.sfxHint': 'Game SFX — Hmm, collect, shield',
      'settings.music': 'Music',
      'settings.musicHint': 'Background soundtrack',
      'settings.voiceLines': 'Voice Lines',
      'settings.voiceLinesHint': 'Random voice lines during gameplay',
      'settings.effects': 'Effects',
      'settings.effectsHint': 'Glow, particles, flash',
      'settings.footer': "You can't configure anything else, you bastard",
      'settings.close': '✕ Close',

      // Bottom buttons
      'bottom.shopHint': 'Upgrades for Yangs',
      'bottom.skinsHint': 'Character select',
      'bottom.achievementsHint': 'Rewards for progress',
      'bottom.cheatsHint': 'Work in progress',
      'bottom.settingsHint': 'Sounds · Music · Effects',
      'bottom.close': '✕ Close game',

      // Fullscreen
      'btn.fullscreen': '⛶ Fullscreen',
      'btn.exitFullscreen': '⛶ Exit fullscreen',

      // Panel voice line messages
      'panel.shopBlocked': 'You can open the Shop outside active flight. Amazon does not do refunds mid-battle.',
      'panel.cheatsBlocked': 'Cheat Codes outside active flight. Amazon does not like shortcuts.',
      'panel.achievementsBlocked': 'Check Achievements after landing. Right now we fall professionally.',
      'panel.settingsBlocked': 'Settings outside active flight. No time for tuning now.',
      'panel.skinsBlocked': 'Choose Skins outside active flight. Amazon does not sponsor in-flight fashion shows.',

      // Canvas status text
      'canvas.yang': 'Yangs {yang}  ·  Wallets {wallets}',
      'canvas.invincible': 'IMMORTALITY {time}s',
      'canvas.doubleYang': 'DOUBLE YANG {time}s',
      'canvas.amazonSlow': 'AMAZON SLOW {time}s',
      'canvas.amazonSpeed': 'AMAZON SPEED {time}s',
      'canvas.shield': 'SHIELD ACTIVE 1/1',

      // Game events
      'event.shieldGained': 'SHIELD GAINED — you will survive one hit.',
      'event.shieldBroken': 'SHIELD BROKEN — you flew through the obstacle.',
      'event.eventPhase': 'PHASE 2 ACTIVATED',
      'event.eventPhaseVoice': 'Phase 2: no more mercy.',
      'event.walletWon': '+1 Wallet',
      'event.walletWonSub': 'First paycheck from Aeternum.',
      'event.walletVoice': '+1 Wallet for saving Aeternum',

      // Phase milestones (score 60 / 100 / 500)
      'milestone.frost.toast': 'PHASE 3 — FROST CORE',
      'milestone.void.toast': 'PHASE 4 — VOID PROTOCOL',
      'milestone.bezos.title': 'BEZOS DEFEATED',
      'milestone.bezos.subtitle': 'Jeff just smashed another rocket. Keep going before he taxes your jumps.',
      'milestone.bezos.quote': 'Bezos is yelling at his CFO. The server cries in the corner.',
      'milestone.final.title': 'AETERNUM FINALE',
      'milestone.final.subtitle': 'You went further than the entire roadmap team. Bezos is uninstalling reality.',
      'milestone.final.quote': 'This is the ceiling. Keep playing, or go have some tea.',
      'milestone.continue': '▶ Continue',
      'milestone.keepPlaying': '▶ Keep playing',
      'milestone.end': '✕ Menu',

      // Toast titles
      'toast.upgradeUnlocked': 'UPGRADE UNLOCKED',
      'toast.upgradeSubtitle': 'Amazon accounting department disapproves.',
      'toast.skinUnlocked': 'SKIN UNLOCKED',
      'toast.solarStart': 'SOLAR START',
      'toast.solarSub': 'Martin Slunečný activated double Yangs for 10 seconds.',
      'toast.crashisYangLost': 'Crashis Smažený ate your paycheck.',

      // Quit game
      'quit.tabClose': 'TAB CLOSE',
      'quit.tabCloseMsg': 'Browser blocked it. Close the tab manually.',
    }
  };

  // ── SKIN TRANSLATIONS ──────────────────────────────────────────────────────
  const skinTranslations = {
    cs: {
      'godias-zubaty':      { name: 'Godias Zubatý',         desc: 'Původní New World hrdina. Zubatý úsměv straší Amazonce ve snech.' },
      'saradyn-z-hoodu':    { name: 'Saradyn z Hoodu',       desc: 'Záhadný lukostřelec z temných lesů. Střílí šípy, NE dotazy na zásoby.' },
      'crashis-confused':   { name: 'Crashis Confused',      desc: 'Nikdo neví, jak se sem dostal. Ani on sám. Přesto nějak přežívá.' },
      'crashis-smazeny':    { name: 'Crashis Smažený',       desc: 'Usmažený build, usmažené nervy.',                effect: '25% šance ztratit 2 Yangy po smrti.' },
      'dominik-nemrkaci':   { name: 'Dominik Nemrkací',      desc: 'Nemrkne ani když mu Amazon vypne server.' },
      'godias-prekvapeny':  { name: 'Godias Překvapený',     desc: 'Někdo mu právě řekl o datu vypnutí serverů.' },
      'kolurklaster':       { name: 'Kolurklášter',          desc: 'Mnich z kláštera, kde se modlí za stabilní ping.' },
      'martin-slunecny':    { name: 'Martin Slunečný',       desc: 'Svítí tak moc, že i bugy radši utečou.',        effect: 'Prvních 10 sekund runu máš dvojnásobné Yangy.' },
      'moucha':             { name: 'Moucha',                desc: 'Aeternum ji nikdo nezval. Stejně tu pořád lítá.' },
      'pavel-ocko':         { name: 'Pavel Očko',            desc: 'Vidí lag na míli daleko. Stejně do něj naletí.' },
      'saradyn-dlouhokrk':  { name: 'Saradyn DlouhoKrk',    desc: 'Vyhlíží další patch. Pořád.' },
      'skleny-hydratovany': { name: 'Skleny Hydratovaný',    desc: 'Dvě deci vody, jedna deci kódu.' },
      'sklenar-holoprd':    { name: 'Sklenář Holoprd',       desc: 'Legenda říká, že tenhle skin dropnul z produkce.' },
      'vseho-s-mirou':      { name: 'Všeho s Mírou',         desc: 'Amazon mu dovolil jeden respawn. Použil ho na nákup LEGO.', buff: 'Má LEGO Barad-dûr.', debuff: 'Nemá webkameru.' },
      'admin':              { name: 'Admin',                 desc: 'Testovací skin pro bohy debugování.',            effect: 'Nesmrtelnost po celou dobu runu.' },
    },
    en: {
      'godias-zubaty':      { name: 'Godias Toothed',        desc: "The original New World hero. His toothy grin haunts Amazon employees in their dreams." },
      'saradyn-z-hoodu':    { name: 'Saradyn from the Hood', desc: 'Mysterious archer from dark forests. Shoots arrows, NOT inventory questions.' },
      'crashis-confused':   { name: 'Crashis Confused',      desc: 'Nobody knows how he got here. Not even him. Yet somehow he survives.' },
      'crashis-smazeny':    { name: 'Crashis Fried',         desc: 'Fried build, fried nerves.',                    effect: '25% chance to lose 2 Yangs on death.' },
      'dominik-nemrkaci':   { name: 'Dominik the Unblinking',desc: "Doesn't blink even when Amazon shuts down his server." },
      'godias-prekvapeny':  { name: 'Godias Surprised',      desc: 'Someone just told him about the shutdown date.' },
      'kolurklaster':       { name: 'Kolurklášter',          desc: 'A monk from a monastery where they pray for stable ping.' },
      'martin-slunecny':    { name: 'Martin Sunny',          desc: 'Shines so bright that even bugs prefer to run away.', effect: 'First 10 seconds of a run you get double Yangs.' },
      'moucha':             { name: 'Moucha',                desc: "Nobody invited Moucha to Aeternum. She flies here anyway." },
      'pavel-ocko':         { name: 'Pavel Eye',             desc: 'Sees lag from a mile away. Flies into it anyway.' },
      'saradyn-dlouhokrk':  { name: 'Saradyn LongNeck',     desc: 'Looking out for the next patch. Always.' },
      'skleny-hydratovany': { name: 'Skleny Hydrated',       desc: 'Two decis of water, one deci of code.' },
      'sklenar-holoprd':    { name: 'Sklenář Holoprd',       desc: 'Legend says this skin dropped from production.' },
      'vseho-s-mirou':      { name: 'Všeho s Mírou',         desc: 'Amazon gave him one respawn. He used it to buy LEGO.', buff: 'Has LEGO Barad-dûr.', debuff: "Doesn't have a webcam." },
      'admin':              { name: 'Admin',                 desc: 'Testing skin for debug gods.',                   effect: 'Immortality for the entire run.' },
    }
  };

  // ── VOICE LINES (EN) ───────────────────────────────────────────────────────
  const VOICE_LINES_EN = [
    "Amazon reports: server is stable. Lie detected.",
    "Jeff Bezos whispers: buy another skin.",
    "Aeternum support: have you tried turning it off and on again? Us too.",
    "Quarterly report incoming. Players, hold onto your hats.",
    "New World update: we fixed one thing and broke three.",
    "System reports: your dignity has low HP.",
    "Amazon Games congratulates you. This almost looked like gameplay.",
    "Server maintenance starts at never. Ends at even later.",
    "Aeternum is watching you. And is slightly ashamed.",
    "Your friend would say this is a skill issue."
  ];

  const EVENT_VOICE_LINES_EN = [
    "This is no longer about winning. Now you survive.",
    "Aeternum is waking up.",
    "Amazon sees you.",
    "Phase 2: no more mercy.",
    "The pillars are corrupted. You are next.",
    "The server knows you now. And doesn't like you.",
    "This isn't endless. This is punishment.",
    "Bezos is laughing. Can you hear it?",
    "Blood in the grid. Crash in the code. Your death in the queue.",
    "Aeternum bleeds. So will you."
  ];

  // ── DEATH QUOTES (EN) ─────────────────────────────────────────────────────
  const DEATH_QUOTES_EN = [
    "Amazon shut down your server. No /delay will save you.",
    "You fell like New World. Gloriously, but completely.",
    "Your character ended up in Connection Timeout.",
    "Patch notes #404: Player not found.",
    "Bezos just smiled. Somewhere. On a superyacht.",
    "The quarterly report took you down faster than a Corrupted Brute.",
    "Aeternum had eternity. You had 3 seconds.",
    "Your build couldn't handle it. Just like all of New World.",
    "Your friend would have finished it. Theoretically.",
    "Game Over. Just like the whole game in January 2027.",
    "The servers fell before you did. Barely.",
    "Marks of Fortune won't give you your life back. Ever.",
    "Your level: maxed. Your chances: 0.",
    "RIP. At least Amazon didn't cancel it. This time.",
    "Your character just got eaten by Amazon's algorithm.",
    "You finished faster than Nighthaven season.",
    "Your friend just sent you a screenshot of your death.",
    "Lag? No. That was your reaction time.",
    "You fell like Amazon stock after the shutdown announcement.",
    "Your DPS was at server level: zero.",
    "Aeternum remembers. The server doesn't know you.",
    "Your little character dissolved into pixels. Literally.",
    "GG. WP. RIP. Pick one.",
    "Your endgame: empty server in January 2027.",
    "You fell so fast the stream cut to an ad.",
    "Your friend is writing: 'See? I told you so.'",
    "Amazon Customer Service: 'Your death is important to us. Please hold.'",
    "Pillars: 1, Hero: 0. Classic.",
    "Your aim assist was disabled. Permanently.",
    "Server status: 200 OK. Player status: 500 Internal Skill Error.",
    "That was your loadout? Really? That?",
    "You fell between pillars like Amazon's reputation among gamers.",
    "Your guild master just left the guild. Shameful.",
    "Patch 1.2.7 broke your reflexes. No fix.",
    "Your death: officially endorsed by Jeff Bezos.",
    "Refund? No. Respawn? No. This is your new normal.",
    "You play a game about nothing. You win nothing. Welcome to New World.",
    "Your family just messaged you. Ignore it. Play again.",
    "Hashtag JustNewWorldThings — even this game is dying.",
    "Your score would shame even the lvl 5 launch bots.",
    "Corrupted portals had better stats than your jump.",
    "Your game was saved. To Amazon's trash.",
    "The servers are more stable than your flying.",
    "Your friend is on the floor laughing. Play again.",
    "Aeternum won't remember you. Neither will Amazon.",
    "Your fall damage: ego, dignity, plus 1 button.",
    "The dev team left Amazon long ago. You can too.",
    "Your 'spam spacebar' strategy failed. Shocking.",
    "Bezos just sold you an NFT of your death.",
    "Game over. Soon the whole game too. Bonding moment.",
    "Your character joined the Lost Souls of Aeternum.",
    "You fell. Amazon fell. New World fell. It's a trend.",
    "That beeping in your headphones was your heartbeat, not a notification.",
    "Replicating this death in lab conditions: easy.",
    "Your WASD failed. Your space failed. Your dreams failed.",
    "Player not found in leaderboard. Not in memory either.",
    "Your 5000 hours in New World did not prepare you for this.",
    "This is why parents thought gaming wasn't a career.",
    "Jeff Bezos: 'I have better games at home.' He only has yachts.",
    "Your friend just opened a different server. At least someone did.",
    "No clutch. No boss kill. No jump.",
    "Game Over Screen is now your home screen.",
    "Critics gave your death 6/10. 'Generic, but functional.'",
    "Your character went to Valhalla. The place was closed.",
    "Errored out. Like Amazon Games division.",
    "The game just sent you invoices for premium respawns."
  ];

  // ── WIN QUOTES (EN) ───────────────────────────────────────────────────────
  const WIN_QUOTES_EN = [
    "You saved the servers! Amazon cancelled the cancellation. Players weep with joy.",
    "VICTORY! Bezos just signed a contract for another 100 years of New World.",
    "Your friend is sending you a beer. Via server. It works.",
    "Aeternum lives! Your heroic flight stopped the quarterly report.",
    "Amazon Games just hired you as CEO. Salary: infinite gold.",
    "Game saved! New World renamed to 'Old World, But Better'.",
    "Servers lit up again. Players came back. Even the sweaty ones.",
    "ETERNAL VICTORY! Aeternum was officially renamed after you.",
    "Your score broke Amazon servers. Ironically shutting down the shutdown.",
    "Bezos wrote: 'OK fine, the game stays.' Then disappeared in a helicopter.",
    "SAVED! Your friend just sent you a save game. Finally.",
    "Servers running. Players farming. Everything is fine. For now.",
    "TRIUMPH! Amazon CEO just shook hands and announced an expansion pack.",
    "Aeternum declares you Warden. Pay: 0 gold, but it's an honor.",
    "You won! Your friend can now finish all the quests. Finally."
  ];

  // ── COUNTDOWN PAGE QUOTES (EN) ────────────────────────────────────────────
  const QUOTES_EN = [
    "Your friend dedicated thousands of hours to a game Amazon deleted faster than they read the patch notes.",
    "They say the last New World player turned off the lights, paid rent for an empty server, and went home.",
    "Amazon invested billions in New World. Your friend invested their life. The result? The same.",
    "Every second your friend spent mining ore in Aeternum led exactly here. Right here.",
    "The Nighthaven season will last forever — or until January 31, 2027. Both are about the same duration.",
    "Jeff Bezos sold New World faster than your friend could finish a world boss in Myrkgard.",
    "The hero who survived everything — Corrupted, mutations, lag, server outages — did not survive Amazon's quarterly report.",
    "In Aeternum, time exists. It is measured in 'how many days are left.' You just looked.",
    "Historians will one day study New World civilization. They'll call it 'A Brief Eruption of Masochism, 2021–2027'.",
    "Your friend still has time to make it. Or not. Depends on what 'make it' means in an MMO being shut down.",
    "Amazon cancelled New World yet still lets people pay for in-game currency until July 2026. That's not cynicism. That's art.",
    "Where was your friend when Amazon wrote the shutdown announcement? Probably in a dungeon, underleveled, with a bad build.",
    "Legend says Aeternum is an island without age. The legend lied. It ages. Fast. It dies January 31, 2027.",
    "Aeternum's managers confirmed Nighthaven season will last 'forever'. Forever = 8 months.",
    "Your friend can still re-level their character 100 more times. Or realize that time flows like sand in Amazon's CEO's hourglass.",
    "New World had nearly a million concurrent players. Then reality came. And then this countdown.",
    "Factoid: It took Amazon 6 years to shut down New World. It's taking your friend roughly the same to ignore it.",
    "The game will forever remain in players' hearts. Just not on servers. Servers are expensive.",
    "Whenever your friend logs in, they should think: 'That's one step closer to the darkness.' It's motivational.",
    "At the end of Aeternum there will be no boss fight or cutscene. Just an error message: Connection timeout.",
    "Did you know Rust offered to buy New World? Amazon said no. Players cried. Rust whistled.",
    "Every game director told players 'thank you for your support'. Every one. They all ended the same way.",
    "Your friend now plays a game with an expiration date like yogurt. Except yogurt is at least worth eating.",
    "Amazon: 'We appreciate your passion and dedication.' Players: 'Then why are you shutting it down?' Amazon: 'Ha ha, yeah.'",
    "This countdown isn't cruel. It's a reminder. And educational material. And a bit cruel.",
    "Aeternum = Latin for 'eternity'. Marketing 10/10. Reality 2/10. Nice try.",
    "Every pixel of New World will be deleted on January 31, 2027. Every one. Even the one paid for with premium currency.",
    "Your friend's plan for the rest of the game: level up, farm, pay for things that will disappear in a few months. Solid plan.",
    "In MMO history, New World lives as a reminder: even a billion-dollar studio can turn off the lights and go home.",
    "The countdown continues. Tick. Tock. Tick. Tock. Amazon signed the payroll. The servers know what's coming.",
    "The player who farmed Iron in Aeternum for 400 hours: 'They surely won't shut it down.' Amazon: 'Hold my quarterly report.'",
    "They say the loot tables in New World were broken. But nothing as broken as Amazon's management decisions.",
    "The good news is that when the game ends, your friend will finally try other games. The bad news is they don't know any.",
    "This timer shows time until the end. But it actually shows time your friend could have spent differently.",
    "New World: Aeternum — translated from marketing Latin: 'Forever, approximately until January 31, 2027'.",
    "When Amazon announced the end, the community was devastated. Then they remembered the server outages and relaxed a bit.",
    "Someone is still paying for Marks of Fortune until July 2026. We must respect these choices, but not understand them.",
    "The last day of New World will probably be the most stable, because the server will finally be empty.",
    "A friend plays a game that will end. That's OK. But they should know about it. That's why this page exists.",
    "Tick tock, adventurer. Tick tock.",
    "That's exactly how many seconds your friend has left to max out a game that... didn't go well.",
    "This isn't malice. It's love. Informed love with a precise expiration date.",
    "Remember how glorious New World's launch was? Nearly a million players? Good times. Long gone.",
    "Amazon Games: 0 successful games, infinite budget. Your friend: 1 favourite game, temporary servers.",
    "New World lived, fought, and fell like a hero. Or like a project that missed its KPIs. Depends on perspective.",
    "In Aeternum the sun always rose. From January 31, 2027, it rises over empty servers.",
    "Every New World player deserves recognition. They survived launch bugs, economic resets, and Amazon's decision-making process.",
    "Your friend will spend the last day playing New World. Or sleeping. Or both. Nobody will record it.",
    "This app exists because friends tell each other the truth. And the truth is: the servers go down in [see above].",
    "Amazon let New World shut down but didn't forget to take the money for premium currency. Clever.",
    "The last New World quest will be: 'Survive until January 31, 2027.' Reward: Nothing. But memories forever."
  ];

  // ── CORE FUNCTIONS ─────────────────────────────────────────────────────────
  function t(key, params) {
    params = params || {};
    const langTable = translations[currentLanguage] || translations.cs;
    let text = langTable[key];
    if (text === undefined) text = translations.cs[key];
    if (text === undefined) { return key; }
    const keys = Object.keys(params);
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      text = text.split('{' + k + '}').join(String(params[k]));
    }
    return text;
  }

  function getSkinTranslation(skinId) {
    const langTable = skinTranslations[currentLanguage] || skinTranslations.cs;
    return langTable[skinId] || skinTranslations.cs[skinId] || null;
  }

  function getCurrentLanguage() { return currentLanguage; }
  function getDeathQuotes()      { return currentLanguage === 'en' ? DEATH_QUOTES_EN : null; }
  function getWinQuotes()        { return currentLanguage === 'en' ? WIN_QUOTES_EN : null; }
  function getVoiceLines()       { return currentLanguage === 'en' ? VOICE_LINES_EN : null; }
  function getEventVoiceLines()  { return currentLanguage === 'en' ? EVENT_VOICE_LINES_EN : null; }
  function getQuotes()           { return currentLanguage === 'en' ? QUOTES_EN : null; }

  function applyTranslations() {
    // data-i18n → textContent
    const i18nEls = document.querySelectorAll('[data-i18n]');
    for (let i = 0; i < i18nEls.length; i++) {
      i18nEls[i].textContent = t(i18nEls[i].getAttribute('data-i18n'));
    }
    // data-i18n-placeholder → placeholder attribute
    const phEls = document.querySelectorAll('[data-i18n-placeholder]');
    for (let i = 0; i < phEls.length; i++) {
      phEls[i].setAttribute('placeholder', t(phEls[i].getAttribute('data-i18n-placeholder')));
    }
    // data-i18n-html → innerHTML (only static trusted content)
    const htmlEls = document.querySelectorAll('[data-i18n-html]');
    for (let i = 0; i < htmlEls.length; i++) {
      htmlEls[i].innerHTML = t(htmlEls[i].getAttribute('data-i18n-html'));
    }
    // Language button labels
    const langBtns = document.querySelectorAll('.language-btn');
    for (let i = 0; i < langBtns.length; i++) {
      langBtns[i].textContent = currentLanguage.toUpperCase();
    }
    // html[lang]
    document.documentElement.lang = currentLanguage;
    // Fullscreen button text
    if (typeof syncFullscreenButton === 'function') syncFullscreenButton();
  }

  function setLanguage(lang) {
    if (!translations[lang]) lang = 'cs';
    currentLanguage = lang;
    try { localStorage.setItem(LANGUAGE_KEY, lang); } catch (e) {}
    applyTranslations();
    // Re-render dynamic panels if open
    if (typeof updateEconomyUi === 'function')        updateEconomyUi();
    if (typeof renderAchievementsPanel === 'function') renderAchievementsPanel();
    if (typeof renderSkinsPanel === 'function')        renderSkinsPanel();
    if (typeof renderSettingsPanel === 'function')     renderSettingsPanel();
  }

  function toggleLanguage() {
    setLanguage(currentLanguage === 'cs' ? 'en' : 'cs');
  }

  function initI18n() {
    let lang = 'cs';
    try { lang = localStorage.getItem(LANGUAGE_KEY) || 'cs'; } catch (e) {}
    if (!translations[lang]) lang = 'cs';
    currentLanguage = lang;
    applyTranslations();
  }

  // ── EXPORTS ────────────────────────────────────────────────────────────────
  NWI18n.t                  = t;
  NWI18n.getSkinTranslation = getSkinTranslation;
  NWI18n.getCurrentLanguage = getCurrentLanguage;
  NWI18n.getDeathQuotes     = getDeathQuotes;
  NWI18n.getWinQuotes       = getWinQuotes;
  NWI18n.getVoiceLines      = getVoiceLines;
  NWI18n.getEventVoiceLines = getEventVoiceLines;
  NWI18n.getQuotes          = getQuotes;
  NWI18n.setLanguage        = setLanguage;
  NWI18n.toggleLanguage     = toggleLanguage;
  NWI18n.initI18n           = initI18n;
  NWI18n.applyTranslations  = applyTranslations;

})(window.NWI18n);

// Global shortcuts used by onclick handlers and game files
function t(key, params) { return window.NWI18n.t(key, params); }
function toggleLanguage() { window.NWI18n.toggleLanguage(); }
