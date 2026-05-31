"use client";

import { AddIcon, BedIcon, BuildingIcon } from '@/components/icons';
import React, { useState, useEffect } from 'react';
import { PropertyCard } from '@/components/business';

import { 
  LayoutDashboard, 
  Calendar, 
  Bed, 
  Tent, 
  CalendarDays, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut 
} from 'lucide-react';
import { useRouter } from 'next/navigation';

type MenuItem = 'dashboard' | 'bookings' | 'manage-rooms' | 'events-center' | 'calendar' | 'customers' | 'reports' | 'settings';

interface MenuItemConfig {
  id: MenuItem;
  label: string;
  icon: React.ReactNode;
}

interface User {
  user_id: number;
  first_name: string | null;
  last_name: string | null;
  email: string;
  user_type: string;
  businessName?: string;
}

export default function BusinessDashboard() {
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState<MenuItem>('dashboard');
  const [user, setUser] = useState<User | null>(null);

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

  const menuItems: MenuItemConfig[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={24} /> },
    { id: 'bookings', label: 'Bookings', icon: <Calendar size={24} /> },
    { id: 'manage-rooms', label: 'Manage Rooms', icon: <Bed size={24} /> },
    { id: 'events-center', label: 'Events Center', icon: <Tent size={24} /> },
    { id: 'calendar', label: 'Calendar', icon: <CalendarDays size={24} /> },
    { id: 'customers', label: 'Customers', icon: <Users size={24} /> },
    { id: 'reports', label: 'Reports', icon: <BarChart3 size={24} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={24} /> },
  ];

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

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
       <aside className="w-80 bg-white rounded-3xl shadow-xl shadow-black/80 p-6 flex flex-col h-fit sticky top-20">
          <div className='text-center font-bold text-4xl text-black py-5'>Tusha </div>
          
          <nav className="space-y-2 flex-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveMenu(item.id)}
                className={`
                  w-full flex items-center gap-4 px-6 py-4 rounded-xl
                  transition-all duration-200
                  ${activeMenu === item.id 
                    ? 'bg-black text-white font-semibold' 
                    : 'text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                {item.icon}
                <span className="text-lg">{item.label}</span>
              </button>
            ))}
          </nav>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-6 py-4 rounded-xl text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all duration-200 mt-4"
          >
            <LogOut size={24} />
            <span className="text-lg">Log Out</span>
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {/* User Greeting */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-5xl font-bold text-gray-800">
              Hello, {user.businessName || 'Business Owner'}
            </h1>
            <div className="w-16 h-16 rounded-full bg-gray-300 overflow-hidden flex items-center justify-center">
              <span className="text-2xl font-bold text-gray-600">
                {user.businessName ? user.businessName.charAt(0).toUpperCase() : 'B'}
              </span>
            </div>
          </div>

          {/* Dynamic Content */}
          {activeMenu === 'dashboard' && <DashboardContent userId={user.user_id} />}
          {activeMenu === 'bookings' && <BookingsContent userId={user.user_id} />}
          {activeMenu === 'manage-rooms' && <ManageRoomsContent userId={user.user_id} />}
          {activeMenu === 'events-center' && <EventsCenterContent />}
          {activeMenu === 'calendar' && <CalendarContent />}
          {activeMenu === 'customers' && <CustomersContent />}
          {activeMenu === 'reports' && <ReportsContent />}
          {activeMenu === 'settings' && <SettingsContent />}
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
      const response = await fetch(`/api/properties/count/${userId}`);
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
      const response = await fetch(`/api/rooms/count/${userId}`);
      const data = await response.json();
      if (response.ok) {
        setRoomCount(data.count);
      }
    } catch (error) {
      console.error('Error fetching room count:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-6">  
        <StatCard title="Buildings" value={propertyCount.toString()} icon={<BuildingIcon size={40} />} />
        <StatCard   title="Rooms" value={roomCount.toString()} icon={<BedIcon size={40} />} />
        <StatCard title="Events" value="2" icon="⛺" />
      </div>

      {/* Revenue Section */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-xl shadow-black/40 p-8">
          <h2 className="text-2xl font-semibold mb-6">Revenue This Month</h2>
          <p className="text-4xl font-bold">ZMW7000</p>
          <div className="mt-6 p-6 border-2 border-yellow-400 rounded-2xl bg-yellow-50">
            <p className="text-sm text-gray-600 mb-2">Revenue Today</p>
            <p className="text-3xl font-bold">ZMW500</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-black/40 p-8">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl text-gray-600 mb-4">Check Ins</h3>
              <p className="text-5xl font-bold">9</p>
            </div>
            <div className="border-l-2 border-gray-200 pl-8">
              <h3 className="text-xl text-gray-600 mb-4">Bookings</h3>
              <p className="text-5xl font-bold">12</p>
            </div>
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-3xl shadow-xl shadow-black/40 p-8">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-4 px-4 text-xl font-semibold">Event type</th>
              <th className="text-left py-4 px-4 text-xl font-semibold">Number of Guests</th>
              <th className="text-left py-4 px-4 text-xl font-semibold">Date</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100">
              <td className="py-4 px-4">Wedding</td>
              <td className="py-4 px-4">255</td>
              <td className="py-4 px-4">19 Mar 26</td>
            </tr>
            <tr>
              <td className="py-4 px-4">Birthday party</td>
              <td className="py-4 px-4">50</td>
              <td className="py-4 px-4">19 Mar 26</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
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
      const response = await fetch(`/api/properties/user/${userId}`);
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
      const response = await fetch(`/api/rooms/user/${userId}`);
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
    router.push(`/property/${propertyId}`);
  };

  // Filter rooms based on selected property
  const filteredRooms = selectedPropertyFilter === 'all' 
    ? rooms 
    : rooms.filter(room => room.property_id.toString() === selectedPropertyFilter);

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header with Add Buttons */}
      <div className="flex justify-between items-center">
        <h2 className="text-4xl font-bold">Add and Edit Listings</h2>
     <div className="flex gap-4">
  <button 
    onClick={() => router.push('/add-property')}
    className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-6 py-3 rounded-full flex items-center gap-2 transition-colors"
  >
    Add Property 
    <AddIcon size={24} />
  </button>
  
  <button 
    onClick={() => router.push('/add-room')}
    className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-6 py-3 rounded-full flex items-center gap-2 transition-colors"
  >
    Add Room 
    <AddIcon size={24} />
  </button>
</div>
      </div>

      {/* Properties Section */}
      <div>
        <h3 className="text-3xl font-bold mb-6">Properties</h3>
        {properties.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-lg p-8 text-center text-gray-500">
            No properties added yet. Click "Add Property" to get started!
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
      </div>

      {/* Rooms Section */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-3xl font-bold">Rooms</h3>
          
          {/* Property Filter Dropdown */}
          {properties.length > 0 && (
            <select
              value={selectedPropertyFilter}
              onChange={(e) => setSelectedPropertyFilter(e.target.value)}
              className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-yellow-400 focus:outline-none"
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
          <div className="bg-white rounded-3xl shadow-lg p-8 text-center text-gray-500">
            No rooms added yet. Click "Add Room" to get started!
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-black text-white">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold">Room Type</th>
                  <th className="text-left py-4 px-6 font-semibold">Room ID</th>
                  <th className="text-left py-4 px-6 font-semibold">Property</th>
                  <th className="text-left py-4 px-6 font-semibold">Amenities</th>
                  <th className="text-left py-4 px-6 font-semibold">Price</th>
                  <th className="text-center py-4 px-6 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRooms.map((room, index) => (
                  <tr 
                    key={room.room_id}
                    className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                  >
                    <td className="py-4 px-6">{room.room_type}</td>
                    <td className="py-4 px-6">RID{room.room_id.toString().padStart(3, '0')}</td>
                    <td className="py-4 px-6">{room.property_name}</td>
                    <td className="py-4 px-6">{room.amenities?.length || 0}</td>
                    <td className="py-4 px-6 font-semibold">ZMW{room.base_price}</td>
                    <td className="py-4 px-6 text-center">
                      <button 
                        onClick={() => router.push(`/edit-room/${room.room_id}`)}
                        className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-6 py-2 rounded-full transition-colors"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
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
    <div className="bg-white rounded-2xl shadow-xl shadow-black/40 p-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-700">{title}</h3>
        <div>{icon}</div>
      </div>
      <p className="text-5xl font-bold">{value}</p>
    </div>
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

function getTodayStr(): string {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t.toISOString().split('T')[0];
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
            { label: 'Total', value: `ZMW ${Number(booking.total_price).toFixed(2)}` },
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

// ─── Bookings Calendar ────────────────────────────────────────────────────────

const BookingsContent: React.FC<{ userId: number }> = ({ userId }) => {
  const today = getTodayStr();
  const [fromDate, setFromDate] = useState(today);
  const [toDate,   setToDate]   = useState(addDays(today, 14));
  const [appliedFrom, setAppliedFrom] = useState(today);
  const [appliedTo,   setAppliedTo]   = useState(addDays(today, 14));
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms,    setRooms]    = useState<{ room_id: number; room_number: string }[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState<Booking | null>(null);

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [roomsRes, bookingsRes] = await Promise.all([
        fetch(`/api/rooms/user/${userId}`),
        fetch(`/api/bookings/user/${userId}`),
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-4xl font-bold text-gray-800">Manage Bookings</h2>

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
            className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-4 py-1.5 rounded-full text-sm transition-colors"
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
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-3xl shadow-xl shadow-black/20 overflow-hidden">
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

                        return (
                          <td
                            key={d}
                            className={`
                              relative border-b border-r border-gray-100 h-12 w-[52px] min-w-[52px] p-0
                              ${isToday ? 'bg-yellow-50/40' : 'bg-white group-hover:bg-gray-50/50'}
                            `}
                          >
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
      </div>

      {/* Booking detail modal */}
      {selected && (
        <BookingModal booking={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
};
const EventsCenterContent = () => <div className="bg-white rounded-3xl shadow-lg p-8 text-2xl">Events Center Content</div>;
const CalendarContent = () => <div className="bg-white rounded-3xl shadow-lg p-8 text-2xl">Calendar Content</div>;
const CustomersContent = () => <div className="bg-white rounded-3xl shadow-lg p-8 text-2xl">Customers Content</div>;
const ReportsContent = () => <div className="bg-white rounded-3xl shadow-lg p-8 text-2xl">Reports Content</div>;
const SettingsContent = () => <div className="bg-white rounded-3xl shadow-lg p-8 text-2xl">Settings Content</div>;