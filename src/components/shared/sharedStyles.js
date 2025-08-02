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

  // Button Styles
  buttonBase: "font-semibold transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary-900",
  
  buttonVariants: {
    primary: "bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 focus:ring-blue-500",
    secondary: "bg-primary-800 hover:bg-primary-700 text-white px-6 py-3 focus:ring-primary-700",
    ghost: "bg-transparent hover:bg-white/10 text-white/80 hover:text-white px-4 py-2 border border-white/20 focus:ring-white/50",
    danger: "bg-red-600 hover:bg-red-700 text-white px-6 py-3 focus:ring-red-500"
  }
};