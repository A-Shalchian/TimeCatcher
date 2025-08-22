// Background script for TimeCatcher extension
// Handles data storage and daily reset

// Initialize storage structure
chrome.runtime.onInstalled.addListener(() => {
  initializeStorage();
  // Create alarm after extension is installed/updated
  chrome.alarms.create('dailyReset', { periodInMinutes: 60 });
});

// Initialize storage with default values
async function initializeStorage() {
  const today = new Date().toDateString();
  
  const result = await chrome.storage.local.get(['lastResetDate', 'dailyUsage']);
  
  if (!result.lastResetDate || result.lastResetDate !== today) {
    // Reset daily usage for new day
    await chrome.storage.local.set({
      lastResetDate: today,
      dailyUsage: {
        'YouTube': 0,
        'TikTok': 0,
        'Twitter/X': 0,
        'Instagram': 0
      }
    });
  }
}

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateTime') {
    updateTimeSpent(message.site, message.timeSpent);
  }
});

// Update time spent on a specific site
async function updateTimeSpent(site, timeSpent) {
  try {
    const today = new Date().toDateString();
    const result = await chrome.storage.local.get(['lastResetDate', 'dailyUsage']);
    
    // Check if we need to reset for a new day
    if (!result.lastResetDate || result.lastResetDate !== today) {
      await initializeStorage();
      const newResult = await chrome.storage.local.get(['dailyUsage']);
      result.dailyUsage = newResult.dailyUsage;
    }
    
    // Update the time for the specific site
    if (result.dailyUsage && result.dailyUsage[site] !== undefined) {
      result.dailyUsage[site] += timeSpent;
      
      await chrome.storage.local.set({
        dailyUsage: result.dailyUsage
      });
    }
  } catch (error) {
    console.error('Error updating time spent:', error);
  }
}

// Listen for alarm events
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'dailyReset') {
    checkAndResetDaily();
  }
});

// Check if we need to reset daily usage
async function checkAndResetDaily() {
  const today = new Date().toDateString();
  const result = await chrome.storage.local.get(['lastResetDate']);
  
  if (!result.lastResetDate || result.lastResetDate !== today) {
    await initializeStorage();
  }
}

// Format time for display
function formatTime(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

// Export function for popup to get formatted data
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getUsageData') {
    getFormattedUsageData().then(data => {
      sendResponse(data);
    });
    return true; // Keep message channel open for async response
  }
});

// Get formatted usage data for popup
async function getFormattedUsageData() {
  await checkAndResetDaily(); // Ensure we have current day's data
  
  const result = await chrome.storage.local.get(['dailyUsage']);
  const usage = result.dailyUsage || {
    'YouTube': 0,
    'TikTok': 0,
    'Twitter/X': 0,
    'Instagram': 0
  };
  
  // Calculate total time
  const totalTime = Object.values(usage).reduce((sum, time) => sum + time, 0);
  
  // Format all times
  const formattedUsage = {};
  for (const [site, time] of Object.entries(usage)) {
    formattedUsage[site] = formatTime(time);
  }
  
  return {
    usage: formattedUsage,
    total: formatTime(totalTime),
    rawUsage: usage,
    rawTotal: totalTime
  };
}
