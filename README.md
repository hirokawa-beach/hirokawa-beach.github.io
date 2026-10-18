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

## サイトアイコン

プロフィールと同じ元アイコンを使用します。ブラウザー用は `public/favicon.ico`（16／32／48px）と `public/favicon-32.png`、スマホ用は `public/apple-touch-icon.png` です。`public/favicon.webp` はプロフィールの画像データをそのまま保存した元画像です。

## SNS共有画像（OGP）

サイト名・共通の説明文・共有画像の代替テキストは `src/data/site.ts`、画像は `src/assets/hb283-ogp.png` で変更します。アップロードされたPNGをそのまま使用し、画像の寸法と配信用URLはAstroが生成します。画像を差し替えた場合は再ビルドしてください。

全AstroページにOGPとXの大きい画像カード用メタ情報を出力します。タイトル・説明文は各ページの設定を引き継ぎ、ブログ記事では記事自身のタイトル・説明文を表示します。本番の共有URLは `astro.config.mjs` の `site`（`https://hb283.dev`）を基準にします。OGP画像は独自ドメインのDNS状態に依存しないよう、`src/data/site.ts` の `imageOrigin`（本番のPagesドメイン）から配信します。独立したStudyCoPiガイドは従来の共有設定を維持します。

## Raspberry Pi System Status

`raspberry-pi/` にRaspberry Pi OS用の読み取り専用計測APIとsystemdの自動起動設定があります。CPU・メモリ・温度・稼働時間を2秒ごとに計測し、直近10分をメモリに保持します。OS・機種・アーキテクチャも表示します。

HPではCPU・メモリ・温度のグラフを表示します。更新間隔は **3秒（初期値）／10秒／30秒**、表示範囲は2分／10分で切り替えられます。更新停止・再開にも対応します。未接続時や欠測期間は架空の値を補いません。

**ラズパイへの配置、自動起動、Cloudflare Tunnel、CORS、HPへの接続は [raspberry-pi/README.md](raspberry-pi/README.md) を参照してください。**

HPの環境変数 `PUBLIC_STATUS_API_URL` に公開可能なAPIのURL（例 `https://rpi-status.hb283.dev/metrics`）を設定し、再ビルドします。未設定なら未接続表示です。この変数にAPIキーやTunnelトークンは入れません。

複数端末は `PUBLIC_STATUS_DEVICES` に `[{"id":"pi5","name":"Raspberry Pi 5","url":"https://your-api.example.com/metrics"}]` の形式で追加します（URLは実際のものへ置換）。この設定は1台用URLより優先され、2台以上で端末タブが表示されます。各端末で計測APIとTunnelを用意してください。詳しい追加・既存API更新手順は上記の導入手順に記載しています。

```sh
npm test
python -m unittest discover -s raspberry-pi/tests -v
```

Pythonのテストには `raspberry-pi/requirements.txt` の依存パッケージが必要です。

## 注意

既存の `studycopi-guide/` は独立サイトとして保持し、コピー用スクリプトで配信します。画像等の既存ファイルやGitHub Pagesの本番ブランチはPRマージまで変更されません。公開用の連絡先メールは実際の受信環境を構築するまで掲載しません。
