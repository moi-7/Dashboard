import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { Banner } from './components/Banner';
import { CustomerTable } from './components/CustomerTable';
import { Toaster } from 'sonner@2.0.3';

export default function App() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check local storage or system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else if (savedTheme === 'light') {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    if (newIsDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <div className={`flex min-h-screen font-sans transition-colors duration-300 ${isDark ? 'dark bg-gray-950' : 'bg-white'}`}>
      <Toaster position="top-right" theme={isDark ? 'dark' : 'light'} />
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <TopBar isDark={isDark} toggleTheme={toggleTheme} />
        
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <Banner />
            <CustomerTable />
          </div>
          
          <div className="mt-12 mb-4 flex items-center gap-2 text-gray-400 dark:text-gray-600 text-sm pl-2">
            <span>Made with</span>
            <span className="font-bold text-indigo-900 dark:text-indigo-400 flex items-center gap-1">
              <div className="w-5 h-5 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-[10px] font-bold">V</div>
              Visily
            </span>
          </div>
        </main>
      </div>
    </div>
  );
}
