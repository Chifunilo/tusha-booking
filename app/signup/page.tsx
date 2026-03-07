"use client";
import { useState } from 'react';

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    day: '',
    month: '',
    year: ''
  });

  const handleSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Add your sign-up logic here
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Generate days 1-31
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  
  // Generate months 1-12 with names
  const months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];
  
  // Generate years (1900 to current year)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1900 + 1 }, (_, i) => (currentYear - i).toString());

  return (
    <div className="flex min-h-screen h-screen overflow-hidden font-['Poppins']">
      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img
          src="/images/signuppagepicture.jpg"
          alt="Luxury Hotel"
          className="object-cover object-center w-full h-full"
        />
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      {/* Right Side - Sign Up Form */}
      <div className="flex items-center justify-center w-full lg:w-1/2 p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-semibold text-gray-900 mb-2">
              Create Account
            </h1>
            <p className="text-gray-600">Join us for exclusive hotel deals</p>
          </div>

          {/* Form */}
          <div className="space-y-6">
            {/* First Name */}
            <div>

              <input
                type="text"
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                className="w-full px-4 py-3 bg-transparent border-2 border-black-400 rounded-lg outline-none focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-500"
                placeholder= "First Name"
              />
            </div>

            {/* Last Name */}
            <div>
              <input
                type="text"
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                className="w-full px-4 py-3 bg-transparent border-2 border-black-400 rounded-lg outline-none focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-500"
                placeholder="Last Name"
              />
            </div>

            {/* Email */}
            <div>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full px-4 py-3 bg-transparent border-2 border-black-400 rounded-lg outline-none focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-500"
                placeholder="Email"
              />
            </div>

            {/* Password */}
            <div>
              <input
                type="password"
                id="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                className="w-full px-4 py-3 bg-transparent border-2 border-black-400 rounded-lg outline-none focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-500"
                placeholder="Password"
              />
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth
              </label>
              <div className="grid grid-cols-3 gap-3">
                {/* Day Dropdown */}
                <select
                  value={formData.day}
                  onChange={(e) => handleChange('day', e.target.value)}
                  className="w-full px-4 py-3 bg-transparent border-2 border-black-400 rounded-lg outline-none focus:border-blue-500 transition-colors text-gray-900"
                >
                  <option value="" disabled className="text-gray-500">DD</option>
                  {days.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>

                {/* Month Dropdown */}
                <select
                  value={formData.month}
                  onChange={(e) => handleChange('month', e.target.value)}
                  className="w-full px-4 py-3 bg-transparent border-2 border-black-400 rounded-lg outline-none focus:border-blue-500 transition-colors text-gray-900"
                >
                  <option value="" disabled className="text-gray-500">MM</option>
                  {months.map(month => (
                    <option key={month.value} value={month.value}>{month.label}</option>
                  ))}
                </select>

                {/* Year Dropdown */}
                <select
                  value={formData.year}
                  onChange={(e) => handleChange('year', e.target.value)}
                  className="w-full px-4 py-3 bg-transparent border-2 border-black-400 rounded-lg outline-none focus:border-blue-500 transition-colors text-gray-900"
                >
                  <option value="" disabled className="text-gray-500">YYYY</option>
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>

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
              <span className="text-blue-600 font-medium hover:underline cursor-pointer">
                Sign In
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}