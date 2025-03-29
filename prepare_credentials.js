/**
 * This script helps prepare your credentials.json for GitHub repository secrets
 * Run it after setting up your service account in Google Cloud Console
 */

const fs = require('fs');
const path = require('path');

// Load .env file if it exists
try {
  if (fs.existsSync(path.join(__dirname, '.env'))) {
    require('dotenv').config();
  }
} catch (error) {
  console.log('No .env file found');
}

try {
  // Check if credentials file exists
  const credentialsPath = path.join(__dirname, 'credentials.json');
  if (!fs.existsSync(credentialsPath)) {
    console.error('credentials.json file not found!');
    console.log('Please place your Google service account credentials file in this directory');
    process.exit(1);
  }

  // Read the credentials file
  const credentials = fs.readFileSync(credentialsPath, 'utf8');
  
  // Format credentials for GitHub secrets
  console.log('\n--------- FOR GITHUB REPOSITORY SECRETS ---------');
  console.log('\nGOOGLE_CREDENTIALS:');
  console.log(credentials.replace(/\n/g, '\\n'));
  
  // Get spreadsheet info from .env or prompt
  const spreadsheetId = process.env.SPREADSHEET_ID || '155hdcqgwLD7L0-94FSMUJH5UNKVQr_ynB6b_1JMCHrs';
  const sheetName = process.env.SHEET_NAME || 'Normalized';
  
  console.log('\nSPREADSHEET_ID:');
  console.log(spreadsheetId);
  
  console.log('\nSHEET_NAME:');
  console.log(sheetName);
  
  console.log('\n---------------------------------------------');
  console.log('\nCopy these values into your GitHub repository secrets');
  console.log('Go to: Settings > Secrets and variables > Actions > New repository secret');
  
} catch (error) {
  console.error('Error preparing credentials:', error.message);
} 