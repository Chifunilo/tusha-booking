"use client";
import { useState } from 'react';

export default function LogInPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Login successful!');
        
        // Store user data
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Redirect based on user type
        if (data.user.user_type === 'business') {
          window.location.href = '/business-dashboard';
        } else {
          window.location.href = '/dashboard';
        }
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Failed to login. Please try again.');
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

      {/* Right Side - Login Form */}
      <div className="flex items-center justify-center w-full lg:w-1/2 p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-semibold text-gray-900 mb-2">
              Log In
            </h1>
            <p className="text-gray-600">Welcome back! Please enter your details</p>
          </div>

          <div className="space-y-6">
            <div>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full px-4 py-3 bg-transparent border-2 border-gray-800 rounded-lg outline-none focus:border-blue-500 transition-colors text-black placeholder:text-gray-500"
                placeholder="Email"
              />
            </div>

            <div>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                className="w-full px-4 py-3 bg-transparent border-2 border-gray-800 rounded-lg outline-none focus:border-blue-500 transition-colors text-black placeholder:text-gray-500"
                placeholder="Password"
              />
            </div>

            <button
              onClick={handleSubmit}
              className="w-full bg-[#FFC300] text-black py-3 rounded-full font-semibold hover:bg-[#e6b000] transition-colors text-lg"
            >
              Log In
            </button>

            <p className="text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <a href="/signup" className="text-blue-600 font-medium hover:underline">
                Sign Up
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}