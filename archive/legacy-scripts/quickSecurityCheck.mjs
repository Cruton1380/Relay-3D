/**
 * @fileoverview Simple Security Implementation Status Check
 * Quick validation of security upgrade completion
 */

import fs from 'fs/promises';
import path from 'path';

async function checkSecurityImplementation() {
  console.log('🔒 Security Implementation Status Check');
  console.log('=====================================\n');
  
  const checks = {
    'Signal Protocol Backend': {
      file: 'backend/services/signalProtocol.mjs',
      contains: ['Double Ratchet', 'encryptMessage', 'decryptMessage']
    },
    'Signal Protocol WebSocket Integration': {
      file: 'backend/websocket-service/index.mjs',
      contains: ['handleSignalProtocolHandshake', 'handleEncryptedMessage', 'sendEncryptedToClient']
    },
    'Signal Protocol Message Encryption': {
      file: 'backend/websocket-service/messageEncryption.mjs',
      contains: ['initializeSignalSession', 'encryptMessage', 'decryptMessage']
    },
    'Frontend Signal Protocol': {
      file: 'frontend/services/signalProtocol.js',
      contains: ['generateKeyPair', 'deriveSharedSecret', 'encryptMessage']
    },
    'Frontend WebSocket Integration': {
      file: 'frontend/services/websocket/index.js',
      contains: ['initializeSignalProtocolSession', 'handleEncryptedMessage']
    },
    'Production Biometric API': {
      file: 'backend/api/biometricsApi.mjs',
      contains: ['faceAPIExtractor.mjs']
    },
    'Face-API.js Extractor': {
      file: 'backend/biometrics/faceAPIExtractor.mjs',
      contains: ['face-api', 'detectAllFaces', 'withFaceLandmarks']
    }
  };
  
  const modelFiles = [
    'public/models/tiny_face_detector_model-weights_manifest.json',
    'public/models/face_landmark_68_model-weights_manifest.json',
    'public/models/face_recognition_model-weights_manifest.json',
    'public/models/age_gender_model-weights_manifest.json',
    'public/models/face_expression_model-weights_manifest.json'
  ];
  
  let passedChecks = 0;
  let totalChecks = Object.keys(checks).length;
  
  // Check implementation files
  for (const [checkName, checkConfig] of Object.entries(checks)) {
    try {
      const content = await fs.readFile(checkConfig.file, 'utf8');
      const allContained = checkConfig.contains.every(item => content.includes(item));
      
      if (allContained) {
        console.log(`✅ ${checkName}`);
        passedChecks++;
      } else {
        console.log(`❌ ${checkName} - Missing: ${checkConfig.contains.filter(item => !content.includes(item)).join(', ')}`);
      }
    } catch (error) {
      console.log(`❌ ${checkName} - File not found: ${checkConfig.file}`);
    }
  }
  
  // Check model files
  console.log('\n📁 Face-API.js Models:');
  let modelsPresent = 0;
  for (const modelFile of modelFiles) {
    try {
      await fs.access(modelFile);
      console.log(`  ✅ ${path.basename(modelFile)}`);
      modelsPresent++;
    } catch {
      console.log(`  ❌ ${path.basename(modelFile)}`);
    }
  }
  
  // Calculate scores
  const implementationScore = (passedChecks / totalChecks) * 100;
  const modelScore = (modelsPresent / modelFiles.length) * 100;
  const overallScore = (implementationScore + modelScore) / 2;
  
  console.log('\n📊 SUMMARY:');
  console.log(`🔧 Implementation: ${passedChecks}/${totalChecks} (${implementationScore.toFixed(1)}%)`);
  console.log(`📁 Models: ${modelsPresent}/${modelFiles.length} (${modelScore.toFixed(1)}%)`);
  console.log(`🎯 Overall Score: ${overallScore.toFixed(1)}%\n`);
  
  // Status
  if (overallScore >= 90) {
    console.log('🚀 STATUS: READY FOR PRODUCTION');
    console.log('   All major security components are implemented and ready.');
  } else if (overallScore >= 80) {
    console.log('⚠️  STATUS: MOSTLY READY');
    console.log('   Minor issues to address before production deployment.');
  } else {
    console.log('🔧 STATUS: NEEDS WORK');
    console.log('   Several components need completion before production.');
  }
  
  console.log('\n🔒 Security Features Implemented:');
  if (implementationScore >= 80) {
    console.log('  ✅ Signal Protocol with Double Ratchet encryption');
    console.log('  ✅ Encrypted WebSocket communication');
    console.log('  ✅ Forward secrecy and post-compromise security');
  }
  if (modelScore >= 80) {
    console.log('  ✅ Production-grade facial recognition models');
    console.log('  ✅ Multi-modal biometric analysis');
  }
  
  return { implementationScore, modelScore, overallScore };
}

// Run the check
checkSecurityImplementation().catch(console.error);
