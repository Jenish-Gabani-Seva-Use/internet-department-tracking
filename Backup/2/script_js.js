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
        loadYouTubePosts();
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
}

// Toggle pin sidebar
function togglePinSidebar() {
    isPinned = !isPinned;
    pinBtn.classList.toggle('active', isPinned);
    pinBtn.style.color = isPinned ? '#3498db' : '';
    pinBtn.style.transform = isPinned ? 'rotate(45deg)' : 'rotate(0)';
    
    // Adjust main content when sidebar is pinned
    if (isPinned) {
        main.style.paddingLeft = `calc(${sidebar.offsetWidth}px + 25px)`;
    } else {
        main.style.paddingLeft = '25px';
    }
}

// Close sidebar
function closeSidebar() {
    menuToggle.classList.remove('active');
    sidebar.classList.remove('active');
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
// Load content based on page
if (pageId === 'live-tv') {
    loadLiveStreams();
} else if (pageId === 'youtube-posts') {
    loadYouTubePosts();
} else if (pageId === 'daily-darshan') {
    // No special loading needed
} else if (pageId === 'social-media') {
    // No special JS needed – embeds load automatically
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
    }
}

// Add this function to load YouTube posts
function loadYouTubePosts() {
    try {
        // Clear any previous content
        document.getElementById('swaminarayan-bhagwan-posts').innerHTML = '';
        document.getElementById('swaminarayan-posts').innerHTML = '';
        
        // Create iframes for each channel's community posts
        const bhagwanIframe = document.createElement('iframe');
        bhagwanIframe.src = 'https://www.youtube.com/embed?list=UU6VkhPuCCwR_kG0GExjoozg'; // Community posts for Swaminarayan Bhagwan
        bhagwanIframe.width = '100%';
        bhagwanIframe.height = '100%';
        bhagwanIframe.frameBorder = '0';
        bhagwanIframe.allowFullscreen = true;
        
        const swaminarayanIframe = document.createElement('iframe');
        swaminarayanIframe.src = 'https://www.youtube.com/embed?list=UUC0k1fzk0L_79Qn6x5_0X1g'; // Community posts for Swaminarayan
        swaminarayanIframe.width = '100%';
        swaminarayanIframe.height = '100%';
        swaminarayanIframe.frameBorder = '0';
        swaminarayanIframe.allowFullscreen = true;
        
        // Add iframes to containers
        document.getElementById('swaminarayan-bhagwan-posts').appendChild(bhagwanIframe);
        document.getElementById('swaminarayan-posts').appendChild(swaminarayanIframe);
        
    } catch (error) {
        console.error("Error loading YouTube posts:", error);
        document.querySelectorAll('.posts-container').forEach(container => {
            container.innerHTML = `<div class="error">Failed to load posts. Please try again later.</div>`;
        });
    }
}
// Render posts to container
function renderPosts(containerId, channelName, posts) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    let html = '';
    
    posts.forEach(post => {
        html += `
            <div class="post-item">
                <div class="post-header">
                    <img src="https://yt3.googleusercontent.com/ytc/APkrFKaq8c_8sK7Z1FdD9gVUJz0yXQJ3q5Q5Z2q5Q2j5Q=s176-c-k-c0x00ffffff-no-rj" 
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
    
    container.innerHTML = html;
}