// --- Firebase Configuration -----------------------------------------------

// ▼▼▼ PASTE FIREBASE CONFIG HERE ▼▼▼
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


// --- グローバル変数 ---------------------------------------------------------
const APP_VERSION = '1.2.0'; // アプリケーションのバージョン。更新時にこの数値を変更する。
const RESET_TIMEOUT_MS = 10000; // 10秒
const ROOM_EXPIRATION_MS = 30 * 60 * 1000; // 30分
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
const inviteLinkContainer = $('#invite-link-container');
const inviteLinkDisplay = $('#inviteLinkDisplay');
const copyInviteLinkBtn = $('#copyInviteLinkBtn');
const roomTimerContainer = $('#room-timer-container');
const roomTimer = $('#room-timer');
const createRoomBtn = $('#createRoomBtn');
const joinRoomBtn = $('#joinRoomBtn');
const leaveRoomBtn = $('#leaveRoomBtn');
const roomIdInput = $('#roomIdInput');
const roomPasswordInput = $('#roomPasswordInput');
const roomPasswordDisplay = $('#roomPasswordDisplay');
const roomJoinUi = $('#room-join-ui');
const roomInfoUi = $('#room-info-ui');
const roomIdDisplay = $('#roomIdDisplay');
const hostBadge = $('#host-badge');
const playerNameInput = $('#playerNameInput');
const playerListContainer = $('#player-list-container');
const playerListEl = $('#player-list');
const playerCountDisplay = $('#playerCountDisplay');
const chatContainer = $('#chat-container');
const chatMessagesEl = $('#chat-messages');
const chatInput = $('#chatInput');
const chatSendBtn = $('#chatSendBtn');

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

function setControlsDisabled(disabled) {
  // 全画面ボタンはルーレット実行中も操作可能にするため、無効化の対象から除外する
  // When disabling, disable everything.
  if (disabled) {
    $$('.main-controls button:not(#fullscreenBtn), .main-controls input, #history button').forEach(c => c.disabled = true);
    $$('#classFilters input, #classFilters button').forEach(c => c.disabled = true);
    return;
  }

  // When enabling, restore state based on role.
  if (state.roomRef) {
    // In a room, restore state based on host/viewer role
    setRealtimeUiState(state.isHost ? 'in_room_host' : 'in_room_viewer');
  } else {
    // In local mode, enable all controls
    $$('.main-controls button:not(#fullscreenBtn), .main-controls input, #history button').forEach(c => c.disabled = false);
    $$('#classFilters input, #classFilters button').forEach(c => c.disabled = false);
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
    alert(t('no-candidates-alert', { poolCount: state.pool.length, playerCount: playerCount }));
    return null;
  }
  if (state.pool.length === 0) {
    alert(t('no-candidates-alert-title'));
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
      if (isOnline) {
          // Online mode: only host writes history and sends notifications
          if (state.isHost) {
              const historyRef = state.roomRef.child('history');
              for (let i = 0; i < finalResults.length; i++) {
                  const result = finalResults[i];
                  historyRef.push({
                      ...result,
                      time: drawTime,
                      playerNum: i + 1,
                      totalPlayers: finalResults.length,
                  });
              }
              await sendToDiscord(finalResults);
          }
      } else {
          // Local mode: update local history and save
          for (let i = 0; i < finalResults.length; i++) {
              pushHistoryItem(finalResults[i], drawTime, i + 1, finalResults.length);
          }
          saveHistory();
          await sendToDiscord(finalResults);
      }

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
    console.log('Result copied to clipboard.');
    // TODO: 将来的に「コピーしました」というトースト通知などを追加するとより親切
  } catch (err) {
    console.error('Failed to copy result to clipboard:', err);
    alert(t('error-copy-failed'));
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
      console.error('Discord Webhookへの送信に失敗しました:', response.status, await response.text());
      alert(t('webhook-send-error'));
    }
  } catch (error) {
    console.error('Discord Webhookへの送信中にエラーが発生しました:', error);
    alert(t('webhook-send-error'));
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
      alert(`全画面表示にできませんでした: ${err.message} (${err.name})`);
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
    alert(t('settings-webhook-test-no-url'));
    return;
  }

  testBtn.disabled = true;
  const originalText = testBtn.textContent;
  testBtn.textContent = t('settings-webhook-test-sending');

  const embed = {
    title: '✅ 接続テスト',
    description: 'このメッセージが表示されれば、Webhookの設定は正常です！',
    color: 0x4caf50, // Green
    footer: { text: 'Splatoon 3 Weapon Roulette' },
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: `${t('webhook-test-content')} ${mentionContent}`, embeds: [embed] }),
    });
    alert(response.ok ? t('settings-webhook-test-success') : t('settings-webhook-test-fail'));
  } catch (error) {
    alert(t('settings-webhook-test-fail'));
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

  if (isSystem) {
    messageEl.classList.add('system');
    messageEl.textContent = message; // System messages are simple text
  } else {
    // Regular messages (own or others)
    if (name === state.playerName) {
      messageEl.classList.add('own');
    }

    // Check for mentions and add highlight class
    const myName = state.playerName;
    if (myName && message.includes(`@${myName}`)) {
      messageEl.classList.add('mention');
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
  playerListEl.innerHTML = players.map(player => {
      const isMe = state.playerRef && player.id === state.playerRef.key;
      const meIndicator = isMe ? ` <span class="my-indicator" title="${t('realtime-you')}">👤</span>` : '';
      const hostIndicator = player.isHost ? ` <span class="host-icon" title="${t('realtime-host')}">👑</span>` : '';
      
      let adminControls = '';
      if (state.isHost && !player.isHost) {
          adminControls = `
            <div class="player-actions">
                <button class="btn-kick menu" data-action="admin-menu" data-player-id="${player.id}" data-player-name="${player.name}" title="${t('realtime-admin-menu')}">︙</button>
            </div>
          `;
      }

      return `
      <div class="player-item">
          <div class="player-name" data-player-name="${player.name}" title="${t('chat-mention-tooltip', { name: player.name })}">
            <span>${player.name}${meIndicator}${hostIndicator}</span>
          </div>
          ${adminControls}
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
    console.warn("Firebase is not configured. Real-time features will be disabled.");
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

    if (roomIdFromUrl) {
      roomIdInput.value = roomIdFromUrl;
    }
    if (passwordFromUrl) {
      roomPasswordInput.value = passwordFromUrl;
    }

    // 両方のパラメータが存在する場合、自動参加を試みる
    if (roomIdFromUrl && passwordFromUrl) {
      // 少し待ってから参加処理を開始することで、UIの準備が整うのを待つ
      setTimeout(() => {
        // プレイヤー名がlocalStorageなどから読み込まれていれば、自動で参加処理を実行
        if (playerNameInput.value.trim()) {
          joinRoomBtn.click();
        } else {
          // プレイヤー名が未入力の場合は、入力を促す
          showToast(t('realtime-autojoin-name-required'));
          playerNameInput.focus();
        }
      }, 500); // 500msの遅延
    }
  } catch (error) {
    console.error("Firebase initialization failed:", error);
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
    if (!state.isHost || !state.roomRef) return;    
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
    if (!state.isHost || !state.roomRef) return;    
    state.roomRef.child('blockedNames').push(playerName);
    const message = t('system-player-blocked', { name: playerName, host: state.playerName });
    state.roomRef.child('chat').push({ name: null, message, isSystem: true, timestamp: firebase.database.ServerValue.TIMESTAMP });
    state.roomRef.child('clients').child(playerId).remove();
}

function banPlayer(playerId, playerName) {
    if (!state.isHost || !state.roomRef) return;    
    const playerToBan = state.players.find(p => p.id === playerId);
    if (!playerToBan || !playerToBan.ip) return;

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
  if (!state.db) {
    alert("データベースに接続できません。ページをリロードして再度お試しください。");
    console.error("Firebase Database is not initialized. state.db is null.");
    return;
  }

  createRoomBtn.disabled = true;
  joinRoomBtn.disabled = true;
  createRoomBtn.textContent = t('realtime-creating-btn');

  const reEnableButtons = () => {
    createRoomBtn.disabled = false;
    joinRoomBtn.disabled = false;
    createRoomBtn.textContent = t('realtime-create-btn');
    joinRoomBtn.textContent = t('realtime-join-btn');
  };

  const name = playerNameInput.value.trim();
  if (!name) {
    alert(t('player-name-required'));
    reEnableButtons();
    return;
  }
  state.playerName = name;

  const ip = await getIPAddress();
  try {
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
    await state.roomRef.set({
      createdAt: firebase.database.ServerValue.TIMESTAMP,
      lastActivity: firebase.database.ServerValue.TIMESTAMP,
      lastSpin: null,
      password: password,
    });

    state.playerRef = state.roomRef.child('clients').push({
      name: state.playerName,
      joinedAt: firebase.database.ServerValue.TIMESTAMP,
      ip: ip
    });
    state.playerRef.onDisconnect().remove();

    listenToRoomChanges();
    // ルーム作成時に現在のフィルター状態を書き込む
    updateFiltersOnFirebase();
  } catch (error) {
    console.error("Error creating room:", error);
    const detail = error.code ? `(${error.code})` : `(${error.message})`;
    alert(`${t('realtime-error-create')} ${detail}`);
    reEnableButtons();
  }
}

async function joinRoom() {
  createRoomBtn.disabled = true;
  joinRoomBtn.disabled = true;
  joinRoomBtn.textContent = t('realtime-joining-btn');

  const reEnableButtons = () => {
      createRoomBtn.disabled = false;
      joinRoomBtn.disabled = false;
      createRoomBtn.textContent = t('realtime-create-btn');
      joinRoomBtn.textContent = t('realtime-join-btn');
  };

  const name = playerNameInput.value.trim();
  if (!name) {
    alert(t('player-name-required'));
    reEnableButtons();
    return;
  }
  const roomId = roomIdInput.value.trim();
  if (!roomId) {
    reEnableButtons();
    return;
  }
  const password = roomPasswordInput.value.trim();
  if (!password) {
    alert(t('realtime-password-required'));
    reEnableButtons();
    return;
  }

  state.playerName = name;
  state.roomId = roomId;
  state.roomRef = state.db.ref(`rooms/${state.roomId}`);
  const ip = await getIPAddress();

  try {
    const snapshot = await state.roomRef.once('value');
    if (!snapshot.exists()) {
      alert(t('realtime-error-connect'));
      reEnableButtons();
      return;
    }

    const roomData = snapshot.val();

    // Check password
    if (roomData.password !== password) {
      alert(t('realtime-error-password'));
      reEnableButtons();
      return;
    }
    // Check for room expiration
    if (roomData.lastActivity && (Date.now() - roomData.lastActivity > ROOM_EXPIRATION_MS)) {
        alert(t('realtime-error-expired'));
        reEnableButtons();
        // Optionally, we could delete the room here, but it requires different permissions.
        // For now, just prevent joining.
        return;
    }

    // Check if banned by IP
    const bannedIPsSnapshot = await state.roomRef.child('bannedIPs').once('value');
    const bannedIPs = Object.values(bannedIPsSnapshot.val() || {});
    if (ip && bannedIPs.includes(ip)) {
        alert(t('realtime-error-banned-ip'));
        reEnableButtons();
        return;
    }

    // Check if blocked by name
    const blockedNamesSnapshot = await state.roomRef.child('blockedNames').once('value');
    const blockedNames = Object.values(blockedNamesSnapshot.val() || {});
    if (blockedNames.includes(name)) {
        alert(t('realtime-error-blocked'));
        reEnableButtons();
        return;
    }

    // ルームの最大人数をチェック
    const clients = roomData.clients || {};
    const clientCount = Object.keys(clients).length;
    if (clientCount >= 10) {
      // このメッセージは i18n.js に追加する必要があります。
      alert(t('realtime-error-full'));
      reEnableButtons();
      return;
    }

    state.playerRef = state.roomRef.child('clients').push({
      name: state.playerName,
      joinedAt: firebase.database.ServerValue.TIMESTAMP,
      ip: ip
    });
    state.playerRef.onDisconnect().remove();

    listenToRoomChanges();
  } catch (error) {
    console.error("Error joining room:", error);
    const detail = error.code ? `(${error.code})` : `(${error.message})`;
    alert(`${t('realtime-error-join')} ${detail}`);
    reEnableButtons();
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

  // 自分への通知（キック、BANなど）をリッスン
  const notificationRef = state.roomRef.child('notifications').child(state.playerRef.key);
  notificationRef.on('value', (snapshot) => {
    if (!snapshot.exists()) {
      return;
    }

    // 通知を受け取ったら、すぐにDBから削除して再発火を防ぐ
    notificationRef.remove();

    const { type, hostName } = snapshot.val();
    let messageKey = '';
    if (type === 'kick') messageKey = 'system-you-were-kicked';
    else if (type === 'ban') messageKey = 'system-you-were-banned';

    if (messageKey) {
      const message = t(messageKey, { host: hostName });

      // 他のリスナー（特に 'clients'）が発火する前に、すべてのリスナーを停止する
      if (state.roomRef) {
        state.roomRef.off();
      }

      // ユーザーに通知
      alert(message);

      // UIをリセットし、ルームから退出した状態にする
      handleLeaveRoom(false);
    }
  });
  let previousPlayers = {};
  let isInitialLoad = true;

  // 参加者リストの変更をリッスン
  state.roomRef.child('clients').on('value', (snapshot) => {
    const clients = snapshot.val() || {};

    if (!isInitialLoad && state.isHost) {
      handlePlayerChanges(clients, previousPlayers);
    }
    previousPlayers = clients;
    isInitialLoad = false;

    const playerArray = Object.entries(clients)
      .sort(([, a], [, b]) => a.joinedAt - b.joinedAt)
      .map(([key, val], index) => ({
        id: key,
        name: val.name,
        isHost: index === 0,
        ip: val.ip || null
      }));

    state.players = playerArray;
    updatePlayerList(playerArray);

    const me = playerArray.find(p => p.id === state.playerRef?.key);
    if (me) {
      const wasHost = state.isHost;
      state.isHost = me.isHost;
      if (state.isHost && !wasHost && playerArray.length > 1) {
        state.roomRef.child('chat').push({
          name: null,
          message: t('system-new-host', { name: me.name }),
          isSystem: true,
          timestamp: firebase.database.ServerValue.TIMESTAMP
        });
      }
      setRealtimeUiState(state.isHost ? 'in_room_host' : 'in_room_viewer');

      // ホストになったらパスワードを取得して、招待リンクを生成するためにUIを更新
      if (state.isHost) {
        state.roomRef.child('password').once('value').then(passSnapshot => {
          if (passSnapshot.exists()) {
            const password = passSnapshot.val();
            state.roomPassword = password;
            roomPasswordDisplay.textContent = password;
            // パスワードを取得できたので、招待リンクを含むUIを再描画
            setRealtimeUiState('in_room_host');
          }
        });
      }
    } else {
      // 自分が見つからない = キックされたか、自ら退出したか、ブロックされた
      handleLeaveRoom(false); // UIリセットのみ
    }
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
    if (currentPlayers[id]) {
      const message = t('system-player-joined', { name: currentPlayers[id].name });
      state.roomRef.child('chat').push({ name: null, message, isSystem: true, timestamp: firebase.database.ServerValue.TIMESTAMP });
    }
  });

  const leftPlayerIds = previousPlayerIds.filter(id => !currentPlayerIds.includes(id));
  leftPlayerIds.forEach(id => {
    if (previousPlayers[id]) {
      const message = t('system-player-left', { name: previousPlayers[id].name });
      state.roomRef.child('chat').push({ name: null, message, isSystem: true, timestamp: firebase.database.ServerValue.TIMESTAMP });
    }
  });
}

// --- リアルタイム連携 (Firebase) ------------------------------------

function setRealtimeUiState(uiState) {
    const spinBtn = $('#spinBtn');
    roomJoinUi.style.display = (uiState === 'disconnected' || uiState === 'error') ? 'flex' : 'none';
    roomInfoUi.style.display = (uiState.startsWith('in_room')) ? 'flex' : 'none';
    const inRoom = uiState.startsWith('in_room');
    const isHost = uiState === 'in_room_host';
    const isViewer = uiState === 'in_room_viewer';
    playerListContainer.style.display = inRoom ? 'block' : 'none';
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
    if (isHost && state.roomId && state.roomPassword) {
      const url = new URL(window.location.origin + window.location.pathname);
      url.searchParams.set('room', state.roomId);
      url.searchParams.set('password', state.roomPassword);
      inviteLinkDisplay.value = url.href;
      inviteLinkContainer.style.display = 'flex';
    } else {
      inviteLinkContainer.style.display = 'none';
    }
    playerNameInput.disabled = inRoom;

    // isViewerは、ルーム内の視聴者である場合にtrue。ローカルモードやホストの場合はfalse。
    // これを使ってホスト専用コントロールの有効/無効を一括で設定する。
    const disableHostControls = isViewer;

    // ホスト専用コントロール（スピン、リセット、人数設定、重複なし）
    $$('.host-control button, .host-control input').forEach(el => {
      el.disabled = disableHostControls;
    });
    // フィルターUI
    $$('#classFilters input, #classFilters button').forEach(el => {
      el.disabled = disableHostControls;
    });
}

function handleLeaveRoom(removeFromDb = true) {
  if (removeFromDb && state.playerRef) {
    state.playerRef.onDisconnect().cancel();
    state.playerRef.remove();
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
    state.roomRef.child('chat').push({
      name: state.playerName,
      message: message,
      timestamp: firebase.database.ServerValue.TIMESTAMP
    });
    chatInput.value = '';
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
  
  copyInviteLinkBtn.addEventListener('click', async () => {
    if (!inviteLinkDisplay.value) return;
    inviteLinkDisplay.select();
    try {
      await navigator.clipboard.writeText(inviteLinkDisplay.value);
      showToast(t('copied-to-clipboard'));
    } catch (err) {
      console.error('Failed to copy invite URL:', err);
      showToast(t('copy-failed'), 'error');
    }
  });
  roomIdDisplay.addEventListener('click', () => navigator.clipboard.writeText(state.roomId));
  chatSendBtn.addEventListener('click', sendChatMessage);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
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

    // If a menu button is clicked
    if (menuButton) {
        e.stopPropagation();
        if (!state.isHost) return;

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
        if (!state.isHost) return;
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

  systemThemeListener.addEventListener('change', handleSystemThemeChange);

  historyEl.addEventListener('click', handleDeleteHistoryItem);

  function createFilterChangeHandler(selector) {
    return function(e) {
      const checkboxes = $$(selector);
      const checkedCount = checkboxes.filter(cb => cb.checked).length;
      if (checkedCount === 0) {
        e.currentTarget.checked = true;
        return;
      }
      updatePool();
      saveSettings();
      if (state.isHost) {
        updateFiltersOnFirebase();
      }
    };
  }

  $('#classFilters').addEventListener('change', e => {
    const target = e.target;
    if (target.matches('input[data-class]')) createFilterChangeHandler('input[data-class]')(e);
    if (target.matches('input[data-sub]')) createFilterChangeHandler('input[data-sub]')(e);
    if (target.matches('input[data-sp]')) createFilterChangeHandler('input[data-sp]')(e);
  });

  noRepeat.addEventListener('change', () => {
    updatePool();
    saveSettings();
    if (state.isHost) {
      updateFiltersOnFirebase();
    }
  });

  $('#classFilters').addEventListener('click', e => {
    const toggleType = e.target.dataset.toggleAll;
    if (toggleType) {
      const checkboxes = $$(`input[data-${toggleType}]`);
      if (checkboxes.length === 0) return;

      const allCurrentlyChecked = checkboxes.every(cb => cb.checked);
      const newCheckedState = !allCurrentlyChecked;

      checkboxes.forEach(cb => cb.checked = newCheckedState);
      updatePool();
      saveSettings();
      if (state.isHost) {
        updateFiltersOnFirebase();
      }
    }
  });
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

  // Firebaseを常に初期化して、いつでもルーム作成・参加ができるようにする
  initFirebase();

  const params = new URLSearchParams(window.location.search);
  if (!params.has('room')) {
    // URLにルームIDがない場合（＝ローカルモードで起動した場合）、
    // ローカルの履歴を読み込む
    loadHistory();
    updatePool();
  }

  const savedName = localStorage.getItem('splaRoulettePlayerName') || '';
  playerNameInput.value = savedName;
  playerNameInput.addEventListener('input', () => {
    localStorage.setItem('splaRoulettePlayerName', playerNameInput.value);
    state.playerName = playerNameInput.value;
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
