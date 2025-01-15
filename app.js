import { apiBaseUrl } from './config.js';

// Debug mode (disabled in production)
const DEBUG = window.location.hostname === 'localhost' || 
             window.location.hostname === '127.0.0.1';

// DOM elements
const keywordInput = document.getElementById('keyword');
const minHeartsInput = document.getElementById('minHearts');
const timeRangeSelect = document.getElementById('timeRange');
const searchButton = document.getElementById('searchButton');
const resultsDiv = document.getElementById('results');
const errorMessageDiv = document.getElementById('error-message');

// Search button click event
searchButton.addEventListener('click', performSearch);

// Search function
async function performSearch() {
    const keyword = keywordInput.value.trim();
    const minHearts = parseInt(minHeartsInput.value) || 0;
    const timeRange = parseInt(timeRangeSelect.value) || 24;

    if (!keyword) {
        showError('Please enter a keyword');
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
        showError('Error during search: ' + error.message);
    }
}

// Display results
function displayResults(casts) {
    if (casts.length === 0) {
        resultsDiv.innerHTML = '<div class="cast-card">No posts found matching your criteria.</div>';
        return;
    }

    resultsDiv.innerHTML = casts.map(cast => `
        <div class="cast-card">
            <div class="cast-header">
                <div class="author-info">
                    <div class="name-container">
                        <span class="cast-author">${escapeHtml(cast.author.display_name || cast.author.username)}</span>
                        <span class="cast-username">@${escapeHtml(cast.author.username)}</span>
                    </div>
                    <span class="cast-time">${formatDate(cast.timestamp)}</span>
                </div>
            </div>
            <div class="cast-content">${escapeHtml(cast.text)}</div>
            <div class="cast-footer">
                <div class="cast-stats">
                    <div class="stats-container">
                        <span class="stats-label">Reactions at API fetch:</span>
                        <span class="reaction-counts">
                            <span class="reaction-item">❤️ ${cast.reactions?.likes || 0}</span>
                            <span class="reaction-item">🔄 ${cast.reactions?.recasts || 0}</span>
                        </span>
                    </div>
                </div>
                <a href="https://warpcast.com/${encodeURIComponent(cast.author.username)}/${cast.id}" 
                   target="_blank" rel="noopener noreferrer" 
                   class="warpcast-link">
                   View on Warpcast ↗
                </a>
            </div>
        </div>
    `).join('');
}

// Utility functions
function showError(message) {
    console.error('Error:', message);
    errorMessageDiv.textContent = message;
    errorMessageDiv.style.display = 'block';
    resultsDiv.innerHTML = '';
}

function showLoading() {
    resultsDiv.innerHTML = '<div class="loading">Searching...</div>';
    errorMessageDiv.style.display = 'none';
}

function formatDate(timestamp) {
    try {
        return new Date(timestamp).toLocaleString('en-US');
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

// Initial value
keywordInput.value = 'DeFAI';