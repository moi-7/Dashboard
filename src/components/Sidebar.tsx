import React from 'react';
import { Headphones, Home, CheckSquare, Users, BarChart2, Share2, Settings } from 'lucide-react';

export function Sidebar() {
  return (
    <div className="w-20 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col items-center py-6 h-screen sticky top-0 z-20 transition-colors duration-300">
      <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center mb-10 text-white shadow-lg shadow-indigo-200 dark:shadow-none">
        <Headphones size={20} />
      </div>

      <nav className="flex-1 flex flex-col gap-6 w-full items-center">
        <NavItem icon={<Home size={22} />} />
        <NavItem icon={<CheckSquare size={22} />} />
        <NavItem icon={<Users size={22} />} active />
        <NavItem icon={<BarChart2 size={22} />} />
        <NavItem icon={<Share2 size={22} />} />
      </nav>

      <div className="mt-auto">
        <button className="p-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors">
          <Settings size={22} />
        </button>
      </div>
    </div>
  );
}

function NavItem({ icon, active = false }: { icon: React.ReactNode; active?: boolean }) {
  return (
    <button
      className={`p-3 rounded-xl transition-all relative group ${
        active 
          ? 'text-gray-800 bg-gray-100 dark:text-white dark:bg-gray-800' 
          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-gray-800'
      }`}
    >
      {active && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-black dark:bg-white rounded-r-full -ml-3" />
      )}
      {icon}
    </button>
  );
}
