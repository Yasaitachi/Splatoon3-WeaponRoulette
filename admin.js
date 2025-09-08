// --- Firebase Configuration (from script.js) ---
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

// --- Admin Settings (from script.js) ---
const ROOM_LIFETIME_MS = 3 * 60 * 60 * 1000; // 3時間 (from script.js)
const ADMIN_USER_IDS = ['32dc0cf4-6acd-4078-b16a-f3a56e0fac72'];

// --- Global State ---
const state = {
  db: null,
  lang: 'ja',
  theme: 'system',
  rooms: [],
  users: [],
  bannedUsers: [],
  userHostNames: {},
  activeListeners: {
    members: null,
    chat: null,
  },
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function getPersistentUserId() {
  return localStorage.getItem('persistentUserId');
}

function checkAdminAccess() {
  const userId = getPersistentUserId();
  if (!userId || !ADMIN_USER_IDS.map(id => id.toLowerCase()).includes(userId.toLowerCase())) {
    alert('アクセス権がありません。\nメインページにリダイレクトします。');
    window.location.href = 'index.html';
    return false;
  }
  return true;
}

function t(key, replacements = {}) {
  let text = translations[state.lang]?.[key] || translations['en']?.[key] || key;
  for (const [k, v] of Object.entries(replacements)) {
    text = text.replace(`{${k}}`, v);
  }
  return text;
}

function showToast(message, type = 'info', duration = 3000) {
  const toastContainer = document.getElementById('toast-container');
  if (!toastContainer) return;

  const toast = document.createElement('div');
  // Use main app's classes for consistency
  toast.className = `toast ${type}`;
  toast.textContent = message;

  const progressBar = document.createElement('div');
  progressBar.className = 'toast-progress-bar';
  progressBar.style.animationDuration = `${duration}ms`;
  toast.appendChild(progressBar);

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  setTimeout(() => {
    toast.classList.remove('show');
    toast.addEventListener('transitionend', () => toast.remove());
  }, duration);
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
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
}

function applyTheme(theme) {
  state.theme = theme;
  const radio = $(`input[name="theme"][value="${theme}"]`);
  if (radio) radio.checked = true;
  const systemThemeListener = window.matchMedia('(prefers-color-scheme: dark)');
  if (theme === 'system') {
    document.documentElement.dataset.theme = systemThemeListener.matches ? 'dark' : 'light';
  } else {
    document.documentElement.dataset.theme = theme;
  }
  localStorage.setItem('splaRouletteAdminTheme', theme);
}

function renderSummary() {
  $('#active-rooms-count').textContent = state.rooms.length;

  const playersInRooms = state.rooms.reduce((total, room) => {
    if (!room.clients) return total;
    return total + Object.keys(room.clients).length;
  }, 0);
  $('#players-in-rooms-count').textContent = playersInRooms;

  const onlineUsers = state.users.filter(u => u.status?.isOnline);
  $('#online-users-count').textContent = onlineUsers.length;
  $('#total-users-count').textContent = state.users.length;
  $('#banned-users-count').textContent = state.bannedUsers.length;
}

function renderRooms() {
  const tbody = $('#rooms-table tbody');
  if (!tbody) return;

  tbody.innerHTML = state.rooms.map(room => {
    const hostName = state.userHostNames[room.hostId] || '...';
    const createdAt = new Date(room.createdAt).toLocaleString();
    return `
      <tr data-room-id="${room.id}">
        <td>
          ${room.id}
        </td>
        <td>${room.password || '----'}</td>
        <td>${room.playerCount || 0}</td>
        <td>${hostName}</td>
        <td>${createdAt}</td>
        <td class="room-remaining-time" data-created-at="${room.createdAt}">--:--:--</td>
        <td>
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            <button class="btn-admin-action" data-action="view-members" data-room-id="${room.id}">${t('admin-view-members')}</button>
            <button class="btn-admin-action" data-action="view-chat" data-room-id="${room.id}">${t('admin-view-chat')}</button>
            <button class="btn-admin-action danger" data-action="dissolve-room" data-room-id="${room.id}">${t('admin-room-dissolve')}</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

async function sendAnnouncement() {
  const messageInput = $('#announcement-message');
  const durationInput = $('#announcement-duration');
  
  const message = messageInput.value.trim();
  const duration = parseInt(durationInput.value, 10) * 1000; // convert to ms

  if (!message) {
    showToast(t('admin-announcement-error-no-message'), 'error');
    return;
  }
  if (isNaN(duration) || duration < 5000 || duration > 60000) {
      showToast(t('admin-announcement-error-duration'), 'error');
      return;
  }

  if (!confirm(t('admin-announcement-confirm'))) return;

  const announcementData = {
    message: message,
    duration: duration,
    sender: state.users.find(u => u.id === getPersistentUserId())?.name || 'Admin',
    timestamp: firebase.database.ServerValue.TIMESTAMP
  };

  try {
    await state.db.ref('announcements').push(announcementData);
    showToast(t('admin-announcement-success'), 'success');
    messageInput.value = '';
  } catch (error) {
    console.error('Failed to send announcement:', error);
    showToast(t('admin-announcement-fail'), 'error');
  }
}

function renderUsers() {
  const tbody = $('#users-table tbody');
  if (!tbody) return;

  // 1. Create a map of user ID to room ID for quick lookup
  const userRoomMap = new Map();
  state.rooms.forEach(room => {
    if (room.clients) {
      Object.keys(room.clients).forEach(userId => {
        userRoomMap.set(userId, room.id);
      });
    }
  });

  // 2. Sort users: online first, then by last seen
  const sortedUsers = [...state.users].sort((a, b) => {
    const aOnline = a.status?.isOnline;
    const bOnline = b.status?.isOnline;
    if (aOnline && !bOnline) return -1;
    if (!aOnline && bOnline) return 1;
    return (b.status?.lastSeen || 0) - (a.status?.lastSeen || 0);
  });

  // 3. Generate table rows
  tbody.innerHTML = sortedUsers.map(user => {
    const isOnline = user.status?.isOnline;
    const statusClass = isOnline ? 'online' : 'offline';
    const statusText = isOnline ? t('friends-online') : t('friends-offline');
    const lastSeen = user.status?.lastSeen ? new Date(user.status.lastSeen).toLocaleString() : 'N/A';
    const lastIP = user.status?.lastIP || 'N/A';
    const roomId = userRoomMap.get(user.id) || '—';
    const isBanned = state.bannedUsers.includes(user.id);
    const isDisplayedUserAdmin = ADMIN_USER_IDS.map(id => id.toLowerCase()).includes(user.id.toLowerCase());

    let actionButtons = '';
    if (!isDisplayedUserAdmin) { // Don't show actions for other admins
        const banButton = isBanned
            ? `<button class="btn-admin-action" data-action="unban-user" data-user-id="${user.id}" data-user-name="${user.name}">${t('admin-user-unban')}</button>`
            : `<button class="btn-admin-action danger" data-action="ban-user" data-user-id="${user.id}" data-user-name="${user.name}">${t('admin-user-ban')}</button>`;
        actionButtons = `
            <button class="btn-admin-action" data-action="change-id" data-user-id="${user.id}" data-user-name="${user.name}" data-user-short-id="${user.shortId}">${t('admin-user-change-id')}</button>
            ${banButton}
            <button class="btn-admin-action danger" data-action="delete-user" data-user-id="${user.id}" data-user-name="${user.name}" data-user-short-id="${user.shortId}">${t('admin-user-delete')}</button>
        `;
    }

    return `
      <tr data-user-id="${user.id}">
        <td><span class="online-status ${statusClass}" title="${statusText}"></span></td>
        <td>${user.name || 'N/A'}</td>
        <td>#${user.shortId || '-----'}</td>
        <td>${roomId}</td>
        <td>${lastSeen}</td>
        <td>${lastIP}</td>
        <td><div style="display: flex; gap: 6px;">${actionButtons}</div></td>
      </tr>
    `;
  }).join('');
}

async function changeUserShortId(userId, userName, currentShortId, event = {}) {
  const newShortId = prompt(t('admin-user-change-id-prompt', { name: userName, currentId: currentShortId }));
  if (newShortId === null) return; // User cancelled

  const trimmedNewId = newShortId.trim();

  // Validate new ID format
  if (!/^\d{5}$/.test(trimmedNewId)) {
    showToast(t('admin-user-id-invalid'), 'error');
    return;
  }

  if (trimmedNewId === currentShortId) {
    return; // No change
  }

  if (!event.shiftKey && !confirm(t('admin-user-change-id-confirm', { name: userName, newId: trimmedNewId }))) return;

  try {
    const shortIdMapRef = state.db.ref('shortIdMap');

    // Check if the new ID is already taken by another user
    const newIdMapSnapshot = await shortIdMapRef.child(trimmedNewId).once('value');
    if (newIdMapSnapshot.exists() && newIdMapSnapshot.val() !== userId) {
      showToast(t('admin-user-id-taken', { newId: trimmedNewId }), 'error');
      return;
    }

    const updates = {};
    if (currentShortId && currentShortId !== '-----') {
      updates[`shortIdMap/${currentShortId}`] = null;
    }
    updates[`shortIdMap/${trimmedNewId}`] = userId;
    updates[`users/${userId}/shortId`] = trimmedNewId;

    await state.db.ref().update(updates);
    showToast(t('admin-user-change-id-success', { name: userName, newId: trimmedNewId }), 'success');
  } catch (error) {
    console.error(`Failed to change ID for user ${userName}:`, error);
    showToast(t('admin-user-change-id-fail', { name: userName }), 'error');
  }
}

async function deleteUserAccount(userId, userName, shortId, event = {}) {
    if (!event.shiftKey && !confirm(t('admin-user-delete-confirm', { name: userName, id: shortId }))) return;

    try {
        const updates = {};
        updates[`/users/${userId}`] = null;
        if (shortId && shortId !== '-----') {
            updates[`/shortIdMap/${shortId}`] = null;
        }
        updates[`/bannedUsers/${userId}`] = null;

        await state.db.ref().update(updates);
        showToast(t('admin-user-delete-success', { name: userName }), 'success');
    } catch (error) {
        console.error(`Failed to delete user ${userName}:`, error);
        showToast(t('admin-user-delete-fail', { name: userName }), 'error');
    }
}

async function banUser(userId, userName, event = {}) {
  if (!event.shiftKey && !confirm(t('admin-user-ban-confirm', { name: userName }))) return;

  const adminId = getPersistentUserId();
  const userSnap = await state.db.ref(`users/${userId}`).once('value');
  const userData = userSnap.val();

  if (!userData) {
    showToast('User data not found.', 'error');
    return;
  }

  const banData = {
    name: userData.name,
    shortId: userData.shortId,
    bannedAt: firebase.database.ServerValue.TIMESTAMP,
    bannedBy: adminId,
    ip: userData.status?.lastIP || null,
  };

  try {
    await state.db.ref(`bannedUsers/${userId}`).set(banData);
    showToast(t('admin-user-ban-success', { name: userName }), 'success');
  } catch (error) {
    console.error(`Failed to ban user ${userName}:`, error);
    showToast(t('admin-user-ban-fail', { name: userName }), 'error');
  }
}

async function unbanUser(userId, userName, event = {}) {
  if (!event.shiftKey && !confirm(t('admin-user-unban-confirm', { name: userName }))) return;

  try {
    await state.db.ref(`bannedUsers/${userId}`).remove();
    showToast(t('admin-user-unban-success', { name: userName }), 'success');
  } catch (error) {
    console.error(`Failed to unban user ${userName}:`, error);
    showToast(t('admin-user-unban-fail', { name: userName }), 'error');
  }
}

async function dissolveRoom(roomId, event = {}) {
  if (!event.shiftKey && !confirm(t('admin-room-dissolve-confirm', { roomId }))) return;

  try {
    await state.db.ref(`rooms/${roomId}`).remove();
    showToast(t('admin-room-dissolve-success', { roomId }), 'success');
  } catch (error) {
    console.error(`Failed to dissolve room ${roomId}:`, error);
    showToast(t('admin-room-dissolve-fail', { roomId }), 'error');
  }
}

function detachActiveRoomListeners() {
  if (state.activeListeners.members) {
    const { ref, listener } = state.activeListeners.members;
    ref.off('value', listener);
    state.activeListeners.members = null;
  }
  if (state.activeListeners.chat) {
    const { ref, listener } = state.activeListeners.chat;
    ref.off('child_added', listener);
    state.activeListeners.chat = null;
  }
}

async function viewMembers(roomId) {
  detachActiveRoomListeners();
  const membersModal = $('#members-modal');
  const membersModalBody = $('#members-modal-body');
  if (!membersModal || !membersModalBody) return;

  membersModalBody.innerHTML = `<div class="loader-spinner" style="margin: 2rem auto;"></div>`;
  membersModal.style.display = 'flex';

  const clientsRef = state.db.ref(`rooms/${roomId}/clients`);
  const membersListener = clientsRef.on('value', (snapshot) => {
    const clients = snapshot.val();

    if (!clients || Object.keys(clients).length === 0) {
      membersModalBody.innerHTML = `<div class="empty">${t('admin-modal-no-members')}</div>`;
      return;
    }

    const memberList = Object.values(clients).map(client => `
      <div class="player-item">
        <div class="player-name">
          <span class="player-id-display">#${client.shortId || '-----'}</span>
          <span>${client.name}</span>
        </div>
        <div class="muted">${client.ip || 'IP N/A'}</div>
      </div>
    `).join('');
    membersModalBody.innerHTML = `<div class="player-list">${memberList}</div>`;
  }, (error) => {
      console.error(`Failed to listen to members for room ${roomId}:`, error);
      membersModalBody.innerHTML = `<div class="empty error">${t('error')}</div>`;
      detachActiveRoomListeners();
  });

  state.activeListeners.members = { ref: clientsRef, listener: membersListener };
}

async function viewChat(roomId) {
  detachActiveRoomListeners();
  const chatModal = $('#chat-modal');
  const chatModalBody = $('#chat-modal-body');
  if (!chatModal || !chatModalBody) return;

  chatModalBody.innerHTML = `<div class="loader-spinner" style="margin: 2rem auto;"></div>`;
  chatModal.style.display = 'flex';

  const renderMessage = (chat) => {
    const messageEl = document.createElement('div');
    messageEl.className = `admin-chat-item ${chat.isSystem ? 'system' : ''}`;
    messageEl.innerHTML = chat.isSystem ? `<span>${chat.message}</span>` : `
      <div class="admin-chat-main">
        <div class="admin-chat-header"><strong class="admin-chat-author">${chat.name}</strong></div>
        <div class="admin-chat-message">${chat.message}</div>
      </div>
      <div class="admin-chat-timestamp">${new Date(chat.timestamp).toLocaleTimeString()}</div>
    `;
    return messageEl;
  };

  const chatRef = state.db.ref(`rooms/${roomId}/chat`).limitToLast(100);
  const initialSnapshot = await chatRef.once('value');
  const initialChats = initialSnapshot.val();

  if (!initialChats) {
    chatModalBody.innerHTML = `<div class="empty">${t('admin-modal-no-chat')}</div>`;
  } else {
    chatModalBody.innerHTML = ''; // Clear loader
    Object.values(initialChats).sort((a, b) => a.timestamp - b.timestamp).forEach(chat => {
      chatModalBody.appendChild(renderMessage(chat));
    });
  }
  chatModalBody.scrollTop = chatModalBody.scrollHeight;

  const lastTimestamp = initialChats ? Math.max(...Object.values(initialChats).map(c => c.timestamp)) : 0;
  const newChatRef = state.db.ref(`rooms/${roomId}/chat`).orderByChild('timestamp').startAt(lastTimestamp + 1);

  const chatListener = newChatRef.on('child_added', (snapshot) => {
    chatModalBody.querySelector('.empty')?.remove();
    chatModalBody.appendChild(renderMessage(snapshot.val()));
    chatModalBody.scrollTop = chatModalBody.scrollHeight;
  });

  state.activeListeners.chat = { ref: newChatRef, listener: chatListener };
}

function updateRoomTimers() {
  const timerCells = $$('.room-remaining-time');
  timerCells.forEach(cell => {
    const createdAt = parseInt(cell.dataset.createdAt, 10);
    if (!createdAt) {
      cell.textContent = 'N/A';
      return;
    }

    const expiryTime = createdAt + ROOM_LIFETIME_MS;
    const now = Date.now();
    const remaining = expiryTime - now;

    if (remaining <= 0) {
      cell.textContent = t('admin-room-expired');
      cell.classList.add('muted');
      return;
    }

    const hours = Math.floor(remaining / (1000 * 60 * 60)).toString().padStart(2, '0');
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000).toString().padStart(2, '0');

    cell.textContent = `${hours}:${minutes}:${seconds}`;
    cell.classList.remove('muted');
  });
}

function listenToData() {
  const roomsRef = state.db.ref('rooms');
  roomsRef.on('value', snapshot => {
    const roomsData = snapshot.val() || {};
    const hostIds = new Set();
    state.rooms = Object.entries(roomsData)
      .filter(([, data]) => data) // Filter out null/falsy entries to prevent errors
      .map(([id, data]) => {
        if (data.hostId) hostIds.add(data.hostId);
        return {
          id, ...data,
          playerCount: data.clients ? Object.keys(data.clients).length : 0,
        };
      });

    // Fetch host names if not already fetched
    const newHostIds = [...hostIds].filter(id => !state.userHostNames[id]);
    if (newHostIds.length > 0) {
      const promises = newHostIds.map(id =>
        state.db.ref(`users/${id}/name`).once('value').then(snap => ({ id, name: snap.val() }))
      );
      Promise.all(promises).then(results => {
        results.forEach(({ id, name }) => {
          state.userHostNames[id] = name || 'Unknown';
        });
        renderRooms();
      });
    }

    renderRooms();
    renderUsers();
    renderSummary();
  });

  const usersRef = state.db.ref('users');

  // More efficient listeners for user data
  usersRef.on('child_added', (snapshot) => {
    const newUser = { id: snapshot.key, ...snapshot.val() };
    const index = state.users.findIndex(u => u.id === newUser.id);
    if (index === -1) {
      state.users.push(newUser);
    } else {
      state.users[index] = newUser; // Replace if already exists (should be rare)
    }
    renderUsers();
    renderSummary();
  });

  usersRef.on('child_changed', (snapshot) => {
    const updatedUser = { id: snapshot.key, ...snapshot.val() };
    const index = state.users.findIndex(u => u.id === updatedUser.id);
    if (index !== -1) {
      state.users[index] = updatedUser;
      renderUsers();
      renderSummary();
    }
  });

  usersRef.on('child_removed', (snapshot) => {
    state.users = state.users.filter(u => u.id !== snapshot.key);
    renderUsers();
    renderSummary();
  });

  const bannedUsersRef = state.db.ref('bannedUsers');
  bannedUsersRef.on('value', snapshot => {
    const bannedData = snapshot.val() || {};
    state.bannedUsers = Object.keys(bannedData);
    renderUsers();
    renderSummary();
  });
}

function init() {
  if (!checkAdminAccess()) return;

  // --- Initialize Firebase ---
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  state.db = firebase.database();

  // --- Load Settings and Apply Theme ---
  const savedLang = localStorage.getItem('splaRouletteSettings') ? JSON.parse(localStorage.getItem('splaRouletteSettings')).lang : 'ja';
  state.lang = savedLang;
  document.documentElement.lang = state.lang;

  const savedTheme = localStorage.getItem('splaRouletteAdminTheme') || 'system';
  applyTheme(savedTheme);

  // --- Setup Event Listeners ---
  $$('input[name="theme"]').forEach(radio => radio.addEventListener('change', (e) => applyTheme(e.target.value)));
  const systemThemeListener = window.matchMedia('(prefers-color-scheme: dark)');
  systemThemeListener.addEventListener('change', (e) => {
    if (state.theme === 'system') {
      document.documentElement.dataset.theme = e.matches ? 'dark' : 'light';
    }
  });

  // Add event listener for room actions
  $('#rooms-table')?.addEventListener('click', e => {
    const dissolveBtn = e.target.closest('[data-action="dissolve-room"]');
    if (dissolveBtn) {
      dissolveRoom(dissolveBtn.dataset.roomId, e);
      return;
    }
    const viewMembersBtn = e.target.closest('[data-action="view-members"]');
    if (viewMembersBtn) {
      viewMembers(viewMembersBtn.dataset.roomId);
      return;
    }
    const viewChatBtn = e.target.closest('[data-action="view-chat"]');
    if (viewChatBtn) {
      viewChat(viewChatBtn.dataset.roomId);
      return;
    }
  });

  // Add event listener for user actions
  $('#users-table')?.addEventListener('click', e => {
    const changeIdBtn = e.target.closest('[data-action="change-id"]');
    if (changeIdBtn) {
      changeUserShortId(changeIdBtn.dataset.userId, changeIdBtn.dataset.userName, changeIdBtn.dataset.userShortId, e);
      return;
    }

    const banBtn = e.target.closest('[data-action="ban-user"]');
    if (banBtn) {
      banUser(banBtn.dataset.userId, banBtn.dataset.userName, e);
      return;
    }

    const unbanBtn = e.target.closest('[data-action="unban-user"]');
    if (unbanBtn) {
      unbanUser(unbanBtn.dataset.userId, unbanBtn.dataset.userName, e);
      return;
    }

    const deleteUserBtn = e.target.closest('[data-action="delete-user"]');
    if (deleteUserBtn) {
      deleteUserAccount(deleteUserBtn.dataset.userId, deleteUserBtn.dataset.userName, deleteUserBtn.dataset.userShortId, e);
      return;
    }
  });

  // Modal close listeners
  const membersModal = $('#members-modal');
  const chatModal = $('#chat-modal');
  $('#close-members-modal').addEventListener('click', () => {
    detachActiveRoomListeners();
    membersModal.style.display = 'none';
  });
  membersModal.addEventListener('click', e => {
    if (e.target === membersModal) {
      detachActiveRoomListeners();
      membersModal.style.display = 'none';
    }
  });
  $('#close-chat-modal').addEventListener('click', () => {
    detachActiveRoomListeners();
    chatModal.style.display = 'none';
  });
  chatModal.addEventListener('click', e => {
    if (e.target === chatModal) {
      detachActiveRoomListeners();
      chatModal.style.display = 'none';
    }
  });

  $('#send-announcement-btn')?.addEventListener('click', sendAnnouncement);


  // --- Initial Render and Start Listening ---
  updateUIText();
  listenToData();
  setInterval(updateRoomTimers, 1000);
}

document.addEventListener('DOMContentLoaded', init);