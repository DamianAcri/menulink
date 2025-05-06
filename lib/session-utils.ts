import { supabase } from './supabase';

// Define types for browser detection
interface UserSessionData {
  sessionId: string;
  deviceType: string;
  deviceOs: string;
  browser: string;
  referrer: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
}

// Helper function to generate UUID without external dependencies
function generateUUID(): string {
  // Create a random UUID string using native crypto if available
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Helper function to detect device type
export function getDeviceType(): string {
  if (typeof window === 'undefined') return 'unknown';
  const ua = navigator.userAgent;
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Opera Mini/i.test(ua)) return 'mobile';
  if (/Tablet|iPad/i.test(ua)) return 'tablet';
  return 'desktop';
}

// Helper function to detect OS
function getDeviceOs(): string {
  if (typeof window === 'undefined') return 'unknown';
  const ua = navigator.userAgent;
  
  if (/Windows/i.test(ua)) return 'Windows';
  if (/Macintosh|MacIntel|MacPPC|Mac68K/i.test(ua)) return 'MacOS';
  if (/Android/i.test(ua)) return 'Android';
  if (/iPad|iPhone|iPod/i.test(ua)) return 'iOS';
  if (/Linux/i.test(ua)) return 'Linux';
  
  return 'unknown';
}

// Helper function to detect browser
function getBrowser(): string {
  if (typeof window === 'undefined') return 'unknown';
  const ua = navigator.userAgent;
  
  if (/Chrome/i.test(ua)) return 'Chrome';
  if (/Firefox/i.test(ua)) return 'Firefox';
  if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return 'Safari';
  if (/MSIE|Trident/i.test(ua)) return 'Internet Explorer';
  if (/Edge/i.test(ua)) return 'Edge';
  if (/Opera|OPR/i.test(ua)) return 'Opera';
  
  return 'unknown';
}

// Get UTM parameters from URL
function getUtmParameters(): { source: string | null; medium: string | null; campaign: string | null } {
  if (typeof window === 'undefined') {
    return { source: null, medium: null, campaign: null };
  }
  
  const urlParams = new URLSearchParams(window.location.search);
  return {
    source: urlParams.get('utm_source'),
    medium: urlParams.get('utm_medium'),
    campaign: urlParams.get('utm_campaign')
  };
}

// Function to get or create a session ID
function getSessionId(): string {
  if (typeof window === 'undefined') {
    return generateUUID(); // Fallback for SSR
  }
  
  // Check if session ID exists in localStorage
  let sessionId = localStorage.getItem('menulink_session_id');
  
  // If not, create a new one
  if (!sessionId) {
    sessionId = generateUUID();
    localStorage.setItem('menulink_session_id', sessionId);
  }
  
  return sessionId;
}

// Create or update user session
export async function createOrUpdateUserSession(restaurantId: string): Promise<string> {
  try {
    if (typeof window === 'undefined') {
      return 'server-side';
    }
    
    const sessionId = getSessionId();
    const deviceType = getDeviceType();
    const deviceOs = getDeviceOs();
    const browser = getBrowser();
    const referrer = document.referrer || null;
    const { source, medium, campaign } = getUtmParameters();
    
    // Check if this is a returning visitor (session already exists in DB)
    const { data: existingSession } = await supabase
      .from('user_sessions')
      .select('id')
      .eq('session_id', sessionId)
      .eq('restaurant_id', restaurantId)
      .maybeSingle();
    
    const isReturning = !!existingSession;
    
    if (isReturning) {
      // Update existing session
      await supabase
        .from('user_sessions')
        .update({
          ended_at: new Date().toISOString(), // Update the last activity time
        })
        .eq('session_id', sessionId)
        .eq('restaurant_id', restaurantId);
    } else {
      // Create new session
      await supabase
        .from('user_sessions')
        .insert({
          session_id: sessionId,
          restaurant_id: restaurantId,
          device_type: deviceType,
          device_os: deviceOs,
          browser: browser,
          referrer: referrer,
          utm_source: source,
          utm_medium: medium,
          utm_campaign: campaign,
          is_returning: false
        });
    }
    
    return sessionId;
  } catch (error) {
    console.error('Error creating/updating user session:', error);
    return 'error';
  }
}