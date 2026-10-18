# hb283.dev · Portfolio

Astro + TypeScriptによるHirokawa Beachの個人サイト。旧HTMLサイトの文章・記事・作品情報を移行したリニューアル版です。

## 開発

Node.js 20.3以降（22推奨）。

```sh
npm install
npm run dev
npm run build
npm run preview
```

ローカルのビルド成果物は `dist/`。ビルド終了後に `studycopi-guide/`、`img/`、`feed.xml` をコピーします。

## フォルダー構成

- `src/`: Astroのページ、共通部品、作品データ、記事、スタイル
- `public/`: 追加画像と旧URLの転送設定
- `studycopi-guide/`: 継続公開する独立したStudyCoPiガイド
- `img/`: 現在も使うBotの画面画像とGitHubロゴ
- `feed.xml`: 既存のRSS購読URLを維持するフィード
- `scripts/preserve-legacy.mjs`: ガイド・画像・RSSをビルド成果物へコピー

旧サイト専用のHTML、CSS/SCSS、ブログ用JavaScript、未使用画像は削除済みです。旧記事は `src/content/blog/` に移行しており、旧URLからの転送は `public/_redirects` で維持しています。削除したソースはGitの履歴から参照できます。

## Cloudflare Pages（本番移行時）

GitHubリポジトリをPagesへ連携し、Build command: `npm run build`, Output directory: `dist`, Node.js: 22を設定してください。最初に `*.pages.dev` のプレビュー環境でページと `/studycopi-guide/` を確認してから `hb283.dev` をカスタムドメインへ追加してください。

GitHub PagesからCloudflare Pagesへの本番切替は、このPRでは行いません。`main` のGitHub Pages公開設定を調整する前に、新サイトのDNSと旧URLからの誘導を確認してください。

## Raspberry Pi System Status

`PUBLIC_STATUS_API_URL` に **読み取り専用・公開可能な** JSONエンドポイント（例: `https://status-api.hb283.dev/metrics`）を指定。未設定ならサイトに未接続表示を出します。公開ブラウザから取得できるCORS設定と、Cloudflare Tunnel経由でのHTTPS配信が必要です。APIに秘密情報や管理操作を実装しないでください。

期待するJSON:

```json
{"cpu":18.2,"memory":31.1,"temperature":48.5,"uptime":172800}
```

数値はCPU/メモリが%、温度が摂氏、uptimeが秒。値は表示前に検証されます。設定変更後は再ビルドが必要です。Python側のエージェントは後日追加可能です。

## 注意

既存の `studycopi-guide/` は独立サイトとして保持し、コピー用スクリプトで配信します。画像等の既存ファイルやGitHub Pagesの本番ブランチはPRマージまで変更されません。公開用の連絡先メールは実際の受信環境を構築するまで掲載しません。
