import { useEffect, useState } from 'react';

export function useOrientation() {
  const [orientation, setOrientation] = useState<string>(
    typeof window !== 'undefined' && window.screen?.orientation
      ? window.screen.orientation.type
      : 'portrait-primary'
  );

  const [isLandscape, setIsLandscape] = useState<boolean>(
    typeof window !== 'undefined'
      ? window.innerWidth > window.innerHeight
      : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };

    const handleOrientationChange = () => {
      if (window.screen?.orientation) {
        setOrientation(window.screen.orientation.type);
      }
      setIsLandscape(window.innerWidth > window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    if (window.screen?.orientation) {
      window.screen.orientation.addEventListener('change', handleOrientationChange);
    } else {
      window.addEventListener('orientationchange', handleOrientationChange);
    }

    // Call once to ensure accurate state
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (window.screen?.orientation) {
        window.screen.orientation.removeEventListener('change', handleOrientationChange);
      } else {
        window.removeEventListener('orientationchange', handleOrientationChange);
      }
    };
  }, []);

  const allowRotation = async () => {
    try {
      if (typeof window !== 'undefined' && window.screen?.orientation) {
        const orientationAny = window.screen.orientation as any;
        if (orientationAny.unlock) {
          orientationAny.unlock();
          return true;
        }
      }
    } catch (err) {
      console.warn('Screen orientation unlock not supported or restricted:', err);
    }
    return false;
  };

  const lockPortrait = async () => {
    try {
      if (typeof window !== 'undefined' && window.screen?.orientation) {
        const orientationAny = window.screen.orientation as any;
        if (orientationAny.lock) {
          await orientationAny.lock('portrait');
          return true;
        }
      }
    } catch (err) {
      console.warn('Screen orientation locking to portrait failed:', err);
    }
    return false;
  };

  const lockLandscape = async () => {
    try {
      if (typeof window !== 'undefined' && window.screen?.orientation) {
        const orientationAny = window.screen.orientation as any;
        if (orientationAny.lock) {
          await orientationAny.lock('landscape');
          return true;
        }
      }
    } catch (err) {
      console.warn('Screen orientation locking to landscape failed:', err);
    }
    return false;
  };

  return {
    orientation,
    isLandscape,
    allowRotation,
    lockPortrait,
    lockLandscape,
  };
}
