/**
 * The icon registry: the catalogue of milestone icons and the lookup from a
 * stored icon name to its component.
 *
 * This is deliberately a plain module rather than part of IconPicker. The CSV
 * importer needs to validate icon names, and a pure parser should not have to
 * import a `'use client'` React component — and everything that did import it
 * pulled the whole picker UI along with it.
 */

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
import { isValidElement, ReactElement, ReactNode } from 'react';

export interface IconOption {
  name: string;
  icon: IconType;
  category: string;
}

export const iconOptions: IconOption[] = [
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

/** Resolve a stored icon name to its component, or null if unknown. */
export function getIconComponent(iconName: string): IconType | null {
  const iconOption = iconOptions.find(option => option.name === iconName);
  return iconOption ? iconOption.icon : null;
}

export interface SvgNode {
  tag: string;
  attrs: Record<string, string>;
  children: SvgNode[];
}

export interface IconShape {
  viewBox: string;
  nodes: SvgNode[];
}

const camelToKebab = (name: string) => (name === 'viewBox' ? name : name.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`));

function toSvgNodes(node: ReactNode): SvgNode[] {
  if (Array.isArray(node)) return node.flatMap(toSvgNodes);
  if (!isValidElement(node) || typeof node.type !== 'string') return [];
  const { children, ...props } = node.props as Record<string, unknown> & { children?: ReactNode };
  const attrs: Record<string, string> = {};
  for (const [key, value] of Object.entries(props)) {
    if (typeof value === 'string' || typeof value === 'number') attrs[camelToKebab(key)] = String(value);
  }
  return [{ tag: node.type, attrs, children: toSvgNodes(children) }];
}

const shapeCache = new Map<string, IconShape | null>();

/**
 * An icon's raw SVG shapes, for the poster export, which writes markup rather
 * than rendering React.
 *
 * react-icons components are plain functions that return an IconBase element
 * carrying the viewBox in `attr` and the shapes as children, so calling one
 * reads its data without rendering anything. That shape is react-icons'
 * internals, not its API: anything unexpected gives null and the poster just
 * leaves the icon out. A test checks every icon in the catalogue still yields one.
 */
export function getIconShape(iconName: string): IconShape | null {
  if (shapeCache.has(iconName)) return shapeCache.get(iconName)!;
  let shape: IconShape | null = null;
  const Icon = getIconComponent(iconName);
  if (Icon) {
    const element = Icon({}) as ReactElement<{ attr?: { viewBox?: unknown }; children?: ReactNode }> | null;
    const viewBox = isValidElement(element) ? element.props.attr?.viewBox : undefined;
    const nodes = isValidElement(element) ? toSvgNodes(element.props.children) : [];
    if (typeof viewBox === 'string' && nodes.length > 0) shape = { viewBox, nodes };
  }
  shapeCache.set(iconName, shape);
  return shape;
}
