import React from 'react';
import { NavigationSidebar } from './NavigationSidebar';

export function PageContainer({ children, showSidebar = true }) {
  return (
    <div className="flex h-screen overflow-hidden bg-primary-900 text-white">
      {showSidebar && <NavigationSidebar />}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}