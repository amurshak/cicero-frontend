import React from 'react';
import { sharedStyles } from '../shared/sharedStyles';

export function Input({ 
  placeholder, 
  value, 
  onChange, 
  type = "text",
  className = "",
  error = "",
  label = "",
  required = false,
  ...props 
}) {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-white/80 mb-2">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`
            w-full px-4 py-3 bg-transparent 
            border rounded-lg text-white placeholder-white/50 
            focus:outline-none focus:ring-2 transition-all
            ${error 
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
              : 'border-white/20 focus:border-blue-500 focus:ring-blue-500/20 hover:border-white/30'
            }
          `}
          style={sharedStyles.inputStyles}
          {...props}
        />
        {error && (
          <p className="mt-2 text-sm text-red-400">{error}</p>
        )}
      </div>
    </div>
  );
}