/**
 * JURY CV RENDERER
 * Public profile component displaying verified civic contributions and jury badges
 * Shows blockchain-verified service history while preserving privacy
 */

import React, { useState, useEffect } from 'react';
import { 
  Shield, Award, Calendar, MapPin, Users, TrendingUp, 
  Star, Eye, MessageCircle, CheckCircle, Trophy, Crown,
  Clock, Target, Zap, Heart, Search
} from 'lucide-react';

const JuryCVRenderer = ({ userId, isPublicView = true, showGratitude = true }) => {
  const [civicData, setCivicData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    loadCivicContributions();
  }, [userId]);

  const loadCivicContributions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/civic/contributions/${userId}`);
      const data = await response.json();
      setCivicData(data);
    } catch (error) {
      console.error('[JURY_CV] Failed to load civic contributions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeIcon = (category, rarity) => {
    const iconMap = {
      civic_participation: '⚖️',
      consensus: '🤝',
      protection: '🛡️',
      detection: '🔍',
      leadership: '👑',
      responsiveness: '⚡',
      deliberation: '💭'
    };
    
    return iconMap[category] || '🏅';
  };

  const getRarityColor = (rarity) => {
    const colorMap = {
      common: 'text-gray-600 bg-gray-100',
      uncommon: 'text-green-600 bg-green-100',
      rare: 'text-blue-600 bg-blue-100',
      legendary: 'text-purple-600 bg-purple-100'
    };
    
    return colorMap[rarity] || colorMap.common;
  };

  const getCategoryColor = (category) => {
    const colorMap = {
      civic_participation: 'bg-blue-50 border-blue-200',
      consensus: 'bg-green-50 border-green-200',
      protection: 'bg-yellow-50 border-yellow-200',
      detection: 'bg-red-50 border-red-200',
      leadership: 'bg-purple-50 border-purple-200',
      responsiveness: 'bg-orange-50 border-orange-200',
      deliberation: 'bg-indigo-50 border-indigo-200'
    };
    
    return colorMap[category] || colorMap.civic_participation;
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatServiceDuration = (firstService, lastService) => {
    if (!firstService || !lastService) return 'New contributor';
    
    const years = (lastService - firstService) / (1000 * 60 * 60 * 24 * 365);
    
    if (years < 1) {
      const months = Math.floor((lastService - firstService) / (1000 * 60 * 60 * 24 * 30));
      return `${months} month${months !== 1 ? 's' : ''} of service`;
    }
    
    return `${Math.floor(years)} year${Math.floor(years) !== 1 ? 's' : ''} of service`;
  };

  const getFilteredAndSortedBadges = () => {
    if (!civicData?.badges) return [];
    
    let filtered = civicData.badges;
    
    // Apply category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(badge => badge.category === filterCategory);
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => b.issuedAt - a.issuedAt);
        break;
      case 'points':
        filtered.sort((a, b) => b.points - a.points);
        break;
      case 'rarity':
        const rarityOrder = { legendary: 4, rare: 3, uncommon: 2, common: 1 };
        filtered.sort((a, b) => rarityOrder[b.rarity] - rarityOrder[a.rarity]);
        break;
      default:
        break;
    }
    
    return filtered;
  };

  const renderStatsOverview = () => {
    if (!civicData?.civicContributions) return null;
    
    const stats = civicData.civicContributions;
    
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <Trophy className="w-6 h-6 mr-2 text-yellow-500" />
          Civic Contribution Summary
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.totalBadges}</div>
            <div className="text-sm text-blue-800">Total Badges</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.totalPoints}</div>
            <div className="text-sm text-green-800">Civic Points</div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{stats.casesServed}</div>
            <div className="text-sm text-purple-800">Cases Served</div>
          </div>
          
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{stats.consensusParticipation}</div>
            <div className="text-sm text-orange-800">Consensus Built</div>
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            {formatServiceDuration(stats.firstService, stats.lastService)}
          </div>
          
          {stats.hasLegendaryBadge && (
            <div className="flex items-center text-purple-600">
              <Crown className="w-4 h-4 mr-1" />
              Legendary Contributor
            </div>
          )}
          
          {showGratitude && stats.gratitudeMessages > 0 && (
            <div className="flex items-center text-pink-600">
              <Heart className="w-4 h-4 mr-1" />
              {stats.gratitudeMessages} Thank You{stats.gratitudeMessages !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCategoryBreakdown = () => {
    if (!civicData?.civicContributions?.categories) return null;
    
    const categories = civicData.civicContributions.categories;
    const total = Object.values(categories).reduce((sum, count) => sum + count, 0);
    
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Categories</h3>
        
        <div className="space-y-3">
          {Object.entries(categories).map(([category, count]) => (
            <div key={category} className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-lg mr-2">{getBadgeIcon(category)}</span>
                <span className="capitalize text-gray-700">
                  {category.replace('_', ' ')}
                </span>
              </div>
              
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${(count / total) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-600 w-8 text-right">
                  {count}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderFilterControls = () => {
    const categories = civicData?.civicContributions?.categories || {};
    
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-gray-500" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {Object.keys(categories).map(category => (
                <option key={category} value={category}>
                  {category.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="recent">Most Recent</option>
              <option value="points">Highest Points</option>
              <option value="rarity">Rarity</option>
            </select>
          </div>
        </div>
      </div>
    );
  };

  const renderBadgeGrid = () => {
    const badges = getFilteredAndSortedBadges();
    
    if (badges.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No badges found for the selected filters.</p>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {badges.map((badge, index) => (
          <div
            key={badge.badgeId}
            className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${getCategoryColor(badge.category)} ${
              selectedBadge?.badgeId === badge.badgeId ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setSelectedBadge(badge)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center">
                <span className="text-2xl mr-3">{badge.icon}</span>
                <div>
                  <h4 className="font-medium text-gray-900">{badge.name}</h4>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getRarityColor(badge.rarity)}`}>
                    {badge.rarity.toUpperCase()}
                  </span>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-lg font-bold text-blue-600">{badge.points}</div>
                <div className="text-xs text-gray-500">points</div>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-3">{badge.description}</p>
            
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center">
                <Calendar className="w-3 h-3 mr-1" />
                {formatDate(badge.issuedAt)}
              </div>
              
              <div className="flex items-center space-x-2">
                {badge.blockchainVerified && (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    <span>Verified</span>
                  </div>
                )}
                
                {badge.hasGratitude && (
                  <div className="flex items-center text-pink-600">
                    <Heart className="w-3 h-3" />
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-2 text-xs text-gray-500">
              <span className="capitalize">{badge.caseType.replace('_', ' ')}</span>
              {badge.region && (
                <span className="ml-2">• {badge.region}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderBadgeDetails = () => {
    if (!selectedBadge) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Badge Details</h3>
            <button
              onClick={() => setSelectedBadge(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <div className="text-center mb-6">
            <span className="text-6xl">{selectedBadge.icon}</span>
            <h4 className="text-xl font-bold text-gray-900 mt-2">{selectedBadge.name}</h4>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${getRarityColor(selectedBadge.rarity)}`}>
              {selectedBadge.rarity.toUpperCase()}
            </span>
          </div>
          
          <div className="space-y-3 text-sm">
            <div>
              <strong>Description:</strong>
              <p className="text-gray-600 mt-1">{selectedBadge.description}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong>Points:</strong>
                <p className="text-blue-600 font-bold">{selectedBadge.points}</p>
              </div>
              <div>
                <strong>Category:</strong>
                <p className="capitalize">{selectedBadge.category.replace('_', ' ')}</p>
              </div>
            </div>
            
            <div>
              <strong>Earned:</strong>
              <p className="text-gray-600">{formatDate(selectedBadge.issuedAt)}</p>
            </div>
            
            <div>
              <strong>Case Type:</strong>
              <p className="capitalize">{selectedBadge.caseType.replace('_', ' ')}</p>
            </div>
            
            {selectedBadge.region && (
              <div>
                <strong>Region:</strong>
                <p>{selectedBadge.region}</p>
              </div>
            )}
            
            <div className="pt-3 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-green-600">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  <span className="text-sm">Blockchain Verified</span>
                </div>
                
                {selectedBadge.hasGratitude && (
                  <div className="flex items-center text-pink-600">
                    <Heart className="w-4 h-4 mr-1" />
                    <span className="text-sm">Gratitude Received</span>
                  </div>
                )}
              </div>
              
              <div className="mt-2 text-xs text-gray-500 font-mono">
                Verification: {selectedBadge.verificationHash.substring(0, 16)}...
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading civic contributions...</p>
        </div>
      </div>
    );
  }

  if (!civicData) {
    return (
      <div className="text-center py-12">
        <Award className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Civic Contributions</h3>
        <p className="text-gray-600">This user hasn't participated in jury service yet.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Verified Civic Contributions
        </h1>
        <p className="text-gray-600">
          Blockchain-verified record of community jury service and civic participation
        </p>
      </div>

      {renderStatsOverview()}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-1">
          {renderCategoryBreakdown()}
        </div>
        
        <div className="lg:col-span-2">
          {renderFilterControls()}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <Award className="w-6 h-6 mr-2 text-blue-500" />
          Civic Service Badges
          <span className="ml-auto text-sm font-normal text-gray-500">
            {getFilteredAndSortedBadges().length} of {civicData.badges?.length || 0} badges shown
          </span>
        </h2>
        
        {renderBadgeGrid()}
      </div>

      {selectedBadge && renderBadgeDetails()}
    </div>
  );
};

export default JuryCVRenderer;
