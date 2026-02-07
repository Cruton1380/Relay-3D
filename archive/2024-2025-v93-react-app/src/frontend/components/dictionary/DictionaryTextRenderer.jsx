/**
 * @fileoverview Dictionary Text Renderer
 * Renders text with semantic dictionary links and interactive features
 */
import React, { useState, useRef, useEffect } from 'react';
import { useDictionary } from '../../hooks/useDictionary.js';
import './DictionaryTextRenderer.css';

const DictionaryTextRenderer = ({ 
  content, 
  userId, 
  options = {},
  onTermClick,
  onTermHover 
}) => {
  const { searchTerms, getTermDefinitions, submitDefinitionVote } = useDictionary();
  const [hoveredTerm, setHoveredTerm] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [termDefinitions, setTermDefinitions] = useState(new Map());
  const hoverTimeoutRef = useRef(null);

  // Default options
  const defaultOptions = {
    enableHover: true,
    enableClick: true,
    showAllTerms: false,
    linkDensity: 0.3,
    showAmbiguityIndicators: true,
    preferredCategories: [],
    fadeInAnimation: true
  };

  const finalOptions = { ...defaultOptions, ...options };

  // Load definitions for terms when component mounts
  useEffect(() => {
    if (content?.entities?.length > 0) {
      const loadDefinitions = async () => {
        const definitionsMap = new Map();
        
        for (const entity of content.entities) {
          try {
            const definitions = await getTermDefinitions(entity.text, {
              categories: finalOptions.preferredCategories,
              includeVotes: true,
              maxResults: 5
            });
            definitionsMap.set(entity.text, definitions);
          } catch (error) {
            console.warn(`Failed to load definitions for "${entity.text}":`, error);
          }
        }
        
        setTermDefinitions(definitionsMap);
      };

      loadDefinitions();
    }
  }, [content?.entities, finalOptions.preferredCategories, getTermDefinitions]);

  const handleTermHover = (term, event) => {
    if (!finalOptions.enableHover) return;

    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    const rect = event.target.getBoundingClientRect();
    setHoverPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });

    setHoveredTerm(term);
    
    if (onTermHover) {
      onTermHover(term, event);
    }
  };

  const handleTermLeave = () => {
    // Delay hiding to allow mouse to move to popup
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredTerm(null);
    }, 200);
  };

  const handleTermClick = (term, event) => {
    if (!finalOptions.enableClick) return;

    event.preventDefault();
    event.stopPropagation();

    if (onTermClick) {
      onTermClick(term, event);
    } else {
      // Default behavior: show definitions in a modal or navigate
      console.log('Clicked term:', term);
    }
  };

  const handleDefinitionVote = async (termText, definitionId, voteType) => {
    try {
      await submitDefinitionVote(termText, definitionId, voteType, userId);
      
      // Refresh definitions to show updated vote counts
      const updatedDefinitions = await getTermDefinitions(termText, {
        categories: finalOptions.preferredCategories,
        includeVotes: true,
        maxResults: 5
      });
      
      setTermDefinitions(prev => new Map(prev.set(termText, updatedDefinitions)));
    } catch (error) {
      console.error('Failed to vote on definition:', error);
    }
  };

  const renderHoverPopup = () => {
    if (!hoveredTerm || !finalOptions.enableHover) return null;

    const definitions = termDefinitions.get(hoveredTerm.text) || [];
    const hasMultipleDefinitions = definitions.length > 1;

    return (
      <div 
        className="dictionary-hover-popup"
        style={{
          left: hoverPosition.x,
          top: hoverPosition.y,
          transform: 'translateX(-50%) translateY(-100%)'
        }}
        onMouseEnter={() => {
          if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
          }
        }}
        onMouseLeave={handleTermLeave}
      >
        <div className="dictionary-popup-header">
          <span className="dictionary-popup-term">{hoveredTerm.text}</span>
          {hasMultipleDefinitions && finalOptions.showAmbiguityIndicators && (
            <span className="dictionary-ambiguity-indicator" title="Multiple meanings available">
              🧠
            </span>
          )}
        </div>
        
        <div className="dictionary-popup-definitions">
          {definitions.length > 0 ? (
            definitions.slice(0, 3).map((def, index) => (
              <div key={def.id} className="dictionary-popup-definition">
                <div className="dictionary-definition-text">
                  {def.definition}
                </div>
                <div className="dictionary-definition-meta">
                  <span className="dictionary-definition-category">
                    {def.category}
                  </span>
                  <div className="dictionary-definition-votes">
                    <button 
                      className="dictionary-vote-btn dictionary-vote-up"
                      onClick={() => handleDefinitionVote(hoveredTerm.text, def.id, 'upvote')}
                      title="This definition is helpful"
                    >
                      ↑ {def.upvotes || 0}
                    </button>
                    <button 
                      className="dictionary-vote-btn dictionary-vote-down"
                      onClick={() => handleDefinitionVote(hoveredTerm.text, def.id, 'downvote')}
                      title="This definition is not helpful"
                    >
                      ↓ {def.downvotes || 0}
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="dictionary-popup-no-definitions">
              No definitions available. Be the first to contribute!
            </div>
          )}
        </div>
        
        {definitions.length > 3 && (
          <div className="dictionary-popup-footer">
            <button 
              className="dictionary-view-all-btn"
              onClick={() => handleTermClick(hoveredTerm, { preventDefault: () => {}, stopPropagation: () => {} })}
            >
              View all {definitions.length} definitions
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderLinkedText = () => {
    if (!content?.entities || content.entities.length === 0) {
      return <span className="dictionary-plain-text">{content?.text || ''}</span>;
    }

    const text = content.text || '';
    const entities = content.entities || [];
    
    // Sort entities by start position
    const sortedEntities = [...entities].sort((a, b) => a.start - b.start);
    
    // Apply link density limit
    const maxLinks = Math.floor(sortedEntities.length * finalOptions.linkDensity);
    const selectedEntities = sortedEntities.slice(0, maxLinks);
    
    const result = [];
    let lastIndex = 0;

    selectedEntities.forEach((entity, index) => {
      // Add text before the entity
      if (entity.start > lastIndex) {
        result.push(
          <span key={`text-${index}`} className="dictionary-plain-text">
            {text.slice(lastIndex, entity.start)}
          </span>
        );
      }

      // Determine if term has multiple definitions
      const definitions = termDefinitions.get(entity.text) || [];
      const hasMultipleDefinitions = definitions.length > 1;
      const isAmbiguous = hasMultipleDefinitions && finalOptions.showAmbiguityIndicators;

      // Add the linked entity
      result.push(
        <span
          key={`entity-${index}`}
          className={`dictionary-linked-term ${isAmbiguous ? 'dictionary-ambiguous' : ''} ${
            finalOptions.fadeInAnimation ? 'dictionary-fade-in' : ''
          }`}
          onMouseEnter={(e) => handleTermHover(entity, e)}
          onMouseLeave={handleTermLeave}
          onClick={(e) => handleTermClick(entity, e)}
          title={`Click to explore "${entity.text}"`}
        >
          {entity.text}
          {isAmbiguous && (
            <span className="dictionary-ambiguity-icon" title="Multiple meanings">
              🧠
            </span>
          )}
        </span>
      );

      lastIndex = entity.end;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      result.push(
        <span key="text-final" className="dictionary-plain-text">
          {text.slice(lastIndex)}
        </span>
      );
    }

    return result;
  };

  return (
    <div className="dictionary-text-renderer">
      {renderLinkedText()}
      {renderHoverPopup()}
    </div>
  );
};

export default DictionaryTextRenderer;
