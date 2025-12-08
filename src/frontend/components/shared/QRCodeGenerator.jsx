/**
 * @fileoverview Universal QR Code Generator Component
 * Generates QR codes for app download, channel invites, and friend requests
 */
import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import './QRCodeGenerator.css';

const QRCodeGenerator = ({ 
  type = 'app', // 'app', 'channel', 'friend', 'invite'
  data = {},
  size = 256,
  title,
  showShare = true,
  showSave = true,
  className = ''
}) => {
  const canvasRef = useRef(null);
  const [qrCodeData, setQrCodeData] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    generateQRCode();
  }, [type, data, size]);

  const generateQRCode = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const qrData = generateQRData(type, data);
      setQrCodeData(qrData);

      if (canvasRef.current) {
        await QRCode.toCanvas(canvasRef.current, qrData, {
          width: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
      }
    } catch (err) {
      setError('Failed to generate QR code');
      console.error('QR code generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateQRData = (type, data) => {
    const baseUrl = window.location.origin;
    
    switch (type) {
      case 'app':
        return JSON.stringify({
          type: 'app_download',
          appUrl: data.appUrl || `${baseUrl}/download`,
          storeUrls: {
            ios: data.iosUrl || 'https://apps.apple.com/app/relay',
            android: data.androidUrl || 'https://play.google.com/store/apps/details?id=com.relay'
          },
          webApp: `${baseUrl}/app`,
          timestamp: Date.now()
        });

      case 'channel':
        return JSON.stringify({
          type: 'channel_invite',
          channelId: data.channelId,
          channelName: data.channelName,
          inviteCode: data.inviteCode,
          joinUrl: `${baseUrl}/join/channel/${data.channelId}?code=${data.inviteCode}`,
          expiresAt: data.expiresAt,
          timestamp: Date.now()
        });

      case 'friend':
        return JSON.stringify({
          type: 'friend_request',
          userId: data.userId,
          userName: data.userName,
          requestUrl: `${baseUrl}/friend/add/${data.userId}`,
          profileUrl: `${baseUrl}/profile/${data.userId}`,
          message: data.message || '',
          timestamp: Date.now()
        });

      case 'invite':
        return JSON.stringify({
          type: 'platform_invite',
          inviteCode: data.inviteCode,
          inviterName: data.inviterName,
          joinUrl: `${baseUrl}/onboard?code=${data.inviteCode}`,
          appDownload: `${baseUrl}/download`,
          expiresAt: data.expiresAt,
          timestamp: Date.now()
        });

      default:
        return qrCodeData || baseUrl;
    }
  };

  const getTitle = () => {
    if (title) return title;
    
    switch (type) {
      case 'app':
        return 'Download Relay App';
      case 'channel':
        return `Join Channel: ${data.channelName || 'Unknown Channel'}`;
      case 'friend':
        return `Add Friend: ${data.userName || 'Unknown User'}`;
      case 'invite':
        return 'Join Relay Platform';
      default:
        return 'Relay QR Code';
    }
  };

  const handleShare = async () => {
    if (!navigator.share || !qrCodeData) return;

    try {
      const shareData = {
        title: getTitle(),
        text: getShareText(),
        url: getShareUrl()
      };

      await navigator.share(shareData);
    } catch (err) {
      // Fallback to clipboard
      await navigator.clipboard.writeText(getShareUrl());
      alert('Link copied to clipboard!');
    }
  };

  const getShareText = () => {
    switch (type) {
      case 'app':
        return 'Download the Relay app and join our proximity-based community!';
      case 'channel':
        return `Join me in the "${data.channelName}" channel on Relay!`;
      case 'friend':
        return `Connect with me on Relay!`;
      case 'invite':
        return 'You\'re invited to join Relay! Use this code to get started.';
      default:
        return 'Check out Relay!';
    }
  };

  const getShareUrl = () => {
    const baseUrl = window.location.origin;
    
    switch (type) {
      case 'app':
        return data.appUrl || `${baseUrl}/download`;
      case 'channel':
        return `${baseUrl}/join/channel/${data.channelId}?code=${data.inviteCode}`;
      case 'friend':
        return `${baseUrl}/friend/add/${data.userId}`;
      case 'invite':
        return `${baseUrl}/onboard?code=${data.inviteCode}`;
      default:
        return baseUrl;
    }
  };

  const handleSave = async () => {
    if (!canvasRef.current) return;

    try {
      const canvas = canvasRef.current;
      const link = document.createElement('a');
      link.download = `relay-qr-${type}-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (err) {
      console.error('Failed to save QR code:', err);
      alert('Failed to save QR code');
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      alert('Link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  if (error) {
    return (
      <div className={`qr-code-generator error ${className}`}>
        <div className="qr-error">
          <p>❌ {error}</p>
          <button onClick={generateQRCode}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`qr-code-generator ${className}`}>
      <div className="qr-header">
        <h3>{getTitle()}</h3>
      </div>
      
      <div className="qr-canvas-container">
        {isGenerating && (
          <div className="qr-loading">
            <div className="spinner"></div>
            <p>Generating QR code...</p>
          </div>
        )}
        <canvas 
          ref={canvasRef}
          className={isGenerating ? 'generating' : ''}
          style={{ display: isGenerating ? 'none' : 'block' }}
        />
      </div>

      <div className="qr-info">
        <p className="qr-description">{getShareText()}</p>
        <p className="qr-url">{getShareUrl()}</p>
      </div>

      <div className="qr-actions">
        {showShare && (
          <button 
            className="qr-action-btn share-btn"
            onClick={handleShare}
          >
            📤 Share
          </button>
        )}
        
        <button 
          className="qr-action-btn copy-btn"
          onClick={copyToClipboard}
        >
          📋 Copy Link
        </button>

        {showSave && (
          <button 
            className="qr-action-btn save-btn"
            onClick={handleSave}
          >
            💾 Save QR
          </button>
        )}
      </div>
    </div>
  );
};

export default QRCodeGenerator;
