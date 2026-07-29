# パッチの適用方法（デプロイ手順）

このフォルダには、`drnode0/medical-search-template` に適用する実装パッチが入っています。
Claudeのセッションは同リポジトリに対して**読み取り専用**（git・GitHub APIとも403）のため、
直接プッシュ・デプロイができません。以下のどちらかで反映してください。

## 最短デプロイ（コピペ1回・約1分）

drnode0でpushできる環境（いつも開発しているPC）で:

```bash
git clone https://github.com/drnode0/medical-search-template.git mst-deploy
cd mst-deploy
curl -LO https://raw.githubusercontent.com/tnonaka1101-stack/medinode-lp/claude/medinode-premium-brushup-6kn2bg/docs/patches/0001-phase1-cq-inapp-submit.patch
git am 0001-phase1-cq-inapp-submit.patch
git push origin main
```

`main` へのプッシュでVercelが自動デプロイします。
（パッチは main = 1b5bfac 時点でクリーン適用・全テスト429件・型チェック・本番ビルド通過を確認済み。
mainがさらに進んでいて `git am` が失敗した場合は `git am --abort` して連絡してください。）

慎重に行くなら、`git checkout -b claude/medinode-premium-brushup-6kn2bg` してから
`git am` → ブランチをプッシュしてPRで確認してもOKです。

## デプロイ直後の挙動（環境変数なしでも壊れません）

- 設定の「臨床疑問を投稿する」が、外部Notionページへのジャンプ → **アプリ内モーダル**に変わります。
- ただし `CQ_INTAKE_*`（下記）を設定するまでは、モーダル内の「専門医に訊く」欄に
  「準備中です。投稿フォームからお送りください」と従来フォームへのリンクが表示されます。
  **環境変数を入れた瞬間に、アプリ内投稿が有効になります**（再デプロイ不要・次のリクエストから反映）。

## アプリ内投稿を有効化する環境変数（Vercel → Settings → Environment Variables）

- `CQ_INTAKE_NOTION_TOKEN` … 受付DB（現行の臨床疑問フォームが書き込んでいるDB）に
  **書き込み権限（コンテンツを挿入）付きで接続した** Notion Integrationトークン
- `CQ_INTAKE_DB_ID` … その受付DBのID（NotionでDBを開いたURLの32桁）

受付DBに以下のプロパティがあると投稿内容がそのまま載ります（無くても
タイトル＝疑問文だけで受付は成立します）:
投稿者職種（セレクト）／ペンネーム（テキスト）／通知先ユーザーID（テキスト）／
出典（テキスト）／投稿経路（セレクト）

## 次回以降Claudeが直接プッシュできるようにするには

GitHubに **drnode0** でログイン → Settings → Applications → Installed GitHub Apps →
Claude（Claude Code）→ Repository access に `medical-search-template` を**書き込み権限で**追加。
付与後にセッションで一言もらえれば、ブランチのプッシュ〜PR〜マージまでこちらで行えます。
