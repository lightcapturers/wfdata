# Wheel Sales Dashboard

A comprehensive dashboard for analyzing wheel sales data with interactive filters and visualizations.

## Features

- **Dynamic Filtering System**: Filter data by channel, vendor, wheel model, size, bolt pattern, finish, and date range
- **Interactive Search**: Quickly find specific products or vendors
- **Real-time Metrics**: Total sales, total orders, average price, and unique products
- **Multiple Chart Views**:
  - Sales over time (daily, weekly, monthly)
  - Sales by product category (wheel, vendor, size, bolt pattern, finish)
  - Sales distribution by channel (pie chart)
- **Order Forecasting**: Projected orders for next 30, 90, 180 days and 1 year
- **Responsive Design**: Works well on different screen sizes
- **Dark Theme**: Modern dark-themed UI for comfortable viewing

## Quick Start Guide

1. **Open the Dashboard**: Open `index.html` in any modern web browser.

2. **Apply Filters**:
   - Use the date range pickers to select a specific time period
   - Filter by channel, vendor, wheel model, size, bolt pattern, or finish
   - Use the search box to find specific items quickly
   - Click "Apply Filters" to update the dashboard
   - Click "Reset Filters" to clear all filters

3. **View Different Chart Options**:
   - On the "Sales Over Time" chart, toggle between daily, weekly, or monthly views
   - On the "Sales by Product" chart, switch between different product attributes (wheel, vendor, size, etc.)

4. **Interpret Forecasts**:
   - View projected order quantities for different time periods at the bottom of the dashboard
   - These forecasts are based on the current filtered data set

## Technical Implementation

### Architecture Overview

The dashboard is built with a modular client-side architecture:

- **HTML (`index.html`)**: Contains the structure and layout of the dashboard
- **CSS (`dashboard.css`)**: Handles styling and responsive design
- **JavaScript (`dashboard.js`)**: Core functionality and data processing
- **Data (`sample_data.js`)**: Contains the sales data to be visualized
- **Data Utilities (`data_processor.js`)**: Helper functions for data conversion

### Data Model

Each row in the data represents a single order with the following structure:

```js
{
  id: 1,                      // Unique identifier
  date: "2023-01-05",         // Order date (YYYY-MM-DD)
  channel: "Shopify",         // Sales channel (Shopify, eBay)
  vendor: "BBS",              // Manufacturer/brand
  wheel: "CH-R",              // Wheel model
  size: "18x8.5",             // Wheel size
  boltPattern: "5x112",       // Bolt pattern
  finish: "Satin Black",      // Wheel finish/color
  quantity: 1,                // Always 1 (each row is one order)
  price: 799.99,              // Price in USD
  sku: "BBS-CHR-18-5x112-BLK" // Product identifier
}
```

### Initialization Process

1. `document.addEventListener('DOMContentLoaded', function() { initializeDashboard(); });` - Initializes the dashboard when the page loads
2. `initializeDashboard()` - Sets up the initial state:
   - Clones the initial data into `filteredData`
   - Initializes date pickers to default values (last 30 days)
   - Populates filter dropdowns with values from the data
   - Updates the dashboard with the initial data
   - Sets up event listeners for user interactions

### Data Processing

#### Filtering Mechanism

The filtering system is implemented in the `updateDashboard()` function:

1. Retrieves current filter values from the UI
2. Applies multiple filter conditions (date range, channel, vendor, wheel, size, bolt pattern, finish)
3. Applies search filter across multiple fields (if search term is present)
4. Stores filtered results in the `filteredData` variable
5. Triggers updates to metrics, charts, and forecasts

```js
// Date range filtering:
const itemDate = new Date(item.date);
const start = startDate ? new Date(startDate) : null;
const end = endDate ? new Date(endDate) : null;

if (start && itemDate < start) return false;
if (end) {
  const endDateAdjusted = new Date(end);
  endDateAdjusted.setDate(endDateAdjusted.getDate() + 1); // Include the end date
  if (itemDate >= endDateAdjusted) return false;
}
```

#### Dynamic Dependent Filters

The dashboard implements dependent filters, where selecting one filter affects the available options in other filters:

1. `updateDependentFilters(filterType, filterValue)` - Updates related filters when a filter value changes
2. This ensures users only see filter options that will return results

### Metrics Calculation

#### Total Sales

```js
const totalSales = filteredData.reduce((sum, item) => sum + item.price, 0);
```

#### Total Orders

Since each row represents one order, the total orders is simply:

```js
const totalOrders = filteredData.length;
```

#### Average Price

```js
const avgPrice = totalOrders > 0 ? totalSales / totalOrders : 0;
```

#### Unique Products

```js
const uniqueProducts = new Set(filteredData.map(item => item.sku)).size;
```

#### Metric Change Indicators

The dashboard calculates changes by splitting the filtered data into two time periods:

1. Sorts the data by date
2. Finds the midpoint in time
3. Compares metrics between first and second half
4. Calculates percentage changes
5. Updates UI with appropriate indicators and colors

```js
// Calculate percentage changes
const salesChange = firstPeriodSales > 0 ? ((secondPeriodSales - firstPeriodSales) / firstPeriodSales * 100) : 0;
```

### Visualization Components

#### Sales Over Time Chart

Implemented as an area chart with multiple view options:

1. **Daily**: Displays data by individual dates
2. **Weekly**: Groups data by ISO week numbers
3. **Monthly**: Groups data by months

The chart shows both sales amount and order counts on separate Y-axes.

Key implementation details:
- Uses `ApexCharts.js` for rendering
- Data is grouped by time period using the `salesByDate` object
- Supports dynamic updates when filters change

#### Products Chart

Implemented as a bar chart showing sales and orders by selected category:

1. Groups data by the selected category (wheel, vendor, size, bolt pattern, or finish)
2. Displays both sales amount and order counts
3. Dynamically updates when the category or filters change

#### Channel Pie Chart

Shows the distribution of sales between different channels:

1. Groups sales data by channel
2. Calculates the percentage of each channel's contribution to total sales
3. Displays properly calculated percentages that sum to 100%

```js
// Calculate correct percentage
const total = w.config.series.reduce((a, b) => a + b, 0);
const percent = (w.config.series[seriesIndex] / total * 100).toFixed(1);
```

### Forecasting Algorithm

The forecasting system uses a simple daily rate model:

1. Count unique dates in the filtered data
2. Calculate the daily order rate: `totalOrders / uniqueDates`
3. Project forward by multiplying daily rate by forecast periods (30, 90, 180, 365 days)
4. Round the results to whole numbers

```js
// Calculate daily order rate
const uniqueDates = new Set(filteredData.map(item => item.date)).size;
const totalOrders = filteredData.length;
const dailyOrderRate = uniqueDates > 0 ? totalOrders / uniqueDates : 0;

// Calculate forecasts for different time periods
const forecast30Days = Math.round(dailyOrderRate * 30);
```

### Search Functionality

The search functionality works across multiple fields:

1. Checks if search term is present in channel, vendor, wheel, size, bolt pattern, finish, or SKU
2. Uses case-insensitive string matching
3. Debounces search input to prevent excessive updates

### CSV Data Processing

The `data_processor.js` utility handles converting CSV files to the dashboard's required format:

1. `csvToJson(csv)` - Parses CSV text into JSON objects
2. `mapDataForDashboard(csvData)` - Maps CSV columns to dashboard data structure
3. `processCsvFile(csvContent)` - Orchestrates the full conversion process

Critical mappings:
- Quantity is always set to 1 (each row represents one order)
- Price cleaning: `priceStr.replace(/[$,]/g, '')` removes currency symbols and commas

### UI/UX Implementation

#### Loading State

The dashboard includes a loading overlay to indicate when processing is happening:

```js
function showLoading() {
  document.getElementById('loadingOverlay').classList.add('active');
}

function hideLoading() {
  document.getElementById('loadingOverlay').classList.remove('active');
}
```

#### Responsive Design

CSS media queries ensure the dashboard works well on different screen sizes:

```css
@media screen and (max-width: 768px) {
  .filter-group, .metric-card, .chart-card {
    min-width: 100%;
  }
}
```

## Using Your Own Data

### Data Format

Each row in the data represents a single order with a quantity of 1. The dashboard is designed to count orders rather than individual items, so all quantity values are set to 1 automatically.

### Option 1: Edit the sample_data.js file directly

1. Open `sample_data.js` in a text editor
2. Replace the sample data with your actual sales data
3. Make sure your data follows the same structure

### Option 2: Using the Data Processor (Browser)

1. Open the dashboard (`index.html`) in your browser
2. Open the browser console (F12 or Right-click > Inspect > Console)
3. Copy and paste the entire content of `data_processor.js` into the console
4. Run `readCsvFileInBrowser()` in the console
5. Select your CSV file in the file dialog
6. The processor will generate a `sample_data.js` file and download it automatically
7. Replace the existing `sample_data.js` with the downloaded file
8. Refresh the dashboard to see your data

### Option 3: Using the Data Processor (Node.js)

1. Uncomment the Node.js section in `data_processor.js`
2. Run `node data_processor.js` in your terminal
3. The script will process your CSV file and create/update `sample_data.js`
4. Refresh the dashboard to see your data

### CSV Format Requirements

Your CSV file should include these columns (column names are case-insensitive and can have variations):
- `date` or `Date` or `sale_date` - The sale date (YYYY-MM-DD format)
- `channel` or `Channel` or `platform` - The sales channel
- `vendor` or `Vendor` or `brand` - The wheel manufacturer/brand
- `wheel` or `Wheel` or `model` or `product_name` - The wheel model
- `size` or `Size` - The wheel size
- `bolt_pattern` or `boltPattern` or `BoltPattern` - The bolt pattern
- `finish` or `Finish` or `color` - The wheel finish/color
- `price` or `Price` - Sale price per order

Note that `quantity` is not needed since each row represents a single order (quantity=1).

## Modifying the Dashboard

### Adding New Filters

To add a new filter:

1. Add a new filter input in the HTML:
   ```html
   <div class="filter-group">
     <label for="newFilter" class="filter-label">New Filter</label>
     <select id="newFilter" class="filter-select">
       <option value="">All</option>
     </select>
   </div>
   ```

2. Initialize the filter in the `initializeFilters()` function:
   ```js
   const newFilterValues = [...new Set(sampleData.map(item => item.newFilterProperty))];
   populateFilterDropdown('newFilter', newFilterValues);
   ```

3. Add the filter to the filtering logic in `updateDashboard()`:
   ```js
   const newFilterValue = document.getElementById('newFilter').value;
   if (newFilterValue && item.newFilterProperty !== newFilterValue) return false;
   ```

### Adding New Charts

To add a new chart:

1. Add a new chart container in the HTML:
   ```html
   <div class="chart-card">
     <div class="chart-header">
       <div class="chart-title">New Chart</div>
     </div>
     <div id="newChart" class="chart-container"></div>
   </div>
   ```

2. Create a function to update the chart:
   ```js
   function updateNewChart() {
     const newChartContainer = document.getElementById('newChart');
     // Process data and create chart
   }
   ```

3. Add the chart update to the `updateCharts()` function:
   ```js
   function updateCharts() {
     updateSalesChart('daily');
     updateProductsChart('wheel');
     updateChannelChart();
     updateNewChart(); // Add the new chart
   }
   ```

### Modifying Forecast Calculations

To change how forecasts are calculated:

1. Modify the `updateForecasts()` function in `dashboard.js`:
   ```js
   function updateForecasts() {
     // Your custom forecast logic here
     // Example: Using weighted average or more complex algorithm
   }
   ```

## Browser Compatibility

This dashboard works best on modern browsers:
- Chrome (recommended)
- Firefox
- Safari
- Edge

## Technical Dependencies

- **ApexCharts.js**: For chart visualization
- **Font Awesome**: For icons and UI elements

# Dashboard Data Update Tool

This tool automatically fetches data from Google Sheets and updates the dashboard's JSON data file.

## GitHub Pages Setup

This dashboard is designed to work with GitHub Pages, with automatic data updates via GitHub Actions.

### Automatic Updates

The dashboard data is automatically updated from Google Sheets via a GitHub Actions workflow:

- Updates run every 6 hours automatically
- You can trigger a manual update through the GitHub Actions page
- Click the "Update Data" button in the dashboard to go to the GitHub Actions page

### How It Works

1. The GitHub Action workflow:
   - Connects to Google Sheets using stored credentials
   - Fetches the latest data
   - Updates sample_data.js in the repository
   - Commits and pushes the changes

2. GitHub Pages serves the updated static files
3. When users access the dashboard, they see the latest data

## Setup

1. Store these secrets in your GitHub repository:
   - `GOOGLE_CREDENTIALS`: Your Google Sheets service account credentials (entire JSON file contents)
   - `SPREADSHEET_ID`: Your Google Sheet ID
   - `SHEET_NAME`: Your sheet name

2. Enable GitHub Pages for your repository
3. Make sure the GitHub Actions workflow has write permissions to your repository

## Local Development

1. Install dependencies:
```
npm install
```

2. Place your Google Sheets API service account credentials in a file named `credentials.json` in the same directory.

3. Configure the tool using environment variables:
   - Copy `.env.example` to `.env`
   - Update the values in the `.env` file

4. Run the update script locally:
```
npm run update
```

## Notes

- Make sure your Google Sheet has the same column headers as your current JSON data
- The service account must have access to the Google Sheet
- The first row of the sheet should contain headers that match your JSON property names
- The script will generate `productTitle` if that column doesn't exist in your sheet 