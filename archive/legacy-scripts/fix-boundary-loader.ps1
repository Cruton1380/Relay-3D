# Fix the loadOfficialBoundary function to add comprehensive logging and fallbacks

$filePath = "c:\Users\eitana\Desktop\App Development\Relay\RelayCodeBaseV90\src\frontend\components\main\globe\editors\GlobeBoundaryEditor.jsx"

# Read the entire file
$content = Get-Content $filePath -Raw -Encoding UTF8

# Define the old function (just the signature and first line for matching)
$oldFunction = @'
  /**
   * Load official boundary as starting point
   */
  const loadOfficialBoundary = () => {
    console.log('🆕 [BOUNDARY EDITOR] Loading official boundary for editing');
    
    // Find official boundary candidate
    const officialCandidate = channel?.candidates?.find(c => c.isOfficial || c.isDefault);
    
    if (officialCandidate) {
      loadProposal(officialCandidate);
    } else {
      console.warn('⚠️ No official boundary found, starting with empty polygon');
      // Start with empty - user will add vertices
      setMode('add');
    }
  };
'@

# Define the new function with comprehensive logging and fallbacks
$newFunction = @'
  /**
   * Load official boundary as starting point
   */
  const loadOfficialBoundary = () => {
    console.log('🆕 [BOUNDARY EDITOR] Loading official boundary for editing');
    console.log('📊 [BOUNDARY EDITOR] Channel data:', {
      hasChannel: !!channel,
      channelId: channel?.id,
      candidateCount: channel?.candidates?.length,
      candidates: channel?.candidates?.map(c => ({
        id: c.id,
        name: c.name,
        isOfficial: c.isOfficial,
        isDefault: c.isDefault,
        hasLocation: !!c.location,
        hasGeometry: !!c.location?.geometry,
        geometryType: c.location?.geometry?.type,
        coordinateCount: c.location?.geometry?.coordinates?.[0]?.length
      }))
    });
    
    // Find official boundary candidate
    const officialCandidate = channel?.candidates?.find(c => c.isOfficial || c.isDefault);
    
    if (officialCandidate) {
      console.log('✅ [BOUNDARY EDITOR] Found official candidate:', {
        id: officialCandidate.id,
        name: officialCandidate.name,
        hasLocation: !!officialCandidate.location,
        hasGeometry: !!officialCandidate.location?.geometry,
        geometryType: officialCandidate.location?.geometry?.type,
        coordinateCount: officialCandidate.location?.geometry?.coordinates?.[0]?.length
      });
      loadProposal(officialCandidate);
    } else {
      console.warn('⚠️ No official boundary candidate in channel');
      
      // FALLBACK: Try to extract from existing boundary entity on globe
      if (cesiumViewer && regionCode && Cesium) {
        console.log('🔄 [BOUNDARY EDITOR] Attempting fallback: Extract from globe entity...');
        try {
          // Try multiple possible entity IDs
          const entityIds = [
            `boundary-${regionCode}`,
            `region-${regionCode}`,
            `${regionCode}`,
            `${regionCode.toLowerCase()}`,
            `country-${regionCode}`
          ];
          
          let boundaryEntity = null;
          for (const entityId of entityIds) {
            boundaryEntity = cesiumViewer.entities.getById(entityId);
            if (boundaryEntity) {
              console.log(`✅ [BOUNDARY EDITOR] Found entity with ID: ${entityId}`);
              break;
            }
          }
          
          if (boundaryEntity?.polygon?.hierarchy) {
            console.log('✅ [BOUNDARY EDITOR] Found boundary entity on globe!');
            
            // Extract coordinates from Cesium entity
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
              
              console.log('✅ [BOUNDARY EDITOR] Extracted vertices from globe entity:', coords.length);
              
              // Set as original geometry
              setOriginalGeometry({
                type: 'Polygon',
                coordinates: [coords]
              });
              
              loadVertices(coords);
              return;
            }
          } else {
            console.warn('⚠️ [BOUNDARY EDITOR] Searched entity IDs:', entityIds, 'but found no boundary entity');
          }
        } catch (error) {
          console.error('❌ [BOUNDARY EDITOR] Error extracting from globe entity:', error);
        }
      }
      
      console.warn('⚠️ All fallback attempts failed - starting with empty polygon');
      console.warn('💡 [BOUNDARY EDITOR] TIP: Make sure the region is rendered on the globe before opening the editor');
      setMode('add');
    }
  };
'@

# Replace the function
$newContent = $content -replace [regex]::Escape($oldFunction), $newFunction

# Write back to file
$newContent | Set-Content $filePath -Encoding UTF8 -NoNewline

Write-Host "✅ Successfully updated GlobeBoundaryEditor.jsx" -ForegroundColor Green
Write-Host "📋 Changes made:" -ForegroundColor Cyan
Write-Host "  - Added comprehensive logging to loadOfficialBoundary()" -ForegroundColor Yellow
Write-Host "  - Added fallback to extract geometry from existing globe entities" -ForegroundColor Yellow
Write-Host "  - Added multiple entity ID search patterns" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔍 Next steps:" -ForegroundColor Cyan
Write-Host "  1. Reload the frontend" -ForegroundColor White
Write-Host "  2. Select a country (e.g., India)" -ForegroundColor White
Write-Host "  3. Open boundary editor" -ForegroundColor White
Write-Host "  4. Check console for detailed logs" -ForegroundColor White
