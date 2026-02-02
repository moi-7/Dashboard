import React from 'react';
import { Plus, Search, MessageSquare, Phone, Bell, Sun, Moon } from 'lucide-react';

interface TopBarProps {
  isDark?: boolean;
  toggleTheme?: () => void;
}

export function TopBar({ isDark, toggleTheme }: TopBarProps) {
  return (
    <div className="h-20 bg-white dark:bg-gray-900 px-8 flex items-center justify-between sticky top-0 z-10 transition-colors duration-300 border-b border-transparent dark:border-gray-800">
      <div>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 text-sm shadow-md shadow-indigo-200 dark:shadow-none transition-all">
          <Plus size={18} />
          CREATE NEW
        </button>
      </div>

      <div className="flex items-center gap-6">
        <button className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
          <Search size={20} />
        </button>
        
        <div className="flex items-center gap-4 border-l border-gray-200 dark:border-gray-700 pl-6">
          {toggleTheme && (
            <button 
              onClick={toggleTheme}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors p-1"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          )}

          <button className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 relative">
            <MessageSquare size={20} />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-gray-900">
              N
            </span>
          </button>
          <button className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
            <Phone size={20} />
          </button>
          <button className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
            <Bell size={20} />
          </button>
        </div>

        <div className="flex items-center gap-3 pl-2">
          <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-yellow-100 dark:border-yellow-900 ring-2 ring-white dark:ring-gray-800 shadow-sm">
            <img 
              src="https://images.unsplash.com/photo-1618661148759-0d481c0c2116?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBwb3J0cmFpdCUyMG1hbiUyMHdvbWFufGVufDF8fHx8MTc3MDA2NDk2Nnww&ixlib=rb-4.1.0&q=80&w=1080" 
              alt="User Profile" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
