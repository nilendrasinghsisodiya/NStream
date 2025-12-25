import { describe, expect, it, beforeAll } from 'vitest';
import { ApiResponse } from '../../utils/ApiResponse';
describe('API Response for particular', () => {
  let response;

  beforeAll(() => {
    response = new ApiResponse(200, { test: 'test' }, 'test');
  });
  it('should be an instance of ApiResponse', () => {
    expect(response).toBeInstanceOf(ApiResponse);
  });

  it('should have all the fields passed', () => {
    expect(Object.getPrototypeOf(response)).toBe(ApiResponse.prototype);
  });
  it('should have all the assigned fileds', () => {
    expect(response.data).toEqual({ test: 'test' });
    expect(response.statusCode).toBe(200);
    expect(response.message).toBe('test');
    expect(response.success).toBe(true);
  });
  it('should not have data and statusCode', () => {
    const res = new ApiResponse();
    expect(res).toBeInstanceOf(ApiResponse);
    expect(Object.getPrototypeOf(res)).toBe(ApiResponse.prototype);
    expect(res.statusCode).toBe(undefined);
    expect(res.message).toBe('Success');
    expect(res.data).toBe(undefined);
  });
});
