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

// ミドルウェアの設定
app.use(cors({
  origin: [
    'https://farcaster-search-pi.vercel.app',
    'http://localhost:3000',
    'http://localhost:5000',
    'http://127.0.0.1:5000'
  ],
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());

// ヘルスチェックエンドポイント
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 投稿検索エンドポイント
app.post('/api/search', async (req, res) => {
  try {
    const { keyword, timeRange, minHearts } = req.body;

    if (!keyword) {
      return res.status(400).json({ error: 'キーワードは必須です' });
    }

    // 現在時刻からtimeRange時間前までの期間を計算
    const now = Math.floor(Date.now() / 1000);
    const timeRangeInSeconds = timeRange * 60 * 60;
    const fromTime = now - timeRangeInSeconds;

    console.log('Searching with params:', { keyword, timeRange, minHearts, fromTime });

    try {
      // Neynar APIを使用して投稿を取得
      const response = await neynarClient.searchCasts(keyword, {
        limit: 100,
        viewer_fid: 1
      });

      // レスポンスの詳細をログ出力
      console.log('API Response structure:', JSON.stringify(response, null, 2));

      // レスポンスから投稿を取得
      const casts = response.result.casts || [];
      console.log(`Total casts before filtering: ${casts.length}`);

      // 結果をフィルタリング（時間とハート数）
      const filteredCasts = casts.filter(cast => {
        // キャストのタイムスタンプを取得
        const castDate = new Date(cast.timestamp);
        const castTimestamp = Math.floor(castDate.getTime() / 1000);
        
        // リアクション数を取得
        const likes = cast.reactions?.likes_count || 0;
        
        // フィルタリング条件をチェック
        const withinTimeRange = castTimestamp >= fromTime;
        const hasEnoughHearts = likes >= (minHearts || 0);

        // 詳細なデバッグ情報を出力
        console.log('Filtering cast:', {
          text: cast.text.substring(0, 50) + '...',
          date: castDate.toISOString(),
          timestamp: castTimestamp,
          fromTime,
          likes,
          minHearts,
          withinTimeRange,
          hasEnoughHearts
        });

        return withinTimeRange && hasEnoughHearts;
      });

      console.log(`Filtered casts: ${filteredCasts.length}`);

      console.log(`Found ${filteredCasts.length} matching casts`);

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
    } catch (apiError) {
      console.error('Neynar API error:', apiError);
      throw apiError;
    }
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: '検索中にエラーが発生しました' });
  }
});

// サーバーの起動
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});