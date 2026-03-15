import React from 'react';

interface BedIconProps {
  size?: number;
  className?: string;
}

const BedIcon: React.FC<BedIconProps> = ({ size = 40, className = "" }) => {
  return (
    <img 
      src="/images/svg/bed-queen.svg" 
      alt="Bed"
      width={size}
      height={size}
      className={className}
    />
  );
};

export default BedIcon;