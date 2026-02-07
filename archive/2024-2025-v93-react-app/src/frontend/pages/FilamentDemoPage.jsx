/**
 * FILAMENT DEMO PAGE
 * 
 * Standalone page to test/validate the filament system.
 * Navigate to /filament-demo to see it.
 */

import React from 'react';
import FilamentDemoScene from '../components/filament/scenes/FilamentDemoScene';

export default function FilamentDemoPage() {
  console.log('🎨🎨🎨 [FilamentDemoPage] RENDERING - YOU SHOULD SEE THE FILAMENT SCENE 🎨🎨🎨');
  
  const MOUNTED_MARKER = (
    <div style={{position:'fixed',top:0,left:0,zIndex:999999,background:'#00ffff',color:'#000000',padding:'12px 24px',fontWeight:800,fontSize:'20px',border:'4px solid #000'}}>
      🔵 FILAMENT_DEMO_MOUNTED 🔵
    </div>
  );
  
  return (
    <>
      {MOUNTED_MARKER}
      <div style={{ 
      width: '100vw', 
      height: '100vh', 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      zIndex: 9999,
      backgroundColor: '#000'
    }}>
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        color: 'white',
        fontSize: '24px',
        zIndex: 10000,
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: '10px'
      }}>
        🎨 FILAMENT DEMO PAGE LOADED 🎨
      </div>
      <FilamentDemoScene />
    </div>
    </>
  );
}
