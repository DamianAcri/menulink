"use client";

import { useEffect } from 'react';
import { createOrUpdateUserSession } from '@/lib/session-utils';

interface SessionTrackerProps {
  restaurantId: string;
}

export default function SessionTracker({ restaurantId }: SessionTrackerProps) {
  useEffect(() => {
    // Create or update the user session when the component mounts
    const initSession = async () => {
      try {
        await createOrUpdateUserSession(restaurantId);
      } catch (error) {
        console.error('Error initializing session:', error);
      }
    };
    
    initSession();
  }, [restaurantId]);

  // This component doesn't render anything
  return null;
}