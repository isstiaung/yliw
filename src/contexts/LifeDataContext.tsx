'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { UserData, LifeEvent, AppPhase } from '@/types';
import { saveUserData, loadUserData } from '@/utils/localStorage';
import { mapDateRangeToWeeks } from '@/utils/dateCalculations';

interface LifeDataState {
  userData: UserData | null;
  currentPhase: AppPhase;
  isLoading: boolean;
}

type LifeDataAction =
  | { type: 'SET_USER_DATA'; payload: UserData }
  | { type: 'SET_PHASE'; payload: AppPhase }
  | { type: 'ADD_EVENT'; payload: Omit<LifeEvent, 'id' | 'startWeekNumber' | 'endWeekNumber'> }
  | { type: 'UPDATE_EVENT'; payload: LifeEvent }
  | { type: 'DELETE_EVENT'; payload: string }
  | { type: 'LOAD_DATA'; payload: UserData | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'CLEAR_DATA' };

const initialState: LifeDataState = {
  userData: null,
  currentPhase: 'setup',
  isLoading: true,
};

function lifeDataReducer(state: LifeDataState, action: LifeDataAction): LifeDataState {
  switch (action.type) {
    case 'SET_USER_DATA':
      return {
        ...state,
        userData: action.payload,
      };
    case 'SET_PHASE':
      return {
        ...state,
        currentPhase: action.payload,
      };
    case 'ADD_EVENT': {
      if (!state.userData) return state;

      const weekRange = mapDateRangeToWeeks(
        state.userData.birthDate,
        action.payload.startDate,
        action.payload.endDate
      );

      const newEvent: LifeEvent = {
        ...action.payload,
        id: crypto.randomUUID(),
        startWeekNumber: weekRange.startWeek,
        endWeekNumber: weekRange.endWeek,
      };

      return {
        ...state,
        userData: {
          ...state.userData,
          events: [...state.userData.events, newEvent],
        },
      };
    }
    case 'UPDATE_EVENT': {
      if (!state.userData) return state;

      return {
        ...state,
        userData: {
          ...state.userData,
          events: state.userData.events.map(event =>
            event.id === action.payload.id ? action.payload : event
          ),
        },
      };
    }
    case 'DELETE_EVENT': {
      if (!state.userData) return state;

      return {
        ...state,
        userData: {
          ...state.userData,
          events: state.userData.events.filter(
            event => event.id !== action.payload
          ),
        },
      };
    }
    case 'LOAD_DATA':
      return {
        ...state,
        userData: action.payload,
        currentPhase: action.payload ? 'events' : 'setup',
        isLoading: false,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'CLEAR_DATA':
      return {
        ...initialState,
        isLoading: false,
      };
    default:
      return state;
  }
}

interface LifeDataContextType {
  state: LifeDataState;
  setUserData: (userData: UserData) => void;
  setPhase: (phase: AppPhase) => void;
  addEvent: (event: Omit<LifeEvent, 'id' | 'startWeekNumber' | 'endWeekNumber'>) => void;
  updateEvent: (event: LifeEvent) => void;
  deleteEvent: (eventId: string) => void;
  clearData: () => void;
}

const LifeDataContext = createContext<LifeDataContextType | undefined>(undefined);

export function LifeDataProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(lifeDataReducer, initialState);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = loadUserData();
    dispatch({ type: 'LOAD_DATA', payload: savedData });
  }, []);

  // Save data to localStorage whenever userData changes
  useEffect(() => {
    if (state.userData && !state.isLoading) {
      saveUserData(state.userData);
    }
  }, [state.userData, state.isLoading]);

  const setUserData = (userData: UserData) => {
    dispatch({ type: 'SET_USER_DATA', payload: userData });
  };

  const setPhase = (phase: AppPhase) => {
    dispatch({ type: 'SET_PHASE', payload: phase });
  };

  const addEvent = (event: Omit<LifeEvent, 'id' | 'startWeekNumber' | 'endWeekNumber'>) => {
    dispatch({ type: 'ADD_EVENT', payload: event });
  };

  const updateEvent = (event: LifeEvent) => {
    dispatch({ type: 'UPDATE_EVENT', payload: event });
  };

  const deleteEvent = (eventId: string) => {
    dispatch({ type: 'DELETE_EVENT', payload: eventId });
  };

  const clearData = () => {
    dispatch({ type: 'CLEAR_DATA' });
  };

  return (
    <LifeDataContext.Provider
      value={{
        state,
        setUserData,
        setPhase,
        addEvent,
        updateEvent,
        deleteEvent,
        clearData,
      }}
    >
      {children}
    </LifeDataContext.Provider>
  );
}

export function useLifeData() {
  const context = useContext(LifeDataContext);
  if (context === undefined) {
    throw new Error('useLifeData must be used within a LifeDataProvider');
  }
  return context;
}
