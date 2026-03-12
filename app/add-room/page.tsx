"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface RoomFormData {
  propertyId: string;
  roomType: string;
  roomNumber: string;
  floorNumber: string;
  squareMeters: string;
  numBeds: string;
  bedType: string;
  maxOccupancy: string;
  basePrice: string;
  amenities: string;
  description: string;
  images: File[];
}

interface FormErrors {
  [key: string]: string;
}

interface Property {
  property_id: number;
  property_name: string;
}

export default function AddRoom() {
  const router = useRouter();
  const [userId, setUserId] = useState<number | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [formData, setFormData] = useState<RoomFormData>({
    propertyId: '',
    roomType: '',
    roomNumber: '',
    floorNumber: '',
    squareMeters: '',
    numBeds: '',
    bedType: '',
    maxOccupancy: '',
    basePrice: '',
    amenities: '',
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
    fetchProperties(userData.user_id);
  }, [router]);

  const fetchProperties = async (userId: number) => {
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

    if (!formData.propertyId) newErrors.propertyId = 'Please select a property';
    if (!formData.roomType.trim()) newErrors.roomType = 'Room type is required';
    if (!formData.roomNumber.trim()) newErrors.roomNumber = 'Room number is required';
    if (!formData.numBeds.trim()) newErrors.numBeds = 'Number of beds is required';
    if (!formData.bedType.trim()) newErrors.bedType = 'Bed type is required';
    if (!formData.maxOccupancy.trim()) newErrors.maxOccupancy = 'Max occupancy is required';
    if (!formData.basePrice.trim()) newErrors.basePrice = 'Base price is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      // Convert amenities string to array
      const amenitiesArray = formData.amenities
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);

      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyId: parseInt(formData.propertyId),
          roomNumber: formData.roomNumber,
          roomType: formData.roomType,
          floorNumber: formData.floorNumber ? parseInt(formData.floorNumber) : null,
          squareMeters: formData.squareMeters ? parseFloat(formData.squareMeters) : null,
          numBeds: parseInt(formData.numBeds),
          bedType: formData.bedType,
          maxOccupancy: parseInt(formData.maxOccupancy),
          basePrice: parseFloat(formData.basePrice),
          amenities: amenitiesArray,
          description: formData.description,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert('Room added successfully!');
        router.push('/business-dashboard');
      } else {
        alert('Failed to add room: ' + result.error);
      }
    } catch (error) {
      console.error('Error adding room:', error);
      alert('An error occurred while adding the room');
    }
  };

  const roomTypes = [
    'Single',
    'Double',
    'Twin',
    'Suite',
    'Deluxe',
    'Executive',
    'Family',
    'Presidential'
  ];

  const bedTypes = [
    'Single',
    'Twin',
    'Double',
    'Queen',
    'King',
    'Bunk Bed'
  ];

  if (properties.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-yellow-50 to-yellow-100 flex items-center justify-center p-8">
        <div className="bg-white rounded-3xl shadow-lg p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4">No Properties Found</h2>
          <p className="text-gray-600 mb-6">You need to add a property before you can add rooms.</p>
          <button
            onClick={() => router.push('/add-property')}
            className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-6 py-3 rounded-full transition-colors"
          >
            Add Property First
          </button>
        </div>
      </div>
    );
  }

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
            <h1 className="text-5xl font-bold text-gray-800">Add Room</h1>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Two Column Grid */}
          <div className="grid grid-cols-2 gap-x-16 gap-y-8">
            
            {/* Left Column */}
            <div className="space-y-8">
              
              {/* Room Type Dropdown */}
              <div>
                <label className="block text-xl font-medium mb-2">Room Type</label>
                <select
                  name="roomType"
                  value={formData.roomType}
                  onChange={handleChange}
                  className={`w-full bg-transparent border-b-2 ${
                    errors.roomType ? 'border-red-500' : 'border-black'
                  } py-3 text-lg focus:outline-none focus:border-yellow-500 transition-colors`}
                >
                  <option value="">Select Room Type</option>
                  {roomTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {errors.roomType && <p className="text-red-500 text-sm mt-1">{errors.roomType}</p>}
              </div>

              {/* Property ID Dropdown */}
              <div>
                <label className="block text-xl font-medium mb-2">Building ID</label>
                <select
                  name="propertyId"
                  value={formData.propertyId}
                  onChange={handleChange}
                  className={`w-full bg-transparent border-b-2 ${
                    errors.propertyId ? 'border-red-500' : 'border-black'
                  } py-3 text-lg focus:outline-none focus:border-yellow-500 transition-colors`}
                >
                  <option value="">Select Property</option>
                  {properties.map(property => (
                    <option key={property.property_id} value={property.property_id}>
                      {property.property_name} (PID{property.property_id.toString().padStart(2, '0')})
                    </option>
                  ))}
                </select>
                {errors.propertyId && <p className="text-red-500 text-sm mt-1">{errors.propertyId}</p>}
              </div>

              {/* Room Number */}
              <div>
                <label className="block text-xl font-medium mb-2">Room Number</label>
                <input
                  type="text"
                  name="roomNumber"
                  value={formData.roomNumber}
                  onChange={handleChange}
                  className={`w-full bg-transparent border-b-2 ${
                    errors.roomNumber ? 'border-red-500' : 'border-black'
                  } py-3 text-lg focus:outline-none focus:border-yellow-500 transition-colors`}
                  placeholder="e.g., 101, A12"
                />
                {errors.roomNumber && <p className="text-red-500 text-sm mt-1">{errors.roomNumber}</p>}
              </div>

              {/* Number of Beds */}
              <div>
                <label className="block text-xl font-medium mb-2">Number of Beds</label>
                <input
                  type="number"
                  name="numBeds"
                  value={formData.numBeds}
                  onChange={handleChange}
                  min="1"
                  className={`w-full bg-transparent border-b-2 ${
                    errors.numBeds ? 'border-red-500' : 'border-black'
                  } py-3 text-lg focus:outline-none focus:border-yellow-500 transition-colors`}
                />
                {errors.numBeds && <p className="text-red-500 text-sm mt-1">{errors.numBeds}</p>}
              </div>

              {/* Bed Type Dropdown */}
              <div>
                <label className="block text-xl font-medium mb-2">Bed Type</label>
                <select
                  name="bedType"
                  value={formData.bedType}
                  onChange={handleChange}
                  className={`w-full bg-transparent border-b-2 ${
                    errors.bedType ? 'border-red-500' : 'border-black'
                  } py-3 text-lg focus:outline-none focus:border-yellow-500 transition-colors`}
                >
                  <option value="">Select Bed Type</option>
                  {bedTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {errors.bedType && <p className="text-red-500 text-sm mt-1">{errors.bedType}</p>}
              </div>

              {/* Max Occupancy */}
              <div>
                <label className="block text-xl font-medium mb-2">Max Occupancy</label>
                <input
                  type="number"
                  name="maxOccupancy"
                  value={formData.maxOccupancy}
                  onChange={handleChange}
                  min="1"
                  className={`w-full bg-transparent border-b-2 ${
                    errors.maxOccupancy ? 'border-red-500' : 'border-black'
                  } py-3 text-lg focus:outline-none focus:border-yellow-500 transition-colors`}
                />
                {errors.maxOccupancy && <p className="text-red-500 text-sm mt-1">{errors.maxOccupancy}</p>}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              
              {/* Floor Number */}
              <div>
                <label className="block text-xl font-medium mb-2">Floor Number</label>
                <input
                  type="number"
                  name="floorNumber"
                  value={formData.floorNumber}
                  onChange={handleChange}
                  className="w-full bg-transparent border-b-2 border-black py-3 text-lg focus:outline-none focus:border-yellow-500 transition-colors"
                />
              </div>

              {/* Square Meters */}
              <div>
                <label className="block text-xl font-medium mb-2">Square Meters</label>
                <input
                  type="number"
                  name="squareMeters"
                  value={formData.squareMeters}
                  onChange={handleChange}
                  step="0.01"
                  className="w-full bg-transparent border-b-2 border-black py-3 text-lg focus:outline-none focus:border-yellow-500 transition-colors"
                />
              </div>

              {/* Base Price */}
              <div>
                <label className="block text-xl font-medium mb-2">Base Price (ZMW)</label>
                <input
                  type="number"
                  name="basePrice"
                  value={formData.basePrice}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className={`w-full bg-transparent border-b-2 ${
                    errors.basePrice ? 'border-red-500' : 'border-black'
                  } py-3 text-lg focus:outline-none focus:border-yellow-500 transition-colors`}
                />
                {errors.basePrice && <p className="text-red-500 text-sm mt-1">{errors.basePrice}</p>}
              </div>

              {/* Amenities */}
              <div>
                <label className="block text-xl font-medium mb-2">Amenities</label>
                <input
                  type="text"
                  name="amenities"
                  value={formData.amenities}
                  onChange={handleChange}
                  className="w-full bg-transparent border-b-2 border-black py-3 text-lg focus:outline-none focus:border-yellow-500 transition-colors"
                  placeholder="TV, WiFi, Mini Fridge (comma separated)"
                />
              </div>
            </div>
          </div>

          {/* Description - Full Width */}
          <div>
            <label className="block text-xl font-medium mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full bg-transparent border-b-2 border-black py-3 text-lg focus:outline-none focus:border-yellow-500 transition-colors resize-none"
              placeholder="Optional room description"
            />
          </div>

          {/* Bottom Section - Add Images and Submit */}
          <div className="flex justify-between items-center pt-8">
            
            {/* Add Images Button */}
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

            {/* Image Preview Count */}
            {imagePreview.length > 0 && (
              <p className="text-gray-700">
                {imagePreview.length} image{imagePreview.length !== 1 ? 's' : ''} selected
              </p>
            )}

            {/* Add Listing Button */}
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