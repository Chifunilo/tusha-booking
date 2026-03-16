import React from 'react';
import { useRouter } from 'next/navigation';
import { AddIcon, BedIcon, BuildingIcon, DollarIcon, LocationIcon} from '@/components/icons';
import { MapPin, DollarSign } from 'lucide-react';

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
  const [searchParams, setSearchParams] = React.useState({
    location: '',
    price: '',
  });

  const handleSearch = () => {
    onSearch(searchParams.location, searchParams.price);
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
        
        {/* Top Navigation - Home, Events, Popular */}
        <nav className="flex justify-end items-center px-12 py-8 gap-16">
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
        </nav>

        {/* Spacer to push search bar to bottom */}
        <div className="flex-1 space-y-4"></div>

        {/* Search Bar Container */}
        <div className="px-8 pb-12">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-4 shadow-2xl">
              
              {/* Location Input */}
              <div className="flex-1 flex items-center gap-3 px-6 py-4 border-2 border-yellow-400 rounded-xl bg-white">
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
              <div className="flex-1 flex items-center gap-3 px-6 py-4 border-2 border-yellow-400 rounded-xl bg-white">
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

              {/* Search Button */}
              <button
                onClick={handleSearch}
                className="bg-black hover:bg-gray-800 text-white px-12 py-5 rounded-xl font-semibold text-lg transition-colors"
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