// DOM Elements
const menuToggle = document.querySelector('.menu-toggle');
const sidebar = document.querySelector('.sidebar');
const pinBtn = document.querySelector('.fa-thumbtack');
const closeBtn = document.querySelector('.fa-times');
const menuItems = document.querySelectorAll('.menu-item');
const pages = document.querySelectorAll('.page');
const themeToggle = document.querySelector('.theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const themeOptions = document.querySelectorAll('.theme-option');
const sidebarOverlay = document.querySelector('.sidebar-overlay');

// YouTube channel data
let youtubeChannels = [];
const youtubeAccounts = document.getElementById('youtube-accounts');
const youtubeInput = document.getElementById('youtube-input');
const addYoutubeBtn = document.getElementById('add-youtube');
const saveConnectionsBtn = document.getElementById('save-connections');
const refreshBtn = document.querySelector('.refresh-btn');

// YouTube Data API Key and Channel IDs
const YOUTUBE_API_KEY = 'AIzaSyBLMT_7oFeo5xLWv_xQwil8wh3wmDsaZuM';
const CHANNEL_IDS = {
    'swaminarayan-bhagwan': 'UCQXWP4gEdEwlb6vodwrU75A',
    'swaminarayan': 'UC7HQ3mzdsyvLU0Y7a2t3N7A'
};

// Pagination variables for YouTube videos
let nextPageTokens = {};
let currentLoadingChannel = null;
let isPinned = true; // Track pin state

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
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

    // Load saved pin state
  // Add this to DOMContentLoaded
const savedPinState = localStorage.getItem('sidebarPinned');
if (savedPinState === 'true') {
    isPinned = true;
    applyPinnedState();
} else if (savedPinState === 'false') {
    isPinned = false;
    applyUnpinnedState();
} else {
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
});

// Set up event listeners
function setupEventListeners() {
    // Toggle sidebar
    menuToggle.addEventListener('click', toggleSidebar);

    // Pin sidebar functionality
    pinBtn.addEventListener('click', togglePinSidebar);

    // Close sidebar using the 'X' button
    closeBtn.addEventListener('click', closeSidebar);

    // Page navigation
    menuItems.forEach(item => {
        item.addEventListener('click', navigateToPage);
    });

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
        const isClickOnCloseBtn = closeBtn.contains(event.target);
        const isClickOnPinBtn = pinBtn.contains(event.target);

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
    }

    // Infinite scroll for YouTube videos
    const youtubeVideosPage = document.getElementById('youtube-videos');
    if (youtubeVideosPage) {
        youtubeVideosPage.addEventListener('scroll', handleInfiniteScroll);
    }
}

// Apply pinned state
function applyPinnedState() {
    document.body.classList.add('sidebar-pinned');
    sidebar.classList.add('active');
    pinBtn.classList.add('active');
    pinBtn.style.transform = 'rotate(45deg)';
    sidebarOverlay.classList.remove('active');
    document.body.classList.remove('no-scroll');
    localStorage.setItem('sidebarPinned', 'true');
}

// Apply unpinned state
function applyUnpinnedState() {
    document.body.classList.remove('sidebar-pinned');
    pinBtn.classList.remove('active');
    pinBtn.style.transform = 'rotate(0)';
    localStorage.setItem('sidebarPinned', 'false');
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

// Add these helper functions
function applyPinnedState() {
    document.body.classList.add('sidebar-pinned');
    sidebar.classList.add('active');
    pinBtn.classList.add('active');
    pinBtn.style.transform = 'rotate(45deg)';
    sidebarOverlay.classList.remove('active');
    document.body.classList.remove('no-scroll');
    localStorage.setItem('sidebarPinned', 'true');
}

function applyUnpinnedState() {
    document.body.classList.remove('sidebar-pinned');
    pinBtn.classList.remove('active');
    pinBtn.style.transform = 'rotate(0)';
    localStorage.setItem('sidebarPinned', 'false');
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
    pages.forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');

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
    if (channelId) {
        if (!youtubeChannels.includes(channelId)) {
            youtubeChannels.push(channelId);
            renderYoutubeAccounts();
            youtubeInput.value = '';
        }
    }
}

// Render YouTube accounts
function renderYoutubeAccounts() {
    youtubeAccounts.innerHTML = '';

    youtubeChannels.forEach(channel => {
        const accountItem = document.createElement('div');
        accountItem.className = 'account-item';
        accountItem.innerHTML = `
            <input type="text" value="${channel}" readonly>
            <button class="remove-btn" data-channel="${channel}"><i class="fas fa-times"></i></button>
        `;
        youtubeAccounts.appendChild(accountItem);

        accountItem.querySelector('.remove-btn').addEventListener('click', function() {
            const channelToRemove = this.getAttribute('data-channel');
            youtubeChannels = youtubeChannels.filter(c => c !== channelToRemove);
            renderYoutubeAccounts();
        });
    });
}

// Save connections
function saveConnections() {
    localStorage.setItem('youtubeChannels', JSON.stringify(youtubeChannels));

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
    const savedChannels = localStorage.getItem('youtubeChannels');
    if (savedChannels) {
        youtubeChannels = JSON.parse(savedChannels);
        renderYoutubeAccounts();
    }
}

// Load live streams
function loadLiveStreams() {
    const videoContainers = document.querySelectorAll('.video-container');
    const videoNames = document.querySelectorAll('.video-name');

    videoContainers.forEach(container => {
        container.querySelector('.video-frame').innerHTML = `
            <div class="loader">
                <div class="loader-circle"></div>
            </div>
        `;
    });

    videoNames.forEach(name => {
        name.textContent = 'Loading channel...';
    });

    const liveStreams = [
        { id: "9Z39gmRScKM", title: "Swaminarayan Live TV" },
        { id: "OpmL54H8YJU", title: "Swaminarayan Kirtan Live TV" },
        { id: "PJab2ScnQQs", title: "Swaminarayan Katha Live TV" },
        { id: "xvamYeFA574", title: "Swaminarayan Dhun Live Tv" }
    ];

    setTimeout(() => {
        liveStreams.forEach((stream, index) => {
            if (index < videoContainers.length) {
                const container = videoContainers[index];
                const nameElement = videoNames[index];

                container.querySelector('.video-frame').innerHTML = `
                    <iframe src="https://www.youtube.com/embed/${stream.id}?autoplay=1&mute=1"
                            frameborder="0" allow="autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                `;
                nameElement.textContent = stream.title;
                nameElement.previousElementSibling.className = 'fas fa-circle online';
            }
        });
    }, 500);
}

// Function to load YouTube posts
function loadYouTubePosts() {
    const bhagwanPostsContainer = document.getElementById('swaminarayan-bhagwan-posts');
    const swaminarayanPostsContainer = document.getElementById('swaminarayan-posts');

    bhagwanPostsContainer.innerHTML = '';
    swaminarayanPostsContainer.innerHTML = '';

    const bhagwanChannelUrl = "https://www.youtube.com/channel/UCQXWP4gEdEwlb6vodwrU75A/community";
    const swaminarayanChannelUrl = "https://www.youtube.com/channel/UC7HQ3mzdsyvLU0Y7a2t3N7A/community";

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
async function loadYouTubeUploadedVideos(channelName) {
    const containerId = `${channelName}-videos`;
    const container = document.getElementById(containerId);
    if (!container) return;

    currentLoadingChannel = channelName;

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
        const channelResponse = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${YOUTUBE_API_KEY}`);
        if (!channelResponse.ok) {
            const errorText = await channelResponse.text();
            throw new Error(`HTTP error! status: ${channelResponse.status}, message: ${errorText}`);
        }
        const channelData = await channelResponse.json();
        const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;

        let url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&key=${YOUTUBE_API_KEY}&maxResults=12`;
        if (nextPageTokens[channelName]) {
            url += `&pageToken=${nextPageTokens[channelName]}`;
        }

        const videosResponse = await fetch(url);
        if (!videosResponse.ok) {
            const errorText = await videosResponse.text();
            throw new Error(`HTTP error! status: ${videosResponse.status}, message: ${errorText}`);
        }
        const videosData = await videosResponse.json();

        const videoIds = videosData.items.map(item => item.contentDetails.videoId).join(',');
        let videoStats = {};
        if (videoIds) {
            const statsResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}&key=${YOUTUBE_API_KEY}`);
            if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                statsData.items.forEach(item => {
                    videoStats[item.id] = item.statistics;
                });
            } else {
                console.warn("Could not fetch video statistics:", statsResponse.statusText);
            }
        }

        nextPageTokens[channelName] = videosData.nextPageToken || null;

        if (loader) {
            loader.remove();
        }

        renderYouTubeVideos(containerId, videosData.items, videoStats);

    } catch (error) {
        console.error('Error fetching YouTube videos:', error);
        if (loader) {
            loader.remove();
        }
        let errorMessage = 'Failed to load videos. This could be due to API key issues, network problems, or too many requests.';
        if (error.message.includes('Quota exceeded')) {
            errorMessage = 'YouTube API daily quota exceeded. Please try again tomorrow.';
        } else if (error.message.includes('Invalid API key')) {
            errorMessage = 'Invalid YouTube API Key. Please check your key in script.js.';
        } else if (error.message.includes('Forbidden')) {
            errorMessage = 'Access to YouTube API forbidden. Check API key restrictions or channel privacy.';
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
function renderYouTubeVideos(containerId, videos, videoStats) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const hasExistingContent = container.children.length > 0 && !container.querySelector('.error');

    if (!hasExistingContent && videos.length === 0) {
        container.innerHTML = `<div class="error" style="text-align: center; padding: 20px;">No uploaded videos found for this channel or embedding is restricted.</div>`;
        return;
    }

    if (videos && videos.length > 0) {
        videos.forEach(video => {
            const videoId = video.contentDetails.videoId;
            const title = video.snippet.title;
            const thumbnailUrl = video.snippet.thumbnails.medium.url;
            const publishedAt = new Date(video.snippet.publishedAt);
            const relativeTime = timeAgo(publishedAt);
            const viewCount = videoStats[videoId] ? formatNumber(videoStats[videoId].viewCount) : 'N/A';

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
        });
    } else if (nextPageTokens[containerId.replace('-videos', '')] === null) {
        // If no more videos and next page token is null, indicate end of content
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

// Function to handle infinite scroll
function handleInfiniteScroll() {
    const youtubeVideosPage = document.getElementById('youtube-videos');
    if (!youtubeVideosPage || !youtubeVideosPage.classList.contains('active')) {
        return;
    }

    const { scrollTop, scrollHeight, clientHeight } = youtubeVideosPage;

    if (scrollTop + clientHeight >= scrollHeight - 100 &&
        currentLoadingChannel &&
        nextPageTokens[currentLoadingChannel] !== null &&
        !youtubeVideosPage.dataset.loading
    ) {
        youtubeVideosPage.dataset.loading = 'true';
        loadYouTubeUploadedVideos(currentLoadingChannel);
    }
}

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
    twitterTimeline.href = 'https://x.com/TheCensorTalk';
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