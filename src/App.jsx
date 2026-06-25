import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import { LangProvider } from '@/lib/LangContext';
import { ModeProvider } from '@/lib/ModeContext';
import { useAudioResume } from '@/lib/useAudioResume';

import PadLayout from './components/pad/PadLayout';
import Home from './pages/Home';
import Search from './pages/Search';
import Scenes from './pages/Scenes';
import Settings from './pages/Settings';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-obsidian">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-brass/20 border-t-brass rounded-full animate-spin"></div>
          <p className="text-xs font-heading tracking-widest text-brass-dim uppercase">Keeper Director</p>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route element={<PadLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/scenes" element={<Scenes />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {
  useAudioResume(); // відновлення AudioContext при поверненні з фону (M5)
  return (
    <LangProvider>
      <ModeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <ScrollToTop />
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
      </ModeProvider>
    </LangProvider>
  )
}

export default App