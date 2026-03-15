import React from 'react';

interface AddIconProps {
  size?: number;
  className?: string;
}

const AddIcon: React.FC<AddIconProps> = ({ size = 24, className = "" }) => {
  return (
    <img 
      src="/images/svg/add-plus-circle.svg" 
      alt="Add"
      width={size}
      height={size}
      className={className}
    />
  );
};

export default AddIcon;