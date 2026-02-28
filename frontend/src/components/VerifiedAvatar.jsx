import React from 'react';
import IconVerified from '../assets/icons/icon-verified.svg';

// Reusable avatar with a blue "verified" badge overlay at bottom-right.
// Props:
// - src: image url
// - alt: alt text
// - className: classes applied to the img element (size, rounded, etc.)
// - showBadge: boolean to show/hide the badge
const VerifiedAvatar = ({ src, alt = '', className = '', showBadge = true, badgeClassName = '' }) => {
  const badgeSize = badgeClassName || 'w-7 h-7';

  return (
    <div className={`relative inline-block`}>
      <img src={src} alt={alt} className={`${className} block`} />

      {showBadge && (
        <div className="absolute bottom-2 right-2">
          <img src={IconVerified} alt="verificado" className={`${badgeSize} drop-shadow-md`} />
        </div>
      )}
    </div>
  );
};

export default VerifiedAvatar;
