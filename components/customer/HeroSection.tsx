"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { LocationIcon, DollarIcon } from '@/components/icons';
import Image from 'next/image';

interface HeroSectionProps {
  activeTab: 'home' | 'events' | 'popular';
  onTabChange: (tab: 'home' | 'events' | 'popular') => void;
  onSearch: (location: string, price: string) => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ 
  activeTab, 
  onTabChange, 
  onSearch 
}) => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  
  const [searchParams, setSearchParams] = React.useState({
    location: '',
    price: '',
  });
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const handleSearch = () => {
    onSearch(searchParams.location, searchParams.price);
  };

  const handleProfileClick = () => {
    if (isAuthenticated) {
      router.push('/profile-page');
    } else {
      router.push('/login');
    }
  };

  return (
    <div 
      className="relative min-h-[60vh] bg-cover bg-center flex flex-col rounded-b-10xl"
      style={{
        backgroundImage: `url('/images/LoginPic.jpg')`
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/20"></div>

      {/* Content Container */}
      <div className="relative z-10 flex flex-col h-full">
        
        {/* Top Navigation */}
        <nav className="relative px-4 md:px-12 py-8 flex items-center">
          
          {/* Hamburger Menu - only on mobile */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-white p-2 -ml-2"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <svg 
                className="w-8 h-8" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={3} 
                  d="M6 18L18 6M6 6l12 12" 
                />
              </svg>
            ) : (
              <svg 
                className="w-8 h-8" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={3} 
                  d="M4 6h16M4 12h16M4 18h16" 
                />
              </svg>
            )}
          </button>

          {/* Desktop tabs + Profile (pushed to right on all screens) */}
          <div className="flex-1 flex justify-end items-center gap-16">
            
            {/* Desktop Tabs */}
            <div className="hidden md:flex items-center gap-16">
              <button
                onClick={() => onTabChange('home')}
                className={`text-2xl font-medium transition-colors ${
                  activeTab === 'home' 
                    ? 'text-white font-semibold' 
                    : 'text-white/70 hover:text-white'
                }`}
              >
                Home
              </button>
              <button
                onClick={() => onTabChange('events')}
                className={`text-2xl font-medium transition-colors ${
                  activeTab === 'events' 
                    ? 'text-white font-semibold' 
                    : 'text-white/70 hover:text-white'
                }`}
              >
                Events
              </button>
              <button
                onClick={() => onTabChange('popular')}
                className={`text-2xl font-medium transition-colors ${
                  activeTab === 'popular' 
                    ? 'text-white font-semibold' 
                    : 'text-white/70 hover:text-white'
                }`}
              >
                Popular
              </button>
            </div>

            {/* Profile Icon - always visible */}
            <button
              onClick={handleProfileClick}
              className="w-12 h-12 rounded-full border-2 border-white/50 hover:border-yellow-400 transition-all overflow-hidden flex items-center justify-center bg-white/10 backdrop-blur-sm"
              title={isAuthenticated ? 'View Profile' : 'Login to continue'}
            >
              {isAuthenticated && user?.profile_image ? (
                <Image
                  src={user.profile_image}
                  alt="Profile"
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg 
                  className="w-6 h-6 text-white" 
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
              )}
            </button>
          </div>

          {/* Mobile Menu Dropdown */}
          {isMenuOpen && (
            <div className="md:hidden absolute top-full left-4 right-4 mt-3 bg-black/95 backdrop-blur-sm rounded-3xl py-8 px-8 flex flex-col gap-8 text-2xl font-medium z-50 shadow-2xl">
              <button
                onClick={() => {
                  onTabChange('home');
                  setIsMenuOpen(false);
                }}
                className={`text-left transition-colors ${
                  activeTab === 'home' 
                    ? 'text-white font-semibold' 
                    : 'text-white/70 hover:text-white'
                }`}
              >
                Home
              </button>
              <button
                onClick={() => {
                  onTabChange('events');
                  setIsMenuOpen(false);
                }}
                className={`text-left transition-colors ${
                  activeTab === 'events' 
                    ? 'text-white font-semibold' 
                    : 'text-white/70 hover:text-white'
                }`}
              >
                Events
              </button>
              <button
                onClick={() => {
                  onTabChange('popular');
                  setIsMenuOpen(false);
                }}
                className={`text-left transition-colors ${
                  activeTab === 'popular' 
                    ? 'text-white font-semibold' 
                    : 'text-white/70 hover:text-white'
                }`}
              >
                Popular
              </button>
            </div>
          )}
        </nav>

        {/* Spacer to push search bar to bottom */}
        <div className="flex-1 space-y-4"></div>

        {/* Search Bar Container - stacked on mobile */}
        <div className="px-4 md:px-8 pb-12">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 flex flex-col md:flex-row items-stretch gap-4 shadow-2xl">
              
              {/* Location Input */}
              <div className="w-full md:flex-1 flex items-center gap-3 px-6 py-4 border-2 border-yellow-400 rounded-xl bg-white">
                <LocationIcon size={24} />
                <input
                  type="text"
                  placeholder="Location"
                  value={searchParams.location}
                  onChange={(e) => setSearchParams({ ...searchParams, location: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1 outline-none text-lg font-medium placeholder:text-gray-400"
                />
              </div>

              {/* Price Input */}
              <div className="w-full md:flex-1 flex items-center gap-3 px-6 py-4 border-2 border-yellow-400 rounded-xl bg-white">
                <DollarIcon size={24} />
                <input
                  type="number"
                  placeholder="Price"
                  value={searchParams.price}
                  onChange={(e) => setSearchParams({ ...searchParams, price: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1 outline-none text-lg font-medium placeholder:text-gray-400"
                />
              </div>

              {/* Search Button - full width on mobile */}
              <button
                onClick={handleSearch}
                className="bg-black hover:bg-gray-800 text-white px-12 py-5 rounded-xl font-semibold text-lg transition-colors w-full md:w-auto"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;