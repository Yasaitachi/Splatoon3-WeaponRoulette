// firebase-sync.js

const firebaseSync = (() => {
  // --- Firebase Configuration ---
  // ここにステップ1でコピーしたFirebaseプロジェクトの構成情報を貼り付けます
  const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID.firebaseio.com", // Realtime DatabaseのURL
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
  };

  let db;
  let roomRef;
  let chatRef;
  let typingRef;
  let roomId;
  let updateCallback = () => {};
  let chatCallback = () => {};
  let typingCallback = () => {};
  let isInitialized = false;
  let localUserId;

  // 部屋IDを生成するヘルパー関数
  const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 9);
  };

  // 状態をFirebaseに書き込む（スロットリング付きで連続更新を防ぐ）
  const throttledUpdate = (() => {
    let timeout;
    return (newState) => {
      if (!roomRef) return;
      clearTimeout(timeout);
      // spinStateがnullの場合は即時更新してアニメーションをリセット
      const isResettingSpin = newState.spinState === null;
      const delay = isResettingSpin ? 0 : 200;

      timeout = setTimeout(() => {
        roomRef.update(newState).catch(error => {
          console.error("Firebase update failed:", error);
        });
      }, delay);
    };
  })();

  const init = () => {
    try {
      // apiKeyがプレースホルダーのままなら初期化しない
      if (firebaseConfig.apiKey === "YOUR_API_KEY") {
        console.warn("Firebase is not configured. Real-time sync is disabled.");
        return;
      }
      firebase.initializeApp(firebaseConfig);
      db = firebase.database();
      isInitialized = true;
    } catch (e) {
      console.error("Firebase initialization failed. Please check your firebaseConfig.", e);
      return;
    }

    // ユーザーIDを生成/取得 (チャットの識別に利用)
    localUserId = localStorage.getItem('splat-roulette-userId');
    if (!localUserId) {
        localUserId = 'user_' + Math.random().toString(36).substring(2, 11);
        localStorage.setItem('splat-roulette-userId', localUserId);
    }

    // URLハッシュからルームIDを取得、なければ新規作成してURLにセット
    roomId = window.location.hash.substring(1);
    if (!roomId) {
      roomId = generateRoomId();
      window.location.hash = roomId;
    }

    roomRef = db.ref('rooms/' + roomId);
    chatRef = db.ref('rooms/' + roomId + '/chat');
    typingRef = db.ref('rooms/' + roomId + '/typing');

    // UIにルーム情報を表示
    const roomInfoDiv = document.getElementById('room-info');
    const roomUrlInput = document.getElementById('roomUrl');
    const copyUrlBtn = document.getElementById('copyRoomUrlBtn');
    
    roomInfoDiv.style.display = 'flex';
    const roomUrl = window.location.href;
    roomUrlInput.value = roomUrl;

    copyUrlBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(roomUrl).then(() => {
        alert(i18n.t('copy-room-url-success'));
      });
    });

    // データベースの変更をリッスンし、コールバックを呼び出す
    roomRef.on('value', (snapshot) => {
      const state = snapshot.val();
      if (state) {
        updateCallback(state);
      }
    });

    // チャットメッセージの変更をリッスン (新しいメッセージのみ取得)
    chatRef.limitToLast(50).on('child_added', (snapshot) => {
        chatCallback(snapshot.key, snapshot.val());
    });

    // タイピング状態の変更をリッスン
    typingRef.on('value', (snapshot) => {
        typingCallback(snapshot.val());
    });
  };

  // script.jsからUI更新用のコールバックを登録する関数
  const onStateUpdate = (callback) => {
    if (typeof callback === 'function') {
      updateCallback = callback;
    }
  };

  // チャット更新用のコールバックを登録する関数
  const onChatUpdate = (callback) => {
    if (typeof callback === 'function') {
      chatCallback = callback;
    }
  };

  // タイピング状態更新用のコールバックを登録する関数
  const onTypingUpdate = (callback) => {
    if (typeof callback === 'function') {
      typingCallback = callback;
    }
  };

  // script.jsから状態の更新をトリガーする関数
  const updateState = (newState) => {
    if (!isInitialized) return;
    throttledUpdate(newState);
  };

  // チャットメッセージを送信する関数
  const sendChatMessage = (message) => {
      if (!isInitialized || !chatRef) return;
      chatRef.push(message).catch(error => console.error("Failed to send chat message:", error));
  };

  // タイピング状態を更新する関数
  const updateTypingStatus = (username) => {
      if (!isInitialized || !typingRef) return;
      typingRef.child(localUserId).set(username); // usernameがnullなら削除される
  };
  
  // 新規ルームの場合に初期状態を設定する関数
  const setInitialState = (initialState) => {
    if (!isInitialized || !roomRef) return;
    roomRef.once('value', (snapshot) => {
        if (!snapshot.exists()) {
            roomRef.set(initialState);
        }
    });
  };

  return {
    init,
    onStateUpdate,
    updateState,
    setInitialState,
    onChatUpdate,
    onTypingUpdate,
    sendChatMessage,
    updateTypingStatus,
    getLocalUserId: () => localUserId,
  };
})();