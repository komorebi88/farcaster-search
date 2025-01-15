import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from '@neynar/nodejs-sdk';
const { NeynarAPIClient } = pkg;

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Neynar API client setup
let neynarClient;
const initializeNeynarClient = () => {
  try {
    if (!process.env.NEYNAR_API_KEY) {
      throw new Error('NEYNAR_API_KEY environment variable is not set');
    }
    console.log('Initializing Neynar client with key length:', process.env.NEYNAR_API_KEY.length);
    neynarClient = new NeynarAPIClient(process.env.NEYNAR_API_KEY);
    return neynarClient;
  } catch (error) {
    console.error('Failed to initialize Neynar client:', error);
    throw error;
  }
};

// CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  try {
    const apiKeyExists = !!process.env.NEYNAR_API_KEY;
    const apiKeyLength = process.env.NEYNAR_API_KEY ? process.env.NEYNAR_API_KEY.length : 0;
    
    res.json({
      status: 'ok',
      apiKey: apiKeyExists,
      apiKeyLength,
      environment: process.env.NODE_ENV || 'development',
      serverTime: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Debug environment endpoint
app.get('/debug-env', (req, res) => {
  try {
    res.json({
      hasNeynarKey: !!process.env.NEYNAR_API_KEY,
      keyLength: process.env.NEYNAR_API_KEY ? process.env.NEYNAR_API_KEY.length : 0,
      port: process.env.PORT,
      nodeEnv: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get environment variables',
      details: error.message
    });
  }
});

// Search endpoint
app.post('/api/search', async (req, res) => {
  try {
    const { keyword, timeRange, minHearts } = req.body;
    console.log('Received search request:', { keyword, timeRange, minHearts });

    if (!keyword) {
      return res.status(400).json({ error: 'Keyword is required' });
    }

    // Calculate time range
    const now = Math.floor(Date.now() / 1000);
    const timeRangeInSeconds = timeRange * 60 * 60;
    const fromTime = now - timeRangeInSeconds;

    // Initialize Neynar client and fetch posts
    let response;
    try {
      const client = initializeNeynarClient();
      console.log('Neynar client initialized successfully');
      
      response = await client.searchCasts(keyword, {
        limit: 100,
        viewer_fid: 1
      });
      console.log('API Response received:', {
        status: 'success',
        castsCount: response.result.casts?.length || 0
      });
    } catch (neynarError) {
      console.error('Neynar API Error:', {
        message: neynarError.message,
        stack: neynarError.stack,
        status: neynarError.status
      });
      return res.status(500).json({
        error: 'Error occurred while fetching from Neynar API',
        details: neynarError.message,
        type: 'NEYNAR_API_ERROR'
      });
    }

    // Get posts from response
    const casts = response.result.casts || [];
    console.log(`Total casts before filtering: ${casts.length}`);

    // Filter results by time and hearts
    const filteredCasts = casts.filter(cast => {
      const castDate = new Date(cast.timestamp);
      const castTimestamp = Math.floor(castDate.getTime() / 1000);
      const likes = cast.reactions?.likes_count || 0;
      return castTimestamp >= fromTime && likes >= (minHearts || 0);
    });

    console.log(`Filtered casts: ${filteredCasts.length}`);

    // Format response
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
    console.error('Search error:', {
      message: error.message,
      stack: error.stack,
      type: error.name
    });
    res.status(500).json({
      error: 'An error occurred during search',
      details: error.message,
      type: error.name
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', {
    message: err.message,
    stack: err.stack,
    type: err.name
  });
  res.status(500).json({
    error: 'An unexpected error occurred',
    details: err.message,
    type: err.name
  });
});

// Server startup
app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
  
  // Test environment variables
  const envStatus = {
    NEYNAR_API_KEY: {
      exists: !!process.env.NEYNAR_API_KEY,
      length: process.env.NEYNAR_API_KEY ? process.env.NEYNAR_API_KEY.length : 0,
      preview: process.env.NEYNAR_API_KEY ? `${process.env.NEYNAR_API_KEY.substring(0, 4)}...` : 'not set'
    },
    PORT: {
      value: process.env.PORT,
      fallback: port,
      final: port
    },
    NODE_ENV: process.env.NODE_ENV || 'development'
  };

  console.log('Environment Check:', JSON.stringify(envStatus, null, 2));

  if (!process.env.NEYNAR_API_KEY) {
    console.warn('⚠️ Warning: NEYNAR_API_KEY is not set');
  }
  if (process.env.PORT !== port.toString()) {
    console.warn(`⚠️ Notice: Using fallback port ${port} (PORT=${process.env.PORT || 'not set'})`);
  }
});