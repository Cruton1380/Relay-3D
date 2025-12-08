// frontend/components/voting/ActivityFilterSlider.jsx
import React, { useState, useEffect } from 'react';
import { useVoting } from '../../hooks/useVoting';

const ActivityFilterSlider = ({ onChange, initialValue = 0 }) => {
  const [percentile, setPercentile] = useState(initialValue);
  const [activityStats, setActivityStats] = useState(null);
  const { getActivityMetrics } = useVoting();
  
  useEffect(() => {
    const fetchMetrics = async () => {
      const metrics = await getActivityMetrics();
      setActivityStats(metrics);
    };
    
    fetchMetrics();
  }, [getActivityMetrics]);
  
  const handleChange = (e) => {
    const value = parseInt(e.target.value, 10);
    setPercentile(value);
    onChange(value);
  };
  
  const getDescription = () => {
    if (percentile === 0) return "All users (no filtering)";
    if (percentile < 30) return "Mostly inactive users";
    if (percentile < 60) return "Moderately active users";
    if (percentile < 80) return "Active users";
    return "Highly active users";
  };
  
  if (!activityStats) return <div>Loading activity metrics...</div>;
  
  return (
    <div className="activity-filter">
      <h3>Filter by User Activity</h3>
      <div className="slider-container">
        <input
          type="range"
          min="0"
          max="90"
          step="10"
          value={percentile}
          onChange={handleChange}
          className="activity-slider"
        />
        <div className="activity-labels">
          <span>All Users</span>
          <span>Highly Active</span>
        </div>
        <div className="selected-level">
          {percentile > 0 ? 
            `${percentile}th percentile and above (${getDescription()})` : 
            'No filtering'}
        </div>
      </div>
      
      {activityStats && (
        <div className="activity-stats">
          <p><small>System average: {activityStats.averageMonthlyActivity.toFixed(1)} actions/month</small></p>
          <p><small>Standard deviation: {activityStats.standardDeviation.toFixed(1)}</small></p>
        </div>
      )}
    </div>
  );
};

export default ActivityFilterSlider;
