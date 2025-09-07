// --- Firebase Configuration -----------------------------------------------

// ▼▼▼ PASTE FIREBASE CONFIG HERE ▼▼▼
// WARNING: Do not commit this file with your actual API key to a public repository.
// Google may disable the key for security reasons. Consider using environment variables
// or a git-ignored configuration file for production applications.
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDU1_EpLI3SXLYIiDdC52OJf8f6EcaVDgs",
  authDomain: "splatoon3-weapon-roulette1.firebaseapp.com",
  databaseURL: "https://splatoon3-weapon-roulette1-default-rtdb.firebaseio.com",
  projectId: "splatoon3-weapon-roulette1",
  storageBucket: "splatoon3-weapon-roulette1.firebasestorage.app",
  messagingSenderId: "403751873324",
  appId: "1:403751873324:web:c1517d7238801b1c431a89",
  measurementId: "G-RSNY1FGMW8"
};
// ▲▲▲ PASTE FIREBASE CONFIG HERE ▲▲▲

// --- 管理者設定 ---------------------------------------------------------
// ここに管理者の永続IDを追加してください。IDは複数指定可能です。
// 自分のIDは開発者ツールで localStorage.getItem('persistentUserId') を実行して確認できます。
const ADMIN_USER_IDS = ["2F086383e5-8f3c-4bd1-acab-637338be5d44"];

// --- グローバル変数 ---------------------------------------------------------
const APP_VERSION = '1.2.5'; // アプリケーションのバージョン。更新時にこの数値を変更する。
const RESET_TIMEOUT_MS = 10000; // 10秒
const ROOM_EXPIRATION_MS = 10 * 60 * 1000; // 10分
const ROOM_LIFETIME_MS = 3 * 60 * 60 * 1000; // 3時間
const state = {
  running: false,
  resetTimer: null,
  pool: [],
  history: [],
  lastPick: null,
  interval: 50,
  // Firebase state
  db: null,
  roomRef: null,
  playerRef: null,
  roomId: null,
  isHost: false,
  playerName: '',
  activityTimer: null,
  lang: 'ja',
  theme: 'system',
  roomPassword: null,
  roomExpiryTimer: null,
  mutedUsers: {},
  // Friend system state
  friends: [],
  friendRequests: [],
  sentFriendRequests: [],
  friendStatusListeners: {},
};

const ICONS = {
  FULLSCREEN: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>`,
  EXIT_FULLSCREEN: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 0-2-2h-3M3 16h3a2 2 0 0 0 2-2v-3"/></svg>`
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const historyEl = $('#history');
const historyCount = $('#historyCount');
const noRepeat = $('#noRepeat');
const playerCountInput = $('#playerCount');
const resultContainer = $('#resultContainer');
const fullscreenBtn = $('#fullscreenBtn');
const settingsBtn = $('#settingsBtn');
const settingsModal = $('#settingsModal');
const closeSettingsBtn = $('#closeSettingsBtn');
const copyInviteLinkBtn = $('#copyInviteLinkBtn');
const roomTimerContainer = $('#room-timer-container');
const roomTimer = $('#room-timer');
const createRoomBtn = $('#createRoomBtn');
const joinRoomBtn = $('#joinRoomBtn');
const leaveRoomBtn = $('#leaveRoomBtn');
const roomIdInput = $('#roomIdInput');
const roomPasswordInput = $('#roomPasswordInput');
const roomPasswordDisplay = $('#roomPasswordDisplay');
const roomInfoUi = $('#room-info-ui');
const roomIdDisplay = $('#roomIdDisplay');
const hostBadge = $('#host-badge');
const playerSettingsBtn = $('#playerSettingsBtn');
const playerSettingsModal = $('#playerSettingsModal');
const closePlayerSettingsBtn = $('#closePlayerSettingsBtn');
const settingsPlayerNameInput = $('#settingsPlayerNameInput');
const confirmPlayerSettingsBtn = $('#confirmPlayerSettingsBtn');
const playerShortIdDisplay = $('#playerShortIdDisplay');
const loaderOverlay = $('#loader-overlay');
const loaderText = $('#loader-text');
const playerListContainer = $('#player-list-container');
const playerListEl = $('#player-list');
const playerCountDisplay = $('#playerCountDisplay');
const chatContainer = $('#chat-container');
const chatMessagesEl = $('#chat-messages');
const chatInput = $('#chatInput');
const chatSendBtn = $('#chatSendBtn');
const voiceInputBtn = $('#voiceInputBtn');
const preventSleepToggle = $('#preventSleep');
// Friend Modal
const friendsModal = $('#friendsModal');
const closeFriendsModalBtn = $('#closeFriendsModalBtn');
const friendsBtn = $('#friendsBtn');
const friendSearchInput = $('#friendSearchInput');
const friendSearchBtn = $('#friendSearchBtn');
const friendSearchResultEl = $('#friendSearchResult');
const friendRequestsListEl = $('#friendRequestsList');
const sentFriendRequestsListEl = $('#sentFriendRequestsList');
const friendsListEl = $('#friendsList');
const ghostJoinContainer = $('#ghost-join-container');
const ghostJoinCheckbox = $('#ghostJoinCheckbox');
const adminLink = $('#adminLink');

// --- アプリケーションロジック ----------------------------------------------

function getWeaponName(weapon) {
  return state.lang === 'en' && weapon.name_en ? weapon.name_en : weapon.name;
}

/**
 * 3rd-party API to get public IP address.
 * @returns {Promise<string|null>}
 */
async function getIPAddress() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    if (!response.ok) return null;
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error("Could not get IP address:", error);
    return null;
  }
}

/**
 * Escapes HTML to prevent XSS attacks.
 * @param {string} str The string to escape.
 * @returns {string} The escaped string.
 */
function escapeHTML(str) {
  if (typeof str !== 'string') return '';
  const p = document.createElement('p');
  p.textContent = str;
  return p.innerHTML;
}

/**
 * プレイヤー名を state, localStorage, UI間で同期する
 * @param {string} newName - 新しいプレイヤー名
 */
function syncAndSavePlayerName(newName) {
  const trimmedName = newName.trim();
  state.playerName = trimmedName;
  localStorage.setItem('splaRoulettePlayerName', trimmedName);
  if (settingsPlayerNameInput.value !== trimmedName) {
    settingsPlayerNameInput.value = trimmedName;
  }
}

/**
 * UUID v4を生成する
 * @returns {string}
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * localStorageから永続的なユーザーIDを取得または生成する
 * @returns {string}
 */
function getPersistentUserId() {
  let userId = localStorage.getItem('persistentUserId');
  if (!userId) {
    userId = generateUUID();
    localStorage.setItem('persistentUserId', userId);
  }
  return userId;
}

/**
 * ユーザーのshortIdを取得または新規生成する
 * @param {string} persistentUserId
 * @param {string} playerName
 * @returns {Promise<string>} ユーザーのshortId
 */
async function getOrCreateUserShortId(persistentUserId, playerName) {
  const userRef = firebase.database().ref(`users/${persistentUserId}`);
  const userSnapshot = await userRef.once('value');
  const userData = userSnapshot.val();

  // ユーザーデータがあり、名前も同じなら既存のIDを返す
  if (userData && userData.shortId && userData.name === playerName) {
    return userData.shortId;
  }

  // 名前が違う、または初めての場合、IDを再生成する
  // もし古いIDが存在すれば、まずそれを解放する
  if (userData && userData.shortId) {
    const oldShortId = userData.shortId;
    // shortIdMapから古いIDを削除。失敗しても処理は続行する。
    await firebase.database().ref(`shortIdMap/${oldShortId}`).remove().catch(e => console.warn("Could not remove old shortId from map:", e));
  }

  // 新しいIDを生成するロジック
  const shortIdMapRef = firebase.database().ref('shortIdMap');
  let newShortId;
  let attempts = 0;
  const MAX_ATTEMPTS = 100;

  while (attempts < MAX_ATTEMPTS) {
    newShortId = Math.floor(10000 + Math.random() * 90000).toString();
    const { committed } = await shortIdMapRef.child(newShortId).transaction(currentData => (currentData === null ? persistentUserId : undefined));
    if (committed) {
      // ユーザー情報を新しい名前とIDで上書き（または新規作成）
      await userRef.set({ name: playerName, shortId: newShortId, createdAt: firebase.database.ServerValue.TIMESTAMP });
      return newShortId;
    }
    attempts++;
  }
  throw new Error(`Failed to generate a unique shortId after ${MAX_ATTEMPTS} attempts.`);
}

/**
 * ローディングオーバーレイを表示する
 * @param {string} text 表示するテキスト
 */
function showLoader(text = '') {
  if (!loaderOverlay) return;
  if (loaderText) {
    loaderText.textContent = text;
  }
  loaderOverlay.classList.add('visible');
}

/**
 * ローディングオーバーレイを非表示にする
 */
function hideLoader() {
  if (!loaderOverlay) return;
  loaderOverlay.classList.remove('visible');
}

/**
 * サーバーエラーをコンソールに出力し、トーストでユーザーに通知する
 * @param {string} message ユーザーに表示するメッセージ
 * @param {Error} error キャッチしたエラーオブジェクト
 */
function showServerError(message, error) {
  console.error(message, error);
  const displayMessage = error && error.message ? `${message} (${error.message})` : message;
  if (typeof showToast === 'function') {
    showToast(displayMessage, 'error', 8000);
  }
}

/**
 * ユーザーのオンライン状態をFirebaseで管理する
 */
function manageUserPresence() {
  const myId = getPersistentUserId();
  if (!myId || !state.db) return;

  const userStatusRef = state.db.ref(`users/${myId}/status`);
  const connectedRef = state.db.ref('.info/connected');

  connectedRef.on('value', (snap) => {
    if (snap.val() !== true) {
      return;
    }
    // onDisconnectは接続が確立されるたびに再設定する必要がある
    userStatusRef.onDisconnect().set({
      isOnline: false,
      lastSeen: firebase.database.ServerValue.TIMESTAMP
    }).then(() => {
      // onDisconnect設定後にオンライン状態をセット
      userStatusRef.set({ isOnline: true, lastSeen: firebase.database.ServerValue.TIMESTAMP });
    });
  });
}

/**
 * プレイヤー名とIDを更新し、UIに反映する
 */
async function updatePlayerNameAndId() {
  const newName = settingsPlayerNameInput.value.trim();
  if (!newName) {
    showToast(t('player-name-required'), 'error');
    return;
  }

  showLoader(t('player-settings-updating'));
  try {
    syncAndSavePlayerName(newName);
    const persistentUserId = getPersistentUserId();
    const shortId = await getOrCreateUserShortId(persistentUserId, newName);
    playerShortIdDisplay.textContent = `#${shortId}`;
    showToast(t('player-settings-updated'), 'success');
    playerSettingsModal.style.display = 'none';
    manageUserPresence();
    // プレイヤー情報が確定したので、フレンド関連のリスナーを開始
    listenToFriends();
    listenToFriendRequests();
    listenToSentFriendRequests();
    updateAdminUI();
  } catch (error) {
    showServerError(t('player-settings-update-failed'), error);
  } finally {
    hideLoader();
  }
}

/**
 * トースト通知を表示する。
 * @param {string} message - 表示するメッセージ
 * @param {string} [type='info'] - トーストの種類 ('success', 'error', 'info')
 * @param {number} [duration=3000] - 表示時間 (ミリ秒)
 */
function showToast(message, type = 'info', duration = 3000) {
  const toastContainer = document.getElementById('toast-container');
  if (!toastContainer) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;

  // プログレスバーを追加
  const progressBar = document.createElement('div');
  progressBar.className = 'toast-progress-bar';
  progressBar.style.animationDuration = `${duration}ms`; // トーストの表示時間と同期
  toast.appendChild(progressBar);

  toastContainer.appendChild(toast);

  // 少し遅らせて 'show' クラスを追加し、CSSトランジションを発火させる
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  // 指定時間後に 'show' クラスを削除し、フェードアウトさせる
  setTimeout(() => {
    toast.classList.remove('show');
    // トランジション完了後に要素をDOMから削除
    toast.addEventListener('transitionend', () => toast.remove());
  }, duration);
}

/**
 * サーバー関連のエラーを整形してユーザーに表示する
 * @param {string} userMessage - ユーザーに表示するメッセージ (翻訳済み)
 * @param {Error} error - 発生したエラーオブジェクト
 */
function showServerError(userMessage, error) {
  console.error(`${userMessage}:`, error); // 開発者向けにコンソールに詳細なエラーを出力
  const errorCode = error.code ? ` (Code: ${error.code})` : '';
  showToast(`${userMessage}${errorCode}`, 'error', 6000); // エラーは少し長めに表示
}

function getActivePool() {
  const enabledClass = $$('input[data-class]:checked').map(i => i.getAttribute('data-class'));
  const enabledSub = $$('input[data-sub]:checked').map(i => i.getAttribute('data-sub'));
  const enabledSp = $$('input[data-sp]:checked').map(i => i.getAttribute('data-sp'));
  return weapons.filter(w =>
    enabledClass.includes(w.class) &&
    enabledSub.includes(w.sub) &&
    enabledSp.includes(w.sp)
  );
}

function updatePool() {
  const base = getActivePool();
  const pool = noRepeat.checked ? base.filter(w => !state.history.some(h => h.name === w.name)) : base;
  state.pool = pool.length ? pool : base;
  updateProbText();
  renderProbTable();
}

function updateProbText() {
  const n = state.pool.length;
  const prob = n ? (100 / n) : 0;
  const resultDetailsEl = $('#resultDetails');

  // 結果表示中はクラス表示を上書きしないように、i18nキーの有無で判定
  if (resultDetailsEl && resultDetailsEl.hasAttribute('data-i18n-key')) {
    if (n) {
      resultDetailsEl.textContent = t('current-candidates', { n: n, prob: prob.toFixed(1) });
    } else {
      resultDetailsEl.textContent = t('no-candidates-filter');
    }
  }
}

/**
 * 履歴に1件の抽選結果を追加し、UIを更新する
 * @param {Object} weapon - 抽選されたブキオブジェクト
 * @param {string} batchTime - 抽選グループのタイムスタンプ
 * @param {number} playerNum - プレイヤー番号
 * @param {number} totalPlayers - 合計プレイヤー数
 */
function pushHistoryItem(weapon, batchTime, playerNum, totalPlayers) {
  const historyItem = {
    ...weapon,
    time: batchTime,
    playerNum,
    totalPlayers,
  };
  state.history.push(historyItem);
  renderHistory(); // 履歴の表示を更新
}

function renderHistory() {
  const isOnline = !!state.roomRef;
  const historyArray = [...state.history].sort((a, b) => a.time.localeCompare(b.time));
  const totalItems = historyArray.length;
  const batchIds = new Set(historyArray.map(h => h.time));
  historyCount.textContent = t('history-count-value', { batches: batchIds.size, total: totalItems });

  if (!totalItems) {
    historyEl.innerHTML = `<div class="empty" data-i18n-key="history-empty">${t('history-empty')}</div>`;
    return;
  }
  historyEl.innerHTML = historyArray.map((h, index) => {
    const time = new Date(h.time);
    
    // 同じ回の抽選は線で区切る
    const isNewBatch = (index === 0) || (h.time !== historyArray[index - 1].time);
    const batchClass = isNewBatch && index > 0 ? 'new-batch-separator' : '';

    // 複数人プレイの場合のみプレイヤー番号を表示
    const playerLabel = h.totalPlayers > 1 ? `P${h.playerNum}: ` : '';

    let deleteButton = '';
    if (isOnline && state.isHost) {
        deleteButton = `<button class="btn secondary icon" data-delete-key="${h.key}" data-i18n-title="history-delete-item" title="${t('history-delete-item')}">×</button>`;
    } else if (!isOnline) {
        // ローカルモードではインデックスで削除
        const localIndex = state.history.findIndex(localItem => localItem.time === h.time && localItem.name === h.name);
        deleteButton = `<button class="btn secondary icon" data-delete-index="${localIndex}" data-i18n-title="history-delete-item" title="${t('history-delete-item')}">×</button>`;
    }

    return `
      <div class="history-item ${batchClass}">
        <div class="history-item__main">
          <div class="history-weapon-name">${playerLabel}${getWeaponName(h)}</div>
          <div class="history-weapon-details muted">${t(h.class)} / ${t(h.sub)} / ${t(h.sp)}</div>
        </div>
        <div class="history-item__aside">
          <div class="history-item__meta muted">
            <div>${time.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
          </div>
          ${deleteButton}
        </div>
      </div>
    `;
  }).join('');
  // 履歴が追加されたら一番下までスクロールする
  historyEl.scrollTop = historyEl.scrollHeight;
}

function handleDeleteHistoryItem(e) {
  const target = e.target.closest('[data-delete-key], [data-delete-index]');
  if (!target) return;

  // Online mode: host can delete by key
  if (state.roomRef && state.isHost) {
    const key = target.dataset.deleteKey;
    if (key) {
      state.roomRef.child('history').child(key).remove();
      // The 'value' listener on history will re-render.
      return;
    }
  }

  // Local mode: delete by index
  if (!state.roomRef) {
    const index = parseInt(target.dataset.deleteIndex, 10);
    if (!isNaN(index)) {
      state.history.splice(index, 1);
      renderHistory();
      saveHistory();
      updatePool();
    }
  }
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const getInteractiveControls = () => [
  ...$$('.main-controls button:not(#fullscreenBtn), .main-controls input, #history button'),
  ...$$('#classFilters input, #classFilters button')
];

function setControlsDisabled(disabled) {
  if (disabled) {
    getInteractiveControls().forEach(c => c.disabled = true);
    return;
  }

  // 有効化する際は、まず全てのコントロールを有効に戻す
  getInteractiveControls().forEach(c => c.disabled = false);
  // その後、ルーム内にいる場合は、役割に応じて再度制限をかける
  if (state.roomRef) {
    setRealtimeUiState(state.isHost ? 'in_room_host' : 'in_room_viewer');
  }
}

/**
 * 1人分の抽選アニメーションを実行し、結果のブキオブジェクトを返す
 * @param {Array} pool - 抽選対象のブキ配列
 * @param {Object|null} finalPickOverride - 最終的に選択されるべきブキ（サーバーから指定）
 * @returns {Promise<Object|null>} - 抽選されたブキオブジェクト
 */
function runSingleAnimation(pool, finalPickOverride = null) {
    return new Promise((resolve) => {
        if (!pool || pool.length === 0) {
            resolve(null);
            return;
        }

        let t = 0;
        let interval = 40;
        // 5秒から7.5秒の間でランダムな時間を設定
        const duration = Math.random() * 2500 + 5000;
        const start = performance.now();
        let lastPickForAnim;

        const tick = (now) => {
            if (!state.running) {
                resolve(null);
                return;
            }

            if (now - t >= interval) {
                t = now;
                const w = pickRandom(pool);
                lastPickForAnim = w;
                showSpinningText(w);

                const progress = Math.min(1, (now - start) / duration);
                interval = 40 + progress * 180;

                if (progress >= 1) {
                    // サーバーから指定されたブキがあればそれを、なければ最後のアニメーションのブキを最終結果とする
                    const finalPick = finalPickOverride ?? lastPickForAnim ?? pickRandom(pool);
                    resolve(finalPick);
                } else {
                    requestAnimationFrame(tick);
                }
            } else {
                requestAnimationFrame(tick);
            }
        };
        requestAnimationFrame(tick);
    });
}

/**
 * 抽選結果を生成する（オンライン・ローカル共通ロジック）
 * @returns {Array<Object>|null} 抽選結果のブキ配列、または条件を満たさない場合はnull
 */
function getDrawResults() {
  const playerCount = parseInt(playerCountInput.value, 10);
  if (noRepeat.checked && state.pool.length < playerCount) {
    showToast(t('no-candidates-alert', { poolCount: state.pool.length, playerCount: playerCount }), 'error');
    return null;
  }
  if (state.pool.length === 0) {
    showToast(t('no-candidates-alert-title'), 'error');
    return null;
  }

const finalResults = [];
const tempPool = [...state.pool];
for (let i = 0; i < playerCount; i++) {
  if (tempPool.length === 0) break;
  const result = pickRandom(tempPool);
  if (result) {
    finalResults.push(result);
    if (noRepeat.checked) {
      const index = tempPool.findIndex(item => item.name === result.name);
      if (index > -1) tempPool.splice(index, 1);
    }
  }
}
return finalResults;
}

/**
 * 抽選結果を永続化する（履歴への保存とDiscord通知）
 * @param {Array<Object>} finalResults - 抽選結果の配列
 * @param {string} drawTime - 抽選時刻のISO文字列
 */
async function persistResults(finalResults, drawTime) {
    const isOnline = !!state.roomRef;
    if (isOnline) {
        if (state.isHost) {
            const historyRef = state.roomRef.child('history');
            const updates = {};
            finalResults.forEach((result, i) => {
                const newKey = historyRef.push().key;
                updates[newKey] = { ...result, time: drawTime, playerNum: i + 1, totalPlayers: finalResults.length };
            });
            await historyRef.update(updates);
            await sendToDiscord(finalResults);
        }
    } else {
        finalResults.forEach((result, i) => {
            pushHistoryItem(result, drawTime, i + 1, finalResults.length);
        });
        saveHistory();
        await sendToDiscord(finalResults);
    }
}

/**
 * 抽選結果を画面に表示する
 * @param {Array<Object>} finalResults - 抽選結果のブキ配列
 * @param {Array<Object>} pool - 抽選に使われたプール
 */
async function displaySpinResult(finalResults, pool) {
  if (state.running) return;
  clearTimeout(state.resetTimer);

  state.running = true;
  setControlsDisabled(true);

  const playerCount = finalResults.length;
  const isOnline = !!state.roomRef;

  if (playerCount === 1) {
      const result = finalResults[0];
      await runSingleAnimation(pool, result);
      await showFinalResult([result]);
  } else {
      for (let i = 0; i < playerCount; i++) {
          resultContainer.innerHTML = `
              <div id="resultName" class="name">${t('player-draw', { playerNum: i + 1 })}</div>
              <div id="resultDetails" class="details">${t('player-draw-wait')}</div>
          `;
          await new Promise(resolve => setTimeout(resolve, 1200));

          const result = finalResults[i];
          if (!result) break;

          await runSingleAnimation(pool, result);
          await showFinalResult([result]);
          await new Promise(resolve => setTimeout(resolve, 1500));
      }
      if (finalResults.length > 0) {
          await showFinalResult(finalResults);
      }
  }

  if (finalResults.length > 0) {
      const drawTime = new Date().toISOString();
      await persistResults(finalResults, drawTime);

      if ($('#autoCopy')?.checked) {
          await copyResultToClipboard(finalResults);
      }

      state.resetTimer = setTimeout(() => {
          resultContainer.innerHTML = `
        <div id="resultName" class="name" data-i18n-key="reset-display-name">${t('reset-display-name')}</div>
        <div id="resultDetails" class="details" data-i18n-key="reset-display-class">${t('reset-display-class')}</div>
      `;
      }, RESET_TIMEOUT_MS);
  }

  state.running = false;
  setControlsDisabled(false);
  updatePool();
}

async function performDraw() {
  if (state.running || !state.isHost || !state.roomRef) return;

  updatePool();
  const finalResults = getDrawResults();
  if (!finalResults) return;

  // 結果をFirebaseに書き込む
  state.roomRef.child('spinResult').set({
    finalResults: finalResults,
    pool: state.pool, // アニメーション用に元のプールも渡す
    timestamp: firebase.database.ServerValue.TIMESTAMP
  });
}

async function startSpin() {
  if (state.running) return;

  if (state.roomRef) {
    // オンラインモード: ホストのみが抽選を実行
    if (state.isHost) {
      await performDraw();
    }
  } else {
    // ローカルモード
    updatePool();
    const finalResults = getDrawResults();
    if (finalResults) {
      await displaySpinResult(finalResults, state.pool);
    }
  }
}

function showSpinningText(weapon) {
  if (!weapon) return;
  resultContainer.innerHTML = `
    <div id="resultName" class="name">${getWeaponName(weapon)}</div>
    <div id="resultDetails" class="details">
      <span>${t(weapon.class)}</span>
      <span class="separator">/</span>
      <span>${t(weapon.sub)}</span>
      <span class="separator">/</span>
      <span>${t(weapon.sp)}</span>
    </div>
  `;
}

/**
 * 最終的な抽選結果を画面に表示する
 * @param {Array<Object>} results - 表示するブキオブジェクトの配列
 */
async function showFinalResult(results) {
  if (!results || results.length === 0) {
    resultContainer.innerHTML = `
      <div id="resultName" class="name">${t('error')}</div>
      <div id="resultDetails" class="details">${t('error-failed-draw')}</div>
    `;
    return;
  }

  if (results.length === 1) {
    const w = results[0];
    resultContainer.innerHTML = `
      <div id="resultName" class="name">${getWeaponName(w)}</div>
      <div id="resultDetails" class="details">
        <span>${t(w.class)}</span>
        <span class="separator">/</span>
        <span>${t(w.sub)}</span>
        <span class="separator">/</span>
        <span>${t(w.sp)}</span>
      </div>
    `;
  } else {
    resultContainer.innerHTML = `<ul class="result-list"></ul>`;
    const listEl = resultContainer.querySelector('.result-list');

    // まずはプレースホルダーを表示
    results.forEach((w, i) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span class="player-label">${t('player-result-list', { i: i + 1 })}</span>
        <div class="weapon-details">
          <div class="weapon-name">...</div>
          <div class="weapon-sub-sp muted">...</div>
        </div>
      `;
      listEl.appendChild(li);
    });

    // 1つずつ結果を更新
    for (let i = 0; i < results.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 300)); // 0.3秒待つ
      const resultItem = listEl.children[i];
      const nameEl = resultItem.querySelector('.weapon-name');
      const subSpEl = resultItem.querySelector('.weapon-sub-sp');
      const w = results[i];
      nameEl.textContent = getWeaponName(w);
      subSpEl.textContent = `${t(w.class)} / ${t(w.sub)} / ${t(w.sp)}`;
    }
  }
}

/**
 * 抽選結果をクリップボードにコピーする
 * @param {Array<Object>} results - 抽選結果のブキオブジェクトの配列
 */
async function copyResultToClipboard(results) {
  if (!results || results.length === 0) return;

  const textToCopy = results.map((w, i) => {
    const playerLabel = results.length > 1 ? `${t('player-result-list', { i: i + 1 })}: ` : '';
    const weaponName = getWeaponName(w);
    const details = `${t(w.class)} / ${t(w.sub)} / ${t(w.sp)}`;
    return `${playerLabel}${weaponName}\n${details}`;
  }).join('\n\n');

  try {
    await navigator.clipboard.writeText(textToCopy);
    showToast(t('results-copied-to-clipboard'), 'success');
  } catch (err) {
    console.error('Failed to copy result to clipboard:', err);
    showToast(t('copy-failed'), 'error');
  }
}


/**
 * 抽選結果をDiscord Webhookに送信する
 * @param {Array<Object>} results - 抽選結果のブキオブジェクトの配列
 */
async function sendToDiscord(results) {
  const webhookEnable = $('#webhookEnable');
  const webhookUrl = $('#webhookUrl');
  if (!webhookEnable?.checked || !webhookUrl?.value) {
    return;
  }

  const url = webhookUrl.value;
  const template = $('#webhookTemplate')?.value;
  const playerCount = results.length;
  const mentionIds = ($('#webhookMentions')?.value ?? '').split(',').map(id => id.trim()).filter(id => id);
  const mentionContent = mentionIds.map(id => `<@${id}>`).join(' ');

  let payload;

  if (playerCount > 1) {
    // 複数人の場合：1人1つのEmbedを作成
    const embeds = results.map((w, i) => {
      const playerIdentifier = t('player-result-list', { i: i + 1 });
      const embed = {
        author: {
          name: `${playerIdentifier}: ${getWeaponName(w)}`,
        },
        description: `${t(w.class)} / ${t(w.sub)} / ${t(w.sp)}`,
        color: 0xef5350,
      };

      // 最後のEmbedにだけタイムスタンプとフッターを追加
      if (i === results.length - 1) {
        embed.timestamp = new Date().toISOString();
        embed.footer = { text: 'Splatoon 3 Weapon Roulette' };
      }
      return embed;
    });

    payload = {
      content: mentionContent,
      embeds: embeds,
    };
  } else {
    // 1人の場合：これまで通りの単一Embed
    let description = '';
    const w = results[0];
    if (template) {
      const weaponList = `${getWeaponName(w)} (${t(w.class)} / ${t(w.sub)} / ${t(w.sp)})`;
      description = template
        .replace('{playerCount}', 1)
        .replace('{weaponList}', weaponList);
    }

    const embed = {
      title: t('webhook-result-title', { playerCount }),
      description: description,
      color: 0xef5350,
      fields: results.map(w => ({
        name: getWeaponName(w),
        value: `${t(w.class)} / ${t(w.sub)} / ${t(w.sp)}`,
      })),
      timestamp: new Date().toISOString(),
      footer: {
        text: 'Splatoon 3 Weapon Roulette',
      },
    };
    payload = {
      content: mentionContent,
      embeds: [embed],
    };
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Discord Webhookへの送信に失敗しました:', response.status, errorText);
      showToast(`${t('webhook-send-error')} (Status: ${response.status})`, 'error', 5000);
    }
  } catch (error) {
    console.error('Discord Webhookへの送信中にエラーが発生しました:', error);
    showToast(t('webhook-send-error'), 'error', 5000);
  }
}

function resetAll() {
  state.running = false;
  clearTimeout(state.resetTimer);

  noRepeat.checked = false;
  
  $$('#classFilters input[type="checkbox"]').forEach(i => i.checked = true);

  if (state.isHost && state.roomRef) {
    state.roomRef.child('history').remove();
  } else if (!state.roomRef) { // ローカルモードの場合のみ
    state.history = [];
    renderHistory();
    saveHistory();
  }

  resultContainer.innerHTML = `
    <div id="resultName" class="name" data-i18n-key="reset-display-name">${t('reset-display-name')}</div>
    <div id="resultDetails" class="details" data-i18n-key="reset-display-class">${t('reset-display-class')}</div>
  `;
  
  updatePool();
  saveSettings();
}

function renderProbTable() {
  const probTable = document.getElementById('probTable');
  const pool = state.pool;
  if (!probTable) return;
  if (!pool.length) {
    probTable.innerHTML = `<tr><td class="muted prob-table-empty" data-i18n-key="prob-no-candidates">${t('prob-no-candidates')}</td></tr>`;
    return;
  }
  const prob = 100 / pool.length;
  probTable.innerHTML =
    `<tr class="prob-table-header">
      <th data-i18n-key="prob-weapon-name">${t('prob-weapon-name')}</th>
      <th data-i18n-key="prob-class">${t('prob-class')}</th>
      <th data-i18n-key="prob-sub">${t('prob-sub')}</th>
      <th data-i18n-key="prob-special">${t('prob-special')}</th>
      <th class="prob-value" data-i18n-key="prob-value">${t('prob-value')}</th>
    </tr>` +
    pool.map(w =>
      `<tr>
        <td>${getWeaponName(w)}</td>
        <td>${t(w.class)}</td>
        <td>${t(w.sub)}</td>
        <td>${t(w.sp)}</td>
        <td class="prob-value">${prob.toFixed(2)}%</td>
      </tr>`
    ).join('');
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => {
      showToast(`${t('fullscreen-error')}: ${err.message}`, 'error');
    });
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
}

function updateFullscreenButton() {
  if (!fullscreenBtn) return;
  if (document.fullscreenElement) {
    fullscreenBtn.innerHTML = ICONS.EXIT_FULLSCREEN;
    fullscreenBtn.title = t('exit-fullscreen');
    fullscreenBtn.setAttribute('aria-label', t('exit-fullscreen'));
  } else {
    fullscreenBtn.innerHTML = ICONS.FULLSCREEN;
    fullscreenBtn.title = t('fullscreen');
    fullscreenBtn.setAttribute('aria-label', t('fullscreen-toggle'));
  }
}

// --- Wake Lock 機能 ----------------------------------------------------
let wakeLockSentinel = null;

const requestWakeLock = async () => {
  if ('wakeLock' in navigator) {
    try {
      wakeLockSentinel = await navigator.wakeLock.request('screen');
      wakeLockSentinel.addEventListener('release', () => {
        // センチネルがシステムによって解放された場合
        console.log('Screen Wake Lock was released');
        wakeLockSentinel = null;
      });
      console.log('Screen Wake Lock is active');
      showToast(t('wake-lock-acquired'), 'success');
    } catch (err) {
      console.error(`${err.name}, ${err.message}`);
      showToast(t('wake-lock-failed'), 'error');
    }
  }
};

const releaseWakeLock = async () => {
  if (wakeLockSentinel !== null) {
    await wakeLockSentinel.release();
    wakeLockSentinel = null;
  }
};

const handleVisibilityChange = async () => {
  if (preventSleepToggle.checked && wakeLockSentinel === null && document.visibilityState === 'visible') {
    await requestWakeLock();
  }
};

// --- 設定と履歴の保存・復元 ----------------------------------------------

function saveSettings() {
  try {
    const settings = {
      class: $$('input[data-class]').reduce((acc, cb) => ({ ...acc, [cb.dataset.class]: cb.checked }), {}),
      sub: $$('input[data-sub]').reduce((acc, cb) => ({ ...acc, [cb.dataset.sub]: cb.checked }), {}),
      sp: $$('input[data-sp]').reduce((acc, cb) => ({ ...acc, [cb.dataset.sp]: cb.checked }), {}),
      noRepeat: noRepeat.checked,
      playerCount: playerCountInput.value,
      lang: state.lang,
      theme: state.theme,
      webhookEnabled: $('#webhookEnable')?.checked ?? false,
      webhookUrl: $('#webhookUrl')?.value ?? '',
      webhookTemplate: $('#webhookTemplate')?.value ?? '',
      webhookMentions: $('#webhookMentions')?.value ?? '',
      autoCopy: $('#autoCopy')?.checked ?? false,
      preventSleep: preventSleepToggle.checked,
    };
    localStorage.setItem('splaRouletteSettings', JSON.stringify(settings));
  } catch (e) {
    console.error("Failed to save settings:", e);
  }
}

function loadAndApplySettings() {
  const saved = localStorage.getItem('splaRouletteSettings');
  if (!saved) return;
  try {
    const settings = JSON.parse(saved);
    $$('input[data-class]').forEach(cb => { if (settings.class?.[cb.dataset.class] !== undefined) cb.checked = settings.class[cb.dataset.class]; });
    $$('input[data-sub]').forEach(cb => { if (settings.sub?.[cb.dataset.sub] !== undefined) cb.checked = settings.sub[cb.dataset.sub]; });
    $$('input[data-sp]').forEach(cb => { if (settings.sp?.[cb.dataset.sp] !== undefined) cb.checked = settings.sp[cb.dataset.sp]; });
    noRepeat.checked = settings.noRepeat ?? false;
    playerCountInput.value = settings.playerCount ?? 1;
    setLanguage(settings.lang || navigator.language.startsWith('ja') ? 'ja' : 'en');
    applyTheme(settings.theme || 'system');
    const webhookEnable = $('#webhookEnable');
    const webhookUrl = $('#webhookUrl');
    if (webhookEnable) {
      webhookEnable.checked = settings.webhookEnabled ?? false;
    }
    if (webhookUrl) {
      webhookUrl.value = settings.webhookUrl ?? '';
    }
    const webhookTemplate = $('#webhookTemplate');
    if (webhookTemplate) {
      webhookTemplate.value = settings.webhookTemplate ?? '';
    }
    const webhookMentions = $('#webhookMentions');
    if (webhookMentions) {
      webhookMentions.value = settings.webhookMentions ?? '';
    }
    const autoCopy = $('#autoCopy');
    if (autoCopy) {
      autoCopy.checked = settings.autoCopy ?? false;
    }
    if ('preventSleep' in settings && 'wakeLock' in navigator) {
      preventSleepToggle.checked = settings.preventSleep;
      if (preventSleepToggle.checked) {
        requestWakeLock();
      }
    }
    toggleWebhookUrlState(); // Webhook設定のUI状態を更新
  } catch (e) {
    console.error("Failed to load settings:", e);
    localStorage.removeItem('splaRouletteSettings');
  }
}

function saveHistory() {
  try {
    localStorage.setItem('splaRouletteHistory', JSON.stringify(state.history));
  } catch (e) {
    console.error("Failed to save history:", e);
  }
}

function loadHistory() {
  const saved = localStorage.getItem('splaRouletteHistory');
  if (!saved) return;
  try {
    state.history = JSON.parse(saved);
  } catch (e) {
    console.error("Failed to load history:", e);
    localStorage.removeItem('splaRouletteHistory');
  }
}

// --- 国際化 (i18n) ----------------------------------------------------

function t(key, replacements = {}) {
  let text = translations[state.lang]?.[key] || translations['en']?.[key] || key;
  for (const [k, v] of Object.entries(replacements)) {
    text = text.replace(`{${k}}`, v);
  }
  return text;
}

function updateUIText() {
  document.querySelectorAll('[data-i18n-key]').forEach(el => {
    const key = el.dataset.i18nKey;
    const target = el.dataset.i18nTarget || 'textContent';
    if (target === 'innerHTML') {
      el.innerHTML = t(key);
    } else {
      el.textContent = t(key);
    }
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = t(el.dataset.i18nTitle);
  });
  document.querySelectorAll('[data-i18n-aria-label]').forEach(el => {
    el.setAttribute('aria-label', t(el.dataset.i18nArialabel));
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });

  // 動的に生成されるUIのテキストも更新
  updateProbText();
  renderHistory();
  renderProbTable();
  updateFullscreenButton();
}

function setLanguage(lang) {
  state.lang = lang;
  document.documentElement.lang = lang;
  const radio = $(`input[name="language"][value="${lang}"]`);
  // 音声認識の言語設定も更新
  if (state.recognition) {
    state.recognition.lang = lang;
  }
  if (radio) radio.checked = true;
  updateUIText();
  saveSettings();
}

// --- テーマ管理 ---------------------------------------------------------

const systemThemeListener = window.matchMedia('(prefers-color-scheme: dark)');

function applyTheme(theme) {
  state.theme = theme;
  const radio = $(`input[name="theme"][value="${theme}"]`);
  if (radio) radio.checked = true;

  if (theme === 'system') {
    document.documentElement.dataset.theme = systemThemeListener.matches ? 'dark' : 'light';
  } else {
    document.documentElement.dataset.theme = theme;
  }
  saveSettings();
}

function handleSystemThemeChange(e) {
  if (state.theme === 'system') {
    document.documentElement.dataset.theme = e.matches ? 'dark' : 'light';
  }
}

/**
 * Webhook設定の有効/無効に応じて、URL入力欄とテストボタンの状態を切り替える
 */
function toggleWebhookUrlState() {
  const enabled = $('#webhookEnable')?.checked ?? false;
  const container = $('#webhookUrlContainer');
  if (!container) return;

  // 有効/無効に応じて見た目と操作可否を変更
  container.style.opacity = enabled ? '1' : '0.5';
  container.style.pointerEvents = enabled ? 'auto' : 'none';

  const urlInput = $('#webhookUrl');
  const testBtn = $('#testWebhookBtn');
  if (urlInput) urlInput.disabled = !enabled;
  if (testBtn) testBtn.disabled = !enabled;
}

/**
 * Discord Webhookの送信テストを行う
 */
async function testDiscordWebhook() {
  const webhookUrlInput = $('#webhookUrl');
  const testBtn = $('#testWebhookBtn');
  const url = webhookUrlInput.value;
  const mentionIds = ($('#webhookMentions')?.value ?? '').split(',').map(id => id.trim()).filter(id => id);
  const mentionContent = mentionIds.length > 0 ? mentionIds.map(id => `<@${id}>`).join(' ') : '';

  if (!url) {
    showToast(t('settings-webhook-test-no-url'), 'error');
    return;
  }

  testBtn.disabled = true;
  const originalText = testBtn.textContent;
  testBtn.textContent = t('settings-webhook-test-sending');

  const embed = {
    title: `✅ ${t('webhook-test-title')}`,
    description: t('webhook-test-description'),
    color: 0x4caf50, // Green
    footer: { text: 'Splatoon 3 Weapon Roulette' },
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: `${t('webhook-test-content')} ${mentionContent}`, embeds: [embed] }),
    });
    if (response.ok) {
      showToast(t('settings-webhook-test-success'), 'success');
    } else {
      showToast(`${t('settings-webhook-test-fail')} (Status: ${response.status})`, 'error', 5000);
    }
  } catch (error) {
    showToast(t('settings-webhook-test-fail'), 'error', 5000);
  } finally {
    testBtn.disabled = false;
    testBtn.textContent = originalText;
  }
}

/**
 * チャットメッセージをUIに追加する
 * @param {object} data - メッセージデータ
 * @param {string} [data.name] - 送信者名
 * @param {string} data.message - メッセージ本文
 * @param {boolean} [data.isSystem=false] - システムメッセージか否か
 * @param {number} data.timestamp - タイムスタンプ
 */
function addChatMessage({ name, message, isSystem = false, timestamp }) {
  // ユーザーがチャット履歴を遡っている最中に、新しいメッセージが来ても強制スクロールしないようにする
  const shouldScroll = chatMessagesEl.scrollTop + chatMessagesEl.clientHeight >= chatMessagesEl.scrollHeight - 20;

  const messageEl = document.createElement('div');
  messageEl.className = 'chat-message';

  // 直前のメッセージと比較して、連続投稿かどうかを判定
  const lastMessageEl = chatMessagesEl.lastElementChild;
  if (lastMessageEl && !isSystem && lastMessageEl.dataset.authorName === name) {
    messageEl.classList.add('consecutive');
  }

  // 次の比較のために、送信者名をdata属性に保存
  messageEl.dataset.authorName = name;

  if (isSystem) {
    messageEl.classList.add('system');
    messageEl.textContent = message; // System messages are simple text
  } else {
    // Regular messages (own or others)
    if (name === state.playerName) {
      messageEl.classList.add('own');
    }

    // メンションをチェックしてハイライトクラスを追加
    const me = state.players?.find(p => p.id === state.playerRef?.key);
    if (me) {
      const myName = me.name;
      const myShortId = me.shortId;
      const mentionByName = myName && message.includes(`@${myName}`);
      const mentionById = myShortId && message.includes(`@#${myShortId}`);
      if (mentionByName || mentionById) {
        messageEl.classList.add('mention');
      }
    }

    const contentEl = document.createElement('div');
    contentEl.className = 'chat-content';

    if (!isSystem) {
      const nameEl = document.createElement('strong');
      nameEl.className = 'chat-author';
      nameEl.textContent = name;
      contentEl.appendChild(nameEl);
    }

    const bubbleEl = document.createElement('div');
    bubbleEl.className = 'chat-bubble';
    bubbleEl.textContent = message;
    contentEl.appendChild(bubbleEl);

    const metaEl = document.createElement('div');
    metaEl.className = 'chat-meta';
    if (timestamp) {
      const timeEl = document.createElement('span');
      timeEl.className = 'chat-timestamp';
      timeEl.textContent = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      metaEl.appendChild(timeEl);
    }

    messageEl.appendChild(contentEl);
    messageEl.appendChild(metaEl);
  }

  chatMessagesEl.appendChild(messageEl);

  if (shouldScroll) {
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
  }
}

function updatePlayerList(players) {
  playerCountDisplay.textContent = t('player-list-count', { count: players.length });
  if (!players || players.length === 0) {
    playerListEl.innerHTML = `<div class="empty" data-i18n-key="player-list-empty">${t('player-list-empty')}</div>`;
    return;
  }
  const myId = getPersistentUserId();
  const isAdmin = myId && ADMIN_USER_IDS.map(id => id.toLowerCase()).includes(myId.toLowerCase());

  playerListEl.innerHTML = players.map(player => {
    const isMe = state.playerRef && player.id === state.playerRef.key;
    const hostIndicator = player.isHost ? ` <span class="host-icon" title="${t('realtime-host')}">👑</span>` : '';
    const meIndicator = isMe ? ` <span class="muted">(${t('you')})</span>` : '';
    const displayId = player.shortId ? `#${player.shortId}` : '#----';

    const isMuted = state.mutedUsers && state.mutedUsers[player.id];
    const mutedIndicator = isMuted ? ` <span class="muted-icon" title="${t('player-muted-indicator')}">🔇</span>` : '';

    let adminControls = '';
    if (isAdmin && !isMe) {
        adminControls = `
          <div class="player-actions">
              <button class="btn-kick menu" data-action="admin-menu" data-player-id="${player.id}" data-player-name="${player.name}" title="${t('realtime-admin-menu')}">︙</button>
          </div>
        `;
    }

    return `
    <div class="player-item">
        <div class="player-name" data-player-name="${player.name}" title="${t('chat-mention-tooltip', { name: player.name })}">
          <span class="player-id-display">${displayId}</span>
          <span>${escapeHTML(player.name)}${hostIndicator}${mutedIndicator}</span>
          ${meIndicator}
        </div>
        ${adminControls}
    </div>
    `;
  }).join('');
}

/**
 * プレイヤーID(#なし)でユーザーを検索する
 * @param {string} shortId
 * @returns {Promise<object|null>}
 */
async function findUserByShortId(shortId) {
  if (!shortId || !/^\d{5}$/.test(shortId)) return null;

  const shortIdMapRef = firebase.database().ref(`shortIdMap/${shortId}`);
  const mapSnapshot = await shortIdMapRef.once('value');
  if (!mapSnapshot.exists()) return null;

  const persistentUserId = mapSnapshot.val();
  const userRef = firebase.database().ref(`users/${persistentUserId}`);
  const userSnapshot = await userRef.once('value');
  if (!userSnapshot.exists()) return null;

  return { id: persistentUserId, ...userSnapshot.val() };
}

/**
 * 検索結果を表示する
 * @param {object|null} user
 */
function renderFriendSearchResult(user) {
  if (!user) {
    friendSearchResultEl.innerHTML = `<div class="empty">${t('friends-user-not-found')}</div>`;
    return;
  }

  const myId = getPersistentUserId();
  const isMe = user.id === myId;
  const isAlreadyFriend = state.friends.some(f => f.id === user.id);
  const isRequestSent = state.sentFriendRequests.some(req => req.recipientId === user.id);

  let actionButton = '';
  if (isMe) {
    // No button for self
  } else if (isAlreadyFriend) {
    // No button if already friends
  } else if (isRequestSent) {
    actionButton = `<button class="btn" disabled style="padding: 4px 10px;">${t('friends-request-sent-label')}</button>`;
  } else {
    actionButton = `<button class="btn secondary" data-action="send-friend-request" data-id="${user.id}" data-name="${escapeHTML(user.name)}" data-short-id="${user.shortId}" style="padding: 4px 10px;">${t('friends-send-request')}</button>`;
  }

  friendSearchResultEl.innerHTML = `
    <div class="player-item">
      <div class="player-name">
        <span class="player-id-display">#${user.shortId}</span>
        <span>${escapeHTML(user.name)}</span>
      </div>
      <div class="player-actions">
        ${actionButton}
      </div>
    </div>
  `;
}

/**
 * フレンド申請を送信する
 * @param {string} targetUserId ターゲットの永続ID
 * @param {string} targetUserName ターゲットのプレイヤー名
 * @param {string} targetUserShortId ターゲットのShortID
 */
async function sendFriendRequest(targetUserId, targetUserName, targetUserShortId) {
  const myId = getPersistentUserId();
  if (myId === targetUserId) {
    showToast(t('friends-request-self'), 'error');
    return;
  }

  // すでにフレンドか、申請済みかクライアントサイドでチェック
  if (state.friends.some(f => f.id === targetUserId)) {
    showToast(t('friends-request-already-friends'), 'info');
    return;
  }
  if (state.sentFriendRequests.some(req => req.recipientId === targetUserId)) {
    showToast(t('friends-request-already-sent'), 'info');
    return;
  }

  const myShortId = playerShortIdDisplay.textContent.replace('#', '');

  // 相手側に保存する申請データ
  const requestData = {
    senderId: myId,
    senderName: state.playerName,
    senderShortId: myShortId,
    timestamp: firebase.database.ServerValue.TIMESTAMP,
  };

  // 自分用に保存する送信済み申請データ
  const sentRequestData = {
    recipientId: targetUserId,
    recipientName: targetUserName,
    recipientShortId: targetUserShortId,
    timestamp: firebase.database.ServerValue.TIMESTAMP,
  };

  const updates = {};
  updates[`/friendRequests/${targetUserId}/${myId}`] = requestData;
  updates[`/sentFriendRequests/${myId}/${targetUserId}`] = sentRequestData;

  try {
    await firebase.database().ref().update(updates);
    showToast(t('friends-request-sent'), 'success');
    friendSearchResultEl.innerHTML = ''; // Clear search result
  } catch (error) {
    showServerError(t('error-failed-to-send-request'), error);
  }
}

/**
 * フレンド申請を承認する
 * @param {string} senderId
 */
async function acceptFriendRequest(senderId) {
  const myId = getPersistentUserId();
  const updates = {};
  updates[`/users/${myId}/friends/${senderId}`] = true;
  updates[`/users/${senderId}/friends/${myId}`] = true;
  updates[`/friendRequests/${myId}/${senderId}`] = null; // 受信した申請を削除
  updates[`/sentFriendRequests/${senderId}/${myId}`] = null; // 相手の送信済みリストから削除

  try {
    await firebase.database().ref().update(updates);
  } catch (error) {
    showServerError(t('friends-add-fail'), error);
  }
}

/**
 * フレンド申請を拒否する
 * @param {string} senderId
 */
async function rejectFriendRequest(senderId) {
  const myId = getPersistentUserId();
  const updates = {};
  updates[`/friendRequests/${myId}/${senderId}`] = null; // 受信した申請を削除
  updates[`/sentFriendRequests/${senderId}/${myId}`] = null; // 相手の送信済みリストから削除

  try {
    await firebase.database().ref().update(updates);
  } catch (error) {
    showServerError(t('error'), error);
  }
}

/**
 * 送信済みのフレンド申請をキャンセルする
 * @param {string} targetUserId
 * @param {string} targetUserName
 */
async function cancelFriendRequest(targetUserId, targetUserName) {
  if (!confirm(t('friends-cancel-request-confirm', { name: targetUserName }))) return;

  const myId = getPersistentUserId();
  const updates = {};
  updates[`/friendRequests/${targetUserId}/${myId}`] = null;
  updates[`/sentFriendRequests/${myId}/${targetUserId}`] = null;

  try {
    await firebase.database().ref().update(updates);
    showToast(t('friends-request-cancelled'), 'success');
  } catch (error) {
    showServerError(t('friends-request-cancel-fail'), error);
  }
}

/**
 * フレンドを削除する
 * @param {string} friendId
 */
async function removeFriend(friendId, friendName) {
  if (!confirm(t('friends-remove-confirm', { name: friendName }))) return;

  const myId = getPersistentUserId();
  const updates = {};
  updates[`/users/${myId}/friends/${friendId}`] = null;
  updates[`/users/${friendId}/friends/${myId}`] = null;

  try {
    await firebase.database().ref().update(updates);
    showToast(t('friends-remove-success', { name: friendName }), 'success');
  } catch (error) {
    showServerError(t('friends-remove-fail'), error);
  }
}

/**
 * フレンド申請リストを描画する
 */
function renderFriendRequests() {
  if (state.friendRequests.length === 0) {
    friendRequestsListEl.innerHTML = `<div class="empty" data-i18n-key="friends-requests-empty">${t('friends-requests-empty')}</div>`;
    return;
  }
  friendRequestsListEl.innerHTML = state.friendRequests.map(req => `
    <div class="player-item">
      <div class="player-name">
        <span class="player-id-display">#${req.senderShortId}</span>
        <span>${escapeHTML(req.senderName)}</span>
      </div>
      <div class="player-actions">
        <button class="btn secondary" data-action="accept-friend" data-id="${req.senderId}" style="padding: 2px 8px; font-size: 12px;">${t('friends-accept')}</button>
        <button class="btn danger" data-action="reject-friend" data-id="${req.senderId}" style="padding: 2px 8px; font-size: 12px;">${t('friends-reject')}</button>
      </div>
    </div>
  `).join('');
}

/**
 * 送信済みフレンド申請リストを描画する
 */
function renderSentFriendRequests() {
  if (state.sentFriendRequests.length === 0) {
    sentFriendRequestsListEl.innerHTML = `<div class="empty" data-i18n-key="friends-sent-requests-empty">${t('friends-sent-requests-empty')}</div>`;
    return;
  }
  sentFriendRequestsListEl.innerHTML = state.sentFriendRequests.map(req => `
    <div class="player-item">
      <div class="player-name">
        <span class="player-id-display">#${req.recipientShortId}</span>
        <span>${escapeHTML(req.recipientName)}</span>
      </div>
      <div class="player-actions">
        <button class="btn danger" data-action="cancel-friend-request" data-id="${req.recipientId}" data-name="${escapeHTML(req.recipientName)}" style="padding: 2px 8px; font-size: 12px;">${t('friends-cancel-request')}</button>
      </div>
    </div>
  `).join('');
}

/**
 * フレンドリストを描画する
 */
function renderFriendsList() {
  const sortedFriends = [...state.friends].sort((a, b) => {
    const aOnline = a.status?.isOnline ?? false;
    const bOnline = b.status?.isOnline ?? false;
    if (aOnline && !bOnline) return -1;
    if (!aOnline && bOnline) return 1;
    return (a.name || '').localeCompare(b.name || '');
  });

  if (sortedFriends.length === 0) {
    friendsListEl.innerHTML = `<div class="empty" data-i18n-key="friends-list-empty">${t('friends-list-empty')}</div>`;
    return;
  }
  friendsListEl.innerHTML = sortedFriends.map(friend => {
    const isOnline = friend.status?.isOnline ?? false;
    const onlineIndicator = `<span class="online-status ${isOnline ? 'online' : 'offline'}" title="${isOnline ? t('friends-online') : t('friends-offline')}"></span>`;
    return `
    <div class="player-item">
      <div class="player-name">
        ${onlineIndicator}
        <span class="player-id-display">#${friend.shortId}</span>
        <span>${escapeHTML(friend.name)}</span>
      </div>
      <div class="player-actions">
        <button class="btn danger" data-action="remove-friend" data-id="${friend.id}" data-name="${escapeHTML(friend.name)}" style="padding: 2px 8px; font-size: 12px;">${t('friends-remove')}</button>
      </div>
    </div>
  `}).join('');
}

/**
 * 現在のフィルター設定をFirebaseに保存する（ホスト専用）
 */
function updateFiltersOnFirebase() {
  if (!state.isHost || !state.roomRef) return;

  const filters = {
    class: $$('input[data-class]').reduce((acc, cb) => ({ ...acc, [cb.dataset.class]: cb.checked }), {}),
    sub: $$('input[data-sub]').reduce((acc, cb) => ({ ...acc, [cb.dataset.sub]: cb.checked }), {}),
    sp: $$('input[data-sp]').reduce((acc, cb) => ({ ...acc, [cb.dataset.sp]: cb.checked }), {}),
    noRepeat: noRepeat.checked,
  };

  state.roomRef.child('filters').set(filters);
}

/**
 * Firebaseから取得したフィルター設定をUIに適用する（視聴者専用）
 * @param {Object} filters - Firebaseから取得したフィルター設定
 */
function applyFiltersFromFirebase(filters) {
  if (!filters || state.isHost) return;

  // 各フィルターのチェックボックスの状態を更新
  if (filters.class) {
    $$('input[data-class]').forEach(cb => {
      if (filters.class[cb.dataset.class] !== undefined) cb.checked = filters.class[cb.dataset.class];
    });
  }
  if (filters.sub) {
    $$('input[data-sub]').forEach(cb => {
      if (filters.sub[cb.dataset.sub] !== undefined) cb.checked = filters.sub[cb.dataset.sub];
    });
  }
  if (filters.sp) {
    $$('input[data-sp]').forEach(cb => {
      if (filters.sp[cb.dataset.sp] !== undefined) cb.checked = filters.sp[cb.dataset.sp];
    });
  }

  if (filters.noRepeat !== undefined) noRepeat.checked = filters.noRepeat;

  updatePool();
}

// --- リアルタイム連携 (Firebase) ------------------------------------

function initFirebase() {
  try {
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "YOUR_API_KEY") {
      showToast(t('firebase-not-configured'), 'error', 10000);
      setRealtimeUiState('error');
      return;
    }
    // Prevent re-initialization
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    state.db = firebase.database();
    setRealtimeUiState('disconnected');

    // URLからルームIDとパスワードを読み取って自動入力
    const params = new URLSearchParams(window.location.search);
    const roomIdFromUrl = params.get('room');
    const passwordFromUrl = params.get('password');
    const spectateFromUrl = params.get('spectate');

    if (roomIdFromUrl) {
      roomIdInput.value = roomIdFromUrl;
    }
    if (passwordFromUrl) {
      roomPasswordInput.value = passwordFromUrl;
    }

    // 管理者による観戦モードの場合、ゴースト参加をデフォルトで有効にする
    const myId = getPersistentUserId();
    const isAdmin = myId && ADMIN_USER_IDS.map(id => id.toLowerCase()).includes(myId.toLowerCase());
    if (spectateFromUrl === 'true' && isAdmin) {
      ghostJoinCheckbox.checked = true;
    }

    // 両方のパラメータが存在する場合、自動参加を試みる
    if (roomIdFromUrl && passwordFromUrl) {
      // 少し待ってから参加処理を開始することで、UIの準備が整うのを待つ
      setTimeout(() => {
        // プレイヤー名がlocalStorageなどから読み込まれていれば、自動で参加処理を実行
            if (state.playerName.trim()) {
          joinRoomBtn.click();
        } else {
          // プレイヤー名が未入力の場合は、入力を促す
          showToast(t('realtime-autojoin-name-required'), 'info');
              playerSettingsModal.style.display = 'flex';
              settingsPlayerNameInput.focus();
        }
      }, 500); // 500msの遅延
    }
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    const userMessage = t('firebase-init-failed');
    showServerError(userMessage, error);
    setRealtimeUiState('error');
  }
}

function showAdminMenu(targetButton) {
  closeAdminMenu(); // Close any other open menu

  const { playerId, playerName } = targetButton.dataset;
  const menu = document.createElement('div');
  menu.className = 'admin-menu';
  menu.id = 'active-admin-menu';
  // Store which button opened this menu to handle toggling
  menu.dataset.openerPlayerId = playerId;

  menu.innerHTML = `
    <button class="admin-menu-item" data-action="kick" data-player-id="${playerId}" data-player-name="${playerName}">${t('realtime-kick-player')}</button>
    <button class="admin-menu-item block" data-action="block" data-player-id="${playerId}" data-player-name="${playerName}">${t('realtime-block-player')}</button>
    <div class="admin-menu-divider"></div>
    <button class="admin-menu-item ban" data-action="ban" data-player-id="${playerId}" data-player-name="${playerName}">${t('realtime-ban-player')}</button>
  `;

  document.body.appendChild(menu);

  const rect = targetButton.getBoundingClientRect();
  menu.style.top = `${rect.bottom + window.scrollY + 2}px`;
  menu.style.left = `${rect.right + window.scrollX - menu.offsetWidth}px`;
}

function closeAdminMenu() {
  const existingMenu = document.getElementById('active-admin-menu');
  if (existingMenu) {
    existingMenu.remove();
  }
}

function kickPlayer(playerId, playerName) {
    const myId = getPersistentUserId();
    const isAdmin = myId && ADMIN_USER_IDS.map(id => id.toLowerCase()).includes(myId.toLowerCase());
    if (!isAdmin || !state.roomRef) return;
    // プレイヤーにキックされたことを通知
    state.roomRef.child('notifications').child(playerId).set({
        type: 'kick',
        hostName: state.playerName,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    });
    const message = t('system-player-kicked', { name: playerName, host: state.playerName });
    state.roomRef.child('chat').push({ name: null, message, isSystem: true, timestamp: firebase.database.ServerValue.TIMESTAMP });
    state.roomRef.child('clients').child(playerId).remove();
}

function blockPlayer(playerId, playerName) {
    const myId = getPersistentUserId();
    const isAdmin = myId && ADMIN_USER_IDS.map(id => id.toLowerCase()).includes(myId.toLowerCase());
    if (!isAdmin || !state.roomRef) return;

    // プレイヤーにキックされたことを通知 (ブロックはキックも兼ねる)
    state.roomRef.child('notifications').child(playerId).set({
        type: 'kick',
        hostName: state.playerName,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    });

    state.roomRef.child('blockedNames').push(playerName);
    const message = t('system-player-blocked', { name: playerName, host: state.playerName });
    state.roomRef.child('chat').push({ name: null, message, isSystem: true, timestamp: firebase.database.ServerValue.TIMESTAMP });
    state.roomRef.child('clients').child(playerId).remove();
}

function banPlayer(playerId, playerName) {
    const myId = getPersistentUserId();
    const isAdmin = myId && ADMIN_USER_IDS.map(id => id.toLowerCase()).includes(myId.toLowerCase());
    if (!isAdmin || !state.roomRef) return;
    const playerToBan = state.players.find(p => p.id === playerId);
    if (!playerToBan) return; // Should not happen if UI is correct

    // IPアドレスが取得できていない場合のフォールバック処理
    if (!playerToBan.ip) {
        if (confirm(t('realtime-ban-no-ip-confirm', { name: playerName }))) {
            // IP BANができないので、代わりに名前ブロックを実行
            blockPlayer(playerId, playerName);
        }
        return;
    }

    // プレイヤーにBANされたことを通知
    state.roomRef.child('notifications').child(playerId).set({
        type: 'ban',
        hostName: state.playerName,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    });

    state.roomRef.child('bannedIPs').push(playerToBan.ip);
    state.roomRef.child('blockedNames').push(playerName); // BANは名前ブロックも兼ねる
    const message = t('system-player-banned', { name: playerName, host: state.playerName });
    state.roomRef.child('chat').push({ name: null, message, isSystem: true, timestamp: firebase.database.ServerValue.TIMESTAMP });
    state.roomRef.child('clients').child(playerId).remove();
}

async function createRoom() { // UIの状態を更新して、処理中であることをユーザーにフィードバック
  createRoomBtn.disabled = true;
  joinRoomBtn.disabled = true;
  createRoomBtn.textContent = t('realtime-creating-btn');
  const name = state.playerName;

  try {
    if (!state.db) { showToast(t('db-not-connected-error'), 'error', 5000); return; }
    if (!name) {
      showToast(t('player-name-required'), 'error');
      // プレイヤー名が未設定の場合、設定モーダルを開いて入力を促す
      playerSettingsModal.style.display = 'flex';
      settingsPlayerNameInput.focus();
      createRoomBtn.disabled = false;
      joinRoomBtn.disabled = false;
      createRoomBtn.textContent = t('realtime-create-btn');
      return;
    }
    const persistentUserId = getPersistentUserId();

    const ip = await getIPAddress();
    const roomsRef = state.db.ref('rooms');
    let newRoomId;
    let roomExists = true;
    // 衝突しない12桁の数字のIDを生成する
    while (roomExists) {
      newRoomId = Math.floor(100000000000 + Math.random() * 900000000000).toString();
      const snapshot = await roomsRef.child(newRoomId).once('value');
      roomExists = snapshot.exists();
    }
    // 4桁の数字パスワードを生成
    const password = Math.floor(1000 + Math.random() * 9000).toString();
    state.roomId = newRoomId;
    state.roomRef = roomsRef.child(state.roomId);

    const playerShortId = await getOrCreateUserShortId(persistentUserId, name);

    await state.roomRef.set({
      createdAt: firebase.database.ServerValue.TIMESTAMP,
      lastActivity: firebase.database.ServerValue.TIMESTAMP,
      password: password,
      hostId: persistentUserId,
    });
    state.playerRef = state.roomRef.child('clients').child(persistentUserId);
    await state.playerRef.set({
      name: state.playerName,
      shortId: playerShortId,
      joinedAt: firebase.database.ServerValue.TIMESTAMP,
      ip: ip
    });
    // ホストが予期せず切断した場合は、ルーム全体を削除する
    state.roomRef.onDisconnect().remove();
    listenToRoomChanges();
    await state.db.ref(`users/${persistentUserId}/status/lastIP`).set(ip);
    $('#realtimeModal').style.display = 'none';
    // ルーム作成時に現在のフィルター状態を書き込む
    updateFiltersOnFirebase();
  } catch (error) {
    console.error("Error creating room:", error);
    showServerError(t('realtime-error-create'), error);
  } finally {
    createRoomBtn.disabled = false;
    joinRoomBtn.disabled = false;
    createRoomBtn.textContent = t('realtime-create-btn');
  }
}

async function joinRoom() {
  createRoomBtn.disabled = true;
  joinRoomBtn.disabled = true;
  joinRoomBtn.textContent = t('realtime-joining-btn');
  const name = state.playerName;

  try {
    if (!state.db) { showToast(t('db-not-connected-error'), 'error', 5000); return; }
    if (!name) {
      showToast(t('player-name-required'), 'error');
      // プレイヤー名が未設定の場合、設定モーダルを開いて入力を促す
      playerSettingsModal.style.display = 'flex';
      settingsPlayerNameInput.focus();
      createRoomBtn.disabled = false;
      joinRoomBtn.disabled = false;
      joinRoomBtn.textContent = t('realtime-join-btn');
      return;
    }
    const roomId = roomIdInput.value.trim();
    if (!roomId) {
      showToast(t('realtime-error-join-no-id'), 'error');
      return;
    }
    const password = roomPasswordInput.value.trim();
    if (!password) {
      showToast(t('realtime-password-required'), 'error');
      return;
    }

    state.roomId = roomId;
    state.roomRef = state.db.ref(`rooms/${state.roomId}`);
    const persistentUserId = getPersistentUserId();
    const ip = await getIPAddress();

    const snapshot = await state.roomRef.once('value');
    if (!snapshot.exists()) {
      showToast(t('realtime-error-connect'), 'error');
      return;
    }

    const roomData = snapshot.val();

    // Check password
    if (roomData.password !== password) {
      showToast(t('realtime-error-password'), 'error');
      return;
    }
    // Check for room expiration
    if (roomData.lastActivity && (Date.now() - roomData.lastActivity > ROOM_EXPIRATION_MS)) {
        showToast(t('realtime-error-expired'), 'error');
        // Optionally, we could delete the room here, but it requires different permissions.
        // For now, just prevent joining.
        return;
    }

    // Check if banned by IP
    const bannedIPsSnapshot = await state.roomRef.child('bannedIPs').once('value');
    const bannedIPs = Object.values(bannedIPsSnapshot.val() || {});
    if (ip && bannedIPs.includes(ip)) {
        showToast(t('realtime-error-banned'), 'error', 6000);
        return;
    }

    // Check if blocked by name
    const blockedNamesSnapshot = await state.roomRef.child('blockedNames').once('value');
    const blockedNames = Object.values(blockedNamesSnapshot.val() || {});
    if (blockedNames.includes(name)) {
        showToast(t('realtime-error-blocked'), 'error', 6000);
        return;
    }

    // ルームの最大人数をチェック
    const clients = roomData.clients || {};
    const isGhostJoin = ghostJoinCheckbox.checked && persistentUserId && ADMIN_USER_IDS.map(id => id.toLowerCase()).includes(persistentUserId.toLowerCase());
    const clientCount = Object.keys(clients).length;
    // ゴースト入室でない場合のみ人数チェックを行う
    if (clientCount >= 10 && !isGhostJoin) {
      // このメッセージは i18n.js に追加する必要があります。
      showToast(t('realtime-error-full'), 'error');
      return;
    }

    const playerShortId = await getOrCreateUserShortId(persistentUserId, name);

    state.playerRef = state.roomRef.child('clients').child(persistentUserId);
    await state.playerRef.set({
      name: state.playerName,
      shortId: playerShortId,
      joinedAt: firebase.database.ServerValue.TIMESTAMP,
      ip: ip,
      isGhost: isGhostJoin,
    });
    state.playerRef.onDisconnect().remove();

    await state.db.ref(`users/${persistentUserId}/status/lastIP`).set(ip);
    listenToRoomChanges();
    $('#realtimeModal').style.display = 'none';
  } catch (error) {
    console.error("Error joining room:", error);
    showServerError(t('realtime-error-join'), error);
  } finally {
    createRoomBtn.disabled = false;
    joinRoomBtn.disabled = false;
    joinRoomBtn.textContent = t('realtime-join-btn');
  }
}

function startActivityHeartbeat() {
  if (state.activityTimer) {
    clearInterval(state.activityTimer);
  }
  const update = () => {
    if (state.roomRef) {
      state.roomRef.child('lastActivity').set(firebase.database.ServerValue.TIMESTAMP)
        .catch(err => console.error("Failed to update room activity:", err));
    }
  };
  update(); // Update once immediately
  // Keep the room alive by updating the timestamp every 5 minutes
  state.activityTimer = setInterval(update, 5 * 60 * 1000);
}

function stopActivityHeartbeat() {
  if (state.activityTimer) {
    clearInterval(state.activityTimer);
    state.activityTimer = null;
  }
}

function listenToRoomChanges() {
  if (!state.roomRef) return;

  // Start sending heartbeats to keep the room alive
  startActivityHeartbeat();

  // ルーム作成時刻を取得してタイマーを開始
  state.roomRef.child('createdAt').once('value', (tsSnapshot) => {
    if (tsSnapshot.exists()) {
      startRoomExpiryTimer(tsSnapshot.val());
    }
  });

  // Listen to muted users
  state.roomRef.child('mutedUsers').on('value', (snapshot) => {
      const mutedData = snapshot.val() || {};
      const now = Date.now();
      const activeMutes = {};

      // Check for expired mutes
      for (const userId in mutedData) {
          if (mutedData[userId].expiresAt > now) {
              activeMutes[userId] = mutedData[userId];
          } else {
              // Mute has expired, remove it from DB if host
              if (state.isHost) {
                  state.roomRef.child('mutedUsers').child(userId).remove();
                  // Find player name for unmute message
                  const unmutedPlayer = state.players.find(p => p.id === userId);
                  if (unmutedPlayer) {
                      const message = t('system-player-unmuted', { name: unmutedPlayer.name });
                      state.roomRef.child('chat').push({ name: null, message, isSystem: true, timestamp: firebase.database.ServerValue.TIMESTAMP });
                  }
              }
          }
      }
      state.mutedUsers = activeMutes;
      // Re-render player list to show/hide mute icon
      if (state.players) updatePlayerList(state.players);
  });

  // 自分への通知（キック、BANなど）をリッスン
  const notificationRef = state.roomRef.child('notifications').child(state.playerRef.key);
  notificationRef.on('value', (snapshot) => {
    if (!snapshot.exists()) {
      return;
    }

    const { type, hostName, message: warningMessage } = snapshot.val();
    let messageKey = '';
    let toastMessage = '';

    if (type === 'kick') {
      messageKey = 'system-you-were-kicked';
      toastMessage = t(messageKey, { host: hostName });
    } else if (type === 'ban') {
      messageKey = 'system-you-were-banned';
      toastMessage = t(messageKey, { host: hostName });
    } else if (type === 'warn') {
      // 警告の場合はルームから退出させず、メッセージのみ表示
      toastMessage = `${t('system-you-were-warned-title')}: ${warningMessage}`;
      showToast(toastMessage, 'error', 10000); // 警告は10秒間表示
      notificationRef.remove(); // 通知を削除
      return; // 処理を終了
    }

    if (messageKey) {
      // 通知を受け取ったら、すぐにDBから削除して再発火を防ぐ
      notificationRef.remove();

      // 他のリスナー（特に 'clients'）が発火する前に、すべてのリスナーを停止する
      if (state.roomRef) {
        state.roomRef.off();
      }

      // ユーザーに通知
      showToast(toastMessage, 'error', 8000);

      // UIをリセットし、ルームから退出した状態にする
      handleLeaveRoom(false);
    }
  });
  let previousPlayers = {};
  let isInitialLoad = true;

  // Get hostId once, then listen to client changes.
  // This assumes host doesn't change.
  state.roomRef.child('hostId').once('value', (hostSnapshot) => { // 参加者リストの変更をリッスン
    const hostId = hostSnapshot.val();

    // 参加者リストの変更をリッスン
    state.roomRef.child('clients').on('value', (snapshot) => {
      const clients = snapshot.val() || {};

      // ホストかつ初回ロード後、またはゴーストでないプレイヤーの変更があった場合にメッセージを送信
      if (!isInitialLoad && state.isHost) {
        handlePlayerChanges(clients, previousPlayers);
      }
      previousPlayers = clients;
      isInitialLoad = false;

      const playerArray = Object.entries(clients)
        .sort(([, a], [, b]) => a.joinedAt - b.joinedAt)
        .filter(([, val]) => !val.isGhost) // ゴーストユーザーをリストから除外
        .map(([key, val]) => ({
          id: key,
          name: val.name,
          shortId: val.shortId,
          isHost: key === hostId,
          ip: val.ip || null
        }));

      state.players = playerArray;
      updatePlayerList(playerArray);

      const me = playerArray.find(p => p.id === state.playerRef?.key);
      if (me) {
        state.isHost = me.isHost;
        setRealtimeUiState(state.isHost ? 'in_room_host' : 'in_room_viewer');

        if (state.isHost) {
          state.roomRef.child('password').once('value').then(passSnapshot => {
            if (passSnapshot.exists()) {
              state.roomPassword = passSnapshot.val();
              roomPasswordDisplay.textContent = state.roomPassword;
              setRealtimeUiState('in_room_host');
            }
          });
        }
      } else {
        // 自分が見つからない = キックされたか、自ら退出したか、ブロックされた
        handleLeaveRoom(false); // UIリセットのみ
      }
    });
  });

  // 抽選結果の変更をリッスン
  state.roomRef.child('spinResult').on('value', (snapshot) => {
    if (!snapshot.exists()) return;
    const { finalResults, pool, timestamp } = snapshot.val();
    // 自分の抽選より新しい結果のみ表示
    if (timestamp > (state.lastSpinTimestamp || 0)) {
      state.lastSpinTimestamp = timestamp;
      displaySpinResult(finalResults, pool);
    }
  });

  // --- チャット履歴の取得と新規メッセージの監視 ---
  (async () => {
    // 既存のチャットリスナーをデタッチして、重複を防ぐ
    state.roomRef.child('chat').off();

    chatMessagesEl.innerHTML = ''; // チャット表示をクリア
    let lastMessageTimestamp = 0;

    // 過去50件のメッセージを取得
    const CHAT_HISTORY_LIMIT = 50;
    const chatHistoryQuery = state.roomRef.child('chat').limitToLast(CHAT_HISTORY_LIMIT);
    const historySnapshot = await chatHistoryQuery.once('value');
    if (historySnapshot.exists()) {
      const messages = historySnapshot.val();
      // Firebase returns an object, we need to sort by timestamp
      const sortedMessages = Object.values(messages).sort((a, b) => a.timestamp - b.timestamp);
      sortedMessages.forEach(messageData => {
        if (messageData && messageData.timestamp) {
          addChatMessage(messageData);
          lastMessageTimestamp = messageData.timestamp; // 最後のタイムスタンプを更新
        }
      });
    }

    // 履歴取得後に新規メッセージのリスナーをアタッチ
    state.roomRef.child('chat').orderByChild('timestamp').startAt(lastMessageTimestamp + 1).on('child_added', (snapshot) => {
      const messageData = snapshot.val();
      if (messageData && messageData.timestamp) {
        addChatMessage(messageData);
      }
    });
  })();

  // フィルター情報の変更をリッスン（視聴者のみ）
  state.roomRef.child('filters').on('value', (snapshot) => {
    if (snapshot.exists()) {
      applyFiltersFromFirebase(snapshot.val());
    }
  });

  // 履歴の変更をリッスン
  state.roomRef.child('history').on('value', (snapshot) => {
      const historyData = snapshot.val() || {};
      state.history = Object.entries(historyData).map(([key, value]) => ({
          ...value,
          key: key,
      }));
      renderHistory();
      updatePool();
  });

  roomIdDisplay.textContent = state.roomId;
  const url = new URL(window.location);
  url.searchParams.set('room', state.roomId);
  window.history.pushState({}, '', url);
}

function handlePlayerChanges(currentPlayers, previousPlayers) {
  if (!state.roomRef) return;
  const currentPlayerIds = Object.keys(currentPlayers);
  const previousPlayerIds = Object.keys(previousPlayers);

  const newPlayerIds = currentPlayerIds.filter(id => !previousPlayerIds.includes(id));
  newPlayerIds.forEach(id => {
    // ゴーストでないユーザーの参加のみ通知
    if (currentPlayers[id] && !currentPlayers[id].isGhost) {
      const message = t('system-player-joined', { name: currentPlayers[id].name });
      state.roomRef.child('chat').push({ name: null, message, isSystem: true, timestamp: firebase.database.ServerValue.TIMESTAMP });
    }
  });

  const leftPlayerIds = previousPlayerIds.filter(id => !currentPlayerIds.includes(id));
  leftPlayerIds.forEach(id => {
    // ゴーストでないユーザーの退出のみ通知
    if (previousPlayers[id] && !previousPlayers[id].isGhost) {
      const message = t('system-player-left', { name: previousPlayers[id].name });
      state.roomRef.child('chat').push({ name: null, message, isSystem: true, timestamp: firebase.database.ServerValue.TIMESTAMP });
    }
  });
}

// --- リアルタイム連携 (Firebase) ------------------------------------

function setRealtimeUiState(uiState) {
    const spinBtn = $('#spinBtn');
    const inRoom = uiState.startsWith('in_room');
    const isHost = uiState === 'in_room_host';
    const isViewer = uiState === 'in_room_viewer';
    $('#openRealtimeBtn').style.display = inRoom ? 'none' : 'inline-flex';
    roomInfoUi.style.display = inRoom ? 'flex' : 'none';
    playerListContainer.style.display = inRoom ? 'block' : 'none';
    const isError = uiState === 'error';
    // ルーム内にいて、タイマーが作動している場合のみ表示する
    if (inRoom && state.roomExpiryTimer) {
      roomTimerContainer.style.display = 'inline-flex';
    } else {
      roomTimerContainer.style.display = 'none';
    }

    // CSSで制御するため、bodyにクラスを付与/削除する
    if (inRoom) {
      document.body.classList.add('in-room');
    } else {
      document.body.classList.remove('in-room');
    }

    if (uiState === 'disconnected') {
      chatMessagesEl.innerHTML = '';
    }
    hostBadge.style.display = isHost ? 'inline-block' : 'none';
    roomPasswordDisplay.style.display = isHost ? 'inline-block' : 'none';
    $('#roomPasswordLabel').style.display = isHost ? 'inline-block' : 'none';
    copyInviteLinkBtn.style.display = isHost ? 'inline-block' : 'none';

    // エラー時は操作させない
    createRoomBtn.disabled = isError;
    joinRoomBtn.disabled = isError;

    // isViewerは、ルーム内の視聴者である場合にtrue。ローカルモードやホストの場合はfalse。
    // これを使ってホスト専用コントロールの有効/無効を一括で設定する。
    const hideHostControls = isViewer;

    // ホスト専用コントロール（スピン、リセット、人数設定、重複なし）を非表示/表示
    $$('.host-control').forEach(el => {
      // `display: ''` はインラインスタイルを削除し、CSSで定義されたスタイルに戻す
      el.style.display = hideHostControls ? 'none' : '';
    });
    // フィルターUIは閲覧者が設定を確認できるように、非表示ではなく無効化する
    $$('#classFilters input, #classFilters button').forEach(el => {
      el.disabled = hideHostControls;
    });
}

function handleLeaveRoom(removeFromDb = true) {
  if (removeFromDb) {
    if (state.isHost && state.roomRef) {
      // ホストの場合、ルーム全体のonDisconnectをキャンセルし、ルームを削除
      state.roomRef.onDisconnect().cancel();
      state.roomRef.remove();
    } else if (state.playerRef) {
      // 視聴者の場合、自分のonDisconnectをキャンセルし、自分の情報のみを削除
      state.playerRef.onDisconnect().cancel();
      state.playerRef.remove();
    }
  }

  if (state.roomRef) {
    state.roomRef.off(); // 全てのリスナーを解除
  }

  // Stop sending heartbeats
  stopActivityHeartbeat();

  // タイマーを停止
  if (state.roomExpiryTimer) {
    clearInterval(state.roomExpiryTimer);
    state.roomExpiryTimer = null;
  }

  // フレンドのステータスリスナーを全て解除
  Object.values(state.friendStatusListeners).forEach(({ ref, listener }) => ref.off('value', listener));
  state.friendStatusListeners = {};

  state.roomRef = null;
  state.playerRef = null;
  state.roomId = null;
  state.isHost = false;
  state.roomPassword = null;

  // 参加/作成ボタンの状態をリセットし、UIが再表示されたときに正しい状態にする
  createRoomBtn.disabled = false;
  joinRoomBtn.disabled = false;
  createRoomBtn.textContent = t('realtime-create-btn');
  joinRoomBtn.textContent = t('realtime-join-btn');
  ghostJoinCheckbox.checked = false;
  roomPasswordInput.value = '';

  setRealtimeUiState('disconnected');
  updatePlayerList([]);

  // Clear online history and load local history
  state.history = [];
  loadHistory();
  renderHistory();
  updatePool();

  const url = new URL(window.location);
  url.searchParams.delete('room');
  window.history.pushState({}, '', url);
}

function sendChatMessage() {
  const message = chatInput.value.trim();
  if (message && state.roomRef) {
    // Check if muted
    const myId = state.playerRef.key;
    const myMuteInfo = state.mutedUsers[myId];
    if (myMuteInfo && myMuteInfo.expiresAt > Date.now()) {
      const expiryTime = new Date(myMuteInfo.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      showToast(t('chat-error-muted', { time: expiryTime }), 'error');
      return;
    }

    state.roomRef.child('chat').push({
      name: state.playerName,
      message: message,
      timestamp: firebase.database.ServerValue.TIMESTAMP
    });
    chatInput.value = '';
    chatInput.focus(); // 送信後も入力欄にフォーカスを維持
  }
}

/**
 * 管理者用のUIの表示状態を更新する
 */
function updateAdminUI() {
  const myId = getPersistentUserId();
  const isAdmin = myId && ADMIN_USER_IDS.map(id => id.toLowerCase()).includes(myId.toLowerCase());

  if (ghostJoinContainer) {
    ghostJoinContainer.style.display = isAdmin ? 'flex' : 'none';
  }
  if (adminLink) {
    adminLink.style.display = isAdmin ? 'inline-flex' : 'none';
  }
}

// --- 初期化とイベントリスナー設定 ------------------------------------

function buildFilterUI() {
  const allSubs = [...new Set(weapons.map(w => w.sub))].filter(Boolean).sort();
  const allSps = [...new Set(weapons.map(w => w.sp))].filter(Boolean).sort();
  const classFilters = $('#classFilters');
  // Note: Text content will be set by updateUIText()
  classFilters.innerHTML = `
  <div class="filter-group">
    <div class="filter-header">
      <strong data-i18n-key="filter-class"></strong>
      <button type="button" class="btn-filter" data-toggle-all="class" data-i18n-key="filter-toggle"></button>
    </div>
    ${[...new Set(weapons.map(w => w.class))].sort().map(cls =>
      `<label class="chip"><input type="checkbox" data-class="${cls}" checked> <span data-i18n-key="${cls}">${cls}</span></label>`
    ).join('')}
  </div>
  <div class="filter-group">
    <div class="filter-header">
      <strong data-i18n-key="filter-sub"></strong>
      <button type="button" class="btn-filter" data-toggle-all="sub" data-i18n-key="filter-toggle"></button>
    </div>
    ${allSubs.map(sub =>
      `<label class="chip"><input type="checkbox" data-sub="${sub}" checked> <span data-i18n-key="${sub}">${sub}</span></label>`
    ).join('')}
  </div>
  <div class="filter-group">
    <div class="filter-header">
      <strong data-i18n-key="filter-special"></strong>
      <button type="button" class="btn-filter" data-toggle-all="sp" data-i18n-key="filter-toggle"></button>
    </div>
    ${allSps.map(sp =>
      `<label class="chip"><input type="checkbox" data-sp="${sp}" checked> <span data-i18n-key="${sp}">${sp}</span></label>`
    ).join('')}
  </div>
  `;
}

function setupEventListeners() {
  $('#spinBtn').addEventListener('click', startSpin);
  $('#resetBtn').addEventListener('click', resetAll);
  playerCountInput.addEventListener('change', saveSettings);

  // Realtime controls
  createRoomBtn.addEventListener('click', createRoom);
  joinRoomBtn.addEventListener('click', joinRoom);
  leaveRoomBtn.addEventListener('click', () => handleLeaveRoom(true));
  
  // Player Settings Modal
  playerSettingsBtn.addEventListener('click', () => playerSettingsModal.style.display = 'flex');
  closePlayerSettingsBtn.addEventListener('click', () => playerSettingsModal.style.display = 'none');
  playerSettingsModal.addEventListener('click', (e) => {
    if (e.target === playerSettingsModal) playerSettingsModal.style.display = 'none';
  });
  confirmPlayerSettingsBtn.addEventListener('click', updatePlayerNameAndId);
  settingsPlayerNameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') confirmPlayerSettingsBtn.click(); });
  
  copyInviteLinkBtn.addEventListener('click', async () => {
    if (!state.isHost || !state.roomId || !state.roomPassword) return;
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set('room', state.roomId);
    url.searchParams.set('password', state.roomPassword);

    try {
      await navigator.clipboard.writeText(url.href);
      showToast(t('copied-invite-link'), 'success');
    } catch (err) {
      console.error('Failed to copy invite URL:', err);
      showToast(t('copy-failed'), 'error');
    }
  });
  roomIdDisplay.addEventListener('click', () => navigator.clipboard.writeText(state.roomId));
  chatSendBtn.addEventListener('click', sendChatMessage);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // フォームのデフォルト送信を防止
      sendChatMessage();
    }
  });

  playerListEl.addEventListener('click', (e) => {
    const target = e.target.closest('.player-name[data-player-name]');
    if (!target) return;

    const playerName = target.dataset.playerName;
    if (playerName) {
      e.stopPropagation();
      const separator = (chatInput.value.length > 0 && !chatInput.value.endsWith(' ')) ? ' ' : '';
      chatInput.value += `${separator}@${playerName} `;
      chatInput.focus();
    }
  });

  // Admin menu and actions handler
  document.addEventListener('click', (e) => {
    const menuButton = e.target.closest('[data-action="admin-menu"]');
    const menuItem = e.target.closest('.admin-menu-item');
    const openMenu = document.getElementById('active-admin-menu');

    const myId = getPersistentUserId();
    const isAdmin = myId && ADMIN_USER_IDS.map(id => id.toLowerCase()).includes(myId.toLowerCase());

    // If a menu button is clicked
    if (menuButton) {
        e.stopPropagation();
        if (!isAdmin) return;

        // If a menu is open for this button, close it. Otherwise, open it.
        if (openMenu && openMenu.dataset.openerPlayerId === menuButton.dataset.playerId) {
            closeAdminMenu();
        } else {
            showAdminMenu(menuButton);
        }
        return;
    }

    // If a menu item is clicked
    if (menuItem) {
        if (!isAdmin) return;
        const { action, playerId, playerName } = menuItem.dataset;
        
        if (action === 'kick') {
            if (confirm(t('realtime-kick-confirm', { name: playerName }))) kickPlayer(playerId, playerName);
        } else if (action === 'block') {
            if (confirm(t('realtime-block-confirm', { name: playerName }))) blockPlayer(playerId, playerName);
        } else if (action === 'ban') {
            if (confirm(t('realtime-ban-confirm', { name: playerName }))) banPlayer(playerId, playerName);
        }
        closeAdminMenu();
        return;
    }

    // If clicked anywhere else, close the menu
    if (openMenu && !e.target.closest('.admin-menu')) {
        closeAdminMenu();
    }
  });

  // Friend Modal
  friendsBtn.addEventListener('click', () => {
    if (!state.playerName) {
      showToast(t('player-name-required'), 'error');
      playerSettingsModal.style.display = 'flex';
      return;
    }
    friendsModal.style.display = 'flex';
    // Clear previous search results when opening
    friendSearchResultEl.innerHTML = '';
    friendSearchInput.value = '';
  });
  closeFriendsModalBtn.addEventListener('click', () => friendsModal.style.display = 'none');
  friendsModal.addEventListener('click', (e) => {
    if (e.target === friendsModal) friendsModal.style.display = 'none';
  });

  friendSearchBtn?.addEventListener('click', async () => {
    const query = friendSearchInput.value.replace('#', '').trim();
    if (!query) return;
    showLoader();
    const user = await findUserByShortId(query);
    renderFriendSearchResult(user);
    hideLoader();
  });
  friendSearchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') friendSearchBtn.click();
  });

  friendSearchResultEl?.addEventListener('click', (e) => {
    const target = e.target.closest('[data-action="send-friend-request"]');
    if (target) {
      const { id, name, shortId } = target.dataset;
      sendFriendRequest(id, name, shortId);
    }
  });

  friendRequestsListEl.addEventListener('click', (e) => {
    const acceptBtn = e.target.closest('[data-action="accept-friend"]');
    if (acceptBtn) {
      acceptFriendRequest(acceptBtn.dataset.id);
    }
    const rejectBtn = e.target.closest('[data-action="reject-friend"]');
    if (rejectBtn) {
      rejectFriendRequest(rejectBtn.dataset.id);
    }
  });

  sentFriendRequestsListEl.addEventListener('click', (e) => {
    const cancelBtn = e.target.closest('[data-action="cancel-friend-request"]');
    if (cancelBtn) {
      cancelFriendRequest(cancelBtn.dataset.id, cancelBtn.dataset.name);
    }
  });

  friendsListEl.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('[data-action="remove-friend"]');
    if (removeBtn) {
      removeFriend(removeBtn.dataset.id, removeBtn.dataset.name);
    }
  });

  fullscreenBtn?.addEventListener('click', toggleFullscreen);
  document.addEventListener('fullscreenchange', updateFullscreenButton);

  // Settings Modal
  settingsBtn.addEventListener('click', () => settingsModal.style.display = 'flex');
  closeSettingsBtn.addEventListener('click', () => settingsModal.style.display = 'none');
  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) settingsModal.style.display = 'none';
  });
  $$('input[name="theme"]').forEach(radio => radio.addEventListener('change', (e) => applyTheme(e.target.value)));
  $$('input[name="language"]').forEach(radio => radio.addEventListener('change', (e) => setLanguage(e.target.value)));

  // Webhook設定の変更を保存
  $('#webhookEnable')?.addEventListener('change', () => {
    toggleWebhookUrlState();
    saveSettings();
  });
  $('#webhookUrl')?.addEventListener('input', saveSettings);
  $('#webhookTemplate')?.addEventListener('input', saveSettings);
  $('#webhookMentions')?.addEventListener('input', saveSettings);
  $('#autoCopy')?.addEventListener('change', saveSettings);
  $('#testWebhookBtn')?.addEventListener('click', testDiscordWebhook);

  // Wake Lock Toggle
  if ('wakeLock' in navigator) {
    preventSleepToggle.addEventListener('change', async (e) => {
      if (e.target.checked) { // ONにしようとした時
        if ('getBattery' in navigator) {
          try {
            const battery = await navigator.getBattery();
            if (battery.level <= 0.2 && !battery.charging) {
              e.target.checked = false; // スイッチを強制的にOFFに戻す
              showToast(t('battery-low-prevent-sleep'), 'error');
              return; // 処理を中断
            }
          } catch (err) {
            console.warn('Could not get battery status.', err);
          }
        }
        requestWakeLock(); // バッテリーチェックを通過した場合のみONにする
      } else { // OFFにした時
        releaseWakeLock();
      }
      saveSettings();
    });
  }

  systemThemeListener.addEventListener('change', handleSystemThemeChange);

  historyEl.addEventListener('click', handleDeleteHistoryItem);

  // フィルターのチェックボックス（個別）が変更されたときのリスナー
  $('#classFilters').addEventListener('change', handleFilterChange);
  // 「重複なし」チェックボックスが変更されたときのリスナー
  noRepeat.addEventListener('change', handleFilterChange);

  // フィルターの「すべて選択/解除」ボタンがクリックされたときのリスナー
  $('#classFilters').addEventListener('click', e => {
    const toggleType = e.target.dataset.toggleAll;
    if (toggleType) {
      const checkboxes = $$(`input[data-${toggleType}]`);
      if (checkboxes.length === 0) return;

      const allCurrentlyChecked = checkboxes.every(cb => cb.checked);
      const newCheckedState = !allCurrentlyChecked;

      checkboxes.forEach(cb => cb.checked = newCheckedState);
      handleFilterChange(); // 変更を適用
    }
  });

  // Realtime Modal
  const realtimeModal = $('#realtimeModal');
  $('#openRealtimeBtn').addEventListener('click', () => {
    realtimeModal.style.display = 'flex';
  });
  $('#closeRealtimeBtn').addEventListener('click', () => {
    realtimeModal.style.display = 'none';
  });
  realtimeModal.addEventListener('click', e => {
    if (e.target === realtimeModal) {
      realtimeModal.style.display = 'none';
    }
  });

  // --- 音声入力の初期化 ---
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.continuous = false; // 一つのフレーズを認識したら停止
    recognition.lang = state.lang;
    recognition.interimResults = false;

    state.recognition = recognition; // stateに保持
    let isListening = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      // 既存のテキストがあればスペースを挟んで追記
      chatInput.value += (chatInput.value.length > 0 ? ' ' : '') + transcript;
    };

    recognition.onerror = (event) => {
      let errorKey = 'chat-voice-error-unknown';
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        errorKey = 'chat-voice-error-permission';
      } else if (event.error === 'no-speech') {
        errorKey = 'chat-voice-error-no-speech';
      }
      showToast(t(errorKey), 'error');
    };

    recognition.onstart = () => { isListening = true; voiceInputBtn.classList.add('listening'); voiceInputBtn.title = t('chat-voice-input-stop'); };
    recognition.onend = () => { isListening = false; voiceInputBtn.classList.remove('listening'); voiceInputBtn.title = t('chat-voice-input-start'); };

    voiceInputBtn.addEventListener('click', () => {
      if (isListening) {
        recognition.stop();
      } else {
        recognition.start();
      }
    });
  } else {
    voiceInputBtn.style.display = 'none'; // APIがサポートされていない場合はボタンを非表示
  }
}

/**
 * フィルターの変更を処理し、UIの更新とFirebaseへの同期を行う
 * @param {Event} [event] - チェックボックスの変更イベント（オプション）
 */
function handleFilterChange(event) {
  // イベントが渡された場合、最後のチェックボックスがオフにされるのを防ぐ
  if (event && event.target && event.target.matches('input[type="checkbox"]')) {
    const group = event.target.dataset.class ? 'class' : event.target.dataset.sub ? 'sub' : 'sp';
    if (group) {
      const selector = `input[data-${group}]`;
      const checkboxes = $$(selector);
      const checkedCount = checkboxes.filter(cb => cb.checked).length;
      if (checkedCount === 0) {
        event.target.checked = true; // チェックを元に戻す
      }
    }
  }

  updatePool();
  saveSettings();
  if (state.isHost) {
    updateFiltersOnFirebase();
  }
}

async function initializeBanListener() {
  const myId = getPersistentUserId();
  if (!myId || !state.db) return;

  const banRef = state.db.ref(`bannedUsers/${myId}`);

  const handleBan = (snapshot) => {
    if (snapshot.exists()) {
      if (state.roomRef) {
        handleLeaveRoom(false);
      }
      document.body.innerHTML = `<div class="card" style="margin: auto; padding: 2rem; text-align: center;"><h1>${t('realtime-error-banned-globally')}</h1></div>`;
      state.db.ref().off();
      return true;
    }
    return false;
  };

  // Initial check
  const initialSnapshot = await banRef.once('value');
  if (handleBan(initialSnapshot)) {
    throw new Error('User is banned.');
  }

  // Listen for future changes
  banRef.on('value', handleBan);
}

function init() {
  // --- バージョンチェックと強制リロード ---
  // ローカルに保存されたバージョンと現在のアプリバージョンを比較
  const savedVersion = localStorage.getItem('splaRouletteVersion');
  if (savedVersion && savedVersion !== APP_VERSION) { // バージョンが異なったらデータをクリアしてリロード
    // バージョンが異なる場合、互換性のない変更によるエラーを防ぐため、
    // 古い設定と履歴をクリアしてページを強制的にリロードする。
    console.log(`App updated from ${savedVersion} to ${APP_VERSION}. Clearing data and reloading.`);
    localStorage.removeItem('splaRouletteSettings');
    localStorage.removeItem('splaRouletteHistory');
    localStorage.removeItem('splaRoulettePlayerName');
    localStorage.setItem('splaRouletteVersion', APP_VERSION); // 新しいバージョンを保存
    location.reload(true); // キャッシュを無視してリロード
    return; // リロードするため、以降の初期化処理は中断
  }
  // 現在のバージョンをローカルストレージに保存
  localStorage.setItem('splaRouletteVersion', APP_VERSION);

  // `weapons`変数は`weapons.js`からグローバルスコープに読み込まれている
  if (typeof weapons === 'undefined' || weapons.length === 0) {
    console.error('ブキデータが見つかりません。weapons.jsが正しく読み込まれているか確認してください。');
    // Set language to render error message correctly
    setLanguage(navigator.language.startsWith('ja') ? 'ja' : 'en');
    resultContainer.innerHTML = `
      <div id="resultName" class="name">${t('error')}</div>
      <div id="resultClass" class="class">${t('error-loading-weapons')}</div>
    `;
    return;
  }

  buildFilterUI();
  setupEventListeners();
  loadAndApplySettings();

  const params = new URLSearchParams(window.location.search);
  if (!params.has('room')) {
    // URLにルームIDがない場合（＝ローカルモードで起動した場合）、
    // ローカルの履歴を読み込む
    loadHistory();
    updatePool();
  }

  // Wake Lock UIの表示制御
  if ('wakeLock' in navigator) {
    $('#wakeLockSetting').style.display = 'flex';
    $('#wakeLockHelp').style.display = 'block';
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // バッテリー監視機能を追加
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        const handleBatteryChange = () => {
          // スリープ防止が有効な状態で、バッテリーが20%以下かつ充電中でない場合
          if (preventSleepToggle.checked && battery.level <= 0.2 && !battery.charging) {
            releaseWakeLock(); // WakeLockを解放
            preventSleepToggle.checked = false; // UIのスイッチもOFFにする
            saveSettings(); // 設定を保存
            showToast(t('battery-low-prevent-sleep'), 'error');
          }
        };
        battery.addEventListener('levelchange', handleBatteryChange);
        battery.addEventListener('chargingchange', handleBatteryChange);
      }).catch(err => console.warn('Cannot monitor battery status.', err));
    }
  }

  // 初期プレイヤー名とIDの読み込み
  const savedName = localStorage.getItem('splaRoulettePlayerName') || '';
  syncAndSavePlayerName(savedName);

  // Firebaseを初期化。プレイヤー名が読み込まれた後に行うことで、自動参加が正しく機能する。
  initFirebase();

  // 非同期で初期IDを読み込んで表示
  (async () => {
    if (state.playerName) {
      try {
        await initializeBanListener();
        const persistentUserId = getPersistentUserId();
        const shortId = await getOrCreateUserShortId(persistentUserId, state.playerName);
        manageUserPresence();
        playerShortIdDisplay.textContent = `#${shortId}`;
        // プレイヤー情報が確定したので、フレンド関連のリスナーを開始
        listenToFriends();
        listenToFriendRequests();
        listenToSentFriendRequests();
      } catch (error) {
        console.error("Initialization failed:", error.message);
      }
    }
  })();
}

/**
 * フレンド申請をリッスンする
 */
function listenToFriendRequests() {
  const myId = getPersistentUserId();
  if (!myId || !state.db) return;
  const requestsRef = state.db.ref(`friendRequests/${myId}`);

  // 既存のリスナーをデタッチして重複を防ぐ
  requestsRef.off();

  // 初回ロードかどうかを判定するフラグ
  let isInitialLoad = true;

  requestsRef.on('value', (snapshot) => {
    const requestsData = snapshot.val() || {};
    const newRequests = Object.values(requestsData);

    // 初回ロード完了後のみ通知をチェック
    if (!isInitialLoad) {
      const oldRequestIds = new Set(state.friendRequests.map(req => req.senderId));
      const newlyAddedRequests = newRequests.filter(req => !oldRequestIds.has(req.senderId));

      if (newlyAddedRequests.length > 0) {
        if (newlyAddedRequests.length === 1) {
          // 新しい申請が1件の場合
          const newRequest = newlyAddedRequests[0];
          showToast(t('friends-new-request-notification', { name: newRequest.senderName }), 'info', 5000);
        } else {
          // 新しい申請が複数件の場合
          showToast(t('friends-new-requests-notification-multiple', { count: newlyAddedRequests.length }), 'info', 5000);
        }
      }
    }

    state.friendRequests = newRequests;
    renderFriendRequests();

    // 初回ロード完了
    isInitialLoad = false;
  }, (error) => {
    console.error("Error listening to friend requests:", error);
  });
}

/**
 * 送信済みフレンド申請をリッスンする
 */
function listenToSentFriendRequests() {
  const myId = getPersistentUserId();
  if (!myId || !state.db) return;
  const sentRequestsRef = state.db.ref(`sentFriendRequests/${myId}`);

  // 既存のリスナーをデタッチして重複を防ぐ
  sentRequestsRef.off();

  sentRequestsRef.on('value', (snapshot) => {
    const requestsData = snapshot.val() || {};
    state.sentFriendRequests = Object.values(requestsData);
    renderSentFriendRequests();
    // 検索結果が表示されている場合、ボタンの状態を更新するために再描画をトリガーする
    if (friendSearchResultEl.innerHTML.trim() !== '') {
      friendSearchBtn.click();
    }
  }, (error) => {
    console.error("Error listening to sent friend requests:", error);
  });
}

/**
 * フレンドリストをリッスンする
 */
function listenToFriends() {
  const myId = getPersistentUserId();
  if (!myId || !state.db) return;
  const friendsRef = state.db.ref(`users/${myId}/friends`);

  // 既存のリスナーをデタッチ
  friendsRef.off();
  Object.values(state.friendStatusListeners).forEach(({ ref, listener }) => ref.off('value', listener));
  state.friendStatusListeners = {};

  // 初回ロードかどうかを判定するフラグ
  let isInitialLoad = true;

  friendsRef.on('value', async (snapshot) => {
    const friendIds = snapshot.val() ? Object.keys(snapshot.val()) : [];
    
    const friendPromises = friendIds.map(id => state.db.ref(`users/${id}`).once('value'));
    const friendSnapshots = await Promise.all(friendPromises);

    const newFriends = friendSnapshots
      .map(snap => ({ id: snap.key, ...snap.val() }))
      .filter(f => f.name); // Ensure friend data exists

    if (!isInitialLoad && newFriends.length > state.friends.length) {
      const oldFriendIds = state.friends.map(f => f.id);
      const newFriend = newFriends.find(f => !oldFriendIds.includes(f.id));
      if (newFriend) showToast(t('friends-became-friends-notification', { name: newFriend.name }), 'success', 5000);
    }

    state.friends = newFriends;

    // 新しいフレンドリストに基づいてステータスリスナーを再設定
    state.friends.forEach(friend => {
      const friendStatusRef = state.db.ref(`users/${friend.id}/status`);
      const listener = friendStatusRef.on('value', (statusSnap) => {
        const status = statusSnap.val() || { isOnline: false, lastSeen: 0 };
        const friendInState = state.friends.find(f => f.id === friend.id);
        if (friendInState) {
          friendInState.status = status;
          renderFriendsList();
        }
      });
      state.friendStatusListeners[friend.id] = { ref: friendStatusRef, listener: listener };
    });

    // 初回ロード完了
    isInitialLoad = false;
  }, (error) => {
    console.error("Error listening to friends list:", error);
  });
}

init();

/**
 * ルームの自動解散タイマーを開始する
 * @param {number} createdAt - ルームが作成されたタイムスタンプ
 */
function startRoomExpiryTimer(createdAt) {
  if (state.roomExpiryTimer) {
    clearInterval(state.roomExpiryTimer);
  }

  const expiryTime = createdAt + ROOM_LIFETIME_MS;

  roomTimerContainer.style.display = 'inline-flex';

  state.roomExpiryTimer = setInterval(() => {
    const now = Date.now();
    const remaining = expiryTime - now;

    if (remaining <= 0) {
      clearInterval(state.roomExpiryTimer);
      state.roomExpiryTimer = null;
      roomTimerContainer.style.display = 'none';
      if (state.isHost) {
        showToast(t('realtime-room-expired'), 'error');
        handleLeaveRoom(true); // ホストがルームを解散
      }
      return;
    }

    const hours = Math.floor(remaining / (1000 * 60 * 60)).toString().padStart(2, '0');
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000).toString().padStart(2, '0');

    roomTimer.textContent = `${hours}:${minutes}:${seconds}`;
  }, 1000);
}
