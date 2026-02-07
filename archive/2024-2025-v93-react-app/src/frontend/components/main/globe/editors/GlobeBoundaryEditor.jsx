/**
 * @fileoverview Globe Boundary Editor - On-Globe Visual Polygon Editor
 * 
 * Renders boundary editing UI directly on the 3D Cesium globe with draggable pinpoints.
 * Users can add, move, and delete vertices to reshape boundaries in real-time.
 * 
 * Features:
 * - Draggable pinpoint vertices on globe surface
 * - Add vertices by clicking on polygon lines
 * - Delete vertices with right-click
 * - Real-time polygon rendering
 * - Before/after comparison
 * - Impact visualization (affected regions)
 * - Save as new boundary proposal
 * 
 * @version 2.0 - On-Globe Editor
 * @date October 8, 2025
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import './GlobeBoundaryEditor.css';

const GlobeBoundaryEditor = ({
  cesiumViewer,
  channel,           // Boundary channel
  proposal = null,   // Existing proposal to edit (or null for new)
  regionName,
  regionType,
  regionCode,
  mode: externalMode = 'single', // External mode control from parent
  onSave,
  onCancel,
  onVerticesChange
}) => {
  // CRITICAL: Log component render
  console.log('?? [BOUNDARY EDITOR] Component rendered/re-rendered', {
    regionName,
    regionCode,
    hasViewer: !!cesiumViewer,
    hasChannel: !!channel,
    channelId: channel?.id,
    candidateCount: channel?.candidates?.length,
    hasProposal: !!proposal,
    proposalName: proposal?.name
  });

  // Use global Cesium object (loaded via script tag in index.html)
  const Cesium = window.Cesium;
  
  // State
  const [vertices, setVertices] = useState([]); // Array of {lat, lng, entity, index}
  const [mode, setMode] = useState('view'); // Internal mode: 'view', 'edit', 'add', 'multiple'
  const [originalGeometry, setOriginalGeometry] = useState(null);
  const [showDiff, setShowDiff] = useState(false);
  const [affectedRegions, setAffectedRegions] = useState([]);
  const [description, setDescription] = useState('');
  const [proposalName, setProposalName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVertices, setSelectedVertices] = useState([]); // For multi-select
  
  // ?? Freeform Selection Tool State
  const [freeformMarkers, setFreeformMarkers] = useState([]); // Array of {lat, lng, entity, id}
  const [selectionPolygon, setSelectionPolygon] = useState(null); // Visual polygon connecting markers
  const [isInMultiSelectMode, setIsInMultiSelectMode] = useState(false); // Track if in multi-select mode
  
  // Refs
  const entitiesRef = useRef([]);
  const polygonEntityRef = useRef(null);
  const handlerRef = useRef(null);
  const isDraggingRef = useRef(false);
  const draggedVertexRef = useRef(null);
  const dragStartPositionsRef = useRef(null); // Store original positions at drag start
  const selectedVerticesRef = useRef([]); // CRITICAL: Persist selected vertices across renders
  // ?? Refs for freeform selection
  const freeformHandlerRef = useRef(null); // Separate handler for multi-select mode
  const freeformEntitiesRef = useRef([]); // Track freeform marker entities separately
  const freeformMarkerCountRef = useRef(0); // Track count for label numbering
  const isInMultiSelectModeRef = useRef(false); // ?? CRITICAL: Ref for immediate access in handlers
  // Long-press detection refs
  const longPressTimerRef = useRef(null);
  const longPressStartPosRef = useRef(null);
  const isLongPressRef = useRef(false);
  const LONG_PRESS_DURATION = 500; // milliseconds
  const LONG_PRESS_MOVE_THRESHOLD = 5; // pixels

  /**
   * Track mode changes for debugging
   */
  useEffect(() => {
    console.log(`?? [MODE CHANGE] Mode is now: "${mode}"`);
  }, [mode]);

  /**
   * Sync isInMultiSelectMode state to ref for immediate handler access
   */
  useEffect(() => {
    isInMultiSelectModeRef.current = isInMultiSelectMode;
    console.log(`?? [MULTI-SELECT REF] Updated to: ${isInMultiSelectMode}`);
  }, [isInMultiSelectMode]);

  /**
   * Initialize - Load proposal or start new boundary
   */
  useEffect(() => {
    if (!cesiumViewer) {
      console.warn('?? [BOUNDARY EDITOR] Cesium viewer not available');
      return;
    }

    if (!Cesium) {
      console.error('? [BOUNDARY EDITOR] Cesium library not loaded!');
      return;
    }

    console.log('??? [BOUNDARY EDITOR] Initializing editor for', regionName);

    if (proposal) {
      loadProposal(proposal);
    } else {
      loadOfficialBoundary();
    }

    return () => {
      cleanup();
    };
  }, [cesiumViewer, proposal, channel]);

  /**
   * Sync external mode from parent with internal mode
   */
  useEffect(() => {
    console.log('?? [BOUNDARY EDITOR] External mode from parent:', externalMode);
    if (externalMode === 'multi' || externalMode === 'multiple') {
      console.log('?? [BOUNDARY EDITOR] Parent requested multiple mode - activating');
      setMode('multiple');
    }
  }, [externalMode]);

  /**
   * Change cursor based on mode
   */
  useEffect(() => {
    if (!cesiumViewer?.canvas) return;
    
    const canvas = cesiumViewer.canvas;
    console.log('??? [CURSOR EFFECT] Running - mode:', mode, 'canvas exists:', !!canvas);
    console.log('??? [CURSOR EFFECT] Current canvas cursor:', canvas.style.cursor);
    
    switch (mode) {
      case 'multiple':
        canvas.style.cursor = 'crosshair';
        console.log('? [BOUNDARY EDITOR] Cursor changed to CROSSHAIR for multiple mode');
        break;
      case 'edit':
        canvas.style.cursor = 'pointer';
        break;
      default:
        canvas.style.cursor = 'default';
    }
    
    return () => {
      canvas.style.cursor = 'default';
    };
  }, [mode, cesiumViewer]);

  /**
   * ?? LONG-PRESS MULTI-SELECT TOOL - Always active in edit mode
   * Quick click: Select/Add vertices | Long-press: Multi-select/Delete
   */
  useEffect(() => {
    console.log('?? [LONG-PRESS] Effect running - mode:', mode, 'cesiumViewer:', !!cesiumViewer, 'Cesium:', !!Cesium);
    
    if (!cesiumViewer || !Cesium || mode !== 'edit') {
      console.log('?? [LONG-PRESS] Not in edit mode or missing dependencies, skipping');
      return;
    }
    
    console.log('?? [LONG-PRESS] Activating long-press tool in edit mode');
    
    // Destroy main boundary handler if it exists
    if (handlerRef.current) {
      handlerRef.current.destroy();
      handlerRef.current = null;
    }
    
    // Create dedicated handler for long-press interactions
    const handler = new Cesium.ScreenSpaceEventHandler(cesiumViewer.scene.canvas);
    freeformHandlerRef.current = handler;
    console.log('? [LONG-PRESS] Handler CREATED');
    
    // LEFT_DOWN: Start long-press timer OR place marker if already in mode
    handler.setInputAction((movement) => {
      longPressStartPosRef.current = {
        x: movement.position.x,
        y: movement.position.y
      };
      isLongPressRef.current = false;
      
      // 🎯 CRITICAL: Check if clicking ANY vertex (not just selected) - let edit handler process it
      const pickedObject = cesiumViewer.scene.pick(movement.position);
      if (pickedObject && pickedObject.id && 
          pickedObject.id.properties?.type?.getValue() === 'boundary-vertex') {
        const vertexIndex = pickedObject.id.properties.index.getValue();
        
        // If clicking a selected vertex - initiate drag directly
        if (selectedVerticesRef.current.includes(vertexIndex)) {
          console.log('👆 [LONG-PRESS] Clicked selected vertex - initiating drag');
          
          // Disable camera controls during drag
          cesiumViewer.scene.screenSpaceCameraController.enableRotate = false;
          cesiumViewer.scene.screenSpaceCameraController.enableTranslate = false;
          cesiumViewer.scene.screenSpaceCameraController.enableZoom = false;
          console.log('🔒 [DRAG] Camera controls disabled');
          
          // Store start positions
          isDraggingRef.current = true;
          draggedVertexRef.current = pickedObject.id;
          
          const originalPositions = new Map();
          selectedVerticesRef.current.forEach(idx => {
            if (vertices[idx]) {
              originalPositions.set(idx, { lat: vertices[idx].lat, lng: vertices[idx].lng });
            }
          });
          dragStartPositionsRef.current = originalPositions;
          console.log(`✅ [DRAG] Stored ${originalPositions.size} vertex positions, ready to drag`);
          
          return; // Don't start long-press timer
        }
        
        // If clicking any other vertex in normal edit mode, don't start long-press
        // (let the edit mode handler deal with it)
        if (!isInMultiSelectModeRef.current) {
          console.log('👆 [LONG-PRESS] Clicked vertex in edit mode - skipping long-press, let edit handler process');
          return;
        }
      }
      
      // ?? CRITICAL: Check if already in multi-select mode (use REF for immediate access)
      if (isInMultiSelectModeRef.current) {
        // ALREADY IN MODE → Quick marker placement
        console.log('? [MULTI-SELECT MODE] Quick click - placing marker instantly (ref check)');
        
        const ray = cesiumViewer.camera.getPickRay(movement.position);
        const cartesian = cesiumViewer.scene.globe.pick(ray, cesiumViewer.scene);
        
        if (cartesian) {
          const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
          const lat = Cesium.Math.toDegrees(cartographic.latitude);
          const lng = Cesium.Math.toDegrees(cartographic.longitude);
          
          // Increment marker count
          freeformMarkerCountRef.current += 1;
          const markerNumber = freeformMarkerCountRef.current;
          const markerId = `freeform-marker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          // Create visual marker entity
          const markerEntity = cesiumViewer.entities.add({
            id: markerId,
            position: Cesium.Cartesian3.fromDegrees(lng, lat, 15000),
            point: {
              pixelSize: 16,
              color: Cesium.Color.CYAN,
              outlineColor: Cesium.Color.WHITE,
              outlineWidth: 3,
              heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
              scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.2, 8.0e6, 0.6)
            },
            label: {
              text: `?? ${markerNumber}`,
              font: '14px sans-serif',
              fillColor: Cesium.Color.CYAN,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 2,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              pixelOffset: new Cesium.Cartesian2(0, -25),
              heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
              scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.0, 8.0e6, 0.5)
            },
            properties: new Cesium.PropertyBag({
              type: 'freeform-selection-marker',
              lat: lat,
              lng: lng,
              markerId: markerId
            })
          });
          
          freeformEntitiesRef.current.push(markerEntity);
          
          setFreeformMarkers(prevMarkers => {
            const newMarkers = [...prevMarkers, { lat, lng, entity: markerEntity, id: markerId }];
            console.log(`? [MULTI-SELECT MODE] Marker ${markerNumber} placed: ${newMarkers.length} total markers`);
            
            if (newMarkers.length >= 2) {
              updateSelectionPolygon(newMarkers);
            }
            
            return newMarkers;
          });
        }
        
        return; // Skip long-press timer - already in mode
      }
      
      // NOT IN MODE → Start long-press timer to ENTER mode
      console.log('?? [LONG-PRESS] Mouse down - starting timer to enter multi-select mode');
      
      // Start 500ms timer
      longPressTimerRef.current = setTimeout(() => {
        isLongPressRef.current = true;
        console.log('? [LONG-PRESS] Timer expired - ENTERING MULTI-SELECT MODE!');
        
        // Check what's under cursor
        const pickedObject = cesiumViewer.scene.pick(movement.position);
        
        if (pickedObject && pickedObject.id && 
            pickedObject.id.properties?.type?.getValue() === 'boundary-vertex') {
          // LONG-PRESS ON VERTEX → DELETE (don't enter mode)
          const vertexIndex = pickedObject.id.properties.index.getValue();
          console.log(`??? [LONG-PRESS] Deleting vertex #${vertexIndex}`);
          deleteVertexAtIndex(vertexIndex);
        } else {
          // LONG-PRESS ON EMPTY SPACE → ENTER MULTI-SELECT MODE + PLACE FIRST MARKER
          console.log('? [MULTI-SELECT MODE] Entering mode and placing first marker');
          
          setIsInMultiSelectMode(true); // ENTER MODE
          
          const ray = cesiumViewer.camera.getPickRay(movement.position);
          const cartesian = cesiumViewer.scene.globe.pick(ray, cesiumViewer.scene);
          
          if (cartesian) {
            const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
            const lat = Cesium.Math.toDegrees(cartographic.latitude);
            const lng = Cesium.Math.toDegrees(cartographic.longitude);
            
            // Increment marker count
            freeformMarkerCountRef.current += 1;
            const markerNumber = freeformMarkerCountRef.current;
            const markerId = `freeform-marker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            // Create visual marker entity
            const markerEntity = cesiumViewer.entities.add({
              id: markerId,
              position: Cesium.Cartesian3.fromDegrees(lng, lat, 15000),
              point: {
                pixelSize: 16,
                color: Cesium.Color.CYAN,
                outlineColor: Cesium.Color.WHITE,
                outlineWidth: 3,
                heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
                scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.2, 8.0e6, 0.6)
              },
              label: {
                text: `?? ${markerNumber}`,
                font: '14px sans-serif',
                fillColor: Cesium.Color.CYAN,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -25),
                heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
                scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.0, 8.0e6, 0.5)
              },
              properties: new Cesium.PropertyBag({
                type: 'freeform-selection-marker',
                lat: lat,
                lng: lng,
                markerId: markerId
              })
            });
            
            freeformEntitiesRef.current.push(markerEntity);
            
            setFreeformMarkers(prevMarkers => {
              const newMarkers = [...prevMarkers, { lat, lng, entity: markerEntity, id: markerId }];
              console.log(`? [MULTI-SELECT MODE] First marker placed: ${newMarkers.length} total markers`);
              
              if (newMarkers.length >= 2) {
                updateSelectionPolygon(newMarkers);
              }
              
              return newMarkers;
            });
          }
        }
      }, LONG_PRESS_DURATION);
      
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
    
    // MOUSE_MOVE: Handle dragging OR cancel long-press if mouse moves too far
    handler.setInputAction((movement) => {
      // Handle vertex dragging if active
      if (isDraggingRef.current && draggedVertexRef.current) {
        const ray = cesiumViewer.camera.getPickRay(movement.endPosition);
        const cartesian = cesiumViewer.scene.globe.pick(ray, cesiumViewer.scene);
        
        if (cartesian && dragStartPositionsRef.current) {
          const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
          const newLat = Cesium.Math.toDegrees(cartographic.latitude);
          const newLng = Cesium.Math.toDegrees(cartographic.longitude);
          
          // Calculate offset from first selected vertex's original position
          const firstSelectedIdx = selectedVerticesRef.current[0];
          const originalFirst = dragStartPositionsRef.current.get(firstSelectedIdx);
          
          if (originalFirst) {
            const deltaLat = newLat - originalFirst.lat;
            const deltaLng = newLng - originalFirst.lng;
            
            // Update all selected vertices
            selectedVerticesRef.current.forEach(idx => {
              const original = dragStartPositionsRef.current.get(idx);
              if (original && vertices[idx]) {
                const updatedLat = original.lat + deltaLat;
                const updatedLng = original.lng + deltaLng;
                
                vertices[idx].lat = updatedLat;
                vertices[idx].lng = updatedLng;
                vertices[idx].entity.position = Cesium.Cartesian3.fromDegrees(updatedLng, updatedLat, 10000);
              }
            });
            
            // Redraw the polygon with updated positions
            drawPolygon(vertices);
          }
        }
        return;
      }
      
      // Cancel long-press if mouse moves too far (not dragging)
      if (longPressStartPosRef.current && longPressTimerRef.current) {
        const dx = movement.endPosition.x - longPressStartPosRef.current.x;
        const dy = movement.endPosition.y - longPressStartPosRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > LONG_PRESS_MOVE_THRESHOLD) {
          console.log(`?? [LONG-PRESS] Cancelled - mouse moved ${distance.toFixed(1)}px`);
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    
    // LEFT_UP: End drag OR handle quick click
    handler.setInputAction((click) => {
      // End drag if active
      if (isDraggingRef.current) {
        console.log('✅ [DRAG] Drag complete - re-enabling camera controls');
        isDraggingRef.current = false;
        draggedVertexRef.current = null;
        dragStartPositionsRef.current = null;
        
        // Re-enable camera controls
        cesiumViewer.scene.screenSpaceCameraController.enableRotate = true;
        cesiumViewer.scene.screenSpaceCameraController.enableTranslate = true;
        cesiumViewer.scene.screenSpaceCameraController.enableZoom = true;
        
        // Notify parent of change (send COUNT, not coordinates)
        if (onVerticesChange) {
          onVerticesChange(vertices.length);
          console.log('📊 [DRAG] Notified parent: vertex count =', vertices.length);
        }
        
        // Clear selection after drag
        if (selectedVerticesRef.current.length > 0) {
          console.log('🎯 [DRAG] Clearing selection after drag - click will deselect');
          setSelectedVertices([]);
          selectedVerticesRef.current = [];
          
          // Reset vertex colors
          vertices.forEach((vertex) => {
            if (vertex.entity && vertex.entity.point) {
              vertex.entity.point.pixelSize = 12;
              vertex.entity.point.color = Cesium.Color.CYAN;
              vertex.entity.point.outlineWidth = 2;
              vertex.entity.point.outlineColor = Cesium.Color.WHITE;
            }
          });
        }
        
        return;
      }
      
      // Cancel long-press timer
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      
      // If there's a selection, first click clears it (don't add vertex)
      if (selectedVerticesRef.current.length > 0) {
        console.log('🎯 [CLICK] Clearing selection - NOT adding vertex');
        setSelectedVertices([]);
        selectedVerticesRef.current = [];
        
        // Reset vertex colors
        vertices.forEach((vertex) => {
          if (vertex.entity && vertex.entity.point) {
            vertex.entity.point.pixelSize = 12;
            vertex.entity.point.color = Cesium.Color.CYAN;
            vertex.entity.point.outlineWidth = 2;
            vertex.entity.point.outlineColor = Cesium.Color.WHITE;
          }
        });
        
        isLongPressRef.current = false;
        longPressStartPosRef.current = null;
        return;
      }
      
      // ?? CRITICAL: If in multi-select mode, skip quick-click vertex operations (use REF)
      if (isInMultiSelectModeRef.current) {
        console.log('📍 [MULTI-SELECT MODE] In mode - skipping quick-click vertex operations (ref check)');
        isLongPressRef.current = false;
        longPressStartPosRef.current = null;
        return;
      }
      
      // Check for panning/dragging - don't add vertices if mouse moved significantly
      if (longPressStartPosRef.current) {
        const dx = click.position.x - longPressStartPosRef.current.x;
        const dy = click.position.y - longPressStartPosRef.current.y;
        const moveDistance = Math.sqrt(dx * dx + dy * dy);
        
        if (moveDistance > LONG_PRESS_MOVE_THRESHOLD) {
          console.log(`? [QUICK-CLICK] Cancelled - mouse moved ${moveDistance.toFixed(1)}px (panning/dragging)`);
          isLongPressRef.current = false;
          longPressStartPosRef.current = null;
          return;
        }
      }
      
      // If not a long-press, handle as quick click
      if (!isLongPressRef.current) {
        console.log('?? [QUICK-CLICK] Quick click detected (no movement)');
        
        const pickedObject = cesiumViewer.scene.pick(click.position);
        
        if (pickedObject && pickedObject.id && 
            pickedObject.id.properties?.type?.getValue() === 'boundary-vertex') {
          // QUICK CLICK ON VERTEX → Would be handled by drag handler
          console.log('?? [QUICK-CLICK] Clicked vertex - drag handler will manage');
        } else if (pickedObject && pickedObject.id && 
                   pickedObject.id.properties?.type?.getValue() === 'boundary-polygon') {
          // QUICK CLICK ON LINE → ADD VERTEX
          console.log('?? [QUICK-CLICK] Clicked polygon line - adding vertex');
          const ray = cesiumViewer.camera.getPickRay(click.position);
          const cartesian = cesiumViewer.scene.globe.pick(ray, cesiumViewer.scene);
          if (cartesian) {
            addVertexAtPosition(cartesian);
          }
        } else {
          // QUICK CLICK ON EMPTY SPACE → ADD VERTEX
          console.log('?? [QUICK-CLICK] Clicked empty space - adding vertex');
          const ray = cesiumViewer.camera.getPickRay(click.position);
          const cartesian = cesiumViewer.scene.globe.pick(ray, cesiumViewer.scene);
          if (cartesian) {
            addVertexAtPosition(cartesian);
          }
        }
      }
      
      isLongPressRef.current = false;
      longPressStartPosRef.current = null;
      
    }, Cesium.ScreenSpaceEventType.LEFT_UP);
    
    console.log('? [LONG-PRESS] Multi-select tool activated with long-press detection');
    
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      if (freeformHandlerRef.current) {
        freeformHandlerRef.current.destroy();
        freeformHandlerRef.current = null;
      }
      // NOTE: Don't clear markers on cleanup - they should persist until Accept/Reject
    };
    
  }, [mode, cesiumViewer, Cesium]);

  /**
   * Point-in-Polygon test using ray casting algorithm
   */
  const isPointInPolygon = useCallback((point, polygon) => {
    const x = point.lng;
    const y = point.lat;
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lng;
      const yi = polygon[i].lat;
      const xj = polygon[j].lng;
      const yj = polygon[j].lat;

      const intersect = ((yi > y) !== (yj > y)) &&
        (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      
      if (intersect) inside = !inside;
    }

    return inside;
  }, []);

  /**
   * Finalize selection: Find vertices inside polygon and select them
   */
  const finalizeSelection = useCallback((markers = freeformMarkers) => {
    if (markers.length === 0) {
      console.log('?? [FREEFORM SELECT] No markers placed');
      return;
    }
    
    if (markers.length < 3) {
      console.log('?? [FREEFORM SELECT] Only', markers.length, 'markers - need at least 3 for area selection');
      return;
    }
    
    console.log('?? [FREEFORM SELECT] Finalizing selection with', markers.length, 'markers');
    console.log('?? [FREEFORM SELECT] Polygon vertices:', markers.map(m => `(${m.lat.toFixed(4)}, ${m.lng.toFixed(4)})`).join(', '));
    
    // Use proper point-in-polygon algorithm
    const selectedIndices = [];
    let testedCount = 0;
    let insideCount = 0;
    
    console.log(`?? [FREEFORM SELECT] Testing ${vertices.length} vertices against polygon...`);
    
    vertices.forEach((vertex, index) => {
      testedCount++;
      
      if (isPointInPolygon(vertex, markers)) {
        insideCount++;
        selectedIndices.push(index);
        
        console.log(`?? [FREEFORM SELECT] Vertex ${index} INSIDE: (${vertex.lat.toFixed(4)}, ${vertex.lng.toFixed(4)})`);
        
        // Highlight selected vertex (orange with white outline)
        if (vertex.entity?.point) {
          vertex.entity.point.color = Cesium.Color.ORANGE;
          vertex.entity.point.pixelSize = 20;
          vertex.entity.point.outlineWidth = 3;
          vertex.entity.point.outlineColor = Cesium.Color.WHITE;
        }
      }
      
      // Log progress every 100 vertices
      if (testedCount % 100 === 0) {
        console.log(`? [FREEFORM SELECT] Progress: ${testedCount}/${vertices.length} tested, ${insideCount} inside`);
      }
    });
    
    console.log(`? [FREEFORM SELECT] Tested ${testedCount} vertices, found ${selectedIndices.length} inside polygon`);
    
    console.log('?? [FREEFORM SELECT] Calling setSelectedVertices with', selectedIndices.length, 'indices:', selectedIndices);
    selectedVerticesRef.current = selectedIndices; // CRITICAL: Also store in ref to persist across renders
    setSelectedVertices(selectedIndices);
    
    // Switch to edit mode so vertices become draggable
    if (selectedIndices.length > 0) {
      console.log('?? [FREEFORM SELECT] Switching to edit mode for multi-node dragging');
      
      // Clear markers and polygon after accepting selection
      if (cesiumViewer) {
        // Remove all marker entities
        freeformEntitiesRef.current.forEach(entity => {
          cesiumViewer.entities.remove(entity);
        });
        
        freeformEntitiesRef.current = [];
        freeformMarkerCountRef.current = 0;
        setFreeformMarkers([]);
        
        // Clear polygon
        if (selectionPolygon) {
          cesiumViewer.entities.remove(selectionPolygon);
          setSelectionPolygon(null);
        }
      }
      
      // Switch to edit mode - main effect will handle handler setup
      setMode('edit');
      console.log('?? [FREEFORM SELECT] Switching to edit mode for multi-node dragging');
      
      console.log(`?? [FREEFORM SELECT] ${selectedIndices.length} vertices ready to move together`);
    } else {
      console.log('?? [FREEFORM SELECT] No vertices found in selection area');
    }
  }, [vertices, freeformMarkers, cesiumViewer, Cesium, isPointInPolygon, selectionPolygon]);

  /**
   * Clear freeform selection markers
   */
  const clearFreeformSelection = useCallback(() => {
    console.log('?? [FREEFORM SELECT] Clearing all freeform markers');
    
    // Remove all marker entities
    freeformEntitiesRef.current.forEach(entity => {
      if (cesiumViewer) {
        cesiumViewer.entities.remove(entity);
      }
    });
    
    freeformEntitiesRef.current = [];
    freeformMarkerCountRef.current = 0;
    setFreeformMarkers([]);
    
    // Clear polygon
    if (selectionPolygon && cesiumViewer) {
      cesiumViewer.entities.remove(selectionPolygon);
      setSelectionPolygon(null);
    }
    
    // Clear selected vertices
    setSelectedVertices([]);
  }, [cesiumViewer, selectionPolygon]);

  /**
   * ?? PORTAL: Render floating buttons directly to document.body to avoid CSS issues
   */
  useEffect(() => {
    // Only show portal when in multi-select mode AND have markers
    if (!isInMultiSelectMode || freeformMarkers.length < 1) {
      // Remove portal if it exists
      const existingPortal = document.getElementById('freeform-selection-portal');
      if (existingPortal) {
        existingPortal.remove();
      }
      return;
    }

    console.log(`?? [PORTAL] Creating floating button portal with ${freeformMarkers.length} markers`);

    // Get screen position of first marker
    const firstMarker = freeformMarkers[0];
    const firstMarkerPos = Cesium.Cartesian3.fromDegrees(firstMarker.lng, firstMarker.lat, 10000);
    const screenPos = Cesium.SceneTransforms.worldToWindowCoordinates(cesiumViewer.scene, firstMarkerPos);
    
    if (!screenPos || !Cesium.defined(screenPos)) {
      console.log('⚠️ [PORTAL] Could not calculate marker screen position');
      return;
    }

    console.log(`?? [PORTAL] First marker screen position: x=${screenPos.x.toFixed(0)}, y=${screenPos.y.toFixed(0)}`);

    // Create or get portal container
    let portal = document.getElementById('freeform-selection-portal');
    if (!portal) {
      portal = document.createElement('div');
      portal.id = 'freeform-selection-portal';
      document.body.appendChild(portal);
    }

    // Position portal 60px above first marker
    portal.style.cssText = `
      position: fixed;
      left: ${screenPos.x}px;
      top: ${screenPos.y - 60}px;
      transform: translateX(-50%);
      z-index: 999999;
      pointer-events: auto;
    `;

    // Create buttons container
    const container = document.createElement('div');
    container.style.cssText = `
      display: flex;
      gap: 8px;
      align-items: center;
    `;

    // Accept button (checkmark)
    const acceptBtn = document.createElement('button');
    acceptBtn.textContent = '✓';
    acceptBtn.disabled = freeformMarkers.length < 3;
    acceptBtn.style.cssText = `
      width: 32px;
      height: 32px;
      padding: 0;
      background: ${freeformMarkers.length >= 3 ? '#10b981' : '#6b7280'};
      color: white;
      border: 2px solid white;
      border-radius: 50%;
      cursor: ${freeformMarkers.length >= 3 ? 'pointer' : 'not-allowed'};
      font-size: 20px;
      font-weight: bold;
      line-height: 32px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      transition: transform 0.1s;
    `;
    acceptBtn.onmouseover = () => {
      if (freeformMarkers.length >= 3) {
        acceptBtn.style.transform = 'scale(1.1)';
      }
    };
    acceptBtn.onmouseout = () => {
      acceptBtn.style.transform = 'scale(1)';
    };
    acceptBtn.onclick = () => {
      if (freeformMarkers.length >= 3) {
        console.log(`? [PORTAL] Accept clicked with ${freeformMarkers.length} markers - exiting mode`);
        finalizeSelection(freeformMarkers);
        setIsInMultiSelectMode(false); // EXIT MULTI-SELECT MODE
      }
    };

    // Reject button (X)
    const rejectBtn = document.createElement('button');
    rejectBtn.textContent = '✗';
    rejectBtn.style.cssText = `
      width: 32px;
      height: 32px;
      padding: 0;
      background: #ef4444;
      color: white;
      border: 2px solid white;
      border-radius: 50%;
      cursor: pointer;
      font-size: 20px;
      font-weight: bold;
      line-height: 32px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      transition: transform 0.1s;
    `;
    rejectBtn.onmouseover = () => {
      rejectBtn.style.transform = 'scale(1.1)';
    };
    rejectBtn.onmouseout = () => {
      rejectBtn.style.transform = 'scale(1)';
    };
    rejectBtn.onclick = () => {
      console.log(`? [PORTAL] Reject clicked - exiting mode`);
      clearFreeformSelection();
      setIsInMultiSelectMode(false); // EXIT MULTI-SELECT MODE
    };

    container.appendChild(acceptBtn);
    container.appendChild(rejectBtn);
    portal.innerHTML = '';
    portal.appendChild(container);

    // Cleanup
    return () => {
      const existingPortal = document.getElementById('freeform-selection-portal');
      if (existingPortal) {
        existingPortal.remove();
      }
    };
  }, [isInMultiSelectMode, freeformMarkers, finalizeSelection, clearFreeformSelection, cesiumViewer]);

  /**
   * Update selection polygon connecting freeform markers
   */
  const updateSelectionPolygon = (markers) => {
    if (!cesiumViewer || !Cesium || markers.length < 2) return;
    
    console.log(`?? [FREEFORM SELECT] Updating selection polygon with ${markers.length} markers`);
    
    // Create closed polygon from markers
    const coords = markers.map(m => [m.lng, m.lat]);
    coords.push([markers[0].lng, markers[0].lat]); // Close the loop
    
    const positions = coords.map(c => Cesium.Cartesian3.fromDegrees(c[0], c[1], 10000));
    
    // Check if polygon exists
    const existingPolygon = cesiumViewer.entities.getById('freeform-selection-polygon');
    
    if (existingPolygon) {
      console.log('?? [FREEFORM SELECT] Updating existing polygon positions');
      
      if (existingPolygon.polyline) {
        existingPolygon.polyline.positions = positions;
      }
      
      if (existingPolygon.polygon) {
        existingPolygon.polygon.hierarchy = new Cesium.PolygonHierarchy(positions);
      }
      
      if (!selectionPolygon) {
        setSelectionPolygon(existingPolygon);
      }
    } else {
      console.log('?? [FREEFORM SELECT] Creating initial selection polygon');
      
      const polygon = cesiumViewer.entities.add({
        id: 'freeform-selection-polygon',
        polyline: {
          positions: positions,
          width: 3,
          material: new Cesium.PolylineDashMaterialProperty({
            color: Cesium.Color.CYAN,
            dashLength: 16.0
          }),
          clampToGround: false,
          arcType: Cesium.ArcType.GEODESIC
        },
        polygon: {
          hierarchy: new Cesium.PolygonHierarchy(positions),
          material: Cesium.Color.CYAN.withAlpha(0.2),
          outline: false,
          perPositionHeight: true
        }
      });
      
      setSelectionPolygon(polygon);
    }
    
    console.log('? [FREEFORM SELECT] Selection polygon updated');
  };

  /**
   * Clear selection polygon
   */
  const clearSelectionPolygon = () => {
    if (selectionPolygon && cesiumViewer) {
      cesiumViewer.entities.remove(selectionPolygon);
      setSelectionPolygon(null);
    }
  };

  /**
   * Listen for submit event from toolbar
   */
  useEffect(() => {
    console.log('?? [BOUNDARY EDITOR] Registering event listener for boundary-editor-submit');
    
    const handleToolbarSubmit = () => {
      console.log('?? [BOUNDARY EDITOR] Received submit event from toolbar');
      handleSave();
    };

    window.addEventListener('boundary-editor-submit', handleToolbarSubmit);
    console.log('? [BOUNDARY EDITOR] Event listener registered');

    return () => {
      console.log('?? [BOUNDARY EDITOR] Unregistering event listener');
      window.removeEventListener('boundary-editor-submit', handleToolbarSubmit);
    };
  }, [vertices]); // Re-attach when vertices change

  /**
   * Auto-enable edit mode once vertices are loaded
   */
  useEffect(() => {
    // Only auto-enable if vertices are loaded and we're in view mode
    if (vertices.length > 0 && mode === 'view' && cesiumViewer) {
      console.log('?? [BOUNDARY EDITOR] Auto-enabling edit mode after vertices loaded');
      // Small delay to ensure entities are fully rendered
      setTimeout(() => {
        enableEditMode();
      }, 500);
    }
  }, [vertices.length, cesiumViewer]); // Only trigger when vertices first load

  /**
   * Load existing proposal for editing
   */
  const loadProposal = (proposal) => {
    console.log('?? [BOUNDARY EDITOR] Loading proposal:', proposal.name);
    
    const geometry = proposal.location?.geometry;
    if (!geometry) {
      console.error('? Proposal has no geometry');
      return;
    }
    
    setOriginalGeometry(geometry);
    setProposalName(proposal.name);
    setDescription(proposal.description || '');
    
    // Extract coordinates from GeoJSON (handle both Polygon and MultiPolygon)
    if (geometry.type === 'Polygon' && geometry.coordinates && geometry.coordinates[0]) {
      const coords = geometry.coordinates[0];
      console.log(`?? [BOUNDARY EDITOR] Loading Polygon with ${coords.length} vertices`);
      loadVertices(coords);
    } else if (geometry.type === 'MultiPolygon' && geometry.coordinates && geometry.coordinates[0]) {
      // For MultiPolygon, use the largest polygon (first one is usually the main landmass)
      const largestPolygon = geometry.coordinates.reduce((largest, current) => {
        const currentSize = current[0]?.length || 0;
        const largestSize = largest[0]?.length || 0;
        return currentSize > largestSize ? current : largest;
      }, geometry.coordinates[0]);
      
      const coords = largestPolygon[0];
      console.log(`?? [BOUNDARY EDITOR] Loading MultiPolygon (using largest part with ${coords.length} vertices)`);
      loadVertices(coords);
    } else {
      console.error('? Invalid geometry format:', geometry.type, geometry.coordinates?.length);
    }
  };

  /**
   * Load official boundary as starting point
   */
  const loadOfficialBoundary = () => {
    console.log('?? [BOUNDARY EDITOR] Loading official boundary for editing');
    
    // Find official boundary candidate
    const officialCandidate = channel?.candidates?.find(c => c.isOfficial || c.isDefault);
    
    if (officialCandidate) {
      loadProposal(officialCandidate);
    } else {
      console.warn('?? No official boundary found, starting with empty polygon');
      // Start with empty - user will add vertices
      setMode('add');
    }
  };

  /**
   * Load vertices from GeoJSON coordinates and create pinpoint entities
   */
  const loadVertices = (coordinates) => {
    console.log(`?? [BOUNDARY EDITOR] Loading ${coordinates.length} vertices`);
    
    const newVertices = coordinates.map((coord, index) => {
      const [lng, lat] = coord;
      
      // Create pinpoint entity on globe with proper Cesium properties
      const entity = cesiumViewer.entities.add({
        id: `vertex-${index}-${Date.now()}`,
        position: Cesium.Cartesian3.fromDegrees(lng, lat, 10000), // 10km above surface
        point: {
          pixelSize: 18, // Increased from 14 for easier clicking
          color: Cesium.Color.CYAN,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.0, 8.0e6, 0.5) // Scale with camera distance
        },
        label: {
          text: `V${index + 1}`,
          font: '12px sans-serif',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -20),
          heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        },
        properties: new Cesium.PropertyBag({
          type: 'boundary-vertex',
          index: index,
          editable: true
        })
      });

      entitiesRef.current.push(entity);
      
      // Verify entity was created properly
      if (index < 5) { // Log first 5 vertices only
        console.log(`? [BOUNDARY EDITOR] Created vertex ${index}:`, {
          id: entity.id,
          hasProperties: !!entity.properties,
          type: entity.properties?.type?.getValue(),
          index: entity.properties?.index?.getValue()
        });
      }

      return { lat, lng, entity, index };
    });


    setVertices(newVertices);
    
    // CRITICAL: Notify parent of initial vertex count
    if (onVerticesChange) {
      onVerticesChange(newVertices.length);
      console.log('?? [BOUNDARY EDITOR] Notified parent: initial vertex count =', newVertices.length);
    }
    
    // Draw polygon connecting vertices
    drawPolygon(newVertices);
    
    // Zoom camera to boundary - DISABLED to match India behavior (no auto-zoom)
    // zoomToBoundary(newVertices);
    
    console.log('?? [BOUNDARY EDITOR] Vertices loaded');
  };

  /**
   * Draw polygon on globe
   */
  const drawPolygon = (vertexArray) => {
    // Remove old polygon
    if (polygonEntityRef.current) {
      cesiumViewer.entities.remove(polygonEntityRef.current);
      polygonEntityRef.current = null;
    }

    if (vertexArray.length < 3) {
      console.log('??? [BOUNDARY EDITOR] Need at least 3 vertices for polygon');
      return;
    }

    // Create polygon hierarchy
    const positions = vertexArray.map(v =>
      Cesium.Cartesian3.fromDegrees(v.lng, v.lat, 5000) // 5km above surface
    );

    const polygonEntity = cesiumViewer.entities.add({
      id: 'boundary-polygon-editor',
      polygon: {
        hierarchy: new Cesium.PolygonHierarchy(positions),
        material: Cesium.Color.CYAN.withAlpha(0.4),
        outline: true,
        outlineColor: Cesium.Color.CYAN,
        outlineWidth: 3,
        heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
        closeTop: false,
        closeBottom: false
      },
      polyline: {
        positions: [...positions, positions[0]], // Close the loop
        width: 4,
        material: Cesium.Color.CYAN,
        clampToGround: false
      },
      properties: new Cesium.PropertyBag({
        type: 'boundary-polygon',
        editable: true
      })
    });

    polygonEntityRef.current = polygonEntity;
    entitiesRef.current.push(polygonEntity);
  };

  /**
   * Zoom camera to boundary
   */
  const zoomToBoundary = (vertexArray) => {
    if (vertexArray.length === 0) {
      console.warn('?? [BOUNDARY EDITOR] Cannot zoom: no vertices');
      return;
    }

    console.log(`?? [BOUNDARY EDITOR] Zooming to boundary with ${vertexArray.length} vertices`);

    // Calculate bounding box from vertices
    let minLng = Infinity, maxLng = -Infinity;
    let minLat = Infinity, maxLat = -Infinity;

    vertexArray.forEach(v => {
      minLng = Math.min(minLng, v.lng);
      maxLng = Math.max(maxLng, v.lng);
      minLat = Math.min(minLat, v.lat);
      maxLat = Math.max(maxLat, v.lat);
    });

    // Calculate center
    const centerLng = (minLng + maxLng) / 2;
    const centerLat = (minLat + maxLat) / 2;

    // Calculate appropriate height based on bounding box size
    const lngRange = maxLng - minLng;
    const latRange = maxLat - minLat;
    const maxRange = Math.max(lngRange, latRange);
    
    // Scale factor: larger range needs higher camera
    const height = Math.max(
      maxRange * 150000,  // Scale factor for good view
      100000              // Minimum 100km height
    );

    console.log(`?? [BOUNDARY EDITOR] Zoom details:`, {
      center: `${centerLng.toFixed(4)}?, ${centerLat.toFixed(4)}?`,
      bounds: {
        west: minLng.toFixed(4),
        east: maxLng.toFixed(4),
        south: minLat.toFixed(4),
        north: maxLat.toFixed(4)
      },
      ranges: {
        lng: lngRange.toFixed(4),
        lat: latRange.toFixed(4),
        max: maxRange.toFixed(4)
      },
      height: `${(height / 1000).toFixed(0)} km`
    });

    // Fly to center with calculated height
    cesiumViewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(centerLng, centerLat, height),
      duration: 2.0,
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-45), // 45? downward angle
        roll: 0.0
      }
    });

    console.log('? [BOUNDARY EDITOR] Camera zoom initiated');
  };

  /**
   * Enable multiple (freeform) selection mode
   */
  const enableMultipleMode = useCallback(() => {
    console.log('?? [BOUNDARY EDITOR] Enabling multiple selection mode');
    
    // Cleanup main boundary editing handler if exists
    if (handlerRef.current) {
      console.log('?? [BOUNDARY EDITOR] Destroying main handler for multiple mode');
      handlerRef.current.destroy();
      handlerRef.current = null;
    }
    
    // Set mode to multiple (freeform handler will be created by useEffect)
    setMode('multiple');
    console.log('? [BOUNDARY EDITOR] setMode("multiple") called - mode will change');
    
    // Force cursor change immediately
    if (cesiumViewer?.canvas) {
      cesiumViewer.canvas.style.cursor = 'crosshair';
      console.log('?? [BOUNDARY EDITOR] ? FORCED cursor to crosshair immediately');
    }
  }, []);

  /**
   * Enable edit mode - make vertices draggable
   */
  const enableEditMode = useCallback(() => {
    console.log('?? [BOUNDARY EDITOR] Enabling edit mode');
    console.log('?? [BOUNDARY EDITOR] Current vertices count:', vertices.length);
    console.log('?? [BOUNDARY EDITOR] Cesium viewer available:', !!cesiumViewer);
    console.log('?? [BOUNDARY EDITOR] Scene canvas available:', !!cesiumViewer?.scene?.canvas);
    
    // ?? CRITICAL: Disable RegionManager handlers AND boundary highlighting to prevent interference
    if (window.earthGlobeControls?.regionManager) {
      console.log('?? [BOUNDARY EDITOR] Temporarily disabling RegionManager handlers');
      try {
        const regionManager = window.earthGlobeControls.regionManager;
        
        // Remove LEFT_CLICK and MOUSE_MOVE handlers from cesiumWidget.screenSpaceEventHandler
        if (cesiumViewer.cesiumWidget?.screenSpaceEventHandler) {
          cesiumViewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
          cesiumViewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
          console.log('? [BOUNDARY EDITOR] RegionManager handlers disabled');
        }

        // ?? CRITICAL: Hide/disable country/boundary highlighting during edit mode
        if (regionManager.adminHierarchy) {
          const adminHierarchy = regionManager.adminHierarchy;
          
          // Dim all country boundaries (make them less visible)
          if (adminHierarchy.entities?.country) {
            console.log('?? [BOUNDARY EDITOR] Dimming country boundaries');
            adminHierarchy.entities.country.forEach((entity) => {
              if (entity.polygon) {
                // Store original settings (clone Cesium types properly)
                if (!entity._originalSettings) {
                  const currentMaterial = entity.polygon.material?.getValue ? 
                    entity.polygon.material.getValue() : entity.polygon.material;
                  
                  entity._originalSettings = {
                    outlineWidth: entity.polygon.outlineWidth?.getValue ? 
                      entity.polygon.outlineWidth.getValue() : entity.polygon.outlineWidth,
                    outlineColor: entity.polygon.outlineColor?.getValue ? 
                      Cesium.Color.clone(entity.polygon.outlineColor.getValue()) : 
                      Cesium.Color.BLACK.clone(),
                    material: currentMaterial instanceof Cesium.Color ? 
                      Cesium.Color.clone(currentMaterial) : 
                      Cesium.Color.TRANSPARENT.clone()
                  };
                }
                // Dim the boundaries
                entity.polygon.outlineWidth = 0.5; // Very thin
                entity.polygon.outlineColor = Cesium.Color.GRAY.withAlpha(0.2); // Barely visible
                if (entity.polygon.material) {
                  entity.polygon.material = Cesium.Color.TRANSPARENT; // No fill
                }
              }
            });
          }

          // Dim province boundaries too
          if (adminHierarchy.entities?.province) {
            console.log('?? [BOUNDARY EDITOR] Dimming province boundaries');
            adminHierarchy.entities.province.forEach((entity) => {
              if (entity.polygon) {
                if (!entity._originalSettings) {
                  const currentMaterial = entity.polygon.material?.getValue ? 
                    entity.polygon.material.getValue() : entity.polygon.material;
                  
                  entity._originalSettings = {
                    outlineWidth: entity.polygon.outlineWidth?.getValue ? 
                      entity.polygon.outlineWidth.getValue() : entity.polygon.outlineWidth,
                    outlineColor: entity.polygon.outlineColor?.getValue ? 
                      Cesium.Color.clone(entity.polygon.outlineColor.getValue()) : 
                      Cesium.Color.BLACK.clone(),
                    material: currentMaterial instanceof Cesium.Color ? 
                      Cesium.Color.clone(currentMaterial) : 
                      Cesium.Color.TRANSPARENT.clone()
                  };
                }
                entity.polygon.outlineWidth = 0.5;
                entity.polygon.outlineColor = Cesium.Color.GRAY.withAlpha(0.1);
                if (entity.polygon.material) {
                  entity.polygon.material = Cesium.Color.TRANSPARENT;
                }
              }
            });
          }

          console.log('? [BOUNDARY EDITOR] Country/province boundaries dimmed for editing');
        }
      } catch (error) {
        console.warn('?? [BOUNDARY EDITOR] Error disabling RegionManager handlers:', error);
      }
    }
    
    setMode('edit');
    console.log('? [EDIT] Edit mode activated - handlers will be created by useEffect');
  }, [vertices, cesiumViewer, Cesium]);

  /**
   * Create drag handlers when mode is 'edit'
   */
  useEffect(() => {
    if (!cesiumViewer || !Cesium || mode !== 'edit') {
      return;
    }

    console.log('?? [HANDLER SETUP] Creating edit mode handlers');
    console.log('?? [HANDLER SETUP] selectedVertices STATE:', selectedVertices);
    console.log('?? [HANDLER SETUP] selectedVertices REF:', selectedVerticesRef.current);
    console.log('?? [HANDLER SETUP] Using REF with length:', selectedVerticesRef.current.length);
    // Update vertex colors to yellow
    // Vertex colors already set by finalizeSelection (orange) or enableEditMode (yellow)
    // Cleanup old handler if exists
    if (handlerRef.current) {
      console.log('?? [BOUNDARY EDITOR] Cleaning up old event handler');
      handlerRef.current.destroy();
      handlerRef.current = null;
    }

    // ?? CRITICAL: Do NOT create main handler in multiple mode (freeform handler handles it)
    if (mode === 'multiple') {
      console.log('?? [BOUNDARY EDITOR] Skipping main handler creation - multiple mode uses freeform handler');
      return;
    }

    // Create input handler
    const handler = new Cesium.ScreenSpaceEventHandler(cesiumViewer.scene.canvas);
    handlerRef.current = handler;
    console.log('?? [BOUNDARY EDITOR] ? Event handler created successfully for mode:', mode);
    console.log('?? [BOUNDARY EDITOR] ? selectedVertices count:', selectedVertices.length);
    console.log('?? [BOUNDARY EDITOR] ? selectedVertices count (REF):', selectedVerticesRef.current.length);
    // Mouse down - start drag (ENHANCED: Individual node selection with drillPick)
    handler.setInputAction((click) => {
      console.log('??? [BOUNDARY EDITOR] LEFT_DOWN detected at position:', click.position, 'mode:', mode);
      
      // ?? CRITICAL: Skip if in multiple mode (freeform handler processes clicks)
      if (mode === 'multiple') {
        console.log('?? [BOUNDARY EDITOR] Multiple mode - handled by freeform tool');
        return;
      }
      
      // ?? Use drillPick to get ALL entities at this position (not just topmost)
      const allPicked = cesiumViewer.scene.drillPick(click.position, 10); // Get up to 10 entities
      console.log('?? [BOUNDARY EDITOR] DrillPick found', allPicked.length, 'entities');
      
      // Find the first boundary vertex in the list
      let vertexPick = null;
      for (const picked of allPicked) {
        console.log('?? [BOUNDARY EDITOR] Examining entity:', picked.id?.id, 'type:', picked.id?.properties?.type?.getValue());
        
        if (picked.id?.properties?.type?.getValue() === 'boundary-vertex') {
          vertexPick = picked;
          console.log('? [BOUNDARY EDITOR] Found boundary vertex!');
          break;
        }
      }
      
      if (vertexPick) {
        console.log('? [BOUNDARY EDITOR] Vertex picked successfully!');
        
        // ?? CRITICAL: Disable camera controls during drag to prevent globe panning
        cesiumViewer.scene.screenSpaceCameraController.enableRotate = false;
        cesiumViewer.scene.screenSpaceCameraController.enableTranslate = false;
        cesiumViewer.scene.screenSpaceCameraController.enableZoom = false;
        cesiumViewer.scene.screenSpaceCameraController.enableTilt = false;
        cesiumViewer.scene.screenSpaceCameraController.enableLook = false;
        console.log('?? [BOUNDARY EDITOR] Camera controls disabled for dragging');
        
        // Deselect previous vertex
        if (draggedVertexRef.current && draggedVertexRef.current !== vertexPick.id) {
          draggedVertexRef.current.point.pixelSize = 16;
          draggedVertexRef.current.point.color = Cesium.Color.YELLOW;
          draggedVertexRef.current.point.outlineWidth = 0;
        }
        
        draggedVertexRef.current = vertexPick.id;
        isDraggingRef.current = true;
        
        // Store original positions of ALL selected vertices at drag start
        const vertexIndex = vertexPick.id.properties.index.getValue();
        console.log(`[BOUNDARY EDITOR] Selected vertices count: ${selectedVerticesRef.current.length}`);
        
        const originalPositions = new Map();
        
        if (selectedVerticesRef.current.length > 0) {
          // Multi-select: store all selected vertices
          selectedVerticesRef.current.forEach(idx => {
            if (vertices[idx]) {
              originalPositions.set(idx, { lat: vertices[idx].lat, lng: vertices[idx].lng });
            }
          });
          console.log(`? [MULTI-SELECT] Stored ${originalPositions.size} vertex start positions for dragging`);
        } else {
          // Single-select: store just the dragged vertex
          if (vertices[vertexIndex]) {
            originalPositions.set(vertexIndex, { lat: vertices[vertexIndex].lat, lng: vertices[vertexIndex].lng });
          }
          console.log(`? [SINGLE-SELECT] Stored vertex #${vertexIndex} start position`);
        }
        
        dragStartPositionsRef.current = originalPositions;
        console.log(`?? [BOUNDARY EDITOR] Selected vertex #${vertexIndex} - Ready to drag`);
        
        // Enhanced visual feedback for selected vertex
        draggedVertexRef.current.point.pixelSize = 24; // Larger for better visibility
        draggedVertexRef.current.point.color = Cesium.Color.ORANGE;
        draggedVertexRef.current.point.outlineWidth = 3;
        draggedVertexRef.current.point.outlineColor = Cesium.Color.WHITE;
      } else {
        console.log('? [BOUNDARY EDITOR] No boundary vertex found in picked entities');
        
        // Debug: Show what was picked
        if (allPicked.length > 0) {
          console.log('?? [BOUNDARY EDITOR] Picked entities:', allPicked.map(p => ({
            id: p.id?.id,
            type: p.id?.properties?.type?.getValue()
          })));
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

    // Mouse move - update vertex position (MULTI-NODE SUPPORT)
    handler.setInputAction((movement) => {
      if (!isDraggingRef.current || !draggedVertexRef.current) return;

      // Get 3D position on globe
      const ray = cesiumViewer.camera.getPickRay(movement.endPosition);
      const cartesian = cesiumViewer.scene.globe.pick(ray, cesiumViewer.scene);

      if (cartesian) {
        const heightOffset = 10000; // 10km above surface
        const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        
        // Get new lat/lng for dragged vertex
        const newLat = Cesium.Math.toDegrees(cartographic.latitude);
        const newLng = Cesium.Math.toDegrees(cartographic.longitude);

        // Get dragged vertex index
        const draggedIndex = draggedVertexRef.current.properties.index.getValue();
        
        // Update vertices array (MULTI-NODE: Move all selected vertices together)
        setVertices(prev => {
          const updated = [...prev];
          
          // Calculate offset from ORIGINAL drag start position (not current position)
          const dragStartPos = dragStartPositionsRef.current?.get(draggedIndex);
          if (!dragStartPos) {
            console.warn('? [BOUNDARY EDITOR] No stored start position - falling back');
            return prev; // Skip this frame if no start position stored
          }
          
          const latOffset = newLat - dragStartPos.lat; // Total offset from start
          const lngOffset = newLng - dragStartPos.lng; // Not incremental!
          
          // Check if this vertex is part of a multi-selection
          const isMultiSelect = selectedVertices.length > 1 && selectedVertices.includes(draggedIndex);
          
          if (isMultiSelect) {
            console.log(`?? [MULTI-DRAG] Moving ${selectedVerticesRef.current.length} vertices with offset: lat=${latOffset.toFixed(4)}, lng=${lngOffset.toFixed(4)}`);
            // Move ALL selected vertices by the same offset from THEIR original positions
            selectedVerticesRef.current.forEach(selectedIndex => {
              const startPos = dragStartPositionsRef.current?.get(selectedIndex);
              if (startPos && updated[selectedIndex]) {
                const vertex = updated[selectedIndex];
                const movedLat = startPos.lat + latOffset; // From original, not current
                const movedLng = startPos.lng + lngOffset;
                
                // Update entity position
                if (vertex.entity) {
                  const movedPosition = Cesium.Cartesian3.fromDegrees(movedLng, movedLat, heightOffset);
                  vertex.entity.position = movedPosition;
                }
                
                // Update vertex data
                updated[selectedIndex] = {
                  ...vertex,
                  lat: movedLat,
                  lng: movedLng
                };
              }
            });
          } else {
            // Single vertex drag
            const newPosition = Cesium.Cartesian3.fromRadians(
              cartographic.longitude,
              cartographic.latitude,
              heightOffset
            );
            
            draggedVertexRef.current.position = newPosition;
            updated[draggedIndex] = { 
              lat: newLat, 
              lng: newLng, 
              entity: draggedVertexRef.current, 
              index: draggedIndex 
            };
          }
          
          // Redraw polygon
          drawPolygon(updated);
          
          return updated;
        });
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // Mouse up - end drag (Keep selection visible)
    handler.setInputAction(() => {
      if (draggedVertexRef.current) {
        // Keep vertex selected but reduce highlight intensity
        draggedVertexRef.current.point.pixelSize = 18;
        draggedVertexRef.current.point.color = Cesium.Color.YELLOW;
        draggedVertexRef.current.point.outlineWidth = 2;
        console.log('? [BOUNDARY EDITOR] Vertex drag complete - Node remains selected');
      }
      
      // ?? CRITICAL: Re-enable camera controls after drag
      if (isDraggingRef.current) {
        cesiumViewer.scene.screenSpaceCameraController.enableRotate = true;
        cesiumViewer.scene.screenSpaceCameraController.enableTranslate = true;
        cesiumViewer.scene.screenSpaceCameraController.enableZoom = true;
        cesiumViewer.scene.screenSpaceCameraController.enableTilt = true;
        cesiumViewer.scene.screenSpaceCameraController.enableLook = true;
        console.log('?? [BOUNDARY EDITOR] Camera controls re-enabled');
      }
      
      isDraggingRef.current = false;
      dragStartPositionsRef.current = null; // Clear stored positions after drag ends
      
      // Clear multi-selection after drag completes to allow new selection
      if (selectedVertices.length > 0) {
        console.log('?? [MULTI-SELECT] Clearing selection after drag - ready for new selection');
        setSelectedVertices([]);
        selectedVerticesRef.current = [];
        
        // Reset all vertex colors to default
        vertices.forEach((vertex, idx) => {
          if (vertex.entity && vertex.entity.point) {
            vertex.entity.point.pixelSize = 12;
            vertex.entity.point.color = Cesium.Color.CYAN;
            vertex.entity.point.outlineWidth = 2;
            vertex.entity.point.outlineColor = Cesium.Color.WHITE;
          }
        });
      }
      
      draggedVertexRef.current = null; // Clear dragged vertex reference
      
      // ?? CRITICAL: Notify parent of vertex count update after drag
      if (onVerticesChange) {
        onVerticesChange(vertices.length);
        console.log('?? [BOUNDARY EDITOR] Notified parent: vertex count =', vertices.length);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_UP);

    // Right-click on vertex - delete
    handler.setInputAction((click) => {
      const pickedObject = cesiumViewer.scene.pick(click.position);
      
      if (pickedObject && pickedObject.id && 
          pickedObject.id.properties?.type?.getValue() === 'boundary-vertex') {
        deleteVertex(pickedObject.id);
      }
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

    // Click on polygon line - add new vertex
    handler.setInputAction((click) => {
      // ?? CRITICAL: Skip if in multi-select mode (use REF for immediate access)
      if (isInMultiSelectModeRef.current) {
        console.log('📍 [EDIT HANDLER] Skipping - in multi-select mode (ref check)');
        return;
      }
      
      if (isDraggingRef.current) return; // Don't add if dragging
      
      const pickedObject = cesiumViewer.scene.pick(click.position);
      
      // If clicked off selected vertices, clear the selection
      if (selectedVerticesRef.current.length > 0 && 
          (!pickedObject || !pickedObject.id || 
           pickedObject.id.properties?.type?.getValue() !== 'boundary-vertex')) {
        
        console.log('? [EDIT] Clicked off selection - clearing and returning to neutral');
        setSelectedVertices([]);
        selectedVerticesRef.current = [];
        
        // Reset all vertex colors to default
        vertices.forEach((vertex) => {
          if (vertex.entity?.point) {
            vertex.entity.point.pixelSize = 12;
            vertex.entity.point.color = Cesium.Color.CYAN;
            vertex.entity.point.outlineWidth = 2;
            vertex.entity.point.outlineColor = Cesium.Color.WHITE;
          }
        });
        return;
      }
      
      if (pickedObject && pickedObject.id && 
          pickedObject.id.properties?.type?.getValue() === 'boundary-polygon') {
        
        const ray = cesiumViewer.camera.getPickRay(click.position);
        const cartesian = cesiumViewer.scene.globe.pick(ray, cesiumViewer.scene);

        if (cartesian) {
          addVertexAtPosition(cartesian);
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    console.log('? Edit mode enabled - vertices are now draggable');
    }, [mode, cesiumViewer, Cesium]); // Recreate handlers when mode changes (selectedVertices in ref)

  /**
   * Add new vertex at clicked position
   */
  const addVertexAtPosition = (cartesian) => {
    const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
    const lat = Cesium.Math.toDegrees(cartographic.latitude);
    const lng = Cesium.Math.toDegrees(cartographic.longitude);

    console.log(`? Adding vertex at: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);

    // Find closest line segment to insert vertex
    const insertIndex = findClosestLineSegment(lat, lng);

    // Create new vertex entity
    const heightOffset = 10000;
    const position = Cesium.Cartesian3.fromDegrees(lng, lat, heightOffset);
    
    const entity = cesiumViewer.entities.add({
      id: `vertex-${Date.now()}`,
      position: position,
      point: {
        pixelSize: 16,
        color: Cesium.Color.YELLOW,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
        heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      },
      label: {
        text: `V${insertIndex + 1}`,
        font: '12px sans-serif',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -20),
        heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      },
      properties: {
        type: 'boundary-vertex',
        index: insertIndex,
        editable: true
      }
    });

    entitiesRef.current.push(entity);

    // Insert into vertices array
    setVertices(prev => {
      const updated = [...prev];
      updated.splice(insertIndex, 0, { lat, lng, entity, index: insertIndex });
      
      // Update all indices and labels
      updated.forEach((v, i) => {
        v.index = i;
        v.entity.properties.index = i;
        if (v.entity.label) {
          v.entity.label.text = `V${i + 1}`;
        }
      });
      
      drawPolygon(updated);
      return updated;
    });

    console.log('? Vertex added');
  };

  /**
   * Delete vertex by index
   */
  const deleteVertexAtIndex = (index) => {
    if (vertices.length <= 3) {
      console.warn('⚠️ Cannot delete - need at least 3 vertices for a polygon');
      return;
    }

    const vertex = vertices[index];
    if (!vertex) {
      console.warn(`⚠️ Vertex ${index} not found`);
      return;
    }

    console.log(`🗑️ Deleting vertex ${index}`);

    // Remove entity
    if (vertex.entity) {
      cesiumViewer.entities.remove(vertex.entity);
      entitiesRef.current = entitiesRef.current.filter(e => e !== vertex.entity);
    }

    // Remove from vertices array and update indices
    setVertices(prev => {
      const updated = prev.filter(v => v.index !== index);
      
      // Update indices and labels
      updated.forEach((v, i) => {
        v.index = i;
        if (v.entity) {
          v.entity.properties.index = new Cesium.ConstantProperty(i);
          if (v.entity.label) {
            v.entity.label.text = new Cesium.ConstantProperty(`V${i + 1}`);
          }
        }
      });
      
      drawPolygon(updated);
      
      // Notify parent of change
      if (onVerticesChange) {
        onVerticesChange(updated.length);
        console.log('📊 [DELETE] Notified parent: vertex count =', updated.length);
      }
      
      return updated;
    });

    console.log('✅ Vertex deleted');
  };

  /**
   * Delete vertex by entity
   */
  const deleteVertex = (vertexEntity) => {
    if (vertices.length <= 3) {
      return;
    }

    const index = vertexEntity.properties.index.getValue();
    deleteVertexAtIndex(index);
  };

  /**
   * Find closest line segment for new vertex insertion
   */
  const findClosestLineSegment = (lat, lng) => {
    let minDistance = Infinity;
    let insertIndex = 0;

    for (let i = 0; i < vertices.length; i++) {
      const v1 = vertices[i];
      const v2 = vertices[(i + 1) % vertices.length];

      const distance = distanceToLineSegment(lat, lng, v1.lat, v1.lng, v2.lat, v2.lng);

      if (distance < minDistance) {
        minDistance = distance;
        insertIndex = i + 1;
      }
    }

    return insertIndex;
  };

  /**
   * Calculate distance from point to line segment
   */
  const distanceToLineSegment = (px, py, x1, y1, x2, y2) => {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) {
      param = dot / lenSq;
    }

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;

    return Math.sqrt(dx * dx + dy * dy);
  };

  /**
   * Preview impact of boundary change
   */
  const previewImpact = async () => {
    if (vertices.length < 3) {
      return;
    }

    console.log('?? [BOUNDARY EDITOR] Previewing impact...');
    setIsLoading(true);

    try {
      // Convert vertices to GeoJSON
      const newGeometry = {
        type: 'Polygon',
        coordinates: [vertices.map(v => [v.lng, v.lat])]
      };

      // TODO: Call API to calculate affected regions
      // For now, show mock data
      const mockAffectedRegions = [
        { code: 'PAK', name: 'Pakistan', overlapPercentage: 15 },
        { code: 'BGD', name: 'Bangladesh', overlapPercentage: 8 },
        { code: 'NPL', name: 'Nepal', overlapPercentage: 12 }
      ];

      setAffectedRegions(mockAffectedRegions);
      console.log(`? Preview: ${mockAffectedRegions.length} affected regions found`);

    } catch (error) {
      console.error('? Error previewing impact:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Save boundary proposal (SIMPLIFIED - Auto-generates name)
   */
  const handleSave = async () => {
    if (vertices.length < 3) {
      return;
    }

    console.log('?? [BOUNDARY EDITOR] Saving proposal...');
    console.log('?? [BOUNDARY EDITOR] Channel data:', {
      id: channel?.id,
      regionName: channel?.regionName,
      hasChannel: !!channel
    });
    
    if (!channel || !channel.id) {
      console.error('? [BOUNDARY EDITOR] No channel ID available!');
      return;
    }
    
    setIsLoading(true);

    try {
      // Auto-generate proposal name with timestamp
      const timestamp = new Date().toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      const autoName = proposalName.trim() || `${regionName} Boundary Proposal - ${timestamp}`;
      
      // Convert to GeoJSON
      const geometry = {
        type: 'Polygon',
        coordinates: [vertices.map(v => [v.lng, v.lat])]
      };

      // Calculate area changes if we have an official boundary
      let areaChangeData = null;
      if (originalGeometry && originalGeometry.coordinates && originalGeometry.coordinates[0]) {
        const { calculateAreaChange } = await import('../../../../utils/BoundaryPreviewGenerator.js');
        areaChangeData = calculateAreaChange(originalGeometry.coordinates[0], geometry.coordinates[0]);
        console.log('?? [BOUNDARY EDITOR] Area change calculated:', {
          official: areaChangeData.officialArea.toLocaleString() + ' km?',
          proposed: areaChangeData.proposedArea.toLocaleString() + ' km?',
          delta: (areaChangeData.deltaArea >= 0 ? '+' : '') + areaChangeData.deltaArea.toLocaleString() + ' km?',
          percent: (areaChangeData.deltaPercent >= 0 ? '+' : '') + areaChangeData.deltaPercent.toFixed(2) + '%'
        });
      }
      
      console.log('?? [BOUNDARY EDITOR] Submitting to API:', {
        url: `/api/channels/boundary/${channel.id}/proposal`,
        name: autoName,
        geometryType: geometry.type,
        vertices: geometry.coordinates[0].length
      });

      // Call API to save proposal (with auto-generated name)
      const response = await fetch(`/api/channels/boundary/${channel.id}/proposal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: autoName,
          description: description || `Proposed boundary modification for ${regionName}`,
          geometry: geometry,
          areaChange: areaChangeData
        })
      });

      console.log('?? [BOUNDARY EDITOR] Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('? [BOUNDARY EDITOR] API error response:', errorText);
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('?? [BOUNDARY EDITOR] Response data:', data);

      if (data.success) {
        console.log('? [BOUNDARY EDITOR] Proposal saved:', data.proposal);
        
        if (onSave) {
          onSave(data.proposal);
        }
      } else {
        throw new Error(data.error || 'Failed to save proposal');
      }

    } catch (error) {
      console.error('? [BOUNDARY EDITOR] Error saving proposal:', error);
      console.error('? [BOUNDARY EDITOR] Error stack:', error.stack);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Cleanup entities
   */
  const cleanup = () => {
    console.log('?? [BOUNDARY EDITOR] Cleaning up...');

    entitiesRef.current.forEach(entity => {
      try {
        cesiumViewer.entities.remove(entity);
      } catch (e) {
        // Entity may already be removed
      }
    });
    entitiesRef.current = [];
    polygonEntityRef.current = null;

    if (handlerRef.current) {
      handlerRef.current.destroy();
      handlerRef.current = null;
    }

    // ?? CRITICAL: Re-enable RegionManager handlers AND restore boundary highlighting
    if (window.earthGlobeControls?.regionManager && cesiumViewer) {
      console.log('? [BOUNDARY EDITOR] Re-enabling RegionManager handlers');
      try {
        const regionManager = window.earthGlobeControls.regionManager;
        
        // Re-register RegionManager handlers
        if (regionManager.mouseHandlers && cesiumViewer.cesiumWidget?.screenSpaceEventHandler) {
          cesiumViewer.cesiumWidget.screenSpaceEventHandler.setInputAction(
            regionManager.mouseHandlers.move, 
            window.Cesium.ScreenSpaceEventType.MOUSE_MOVE
          );
          cesiumViewer.cesiumWidget.screenSpaceEventHandler.setInputAction(
            regionManager.mouseHandlers.click, 
            window.Cesium.ScreenSpaceEventType.LEFT_CLICK
          );
          console.log('? [BOUNDARY EDITOR] RegionManager handlers re-enabled');
        }

        // ?? CRITICAL: Restore country/boundary highlighting
        if (regionManager.adminHierarchy) {
          const adminHierarchy = regionManager.adminHierarchy;
          
          // Restore country boundaries
          if (adminHierarchy.entities?.country) {
            console.log('?? [BOUNDARY EDITOR] Restoring country boundaries');
            adminHierarchy.entities.country.forEach((entity) => {
              if (entity.polygon && entity._originalSettings) {
                try {
                  entity.polygon.outlineWidth = entity._originalSettings.outlineWidth || 2;
                  entity.polygon.outlineColor = entity._originalSettings.outlineColor || window.Cesium.Color.BLACK;
                  // Only restore material if it's a valid Cesium type
                  if (entity._originalSettings.material && 
                      (entity._originalSettings.material instanceof window.Cesium.Color || 
                       entity._originalSettings.material instanceof window.Cesium.Material)) {
                    entity.polygon.material = entity._originalSettings.material;
                  } else if (entity._originalSettings.material) {
                    // If it's not a Cesium type, create a new Color from it
                    entity.polygon.material = window.Cesium.Color.TRANSPARENT;
                  }
                  delete entity._originalSettings;
                } catch (error) {
                  console.warn('?? Error restoring country entity:', error);
                }
              }
            });
          }

          // Restore province boundaries
          if (adminHierarchy.entities?.province) {
            console.log('?? [BOUNDARY EDITOR] Restoring province boundaries');
            adminHierarchy.entities.province.forEach((entity) => {
              if (entity.polygon && entity._originalSettings) {
                try {
                  entity.polygon.outlineWidth = entity._originalSettings.outlineWidth || 1;
                  entity.polygon.outlineColor = entity._originalSettings.outlineColor || window.Cesium.Color.BLACK;
                  // Only restore material if it's a valid Cesium type
                  if (entity._originalSettings.material && 
                      (entity._originalSettings.material instanceof window.Cesium.Color || 
                       entity._originalSettings.material instanceof window.Cesium.Material)) {
                    entity.polygon.material = entity._originalSettings.material;
                  } else if (entity._originalSettings.material) {
                    // If it's not a Cesium type, create a new Color from it
                    entity.polygon.material = window.Cesium.Color.TRANSPARENT;
                  }
                  delete entity._originalSettings;
                } catch (error) {
                  console.warn('?? Error restoring province entity:', error);
                }
              }
            });
          }

          console.log('? [BOUNDARY EDITOR] Country/province boundaries restored');
        }
      } catch (error) {
        console.warn('?? [BOUNDARY EDITOR] Error re-enabling RegionManager handlers:', error);
      }
    }
  };

  // Render controls overlay
  console.log('?? [BOUNDARY EDITOR] ==== RENDERING COMPONENT ====', 'mode:', mode);
  return (
    <div className="globe-boundary-editor-overlay">
      {/* Editor Controls Panel */}
      <div className="editor-controls-panel">
        <div className="editor-header">
          <h3>?? Boundary Editor</h3>
          <h4>{regionName}</h4>
          
          {/* Category Badge */}
          {channel?.category && (
            <div style={{
              marginTop: '8px',
              padding: '6px 12px',
              background: 'rgba(33, 150, 243, 0.2)',
              border: '1px solid rgba(33, 150, 243, 0.4)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '14px' }}>???</span>
              <div style={{ flex: 1 }}>
                <div style={{ 
                  fontSize: '10px', 
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontWeight: 600
                }}>
                  Category
                </div>
                <div style={{ 
                  fontSize: '13px', 
                  color: '#60a5fa',
                  fontWeight: 600
                }}>
                  {channel.category}
                </div>
              </div>
            </div>
          )}
          
          {/* Voting Scope Info */}
          {channel?.votingScope && (
            <div style={{
              marginTop: '8px',
              padding: '8px 12px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '8px'
            }}>
              <div style={{ 
                fontSize: '10px', 
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontWeight: 600,
                marginBottom: '4px'
              }}>
                ?? Voting Scope
              </div>
              <div style={{ 
                fontSize: '12px', 
                color: '#6ee7b7',
                lineHeight: '1.4'
              }}>
                {channel.votingDescription || `Voting open to ${channel.votingScope} level`}
              </div>
            </div>
          )}
        </div>

        {/* MINIMIZED EDITOR - Essential editing tools only */}
        {/* Multi-Select Mode Banner - COMPACT */}
        {isInMultiSelectMode && (
          <div className="editor-section" style={{
            background: 'rgba(6, 182, 212, 0.25)',
            border: '2px solid rgba(6, 182, 212, 0.6)',
            borderRadius: '6px',
            padding: '8px',
            marginBottom: '8px',
            animation: 'pulse 2s infinite'
          }}>
            <div style={{ 
              fontSize: '11px', 
              color: '#67e8f9',
              fontWeight: 700,
              textAlign: 'center',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              ? MULTI-SELECT ACTIVE - Click to place markers
            </div>
          </div>
        )}
        
        {/* Editing Instructions - COMPACT */}
        {!isInMultiSelectMode && (
          <div className="editor-section" style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '6px',
            padding: '8px',
            marginBottom: '8px'
          }}>
            <div style={{ 
              fontSize: '10px', 
              color: '#6ee7b7',
              lineHeight: '1.4'
            }}>
              <div>?? Click vertex to move • Long-press to delete</div>
              <div>?? Click empty/line to add vertex</div>
              <div>?? Long-press empty → Multi-select mode</div>
            </div>
          </div>
        )}

        {/* Freeform Selection Controls - COMPACT */}
        {console.log(`?? [RENDER] isInMultiSelectMode: ${isInMultiSelectMode}, freeformMarkers.length: ${freeformMarkers.length}`)}
        {isInMultiSelectMode && (
          <div className="editor-section" style={{
            background: 'rgba(6, 182, 212, 0.15)',
            border: '2px solid rgba(6, 182, 212, 0.4)',
            borderRadius: '6px',
            padding: '10px',
            marginBottom: '10px'
          }}>
            <div style={{
              fontSize: '11px',
              color: '#67e8f9',
              fontWeight: 600,
              marginBottom: '8px'
            }}>
              ?? Markers: {freeformMarkers.length} {freeformMarkers.length < 3 && `(need ${3 - freeformMarkers.length} more)`}
            </div>

            {freeformMarkers.length >= 1 && (
              <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                <button
                  onClick={() => {
                    console.log(`? [FREEFORM] Accept button clicked with ${freeformMarkers.length} markers`);
                    if (freeformMarkers.length >= 3) {
                      finalizeSelection(freeformMarkers);
                    }
                  }}
                  disabled={freeformMarkers.length < 3}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    background: freeformMarkers.length >= 3 ? '#10b981' : '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: freeformMarkers.length >= 3 ? 'pointer' : 'not-allowed',
                    fontSize: '11px',
                    fontWeight: 600,
                    opacity: freeformMarkers.length >= 3 ? 1 : 0.6
                  }}
                >
                  ? Accept
                </button>
                
                <button
                  onClick={clearFreeformSelection}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 600
                  }}
                >
                  ? Reject
                </button>
              </div>
            )}
          </div>
        )}

        {/* Compact Stats */}
        <div className="editor-section stats">
          <div className="stat-item">
            <span className="stat-label">?? Nodes:</span>
            <span className="stat-value">{vertices.length}</span>
          </div>
        </div>

        {/* Compact Instructions */}
        <div className="editor-section instructions" style={{ 
          fontSize: '11px', 
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '8px',
          borderRadius: '6px'
        }}>
          <div style={{ marginBottom: '4px', fontWeight: 600 }}>??? Controls:</div>
          <div>? <strong>Click</strong> node to select</div>
          <div>? <strong>Drag</strong> to move</div>
          <div>? <strong>Click line</strong> to add node</div>
          <div>? <strong>Right-click</strong> to delete</div>
        </div>

        {/* Simplified Action Buttons */}
        <div className="editor-actions">
          <button 
            onClick={handleSave}
            className="btn btn-primary"
            disabled={isLoading || vertices.length < 3}
            style={{ flex: 1 }}
          >
            {isLoading ? '? Saving...' : '? Confirm'}
          </button>
          <button 
            onClick={onCancel}
            className="btn btn-cancel"
            disabled={isLoading}
            style={{ flex: 1 }}
          >
            ? Cancel
          </button>
        </div>

        {/* Note about channel panel */}
        <div style={{
          marginTop: '12px',
          padding: '8px',
          background: 'rgba(33, 150, 243, 0.1)',
          border: '1px solid rgba(33, 150, 243, 0.3)',
          borderRadius: '6px',
          fontSize: '11px',
          color: '#60a5fa',
          lineHeight: '1.4'
        }}>
          ?? <strong>Note:</strong> Your boundary will appear as a candidate in the channel panel where you can add details and campaign for votes.
        </div>
      </div>
    </div>
  );
};

export default GlobeBoundaryEditor;




























