// Simple verification script that will log results
console.log('Starting vote endpoint verification...');

// Test function 
const testVote = async () => {
  const testUrl = 'http://localhost:3002/api/vote';
  const testData = {
    id: 'verification-candidate-1',
    value: 'support'
  };

  try {
    console.log('Sending POST request to:', testUrl);
    console.log('Request data:', JSON.stringify(testData, null, 2));
    
    // Use native fetch if available, otherwise try node-fetch
    let fetch;
    if (typeof globalThis.fetch !== 'undefined') {
      fetch = globalThis.fetch;
    } else {
      fetch = (await import('node-fetch')).default;
    }
    
    const response = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    if (response.ok) {
      console.log('✅ Vote submission SUCCESSFUL!');
      
      // Check blockchain state
      console.log('\nChecking blockchain summary...');
      const summaryResponse = await fetch('http://localhost:3002/api/vote/debug/blockchain-summary');
      const summaryData = await summaryResponse.json();
      console.log('Updated blockchain summary:', JSON.stringify(summaryData, null, 2));
      
    } else {
      console.log('❌ Vote submission FAILED');
    }
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
  }
};

testVote().then(() => {
  console.log('Verification complete');
}).catch(error => {
  console.error('Verification failed:', error);
});
