const translations = {
  ja: {
    // Realtime
    'realtime-title': 'オンライン連携',
    'realtime-player-name-placeholder': 'オンラインプレイで表示される名前',
    'realtime-join-placeholder': 'ルームID',
    'realtime-join-btn': '参加',
    'realtime-password-room': 'パスワード付き',
    'realtime-password-room-title': 'チェックを入れるとパスワード付きの部屋が作成されます',
    'realtime-password-placeholder': 'パスワード',
    'realtime-password-prompt': 'この部屋はパスワードで保護されています。\nパスワードを入力してください:',
    'realtime-password-incorrect': 'パスワードが違います。',
    'realtime-password-required': 'パスワード付きの部屋を作成するには、パスワードを入力してください。',
    'realtime-enter-room-id-alert': '参加するルームのIDを入力してください。',
    'realtime-error-expired': 'このルームは有効期限が切れています。',
    'realtime-error-full': 'このルームは満員です。',
    'realtime-error-name-taken': 'その名前は既に使用されています。',
    'realtime-error-name-blocked': 'あなたはこのルームへの参加がブロックされています。',
    'realtime-error-banned': 'あなたはこのルームから追放されています。',
    'room-list-join-btn': '参加',
    'error-fetch-room-list': 'ルーム一覧の取得に失敗しました。',
    'realtime-joining-btn': '参加中...',
    'realtime-leave-btn': '退出する',
    'realtime-create-btn': 'ルーム作成',
    'realtime-creating-btn': '作成中...',
    'realtime-error-create': 'ルームの作成に失敗しました。',
    'realtime-error-join': 'ルームへの参加に失敗しました。',
    'realtime-room-id': 'ルームID:',
    'realtime-copy-id': 'IDをコピー',
    'realtime-copy-id-success': 'ルームIDをコピーしました！',
    'realtime-host': 'ホスト',
    'realtime-error-connect': 'ルームに接続できませんでした。IDが正しいか確認してください。',
    'realtime-you': 'あなた',
    'realtime-reconnecting': 'サーバーに再接続しています...',

    // Header & Controls
    'app-title': 'スプラ3 ブキルーレット',
    'spin': '回す',
    'reset': 'リセット',
    'player-count': 'プレイヤー数',
    'no-repeat': 'ブキ重複なし',
    'no-repeat-title': '有効にすると、一度出たブキは履歴をリセットするまで抽選対象から除外されます',
    'fullscreen': '全画面表示',
    'exit-fullscreen': '全画面表示を終了',
    'fullscreen-toggle': '全画面表示切り替え',
    'settings': '設定',

    // Main Display
    'reset-display-name': '準備OK！',
    'reset-display-class': 'プレイヤー数を選択して「回す」を押してください',
    'current-candidates': '現在 {n}種類のブキから抽選 (確率: {prob}%)',
    'no-candidates-filter': 'フィルター条件に合うブキがありません',
    'player-draw': '{playerNum}人目の抽選',
    'player-draw-wait': '待機中...',
    'player-result-list': 'P{i}',

    // Alerts & Errors
    'no-candidates-alert': '重複なしモードですが、抽選対象のブキが{poolCount}種類しかなく、プレイヤー数({playerCount}人)に足りません。',
    'no-candidates-alert-title': '抽選対象のブキがありません。フィルター設定を確認してください。',
    'error': 'エラー',
    'player-name-required': 'オンライン機能を利用するにはプレイヤー名を入力してください。',
    'error-failed-draw': '抽選に失敗しました。',
    'error-copy-failed': 'クリップボードへのコピーに失敗しました。',
    'error-loading-weapons': 'ブキデータの読み込みに失敗しました。',

    // Filters
    'filter-title': 'ブキ絞り込み',
    'filter-class': 'ブキ種',
    'filter-sub': 'サブウェポン',
    'filter-special': 'スペシャルウェポン',
    'filter-toggle': 'すべて切り替え',

    // History
    'history-title': '抽選履歴',
    'history-count-value': '{batches}回 ({total}ブキ)',
    'history-empty': 'まだ履歴がありません',
    'history-delete-item': 'この項目を削除',

    // Admin Menu
    'realtime-kick-player': 'キック',
    'realtime-block-player': 'ブロック',
    'realtime-ban-player': '追放(BAN)',
    'realtime-transfer-host': 'ホスト権限を譲渡',
    'realtime-kick-confirm': '{name}さんをルームからキックしますか？',
    'realtime-block-confirm': '{name}さんをブロックしますか？\nブロックすると、このルームに再参加できなくなります。',
    'realtime-ban-confirm': '{name}さんを追放(BAN)しますか？\n追放すると、このルームに再参加できなくなり、IPアドレスも記録されます。',
    'realtime-transfer-host-confirm': '{name}さんにホスト権限を譲渡しますか？\nこの操作は取り消せません。',

    // Player List & Chat
    'player-list-title': '参加者',
    'player-list-count': '{count}人',
    'player-list-empty': '参加者がいません',
    'chat-title': 'チャット',
    'chat-placeholder': 'メッセージを入力',
    'chat-send-btn': '送信',
    'system-host-transferred': '[サーバー] ホスト権限が{oldHost}さんから{newHost}さんに譲渡されました。',

    // System Messages
    'system-new-host': '[サーバー] {name}さんが新しいホストになりました。',
    'system-player-joined': '[サーバー] {name}さんが参加しました。',
    'system-player-left': '[サーバー] {name}さんが退出しました。',

    // Probability Table
    'system-player-kicked': '[サーバー] {host}さんが{name}さんをキックしました。',
    'system-player-blocked': '[サーバー] {host}さんが{name}さんをブロックしました。',
    'system-player-banned': '[サーバー] {host}さんが{name}さんを追放しました。',
    'prob-title': '各ブキの排出確率',
    'prob-no-candidates': '対象ブキなし',
    'prob-weapon-name': 'ブキ名',
    'prob-class': 'ブキ種',
    'prob-sub': 'サブ',
    'prob-special': 'スペシャル',
    'prob-value': '確率',

    // Settings Modal
    'settings-title': '設定',
    'settings-close': '設定を閉じる',

    // General Settings
    'settings-general-title': '一般設定',
    'settings-auto-copy': '結果をクリップボードに自動コピー',
    'settings-auto-copy-help': '抽選完了後、結果をテキスト形式でクリップボードにコピーします。',
    'settings-theme': 'テーマ',
    'settings-theme-light': 'ライト',
    'settings-theme-dark': 'ダーク',
    'settings-theme-system': 'システム',
    'settings-language': '言語',
    'settings-language-ja': '日本語',
    'settings-language-en': 'English',

    // --- Webhook Settings UI ---
    'settings-webhook-title': 'Discord Webhook連携',
    'settings-webhook-desc': '抽選結果をDiscordチャンネルに自動で送信します。',
    'settings-webhook-enable': 'Webhookを有効にする',
    'settings-webhook-url': 'Webhook URL',
    'settings-webhook-template': 'カスタムメッセージ',
    'settings-webhook-template-placeholder': '空欄の場合、デフォルトのメッセージが送信されます。',
    'settings-webhook-template-help': 'メッセージを自由にカスタマイズできます。<br>使えるプレースホルダー: <code>{playerCount}</code> (プレイヤー数), <code>{weaponList}</code> (ブキリスト)',
    'settings-webhook-mentions': 'メンションするユーザーID',
    'settings-webhook-mentions-placeholder': 'ユーザーIDをカンマ(,)区切りで入力',
    'settings-webhook-mentions-help': '抽選結果を通知したいユーザーのIDをカンマ(,)区切りで入力します。メッセージの先頭でまとめてメンションが送信されます。Discordの「設定 > 詳細設定」から開発者モードを有効にすると、ユーザーを右クリックしてIDをコピーできます。',

    // --- Webhook Test ---
    'settings-webhook-test-send': '送信テスト',
    'settings-webhook-test-sending': '送信中...',
    'settings-webhook-test-success': 'テストメッセージを送信しました！Discordチャンネルを確認してください。',
    'settings-webhook-test-fail': '送信に失敗しました。URLが正しいか、Discordの権限設定などを確認してください。',
    'settings-webhook-test-no-url': 'テスト送信するにはWebhook URLを入力してください。',
    'webhook-test-content': 'Webhookのテスト送信です。',
    'webhook-test-embed-title': '✅ 接続テスト',
    'webhook-test-embed-desc': 'このメッセージが表示されれば、Webhookの設定は正常です！',

    // --- Webhook Result ---
    'webhook-send-error': 'Discordへの送信に失敗しました。設定モーダルからWebhook URLが正しいか確認してください。',
    'webhook-result-title': '🔫 ブキ抽選結果 ({playerCount}人分)',
    'webhook-result-field-value': 'サブ: {sub}\nスペシャル: {sp}',
    'webhook-result-sub-label': 'サブ',
    'webhook-result-sp-label': 'スペシャル',

    // Footer
    'footer-text': 'このツールは<a href="https://github.com/Yasaitachi/Splatoon3-WeaponRoulette" target="_blank" class="link">GitHub</a>にて無料で公開しています。',
  },
  en: {
    // Realtime
    'realtime-title': 'Online Sync',
    'realtime-player-name-placeholder': 'Name used for online play',
    'realtime-join-placeholder': 'Room ID',
    'realtime-join-btn': 'Join',
    'realtime-password-room': 'With Password',
    'realtime-password-room-title': 'Check to create a password-protected room',
    'realtime-password-placeholder': 'Password',
    'realtime-password-prompt': 'This room is password protected.\nPlease enter the password:',
    'realtime-password-incorrect': 'Incorrect password.',
    'realtime-password-required': 'Please enter a password to create a password-protected room.',
    'realtime-enter-room-id-alert': 'Please enter a Room ID to join.',
    'realtime-error-expired': 'This room has expired.',
    'realtime-error-full': 'This room is full.',
    'realtime-error-name-taken': 'That name is already taken.',
    'realtime-error-name-blocked': 'You are blocked from joining this room.',
    'realtime-error-banned': 'You are banned from this room.',
    'room-list-join-btn': 'Join',
    'error-fetch-room-list': 'Failed to fetch room list.',
    'realtime-joining-btn': 'Joining...',
    'realtime-leave-btn': 'Leave Room',
    'realtime-create-btn': 'Create Room',
    'realtime-creating-btn': 'Creating...',
    'realtime-error-create': 'Failed to create room.',
    'realtime-error-join': 'Failed to join room.',
    'realtime-room-id': 'Room ID:',
    'realtime-copy-id': 'Copy ID',
    'realtime-copy-id-success': 'Room ID copied!',
    'realtime-host': 'Host',
    'realtime-error-connect': 'Could not connect to the room. Please check the ID and try again.',
    'realtime-you': 'You',
    'realtime-reconnecting': 'Reconnecting to server...',

    // Header & Controls
    'app-title': 'Splatoon 3 Weapon Roulette',
    'spin': 'Spin',
    'reset': 'Reset',
    'player-count': 'Players',
    'no-repeat': 'No Duplicates',
    'no-repeat-title': 'When enabled, drawn weapons are excluded from the pool until the history is reset',
    'fullscreen': 'Fullscreen',
    'exit-fullscreen': 'Exit Fullscreen',
    'fullscreen-toggle': 'Toggle Fullscreen',
    'settings': 'Settings',

    // Main Display
    'reset-display-name': 'Ready!',
    'reset-display-class': 'Select number of players and press "Spin"',
    'current-candidates': '{n} weapons in pool (Prob: {prob}%)',
    'no-candidates-filter': 'No weapons match the filter criteria',
    'player-draw': 'Drawing for Player {playerNum}',
    'player-draw-wait': 'Waiting...',
    'player-result-list': 'P{i}',

    // Alerts & Errors
    'no-candidates-alert': 'No-duplicate mode is on, but the pool only has {poolCount} weapon(s), which is not enough for {playerCount} player(s).',
    'no-candidates-alert-title': 'There are no weapons to draw from. Please check your filter settings.',
    'error': 'Error',
    'player-name-required': 'Please enter a player name to use online features.',
    'error-failed-draw': 'Failed to draw a weapon.',
    'error-copy-failed': 'Failed to copy result to clipboard.',
    'error-loading-weapons': 'Failed to load weapon data.',

    // Filters
    'filter-title': 'Filter Weapons',
    'filter-class': 'Class',
    'filter-sub': 'Sub Weapon',
    'filter-special': 'Special Weapon',
    'filter-toggle': 'Toggle All',

    // History
    'history-title': 'Draw History',
    'history-count-value': '{batches} draws ({total} weapons)',
    'history-empty': 'No history yet',
    'history-delete-item': 'Delete this item',

    // Admin Menu
    'realtime-kick-player': 'Kick',
    'realtime-block-player': 'Block',
    'realtime-ban-player': 'Ban',
    'realtime-transfer-host': 'Transfer Host',
    'realtime-kick-confirm': 'Are you sure you want to kick {name} from the room?',
    'realtime-block-confirm': 'Are you sure you want to block {name}?\nThey will not be able to rejoin this room.',
    'realtime-ban-confirm': 'Are you sure you want to ban {name}?\nThey will not be able to rejoin, and their IP address will be recorded.',
    'realtime-transfer-host-confirm': 'Are you sure you want to transfer host privileges to {name}?\nThis action cannot be undone.',

    // Player List & Chat
    'player-list-title': 'Participants',
    'player-list-count': '{count} players',
    'player-list-empty': 'No one is in the room yet.',
    'chat-title': 'Chat',
    'chat-placeholder': 'Type a message',
    'chat-send-btn': 'Send',
    'system-host-transferred': '[Server] Host privileges were transferred from {oldHost} to {newHost}.',

    // System Messages
    'system-new-host': '[Server] {name} is the new host.',
    'system-player-joined': '[Server] {name} has joined.',
    'system-player-left': '[Server] {name} has left.',

    // Probability Table
    'system-player-kicked': '[Server] {name} was kicked by {host}.',
    'system-player-blocked': '[Server] {name} was blocked by {host}.',
    'system-player-banned': '[Server] {name} was banned by {host}.',
    'prob-title': 'Probability of each weapon',
    'prob-no-candidates': 'No candidates',
    'prob-weapon-name': 'Weapon',
    'prob-class': 'Class',
    'prob-sub': 'Sub',
    'prob-special': 'Special',
    'prob-value': 'Prob.',

    // Settings Modal
    'settings-title': 'Settings',
    'settings-close': 'Close settings',

    // General Settings
    'settings-general-title': 'General Settings',
    'settings-auto-copy': 'Auto-copy result to clipboard',
    'settings-auto-copy-help': 'After a draw is complete, automatically copy the result as text to the clipboard.',
    'settings-theme': 'Theme',
    'settings-theme-light': 'Light',
    'settings-theme-dark': 'Dark',
    'settings-theme-system': 'System',
    'settings-language': 'Language',
    'settings-language-ja': '日本語',
    'settings-language-en': 'English',

    // --- Webhook Settings UI ---
    'settings-webhook-title': 'Discord Webhook Integration',
    'settings-webhook-desc': 'Automatically send roulette results to a Discord channel.',
    'settings-webhook-enable': 'Enable Webhook',
    'settings-webhook-url': 'Webhook URL',
    'settings-webhook-template': 'Custom Message',
    'settings-webhook-template-placeholder': 'If empty, a default message will be sent.',
    'settings-webhook-template-help': 'You can customize the message freely.<br>Available placeholders: <code>{playerCount}</code> (number of players), <code>{weaponList}</code> (list of weapons)',
    'settings-webhook-mentions': 'User IDs to Mention',
    'settings-webhook-mentions-placeholder': 'Enter User IDs, separated by commas (,)',
    'settings-webhook-mentions-help': 'Enter the User IDs of the members you want to notify, separated by commas (,). All mentions will be sent together at the beginning of the message. You can copy a User ID by enabling Developer Mode in "Settings > Advanced" and right-clicking a user.',

    // --- Webhook Test ---
    'settings-webhook-test-send': 'Send Test',
    'settings-webhook-test-sending': 'Sending...',
    'settings-webhook-test-success': 'Test message sent! Please check your Discord channel.',
    'settings-webhook-test-fail': 'Failed to send. Please check if the URL is correct and check Discord permissions.',
    'settings-webhook-test-no-url': 'Please enter a Webhook URL to send a test message.',
    'webhook-test-content': 'This is a Webhook test message.',
    'webhook-test-embed-title': '✅ Connection Test',
    'webhook-test-embed-desc': 'If you can see this message, your Webhook is configured correctly!',

    // --- Webhook Result ---
    'webhook-send-error': 'Failed to send to Discord. Please check if the Webhook URL is correct in the settings modal.',
    'webhook-result-title': '🔫 Weapon Roulette Results ({playerCount} players)',
    'webhook-result-field-value': 'Sub: {sub}\nSpecial: {sp}',
    'webhook-result-sub-label': 'Sub',
    'webhook-result-sp-label': 'Special',

    // Footer
    'footer-text': 'This tool is available for free on <a href="https://github.com/Yasaitachi/Splatoon3-WeaponRoulette" target="_blank" class="link">GitHub</a>.',
  }
};