import { describe, it, expect } from 'vitest';
import { escapeRegex } from '../../utils/additionalUtils.js';

describe('escapeRegex', () => {
  it('should escape special regex characters', () => {
    const input = 'hello.*+?^${}()|[]\\world';
    const expected = 'hello\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\world';
    expect(escapeRegex(input)).toBe(expected);
  });

  it('should not modify a string without special characters', () => {
    const input = 'justnormaltext';
    expect(escapeRegex(input)).toBe(input);
  });

  it('should handle empty string', () => {
    expect(escapeRegex('')).toBe('');
  });

  it('should escape only special characters and leave others intact', () => {
    const input = 'abc$def^ghi.jkl';
    const expected = 'abc\\$def\\^ghi\\.jkl';
    expect(escapeRegex(input)).toBe(expected);
  });

  it('should escape backslashes correctly', () => {
    const input = '\\';
    const expected = '\\\\';
    expect(escapeRegex(input)).toBe(expected);
  });
});
