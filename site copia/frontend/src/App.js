import React, { useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { PlayerProvider } from "./context/PlayerContext";
import { Toaster } from "./components/ui/toaster";

// Layout Components
import Header from "./components/Layout/Header";
import Footer from "./components/Layout/Footer";
import FooterSimple from "./components/Layout/FooterSimple";
import Player from "./components/Layout/Player";

// Pages
import Login from "./pages/Login";
import LoginWhite from "./pages/LoginWhite";
import HomeImproved from "./pages/HomeImproved";
import Search from "./pages/Search";
import Library from "./pages/Library";
import Premium from "./pages/Premium";
import AlbumPage from "./pages/AlbumPage";
import PlaylistPage from "./pages/PlaylistPage";
import TopCds from "./pages/TopCds";
import RecentReleases from "./pages/RecentReleases";
import GenrePage from "./pages/GenrePage";
import ProfilePublicNew from "./pages/Artist/ProfilePublicNew";

// Artist Pages
import DashboardNew from "./pages/Artist/DashboardNew";
import UploadNew from "./pages/Artist/UploadNew";
import MyAlbums from "./pages/Artist/MyAlbums";
import MyPlaylists from "./pages/Artist/MyPlaylists";
import SettingsNew from "./pages/Artist/SettingsNew";

// Admin Pages
import SlidesManager from "./pages/Admin/SlidesManager";

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  
  return null;
};

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const MainLayout = ({ children, showFooter = true }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      {showFooter && <FooterSimple />}
      <Player />
    </div>
  );
};

const ArtistLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1 pb-24">
        {children}
      </main>
      <Player />
    </div>
  );
};

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/cadastrar"
        element={user ? <Navigate to="/" replace /> : <LoginWhite />}
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
      
      <Route
        path="/premium"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Premium />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      
      {/* Artist Routes - Protected */}
      <Route
        path="/artist/dashboard"
        element={
          <ProtectedRoute>
            <ArtistLayout>
              <DashboardNew />
            </ArtistLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/artist/upload"
        element={
          <ProtectedRoute>
            <ArtistLayout>
              <UploadNew />
            </ArtistLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/artist/albums"
        element={
          <ProtectedRoute>
            <ArtistLayout>
              <MyAlbums />
            </ArtistLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/artist/playlists"
        element={
          <ProtectedRoute>
            <ArtistLayout>
              <MyPlaylists />
            </ArtistLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/artist/settings"
        element={
          <ProtectedRoute>
            <ArtistLayout>
              <SettingsNew />
            </ArtistLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/admin/slides"
        element={
          <ProtectedRoute>
            <ArtistLayout>
              <SlidesManager />
            </ArtistLayout>
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
          <ScrollToTop />
          <AppRoutes />
          <Toaster />
        </PlayerProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
