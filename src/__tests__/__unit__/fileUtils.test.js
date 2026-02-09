import { getDir } from '../../utils/fileUtils.js';

import { describe, expect, it } from 'vitest';

describe('File Utils', () => {
  it('should return undefined', () => {
    expect(getDir()).toBeUndefined();
  });
  it('should return absolute path', () => {
    expect(getDir(import.meta.url)).toBe(
      '/home/okashi/Project/Main/videoTube/src/__tests__/__unit__',
    );
  });
});
