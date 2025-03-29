// Dashboard.js - Main Dashboard Functionality

// Initialize variables for storing filtered data and charts
let filteredData = [];
let salesChart = null;
let productsChart = null;
let channelChart = null;
let forecastData = {};

// Dashboard initialization
document.addEventListener('DOMContentLoaded', function() {
  initializeDashboard();
  updateLastUpdatedTime();
});

// Initialize the dashboard
function initializeDashboard() {
  // Clone the initial data
  filteredData = [...sampleData];
  
  // Add productTitle field to data if it doesn't exist (for backward compatibility)
  sampleData.forEach(item => {
    if (!item.hasOwnProperty('productTitle')) {
      item.productTitle = `${item.wheel}${item.size}${item.boltPattern}${item.finish}`;
    }
  });
  
  // Initialize date pickers with sensible defaults
  const today = new Date();
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(today.getMonth() - 1);
  
  document.getElementById('startDate').valueAsDate = oneMonthAgo;
  document.getElementById('endDate').valueAsDate = today;
  
  // Initialize filter dropdowns
  initializeFilters();
  
  // Apply initial data processing
  updateDashboard();
  
  // Set up event listeners
  setupEventListeners();
}

// Update the last updated time display
function updateLastUpdatedTime() {
  const lastUpdatedElement = document.getElementById('lastUpdated');
  if (lastUpdatedElement) {
    // Get the last modified time of the script
    const scriptElem = document.querySelector('script[src*="sample_data.js"]');
    if (scriptElem) {
      // For GitHub Pages, we can use the updated timestamp from repository
      fetch(scriptElem.src, { method: 'HEAD' })
        .then(response => {
          const lastModified = response.headers.get('last-modified');
          if (lastModified) {
            const date = new Date(lastModified);
            lastUpdatedElement.textContent = `Last updated: ${date.toLocaleString()}`;
          } else {
            lastUpdatedElement.textContent = `Last updated: Unknown`;
          }
        })
        .catch(error => {
          console.error('Error fetching script modification time:', error);
          lastUpdatedElement.textContent = `Last updated: Unknown`;
        });
    } else {
      lastUpdatedElement.textContent = `Last updated: Unknown`;
    }
  }
}

// Initialize filter dropdowns with unique values from data
function initializeFilters() {
  // Channel filter
  const channels = [...new Set(sampleData.map(item => item.channel))];
  populateFilterDropdown('channelFilter', channels);
  
  // Vendor filter
  const vendors = [...new Set(sampleData.map(item => item.vendor))];
  populateFilterDropdown('vendorFilter', vendors);
  
  // Wheel filter
  const wheels = [...new Set(sampleData.map(item => item.wheel))];
  populateFilterDropdown('wheelFilter', wheels);
  
  // Size filter
  const sizes = [...new Set(sampleData.map(item => item.size))];
  populateFilterDropdown('sizeFilter', sizes);
  
  // Bolt pattern filter
  const boltPatterns = [...new Set(sampleData.map(item => item.boltPattern))];
  populateFilterDropdown('boltPatternFilter', boltPatterns);
  
  // Finish filter
  const finishes = [...new Set(sampleData.map(item => item.finish))];
  populateFilterDropdown('finishFilter', finishes);
}

// Populate a dropdown with filter options
function populateFilterDropdown(elementId, options) {
  const dropdown = document.getElementById(elementId);
  
  // Clear existing options
  dropdown.innerHTML = '<option value="">All</option>';
  
  // Add options
  options.forEach(option => {
    const optionElement = document.createElement('option');
    optionElement.value = option;
    optionElement.textContent = option;
    dropdown.appendChild(optionElement);
  });
}

// Set up event listeners for filters and buttons
function setupEventListeners() {
  // Apply filters button
  document.getElementById('applyFilters').addEventListener('click', function() {
    showLoading();
    setTimeout(function() {
      updateDashboard();
      hideLoading();
    }, 500); // Simulate loading time
  });
  
  // Reset filters button
  document.getElementById('resetFilters').addEventListener('click', function() {
    resetFilters();
    showLoading();
    setTimeout(function() {
      updateDashboard();
      hideLoading();
    }, 500); // Simulate loading time
  });
  
  // Refresh data button
  document.getElementById('refreshData').addEventListener('click', function() {
    showLoading();
    setTimeout(function() {
      // Reload data from the current script
      filteredData = [...sampleData];
      
      // Update last updated time
      updateLastUpdatedTime();
      
      // Update dashboard
      updateDashboard();
      hideLoading();
    }, 500);
  });
  
  // Channel filter change - update dependent filters
  document.getElementById('channelFilter').addEventListener('change', function() {
    updateDependentFilters('channel', this.value);
  });
  
  // Vendor filter change - update dependent filters
  document.getElementById('vendorFilter').addEventListener('change', function() {
    updateDependentFilters('vendor', this.value);
  });
  
  // Search input
  document.getElementById('searchInput').addEventListener('input', function() {
    if (this.value.length > 2 || this.value.length === 0) {
      showLoading();
      setTimeout(function() {
        updateDashboard();
        hideLoading();
      }, 500); // Debounce search input
    }
  });
  
  // Chart view options
  document.querySelectorAll('.chart-option').forEach(option => {
    option.addEventListener('click', function() {
      const chartId = this.closest('.chart-card').id;
      const viewType = this.dataset.view;
      
      // Update active class
      this.closest('.chart-options').querySelectorAll('.chart-option').forEach(opt => {
        opt.classList.remove('active');
      });
      this.classList.add('active');
      
      // Update chart based on view type
      if (chartId === 'salesChartCard') {
        updateSalesChart(viewType);
      } else if (chartId === 'productsChartCard') {
        updateProductsChart(viewType);
      }
    });
  });
}

// Update filters based on selected value in a parent filter
function updateDependentFilters(filterType, filterValue) {
  // Skip if 'All' is selected
  if (!filterValue) return;
  
  // Get filtered data based on the selected filter
  const baseData = sampleData.filter(item => item[filterType] === filterValue);
  
  // Update other filters based on available values in the filtered data
  if (filterType !== 'channel') {
    const channels = [...new Set(baseData.map(item => item.channel))];
    updateFilterOptions('channelFilter', channels);
  }
  
  if (filterType !== 'vendor') {
    const vendors = [...new Set(baseData.map(item => item.vendor))];
    updateFilterOptions('vendorFilter', vendors);
  }
  
  if (filterType !== 'wheel') {
    const wheels = [...new Set(baseData.map(item => item.wheel))];
    updateFilterOptions('wheelFilter', wheels);
  }
  
  if (filterType !== 'size') {
    const sizes = [...new Set(baseData.map(item => item.size))];
    updateFilterOptions('sizeFilter', sizes);
  }
  
  if (filterType !== 'boltPattern') {
    const boltPatterns = [...new Set(baseData.map(item => item.boltPattern))];
    updateFilterOptions('boltPatternFilter', boltPatterns);
  }
  
  if (filterType !== 'finish') {
    const finishes = [...new Set(baseData.map(item => item.finish))];
    updateFilterOptions('finishFilter', finishes);
  }
}

// Update options in a filter dropdown
function updateFilterOptions(elementId, options) {
  const dropdown = document.getElementById(elementId);
  const currentValue = dropdown.value;
  
  // Clear existing options
  dropdown.innerHTML = '<option value="">All</option>';
  
  // Add options
  options.forEach(option => {
    const optionElement = document.createElement('option');
    optionElement.value = option;
    optionElement.textContent = option;
    dropdown.appendChild(optionElement);
  });
  
  // Restore selected value if it still exists in the new options
  if (options.includes(currentValue)) {
    dropdown.value = currentValue;
  }
}

// Reset all filters to their default state
function resetFilters() {
  // Reset dropdowns
  document.querySelectorAll('.filter-select').forEach(dropdown => {
    dropdown.value = '';
  });
  
  // Reset date pickers
  const today = new Date();
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(today.getMonth() - 1);
  
  document.getElementById('startDate').valueAsDate = oneMonthAgo;
  document.getElementById('endDate').valueAsDate = today;
  
  // Reset search
  document.getElementById('searchInput').value = '';
  
  // Reinitialize filter dropdowns
  initializeFilters();
}

// Update all charts
function updateCharts() {
  updateSalesChart('daily');
  updateProductsChart('wheel');
  updateChannelChart();
}

// Update top products
function updateTopProducts() {
  const topProductsList = document.getElementById('topProductsList');
  
  // Clear the list
  topProductsList.innerHTML = '';
  
  // Group data by product title
  const productSales = {};
  
  filteredData.forEach(item => {
    const productTitle = item.productTitle;
    
    if (!productTitle) return; // Skip items without product title
    
    if (!productSales[productTitle]) {
      productSales[productTitle] = {
        sales: 0,
        count: 0,
        vendor: item.vendor,
        wheel: item.wheel,
        size: item.size,
        boltPattern: item.boltPattern,
        finish: item.finish,
        channel: item.channel
      };
    }
    
    productSales[productTitle].sales += item.price;
    productSales[productTitle].count += 1;
  });
  
  // Convert to array and sort by sales
  const topProducts = Object.entries(productSales)
    .map(([title, data]) => ({
      title: title,
      sales: data.sales,
      count: data.count,
      vendor: data.vendor,
      wheel: data.wheel,
      size: data.size,
      boltPattern: data.boltPattern,
      finish: data.finish,
      channel: data.channel
    }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 10); // Get top 10
  
  // Create list items
  topProducts.forEach(product => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="product-info">
        <div class="product-title">${product.title}</div>
        <div class="product-details">
          ${product.count} orders | ${product.vendor} | ${product.size}
        </div>
      </div>
      <div class="product-sales">$${product.sales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
    `;
    
    // Add click event to filter dashboard
    li.addEventListener('click', function() {
      // Set filter dropdowns
      document.getElementById('channelFilter').value = product.channel;
      document.getElementById('vendorFilter').value = product.vendor;
      document.getElementById('wheelFilter').value = product.wheel;
      document.getElementById('sizeFilter').value = product.size;
      document.getElementById('boltPatternFilter').value = product.boltPattern;
      document.getElementById('finishFilter').value = product.finish;
      
      // Apply filters
      showLoading();
      setTimeout(function() {
        updateDashboard();
        hideLoading();
      }, 500);
    });
    
    topProductsList.appendChild(li);
  });
  
  // Show "No data" message if no products
  if (topProducts.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'No product data available';
    topProductsList.appendChild(li);
  }
}

// Update top products by orders
function updateTopProductsByOrders() {
  const topProductsList = document.getElementById('topProductsByOrdersList');
  
  // Clear the list
  topProductsList.innerHTML = '';
  
  // Group data by product title
  const productOrders = {};
  
  filteredData.forEach(item => {
    const productTitle = item.productTitle;
    
    if (!productTitle) return; // Skip items without product title
    
    if (!productOrders[productTitle]) {
      productOrders[productTitle] = {
        sales: 0,
        count: 0,
        vendor: item.vendor,
        wheel: item.wheel,
        size: item.size,
        boltPattern: item.boltPattern,
        finish: item.finish,
        channel: item.channel
      };
    }
    
    productOrders[productTitle].sales += item.price;
    productOrders[productTitle].count += 1;
  });
  
  // Convert to array and sort by order count
  const topProducts = Object.entries(productOrders)
    .map(([title, data]) => ({
      title: title,
      sales: data.sales,
      count: data.count,
      vendor: data.vendor,
      wheel: data.wheel,
      size: data.size,
      boltPattern: data.boltPattern,
      finish: data.finish,
      channel: data.channel
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Get top 10
  
  // Create list items
  topProducts.forEach(product => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="product-info">
        <div class="product-title">${product.title}</div>
        <div class="product-details">
          ${product.vendor} | ${product.size}
        </div>
      </div>
      <div class="product-sales">${product.count} orders</div>
    `;
    
    // Add click event to filter dashboard
    li.addEventListener('click', function() {
      // Set filter dropdowns
      document.getElementById('channelFilter').value = product.channel;
      document.getElementById('vendorFilter').value = product.vendor;
      document.getElementById('wheelFilter').value = product.wheel;
      document.getElementById('sizeFilter').value = product.size;
      document.getElementById('boltPatternFilter').value = product.boltPattern;
      document.getElementById('finishFilter').value = product.finish;
      
      // Apply filters
      showLoading();
      setTimeout(function() {
        updateDashboard();
        hideLoading();
      }, 500);
    });
    
    topProductsList.appendChild(li);
  });
  
  // Show "No data" message if no products
  if (topProducts.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'No product data available';
    topProductsList.appendChild(li);
  }
}

// Apply filters and update the dashboard
function updateDashboard() {
  // Get filter values
  const channelFilter = document.getElementById('channelFilter').value;
  const vendorFilter = document.getElementById('vendorFilter').value;
  const wheelFilter = document.getElementById('wheelFilter').value;
  const sizeFilter = document.getElementById('sizeFilter').value;
  const boltPatternFilter = document.getElementById('boltPatternFilter').value;
  const finishFilter = document.getElementById('finishFilter').value;
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  
  // Apply filters
  filteredData = sampleData.filter(item => {
    // Date range filter
    const itemDate = new Date(item.date);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    
    if (start && itemDate < start) return false;
    if (end) {
      const endDateAdjusted = new Date(end);
      endDateAdjusted.setDate(endDateAdjusted.getDate() + 1); // Include the end date
      if (itemDate >= endDateAdjusted) return false;
    }
    
    // Dropdown filters
    if (channelFilter && item.channel !== channelFilter) return false;
    if (vendorFilter && item.vendor !== vendorFilter) return false;
    if (wheelFilter && item.wheel !== wheelFilter) return false;
    if (sizeFilter && item.size !== sizeFilter) return false;
    if (boltPatternFilter && item.boltPattern !== boltPatternFilter) return false;
    if (finishFilter && item.finish !== finishFilter) return false;
    
    // Search filter
    if (searchTerm) {
      const searchFields = [
        item.channel,
        item.vendor,
        item.wheel,
        item.size,
        item.boltPattern,
        item.finish,
        item.sku,
        item.productTitle || '' // Include productTitle in search
      ].map(field => field.toLowerCase());
      
      return searchFields.some(field => field.includes(searchTerm));
    }
    
    return true;
  });
  
  // Update metric cards
  updateMetrics();
  
  // Update charts
  updateCharts();
  
  // Update forecasts
  updateForecasts();
  
  // Update top products
  updateTopProducts();
  
  // Update top products by orders
  updateTopProductsByOrders();
}

// Update metric cards with calculated metrics
function updateMetrics() {
  // Calculate total sales (quantity is always 1, so we sum prices directly)
  const totalSales = filteredData.reduce((sum, item) => sum + item.price, 0);
  document.getElementById('totalSales').textContent = '$' + totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  
  // Calculate total quantity (count of orders since quantity is always 1)
  const totalQuantity = filteredData.length;
  document.getElementById('totalQuantity').textContent = totalQuantity.toLocaleString();
  
  // Calculate average sale price
  const avgPrice = totalQuantity > 0 ? totalSales / totalQuantity : 0;
  document.getElementById('avgPrice').textContent = '$' + avgPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  
  // Calculate number of unique products
  const uniqueProducts = new Set(filteredData.map(item => item.sku)).size;
  document.getElementById('uniqueProducts').textContent = uniqueProducts.toLocaleString();
  
  // Calculate changes (mock data for demonstration)
  // In a real application, you would compare to previous period data
  
  // Sort data by date to separate current and previous periods
  const sortedData = [...filteredData].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  if (sortedData.length > 0) {
    // Find the midpoint of the date range to compare first half vs second half
    const dates = sortedData.map(item => new Date(item.date));
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    const midDate = new Date((minDate + maxDate) / 2);
    
    // Split data into two periods
    const firstPeriod = sortedData.filter(item => new Date(item.date) < midDate);
    const secondPeriod = sortedData.filter(item => new Date(item.date) >= midDate);
    
    // Calculate metrics for both periods
    const firstPeriodSales = firstPeriod.reduce((sum, item) => sum + item.price, 0);
    const secondPeriodSales = secondPeriod.reduce((sum, item) => sum + item.price, 0);
    
    const firstPeriodQuantity = firstPeriod.length;
    const secondPeriodQuantity = secondPeriod.length;
    
    const firstPeriodAvgPrice = firstPeriodQuantity > 0 ? firstPeriodSales / firstPeriodQuantity : 0;
    const secondPeriodAvgPrice = secondPeriodQuantity > 0 ? secondPeriodSales / secondPeriodQuantity : 0;
    
    const firstPeriodUniqueProducts = new Set(firstPeriod.map(item => item.sku)).size;
    const secondPeriodUniqueProducts = new Set(secondPeriod.map(item => item.sku)).size;
    
    // Calculate percentage changes
    const salesChange = firstPeriodSales > 0 ? ((secondPeriodSales - firstPeriodSales) / firstPeriodSales * 100) : 0;
    const quantityChange = firstPeriodQuantity > 0 ? ((secondPeriodQuantity - firstPeriodQuantity) / firstPeriodQuantity * 100) : 0;
    const avgPriceChange = firstPeriodAvgPrice > 0 ? ((secondPeriodAvgPrice - firstPeriodAvgPrice) / firstPeriodAvgPrice * 100) : 0;
    const uniqueProductsChange = firstPeriodUniqueProducts > 0 ? ((secondPeriodUniqueProducts - firstPeriodUniqueProducts) / firstPeriodUniqueProducts * 100) : 0;
    
    // Update UI
    updateMetricChange('totalSales', salesChange);
    updateMetricChange('totalQuantity', quantityChange);
    updateMetricChange('avgPrice', avgPriceChange);
    updateMetricChange('uniqueProducts', uniqueProductsChange);
  } else {
    // No data, reset changes to 0%
    updateMetricChange('totalSales', 0);
    updateMetricChange('totalQuantity', 0);
    updateMetricChange('avgPrice', 0);
    updateMetricChange('uniqueProducts', 0);
  }
}

// Helper function to update metric change indicators
function updateMetricChange(elementId, changePercent) {
  const changeElement = document.getElementById(elementId).nextElementSibling;
  const iconElement = changeElement.querySelector('i');
  const percentElement = changeElement.querySelector('span');
  
  // Update percentage text
  percentElement.textContent = Math.abs(changePercent).toFixed(1) + '%';
  
  // Update direction and color
  if (changePercent > 0) {
    changeElement.className = 'metric-change metric-up';
    iconElement.className = 'fas fa-arrow-up';
  } else if (changePercent < 0) {
    changeElement.className = 'metric-change metric-down';
    iconElement.className = 'fas fa-arrow-down';
  } else {
    changeElement.className = 'metric-change';
    iconElement.className = 'fas fa-minus';
  }
}

// Update sales chart based on selected view
function updateSalesChart(viewType = 'daily') {
  const salesChartContainer = document.getElementById('salesChart');
  
  // Group data by date
  const salesByDate = {};
  
  // Handle different time periods
  let dateFormat = '%Y-%m-%d'; // daily format
  
  if (viewType === 'weekly') {
    dateFormat = '%Y-W%W';
  } else if (viewType === 'monthly') {
    dateFormat = '%Y-%m';
  }
  
  // Group data by the specified time period
  filteredData.forEach(item => {
    const date = new Date(item.date);
    let dateKey = '';
    
    if (viewType === 'daily') {
      dateKey = item.date;
    } else if (viewType === 'weekly') {
      const weekNumber = getWeekNumber(date);
      dateKey = `${date.getFullYear()}-W${weekNumber}`;
    } else if (viewType === 'monthly') {
      dateKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    }
    
    if (!salesByDate[dateKey]) {
      salesByDate[dateKey] = {
        sales: 0,
        quantity: 0
      };
    }
    
    salesByDate[dateKey].sales += item.price;
    salesByDate[dateKey].quantity += 1; // Count orders, quantity is always 1
  });
  
  // Convert to arrays for Highcharts
  const dates = Object.keys(salesByDate).sort();
  const salesData = dates.map(date => salesByDate[date].sales);
  const quantityData = dates.map(date => salesByDate[date].quantity);
  
  // Format dates based on view type
  const formattedDates = dates.map(date => {
    if (viewType === 'daily') {
      return date;
    } else if (viewType === 'weekly') {
      const [year, week] = date.split('-W');
      return `Week ${week}, ${year}`;
    } else if (viewType === 'monthly') {
      const [year, month] = date.split('-');
      return `${getMonthName(parseInt(month))} ${year}`;
    }
    return date;
  });
  
  // Create or update chart
  if (salesChart) {
    salesChart.updateOptions({
      xaxis: {
        categories: formattedDates
      },
      title: {
        text: `Sales Over Time (${viewType.charAt(0).toUpperCase() + viewType.slice(1)})`
      }
    }, false, true);
    
    salesChart.updateSeries([
      {
        name: 'Sales ($)',
        data: salesData
      },
      {
        name: 'Orders',
        data: quantityData
      }
    ]);
  } else {
    const options = {
      series: [
        {
          name: 'Sales ($)',
          data: salesData
        },
        {
          name: 'Orders',
          data: quantityData
        }
      ],
      chart: {
        type: 'area',
        height: 320,
        toolbar: {
          show: false
        },
        fontFamily: 'Segoe UI, sans-serif',
        background: 'transparent',
        foreColor: '#a0a0a0'
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: 'smooth',
        width: 2
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'dark',
          type: 'vertical',
          shadeIntensity: 0.4,
          opacityFrom: 0.5,
          opacityTo: 0.1,
          stops: [0, 90, 100]
        }
      },
      colors: ['#00c8ff', '#1dd1a1'],
      title: {
        text: `Sales Over Time (${viewType.charAt(0).toUpperCase() + viewType.slice(1)})`,
        align: 'left',
        style: {
          color: '#e6e6e6',
          fontSize: '14px',
          fontWeight: '600'
        }
      },
      xaxis: {
        categories: formattedDates,
        labels: {
          style: {
            colors: '#a0a0a0',
            fontSize: '11px'
          }
        },
        axisBorder: {
          color: '#2a2a2a'
        },
        axisTicks: {
          color: '#2a2a2a'
        }
      },
      yaxis: [
        {
          title: {
            text: 'Sales ($)',
            style: {
              color: '#a0a0a0',
              fontSize: '11px'
            }
          },
          labels: {
            style: {
              colors: '#a0a0a0',
              fontSize: '11px'
            },
            formatter: function(val) {
              return '$' + val.toFixed(0);
            }
          }
        },
        {
          opposite: true,
          title: {
            text: 'Orders',
            style: {
              color: '#a0a0a0',
              fontSize: '11px'
            }
          },
          labels: {
            style: {
              colors: '#a0a0a0',
              fontSize: '11px'
            },
            formatter: function(val) {
              return Math.round(val);
            }
          }
        }
      ],
      tooltip: {
        theme: 'dark',
        y: {
          formatter: function(val, { seriesIndex }) {
            if (seriesIndex === 0) {
              return '$' + val.toFixed(2);
            }
            return Math.round(val);
          }
        }
      },
      legend: {
        labels: {
          colors: '#a0a0a0'
        }
      },
      grid: {
        borderColor: '#2a2a2a',
        strokeDashArray: 3
      }
    };

    salesChart = new ApexCharts(salesChartContainer, options);
    salesChart.render();
  }
}

// Update products chart based on selected category
function updateProductsChart(category = 'wheel') {
  const productsChartContainer = document.getElementById('productsChart');
  
  // Group data by the selected category
  const categoryData = {};
  
  filteredData.forEach(item => {
    const categoryValue = item[categoryMapping[category]];
    
    if (!categoryData[categoryValue]) {
      categoryData[categoryValue] = {
        sales: 0,
        orders: 0
      };
    }
    
    categoryData[categoryValue].sales += item.price;
    categoryData[categoryValue].orders += 1; // Count orders, quantity is always 1
  });
  
  // Convert to arrays for Highcharts
  const categories = Object.keys(categoryData).sort();
  const salesData = categories.map(cat => categoryData[cat].sales);
  const ordersData = categories.map(cat => categoryData[cat].orders);
  
  // Create or update chart
  if (productsChart) {
    productsChart.updateOptions({
      xaxis: {
        categories: categories
      },
      title: {
        text: `Sales by ${category.charAt(0).toUpperCase() + category.slice(1)}`
      }
    }, false, true);
    
    productsChart.updateSeries([
      {
        name: 'Sales ($)',
        data: salesData
      },
      {
        name: 'Orders',
        data: ordersData
      }
    ]);
  } else {
    const options = {
      series: [
        {
          name: 'Sales ($)',
          data: salesData
        },
        {
          name: 'Orders',
          data: ordersData
        }
      ],
      chart: {
        type: 'bar',
        height: 320,
        toolbar: {
          show: false
        },
        fontFamily: 'Segoe UI, sans-serif',
        background: 'transparent',
        foreColor: '#a0a0a0'
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          endingShape: 'rounded',
          borderRadius: 2
        }
      },
      dataLabels: {
        enabled: false
      },
      colors: ['#00c8ff', '#1dd1a1'],
      title: {
        text: `Sales by ${category.charAt(0).toUpperCase() + category.slice(1)}`,
        align: 'left',
        style: {
          color: '#e6e6e6',
          fontSize: '14px',
          fontWeight: '600'
        }
      },
      xaxis: {
        categories: categories,
        labels: {
          style: {
            colors: '#a0a0a0',
            fontSize: '11px'
          }
        },
        axisBorder: {
          color: '#2a2a2a'
        },
        axisTicks: {
          color: '#2a2a2a'
        }
      },
      yaxis: [
        {
          title: {
            text: 'Sales ($)',
            style: {
              color: '#a0a0a0'
            }
          },
          labels: {
            style: {
              colors: '#a0a0a0'
            },
            formatter: function(val) {
              return '$' + val.toFixed(0);
            }
          }
        },
        {
          opposite: true,
          title: {
            text: 'Orders',
            style: {
              color: '#a0a0a0'
            }
          },
          labels: {
            style: {
              colors: '#a0a0a0'
            },
            formatter: function(val) {
              return Math.round(val);
            }
          }
        }
      ],
      tooltip: {
        theme: 'dark',
        y: {
          formatter: function(val, { seriesIndex }) {
            if (seriesIndex === 0) {
              return '$' + val.toFixed(2);
            }
            return Math.round(val);
          }
        }
      },
      legend: {
        labels: {
          colors: '#a0a0a0'
        }
      },
      grid: {
        borderColor: '#2a2a2a',
        strokeDashArray: 3
      }
    };

    productsChart = new ApexCharts(productsChartContainer, options);
    productsChart.render();
  }
}

// Update channel pie chart
function updateChannelChart() {
  const channelChartContainer = document.getElementById('channelChart');
  
  // Group data by channel
  const channelData = {};
  
  filteredData.forEach(item => {
    if (!channelData[item.channel]) {
      channelData[item.channel] = 0;
    }
    
    channelData[item.channel] += item.price;
  });
  
  // Convert to arrays for Highcharts
  const channels = Object.keys(channelData);
  const data = channels.map(channel => ({
    name: channel,
    value: channelData[channel]
  }));
  
  // Create or update chart
  if (channelChart) {
    channelChart.updateSeries(data.map(item => item.value));
    channelChart.updateOptions({
      labels: channels
    });
  } else {
    const options = {
      series: data.map(item => item.value),
      chart: {
        type: 'pie',
        height: 250,
        fontFamily: 'Segoe UI, sans-serif',
        background: 'transparent',
        foreColor: '#a0a0a0'
      },
      labels: channels,
      colors: ['#00c8ff', '#1dd1a1', '#feca57', '#ff6b6b'],
      title: {
        text: 'Sales by Channel',
        align: 'left',
        style: {
          color: '#e6e6e6',
          fontSize: '14px',
          fontWeight: '600'
        }
      },
      legend: {
        position: 'bottom',
        fontSize: '12px',
        labels: {
          colors: '#a0a0a0'
        }
      },
      dataLabels: {
        enabled: true,
        style: {
          colors: ['#fff'],
          fontSize: '11px',
          fontWeight: '500'
        },
        formatter: function(val, { seriesIndex, w }) {
          // Calculate correct percentage based on total
          const total = w.config.series.reduce((a, b) => a + b, 0);
          const percent = (w.config.series[seriesIndex] / total * 100).toFixed(1);
          return percent + '%';
        },
        dropShadow: {
          enabled: true
        }
      },
      tooltip: {
        theme: 'dark',
        y: {
          formatter: function(val) {
            return '$' + val.toFixed(2);
          }
        }
      }
    };

    channelChart = new ApexCharts(channelChartContainer, options);
    channelChart.render();
  }
}

// Update forecast calculations
function updateForecasts() {
  // Get the date range from the filters
  const startDateInput = document.getElementById('startDate').value;
  const endDateInput = document.getElementById('endDate').value;
  
  let startDate = startDateInput ? new Date(startDateInput) : null;
  let endDate = endDateInput ? new Date(endDateInput) : null;
  
  // If no dates selected, try to determine them from the filtered data
  if (!startDate || !endDate) {
    if (filteredData.length > 0) {
      const dates = filteredData.map(item => new Date(item.date));
      startDate = new Date(Math.min(...dates));
      endDate = new Date(Math.max(...dates));
    } else {
      // No data, return zero forecasts
      document.getElementById('forecast30Days').textContent = '0';
      document.getElementById('forecast90Days').textContent = '0';
      document.getElementById('forecast180Days').textContent = '0';
      document.getElementById('forecast365Days').textContent = '0';
      return;
    }
  }
  
  // Calculate the number of days in the date range
  const timeDiff = endDate.getTime() - startDate.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to include end date
  
  // Total number of orders
  const totalOrders = filteredData.length;
  
  // Calculate daily order rate based on actual date range
  const dailyOrderRate = totalOrders / daysDiff;
  
  // Calculate forecasts for different time periods
  const forecast30Days = Math.round(dailyOrderRate * 30);
  const forecast90Days = Math.round(dailyOrderRate * 90);
  const forecast180Days = Math.round(dailyOrderRate * 180);
  const forecast365Days = Math.round(dailyOrderRate * 365);
  
  // Update forecast cards
  document.getElementById('forecast30Days').textContent = forecast30Days;
  document.getElementById('forecast90Days').textContent = forecast90Days;
  document.getElementById('forecast180Days').textContent = forecast180Days;
  document.getElementById('forecast365Days').textContent = forecast365Days;
}

// Helper function to get week number from date
function getWeekNumber(date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

// Helper function to get month name
function getMonthName(month) {
  const monthNames = [
    'January', 'February', 'March', 'April',
    'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December'
  ];
  return monthNames[month - 1];
}

// Category mapping for product chart
const categoryMapping = {
  'wheel': 'wheel',
  'vendor': 'vendor',
  'size': 'size',
  'boltPattern': 'boltPattern',
  'finish': 'finish'
};

// Show loading overlay
function showLoading() {
  document.getElementById('loadingOverlay').classList.add('active');
}

// Hide loading overlay
function hideLoading() {
  document.getElementById('loadingOverlay').classList.remove('active');
}

// Show notification message
function showNotification(message, type = 'info') {
  // Create notification element if it doesn't exist
  let notification = document.getElementById('notification');
  
  if (!notification) {
    notification = document.createElement('div');
    notification.id = 'notification';
    document.body.appendChild(notification);
    
    // Add styles if not in CSS
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.padding = '12px 24px';
    notification.style.borderRadius = '4px';
    notification.style.color = 'white';
    notification.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    notification.style.zIndex = '9999';
    notification.style.transition = 'all 0.3s ease';
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(-20px)';
  }
  
  // Set type-specific styles
  if (type === 'success') {
    notification.style.backgroundColor = '#1dd1a1';
  } else if (type === 'error') {
    notification.style.backgroundColor = '#ff6b6b';
  } else {
    notification.style.backgroundColor = '#00c8ff';
  }
  
  // Set content and show
  notification.textContent = message;
  notification.style.opacity = '1';
  notification.style.transform = 'translateY(0)';
  
  // Auto-hide after 3 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(-20px)';
  }, 3000);
} 