import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import CustomAlert from '../components/CustomAlert';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertData {
  title: string;
  message: string;
  buttons?: AlertButton[];
}

interface AlertContextType {
  showAlert: (title: string, message: string, buttons?: AlertButton[]) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

// ─── Module-level singleton ────────────────────────────────────────────────────
// Stores a reference to the imperative show fn so that showAlert() can be
// called from anywhere in the app — inside or outside React components.
//
// Crucially, <GlobalAlert /> is mounted in App.tsx as a SIBLING to the
// NavigationContainer (not nested inside it). This ensures the Modal always
// escapes the navigation stacking context, which is the root cause of alerts
// not appearing in PWA / Expo Web standalone mode.
let _show: ((data: AlertData) => void) | null = null;

function dispatchAlert(title: string, message: string, buttons?: AlertButton[]) {
  if (_show) {
    _show({ title, message, buttons });
  } else {
    console.warn('[GlobalAlert] Not yet mounted — alert dropped:', title);
  }
}
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Wrap your app with AlertProvider so that useGlobalAlert() works in screens.
 * Do NOT rely on it rendering the Modal — that's GlobalAlert's job.
 */
export function AlertProvider({ children }: { children: React.ReactNode }) {
  const showAlert = useCallback(
    (title: string, message: string, buttons?: AlertButton[]) => {
      dispatchAlert(title, message, buttons);
    },
    []
  );

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
    </AlertContext.Provider>
  );
}

/**
 * Hook for screens to call showAlert imperatively.
 * Must be used inside AlertProvider.
 */
export function useGlobalAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useGlobalAlert must be used within an AlertProvider');
  }
  return context;
}

/**
 * Mount this ONCE in App.tsx as a sibling to your navigator — outside
 * NavigationContainer. It owns the Modal and registers into the singleton.
 *
 * <AlertProvider>
 *   <AuthProvider>
 *     <AppNavigator />   ← NavigationContainer lives here
 *   </AuthProvider>
 *   <GlobalAlert />      ← sibling, NOT inside the navigator
 * </AlertProvider>
 */
export function GlobalAlert() {
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState<AlertData>({ title: '', message: '' });

  const show = useCallback((alertData: AlertData) => {
    setData(alertData);
    setVisible(true);
  }, []);

  const hide = useCallback(() => {
    setVisible(false);
  }, []);

  // Register this component as the singleton handler on mount
  useEffect(() => {
    _show = show;
    return () => {
      _show = null;
    };
  }, [show]);

  return (
    <CustomAlert
      visible={visible}
      title={data.title}
      message={data.message}
      buttons={data.buttons}
      onClose={hide}
    />
  );
}
