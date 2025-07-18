// DOM Elements
const menuToggle = document.querySelector('.menu-toggle');
const sidebar = document.querySelector('.sidebar');
const pinBtn = document.querySelector('.fa-thumbtack');
const menuItems = document.querySelectorAll('.menu-item');
const pages = document.querySelectorAll('.page');
const themeToggle = document.querySelector('.theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const themeOptions = document.querySelectorAll('.theme-option');
const sidebarOverlay = document.querySelector('.sidebar-overlay');

// Live TV Fetching Mode
const liveTvFetchingMode = document.getElementById('live-tv-fetching-mode');
const fixedVideosSection = document.getElementById('fixed-videos-section');
const fixedVideosList = document.getElementById('fixed-videos-list');
const fixedVideoInput = document.getElementById('fixed-video-input');
const addFixedVideoBtn = document.getElementById('add-fixed-video');

// YouTube channel data
let youtubeChannels = [];
let instagramAccounts = [];
let facebookAccounts = [];
let twitterAccounts = [];
let fixedLiveVideos = [];
// Default connections
const DEFAULT_YOUTUBE_CHANNELS = [
    { id: 'UCQXWP4gEdEwlb6vodwrU75A', title: 'Swaminarayan Bhagwan' },
    { id: 'UC7HQ3mzdsyvLU0Y7a2t3N7A', title: 'Swaminarayan' }
];
const DEFAULT_FIXED_LIVE_VIDEOS = [
    'https://www.youtube.com/watch?v=OpmL54H8YJU',
    'https://www.youtube.com/watch?v=PJab2ScnQQs',
    'https://www.youtube.com/watch?v=xvamYeFA574',
    'https://www.youtube.com/watch?v=9Z39gmRScKM'
];
const DEFAULT_INSTAGRAM = ['swaminarayanbhagwan_'];
const DEFAULT_FACEBOOK = ['swaminarayanbhagwan2'];
const DEFAULT_TWITTER = ['Swaminarayanbh3'];
const youtubeAccounts = document.getElementById('youtube-accounts');
const youtubeInput = document.getElementById('youtube-input');
const addYoutubeBtn = document.getElementById('add-youtube');
const instagramAccountsDiv = document.getElementById('instagram-accounts');
const instagramInput = document.getElementById('instagram-input');
const addInstagramBtn = document.getElementById('add-instagram');
const facebookAccountsDiv = document.getElementById('facebook-accounts');
const facebookInput = document.getElementById('facebook-input');
const addFacebookBtn = document.getElementById('add-facebook');
const twitterAccountsDiv = document.getElementById('twitter-accounts');
const twitterInput = document.getElementById('twitter-input');
const addTwitterBtn = document.getElementById('add-twitter');
const saveConnectionsBtn = document.getElementById('save-connections');
const refreshBtn = document.querySelector('.refresh-btn');

// YouTube Data API Key and Channel IDs
// YouTube API keys: [0] Main, [1] Mayurbhai Api (fallback)
const YOUTUBE_API_KEYS = [
  'AIzaSyBLMT_7oFeo5xLWv_xQwil8wh3wmDsaZuM',
  // Mayurbhai Api
  'AIzaSyAQErU3GkdcmtjjNgX9RJGuWClwrXUIMLs',
  //Jenish Gabani_Youtube Api Key Prodject
  'AIzaSyB8PV0xxXxfBIrST_p1SDZqFBNGdfNllMg'
];
let currentApiKeyIndex = 0;

function getYouTubeApiKey() {
  return YOUTUBE_API_KEYS[currentApiKeyIndex];
}

// Helper: On quota error, switch to next API key and retry
async function fetchWithApiKeyRetry(urlBuilder, options = {}) {
  let lastError = null;
  for (let i = 0; i < YOUTUBE_API_KEYS.length; i++) {
    const apiKey = YOUTUBE_API_KEYS[currentApiKeyIndex];
    const url = urlBuilder(apiKey);
    try {
      const response = await fetch(url, options);
      const data = await response.json();
      // Quota errors: check for error.code === 403 and reason 'quotaExceeded' or 'dailyLimitExceeded'
      if (data && data.error && data.error.errors) {
        const err = data.error.errors[0];
        if (err.reason === 'quotaExceeded' || err.reason === 'dailyLimitExceeded') {
          // Switch to next key and retry
          currentApiKeyIndex = (currentApiKeyIndex + 1) % YOUTUBE_API_KEYS.length;
          lastError = data.error;
          continue;
        }
      }
      return data;
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError || new Error('YouTube API error');
}

const CHANNEL_IDS = {
    'swaminarayan-bhagwan': 'UCQXWP4gEdEwlb6vodwrU75A',
    'swaminarayan': 'UC7HQ3mzdsyvLU0Y7a2t3N7A'
};

// Pagination variables for YouTube videos
let nextPageTokens = {};
let currentLoadingChannel = null;
let isPinned = true; // Track pin state

// In-memory cache for loaded YouTube videos per channel
const videosCache = {};

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Load saved fixed videos
    loadFixedLiveVideos();
    // Live TV fetching mode
    if (liveTvFetchingMode) {
        liveTvFetchingMode.addEventListener('change', handleLiveTvFetchingModeChange);
        handleLiveTvFetchingModeChange();
    }
    if (addFixedVideoBtn) {
        addFixedVideoBtn.addEventListener('click', addFixedLiveVideo);
    }
    // --- Video Load Options UI logic ---
    const videoLoadMethod = document.getElementById('video-load-method');
    const videoLoadLimitType = document.getElementById('video-load-limit-type');
    const videoLimitInputWrap = document.getElementById('video-limit-input-wrap');
    const videoLimitInput = document.getElementById('video-limit-input');
    const videoLoadBatch = document.getElementById('video-load-batch');

    // Set default options (as per user request)
    if (videoLoadMethod) videoLoadMethod.value = 'button';
    if (videoLoadLimitType) videoLoadLimitType.value = 'limited';
    if (videoLimitInput) videoLimitInput.value = 10;
    if (videoLoadBatch) videoLoadBatch.value = 5;
    if (videoLimitInputWrap) videoLimitInputWrap.style.display = 'inline-flex';

    // Show/hide limit input
    if (videoLoadLimitType) {
        videoLoadLimitType.addEventListener('change', function() {
            if (this.value === 'limited') {
                videoLimitInputWrap.style.display = 'inline-flex';
            } else {
                videoLimitInputWrap.style.display = 'none';
            }
        });
    }

    // Load saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
        // Update theme options
        themeOptions[0].classList.remove('active');
        themeOptions[1].classList.add('active');
    }

    // Sidebar pin state: default to pinned on first load
    const savedPinState = localStorage.getItem('sidebarPinned');
    if (savedPinState === 'false') {
        isPinned = false;
        applyUnpinnedState();
    } else {
        // Default: pinned (true or null)
        isPinned = true;
        applyPinnedState();
    }

    // Load saved connections
    loadConnections();

    // Set up event listeners
    setupEventListeners();

    // Load initial content based on the active page
    const activePage = document.querySelector('.page.active');
    if (activePage) {
        const activePageId = activePage.id;
        if (activePageId === 'youtube-posts') {
            loadYouTubePosts();
        } else if (activePageId === 'live-tv') {
            loadLiveStreams();
        } else if (activePageId === 'social-media') {
            loadSocialMediaWidgets();
        } else if (activePageId === 'youtube-videos') {
            const defaultChannelButton = document.querySelector('.channel-select-btn[data-channel-name="swaminarayan-bhagwan"]');
            if (defaultChannelButton) {
                defaultChannelButton.classList.add('active');
                document.getElementById('swaminarayan-bhagwan-videos').classList.add('active');
                currentLoadingChannel = 'swaminarayan-bhagwan';
                loadYouTubeUploadedVideos('swaminarayan-bhagwan');
            }
        }
    }

    // Infinite scroll setup
    setupYouTubeInfiniteScroll();

    // Live TV / Upcoming Events tab setup
    setupLiveTvTabs();
});

// Set up event listeners
function setupEventListeners() { // <-- This was missing its closing brace
    // Toggle sidebar
    menuToggle.addEventListener('click', toggleSidebar);

    // Pin sidebar functionality
    pinBtn.addEventListener('click', togglePinSidebar);

    // Page navigation with PIN for Connections
    menuItems.forEach(item => {
        if (item.getAttribute('data-page') === 'connections') {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                showPinModal(() => {
                    navigateToPage.call(item);
                });
            });
        } else {
            item.addEventListener('click', navigateToPage);
        }
    });

    function showPinModal(onSuccess) {
        const modal = document.getElementById('pin-modal');
        const input = document.getElementById('pin-input');
        const error = document.getElementById('pin-error');
        const submit = document.getElementById('pin-submit');
        if (!modal || !input || !submit) return;
        error.textContent = '';
        input.value = '';
        modal.style.display = 'flex';
        input.focus();

        function closeModal() {
            modal.style.display = 'none';
            submit.removeEventListener('click', submitHandler);
            input.removeEventListener('keydown', keyHandler);
        }
        function submitHandler() {
            if (input.value === '6598') {
                closeModal();
                if (typeof onSuccess === 'function') onSuccess();
            } else {
                error.textContent = 'Incorrect PIN. Please try again.';
                input.value = '';
                input.focus();
            }
        }
        function keyHandler(e) {
            if (e.key === 'Enter') submitHandler();
            if (e.key === 'Escape') closeModal();
        }
        submit.addEventListener('click', submitHandler);
        input.addEventListener('keydown', keyHandler);
        // Optional: close modal on outside click
        modal.onclick = function(e) {
            if (e.target === modal) closeModal();
        };
    }

    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);
    
    // Theme options
    themeOptions.forEach(option => {
        option.addEventListener('click', () => {
            const theme = option.getAttribute('data-theme');
            setTheme(theme);
            
            // Update active state
            themeOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
        });
    });

    // Add YouTube channel
    addYoutubeBtn.addEventListener('click', addYoutubeChannel);
    addInstagramBtn.addEventListener('click', addInstagramAccount);
    addFacebookBtn.addEventListener('click', addFacebookAccount);
    addTwitterBtn.addEventListener('click', addTwitterAccount);

    // Save connections
    saveConnectionsBtn.addEventListener('click', saveConnections);

    // Refresh streams
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadLiveStreams);
    }

    // Close sidebar when clicking outside (only when unpinned)
    document.addEventListener('click', (event) => {
        const isClickInsideSidebar = sidebar.contains(event.target);
        const isClickOnMenuToggle = menuToggle.contains(event.target);
        const isClickOnPinBtn = pinBtn.contains(event.target);
        // No closeBtn anymore
        const isClickOnCloseBtn = false;

        if (!isClickInsideSidebar && !isClickOnMenuToggle && !isClickOnCloseBtn && !isClickOnPinBtn &&
            sidebar.classList.contains('active') && !isPinned) {
            closeSidebar();
        }
    });

    // Event listeners for YouTube channel selection buttons
    const channelSelectBtns = document.querySelectorAll('.channel-select-btn');
    if (channelSelectBtns.length > 0) {
        channelSelectBtns.forEach(button => {
            button.addEventListener('click', function() {
                const channelName = this.getAttribute('data-channel-name');
                channelSelectBtns.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                document.querySelectorAll('.video-display-grid').forEach(container => {
                    container.classList.remove('active');
                });
                document.getElementById(`${channelName}-videos`).classList.add('active');

                nextPageTokens[channelName] = null;
                document.getElementById(`${channelName}-videos`).innerHTML = '';
                currentLoadingChannel = channelName;
                loadYouTubeUploadedVideos(channelName);
            });
        });
    } // <-- Missing closing brace for the if statement checking channelSelectBtns.length
} // <-- Added missing closing brace for setupEventListeners function

// Apply pinned state
function applyPinnedState() {
    document.body.classList.add('sidebar-pinned');
    sidebar.classList.add('active');
    pinBtn.classList.add('active');
    pinBtn.style.transform = 'rotate(45deg)';
    // Always remove overlay and no-scroll when pinning
    sidebarOverlay.classList.remove('active');
    sidebarOverlay.style.opacity = '0';
    sidebarOverlay.style.visibility = 'hidden';
    sidebarOverlay.style.pointerEvents = 'none'; // CRITICAL: prevent overlay from blocking main
    document.body.classList.remove('no-scroll');
    // Ensure main is clickable
    const main = document.querySelector('main');
    if (main) main.style.pointerEvents = '';
    // Remove any accidental overlays on pages
    pages.forEach(page => page.style.pointerEvents = '');
    localStorage.setItem('sidebarPinned', 'true');
}

// Apply unpinned state
function applyUnpinnedState() {
    document.body.classList.remove('sidebar-pinned');
    pinBtn.classList.remove('active');
    pinBtn.style.transform = 'rotate(0)';
    localStorage.setItem('sidebarPinned', 'false');
    // When unpinned, overlay may be used, so reset pointer-events for main and pages
    sidebarOverlay.style.pointerEvents = '';
    sidebarOverlay.style.opacity = '';
    sidebarOverlay.style.visibility = '';
    const main = document.querySelector('main');
    if (main) main.style.pointerEvents = '';
    pages.forEach(page => page.style.pointerEvents = '');
}

// Toggle sidebar
function toggleSidebar() {
    if (isPinned) return;
    
    if (sidebar.classList.contains('active')) {
        closeSidebar();
    } else {
        openSidebar();
    }
}


// Open sidebar
function openSidebar() {
    sidebar.classList.add('active');
    menuToggle.classList.add('active');
    sidebarOverlay.classList.add('active');
    document.body.classList.add('no-scroll');
}

// Toggle pin sidebar
function togglePinSidebar() {
    isPinned = !isPinned;
    if (isPinned) {
        applyPinnedState();
        openSidebar();
    } else {
        applyUnpinnedState();
        closeSidebar();
    }
}

// Close sidebar
function closeSidebar() {
    if (!isPinned) {
        sidebar.classList.remove('active');
        menuToggle.classList.remove('active');
        sidebarOverlay.classList.remove('active');
        document.body.classList.remove('no-scroll');
    }
}

// Navigate to page
function navigateToPage() {
    menuItems.forEach(i => i.classList.remove('active'));
    this.classList.add('active');

    const pageId = this.getAttribute('data-page');
    pages.forEach(page => {
        page.classList.remove('active');
        // Only the active page is clickable
        page.style.pointerEvents = 'none';
    });
    const activePage = document.getElementById(pageId);
    activePage.classList.add('active');
    activePage.style.pointerEvents = '';

    if (pageId === 'live-tv') {
        loadLiveStreams();
    } else if (pageId === 'youtube-posts') {
        loadYouTubePosts();
    } else if (pageId === 'youtube-videos') {
        const activeChannelBtn = document.querySelector('.channel-select-btn.active');
        const channelName = activeChannelBtn ? activeChannelBtn.getAttribute('data-channel-name') : 'swaminarayan-bhagwan';
        nextPageTokens[channelName] = null;
        document.getElementById(`${channelName}-videos`).innerHTML = '';
        currentLoadingChannel = channelName;
        loadYouTubeUploadedVideos(channelName);
    } else if (pageId === 'daily-darshan') {
        // The iframe will load automatically
    } else if (pageId === 'social-media') {
        loadSocialMediaWidgets();
    } else if (pageId === 'connections') {
        // Connections page doesn't need special handling
    }

    // Close sidebar only if it's not pinned
    if (!isPinned) {
        closeSidebar();
    }
}

// Toggle theme
function toggleTheme() {
    if (document.body.classList.contains('dark-theme')) {
        setTheme('light');
        themeOptions[0].classList.remove('active');
        themeOptions[1].classList.add('active');
    } else {
        setTheme('dark');
        themeOptions[1].classList.remove('active');
        themeOptions[0].classList.add('active');
    }
}

// Set theme
function setTheme(theme) {
    if (theme === 'light') {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
        localStorage.setItem('theme', 'light');
    } else {
        document.body.classList.remove('light-theme');
        document.body.classList.add('dark-theme');
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
        localStorage.setItem('theme', 'dark');
    }
    
    // Re-load Twitter widget to apply new theme if on social media page
    if (document.getElementById('social-media').classList.contains('active')) {
        loadTwitterWidget();
    }
}

// Add YouTube channel
function addYoutubeChannel() {
    const channelId = youtubeInput.value.trim();
    if (channelId && !youtubeChannels.some(c => c.id === channelId)) {
        fetchWithApiKeyRetry(
            (apiKey) => `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}&key=${apiKey}`
        )
            .then(data => {
                if (data.items && data.items.length > 0) {
                    const channel = data.items[0];
                    youtubeChannels.push({
                        id: channelId,
                        title: channel.snippet.title, // Changed 'name' to 'title' for consistency
                        url: `https://www.youtube.com/channel/${channelId}` // Corrected URL
                    });
                    renderYoutubeAccounts();
                    youtubeInput.value = '';
                } else {
                    alert('Invalid YouTube Channel ID');
                }
            })
            .catch(() => alert('Failed to fetch channel info.'));
    }
}

// Render YouTube accounts
function renderYoutubeAccounts() {
    youtubeAccounts.innerHTML = '';
    if (!Array.isArray(youtubeChannels)) youtubeChannels = [];
    youtubeChannels.forEach((channel, idx) => {
        if (!channel || !channel.id) return;
        const div = document.createElement('div');
        div.className = 'account-item';
        div.innerHTML = `
            <span class="account-label">${channel.title ? channel.title : channel.id}</span>
            <button class="remove-btn" title="Remove" data-idx="${idx}"><i class="fas fa-times"></i></button>
        `;
        div.querySelector('.remove-btn').onclick = function() {
            youtubeChannels.splice(idx, 1);
            renderYoutubeAccounts();
        };
        youtubeAccounts.appendChild(div);
    });
}

// Add Instagram account
function addInstagramAccount() {
    const username = instagramInput.value.trim();
    if (username && !instagramAccounts.includes(username)) {
        instagramAccounts.push(username);
        renderInstagramAccounts();
        instagramInput.value = '';
    }
}
function renderInstagramAccounts() {
    instagramAccountsDiv.innerHTML = '';
    if (!Array.isArray(instagramAccounts)) instagramAccounts = [];
    instagramAccounts.forEach((username, idx) => {
        if (!username) return;
        const div = document.createElement('div');
        div.className = 'account-item';
        div.innerHTML = `
            <span class="account-label">${username}</span>
            <button class="remove-btn" title="Remove" data-idx="${idx}"><i class="fas fa-times"></i></button>
        `;
        div.querySelector('.remove-btn').onclick = function() {
            instagramAccounts.splice(idx, 1);
            renderInstagramAccounts();
        };
        instagramAccountsDiv.appendChild(div);
    });
}

// Add Facebook account
function addFacebookAccount() {
    const username = facebookInput.value.trim();
    if (username && !facebookAccounts.includes(username)) {
        facebookAccounts.push(username);
        renderFacebookAccounts();
        facebookInput.value = '';
    }
}
function renderFacebookAccounts() {
    facebookAccountsDiv.innerHTML = '';
    if (!Array.isArray(facebookAccounts)) facebookAccounts = [];
    facebookAccounts.forEach((username, idx) => {
        if (!username) return;
        const div = document.createElement('div');
        div.className = 'account-item';
        div.innerHTML = `
            <span class="account-label">${username}</span>
            <button class="remove-btn" title="Remove" data-idx="${idx}"><i class="fas fa-times"></i></button>
        `;
        div.querySelector('.remove-btn').onclick = function() {
            facebookAccounts.splice(idx, 1);
            renderFacebookAccounts();
        };
        facebookAccountsDiv.appendChild(div);
    });
}

// Add Twitter account
function addTwitterAccount() {
    const username = twitterInput.value.trim();
    if (username && !twitterAccounts.includes(username)) {
        twitterAccounts.push(username);
        renderTwitterAccounts();
        twitterInput.value = '';
    }
}
function renderTwitterAccounts() {
    twitterAccountsDiv.innerHTML = '';
    if (!Array.isArray(twitterAccounts)) twitterAccounts = [];
    twitterAccounts.forEach((username, idx) => {
        if (!username) return;
        const div = document.createElement('div');
        div.className = 'account-item';
        div.innerHTML = `
            <span class="account-label">${username}</span>
            <button class="remove-btn" title="Remove" data-idx="${idx}"><i class="fas fa-times"></i></button>
        `;
        div.querySelector('.remove-btn').onclick = function() {
            twitterAccounts.splice(idx, 1);
            renderTwitterAccounts();
        };
        twitterAccountsDiv.appendChild(div);
    });
}

// Save connections
function saveConnections() {
    localStorage.setItem('youtubeChannels', JSON.stringify(youtubeChannels));
    localStorage.setItem('instagramAccounts', JSON.stringify(instagramAccounts));
    localStorage.setItem('facebookAccounts', JSON.stringify(facebookAccounts));
    localStorage.setItem('twitterAccounts', JSON.stringify(twitterAccounts));
    saveConnectionsBtn.innerHTML = '<i class="fas fa-check"></i> Saved Successfully!';
    saveConnectionsBtn.style.background = 'var(--success-dark)';
    if (document.body.classList.contains('light-theme')) {
        saveConnectionsBtn.style.background = 'var(--success-light)';
    }
    setTimeout(() => {
        saveConnectionsBtn.innerHTML = 'Save Connections';
        saveConnectionsBtn.style.background = '';
    }, 2000);
}

// Load connections
function loadConnections() {
    // YouTube
    const savedChannels = localStorage.getItem('youtubeChannels');
    if (savedChannels) {
        try {
            youtubeChannels = JSON.parse(savedChannels).filter(c => c && c.id);
        } catch {
            youtubeChannels = [];
        }
    } else {
        youtubeChannels = [...DEFAULT_YOUTUBE_CHANNELS];
    }
    renderYoutubeAccounts();

    // Instagram
    const savedInstagram = localStorage.getItem('instagramAccounts');
    if (savedInstagram) {
        try {
            instagramAccounts = JSON.parse(savedInstagram).filter(Boolean);
        } catch {
            instagramAccounts = [];
        }
    } else {
        instagramAccounts = [...DEFAULT_INSTAGRAM];
    }
    renderInstagramAccounts();

    // Facebook
    const savedFacebook = localStorage.getItem('facebookAccounts');
    if (savedFacebook) {
        try {
            facebookAccounts = JSON.parse(savedFacebook).filter(Boolean);
        } catch {
            facebookAccounts = [];
        }
    } else {
        facebookAccounts = [...DEFAULT_FACEBOOK];
    }
    renderFacebookAccounts();

    // Twitter
    const savedTwitter = localStorage.getItem('twitterAccounts');
    if (savedTwitter) {
        try {
            twitterAccounts = JSON.parse(savedTwitter).filter(Boolean);
        } catch {
            twitterAccounts = [];
        }
    } else {
        twitterAccounts = [...DEFAULT_TWITTER];
    }
    renderTwitterAccounts();
}

// Load fixed live videos
function loadFixedLiveVideos() {
    const savedFixed = localStorage.getItem('fixedLiveVideos');
    if (savedFixed) {
        try {
            fixedLiveVideos = JSON.parse(savedFixed).filter(Boolean);
        } catch {
            fixedLiveVideos = [];
        }
    } else {
        fixedLiveVideos = [...DEFAULT_FIXED_LIVE_VIDEOS];
    }
    renderFixedLiveVideos();
}

function saveFixedLiveVideos() {
    localStorage.setItem('fixedLiveVideos', JSON.stringify(fixedLiveVideos));
}

function renderFixedLiveVideos() {
    if (!fixedVideosList) return;
    fixedVideosList.innerHTML = '';
    if (!Array.isArray(fixedLiveVideos)) fixedLiveVideos = [];
    fixedLiveVideos.forEach(async (videoUrl, idx) => {
        if (!videoUrl) return;
        const videoId = extractYouTubeVideoId(videoUrl);
        const div = document.createElement('div');
        div.className = 'video-container';
        div.style.marginBottom = '18px';
        if (videoId) {
            // Show loader while fetching details
            div.innerHTML = `
                <div class="video-title">
                    <i class="fas fa-circle online"></i>
                    <span class="video-name">Loading...</span>
                    <a href="${videoUrl}" target="_blank" style="margin-left:10px; color:var(--accent-dark); text-decoration:underline;">Open</a>
                    <button class="remove-btn" title="Remove" data-idx="${idx}" style="margin-left:12px;background:transparent;border:none;color:#e74c3c;cursor:pointer;font-size:1.1rem;"><i class="fas fa-times"></i></button>
                </div>
            `;
            fixedVideosList.appendChild(div);
            // Fetch video details
            try {
                const apiKey = getYouTubeApiKey();
                const resp = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`);
                const data = await resp.json();
                if (data.items && data.items.length > 0) {
                    const snippet = data.items[0].snippet;
                    const title = snippet.title;
                    const channelTitle = snippet.channelTitle;
                    div.querySelector('.video-name').textContent = `${channelTitle} - ${title}`;
                } else {
                    div.querySelector('.video-name').textContent = 'Video not found';
                }
            } catch {
                div.querySelector('.video-name').textContent = 'Error loading details';
            }
        } else {
            div.innerHTML = `<div class=\"error\">Invalid YouTube link</div>`;
        }
        const removeBtn = div.querySelector('.remove-btn');
        if (removeBtn) {
            removeBtn.onclick = function() {
                fixedLiveVideos.splice(idx, 1);
                saveFixedLiveVideos();
                renderFixedLiveVideos();
            };
        }
        if (!div.parentElement) fixedVideosList.appendChild(div);
    });
}

function addFixedLiveVideo() {
    const url = fixedVideoInput.value.trim();
    if (url && extractYouTubeVideoId(url) && !fixedLiveVideos.includes(url)) {
        fixedLiveVideos.push(url);
        saveFixedLiveVideos();
        renderFixedLiveVideos();
        fixedVideoInput.value = '';
    }
}

function extractYouTubeVideoId(url) {
    // Handles various YouTube URL formats
    const regExp = /^.*(?:https?:\/\/(?:www\.)?youtube\.com\/(?:embed\/|v\/|watch\?v=|youtu\.be\/|shorts\/|live\/)|https?:\/\/m\.youtube\.com\/watch\?v=)([^#&?\n]{11}).*/; // Corrected regex for YouTube URLs
    const match = url.match(regExp);
    return match && match[1] ? match[1] : null;
}

function handleLiveTvFetchingModeChange() {
    if (!liveTvFetchingMode) return;
    if (liveTvFetchingMode.value === 'fixed') {
        if (fixedVideosSection) fixedVideosSection.style.display = '';
    } else {
        if (fixedVideosSection) fixedVideosSection.style.display = 'none';
    }
}

// Load live streams
async function loadLiveStreams() {
    const videoGrid = document.getElementById('live-tv-video-grid');
    if (!videoGrid) return;
    videoGrid.innerHTML = '';

    // Check fetching mode
    if (liveTvFetchingMode && liveTvFetchingMode.value === 'fixed') {
        // Show fixed videos
        if (fixedLiveVideos.length === 0) {
            const div = document.createElement('div');
            div.className = 'youtube-videos-status';
            div.textContent = 'No fixed videos added.';
            videoGrid.appendChild(div);
        } else {
            fixedLiveVideos.forEach((url) => {
                const videoId = extractYouTubeVideoId(url);
                if (videoId) {
                    const container = document.createElement('div');
                    container.className = 'video-container';
                    container.innerHTML = `
                        <div class="video-frame">
                            <iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1" frameborder="0" allow="autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                        </div>
                        <div class="video-title">
                            <i class="fas fa-circle online"></i>
                            <span class="video-name">${url}</span>
                        </div>
                    `;
                    videoGrid.appendChild(container);
                }
            });
        }
        return;
    }

    // Use the YouTube channels from connections (default)
    for (const channel of youtubeChannels) {
        try {
            // Fetch all live events for this channel
            const searchData = await fetchWithApiKeyRetry(
                (apiKey) => `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channel.id}&eventType=live&type=video&maxResults=5&key=${apiKey}`
            );
            if (searchData.items && searchData.items.length > 0) {
                for (const live of searchData.items) {
                    const videoId = live.id.videoId;
                    const title = live.snippet.title;
                    const container = document.createElement('div');
                    container.className = 'video-container';
                    container.innerHTML = `
                        <div class="video-frame">
                            <iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1" frameborder="0" allow="autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                        </div>
                        <div class="video-title">
                            <i class="fas fa-circle online"></i>
                            <span class="video-name">${channel.title || channel.id} - ${title}</span>
                        </div>
                    `;
                    videoGrid.appendChild(container);
                }
            } else {
                // No live event for this channel
                const container = document.createElement('div');
                container.className = 'video-container';
                container.innerHTML = `
                    <div class="video-frame">
                        <div class='error' style='padding:20px;text-align:center;'>No live event</div>
                    </div>
                    <div class="video-title">
                        <i class="fas fa-circle offline"></i>
                        <span class="video-name">${channel.title || channel.id}</span>
                    </div>
                `;
                videoGrid.appendChild(container);
            }
        } catch (e) {
            let errorMsg = 'Error loading live event';
            if (e && e.error && e.error.message) {
                errorMsg += `: ${e.error.message}`;
            } else if (e && e.message) {
                errorMsg += `: ${e.message}`;
            } else if (typeof e === 'string') {
                errorMsg += `: ${e}`;
            }
            const container = document.createElement('div');
            container.className = 'video-container';
            container.innerHTML = `
                <div class="video-frame">
                    <div class='error' style='padding:20px;text-align:center;'>${errorMsg}</div>
                </div>
                <div class="video-title">
                    <i class="fas fa-circle offline"></i>
                    <span class="video-name">${channel.title || channel.id}</span>
                </div>
            `;
            videoGrid.appendChild(container);
        }
    }
}

// Function to load YouTube posts
function loadYouTubePosts() {
    const bhagwanPostsContainer = document.getElementById('swaminarayan-bhagwan-posts');
    const swaminarayanPostsContainer = document.getElementById('swaminarayan-posts');

    bhagwanPostsContainer.innerHTML = '';
    swaminarayanPostsContainer.innerHTML = '';

    // Corrected URLs for community tabs
    const bhagwanChannelUrl = `https://www.youtube.com/channel/${CHANNEL_IDS['swaminarayan-bhagwan']}/community`;
    const swaminarayanChannelUrl = `https://www.youtube.com/channel/${CHANNEL_IDS['swaminarayan']}/community`;

    bhagwanPostsContainer.innerHTML = `
        <div class="error" style="text-align: center; padding: 20px;">
            <p style="margin-bottom: 10px;">YouTube community posts are not directly embeddable via simple iframes.</p>
            <p>Please visit the community tab directly:</p>
            <a href="${bhagwanChannelUrl}" target="_blank" style="color: var(--accent-dark); text-decoration: none; font-weight: bold;">
                Swaminarayan Bhagwan Community <i class="fas fa-external-link-alt"></i>
            </a>
        </div>
    `;

    swaminarayanPostsContainer.innerHTML = `
        <div class="error" style="text-align: center; padding: 20px;">
            <p style="margin-bottom: 10px;">YouTube community posts are not directly embeddable via simple iframes.</p>
            <p>Please visit the community tab directly:</p>
            <a href="${swaminarayanChannelUrl}" target="_blank" style="color: var(--accent-dark); text-decoration: none; font-weight: bold;">
                Swaminarayan Community <i class="fas fa-external-link-alt"></i>
            </a>
        </div>
    `;
}

// Function to fetch and display YouTube uploaded videos
async function loadYouTubeUploadedVideos(channelName, loadMore = false) {
    const containerId = `${channelName}-videos`;
    const container = document.getElementById(containerId);
    if (!container) return;

    currentLoadingChannel = channelName;

    // If not loading more and we have cache, just render from cache
    if (!loadMore && videosCache[channelName] && videosCache[channelName].length > 0) {
        renderYouTubeVideos(containerId, videosCache[channelName], null, true); // append=true to keep all
        return;
    }

    let loader = container.querySelector('.loader-container');
    if (!loader) {
        loader = document.createElement('div');
        loader.className = 'loader-container';
        loader.style.width = '100%';
        loader.style.textAlign = 'center';
        loader.style.padding = '20px';
        loader.innerHTML = '<div class="loader-circle" style="margin: 0 auto;"></div>';
        container.appendChild(loader);
    }

    const channelId = CHANNEL_IDS[channelName];
    if (!channelId) {
        if (loader) loader.remove();
        container.innerHTML = `<div class="error">Invalid channel name provided.</div>`;
        return;
    }

    try {
        const channelData = await fetchWithApiKeyRetry(
            (apiKey) => `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${apiKey}`
        );
        const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;

        let url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&key=${getYouTubeApiKey()}&maxResults=12`;
        if (nextPageTokens[channelName]) {
            url += `&pageToken=${nextPageTokens[channelName]}`;
        }

        const videosData = await fetchWithApiKeyRetry(
            (apiKey) => url.replace(/key=[^&]+/, `key=${apiKey}`)
        );

        const videoIds = videosData.items.map(item => item.contentDetails.videoId).join(',');
        let videoStats = {};
        if (videoIds) {
            const statsData = await fetchWithApiKeyRetry(
                (apiKey) => `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}&key=${apiKey}`
            );
            if (statsData.items) {
                statsData.items.forEach(item => {
                    videoStats[item.id] = item.statistics;
                });
            } else {
                console.warn("Could not fetch video statistics");
            }
        }

        nextPageTokens[channelName] = videosData.nextPageToken || null;

        if (loader) {
            loader.remove();
        }

        // Cache videos: if loading more, append; else, set
        if (!videosCache[channelName]) videosCache[channelName] = [];
        if (loadMore) {
            videosCache[channelName] = videosCache[channelName].concat(videosData.items);
        } else {
            videosCache[channelName] = videosData.items.slice();
        }

        // Always render all cached videos for this channel
        renderYouTubeVideos(containerId, videosCache[channelName], videoStats, true); // Pass videoStats here

    } catch (error) {
        console.error('Error fetching YouTube videos:', error);
        if (loader) {
            loader.remove();
        }
        let errorMessage = 'Failed to load videos. This could be due to API key issues, network problems, or too many requests.';
        if (error && error.error && error.error.message) {
            errorMessage += `<br><b>API Error:</b> ${error.error.message}`;
        } else if (error && error.message) {
            errorMessage += `<br><b>Error:</b> ${error.message}`;
        } else if (typeof error === 'string') {
            errorMessage += `<br><b>Error:</b> ${error}`;
        }
        container.innerHTML += `<div class="error" style="padding: 20px;">${errorMessage}</div>`;
    } finally {
        const youtubeVideosPage = document.getElementById('youtube-videos');
        if (youtubeVideosPage) {
            youtubeVideosPage.dataset.loading = '';
        }
    }
}

// Function to render YouTube videos
function renderYouTubeVideos(containerId, videos, videoStats, append = false) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Get options
    const method = document.getElementById('video-load-method')?.value || 'scroll';
    const limitType = document.getElementById('video-load-limit-type')?.value || 'all';
    const limit = limitType === 'limited' ? parseInt(document.getElementById('video-limit-input')?.value || '100', 10) : null;
    const batch = parseInt(document.getElementById('video-load-batch')?.value || '12', 10);

    // Only clear container if not appending
    if (!append) container.innerHTML = '';

    // Remove any previous messages
    const oldMsg = container.querySelector('.video-limit-msg, .no-more-videos-message');
    if (oldMsg) oldMsg.remove();

    // Determine how many videos to show
    let showCount = videos.length;
    if (limitType === 'limited' && limit && videos.length > limit) {
        showCount = limit;
    }

    // For button mode, only show up to batch (or next batch)
    let alreadyShown = container.querySelectorAll('.youtube-video-item').length;
    let toShow = showCount - alreadyShown;
    if (method === 'button') {
        toShow = Math.min(batch, toShow);
    }

    // If no videos at all
    if (videos.length === 0 && !append) {
        container.innerHTML = `<div class="error" style="text-align: center; padding: 20px;">No uploaded videos found for this channel or embedding is restricted.</div>`;
        return;
    }

    // Render videos
    for (let i = alreadyShown; i < alreadyShown + toShow && i < showCount; i++) {
        const video = videos[i];
        const videoId = video.contentDetails.videoId;
        const title = video.snippet.title;
        const thumbnailUrl = video.snippet.thumbnails.medium.url;
        const publishedAt = new Date(video.snippet.publishedAt);
        const relativeTime = timeAgo(publishedAt);
        const viewCount = videoStats && videoStats[videoId] ? formatNumber(videoStats[videoId].viewCount) : 'N/A';

        const videoItem = document.createElement('div');
        videoItem.className = 'youtube-video-item';
        videoItem.innerHTML = `
            <img src="${thumbnailUrl}" alt="${title}">
            <div class="youtube-video-item-info">
                <h3>${title}</h3>
                <p>Published: ${relativeTime}</p>
                <p>Views: ${viewCount}</p>
                <a href="https://www.youtube.com/watch?v=${videoId}" target="_blank">Watch Video <i class="fas fa-external-link-alt"></i></a>
            </div>
        `;
        container.appendChild(videoItem);
    }

    // Show Load More button if needed
    let loadMoreBtn = container.querySelector('.youtube-load-more-btn');
    if (loadMoreBtn) loadMoreBtn.remove();
    if (method === 'button' && alreadyShown + toShow < showCount) {
        loadMoreBtn = document.createElement('button');
        loadMoreBtn.className = 'youtube-load-more-btn';
        loadMoreBtn.textContent = 'Load More';
        loadMoreBtn.onclick = function() {
            renderYouTubeVideos(containerId, videos, videoStats, true);
        };
        container.appendChild(loadMoreBtn);
    }

    // Show limit message if reached
    if (limitType === 'limited' && alreadyShown + toShow >= showCount) {
        const msg = document.createElement('div');
        msg.className = 'video-limit-msg';
        msg.style = 'color: var(--danger); text-align: center; margin: 18px 0; font-weight: 600;';
        msg.textContent = 'Video limit reached';
        container.appendChild(msg);
    }
    
    // Only show "no more videos" message when not in limited mode
    if (limitType !== 'limited' && nextPageTokens[channelName.replace('-videos', '')] === null) {
        if (!container.querySelector('.no-more-videos-message')) {
            const noMoreVideosDiv = document.createElement('div');
            noMoreVideosDiv.className = 'error no-more-videos-message';
            noMoreVideosDiv.style.textAlign = 'center';
            noMoreVideosDiv.style.padding = '20px';
            noMoreVideosDiv.textContent = 'No more videos to load.';
            container.appendChild(noMoreVideosDiv);
        }
    }
}

// Helper function to format large numbers
function formatNumber(num) {
    num = Number(num);
    if (isNaN(num)) return 'N/A';

    if (num >= 1000000000) return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return num.toString();
}

// Helper function to calculate time ago
function timeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000; // Years
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000; // Months
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400; // Days
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600; // Hours
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60; // Minutes
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
}

// Infinite scroll for YouTube videos
function setupYouTubeInfiniteScroll() {
    const videosPage = document.getElementById('youtube-videos');
    if (!videosPage) return;
    let loading = false;
    window.addEventListener('scroll', async function onScroll() {
        if (!videosPage.classList.contains('active')) return;
        
        // Check loading method - skip if using button method
        const method = document.getElementById('video-load-method')?.value;
        if (method === 'button') return;
        
        const activeGrid = document.querySelector('.video-display-grid.active');
        if (!activeGrid) return;
        const rect = activeGrid.getBoundingClientRect();
        if (loading) return;
        // If user scrolled near the bottom of the grid (200px from bottom)
        if (rect.bottom - window.innerHeight < 200) {
            loading = true;
            // Find which channel is active
            const activeBtn = document.querySelector('.channel-select-btn.active');
            if (activeBtn) {
                const channelName = activeBtn.getAttribute('data-channel-name');
                await loadYouTubeUploadedVideos(channelName, true); // true = load more
            }
            loading = false;
        }
    });
}

// --- Live TV / Upcoming Events Tab Logic ---
function setupLiveTvTabs() {
    const liveTvTabBtn = document.querySelector('.live-tv-tab-btn[data-tab="live"]');
    const upcomingTabBtn = document.querySelector('.live-tv-tab-btn[data-tab="upcoming"]');
    const liveGrid = document.getElementById('live-tv-video-grid');
    const upcomingGrid = document.getElementById('upcoming-events-grid');
    if (!liveTvTabBtn || !upcomingTabBtn || !liveGrid || !upcomingGrid) return;
    liveTvTabBtn.addEventListener('click', function() {
        liveTvTabBtn.classList.add('active');
        upcomingTabBtn.classList.remove('active');
        liveGrid.classList.add('active');
        liveGrid.style.display = '';
        upcomingGrid.classList.remove('active');
        upcomingGrid.style.display = 'none';
    });
    upcomingTabBtn.addEventListener('click', function() {
        liveTvTabBtn.classList.remove('active');
        upcomingTabBtn.classList.add('active');
        liveGrid.classList.remove('active');
        liveGrid.style.display = 'none';
        upcomingGrid.classList.add('active');
        upcomingGrid.style.display = '';
        loadUpcomingEvents();
    });
}

// --- Fetch and Render Upcoming YouTube Events ---
async function fetchUpcomingEventsForChannel(channelId) {
    // Use API key with fallback
    const data = await fetchWithApiKeyRetry(
      (apiKey) => `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&eventType=upcoming&type=video&order=date&key=${apiKey}`
    );
    if (!data.items) return [];
    // Filter out events that are not truly upcoming (by checking scheduledStartTime)
    const now = new Date();
    const events = [];
    for (const item of data.items) {
        // Get video details for scheduled start time
        const videoId = item.id.videoId;
        const detailsData = await fetchWithApiKeyRetry(
          (apiKey) => `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails,snippet&id=${videoId}&key=${apiKey}`
        );
        if (detailsData.items && detailsData.items.length > 0) {
            const video = detailsData.items[0];
            const scheduled = video.liveStreamingDetails && video.liveStreamingDetails.scheduledStartTime;
            if (scheduled && new Date(scheduled) > now) {
                // Avoid duplicates by videoId
                events.push({
                    id: videoId,
                    title: video.snippet.title,
                    date: scheduled,
                    thumb: video.snippet.thumbnails && (video.snippet.thumbnails.high?.url || video.snippet.thumbnails.medium?.url || video.snippet.thumbnails.default?.url),
                    url: `https://www.youtube.com/watch?v=${videoId}` // Corrected URL
                });
            }
        }
    }
    return events;
}

async function loadUpcomingEvents() {
    const grid = document.getElementById('upcoming-events-grid');
    if (!grid) return;
    grid.innerHTML = '';
    // Use all connected YouTube channels
    let allEvents = [];
    const seenIds = new Set();
    const eventChannelMap = {};
    
    // Create a map to track events by their unique videoId
    const eventMap = new Map();

    for (const channel of youtubeChannels) {
        const events = await fetchUpcomingEventsForChannel(channel.id);
        for (const ev of events) {
            // Use video ID as unique key
            const eventKey = ev.id;
            if (!eventMap.has(eventKey)) {
                eventMap.set(eventKey, ev);
                eventChannelMap[eventKey] = channel;
            } else {
                // If duplicate, prefer the channel with a more descriptive name (not just id)
                const existingChannel = eventChannelMap[eventKey];
                if (
                    (!existingChannel.name && (channel.name || channel.title)) ||
                    (existingChannel.id === eventKey && (channel.name || channel.title))
                ) {
                    eventChannelMap[eventKey] = channel;
                }
            }
        }
    }
    
    // Convert map values to array
    allEvents = Array.from(eventMap.values());
    
    // Sort by soonest date
    allEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
    // Sort by soonest date
    allEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
    if (allEvents.length === 0) {
        grid.innerHTML = `<div class="error" style="text-align:center;padding:30px;">No upcoming events found.</div>`;
        return;
    }
    // Render event cards in YouTube video card style (match .youtube-video-item)
    for (const ev of allEvents) {
        const channel = eventChannelMap[ev.id];
        const card = document.createElement('div');
        card.className = 'youtube-video-item';
        card.style.width = '260px';
        card.style.margin = '0 16px 24px 0';
        card.innerHTML = `
            <img src="${ev.thumb || ''}" alt="${ev.title}" style="width:100%;height:180px;object-fit:cover;display:block;">
            <div class="youtube-video-item-info">
                <h3 style="font-size:1.05rem;max-height:2.8em;overflow:hidden;text-overflow:ellipsis;white-space:normal;line-height:1.35;">${ev.title}</h3>
                <p style="font-size:0.95rem;">Scheduled: ${new Date(ev.date).toLocaleString()}</p>
                <div style="font-size:0.93rem;color:#7ec1ff;margin-bottom:4px;">Channel: <span style="font-weight:600;">${channel && (channel.name || channel.title || channel.id)}</span></div>
                <a href="${ev.url}" target="_blank">Watch on YouTube <i class='fas fa-external-link-alt'></i></a>
            </div>
        `;
        grid.appendChild(card);
    }
}

// --- Call setupLiveTvTabs in DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', () => {
    // ...existing code...
    setupLiveTvTabs();
    // ...existing code...
});

// Function to load social media widgets
function loadSocialMediaWidgets() {
    try {
        loadFacebookWidget();
        loadInstagramWidget();
        setTimeout(loadTwitterWidget, 500);
    } catch (error) {
        console.error("Social media load error:", error);
    }
}

// Function to load Facebook widget
function loadFacebookWidget() {
    const facebookContainer = document.getElementById('facebook-widget-container');
    if (!facebookContainer) return;
    facebookContainer.innerHTML = '';

    const iframe = document.createElement('iframe');
    iframe.src = "https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Fswaminarayanbhagwan2%2F&tabs=timeline&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true&appId";
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.frameBorder = '0';
    iframe.allowTransparency = 'true';
    iframe.allow = 'autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share';
    facebookContainer.appendChild(iframe);
}

// Function to load Instagram widget
function loadInstagramWidget() {
    const container = document.getElementById('instagram-widget-container');
    if (!container) return;

    container.innerHTML = '';
    const blockquote = document.createElement('blockquote');
    blockquote.className = 'instagram-media';
    blockquote.setAttribute('data-instgrm-permalink', 'https://www.instagram.com/p/CrYenF0vL3n/');
    blockquote.setAttribute('data-instgrm-version', '14');
    blockquote.style.width = '100%';
    blockquote.style.height = '500px';
    container.appendChild(blockquote);

    // Create and append the Instagram script
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.instagram.com/embed.js';
    document.body.appendChild(script);
}

// Function to load Twitter widget
function loadTwitterWidget() {
    const twitterContainer = document.getElementById('twitter-widget-container');
    if (!twitterContainer) return;

    twitterContainer.innerHTML = '<div class="loader"><div class="loader-circle"></div></div>';

    const currentTheme = document.body.classList.contains('light-theme') ? 'light' : 'dark';

    // Remove any existing Twitter script
    const existingScript = document.querySelector('script[src="https://platform.twitter.com/widgets.js"]');
    if (existingScript) {
        existingScript.remove();
    }

    // Create Twitter timeline element
    twitterContainer.innerHTML = '';
    const twitterTimeline = document.createElement('a');
    twitterTimeline.className = 'twitter-timeline';
    // Consider making this dynamic based on twitterAccounts if multiple are expected
    twitterTimeline.href = 'https://x.com/TheCensorTalk'; // Kept as is, as it's not a syntax error
    twitterTimeline.textContent = 'Tweets by TheCensorTalk';
    twitterTimeline.setAttribute('data-width', '100%');
    twitterTimeline.setAttribute('data-height', '500');
    twitterTimeline.setAttribute('data-dnt', 'true');
    twitterTimeline.setAttribute('data-chrome', 'noheader nofooter transparent');
    twitterTimeline.setAttribute('data-tweet-limit', '5');
    twitterTimeline.setAttribute('data-theme', currentTheme);
    twitterContainer.appendChild(twitterTimeline);

    // Create and append Twitter script
    const script = document.createElement('script');
    script.src = 'https://platform.twitter.com/widgets.js';
    script.async = true;
    script.charset = 'utf-8';
    document.body.appendChild(script);
}