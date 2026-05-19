// Share final run result (game over screen).
// - Web Share API on supported devices (mobile)
// - Clipboard fallback on desktop
// - Facebook sharer URL + Messenger fallback (mobile: Web Share, desktop: clipboard)

const SHARE_GAME_TITLE = 'New World: Aeternum';

function getShareSectionEl() {
  return document.getElementById('shareSection');
}

function getShareStatusEl() {
  return document.getElementById('shareStatus');
}

function showShareStatus(message) {
  const el = getShareStatusEl();
  if (!el) return;
  el.textContent = message || '';
  if (message) {
    el.classList.add('show');
    if (showShareStatus._timer) clearTimeout(showShareStatus._timer);
    showShareStatus._timer = setTimeout(() => {
      el.classList.remove('show');
    }, 2600);
  } else {
    el.classList.remove('show');
  }
}

function showShareSection() {
  const el = getShareSectionEl();
  if (!el) return;
  el.classList.add('show');
  const status = getShareStatusEl();
  if (status) {
    status.textContent = '';
    status.classList.remove('show');
  }
  const nativeBtn = document.getElementById('shareNativeBtn');
  if (nativeBtn) {
    nativeBtn.style.display = (typeof navigator !== 'undefined' && typeof navigator.share === 'function') ? '' : 'none';
  }
}

function hideShareSection() {
  const el = getShareSectionEl();
  if (!el) return;
  el.classList.remove('show');
  const status = getShareStatusEl();
  if (status) {
    status.textContent = '';
    status.classList.remove('show');
  }
}

function buildShareText(opts) {
  const o = opts || {};
  const finalScore = Math.max(0, Math.floor(Number(o.score) || 0));
  const best = Math.max(0, Math.floor(Number(o.best) || 0));
  const isNewRecord = !!o.isNewRecord;
  const y = Math.max(0, Math.floor(Number(o.yangs) || 0));
  const w = Math.max(0, Math.floor(Number(o.wallets) || 0));
  const dc = Math.max(0, Math.floor(Number(o.dragonCoins) || 0));

  const head = isNewRecord
    ? t('share.head.record', { title: SHARE_GAME_TITLE, score: finalScore })
    : t('share.head.normal', { title: SHARE_GAME_TITLE, score: finalScore });

  const currencyParts = [];
  if (y > 0) currencyParts.push(`${t('common.yang')}: ${y}`);
  if (w > 0) currencyParts.push(`${t('common.wallets')}: ${w}`);
  if (dc > 0) currencyParts.push(`${t('common.dragonCoins')}: ${dc}`);

  const lines = [head];
  if (currencyParts.length) lines.push(currencyParts.join(' • '));
  if (!isNewRecord && best > 0) lines.push(t('share.bestLine', { best: best }));
  lines.push(t('share.callout'));
  return lines.join('\n');
}

function buildCurrentShareText() {
  let finalScore = 0;
  let best = 0;
  let isNewRecord = false;
  try {
    const finalEl = document.getElementById('finalScore');
    if (finalEl) finalScore = parseInt(finalEl.textContent, 10) || 0;
    const recEl = document.getElementById('newRecord');
    if (recEl && recEl.classList.contains('show')) isNewRecord = true;
  } catch (e) {}
  try { if (typeof bestScore === 'number') best = bestScore; } catch (e) {}
  let y = 0, w = 0, dc = 0;
  try { if (typeof yang === 'number') y = yang; } catch (e) {}
  try { if (typeof wallets === 'number') w = wallets; } catch (e) {}
  try { if (typeof dragonCoins === 'number') dc = dragonCoins; } catch (e) {}
  return buildShareText({ score: finalScore, best, isNewRecord, yangs: y, wallets: w, dragonCoins: dc });
}

async function copyTextToClipboard(text) {
  if (navigator && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {}
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'absolute';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand && document.execCommand('copy');
    document.body.removeChild(ta);
    return !!ok;
  } catch (e) {
    return false;
  }
}

async function shareResult() {
  const text = buildCurrentShareText();
  const url = (typeof location !== 'undefined' && location.href) ? location.href : '';
  if (navigator && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: SHARE_GAME_TITLE,
        text,
        url
      });
      showShareStatus(t('share.shared'));
      return;
    } catch (err) {
      if (err && err.name === 'AbortError') return;
      // fall through to clipboard
    }
  }
  const ok = await copyTextToClipboard(text);
  showShareStatus(ok ? t('share.copied') : t('share.copyFailed'));
}

async function copyShareResult() {
  const text = buildCurrentShareText();
  const ok = await copyTextToClipboard(text);
  showShareStatus(ok ? t('share.copied') : t('share.copyFailed'));
}

async function shareResultFacebook() {
  const text = buildCurrentShareText();
  const url = (typeof location !== 'undefined' && location.href) ? location.href : '';
  // Pre-copy so the user can paste text into FB composer.
  await copyTextToClipboard(text);
  const shareUrl = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url || 'https://www.facebook.com/');
  try {
    window.open(shareUrl, '_blank', 'noopener,noreferrer,width=640,height=560');
    showShareStatus(t('share.fbCopied'));
  } catch (e) {
    showShareStatus(t('share.fbFailed'));
  }
}

async function shareResultMessenger() {
  const text = buildCurrentShareText();
  if (navigator && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: SHARE_GAME_TITLE, text, url: location.href });
      return;
    } catch (err) {
      if (err && err.name === 'AbortError') return;
    }
  }
  const ok = await copyTextToClipboard(text);
  showShareStatus(ok ? t('share.msgCopied') : t('share.copyFailed'));
}

// ===== Instagram Stories share =====
// Generuje 9:16 obrázek se skóre + vtipným callout textem. Na podporovaných
// zařízeních se obrázek sdílí přes Web Share API (s files). Jinak fallback:
// stáhnout PNG + ukázat hint, ať ho hráč nahraje do Stories ručně.

function getStoryScoreData() {
  let finalScore = 0;
  let best = 0;
  try {
    const finalEl = document.getElementById('finalScore');
    if (finalEl) finalScore = parseInt(finalEl.textContent, 10) || 0;
  } catch (e) {}
  try { if (typeof bestScore === 'number') best = bestScore; } catch (e) {}
  return { score: finalScore, best };
}

function drawStoryWrappedText(ctx2d, text, x, y, maxWidth, lineHeight) {
  const words = String(text || '').split(/\s+/);
  let line = '';
  let cy = y;
  for (let i = 0; i < words.length; i++) {
    const test = line ? line + ' ' + words[i] : words[i];
    if (ctx2d.measureText(test).width > maxWidth && line) {
      ctx2d.fillText(line, x, cy);
      line = words[i];
      cy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx2d.fillText(line, x, cy);
  return cy + lineHeight;
}

async function generateScoreStoryImage(data) {
  const W = 1080;
  const H = 1920;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const cx = c.getContext('2d');

  // Pozadí — tmavé gold/copper jako menu.
  const grad = cx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#1a1208');
  grad.addColorStop(0.55, '#2a1f10');
  grad.addColorStop(1, '#0a0806');
  cx.fillStyle = grad;
  cx.fillRect(0, 0, W, H);

  // Subtle vignette + gold particles.
  cx.fillStyle = 'rgba(201,168,76,0.25)';
  for (let i = 0; i < 80; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    const r = Math.random() * 3 + 1;
    cx.fillRect(x, y, r, r);
  }

  // Rámeček.
  cx.strokeStyle = '#c9a84c';
  cx.lineWidth = 6;
  cx.strokeRect(30, 30, W - 60, H - 60);

  // Kicker.
  cx.fillStyle = '#f0d080';
  cx.font = 'bold 56px "Cinzel Decorative", Georgia, serif';
  cx.textAlign = 'center';
  cx.textBaseline = 'top';
  cx.fillText(SHARE_GAME_TITLE.toUpperCase(), W / 2, 220);

  // Score label.
  cx.fillStyle = '#c9a84c';
  cx.font = 'bold 60px "Cinzel", serif';
  cx.fillText(t('share.story.scored'), W / 2, 540);

  // Velké skóre.
  cx.fillStyle = '#fff2a8';
  cx.font = 'bold 320px "Cinzel Decorative", Georgia, serif';
  cx.fillText(String(data.score || 0), W / 2, 640);

  // Best score (pokud je).
  if (data.best > 0) {
    cx.fillStyle = '#c9a84c';
    cx.font = 'bold 44px "Cinzel", serif';
    cx.fillText(t('share.bestLine', { best: data.best }), W / 2, 1080);
  }

  // Vtipný callout — obtékaný text.
  cx.fillStyle = '#f0d080';
  cx.font = 'bold 52px "Cinzel", serif';
  drawStoryWrappedText(cx, t('share.story.callout'), W / 2, 1340, W - 200, 70);

  // Patička.
  cx.fillStyle = '#c9a84c';
  cx.font = 'bold 36px "Cinzel", serif';
  cx.fillText(t('share.story.footer'), W / 2, H - 160);

  return await new Promise((resolve) => {
    c.toBlob((blob) => resolve(blob), 'image/png');
  });
}

function downloadBlobAsFile(blob, filename) {
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return true;
  } catch (e) {
    return false;
  }
}

async function shareInstagramStory() {
  const data = getStoryScoreData();
  let blob = null;
  try {
    blob = await generateScoreStoryImage(data);
  } catch (e) {
    showShareStatus(t('share.story.generateFailed'));
    return;
  }
  if (!blob) {
    showShareStatus(t('share.story.generateFailed'));
    return;
  }
  const file = new File([blob], 'score-story.png', { type: 'image/png' });

  // Mobile / supported: Web Share API with files.
  try {
    if (navigator && typeof navigator.canShare === 'function'
        && navigator.canShare({ files: [file] })
        && typeof navigator.share === 'function') {
      await navigator.share({
        files: [file],
        title: SHARE_GAME_TITLE,
        text: t('share.story.shareText', { score: data.score })
      });
      showShareStatus(t('share.story.shared'));
      return;
    }
  } catch (err) {
    if (err && err.name === 'AbortError') return;
    // pokračujeme do fallbacku
  }

  // Fallback — stáhnout obrázek + hláška, ať si ho hráč ručně nahraje.
  const ok = downloadBlobAsFile(blob, 'score-story.png');
  showShareStatus(ok ? t('share.story.downloaded') : t('share.story.generateFailed'));
}

// Expose globally (classic <script> loading pattern used by this project).
window.buildShareText = buildShareText;
window.shareResult = shareResult;
window.copyShareResult = copyShareResult;
window.shareResultFacebook = shareResultFacebook;
window.shareResultMessenger = shareResultMessenger;
window.shareInstagramStory = shareInstagramStory;
window.showShareSection = showShareSection;
window.hideShareSection = hideShareSection;
