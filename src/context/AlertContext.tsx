import React, { createContext, useContext, useState, useCallback } from 'react';
import CustomAlert from '../components/CustomAlert';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertContextType {
  showAlert: (title: string, message: string, buttons?: AlertButton[]) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState<{ title: string; message: string; buttons?: AlertButton[] }>({
    title: '',
    message: '',
  });

  const showAlert = useCallback((title: string, message: string, buttons?: AlertButton[]) => {
    setData({ title, message, buttons });
    setVisible(true);
  }, []);

  const hideAlert = useCallback(() => {
    setVisible(false);
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <CustomAlert 
        visible={visible} 
        title={data.title} 
        message={data.message} 
        buttons={data.buttons}
        onClose={hideAlert} 
      />
    </AlertContext.Provider>
  );
}

export function useGlobalAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useGlobalAlert must be used within an AlertProvider');
  }
  return context;
}
