/**
 * Layout Favorites Manager Component
 * Provides UI for saving, loading, and managing window layout favorites
 */
import React, { useState, useEffect } from 'react';
import './LayoutFavoritesManager.css';

const LayoutFavoritesManager = ({ 
  isOpen, 
  onClose, 
  saveLayoutFavorite, 
  getLayoutFavorites, 
  clearLayoutHistory,
  onApplyLayout 
}) => {
  const [favorites, setFavorites] = useState({});
  const [newFavoriteName, setNewFavoriteName] = useState('');
  const [isCreatingFavorite, setIsCreatingFavorite] = useState(false);
  const [recentLayouts, setRecentLayouts] = useState([]);

  // Load favorites and recent layouts on component mount
  useEffect(() => {
    if (isOpen) {
      loadFavorites();
      loadRecentLayouts();
    }
  }, [isOpen, getLayoutFavorites]);

  const loadFavorites = () => {
    if (getLayoutFavorites) {
      const favs = getLayoutFavorites();
      setFavorites(favs);
    }
  };

  const loadRecentLayouts = () => {
    const recent = JSON.parse(localStorage.getItem('relay-recent-layouts') || '[]');
    setRecentLayouts(recent.slice(0, 5)); // Show last 5 recent layouts
  };

  const handleSaveFavorite = () => {
    if (!newFavoriteName.trim()) return;
    
    // Get the current active layout from recent layouts (most recent one)
    const currentLayout = recentLayouts[0];
    if (!currentLayout) {
      alert('No current layout to save. Please move a window first.');
      return;
    }

    if (saveLayoutFavorite) {
      saveLayoutFavorite(newFavoriteName.trim(), currentLayout);
      setNewFavoriteName('');
      setIsCreatingFavorite(false);
      loadFavorites();
    }
  };

  const handleDeleteFavorite = (favoriteName) => {
    const updatedFavorites = { ...favorites };
    delete updatedFavorites[favoriteName];
    localStorage.setItem('relay-layout-favorites', JSON.stringify(updatedFavorites));
    setFavorites(updatedFavorites);
  };

  const handleApplyFavorite = (layoutId) => {
    if (onApplyLayout) {
      onApplyLayout(layoutId);
    }
    onClose();
  };

  const handleClearHistory = () => {
    if (confirm('Clear all layout history and favorites?')) {
      if (clearLayoutHistory) {
        clearLayoutHistory();
      }
      setFavorites({});
      setRecentLayouts([]);
    }
  };

  const getLayoutDisplayName = (layoutId) => {
    const layoutNames = {
      'left-half': 'Left Half',
      'right-half': 'Right Half',
      'top-left-quarter': 'Top Left Quarter',
      'top-right-quarter': 'Top Right Quarter',
      'bottom-left-quarter': 'Bottom Left Quarter',
      'bottom-right-quarter': 'Bottom Right Quarter',
      'top-half': 'Top Half',
      'bottom-half': 'Bottom Half',
      'maximized': 'Maximized',
      'center': 'Center',
      'left-third': 'Left Third',
      'center-third': 'Center Third',
      'right-third': 'Right Third'
    };
    return layoutNames[layoutId] || layoutId;
  };

  if (!isOpen) return null;

  return (
    <div className="layout-favorites-overlay">
      <div className="layout-favorites-modal">
        <div className="layout-favorites-header">
          <h3>Layout Manager</h3>
          <button 
            className="close-button"
            onClick={onClose}
            aria-label="Close Layout Manager"
          >
            ×
          </button>
        </div>

        <div className="layout-favorites-content">
          {/* Recent Layouts Section */}
          <div className="layout-section">
            <h4>Recent Layouts</h4>
            {recentLayouts.length > 0 ? (
              <div className="layout-list">
                {recentLayouts.map((layoutId, index) => (
                  <div key={`recent-${index}`} className="layout-item recent">
                    <button
                      className="layout-button"
                      onClick={() => handleApplyFavorite(layoutId)}
                      title={`Apply ${getLayoutDisplayName(layoutId)} layout`}
                    >
                      <span className="layout-name">
                        {getLayoutDisplayName(layoutId)}
                      </span>
                      <span className="layout-badge">Recent</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-state">No recent layouts</p>
            )}
          </div>

          {/* Favorites Section */}
          <div className="layout-section">
            <h4>Favorite Layouts</h4>
            {Object.keys(favorites).length > 0 ? (
              <div className="layout-list">
                {Object.entries(favorites).map(([name, layoutId]) => (
                  <div key={name} className="layout-item favorite">
                    <button
                      className="layout-button"
                      onClick={() => handleApplyFavorite(layoutId)}
                      title={`Apply ${name} layout`}
                    >
                      <span className="layout-name">{name}</span>
                      <span className="layout-type">
                        {getLayoutDisplayName(layoutId)}
                      </span>
                    </button>
                    <button
                      className="delete-favorite"
                      onClick={() => handleDeleteFavorite(name)}
                      title={`Delete ${name} favorite`}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-state">No saved favorites</p>
            )}
          </div>

          {/* Create New Favorite */}
          <div className="layout-section">
            <h4>Save Current Layout</h4>
            {!isCreatingFavorite ? (
              <button
                className="create-favorite-button"
                onClick={() => setIsCreatingFavorite(true)}
                disabled={recentLayouts.length === 0}
              >
                + Save Current Layout
              </button>
            ) : (
              <div className="create-favorite-form">
                <input
                  type="text"
                  placeholder="Enter favorite name..."
                  value={newFavoriteName}
                  onChange={(e) => setNewFavoriteName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSaveFavorite()}
                  autoFocus
                />
                <div className="form-buttons">
                  <button
                    className="save-button"
                    onClick={handleSaveFavorite}
                    disabled={!newFavoriteName.trim()}
                  >
                    Save
                  </button>
                  <button
                    className="cancel-button"
                    onClick={() => {
                      setIsCreatingFavorite(false);
                      setNewFavoriteName('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {recentLayouts.length === 0 && (
              <p className="help-text">
                Move a window to a position first, then save it as a favorite.
              </p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="layout-favorites-footer">
          <button
            className="clear-history-button"
            onClick={handleClearHistory}
          >
            Clear All History
          </button>
          <div className="help-text">
            Tip: Drag windows to create layouts, then save your favorites here.
          </div>
        </div>
      </div>
    </div>
  );
};

export default LayoutFavoritesManager;
