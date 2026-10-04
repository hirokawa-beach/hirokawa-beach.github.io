# StudyCoPi 案内サイト

公開先: https://hirokawa-beach.github.io/studycopi-guide/

サービス本体 https://hirokawa-beach.github.io/StudyCoPi/ とは別の静的サイトです。このフォルダのみ追加し、個人ホームページやサービスのファイルは変更していません。

## 編集と公開

- `index.html`: 機能紹介、使い方、比較、APK導入、FAQ。APKリンクと配布バージョン・容量はリリース時に更新してください。`releases/latest` へのリンクも用意しています。
- `style.css`: 自動ライト・ダークテーマ、スマホ表示、縮小アニメーション設定。
- `site.js`: アクセシブルな機能紹介タブ、スクロールで進む使い方、スクショ拡大。タブは左右矢印・Home・Endキーに対応。
- ビルド不要。リポジトリルートで `python -m http.server 8767` を起動し、`http://localhost:8767/studycopi-guide/` で確認できます。mainにpushすると既存のGitHub Pagesが公開します。
- アカウント、計測用スクリプト、Cookie、サービスワーカーは追加していません。

## デザイン

学生が実画面から使い方を理解するための、落ち着いた製品案内。DESIGN_VARIANCE=6 / MOTION_INTENSITY=3 / VISUAL_DENSITY=4。素材と余白で構成し、ボタンやタブの操作に必要な動きだけ使用します。静的GitHub Pagesに合わせ、HTML・CSS・少量のJavaScriptで実装しました。

アクセントはアプリに合わせた青緑。ボタン12px、コンテンツ16px、画面枠32pxの角丸。日本語はNoto Sans JPをローカル配信します。

## 素材とライセンス

- `assets/icon.png`: StudyCoPiで使用しているユーザー提供のアプリアイコン。
- `assets/action-icons.svg`: [Tabler Icons](https://github.com/tabler/tabler-icons)公式のexternal-link・download。文字の矢印ではなくSVGを使い、フォントに依存しない形で表示します。MITライセンス、同梱の`ICON-LICENSE.txt`参照。
- `today.webp`, `exams.webp`, `stats.webp`, `timetable.webp`, `timer.webp`: 実際のWeb版をサンプルデータで表示し、ブラウザでキャプチャ。利用実績の主張ではありません。
- `howto-*.webp`: 実際のWeb版を操作して撮影した予定追加・タイマー・記録・統計のスクショ。ライト・ダークの両方を用意。タイマーを20分進めて一時停止・終了した実際の状態を使っています。
- `android-guide-*.webp`: Android版の実コードをRobolectricのネイティブ描画で撮影した、目覚まし・問題/NFC設定・集中モード・通知設定・ウィジェット一覧。設定画面はライト・ダークを用意。NFC対応の仮想端末構成で描画しており、物理タグの読取りを実機で検証した記録ではありません。
- `wake.webp`, `widget.webp`: Android版の実装をRobolectricのネイティブ描画でキャプチャ。
- `noto-sans-jp.woff2`: StudyCoPiのNoto Sans JPからページ内の文字をサブセット化。SIL OFL 1.1、同梱の`FONT-LICENSE.txt`参照。文章に新しい文字を追加した場合は元のフォントから再生成してください。
- `desk.webp`, `share.jpg`: 内蔵image_genによる新規生成の写真素材（photorealistic-natural）。元画像は保持し、配信用にWebP変換・OG画像サイズへの書き出しのみ実施しました。人物・サービス画面・利用者の実績を表すものではありません。

画像生成の最終プロンプト（内蔵ツール、API/CLI不使用）:

> Create a photorealistic editorial photograph for a Japanese student's study planning app information website. Landscape composition, wide 3:2 crop. A real quiet home study desk by a window in late afternoon: pale cool-gray desk, open unbranded mathematics workbook with indistinct tiny print, one mechanical pencil, navy blue notebook, clear glass of water. No phone screens, no computers, no people, no readable lettering, no logos. Natural soft daylight, restrained navy and muted teal details, believable everyday student desk rather than luxurious staged office. Shot from a gentle overhead angle, generous clean space at upper left. Sharp tactile paper and realistic shadows. Calm, encouraging and practical atmosphere. Photograph, not illustration, no graphic overlays, no text.

## 検証

使い方はCSSのstickyとIntersectionObserverで手順に合わせて画面を切り替えます。スクロールの速度・位置はユーザーが操作します。上へ戻れば前の手順へ戻ります。スマホでは画面が上、説明が下。手順ボタンで移動でき、スクショはネイティブdialogで拡大可能。動きを減らす設定では切り替えを即時にし、JavaScriptが無効でも各手順のスクショと文章を表示します。

Web版の基本4手順と、Android限定機能の5手順は独立した案内です。拡大時のキャプションも各プラットフォームに合わせます。

ICカードの案内は、`NfcReader.kt`の識別ID取得・`WakeModels.kt`のID照合・`WakeBackup.kt`のバックアップ保存と、[Android公式のTag.getId仕様](https://developer.android.com/reference/android/nfc/Tag#getId())を確認しています。固定IDを読み取れる対応カードに限定し、個別カードの実機動作保証はしていません。Q&Aにはカード内容を取得しないこと、IDの端末内保存・バックアップへの収録、外部送信や書き込みを行わないことを記載しています。

320×568 / 390×844 / 844×390 / 1440×900でスクロールの往復、ライト・ダーク、手順移動、拡大・Escape終了・フォーカス復帰、画面サイズ変更、JavaScript無効時の案内を確認。

320 / 390 / 768 / 1440pxのライト・ダーク両テーマで横はみ出し、開始ボタンの初期表示、タブ・キーボード操作、APK導入・FAQの開閉、素材の読み込みを確認。

2026-10-05のICカード案内・Q&A追記後のローカル検証: 320 / 390 / 1440pxのライト・ダークでQ&Aの開閉、素材読み込み、横はみ出しがないことを確認。Lighthouse（スマホ）速度96 / アクセシビリティ100 / 基本品質100 / SEO100。LCP約2.7秒、CLS 0。実際の速度は通信環境によって変わります。
