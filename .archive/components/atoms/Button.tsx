import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', ...props }) => {
  let className = 'px-4 py-2 rounded font-semibold ';
  switch (variant) {
    case 'primary':
      className += 'bg-blue-600 text-white hover:bg-blue-700';
      break;
    case 'secondary':
      className += 'bg-gray-200 text-gray-800 hover:bg-gray-300';
      break;
    case 'danger':
      className += 'bg-red-600 text-white hover:bg-red-700';
      break;
    default:
      break;
  }
  return (
    <button className={className} {...props}>
      {children}
    </button>
  );
}; 