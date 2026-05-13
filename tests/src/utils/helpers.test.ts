import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  cn,
  formatDate,
  formatDuration,
  formatCurrency,
  formatPercentage,
  debounce,
  throttle,
  generateId,
  truncate,
  capitalize,
  slugify,
  getInitials,
  isValidEmail,
  calculateScore,
} from '@ai4a/shared';

describe('Helper Functions', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const formatted = formatDate(date);
      
      expect(formatted).toContain('2024');
      expect(formatted).toContain('January');
      expect(formatted).toContain('15');
    });

    it('should handle string dates', () => {
      const formatted = formatDate('2024-06-20');
      expect(formatted).toContain('2024');
    });
  });

  describe('formatDuration', () => {
    it('should format minutes only', () => {
      expect(formatDuration(30)).toBe('30 min');
      expect(formatDuration(59)).toBe('59 min');
    });

    it('should format hours and minutes', () => {
      expect(formatDuration(60)).toBe('1h');
      expect(formatDuration(90)).toBe('1h 30m');
      expect(formatDuration(120)).toBe('2h');
      expect(formatDuration(150)).toBe('2h 30m');
    });
  });

  describe('formatCurrency', () => {
    it('should format USD correctly', () => {
      expect(formatCurrency(50000)).toContain('50');
      expect(formatCurrency(100000)).toContain('100');
    });

    it('should handle different currencies', () => {
      const usd = formatCurrency(50000, 'USD');
      const eur = formatCurrency(50000, 'EUR');
      
      expect(usd).not.toBe(eur);
    });
  });

  describe('formatPercentage', () => {
    it('should convert decimal to percentage', () => {
      expect(formatPercentage(0.5)).toBe('50%');
      expect(formatPercentage(0.75)).toBe('75%');
      expect(formatPercentage(1)).toBe('100%');
      expect(formatPercentage(0)).toBe('0%');
    });
  });

  describe('debounce', () => {
    it('should delay function execution', async () => {
      vi.useFakeTimers();
      
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);
      
      debouncedFn();
      expect(mockFn).not.toHaveBeenCalled();
      
      vi.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);
      
      vi.useRealTimers();
    });
  });

  describe('throttle', () => {
    it('should limit function calls', async () => {
      vi.useFakeTimers();
      
      const mockFn = vi.fn();
      const throttledFn = throttle(mockFn, 100);
      
      throttledFn();
      throttledFn();
      throttledFn();
      
      expect(mockFn).toHaveBeenCalledTimes(1);
      
      vi.advanceTimersByTime(100);
      throttledFn();
      
      expect(mockFn).toHaveBeenCalledTimes(2);
      
      vi.useRealTimers();
    });
  });

  describe('generateId', () => {
    it('should generate unique ids', () => {
      const id1 = generateId('test');
      const id2 = generateId('test');
      
      expect(id1).toMatch(/^test_\d+_\w+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('truncate', () => {
    it('should truncate long strings', () => {
      const longString = 'This is a very long string that should be truncated';
      const truncated = truncate(longString, 20);
      
      expect(truncated.length).toBeLessThanOrEqual(23); // 20 + '...'
      expect(truncated).toContain('...');
    });

    it('should not truncate short strings', () => {
      const shortString = 'Short';
      const result = truncate(shortString, 20);
      
      expect(result).toBe('Short');
    });
  });

  describe('capitalize', () => {
    it('should capitalize first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('world')).toBe('World');
    });
  });

  describe('slugify', () => {
    it('should convert string to slug', () => {
      expect(slugify('Hello World')).toBe('hello-world');
      expect(slugify('Special@Characters!')).toBe('specialcharacters');
      expect(slugify('  Spaces  ')).toBe('spaces');
    });
  });

  describe('getInitials', () => {
    it('should get initials from name', () => {
      expect(getInitials('John Doe')).toBe('JD');
      expect(getInitials('Alice')).toBe('AL');
      expect(getInitials('John Michael Doe')).toBe('JM');
    });
  });

  describe('isValidEmail', () => {
    it('should validate emails correctly', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('no@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
    });
  });

  describe('calculateScore', () => {
    it('should calculate percentage correctly', () => {
      expect(calculateScore(5, 10)).toBe(50);
      expect(calculateScore(3, 4)).toBe(75);
      expect(calculateScore(10, 10)).toBe(100);
    });

    it('should handle zero total', () => {
      expect(calculateScore(0, 0)).toBe(0);
    });
  });
});
