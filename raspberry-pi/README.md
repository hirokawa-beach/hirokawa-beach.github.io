# Raspberry Pi 稼働状況API

Raspberry Pi OS向け。CPU使用率・メモリ使用率・CPU温度・起動後の時間だけを公開する読み取り専用APIです。2秒ごとに計測し、直近10分をメモリに保持します。閲覧者が増えても計測処理は増えません。サービス再起動時には履歴がリセットされます。

HPの更新間隔は **3秒（初期値）／10秒／30秒** から選べます。APIが履歴を返すため、30秒更新でも間の測定値を表示できます。表示範囲は2分／10分です。

## 1. ラズパイへ配置

Python 3.9以降とsystemdを使います。以下はラズパイのターミナル／SSHで実行してください。Windows側では実行しません。

まずこのブランチを取得したフォルダーへ移動します。リポジトリがない場合は以下で取得できます。

```sh
git clone --branch feat/astro-portfolio-rebuild https://github.com/hirokawa-beach/hirokawa-beach.github.io.git
cd hirokawa-beach.github.io/raspberry-pi
```

すでに取得済みなら、そのフォルダーで `git pull --ff-only` を行い、`raspberry-pi/` に移動してください。

```sh
sudo apt update
sudo apt install -y python3-venv python3-dev build-essential
sudo install -d -m 0755 /opt/hb283-status
sudo install -m 0644 status_api.py requirements.txt /opt/hb283-status/
sudo python3 -m venv /opt/hb283-status/.venv
sudo /opt/hb283-status/.venv/bin/python -m pip install -r /opt/hb283-status/requirements.txt
sudo chmod -R a+rX /opt/hb283-status
sudo install -m 0600 .env.example /etc/hb283-status.env
sudo nano /etc/hb283-status.env
```

`ALLOWED_ORIGINS` に、実際にHPを開くURLのオリジン（`https://ドメイン`）をカンマ区切りで指定します。パスや末尾の `/` は付けません。例:

```ini
ALLOWED_ORIGINS=https://hb283.dev,https://実際のプレビュー.hirokawa-beach-github-io.pages.dev,http://localhost:4321,http://127.0.0.1:4321
STATUS_PORT=8765
```

プレビューのオリジンは、その時点で利用する正確なURLに置き換えてください。公開するJSONは誰でも読める情報です。CORSはブラウザーからの取得許可であり、認証ではありません。

## 2. 自動起動

同じ `raspberry-pi/` フォルダーから実行します。

```sh
sudo install -m 0644 hb283-status.service /etc/systemd/system/hb283-status.service
sudo systemctl daemon-reload
sudo systemctl enable --now hb283-status
curl --fail --retry 5 --retry-delay 2 http://127.0.0.1:8765/metrics
```

起動直後の約2秒間は、最初の実測値が揃うまで503を返します。値が表示されれば計測側は動いています。温度センサーが取得できない場合は `temperature: null` となり、HPにも「取得不可」と表示します。

確認・停止・更新後の再起動:

```sh
systemctl status hb283-status --no-pager
journalctl -u hb283-status -n 50 --no-pager
sudo systemctl stop hb283-status
sudo systemctl restart hb283-status
```

Pythonファイルを変更した場合は `/opt/hb283-status/` に再配置してから再起動してください。APIは `127.0.0.1:8765` のみに待ち受け、閲覧者向けの管理操作やコマンド実行機能は持ちません。

## 3. Cloudflare Tunnel

Cloudflare管理画面でTunnelを作成し、Raspberry Pi OSのCPU構成に合う `cloudflared` を導入します。表示されるサービス用のインストールコマンドをラズパイで実行してください。Tunnelのトークンは、このリポジトリや `PUBLIC_` 環境変数には保存しません。

公開ルートを以下のように設定します。

- ホスト名: 実際に所有しているドメインのサブドメイン（例 `status-api.hb283.dev`）
- Service URL: `http://127.0.0.1:8765`
- 確認するURL: `https://status-api.hb283.dev/metrics`（例）

URLをブラウザーで開き、JSONが表示されることを確認してください。`/metrics` をキャッシュするルールは設定しません。API自体も `Cache-Control: no-store` を返します。

[Cloudflare公式のTunnel作成手順](https://developers.cloudflare.com/tunnel/get-started/)

## 4. HPを接続

Cloudflare Pagesの環境変数に、実際のAPIのURLを設定して再デプロイします。プレビューで試すならPreview、本番用にはProductionにも設定します。

```ini
PUBLIC_STATUS_API_URL=https://status-api.hb283.dev/metrics
```

Windowsでのローカル確認ではリポジトリ直下の `.env` に同じ値を書き、`npm run dev` を再起動します。`PUBLIC_` の値は公開されるため、URL以外の認証情報は入れません。

未設定時は未接続表示です。接続失敗・古い計測値・不正な応答の場合はオンライン表示を解除し、グラフを残す場合も最後の取得データであることを明示します。未取得期間を架空の値で埋めません。APIの `timestamp` とHPの時間が大きくずれないよう、ラズパイの時刻同期を有効にしてください。

## APIの形式

`GET /metrics` は最新値と最大301件の履歴を返します。数値は以下では説明用の例です。

```json
{
  "timestamp": 1792258200,
  "cpu": 18.2,
  "memory": 31.1,
  "temperature": 48.5,
  "uptime": 172800,
  "interval_seconds": 2,
  "history": [
    {"timestamp": 1792258200, "cpu": 18.2, "memory": 31.1, "temperature": 48.5, "uptime": 172800}
  ]
}
```

`timestamp` はUnix秒、`uptime` は起動後の秒数、温度は摂氏、CPUとメモリは%です。履歴はAPI開始後に実際に取れた分だけ返します。APIからプロセス名・IPアドレス・ファイル内容などは返しません。

## 開発時の検証

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python -m unittest discover -s tests -v
```

測定不能・古いデータ・履歴上限・CORS・温度センサー欠損・読み取り専用の動作を検証します。Windowsでは `.venv/bin/python` を `.venv/Scripts/python.exe` に読み替えます。

[psutilの仕様](https://psutil.readthedocs.io/stable/) / [FlaskのWaitress運用](https://flask.palletsprojects.com/en/stable/deploying/waitress/)
