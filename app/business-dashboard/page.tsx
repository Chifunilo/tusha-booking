"use client";

import { AddIcon, BedIcon, BuildingIcon } from '@/components/icons';
import React, { useState, useEffect, useRef } from 'react';
import VerificationBanner from '@/components/business/VerificationBanner';
import { PropertyCard } from '@/components/business';
import EnquiriesInbox from '@/components/business/EnquiriesInbox';
import { BlockDetailModal, BlockRoomsModal, BlockableRoom } from '@/components/business/RoomBlockModals';
import { blockReasonLabel, localToday, RoomBlock } from '@/lib/roomBlocks';

import {
  LayoutDashboard,
  Calendar,
  Bed,
  Tent,
  CalendarDays,
  Users,
  BarChart3,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  ChevronDown,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api';
import { motion, type Variants } from 'motion/react';

const fadeInVariants: Variants = {
  hidden: { opacity: 0, y: 14, filter: 'blur(6px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { type: 'spring', duration: 0.6, bounce: 0 },
  },
};

const staggerContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

type MenuItem = 'dashboard' | 'bookings' | 'manage-rooms' | 'events-center' | 'calendar' | 'customers' | 'reports' | 'settings';

interface MenuItemConfig {
  id: MenuItem;
  label: string;
  icon: React.ReactNode;
}

interface MenuGroup {
  label: string;
  items: MenuItemConfig[];
}

interface User {
  user_id: number;
  first_name: string | null;
  last_name: string | null;
  email: string;
  user_type: string;
  businessName?: string;
}

const menuGroups: MenuGroup[] = [
  {
    label: 'Overview',
    items: [{ id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> }],
  },
  {
    label: 'Operations',
    items: [
      { id: 'bookings', label: 'Bookings', icon: <Calendar size={20} /> },
      { id: 'manage-rooms', label: 'Manage Rooms', icon: <Bed size={20} /> },
      { id: 'events-center', label: 'Venue enquiries', icon: <Tent size={20} /> },
      { id: 'calendar', label: 'Calendar', icon: <CalendarDays size={20} /> },
    ],
  },
  {
    label: 'Insights',
    items: [
      { id: 'customers', label: 'Customers', icon: <Users size={20} /> },
      { id: 'reports', label: 'Reports', icon: <BarChart3 size={20} /> },
    ],
  },
  {
    label: 'Admin',
    items: [{ id: 'settings', label: 'Settings', icon: <Settings size={20} /> }],
  },
];

const allMenuItems = menuGroups.flatMap((group) => group.items);

export default function BusinessDashboard() {
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState<MenuItem>('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [navQuery, setNavQuery] = useState('');
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get user data from localStorage
    const storedUser = localStorage.getItem('user');

    if (!storedUser) {
      router.push('/login');
      return;
    }

    const userData = JSON.parse(storedUser);

    if (userData.user_type !== 'business') {
      router.push('/dashboard');
      return;
    }

    setUser(userData);
  }, [router]);

  // Cmd/Ctrl+K focuses the sidebar nav search
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close the account dropdown on outside click
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  const currentPage = allMenuItems.find((item) => item.id === activeMenu) ?? allMenuItems[0];
  const query = navQuery.trim().toLowerCase();
  const visibleGroups = query
    ? menuGroups
        .map((group) => ({
          ...group,
          items: group.items.filter((item) => item.label.toLowerCase().includes(query)),
        }))
        .filter((group) => group.items.length > 0)
    : menuGroups;

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-yellow-50 to-yellow-100 flex items-center justify-center">
        <p className="text-2xl font-semibold">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="flex gap-8 max-w-[1600px] mx-auto">

        {/* Sidebar */}
        <motion.aside
          initial={{ opacity: 0, x: -16, filter: 'blur(6px)' }}
          animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
          transition={{ type: 'spring', duration: 0.65, bounce: 0 }}
          className={`${isSidebarCollapsed ? 'w-24' : 'w-80'} shrink-0 bg-white rounded-3xl shadow-xl shadow-black/10 ring-1 ring-black/5 p-4 flex flex-col h-fit sticky top-20 transition-[width] duration-300 ease-out`}
        >
          {/* Brand + collapse toggle */}
          <div className={`flex items-center py-3 px-2 ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
            {!isSidebarCollapsed && (
              <span className="font-semibold text-2xl tracking-tight text-black">tusha</span>
            )}
            <button
              onClick={() => setIsSidebarCollapsed((v) => !v)}
              aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              {isSidebarCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
            </button>
          </div>

          {/* Nav search */}
          {!isSidebarCollapsed && (
            <div className="px-2 pb-2 pt-1">
              <div className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2">
                <Search size={15} className="text-gray-400 shrink-0" />
                <input
                  ref={searchInputRef}
                  value={navQuery}
                  onChange={(e) => setNavQuery(e.target.value)}
                  placeholder="Find a section"
                  aria-label="Find a dashboard section"
                  className="w-full bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
                />
                {navQuery === '' && (
                  <kbd className="hidden sm:flex items-center justify-center rounded-md bg-white px-1.5 py-0.5 text-[10px] font-medium text-gray-400 shadow-sm">
                    ⌘K
                  </kbd>
                )}
              </div>
            </div>
          )}

          <nav className="flex-1 space-y-4 overflow-y-auto px-0 py-2">
            {visibleGroups.map((group) => (
              <div key={group.label} className="space-y-1">
                {!isSidebarCollapsed && (
                  <p className="px-6 pb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
                    {group.label}
                  </p>
                )}
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveMenu(item.id)}
                    title={isSidebarCollapsed ? item.label : undefined}
                    className={`
                      w-full flex items-center gap-4 rounded-xl
                      transition-[background-color,color,transform] duration-200 ease-out active:scale-[0.98]
                      ${isSidebarCollapsed ? 'justify-center px-0 py-3.5' : 'px-6 py-3.5'}
                      ${activeMenu === item.id
                        ? 'bg-black text-white font-medium shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)]'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                  >
                    {item.icon}
                    {!isSidebarCollapsed && <span className="text-base tracking-tight">{item.label}</span>}
                  </button>
                ))}
              </div>
            ))}
          </nav>

          {/* Account */}
          <div ref={accountMenuRef} className="relative mt-2 border-t border-gray-100 pt-3">
            {isAccountMenuOpen && (
              <div className={`absolute bottom-full mb-2 ${isSidebarCollapsed ? 'left-0' : 'left-0 right-0'} rounded-xl bg-white shadow-xl ring-1 ring-black/5 p-1.5 ${isSidebarCollapsed ? 'w-48' : ''}`}>
                <button
                  onClick={() => { setActiveMenu('settings'); setIsAccountMenuOpen(false); }}
                  className="w-full flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Settings size={16} />
                  Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut size={16} />
                  Log Out
                </button>
              </div>
            )}

            <button
              onClick={() => setIsAccountMenuOpen((v) => !v)}
              className={`w-full flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-gray-50 ${isSidebarCollapsed ? 'justify-center' : ''}`}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black text-sm font-semibold text-white">
                {user.businessName ? user.businessName.charAt(0).toUpperCase() : 'B'}
              </span>
              {!isSidebarCollapsed && (
                <>
                  <span className="flex-1 truncate text-left text-sm font-medium text-gray-800">
                    {user.businessName || 'Business Owner'}
                  </span>
                  <ChevronDown size={16} className="text-gray-400" />
                </>
              )}
            </button>
          </div>
        </motion.aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {/* Topbar */}
          <motion.div
            initial={{ opacity: 0, y: -10, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ type: 'spring', duration: 0.65, bounce: 0, delay: 0.08 }}
            className="flex justify-between items-center mb-8"
          >
            <div>
              <div className="flex items-center gap-2.5 text-gray-400">
                {currentPage.icon}
                <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
                  </span>
                  Live
                </span>
              </div>
              <h1 className="mt-1 text-4xl font-semibold tracking-tight text-gray-900">
                {currentPage.label}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Welcome back, {user.businessName || 'Business Owner'}
              </p>
            </div>
          </motion.div>

          {/* Dynamic Content */}
          <motion.div
            key={activeMenu}
            initial="hidden"
            animate="visible"
            variants={fadeInVariants}
          >
            {activeMenu === 'dashboard' && <DashboardContent userId={user.user_id} />}
            {activeMenu === 'bookings' && <BookingsContent userId={user.user_id} />}
            {activeMenu === 'manage-rooms' && <ManageRoomsContent userId={user.user_id} />}
            {activeMenu === 'events-center' && <EnquiriesInbox />}
            {activeMenu === 'calendar' && <CalendarContent />}
            {activeMenu === 'customers' && <CustomersContent />}
            {activeMenu === 'reports' && <ReportsContent />}
            {activeMenu === 'settings' && <SettingsContent />}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

// Dashboard Content with dynamic property count
const DashboardContent: React.FC<{ userId: number }> = ({ userId }) => {
  const [propertyCount, setPropertyCount] = useState(0);
    const [roomCount, setRoomCount] = useState(0);

  useEffect(() => {
    fetchPropertyCount();
    fetchRoomCount();
  }, []);

  const fetchPropertyCount = async () => {
    try {
      const response = await fetch(`${API_URL}/api/properties/count/${userId}`, { credentials: 'include' });
      const data = await response.json();
      if (response.ok) {
        setPropertyCount(data.count);
      }
    } catch (error) {
      console.error('Error fetching property count:', error);
    }
  };

    const fetchRoomCount = async () => {
    try {
      const response = await fetch(`${API_URL}/api/rooms/count/${userId}`, { credentials: 'include' });
      const data = await response.json();
      if (response.ok) {
        setRoomCount(data.count);
      }
    } catch (error) {
      console.error('Error fetching room count:', error);
    }
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainerVariants} className="space-y-6">
      <VerificationBanner />

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-6">
        <StatCard title="Buildings" value={propertyCount.toString()} icon={<BuildingIcon size={40} />} />
        <StatCard title="Rooms" value={roomCount.toString()} icon={<BedIcon size={40} />} />
        <StatCard title="Events" value="2" icon="⛺" />
      </div>

      {/* Revenue Section */}
      <motion.div variants={fadeInVariants} className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-xl shadow-black/5 ring-1 ring-black/5 p-8">
          <h2 className="text-xl font-semibold tracking-tight mb-6">Revenue This Month</h2>
          <p className="text-4xl font-semibold tracking-tight">K7000</p>
          <div className="mt-6 p-6 border-2 border-yellow-400 rounded-2xl bg-yellow-50">
            <p className="text-sm text-gray-600 mb-2">Revenue Today</p>
            <p className="text-3xl font-semibold tracking-tight">K500</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-black/5 ring-1 ring-black/5 p-8">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="text-base text-gray-500 mb-4">Check Ins</h3>
              <p className="text-5xl font-semibold tracking-tight">9</p>
            </div>
            <div className="border-l-2 border-gray-200 pl-8">
              <h3 className="text-base text-gray-500 mb-4">Bookings</h3>
              <p className="text-5xl font-semibold tracking-tight">12</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Events Table */}
      <motion.div variants={fadeInVariants} className="bg-white rounded-3xl shadow-xl shadow-black/5 ring-1 ring-black/5 p-8">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-4 px-4 text-sm font-semibold text-gray-500">Event type</th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-gray-500">Number of Guests</th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-gray-500">Date</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100">
              <td className="py-4 px-4 font-medium">Wedding</td>
              <td className="py-4 px-4">255</td>
              <td className="py-4 px-4">19 Mar 26</td>
            </tr>
            <tr>
              <td className="py-4 px-4 font-medium">Birthday party</td>
              <td className="py-4 px-4">50</td>
              <td className="py-4 px-4">19 Mar 26</td>
            </tr>
          </tbody>
        </table>
      </motion.div>
    </motion.div>
  );
};

// Manage Rooms with Properties and Rooms sections
const ManageRoomsContent: React.FC<{ userId: number }> = ({ userId }) => {
  const router = useRouter();
  const [properties, setProperties] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedPropertyFilter, setSelectedPropertyFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProperties();
    fetchRooms();
  }, [userId]);

  const fetchProperties = async () => {
    try {
      const response = await fetch(`${API_URL}/api/properties/user/${userId}`, { credentials: 'include' });
      const data = await response.json();
      if (response.ok) {
        setProperties(data.properties || []);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await fetch(`${API_URL}/api/rooms/user/${userId}`, { credentials: 'include' });
      const data = await response.json();
      if (response.ok) {
        setRooms(data.rooms || []);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePropertyClick = (propertyId: number) => {
    router.push(`/add-property/${propertyId}`);
  };

  // Filter rooms based on selected property
  const filteredRooms = selectedPropertyFilter === 'all' 
    ? rooms 
    : rooms.filter(room => room.property_id.toString() === selectedPropertyFilter);

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainerVariants} className="space-y-8">
      {/* Header with Add Buttons */}
      <motion.div variants={fadeInVariants} className="flex justify-between items-center">
        <h2 className="text-3xl font-semibold tracking-tight">Add and Edit Listings</h2>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/add-property')}
            className="inline-flex items-center gap-2 rounded-full bg-yellow-400 px-6 py-3 text-sm font-semibold text-black shadow-[inset_0_2px_0_0_rgba(255,255,255,0.7),inset_0_-1px_0_0_rgba(0,0,0,0.15)] transition-[background-color,transform] duration-200 ease-out hover:bg-yellow-500 active:scale-[0.97]"
          >
            Add Property
            <AddIcon size={20} />
          </button>

          <button
            onClick={() => router.push('/add-room')}
            className="inline-flex items-center gap-2 rounded-full bg-yellow-400 px-6 py-3 text-sm font-semibold text-black shadow-[inset_0_2px_0_0_rgba(255,255,255,0.7),inset_0_-1px_0_0_rgba(0,0,0,0.15)] transition-[background-color,transform] duration-200 ease-out hover:bg-yellow-500 active:scale-[0.97]"
          >
            Add Room
            <AddIcon size={20} />
          </button>
        </div>
      </motion.div>

      {/* Properties Section */}
      <motion.div variants={fadeInVariants}>
        <h3 className="text-xl font-semibold tracking-tight mb-6">Properties</h3>
        {properties.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-lg ring-1 ring-black/5 p-8 text-center text-gray-500">
            No properties added yet. Click &quot;Add Property&quot; to get started!
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            {properties.map((property) => (
              <PropertyCard
                key={property.property_id}
                property={property}
                onClick={() => handlePropertyClick(property.property_id)}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* Rooms Section */}
      <motion.div variants={fadeInVariants}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold tracking-tight">Rooms</h3>

          {/* Property Filter Dropdown */}
          {properties.length > 0 && (
            <select
              value={selectedPropertyFilter}
              onChange={(e) => setSelectedPropertyFilter(e.target.value)}
              className="px-4 py-2 border-2 border-gray-200 rounded-full text-sm focus:border-yellow-400 focus:outline-none"
            >
              <option value="all">All Properties</option>
              {properties.map((property) => (
                <option key={property.property_id} value={property.property_id}>
                  {property.property_name}
                </option>
              ))}
            </select>
          )}
        </div>

        {rooms.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-lg ring-1 ring-black/5 p-8 text-center text-gray-500">
            No rooms added yet. Click &quot;Add Room&quot; to get started!
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-lg ring-1 ring-black/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-black text-white">
                  <tr>
                    <th className="sticky left-0 z-10 bg-black text-left py-4 px-6 text-sm font-semibold tracking-tight">Room Type</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold tracking-tight whitespace-nowrap">Room ID</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold tracking-tight whitespace-nowrap">Property</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold tracking-tight whitespace-nowrap">Amenities</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold tracking-tight whitespace-nowrap">Price</th>
                    <th className="text-center py-4 px-6 text-sm font-semibold tracking-tight whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRooms.map((room) => (
                    <tr key={room.room_id} className="group border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                      <td className="sticky left-0 z-10 bg-white group-hover:bg-gray-50 py-4 px-6 font-medium">{room.room_type}</td>
                      <td className="py-4 px-6 whitespace-nowrap text-gray-600">RID{room.room_id.toString().padStart(3, '0')}</td>
                      <td className="py-4 px-6 whitespace-nowrap">{room.property_name}</td>
                      <td className="py-4 px-6 whitespace-nowrap">{room.amenities?.length || 0}</td>
                      <td className="py-4 px-6 font-semibold whitespace-nowrap">K{room.base_price}</td>
                      <td className="py-4 px-6 text-center whitespace-nowrap">
                        <button
                          onClick={() => router.push(`/edit-room/${room.room_id}`)}
                          className="inline-flex items-center rounded-full bg-yellow-400 px-6 py-2 text-sm font-semibold text-black shadow-[inset_0_2px_0_0_rgba(255,255,255,0.7),inset_0_-1px_0_0_rgba(0,0,0,0.15)] transition-[background-color,transform] duration-200 ease-out hover:bg-yellow-500 active:scale-[0.97]"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

// Components
interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode; 
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon }) => {
  return (
    <motion.div
      variants={fadeInVariants}
      className="bg-white rounded-2xl shadow-xl shadow-black/5 ring-1 ring-black/5 p-8 transition-shadow hover:shadow-2xl"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-medium text-gray-500">{title}</h3>
        <div>{icon}</div>
      </div>
      <p className="text-5xl font-semibold tracking-tight">{value}</p>
    </motion.div>
  );
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface Booking {
  booking_id: number;
  booking_reference: string;
  room_id: number;
  room_number: string;
  check_in_date: string;
  check_out_date: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  num_guests: number;
  total_price: number;
  payment_method: string;
  status: string;
  payment_status: string;
  special_requests?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

function getDateRange(start: string, end: string): string[] {
  const days: string[] = [];
  let cur = start;
  while (cur < end) {
    days.push(cur);
    cur = addDays(cur, 1);
  }
  return days;
}

function toDateInput(dateStr: string): string {
  return dateStr.split('T')[0];
}

function formatDateLong(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Local date: toISOString() of local midnight is still yesterday in UTC+ timezones like Zambia.
function getTodayStr(): string {
  return localToday();
}

// ─── Booking Detail Modal ─────────────────────────────────────────────────────

const BookingModal: React.FC<{ booking: Booking; onClose: () => void }> = ({ booking, onClose }) => {
  const nights = getDateRange(
    toDateInput(booking.check_in_date),
    toDateInput(booking.check_out_date)
  ).length;

  const statusColors =
    booking.status === 'confirmed'
      ? 'bg-green-100 text-green-800'
      : booking.status === 'pending'
      ? 'bg-yellow-100 text-yellow-800'
      : 'bg-red-100 text-red-800';

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 w-80 max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Booking details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-2xl leading-none px-1"
          >
            ×
          </button>
        </div>

        {/* Details */}
        <div className="space-y-3 text-sm">
          {[
            { label: 'Reference', value: <span className="font-mono text-xs">{booking.booking_reference}</span> },
            { label: 'Room', value: booking.room_number },
            { label: 'Guest', value: booking.guest_name },
            { label: 'Email', value: <span className="text-xs">{booking.guest_email}</span> },
            { label: 'Phone', value: booking.guest_phone },
            { label: 'Check-in', value: formatDateLong(toDateInput(booking.check_in_date)) },
            { label: 'Check-out', value: formatDateLong(toDateInput(booking.check_out_date)) },
            { label: 'Duration', value: `${nights} night${nights > 1 ? 's' : ''}` },
            { label: 'Guests', value: booking.num_guests },
            { label: 'Total', value: `K${Number(booking.total_price).toFixed(2)}` },
            { label: 'Payment', value: booking.payment_method },
          ].map(({ label, value }) => (
            <div key={label} className="flex gap-2">
              <span className="text-gray-500 w-20 shrink-0">{label}</span>
              <span className="font-medium text-gray-800">{value}</span>
            </div>
          ))}

          <div className="flex gap-2 items-center">
            <span className="text-gray-500 w-20 shrink-0">Status</span>
            <span className={`px-3 py-0.5 rounded-full text-xs font-medium ${statusColors}`}>
              {booking.status}
            </span>
          </div>

          {booking.special_requests && (
            <div className="flex gap-2">
              <span className="text-gray-500 w-20 shrink-0">Notes</span>
              <span className="text-gray-700 text-xs">{booking.special_requests}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Booking Bar ──────────────────────────────────────────────────────────────

type BarPos = 'single' | 'start' | 'mid' | 'end';

const BookingBar: React.FC<{
  booking: Booking;
  position: BarPos;
  onClick: () => void;
}> = ({ booking, position, onClick }) => {
  const radiusClass = {
    single: 'rounded-full',
    start:  'rounded-l-full rounded-r',
    mid:    'rounded-none',
    end:    'rounded-r-full rounded-l',
  }[position];

  const paddingClass = {
    single: 'px-3',
    start:  'pl-3 pr-1',
    mid:    'px-1',
    end:    'pl-1 pr-3',
  }[position];

  const showLabel = position === 'single' || position === 'start';
  const firstName = booking.guest_name.split(' ')[0];

  return (
    <div
      onClick={onClick}
      title={booking.guest_name}
      className={`
        absolute top-1.5 bottom-1.5 left-0 right-0
        bg-yellow-400 hover:bg-yellow-500
        cursor-pointer transition-colors
        flex items-center overflow-hidden
        ${radiusClass} ${paddingClass}
        ${position === 'start' || position === 'single' ? 'left-1' : 'left-0'}
        ${position === 'end'   || position === 'single' ? 'right-1' : 'right-0'}
      `}
    >
      {showLabel && (
        <span className="text-xs font-medium text-yellow-900 truncate">{firstName}</span>
      )}
    </div>
  );
};

// ─── Block Bar ────────────────────────────────────────────────────────────────

const blockStripes = 'bg-[repeating-linear-gradient(135deg,#e5e7eb_0,#e5e7eb_6px,#d1d5db_6px,#d1d5db_12px)]';

const BlockBar: React.FC<{
  block: RoomBlock;
  position: BarPos;
  onClick: () => void;
}> = ({ block, position, onClick }) => {
  const radiusClass = {
    single: 'rounded-full',
    start:  'rounded-l-full rounded-r',
    mid:    'rounded-none',
    end:    'rounded-r-full rounded-l',
  }[position];

  const showLabel = position === 'single' || position === 'start';

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      title={`${blockReasonLabel(block.reason)}${block.note ? `: ${block.note}` : ''}`}
      className={`
        absolute top-1.5 bottom-1.5 ${blockStripes} hover:brightness-95
        cursor-pointer flex items-center overflow-hidden px-2
        ${radiusClass}
        ${position === 'start' || position === 'single' ? 'left-1' : 'left-0'}
        ${position === 'end'   || position === 'single' ? 'right-1' : 'right-0'}
      `}
    >
      {showLabel && (
        <span className="text-xs font-medium text-gray-700 truncate">
          {block.reason === 'maintenance' ? 'Repairs' : 'Blocked'}
        </span>
      )}
    </div>
  );
};

// ─── Bookings Calendar ────────────────────────────────────────────────────────

const BookingsContent: React.FC<{ userId: number }> = ({ userId }) => {
  const today = getTodayStr();
  const [fromDate, setFromDate] = useState(today);
  const [toDate,   setToDate]   = useState(addDays(today, 14));
  const [appliedFrom, setAppliedFrom] = useState(today);
  const [appliedTo,   setAppliedTo]   = useState(addDays(today, 14));
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms,    setRooms]    = useState<BlockableRoom[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [blocks,   setBlocks]   = useState<RoomBlock[]>([]);
  const [blocking, setBlocking] = useState<{ roomId?: number; date?: string } | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<RoomBlock | null>(null);

  useEffect(() => {
    fetchData();
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/room-blocks?from=${appliedFrom}`, { credentials: 'include' });
        const data = await res.json();
        if (res.ok && !cancelled) setBlocks(data.blocks || []);
      } catch (err) {
        console.error('Error fetching blocked dates:', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [appliedFrom]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [roomsRes, bookingsRes] = await Promise.all([
        fetch(`${API_URL}/api/rooms/user/${userId}`, { credentials: 'include' }),
        fetch(`${API_URL}/api/bookings/user/${userId}`, { credentials: 'include' }),
      ]);
      const roomsData    = await roomsRes.json();
      const bookingsData = await bookingsRes.json();
      if (roomsRes.ok)    setRooms(roomsData.rooms    || []);
      if (bookingsRes.ok) setBookings(bookingsData.bookings || []);
    } catch (err) {
      console.error('Error fetching bookings data:', err);
    } finally {
      setLoading(false);
    }
  };

  const days = getDateRange(appliedFrom, appliedTo);

  const handleApply = () => {
    if (fromDate && toDate && fromDate < toDate) {
      setAppliedFrom(fromDate);
      setAppliedTo(toDate);
    }
  };

  const handleReset = () => {
    setFromDate(today);
    setToDate(addDays(today, 14));
    setAppliedFrom(today);
    setAppliedTo(addDays(today, 14));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 text-lg">Loading bookings...</p>
      </div>
    );
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainerVariants} className="space-y-4">
      {/* Header */}
      <motion.div variants={fadeInVariants} className="flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <h2 className="text-3xl font-semibold tracking-tight text-gray-900">Manage Bookings</h2>
          {rooms.length > 0 && (
            <button
              onClick={() => setBlocking({})}
              className="inline-flex items-center rounded-full bg-black px-4 py-1.5 text-sm font-semibold text-white transition-[background-color,transform] duration-200 ease-out hover:bg-gray-800 active:scale-[0.97]"
            >
              Block rooms
            </button>
          )}
        </div>

        {/* Date filter */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm text-gray-500">From</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:border-yellow-400 focus:outline-none"
          />
          <span className="text-sm text-gray-500">To</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:border-yellow-400 focus:outline-none"
          />
          <button
            onClick={handleApply}
            className="inline-flex items-center rounded-full bg-yellow-400 px-4 py-1.5 text-sm font-semibold text-black shadow-[inset_0_2px_0_0_rgba(255,255,255,0.7),inset_0_-1px_0_0_rgba(0,0,0,0.15)] transition-[background-color,transform] duration-200 ease-out hover:bg-yellow-500 active:scale-[0.97]"
          >
            Apply
          </button>
          <button
            onClick={handleReset}
            className="border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium px-4 py-1.5 rounded-full text-sm transition-colors"
          >
            Reset
          </button>
        </div>
      </motion.div>

      {rooms.length > 0 && (
        <motion.div variants={fadeInVariants} className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1.5"><span className="h-3 w-6 rounded-full bg-yellow-400" />Booking</span>
          <span className="inline-flex items-center gap-1.5"><span className={`h-3 w-6 rounded-full ${blockStripes}`} />Blocked</span>
          <span>Click an empty night to block it.</span>
        </motion.div>
      )}

      {/* Calendar */}
      <motion.div variants={fadeInVariants} className="bg-white rounded-3xl shadow-xl shadow-black/5 ring-1 ring-black/5 overflow-hidden">
        {rooms.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-lg">
            No rooms found. Add rooms to see the booking calendar.
          </div>
        ) : (
          /* Scrollable wrapper — both axes */
          <div className="overflow-auto max-h-[60vh]">
            <table className="border-collapse" style={{ minWidth: `${90 + days.length * 52}px` }}>
              {/* Head */}
              <thead>
                <tr>
                  {/* Sticky room column header */}
                  <th className="sticky left-0 z-20 bg-gray-50 border-b border-r border-gray-200 text-left px-4 py-3 text-sm font-semibold text-gray-600 w-24">
                    Room
                  </th>

                  {/* Date columns */}
                  {days.map((d) => {
                    const date = new Date(d + 'T00:00:00');
                    const dow = ['SUN','MON','TUE','WED','THU','FRI','SAT'][date.getDay()];
                    const isToday = d === today;
                    return (
                      <th
                        key={d}
                        className={`
                          sticky top-0 z-10 border-b border-r border-gray-200
                          py-2 text-center w-[52px] min-w-[52px]
                          ${isToday ? 'bg-yellow-50' : 'bg-gray-50'}
                        `}
                      >
                        <div className={`text-[10px] font-medium ${isToday ? 'text-yellow-600' : 'text-gray-400'}`}>
                          {dow}
                        </div>
                        <div className={`text-sm font-semibold ${isToday ? 'text-yellow-600' : 'text-gray-700'}`}>
                          {date.getDate()}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              {/* Body */}
              <tbody>
                {rooms.map((room) => {
                  const roomBookings = bookings.filter(
                    (b) => b.room_id === room.room_id
                  );
                  const roomBlocks = blocks.filter((b) => b.room_id === room.room_id);

                  return (
                    <tr key={room.room_id} className="group">
                      {/* Sticky room name */}
                      <td className="sticky left-0 z-10 bg-white group-hover:bg-gray-50 border-b border-r border-gray-200 px-4 py-0 h-12 font-semibold text-sm text-gray-700 whitespace-nowrap">
                        {room.room_number}
                      </td>

                      {/* Day cells */}
                      {days.map((d) => {
                        const isToday = d === today;
                        const cellBookings = roomBookings.filter((b) => {
                          const bStart = toDateInput(b.check_in_date);
                          const bEnd   = toDateInput(b.check_out_date);
                          return d >= bStart && d < bEnd;
                        });
                        const cellBlocks = roomBlocks.filter((b) => d >= b.start_date && d <= b.end_date);
                        const canBlock = cellBookings.length === 0 && cellBlocks.length === 0 && d >= today;

                        return (
                          <td
                            key={d}
                            onClick={canBlock ? () => setBlocking({ roomId: room.room_id, date: d }) : undefined}
                            title={canBlock ? `Block ${room.room_number} from this night` : undefined}
                            className={`
                              relative border-b border-r border-gray-100 h-12 w-[52px] min-w-[52px] p-0
                              ${isToday ? 'bg-yellow-50/40' : 'bg-white group-hover:bg-gray-50/50'}
                              ${canBlock ? 'cursor-pointer hover:!bg-gray-100' : ''}
                            `}
                          >
                            {cellBlocks.map((b) => {
                              const isFirst = d === b.start_date;
                              const isLast  = d === b.end_date;
                              let pos: BarPos = 'mid';
                              if (isFirst && isLast) pos = 'single';
                              else if (isFirst)      pos = 'start';
                              else if (isLast)       pos = 'end';
                              return (
                                <BlockBar
                                  key={b.block_id}
                                  block={b}
                                  position={pos}
                                  onClick={() => setSelectedBlock(b)}
                                />
                              );
                            })}
                            {cellBookings.map((b) => {
                              const bStart = toDateInput(b.check_in_date);
                              const bEnd   = toDateInput(b.check_out_date);
                              const isFirst = d === bStart;
                              const isLast  = addDays(d, 1) === bEnd;
                              let pos: BarPos = 'mid';
                              if (isFirst && isLast) pos = 'single';
                              else if (isFirst)      pos = 'start';
                              else if (isLast)       pos = 'end';
                              return (
                                <BookingBar
                                  key={b.booking_id}
                                  booking={b}
                                  position={pos}
                                  onClick={() => setSelected(b)}
                                />
                              );
                            })}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Booking detail modal */}
      {selected && (
        <BookingModal booking={selected} onClose={() => setSelected(null)} />
      )}

      {blocking && (
        <BlockRoomsModal
          rooms={rooms}
          initialRoomId={blocking.roomId}
          initialDate={blocking.date}
          onClose={() => setBlocking(null)}
          onCreated={(created) => {
            setBlocks((current) => [...current, ...created]);
            setBlocking(null);
          }}
        />
      )}

      {selectedBlock && (
        <BlockDetailModal
          block={selectedBlock}
          onClose={() => setSelectedBlock(null)}
          onRemoved={(blockId) => {
            setBlocks((current) => current.filter((b) => b.block_id !== blockId));
            setSelectedBlock(null);
          }}
        />
      )}
    </motion.div>
  );
};
const placeholderClass = "bg-white rounded-3xl shadow-lg ring-1 ring-black/5 p-8 text-xl font-medium tracking-tight text-gray-700";

const CalendarContent = () => <div className={placeholderClass}>Calendar Content</div>;
const CustomersContent = () => <div className={placeholderClass}>Customers Content</div>;
const ReportsContent = () => <div className={placeholderClass}>Reports Content</div>;
const SettingsContent = () => <div className={placeholderClass}>Settings Content</div>;