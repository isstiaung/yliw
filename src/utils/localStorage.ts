import { UserData } from '@/types';

const STORAGE_KEY = 'yliw-user-data';

interface SerializedEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  color: string;
  icon: string;
  startWeekNumber: number;
  endWeekNumber: number;
}

interface SerializedUserData {
  name: string;
  birthDate: string;
  endAge: number;
  quote: string;
  events: SerializedEvent[];
}

export function saveUserData(userData: UserData): void {
  try {
    const serializedData = JSON.stringify({
      ...userData,
      birthDate: userData.birthDate.toISOString(),
      events: userData.events.map(event => ({
        ...event,
        startDate: event.startDate.toISOString(),
        endDate: event.endDate.toISOString()
      }))
    });
    localStorage.setItem(STORAGE_KEY, serializedData);
  } catch (error) {
    console.error('Failed to save user data:', error);
  }
}

export function loadUserData(): UserData | null {
  try {
    const serializedData = localStorage.getItem(STORAGE_KEY);
    if (!serializedData) return null;

    const data: SerializedUserData = JSON.parse(serializedData);
    return {
      ...data,
      birthDate: new Date(data.birthDate),
      events: data.events.map((event: SerializedEvent) => ({
        ...event,
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate)
      }))
    };
  } catch (error) {
    console.error('Failed to load user data:', error);
    return null;
  }
}

export function clearUserData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear user data:', error);
  }
}

export function exportUserData(): string {
  const userData = loadUserData();
  if (!userData) return '';
  
  return JSON.stringify(userData, null, 2);
}

export function importUserData(jsonString: string): UserData | null {
  try {
    const data: SerializedUserData = JSON.parse(jsonString);
    const userData: UserData = {
      ...data,
      birthDate: new Date(data.birthDate),
      events: data.events.map((event: SerializedEvent) => ({
        ...event,
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate)
      }))
    };
    saveUserData(userData);
    return userData;
  } catch (error) {
    console.error('Failed to import user data:', error);
    return null;
  }
}
