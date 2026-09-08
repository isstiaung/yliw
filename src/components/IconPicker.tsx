'use client';

import React from 'react';
import { iconOptions, getIconComponent } from '@/utils/icons';

// Re-exported so existing imports of the picker keep working.
export { getIconComponent, iconOptions };

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
