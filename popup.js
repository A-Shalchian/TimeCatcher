// Popup script for TimeCatcher extension
// Handles data retrieval and display

document.addEventListener('DOMContentLoaded', async () => {
  await loadUsageData();
});

// Load and display usage data
async function loadUsageData() {
  try {
    // Request usage data from background script
    const response = await chrome.runtime.sendMessage({ action: 'getUsageData' });
    
    if (response) {
      displayUsageData(response);
    } else {
      showError('Unable to load usage data');
    }
  } catch (error) {
    console.error('Error loading usage data:', error);
    showError('Error loading data');
  }
}

// Display the usage data in the popup
function displayUsageData(data) {
  const loadingElement = document.getElementById('loading');
  const statsElement = document.getElementById('stats');
  
  // Hide loading, show stats
  loadingElement.style.display = 'none';
  statsElement.style.display = 'block';
  
  // Update total time
  document.getElementById('total-time').textContent = data.total;
  
  // Update individual site times
  document.getElementById('youtube-time').textContent = data.usage['YouTube'] || '0s';
  document.getElementById('tiktok-time').textContent = data.usage['TikTok'] || '0s';
  document.getElementById('twitter-time').textContent = data.usage['Twitter/X'] || '0s';
  document.getElementById('instagram-time').textContent = data.usage['Instagram'] || '0s';
  
  // Add visual feedback for sites with significant usage
  updateSiteVisuals(data.rawUsage);
}

// Update visual indicators based on usage
function updateSiteVisuals(rawUsage) {
  const sites = [
    { id: 'youtube', key: 'YouTube', element: document.querySelector('.site-item:nth-child(1)') },
    { id: 'tiktok', key: 'TikTok', element: document.querySelector('.site-item:nth-child(2)') },
    { id: 'twitter', key: 'Twitter/X', element: document.querySelector('.site-item:nth-child(3)') },
    { id: 'instagram', key: 'Instagram', element: document.querySelector('.site-item:nth-child(4)') }
  ];
  
  // Find the maximum usage to determine relative intensity
  const maxUsage = Math.max(...Object.values(rawUsage));
  
  sites.forEach(site => {
    const usage = rawUsage[site.key] || 0;
    const intensity = maxUsage > 0 ? usage / maxUsage : 0;
    
    // Add subtle visual feedback for high usage
    if (intensity > 0.7 && usage > 300000) { // More than 5 minutes and high relative usage
      site.element.style.background = 'linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%)';
      site.element.style.borderLeft = '4px solid #f56565';
    } else if (intensity > 0.3 && usage > 60000) { // More than 1 minute
      site.element.style.background = 'linear-gradient(135deg, #fffaf0 0%, #feebc8 100%)';
      site.element.style.borderLeft = '4px solid #ed8936';
    }
  });
}

// Show error message
function showError(message) {
  const loadingElement = document.getElementById('loading');
  loadingElement.innerHTML = `
    <div style="color: #e53e3e; text-align: center;">
      <p>${message}</p>
      <button onclick="loadUsageData()" style="
        margin-top: 12px;
        padding: 8px 16px;
        background: #667eea;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
      ">Retry</button>
    </div>
  `;
}

// Add refresh functionality
document.addEventListener('keydown', (event) => {
  if (event.key === 'F5' || (event.ctrlKey && event.key === 'r')) {
    event.preventDefault();
    location.reload();
  }
});

// Auto-refresh every 30 seconds when popup is open
setInterval(() => {
  if (!document.hidden) {
    loadUsageData();
  }
}, 30000);
