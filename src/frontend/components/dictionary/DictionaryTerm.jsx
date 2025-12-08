import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import './DictionaryTerm.css';

/**
 * DictionaryTerm component - Renders interactive dictionary terms
 * This component handles hover previews and click interactions for dictionary terms
 */
const DictionaryTerm = ({ 
  children, 
  topicRow, 
  userId, 
  options = {}
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const [termInfo, setTermInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  const { 
    showPreviewOnHover = true, 
    previewDelay = 300, 
    enableClick = true,
    maxPreviewLength = 100
  } = options;
  
  // Timer ref for hover delay
  const timerRef = React.useRef(null);
  
  /**
   * Fetch term information from API
   */
  const fetchTermInfo = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/dictionary/term/${encodeURIComponent(topicRow)}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch term information');
      }
      
      const data = await response.json();
      setTermInfo(data);
    } catch (err) {
      console.error('Error fetching dictionary term info:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [topicRow]);
  
  /**
   * Handle mouse enter event with delay
   */
  const handleMouseEnter = () => {
    if (!showPreviewOnHover) return;
    
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // Set a timer for preview delay
    timerRef.current = setTimeout(() => {
      setIsHovering(true);
      // Only fetch if we don't have data yet
      if (!termInfo && !isLoading) {
        fetchTermInfo();
      }
    }, previewDelay);
  };
  
  /**
   * Handle mouse leave event
   */
  const handleMouseLeave = () => {
    // Clear any pending timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    setIsHovering(false);
  };
  
  /**
   * Handle term click
   */
  const handleClick = (e) => {
    if (!enableClick) return;
    
    e.preventDefault();
    navigate(`/dictionary/term/${encodeURIComponent(topicRow)}`);
  };
  
  /**
   * Clean up on unmount
   */
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);
  
  /**
   * Get preview content based on term info
   */
  const getPreviewContent = () => {
    if (isLoading) {
      return <div className="dictionary-term-loading">Loading...</div>;
    }
    
    if (error) {
      return <div className="dictionary-term-error">Failed to load definition</div>;
    }
    
    if (!termInfo) {
      return <div className="dictionary-term-loading">Loading...</div>;
    }
    
    // Get top definition
    let definition = 'No definition available';
    let source = '';
    let hasCategories = false;
    
    if (termInfo.topChannels && termInfo.topChannels.length > 0) {
      definition = termInfo.topChannels[0].definition || 'Definition not provided';
      source = termInfo.topChannels[0].displayName;
      
      // Truncate if too long
      if (definition.length > maxPreviewLength) {
        definition = definition.substring(0, maxPreviewLength) + '...';
      }
    }
    
    hasCategories = termInfo.categories && termInfo.categories.length > 0;
    
    return (
      <div className="dictionary-term-preview-content">
        <div className="dictionary-term-preview-header">
          <h4>{termInfo.displayTerm}</h4>
          {hasCategories && (
            <div className="dictionary-term-categories">
              {termInfo.categories.slice(0, 2).map(cat => (
                <span 
                  key={cat.id} 
                  className="dictionary-term-category"
                  style={{ backgroundColor: cat.category?.metadata?.color || '#3498db' }}
                >
                  {cat.category.name}
                </span>
              ))}
              {termInfo.categories.length > 2 && (
                <span className="dictionary-term-category-more">
                  +{termInfo.categories.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
        
        <div className="dictionary-term-definition">
          {definition}
        </div>
        
        {source && (
          <div className="dictionary-term-source">
            Source: {source}
          </div>
        )}
        
        <div className="dictionary-term-preview-footer">
          {termInfo.topChannels && termInfo.topChannels.length > 1 && (
            <div className="dictionary-term-alternatives">
              {termInfo.topChannels.length - 1} alternative definitions available
            </div>
          )}
          <div className="dictionary-term-click-prompt">
            Click to explore full definition
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <span 
      className="dictionary-term-wrapper"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={enableClick ? handleClick : undefined}
      role={enableClick ? "button" : undefined}
      tabIndex={enableClick ? 0 : undefined}
    >
      <span className="dictionary-term-text">{children}</span>
      {isHovering && (
        <div className="dictionary-term-preview">
          {getPreviewContent()}
        </div>
      )}
    </span>
  );
};

DictionaryTerm.propTypes = {
  children: PropTypes.node.isRequired,
  topicRow: PropTypes.string.isRequired,
  userId: PropTypes.string,
  options: PropTypes.shape({
    showPreviewOnHover: PropTypes.bool,
    previewDelay: PropTypes.number,
    enableClick: PropTypes.bool,
    maxPreviewLength: PropTypes.number
  })
};

export default DictionaryTerm;
