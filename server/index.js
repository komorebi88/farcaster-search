import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from '@neynar/nodejs-sdk';
const { NeynarAPIClient } = pkg;

// 環境変数の読み込み
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Neynar APIクライアントの設定
const neynarClient = new NeynarAPIClient(process.env.NEYNAR_API_KEY);

// CORSの設定
app.use(cors({
  origin: '*',  // すべてのオリジンを許可
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// APIキーの検証関数
const validateApiKey = () => {
  if (!process.env.NEYNAR_API_KEY) {
    throw new Error('Neynar API Key is not configured');
  }
  if (process.env.NEYNAR_API_KEY.length < 10) {
    throw new Error('Invalid Neynar API Key format');
  }
};

// ヘルスチェックエンドポイント
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    apiKey: !!process.env.NEYNAR_API_KEY
  });
});

// 環境変数の確認エンドポイント（開発用）
app.get('/debug-env', (req, res) => {
  res.json({
    hasNeynarKey: !!process.env.NEYNAR_API_KEY,
    keyLength: process.env.NEYNAR_API_KEY ? process.env.NEYNAR_API_KEY.length : 0,
    port: process.env.PORT
  });
});

// 投稿検索エンドポイント
app.post('/api/search', async (req, res) => {
  try {
    // APIキーの検証
    validateApiKey();

    const { keyword, timeRange, minHearts } = req.body;
    if (!keyword) {
      return res.status(400).json({ error: 'キーワードは必須です' });
    }

    // 現在時刻からtimeRange時間前までの期間を計算
    const now = Math.floor(Date.now() / 1000);
    const timeRangeInSeconds = timeRange * 60 * 60;
    const fromTime = now - timeRangeInSeconds;

    console.log('Searching with params:', { 
      keyword, 
      timeRange, 
      minHearts, 
      fromTime,
      apiKeyStatus: 'Configured'
    });

    // Neynar APIを使用して投稿を取得
    let response;
    try {
      response = await neynarClient.searchCasts(keyword, {
        limit: 100,
        viewer_fid: 1
      });
      console.log('API Response received');
    } catch (neynarError) {
      console.error('Neynar API Error:', {
        message: neynarError.message,
        stack: neynarError.stack,
        status: neynarError.status
      });
      return res.status(500).json({
        error: 'Neynar APIでエラーが発生しました',
        details: neynarError.message
      });
    }

    // レスポンスから投稿を取得
    const casts = response.result.casts || [];
    console.log(`Total casts before filtering: ${casts.length}`);

    // 結果をフィルタリング（時間とハート数）
    const filteredCasts = casts.filter(cast => {
      const castDate = new Date(cast.timestamp);
      const castTimestamp = Math.floor(castDate.getTime() / 1000);
      const likes = cast.reactions?.likes_count || 0;
      return castTimestamp >= fromTime && likes >= (minHearts || 0);
    });

    console.log(`Filtered casts: ${filteredCasts.length}`);

    // レスポンスの整形
    const formattedCasts = filteredCasts.map(cast => ({
      id: cast.hash,
      text: cast.text || '',
      author: {
        username: cast.author?.username || 'Unknown User',
        display_name: cast.author?.display_name || cast.author?.username || 'Unknown User'
      },
      timestamp: new Date(cast.timestamp).toISOString(),
      reactions: {
        likes: cast.reactions?.likes_count || 0,
        recasts: cast.reactions?.recasts_count || 0
      }
    }));

    res.json({ casts: formattedCasts });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ 
      error: '検索中にエラーが発生しました',
      details: error.message 
    });
  }
});

// エラーハンドリングミドルウェア
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    error: '検索中にエラーが発生しました',
    details: err.message,
    type: err.name
  });
});

// サーバーの起動
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log('Environment:', {
    hasNeynarKey: !!process.env.NEYNAR_API_KEY,
    port: process.env.PORT
  });
});