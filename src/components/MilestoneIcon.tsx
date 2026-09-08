'use client';

import React from 'react';
import { getIconComponent } from '@/utils/icons';

interface MilestoneIconProps {
  /** Icon name as stored on the event, e.g. "Graduation". */
  name: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Renders a milestone icon by name.
 *
 * The lookup happens inside this stable component and renders through
 * createElement rather than in the caller. Resolving the icon in the caller
 * and rendering the result as <IconComponent /> is what React's
 * static-components rule flags: it makes the element type a value computed
 * during render, so React cannot rely on its identity across renders.
 */
export default function MilestoneIcon({ name, className, style }: MilestoneIconProps) {
  const Icon = getIconComponent(name);
  if (!Icon) return null;
  return React.createElement(Icon, { className, style });
}
