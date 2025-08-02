import React from 'react';
import { sharedStyles } from './sharedStyles';

export function GlassCard({ 
  children, 
  className = "", 
  style = {},
  variant = "default" 
}) {
  const variants = {
    default: sharedStyles.containerStyles,
    subtle: {
      background: "linear-gradient(108.74deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%)",
      backdropFilter: "blur(20px)",
      boxShadow: "0px 0px 30px -15px rgba(0, 0, 0, 0.3)",
    },
    prominent: {
      background: "linear-gradient(108.74deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.04) 100%)",
      backdropFilter: "blur(60px)",
      boxShadow: "0px 0px 60px -25px rgba(0, 0, 0, 0.6)",
    }
  };

  return (
    <div 
      className={`${sharedStyles.containerClasses} ${className}`}
      style={{ ...variants[variant], ...style }}
    >
      <div style={sharedStyles.strokeStyles} />
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
}