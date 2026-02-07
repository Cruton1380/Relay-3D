/**
 * @fileoverview Developer Proposal Submission Component
 * UI for submitting development proposals, bounties, and upgrade requests
 */
import React, { useState, useRef } from 'react';
import { Upload, File, X, AlertCircle, Check, DollarSign, Hash } from 'lucide-react';
import './ProposalSubmission.css';

const ProposalSubmission = ({ channelId, channelName, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    type: 'feature',
    description: '',
    requestedAmount: '',
    artifactHash: ''
  });
  const [attachments, setAttachments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  const proposalTypes = [
    { value: 'feature', label: 'Feature Request', description: 'New functionality or enhancement' },
    { value: 'bugfix', label: 'Bug Fix', description: 'Fix existing issues or problems' },
    { value: 'upgrade', label: 'Channel Upgrade', description: 'Improve channel capabilities' },
    { value: 'integration', label: 'Integration', description: 'Connect with external services' },
    { value: 'optimization', label: 'Performance Optimization', description: 'Improve speed or efficiency' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    
    // Validate file types and sizes
    const allowedTypes = ['image/', 'video/', 'application/pdf', 'application/zip', 'text/', '.js', '.jsx', '.ts', '.tsx', '.css', '.html', '.md'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    const validFiles = files.filter(file => {
      const isValidType = allowedTypes.some(type => 
        file.type.startsWith(type) || file.name.endsWith(type.replace('.', ''))
      );
      const isValidSize = file.size <= maxSize;
      
      if (!isValidType) {
        setErrors(prev => ({ ...prev, attachments: 'Invalid file type. Please upload images, videos, documents, or code files.' }));
        return false;
      }
      
      if (!isValidSize) {
        setErrors(prev => ({ ...prev, attachments: 'File too large. Maximum size is 10MB per file.' }));
        return false;
      }
      
      return true;
    });

    if (attachments.length + validFiles.length > 5) {
      setErrors(prev => ({ ...prev, attachments: 'Maximum 5 files allowed per proposal.' }));
      return;
    }

    setAttachments(prev => [...prev, ...validFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type
    }))]);

    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (attachmentId) => {
    setAttachments(prev => prev.filter(att => att.id !== attachmentId));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 50) {
      newErrors.description = 'Description must be at least 50 characters';
    }

    if (formData.requestedAmount && (isNaN(formData.requestedAmount) || parseInt(formData.requestedAmount) < 0)) {
      newErrors.requestedAmount = 'Please enter a valid amount';
    }

    if (formData.requestedAmount && parseInt(formData.requestedAmount) > 1000000) {
      newErrors.requestedAmount = 'Maximum bounty amount is 1,000,000 sats';
    }

    if (formData.artifactHash && !formData.artifactHash.match(/^[a-f0-9]{64}$/i)) {
      newErrors.artifactHash = 'Please enter a valid SHA-256 hash';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const formDataToSend = new FormData();
      
      // Add form fields
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          formDataToSend.append(key, formData[key]);
        }
      });
      
      formDataToSend.append('channelId', channelId);
      
      // Add attachments
      attachments.forEach(attachment => {
        formDataToSend.append('attachments', attachment.file);
      });

      await onSubmit(formDataToSend);
      
      // Reset form on success
      setFormData({
        type: 'feature',
        description: '',
        requestedAmount: '',
        artifactHash: ''
      });
      setAttachments([]);
      
    } catch (error) {
      setErrors({ submit: error.message || 'Failed to submit proposal' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="proposal-submission">
      <div className="proposal-header">
        <h2>Submit Development Proposal</h2>
        <p>Channel: <span className="channel-name">{channelName}</span></p>
      </div>

      <form onSubmit={handleSubmit} className="proposal-form">
        {/* Proposal Type */}
        <div className="form-group">
          <label htmlFor="type">Proposal Type</label>
          <select
            id="type"
            value={formData.type}
            onChange={(e) => handleInputChange('type', e.target.value)}
            className="form-select"
          >
            {proposalTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <div className="type-description">
            {proposalTypes.find(t => t.value === formData.type)?.description}
          </div>
        </div>

        {/* Description */}
        <div className="form-group">
          <label htmlFor="description">
            Description *
            <span className="char-count">
              {formData.description.length} / 50 minimum
            </span>
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Describe your proposal in detail. What problem does it solve? How will it be implemented?"
            className={`form-textarea ${errors.description ? 'error' : ''}`}
            rows={6}
          />
          {errors.description && (
            <div className="error-message">
              <AlertCircle size={16} />
              {errors.description}
            </div>
          )}
        </div>

        {/* Bounty Amount */}
        <div className="form-group">
          <label htmlFor="requestedAmount">
            <DollarSign size={16} />
            Requested Bounty Amount (sats)
          </label>
          <input
            type="number"
            id="requestedAmount"
            value={formData.requestedAmount}
            onChange={(e) => handleInputChange('requestedAmount', e.target.value)}
            placeholder="0"
            min="0"
            max="1000000"
            className={`form-input ${errors.requestedAmount ? 'error' : ''}`}
          />
          {errors.requestedAmount && (
            <div className="error-message">
              <AlertCircle size={16} />
              {errors.requestedAmount}
            </div>
          )}
          <div className="input-hint">
            Leave blank for non-bounty proposals. Maximum: 1,000,000 sats
          </div>
        </div>

        {/* Artifact Hash */}
        <div className="form-group">
          <label htmlFor="artifactHash">
            <Hash size={16} />
            Artifact Hash (optional)
          </label>
          <input
            type="text"
            id="artifactHash"
            value={formData.artifactHash}
            onChange={(e) => handleInputChange('artifactHash', e.target.value)}
            placeholder="SHA-256 hash of deliverable artifacts"
            className={`form-input ${errors.artifactHash ? 'error' : ''}`}
          />
          {errors.artifactHash && (
            <div className="error-message">
              <AlertCircle size={16} />
              {errors.artifactHash}
            </div>
          )}
        </div>

        {/* File Attachments */}
        <div className="form-group">
          <label>Attachments</label>
          <div className="attachment-area">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              accept="image/*,video/*,.pdf,.zip,.js,.jsx,.ts,.tsx,.css,.html,.md"
              className="file-input-hidden"
            />
            
            <div 
              className="file-drop-zone"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={24} />
              <p>Click to select files or drag and drop</p>
              <small>Images, videos, documents, code files (max 5 files, 10MB each)</small>
            </div>

            {attachments.length > 0 && (
              <div className="attachment-list">
                {attachments.map(attachment => (
                  <div key={attachment.id} className="attachment-item">
                    <File size={16} />
                    <div className="attachment-info">
                      <span className="attachment-name">{attachment.name}</span>
                      <span className="attachment-size">{formatFileSize(attachment.size)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(attachment.id)}
                      className="remove-attachment"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {errors.attachments && (
              <div className="error-message">
                <AlertCircle size={16} />
                {errors.attachments}
              </div>
            )}
          </div>
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className="error-message submit-error">
            <AlertCircle size={16} />
            {errors.submit}
          </div>
        )}

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="spinner" />
                Submitting...
              </>
            ) : (
              <>
                <Check size={16} />
                Submit Proposal
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProposalSubmission;
