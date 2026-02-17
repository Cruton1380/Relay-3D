/**
 * @fileoverview Tests for useSystemParameters hook
 * @version 1.0.0
 */

import { renderHook, act } from '@testing-library/react';
import { useSystemParameters } from '../../src/frontend/hooks/useSystemParameters.js';
import systemParametersService from '../../src/frontend/services/systemParametersService.js';

// Mock the system parameters service
vi.mock('../../src/frontend/services/systemParametersService.js', () => ({
  default: {
    getSystemParameters: vi.fn(),
    getParameterMetadata: vi.fn(),
    proposeParameterChange: vi.fn(),
    formatParameterValue: vi.fn()
  }
}));

describe('useSystemParameters hook', () => {
  const mockParameters = {
    voting: { threshold: 5 },
    maxSessionTime: 3600,
    security: { encryption: 'AES256' }
  };

  const mockMetadata = {
    'voting.threshold': { type: 'number', min: 1, max: 100 },
    'maxSessionTime': { type: 'number', unit: 'seconds' },
    'security.encryption': { type: 'string', options: ['AES256', 'AES128'] }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    systemParametersService.getSystemParameters.mockResolvedValue(mockParameters);
    systemParametersService.getParameterMetadata.mockResolvedValue(mockMetadata);
    systemParametersService.formatParameterValue.mockImplementation((path, value) => `${value} formatted`);
  });

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useSystemParameters());
    
    expect(result.current.isLoading).toBe(true);
    expect(result.current.parameters).toEqual({});
    expect(result.current.metadata).toEqual({});
    expect(result.current.error).toBeNull();
  });
  it('should load parameters on mount', async () => {
    const { result } = renderHook(() => useSystemParameters());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Allow for the hook to be called on mount, don't check exact call count
    expect(systemParametersService.getSystemParameters).toHaveBeenCalled();
    expect(systemParametersService.getParameterMetadata).toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.parameters).toEqual(mockParameters);
    expect(result.current.metadata).toEqual(mockMetadata);
    expect(result.current.error).toBeNull();
  });

  it('should handle loading errors', async () => {
    const errorMessage = 'Failed to load';
    systemParametersService.getSystemParameters.mockRejectedValue(new Error(errorMessage));
    
    const { result } = renderHook(() => useSystemParameters());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toContain(errorMessage);
    expect(result.current.parameters).toEqual({});
  });

  it('should reload parameters when loadParameters is called', async () => {
    const { result } = renderHook(() => useSystemParameters());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Clear previous calls
    vi.clearAllMocks();
    systemParametersService.getSystemParameters.mockResolvedValue({ newParam: 'value' });
    
    await act(async () => {
      await result.current.loadParameters();
    });

    expect(systemParametersService.getSystemParameters).toHaveBeenCalledTimes(1);
    expect(result.current.parameters).toEqual({ newParam: 'value' });
  });

  it('should propose parameter changes', async () => {
    systemParametersService.proposeParameterChange.mockResolvedValue({ success: true });
    
    const { result } = renderHook(() => useSystemParameters());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.proposeParameterChange('voting.threshold', 10);
    });

    expect(systemParametersService.proposeParameterChange).toHaveBeenCalledWith('voting.threshold', 10);
    expect(result.current.parameters.voting.threshold).toBe(10);
  });  it('should handle parameter change errors', async () => {
    const errorMessage = 'Change failed';
    systemParametersService.proposeParameterChange.mockRejectedValue(new Error(errorMessage));
    
    const { result } = renderHook(() => useSystemParameters());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // The proposeParameterChange should throw an error
    await expect(
      act(async () => {
        await result.current.proposeParameterChange('voting.threshold', 10);
      })
    ).rejects.toThrow(errorMessage);
  });

  it('should format parameter values', async () => {
    const { result } = renderHook(() => useSystemParameters());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const formatted = result.current.formatParameterValue('maxSessionTime', 3600);
    
    expect(systemParametersService.formatParameterValue).toHaveBeenCalledWith('maxSessionTime', 3600, mockMetadata);
    expect(formatted).toBe('3600 formatted');
  });

  it('should handle formatting errors gracefully', async () => {
    systemParametersService.formatParameterValue.mockImplementation(() => {
      throw new Error('Format failed');
    });
    
    const { result } = renderHook(() => useSystemParameters());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const formatted = result.current.formatParameterValue('maxSessionTime', 3600);
    
    expect(formatted).toBe(3600); // Should return raw value on error
  });

  it('should set nested parameter values correctly', async () => {
    systemParametersService.proposeParameterChange.mockResolvedValue({ success: true });
    
    const { result } = renderHook(() => useSystemParameters());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.proposeParameterChange('security.newParam', 'newValue');
    });

    expect(result.current.parameters.security.newParam).toBe('newValue');
    expect(result.current.parameters.security.encryption).toBe('AES256'); // Should preserve existing values
  });
});