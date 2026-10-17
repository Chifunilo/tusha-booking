"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { LocationIcon, DollarIcon } from '@/components/icons';
import { ArrowDown, ArrowRight, Menu, X } from 'lucide-react';
import { motion, type Variants } from 'motion/react';
import Image from 'next/image';

interface HeroSectionProps {
  activeTab: 'home' | 'events' | 'popular';
  onTabChange: (tab: 'home' | 'events' | 'popular') => void;
  onSearch: (location: string, price: string) => void;
}

const navLinks: { id: 'home' | 'events' | 'popular'; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'events', label: 'Events' },
  { id: 'popular', label: 'Popular' },
];

const sectionVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.14,
    },
  },
};

const navVariants: Variants = {
  hidden: { opacity: 0, y: -12, filter: 'blur(7px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { type: 'spring', duration: 0.62, bounce: 0 },
  },
};

const copyVariants: Variants = {
  hidden: { opacity: 0, y: 18, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { type: 'spring', duration: 0.78, bounce: 0 },
  },
};

const backgroundVariants: Variants = {
  hidden: { opacity: 0, scale: 1.04, filter: 'blur(12px)' },
  visible: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: { type: 'spring', duration: 1.1, bounce: 0 },
  },
};

const searchVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.98, filter: 'blur(6px)' },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: { type: 'spring', duration: 0.7, bounce: 0, delay: 0.1 },
  },
};

const HeroSection: React.FC<HeroSectionProps> = ({
  activeTab,
  onTabChange,
  onSearch,
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
    <section className="relative isolate min-h-screen overflow-hidden font-sans text-white antialiased rounded-b-[2.5rem]">
      <motion.div
        className="relative flex min-h-screen w-full flex-col overflow-hidden px-4 py-6 sm:px-9 sm:py-8 lg:px-12"
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
      >
        <motion.div variants={backgroundVariants} className="absolute inset-0">
          <Image
            src="/images/LoginPic.jpg"
            alt=""
            fill
            priority
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/30" />
        </motion.div>

        {/* Nav */}
        <motion.nav
          variants={navVariants}
          className="relative z-20 flex min-h-10 w-full items-center justify-between"
        >
          <span className="inline-flex min-h-10 items-center text-xl font-semibold tracking-tight text-white">
            tusha
          </span>

          <div className="hidden items-center gap-10 lg:flex">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => onTabChange(link.id)}
                className={`min-h-10 text-sm font-medium transition-[opacity,transform] duration-200 ease-out active:scale-[0.96] ${
                  activeTab === link.id ? 'text-white' : 'text-white/75 hover:text-white'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleProfileClick}
              title={isAuthenticated ? 'View Profile' : 'Sign in'}
              className="group inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-zinc-100 pl-2 pr-5 text-sm font-medium text-slate-800 shadow-[inset_0_2px_0_0_rgba(255,255,255,1),inset_0_-1px_0_0_rgba(0,0,0,0.2)] transition-[background-color,color,transform] duration-200 ease-out hover:bg-zinc-200 active:scale-[0.96]"
            >
              <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-slate-800/10">
                {isAuthenticated && user?.profile_image ? (
                  <Image
                    src={user.profile_image}
                    alt=""
                    width={28}
                    height={28}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <svg className="h-4 w-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
              </span>
              {isAuthenticated ? 'My account' : 'Sign in'}
            </button>

            <button
              onClick={() => setIsMenuOpen((open) => !open)}
              className="lg:hidden text-white p-2 -mr-2"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
            </button>
          </div>
        </motion.nav>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="lg:hidden absolute top-20 left-4 right-4 mt-2 z-30 flex flex-col gap-1 rounded-3xl bg-black/90 backdrop-blur-sm p-4 shadow-2xl">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => {
                  onTabChange(link.id);
                  setIsMenuOpen(false);
                }}
                className={`rounded-xl px-4 py-3 text-left text-base font-medium transition-colors ${
                  activeTab === link.id ? 'bg-white/10 text-white' : 'text-white/75 hover:text-white'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>
        )}

        {/* Copy + search */}
        <div className="relative z-10 flex flex-1 flex-col justify-center gap-10 py-10 sm:py-14">
          <div className="max-w-2xl">
            <motion.p
              variants={copyVariants}
              className="inline-flex items-center gap-2 text-xs font-medium text-white/90"
            >
              Stays and event spaces, all in one place
            </motion.p>

            <motion.h1
              variants={copyVariants}
              className="mt-5 text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.04] font-semibold tracking-tight text-balance text-white"
            >
              <span className="block">Find your next</span>
              <span className="block">stay or event</span>
            </motion.h1>

            <motion.p
              variants={copyVariants}
              className="mt-5 max-w-md text-sm leading-relaxed text-white/85 sm:text-base"
            >
              Compare hotels and event spaces, check real-time availability, and book securely — all in one place.
            </motion.p>
          </div>

          {/* Search card */}
          <motion.div variants={searchVariants} className="w-full max-w-4xl">
            <div className="flex flex-col items-stretch gap-3 rounded-2xl bg-white/95 p-3 shadow-2xl backdrop-blur-sm sm:flex-row sm:gap-4 sm:p-4">
              <div className="flex w-full items-center gap-3 rounded-xl border-2 border-yellow-400 bg-white px-5 py-3.5 sm:flex-1">
                <LocationIcon size={22} />
                <input
                  type="text"
                  placeholder="Where to?"
                  value={searchParams.location}
                  onChange={(e) => setSearchParams({ ...searchParams, location: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1 text-base font-medium text-slate-900 outline-none placeholder:text-gray-400"
                />
              </div>

              <div className="flex w-full items-center gap-3 rounded-xl border-2 border-yellow-400 bg-white px-5 py-3.5 sm:flex-1">
                <DollarIcon size={22} />
                <input
                  type="number"
                  placeholder="Max price"
                  value={searchParams.price}
                  onChange={(e) => setSearchParams({ ...searchParams, price: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1 text-base font-medium text-slate-900 outline-none placeholder:text-gray-400"
                />
              </div>

              <button
                onClick={handleSearch}
                className="inline-flex min-h-[3.25rem] w-full items-center justify-center gap-2 rounded-xl bg-black px-8 text-base font-semibold text-white transition-colors hover:bg-gray-800 sm:w-auto"
              >
                Search
                <ArrowRight className="size-4" />
              </button>
            </div>
          </motion.div>
        </div>

        <motion.div
          variants={copyVariants}
          className="absolute right-6 bottom-6 z-20 hidden items-center gap-2 text-xs font-medium text-white/80 sm:flex lg:right-12 lg:bottom-8"
        >
          Scroll to explore
          <ArrowDown className="size-3.5" />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
