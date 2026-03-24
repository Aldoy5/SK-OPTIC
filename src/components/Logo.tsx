import React from 'react';

export function Logo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 100 100" className="h-full w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Outer purple shape */}
        <path d="M50 15C30 15 15 30 15 50C15 70 30 85 50 85C70 85 85 70 85 50C85 30 70 15 50 15ZM50 75C36.2 75 25 63.8 25 50C25 36.2 36.2 25 50 25C63.8 25 75 36.2 75 50C75 63.8 63.8 75 50 75Z" fill="#6d28d9" />
        <path d="M50 5C25.1 5 5 25.1 5 50C5 74.9 25.1 95 50 95C74.9 95 95 74.9 95 50C95 25.1 74.9 5 50 5ZM50 85C30.7 85 15 69.3 15 50C15 30.7 30.7 15 50 15C69.3 15 85 30.7 85 50C85 69.3 69.3 85 50 85Z" fill="#5b21b6" opacity="0.5" />
        
        {/* The Eye */}
        <circle cx="50" cy="50" r="20" fill="white" />
        <circle cx="50" cy="50" r="15" fill="#7c3aed" fillOpacity="0.2" />
        <circle cx="50" cy="50" r="12" fill="#6d28d9" />
        <circle cx="50" cy="50" r="6" fill="black" />
        
        {/* Reflection */}
        <circle cx="46" cy="46" r="3" fill="white" fillOpacity="0.8" />
      </svg>
      <div className="flex font-extrabold tracking-tighter text-2xl">
        <span className="text-purple-700">SK</span>
        <span className="text-gray-900 ml-1">OPTIC</span>
      </div>
    </div>
  );
}
