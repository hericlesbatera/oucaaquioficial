import React from 'react';
import { BadgeCheck } from 'lucide-react';

// Reusable avatar with a blue "verified" badge overlay at bottom-right.
// Props:
// - src: image url
// - alt: alt text
// - className: classes applied to the img element (size, rounded, etc.)
// - showBadge: boolean to show/hide the badge
const VerifiedAvatar = ({ src, alt = '', className = '', showBadge = true, badgeClassName = '' }) => {
  const badgeSize = badgeClassName || 'w-7 h-7';
  const iconSize = badgeClassName?.includes('w-5') ? 'w-3 h-3' : 'w-4 h-4';
  
  return (
    <div className={`relative inline-block ${className.includes('w-') ? '' : ''}`}>
      <img src={src} alt={alt} className={`${className} block`} />

      {showBadge && (
        <div className="absolute bottom-2 right-2">
          <div className={`${badgeSize} rounded-full bg-blue-500 flex items-center justify-center shadow-md`}>
            <BadgeCheck className={iconSize} color="#fff" />
          </div>
        </div>
      )}
    </div>
  );
};

export default VerifiedAvatar;
