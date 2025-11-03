// Tests for PowerPay hooks
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePowerPayReports } from './usePowerPayReports';
import * as powerPayAPI from '@/api/powerPayRequests';
import { mockReports } from '@/api/mockData/powerPayMockData';

vi.mock('@/api/powerPayRequests');

describe('usePowerPayReports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch reports on mount', async () => {
    vi.mocked(powerPayAPI.getReports).mockResolvedValue(mockReports);

    const { result } = renderHook(() => usePowerPayReports());

    expect(result.current.loading).toBe(true);

    // Wait for async operation
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(result.current.loading).toBe(false);
    expect(result.current.reports).toHaveLength(2);
    expect(result.current.error).toBeNull();
  });

  it('should handle fetch errors', async () => {
    const error = new Error('Fetch failed');
    vi.mocked(powerPayAPI.getReports).mockRejectedValue(error);

    const { result } = renderHook(() => usePowerPayReports());

    // Wait for async operation
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(result.current.error).toEqual(error);
    expect(result.current.reports).toEqual([]);
  });
});
