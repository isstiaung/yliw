'use client';

import React, { useState } from 'react';
import { useLifeData } from '@/contexts/LifeDataContext';
import { LifeEvent } from '@/types';
import { mapDateRangeToWeeks } from '@/utils/dateCalculations';
import IconPicker, { getIconComponent } from './IconPicker';
import { FaPlus, FaEdit, FaTrash, FaEye } from 'react-icons/fa';

const eventColors = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#6366f1', // indigo
  '#84cc16'  // lime
];

interface EventFormData {
  title: string;
  startDate: string;
  endDate: string;
  color: string;
  icon: string;
}

export default function EventForm() {
  const { state, addEvent, updateEvent, deleteEvent, setPhase } = useLifeData();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<LifeEvent | null>(null);
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    startDate: '',
    endDate: '',
    color: eventColors[0],
    icon: 'Birthday'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setFormData({
      title: '',
      startDate: '',
      endDate: '',
      color: eventColors[0],
      icon: 'Birthday'
    });
    setErrors({});
    setEditingEvent(null);
  };

  const openAddForm = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const openEditForm = (event: LifeEvent) => {
    setFormData({
      title: event.title,
      startDate: event.startDate.toISOString().split('T')[0],
      endDate: event.endDate.toISOString().split('T')[0],
      color: event.color,
      icon: event.icon
    });
    setEditingEvent(event);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    resetForm();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Auto-set end date to start date if end date is empty
    if (name === 'startDate' && !formData.endDate) {
      setFormData(prev => ({
        ...prev,
        startDate: value,
        endDate: value
      }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Event title is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      
      if (endDate < startDate) {
        newErrors.endDate = 'End date cannot be before start date';
      }

      if (state.userData) {
        const birthDate = state.userData.birthDate;
        const maxDate = new Date(birthDate);
        maxDate.setFullYear(birthDate.getFullYear() + state.userData.endAge);
        
        if (startDate < birthDate) {
          newErrors.startDate = 'Start date cannot be before your birth date';
        }
        
        if (endDate > maxDate) {
          newErrors.endDate = `End date cannot be after age ${state.userData.endAge}`;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !state.userData) {
      return;
    }

    const eventData = {
      title: formData.title.trim(),
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
      color: formData.color,
      icon: formData.icon
    };

    if (editingEvent) {
      const weekRange = mapDateRangeToWeeks(
        state.userData.birthDate,
        eventData.startDate,
        eventData.endDate
      );
      
      const updatedEvent: LifeEvent = {
        ...eventData,
        id: editingEvent.id,
        startWeekNumber: weekRange.startWeek,
        endWeekNumber: weekRange.endWeek,
      };
      updateEvent(updatedEvent);
    } else {
      addEvent(eventData);
    }

    closeForm();
  };

  const handleDeleteEvent = (eventId: string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      deleteEvent(eventId);
    }
  };

  const proceedToCalendar = () => {
    setPhase('calendar');
  };

  if (!state.userData) {
    return null;
  }

  const IconComponent = getIconComponent(formData.icon);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Add Life Events for {state.userData.name}
            </h1>
            <p className="text-gray-600">
              Add important dates and milestones to your life calendar
            </p>
          </div>

          {/* Add Event Button */}
          <div className="mb-8">
            <button
              onClick={openAddForm}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center gap-2"
            >
              <FaPlus className="w-4 h-4" />
              Add New Event
            </button>
          </div>

          {/* Events List */}
          {state.userData.events.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Events</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {state.userData.events
                  .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
                  .map(event => {
                    const EventIcon = getIconComponent(event.icon);
                    const isSameDate = event.startDate.toDateString() === event.endDate.toDateString();
                    
                    return (
                      <div
                        key={event.id}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {EventIcon && (
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                                style={{ backgroundColor: event.color }}
                              >
                                <EventIcon className="w-4 h-4" />
                              </div>
                            )}
                            <h3 className="font-medium text-gray-900">{event.title}</h3>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => openEditForm(event)}
                              className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                              title="Edit event"
                            >
                              <FaEdit className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteEvent(event.id)}
                              className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                              title="Delete event"
                            >
                              <FaTrash className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">
                          {isSameDate 
                            ? event.startDate.toLocaleDateString()
                            : `${event.startDate.toLocaleDateString()} - ${event.endDate.toLocaleDateString()}`
                          }
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {event.startWeekNumber === event.endWeekNumber 
                            ? `Week ${event.startWeekNumber}`
                            : `Weeks ${event.startWeekNumber}-${event.endWeekNumber}`
                          }
                        </p>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Proceed Button */}
          <div className="text-center">
            <button
              onClick={proceedToCalendar}
              className="bg-green-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors flex items-center gap-2 mx-auto"
            >
              <FaEye className="w-4 h-4" />
              View Life Calendar
            </button>
            <p className="text-sm text-gray-500 mt-2">
              You can always come back to add more events later
            </p>
          </div>
        </div>
      </div>

      {/* Event Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingEvent ? 'Edit Event' : 'Add New Event'}
                </h2>
                <button
                  onClick={closeForm}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Event Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 ${
                      errors.title ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., College Years, Marriage, Career at Google"
                  />
                  {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      id="startDate"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 ${
                        errors.startDate ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.startDate && <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>}
                  </div>

                  <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      id="endDate"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 ${
                        errors.endDate ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.endDate && <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>}
                  </div>
                </div>

                <p className="text-sm text-gray-500">
                  For single-day events, use the same date for both start and end.
                </p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Color
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {eventColors.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, color }))}
                        className={`w-10 h-10 rounded-lg border-2 transition-all ${
                          formData.color === color ? 'border-gray-800 scale-110' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <IconPicker
                    selectedIcon={formData.icon}
                    onIconSelect={(iconName) => setFormData(prev => ({ ...prev, icon: iconName }))}
                  />
                </div>

                {/* Preview */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">Preview</div>
                  <div className="flex items-center gap-3">
                    {IconComponent && (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: formData.color }}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-gray-900">
                        {formData.title || 'Event Title'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {formData.startDate && formData.endDate ? (
                          formData.startDate === formData.endDate ? 
                            new Date(formData.startDate).toLocaleDateString() :
                            `${new Date(formData.startDate).toLocaleDateString()} - ${new Date(formData.endDate).toLocaleDateString()}`
                        ) : 'Select dates'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                  >
                    {editingEvent ? 'Update Event' : 'Add Event'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
