/**
 * Integration test for Advanced Analytics Dashboard
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import AdvancedAnalyticsDashboard from '../../src/frontend/components/visualizations/AdvancedAnalyticsDashboard';

// Mock D3 library completely
vi.mock('d3', () => {
  const mockSelection = {
    selectAll: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    append: vi.fn().mockReturnThis(),
    attr: vi.fn().mockReturnThis(),
    style: vi.fn().mockReturnThis(),
    text: vi.fn().mockReturnThis(),
    remove: vi.fn().mockReturnThis(),
    data: vi.fn().mockReturnThis(),
    enter: vi.fn().mockReturnThis(),
    exit: vi.fn().mockReturnThis(),
    transition: vi.fn().mockReturnThis(),
    duration: vi.fn().mockReturnThis(),
    call: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    merge: vi.fn().mockReturnThis(),
    join: vi.fn().mockReturnThis(),
    classed: vi.fn().mockReturnThis(),
    property: vi.fn().mockReturnThis(),
    datum: vi.fn().mockReturnThis(),
    each: vi.fn().mockReturnThis(),
    filter: vi.fn().mockReturnThis(),
    sort: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    raise: vi.fn().mockReturnThis(),
    lower: vi.fn().mockReturnThis(),
    html: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    empty: vi.fn(() => false),
    node: vi.fn(() => ({ getBBox: () => ({ width: 100, height: 20 }) })),
    nodes: vi.fn(() => []),
    size: vi.fn(() => 0)
  };

  return {
    select: vi.fn(() => mockSelection),
    selectAll: vi.fn(() => mockSelection),
    scaleLinear: vi.fn(() => ({
      domain: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      nice: vi.fn().mockReturnThis(),
      ticks: vi.fn(() => []),
      tickFormat: vi.fn(() => () => ''),
      copy: vi.fn().mockReturnThis(),
      invert: vi.fn(() => 0),
      bandwidth: vi.fn(() => 0),
      step: vi.fn(() => 0)
    })),
    scaleTime: vi.fn(() => ({
      domain: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      nice: vi.fn().mockReturnThis(),
      ticks: vi.fn(() => []),
      tickFormat: vi.fn(() => () => ''),
      copy: vi.fn().mockReturnThis(),
      invert: vi.fn(() => new Date()),
      bandwidth: vi.fn(() => 0),
      step: vi.fn(() => 0)
    })),
    scaleBand: vi.fn(() => ({
      domain: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      padding: vi.fn().mockReturnThis(),
      paddingInner: vi.fn().mockReturnThis(),
      paddingOuter: vi.fn().mockReturnThis(),
      bandwidth: vi.fn(() => 50),
      step: vi.fn(() => 60)
    })),
    axisBottom: vi.fn(() => vi.fn()),
    axisLeft: vi.fn(() => vi.fn()),
    line: vi.fn(() => {
      const lineFunc = vi.fn(() => 'M0,0L100,100');
      lineFunc.x = vi.fn().mockReturnThis();
      lineFunc.y = vi.fn().mockReturnThis();
      lineFunc.curve = vi.fn().mockReturnThis();
      return lineFunc;
    }),
    area: vi.fn(() => {
      const areaFunc = vi.fn(() => 'M0,0L100,100Z');
      areaFunc.x = vi.fn().mockReturnThis();
      areaFunc.y0 = vi.fn().mockReturnThis();
      areaFunc.y1 = vi.fn().mockReturnThis();
      areaFunc.curve = vi.fn().mockReturnThis();
      return areaFunc;
    }),
    curveBasis: {},
    curveLinear: {},
    curveMonotoneX: {},
    extent: vi.fn(() => [0, 100]),
    max: vi.fn(() => 100),
    min: vi.fn(() => 0),
    bisector: vi.fn(() => ({
      left: vi.fn(() => 0),
      right: vi.fn(() => 0)
    })),
    timeFormat: vi.fn(() => () => ''),
    timeParse: vi.fn(() => () => new Date()),
    zoom: vi.fn(() => ({
      scaleExtent: vi.fn().mockReturnThis(),
      extent: vi.fn().mockReturnThis(),
      on: vi.fn().mockReturnThis()
    })),
    brush: vi.fn(() => ({
      extent: vi.fn().mockReturnThis(),
      on: vi.fn().mockReturnThis()
    })),
    event: null,
    mouse: vi.fn(() => [0, 0]),
    pointer: vi.fn(() => [0, 0])
  };
});

// Mock dependencies
vi.mock('../../src/frontend/auth/context/useAuth', () => ({
  useAuth: () => ({
    user: { token: 'mock-token' }
  })
}));

vi.mock('../../src/frontend/hooks/useWebSocket', () => ({
  useWebSocket: () => ({
    subscribe: vi.fn(),
    unsubscribe: vi.fn()
  })
}));

// Mock analytics components that use D3
vi.mock('../../src/frontend/components/analytics/TimelineAnalytics', () => ({
  default: ({ topicRowId }) => (
    <div className="timeline-analytics">
      <div className="timeline-controls">
        <div className="filter-group">
          <label>Time Range:</label>
          <select>
            <option value="1h">Last Hour</option>
            <option value="6h">Last 6 Hours</option>
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Smoothing:</label>
          <select>
            <option value="none">None</option>
            <option value="light">Light</option>
            <option value="moderate">Moderate</option>
            <option value="heavy">Heavy</option>
          </select>
        </div>
        <div className="filter-group">
          <label><input type="checkbox" checked /> Show Annotations</label>
        </div>
      </div>
      <div className="line-toggles">
        <label className="line-toggle"><input type="checkbox" checked /><span className="line-toggle-color"></span>Active Users</label>
        <label className="line-toggle"><input type="checkbox" /><span className="line-toggle-color"></span>Inactive Users</label>
        <label className="line-toggle"><input type="checkbox" /><span className="line-toggle-color"></span>Foreign Users</label>
        <label className="line-toggle"><input type="checkbox" checked /><span className="line-toggle-color"></span>Local Users</label>
        <label className="line-toggle"><input type="checkbox" checked /><span className="line-toggle-color"></span>Regional Users</label>
      </div>
      <div className="timeline-chart">
        <svg className="timeline-svg" width="600" height="300"></svg>
      </div>
      <div className="timeline-statistics">
        <div className="stat-group">
          <div className="stat-label">Total Data Points:</div>
          <div className="stat-value">0</div>
        </div>
        <div className="stat-group">
          <div className="stat-label">Time Span:</div>
          <div className="stat-value"></div>
        </div>
        <div className="stat-group">
          <div className="stat-label">Last Updated:</div>
          <div className="stat-value">Invalid Date</div>
        </div>
      </div>
    </div>
  )
}));

vi.mock('../../src/frontend/components/analytics/GlobeAnalytics', () => ({
  default: ({ topicRowId }) => (
    <div className="globe-analytics">
      <div className="globe-controls">
        <div className="control-section">
          <h4>Filters</h4>
          <div className="control-group">
            <label>User Types:</label>
            <select multiple>
              <option value="active">Active Users</option>
              <option value="inactive">Inactive Users</option>
              <option value="local">Local Users</option>
              <option value="foreign">Foreign Users</option>
              <option value="proximity">Proximity Users</option>
            </select>
          </div>
          <div className="control-group">
            <label>Time Range:</label>
            <select>
              <option value="1h">Last Hour</option>
              <option value="6h">Last 6 Hours</option>
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last Week</option>
              <option value="30d">Last Month</option>
            </select>
          </div>
          <div className="control-group">
            <label>Privacy Level:</label>
            <select>
              <option value="minimal">Minimal</option>
              <option value="moderate">Moderate</option>
              <option value="maximum">Maximum</option>
            </select>
          </div>
        </div>
        <div className="control-section">
          <h4>Display</h4>
          <div className="control-group">
            <label><input type="checkbox" checked /> Show Clusters</label>
          </div>
          <div className="control-group">
            <label><input type="checkbox" checked /> Show Labels</label>
          </div>
          <div className="control-group">
            <label><input type="checkbox" /> Auto Rotate</label>
          </div>
        </div>
        <div className="control-section">
          <h4>Regions</h4>
          <div className="region-selector"></div>
        </div>
      </div>
      <div className="globe-container">
        <canvas className="globe-canvas" width="600" height="400"></canvas>
        <div className="globe-stats">
          <div className="stat-item">
            <span className="stat-label">Total Votes:</span>
            <span className="stat-value">100</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Active Regions:</span>
            <span className="stat-value">3</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Last Update:</span>
            <span className="stat-value">Invalid Date</span>
          </div>
        </div>
      </div>
    </div>
  )
}));

vi.mock('../../src/frontend/components/visualizations/UserActivityAnalytics', () => ({
  default: ({ compact }) => (
    <div className={`user-activity-analytics ${compact ? 'compact' : ''}`}>
      <div className="error-message">
        <h3>Analytics Unavailable</h3>
        <p>Unknown URL</p>
        <button className="retry-button">Retry</button>
      </div>
    </div>
  )
}));

// Mock fetch
global.fetch = vi.fn();

describe('Advanced Analytics Dashboard', () => {
  beforeEach(() => {
    // Reset mocks
    fetch.mockClear();
    
    // Mock successful API responses for all endpoints
    fetch.mockImplementation((url) => {
      if (url.includes('/api/analytics/topic-rows')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: {
              topicRows: [
                {
                  id: 'topic-1',
                  title: 'Test Topic',
                  voteCount: 100,
                  lastActivity: Date.now(),
                  activeRegions: ['NA'],
                  participantCount: 50
                }
              ]
            }
          })
        });
      }
      
      if (url.includes('/api/analytics/globe/initialize')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: { initialized: true }
          })
        });
      }
      
      if (url.includes('/api/analytics/timeline/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: {
              metadata: { topicRowId: 'topic-1' },
              trackingLines: {},
              aggregateMetrics: {},
              totalVotes: 100
            }
          })
        });
      }

      if (url.includes('/api/analytics/filters')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: {
              timeRanges: ['1h', '6h', '24h', '7d', '30d'],
              userTypes: ['active', 'inactive', 'local', 'foreign'],
              privacyLevels: ['minimal', 'moderate', 'maximum']
            }
          })
        });
      }

      if (url.includes('/api/analytics/timeline')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: {
              trackingLines: {
                active: { data: [], color: '#007bff', visible: true },
                local: { data: [], color: '#28a745', visible: true }
              },
              aggregateMetrics: { totalVotes: 100, peakVotingHour: new Date() },
              totalDataPoints: 0,
              timeSpan: { start: new Date(), end: new Date() }
            }
          })
        });
      }
      
      if (url.includes('/api/analytics/globe/') && url.includes('/voting-users')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: {
              userPlots: [],
              regionalBoundaries: [],
              availableRegions: [],
              totalVotes: 100,
              activeRegions: 3
            }
          })
        });
      }

      if (url.includes('/api/analytics/globe')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: {
              userPlots: [],
              regionalBoundaries: [],
              availableRegions: [],
              totalVotes: 100,
              activeRegions: 3
            }
          })
        });
      }

      if (url.includes('/api/analytics/activity')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: {
              userActivity: [],
              totalUsers: 100,
              activeUsers: 50
            }
          })
        });
      }
      
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  it('renders the dashboard with default view', async () => {
    render(<AdvancedAnalyticsDashboard topicRowId="topic-1" />);
    
    expect(screen.getByText('Advanced Analytics Dashboard')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });
  });

  it('displays view navigation tabs', async () => {
    render(<AdvancedAnalyticsDashboard topicRowId="topic-1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Timeline')).toBeInTheDocument();
      expect(screen.getByText('Globe')).toBeInTheDocument();
      expect(screen.getByText('Activity')).toBeInTheDocument();
      expect(screen.getByText('Compare')).toBeInTheDocument();
    });
  });
  it('switches between different views', async () => {
    render(<AdvancedAnalyticsDashboard topicRowId="topic-1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Timeline')).toBeInTheDocument();
    });
    
    // Click on Timeline tab
    const timelineButton = screen.getByText('Timeline').closest('button');
    fireEvent.click(timelineButton);
    
    // Should show timeline view - check that the button has active class
    await waitFor(() => {
      expect(timelineButton).toHaveClass('active');
    });
  });

  it('displays topic row selector', async () => {
    render(<AdvancedAnalyticsDashboard topicRowId="topic-1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Topic Row:')).toBeInTheDocument();
    });
  });  it('displays global filter controls', async () => {
    render(<AdvancedAnalyticsDashboard topicRowId="topic-1" />);
    
    // Wait for the dashboard to load first
    await waitFor(() => {
      expect(screen.getByText('Advanced Analytics Dashboard')).toBeInTheDocument();
    });

    // Then wait for filter controls to appear
    await waitFor(() => {
      // Look for specific text that indicates filter controls are present
      const timeRangeOptions = screen.getAllByText('Last 24 hours');
      expect(timeRangeOptions.length).toBeGreaterThan(0);
    }, { timeout: 15000 });

    // Check for privacy controls
    await waitFor(() => {
      const privacyOptions = screen.getAllByText('Maximum');
      expect(privacyOptions.length).toBeGreaterThan(0);
    }, { timeout: 5000 });
  });

  it('displays export button', async () => {
    render(<AdvancedAnalyticsDashboard topicRowId="topic-1" />);
    
    await waitFor(() => {
      expect(screen.getByText('📥 Export Data')).toBeInTheDocument();
    });
  });
  it('handles filter changes', async () => {
    render(<AdvancedAnalyticsDashboard topicRowId="topic-1" />);
    
    await waitFor(() => {
      const dashboardTimeRangeSelects = screen.getAllByDisplayValue('Last 24 hours');
      expect(dashboardTimeRangeSelects.length).toBeGreaterThan(0);
    });
    
    // Change time range - target the first time range selector (in dashboard controls)
    const timeRangeSelects = screen.getAllByDisplayValue('Last 24 hours');
    const dashboardTimeRangeSelect = timeRangeSelects[0]; // First one is in dashboard controls
    fireEvent.change(dashboardTimeRangeSelect, { target: { value: '7d' } });
    
    // Should update the filter
    expect(dashboardTimeRangeSelect.value).toBe('7d');
  });

  it('shows loading state initially', () => {
    render(<AdvancedAnalyticsDashboard topicRowId="topic-1" />);
    
    // Should show loading overlay initially
    expect(screen.getByText('Loading analytics data...')).toBeInTheDocument();
  });

  it('displays real-time indicator when enabled', async () => {
    render(<AdvancedAnalyticsDashboard topicRowId="topic-1" realTimeUpdates={true} />);
    
    await waitFor(() => {
      expect(screen.getByText('Live Updates')).toBeInTheDocument();
    });
  });

  it('fetches data on mount', async () => {
    render(<AdvancedAnalyticsDashboard topicRowId="topic-1" />);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/analytics/topic-rows',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token'
          })
        })
      );
    });
  });
  it('handles API errors gracefully', async () => {
    // Mock API error for the first fetch call
    fetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      })
    );
    
    render(<AdvancedAnalyticsDashboard topicRowId="topic-1" />);
    
    // Should not crash and should handle error
    await waitFor(() => {
      expect(screen.getByText('Advanced Analytics Dashboard')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});

describe('Analytics Components Integration', () => {
  it('integrates Timeline and Globe components in overview', async () => {
    render(<AdvancedAnalyticsDashboard topicRowId="topic-1" />);
    
    await waitFor(() => {
      // Should show overview layout with both components
      expect(screen.getByText('📈 Timeline Analysis')).toBeInTheDocument();
      expect(screen.getByText('🌍 Geographic Distribution')).toBeInTheDocument();
      expect(screen.getByText('👥 Activity Overview')).toBeInTheDocument();
    });
  });

  it('shows comparison view placeholder', async () => {
    render(<AdvancedAnalyticsDashboard topicRowId="topic-1" />);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Compare'));
    });
    
    await waitFor(() => {
      expect(screen.getByText('🔄 Topic Row Comparison')).toBeInTheDocument();
      expect(screen.getByText('Multi-topic row comparison view coming soon...')).toBeInTheDocument();
    });
  });
});
