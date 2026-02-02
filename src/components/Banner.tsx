import React from 'react';

export function Banner() {
  return (
    <div className="relative w-full h-48 bg-gray-50/50 dark:bg-gray-800/50 rounded-3xl mb-8 overflow-hidden transition-colors duration-300">
      {/* Abstract Shapes - using opacity to blend better in dark mode */}
      <div className="absolute top-10 left-10 w-24 h-24 bg-pink-100 dark:bg-pink-500/20 rounded-[2rem] transform -rotate-12" />
      <div className="absolute top-32 left-80 w-16 h-16 bg-indigo-100 dark:bg-indigo-500/20 rounded-full opacity-60" />
      <div className="absolute top-20 left-1/2 w-48 h-32 bg-cyan-50 dark:bg-cyan-500/10 rounded-[3rem] transform -rotate-6" />
      <div className="absolute -top-10 right-1/3 w-32 h-32 bg-orange-100 dark:bg-orange-500/20 rounded-full opacity-50" />
      <div className="absolute top-10 right-10 w-64 h-48 bg-purple-100/50 dark:bg-purple-500/10 transform rotate-3" style={{clipPath: 'polygon(0% 0%, 100% 20%, 100% 100%, 0% 80%)'}} />

      {/* Floating Avatars */}
      <div className="absolute top-12 left-60">
        <div className="w-14 h-14 rounded-full border-4 border-white dark:border-gray-800 shadow-lg overflow-hidden transform translate-y-4 transition-colors duration-300">
           <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?fit=crop&w=150&h=150" alt="User" className="w-full h-full object-cover" />
        </div>
      </div>
      
      <div className="absolute top-8 left-1/2 -translate-x-1/2">
        <div className="w-16 h-16 rounded-full border-4 border-white dark:border-gray-800 shadow-lg overflow-hidden -mt-2 transition-colors duration-300">
           <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?fit=crop&w=150&h=150" alt="User" className="w-full h-full object-cover" />
        </div>
      </div>

      <div className="absolute top-16 right-48">
        <div className="w-12 h-12 rounded-full border-4 border-white dark:border-gray-800 shadow-lg overflow-hidden transition-colors duration-300">
           <img src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?fit=crop&w=150&h=150" alt="User" className="w-full h-full object-cover" />
        </div>
      </div>
    </div>
  );
}
