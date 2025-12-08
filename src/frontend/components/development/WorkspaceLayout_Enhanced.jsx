import React, { useState, useRef, useCallback, useEffect } from 'react';
import './WorkspaceLayout.css';

// Panel Components
import CommandCenter from './panels/CommandCenter';
import ArchitectBot from './panels/ArchitectBot';
import NavigatorBot from './panels/NavigatorBot';
import Terminal from './panels/Terminal';
import FileExplorer from './panels/FileExplorer';
import SettingsPanel from './panels/SettingsPanel';

const PANEL_TYPES = {
  COMMAND_CENTER: 'command_center',
  ARCHITECT_BOT: 'architect_bot',
  NAVIGATOR_BOT: 'navigator_bot',
  TERMINAL: 'terminal',
  FILE_EXPLORER: 'file_explorer',
  SETTINGS: 'settings'
};

// Grid and snapping configuration
const GRID_SIZE = 20;
const SNAP_THRESHOLD = 10;
const MIN_PANEL_SIZE = { width: 200, height: 150 };

const DEFAULT_LAYOUT = {
  panels: [
    {
      id: 'command_center',
      type: PANEL_TYPES.COMMAND_CENTER,
      title: 'Command Center',
      position: { x: 20, y: 20 },
      size: { width: 800, height: 600 },
      minimized: false,
      maximized: false,
      zIndex: 1,
      locked: false,
      opacity: 1
    },
    {
      id: 'architect_bot',
      type: PANEL_TYPES.ARCHITECT_BOT,
      title: 'Architect Bot',
      position: { x: 850, y: 20 },
      size: { width: 450, height: 400 },
      minimized: false,
      maximized: false,
      zIndex: 2,
      locked: false,
      opacity: 1
    },
    {
      id: 'navigator_bot',
      type: PANEL_TYPES.NAVIGATOR_BOT,
      title: 'Navigator Bot',
      position: { x: 850, y: 440 },
      size: { width: 450, height: 400 },
      minimized: false,
      maximized: false,
      zIndex: 3,
      locked: false,
      opacity: 1
    },
    {
      id: 'terminal',
      type: PANEL_TYPES.TERMINAL,
      title: 'Terminal',
      position: { x: 20, y: 640 },
      size: { width: 600, height: 300 },
      minimized: false,
      maximized: false,
      zIndex: 4,
      locked: false,
      opacity: 1
    },
    {
      id: 'file_explorer',
      type: PANEL_TYPES.FILE_EXPLORER,
      title: 'Files',
      position: { x: 1320, y: 20 },
      size: { width: 300, height: 600 },
      minimized: false,
      maximized: false,
      zIndex: 5,
      locked: false,
      opacity: 1
    }
  ],
  theme: 'vscode-dark',
  gridEnabled: true,
  snapToGrid: true,
  showGrid: false,
  gridSize: GRID_SIZE,
  layoutLocked: false
};

const WorkspaceLayout = () => {
  const [layout, setLayout] = useState(() => {
    const saved = localStorage.getItem('relay_workspace_layout');
    return saved ? JSON.parse(saved) : DEFAULT_LAYOUT;
  });
  
  const [activePanel, setActivePanel] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragData, setDragData] = useState(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeData, setResizeData] = useState(null);
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);
  const [showGridSettings, setShowGridSettings] = useState(false);
  const [dragPreview, setDragPreview] = useState(null);
  const [snapZones, setSnapZones] = useState([]);
  const [currentSnapZone, setCurrentSnapZone] = useState(null);
  const [suggestedLayout, setSuggestedLayout] = useState(null);
  const [showLayoutSuggestion, setShowLayoutSuggestion] = useState(false);
  
  const workspaceRef = useRef(null);

  // Grid and snapping utilities
  const snapToGrid = useCallback((value, gridSize) => {
    return Math.round(value / gridSize) * gridSize;
  }, []);

  const snapPosition = useCallback((position) => {
    if (!layout.snapToGrid) return position;
    return {
      x: snapToGrid(position.x, layout.gridSize),
      y: snapToGrid(position.y, layout.gridSize)
    };
  }, [layout.snapToGrid, layout.gridSize, snapToGrid]);

  const snapSize = useCallback((size) => {
    if (!layout.snapToGrid) return size;
    return {
      width: Math.max(MIN_PANEL_SIZE.width, snapToGrid(size.width, layout.gridSize)),
      height: Math.max(MIN_PANEL_SIZE.height, snapToGrid(size.height, layout.gridSize))
    };
  }, [layout.snapToGrid, layout.gridSize, snapToGrid]);

  // Enhanced snap zones calculation
  const calculateSnapZones = useCallback((draggingPanel, mousePosition) => {
    const zones = [];
    const ZONE_THRESHOLD = 50;
    
    layout.panels.forEach(panel => {
      if (panel.id === draggingPanel.id || panel.minimized || panel.maximized) return;
      
      const panelRect = {
        left: panel.position.x,
        top: panel.position.y,
        right: panel.position.x + panel.size.width,
        bottom: panel.position.y + panel.size.height,
        width: panel.size.width,
        height: panel.size.height
      };
      
      const distances = {
        left: Math.abs(mousePosition.x - panelRect.left),
        right: Math.abs(mousePosition.x - panelRect.right),
        top: Math.abs(mousePosition.y - panelRect.top),
        bottom: Math.abs(mousePosition.y - panelRect.bottom)
      };
      
      if (distances.left < ZONE_THRESHOLD) {
        zones.push({
          type: 'left',
          targetPanel: panel.id,
          rect: {
            x: panelRect.left - draggingPanel.size.width,
            y: panelRect.top,
            width: draggingPanel.size.width,
            height: Math.max(draggingPanel.size.height, panelRect.height)
          },
          suggestedSize: { width: draggingPanel.size.width, height: panelRect.height }
        });
      }
      
      if (distances.right < ZONE_THRESHOLD) {
        zones.push({
          type: 'right',
          targetPanel: panel.id,
          rect: {
            x: panelRect.right,
            y: panelRect.top,
            width: draggingPanel.size.width,
            height: Math.max(draggingPanel.size.height, panelRect.height)
          },
          suggestedSize: { width: draggingPanel.size.width, height: panelRect.height }
        });
      }
      
      if (distances.top < ZONE_THRESHOLD) {
        zones.push({
          type: 'top',
          targetPanel: panel.id,
          rect: {
            x: panelRect.left,
            y: panelRect.top - draggingPanel.size.height,
            width: Math.max(draggingPanel.size.width, panelRect.width),
            height: draggingPanel.size.height
          },
          suggestedSize: { width: panelRect.width, height: draggingPanel.size.height }
        });
      }
      
      if (distances.bottom < ZONE_THRESHOLD) {
        zones.push({
          type: 'bottom',
          targetPanel: panel.id,
          rect: {
            x: panelRect.left,
            y: panelRect.bottom,
            width: Math.max(draggingPanel.size.width, panelRect.width),
            height: draggingPanel.size.height
          },
          suggestedSize: { width: panelRect.width, height: draggingPanel.size.height }
        });
      }
    });
    
    return zones;
  }, [layout.panels]);

  const findBestSnapZone = useCallback((zones, mousePosition) => {
    let bestZone = null;
    let minDistance = Infinity;
    
    zones.forEach(zone => {
      const centerX = zone.rect.x + zone.rect.width / 2;
      const centerY = zone.rect.y + zone.rect.height / 2;
      const distance = Math.sqrt(
        Math.pow(mousePosition.x - centerX, 2) + 
        Math.pow(mousePosition.y - centerY, 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        bestZone = zone;
      }
    });
    
    return bestZone;
  }, []);

  const generateLayoutSuggestion = useCallback((draggingPanel, snapZone) => {
    if (!snapZone) return null;
    
    const targetPanel = layout.panels.find(p => p.id === snapZone.targetPanel);
    if (!targetPanel) return null;
    
    return {
      draggingPanel: {
        ...draggingPanel,
        position: { x: snapZone.rect.x, y: snapZone.rect.y },
        size: snapZone.suggestedSize
      },
      targetPanel: targetPanel,
      snapZone: snapZone,
      description: `Dock ${draggingPanel.title} to the ${snapZone.type} of ${targetPanel.title}`
    };
  }, [layout.panels]);

  const findSnapTargets = useCallback((panel, newPosition) => {
    const targets = [];
    const SNAP_DISTANCE = 20;
    
    layout.panels.forEach(otherPanel => {
      if (otherPanel.id === panel.id || otherPanel.minimized || otherPanel.maximized) return;
      
      const otherRect = {
        left: otherPanel.position.x,
        right: otherPanel.position.x + otherPanel.size.width,
        top: otherPanel.position.y,
        bottom: otherPanel.position.y + otherPanel.size.height
      };
      
      const panelRect = {
        left: newPosition.x,
        right: newPosition.x + panel.size.width,
        top: newPosition.y,
        bottom: newPosition.y + panel.size.height
      };
      
      if (Math.abs(panelRect.left - otherRect.right) < SNAP_DISTANCE) {
        targets.push({ type: 'vertical', value: otherRect.right });
      }
      if (Math.abs(panelRect.right - otherRect.left) < SNAP_DISTANCE) {
        targets.push({ type: 'vertical', value: otherRect.left - panel.size.width });
      }
      if (Math.abs(panelRect.top - otherRect.bottom) < SNAP_DISTANCE) {
        targets.push({ type: 'horizontal', value: otherRect.bottom });
      }
      if (Math.abs(panelRect.bottom - otherRect.top) < SNAP_DISTANCE) {
        targets.push({ type: 'horizontal', value: otherRect.top - panel.size.height });
      }
    });
    
    return targets;
  }, [layout.panels]);

  useEffect(() => {
    localStorage.setItem('relay_workspace_layout', JSON.stringify(layout));
  }, [layout]);

  const updatePanel = useCallback((panelId, updates) => {
    setLayout(prev => ({
      ...prev,
      panels: prev.panels.map(panel => 
        panel.id === panelId ? { ...panel, ...updates } : panel
      )
    }));
  }, []);

  const bringToFront = useCallback((panelId) => {
    const maxZ = Math.max(...layout.panels.map(p => p.zIndex));
    updatePanel(panelId, { zIndex: maxZ + 1 });
    setActivePanel(panelId);
  }, [layout.panels, updatePanel]);

  const minimizePanel = useCallback((panelId) => {
    updatePanel(panelId, { minimized: true });
  }, [updatePanel]);

  const maximizePanel = useCallback((panelId) => {
    const panel = layout.panels.find(p => p.id === panelId);
    if (panel.maximized) {
      updatePanel(panelId, { 
        maximized: false,
        position: panel.restorePosition || panel.position,
        size: panel.restoreSize || panel.size
      });
    } else {
      updatePanel(panelId, { 
        maximized: true,
        restorePosition: panel.position,
        restoreSize: panel.size,
        position: { x: 0, y: 0 },
        size: { width: window.innerWidth, height: window.innerHeight }
      });
    }
  }, [layout.panels, updatePanel]);

  const closePanel = useCallback((panelId) => {
    setLayout(prev => ({
      ...prev,
      panels: prev.panels.filter(panel => panel.id !== panelId)
    }));
  }, []);

  const restorePanel = useCallback((panelId) => {
    updatePanel(panelId, { minimized: false });
  }, [updatePanel]);

  // Enhanced mouse down with improved feedback
  const handleMouseDown = useCallback((e, panelId) => {
    const panel = layout.panels.find(p => p.id === panelId);
    if (panel?.locked) return;
    
    const isDragArea = e.target.closest('.panel-header') || 
                      e.target.classList.contains('drag-handle') ||
                      (e.target.classList.contains('workspace-panel') && 
                       !e.target.closest('.panel-content'));
    
    if (e.target.closest('.panel-controls') || 
        e.target.closest('.resize-handle') ||
        (!isDragArea && e.target.closest('.panel-content'))) {
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    bringToFront(panelId);
    setIsDragging(true);
    setActivePanel(panelId);
    
    const rect = e.currentTarget.getBoundingClientRect();
    const startPosition = panel.position;
    
    setDragData({
      panelId,
      startX: e.clientX,
      startY: e.clientY,
      startPosition,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top
    });
    
    setDragPreview({
      position: startPosition,
      size: panel.size,
      isSnapping: false
    });
    
    document.body.classList.add('is-dragging');
  }, [layout.panels, bringToFront]);

  const handleMouseMove = useCallback((e) => {
    if (isDragging && dragData) {
      const deltaX = e.clientX - dragData.startX;
      const deltaY = e.clientY - dragData.startY;
      
      const draggingPanel = layout.panels.find(p => p.id === dragData.panelId);
      if (!draggingPanel) return;
      
      let newPosition = {
        x: Math.max(0, dragData.startPosition.x + deltaX),
        y: Math.max(0, dragData.startPosition.y + deltaY)
      };

      const mousePosition = { x: e.clientX, y: e.clientY };
      const zones = calculateSnapZones(draggingPanel, mousePosition);
      const bestZone = findBestSnapZone(zones, mousePosition);
      
      setSnapZones(zones);
      setCurrentSnapZone(bestZone);
      
      if (bestZone) {
        const suggestion = generateLayoutSuggestion(draggingPanel, bestZone);
        setSuggestedLayout(suggestion);
        setShowLayoutSuggestion(true);
        
        setDragPreview({
          position: { x: bestZone.rect.x, y: bestZone.rect.y },
          size: bestZone.suggestedSize,
          isSnapping: true
        });
      } else {
        setShowLayoutSuggestion(false);
        setDragPreview({
          position: newPosition,
          size: draggingPanel.size,
          isSnapping: false
        });
      }

      if (layout.snapToGrid && !bestZone) {
        newPosition = snapPosition(newPosition);
      }

      updatePanel(dragData.panelId, { position: newPosition });
    }
    
    if (isResizing && resizeData) {
      const deltaX = e.clientX - resizeData.startX;
      const deltaY = e.clientY - resizeData.startY;
      const direction = resizeData.direction;
      
      let newSize = { ...resizeData.startSize };
      let newPosition = { ...resizeData.startPosition };
      
      switch (direction) {
        case 'se':
          newSize.width = Math.max(MIN_PANEL_SIZE.width, resizeData.startSize.width + deltaX);
          newSize.height = Math.max(MIN_PANEL_SIZE.height, resizeData.startSize.height + deltaY);
          break;
        case 'sw':
          newSize.width = Math.max(MIN_PANEL_SIZE.width, resizeData.startSize.width - deltaX);
          newSize.height = Math.max(MIN_PANEL_SIZE.height, resizeData.startSize.height + deltaY);
          newPosition.x = resizeData.startPosition.x + (resizeData.startSize.width - newSize.width);
          break;
        case 'ne':
          newSize.width = Math.max(MIN_PANEL_SIZE.width, resizeData.startSize.width + deltaX);
          newSize.height = Math.max(MIN_PANEL_SIZE.height, resizeData.startSize.height - deltaY);
          newPosition.y = resizeData.startPosition.y + (resizeData.startSize.height - newSize.height);
          break;
        case 'nw':
          newSize.width = Math.max(MIN_PANEL_SIZE.width, resizeData.startSize.width - deltaX);
          newSize.height = Math.max(MIN_PANEL_SIZE.height, resizeData.startSize.height - deltaY);
          newPosition.x = resizeData.startPosition.x + (resizeData.startSize.width - newSize.width);
          newPosition.y = resizeData.startPosition.y + (resizeData.startSize.height - newSize.height);
          break;
        case 'e':
          newSize.width = Math.max(MIN_PANEL_SIZE.width, resizeData.startSize.width + deltaX);
          break;
        case 'w':
          newSize.width = Math.max(MIN_PANEL_SIZE.width, resizeData.startSize.width - deltaX);
          newPosition.x = resizeData.startPosition.x + (resizeData.startSize.width - newSize.width);
          break;
        case 's':
          newSize.height = Math.max(MIN_PANEL_SIZE.height, resizeData.startSize.height + deltaY);
          break;
        case 'n':
          newSize.height = Math.max(MIN_PANEL_SIZE.height, resizeData.startSize.height - deltaY);
          newPosition.y = resizeData.startPosition.y + (resizeData.startSize.height - newSize.height);
          break;
      }

      if (layout.snapToGrid) {
        newSize = snapSize(newSize);
        newPosition = snapPosition(newPosition);
      }
      
      updatePanel(resizeData.panelId, { size: newSize, position: newPosition });
    }
  }, [isDragging, dragData, isResizing, resizeData, layout.snapToGrid, layout.panels, snapPosition, snapSize, updatePanel, calculateSnapZones, findBestSnapZone, generateLayoutSuggestion]);

  const handleMouseUp = useCallback(() => {
    if (isDragging && currentSnapZone && suggestedLayout) {
      updatePanel(dragData.panelId, {
        position: suggestedLayout.draggingPanel.position,
        size: suggestedLayout.draggingPanel.size
      });
    }
    
    setIsDragging(false);
    setDragData(null);
    setIsResizing(false);
    setResizeData(null);
    setDragPreview(null);
    setSnapZones([]);
    setCurrentSnapZone(null);
    setSuggestedLayout(null);
    setShowLayoutSuggestion(false);
    
    document.body.classList.remove('is-dragging', 'is-resizing');
  }, [isDragging, currentSnapZone, suggestedLayout, dragData, updatePanel]);

  const handleResizeStart = useCallback((e, panelId, direction = 'se') => {
    e.stopPropagation();
    e.preventDefault();
    
    const panel = layout.panels.find(p => p.id === panelId);
    if (!panel) return;
    
    setIsResizing(true);
    setResizeData({
      panelId,
      direction,
      startX: e.clientX,
      startY: e.clientY,
      startSize: panel.size,
      startPosition: panel.position
    });
    
    document.body.classList.add('is-resizing');
  }, [layout.panels]);

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  const acceptLayoutSuggestion = useCallback(() => {
    if (suggestedLayout && dragData) {
      updatePanel(dragData.panelId, {
        position: suggestedLayout.draggingPanel.position,
        size: suggestedLayout.draggingPanel.size
      });
      
      setSuggestedLayout(null);
      setShowLayoutSuggestion(false);
      setCurrentSnapZone(null);
    }
  }, [suggestedLayout, dragData, updatePanel]);

  const dismissLayoutSuggestion = useCallback(() => {
    setSuggestedLayout(null);
    setShowLayoutSuggestion(false);
    setCurrentSnapZone(null);
  }, []);

  const getDragPreviewStyle = useCallback(() => {
    if (!dragPreview) return {};
    
    return {
      position: 'absolute',
      left: dragPreview.position.x,
      top: dragPreview.position.y,
      width: dragPreview.size.width,
      height: dragPreview.size.height,
      border: dragPreview.isSnapping ? '2px solid #007acc' : '2px dashed #666',
      backgroundColor: dragPreview.isSnapping ? 'rgba(0, 122, 204, 0.1)' : 'rgba(255, 255, 255, 0.05)',
      borderRadius: '4px',
      pointerEvents: 'none',
      zIndex: 10000,
      transition: dragPreview.isSnapping ? 'all 0.2s ease-out' : 'none'
    };
  }, [dragPreview]);

  // Enhanced grid functions
  const fitAllToGrid = useCallback(() => {
    setLayout(prev => ({
      ...prev,
      panels: prev.panels.map(panel => {
        if (panel.minimized || panel.maximized) return panel;
        
        const snappedPosition = snapPosition(panel.position);
        const snappedSize = snapSize(panel.size);
        
        return {
          ...panel,
          position: snappedPosition,
          size: snappedSize
        };
      })
    }));
  }, [snapPosition, snapSize]);

  const autoOrganize = useCallback(() => {
    const visiblePanels = layout.panels.filter(p => !p.minimized && !p.maximized);
    if (visiblePanels.length === 0) return;
    
    const workspaceWidth = workspaceRef.current?.clientWidth || 1920;
    const workspaceHeight = workspaceRef.current?.clientHeight || 1080;
    
    const cols = Math.ceil(Math.sqrt(visiblePanels.length));
    const rows = Math.ceil(visiblePanels.length / cols);
    
    const panelWidth = Math.floor((workspaceWidth - (cols + 1) * layout.gridSize) / cols);
    const panelHeight = Math.floor((workspaceHeight - (rows + 1) * layout.gridSize - 60) / rows);
    
    const gridPanelWidth = snapToGrid(panelWidth, layout.gridSize);
    const gridPanelHeight = snapToGrid(panelHeight, layout.gridSize);
    
    let panelIndex = 0;
    setLayout(prev => ({
      ...prev,
      panels: prev.panels.map(panel => {
        if (panel.minimized || panel.maximized) return panel;
        
        const row = Math.floor(panelIndex / cols);
        const col = panelIndex % cols;
        panelIndex++;
        
        const x = snapToGrid(layout.gridSize + col * (gridPanelWidth + layout.gridSize), layout.gridSize);
        const y = snapToGrid(layout.gridSize + row * (gridPanelHeight + layout.gridSize) + 60, layout.gridSize);
        
        return {
          ...panel,
          position: { x, y },
          size: { width: gridPanelWidth, height: gridPanelHeight }
        };
      })
    }));
  }, [layout.panels, layout.gridSize, snapToGrid, workspaceRef]);

  const smartSnapAll = useCallback(() => {
    setLayout(prev => ({
      ...prev,
      panels: prev.panels.map(panel => {
        if (panel.minimized || panel.maximized) return panel;
        
        const snapTargets = findSnapTargets(panel, panel.position);
        let newPosition = { ...panel.position };
        
        snapTargets.forEach(target => {
          if (target.type === 'vertical') {
            newPosition.x = target.value;
          } else if (target.type === 'horizontal') {
            newPosition.y = target.value;
          }
        });
        
        if (layout.snapToGrid) {
          newPosition = snapPosition(newPosition);
        }
        
        return {
          ...panel,
          position: newPosition
        };
      })
    }));
  }, [layout.panels, layout.snapToGrid, findSnapTargets, snapPosition]);

  const renderPanelContent = (panel) => {
    switch (panel.type) {
      case PANEL_TYPES.COMMAND_CENTER:
        return <CommandCenter />;
      case PANEL_TYPES.ARCHITECT_BOT:
        return <ArchitectBot />;
      case PANEL_TYPES.NAVIGATOR_BOT:
        return <NavigatorBot />;
      case PANEL_TYPES.TERMINAL:
        return <Terminal />;
      case PANEL_TYPES.FILE_EXPLORER:
        return <FileExplorer />;
      case PANEL_TYPES.SETTINGS:
        return <SettingsPanel />;
      default:
        return <div>Unknown panel type</div>;
    }
  };

  const resetLayout = () => {
    setLayout(DEFAULT_LAYOUT);
  };

  const exportLayout = () => {
    const layoutData = JSON.stringify(layout, null, 2);
    const blob = new Blob([layoutData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relay-workspace-layout-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const arrangeHorizontally = () => {
    const visiblePanels = layout.panels.filter(p => !p.minimized);
    const workspaceWidth = workspaceRef.current?.clientWidth || 1920;
    const panelWidth = Math.floor(workspaceWidth / visiblePanels.length) - 10;
    
    setLayout(prev => ({
      ...prev,
      panels: prev.panels.map((panel, index) => {
        if (panel.minimized) return panel;
        return {
          ...panel,
          position: { x: index * (panelWidth + 10), y: 20 },
          size: { width: panelWidth, height: panel.size.height }
        };
      })
    }));
  };

  const arrangeVertically = () => {
    const visiblePanels = layout.panels.filter(p => !p.minimized);
    const workspaceHeight = workspaceRef.current?.clientHeight || 1080;
    const panelHeight = Math.floor(workspaceHeight / visiblePanels.length) - 50;
    
    setLayout(prev => ({
      ...prev,
      panels: prev.panels.map((panel, index) => {
        if (panel.minimized) return panel;
        return {
          ...panel,
          position: { x: panel.position.x, y: 20 + index * (panelHeight + 10) },
          size: { width: panel.size.width, height: panelHeight }
        };
      })
    }));
  };

  const arrangeGrid = () => {
    const visiblePanels = layout.panels.filter(p => !p.minimized);
    const cols = Math.ceil(Math.sqrt(visiblePanels.length));
    const rows = Math.ceil(visiblePanels.length / cols);
    const workspaceWidth = workspaceRef.current?.clientWidth || 1920;
    const workspaceHeight = workspaceRef.current?.clientHeight || 1080;
    const panelWidth = Math.floor(workspaceWidth / cols) - 20;
    const panelHeight = Math.floor(workspaceHeight / rows) - 50;
    
    let panelIndex = 0;
    setLayout(prev => ({
      ...prev,
      panels: prev.panels.map(panel => {
        if (panel.minimized) return panel;
        const row = Math.floor(panelIndex / cols);
        const col = panelIndex % cols;
        panelIndex++;
        return {
          ...panel,
          position: { 
            x: 10 + col * (panelWidth + 10), 
            y: 20 + row * (panelHeight + 10) 
          },
          size: { width: panelWidth, height: panelHeight }
        };
      })
    }));
  };

  const toggleGridSettings = () => {
    setShowGridSettings(!showGridSettings);
  };

  const updateLayoutSetting = (key, value) => {
    setLayout(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const lockAllPanels = () => {
    setLayout(prev => ({
      ...prev,
      panels: prev.panels.map(panel => ({ ...panel, locked: true }))
    }));
  };

  const unlockAllPanels = () => {
    setLayout(prev => ({
      ...prev,
      panels: prev.panels.map(panel => ({ ...panel, locked: false }))
    }));
  };

  const importLayout = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedLayout = JSON.parse(e.target.result);
          setLayout(importedLayout);
        } catch (error) {
          console.error('Failed to import layout:', error);
          alert('Invalid layout file');
        }
      };
      reader.readAsText(file);
    }
  };

  const minimizedPanels = layout.panels.filter(panel => panel.minimized);
  const visiblePanels = layout.panels.filter(panel => !panel.minimized);

  return (
    <div 
      className={`workspace-layout theme-${layout.theme} ${layout.showGrid ? 'show-grid' : ''}`} 
      ref={workspaceRef}
      style={{
        '--grid-size': `${layout.gridSize}px`,
        backgroundImage: layout.showGrid ? 
          `radial-gradient(circle, var(--panel-border) 1px, transparent 1px)` : 'none',
        backgroundSize: layout.showGrid ? `${layout.gridSize}px ${layout.gridSize}px` : 'auto'
      }}
    >
      {/* Enhanced Workspace Controls */}
      <div className="workspace-controls">
        <div className="control-group">
          <button 
            onClick={() => setShowLayoutMenu(!showLayoutMenu)} 
            className="control-btn primary"
            title="Layout Options"
          >
            ⚙️ Layout
          </button>
          
          {showLayoutMenu && (
            <div className="layout-dropdown">
              <div className="dropdown-section">
                <h4>Arrange</h4>
                <button onClick={arrangeHorizontally} className="dropdown-btn">
                  📄 Horizontal
                </button>
                <button onClick={arrangeVertically} className="dropdown-btn">
                  📊 Vertical
                </button>
                <button onClick={arrangeGrid} className="dropdown-btn">
                  ⚏ Grid
                </button>
              </div>
              
              <div className="dropdown-section">
                <h4>Lock</h4>
                <button onClick={lockAllPanels} className="dropdown-btn">
                  🔒 Lock All
                </button>
                <button onClick={unlockAllPanels} className="dropdown-btn">
                  🔓 Unlock All
                </button>
              </div>
              
              <div className="dropdown-section">
                <h4>Layout</h4>
                <button onClick={resetLayout} className="dropdown-btn">
                  🔄 Reset
                </button>
                <button onClick={exportLayout} className="dropdown-btn">
                  💾 Export
                </button>
                <label className="dropdown-btn file-input">
                  📁 Import
                  <input type="file" accept=".json" onChange={importLayout} style={{ display: 'none' }} />
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="control-group">
          <button 
            onClick={toggleGridSettings} 
            className={`control-btn ${layout.snapToGrid ? 'active' : ''}`}
            title="Grid & Snap Settings"
          >
            ⊞ Grid
          </button>
          
          {showGridSettings && (
            <div className="grid-settings-dropdown">
              <div className="setting-row">
                <label>
                  <input 
                    type="checkbox" 
                    checked={layout.snapToGrid}
                    onChange={(e) => updateLayoutSetting('snapToGrid', e.target.checked)}
                  />
                  Snap to Grid
                </label>
              </div>
              
              <div className="setting-row">
                <label>
                  <input 
                    type="checkbox" 
                    checked={layout.showGrid}
                    onChange={(e) => updateLayoutSetting('showGrid', e.target.checked)}
                  />
                  Show Grid
                </label>
              </div>
              
              <div className="setting-row">
                <label>
                  Grid Size: 
                  <input 
                    type="range" 
                    min="10" 
                    max="50" 
                    value={layout.gridSize}
                    onChange={(e) => updateLayoutSetting('gridSize', parseInt(e.target.value))}
                  />
                  <span>{layout.gridSize}px</span>
                </label>
              </div>
              
              <div className="setting-divider"></div>
              
              <div className="setting-row">
                <button 
                  onClick={fitAllToGrid}
                  className="snap-action-btn"
                  title="Snap all panels to grid"
                >
                  📐 Fit All to Grid
                </button>
              </div>
              
              <div className="setting-row">
                <button 
                  onClick={autoOrganize}
                  className="snap-action-btn"
                  title="Auto-organize panels in grid"
                >
                  🔲 Auto Organize
                </button>
              </div>
              
              <div className="setting-row">
                <button 
                  onClick={smartSnapAll}
                  className="snap-action-btn"
                  title="Snap all panels to nearby edges"
                >
                  🧲 Smart Snap All
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="control-group">
          <button 
            onClick={() => updateLayoutSetting('theme', layout.theme === 'vscode-dark' ? 'vscode-light' : 'vscode-dark')} 
            className="control-btn"
            title="Toggle Theme"
          >
            {layout.theme === 'vscode-dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      {/* Enhanced Visible Panels */}
      {visiblePanels.map(panel => (
        <div
          key={panel.id}
          className={`workspace-panel ${panel.maximized ? 'maximized' : ''} ${panel.locked ? 'locked' : ''} ${activePanel === panel.id ? 'active' : ''} ${isDragging && dragData?.panelId === panel.id ? 'dragging' : ''} ${currentSnapZone && layout.panels.find(p => p.id === currentSnapZone.targetPanel) === panel ? 'snap-target' : ''}`}
          style={{
            position: 'absolute',
            left: panel.position.x,
            top: panel.position.y,
            width: panel.size.width,
            height: panel.size.height,
            zIndex: panel.zIndex,
            opacity: panel.opacity || 1,
            cursor: panel.locked ? 'default' : 'move'
          }}
          onMouseDown={(e) => !panel.locked && handleMouseDown(e, panel.id)}
        >
          <div className={`panel-header ${panel.locked ? 'locked' : ''}`}>
            <div className="panel-title-group">
              <div className="panel-title">{panel.title}</div>
              {panel.locked && <span className="lock-indicator">🔒</span>}
            </div>
            <div className="panel-controls">
              <button 
                className="panel-control opacity"
                onClick={() => updatePanel(panel.id, { 
                  opacity: panel.opacity === 1 ? 0.5 : 1 
                })}
                title="Toggle Opacity"
              >
                👁️
              </button>
              <button 
                className="panel-control lock"
                onClick={() => updatePanel(panel.id, { locked: !panel.locked })}
                title={panel.locked ? "Unlock Panel" : "Lock Panel"}
              >
                {panel.locked ? '🔓' : '🔒'}
              </button>
              <button 
                className="panel-control minimize"
                onClick={() => minimizePanel(panel.id)}
                title="Minimize"
              >
                −
              </button>
              <button 
                className="panel-control maximize"
                onClick={() => maximizePanel(panel.id)}
                title={panel.maximized ? "Restore" : "Maximize"}
              >
                {panel.maximized ? '❐' : '□'}
              </button>
              <button 
                className="panel-control close"
                onClick={() => closePanel(panel.id)}
                title="Close"
              >
                ×
              </button>
            </div>
          </div>
          
          <div className="panel-content">
            {renderPanelContent(panel)}
          </div>
          
          {/* Enhanced resize handles for all edges */}
          {!panel.locked && !panel.maximized && (
            <>
              {/* Corner handles */}
              <div 
                className="resize-handle corner bottom-right"
                onMouseDown={(e) => handleResizeStart(e, panel.id, 'se')}
                title="Resize"
              />
              <div 
                className="resize-handle corner bottom-left"
                onMouseDown={(e) => handleResizeStart(e, panel.id, 'sw')}
                title="Resize"
              />
              <div 
                className="resize-handle corner top-right"
                onMouseDown={(e) => handleResizeStart(e, panel.id, 'ne')}
                title="Resize"
              />
              <div 
                className="resize-handle corner top-left"
                onMouseDown={(e) => handleResizeStart(e, panel.id, 'nw')}
                title="Resize"
              />
              
              {/* Edge handles */}
              <div 
                className="resize-handle edge right"
                onMouseDown={(e) => handleResizeStart(e, panel.id, 'e')}
                title="Resize width"
              />
              <div 
                className="resize-handle edge left"
                onMouseDown={(e) => handleResizeStart(e, panel.id, 'w')}
                title="Resize width"
              />
              <div 
                className="resize-handle edge bottom"
                onMouseDown={(e) => handleResizeStart(e, panel.id, 's')}
                title="Resize height"
              />
              <div 
                className="resize-handle edge top"
                onMouseDown={(e) => handleResizeStart(e, panel.id, 'n')}
                title="Resize height"
              />
              
              {/* Drag handle indicator */}
              <div className="drag-handle" title="Drag to move">
                <span className="drag-dots">⋮⋮</span>
              </div>
            </>
          )}
        </div>
      ))}

      {/* Taskbar for minimized panels */}
      {minimizedPanels.length > 0 && (
        <div className="taskbar">
          {minimizedPanels.map(panel => (
            <button
              key={panel.id}
              className="taskbar-item"
              onClick={() => restorePanel(panel.id)}
            >
              {panel.title}
            </button>
          ))}
        </div>
      )}

      {/* Drag Preview */}
      {dragPreview && (
        <div className="drag-preview" style={getDragPreviewStyle()}>
          {dragPreview.isSnapping && (
            <div className="snap-indicator">
              <span>⚡ Snap Zone</span>
            </div>
          )}
        </div>
      )}

      {/* Snap Zones Visualization */}
      {isDragging && snapZones.map((zone, index) => (
        <div
          key={index}
          className={`snap-zone ${currentSnapZone === zone ? 'active' : ''}`}
          style={{
            position: 'absolute',
            left: zone.rect.x,
            top: zone.rect.y,
            width: zone.rect.width,
            height: zone.rect.height,
            border: currentSnapZone === zone ? '2px solid #007acc' : '1px dashed #666',
            backgroundColor: currentSnapZone === zone ? 'rgba(0, 122, 204, 0.2)' : 'rgba(255, 255, 255, 0.05)',
            pointerEvents: 'none',
            zIndex: 9999,
            borderRadius: '4px',
            transition: 'all 0.15s ease-out'
          }}
        >
          {currentSnapZone === zone && (
            <div className="snap-zone-label">
              {zone.type.toUpperCase()}
            </div>
          )}
        </div>
      ))}

      {/* Layout Suggestion Popup */}
      {showLayoutSuggestion && suggestedLayout && (
        <div className="layout-suggestion-popup">
          <div className="suggestion-content">
            <div className="suggestion-icon">⚡</div>
            <div className="suggestion-text">
              <strong>Layout Suggestion</strong>
              <p>{suggestedLayout.description}</p>
            </div>
            <div className="suggestion-actions">
              <button 
                className="accept-btn"
                onClick={acceptLayoutSuggestion}
                title="Accept this layout suggestion"
              >
                ✓ Accept
              </button>
              <button 
                className="dismiss-btn"
                onClick={dismissLayoutSuggestion}
                title="Dismiss suggestion"
              >
                ✕ Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fluid Drag Helper */}
      {isDragging && (
        <div className="drag-helper">
          <div className="drag-hint">
            🎯 Drag near other panels to see layout suggestions
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceLayout;
