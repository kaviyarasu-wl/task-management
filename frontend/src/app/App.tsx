import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from './router';
import { SocketProvider } from '@/shared/contexts/SocketContext';
import { ToastContainer } from '@/shared/components/ToastContainer';
import { RealtimeProvider } from './RealtimeProvider';

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
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <SocketProvider>
          <RealtimeProvider>
            <AppRouter />
            <ToastContainer />
          </RealtimeProvider>
        </SocketProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
