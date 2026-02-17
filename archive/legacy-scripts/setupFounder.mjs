require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline');
const crypto = require('crypto');
const inviteService = require('../backend/services/inviteService');

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Generate a random public key for testing
function generateTestPublicKey() {
  return crypto.randomBytes(32).toString('hex');
}

// Connect to database
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to database');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
}

// Set up founder account
async function setupFounder() {
  try {
    await connectDB();
    
    console.log('=== Relay System Founder Setup ===');
    console.log('This script will create the system founder account.');
    console.log('The founder has unlimited invite tokens and can assign custom token counts.');
    
    rl.question('Enter founder public key (or press Enter to generate a test key): ', async (inputKey) => {
      const founderPublicKey = inputKey.trim() || generateTestPublicKey();
      
      try {
        const result = await inviteService.createFounderAccount(founderPublicKey);
        
        console.log('\n✅ Founder account created successfully!');
        console.log(`Public Key: ${result.founder.publicKey}`);
        console.log(`Is Founder: ${result.founder.isFounder}`);
        console.log(`Invite Tokens: Unlimited`);
        
        if (!inputKey.trim()) {
          console.log('\n⚠️ IMPORTANT: This is a test public key. In production, use a real key pair.');
          console.log(`Test Public Key: ${founderPublicKey}`);
        }
        
        console.log('\nYou can now use this account to start the invite tree and build your community.');
        
        // Close connection and exit
        mongoose.connection.close();
        rl.close();
      } catch (error) {
        console.error('Error creating founder account:', error.message);
        rl.close();
      }
    });
  } catch (error) {
    console.error('Setup error:', error);
    rl.close();
  }
}

// Run the setup
setupFounder();