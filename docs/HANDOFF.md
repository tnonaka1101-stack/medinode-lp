# 引き継ぎ: MediNodeプレミアム ブラッシュアップ作業

最終更新: 2026-07-29
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
    **このセッション環境からは読み取り専用**（下記 §4 参照）。
    本番: https://medical-search-public.vercel.app/（mainへのプッシュでVercel自動デプロイ）。

## 2. これまでの成果物（すべて medinode-lp の `claude/medinode-premium-brushup-6kn2bg` ブランチ）

| ファイル | 内容 |
|---|---|
| `docs/premium-brushup-ideas.md` | 施策アイデア集 v2（継続率5本柱で深掘り）＋v3（静かな日常性・検索性）。ユーザーが編集している可能性あり——**必ず最新を読むこと** |
| `docs/premium-implementation-plan.md` | Phase 1〜7の実装計画＋Phase 1詳細設計（投稿ゼロの原因分析つき） |
| `docs/patches/0001-phase1-cq-inapp-submit.patch` | **Phase 1の実装本体**（アプリ本体への git am 用パッチ・検証済み） |
| `docs/patches/README.md` | パッチの適用＝デプロイ手順・環境変数・権限付与の方法 |
| `docs/HANDOFF.md` | このファイル |

## 3. Phase 1 実装の状態（完成・未デプロイ）

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

## 4. 最大の運用上の注意: アプリ本体リポジトリへの書き込み権限

このセッション環境（Claude Code / tnonaka1101-stackのGitHub App）は
`drnode0/medical-search-template` に対して**読み取り専用**。以下すべて403で確認済み:
git push（プロキシ経由）／GitHub APIのref作成／フォーク作成。
`list_repos` は can_push:true を返すが、実際のApp installationトークンは書き込み不可。

- **回避策（現行）**: 実装をパッチとして medinode-lp に退避（§2）。
  ユーザーがローカルで `git am` → main へ push → Vercel自動デプロイ（1分。手順は patches/README.md）。
- **恒久対応**: GitHubに **drnode0** でログイン → Settings → Applications →
  Installed GitHub Apps → Claude → `medical-search-template` を書き込み権限で追加。
  付与後は新セッションで直接 push〜PR〜マージまで可能になる。
- 新セッションはまず `git push` を試し、通ればパッチ運用は不要（パッチと同内容の
  ブランチをそのまま push すればよい）。

## 5. 次のアクション（優先順）

1. **デプロイ確認**（ユーザーがパッチ適用済みか確認）。未適用なら patches/README.md の手順を案内。
2. **env設定の確認**: Vercelに `CQ_INTAKE_NOTION_TOKEN` / `CQ_INTAKE_DB_ID`。
   受付DBに任意列（投稿者職種=セレクト／ペンネーム／通知先ユーザーID／出典／投稿経路=セレクト）を
   足すと投稿内容が自動で載る（無くても動く）。
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
