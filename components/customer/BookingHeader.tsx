"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import Image from 'next/image';
import { NavTab, navTabHref } from '@/lib/nav';

interface BookingHeaderProps {
  activeTab?: NavTab;
  onTabChange?: (tab: NavTab) => void;
  userProfileImage?: string;
}

export default function BookingHeader({ 
  activeTab = 'home', 
  onTabChange,
  userProfileImage 
}: BookingHeaderProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleTabClick = (tab: NavTab) => {
    if (onTabChange) onTabChange(tab);
    
    router.push(navTabHref(tab));
    
    setIsMenuOpen(false); // Close menu after click
  };

  const handleProfileClick = () => {
    if (!isAuthenticated) {
      router.push('/login');
    } else if (user?.user_type === 'admin') {
      router.push('/admin');
    } else if (user?.user_type === 'business') {
      router.push('/business-dashboard');
    } else {
      router.push('/profile-page');
    }
  };

  return (
    <header className="bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div 
            className="text-3xl font-bold cursor-pointer"
            onClick={() => router.push('/')}
          >
            Tusha
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-12">
            <button
              onClick={() => handleTabClick('home')}
              className={`text-lg font-medium transition-colors ${
                activeTab === 'home' ? 'text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => handleTabClick('venues')}
              className={`text-lg font-medium transition-colors ${
                activeTab === 'venues' ? 'text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Venues
            </button>
            <button
              onClick={() => handleTabClick('popular')}
              className={`text-lg font-medium transition-colors ${
                activeTab === 'popular' ? 'text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Popular
            </button>

            {/* Profile Button */}
            <button
              onClick={handleProfileClick}
              className="w-11 h-11 rounded-full border-2 border-yellow-400 hover:border-yellow-300 overflow-hidden"
            >
              {(isAuthenticated && user?.profile_image) || userProfileImage ? (
                <Image
                  src={user?.profile_image || userProfileImage!}
                  alt="Profile"
                  width={44}
                  height={44}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-yellow-400 flex items-center justify-center">
                  <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </button>
          </nav>

          {/* Mobile Hamburger + Profile */}
          <div className="flex items-center gap-4 md:hidden">
            <button
              onClick={handleProfileClick}
              className="w-10 h-10 rounded-full border-2 border-yellow-400 overflow-hidden"
            >
              {(isAuthenticated && user?.profile_image) || userProfileImage ? (
                <Image
                  src={user?.profile_image || userProfileImage!}
                  alt="Profile"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-yellow-400 flex items-center justify-center">
                  <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </button>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white p-2"
            >
              {isMenuOpen ? (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-6 bg-zinc-900 rounded-2xl py-6 px-6 flex flex-col gap-6 text-lg font-medium">
            <button onClick={() => handleTabClick('home')} className="text-left py-2">Home</button>
            <button onClick={() => handleTabClick('venues')} className="text-left py-2">Venues</button>
            <button onClick={() => handleTabClick('popular')} className="text-left py-2">Popular</button>
          </div>
        )}
      </div>
    </header>
  );}