import React from 'react';

interface LocationIconProps {
  size?: number;
  className?: string;
}

const LocationIcon: React.FC<LocationIconProps> = ({ size = 40, className = "" }) => {
  return (
    <img 
      src="/images/svg/location.svg" 
      alt="Location"
      width={size}
      height={size}
      className={className}
    />
  );
};

export default LocationIcon;