/**
 * PROMPT LIBRARY - First-Class Prompt Management
 * 
 * Displays prompt.* filaments with:
 * - Latest head
 * - Compiler version
 * - Last good snapshot
 * - Branch status
 * 
 * Follows same pattern as CoordinationGraphExplorer.
 */

import React, { useState, useMemo } from 'react';

export default function PromptLibrary({ prompts = {}, snapshots = {}, onSelectPrompt }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState('all');
  
  // Filter and search prompts
  const filteredPrompts = useMemo(() => {
    return Object.values(prompts).filter(prompt => {
      const matchesSearch = !searchTerm || 
        prompt.filamentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (prompt.commits[prompt.headIndex]?.payload?.sourceText || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTag = filterTag === 'all' || prompt.tags?.includes(filterTag);
      
      return matchesSearch && matchesTag;
    });
  }, [prompts, searchTerm, filterTag]);
  
  // Get snapshot for prompt
  const getSnapshot = (promptId) => {
    return Object.values(snapshots).find(s => 
      s.payload?.promptHeadRef?.startsWith(promptId)
    );
  };
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0A0E1A', color: '#E8E8E8' }}>
      {/* Header */}
      <div style={{ padding: '16px', borderBottom: '1px solid #2A2E3A' }}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 700, color: '#F8E71C' }}>
          📚 PROMPT LIBRARY
        </h2>
        <p style={{ margin: 0, fontSize: '11px', color: '#9B9B9B' }}>
          First-class prompt filaments • Deterministic execution
        </p>
      </div>
      
      {/* Search + Filter */}
      <div style={{ padding: '12px', borderBottom: '1px solid #2A2E3A', background: '#1A1E2A' }}>
        <input
          type="text"
          placeholder="Search prompts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            background: '#0A0E1A',
            border: '1px solid #2A2E3A',
            borderRadius: '4px',
            color: '#E8E8E8',
            fontSize: '12px',
            marginBottom: '8px',
          }}
        />
        
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['all', 'canonical', 'good', 'branch', 'archived'].map(tag => (
            <button
              key={tag}
              onClick={() => setFilterTag(tag)}
              style={{
                padding: '4px 8px',
                background: filterTag === tag ? '#4A90E2' : '#2A2E3A',
                border: 'none',
                borderRadius: '4px',
                color: '#E8E8E8',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
      
      {/* Prompt List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        {filteredPrompts.length === 0 && (
          <div style={{ padding: '24px', textAlign: 'center', color: '#6B6B6B', fontSize: '12px' }}>
            No prompts found. Create your first prompt to get started.
          </div>
        )}
        
        {filteredPrompts.map(prompt => {
          const headCommit = prompt.commits[prompt.headIndex];
          const snapshot = getSnapshot(prompt.filamentId);
          const isBranched = prompt.status === 'branched';
          const isArchived = prompt.status === 'archived';
          
          return (
            <div
              key={prompt.filamentId}
              onClick={() => onSelectPrompt && onSelectPrompt(prompt)}
              style={{
                padding: '12px',
                background: '#1A1E2A',
                border: '1px solid #2A2E3A',
                borderRadius: '4px',
                marginBottom: '8px',
                cursor: 'pointer',
                opacity: isArchived ? 0.5 : 1,
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#E8E8E8', marginBottom: '4px' }}>
                    {prompt.filamentId}
                  </div>
                  <div style={{ fontSize: '10px', color: '#6B6B6B' }}>
                    Context: {prompt.context || 'default'}
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '4px' }}>
                  {isBranched && (
                    <span style={{ padding: '2px 6px', background: '#D0021B', borderRadius: '3px', fontSize: '9px', fontWeight: 600 }}>
                      BRANCHED
                    </span>
                  )}
                  {isArchived && (
                    <span style={{ padding: '2px 6px', background: '#6B6B6B', borderRadius: '3px', fontSize: '9px', fontWeight: 600 }}>
                      ARCHIVED
                    </span>
                  )}
                  {snapshot && (
                    <span style={{ padding: '2px 6px', background: '#7ED321', color: '#000', borderRadius: '3px', fontSize: '9px', fontWeight: 600 }}>
                      ✓ SNAPSHOT
                    </span>
                  )}
                </div>
              </div>
              
              {/* Source Preview */}
              <div style={{
                fontSize: '11px',
                color: '#9B9B9B',
                marginBottom: '8px',
                maxHeight: '40px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {headCommit?.payload?.sourceText?.substring(0, 100) || 'No source text'}...
              </div>
              
              {/* Metadata */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#6B6B6B' }}>
                <div>
                  v{prompt.headIndex} • {prompt.commits.length} commit(s)
                </div>
                <div>
                  {headCommit?.payload?.compilerRef || 'Not compiled'}
                </div>
              </div>
              
              {/* Snapshot Info */}
              {snapshot && (
                <div style={{
                  marginTop: '8px',
                  padding: '6px 8px',
                  background: 'rgba(126, 211, 33, 0.1)',
                  border: '1px solid #7ED321',
                  borderRadius: '4px',
                  fontSize: '10px',
                  color: '#7ED321',
                }}>
                  📍 {snapshot.payload?.label || 'Snapshot saved'}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Stats Footer */}
      <div style={{ padding: '12px', borderTop: '1px solid #2A2E3A', background: '#1A1E2A' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '10px' }}>
          <div>
            <div style={{ color: '#6B6B6B' }}>Total</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#4A90E2' }}>
              {Object.keys(prompts).length}
            </div>
          </div>
          <div>
            <div style={{ color: '#6B6B6B' }}>Active</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#7ED321' }}>
              {Object.values(prompts).filter(p => p.status === 'active').length}
            </div>
          </div>
          <div>
            <div style={{ color: '#6B6B6B' }}>Snapshots</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#F8E71C' }}>
              {Object.keys(snapshots).length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
