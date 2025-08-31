const translations = {
  ja: {
    // Realtime
    'realtime-title': 'リアルタイム連携',
    'realtime-join-placeholder': '12桁のルームID',
    'realtime-join-btn': '参加',
    'realtime-leave-btn': '退出する',
    'realtime-create-btn': 'ルーム作成',
    'realtime-room-id': 'ルームID:',
    'realtime-host': 'ホスト',
    'realtime-error-connect': 'ルームに接続できませんでした。IDが正しいか確認してください。',
    'realtime-player-name-placeholder': 'オンラインプレイで表示される名前',

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

    // Player List & Chat
    'player-list-title': '参加者',
    'player-list-count': '{count}人',
    'player-list-empty': '参加者がいません',
    'chat-title': 'チャット',
    'chat-placeholder': 'メッセージを入力',
    'chat-send-btn': '送信',

    // System Messages
    'system-new-host': '{name}さんが新しいホストになりました。',
    'system-player-joined': '{name}さんが参加しました。',
    'system-player-left': '{name}さんが退出しました。',

    // Probability Table
    'prob-title': '各ブキの排出確率',
    'prob-no-candidates': '対象ブキなし',
    'prob-weapon-name': 'ブキ名',
    'prob-class': '種別',
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
    'realtime-title': 'Real-time Sync',
    'realtime-join-placeholder': '12-digit Room ID',
    'realtime-join-btn': 'Join',
    'realtime-leave-btn': 'Leave Room',
    'realtime-create-btn': 'Create Room',
    'realtime-room-id': 'Room ID:',
    'realtime-host': 'Host',
    'realtime-error-connect': 'Could not connect to the room. Please check the ID and try again.',
    'realtime-player-name-placeholder': 'Name used for online play',

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

    // Player List & Chat
    'player-list-title': 'Participants',
    'player-list-count': '{count} players',
    'player-list-empty': 'No one is in the room yet.',
    'chat-title': 'Chat',
    'chat-placeholder': 'Type a message',
    'chat-send-btn': 'Send',

    // System Messages
    'system-new-host': '{name} is the new host.',
    'system-player-joined': '{name} has joined.',
    'system-player-left': '{name} has left.',

    // Probability Table
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