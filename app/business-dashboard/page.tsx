"use client";

import React, { useState, useEffect } from 'react';
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
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-yellow-50 to-yellow-100 p-8">
      <div className="flex gap-8 max-w-[1600px] mx-auto">
        
        {/* Sidebar */}
        <aside className="w-80 bg-white rounded-3xl shadow-2xl p-6 flex flex-col h-fit sticky top-8">
          <nav className="space-y-2 flex-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveMenu(item.id)}
                className={`
                  w-full flex items-center gap-4 px-6 py-4 rounded-xl
                  transition-all duration-200
                  ${activeMenu === item.id 
                    ? 'bg-yellow-100 text-black font-semibold' 
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
          {activeMenu === 'bookings' && <BookingsContent />}
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

  useEffect(() => {
    fetchPropertyCount();
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

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-6">
        <StatCard title="Buildings" value={propertyCount.toString()} icon="🏢" />
        <StatCard title="Rooms" value="16" icon="🛏️" />
        <StatCard title="Events" value="2" icon="⛺" />
      </div>

      {/* Revenue Section */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold mb-6">Revenue This Month</h2>
          <p className="text-4xl font-bold">ZMW7000</p>
          <div className="mt-6 p-6 border-2 border-yellow-400 rounded-2xl bg-yellow-50">
            <p className="text-sm text-gray-600 mb-2">Revenue Today</p>
            <p className="text-3xl font-bold">ZMW500</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-8">
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
      <div className="bg-white rounded-3xl shadow-lg p-8">
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
            Add Property <span className="text-xl">⊕</span>
          </button>
          <button 
            onClick={() => router.push('/add-room')}
            className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-6 py-3 rounded-full flex items-center gap-2 transition-colors"
          >
            Add Room <span className="text-xl">⊕</span>
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
                propertyId={property.property_id}
                name={property.property_name}
                location={`${property.city}, ${property.country}`}
                rooms={property.room_count || 0}
                amenities={property.amenities?.length || 0}
                price={`ZMW${property.base_price || '0'}`}
                image={property.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop'}
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
  icon: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon }) => {
  return (
    <div className="bg-white rounded-3xl shadow-lg p-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-700">{title}</h3>
        <span className="text-3xl">{icon}</span>
      </div>
      <p className="text-5xl font-bold">{value}</p>
    </div>
  );
};

interface PropertyCardProps {
  name: string;
  location: string;
  rooms: number;
  amenities: number;
  price: string;
  image: string;
  propertyId: number;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ 
  propertyId,
  name, 
  location, 
  rooms, 
  amenities, 
  price, 
  image 
}) => {
  const router = useRouter();
  
  return (
    <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
      <img src={image} alt={name} className="w-full h-56 object-cover" />
      <div className="p-6">
        <h3 className="text-2xl font-bold mb-2">{name}</h3>
        <p className="text-gray-600 mb-4">{location}</p>
        <p className="text-gray-700 mb-1">Amenities: {amenities}</p>
        <p className="text-gray-700 mb-1">Rooms: {rooms}</p>
        <p className="text-gray-700 mb-4">Property ID: PID{propertyId.toString().padStart(2, '0')}</p>
        <div className="flex justify-between items-center">
          <p className="text-2xl font-bold">{price}</p>
          <button 
            onClick={() => router.push(`/edit-property/${propertyId}`)}
            className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-8 py-2 rounded-full transition-colors"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
};

const BookingsContent = () => <div className="bg-white rounded-3xl shadow-lg p-8 text-2xl">Bookings Content</div>;
const EventsCenterContent = () => <div className="bg-white rounded-3xl shadow-lg p-8 text-2xl">Events Center Content</div>;
const CalendarContent = () => <div className="bg-white rounded-3xl shadow-lg p-8 text-2xl">Calendar Content</div>;
const CustomersContent = () => <div className="bg-white rounded-3xl shadow-lg p-8 text-2xl">Customers Content</div>;
const ReportsContent = () => <div className="bg-white rounded-3xl shadow-lg p-8 text-2xl">Reports Content</div>;
const SettingsContent = () => <div className="bg-white rounded-3xl shadow-lg p-8 text-2xl">Settings Content</div>;