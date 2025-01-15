import { apiBaseUrl } from './config.js';

// デバッグ用（本番環境では無効化）
const DEBUG = window.location.hostname === 'localhost' ||
             window.location.hostname === '127.0.0.1';

// DOM要素
const keywordInput = document.getElementById('keyword');
const minHeartsInput = document.getElementById('minHearts');
const timeRangeSelect = document.getElementById('timeRange');
const searchButton = document.getElementById('searchButton');
const resultsDiv = document.getElementById('results');
const errorMessageDiv = document.getElementById('error-message');

// 検索ボタンのクリックイベント
searchButton.addEventListener('click', performSearch);

// 検索実行関数
async function performSearch() {
    const keyword = keywordInput.value.trim();
    const minHearts = parseInt(minHeartsInput.value) || 0;
    const timeRange = parseInt(timeRangeSelect.value) || 24;

    if (!keyword) {
        showError('キーワードを入力してください。');
        return;
    }

    showLoading();
    try {
        if (DEBUG) {
            console.log('Starting search with params:', { keyword, timeRange, minHearts });
        }

        const response = await fetch(`${apiBaseUrl}/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                keyword,
                timeRange,
                minHearts
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            if (DEBUG) {
                console.error('API Error Response:', {
                    status: response.status,
                    statusText: response.statusText,
                    errorData
                });
            }
            throw new Error(errorData.error || `API request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        if (DEBUG) {
            console.log('Retrieved casts:', data.casts);
        }
        displayResults(data.casts || []);
    } catch (error) {
        if (DEBUG) {
            console.error('Search error details:', {
                error: error.message,
                stack: error.stack
            });
        }
        showError('検索中にエラーが発生しました: ' + error.message);
    }
}

// 結果の表示
function displayResults(casts) {
    if (casts.length === 0) {
        resultsDiv.innerHTML = '<div class="cast-card">条件に一致する投稿が見つかりませんでした。</div>';
        return;
    }

    resultsDiv.innerHTML = casts.map(cast => `
        <div class="cast-card">
            <div class="cast-header">
                <span class="cast-author">${escapeHtml(cast.author.display_name || cast.author.username)}</span>
                <span class="cast-time">${formatDate(cast.timestamp)}</span>
            </div>
            <div class="cast-content">${escapeHtml(cast.text)}</div>
            <div class="cast-stats">
                ❤️ ${cast.reactions?.likes || 0} 
                🔄 ${cast.reactions?.recasts || 0}
            </div>
        </div>
    `).join('');
}

// ユーティリティ関数
function showError(message) {
    console.error('Error:', message);
    errorMessageDiv.textContent = message;
    errorMessageDiv.style.display = 'block';
    resultsDiv.innerHTML = '';
}

function showLoading() {
    resultsDiv.innerHTML = '<div class="loading">検索中...</div>';
    errorMessageDiv.style.display = 'none';
}

function formatDate(timestamp) {
    try {
        return new Date(timestamp).toLocaleString('ja-JP');
    } catch (error) {
        console.error('Date formatting error:', error);
        return 'Invalid Date';
    }
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// 初期値の設定
keywordInput.value = 'DeFAI';