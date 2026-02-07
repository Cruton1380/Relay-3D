/**
 * @fileoverview Channel Discovery Component - Browse and discover proximity channels
 */
import React, { useState, useEffect } from 'react';
import { useChannels } from '../../hooks/useChannels.js';
import { HardwareScanner } from '../hardware/HardwareScanner.jsx';
import QRCodeGenerator from '../shared/QRCodeGenerator.jsx';

const ChannelDiscovery = ({ onChannelSelect }) => {
  const {
    channels,
    discoveredChannels,
    loading,
    error,
    discoverChannels,
    joinChannel,
    createChannel
  } = useChannels();

  const [activeTab, setActiveTab] = useState('nearby');
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDescription, setNewChannelDescription] = useState('');
  const [selectedChannelType, setSelectedChannelType] = useState('proximity');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showQRCode, setShowQRCode] = useState(false);
  const [selectedChannelForQR, setSelectedChannelForQR] = useState(null);

  useEffect(() => {
    // Auto-discover channels on component mount
    discoverChannels();
    const interval = setInterval(discoverChannels, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [discoverChannels]);

  const handleJoinChannel = async (channelId) => {
    try {
      await joinChannel(channelId);
      onChannelSelect?.(channelId);
    } catch (error) {
      console.error('Failed to join channel:', error);
    }
  };

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;

    try {
      const result = await createChannel({
        name: newChannelName,
        description: newChannelDescription,
        type: selectedChannelType,
        isPrivate: false
      });

      if (result.success) {
        setNewChannelName('');
        setNewChannelDescription('');
        setShowCreateForm(false);
        onChannelSelect?.(result.channel.id);
      }
    } catch (error) {
      console.error('Failed to create channel:', error);
    }
  };

  const handleShareChannel = (channel) => {
    setSelectedChannelForQR(channel);
    setShowQRCode(true);
  };

  const filteredChannels = (activeTab === 'joined' ? channels : discoveredChannels)
    .filter(channel => 
      !searchQuery || 
      channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      channel.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const getChannelTypeIcon = (type) => {
    switch (type) {
      case 'proximity': return '📡';
      case 'regional': return '🌍';
      case 'global': return '🌐';
      default: return '💬';
    }
  };

  const getChannelTypeColor = (type) => {
    switch (type) {
      case 'proximity': return 'bg-blue-100 text-blue-800';
      case 'regional': return 'bg-green-100 text-green-800';
      case 'global': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Channel Discovery
          </h2>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
          >
            Create Channel
          </button>
        </div>

        {/* Search Bar */}
        <div className="mt-3">
          <input
            type="text"
            placeholder="Search channels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mt-3">
          {[
            { id: 'nearby', label: 'Nearby', icon: '📍' },
            { id: 'joined', label: 'Joined', icon: '👥' },
            { id: 'regional', label: 'Regional', icon: '🌍' },
            { id: 'global', label: 'Global', icon: '🌐' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium ${
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Create Channel Form */}
      {showCreateForm && (
        <div className="border-b border-gray-200 p-4 bg-gray-50">
          <form onSubmit={handleCreateChannel}>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Channel Name
                </label>
                <input
                  type="text"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter channel name..."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  value={newChannelDescription}
                  onChange={(e) => setNewChannelDescription(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional description..."
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Channel Type
                </label>
                <select
                  value={selectedChannelType}
                  onChange={(e) => setSelectedChannelType(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="proximity">Proximity (Local)</option>
                  <option value="regional">Regional</option>
                  <option value="global">Global</option>
                </select>
              </div>

              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={!newChannelName.trim()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  Create Channel
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Hardware Scanner */}
      {activeTab === 'nearby' && (
        <div className="border-b border-gray-200 p-4">
          <HardwareScanner />
        </div>
      )}

      {/* Channel List */}
      <div className="p-4 space-y-3">
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-gray-600">Discovering channels...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-8 text-red-600">
            <p>Error: {error}</p>
          </div>
        )}

        {!loading && !error && filteredChannels.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No channels found</p>
          </div>
        )}

        {filteredChannels.map(channel => (
          <div key={channel.id} className="border rounded-lg p-4 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{getChannelTypeIcon(channel.type)}</span>
                  <h4 className="font-medium text-gray-900">{channel.name}</h4>
                  <span className={`px-2 py-1 text-xs rounded-full ${getChannelTypeColor(channel.type)}`}>
                    {channel.type}
                  </span>
                </div>
                {channel.description && (
                  <p className="text-sm text-gray-600 mb-2">{channel.description}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>👥 {channel.memberCount || 0} members</span>
                  {channel.distance && <span>📍 {channel.distance}m away</span>}
                  {channel.signalStrength && <span>📶 {channel.signalStrength}%</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleShareChannel(channel)}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  title="Share Channel"
                >
                  📤
                </button>
                <button
                  onClick={() => handleJoinChannel(channel.id)}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                >
                  Join
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* QR Code Modal */}
      {showQRCode && selectedChannelForQR && (
        <QRCodeGenerator
          type="channel"
          data={{
            channelId: selectedChannelForQR.id,
            channelName: selectedChannelForQR.name,
            channelType: selectedChannelForQR.type,
            description: selectedChannelForQR.description
          }}
          onClose={() => {
            setShowQRCode(false);
            setSelectedChannelForQR(null);
          }}
        />
      )}
    </div>
  );
};

export default ChannelDiscovery;
