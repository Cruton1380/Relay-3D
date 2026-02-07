import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Settings } from 'lucide-react';
import DemocraticChatroom from '../components/chatroom/DemocraticChatroom';
import { useEnvironment } from '../hooks/useEnvironment';
import './ChatroomPage.css';

const ChatroomPage = () => {
  const { channelId } = useParams();
  const navigate = useNavigate();
  const { isTestMode } = useEnvironment();
  const [channelData, setChannelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadChannelData();
  }, [channelId]);

  const loadChannelData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/channels/${channelId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load channel: ${response.status}`);
      }
      
      const data = await response.json();
      setChannelData(data);
    } catch (error) {
      console.error('Error loading channel data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToChannels = () => {
    navigate('/channels');
  };

  if (loading) {
    return (
      <div className="chatroom-page">
        <div className="chatroom-header">
          <button onClick={handleBackToChannels} className="back-button">
            <ArrowLeft size={20} />
            Back to Channels
          </button>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading chatroom...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chatroom-page">
        <div className="chatroom-header">
          <button onClick={handleBackToChannels} className="back-button">
            <ArrowLeft size={20} />
            Back to Channels
          </button>
        </div>
        <div className="error-container">
          <h2>Error Loading Chatroom</h2>
          <p>{error}</p>
          <button onClick={loadChannelData} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!channelData) {
    return (
      <div className="chatroom-page">
        <div className="chatroom-header">
          <button onClick={handleBackToChannels} className="back-button">
            <ArrowLeft size={20} />
            Back to Channels
          </button>
        </div>
        <div className="error-container">
          <h2>Channel Not Found</h2>
          <p>The channel you're looking for doesn't exist or is not accessible.</p>
          <button onClick={handleBackToChannels} className="back-button-large">
            Return to Channels
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="chatroom-page">
      <div className="chatroom-header">
        <div className="header-left">
          <button onClick={handleBackToChannels} className="back-button">
            <ArrowLeft size={20} />
            Back to Channels
          </button>
          <div className="channel-info">
            <h1>{channelData.name || channelData.title}</h1>
            <div className="channel-meta">
              <span className="scope-badge scope-{channelData.scope}">
                {channelData.scope}
              </span>
              {channelData.member_count && (
                <span className="member-count">
                  <Users size={14} />
                  {channelData.member_count} members
                </span>
              )}
              {isTestMode && (
                <span className="test-mode-badge">TEST MODE</span>
              )}
            </div>
          </div>
        </div>
        <div className="header-right">
          <button className="settings-button" title="Channel Settings">
            <Settings size={20} />
          </button>
        </div>
      </div>

      <div className="chatroom-content">
        <DemocraticChatroom 
          channelId={channelId}
          channelData={channelData}
          userId="demo-user-1" // TODO: Replace with actual user ID from auth
        />
      </div>
    </div>
  );
};

export default ChatroomPage;
