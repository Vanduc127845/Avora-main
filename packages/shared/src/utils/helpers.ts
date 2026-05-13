type ClassValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Record<string, boolean | null | undefined>
  | ClassValue[];

export function cn(...inputs: ClassValue[]): string {
  const classes: string[] = [];

  const visit = (input: ClassValue) => {
    if (!input) return;
    if (typeof input === 'string' || typeof input === 'number') {
      classes.push(String(input));
      return;
    }
    if (Array.isArray(input)) {
      input.forEach(visit);
      return;
    }
    if (typeof input === 'object') {
      Object.entries(input).forEach(([key, value]) => {
        if (value) classes.push(key);
      });
    }
  };

  inputs.forEach(visit);
  return classes.join(' ');
}

export function formatDate(date: Date | string): string {
  const value = typeof date === 'string' ? new Date(date) : date;
  return value.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercentage(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function debounce<T extends (...args: any[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

export function throttle<T extends (...args: any[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (inThrottle) return;

    func(...args);
    inThrottle = true;
    setTimeout(() => {
      inThrottle = false;
    }, limit);
  };
}

export function generateId(prefix = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

export function truncate(value: string, length: number): string {
  if (value.length <= length) return value;
  return `${value.slice(0, length)}...`;
}

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function calculateScore(current: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((current / total) * 100);
}
