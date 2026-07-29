# 引き継ぎ: MediNodeプレミアム ブラッシュアップ作業

最終更新: 2026-07-29（Phase 1 本番デプロイ済みに更新）
このファイルは、新しいセッション（Claude／人間）が**これだけ読めば作業を再開できる**ことを目的とする。

---

## 1. プロジェクトの全体像

- **MediNode**: 医療者向けの知識アプリ。Notion×Algoliaで「自分のメモ・部署の知識・
  専門医のプレミアムナレッジ」を横断検索・クイズ化する。作者は救急・集中治療専門医のDr.ノード。
- **プレミアム（月980円）**: 専門医がメンテする医療ナレッジDB・参考文献DBの配信＋
  「集中治療医の実践（私はこうする）」＋臨床疑問の投稿→専門医回答ループ。
- リポジトリ:
  - `tnonaka1101-stack/medinode-lp` … LPサイト（このリポジトリ）。**書き込み可**。
  - `drnode0/medical-search-template` … アプリ本体（Next.js 16 / Supabase / Stripe / Algolia / vitest）。
    本番: https://medical-search-public.vercel.app/（mainへのプッシュでVercel自動デプロイ）。
    **ローカルクローン `~/medical-search-public` からの push は通る**（下記 §4 参照）。

## 2. これまでの成果物（すべて medinode-lp の `claude/medinode-premium-brushup-6kn2bg` ブランチ）

| ファイル | 内容 |
|---|---|
| `docs/premium-brushup-ideas.md` | 施策アイデア集 v2（継続率5本柱で深掘り）＋v3（静かな日常性・検索性）。ユーザーが編集している可能性あり——**必ず最新を読むこと** |
| `docs/premium-implementation-plan.md` | Phase 1〜7の実装計画＋Phase 1詳細設計（投稿ゼロの原因分析つき） |
| `docs/patches/0001-phase1-cq-inapp-submit.patch` | **Phase 1の実装本体**（アプリ本体への git am 用パッチ・検証済み） |
| `docs/patches/README.md` | パッチの適用＝デプロイ手順・環境変数・権限付与の方法 |
| `docs/HANDOFF.md` | このファイル |

## 3. Phase 1 実装の状態（**本番デプロイ済み・env待ちの暗転状態**）

> **2026-07-29 更新**: ローカルクローン `~/medical-search-public` から main（コミット dc8cd5e）へ
> push 済み・Vercel デプロイ完了。本番の `GET /api/cq/submit` が 200 `{"available":false}` を
> 返すことを確認（env 未設定時の想定どおりのフォールバック状態）。
> 受付DBには不足していた4列（投稿者職種／通知先ユーザーID／出典／投稿経路）を追加済み。
> **残りは Vercel の環境変数2つだけ**（§5 参照）。

**何を作ったか**: プレミアムへの臨床疑問投稿のアプリ内完結。
これまで「設定→外部Notionフォーム」だった投稿を、既存のCQキャプチャモーダルに
「⭐専門医に訊く」届け先として統合した。詳細仕様は implementation-plan の「Phase 1 詳細設計」。

- 新規: `src/app/api/cq/submit/route.ts`（会員判定・レート制限・受付DBへのNotion書き込み。
  GET＝受付可否probe）／`src/lib/cq-submit.ts`（純ロジック）／`src/lib/__tests__/cq-submit.test.ts`（18件）
- 変更: `src/components/CqCapture.tsx`（届け先チップ・状態別分岐・受領画面・ガイド刷新）／
  `src/components/SettingsPanel.tsx`（投稿ボタンをモーダル起動に）／`src/app/page.tsx`（0件導線・ツアー条件）
- **品質確認済み**: main=1b5bfac へのクリーン適用・tsc 0エラー・vitest 55ファイル429件全通過・
  next build成功・API手動スモーク（env未設定→available:false+503フォールバック、
  env設定→未ログイン401）まで確認。
- **段階公開の仕組み**: サーバーenv `CQ_INTAKE_NOTION_TOKEN` / `CQ_INTAKE_DB_ID`
  （受付DB＝現行Notionフォームと同じDB）を設定するまで、クライアントは自動で
  従来の外部フォーム案内にフォールバック。**envを入れた瞬間が公開**。

## 4. アプリ本体リポジトリへの書き込み権限（**解決済み**）

**結論（2026-07-29）**: 403 は旧セッションのサンドボックス環境
（tnonaka1101-stack の GitHub App 経由）に固有の問題だった。
オーナーの Mac 上のローカルクローン **`~/medical-search-public`** は drnode0 の認証で
push できる（Phase 1 はこの経路でデプロイ済み）。パッチ運用（docs/patches/）は
**歴史的経緯として残すだけで、今後は不要**。

- 今後のセッションは `~/medical-search-public` で作業して直接 push すればよい。
  作業前に必ず `git fetch origin main` してリベース（main の動きが速い）。
- サンドボックス環境（クラウド版等）で作業する場合のみ旧403問題が再発しうる。
  その場合の恒久対応: GitHubに **drnode0** でログイン → Settings → Applications →
  Installed GitHub Apps → Claude → `medical-search-template` を書き込み権限で追加。

## 5. 次のアクション（優先順）

1. ~~デプロイ確認~~ **完了**（2026-07-29、main dc8cd5e・本番probe確認済み）。
2. **env設定（オーナー作業・これだけでアプリ内投稿が公開される）**:
   Vercel → medical-search-public → Settings → Environment Variables に以下2つを追加。
   再デプロイ不要・次のリクエストから有効。
   - `CQ_INTAKE_DB_ID` = `88b5241c1cdc48228ae4a1ba3ed54120`
     （受付DB「❓ MediNode 臨床疑問受付_DB」のデータベースID・確認済み）
   - `CQ_INTAKE_NOTION_TOKEN` = 受付DBに「コンテンツを挿入」権限で接続した
     Notion Integration トークン（https://www.notion.so/my-integrations で発行し、
     受付DBのページで ••• → コネクト → 対象Integrationを接続）
   - 受付DBの推奨4列（投稿者職種／通知先ユーザーID／出典／投稿経路）は**追加済み**。
3. **Phase 2**: 未解決CQボード＋「私も気になる」投票（実装計画に詳細あり）。
   コールドスタート対策として**作者のセルフ投稿5〜10件**が必須である旨をユーザーに伝えること。
4. Phase 3以降は implementation-plan の順（ステータス可視化→検索性→静かな日常性→SRS同期→出口）。

## 6. アプリ本体のコードベース勘所（このセッションで学んだこと）

- **流儀**: 純ロジックを `src/lib/*.ts` に切り出し `src/lib/__tests__/` でvitest。
  コメントは「なぜ」を書く日本語。UIコピーは です・ます調で誠実（誇張・断定を避ける）。
- **会員判定**: サーバー側 `premium-access.ts` の `resolveRequestPremium()`／
  クライアント側 `algolia.ts` の `hasSubscriptionConfig()`（無料プレビュー中はfalse）。
- **レート制限**: `rate-limit.ts` の `rateLimitAsync(key, limit, windowMs)`（Upstash優先・インメモリfallback）。
- **段階公開**: `app_flags` の stage（off/preview/on）パターン＝ `daily-question.ts` 参照。
  Phase 1はenv有無で代替した。
- **公開ティーザーAPI**: 非会員に一部情報だけ返すパターン＝ `/api/resolved-cqs`（resolved-cqs.ts）。
  Phase 2の未解決CQ一覧はこれを踏襲する。
- **通知**: `push-send.ts` / `push-prefs.ts`。新着未読の3層設計は `author-additions.ts` に思想コメントあり。
- **CQキャプチャ**: `CqCapture.tsx`。Provider（`useCqCapture`=届け先が無ければnull／
  `useCqCaptureButton`=常時、hidden時のみnull）でタブ群を包む。0件画面・リーダー・設定から
  `open(prefill, source, intent)` で開く。intent: 'capture' | 'zero' | 'settings'。
- **検証コマンド**: `npx tsc --noEmit` / `npx vitest run` / `npm run build`（先に `npm ci`）。
- **注意**: mainの動きが速い（同日に20コミット等）。作業前に必ず `git fetch origin main` して
  リベースすること。Phase 1もその手順で1度リベース済み。

## 7. ユーザー（オーナー）について

- tnonaka1101-stack（LP側）と drnode0（アプリ側・Dr.ノード）は同一人物の別アカウント。
- 意向: プレミアムを「素晴らしいサービス」に。特に**継続率**と、
  「毎日義務ではないが開きたくなる・うるさくない・検索性が高い」体験を重視。
  投稿ゼロを悲しんでおり、CQループの復活が最優先事項。
- ドキュメントはユーザーが直接編集することがある。上書き前に必ず現物を読むこと。
