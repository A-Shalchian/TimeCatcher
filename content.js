// Content script to track time spent on social media sites
let startTime = Date.now();
let isActive = true;
let currentSite = '';

// Determine which site we're on
function getCurrentSite() {
  const hostname = window.location.hostname;
  if (hostname.includes('youtube.com')) return 'YouTube';
  if (hostname.includes('tiktok.com')) return 'TikTok';
  if (hostname.includes('twitter.com') || hostname.includes('x.com')) return 'Twitter/X';
  if (hostname.includes('instagram.com')) return 'Instagram';
  return 'Unknown';
}

// Send time data to background script
function sendTimeData(timeSpent) {
  if (timeSpent > 0 && currentSite !== 'Unknown') {
    chrome.runtime.sendMessage({
      action: 'updateTime',
      site: currentSite,
      timeSpent: timeSpent
    });
  }
}

// Track visibility changes (tab switching, minimizing)
function handleVisibilityChange() {
  if (document.hidden) {
    if (isActive) {
      const timeSpent = Date.now() - startTime;
      sendTimeData(timeSpent);
      isActive = false;
    }
  } else {
    if (!isActive) {
      startTime = Date.now();
      isActive = true;
    }
  }
}

// Track when user leaves the page
function handleBeforeUnload() {
  if (isActive) {
    const timeSpent = Date.now() - startTime;
    sendTimeData(timeSpent);
  }
}

// Initialize tracking
function initializeTracking() {
  currentSite = getCurrentSite();
  startTime = Date.now();
  
  // Listen for visibility changes
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // Listen for page unload
  window.addEventListener('beforeunload', handleBeforeUnload);
  
  // Send periodic updates every 30 seconds while active
  setInterval(() => {
    if (isActive && !document.hidden) {
      const timeSpent = Date.now() - startTime;
      sendTimeData(timeSpent);
      startTime = Date.now(); // Reset start time after sending
    }
  }, 30000);
}

// Start tracking when the script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeTracking);
} else {
  initializeTracking();
}
