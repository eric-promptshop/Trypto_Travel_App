import React, { useState } from 'react';

interface FloatingActionContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const FloatingActionContainer: React.FC<FloatingActionContainerProps> = ({ 
  children,
  className = ''
}) => {
  const [position, setPosition] = useState({
    x: 20, 
    y: window.innerHeight - 80
  });
  
  // Allow user to reposition the floating controls
  const handleDrag = (e: React.DragEvent) => {
    setPosition({
      x: Math.max(0, Math.min(window.innerWidth - 60, e.clientX - 30)),
      y: Math.max(0, Math.min(window.innerHeight - 60, e.clientY - 30))
    });
  };
  
  return (
    <div 
      className={`floating-action-container ${className}`}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 1000,
        borderRadius: '50%',
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        touchAction: 'none'
      }}
      draggable
      onDragEnd={handleDrag}
    >
      {children}
    </div>
  );
}; 