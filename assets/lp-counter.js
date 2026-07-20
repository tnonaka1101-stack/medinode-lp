// 訪問カウンター（今日・昨日・累計）＋流入元の記録
// MediNodeアプリのAPI（/api/lp/visit）に記録し、フッターに小さく表示する。
// 計測は1ブラウザセッションにつき1回（sessionStorageで抑制）。数と流入元の名前だけを送り、
// IP・UA・URL全体などの個人情報は送らない（媒体は x/note/notion/line/direct 等の短い文字列）。
// APIが未設定・失敗のときは何も表示しないだけで、ページの動作には影響しない。
(async () => {
  // 流入元の判定（attribution.js と同じ対応表の最小版）。スクリプトの読み込み順に依存しないよう、
  // まず attribution.js が保存した値（mn_source）を見て、無ければ自前で utm_source→リファラーの順に判定する。
  const detectSource = () => {
    try {
      const stored = sessionStorage.getItem('mn_source');
      if (stored) return stored;
    } catch (e) { /* private mode 等は無視 */ }
    try {
      const q = new URLSearchParams(location.search).get('utm_source');
      if (q) return q.slice(0, 40);
    } catch (e) { /* 無視 */ }
    try {
      if (document.referrer) {
        const host = new URL(document.referrer).hostname.replace(/^www\./, '');
        if (host && host !== location.hostname) {
          const SEARCH_HOSTS = ['google.', 'bing.', 'yahoo.', 'duckduckgo.', 'baidu.', 'ecosia.'];
          if (SEARCH_HOSTS.some(function (s) { return host.indexOf(s) !== -1; })) return 'search';
          const map = {
            't.co': 'x', 'x.com': 'x', 'twitter.com': 'x',
            'note.com': 'note', 'note.mu': 'note',
            'notion.so': 'notion', 'notion.com': 'notion', 'notion.site': 'notion',
            'line.me': 'line', 'liff.line.me': 'line',
          };
          return map[host] || host.slice(0, 40);
        }
      }
    } catch (e) { /* referrer不正は無視 */ }
    return 'direct';
  };

  try {
    const API = 'https://medical-search-public.vercel.app/api/lp/visit';
    const counted = sessionStorage.getItem('mn_visited');
    const res = counted
      ? await fetch(API, { method: 'GET' })
      : await fetch(API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source: detectSource() }),
        });
    if (!res.ok) return;
    const d = await res.json();
    if (!counted) sessionStorage.setItem('mn_visited', '1');
    if (!d || !d.ok) return;
    const el = document.getElementById('visit-counter');
    if (el) el.textContent = `訪問者：今日 ${d.today}人・昨日 ${d.yesterday}人・累計 ${d.total}人`;
  } catch (e) { /* 表示しないだけ */ }
})();
