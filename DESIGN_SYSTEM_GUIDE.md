# Lawgiver Design System & Technical Style Guide

## Table of Contents
1. [Overview & Philosophy](#overview--philosophy)
2. [Technical Foundation](#technical-foundation)
3. [Color System](#color-system)
4. [Typography](#typography)
5. [Glassmorphism Design Language](#glassmorphism-design-language)
6. [Layout Architecture](#layout-architecture)
7. [Component Patterns](#component-patterns)
8. [Interactive Elements](#interactive-elements)
9. [Visual Effects](#visual-effects)
10. [Implementation Guide](#implementation-guide)
11. [Code Examples](#code-examples)

---

## Overview & Philosophy

### Design Vision
The Lawgiver design system embodies **professional authority with modern sophistication**. It creates a trustworthy, high-tech interface suitable for legal, governmental, or professional applications requiring both elegance and functionality.

### Core Principles
- **Glassmorphism First**: Layered transparency creates depth and modernity
- **Professional Minimalism**: Clean, uncluttered interfaces with purposeful elements
- **Consistent Hierarchy**: Clear information architecture through typography and spacing
- **Subtle Sophistication**: Effects that enhance without overwhelming
- **Accessibility**: Readable contrast ratios despite dark theme

---

## Technical Foundation

### Required Dependencies
```json
{
  "react": "^18.3.1",
  "tailwindcss": "^3.4.6",
  "lucide-react": "^0.411.0",
  "react-router-dom": "^6.24.1"
}
```

### Tailwind Configuration
```javascript
// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          900: '#151c2c',
          800: '#1e2738',
          700: '#1a2235'
        }
      },
      backdropBlur: {
        'lg': '50px'
      }
    },
  },
  plugins: [],
}
```

### CSS Imports Structure
```css
/* index.css */
@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';
@import './custom.css';
```

---

## Color System

### Primary Palette
```css
/* Background Colors */
--primary-bg: #151c2c;           /* Main application background */
--secondary-bg: #1e2738;         /* Secondary surfaces */
--tertiary-bg: #1a2235;          /* Hover/active states */

/* Text Colors */
--text-primary: rgba(255, 255, 255, 1);      /* Primary text */
--text-secondary: rgba(255, 255, 255, 0.8);  /* Secondary text */
--text-muted: rgba(255, 255, 255, 0.5);      /* Placeholder/muted */
--text-disabled: rgba(255, 255, 255, 0.3);   /* Disabled states */

/* Accent Colors */
--accent-blue: #3b82f6;          /* Interactive elements */
--accent-red: #ef4444;           /* Avatars/alerts */
--border-glass: rgba(196, 213, 232, 0.22);   /* Glassmorphism borders */
```

### Semantic Colors
```css
/* Status Colors */
--success: #10b981;
--warning: #f59e0b;
--error: #ef4444;
--info: #3b82f6;

/* Interactive States */
--hover-overlay: rgba(255, 255, 255, 0.1);
--active-overlay: rgba(255, 255, 255, 0.15);
--focus-ring: rgba(59, 130, 246, 0.5);
```

---

## Typography

### Font Hierarchy
```css
/* Heading Styles */
.heading-xl {    /* Main page titles */
  font-size: 2.25rem;      /* 36px */
  font-weight: 700;
  line-height: 1.2;
  color: var(--text-primary);
}

.heading-lg {    /* Section titles */
  font-size: 1.5rem;       /* 24px */
  font-weight: 600;
  line-height: 1.3;
  color: var(--text-primary);
}

.heading-md {    /* Subsection titles */
  font-size: 1.25rem;      /* 20px */
  font-weight: 600;
  line-height: 1.4;
  color: var(--text-secondary);
}

/* Body Text */
.body-lg {       /* Primary content */
  font-size: 1rem;         /* 16px */
  line-height: 1.6;
  color: var(--text-secondary);
}

.body-sm {       /* Secondary content */
  font-size: 0.875rem;     /* 14px */
  line-height: 1.5;
  color: var(--text-muted);
}

/* Utility Text */
.caption {       /* Labels, captions */
  font-size: 0.75rem;      /* 12px */
  line-height: 1.4;
  color: var(--text-muted);
}
```

---

## Glassmorphism Design Language

### Core Glassmorphism Properties
```css
.glass-container {
  background: linear-gradient(
    108.74deg, 
    rgba(255, 255, 255, 0.08) 0%, 
    rgba(255, 255, 255, 0.02) 50%
  );
  box-shadow: 0px 0px 50px -25px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(50px);
  border: 0.5px solid rgba(196, 213, 232, 0.22);
  border-radius: 6px;
  position: relative;
  overflow: hidden;
}

.glass-stroke {
  position: absolute;
  inset: 0;
  border-radius: 6px;
  pointer-events: none;
  border: 0.5px solid rgba(196, 213, 232, 0.22);
}
```

### Glassmorphism Variants
```css
/* Subtle Glass (for secondary elements) */
.glass-subtle {
  background: linear-gradient(
    108.74deg, 
    rgba(255, 255, 255, 0.04) 0%, 
    rgba(255, 255, 255, 0.01) 100%
  );
  backdrop-filter: blur(20px);
}

/* Prominent Glass (for primary containers) */
.glass-prominent {
  background: linear-gradient(
    108.74deg, 
    rgba(255, 255, 255, 0.12) 0%, 
    rgba(255, 255, 255, 0.04) 100%
  );
  backdrop-filter: blur(60px);
}

/* Navigation Glass */
.glass-navigation {
  background: linear-gradient(
    108.74deg, 
    rgba(255, 255, 255, 0.08) 0%, 
    rgba(255, 255, 255, 0.02) 50%
  );
  backdrop-filter: blur(50px);
  box-shadow: 0px 0px 50px -25px rgba(0, 0, 0, 0.5);
}
```

---

## Layout Architecture

### Page Structure Template
```jsx
function PageTemplate({ children }) {
  return (
    <div className="flex h-screen p-4 overflow-hidden bg-[#151c2c] text-white">
      <NavigationSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Hero />
        <main className="flex-1 overflow-y-auto px-8 pt-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

### Grid System
```css
/* Main Grid Layouts */
.layout-sidebar {
  display: grid;
  grid-template-columns: auto 1fr;
  height: 100vh;
}

.layout-two-column {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  height: 100%;
}

.layout-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 2rem;
}
```

### Responsive Breakpoints
```css
/* Mobile First Approach */
.container {
  padding: 1rem;
}

@media (min-width: 768px) {
  .container {
    padding: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .container {
    padding: 2rem;
  }
}
```

---

## Component Patterns

### Shared Styles System
```javascript
// sharedStyles.js
export const sharedStyles = {
  // Container Styles
  containerClasses: "relative flex flex-col items-center p-8 pb-4 gap-8 rounded-md overflow-hidden noise-bg",
  
  containerStyles: {
    background: "linear-gradient(108.74deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 50%)",
    boxShadow: "0px 0px 50px -25px rgba(0, 0, 0, 0.5)",
    backdropFilter: "blur(50px)",
  },

  strokeStyles: {
    position: 'absolute',
    inset: 0,
    borderRadius: '6px',
    pointerEvents: 'none',
    border: '0.5px solid rgba(196, 213, 232, 0.22)',
  },

  // Input Styles
  inputStyles: {
    background: 'transparent',
    color: 'white',
    '::placeholder': {
      color: 'rgba(255, 255, 255, 0.5)',
    },
  },

  // Navigation Styles
  navigationSidebarStyles: {
    background: "linear-gradient(108.74deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 50%)",
    boxShadow: "0px 0px 50px -25px rgba(0, 0, 0, 0.5)",
    backdropFilter: "blur(50px)",
  },
};
```

### Card Component Template
```jsx
function GlassCard({ children, className = "", style = {} }) {
  return (
    <div 
      className={`${sharedStyles.containerClasses} ${className}`}
      style={{ ...sharedStyles.containerStyles, ...style }}
    >
      <div style={sharedStyles.strokeStyles} />
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
}
```

---

## Interactive Elements

### Button Styles
```css
/* Primary Button */
.btn-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3);
}

/* Ghost Button */
.btn-ghost {
  background: transparent;
  color: rgba(255, 255, 255, 0.8);
  padding: 0.5rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  transition: all 0.2s ease;
  cursor: pointer;
}

.btn-ghost:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

/* Icon Button */
.btn-icon {
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
  padding: 0.5rem;
  border: none;
  border-radius: 50%;
  transition: all 0.2s ease;
  cursor: pointer;
}

.btn-icon:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}
```

### Input Components
```css
.input-glass {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  color: white;
  width: 100%;
  transition: all 0.2s ease;
}

.input-glass::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.input-glass:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.input-glass:hover {
  border-color: rgba(255, 255, 255, 0.3);
}
```

### Navigation States
```css
.nav-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.9);
}

.nav-item.active {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}
```

---

## Visual Effects

### Noise Texture Overlay
```css
.noise-bg {
  position: relative;
}

.noise-bg::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0.02;
  pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.90' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
}
```

### Custom Scrollbars
```css
/* WebKit Scrollbars */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(239, 239, 243, 0.12);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background-color: transparent;
}

/* Firefox Scrollbars */
* {
  scrollbar-width: thin;
  scrollbar-color: rgba(239, 239, 243, 0.12) transparent;
}
```

### Animation Utilities
```css
/* Smooth Transitions */
.transition-smooth {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.transition-fast {
  transition: all 0.15s ease-in-out;
}

/* Hover Animations */
.hover-lift {
  transition: transform 0.2s ease;
}

.hover-lift:hover {
  transform: translateY(-2px);
}

.hover-glow {
  transition: box-shadow 0.2s ease;
}

.hover-glow:hover {
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
}
```

---

## Implementation Guide

### 1. Project Setup
```bash
# Create React App
npx create-react-app my-app
cd my-app

# Install dependencies
npm install tailwindcss lucide-react react-router-dom

# Initialize Tailwind
npx tailwindcss init
```

### 2. Essential File Structure
```
src/
├── components/
│   ├── shared/
│   │   ├── GlassCard.jsx
│   │   ├── GlassButton.jsx
│   │   └── sharedStyles.js
│   ├── layout/
│   │   ├── PageContainer.jsx
│   │   ├── NavigationSidebar.jsx
│   │   └── Hero.jsx
│   └── ui/
│       ├── Input.jsx
│       ├── Button.jsx
│       └── Card.jsx
├── styles/
│   ├── index.css
│   ├── custom.css
│   └── components.css
└── utils/
    └── constants.js
```

### 3. Component Implementation Order
1. **Setup base styles** (colors, typography, glassmorphism)
2. **Create shared style system** (`sharedStyles.js`)
3. **Build layout components** (PageContainer, Sidebar)
4. **Implement glass components** (GlassCard, GlassButton)
5. **Add interactive elements** (Navigation, Forms)
6. **Apply visual effects** (Noise, animations)

### 4. Testing Checklist
- [ ] Glassmorphism effects render correctly
- [ ] Dark theme consistency across components
- [ ] Responsive behavior on mobile devices
- [ ] Smooth animations and transitions
- [ ] Accessibility compliance (contrast ratios)
- [ ] Cross-browser compatibility

---

## Code Examples

### Complete Glass Container Component
```jsx
import React from 'react';
import { sharedStyles } from '../shared/sharedStyles';

export function GlassContainer({ 
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
    },
    prominent: {
      background: "linear-gradient(108.74deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.04) 100%)",
      backdropFilter: "blur(60px)",
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
```

### Navigation Sidebar Implementation
```jsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { sharedStyles } from '../shared/sharedStyles';

export function NavigationSidebar() {
  const [isExpanded, setIsExpanded] = useState(true);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div 
      className={`${isExpanded ? 'w-64' : 'w-16'} flex flex-col noise-bg`} 
      style={sharedStyles.navigationSidebarStyles}
    >
      <div style={sharedStyles.strokeStyles} />
      
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -right-3 top-4 bg-[#1e2738] p-1 rounded-full z-10 hover:bg-[#1a2235] transition-colors"
      >
        {isExpanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>

      <nav className="p-4 flex-1 overflow-hidden">
        <Link 
          to="/" 
          className={`flex items-center mb-6 hover:text-gray-300 transition-colors ${
            isActive('/') ? 'text-blue-400' : 'text-white'
          }`}
        >
          <Home size={24} />
          {isExpanded && <span className="ml-2 font-medium">Home</span>}
        </Link>
      </nav>
    </div>
  );
}
```

### Glass Input Component
```jsx
import React from 'react';
import { sharedStyles } from '../shared/sharedStyles';

export function GlassInput({ 
  placeholder, 
  value, 
  onChange, 
  type = "text",
  className = "",
  ...props 
}) {
  return (
    <div className={`relative ${className}`}>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-transparent border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
        style={sharedStyles.inputStyles}
        {...props}
      />
    </div>
  );
}
```

---

## Brand Guidelines

### Logo Usage
- **Primary Logo**: Use on dark backgrounds
- **Minimum Size**: 32px height for digital
- **Clear Space**: 2x logo height on all sides
- **File Formats**: SVG (preferred), PNG with transparency

### Voice & Tone
- **Professional**: Authoritative yet approachable
- **Modern**: Contemporary language, avoid jargon
- **Trustworthy**: Clear, honest communication
- **Sophisticated**: Refined without being pretentious

### Accessibility Standards
- **WCAG 2.1 AA Compliance**
- **Minimum Contrast Ratio**: 4.5:1 for normal text
- **Focus Indicators**: Visible on all interactive elements
- **Screen Reader Support**: Proper ARIA labels
- **Keyboard Navigation**: Full functionality without mouse

---

This design system creates a cohesive, professional, and modern interface that can be adapted to various applications while maintaining the sophisticated glassmorphism aesthetic and user experience patterns established in the Lawgiver application.
