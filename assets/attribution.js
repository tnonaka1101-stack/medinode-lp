// 流入元の橋渡し（LP → アプリ本体）
//
// 目的: XやnoteからLPに来た人がアプリへ進んだとき、「元はどの媒体か」を
// アプリ側の解析（Vercel Web Analytics）でも見分けられるようにする。
//
// 仕組み:
//   1. LP着地時に流入元を判定する。優先順位は
//      URLの ?utm_source=◯◯（配布リンクに明示されたもの）＞ 外部リファラー（t.co=X など）。
//   2. 判定結果を sessionStorage に保存する（LP内を回遊してリファラーがLP自身に
//      変わっても、最初の流入元を持ち続けるため）。
//   3. ページ内のアプリ本体へのリンク全部に utm_source と utm_medium=lp を付け足す。
//
// 個人情報は扱わない（媒体名の文字列だけ）。失敗してもリンクは素のまま動く。
(() => {
  const APP_ORIGIN = 'https://medical-search-public.vercel.app';
  const KEY = 'mn_source';

  // リファラーのホスト名 → 媒体名。ここに無い外部サイトはホスト名をそのまま使う。
  const REFERRER_MAP = {
    't.co': 'x',
    'x.com': 'x',
    'twitter.com': 'x',
    'note.com': 'note',
    'note.mu': 'note',
    'notion.so': 'notion',
    'notion.com': 'notion',
    'notion.site': 'notion',
    'line.me': 'line',
    'liff.line.me': 'line',
    'l.instagram.com': 'instagram',
    'instagram.com': 'instagram',
    'youtube.com': 'youtube',
    'youtu.be': 'youtube',
  };

  const detect = () => {
    // 明示されたutm_sourceが最優先（今後LINE配布リンク等に付ける想定）。
    const fromQuery = new URLSearchParams(location.search).get('utm_source');
    if (fromQuery) return fromQuery.slice(0, 40);
    // 保存済みならそれを使う（LP内回遊で上書きしない）。
    const stored = sessionStorage.getItem(KEY);
    if (stored) return stored;
    // 外部リファラーから推定。LP自身からの遷移は対象外。
    try {
      if (document.referrer) {
        const host = new URL(document.referrer).hostname.replace(/^www\./, '');
        if (host && host !== location.hostname) {
          return REFERRER_MAP[host] || host.slice(0, 40);
        }
      }
    } catch { /* referrer不正は無視 */ }
    return null; // 直接訪問・リファラー無し（LINEアプリ内ブラウザ等）
  };

  let source = null;
  try {
    source = detect();
    if (source) sessionStorage.setItem(KEY, source);
  } catch { /* プライベートブラウズ等でstorage不可でも続行 */ }

  // アプリ本体へのリンクにutmを付け足す。既にutm_sourceが付いているリンクは尊重する。
  const decorate = () => {
    document.querySelectorAll(`a[href^="${APP_ORIGIN}"]`).forEach((a) => {
      try {
        const u = new URL(a.href);
        if (!u.searchParams.has('utm_source')) {
          u.searchParams.set('utm_source', source || 'direct');
        }
        if (!u.searchParams.has('utm_medium')) {
          u.searchParams.set('utm_medium', 'lp');
        }
        a.href = u.toString();
      } catch { /* 個々のリンクの失敗は無視 */ }
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', decorate);
  } else {
    decorate();
  }
})();
