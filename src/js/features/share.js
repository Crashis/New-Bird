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

// Expose globally (classic <script> loading pattern used by this project).
window.buildShareText = buildShareText;
window.shareResult = shareResult;
window.copyShareResult = copyShareResult;
window.shareResultFacebook = shareResultFacebook;
window.shareResultMessenger = shareResultMessenger;
window.showShareSection = showShareSection;
window.hideShareSection = hideShareSection;
