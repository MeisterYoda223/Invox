import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AuthProvider } from '../lib/AuthContext';
import { Toaster } from './components/ui/sonner';
import { useEffect } from 'react';

async function setupCapacitor() {
  // Dynamische Imports — schlägt sauber fehl wenn Capacitor nicht installiert ist
  const isCapacitor = !!(window as any).Capacitor?.isNativePlatform?.();
  if (!isCapacitor) return;

  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setOverlaysWebView({ overlay: false });
    await StatusBar.setStyle({ style: Style.Dark });
  } catch { /* nicht installiert */ }

  try {
    const { App: CapApp } = await import('@capacitor/app');
    CapApp.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) window.history.back();
      else CapApp.exitApp();
    });
  } catch { /* nicht installiert */ }
}

export default function App() {
  useEffect(() => { setupCapacitor(); }, []);

  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster position="top-center" />
    </AuthProvider>
  );
}
