import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { I18nProvider } from './lib/i18n/I18nProvider';
import { OfflineProvider } from './lib/offline/OfflineProvider';
import { registerSW } from 'virtual:pwa-register';
import './styles/globals.css';

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  registerSW({
    onNeedRefresh() {
      if (confirm('New content available. Reload?')) {
        window.location.reload();
      }
    },
    onOfflineReady() {
      console.log('App ready to work offline');
    },
  });
}

// Clerk publishable key
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  console.warn('Missing VITE_CLERK_PUBLISHABLE_KEY - Auth disabled');
}

// React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// App wrapper with providers
function AppWithProviders() {
  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <I18nProvider>
            <OfflineProvider>
              {clerkPubKey ? (
                <ClerkProvider publishableKey={clerkPubKey}>
                  <AuthProvider>
                    <App />
                    <Toaster
                      position="top-right"
                      toastOptions={{
                        style: {
                          background: '#1F2937',
                          color: '#F9FAFB',
                          border: '1px solid #374151',
                        },
                      }}
                    />
                  </AuthProvider>
                </ClerkProvider>
              ) : (
                <>
                  <App />
                  <Toaster
                    position="top-right"
                    toastOptions={{
                      style: {
                        background: '#1F2937',
                        color: '#F9FAFB',
                        border: '1px solid #374151',
                      },
                    }}
                  />
                </>
              )}
            </OfflineProvider>
          </I18nProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </React.StrictMode>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<AppWithProviders />);
