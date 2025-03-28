/**
 * Data Processor Utility
 * 
 * This script helps convert CSV data to the JSON format required by the dashboard.
 * Run this in the browser console or in a separate Node.js environment to process your data.
 */

/**
 * Convert CSV string to JSON array
 * @param {string} csv - CSV string with header row
 * @returns {Array} - Array of objects
 */
function csvToJson(csv) {
  // Split the CSV by lines
  const lines = csv.split('\n');
  
  // Extract the header row
  const headers = lines[0].split(',').map(header => header.trim());
  
  // Process each line
  const result = [];
  
  for (let i = 1; i < lines.length; i++) {
    // Skip empty lines
    if (lines[i].trim() === '') continue;
    
    // Handle quoted fields that may contain commas
    const currentLine = [];
    let field = '';
    let inQuotes = false;
    
    for (let char of lines[i]) {
      if (char === '"' && field === '') {
        inQuotes = true;
      } else if (char === '"' && inQuotes) {
        inQuotes = false;
      } else if (char === ',' && !inQuotes) {
        currentLine.push(field);
        field = '';
      } else {
        field += char;
      }
    }
    
    // Add the last field
    currentLine.push(field);
    
    // Skip if line doesn't have enough fields
    if (currentLine.length < headers.length) continue;
    
    const obj = {};
    
    // Create object with header keys
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = currentLine[j] ? currentLine[j].trim() : '';
    }
    
    result.push(obj);
  }
  
  return result;
}

/**
 * Map CSV data to the format expected by the dashboard
 * @param {Array} csvData - Array of objects from CSV
 * @returns {Array} - Formatted data for dashboard
 */
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
      sku: item.SKU || item.ID || `SKU-${index + 1}`
    };
  });
}

/**
 * Process a CSV file and convert it to the dashboard data format
 * @param {string} csvContent - Raw CSV content
 * @returns {Array} - Formatted data ready for the dashboard
 */
function processCsvFile(csvContent) {
  // Convert CSV to JSON
  const jsonData = csvToJson(csvContent);
  
  // Map to dashboard format
  const dashboardData = mapDataForDashboard(jsonData);
  
  // Return formatted data
  return dashboardData;
}

/**
 * Use this function in the browser to read a CSV file
 * and generate the dashboard data
 */
function readCsvFileInBrowser() {
  // Create file input element
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.csv';
  
  fileInput.onchange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const csvContent = e.target.result;
      const processedData = processCsvFile(csvContent);
      
      // Output to console for copy-paste
      console.log('Processed Data:');
      console.log('const sampleData =', JSON.stringify(processedData, null, 2), ';');
      
      // Create download link
      const dataStr = 'data:text/javascript;charset=utf-8,' + encodeURIComponent('const sampleData = ' + JSON.stringify(processedData, null, 2) + ';');
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', 'sample_data.js');
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    };
    reader.readAsText(file);
  };
  
  // Trigger file selection
  fileInput.click();
}

/**
 * Node.js version for processing CSV files
 */
const fs = require('fs');

function processCsvFileNode(filePath) {
  // Read CSV file
  const csvContent = fs.readFileSync(filePath, 'utf8');
  
  // Process the CSV
  const dashboardData = processCsvFile(csvContent);
  
  // Write to file
  fs.writeFileSync(
    'sample_data.js',
    'const sampleData = ' + JSON.stringify(dashboardData, null, 2) + ';',
    'utf8'
  );
  
  console.log('Data successfully processed and saved to sample_data.js');
}

// Process the sales_data.csv file
processCsvFileNode('sales_data.csv');

// Browser usage:
// Call readCsvFileInBrowser() in the browser console to process a CSV file 