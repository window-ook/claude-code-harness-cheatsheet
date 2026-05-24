import {
  RefreshCw,
  Sun,
  Moon,
  Search,
  X,
  ChevronDown,
  ChevronRight,
  Circle,
  Sparkles,
  Terminal,
  Bot,
} from 'lucide-react';

type IconProps = {
  size?: number;
  className?: string;
};

export function RefreshIcon({ size = 14, className }: IconProps) {
  return <RefreshCw size={size} className={className} />;
}

export function SunIcon({ size = 14, className }: IconProps) {
  return <Sun size={size} className={className} />;
}

export function MoonIcon({ size = 14, className }: IconProps) {
  return <Moon size={size} className={className} />;
}

export function SearchIcon({ size = 14, className }: IconProps) {
  return <Search size={size} className={className} />;
}

export function ClearIcon({ size = 14, className }: IconProps) {
  return <X size={size} className={className} />;
}

type ChevronProps = IconProps & { expanded: boolean };
export function ChevronIcon({ expanded, size = 14, className }: ChevronProps) {
  return expanded ? (
    <ChevronDown size={size} className={className} />
  ) : (
    <ChevronRight size={size} className={className} />
  );
}

export function DotIcon({ size = 6, className }: IconProps) {
  return <Circle size={size} fill="currentColor" className={className} />;
}

import type { Kind } from '../types';

type KindIconProps = IconProps & { kind: Kind };
export function KindIcon({ kind, size = 14, className }: KindIconProps) {
  if (kind === 'skills') return <Sparkles size={size} className={className} />;
  if (kind === 'commands') return <Terminal size={size} className={className} />;
  return <Bot size={size} className={className} />;
}
