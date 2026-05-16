const SHUTDOWN = new Date('2027-01-31T00:00:00Z');
const LAUNCH   = new Date('2021-09-28T00:00:00Z');

const QUOTES = [
  "Tvůj kamarád věnoval tisíce hodin hře, kterou Amazon smazal rychleji, než dočetl patch notes.",
  "Říká se, že poslední hráč New Worldu zhasnul světlo, zaplatil nájem za prázdný server a odešel domů.",
  "Amazon investoval miliardy do New Worldu. Tvůj kamarád investoval svůj život. Výsledek? Stejný.",
  "Každá sekunda, kterou tvůj kamarád strávil farmením rudy v Aeterne, vedla přesně sem. Semhle.",
  "Nighthaven season bude trvat navěky — nebo do 31. ledna 2027. Obojí je přibližně stejně dlouho.",
  "Jeff Bezos prodal New World rychleji, než tvůj kamarád dosekilloval world bosse v Myrkgard.",
  "Hrdina, který přežil vše — Corrupted, mutace, logy, výpadky serverů — nepřežil čtvrtletní report Amazonu.",
  "V Aeterne existuje čas. Měří se v 'kolik ještě dní zbývá do konce.' Právě ses podíval.",
  "Historici budou jednou studovat civilizaci New Worldu. Budou ji označovat jako 'Krátkodobá erupce masochismu, 2021–2027'.",
  "Tvůj kamarád má ještě čas to stihnout. Nebo ne. Záleží, co znamená 'stihnout' v MMO, které ruší.",
  "Amazon zrušil New World a přesto nechává lidi platit za in-game měnu do července 2026. To není cynismus. To je umění.",
  "Kde byl tvůj kamarád, když Amazon psal oznámení o ukončení? Pravděpodobně v dungeonu, bez levelu, s špatným buildem.",
  "Legenda praví, že Aeternum je ostrov bez stáří. Legenda lhala. Stárne. Rychle. Umře 31. 1. 2027.",
  "Správci Aeterna potvrdili, že Nighthaven season potrvá 'navždy'. Navždy = 8 měsíců.",
  "Tvůj kamarád může ještě 100x dolevat character. Nebo si uvědomit, že mu teče čas jako píšek v přesýpacích hodinách šéfa Amazonu.",
  "New World měl skoro milion concurrent hráčů. Pak přišla realita. A pak přišel tento odpočítávač.",
  "Faktoid: Amazonu trvalo 6 let, aby zrušil New World. Tvému kamarádovi to zatím trvá ignorovat.",
  "Hra navždy zůstane ve srdcích hráčů. Ale ne na serverech. Servery jsou dražší.",
  "Kdykoli tvůj kamarád přihlásí, měl by si říct: 'To je jeden krok blíž ke tmě.' Je to motivační.",
  "Na konci Aeterna nebudou boss fight ani cutscéna. Jen chybová hláška: Connection timeout.",
  "Věděl jsi, že Rust nabídl odkoupit New World? Amazon řekl ne. Hráči brečeli. Rust si hvízdal.",
  "Každý game director řekl hráčům 'díky za vši podporu'. Každý. Všichni skončili stejně.",
  "Tvůj kamarád teď hraje hru, která má expiraci jako jogurt. Jenže jogurt alespoň stojí za to sníst.",
  "Amazon: 'Jsme rádi za váš zápal a vášeň.' Hráči: 'Tak proč to ruší?' Amazon: 'Ha ha, jo.'",
  "Tento countdown není krutý. Je to připomínka. A vzdělávací materiál. A trochu krutý.",
  "Aeternum = latinsky 'věčnost'. Marketing 10/10. Realita 2/10. Nice try.",
  "Každý pixel New Worldu bude 31. 1. 2027 smazán. Každý. I ten, který zaplatil prémiovou měnou.",
  "Tvůj kamarád má plán na zbytek hry: dallevat, farmat, platit za věci, které zmizí za pár měsíců. Solidní plán.",
  "V historii MMO žije New World jako připomínka: i miliardové studio může vypnout světla a jít domů.",
  "Countdown pokračuje. Tick. Tock. Tick. Tock. Amazon podepsal výplatní pásky. Servery ví, co přijde.",
  "Hráč, který farmil Iron v Aeterne 400 hodin: 'To přece nevypnou.' Amazon: 'Hold my quarterly report.'",
  "Říká se, že loot tables v New Worldu byly zkažené. Ale nic tak zkažené jako rozhodnutí vedení Amazonu.",
  "Dobrou zprávou je, že až hra skončí, tvůj kamarád konečně vyzkouší jiné hry. Špatnou zprávou je, že je nezná.",
  "Tento timer zobrazuje čas do konce. Ale ve skutečnosti zobrazuje čas, který tvůj kamarád mohl trávit jinak.",
  "New World: Aeternum — přeloženo z marketingové latiny: 'Navždy, přibližně do 31. 1. 2027'.",
  "Když Amazon oznámil konec, komunita byla zdrcena. Pak si vzpomněla na server outages a trochu se uvolnila.",
  "Někdo ještě platí za Marks of Fortune do července 2026. Tyto hlasování musíme respektovat, ale nechápat.",
  "Poslední den New Worldu bude pravděpodobně nejstabilnější, protože server bude konečně prázdný.",
  "Kamarád hraje hru, která skončí. To je v pořádku. Ale mohl by o tom vědět. Proto existuje tato stránka.",
  "Tick tock, adventurer. Tick tock.",
  "Přesně tolik sekund zbývá tvému kamarádovi, aby dosáhl maxima ve hře, která... nevyšla dobře.",
  "Tohle není zlomyslnost. Je to láska. Informovaná láska s přesným datem expirace.",
  "Vzpomínáš si, jak byl launch New Worldu slavný? Skoro milion hráčů? Dobré časy. Dávno pryč.",
  "Amazon Games: 0 úspěšných her, nekonečný rozpočet. Tvůj kamarád: 1 oblíbená hra, dočasný server.",
  "New World žil, bojoval a padl jako hrdina. Nebo jako projekt, který nesplnil KPIs. Záleží na perspektivě.",
  "V Aeterne vždy vycházelo slunce. Od 31. 1. 2027 vychází nad prázdnými servery.",
  "Každý hráč New Worldu si zasluhuje uznání. Přežili launch bugs, ekonomické resety i Amazoncí rozhodovací proces.",
  "Tvůj kamarád stráví poslední den hraním New Worldu. Nebo spát. Nebo obojí. Nikdo to nezaznamená.",
  "Tato aplikace existuje, protože přátelé si říkají pravdu. A pravda je: servery jdou dolů za [viz nahoře].",
  "Amazon nechal vypnout New World, ale nezapomněl vzít peníze za prémiovou měnu. Šikovní.",
  "Poslední quest New Worldu bude: 'Přežít do 31. 1. 2027.' Reward: Nic. Ale vzpomínky navždy.",
];

let usedQuotes = [];
let currentQuoteText = '';

function newQuote() {
  if (usedQuotes.length >= QUOTES.length) usedQuotes = [];
  let available = QUOTES.filter((_, i) => !usedQuotes.includes(i));
  let idx = QUOTES.indexOf(available[Math.floor(Math.random() * available.length)]);
  usedQuotes.push(idx);
  const el = document.getElementById('quote');
  el.classList.remove('visible');
  setTimeout(() => {
    el.textContent = QUOTES[idx];
    el.classList.add('visible');
  }, 350);
}

function pad(n) { return String(Math.floor(n)).padStart(2, '0'); }

let prevValues = { days: '', hours: '', minutes: '', seconds: '' };

function tick() {
  const now = new Date();
  const diff = SHUTDOWN - now;

  if (diff <= 0) {
    document.getElementById('days').textContent = '00';
    document.getElementById('hours').textContent = '00';
    document.getElementById('minutes').textContent = '00';
    document.getElementById('seconds').textContent = '00';
    document.getElementById('quote').textContent = 'Servery jsou offline. Aeternum padlo. Bylo to skutečné.';
    document.getElementById('quote').classList.add('visible');
    return;
  }

  const totalSecs = Math.floor(diff / 1000);
  const days    = Math.floor(totalSecs / 86400);
  const hours   = Math.floor((totalSecs % 86400) / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;

  const vals = {
    days: String(days),
    hours: pad(hours),
    minutes: pad(minutes),
    seconds: pad(seconds)
  };

  for (const [key, val] of Object.entries(vals)) {
    const el = document.getElementById(key);
    if (val !== prevValues[key]) {
      el.textContent = val;
      el.classList.remove('tick');
      void el.offsetWidth;
      el.classList.add('tick');
      prevValues[key] = val;
    }
  }

  const total = SHUTDOWN - LAUNCH;
  const elapsed = now - LAUNCH;
  const pct = Math.min(100, Math.max(0, (elapsed / total) * 100));
  document.getElementById('progress').style.width = pct.toFixed(2) + '%';
  document.getElementById('progress-pct').textContent = pct.toFixed(1) + '% prohráno';
}

function createParticles() {
  const container = document.getElementById('particles');
  for (let i = 0; i < 25; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.setProperty('--x', (Math.random() * 100) + '%');
    p.style.setProperty('--dur', (8 + Math.random() * 14) + 's');
    p.style.setProperty('--delay', (Math.random() * 12) + 's');
    if (Math.random() > 0.7) {
      p.style.width = '3px';
      p.style.height = '3px';
      p.style.opacity = '0.3';
    }
    container.appendChild(p);
  }
}

createParticles();
tick();
setInterval(tick, 1000);
setTimeout(newQuote, 800);
