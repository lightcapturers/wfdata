const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const cors = require('cors');

// Create Express app
const app = express();
const port = 3000;

// Enable CORS for all routes
app.use(cors());

// Serve static files
app.use(express.static(path.join(__dirname)));

// API endpoint to trigger update
app.get('/api/update-data', (req, res) => {
  console.log('Update triggered via API');
  
  // Run the update_data.js script
  exec('node update_data.js', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing update_data.js: ${error.message}`);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to update data',
        error: error.message
      });
    }
    
    if (stderr) {
      console.error(`Error output: ${stderr}`);
    }
    
    console.log(`Update output: ${stdout}`);
    
    return res.json({ 
      success: true, 
      message: 'Data updated successfully',
      details: stdout
    });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Update API server running at http://localhost:${port}`);
});

// Export the app for potential testing
module.exports = app; 