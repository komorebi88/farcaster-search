# Farcaster Search Tool

A tool for searching Farcaster posts with advanced filtering capabilities.

## Features

- Search posts by keyword
- Filter by minimum number of likes (min_faves)
- Time range filtering (24h, 48h, 1 week)
- Real-time search results
- Direct links to Warpcast

## Tech Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express
- API: Neynar API (Farcaster)
- Deployment:
  - Frontend: Vercel
  - Backend: Render

## Local Development Setup

1. Clone the repository
```bash
git clone [repository-url]
cd farcaster-search
```

2. Backend setup
```bash
cd server
npm install
```

3. Environment variables
Create `.env` file in the server directory:
```
NEYNAR_API_KEY=your-api-key
PORT=3001
```

4. Start the server
```bash
npm start
```

5. Access the frontend
- Open `index.html` in your browser

## Production URLs

- Frontend: https://farcaster-search-pi.vercel.app/
- Backend API: https://farcaster-search-api.onrender.com/
