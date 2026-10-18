# Raspberry Pi 稼働状況API

Raspberry Pi OS向け。CPU使用率・メモリ使用率・CPU温度・起動後の時間と、OS・機種・アーキテクチャ・任意の公開端末名を返す読み取り専用APIです。2秒ごとに計測し、直近10分をメモリに保持します。閲覧者が増えても計測処理は増えません。サービス再起動時には履歴がリセットされます。

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
ALLOWED_ORIGINS=https://hb283.dev,https://hirokawa-beach-github-io.pages.dev,https://実際のプレビュー.hirokawa-beach-github-io.pages.dev,http://localhost:4321,http://127.0.0.1:4321
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

同じラズパイでTunnelが稼働済みで、そのTunnelへ今回の公開ルートを追加する運用なら、既存Tunnelを使えます。他の用途と分けて運用する場合は、下の「既存Tunnelと別に動かす」を使ってください。`cloudflared service install` を重ねて実行する必要はありません。新しいラズパイで初めて使う場合は、Cloudflare管理画面でTunnelを作成し、Raspberry Pi OSのCPU構成に合う `cloudflared` を導入します。表示されるサービス用のインストールコマンドをラズパイで実行してください。Tunnelのトークンは、このリポジトリや `PUBLIC_` 環境変数には保存しません。

公開ルートを以下のように設定します。

- ホスト名: 実際に所有しているドメインのサブドメイン（例 `rpi-status.hb283.dev`）
- Service URL: `http://127.0.0.1:8765`
- 確認するURL: `https://rpi-status.hb283.dev/metrics`（例）

URLをブラウザーで開き、JSONが表示されることを確認してください。`/metrics` をキャッシュするルールは設定しません。API自体も `Cache-Control: no-store` を返します。

[Cloudflare公式のTunnel作成手順](https://developers.cloudflare.com/tunnel/get-started/)

### 既存Tunnelと別に動かす

他の人向けの公開など、既存のTunnelと管理・起動・停止を分ける場合はこちらを使います。追加するサービス名は `cloudflared-status.service`。設定・トークンは `/etc/cloudflared-status/` に分けます。`/usr/bin/cloudflared` がある環境向けで、`cloudflared` 2025.4.0以降が必要です（2026.10.1では対応）。

Cloudflareで**計測用の新しいTunnel**を作り、そのTunnelのトークンを用意します。既存のTunnelのトークンは使いません。今回は `sudo cloudflared service install ...` を実行しません。

ラズパイのリポジトリを更新し、`raspberry-pi/` で実行します。

```sh
git pull --ff-only
sudo install -d -m 0700 /etc/cloudflared-status
sudo install -m 0600 cloudflared-status.yml.example /etc/cloudflared-status/config.yml
sudo nano /etc/cloudflared-status/token
```

エディターには**新しいTunnelのトークンだけを1行で貼り付け**ます。`sudo cloudflared service install` の文字は含めません。Ctrl+O → Enterで保存、Ctrl+Xで終了します。トークンはチャットやGitHubには貼りません。

```sh
sudo chmod 0600 /etc/cloudflared-status/token
sudo install -m 0644 cloudflared-status.service /etc/systemd/system/cloudflared-status.service
sudo systemctl daemon-reload
sudo systemctl enable --now cloudflared-status
sudo systemctl status cloudflared-status --no-pager
```

`active (running)` に加え、Cloudflare管理画面で**新しいTunnelが接続済み**になっていることを確認します。既存の `cloudflared.service` の停止・再起動・アンインストールは行いません。今回のサービスは別の設定ファイルとトークンを使い、診断用ポートも空いている番号を自動で使います。

新しいTunnelに公開ルートを追加します。

- Hostname: その端末用に決めたサブドメイン（例 `pi5-status.hb283.dev`。既存のホスト名と重複させません）
- Service URL: `http://127.0.0.1:8765`
- Path: 空欄

計測APIを起動したうえで、`https://そのサブドメイン/metrics` がJSONを返すことを確認します。ホスト名はこのTunnelのルート画面で設定します。OS・機種・グラフのデータは別サービスの `hb283-status` が返します。

計測用Tunnelだけを確認・再起動・停止する場合:

```sh
sudo journalctl -u cloudflared-status -n 50 --no-pager
sudo systemctl restart cloudflared-status
sudo systemctl stop cloudflared-status
```

[Cloudflare公式の起動パラメーター（token-file）](https://developers.cloudflare.com/tunnel/reference/run-parameters/#token-file)


## 4. HPを接続

Cloudflare Pagesの環境変数に、実際のAPIのURLを設定して再デプロイします。プレビューで試すならPreview、本番用にはProductionにも設定します。

```ini
PUBLIC_STATUS_API_URL=https://rpi-status.hb283.dev/metrics
```

Windowsでのローカル確認ではリポジトリ直下の `.env` に同じ値を書き、`npm run dev` を再起動します。`PUBLIC_` の値は公開されるため、URL以外の認証情報は入れません。

未設定時は未接続表示です。接続失敗・古い計測値・不正な応答の場合はオンライン表示を解除し、グラフを残す場合も最後の取得データであることを明示します。未取得期間を架空の値で埋めません。APIの `timestamp` とHPの時間が大きくずれないよう、ラズパイの時刻同期を有効にしてください。

## 5. 複数端末を登録する

各端末にこの計測APIを設置し、端末ごとに別の公開URLを用意します。2台目がRaspberry Pi 5なら、Pi 5でも「1. ラズパイへ配置」から設定します。Service URLの `127.0.0.1` はTunnelを実行している端末自身です。別のラズパイにAPIを置く場合は、そのラズパイ側でTunnelを動かしてください。

HP側のCloudflare Pages環境変数に `PUBLIC_STATUS_DEVICES` を追加し、次のJSON配列を値として設定して再デプロイします。2台目のURLは実際に作成したURLへ置き換えてください。`example.com` は説明用です。

```json
[{"id":"main","name":"Raspberry Pi","url":"https://rpi-status.hb283.dev/metrics"},{"id":"pi5","name":"Raspberry Pi 5","url":"https://pi5-status.example.com/metrics"}]
```

- `id`: 端末ごとに重複しない英小文字・数字・ハイフン・アンダースコアの名前
- `name`: 端末タブの表示名
- `url`: その端末の `/metrics` のHTTPS URL

`PUBLIC_STATUS_DEVICES` が設定されている場合、その一覧を使用し、`PUBLIC_STATUS_API_URL` より優先します。未設定なら従来どおり1台用の `PUBLIC_STATUS_API_URL` が使えます。端末が2台以上あると下線付きのタブが表示され、選んだ端末だけを取得します。切り替え時には前の端末の数値・グラフを消し、新たにその端末の実測履歴を取得します。一方のAPIが停止していても別の端末へ切り替えられます。タブはクリック／タップで切り替えます。キーボードでは左右キー・Home・Endでフォーカスを移動し、Enter・Spaceで端末を決定します。

すべての端末の `/etc/hb283-status.env` で、HPを開く正確なオリジンを `ALLOWED_ORIGINS` に入れてください。`https://hb283.dev`、`https://hirokawa-beach-github-io.pages.dev`、個別のプレビューURLはそれぞれ別のオリジンです。設定後は各端末で `sudo systemctl restart hb283-status` を実行します。

### OS・機種情報

OS名はOSの情報、Raspberry Piの機種はデバイスツリーから取得します。OSがDebianとして自己申告している場合はDebianと表示します。取得できない機種を推測では埋めません。公開名と必要な表示上書きは `/etc/hb283-status.env` で設定できます。空欄のOS・機種は自動取得します。

```ini
STATUS_DEVICE_NAME="Raspberry Pi 5"
STATUS_DEVICE_OS=
STATUS_DEVICE_MODEL=
```

ホスト名、シリアル番号、MACアドレス、IPアドレスは端末情報に含めません。情報はサービス起動時に取得するため、表示設定を変更したらサービスを再起動してください。旧版の計測APIでもグラフは動きますが、端末情報は「取得不可」です。

### 既存端末のAPIを更新する

既存端末のリポジトリで最新ブランチを取得し、`raspberry-pi/` から次を実行します。既存の `/etc/hb283-status.env` は上書きしません。

```sh
git pull --ff-only
sudo install -m 0644 status_api.py requirements.txt /opt/hb283-status/
sudo /opt/hb283-status/.venv/bin/python -m pip install -r /opt/hb283-status/requirements.txt
sudo nano /etc/hb283-status.env
sudo systemctl restart hb283-status
```

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
  "device": {"name": "Raspberry Pi 5", "os": "Debian GNU/Linux 13 (trixie)", "model": "Raspberry Pi 5 Model B Rev 1.0", "architecture": "aarch64"},
  "history": [
    {"timestamp": 1792258200, "cpu": 18.2, "memory": 31.1, "temperature": 48.5, "uptime": 172800}
  ]
}
```

`timestamp` はUnix秒、`uptime` は起動後の秒数、温度は摂氏、CPUとメモリは%です。履歴はAPI開始後に実際に取れた分だけ返します。端末情報は `device` に返します。値が取得できない項目は `null` です。APIからプロセス名・IPアドレス・端末識別番号などは返しません。

## 開発時の検証

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python -m unittest discover -s tests -v
```

測定不能・古いデータ・履歴上限・CORS・温度センサー欠損・読み取り専用の動作を検証します。Windowsでは `.venv/bin/python` を `.venv/Scripts/python.exe` に読み替えます。

[psutilの仕様](https://psutil.readthedocs.io/stable/) / [FlaskのWaitress運用](https://flask.palletsprojects.com/en/stable/deploying/waitress/)
