// DOM Elements
const menuToggle = document.querySelector('.menu-toggle');
const sidebar = document.querySelector('.sidebar');
const pinBtn = document.querySelector('.fa-thumbtack');
const closeBtn = document.querySelector('.fa-times');
const menuItems = document.querySelectorAll('.menu-item');
const pages = document.querySelectorAll('.page');
const main = document.querySelector('main');
const refreshBtn = document.querySelector('.refresh-btn');
const saveBtn = document.getElementById('save-connections');
const sidebarOverlay = document.querySelector('.sidebar-overlay');

// YouTube channel data
let youtubeChannels = [];
const youtubeAccounts = document.getElementById('youtube-accounts');
const youtubeInput = document.getElementById('youtube-input');
const addYoutubeBtn = document.getElementById('add-youtube');

// Pin state
let isPinned = false;

// Flag to track if Twitter script has been loaded
let twitterScriptLoaded = false;

// YouTube Data API Key and Channel IDs
const YOUTUBE_API_KEY = 'AIzaSyBLMT_7oFeo5xLWv_xQwil8wh3wmDsaZuM'; // User provided API key
const CHANNEL_IDS = {
    'swaminarayan-bhagwan': 'UCQXWP4gEdEwlb6vodwrU75A', // User provided Channel ID 0
    'swaminarayan': 'UC7HQ3mzdsyvLU0Y7a2t3N7A' // User provided Channel ID 1
};

// Pagination variables for YouTube videos
let nextPageTokens = {}; // Stores next page tokens for each channel
let currentLoadingChannel = null; // To track which channel's videos are currently being loaded

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Load saved connections
    loadConnections();

    // Set up event listeners
    setupEventListeners();

    // Load initial content based on the active page
    const activePageId = document.querySelector('.page.active').id;
    if (activePageId === 'youtube-posts') {
        loadYouTubePosts();
    } else if (activePageId === 'live-tv') {
        loadLiveStreams();
    } else if (activePageId === 'social-media') {
        loadSocialMediaWidgets();
    } else if (activePageId === 'youtube-videos') { // Load videos for default active channel
        // Ensure the correct button and container are active on initial load
        document.querySelector('.channel-select-btn[data-channel-name="swaminarayan-bhagwan"]').classList.add('active');
        document.getElementById('swaminarayan-bhagwan-videos').classList.add('active');
        currentLoadingChannel = 'swaminarayan-bhagwan'; // Set current loading channel on initial load
        loadYouTubeUploadedVideos('swaminarayan-bhagwan');
    }

    // Adjust main padding on initial load if sidebar is pinned
    if (isPinned) {
        main.style.paddingLeft = `calc(var(--sidebar-width) + 25px)`;
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

    // Add YouTube channel
    addYoutubeBtn.addEventListener('click', addYoutubeChannel);

    // Save connections
    saveBtn.addEventListener('click', saveConnections);

    // Refresh streams
    refreshBtn.addEventListener('click', loadLiveStreams);

    // Close sidebar when clicking outside (including the new overlay)
    sidebarOverlay.addEventListener('click', closeSidebar);

    // General outside click for safety, but check conditions more carefully
    document.addEventListener('click', (event) => {
        const isClickInsideSidebar = sidebar.contains(event.target);
        const isClickOnMenuToggle = menuToggle.contains(event.target);
        if (!isClickInsideSidebar && !isClickOnMenuToggle && sidebar.classList.contains('active') && !isPinned) {
            closeSidebar();
        }
    });

    // Event listeners for YouTube channel selection buttons
    const channelSelectBtns = document.querySelectorAll('.channel-select-btn');
    channelSelectBtns.forEach(button => {
        button.addEventListener('click', function() {
            const channelName = this.getAttribute('data-channel-name');
            // Remove active from all buttons
            channelSelectBtns.forEach(btn => btn.classList.remove('active'));
            // Add active to the clicked button
            this.classList.add('active');
            // Hide all video containers
            document.querySelectorAll('.video-display-grid').forEach(container => {
                container.classList.remove('active');
            });
            // Show the selected channel's video container
            document.getElementById(`${channelName}-videos`).classList.add('active');

            // Reset pagination for the new channel and load initial videos
            nextPageTokens[channelName] = null; // Reset token for this channel
            document.getElementById(`${channelName}-videos`).innerHTML = ''; // Clear existing videos
            currentLoadingChannel = channelName; // Set current loading channel on button click
            loadYouTubeUploadedVideos(channelName);
        });
    });

    // Infinite scroll for YouTube videos - Attaching to the page element
    // Ensure the 'youtube-videos' page itself is scrollable for this to work effectively
    document.getElementById('youtube-videos').addEventListener('scroll', handleInfiniteScroll);
}

// Toggle sidebar
function toggleSidebar() {
    const isActive = sidebar.classList.contains('active');
    if (isActive) {
        closeSidebar();
    } else {
        sidebar.classList.add('active');
        menuToggle.classList.add('active');
        sidebarOverlay.classList.add('active');
        document.body.classList.add('no-scroll');
        if (!isPinned) {
            main.style.paddingLeft = `calc(var(--sidebar-width) + 25px)`;
        }
    }
}

// Toggle pin sidebar
function togglePinSidebar() {
    isPinned = !isPinned;
    pinBtn.classList.toggle('active', isPinned);
    pinBtn.style.color = isPinned ? '#3498db' : '';
    pinBtn.style.transform = isPinned ? 'rotate(45deg)' : 'rotate(0)';

    if (isPinned) {
        sidebar.classList.add('active');
        menuToggle.classList.add('active');
        sidebarOverlay.classList.remove('active');
        document.body.classList.remove('no-scroll');
        main.style.paddingLeft = `calc(var(--sidebar-width) + 25px)`;
    } else {
        if (sidebar.classList.contains('active')) {
            sidebarOverlay.classList.add('active');
            document.body.classList.add('no-scroll');
        }
        main.style.paddingLeft = '25px';
    }
}

// Close sidebar
function closeSidebar() {
    if (!isPinned) {
        sidebar.classList.remove('active');
        menuToggle.classList.remove('active');
        sidebarOverlay.classList.remove('active');
        document.body.classList.remove('no-scroll');
        main.style.paddingLeft = '25px';
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
        // Reset and load for the active channel when navigating to this page
        const activeChannelBtn = document.querySelector('.channel-select-btn.active');
        const channelName = activeChannelBtn ? activeChannelBtn.getAttribute('data-channel-name') : 'swaminarayan-bhagwan';
        nextPageTokens[channelName] = null; // Reset token for this channel
        document.getElementById(`${channelName}-videos`).innerHTML = ''; // Clear previous videos
        currentLoadingChannel = channelName; // Set current loading channel on navigation
        loadYouTubeUploadedVideos(channelName);
    } else if (pageId === 'daily-darshan') {
        // The iframe will load automatically since its src is in HTML
    } else if (pageId === 'social-media') {
        loadSocialMediaWidgets();
    }

    if (!isPinned) {
        closeSidebar();
    }
}

// New function to load all social media widgets
function loadSocialMediaWidgets() {
    loadFacebookWidget();
    loadInstagramWidget();
    loadTwitterWidget();
}

// Load Facebook widget
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

// Load Instagram widget (Note: Direct embedding of full profile feeds is not officially supported by Instagram via simple iframes without their API.)
function loadInstagramWidget() {
    const instagramContainer = document.getElementById('instagram-widget-container');
    if (!instagramContainer) return;

    instagramContainer.innerHTML = '';

    instagramContainer.innerHTML = `
        <div style="text-align: center; padding: 20px; color: var(--light); background-color: rgba(231, 76, 60, 0.2); border-radius: var(--border-radius);">
            <p style="margin-bottom: 10px;">Instagram does not directly support embedding full profile feeds via simple iframes.</p>
            <p>Please visit the profile directly:</p>
            <a href="https://www.instagram.com/swaminarayanbhagwan_/" target="_blank" style="color: var(--accent); text-decoration: none; font-weight: bold;">
                instagram.com/swaminarayanbhagwan_ <i class="fas fa-external-link-alt"></i>
            </a>
        </div>
    `;
}

// Load Twitter widget
function loadTwitterWidget() {
    const twitterContainer = document.getElementById('twitter-widget-container');
    if (!twitterContainer) return;

    twitterContainer.innerHTML = `<a class="twitter-timeline" href="https://twitter.com/ICC" data-width="100%" data-height="100%">Tweets by ICC</a>`;

    if (!twitterScriptLoaded) {
        const script = document.createElement('script');
        script.src = "https://platform.twitter.com/widgets.js";
        script.async = true;
        script.charset = "utf-8";
        script.onload = () => {
            twitterScriptLoaded = true;
            if (window.twttr && window.twttr.widgets) {
                window.twttr.widgets.load(twitterContainer);
            }
        };
        document.body.appendChild(script);
    } else {
        if (window.twttr && window.twttr.widgets) {
            window.twttr.widgets.load(twitterContainer);
        }
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

    saveBtn.innerHTML = '<i class="fas fa-check"></i> Saved Successfully!';
    saveBtn.style.background = 'var(--success)';

    setTimeout(() => {
        saveBtn.innerHTML = 'Save Connections';
        saveBtn.style.background = 'var(--accent)';
    }, 2000);

    loadLiveStreams();
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
                            allow="autoplay; encrypted-media" allowfullscreen></iframe>
                `;
                nameElement.textContent = stream.title;
            }
        });
    }, 500);
}

// Close sidebar when clicking outside
function closeSidebarOnOutsideClick(event) {
    const isClickInsideSidebar = sidebar.contains(event.target);
    const isClickOnMenuToggle = menuToggle.contains(event.target);
    const isClickOnCloseBtn = closeBtn.contains(event.target);

    if (!isClickInsideSidebar && !isClickOnMenuToggle && !isClickOnCloseBtn && sidebar.classList.contains('active') && !isPinned) {
        closeSidebar();
    }
}

// Function to load YouTube posts (updated to reflect limitations)
function loadYouTubePosts() {
    const bhagwanPostsContainer = document.getElementById('swaminarayan-bhagwan-posts');
    const swaminarayanPostsContainer = document.getElementById('swaminarayan-posts');

    bhagwanPostsContainer.innerHTML = '';
    swaminarayanPostsContainer.innerHTML = '';

    bhagwanPostsContainer.innerHTML = `
        <div class="error" style="text-align: center; padding: 20px;">
            <p style="margin-bottom: 10px;">YouTube community posts are not directly embeddable via simple iframes.</p>
            <p>Please visit the community tab directly:</p>
            <a href="https://www.youtube.com/channel/UCQXWP4gEdEwlb6vodwrU75A/community" target="_blank" style="color: var(--accent); text-decoration: none; font-weight: bold;">
                Swaminarayan Bhagwan Community <i class="fas fa-external-link-alt"></i>
            </a>
        </div>
    `;

    swaminarayanPostsContainer.innerHTML = `
        <div class="error" style="text-align: center; padding: 20px;">
            <p style="margin-bottom: 10px;">YouTube community posts are not directly embeddable via simple iframes.</p>
            <p>Please visit the community tab directly:</p>
            <a href="https://www.youtube.com/channel/UC7HQ3mzdsyvLU0Y7a2t3N7A/community" target="_blank" style="color: var(--accent); text-decoration: none; font-weight: bold;">
                Swaminarayan Community <i class="fas fa-external-link-alt"></i>
            </a>
        </div>
    `;

    console.warn("Note: Direct iframe embedding for YouTube community posts is generally not supported. Consider using YouTube Data API for custom display.");
}

// Function to fetch and display YouTube uploaded videos with pagination and additional details
async function loadYouTubeUploadedVideos(channelName) {
    const containerId = `${channelName}-videos`;
    const container = document.getElementById(containerId);
    if (!container) return;

    // Set current loading channel explicitly, as this function is called directly
    currentLoadingChannel = channelName;

    // Check if a loader is already present to avoid adding multiple
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
        loader.remove(); // Remove loader if channel ID is invalid
        container.innerHTML = `<div class="error">Invalid channel name provided.</div>`;
        return;
    }

    try {
        // Step 1: Get the uploads playlist ID for the channel
        const channelResponse = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${YOUTUBE_API_KEY}`);
        if (!channelResponse.ok) {
            throw new Error(`HTTP error! status: ${channelResponse.status}`);
        }
        const channelData = await channelResponse.json();
        const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;

        // Step 2: Get videos from the uploads playlist
        let url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&key=${YOUTUBE_API_KEY}&maxResults=12`;
        if (nextPageTokens[channelName]) {
            url += `&pageToken=${nextPageTokens[channelName]}`;
        }

        const videosResponse = await fetch(url);
        if (!videosResponse.ok) {
            throw new Error(`HTTP error! status: ${videosResponse.status}`);
        }
        const videosData = await videosResponse.json();

        // Fetch statistics (view count) for each video
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

        nextPageTokens[channelName] = videosData.nextPageToken || null; // Update next page token

        // Remove loader before rendering videos
        if (loader) {
            loader.remove();
        }

        renderYouTubeVideos(containerId, videosData.items, videoStats);

    } catch (error) {
        console.error('Error fetching YouTube videos:', error);
        if (loader) {
            loader.remove();
        }
        container.innerHTML += `<div class="error">Failed to load videos. Please check your API key and network connection.</div>`;
    } finally {
        // Reset loading flag on the page element after loading is complete
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

    // If it's the first load and no videos, show no videos message.
    // Check if container already has videos (meaning it's not the first load)
    const hasExistingVideos = container.children.length > 0 && !container.querySelector('.error'); // More robust check
    if (!hasExistingVideos && videos.length === 0) {
        container.innerHTML = `<div class="error" style="text-align: center; padding: 20px;">No uploaded videos found for this channel or embedding is restricted.</div>`;
        return;
    }

    if (videos && videos.length > 0) {
        videos.forEach(video => {
            const videoId = video.contentDetails.videoId;
            const title = video.snippet.title;
            const thumbnailUrl = video.snippet.thumbnails.medium.url; // Or 'high', 'default'
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
    } else if (nextPageTokens[containerId.replace('-videos', '')] === null) { // Only show this if no more videos to load
        // Check if a "No more videos" message already exists to prevent duplicates
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

// Helper function to format numbers (e.g., 1234567 to 1.2M)
function formatNumber(num) {
    if (num >= 1000000000) return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return num;
}


// Helper function to calculate time ago
function timeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
}

// Handle infinite scrolling
function handleInfiniteScroll() {
    const youtubeVideosPage = document.getElementById('youtube-videos');
    if (!youtubeVideosPage) return;

    // Check if the 'youtube-videos' page is currently active
    if (!youtubeVideosPage.classList.contains('active')) {
        return; // Do not trigger scroll if the page is not active
    }

    const {
        scrollTop,
        scrollHeight,
        clientHeight
    } = youtubeVideosPage;

    // Load more when user scrolls near the bottom (e.g., last 100px)
    // Ensure there's a current loading channel, there are more pages to load (nextPageTokens[currentLoadingChannel] is not null)
    // and that a loading operation isn't already in progress.
    if (scrollTop + clientHeight >= scrollHeight - 100 &&
        currentLoadingChannel &&
        nextPageTokens[currentLoadingChannel] !== null && // Explicitly check for null, not just truthiness
        !youtubeVideosPage.dataset.loading // Check the loading flag
    ) {
        youtubeVideosPage.dataset.loading = 'true'; // Set a flag to indicate loading
        loadYouTubeUploadedVideos(currentLoadingChannel); // The finally block in loadYouTubeUploadedVideos will reset the flag
    }
}