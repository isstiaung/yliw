'use client';

import React, { useState } from 'react';
import { useLifeData } from '@/contexts/LifeDataContext';
import { LifeEvent } from '@/types';
import { mapDateRangeToWeeks, parseLocalDate, formatDateForInput } from '@/utils/dateCalculations';
import { eventColors } from '@/utils/eventColors';
import IconPicker from './IconPicker';
import CsvImport from './CsvImport';
import MilestoneIcon from './MilestoneIcon';
import { FaPlus, FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

interface EventFormData {
  title: string;
  startDate: string;
  endDate: string;
  color: string;
  icon: string;
}

export default function EventForm() {
  const { state, addEvent, updateEvent, deleteEvent } = useLifeData();
  const router = useRouter();
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
      startDate: formatDateForInput(event.startDate),
      endDate: formatDateForInput(event.endDate),
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
      [name]: value,
      // Auto-fill end date to match start date while end date is empty
      ...(name === 'startDate' && !prev.endDate ? { endDate: value } : {}),
    }));

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
      newErrors.title = 'Title is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (formData.startDate && formData.endDate) {
      const startDate = parseLocalDate(formData.startDate);
      const endDate = parseLocalDate(formData.endDate);

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
      startDate: parseLocalDate(formData.startDate),
      endDate: parseLocalDate(formData.endDate),
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
    if (window.confirm('Delete this milestone?')) {
      deleteEvent(eventId);
    }
  };

  const proceedToCalendar = () => {
    router.push("/calendar");
  };

  if (!state.userData) {
    return null;
  }

  const inputClass = (hasError: boolean) =>
    `w-full px-4 py-3 bg-[var(--surface)] border rounded-md text-[var(--ink)] placeholder:text-[var(--muted)]/60 outline-none transition-shadow focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] ${
      hasError ? 'border-[var(--accent)]' : 'border-[var(--line)]'
    }`;

  return (
    <div className="min-h-screen bg-[var(--paper)] paper-grain p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="card rise-in bg-[var(--surface)] border border-[var(--line)] rounded-xl shadow-[var(--shadow-card)] p-8 sm:p-10">
          <div className="mb-8">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-[var(--accent)] mb-3">
              Step two
            </p>
            <h1 className="font-display text-3xl text-[var(--ink)] mb-1">
              {state.userData.name}&apos;s milestones
            </h1>
            <p className="text-[var(--muted)]">
              Mark the chapters and moments that shape your weeks.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-3">
            <button
              onClick={openAddForm}
              className="bg-[var(--ink)] text-[var(--paper)] px-5 py-2.5 rounded-md font-medium hover:bg-[var(--accent)] transition-colors flex items-center gap-2"
            >
              <FaPlus className="w-3.5 h-3.5" />
              Add milestone
            </button>
            <button
              onClick={proceedToCalendar}
              className="px-5 py-2.5 rounded-md font-medium border border-[var(--line)] text-[var(--ink)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors flex items-center gap-2"
            >
              <FaEye className="w-3.5 h-3.5" />
              View life calendar
            </button>
            <div className="h-5 w-px bg-[var(--line)] hidden sm:block" />
            <CsvImport />
          </div>

          {state.userData.events.length > 0 ? (
            <div>
              <h2 className="text-xs font-mono uppercase tracking-[0.18em] text-[var(--muted)] mb-4">
                {state.userData.events.length} milestone{state.userData.events.length === 1 ? '' : 's'}
              </h2>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {state.userData.events
                  .slice()
                  .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
                  .map(event => {
                    const isSameDate = event.startDate.toDateString() === event.endDate.toDateString();

                    return (
                      <div
                        key={event.id}
                        className="group bg-[var(--paper)] rounded-lg p-4 border border-[var(--line)] hover:border-[var(--muted)]/40 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {event.icon && (
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0"
                                style={{ backgroundColor: event.color }}
                              >
                                <MilestoneIcon name={event.icon} className="w-4 h-4" />
                              </div>
                            )}
                            <h3 className="font-medium text-[var(--ink)] truncate">{event.title}</h3>
                          </div>
                          <div className="flex gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEditForm(event)}
                              className="p-1.5 text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
                              title="Edit event"
                            >
                              <FaEdit className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteEvent(event.id)}
                              className="p-1.5 text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
                              title="Delete event"
                            >
                              <FaTrash className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-[var(--muted)]">
                          {isSameDate
                            ? event.startDate.toLocaleDateString()
                            : `${event.startDate.toLocaleDateString()} – ${event.endDate.toLocaleDateString()}`}
                        </p>
                        <p className="text-xs font-mono text-[var(--muted)]/70 mt-1">
                          {event.startWeekNumber === event.endWeekNumber
                            ? `week ${event.startWeekNumber}`
                            : `weeks ${event.startWeekNumber}–${event.endWeekNumber}`}
                        </p>
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-[var(--line)] rounded-lg py-14 px-6 text-center">
              <div className="mx-auto mb-4 flex w-fit gap-1.5" aria-hidden="true">
                {eventColors.slice(0, 5).map(color => (
                  <span key={color} className="h-3 w-3 rounded-[2px]" style={{ background: color }} />
                ))}
              </div>
              <p className="font-medium text-[var(--ink)] mb-1">No milestones yet</p>
              <p className="text-sm text-[var(--muted)]">
                Add the chapters that shaped your weeks — school, moves, people, adventures.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Event Form Modal */}
      {isFormOpen && (
        <div
          className="modal-overlay fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={closeForm}
        >
          <div
            className="modal-panel card bg-[var(--surface)] rounded-xl shadow-[var(--shadow-card-lg)] w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-2xl text-[var(--ink)]">
                  {editingEvent ? 'Edit milestone' : 'New milestone'}
                </h2>
                <button
                  onClick={closeForm}
                  className="text-[var(--muted)] hover:text-[var(--ink)] text-2xl leading-none"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-[var(--ink)] mb-1.5">
                    Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className={inputClass(!!errors.title)}
                    placeholder="e.g. University, Marriage, Career at Google"
                  />
                  {errors.title && <p className="mt-1 text-sm text-[var(--accent)]">{errors.title}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-[var(--ink)] mb-1.5">
                      Start date
                    </label>
                    <input
                      type="date"
                      id="startDate"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className={inputClass(!!errors.startDate)}
                    />
                    {errors.startDate && <p className="mt-1 text-sm text-[var(--accent)]">{errors.startDate}</p>}
                  </div>

                  <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-[var(--ink)] mb-1.5">
                      End date
                    </label>
                    <input
                      type="date"
                      id="endDate"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      className={inputClass(!!errors.endDate)}
                    />
                    {errors.endDate && <p className="mt-1 text-sm text-[var(--accent)]">{errors.endDate}</p>}
                  </div>
                </div>

                <p className="text-sm text-[var(--muted)]">
                  For a single-day event, use the same date for both.
                </p>

                <div>
                  <label className="block text-sm font-medium text-[var(--ink)] mb-2">
                    Colour
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {eventColors.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, color }))}
                        className={`w-9 h-9 rounded-md transition-transform ${
                          formData.color === color
                            ? 'ring-2 ring-offset-2 ring-offset-[var(--surface)] ring-[var(--ink)] scale-110'
                            : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                        aria-label={`Colour ${color}`}
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
                <div className="bg-[var(--paper)] border border-[var(--line)] rounded-lg p-4">
                  <div className="text-xs font-mono uppercase tracking-[0.18em] text-[var(--muted)] mb-3">Preview</div>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: formData.color }}
                    >
                      <MilestoneIcon name={formData.icon} className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-medium text-[var(--ink)]">
                        {formData.title || 'Event title'}
                      </div>
                      <div className="text-sm text-[var(--muted)]">
                        {formData.startDate && formData.endDate ? (
                          formData.startDate === formData.endDate ?
                            parseLocalDate(formData.startDate).toLocaleDateString() :
                            `${parseLocalDate(formData.startDate).toLocaleDateString()} – ${parseLocalDate(formData.endDate).toLocaleDateString()}`
                        ) : 'Select dates'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="flex-1 px-4 py-3 border border-[var(--line)] text-[var(--ink)] rounded-md font-medium hover:bg-[var(--paper)] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-[var(--ink)] text-[var(--paper)] px-4 py-3 rounded-md font-medium hover:bg-[var(--accent)] transition-colors"
                  >
                    {editingEvent ? 'Save milestone' : 'Add milestone'}
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
