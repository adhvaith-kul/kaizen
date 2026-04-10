import { AuthProvider } from './src/context/AuthContext';
import { AlertProvider } from './src/context/AlertContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AlertProvider>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </AlertProvider>
  );
}
