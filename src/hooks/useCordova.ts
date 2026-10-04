import { useEffect } from 'react';

/**
 * Hook to integrate native Cordova / Android APK features:
 * - Device Ready event
 * - Native Android Hardware Back Button handling
 * - Native Status Bar & Navigation Bar color configuration
 * - Native Splashscreen dismissal
 */
export function useCordova(options?: {
  onBackButton?: () => boolean; // return true to prevent default back behavior
}) {
  useEffect(() => {
    const handleDeviceReady = () => {
      console.log('Cordova native device ready');

      // 1. Configure Native Android Status Bar
      const win = window as any;
      if (win.StatusBar) {
        try {
          win.StatusBar.overlaysWebView(false);
          win.StatusBar.backgroundColorByHexString('#151618');
          win.StatusBar.styleLightContent();
        } catch (e) {
          console.warn('Cordova StatusBar setup notice:', e);
        }
      }

      // 2. Hide Native Splashscreen
      if (win.navigator && win.navigator.splashscreen) {
        try {
          win.navigator.splashscreen.hide();
        } catch (e) {
          console.warn('Cordova splashscreen hide notice:', e);
        }
      }

      // 3. Configure Android Navigation Bar (if plugin present)
      if (win.NavigationBar) {
        try {
          win.NavigationBar.backgroundColorByHexString('#0b0d14', false);
        } catch (e) {
          console.warn('Cordova NavigationBar notice:', e);
        }
      }
    };

    const handleBackButton = (e: Event) => {
      if (options?.onBackButton) {
        const handled = options.onBackButton();
        if (handled) {
          e.preventDefault();
          return;
        }
      }
    };

    document.addEventListener('deviceready', handleDeviceReady, false);
    document.addEventListener('backbutton', handleBackButton, false);

    return () => {
      document.removeEventListener('deviceready', handleDeviceReady);
      document.removeEventListener('backbutton', handleBackButton);
    };
  }, [options?.onBackButton]);
}
