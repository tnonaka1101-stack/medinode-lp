#!/bin/bash
# MediNode LP 公開切り替えスクリプト
# 実行タイミング: 2026-07-18(土) 20:00 のアプリ公開に合わせて1回実行する。
# やること: ライブ文言ブランチ golive を main に取り込み → Vercel本番デプロイ → GitHub push
set -euo pipefail
cd "$(dirname "$0")"

git checkout main
git merge golive --no-edit
vercel deploy --prod --scope tnonaka1101-stacks-projects
git push origin main

echo ""
echo "✅ 切り替え完了: https://medinode-lp.vercel.app"
echo "   確認ポイント: 告知バー「公開しました」／ナビ「今すぐ使う」／coming-soon が公開済みページに"
