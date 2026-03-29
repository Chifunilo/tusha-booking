"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface BookingHeaderProps {
  activeTab?: 'home' | 'events' | 'popular';
  onTabChange?: (tab: 'home' | 'events' | 'popular') => void;
  userProfileImage?: string;
}

export default function BookingHeader({ 
  activeTab = 'home', 
  onTabChange,
  userProfileImage 
}: BookingHeaderProps) {
  const router = useRouter();

  const handleTabClick = (tab: 'home' | 'events' | 'popular') => {
    if (onTabChange) {
      onTabChange(tab);
    }
    
    // Navigate to respective pages
    if (tab === 'home') {
      router.push('/');
    } else if (tab === 'events') {
      router.push('/?type=events');
    } else if (tab === 'popular') {
      router.push('/?tab=popular');
    }
  };

  return (
    <header className="bg-black text-white">
      <div className="max-w-7xl mx-auto px-8 py-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div 
            className="text-3xl font-bold cursor-pointer"
            onClick={() => router.push('/')}
          >
            Tusha
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-12">
            <button
              onClick={() => handleTabClick('home')}
              className={`text-lg font-medium transition-colors duration-200 ${
                activeTab === 'home' 
                  ? 'text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Home
            </button>

            <button
              onClick={() => handleTabClick('events')}
              className={`text-lg font-medium transition-colors duration-200 ${
                activeTab === 'events' 
                  ? 'text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Events
            </button>

            <button
              onClick={() => handleTabClick('popular')}
              className={`text-lg font-medium transition-colors duration-200 ${
                activeTab === 'popular' 
                  ? 'text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Popular
            </button>

            {/* User Profile Picture */}
            <div className="ml-4">
              {userProfileImage ? (
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-yellow-400 cursor-pointer">
                  <Image
                    src={userProfileImage}
                    alt="User profile"
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-yellow-400 border-2 border-yellow-400 cursor-pointer flex items-center justify-center">
                  <svg 
                    className="w-6 h-6 text-black" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                    />
                  </svg>
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}