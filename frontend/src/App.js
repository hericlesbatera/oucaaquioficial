import React, { useEffect, lazy, Suspense } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { PlayerProvider, usePlayer } from "./context/PlayerContext";
import { usePlayerActive } from "./hooks/usePlayerActive";
import { Toaster } from "./components/ui/toaster";
import LoadingSpinner from "./components/LoadingSpinner";

// Layout Components
import Header from "./components/Layout/Header";
import HeaderMobile from "./components/Layout/HeaderMobile";
import Footer from "./components/Layout/Footer";
import FooterSimple from "./components/Layout/FooterSimple";
import Player from "./components/Layout/Player";
import MobileBottomNav from "./components/Layout/MobileBottomNav";
import MobileLayout from "./components/Layout/MobileLayout";
import ArtistPanelLayout from "./components/Artist/ArtistPanelLayout";

// Pages - Lazy loaded para code splitting (cada página carrega apenas quando acessada)
const Login = lazy(() => import("./pages/Login"));
const LoginWhite = lazy(() => import("./pages/LoginWhite"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const HomeImproved = lazy(() => import("./pages/HomeImproved"));
const Search = lazy(() => import("./pages/Search"));
const Library = lazy(() => import("./pages/Library"));
const Playlists = lazy(() => import("./pages/Playlists"));
const Clips = lazy(() => import("./pages/Clips"));
const AlbumPage = lazy(() => import("./pages/AlbumPage"));
const PlaylistPage = lazy(() => import("./pages/PlaylistPage"));
const TopCds = lazy(() => import("./pages/TopCds"));
const RecentReleases = lazy(() => import("./pages/RecentReleases"));
const GenrePage = lazy(() => import("./pages/GenrePage"));
const ProfilePublicNew = lazy(() => import("./pages/Artist/ProfilePublicNew"));
const About = lazy(() => import("./pages/About"));
const Policies = lazy(() => import("./pages/Policies"));

// Artist Pages
const DashboardNew = lazy(() => import("./pages/Artist/DashboardNew"));
const UploadNew = lazy(() => import("./pages/Artist/UploadNew"));
const MyAlbums = lazy(() => import("./pages/Artist/MyAlbums"));
const MyPlaylists = lazy(() => import("./pages/Artist/MyPlaylists"));
const Favoritos = lazy(() => import("./pages/Artist/Favoritos"));
const MeusVideos = lazy(() => import("./pages/Artist/MeusVideos"));
const SettingsNew = lazy(() => import("./pages/Artist/SettingsNew"));
const EmailSenha = lazy(() => import("./pages/Artist/EmailSenha"));
const Support = lazy(() => import("./pages/Artist/Support"));

// User Pages
const UserPanelNew = lazy(() => import("./pages/User/UserPanelNew"));
const UserSupport = lazy(() => import("./pages/User/UserSupport"));

// Admin Pages
const AdminPanel = lazy(() => import("./pages/Admin/AdminPanel"));
const SlidesManager = lazy(() => import("./pages/Admin/SlidesManager"));

// Fallback de carregamento para lazy pages
const PageFallback = () => (
  <div className="min-h-screen bg-white flex items-center justify-center">
    <LoadingSpinner size="medium" text="Carregando..." />
  </div>
);

// Gerenciar padding do player
const PlayerPaddingManager = () => {
  usePlayerActive();
  return null;
};

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  
  return null;
};

// Handle Recovery/Reset Password Link
const RecoveryHandler = () => {
  useEffect(() => {
    // Verificar se há token de recovery no hash
    const hash = window.location.hash;
    const pathname = window.location.pathname;
    
    console.log('Hash detectado:', hash);
    console.log('Pathname:', pathname);
    
    if (hash.includes('type=recovery') && hash.includes('access_token')) {
      console.log('Recovery token detectado');
      
      // Se não está em /reset-password, redirecionar mantendo o hash
      if (pathname !== '/reset-password') {
        console.log('Redirecionando para /reset-password');
        // Usar window.location para manter o hash intacto
        window.location.pathname = '/reset-password';
      }
    }
  }, []);
  
  return null;
};

// Save current path when navigating away from login/signup
const PathSaver = () => {
  const location = useLocation();
  
  useEffect(() => {
    const currentPath = location.pathname;
    
    // Salvar o caminho anterior se não estiver em login/cadastro/reset
    if (currentPath !== '/login' && currentPath !== '/cadastrar' && currentPath !== '/reset-password') {
      localStorage.setItem('previousPath', currentPath);
    }
  }, [location]);
  
  return null;
};

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingSpinner size="large" text="Carregando..." />
      </div>
    );
  }

  if (!user) {
    // Redirecionar pro login com o pathname anterior no state
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
};

const MainLayout = ({ children, showFooter = true }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <HeaderMobile />
      <Header />
      <main className="flex-1 pb-20 md:pb-0">
        {children}
      </main>
      {showFooter && <FooterSimple />}
      <MobileBottomNav />
      <Player />
    </div>
  );
};

const AdminLayout = ({ children }) => {
   return (
     <div className="min-h-screen flex flex-col bg-gray-50">
       {children}
     </div>
   );
 };

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={<Login />}
      />
      <Route
        path="/cadastrar"
        element={<LoginWhite />}
      />
      
      <Route
        path="/reset-password"
        element={<ResetPassword />}
      />
      
      {/* Public Routes - No login required */}
      <Route
        path="/"
        element={
          <MainLayout>
            <HomeImproved />
          </MainLayout>
        }
      />
      
      <Route
        path="/:artistSlug/:albumSlug"
        element={
          <MainLayout showFooter={false}>
            <AlbumPage />
          </MainLayout>
        }
      />
      
      <Route
        path="/playlist/:playlistSlug"
        element={
          <MainLayout showFooter={false}>
            <PlaylistPage />
          </MainLayout>
        }
      />
      
      <Route
         path="/search"
         element={
           <MainLayout>
             <Search />
           </MainLayout>
         }
       />
       
       <Route
         path="/playlists"
         element={
           <ProtectedRoute>
             <MainLayout>
               <Playlists />
             </MainLayout>
           </ProtectedRoute>
         }
       />

       <Route
         path="/clips"
         element={
           <MainLayout>
             <Clips />
           </MainLayout>
         }
       />
       
       <Route
         path="/top-cds"
        element={
          <MainLayout>
            <TopCds />
          </MainLayout>
        }
      />
      
      <Route
        path="/lancamentos"
        element={
          <MainLayout>
            <RecentReleases />
          </MainLayout>
        }
      />
      
      <Route
        path="/genero/:genre"
        element={
          <MainLayout>
            <GenrePage />
          </MainLayout>
        }
      />
      
      <Route
        path="/sobre"
        element={
          <MainLayout>
            <About />
          </MainLayout>
        }
      />
      
      <Route
        path="/politicas"
        element={
          <MainLayout>
            <Policies />
          </MainLayout>
        }
      />
      
      {/* Protected Routes - Login required */}
      <Route
        path="/library"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Library />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/favorites"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Library />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      
      {/* User Panel Routes - Protected */}
      <Route
        path="/user/panel"
        element={
          <ProtectedRoute>
            <UserPanelNew />
          </ProtectedRoute>
        }
      />
      

      
      {/* Artist Routes - Protected with shared layout */}
      <Route
        path="/artist"
        element={
          <ProtectedRoute>
            <ArtistPanelLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<DashboardNew />} />
        <Route path="upload" element={<UploadNew />} />
        <Route path="albums" element={<MyAlbums />} />
        <Route path="playlists" element={<MyPlaylists />} />
        <Route path="favoritos" element={<Favoritos />} />
        <Route path="meus-videos" element={<MeusVideos />} />
        <Route path="support" element={<Support />} />
        <Route path="settings" element={<SettingsNew />} />
        <Route path="email-senha" element={<EmailSenha />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>
      
      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <AdminPanel />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/slides"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <SlidesManager />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/support"
        element={
          <ProtectedRoute>
            <UserSupport />
          </ProtectedRoute>
        }
      />

      {/* Artist Profile - Must be last to act as catch-all */}
      <Route
        path="/:slug"
        element={
          <MainLayout showFooter={false}>
            <ProfilePublicNew />
          </MainLayout>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PlayerProvider>
          <PlayerPaddingManager />
          <ScrollToTop />
          <PathSaver />
          <RecoveryHandler />
          <Suspense fallback={<PageFallback />}>
            <AppRoutes />
          </Suspense>
          <Toaster />
        </PlayerProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
