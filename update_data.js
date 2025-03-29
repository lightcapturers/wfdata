const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file if present
try {
  if (fs.existsSync(path.join(__dirname, '.env'))) {
    require('dotenv').config();
  }
} catch (error) {
  console.log('No .env file found, using default configuration');
}

// Configuration (can be overridden by environment variables)
const SPREADSHEET_ID = process.env.SPREADSHEET_ID || 'YOUR_SPREADSHEET_ID';
const SHEET_NAME = process.env.SHEET_NAME || 'YOUR_SHEET_NAME';
const OUTPUT_FILE = process.env.OUTPUT_FILE ? 
  path.join(__dirname, process.env.OUTPUT_FILE) : 
  path.join(__dirname, 'sample_data.js');

// Path to your service account credentials
const CREDENTIALS_PATH = process.env.CREDENTIALS_PATH || 
  path.join(__dirname, 'credentials.json');

// Function to authenticate with Google Sheets API
async function authenticate() {
  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const client = await auth.getClient();
  return google.sheets({ version: 'v4', auth: client });
}

// Function to fetch data from Google Sheets
async function fetchSheetData(sheets) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: SHEET_NAME,
    });
    
    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.error('No data found in the Google Sheet');
      return [];
    }
    
    // Get headers from the first row
    const headers = rows[0];
    
    // Convert the data to JSON objects
    return rows.slice(1).map((row, index) => {
      const item = {};
      headers.forEach((header, idx) => {
        if (idx < row.length) {
          item[header.trim()] = row[idx] || '';
        } else {
          item[header.trim()] = '';
        }
      });
      
      return item;
    });
  } catch (error) {
    console.error('Error fetching data from Google Sheets:', error.message);
    return [];
  }
}

// Function to map the data to the dashboard format, matching the original data_processor.js
function mapDataForDashboard(csvData) {
  return csvData.map((item, index) => {
    // Parse price from various formats
    let price = 0;
    if (item.Price) {
      const priceStr = item.Price.toString().trim();
      // Remove currency symbols and commas
      const cleanPrice = priceStr.replace(/[$,"]/g, '');
      price = parseFloat(cleanPrice) || 0;
    }
    
    // Get bolt pattern from the dedicated column or extract from ID
    let boltPattern = '';
    if (item['Bolt Pattern']) {
      boltPattern = item['Bolt Pattern'].trim();
    } else if (item.ID && item.ID.includes('x')) {
      // Try to extract bolt pattern from ID
      const parts = item.ID.split('x');
      if (parts.length > 1) {
        const bpMatch = parts[1].match(/[456]\d*x\d+(\.\d+)?/);
        if (bpMatch) {
          boltPattern = bpMatch[0];
        }
      }
    }
    
    // Adjust these mappings based on your CSV column names
    return {
      id: index + 1,
      date: item.Date || '',
      channel: item.Channel || '',
      vendor: item.Vendor || '',
      wheel: item.Wheel || '',
      size: item.Size || '',
      boltPattern: boltPattern,
      finish: item.Finish || '',
      quantity: 1, // Always set quantity to 1 as requested
      price: price,
      sku: item.SKU || item.ID || `SKU-${index + 1}`,
      productTitle: item.ID || '' // Add the ID as productTitle
    };
  });
}

// Function to save data as JavaScript
function saveAsJavaScript(data) {
  try {
    // Format exactly like the original data_processor.js
    const jsContent = 'const sampleData = ' + JSON.stringify(data, null, 2) + ';';
    
    fs.writeFileSync(OUTPUT_FILE, jsContent);
    console.log(`Data successfully saved to ${OUTPUT_FILE}`);
  } catch (error) {
    console.error('Error saving file:', error.message);
  }
}

// Main function
async function updateData() {
  try {
    console.log('Fetching data from Google Sheets...');
    console.log(`Using spreadsheet: ${SPREADSHEET_ID}`);
    console.log(`Sheet name: ${SHEET_NAME}`);
    console.log(`Output file: ${OUTPUT_FILE}`);
    
    const sheets = await authenticate();
    const rawData = await fetchSheetData(sheets);
    
    if (rawData.length > 0) {
      console.log(`Fetched ${rawData.length} records from Google Sheets`);
      
      // Process data using the same mapping function as in the original script
      const processedData = mapDataForDashboard(rawData);
      
      // Save as JavaScript file with the same format
      saveAsJavaScript(processedData);
    } else {
      console.log('No data to save');
    }
  } catch (error) {
    console.error('Error updating data:', error.message);
  }
}

// Run the update
updateData(); 