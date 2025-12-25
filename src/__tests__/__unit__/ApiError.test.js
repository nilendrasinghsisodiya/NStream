import { it, describe, expect, beforeAll } from 'vitest';
import { ApiError } from '../../utils/ApiError';

describe('ApiError', () => {
  let error;

  beforeAll(() => {
    error = new ApiError(401, 'test');
  });
  it('should be instance of ApiError', () => {
    expect(error).toBeInstanceOf(ApiError);
  });

  it('should be instance of Error', () => {
    expect(error).toBeInstanceOf(Error);
  });
  it('should have all the fields in the prototype', () => {
    expect(Object.getPrototypeOf(error)).toBe(ApiError.prototype);
  });
  it('should have statusCode and message ', () => {
    expect(error.statusCode).toBe(401);
    expect(error.data).toBe(null);
    expect(error.message).toBe('test');
    expect(error.success).toBe(false);
  });
});
