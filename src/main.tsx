import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Enhanced solution with better error handling
const initializeAuthSession = () => {
  console.log('🔧 Initializing application session');
  
  // Check for return-to-admin redirect
  const urlParams = new URLSearchParams(window.location.search);
  const isReturnRedirect = urlParams.get('return-to-admin') === 'true';
  
  if (isReturnRedirect) {
    console.log('🔄 Return-to-admin redirect detected');
    // Don't clear auth for this specific case
    return;
  }
  
  // Get current path
  const currentPath = window.location.pathname;
  
  // Check if we have an existing session marker
  const sessionId = sessionStorage.getItem('sessionId');
  const sessionTimestamp = sessionStorage.getItem('sessionTimestamp');
  
  if (!sessionId) {
    // NEW SESSION (new tab/window or browser restart)
    console.log('🆕 New browser session detected');
    
    // Generate a new session ID
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('sessionId', newSessionId);
    sessionStorage.setItem('sessionTimestamp', Date.now().toString());
    
    // Check if user is trying to access a dashboard directly
    const isDashboardPath = 
      currentPath === '/superadmin' || 
      currentPath === '/admin' || 
      currentPath === '/department' ||
      currentPath === '/driver' || 
      currentPath === '/hospital';
    
    if (isDashboardPath) {
      // User is accessing dashboard directly
      console.log(`📍 Direct dashboard access to ${currentPath}`);
      
      // Check if we have valid auth data
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      if (token && user) {
        try {
          // Basic validation of stored data
          JSON.parse(user); // Try to parse user data
          console.log('🔑 Existing auth data found - attempting to use it');
          // Don't clear - let the app try to use it
        } catch (error) {
          console.log('⚠️ Corrupted user data - clearing');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } else {
        console.log('❌ No auth data found for direct dashboard access');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } else {
      // Not a dashboard path - clear auth to ensure fresh login
      console.log('🧹 Clearing auth for new non-dashboard session');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  } else {
    // EXISTING SESSION (page refresh or navigation)
    console.log('🔃 Existing session detected');
    
    // Check if session is too old (optional - e.g., 8 hours)
    if (sessionTimestamp) {
      const sessionAge = Date.now() - parseInt(sessionTimestamp);
      const eightHours = 8 * 60 * 60 * 1000;
      
      if (sessionAge > eightHours) {
        console.log('⏰ Session expired (older than 8 hours)');
        sessionStorage.clear();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Create new session
        const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('sessionId', newSessionId);
        sessionStorage.setItem('sessionTimestamp', Date.now().toString());
      }
    }
    
    // For existing sessions, preserve auth data
    // The app will verify it with the backend
  }
  
  // Add a global error handler for auth-related errors
  const originalConsoleError = console.error;
  console.error = function(...args) {
    // Check for auth/network errors
    if (args.some(arg => 
      typeof arg === 'string' && 
      (arg.includes('500') || 
       arg.includes('Internal Server Error') || 
       arg.includes('token') || 
       arg.includes('auth') ||
       arg.includes('verify'))
    )) {
      console.warn('⚠️ Auth-related error detected');
      // You could trigger auth cleanup here if needed
    }
    originalConsoleError.apply(console, args);
  };
};

// Initialize the session
initializeAuthSession();

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Failed to find the root element')
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)