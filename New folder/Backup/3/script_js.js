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

// YouTube channel data
let youtubeChannels = [];
const youtubeAccounts = document.getElementById('youtube-accounts');
const youtubeInput = document.getElementById('youtube-input');
const addYoutubeBtn = document.getElementById('add-youtube');

// Pin state
let isPinned = false;

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Load saved connections
    loadConnections();

    // Set up event listeners
    setupEventListeners();

    // Load initial content if on YouTube Posts page
    if (document.querySelector('.page.active').id === 'youtube-posts') {
        // loadYouTubePosts(); // Removed for now as direct iframe embedding is problematic
    }

    // Load initial content for Live TV if it's the active page
    if (document.querySelector('.page.active').id === 'live-tv') {
        loadLiveStreams();
    }
});

// Set up event listeners
function setupEventListeners() {
    // Toggle sidebar
    menuToggle.addEventListener('click', toggleSidebar);

    // Pin sidebar functionality
    pinBtn.addEventListener('click', togglePinSidebar);

    // Close sidebar
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

    // Close sidebar when clicking outside
    document.addEventListener('click', closeSidebarOnOutsideClick);
}

// Toggle sidebar
function toggleSidebar() {
    menuToggle.classList.toggle('active');
    sidebar.classList.toggle('active');
    // Adjust main content padding when sidebar toggles if it's pinned
    if (isPinned) {
        main.style.paddingLeft = sidebar.classList.contains('active') ? `calc(var(--sidebar-width) + 25px)` : '25px';
    }
}

// Toggle pin sidebar
function togglePinSidebar() {
    isPinned = !isPinned;
    pinBtn.classList.toggle('active', isPinned);
    pinBtn.style.color = isPinned ? '#3498db' : '';
    pinBtn.style.transform = isPinned ? 'rotate(45deg)' : 'rotate(0)';

    // Adjust main content when sidebar is pinned or unpinned
    if (isPinned) {
        main.style.paddingLeft = `calc(var(--sidebar-width) + 25px)`;
        sidebar.classList.add('active'); // Ensure sidebar is active when pinned
        menuToggle.classList.add('active');
    } else {
        main.style.paddingLeft = '25px';
    }
}

// Close sidebar
function closeSidebar() {
    if (!isPinned) { // Only close if not pinned
        menuToggle.classList.remove('active');
        sidebar.classList.remove('active');
        main.style.paddingLeft = '25px'; // Reset padding when closed
    }
}

// Navigate to page
function navigateToPage() {
    // Remove active class from all menu items
    menuItems.forEach(i => i.classList.remove('active'));

    // Add active class to clicked item
    this.classList.add('active');

    // Get page id
    const pageId = this.getAttribute('data-page');

    // Hide all pages
    pages.forEach(page => page.classList.remove('active'));

    // Show selected page
    document.getElementById(pageId).classList.add('active');

    // Load content based on page
    if (pageId === 'live-tv') {
        loadLiveStreams();
    } else if (pageId === 'youtube-posts') {
        loadYouTubePosts(); // Call this function
    } else if (pageId === 'daily-darshan') {
        // The iframe will load automatically
    } else if (pageId === 'social-media') {
        loadSocialMediaWidgets(); // Load all social media widgets
    }

    // Close sidebar if not pinned after navigation
    if (!isPinned) {
        closeSidebar();
    }
}

// New function to load all social media widgets
function loadSocialMediaWidgets() {
    loadTwitterWidget();
    loadFacebookWidget();
    loadInstagramWidget();
}

// Load Twitter widget
function loadTwitterWidget() {
    const twitterWidgetContainer = document.getElementById('twitter-widget');
    // Ensure the container is not empty before trying to load
    if (twitterWidgetContainer) {
        // Check if twttr object is defined, if not, load the script
        if (typeof twttr === 'undefined') {
            const script = document.createElement('script');
            script.src = "https://platform.twitter.com/widgets.js";
            script.async = true;
            script.charset = "utf-8";
            script.onload = () => {
                if (window.twttr && window.twttr.widgets) {
                    window.twttr.widgets.load(twitterWidgetContainer);
                }
            };
            document.body.appendChild(script);
        } else {
            // If already loaded, trigger load for new elements within the container
            window.twttr.widgets.load(twitterWidgetContainer);
        }
    }
}

// Load Facebook widget
function loadFacebookWidget() {
    const facebookWidgetContainer = document.getElementById('facebook-widget');
    if (facebookWidgetContainer) {
        // Clear previous content
        facebookWidgetContainer.innerHTML = '';
        const iframe = document.createElement('iframe');
        iframe.src = "https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Fswaminarayanbhagwan2%2F&tabs=timeline&width=340&height=500&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true&appId";
        iframe.frameBorder = "0";
        iframe.allowFullscreen = true;
        iframe.allow = "autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share";
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        facebookWidgetContainer.appendChild(iframe);
    }
}

// Load Instagram widget (Note: Direct embedding of full profile feeds is not officially supported by Instagram via simple iframes without their API.)
function loadInstagramWidget() {
    const instagramWidgetContainer = document.getElementById('instagram-widget');
    if (instagramWidgetContainer) {
        // Clear previous content
        instagramWidgetContainer.innerHTML = '';
        // For Instagram, it's generally best to link to the profile or embed specific posts.
        // A full profile embed using just an iframe without an API is often blocked due to CORS/security.
        // Providing a message or a link might be more reliable.
        instagramWidgetContainer.innerHTML = `
            <div style="text-align: center; padding: 20px; color: var(--light);">
                <p>Instagram does not directly support embedding full profile feeds via simple iframes.</p>
                <p>Please visit the profile directly:</p>
                <a href="https://www.instagram.com/swaminarayanbhagwan_/" target="_blank" style="color: var(--accent); text-decoration: none;">
                    instagram.com/swaminarayanbhagwan_ <i class="fas fa-external-link-alt"></i>
                </a>
            </div>
        `;
        // If you had specific post embed codes, you would insert them here.
    }
}

// Add YouTube channel
function addYoutubeChannel() {
    const channelId = youtubeInput.value.trim();

    if (channelId) {
        // Check if channel already exists
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

        // Add event listener to remove button
        accountItem.querySelector('.remove-btn').addEventListener('click', function() {
            const channelToRemove = this.getAttribute('data-channel');
            youtubeChannels = youtubeChannels.filter(c => c !== channelToRemove);
            renderYoutubeAccounts();
        });
    });
}

// Save connections
function saveConnections() {
    // Save to localStorage
    localStorage.setItem('youtubeChannels', JSON.stringify(youtubeChannels));

    // Show success message
    saveBtn.innerHTML = '<i class="fas fa-check"></i> Saved Successfully!';
    saveBtn.style.background = 'var(--success)';

    setTimeout(() => {
        saveBtn.innerHTML = 'Save Connections';
        saveBtn.style.background = 'var(--accent)';
    }, 2000);

    // Reload live streams
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

    // Show loading state
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

    // Define our live streams with exact titles
    const liveStreams = [
        { id: "9Z39gmRScKM", title: "Swaminarayan Live TV" },
        { id: "OpmL54H8YJU", title: "Swaminarayan Kirtan Live TV" },
        { id: "PJab2ScnQQs", title: "Swaminarayan Katha Live TV" },
        { id: "xvamYeFA574", title: "Swaminarayan Dhun Live Tv" }
    ];

    // Set the streams after a short delay to show loading
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

    if (!isClickInsideSidebar && !isClickOnMenuToggle && !isPinned) {
        menuToggle.classList.remove('active');
        sidebar.classList.remove('active');
        main.style.paddingLeft = '25px'; // Ensure padding resets
    }
}

// Function to load YouTube posts (updated to reflect limitations)
function loadYouTubePosts() {
    const bhagwanPostsContainer = document.getElementById('swaminarayan-bhagwan-posts');
    const swaminarayanPostsContainer = document.getElementById('swaminarayan-posts');

    // Clear any previous content
    bhagwanPostsContainer.innerHTML = '';
    swaminarayanPostsContainer.innerHTML = '';

    // Due to YouTube's embedding policies for community posts, direct iframe embeds are not reliable.
    // Instead, we will provide links to the community tabs.
    bhagwanPostsContainer.innerHTML = `
        <div class="error" style="text-align: center; padding: 20px;">
            <p>Direct embedding of YouTube community posts is not supported via simple iframes.</p>
            <p>Please visit the community tab directly:</p>
            <a href="https://www.youtube.com/@SwaminarayanBhagwan/community" target="_blank" style="color: var(--accent); text-decoration: none;">
                Swaminarayan Bhagwan Community <i class="fas fa-external-link-alt"></i>
            </a>
        </div>
    `;

    swaminarayanPostsContainer.innerHTML = `
        <div class="error" style="text-align: center; padding: 20px;">
            <p>Direct embedding of YouTube community posts is not supported via simple iframes.</p>
            <p>Please visit the community tab directly:</p>
            <a href="https://www.youtube.com/@swaminarayan/community" target="_blank" style="color: var(--accent); text-decoration: none;">
                Swaminarayan Community <i class="fas fa-external-link-alt"></i>
            </a>
        </div>
    `;

    console.warn("Note: Direct iframe embedding for YouTube community posts is generally not supported. Consider using YouTube Data API for custom display.");
}

// renderPosts function is no longer directly used with the updated loadYouTubePosts approach.
// Keep it if you plan to fetch data via API and render, otherwise, it can be removed.
function renderPosts(containerId, channelName, posts) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let html = '';

    if (posts && posts.length > 0) {
        posts.forEach(post => {
            html += `
                <div class="post-item">
                    <div class="post-header">
                        <img src="${post.avatarUrl || 'https://yt3.googleusercontent.com/ytc/APkrFKaq8c_8sK7Z1FdD9gVUJz0yXQJ3q5Q5Z2q5Q2j5Q=s176-c-k-c0x00ffffff-no-rj'}"
                             alt="${channelName}" class="post-avatar">
                        <div>
                            <div class="post-author">${channelName}</div>
                            <div class="post-date">${post.date}</div>
                        </div>
                    </div>
                    <div class="post-content">${post.content}</div>
                    ${post.image ? `<img src="${post.image}" alt="Post image" class="post-image">` : ''}
                    <div class="post-stats">
                        <span><i class="fas fa-thumbs-up"></i> ${post.likes}</span>
                        <span><i class="fas fa-comment"></i> ${post.comments}</span>
                    </div>
                </div>
            `;
        });
    } else {
        html = `<div class="error" style="text-align: center; padding: 20px;">No posts to display or embedding is restricted.</div>`;
    }

    container.innerHTML = html;
}