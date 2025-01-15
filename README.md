# Farcaster Search Tool

Farcasterの投稿を検索するためのツールです。

## 機能

- キーワードによる投稿の検索
- 最小ハート数によるフィルタリング
- 期間指定（24時間以内、48時間以内、1週間以内）
- リアルタイムな検索結果の表示

## 技術スタック

- フロントエンド: HTML, CSS, JavaScript
- バックエンド: Node.js, Express
- API: Neynar API (Farcaster)

## 開発環境のセットアップ

1. リポジトリのクローン
```bash
git clone [repository-url]
cd farcaster-search
```

2. バックエンドの設定
```bash
cd server
npm install
```

3. 環境変数の設定
`.env`ファイルをserverディレクトリに作成し、以下の内容を設定：
```
NEYNAR_API_KEY=your-api-key
PORT=3001
```

4. サーバーの起動
```bash
npm start
```

5. フロントエンドへのアクセス
- `index.html`をブラウザで開く
