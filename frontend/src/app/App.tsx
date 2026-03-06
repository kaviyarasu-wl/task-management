import { Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from './router';
import { SocketProvider } from '@/shared/contexts/SocketContext';
import { ToastContainer } from '@/shared/components/ToastContainer';
import { RealtimeProvider } from './RealtimeProvider';
import { ThemeProvider } from '@/shared/contexts/ThemeProvider';
import { LiveRegionProvider } from '@/shared/components/LiveRegion';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function App() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <SocketProvider>
              <RealtimeProvider>
                <LiveRegionProvider>
                  <AppRouter />
                  <ToastContainer />
                </LiveRegionProvider>
              </RealtimeProvider>
            </SocketProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </ThemeProvider>
    </Suspense>
  );
}

export default App;
