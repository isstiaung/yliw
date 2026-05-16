'use client';

import React from 'react';
import {
  FaBirthdayCake,
  FaHeart,
  FaRing,
  FaBaby,
  FaHome,
  FaCar,
  FaPlane,
  FaBriefcase,
  FaUserTie,
  FaMoneyBillWave,
  FaMedkit,
  FaDumbbell,
  FaRunning,
  FaMusic,
  FaCamera,
  FaBook,
  FaTrophy,
  FaStar,
  FaGift,
  FaUmbrella,
  FaMountain,
  FaGamepad,
  FaPalette,
  FaTheaterMasks,
  FaFilm,
  FaMicrophone,
  FaGuitar,
  FaPizzaSlice,
  FaCoffee,
  FaWineGlass,
  FaDog,
  FaCat,
  FaTree,
  FaSeedling,
  FaSun,
  FaMoon,
  FaSnowflake,
  FaFire,
  FaLightbulb,
  FaRocket,
  FaAnchor,
  FaCompass,
  FaMapMarkedAlt,
  FaFlag,
  FaCrown,
  FaGem,
  FaMagic,
  FaFeather,
  FaSchool,
  FaGraduationCap,
  FaMoneyBill,
  FaBatteryEmpty,
} from 'react-icons/fa';
import { IconType } from 'react-icons';

interface IconOption {
  name: string;
  icon: IconType;
  category: string;
}

const iconOptions: IconOption[] = [
  // Life Milestones
  { name: 'Birthday', icon: FaBirthdayCake, category: 'Life' },
  { name: 'Graduation', icon: FaGraduationCap, category: 'Life' },
  { name: 'Love', icon: FaHeart, category: 'Life' },
  { name: 'Marriage', icon: FaRing, category: 'Life' },
  { name: 'Baby', icon: FaBaby, category: 'Life' },
  { name: 'Home', icon: FaHome, category: 'Life' },
  
  // Travel & Transport
  { name: 'Car', icon: FaCar, category: 'Travel' },
  { name: 'Plane', icon: FaPlane, category: 'Travel' },
  { name: 'Mountain', icon: FaMountain, category: 'Travel' },
  { name: 'Umbrella', icon: FaUmbrella, category: 'Travel' },
  { name: 'Map', icon: FaMapMarkedAlt, category: 'Travel' },
  { name: 'Compass', icon: FaCompass, category: 'Travel' },
  
  // Work & Career
  { name: 'Briefcase', icon: FaBriefcase, category: 'Work' },
  { name: 'Business', icon: FaUserTie, category: 'Work' },
  { name: 'Money', icon: FaMoneyBillWave, category: 'Work' },
  { name: 'Trophy', icon: FaTrophy, category: 'Work' },
  { name: 'Star', icon: FaStar, category: 'Work' },
  { name: 'Crown', icon: FaCrown, category: 'Work' },
  { name : "School", icon: FaSchool, category: 'Work' },
  { name : "Job", icon: FaMoneyBill, category: 'Work' },
  { name : "Break", icon: FaBatteryEmpty, category: 'Work' },
  
  // Health & Fitness
  { name: 'Medical', icon: FaMedkit, category: 'Health' },
  { name: 'Gym', icon: FaDumbbell, category: 'Health' },
  { name: 'Running', icon: FaRunning, category: 'Health' },
  
  // Hobbies & Entertainment
  { name: 'Music', icon: FaMusic, category: 'Hobbies' },
  { name: 'Camera', icon: FaCamera, category: 'Hobbies' },
  { name: 'Book', icon: FaBook, category: 'Hobbies' },
  { name: 'Gaming', icon: FaGamepad, category: 'Hobbies' },
  { name: 'Art', icon: FaPalette, category: 'Hobbies' },
  { name: 'Theater', icon: FaTheaterMasks, category: 'Hobbies' },
  { name: 'Film', icon: FaFilm, category: 'Hobbies' },
  { name: 'Microphone', icon: FaMicrophone, category: 'Hobbies' },
  { name: 'Guitar', icon: FaGuitar, category: 'Hobbies' },
  
  // Food & Social
  { name: 'Pizza', icon: FaPizzaSlice, category: 'Social' },
  { name: 'Coffee', icon: FaCoffee, category: 'Social' },
  { name: 'Wine', icon: FaWineGlass, category: 'Social' },
  { name: 'Gift', icon: FaGift, category: 'Social' },
  
  // Pets & Nature
  { name: 'Dog', icon: FaDog, category: 'Nature' },
  { name: 'Cat', icon: FaCat, category: 'Nature' },
  { name: 'Tree', icon: FaTree, category: 'Nature' },
  { name: 'Seedling', icon: FaSeedling, category: 'Nature' },
  
  // Weather & Seasons
  { name: 'Sun', icon: FaSun, category: 'Weather' },
  { name: 'Moon', icon: FaMoon, category: 'Weather' },
  { name: 'Snow', icon: FaSnowflake, category: 'Weather' },
  { name: 'Fire', icon: FaFire, category: 'Weather' },
  
  // Special
  { name: 'Lightbulb', icon: FaLightbulb, category: 'Special' },
  { name: 'Rocket', icon: FaRocket, category: 'Special' },
  { name: 'Anchor', icon: FaAnchor, category: 'Special' },
  { name: 'Flag', icon: FaFlag, category: 'Special' },
  { name: 'Gem', icon: FaGem, category: 'Special' },
  { name: 'Magic', icon: FaMagic, category: 'Special' },
  { name: 'Feather', icon: FaFeather, category: 'Special' },
];

interface IconPickerProps {
  selectedIcon: string;
  onIconSelect: (iconName: string) => void;
  className?: string;
}

export default function IconPicker({ selectedIcon, onIconSelect, className = '' }: IconPickerProps) {
  const categories = Array.from(new Set(iconOptions.map(option => option.category)));

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-sm font-medium text-[var(--ink)]">Icon</div>

      {categories.map(category => (
        <div key={category} className="space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--muted)]">
            {category}
          </div>
          <div className="grid grid-cols-8 gap-2">
            {iconOptions
              .filter(option => option.category === category)
              .map(option => {
                const IconComponent = option.icon;
                const isSelected = selectedIcon === option.name;
                
                return (
                  <button
                    key={option.name}
                    type="button"
                    onClick={() => onIconSelect(option.name)}
                    className={`
                      p-2 rounded-md border transition-all duration-150 hover:scale-105
                      ${isSelected
                        ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                        : 'border-[var(--line)] hover:border-[var(--muted)]/50 text-[var(--muted)] hover:text-[var(--ink)]'
                      }
                    `}
                    title={option.name}
                  >
                    <IconComponent className="w-4 h-4 mx-auto" />
                  </button>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function getIconComponent(iconName: string): IconType | null {
  const iconOption = iconOptions.find(option => option.name === iconName);
  return iconOption ? iconOption.icon : null;
}

export { iconOptions };
