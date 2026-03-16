import React from 'react';


interface DollarIconProps {
  size?: number;
  className?: string;
 
}

const DollarIcon: React.FC<DollarIconProps> = ({ size = 40, className = "" }) => {
  return (
    <img 
      src="/images/svg/dollar-circle.svg" 
      alt="Dollar"
      width={size}
      height={size}
      className={className}
    />
  );
};

export default DollarIcon;