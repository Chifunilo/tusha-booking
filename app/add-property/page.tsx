"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface PropertyFormData {
  propertyName: string;
  addressLine1: string;
  addressLine2: string;
  phoneNumber: string;
  email: string;
  postalCode: string;
  country: string;
  stateProvince: string;
  city: string;
  amenities: string;
  propertyType: string;
  description: string;
  images: File[];
}

interface FormErrors {
  [key: string]: string;
}

export default function AddProperty() {
  const router = useRouter();
  const [userId, setUserId] = useState<number | null>(null);
  const [businessId, setBusinessId] = useState<number | null>(null);
  const [formData, setFormData] = useState<PropertyFormData>({
    propertyName: '',
    addressLine1: '',
    addressLine2: '',
    phoneNumber: '',
    email: '',
    postalCode: '',
    country: '',
    stateProvince: '',
    city: '',
    amenities: '',
    propertyType: '',
    description: '',
    images: []
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [imagePreview, setImagePreview] = useState<string[]>([]);

  useEffect(() => {
    // Get user from localStorage
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

    setUserId(userData.user_id);
    fetchBusinessId(userData.user_id);
  }, [router]);

  const fetchBusinessId = async (userId: number) => {
    try {
      const response = await fetch(`/api/business/${userId}`);
      const data = await response.json();
      if (response.ok) {
        setBusinessId(data.business.business_id);
      }
    } catch (error) {
      console.error('Error fetching business:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...fileArray]
      }));

      const newPreviews = fileArray.map(file => URL.createObjectURL(file));
      setImagePreview(prev => [...prev, ...newPreviews]);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.propertyName.trim()) newErrors.propertyName = 'Property name is required';
    if (!formData.addressLine1.trim()) newErrors.addressLine1 = 'Address is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.country.trim()) newErrors.country = 'Country is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.propertyType) newErrors.propertyType = 'Property type is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !businessId) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      // Convert amenities string to array
      const amenitiesArray = formData.amenities
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);

      // For now, we'll send JSON without images
      // Image upload can be added later with a file upload service
      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId: businessId,
          propertyName: formData.propertyName,
          propertyType: formData.propertyType,
          addressLine1: formData.addressLine1,
          addressLine2: formData.addressLine2,
          city: formData.city,
          stateProvince: formData.stateProvince,
          country: formData.country,
          postalCode: formData.postalCode,
          description: formData.description,
          amenities: amenitiesArray,
          phone: formData.phoneNumber,
          email: formData.email,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert('Property added successfully!');
        router.push('/business-dashboard');
      } else {
        alert('Failed to add property: ' + result.error);
      }
    } catch (error) {
      console.error('Error adding property:', error);
      alert('An error occurred while adding the property');
    }
  };

  const propertyTypes = [
    { value: 'hotel', label: 'Hotel' },
    { value: 'motel', label: 'Motel' },
    { value: 'apartment', label: 'Apartment' },
    { value: 'resort', label: 'Resort' },
    { value: 'hostel', label: 'Hostel' },
    { value: 'guesthouse', label: 'Guesthouse' },
    { value: 'event_center', label: 'Event Center' },
    { value: 'both', label: 'Hotel & Event Center' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-yellow-50 to-yellow-100 p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <button 
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-800 mb-4"
            >
              ← Back
            </button>
            <h1 className="text-5xl font-bold text-gray-800">Add Property</h1>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Two Column Grid */}
          <div className="grid grid-cols-2 gap-x-16 gap-y-8">
            
            {/* Left Column */}
            <div className="space-y-8">
              
              <div>
                <label className="block text-xl font-medium mb-2">Property Name</label>
                <input
                  type="text"
                  name="propertyName"
                  value={formData.propertyName}
                  onChange={handleChange}
                  className={`w-full bg-transparent border-b-2 ${
                    errors.propertyName ? 'border-red-500' : 'border-black'
                  } py-3 text-lg focus:outline-none focus:border-yellow-500 transition-colors`}
                  placeholder=""
                />
                {errors.propertyName && <p className="text-red-500 text-sm mt-1">{errors.propertyName}</p>}
              </div>

              <div>
                <label className="block text-xl font-medium mb-2">Address Line 1</label>
                <input
                  type="text"
                  name="addressLine1"
                  value={formData.addressLine1}
                  onChange={handleChange}
                  className={`w-full bg-transparent border-b-2 ${
                    errors.addressLine1 ? 'border-red-500' : 'border-black'
                  } py-3 text-lg focus:outline-none focus:border-yellow-500 transition-colors`}
                />
                {errors.addressLine1 && <p className="text-red-500 text-sm mt-1">{errors.addressLine1}</p>}
              </div>

              <div>
                <label className="block text-xl font-medium mb-2">Address Line 2</label>
                <input
                  type="text"
                  name="addressLine2"
                  value={formData.addressLine2}
                  onChange={handleChange}
                  className="w-full bg-transparent border-b-2 border-black py-3 text-lg focus:outline-none focus:border-yellow-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xl font-medium mb-2">Phone Number</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="w-full bg-transparent border-b-2 border-black py-3 text-lg focus:outline-none focus:border-yellow-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xl font-medium mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full bg-transparent border-b-2 ${
                    errors.email ? 'border-red-500' : 'border-black'
                  } py-3 text-lg focus:outline-none focus:border-yellow-500 transition-colors`}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              
              <div>
                <label className="block text-xl font-medium mb-2">Postal Code</label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  className="w-full bg-transparent border-b-2 border-black py-3 text-lg focus:outline-none focus:border-yellow-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xl font-medium mb-2">Country</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className={`w-full bg-transparent border-b-2 ${
                    errors.country ? 'border-red-500' : 'border-black'
                  } py-3 text-lg focus:outline-none focus:border-yellow-500 transition-colors`}
                />
                {errors.country && <p className="text-red-500 text-sm mt-1">{errors.country}</p>}
              </div>

              <div>
                <label className="block text-xl font-medium mb-2">State/Province</label>
                <input
                  type="text"
                  name="stateProvince"
                  value={formData.stateProvince}
                  onChange={handleChange}
                  className="w-full bg-transparent border-b-2 border-black py-3 text-lg focus:outline-none focus:border-yellow-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xl font-medium mb-2">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className={`w-full bg-transparent border-b-2 ${
                    errors.city ? 'border-red-500' : 'border-black'
                  } py-3 text-lg focus:outline-none focus:border-yellow-500 transition-colors`}
                />
                {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
              </div>

              <div>
                <label className="block text-xl font-medium mb-2">Amenities</label>
                <input
                  type="text"
                  name="amenities"
                  value={formData.amenities}
                  onChange={handleChange}
                  className="w-full bg-transparent border-b-2 border-black py-3 text-lg focus:outline-none focus:border-yellow-500 transition-colors"
                  placeholder="WiFi, Pool, Gym (comma separated)"
                />
              </div>

              <div>
                <label className="block text-xl font-medium mb-2">Property Type</label>
                <select
                  name="propertyType"
                  value={formData.propertyType}
                  onChange={handleChange}
                  className={`w-full bg-white border-2 ${
                    errors.propertyType ? 'border-red-500' : 'border-black'
                  } rounded-lg py-4 px-6 text-lg focus:outline-none focus:border-yellow-500 transition-colors`}
                >
                  <option value="">Select Property Type</option>
                  {propertyTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                {errors.propertyType && <p className="text-red-500 text-sm mt-1">{errors.propertyType}</p>}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xl font-medium mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full bg-transparent border-b-2 border-black py-3 text-lg focus:outline-none focus:border-yellow-500 transition-colors resize-none"
            />
          </div>

          {/* Bottom Section */}
          <div className="flex justify-between items-center pt-8">
            
            <label className="bg-gray-200 hover:bg-gray-300 px-12 py-6 rounded-2xl cursor-pointer transition-colors flex items-center gap-4">
              <span className="text-xl font-semibold">Add images</span>
              <span className="text-3xl">⊕</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>

            {imagePreview.length > 0 && (
              <p className="text-gray-700">
                {imagePreview.length} image{imagePreview.length !== 1 ? 's' : ''} selected
              </p>
            )}

            <button
              type="submit"
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold text-xl px-12 py-6 rounded-full transition-colors flex items-center gap-4"
            >
              Add Listing
              <span className="text-2xl">⊕</span>
            </button>
          </div>

          {/* Image Previews */}
          {imagePreview.length > 0 && (
            <div className="grid grid-cols-4 gap-4 mt-6">
              {imagePreview.map((preview, index) => (
                <div key={index} className="relative">
                  <img 
                    src={preview} 
                    alt={`Preview ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(prev => prev.filter((_, i) => i !== index));
                      setFormData(prev => ({
                        ...prev,
                        images: prev.images.filter((_, i) => i !== index)
                      }));
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}