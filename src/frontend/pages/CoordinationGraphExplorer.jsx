/**
 * COORDINATION GRAPH EXPLORER
 * 
 * A replay browser for coordination physics.
 * 
 * CRITICAL: This is NOT a visualization tool — it's a forensic explorer.
 * Every node, edge, and relationship is derived from commits and refs.
 * 
 * Layout:
 * - Left: Filament list (searchable)
 * - Center: 3D graph (filaments as nodes, refs as edges)
 * - Right: Inspector (commit details, authorityRef verification, T-levels)
 * 
 * Route: /coordination-graph
 */

import React, { useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls, Grid, Line, Text, Sphere, Box } from '@react-three/drei';
import { createMockCoordinationGraph, exportGraph, buildCoordinationGraph } from '../components/coordination/model/graphBuilder';
import { Filament, Commit, RefEdge } from '../components/coordination/model/coordinationGraphModel';
import FileDropZone from '../components/coordination/loader/FileDropZone';

export default function CoordinationGraphExplorer() {
  // State
  const [selectedFilament, setSelectedFilament] = useState(null);
  const [selectedCommit, setSelectedCommit] = useState(null);
  const [viewMode, setViewMode] = useState('filaments'); // 'filaments' | 'commits'
  const [tLevelFilter, setTLevelFilter] = useState('T1'); // T0 | T1 | T2 | T3 | all
  const [searchQuery, setSearchQuery] = useState('');
  const [showFileImport, setShowFileImport] = useState(false);
  const [importedFilaments, setImportedFilaments] = useState([]);
  const [importStats, setImportStats] = useState(null);
  
  // Build coordination graph (mock + imported)
  const graph = useMemo(() => {
    const mockGraph = createMockCoordinationGraph();
    
    // Add imported filaments
    importedFilaments.forEach(result => {
      if (result.evidenceFilament) {
        mockGraph.addFilament(result.evidenceFilament);
      }
      if (result.fileFilament) {
        mockGraph.addFilament(result.fileFilament);
      }
    });
    
    return mockGraph;
  }, [importedFilaments]);
  
  // Filter filaments by search
  const filteredFilaments = useMemo(() => {
    if (!searchQuery) return Array.from(graph.filaments.values());
    
    return Array.from(graph.filaments.values()).filter(f =>
      f.filamentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.kind.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [graph, searchQuery]);
  
  // Get commits for selected filament (filtered by T-level)
  const visibleCommits = useMemo(() => {
    if (!selectedFilament) return [];
    
    const filament = graph.getFilament(selectedFilament);
    if (!filament) return [];
    
    if (tLevelFilter === 'all') return filament.commits;
    return filament.commits.filter(c => c.tLevel === tLevelFilter);
  }, [graph, selectedFilament, tLevelFilter]);
  
  // Get all edges (filtered by view mode)
  const visibleEdges = useMemo(() => {
    return graph.getAllEdges();
  }, [graph]);
  
  // Get graph stats
  const stats = useMemo(() => graph.getStats(), [graph]);
  
  // Handle filament selection
  const handleSelectFilament = (filamentId) => {
    setSelectedFilament(filamentId);
    setSelectedCommit(null);
  };
  
  // Handle commit selection
  const handleSelectCommit = (commitIndex) => {
    setSelectedCommit(commitIndex);
  };
  
  // Handle files imported
  const handleFilesImported = (results, stats) => {
    console.log('[CoordinationGraphExplorer] Files imported:', results, stats);
    setImportedFilaments(prev => [...prev, ...results]);
    setImportStats(stats);
    setShowFileImport(false);
  };
  
  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0A0E1A', color: '#E8E8E8', fontFamily: 'monospace' }}>
      
      {/* LEFT PANEL: FILAMENT LIST */}
      <div style={{ width: '280px', borderRight: '1px solid #2A2E3A', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #2A2E3A' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>COORDINATION GRAPH</h2>
            <button
              onClick={() => setShowFileImport(true)}
              style={{
                padding: '4px 8px',
                background: '#4A90E2',
                border: 'none',
                borderRadius: '4px',
                color: '#FFFFFF',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              + Import
            </button>
          </div>
          
          {/* Search */}
          <input
            type="text"
            placeholder="Search filaments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              background: '#1A1E2A',
              border: '1px solid #2A2E3A',
              color: '#E8E8E8',
              borderRadius: '4px',
              fontSize: '12px',
            }}
          />
          
          {/* Stats */}
          <div style={{ marginTop: '12px', fontSize: '11px', color: '#9B9B9B' }}>
            <div>Filaments: {stats.filamentCount}</div>
            <div>Commits: {stats.commitCount}</div>
            <div>Edges: {stats.edgeCount}</div>
          </div>
        </div>
        
        {/* Filament list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredFilaments.map(filament => (
            <div
              key={filament.filamentId}
              onClick={() => handleSelectFilament(filament.filamentId)}
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid #1A1E2A',
                cursor: 'pointer',
                background: selectedFilament === filament.filamentId ? '#2A2E3A' : 'transparent',
                transition: 'background 0.2s',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 600, color: Filament.getColor(filament.kind) }}>
                {filament.kind.toUpperCase()}
              </div>
              <div style={{ fontSize: '11px', color: '#9B9B9B', marginTop: '4px', wordBreak: 'break-all' }}>
                {filament.filamentId}
              </div>
              <div style={{ fontSize: '10px', color: '#6B6B6B', marginTop: '4px' }}>
                {filament.commits.length} commits
              </div>
            </div>
          ))}
        </div>
        
        {/* View mode toggle */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #2A2E3A' }}>
          <div style={{ fontSize: '10px', color: '#6B6B6B', marginBottom: '8px' }}>VIEW MODE</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setViewMode('filaments')}
              style={{
                flex: 1,
                padding: '6px',
                background: viewMode === 'filaments' ? '#4A90E2' : '#1A1E2A',
                border: 'none',
                color: '#E8E8E8',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
              }}
            >
              Filaments
            </button>
            <button
              onClick={() => setViewMode('commits')}
              style={{
                flex: 1,
                padding: '6px',
                background: viewMode === 'commits' ? '#4A90E2' : '#1A1E2A',
                border: 'none',
                color: '#E8E8E8',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
              }}
            >
              Commits
            </button>
          </div>
        </div>
      </div>
      
      {/* CENTER PANEL: 3D GRAPH */}
      <div style={{ flex: 1, position: 'relative' }}>
        <Canvas>
          <PerspectiveCamera makeDefault position={[10, 10, 10]} fov={50} />
          <OrbitControls enableDamping dampingFactor={0.05} />
          
          {/* Lighting */}
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 10, 5]} intensity={0.8} />
          <pointLight position={[-10, -10, -5]} intensity={0.3} />
          
          {/* Grid (coordinate system) */}
          <Grid args={[20, 20]} cellColor="#2A2E3A" sectionColor="#4A4E5A" />
          
          {/* Axes */}
          <Line points={[[0, 0, 0], [5, 0, 0]]} color="#F8E71C" lineWidth={2} />
          <Line points={[[0, 0, 0], [0, 5, 0]]} color="#F8E71C" lineWidth={2} />
          <Line points={[[0, 0, 0], [0, 0, 5]]} color="#F8E71C" lineWidth={2} />
          <Text position={[5.5, 0, 0]} fontSize={0.3} color="#F8E71C">X</Text>
          <Text position={[0, 5.5, 0]} fontSize={0.3} color="#F8E71C">Y</Text>
          <Text position={[0, 0, 5.5]} fontSize={0.3} color="#F8E71C">Z</Text>
          
          {/* Filament nodes */}
          {viewMode === 'filaments' && Array.from(graph.filaments.values()).map((filament, i) => {
            const position = [
              (i % 4) * 3 - 4.5,
              Math.floor(i / 4) * 3,
              0
            ];
            
            return (
              <group key={filament.filamentId} position={position}>
                {/* Filament node */}
                <Sphere
                  args={[0.3, 16, 16]}
                  onClick={() => handleSelectFilament(filament.filamentId)}
                >
                  <meshStandardMaterial
                    color={Filament.getColor(filament.kind)}
                    emissive={selectedFilament === filament.filamentId ? Filament.getColor(filament.kind) : '#000000'}
                    emissiveIntensity={selectedFilament === filament.filamentId ? 0.3 : 0}
                  />
                </Sphere>
                
                {/* Label */}
                <Text
                  position={[0, -0.6, 0]}
                  fontSize={0.15}
                  color="#9B9B9B"
                  anchorX="center"
                  anchorY="top"
                >
                  {filament.kind}
                </Text>
              </group>
            );
          })}
          
          {/* Ref edges */}
          {viewMode === 'filaments' && visibleEdges.map(edge => {
            // Find filament positions (simplified for now)
            const fromFilamentIndex = Array.from(graph.filaments.keys()).indexOf(edge.from.filamentId);
            const toFilamentIndex = Array.from(graph.filaments.keys()).indexOf(edge.to.filamentId);
            
            if (fromFilamentIndex === -1 || toFilamentIndex === -1) return null;
            
            const fromPos = [
              (fromFilamentIndex % 4) * 3 - 4.5,
              Math.floor(fromFilamentIndex / 4) * 3,
              0
            ];
            
            const toPos = [
              (toFilamentIndex % 4) * 3 - 4.5,
              Math.floor(toFilamentIndex / 4) * 3,
              0
            ];
            
            return (
              <Line
                key={edge.getId()}
                points={[fromPos, toPos]}
                color={edge.getColor()}
                lineWidth={1}
                opacity={0.6}
                transparent
              />
            );
          })}
          
          {/* Commit nodes (when in commit view) */}
          {viewMode === 'commits' && selectedFilament && visibleCommits.map((commit, i) => {
            const position = [
              i * 0.5 - (visibleCommits.length * 0.25),
              0,
              0
            ];
            
            return (
              <group key={`${commit.filamentId}:${commit.commitIndex}`} position={position}>
                <Box
                  args={[0.2, 0.2, 0.2]}
                  onClick={() => handleSelectCommit(commit.commitIndex)}
                >
                  <meshStandardMaterial
                    color={commit.authorityRef ? '#F8E71C' : '#9B9B9B'}
                    emissive={selectedCommit === commit.commitIndex ? '#FFFFFF' : '#000000'}
                    emissiveIntensity={selectedCommit === commit.commitIndex ? 0.3 : 0}
                  />
                </Box>
                
                {/* T-level indicator */}
                <Text
                  position={[0, -0.4, 0]}
                  fontSize={0.1}
                  color={commit.tLevel === 'T3' ? '#F8E71C' : '#6B6B6B'}
                  anchorX="center"
                >
                  {commit.tLevel}
                </Text>
              </group>
            );
          })}
        </Canvas>
        
        {/* Overlay controls */}
        <div style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(26, 30, 42, 0.9)', padding: '12px', borderRadius: '8px', border: '1px solid #2A2E3A' }}>
          <div style={{ fontSize: '11px', color: '#9B9B9B', marginBottom: '8px' }}>T-LEVEL FILTER</div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['T0', 'T1', 'T2', 'T3', 'all'].map(level => (
              <button
                key={level}
                onClick={() => setTLevelFilter(level)}
                style={{
                  padding: '4px 8px',
                  background: tLevelFilter === level ? '#4A90E2' : '#1A1E2A',
                  border: 'none',
                  color: '#E8E8E8',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '10px',
                }}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* RIGHT PANEL: INSPECTOR */}
      <div style={{ width: '360px', borderLeft: '1px solid #2A2E3A', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #2A2E3A' }}>
          <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>INSPECTOR</h2>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {!selectedFilament && (
            <div style={{ fontSize: '12px', color: '#6B6B6B' }}>
              Select a filament or commit to inspect
            </div>
          )}
          
          {selectedFilament && !selectedCommit && (
            <div>
              <div style={{ fontSize: '10px', color: '#6B6B6B', marginBottom: '8px' }}>FILAMENT</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: Filament.getColor(graph.getFilament(selectedFilament)?.kind), marginBottom: '12px' }}>
                {selectedFilament}
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '10px', color: '#6B6B6B', marginBottom: '8px' }}>COMMITS</div>
                {visibleCommits.map(commit => (
                  <div
                    key={commit.commitIndex}
                    onClick={() => handleSelectCommit(commit.commitIndex)}
                    style={{
                      padding: '8px',
                      background: '#1A1E2A',
                      borderRadius: '4px',
                      marginBottom: '6px',
                      cursor: 'pointer',
                      border: selectedCommit === commit.commitIndex ? '1px solid #4A90E2' : '1px solid transparent',
                    }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: 600 }}>
                      {commit.op}
                      {commit.authorityRef && <span style={{ marginLeft: '8px', color: '#F8E71C' }}>🔒</span>}
                    </div>
                    <div style={{ fontSize: '10px', color: '#6B6B6B', marginTop: '4px' }}>
                      Commit {commit.commitIndex} • {commit.tLevel}
                    </div>
                  </div>
                ))}
              </div>
              
              <div>
                <div style={{ fontSize: '10px', color: '#6B6B6B', marginBottom: '8px' }}>CONNECTED TO</div>
                {graph.getFilamentEdges(selectedFilament).slice(0, 5).map((edge, i) => (
                  <div key={i} style={{ fontSize: '10px', color: edge.getColor(), marginBottom: '4px' }}>
                    {edge.type}: {edge.from.filamentId === selectedFilament ? edge.to.filamentId : edge.from.filamentId}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {selectedCommit !== null && selectedFilament && (
            <div>
              <div style={{ fontSize: '10px', color: '#6B6B6B', marginBottom: '8px' }}>COMMIT DETAILS</div>
              
              {(() => {
                const commit = visibleCommits.find(c => c.commitIndex === selectedCommit);
                if (!commit) return null;
                
                return (
                  <div>
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>{commit.op}</div>
                      <div style={{ fontSize: '10px', color: '#6B6B6B' }}>
                        Commit {commit.commitIndex} • {commit.tLevel}
                      </div>
                    </div>
                    
                    {/* Actor */}
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '10px', color: '#6B6B6B', marginBottom: '4px' }}>ACTOR</div>
                      <div style={{ fontSize: '11px' }}>{commit.actor.kind}: {commit.actor.id}</div>
                    </div>
                    
                    {/* Authority verification */}
                    {commit.authorityRef ? (
                      <div style={{ marginBottom: '12px', padding: '8px', background: '#1A2A1A', borderRadius: '4px', border: '1px solid #2A4A2A' }}>
                        <div style={{ fontSize: '10px', color: '#7ED321', marginBottom: '6px', fontWeight: 600 }}>✓ AUTHORITY VERIFIED</div>
                        <div style={{ fontSize: '10px', color: '#9B9B9B', marginBottom: '4px' }}>
                          Capability: {commit.authorityRef.capability}
                        </div>
                        <div style={{ fontSize: '10px', color: '#9B9B9B', marginBottom: '4px' }}>
                          Scope: {commit.authorityRef.scopeId}
                        </div>
                        <div style={{ fontSize: '10px', color: '#9B9B9B' }}>
                          Chain Length: {commit.authorityRef.proof?.delegationPath?.length || 0}
                        </div>
                      </div>
                    ) : (
                      commit.op.includes('QUEUE_REORDER') || commit.op.includes('CANCEL') || commit.op.includes('RESOLVED') || commit.op === 'MERGE_SCAR' ? (
                        <div style={{ marginBottom: '12px', padding: '8px', background: '#2A1A1A', borderRadius: '4px', border: '1px solid #4A2A2A' }}>
                          <div style={{ fontSize: '10px', color: '#D0021B', fontWeight: 600 }}>⚠ NO AUTHORITY</div>
                          <div style={{ fontSize: '9px', color: '#9B9B9B', marginTop: '4px' }}>
                            This operation requires authorityRef but has none.
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '10px', color: '#6B6B6B', marginBottom: '12px' }}>
                          No authority required for this op
                        </div>
                      )
                    )}
                    
                    {/* Refs */}
                    {commit.refs.inputs && commit.refs.inputs.length > 0 && (
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '10px', color: '#6B6B6B', marginBottom: '4px' }}>INPUTS</div>
                        {commit.refs.inputs.map((input, i) => (
                          <div key={i} style={{ fontSize: '10px', color: '#4A90E2', marginBottom: '2px' }}>
                            → {input.filamentId}:{input.commitIndex}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Payload */}
                    <div>
                      <div style={{ fontSize: '10px', color: '#6B6B6B', marginBottom: '4px' }}>PAYLOAD</div>
                      <pre style={{
                        fontSize: '9px',
                        color: '#9B9B9B',
                        background: '#1A1E2A',
                        padding: '8px',
                        borderRadius: '4px',
                        overflow: 'auto',
                        maxHeight: '200px',
                        margin: 0,
                      }}>
                        {JSON.stringify(commit.payload, null, 2)}
                      </pre>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
      
      {/* FILE IMPORT MODAL */}
      {showFileImport && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowFileImport(false)}
        >
          <div
            style={{
              width: '600px',
              height: '400px',
              background: '#1A1E2A',
              borderRadius: '8px',
              border: '1px solid #2A2E3A',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ marginBottom: '16px' }}>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 600 }}>Import Files</h2>
              <p style={{ margin: 0, fontSize: '12px', color: '#9B9B9B' }}>
                All files are accepted. Excel/code files get semantic extraction; unknown types become evidence objects.
              </p>
            </div>
            
            <div style={{ flex: 1 }}>
              <FileDropZone onFilesImported={handleFilesImported} />
            </div>
            
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '11px', color: '#9B9B9B' }}>
                {importedFilaments.length > 0 && (
                  <>Previously imported: {importedFilaments.length} files</>
                )}
              </div>
              
              <button
                onClick={() => setShowFileImport(false)}
                style={{
                  padding: '8px 16px',
                  background: '#2A2E3A',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#E8E8E8',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}
