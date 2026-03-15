import React from 'react';

interface BuildingIconProps {
  size?: number;
  className?: string;
}

const BuildingIcon: React.FC<BuildingIconProps> = ({ size = 40, className = "" }) => {
  return (
    <img 
      src="/images/svg/building.svg" 
      alt="Building"
      width={size}
      height={size}
      className={className}
    />
  );
};

export default BuildingIcon;