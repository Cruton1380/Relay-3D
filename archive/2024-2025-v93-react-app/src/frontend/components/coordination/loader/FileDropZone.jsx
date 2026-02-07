/**
 * FILE DROP ZONE
 * 
 * Drag/drop UI for file import.
 * 
 * CRITICAL: Never rejects files. All imports succeed (even if with minimal evidence).
 */

import React, { useState, useCallback } from 'react';
import { importFiles, getImportStats } from './fileImporter.js';

export default function FileDropZone({ onFilesImported, style }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(null);
  
  // Handle drag events
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  
  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;
    
    await processFiles(files);
  }, []);
  
  // Handle file input
  const handleFileInput = useCallback(async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    await processFiles(files);
  }, []);
  
  // Process files
  const processFiles = async (files) => {
    setIsImporting(true);
    setImportProgress({ current: 0, total: files.length });
    
    try {
      // Import all files
      const results = await importFiles(files);
      
      // Get statistics
      const stats = getImportStats(results);
      
      setImportProgress({ current: files.length, total: files.length });
      
      // Notify parent
      if (onFilesImported) {
        onFilesImported(results, stats);
      }
      
      // Reset after a short delay
      setTimeout(() => {
        setIsImporting(false);
        setImportProgress(null);
      }, 2000);
      
    } catch (error) {
      console.error('[FileDropZone] Import failed:', error);
      setIsImporting(false);
      setImportProgress(null);
    }
  };
  
  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        border: isDragging ? '2px dashed #4A90E2' : '2px dashed #2A2E3A',
        borderRadius: '8px',
        background: isDragging ? 'rgba(74, 144, 226, 0.1)' : 'rgba(26, 30, 42, 0.5)',
        transition: 'all 0.2s',
        cursor: 'pointer',
        ...style,
      }}
    >
      {/* Drop zone content */}
      {!isImporting && (
        <>
          <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>
            📁
          </div>
          
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#E8E8E8' }}>
            {isDragging ? 'Drop files here' : 'Drag & drop files'}
          </div>
          
          <div style={{ fontSize: '11px', color: '#9B9B9B', marginBottom: '16px' }}>
            Any file type accepted (Excel, code, images, binaries, etc.)
          </div>
          
          {/* File input button */}
          <label
            style={{
              padding: '8px 16px',
              background: '#4A90E2',
              border: 'none',
              borderRadius: '4px',
              color: '#FFFFFF',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            Browse files
            <input
              type="file"
              multiple
              onChange={handleFileInput}
              style={{ display: 'none' }}
            />
          </label>
        </>
      )}
      
      {/* Import progress */}
      {isImporting && importProgress && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>⏳</div>
          
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#E8E8E8' }}>
            Importing files...
          </div>
          
          <div style={{ fontSize: '11px', color: '#9B9B9B' }}>
            {importProgress.current} / {importProgress.total} complete
          </div>
          
          {/* Progress bar */}
          <div
            style={{
              width: '200px',
              height: '4px',
              background: '#2A2E3A',
              borderRadius: '2px',
              marginTop: '12px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${(importProgress.current / importProgress.total) * 100}%`,
                height: '100%',
                background: '#4A90E2',
                transition: 'width 0.3s',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
