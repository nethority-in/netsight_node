import { ErrorHandler } from '../utils/errorHandler.js';

describe('Jest setup', () => {
  it('runs tests', () => {
    expect(1 + 1).toBe(2);
  });

  it('ErrorHandler.toServiceError returns correct shape', () => {
    const result = ErrorHandler.toServiceError('Test error', 400);
    expect(result.ok).toBe(false);
    expect(result.error?.message).toBe('Test error');
    expect(result.error?.status).toBe(400); 
    expect(result.error?.code).toBe(400);
  });
});
