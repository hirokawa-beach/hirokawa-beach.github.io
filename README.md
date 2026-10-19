# hb283.dev · Portfolio

Astro + TypeScriptによるHirokawa Beachの個人サイト。旧HTMLサイトの文章・記事・作品情報を移行したリニューアル版です。

## 開発

Node.js 22.22.0以降、npm 9.6.5以降が必要です。開発・CIの基準は `.node-version` の22.23.2です。

```sh
npm ci
npm run dev
npm run build
npm run preview
```

`package-lock.json` をコミットし、CIも `npm ci` で同じ依存関係を再現します。依存を変更する場合は `npm install` でロックファイルも更新し、`npm audit`・型チェック・ビルドを確認してください。CIはhigh／criticalの脆弱性検出で失敗します。

ローカルのビルド成果物は `dist/`。ビルド終了後に `studycopi-guide/`、`img/` をコピーします。RSSなどの機械可読ファイルはAstroが生成します。

## フォルダー構成

- `src/`: Astroのページ、共通部品、作品データ、記事、スタイル
- `public/`: 追加画像と旧URLの転送設定
- `studycopi-guide/`: 継続公開する独立したStudyCoPiガイド
- `img/`: 現在も使うBotの画面画像とGitHubロゴ
- `src/pages/feed.xml.ts`: 記事から生成するRSS（購読URLは従来どおり `/feed.xml`）
- `scripts/preserve-legacy.mjs`: ガイド・画像をビルド成果物へコピー

旧サイト専用のHTML、CSS/SCSS、ブログ用JavaScript、未使用画像は削除済みです。旧記事は `src/content/blog/` に移行しており、旧URLからの転送は `public/_redirects` で維持しています。削除したソースはGitの履歴から参照できます。

## Cloudflare Pages（本番運用）

本番サイトはCloudflare Pagesで公開中です。独自ドメインの接続は完了しており、[https://hb283.dev/](https://hb283.dev/) からアクセスできます。Pagesの標準URLは [https://hirokawa-beach-github-io.pages.dev/](https://hirokawa-beach-github-io.pages.dev/) です。

GitHubリポジトリと連携し、`main` への変更を本番へデプロイします。変更は作業ブランチのプレビューデプロイで確認してから、PRを `main` へマージして公開します。

| 設定 | 値 |
| --- | --- |
| 本番ブランチ | `main` |
| Build command | `npm run build` |
| Output directory | `dist` |
| Node.js | `22.23.2`（`.node-version`） |

本番URLは `astro.config.mjs` の `site`（`https://hb283.dev`）で管理します。旧URLの転送は `public/_redirects`、独立したStudyCoPiガイドの配信は `scripts/preserve-legacy.mjs` で維持します。

## 404ページ

`src/pages/404.astro` を編集すると、ビルド時にルートの `dist/404.html` が生成されます。Cloudflare Pagesは、このファイルを使って存在しないURLにHTTP 404を返します。ホーム・制作物・ブログへのリンクを設け、ライト／ダークテーマとスマホ表示に対応しています。

404ページには `noindex, follow` を出力し、canonicalと `og:url` は出力しません。旧URLの転送は引き続き `public/_redirects` で管理します。

## サイトマップと検索エンジン

`@astrojs/sitemap` がビルド時に `/sitemap-index.xml` と `/sitemap-0.xml` を生成します。ホーム・制作物・ブログ・記事・稼働状況・Botの説明ページは自動で収録されます。独立した `/studycopi-guide/` は `astro.config.mjs` の `customPages` で追加し、404ページと旧URLの転送元は含めません。新しいAstroページや記事を追加した場合も、通常のビルドで更新されます。

`/sitemap.xml` はサイトマップインデックスへ301転送します。`src/pages/robots.txt.ts` はビルド時に `robots.txt` を生成し、`astro.config.mjs` の本番URLを使ってサイトマップの場所を案内します。共通レイアウトとStudyCoPiガイドのheadにもサイトマップへのリンクがあります。

本番反映後、Google Search Consoleの「サイトマップ」に `https://hb283.dev/sitemap-index.xml` を送信できます。プレビューで確認するときも、XML内のURLは本番の `https://hb283.dev` です。

## RSSとAI向けの案内

`src/pages/feed.xml.ts` は `src/content/blog/` の記事を新しい順にRSSへ出力します。タイトル・説明・日付・タグを記事と共有し、チャンネルと記事のリンク・GUIDは `astro.config.mjs` の本番URLを使います。`/feed.xml` の購読URLは維持し、共通レイアウトのheadからも案内します。旧GUIDを新しい正規URLへ統一するため、移行時に既存記事が再表示されるRSSリーダーもあります。

`src/pages/llms.txt.ts` はH1・サイト概要・主要ページと記事のリンクを持つMarkdownを `/llms.txt` に生成します。概要は `src/data/site.ts`、主要ページの説明はこのエンドポイントで編集します。これはAIがサイトの内容を理解するための任意の案内で、クロールや学習の許可・拒否を制御するファイルではありません。[llms.txtの提案](https://llmstxt.org/)を参照してください。

`src/pages/.well-known/ai-catalog.json.ts` は画像の監査が参照する `/.well-known/ai-catalog.json` をJSONで返します。[ARDのai-catalogスキーマ](https://github.com/ards-project/ard-spec/blob/main/spec/schemas/ai-catalog.schema.json)に合わせ、公開AIエージェントやAIツールの提供がない現在は `entries: []` です。一般の制作物や稼働状況APIをAI機能として登録しません。共通レイアウトとStudyCoPiガイドのheadから `llms.txt` とカタログへリンクします。

## サイトアイコン

プロフィールと同じ元アイコンを使用します。ブラウザー用は `public/favicon.ico`（16／32／48px）と `public/favicon-32.png`、スマホ用は `public/apple-touch-icon.png` です。`public/favicon.webp` はプロフィールの画像データをそのまま保存した元画像です。

## SNS共有画像（OGP）

サイト名・共通の説明文・共有画像の代替テキストは `src/data/site.ts`、画像は `src/assets/hb283-ogp.png` で変更します。アップロードされたPNGをそのまま使用し、画像の寸法と配信用URLはAstroが生成します。画像を差し替えた場合は再ビルドしてください。

全AstroページにOGPとXの大きい画像カード用メタ情報を出力します。タイトル・説明文は各ページの設定を引き継ぎ、ブログ記事では記事自身のタイトル・説明文を表示します。共有URLとOGP画像URLは、どちらも `astro.config.mjs` の `site`（`https://hb283.dev`）を基準にします。画像も独自ドメインから配信し、ドメイン設定を一か所にまとめています。独立したStudyCoPiガイドは専用の共有画像を使い、紹介ページのcanonical・共有URLと開発者へのリンクは独自ドメインへ統一しています。

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

既存の `studycopi-guide/` は独立サイトとして保持し、コピー用スクリプトで配信します。公開用の連絡先メールは実際の受信環境を構築するまで掲載しません。
