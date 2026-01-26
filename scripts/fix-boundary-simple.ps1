# Fix boundary loader - Simple version

$filePath = "c:\Users\eitana\Desktop\App Development\Relay\RelayCodeBaseV90\src\frontend\components\main\globe\editors\GlobeBoundaryEditor.jsx"

# Read file
$content = Get-Content $filePath -Raw -Encoding UTF8

# Find and replace the function
$pattern = '(?s)const loadOfficialBoundary = \(\) => \{[^}]+console\.log\([^)]+\);[^}]+\};'

$replacement = @'
const loadOfficialBoundary = () => {
    console.log('NEW [BOUNDARY EDITOR] Loading official boundary for editing');
    console.log('[BOUNDARY EDITOR] Channel data:', {
      hasChannel: !!channel,
      channelId: channel?.id,
      candidateCount: channel?.candidates?.length
    });
    
    const officialCandidate = channel?.candidates?.find(c => c.isOfficial || c.isDefault);
    
    if (officialCandidate) {
      console.log('[BOUNDARY EDITOR] Found official candidate');
      loadProposal(officialCandidate);
    } else {
      console.warn('[BOUNDARY EDITOR] No official candidate found');
      
      if (cesiumViewer && regionCode && Cesium) {
        console.log('[BOUNDARY EDITOR] Trying to extract from globe...');
        try {
          const entityIds = [`boundary-${regionCode}`, `region-${regionCode}`, regionCode];
          let boundaryEntity = null;
          
          for (const entityId of entityIds) {
            boundaryEntity = cesiumViewer.entities.getById(entityId);
            if (boundaryEntity) {
              console.log(`Found entity: ${entityId}`);
              break;
            }
          }
          
          if (boundaryEntity?.polygon?.hierarchy) {
            const hierarchy = boundaryEntity.polygon.hierarchy.getValue();
            const positions = hierarchy.positions || [];
            
            if (positions.length > 0) {
              const coords = positions.map(pos => {
                const cartographic = Cesium.Cartographic.fromCartesian(pos);
                return [
                  Cesium.Math.toDegrees(cartographic.longitude),
                  Cesium.Math.toDegrees(cartographic.latitude)
                ];
              });
              
              console.log(`Extracted ${coords.length} vertices from globe`);
              setOriginalGeometry({ type: 'Polygon', coordinates: [coords] });
              loadVertices(coords);
              return;
            }
          }
        } catch (error) {
          console.error('[BOUNDARY EDITOR] Error extracting:', error);
        }
      }
      
      console.warn('[BOUNDARY EDITOR] Starting with empty polygon');
      setMode('add');
    }
  };
'@

if ($content -match $pattern) {
    $newContent = $content -replace $pattern, $replacement
    $newContent | Set-Content $filePath -Encoding UTF8 -NoNewline
    Write-Host "SUCCESS: Updated function" -ForegroundColor Green
} else {
    Write-Host "ERROR: Could not find function pattern" -ForegroundColor Red
}
