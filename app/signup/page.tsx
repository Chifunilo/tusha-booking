"use client";

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

type UserType = 'customer' | 'business';

export default function SignUpPage() {
  const [userType, setUserType] = useState<UserType>('customer');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    businessName: '',
    businessType: '',
  });

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (userType === 'customer') {
      // Customer validation
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
        alert('Please fill in all required fields');
        return;
      }
    } else {
      // Business validation
      if (!formData.businessName || !formData.businessType || !formData.email || !formData.password) {
        alert('Please fill in all required fields');
        return;
      }
    }

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: userType === 'customer' ? formData.firstName : '',
          lastName: userType === 'customer' ? formData.lastName : '',
          email: formData.email,
          password: formData.password,
          userType: userType,
          businessName: formData.businessName,
          businessType: formData.businessType,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Account created successfully!');
        window.location.href = '/login';
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Sign up error:', error);
      alert('Failed to create account. Please try again.');
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="flex h-screen overflow-hidden font-['Poppins']">
      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src="/images/LoginPic.jpg"
          alt="Luxury Hotel"
          className="object-cover object-center w-full h-full"
        />
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      {/* Right Side - Sign Up Form */}
      <div className="flex items-center justify-center w-full lg:w-1/2 p-8 bg-white overflow-y-auto">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-semibold text-gray-900 mb-2">
              Create Account
            </h1>
            <p className="text-gray-600">Join us for exclusive deals</p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-300">
            <button
              onClick={() => setUserType('customer')}
              className={`flex-1 pb-3 text-center font-medium transition-colors ${
                userType === 'customer'
                  ? 'border-b-2 border-[#FFC300] text-[#FFC300]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Customer
            </button>
            <button
              onClick={() => setUserType('business')}
              className={`flex-1 pb-3 text-center font-medium transition-colors ${
                userType === 'business'
                  ? 'border-b-2 border-[#FFC300] text-[#FFC300]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Business
            </button>
          </div>

          {/* Form */}
          <div className="space-y-6">
            {userType === 'customer' ? (
              /* Customer Fields */
              <>
                <div>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    className="w-full px-4 py-3 bg-transparent border-2 border-gray-800 rounded-lg outline-none focus:border-blue-500 transition-colors text-black placeholder:text-gray-500"
                    placeholder="First Name"
                  />
                </div>

                <div>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    className="w-full px-4 py-3 bg-transparent border-2 border-gray-800 rounded-lg outline-none focus:border-blue-500 transition-colors text-black placeholder:text-gray-500"
                    placeholder="Last Name"
                  />
                </div>

                <div>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="w-full px-4 py-3 bg-transparent border-2 border-gray-800 rounded-lg outline-none focus:border-blue-500 transition-colors text-black placeholder:text-gray-500"
                    placeholder="Email"
                  />
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    className="w-full px-4 py-3 bg-transparent border-2 border-gray-800 rounded-lg outline-none focus:border-blue-500 transition-colors text-black placeholder:text-gray-500 pr-12"
                    placeholder="Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </>
            ) : (
              /* Business Fields - Business Name, Business Type, Email, Password */
              <>
                <div>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => handleChange('businessName', e.target.value)}
                    className="w-full px-4 py-3 bg-transparent border-2 border-gray-800 rounded-lg outline-none focus:border-blue-500 transition-colors text-black placeholder:text-gray-500"
                    placeholder="Business Name"
                  />
                </div>

                <div>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="w-full px-4 py-3 bg-transparent border-2 border-gray-800 rounded-lg outline-none focus:border-blue-500 transition-colors text-black placeholder:text-gray-500"
                    placeholder="Email"
                  />
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    className="w-full px-4 py-3 bg-transparent border-2 border-gray-800 rounded-lg outline-none focus:border-blue-500 transition-colors text-black placeholder:text-gray-500 pr-12"
                    placeholder="Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                <div>
                  <select
                    value={formData.businessType}
                    onChange={(e) => handleChange('businessType', e.target.value)}
                    className="w-full px-4 py-3 bg-transparent border-2 border-gray-800 rounded-lg outline-none focus:border-blue-500 transition-colors text-black"
                  >
                    <option value="">Select Business Type</option>
                    <option value="hotel">Hotel</option>
                    <option value="event_center">Event Center</option>
                    <option value="both">Both</option>
                  </select>
                </div>
              </>
            )}

            {/* Sign Up Button */}
            <button
              onClick={handleSubmit}
              className="w-full bg-[#FFC300] text-black py-3 rounded-full font-semibold hover:bg-[#e6b000] transition-colors text-lg"
            >
              Sign Up
            </button>

            {/* Sign In Link */}
            <p className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <a href="/login" className="text-blue-600 font-medium hover:underline">
                Sign In
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}