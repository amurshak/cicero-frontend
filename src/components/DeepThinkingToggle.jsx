import { Brain } from 'lucide-react';

export function DeepThinkingToggle({ 
  enabled, 
  onToggle, 
  disabled = false,
  size = 'default' 
}) {
  const sizeClasses = {
    default: {
      button: 'px-3 py-2.5 h-[52px]',
      icon: 18,
      text: 'text-xs'
    },
    small: {
      button: 'px-2 py-2 h-[40px]',
      icon: 16,
      text: 'text-xs'
    }
  };

  const currentSize = sizeClasses[size] || sizeClasses.default;

  return (
    <div className="group relative flex items-center">
      <button
        onClick={onToggle}
        className={`flex items-center gap-2 rounded-lg transition-all border ${currentSize.button} ${
          enabled 
            ? 'bg-blue-600/20 border-blue-500/50 text-blue-300' 
            : 'bg-white/5 border-white/20 text-white/60 hover:bg-white/10'
        }`}
        disabled={disabled}
        aria-label={enabled ? 'Disable deep thinking' : 'Enable deep thinking'}
      >
        <Brain size={currentSize.icon} />
        <div className={`${currentSize.text} font-medium hidden sm:flex sm:flex-col sm:items-center sm:leading-tight`}>
          <span>Deep</span>
          <span>Thinking</span>
        </div>
      </button>
      
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-lg border border-white/10 z-50 whitespace-nowrap">
        {enabled 
          ? 'Advanced reasoning with reflection & validation (~60-120s)' 
          : 'Enable deep thinking for complex queries (~60-120s)'
        }
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
          <div className="w-2 h-2 bg-gray-900 rotate-45 border-b border-r border-white/10"></div>
        </div>
      </div>
    </div>
  );
}