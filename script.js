// --- グローバル変数 ---------------------------------------------------------

const RESET_TIMEOUT_MS = 10000; // 10秒
const state = {
  running: false,
  timer: null,
  pool: [],
  history: [],
  lastPick: null,
  interval: 50,
  lang: 'ja',
  theme: 'system',
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

// --- アプリケーションロジック ----------------------------------------------

function getWeaponName(weapon) {
  return state.lang === 'en' && weapon.name_en ? weapon.name_en : weapon.name;
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
  const totalItems = state.history.length;
  const batchIds = new Set(state.history.map(h => h.time));
  historyCount.textContent = `${batchIds.size}回 (${totalItems}ブキ)`;

  if (!totalItems) {
    historyEl.innerHTML = `<div class="empty" data-i18n-key="history-empty">${t('history-empty')}</div>`;
    return;
  }
  historyEl.innerHTML = state.history.map((h, index) => {
    const time = new Date(h.time);
    
    // 同じ回の抽選は線で区切る
    const isNewBatch = (index === 0) || (h.time !== state.history[index - 1].time);
    const batchClass = isNewBatch && index > 0 ? 'new-batch-separator' : '';

    // 複数人プレイの場合のみプレイヤー番号を表示
    const playerLabel = h.totalPlayers > 1 ? `P${h.playerNum}: ` : '';

    return `
      <div class="history-item ${batchClass}">
        <div style="flex-grow: 1;">
          <div class="history-weapon-name">${playerLabel}${getWeaponName(h)}</div>
          <div class="history-weapon-details muted">${t(h.sub)} / ${t(h.sp)}</div>
        </div>
        <div style="display:flex; gap: 6px; align-items:center;">
          <div class="muted" style="text-align:right; font-size: 11px; line-height: 1.3;">
            <div>${t(h.class)}</div>
            <div>${time.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
          </div>
          <button class="btn secondary icon" data-delete-index="${index}" data-i18n-title="history-delete-item" title="${t('history-delete-item')}">×</button>
        </div>
      </div>
    `;
  }).join('');
  // 履歴が追加されたら一番下までスクロールする
  historyEl.scrollTop = historyEl.scrollHeight;
}

function handleDeleteHistoryItem(e) {
  const target = e.target.closest('[data-delete-index]');
  if (!target) return;
  const index = parseInt(target.getAttribute('data-delete-index'), 10);
  state.history.splice(index, 1);
  renderHistory();
  saveHistory();
  updatePool();
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function setControlsDisabled(disabled) {
  // 全画面ボタンはルーレット実行中も操作可能にするため、無効化の対象から除外する
  $$('.controls button:not(#fullscreenBtn), .controls input, #history button').forEach(c => {
    c.disabled = disabled;
  });
  $$('#classFilters input').forEach(c => c.disabled = disabled);
}

/**
 * 1人分の抽選アニメーションを実行し、結果のブキオブジェクトを返す
 * @param {Array} pool - 抽選対象のブキ配列
 * @returns {Promise<Object|null>} - 抽選されたブキオブジェクト
 */
function runSingleAnimation(pool) {
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
                    const finalPick = lastPickForAnim ?? pickRandom(pool);
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
 * 抽選処理のメインフロー
 */
async function performDraw() {
  if (state.running) return;
  clearTimeout(showFinalResult.resetTimer); // 実行中のタイマーをクリア

  updatePool();
  const playerCount = parseInt(playerCountInput.value, 10);
  if (noRepeat.checked && state.pool.length < playerCount) {
    alert(t('no-candidates-alert', { poolCount: state.pool.length, playerCount: playerCount }));
    return;
  }
  if (state.pool.length === 0) {
    alert(t('no-candidates-alert-title'));
    return;
  }

  state.running = true;
  setControlsDisabled(true);

  const finalResults = [];
  const tempPool = [...state.pool];
  const drawTime = new Date().toISOString(); // この抽選グループのユニークID

  if (playerCount === 1) {
    const result = await runSingleAnimation(tempPool);
    if (result) {
      finalResults.push(result); // 履歴に追加
      pushHistoryItem(result, drawTime, 1, 1);
      await showFinalResult([result]); // 最終結果として表示
    }
  } else {
    for (let i = 0; i < playerCount; i++) {
      resultContainer.innerHTML = `
        <div id="resultName" class="name">${t('player-draw', { playerNum: i + 1 })}</div>
        <div id="resultDetails" class="details">${t('player-draw-wait')}</div>
      `;
      await new Promise(resolve => setTimeout(resolve, 1200));

      const result = await runSingleAnimation(tempPool);
      if (!result) break;

      pushHistoryItem(result, drawTime, i + 1, playerCount);
      await showFinalResult([result]); // 中間結果を一時的に表示
      await new Promise(resolve => setTimeout(resolve, 1500)); // 結果表示のためのポーズ

      finalResults.push(result);
      if (noRepeat.checked) {
        const index = tempPool.findIndex(item => item.name === result.name);
        if (index > -1) tempPool.splice(index, 1);
      }
    }
    // 複数人プレイの場合、最後に全結果をリスト表示
    if (finalResults.length > 0) {
      await showFinalResult(finalResults);
    }
  }

  if (finalResults.length > 0) {
    saveHistory(); // すべての抽選が終わった後に履歴を保存
    // 抽選が成功した場合にのみ、リセットタイマーを設定
    showFinalResult.resetTimer = setTimeout(() => {
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

function startSpin() {
  performDraw();
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
      nameEl.textContent = getWeaponName(results[i]);
      subSpEl.textContent = `${t(results[i].sub)} / ${t(results[i].sp)}`;
    }
  }
}

function resetAll() {
  state.running = false;
  state.timer && clearInterval(state.timer);
  clearTimeout(showFinalResult.resetTimer);

  state.history = [];
  noRepeat.checked = false;
  
  $$('#classFilters input[type="checkbox"]').forEach(i => i.checked = true);

  resultContainer.innerHTML = `
    <div id="resultName" class="name" data-i18n-key="reset-display-name">${t('reset-display-name')}</div>
    <div id="resultDetails" class="details" data-i18n-key="reset-display-class">${t('reset-display-class')}</div>
  `;
  
  updatePool();
  renderHistory();
  saveSettings();
  saveHistory();
}

function renderProbTable() {
  const probTable = document.getElementById('probTable');
  const pool = state.pool;
  if (!probTable) return;
  if (!pool.length) {
    probTable.innerHTML = `<tr><td class="muted" style="padding:8px;" data-i18n-key="prob-no-candidates">${t('prob-no-candidates')}</td></tr>`;
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

  systemThemeListener.addEventListener('change', handleSystemThemeChange);

  historyEl.addEventListener('click', e => {
    if (e.target.closest('[data-delete-index]')) {
      handleDeleteHistoryItem(e);
    }
  });

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
    };
  }

  $('#classFilters').addEventListener('change', e => {
    if (e.target.matches('input[data-class]')) createFilterChangeHandler('input[data-class]')(e);
    if (e.target.matches('input[data-sub]')) createFilterChangeHandler('input[data-sub]')(e);
    if (e.target.matches('input[data-sp]')) createFilterChangeHandler('input[data-sp]')(e);
  });

  noRepeat.addEventListener('change', () => {
    updatePool();
    saveSettings();
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
    }
  });
}

function init() {
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
  loadAndApplySettings();
  loadHistory();
  updatePool();
  setupEventListeners();
  // Initial UI text update is handled by loadAndApplySettings -> setLanguage
}

init();
