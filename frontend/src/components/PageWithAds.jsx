import React from 'react';
import { AdBannerLeft, AdBannerRight } from './AdBanner';

export const PageWithAds = ({ children }) => {
  return (
    <div className="flex justify-center gap-4 px-2">
      <AdBannerLeft />
      <main className="w-full max-w-7xl">
        {children}
      </main>
      <AdBannerRight />
    </div>
  );
};
