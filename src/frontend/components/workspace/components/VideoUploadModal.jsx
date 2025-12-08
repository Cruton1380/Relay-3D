import React, { useState, useRef, useEffect } from 'react';
import { apiPost } from '../services/apiClient.js';
import './VideoUploadModal.css';

const VideoUploadModal = ({ isOpen, onClose, channelData, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [gpsLocation, setGpsLocation] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Get GPS location when modal opens
      getCurrentLocation();
    }
  }, [isOpen]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        (error) => {
          console.warn('GPS location not available:', error);
          // Use channel location as fallback
          if (channelData?.location) {
            setGpsLocation({
              lat: channelData.location.latitude,
              lon: channelData.location.longitude
            });
          }
        }
      );
    }
  };

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      // Validate file type
      const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Invalid file type. Please select MP4, WebM, or QuickTime video.');
        return;
      }

      // Validate file size (50MB limit)
      if (selectedFile.size > 50 * 1024 * 1024) {
        setError('File too large. Maximum size is 50MB.');
        return;
      }

      setFile(selectedFile);
      setError('');
      
      // Auto-generate title if empty
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, '')); // Remove extension
      }
    }
  };

  const handleUpload = async () => {
    if (!file || !title.trim()) {
      setError('Please select a video file and enter a title.');
      return;
    }

    if (!gpsLocation) {
      setError('GPS location is required for video upload.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError('');

    try {
      const formData = new FormData();
      formData.append('video', file);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('gpsLat', gpsLocation.lat);
      formData.append('gpsLon', gpsLocation.lon);

      // Get region ID from channel data
      const regionId = channelData?.id || 'unknown-region';

      const response = await apiPost(`/video-nodes/upload/${regionId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        }
      });

      if (response.success) {
        console.log('✅ Video uploaded successfully:', response.data);
        onUploadSuccess?.(response.data);
        onClose();
        
        // Reset form
        setFile(null);
        setTitle('');
        setDescription('');
        setUploadProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        setError(response.message || 'Upload failed');
      }
    } catch (error) {
      console.error('❌ Video upload error:', error);
      setError(error.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="video-upload-modal-overlay" onClick={handleClose}>
      <div className="video-upload-modal" onClick={(e) => e.stopPropagation()}>
        <div className="video-upload-header">
          <h3>Upload Video to Channel</h3>
          <button 
            className="close-button" 
            onClick={handleClose}
            disabled={uploading}
          >
            ×
          </button>
        </div>

        <div className="video-upload-content">
          {channelData && (
            <div className="channel-info">
              <h4>{channelData.name}</h4>
              <p>{channelData.description}</p>
              {channelData.location && (
                <p className="location">
                  📍 {channelData.location.latitude.toFixed(4)}, {channelData.location.longitude.toFixed(4)}
                </p>
              )}
            </div>
          )}

          <div className="upload-form">
            <div className="form-group">
              <label htmlFor="video-file">Video File *</label>
              <input
                ref={fileInputRef}
                type="file"
                id="video-file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={handleFileSelect}
                disabled={uploading}
              />
              {file && (
                <div className="file-info">
                  <span>📹 {file.name}</span>
                  <span>{(file.size / (1024 * 1024)).toFixed(1)} MB</span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="video-title">Title *</label>
              <input
                type="text"
                id="video-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter video title"
                disabled={uploading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="video-description">Description</label>
              <textarea
                id="video-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your video content"
                rows="3"
                disabled={uploading}
              />
            </div>

            <div className="form-group">
              <label>GPS Location</label>
              {gpsLocation ? (
                <div className="gps-info">
                  <span>✅ {gpsLocation.lat.toFixed(6)}, {gpsLocation.lon.toFixed(6)}</span>
                </div>
              ) : (
                <div className="gps-info">
                  <span>⏳ Getting location...</span>
                </div>
              )}
            </div>

            {error && (
              <div className="error-message">
                ❌ {error}
              </div>
            )}

            {uploading && (
              <div className="upload-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <span>{uploadProgress}% uploaded</span>
              </div>
            )}

            <div className="upload-actions">
              <button
                className="upload-button"
                onClick={handleUpload}
                disabled={uploading || !file || !title.trim()}
              >
                {uploading ? 'Uploading...' : 'Upload Video'}
              </button>
              <button
                className="cancel-button"
                onClick={handleClose}
                disabled={uploading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
};

export default VideoUploadModal; 