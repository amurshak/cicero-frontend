import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  Home, 
  MessageSquare, 
  LogOut
} from 'lucide-react';
import { sharedStyles } from '../shared/sharedStyles';
import { useAuth } from '../../hooks/useAuth';

export function NavigationSidebar() {
  const [isExpanded, setIsExpanded] = useState(true);
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/chat', icon: MessageSquare, label: 'Chat' },
  ];

  return (
    <div 
      className={`${isExpanded ? 'w-64' : 'w-16'} flex flex-col noise-bg transition-all duration-300`} 
      style={sharedStyles.navigationSidebarStyles}
    >
      <div style={sharedStyles.strokeStyles} />
      
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -right-3 top-6 bg-primary-800 p-1 rounded-full z-20 hover:bg-primary-700 transition-colors"
        aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
      >
        {isExpanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>

      <div className="p-4 flex items-center gap-3 border-b border-white/10">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-lg font-bold">C</span>
        </div>
        {isExpanded && (
          <div className="animate-fade-in">
            <h1 className="font-bold text-lg">Cicero</h1>
            <p className="text-xs text-white/60">Legislative Intelligence</p>
          </div>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`
              flex items-center gap-3 px-3 py-2 rounded-lg transition-all
              ${isActive(item.path) 
                ? 'bg-blue-600/20 text-blue-400' 
                : 'text-white/70 hover:bg-white/5 hover:text-white'
              }
            `}
          >
            <item.icon size={20} className="flex-shrink-0" />
            {isExpanded && (
              <span className="animate-fade-in">{item.label}</span>
            )}
          </Link>
        ))}
      </nav>

      {user && (
        <div className="p-4 border-t border-white/10">
          <div className={`flex items-center gap-3 ${isExpanded ? 'mb-3' : ''}`}>
            <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold">
                {user.displayName ? user.displayName[0].toUpperCase() : user.email[0].toUpperCase()}
              </span>
            </div>
            {isExpanded && (
              <div className="flex-1 animate-fade-in">
                <p className="text-sm font-medium truncate">{user.displayName || user.email}</p>
                <p className="text-xs text-white/60">
                  {user.subscriptionTier || 'Free'} Plan
                </p>
              </div>
            )}
          </div>
          {isExpanded && (
            <button
              onClick={logout}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-all"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}