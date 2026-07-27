import { useEffect, useState } from 'react';
import { getAvailabilityStatus, type AvailabilityStatus } from '../utils/availability';

const TICK_MS = 60_000;

/** Live availability status; refreshes every minute so 09:00 / 21:00 flips apply. */
export function useAvailability(): AvailabilityStatus {
  const [status, setStatus] = useState<AvailabilityStatus>(() => getAvailabilityStatus());

  useEffect(() => {
    const tick = () => setStatus(getAvailabilityStatus());
    tick();
    const id = window.setInterval(tick, TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  return status;
}
