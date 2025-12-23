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
      {/* Header */}
      <Header />
      <HeaderMobile />
      
      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Fixed on Desktop */}
        <ArtistSidebar />
        
        {/* Mobile Menu */}
        <ArtistMobileMenu />
        
        {/* Content Area - Only this part changes when navigating */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <Outlet />
        </main>
      </div>
      
      {/* Player and Mobile Nav */}
      <MobileBottomNav />
      <Player />
    </div>
  );
};

export default ArtistPanelLayout;
