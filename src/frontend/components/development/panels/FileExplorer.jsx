import React, { useState } from 'react';
import './FileExplorer.css';

const FileExplorer = () => {
  const [expandedFolders, setExpandedFolders] = useState({
    'src': true,
    'frontend': true,
    'components': true,
    'development': true
  });
  
  const [selectedFile, setSelectedFile] = useState('WorkspaceLayout.jsx');

  const fileStructure = {
    type: 'folder',
    name: 'RelayCodeBase',
    children: [
      {
        type: 'folder',
        name: 'src',
        children: [
          {
            type: 'folder',
            name: 'backend',
            children: [
              {
                type: 'folder',
                name: 'routes',
                children: [
                  { type: 'file', name: 'vote.mjs', icon: '📄' },
                  { type: 'file', name: 'chatroom.mjs', icon: '📄' },
                  { type: 'file', name: 'devCenter.mjs', icon: '📄' }
                ]
              },
              {
                type: 'folder',
                name: 'services',
                children: [
                  { type: 'file', name: 'blockchain.mjs', icon: '⛓️' },
                  { type: 'file', name: 'websocket.mjs', icon: '🔌' }
                ]
              },
              { type: 'file', name: 'server.mjs', icon: '🖥️' },
              { type: 'file', name: 'app.mjs', icon: '📱' }
            ]
          },
          {
            type: 'folder',
            name: 'frontend',
            children: [
              {
                type: 'folder',
                name: 'components',
                children: [
                  {
                    type: 'folder',
                    name: 'development',
                    children: [
                      { type: 'file', name: 'WorkspaceLayout.jsx', icon: '⚛️' },
                      { type: 'file', name: 'RelayDevCenter.jsx', icon: '⚛️' },
                      { type: 'file', name: 'DevelopmentPanel.jsx', icon: '⚛️' },
                      {
                        type: 'folder',
                        name: 'panels',
                        children: [
                          { type: 'file', name: 'CommandCenter.jsx', icon: '⚛️' },
                          { type: 'file', name: 'ArchitectBot.jsx', icon: '🤖' },
                          { type: 'file', name: 'NavigatorBot.jsx', icon: '🧭' },
                          { type: 'file', name: 'Terminal.jsx', icon: '💻' },
                          { type: 'file', name: 'FileExplorer.jsx', icon: '📁' }
                        ]
                      }
                    ]
                  },
                  {
                    type: 'folder',
                    name: 'voting',
                    children: [
                      { type: 'file', name: 'VoteButton.jsx', icon: '🗳️' },
                      { type: 'file', name: 'VoteDebugPanel.jsx', icon: '🐛' }
                    ]
                  },
                  {
                    type: 'folder',
                    name: 'chatroom',
                    children: [
                      { type: 'file', name: 'DemocraticChatroom.jsx', icon: '💬' }
                    ]
                  }
                ]
              },
              {
                type: 'folder',
                name: 'pages',
                children: [
                  { type: 'file', name: 'HomePage.jsx', icon: '🏠' },
                  { type: 'file', name: 'ChatroomPage.jsx', icon: '💬' }
                ]
              },
              { type: 'file', name: 'App.jsx', icon: '⚛️' }
            ]
          }
        ]
      },
      { type: 'file', name: 'package.json', icon: '📦' },
      { type: 'file', name: 'README.md', icon: '📖' },
      { type: 'file', name: 'vite.config.js', icon: '⚡' }
    ]
  };

  const toggleFolder = (path) => {
    setExpandedFolders(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const handleFileClick = (fileName) => {
    setSelectedFile(fileName);
  };

  const renderTree = (node, path = '', level = 0) => {
    const fullPath = path ? `${path}/${node.name}` : node.name;
    const isExpanded = expandedFolders[node.name] || expandedFolders[fullPath];
    const isSelected = selectedFile === node.name;

    if (node.type === 'folder') {
      return (
        <div key={fullPath} className="tree-node">
          <div 
            className={`tree-item folder ${isExpanded ? 'expanded' : ''}`}
            style={{ paddingLeft: `${level * 16 + 8}px` }}
            onClick={() => toggleFolder(node.name)}
          >
            <span className="folder-icon">
              {isExpanded ? '📂' : '📁'}
            </span>
            <span className="item-name">{node.name}</span>
          </div>
          {isExpanded && node.children && (
            <div className="tree-children">
              {node.children.map(child => renderTree(child, fullPath, level + 1))}
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div 
          key={fullPath} 
          className={`tree-item file ${isSelected ? 'selected' : ''}`}
          style={{ paddingLeft: `${level * 16 + 24}px` }}
          onClick={() => handleFileClick(node.name)}
        >
          <span className="file-icon">{node.icon}</span>
          <span className="item-name">{node.name}</span>
        </div>
      );
    }
  };

  const contextMenuItems = [
    { label: 'New File', icon: '📄', action: () => console.log('New file') },
    { label: 'New Folder', icon: '📁', action: () => console.log('New folder') },
    { label: 'Rename', icon: '✏️', action: () => console.log('Rename') },
    { label: 'Delete', icon: '🗑️', action: () => console.log('Delete') },
    { label: 'Copy Path', icon: '📋', action: () => console.log('Copy path') }
  ];

  return (
    <div className="file-explorer">
      <div className="explorer-header">
        <div className="explorer-title">Files</div>
        <div className="explorer-actions">
          <button className="action-btn" title="New File">
            📄
          </button>
          <button className="action-btn" title="New Folder">
            📁
          </button>
          <button className="action-btn" title="Refresh">
            🔄
          </button>
        </div>
      </div>
      
      <div className="explorer-content">
        <div className="file-tree">
          {renderTree(fileStructure)}
        </div>
      </div>
      
      {selectedFile && (
        <div className="file-preview">
          <div className="preview-header">
            <span className="preview-title">{selectedFile}</span>
            <button className="preview-action" title="Open in editor">
              📝
            </button>
          </div>
          <div className="preview-content">
            <div className="file-info">
              <div className="info-item">
                <span className="info-label">Type:</span>
                <span className="info-value">
                  {selectedFile.endsWith('.jsx') ? 'React Component' :
                   selectedFile.endsWith('.mjs') ? 'JavaScript Module' :
                   selectedFile.endsWith('.css') ? 'Stylesheet' :
                   selectedFile.endsWith('.json') ? 'JSON Data' :
                   'File'}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Modified:</span>
                <span className="info-value">2 hours ago</span>
              </div>
              <div className="info-item">
                <span className="info-label">Size:</span>
                <span className="info-value">
                  {Math.floor(Math.random() * 50) + 5}KB
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileExplorer;
