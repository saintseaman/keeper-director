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
import { usePrefsReady } from '@/lib/usePrefsReady';

import PadLayout from './components/pad/PadLayout';
import Home from './pages/Home.jsx';
import Search from './pages/Search';
import Scenes from './pages/Scenes';
import Tags from './pages/Tags';
import Settings from './pages/Settings';
import Landing from './pages/Landing.jsx';
import Demo from './pages/Demo.jsx';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

const AuthenticatedApp = () => {
  const { isLoadingPublicSettings } = useAuth();

  if (isLoadingPublicSettings) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-obsidian">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-brass/20 border-t-brass rounded-full animate-spin"></div>
          <p className="text-xs font-heading tracking-widest text-brass-dim uppercase">Keeper Director</p>
        </div>
      </div>
    );
  }

  // Публичные маршруты (лендинг + демо) доступны без аккаунта.
  // Сам саундборд под /app защищён гейтом авторизации и загрузки настроек.
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/demo" element={<Demo />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/app/*" element={<AppGate />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

// Гейт авторизации для самого приложения (саундборда).
const AppGate = () => {
  const { isLoadingAuth, authError, navigateToLogin } = useAuth();

  if (isLoadingAuth) {
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

  return <PrefsGate />;
};

// Завантажуємо хмарні налаштування користувача (UserPrefs) перед рендером
// застосунку, щоб геттери storage віддавали хмарні дані, а не дефолти.
const PrefsGate = () => {
  const prefsReady = usePrefsReady();

  if (!prefsReady) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-obsidian">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-brass/20 border-t-brass rounded-full animate-spin"></div>
          <p className="text-xs font-heading tracking-widest text-brass-dim uppercase">Синхронизация…</p>
        </div>
      </div>
    );
  }

  // Эти маршруты вложены под <Route path="/app/*">, поэтому пути ОТНОСИТЕЛЬНЫЕ
  // ("" = /app, "search" = /app/search и т.д.).
  return (
    <Routes>
      <Route element={<PadLayout />}>
        <Route index element={<Home />} />
        <Route path="search" element={<Search />} />
        <Route path="scenes" element={<Scenes />} />
        <Route path="tags" element={<Tags />} />
        <Route path="settings" element={<Settings />} />
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