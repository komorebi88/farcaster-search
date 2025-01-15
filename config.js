// 環境に応じたAPIエンドポイントの設定
const API_BASE = {
    development: 'http://localhost:3001/api',
    production: 'https://farcaster-search-api.onrender.com/api'  // Renderにデプロイする際のURLを仮で設定
};

// 現在の環境がローカル開発環境かどうかを判定
const isDevelopment = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1';

// 適切なAPIエンドポイントをエクスポート
export const apiBaseUrl = isDevelopment ? API_BASE.development : API_BASE.production;