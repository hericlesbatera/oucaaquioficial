import React from 'react';
import Header from './Header';
import HeaderMobile from './HeaderMobile';
import Player from './Player';
import MobileBottomNav from './MobileBottomNav';

const MobileLayout = ({ children, showNav = true }) => {
    return (
        <div className="min-h-screen flex flex-col bg-white">
            <HeaderMobile />
            <Header />
            <main className="flex-1 pb-20 md:pb-0">
                {children}
            </main>
            {showNav && <MobileBottomNav />}
            <Player />
        </div>
    );
};

export default MobileLayout;
