/* =========================================================
 * 雲端同步設定（Firebase 專案：tsla-academy，學院專用）
 * 想加／減可以登入嘅人：改 members，同時改 firestore.rules 入面嘅 email 清單，
 * 再喺 Firebase Console → Firestore → 規則 貼上新規則。
 * Firebase Web 設定唔係密碼，可以公開；真正保護資料嘅係 Firestore 規則。
 * ========================================================= */
window.CLOUD_CONFIG = {
  firebase: {
    apiKey: 'AIzaSyA7NMEkYZZ5DsEDZJlDbAvkyHCLgt8KPTk',
    authDomain: 'tsla-academy.firebaseapp.com',
    projectId: 'tsla-academy',
    storageBucket: 'tsla-academy.firebasestorage.app',
    messagingSenderId: '901270351749',
    appId: '1:901270351749:web:7bee5caf5747df0b361eec',
  },
  members: [
    { email: 'bill27122002@gmail.com', name: 'Bill', emoji: '🧑', color: '#2563eb', legacy: { name: '爸爸', emoji: '👨' } },
    { email: 'ivantsang24@gmail.com', name: 'Ivan', emoji: '👦', color: '#059669' },
    { email: 'tsangtszman2008@gmail.com', name: 'Man', emoji: '😎', color: '#ea580c' },
    { email: 'patrickfan94@gmail.com', name: '志強', emoji: '🐼', color: '#7c3aed' },
  ],
};
