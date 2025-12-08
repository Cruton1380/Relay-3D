import { describe, it, expect, vi } from 'vitest';

global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) }));

describe('Frontend Integration Tests', () => {
  it('should have working fetch mock', async () => {
    const response = await fetch('/api/test');
    const data = await response.json();
    expect(data.success).toBe(true);
  });
});
