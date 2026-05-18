const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const firebaseSource = fs.readFileSync(path.join(repoRoot, 'src/firebase.js'), 'utf8');
const googleAuthSource = fs.readFileSync(path.join(repoRoot, 'src/js/features/googleAuth.js'), 'utf8');
const panelsSource = fs.readFileSync(path.join(repoRoot, 'src/js/ui/panels.js'), 'utf8');
const indexSource = fs.readFileSync(path.join(repoRoot, 'index.html'), 'utf8');
const mainSource = fs.readFileSync(path.join(repoRoot, 'src/js/main.js'), 'utf8');

// firebase.js: re-exports Google auth API via firebaseSDK
assert.ok(firebaseSource.includes('GoogleAuthProvider'), 'firebase.js should import GoogleAuthProvider');
assert.ok(firebaseSource.includes('linkWithPopup'), 'firebase.js should import linkWithPopup');
assert.ok(firebaseSource.includes('signInWithPopup'), 'firebase.js should import signInWithPopup');
assert.ok(/firebaseSDK\s*=\s*{[\s\S]*?GoogleAuthProvider[\s\S]*?}/.test(firebaseSource), 'firebaseSDK should expose GoogleAuthProvider');
assert.ok(/firebaseSDK\s*=\s*{[\s\S]*?linkWithPopup[\s\S]*?}/.test(firebaseSource), 'firebaseSDK should expose linkWithPopup');

// googleAuth.js: exposes required surface
assert.ok(googleAuthSource.includes('export function getCurrentAuthUser'), 'googleAuth should export getCurrentAuthUser');
assert.ok(googleAuthSource.includes('export function isAnonymousUser'), 'googleAuth should export isAnonymousUser');
assert.ok(googleAuthSource.includes('export async function linkCurrentAnonymousUserWithGoogle'), 'googleAuth should export linkCurrentAnonymousUserWithGoogle');
assert.ok(googleAuthSource.includes('export async function signInWithGoogle'), 'googleAuth should export signInWithGoogle');
assert.ok(googleAuthSource.includes('window.NWGoogleAuth'), 'googleAuth should expose window.NWGoogleAuth');
assert.ok(googleAuthSource.includes("'google-link'"), 'googleAuth should flush cloud save with reason "google-link"');
assert.ok(googleAuthSource.includes('auth/credential-already-in-use'), 'googleAuth should handle credential-already-in-use');
assert.ok(googleAuthSource.includes('auth/popup-closed-by-user'), 'googleAuth should handle popup-closed-by-user');
assert.ok(googleAuthSource.includes('auth/popup-blocked'), 'googleAuth should handle popup-blocked');

// Refusal path: link must require isAnonymous === true and call linkWithPopup
assert.ok(/user\.isAnonymous/.test(googleAuthSource), 'link function must check isAnonymous');
assert.ok(/linkWithPopup/.test(googleAuthSource), 'link function must call linkWithPopup');

// main.js: boots googleAuth after cloudSave init
const cloudInitIdx = mainSource.indexOf('initCloudSave(');
const googleInitIdx = mainSource.indexOf('initGoogleAuth(');
assert.ok(cloudInitIdx > -1, 'main.js should call initCloudSave');
assert.ok(googleInitIdx > cloudInitIdx, 'main.js must call initGoogleAuth after initCloudSave');

// index.html: required DOM nodes for Google linking UI
assert.ok(indexSource.includes('id="googleAccountStatusText"'), 'index.html must contain googleAccountStatusText');
assert.ok(indexSource.includes('id="googleAccountLinkBtn"'), 'index.html must contain googleAccountLinkBtn');
assert.ok(indexSource.includes('id="googleAccountErrorText"'), 'index.html must contain googleAccountErrorText');

// panels.js: wires Google link UI
assert.ok(panelsSource.includes('initGoogleLinkUi'), 'panels.js must define initGoogleLinkUi');
assert.ok(panelsSource.includes('linkCurrentAnonymousUserWithGoogle'), 'panels.js must call linkCurrentAnonymousUserWithGoogle');
assert.ok(panelsSource.includes('Přihlášen přes Google'), 'panels.js must render linked-account label with email');
assert.ok(panelsSource.includes('Hraješ jako anonymní'), 'panels.js must render anonymous-account label');
assert.ok(panelsSource.includes('Přihlásit existující Google účet'), 'panels.js must offer existing-account sign-in label after credential-in-use');
assert.ok(/credentialInUse\s*=\s*true/.test(panelsSource), 'panels.js must track credential-in-use state');
assert.ok(panelsSource.includes('handlePostSignInMigration'), 'panels.js must run post-signIn migration flow');
assert.ok(panelsSource.includes('window.confirm('), 'panels.js must confirm before destructive sign-in');
assert.ok(/initCloudSave\(\s*{\s*uid:\s*newUid/.test(panelsSource), 'panels.js must re-init cloudSave with new uid after signIn');
assert.ok(googleAuthSource.includes('lastSnapshot'), 'googleAuth must cache last snapshot for subscribers');

console.log('google-auth.test.js: all checks passed');
