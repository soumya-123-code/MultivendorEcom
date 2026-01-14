// Optional Token Keeper - Prevents automatic logout by keeping tokens fresh
// 
// This utility provides two strategies:
// 1. Periodic Refresh - Refreshes tokens at fixed intervals
// 2. Activity-Based Refresh - Refreshes tokens based on user activity
//
// To enable, import and call in App.tsx

const API_BASE_URL = 'http://localhost:8000/api/v1';

// Strategy 1: Periodic Token Refresh
// Refreshes tokens every N minutes regardless of activity
export const startPeriodicRefresh = (intervalMinutes: number = 10) => {
  const REFRESH_INTERVAL = intervalMinutes * 60 * 1000;

  const refreshTokens = async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      console.log('No refresh token found, skipping periodic refresh');
      return;
    }

    try {
      console.log('🔄 Periodic token refresh triggered');
      
      const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('access_token', data.access);
        
        // Update refresh token if backend provides new one
        if (data.refresh) {
          localStorage.setItem('refresh_token', data.refresh);
        }
        
        console.log('✅ Tokens refreshed successfully at', new Date().toLocaleTimeString());
      } else {
        console.warn('❌ Periodic refresh failed, tokens may be expired');
      }
    } catch (error) {
      console.error('Periodic refresh error:', error);
    }
  };

  // Initial refresh after 1 second
  setTimeout(refreshTokens, 1000);

  // Then refresh periodically
  const interval = setInterval(refreshTokens, REFRESH_INTERVAL);

  console.log(`📅 Periodic token refresh enabled (every ${intervalMinutes} minutes)`);

  // Return cleanup function
  return () => {
    clearInterval(interval);
    console.log('Periodic token refresh stopped');
  };
};

// Strategy 2: Activity-Based Token Refresh
// Refreshes tokens only when user is active
export const startActivityBasedRefresh = (
  activityTimeoutMinutes: number = 5,
  checkIntervalMinutes: number = 1
) => {
  let lastActivity = Date.now();
  const ACTIVITY_TIMEOUT = activityTimeoutMinutes * 60 * 1000;
  const CHECK_INTERVAL = checkIntervalMinutes * 60 * 1000;

  // Update last activity timestamp
  const updateActivity = () => {
    lastActivity = Date.now();
  };

  // Check activity and refresh if needed
  const checkAndRefresh = async () => {
    const timeSinceActivity = Date.now() - lastActivity;
    const minutesInactive = Math.floor(timeSinceActivity / 1000 / 60);

    // User is considered active if activity within timeout
    if (timeSinceActivity < ACTIVITY_TIMEOUT) {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) return;

      try {
        console.log(`🔄 Activity-based refresh (${minutesInactive}m since last activity)`);
        
        const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh: refreshToken }),
        });

        if (response.ok) {
          const data = await response.json();
          localStorage.setItem('access_token', data.access);
          
          if (data.refresh) {
            localStorage.setItem('refresh_token', data.refresh);
          }
          
          console.log('✅ Token refreshed due to user activity');
        }
      } catch (error) {
        console.error('Activity-based refresh failed:', error);
      }
    } else {
      console.log(`💤 User inactive for ${minutesInactive} minutes, not refreshing`);
    }
  };

  // Track various user activities
  const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
  
  activityEvents.forEach(event => {
    document.addEventListener(event, updateActivity, true);
  });

  // Start checking
  const interval = setInterval(checkAndRefresh, CHECK_INTERVAL);

  console.log(`👆 Activity-based token refresh enabled (timeout: ${activityTimeoutMinutes}m)`);

  // Return cleanup function
  return () => {
    clearInterval(interval);
    activityEvents.forEach(event => {
      document.removeEventListener(event, updateActivity, true);
    });
    console.log('Activity-based token refresh stopped');
  };
};

// Strategy 3: Hybrid Approach
// Combines periodic and activity-based refresh
export const startHybridRefresh = () => {
  const periodicCleanup = startPeriodicRefresh(15); // Every 15 minutes
  const activityCleanup = startActivityBasedRefresh(5, 2); // Check every 2 min, 5 min timeout

  console.log('🔄 Hybrid token refresh enabled (periodic + activity-based)');

  return () => {
    periodicCleanup();
    activityCleanup();
    console.log('Hybrid token refresh stopped');
  };
};

// Strategy 4: Smart Refresh
// Refreshes based on token expiry time
export const startSmartRefresh = () => {
  let refreshTimer: NodeJS.Timeout;

  const scheduleRefresh = () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      // Decode JWT to get expiry
      const parts = token.split('.');
      const payload = JSON.parse(atob(parts[1]));
      const expiryTime = payload.exp * 1000;
      const now = Date.now();
      
      // Refresh 2 minutes before expiry
      const timeUntilRefresh = expiryTime - now - (2 * 60 * 1000);

      if (timeUntilRefresh > 0) {
        console.log(`⏰ Smart refresh scheduled in ${Math.floor(timeUntilRefresh / 1000 / 60)} minutes`);
        
        refreshTimer = setTimeout(async () => {
          const refreshToken = localStorage.getItem('refresh_token');
          if (!refreshToken) return;

          try {
            console.log('🔄 Smart refresh triggered (2 min before expiry)');
            
            const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refresh: refreshToken }),
            });

            if (response.ok) {
              const data = await response.json();
              localStorage.setItem('access_token', data.access);
              
              if (data.refresh) {
                localStorage.setItem('refresh_token', data.refresh);
              }
              
              console.log('✅ Smart refresh completed');
              
              // Schedule next refresh
              scheduleRefresh();
            }
          } catch (error) {
            console.error('Smart refresh failed:', error);
          }
        }, timeUntilRefresh);
      } else {
        console.log('⚠️ Token already expired or expires soon, refreshing now');
        // Token already expired, trigger immediate refresh
        setTimeout(() => scheduleRefresh(), 1000);
      }
    } catch (error) {
      console.error('Error parsing token for smart refresh:', error);
    }
  };

  // Start scheduling
  scheduleRefresh();

  console.log('🧠 Smart token refresh enabled (based on token expiry)');

  return () => {
    if (refreshTimer) {
      clearTimeout(refreshTimer);
    }
    console.log('Smart token refresh stopped');
  };
};

// Export default strategy (smart refresh - most efficient)
export default startSmartRefresh;
