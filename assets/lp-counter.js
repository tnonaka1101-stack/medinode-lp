// 訪問カウンター（今日・昨日・累計）
// MediNodeアプリのAPI（/api/lp/visit）に記録し、フッターに小さく表示する。
// 計測は1ブラウザセッションにつき1回（sessionStorageで抑制）。数だけを記録し、個人情報は送らない。
// APIが未設定・失敗のときは何も表示しないだけで、ページの動作には影響しない。
(async () => {
  try {
    const API = 'https://medical-search-public.vercel.app/api/lp/visit';
    const counted = sessionStorage.getItem('mn_visited');
    const res = await fetch(API, { method: counted ? 'GET' : 'POST' });
    if (!res.ok) return;
    const d = await res.json();
    if (!counted) sessionStorage.setItem('mn_visited', '1');
    if (!d || !d.ok) return;
    const el = document.getElementById('visit-counter');
    if (el) el.textContent = `訪問者：今日 ${d.today}人・昨日 ${d.yesterday}人・累計 ${d.total}人`;
  } catch (e) { /* 表示しないだけ */ }
})();
