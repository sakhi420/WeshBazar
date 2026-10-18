'use client';

/**
 * Captures ?ref= / ?utm_source= once on the first page entry of the tab.
 * Renders nothing; it only populates session storage for the attribution loop.
 */
import { useEffect } from 'react';
import { captureReferralFromSearch } from './referral';

export function ReferralCapture() {
  useEffect(() => {
    captureReferralFromSearch(window.location.search);
  }, []);

  return null;
}