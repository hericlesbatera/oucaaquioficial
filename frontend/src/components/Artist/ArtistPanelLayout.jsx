import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../Layout/Header';
import HeaderMobile from '../Layout/HeaderMobile';
import Player from '../Layout/Player';
import MobileBottomNav from '../Layout/MobileBottomNav';
import ArtistSidebar from './ArtistSidebar';
import ArtistMobileMenu from './ArtistMobileMenu';

const ArtistPanelLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header - Desktop */}
      <div className="hidden md:block">
        <Header />
      </div>
      {/* Header - Mobile */}
      <div className="md:hidden">
        <HeaderMobile />
      </div>
      
      {/* Mobile Menu - Drawer */}
      <ArtistMobileMenu />
      
      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Only on Desktop */}
        <ArtistSidebar />
        
        {/* Content Area - Only this part changes when navigating */}
        <main className="flex-1 overflow-y-auto pb-24 md:pb-0 pt-0">
          <Outlet />
        </main>
      </div>
      
      {/* Player and Mobile Nav */}
      <div className="md:hidden">
        <MobileBottomNav />
      </div>
      <Player />
    </div>
  );
};

export default ArtistPanelLayout;
