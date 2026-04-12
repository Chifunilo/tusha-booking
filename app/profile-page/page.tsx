"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import Image from 'next/image';

type Section = 'personal' | 'payment' | 'preferences' | 'logout';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, logout, updateUser } = useAuth();
  
  const [activeSection, setActiveSection] = useState<Section>('personal');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [profile, setProfile] = useState({
    user_id: 0,
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    profile_image: null as string | null,
    gender: null as string | null,
    nationality: null as string | null,
  });

  const [selectedLanguage, setSelectedLanguage] = useState('en');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else if (user) {
      // Load user data from context
      setProfile({
        user_id: user.user_id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone || '',
        profile_image: user.profile_image || null,
        gender: null,
        nationality: null,
      });
      setLoading(false);
    }
  }, [isAuthenticated, user, router]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setProfile({ ...profile, profile_image: data.url });
      } else {
        alert('Failed to upload image');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const response = await fetch('/api/users/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: profile.user_id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
          profile_image: profile.profile_image,
          gender: profile.gender,
          nationality: profile.nationality,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update user in Auth Context
        updateUser({
          first_name: profile.first_name,
          last_name: profile.last_name,
          profile_image: profile.profile_image || undefined,
        });
        
        showSuccessToast('Profile updated successfully!');
      } else {
        alert(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const showSuccessToast = (message: string) => {
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg z-50';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out?')) {
      logout(); // This will redirect to login automatically
    }
  };

  const handleSectionClick = (section: Section) => {
    if (section === 'logout') {
      handleLogout();
    } else {
      setActiveSection(section);
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'personal':
        return (
          <div>
            {/* Profile Picture */}
            <div className="flex justify-center mb-12">
              <div className="relative group">
                <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-yellow-400">
                  {profile.profile_image ? (
                    <Image
                      src={profile.profile_image}
                      alt="Profile"
                      width={160}
                      height={160}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <svg className="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>
                
                <label className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <div className="text-white text-center">
                    {uploadingImage ? (
                      <div className="text-sm">Uploading...</div>
                    ) : (
                      <>
                        <svg className="w-8 h-8 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <div className="text-sm">Change Photo</div>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                </label>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-lg font-semibold mb-2">First Name</label>
                <input
                  type="text"
                  value={profile.first_name}
                  onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-lg focus:border-yellow-400 focus:outline-none"
                  placeholder="John"
                />
              </div>

              <div>
                <label className="block text-lg font-semibold mb-2">Last Name</label>
                <input
                  type="text"
                  value={profile.last_name}
                  onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-lg focus:border-yellow-400 focus:outline-none"
                  placeholder="Doe"
                />
              </div>

              <div>
                <label className="block text-lg font-semibold mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={profile.phone || ''}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-lg focus:border-yellow-400 focus:outline-none"
                  placeholder="+260 123 456 789"
                />
              </div>

              <div>
                <label className="block text-lg font-semibold mb-2">Email</label>
                <input
                  type="email"
                  value={profile.email}
                  readOnly
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-lg bg-gray-50 cursor-not-allowed"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-lg font-semibold mb-2">Gender</label>
                <select
                  value={profile.gender || ''}
                  onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-lg focus:border-yellow-400 focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>

              <div>
                <label className="block text-lg font-semibold mb-2">Nationality</label>
                <select
                  value={profile.nationality || ''}
                  onChange={(e) => setProfile({ ...profile, nationality: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-lg focus:border-yellow-400 focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="">Select nationality</option>
                  <option value="Zambian">Zambian</option>
                  <option value="South African">South African</option>
                  <option value="Kenyan">Kenyan</option>
                  <option value="Nigerian">Nigerian</option>
                  <option value="American">American</option>
                  <option value="British">British</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 'payment':
        return (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-400 mb-3">Payment Methods</h3>
            <p className="text-gray-500 mb-6">Coming Soon</p>
            <button
              disabled
              className="bg-gray-200 text-gray-400 font-bold px-8 py-3 rounded-xl cursor-not-allowed"
            >
              Add Payment Method
            </button>
          </div>
        );

      case 'preferences':
        return (
          <div>
            <h2 className="text-2xl font-bold mb-8">Preferences</h2>
            
            <div className="mb-8">
              <label className="block text-lg font-semibold mb-3">Language</label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full max-w-md px-4 py-3 border-2 border-gray-300 rounded-xl text-lg focus:border-yellow-400 focus:outline-none appearance-none cursor-pointer"
              >
                <option value="en">English</option>
                <option value="fr">Français (French)</option>
                <option value="es">Español (Spanish)</option>
                <option value="pt">Português (Portuguese)</option>
                <option value="sw">Kiswahili (Swahili)</option>
              </select>
              <p className="text-sm text-gray-500 mt-2">
                Select your preferred language for the interface
              </p>
            </div>

            <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-6">
              <p className="text-gray-700">
                <strong>Note:</strong> Language preferences will be applied across the entire application.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-2xl text-gray-500">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-black text-white">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div 
            className="text-3xl font-bold cursor-pointer"
            onClick={() => router.push('/customer-home')}
          >
            Tusha
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="grid grid-cols-12 gap-8">
          
          <div className="col-span-3">
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-6">
              <h2 className="text-2xl font-bold mb-6">Settings</h2>
              
              <nav className="space-y-2">
                <button
                  onClick={() => handleSectionClick('personal')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                    activeSection === 'personal'
                      ? 'bg-yellow-50 text-black font-semibold'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Personal Details</span>
                </button>

                <button
                  onClick={() => handleSectionClick('payment')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                    activeSection === 'payment'
                      ? 'bg-yellow-50 text-black font-semibold'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <span>Payment method</span>
                </button>

                <button
                  onClick={() => handleSectionClick('preferences')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                    activeSection === 'preferences'
                      ? 'bg-yellow-50 text-black font-semibold'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  <span>Preferences</span>
                </button>

                <button
                  onClick={() => handleSectionClick('logout')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-red-600 hover:bg-red-50 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Log Out</span>
                </button>
              </nav>
            </div>
          </div>

          <div className="col-span-9">
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-12">
              {renderContent()}

              {(activeSection === 'personal' || activeSection === 'preferences') && (
                <div className="flex justify-end mt-8">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`px-12 py-4 rounded-xl font-bold text-lg transition-colors ${
                      saving
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-yellow-400 hover:bg-yellow-500 text-black'
                    }`}
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}