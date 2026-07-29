# パッチの適用方法

このフォルダには、`drnode0/medical-search-template` に適用する実装パッチが入っています
（Claudeのセッションからは同リポジトリへの書き込み権限がなく、直接プッシュできなかったため）。

## 0001-phase1-cq-inapp-submit.patch

Phase 1: 臨床疑問のプレミアム投稿をアプリ内で完結できるようにする実装。
`main`（コミット 1b5bfac 時点）に適用できます。

```bash
cd medical-search-template
git fetch origin main
git checkout -b claude/medinode-premium-brushup-6kn2bg origin/main
git am path/to/0001-phase1-cq-inapp-submit.patch
# 確認: npx tsc --noEmit && npm test && npm run build（すべて通過済み）
git push -u origin claude/medinode-premium-brushup-6kn2bg
```

## 有効化に必要な環境変数（Vercel）

アプリ内投稿は、以下の2つを設定するまで自動で従来の外部Notionフォームに
フォールバックします（＝設定するだけで段階公開できます）。

- `CQ_INTAKE_NOTION_TOKEN` … 受付DB（現行の臨床疑問フォームが書き込んでいるDB）に
  書き込めるNotion Integrationトークン
- `CQ_INTAKE_DB_ID` … その受付DBのID

受付DBに以下のプロパティがあると、投稿内容がそのまま載ります（無くても
タイトル＝疑問文だけで受付は成立します）:
投稿者職種（セレクト）／ペンネーム（テキスト）／通知先ユーザーID（テキスト）／
出典（テキスト）／投稿経路（セレクト）
