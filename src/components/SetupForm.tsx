'use client';

import React, { useState } from 'react';
import { useLifeData } from '@/contexts/LifeDataContext';
import { UserData } from '@/types';

export default function SetupForm() {
  const { setUserData, setPhase } = useLifeData();
  const [formData, setFormData] = useState({
    name: '',
    birthDate: '',
    endAge: 90,
    quote: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'endAge' ? parseInt(value) || 90 : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.birthDate) {
      newErrors.birthDate = 'Birth date is required';
    } else {
      const birthDate = new Date(formData.birthDate);
      const today = new Date();
      if (birthDate > today) {
        newErrors.birthDate = 'Birth date cannot be in the future';
      }
    }

    if (formData.endAge < 20 || formData.endAge > 90) {
      newErrors.endAge = 'End age must be between 20 and 90';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const userData: UserData = {
      name: formData.name.trim(),
      birthDate: new Date(formData.birthDate),
      endAge: formData.endAge,
      quote: formData.quote.trim(),
      events: []
    };

    setUserData(userData);
    setPhase('events');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Life In Weeks</h1>
          <p className="text-gray-600">Let&apos;s start by setting up your life calendar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your full name"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-2">
              Birth Date
            </label>
            <input
              type="date"
              id="birthDate"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 ${
                errors.birthDate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.birthDate && <p className="mt-1 text-sm text-red-600">{errors.birthDate}</p>}
          </div>

          <div>
            <label htmlFor="endAge" className="block text-sm font-medium text-gray-700 mb-2">
              End Age (20-90)
            </label>
            <input
              type="number"
              id="endAge"
              name="endAge"
              min="20"
              max="90"
              value={formData.endAge}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 ${
                errors.endAge ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.endAge && <p className="mt-1 text-sm text-red-600">{errors.endAge}</p>}
            <p className="mt-1 text-sm text-gray-500">
              This determines how many years your calendar will show
            </p>
          </div>

          <div>
            <label htmlFor="quote" className="block text-sm font-medium text-gray-700 mb-2">
              Personal Quote (Optional)
            </label>
            <textarea
              id="quote"
              name="quote"
              value={formData.quote}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none text-gray-900"
              placeholder="A meaningful quote or motto for your life calendar"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Continue to Add Events
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Your data is stored locally in your browser and never sent to any server
          </p>
        </div>
      </div>
    </div>
  );
}
