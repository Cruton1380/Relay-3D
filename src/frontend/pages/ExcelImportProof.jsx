import React, { useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Html } from '@react-three/drei';
import * as THREE from 'three';
import { createExcelImportAdapter } from '../components/excel/adapters/ExcelImportAdapter.js';
import { CellGrid3D } from '../components/excel/CellGrid3D_CERTIFIED.jsx'; // CERTIFIED: 3-bucket architecture
import {
  createCellValueUpdatedCommit,
  createFormulaUpdatedCommit,
  replaySheetCommits,
  extractFormulaDependencies,
  parseCellRef,
  toCellRef,
  computeCellValue,
} from '../components/excel/schemas/excelCommitSchemas.js';

/**
 * Excel Import Proof — Universal Import in Action
 * 
 * Demonstrates:
 * 1. Import Excel → filaments (lossless)
 * 2. Render as spreadsheet (2D projection lens)
 * 3. Render as 3D filament (commit history)
 * 4. Cell edits append commits (immutable)
 * 5. Formula dependencies as topology rays
 * 6. Playback motor (replay edits)
 */
export default function ExcelImportProof() {
  const [filaments, setFilaments] = useState([]);
  const [selectedFilament, setSelectedFilament] = useState(null);
  const [viewMode, setViewMode] = useState('3d'); // 'spreadsheet' | '3d' | 'both' - default to 3D to show filament visualization
  const [editingCell, setEditingCell] = useState(null);
  const [showFormulaDeps, setShowFormulaDeps] = useState(false);
  const [importing, setImporting] = useState(false);

  const fileInputRef = useRef(null);
  const adapter = useRef(createExcelImportAdapter());

  // Handle file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    console.log('📁 [ExcelImport] Uploading file:', file.name);
    setImporting(true);

    const result = await adapter.current.importFile(file);

    if (result.success) {
      console.log('✅ [ExcelImport] Import successful:', result.filaments.length, 'sheets');
      setFilaments(result.filaments);
      setSelectedFilament(result.filaments[0]);
    } else {
      console.error('❌ [ExcelImport] Import failed:', result.error);
      alert(`Import failed: ${result.error}`);
    }

    setImporting(false);
  };

  // Handle cell edit
  const handleCellEdit = (cellRef, newValue) => {
    if (!selectedFilament) return;

    const state = replaySheetCommits(selectedFilament.commits);
    const oldValue = state.cells[cellRef]?.value;

    // Determine if it's a formula or value
    const isFormula = newValue.startsWith('=');

    let newCommit;
    if (isFormula) {
      const deps = extractFormulaDependencies(newValue);
      const computedValue = computeCellValue(cellRef, {
        ...state.cells,
        [cellRef]: { formula: newValue, type: 'formula' },
      }, state.formulas);

      newCommit = createFormulaUpdatedCommit(
        selectedFilament.id,
        selectedFilament.commits.length,
        { kind: 'user', id: 'user:demo' },
        {
          cellRef,
          oldFormula: state.cells[cellRef]?.formula || null,
          newFormula: newValue,
          computedValue,
          inputs: deps,
        }
      );
    } else {
      newCommit = createCellValueUpdatedCommit(
        selectedFilament.id,
        selectedFilament.commits.length,
        { kind: 'user', id: 'user:demo' },
        {
          cellRef,
          oldValue,
          newValue,
          valueType: typeof newValue === 'number' ? 'number' : 'string',
        }
      );
    }

    // Append commit
    const updatedFilament = {
      ...selectedFilament,
      commits: [...selectedFilament.commits, newCommit],
    };

    setFilaments((prev) =>
      prev.map((f) => (f.id === selectedFilament.id ? updatedFilament : f))
    );
    setSelectedFilament(updatedFilament);
    setEditingCell(null);

    console.log('✅ [ExcelImport] Cell updated:', cellRef, '→', newValue);
  };

  // Render current state
  const currentState = selectedFilament
    ? replaySheetCommits(selectedFilament.commits)
    : null;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex' }}>
      {/* Left Panel: Controls & Info */}
      <div
        style={{
          width: '300px',
          padding: '20px',
          background: '#1a1a1a',
          color: '#fff',
          overflowY: 'auto',
          borderRight: '1px solid #333',
        }}
      >
        <h2 style={{ margin: '0 0 20px 0', fontSize: '24px' }}>
          📊 Excel Import
        </h2>

        {/* Upload Section */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>
            1. Upload File
          </h3>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            style={{
              padding: '10px 20px',
              background: importing ? '#555' : '#0088ff',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: importing ? 'not-allowed' : 'pointer',
              fontSize: '14px',
            }}
          >
            {importing ? 'Importing...' : 'Choose Excel File'}
          </button>
        </div>

        {/* Imported Sheets */}
        {filaments.length > 0 && (
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>
              2. Imported Sheets
            </h3>
            {filaments.map((f) => (
              <div
                key={f.id}
                onClick={() => setSelectedFilament(f)}
                style={{
                  padding: '10px',
                  marginBottom: '5px',
                  background:
                    selectedFilament?.id === f.id ? '#0088ff' : '#333',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                {f.metadata.sheetName}
                <div style={{ fontSize: '12px', color: '#aaa', marginTop: '5px' }}>
                  {f.commits.length} commits
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View Mode */}
        {selectedFilament && (
          <>
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>
                3. View Mode
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {['spreadsheet', '3d', 'both'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    style={{
                      padding: '8px',
                      background: viewMode === mode ? '#0088ff' : '#333',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    {mode === 'spreadsheet'
                      ? '📄 Spreadsheet'
                      : mode === '3d'
                      ? '🌐 3D Filament'
                      : '📊 Both Views'}
                  </button>
                ))}
              </div>
            </div>

            {/* Formula Dependencies Toggle */}
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>
                4. Topology
              </h3>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showFormulaDeps}
                  onChange={(e) => setShowFormulaDeps(e.target.checked)}
                  style={{ marginRight: '10px' }}
                />
                <span>Show Formula Dependencies</span>
              </label>
            </div>

            {/* Sheet Info */}
            <div
              style={{
                padding: '15px',
                background: '#222',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            >
              <div style={{ marginBottom: '10px' }}>
                <strong>Sheet:</strong> {currentState?.metadata.sheetName}
              </div>
              <div style={{ marginBottom: '10px' }}>
                <strong>Size:</strong> {currentState?.metadata.rowCount} ×{' '}
                {currentState?.metadata.colCount}
              </div>
              <div style={{ marginBottom: '10px' }}>
                <strong>Commits:</strong> {selectedFilament.commits.length}
              </div>
              <div>
                <strong>Cells:</strong> {Object.keys(currentState?.cells || {}).length}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Right Panel: Visualization */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {!selectedFilament && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#666',
              fontSize: '18px',
            }}
          >
            Upload an Excel file to begin
          </div>
        )}

        {selectedFilament && viewMode === 'spreadsheet' && (
          <SpreadsheetView
            state={currentState}
            onCellEdit={handleCellEdit}
            editingCell={editingCell}
            setEditingCell={setEditingCell}
            showFormulaDeps={showFormulaDeps}
          />
        )}

        {selectedFilament && viewMode === '3d' && (
          <ThreeDView
            filament={selectedFilament}
            state={currentState}
            showFormulaDeps={showFormulaDeps}
          />
        )}

        {selectedFilament && viewMode === 'both' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, borderBottom: '1px solid #333' }}>
              <SpreadsheetView
                state={currentState}
                onCellEdit={handleCellEdit}
                editingCell={editingCell}
                setEditingCell={setEditingCell}
                showFormulaDeps={showFormulaDeps}
              />
            </div>
            <div style={{ flex: 1 }}>
              <ThreeDView
                filament={selectedFilament}
                state={currentState}
                showFormulaDeps={showFormulaDeps}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Spreadsheet View — 2D Projection Lens
 */
function SpreadsheetView({ state, onCellEdit, editingCell, setEditingCell, showFormulaDeps }) {
  if (!state) return null;

  const { cells, formulas, metadata } = state;
  const rows = metadata.rowCount || 10;
  const cols = metadata.colCount || 10;

  // Build grid
  const grid = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      const cellRef = toCellRef(r, c);
      const cell = cells[cellRef] || { value: '', type: 'empty' };
      const formula = formulas[cellRef];

      row.push({
        ref: cellRef,
        value: cell.value,
        formula: cell.formula,
        type: cell.type,
        hasFormula: !!formula,
        isFormulaInput: showFormulaDeps && formula && formula.dependents?.length > 0,
      });
    }
    grid.push(row);
  }

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'auto', background: '#0a0a0a' }}>
      <table
        style={{
          borderCollapse: 'collapse',
          background: '#1a1a1a',
          color: '#fff',
          fontSize: '14px',
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                border: '1px solid #333',
                padding: '8px',
                background: '#222',
                position: 'sticky',
                top: 0,
                left: 0,
                zIndex: 2,
              }}
            >
              
            </th>
            {Array.from({ length: cols }, (_, i) => (
              <th
                key={i}
                style={{
                  border: '1px solid #333',
                  padding: '8px',
                  background: '#222',
                  position: 'sticky',
                  top: 0,
                  zIndex: 1,
                }}
              >
                {String.fromCharCode(65 + i)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.map((row, rowIdx) => (
            <tr key={rowIdx}>
              <td
                style={{
                  border: '1px solid #333',
                  padding: '8px',
                  background: '#222',
                  position: 'sticky',
                  left: 0,
                  zIndex: 1,
                }}
              >
                {rowIdx + 1}
              </td>
              {row.map((cell) => (
                <Cell
                  key={cell.ref}
                  cell={cell}
                  isEditing={editingCell === cell.ref}
                  onStartEdit={() => setEditingCell(cell.ref)}
                  onFinishEdit={(newValue) => onCellEdit(cell.ref, newValue)}
                  onCancelEdit={() => setEditingCell(null)}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Individual Cell Component
 */
function Cell({ cell, isEditing, onStartEdit, onFinishEdit, onCancelEdit }) {
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing) {
      setEditValue(cell.formula || String(cell.value || ''));
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isEditing, cell]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      const parsed = cell.type === 'number' && !editValue.startsWith('=')
        ? parseFloat(editValue) || 0
        : editValue;
      onFinishEdit(parsed);
    } else if (e.key === 'Escape') {
      onCancelEdit();
    }
  };

  const displayValue = cell.formula
    ? `${cell.formula} = ${cell.value}`
    : String(cell.value || '');

  const bgColor = cell.hasFormula
    ? '#1a3a1a'
    : cell.isFormulaInput
    ? '#3a1a1a'
    : '#1a1a1a';

  return (
    <td
      onClick={onStartEdit}
      style={{
        border: '1px solid #333',
        padding: '8px',
        background: bgColor,
        cursor: 'pointer',
        minWidth: '100px',
        maxWidth: '200px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        textAlign: cell.type === 'number' ? 'right' : 'left',
      }}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => onCancelEdit()}
          style={{
            width: '100%',
            background: '#000',
            color: '#fff',
            border: '1px solid #0088ff',
            padding: '4px',
            fontSize: '14px',
          }}
        />
      ) : (
        displayValue
      )}
    </td>
  );
}

/**
 * 3D View — Filament Visualization
 */
function ThreeDView({ filament, state, showFormulaDeps }) {
  // If single filament, wrap in array for CellGrid3D
  const filaments = filament ? [filament] : [];
  
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas style={{ background: '#000' }}>
        {/* Camera positioned to see full grid - back and up for overview */}
        <PerspectiveCamera makeDefault position={[5, 30, 50]} fov={75} />
        
        <ambientLight intensity={0.5} />
        <pointLight position={[30, 30, 30]} intensity={1.2} />
        <pointLight position={[-30, 20, -30]} intensity={0.6} />
        <directionalLight position={[10, 20, 10]} intensity={0.8} />

        {/* 3D Cell Grid (all cells with commit history across time) */}
        <CellGrid3D
          filaments={filaments}
          selectedFilamentId={filament?.id}
          showFormulaDeps={showFormulaDeps}
        />

        {/* Grid helper */}
        <gridHelper args={[100, 100, '#1a1a1a', '#0a0a0a']} />
      </Canvas>

      {/* Controls Overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          background: 'rgba(0,0,0,0.95)',
          color: '#00ffff',
          padding: '14px 18px',
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '12px',
          border: '2px solid #00ffff',
          lineHeight: '1.9',
          boxShadow: '0 4px 12px rgba(0,255,255,0.3)',
        }}
      >
        <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#ffaa00', fontSize: '13px' }}>
          🎮 FPS CONTROLS
        </div>
        <div style={{ background: 'rgba(255,170,0,0.2)', padding: '4px 8px', borderRadius: '4px', marginBottom: '8px', border: '1px solid #ffaa00' }}>
          <span style={{color: '#ffaa00', fontWeight: 'bold'}}>CLICK CANVAS</span> to enable mouse look
        </div>
        <div><span style={{color: '#00ff00'}}>W/A/S/D</span> - Move forward/left/back/right</div>
        <div><span style={{color: '#00ff00'}}>Q/E</span> - Move down/up</div>
        <div><span style={{color: '#00ff00'}}>MOUSE</span> - Free look (360°)</div>
        <div style={{ marginTop: '10px', fontSize: '10px', color: '#666', fontStyle: 'italic' }}>
          ✨ Smooth ease-in/ease-out movement
        </div>
        <div style={{ marginTop: '6px', fontSize: '10px', color: '#666' }}>
          Press ESC to unlock pointer
        </div>
      </div>

      {/* Axis Guide */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'rgba(0,0,0,0.95)',
          color: '#fff',
          padding: '12px 16px',
          borderRadius: '6px',
          fontFamily: 'monospace',
          fontSize: '11px',
          border: '1px solid #333',
          lineHeight: '2',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#aaa' }}>
          📐 COORDINATE SYSTEM
        </div>
        <div style={{ color: '#ff6666', fontWeight: 'bold' }}>X-axis = TIME →</div>
        <div style={{ color: '#66ff66', fontWeight: 'bold' }}>Y-axis = ROWS ↓</div>
        <div style={{ color: '#6666ff', fontWeight: 'bold' }}>Z-axis = COLS →</div>
        <div style={{ marginTop: '10px', fontSize: '9px', color: '#666' }}>
          Each cell = filament with history
        </div>
      </div>

      {/* Visualization Info */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          background: 'rgba(0,0,0,0.95)',
          color: '#fff',
          padding: '12px 16px',
          borderRadius: '6px',
          fontFamily: 'monospace',
          fontSize: '10px',
          border: '2px solid #00ffff',
          lineHeight: '1.9',
          boxShadow: '0 4px 12px rgba(0,255,255,0.3)',
        }}
      >
        <div style={{ color: '#00ffff', fontWeight: 'bold', marginBottom: '8px' }}>
          ✅ RELAY-GRADE RENDERING
        </div>
        <div style={{ fontSize: '9px', color: '#00ff00' }}>
          • All cells preserved (truth layer)
        </div>
        <div style={{ fontSize: '9px', color: '#00ff00' }}>
          • All 6 faces per cell
        </div>
        <div style={{ fontSize: '9px', color: '#00ff00' }}>
          • Full commit history
        </div>
        <div style={{ marginTop: '8px', fontSize: '9px', color: '#aaa' }}>
          GPU: Instanced rendering (1 draw call)
        </div>
        <div style={{ fontSize: '8px', color: '#666', marginTop: '6px' }}>
          Hover any cell → see all 6 faces
        </div>
      </div>
    </div>
  );
}


