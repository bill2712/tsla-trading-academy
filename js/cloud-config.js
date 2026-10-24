/* =========================================================
 * 雲端同步設定（Firebase：同 nursing-tracker 共用 nursing-declan 專案）
 * 想加／減可以登入嘅人：改 members，同時改 firestore.rules 入面嘅 email 清單，
 * 再喺 Firebase Console → Firestore → 規則 貼上新規則。
 * Firebase Web 設定唔係密碼，可以公開；真正保護資料嘅係 Firestore 規則。
 * ========================================================= */
window.CLOUD_CONFIG = {
  firebase: {
    apiKey: 'AIzaSyAnd5uPKtOgjTgjXfoQgaNMsB8pSym9kKI',
    authDomain: 'nursing-declan.firebaseapp.com',
    projectId: 'nursing-declan',
    storageBucket: 'nursing-declan.firebasestorage.app',
    messagingSenderId: '693386476485',
    appId: '1:693386476485:web:713ed9b5dd866f132669ac',
  },
  members: [
    { email: 'bill27122002@gmail.com', name: '爸爸', emoji: '👨', color: '#2563eb' },
    { email: 'ivantsang24@gmail.com', name: 'Ivan', emoji: '👦', color: '#059669' },
  ],
};
