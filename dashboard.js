// Dashboard.js - Main Dashboard Functionality

// Initialize variables for storing filtered data and charts
let filteredData = [];
let salesChart = null;
let productsChart = null;
let channelChart = null;
let forecastData = {};
let selectedStartDate = null;
let selectedEndDate = null;
let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();

// Add these variables for custom view functionality
let selectedFilters = {
  wheel: [],
  vendor: [],
  size: [],
  boltPattern: [],
  finish: [],
  channel: []
};

// Add this variable for custom view by product
let selectedProducts = [];

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
  
  // Initialize date pickers with sensible defaults (last 30 days)
  setDateRange('last30days');
  
  // Initialize filter dropdowns
  initializeFilters();
  
  // Initialize date range selector
  initializeDateRangeSelector();
  
  // Initialize custom view by category functionality
  initializeCustomViewByCategory();
  
  // Initialize custom view by product functionality
  initializeCustomViewByProduct();
  
  // Apply initial data processing
  updateDashboard();
  
  // Set up event listeners
  setupEventListeners();
  
  // Hide active filters container initially
  document.getElementById('activeFiltersContainer').style.display = 'none';
}

// Initialize the date range selector
function initializeDateRangeSelector() {
  const dateRangeBtn = document.getElementById('dateRangeBtn');
  const dateRangeDropdown = document.getElementById('dateRangeDropdown');
  const quickSelectOptions = document.querySelectorAll('.quick-select-option');
  const applyDateRangeBtn = document.getElementById('applyDateRange');
  const cancelDateRangeBtn = document.getElementById('cancelDateRange');
  const prevMonthBtn = document.getElementById('prevMonthBtn');
  const nextMonthBtn = document.getElementById('nextMonthBtn');
  
  // Initialize calendar
  updateCalendar(currentMonth, currentYear);
  
  // Toggle dropdown when button is clicked
  dateRangeBtn.addEventListener('click', function() {
    dateRangeDropdown.classList.toggle('active');
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', function(e) {
    if (!dateRangeBtn.contains(e.target) && !dateRangeDropdown.contains(e.target)) {
      dateRangeDropdown.classList.remove('active');
    }
  });
  
  // Handle quick select options
  quickSelectOptions.forEach(option => {
    option.addEventListener('click', function() {
      const rangeType = this.dataset.range;
      
      // Update active class
      quickSelectOptions.forEach(opt => opt.classList.remove('active'));
      this.classList.add('active');
      
      // Set the date range
      setDateRange(rangeType);
      
      // Update the calendar display to show selected range
      updateCalendarSelection();
    });
  });
  
  // Navigate to previous month
  prevMonthBtn.addEventListener('click', function() {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    updateCalendar(currentMonth, currentYear);
    updateCalendarSelection();
  });
  
  // Navigate to next month
  nextMonthBtn.addEventListener('click', function() {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    updateCalendar(currentMonth, currentYear);
    updateCalendarSelection();
  });
  
  // Apply selected date range
  applyDateRangeBtn.addEventListener('click', function() {
    if (selectedStartDate && selectedEndDate) {
      document.getElementById('startDate').value = formatDate(selectedStartDate);
      document.getElementById('endDate').value = formatDate(selectedEndDate);
      
      // Update display text
      updateDateRangeDisplay();
      
      // Close dropdown
      dateRangeDropdown.classList.remove('active');
      
      // Update dashboard
      showLoading();
      setTimeout(function() {
        updateDashboard();
        hideLoading();
      }, 500);
    }
  });
  
  // Cancel selection
  cancelDateRangeBtn.addEventListener('click', function() {
    dateRangeDropdown.classList.remove('active');
  });
}

// Update calendar display
function updateCalendar(month, year) {
  const calendarDays = document.getElementById('calendarDays');
  const currentMonthYear = document.getElementById('currentMonthYear');
  
  // Clear previous calendar days
  calendarDays.innerHTML = '';
  
  // Update month/year display
  const monthNames = ["January", "February", "March", "April", "May", "June",
                      "July", "August", "September", "October", "November", "December"];
  currentMonthYear.textContent = `${monthNames[month]} ${year}`;
  
  // Get first day of month and total days
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // Create calendar grid
  // Add empty cells for days before the first day of month
  for (let i = 0; i < firstDay; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.classList.add('calendar-day', 'disabled');
    calendarDays.appendChild(emptyCell);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayCell = document.createElement('div');
    dayCell.classList.add('calendar-day');
    dayCell.textContent = day;
    
    // Check if this is today
    const today = new Date();
    if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
      dayCell.classList.add('today');
    }
    
    // Add click event to select date
    dayCell.addEventListener('click', function() {
      const clickedDate = new Date(year, month, day);
      
      // If we haven't selected a start date yet, or if we've already selected both, reset selection
      if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
        selectedStartDate = clickedDate;
        selectedEndDate = null;
      } 
      // If we already have a start date but no end date
      else if (selectedStartDate && !selectedEndDate) {
        // If clicked date is before start date, swap them
        if (clickedDate < selectedStartDate) {
          selectedEndDate = selectedStartDate;
          selectedStartDate = clickedDate;
        } else {
          selectedEndDate = clickedDate;
        }
      }
      
      // Update calendar to show selection
      updateCalendarSelection();
    });
    
    calendarDays.appendChild(dayCell);
  }
}

// Update calendar to show selected date range
function updateCalendarSelection() {
  const calendarDays = document.querySelectorAll('.calendar-day:not(.disabled)');
  
  // Clear previous selections
  calendarDays.forEach(day => {
    day.classList.remove('selected', 'in-range');
  });
  
  if (!selectedStartDate) return;
  
  // Mark selected dates
  calendarDays.forEach(day => {
    if (!day.textContent) return;
    
    const dayNum = parseInt(day.textContent);
    const cellDate = new Date(currentYear, currentMonth, dayNum);
    
    // Check if this day is the start date
    if (cellDate.getDate() === selectedStartDate.getDate() && 
        cellDate.getMonth() === selectedStartDate.getMonth() && 
        cellDate.getFullYear() === selectedStartDate.getFullYear()) {
      day.classList.add('selected');
    }
    
    // Check if this day is the end date
    if (selectedEndDate && 
        cellDate.getDate() === selectedEndDate.getDate() && 
        cellDate.getMonth() === selectedEndDate.getMonth() && 
        cellDate.getFullYear() === selectedEndDate.getFullYear()) {
      day.classList.add('selected');
    }
    
    // Check if this day is in the selected range
    if (selectedEndDate && 
        cellDate > selectedStartDate && 
        cellDate < selectedEndDate) {
      day.classList.add('in-range');
    }
  });
}

// Set date range based on quick select option
function setDateRange(rangeType) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let startDate = new Date(today);
  let endDate = new Date(today);
  
  switch(rangeType) {
    case 'today':
      // Start and end are already today
      break;
      
    case 'yesterday':
      startDate.setDate(today.getDate() - 1);
      endDate.setDate(today.getDate() - 1);
      break;
      
    case 'last7days':
      startDate.setDate(today.getDate() - 6);
      break;
      
    case 'last30days':
      startDate.setDate(today.getDate() - 29);
      break;
      
    case 'last60days':
      startDate.setDate(today.getDate() - 59);
      break;
      
    case 'last90days':
      startDate.setDate(today.getDate() - 89);
      break;
      
    case 'thisMonth':
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      break;
      
    case 'lastMonth':
      startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      endDate = new Date(today.getFullYear(), today.getMonth(), 0);
      break;
      
    case 'allTime':
      // Find the earliest date in the data
      const dates = sampleData.map(item => new Date(item.date));
      startDate = new Date(Math.min(...dates));
      startDate.setHours(0, 0, 0, 0);
      break;
  }
  
  // Set the selected dates
  selectedStartDate = startDate;
  selectedEndDate = endDate;
  
  // Update hidden inputs
  document.getElementById('startDate').value = formatDate(startDate);
  document.getElementById('endDate').value = formatDate(endDate);
  
  // Update display text
  updateDateRangeDisplay();
}

// Update the displayed date range text
function updateDateRangeDisplay() {
  const dateRangeDisplay = document.getElementById('dateRangeDisplay');
  
  if (selectedStartDate && selectedEndDate) {
    if (isSameDate(selectedStartDate, selectedEndDate)) {
      // Same day
      dateRangeDisplay.textContent = formatDateDisplay(selectedStartDate);
    } else {
      // Date range
      dateRangeDisplay.textContent = `${formatDateDisplay(selectedStartDate)} - ${formatDateDisplay(selectedEndDate)}`;
    }
  } else if (selectedStartDate) {
    dateRangeDisplay.textContent = formatDateDisplay(selectedStartDate);
  } else {
    dateRangeDisplay.textContent = 'Select Date Range';
  }
  
  // Check if it matches a preset range
  const quickSelectOptions = document.querySelectorAll('.quick-select-option');
  quickSelectOptions.forEach(option => {
    option.classList.remove('active');
  });
  
  // Find and activate the matching quick option if exists
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (isSameDate(selectedStartDate, today) && isSameDate(selectedEndDate, today)) {
    document.querySelector('.quick-select-option[data-range="today"]').classList.add('active');
    dateRangeDisplay.textContent = 'Today';
  } else if (
    isSameDate(selectedStartDate, new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)) && 
    isSameDate(selectedEndDate, new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1))
  ) {
    document.querySelector('.quick-select-option[data-range="yesterday"]').classList.add('active');
    dateRangeDisplay.textContent = 'Yesterday';
  } else if (
    isSameDate(selectedStartDate, new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6)) && 
    isSameDate(selectedEndDate, today)
  ) {
    document.querySelector('.quick-select-option[data-range="last7days"]').classList.add('active');
    dateRangeDisplay.textContent = 'Last 7 Days';
  } else if (
    isSameDate(selectedStartDate, new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29)) && 
    isSameDate(selectedEndDate, today)
  ) {
    document.querySelector('.quick-select-option[data-range="last30days"]').classList.add('active');
    dateRangeDisplay.textContent = 'Last 30 Days';
  } else if (
    isSameDate(selectedStartDate, new Date(today.getFullYear(), today.getMonth(), today.getDate() - 59)) && 
    isSameDate(selectedEndDate, today)
  ) {
    document.querySelector('.quick-select-option[data-range="last60days"]').classList.add('active');
    dateRangeDisplay.textContent = 'Last 60 Days';
  } else if (
    isSameDate(selectedStartDate, new Date(today.getFullYear(), today.getMonth(), today.getDate() - 89)) && 
    isSameDate(selectedEndDate, today)
  ) {
    document.querySelector('.quick-select-option[data-range="last90days"]').classList.add('active');
    dateRangeDisplay.textContent = 'Last 90 Days';
  } else if (
    isSameDate(selectedStartDate, new Date(today.getFullYear(), today.getMonth(), 1)) && 
    isSameDate(selectedEndDate, new Date(today.getFullYear(), today.getMonth() + 1, 0))
  ) {
    document.querySelector('.quick-select-option[data-range="thisMonth"]').classList.add('active');
    dateRangeDisplay.textContent = 'This Month';
  } else if (
    isSameDate(selectedStartDate, new Date(today.getFullYear(), today.getMonth() - 1, 1)) && 
    isSameDate(selectedEndDate, new Date(today.getFullYear(), today.getMonth(), 0))
  ) {
    document.querySelector('.quick-select-option[data-range="lastMonth"]').classList.add('active');
    dateRangeDisplay.textContent = 'Last Month';
  }
}

// Format date for display (MMM D, YYYY)
function formatDateDisplay(date) {
  const options = { month: 'short', day: 'numeric', year: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

// Format date for input value (YYYY-MM-DD)
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Check if two dates are the same (ignoring time)
function isSameDate(date1, date2) {
  if (!date1 || !date2) return false;
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
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

// Initialize custom view by category functionality
function initializeCustomViewByCategory() {
  const modal = document.getElementById('customViewCategoryModal');
  const customViewBtn = document.getElementById('customViewCategoryBtn');
  const closeModalBtn = modal.querySelector('.close-modal');
  const applyCustomViewBtn = document.getElementById('applyCustomViewCategory');
  const cancelCustomViewBtn = document.getElementById('cancelCustomViewCategory');
  
  // Populate multi-select dropdowns
  populateMultiSelectDropdown('wheelDropdown', 'wheel');
  populateMultiSelectDropdown('vendorDropdown', 'vendor');
  populateMultiSelectDropdown('sizeDropdown', 'size');
  populateMultiSelectDropdown('boltPatternDropdown', 'boltPattern');
  populateMultiSelectDropdown('finishDropdown', 'finish');
  populateMultiSelectDropdown('channelDropdown', 'channel');
  
  // Open modal when Custom View button is clicked
  customViewBtn.addEventListener('click', function() {
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent scrolling behind modal
    updateSelectedFiltersDisplay();
  });
  
  // Close modal on X button click
  closeModalBtn.addEventListener('click', function() {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  });
  
  // Close modal when clicking outside the modal content
  window.addEventListener('click', function(e) {
    if (e.target === modal) {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  });
  
  // Apply custom view filters
  applyCustomViewBtn.addEventListener('click', function() {
    // Apply the filters
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // Reset selected products when switching to category view
    selectedProducts = [];
    
    // Check if any filters are selected
    const hasActiveFilters = Object.values(selectedFilters).some(arr => arr.length > 0);
    
    // Show/hide the active filters container
    document.getElementById('activeFiltersContainer').style.display = hasActiveFilters ? 'flex' : 'none';
    
    // Update the active filters display
    updateActiveFiltersDisplay();
    
    // Update the dashboard with the custom filters
    showLoading();
    setTimeout(function() {
      updateDashboard();
      hideLoading();
    }, 500);
  });
  
  // Cancel custom view
  cancelCustomViewBtn.addEventListener('click', function() {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  });
  
  // Set up event listeners for search inputs
  setupSearchInputs();
  
  // Set up clear all filters button
  document.getElementById('clearAllFilters').addEventListener('click', function() {
    // Clear all selected filters
    Object.keys(selectedFilters).forEach(key => {
      selectedFilters[key] = [];
    });
    
    // Clear selected products
    selectedProducts = [];
    
    // Hide the active filters container
    document.getElementById('activeFiltersContainer').style.display = 'none';
    
    // Clear the active filters display
    document.getElementById('activeFilters').innerHTML = '';
    
    // Reset checkbox states in dropdowns
    document.querySelectorAll('.multi-select-option.selected').forEach(option => {
      option.classList.remove('selected');
      option.querySelector('input[type="checkbox"]').checked = false;
    });
    
    // Update the dashboard
    showLoading();
    setTimeout(function() {
      updateDashboard();
      hideLoading();
    }, 500);
  });
}

// Populate multi-select dropdown with options
function populateMultiSelectDropdown(dropdownId, filterType) {
  const dropdown = document.getElementById(dropdownId);
  
  // Get unique values for the filter type
  const values = [...new Set(sampleData.map(item => item[filterType]))];
  
  // Sort the values alphabetically
  values.sort();
  
  // Create option elements
  values.forEach(value => {
    const option = document.createElement('div');
    option.className = 'multi-select-option';
    
    // Check if this value is already selected
    const isSelected = selectedFilters[filterType].includes(value);
    if (isSelected) {
      option.classList.add('selected');
    }
    
    option.innerHTML = `
      <input type="checkbox" class="multi-select-checkbox" ${isSelected ? 'checked' : ''}>
      <span>${value}</span>
    `;
    
    // Add click event to toggle selection
    option.addEventListener('click', function(e) {
      // Prevent checkbox from handling the click itself (we'll do it manually)
      if (e.target.type === 'checkbox') {
        e.stopPropagation();
        return;
      }
      
      const checkbox = this.querySelector('input[type="checkbox"]');
      const value = this.querySelector('span').textContent;
      
      // Toggle checkbox state
      checkbox.checked = !checkbox.checked;
      
      // Toggle selected class
      this.classList.toggle('selected');
      
      // Update selected filters
      if (checkbox.checked) {
        if (!selectedFilters[filterType].includes(value)) {
          selectedFilters[filterType].push(value);
        }
      } else {
        selectedFilters[filterType] = selectedFilters[filterType].filter(v => v !== value);
      }
      
      // Update the selected filters display
      updateSelectedFiltersDisplay();
    });
    
    // Handle checkbox click separately
    option.querySelector('input[type="checkbox"]').addEventListener('click', function(e) {
      // Stop propagation to prevent the option click handler from firing
      e.stopPropagation();
      
      // Update selected state
      if (this.checked) {
        option.classList.add('selected');
        if (!selectedFilters[filterType].includes(value)) {
          selectedFilters[filterType].push(value);
        }
      } else {
        option.classList.remove('selected');
        selectedFilters[filterType] = selectedFilters[filterType].filter(v => v !== value);
      }
      
      // Update the selected filters display
      updateSelectedFiltersDisplay();
    });
    
    dropdown.appendChild(option);
  });
}

// Set up search functionality for multi-select inputs
function setupSearchInputs() {
  const searchInputs = document.querySelectorAll('.multi-select-search');
  
  searchInputs.forEach(input => {
    const dropdown = input.nextElementSibling;
    
    // Show dropdown when input is focused
    input.addEventListener('focus', function() {
      dropdown.classList.add('active');
    });
    
    // Handle search input
    input.addEventListener('input', function() {
      const searchTerm = this.value.toLowerCase();
      const options = dropdown.querySelectorAll('.multi-select-option');
      
      options.forEach(option => {
        const text = option.querySelector('span').textContent.toLowerCase();
        if (text.includes(searchTerm)) {
          option.style.display = 'flex';
        } else {
          option.style.display = 'none';
        }
      });
    });
    
    // Handle click outside to close dropdown
    document.addEventListener('click', function(e) {
      if (!input.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.remove('active');
      }
    });
  });
}

// Update the display of selected filters in the modal
function updateSelectedFiltersDisplay() {
  const selectedFiltersContainer = document.getElementById('selectedFilters');
  selectedFiltersContainer.innerHTML = '';
  
  // Create pill elements for each selected filter
  Object.entries(selectedFilters).forEach(([filterType, values]) => {
    values.forEach(value => {
      const pill = createFilterPill(filterType, value);
      selectedFiltersContainer.appendChild(pill);
    });
  });
  
  // Show a message if no filters are selected
  if (selectedFiltersContainer.children.length === 0) {
    const noFiltersMsg = document.createElement('div');
    noFiltersMsg.textContent = 'No filters selected';
    noFiltersMsg.style.color = '#a0a0a0';
    selectedFiltersContainer.appendChild(noFiltersMsg);
  }
}

// Update the active filters display in the main dashboard
function updateActiveFiltersDisplay() {
  const activeFiltersContainer = document.getElementById('activeFilters');
  activeFiltersContainer.innerHTML = '';
  
  // Create pill elements for each active filter
  Object.entries(selectedFilters).forEach(([filterType, values]) => {
    values.forEach(value => {
      // Create a formatted filter type display name
      const filterTypeDisplay = formatFilterType(filterType);
      
      const pill = document.createElement('div');
      pill.className = 'filter-pill';
      pill.innerHTML = `
        <span class="filter-pill-text">tag: ${filterTypeDisplay} ${value}</span>
        <span class="filter-pill-remove" data-type="${filterType}" data-value="${value}">×</span>
      `;
      
      // Add click event to remove button
      pill.querySelector('.filter-pill-remove').addEventListener('click', function() {
        const type = this.dataset.type;
        const value = this.dataset.value;
        
        // Remove from selected filters
        selectedFilters[type] = selectedFilters[type].filter(v => v !== value);
        
        // Remove pill from display
        pill.remove();
        
        // Update checkbox state in dropdown
        const checkbox = document.querySelector(`#${type}Dropdown .multi-select-option span:contains('${value}')`).parentElement.querySelector('input[type="checkbox"]');
        if (checkbox) {
          checkbox.checked = false;
          checkbox.parentElement.classList.remove('selected');
        }
        
        // Check if any filters are still active
        const hasActiveFilters = Object.values(selectedFilters).some(arr => arr.length > 0);
        
        // Show/hide the active filters container
        document.getElementById('activeFiltersContainer').style.display = hasActiveFilters ? 'flex' : 'none';
        
        // Update the dashboard
        showLoading();
        setTimeout(function() {
          updateDashboard();
          hideLoading();
        }, 500);
      });
      
      activeFiltersContainer.appendChild(pill);
    });
  });
}

// Create a filter pill element
function createFilterPill(filterType, value) {
  const filterTypeDisplay = formatFilterType(filterType);
  
  const pill = document.createElement('div');
  pill.className = 'filter-pill';
  pill.innerHTML = `
    <span class="filter-pill-text">${filterTypeDisplay}: ${value}</span>
    <span class="filter-pill-remove" data-type="${filterType}" data-value="${value}">×</span>
  `;
  
  // Add click event to remove button
  pill.querySelector('.filter-pill-remove').addEventListener('click', function() {
    const type = this.dataset.type;
    const value = this.dataset.value;
    
    // Remove from selected filters
    selectedFilters[type] = selectedFilters[type].filter(v => v !== value);
    
    // Remove pill from display
    pill.remove();
    
    // Update checkbox state in dropdown
    const optionElement = document.querySelector(`#${type}Dropdown .multi-select-option:has(span:contains('${value}'))`);
    if (optionElement) {
      optionElement.classList.remove('selected');
      optionElement.querySelector('input[type="checkbox"]').checked = false;
    }
    
    // Update the selected filters display
    updateSelectedFiltersDisplay();
  });
  
  return pill;
}

// Format filter type for display
function formatFilterType(filterType) {
  switch(filterType) {
    case 'boltPattern':
      return 'Bolt Pattern';
    default:
      return filterType.charAt(0).toUpperCase() + filterType.slice(1);
  }
}

// Modify the updateDashboard function to handle selected products
function updateDashboard() {
  // Get regular filter values
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
    
    // Check if we have selected products
    if (selectedProducts.length > 0) {
      return selectedProducts.includes(item.productTitle);
    }
    
    // Dropdown filters (only apply if custom filters for that type are not active)
    if (channelFilter && item.channel !== channelFilter && selectedFilters.channel.length === 0) return false;
    if (vendorFilter && item.vendor !== vendorFilter && selectedFilters.vendor.length === 0) return false;
    if (wheelFilter && item.wheel !== wheelFilter && selectedFilters.wheel.length === 0) return false;
    if (sizeFilter && item.size !== sizeFilter && selectedFilters.size.length === 0) return false;
    if (boltPatternFilter && item.boltPattern !== boltPatternFilter && selectedFilters.boltPattern.length === 0) return false;
    if (finishFilter && item.finish !== finishFilter && selectedFilters.finish.length === 0) return false;
    
    // Custom multi-select filters
    if (selectedFilters.channel.length > 0 && !selectedFilters.channel.includes(item.channel)) return false;
    if (selectedFilters.vendor.length > 0 && !selectedFilters.vendor.includes(item.vendor)) return false;
    if (selectedFilters.wheel.length > 0 && !selectedFilters.wheel.includes(item.wheel)) return false;
    if (selectedFilters.size.length > 0 && !selectedFilters.size.includes(item.size)) return false;
    if (selectedFilters.boltPattern.length > 0 && !selectedFilters.boltPattern.includes(item.boltPattern)) return false;
    if (selectedFilters.finish.length > 0 && !selectedFilters.finish.includes(item.finish)) return false;
    
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
        quantity: 0,
        date: date // Store the actual date object for sorting
      };
    }
    
    salesByDate[dateKey].sales += item.price;
    salesByDate[dateKey].quantity += 1; // Count orders, quantity is always 1
  });
  
  // Convert to arrays for Highcharts and sort chronologically
  let dateEntries = Object.entries(salesByDate);
  
  // Sort entries by the actual date object
  dateEntries.sort((a, b) => a[1].date - b[1].date);
  
  // Now extract the sorted keys and data
  const dates = dateEntries.map(entry => entry[0]);
  const salesData = dateEntries.map(entry => entry[1].sales);
  const quantityData = dateEntries.map(entry => entry[1].quantity);
  
  // Format dates based on view type
  const formattedDates = dates.map(date => {
    if (viewType === 'daily') {
      return formatDateShort(date); // Use more readable format for display
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

// Add CSS selector for contains text
// This allows us to select elements containing specific text
if (!Element.prototype.matches) {
  Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
}

if (!Element.prototype.closest) {
  Element.prototype.closest = function(s) {
    var el = this;
    do {
      if (el.matches(s)) return el;
      el = el.parentElement || el.parentNode;
    } while (el !== null && el.nodeType === 1);
    return null;
  };
}

// Polyfill for :has() selector since it's not supported in all browsers
document.addEventListener('DOMContentLoaded', function() {
  // We'll use querySelectorAll with custom filtering instead
});

// Extend setup event listeners function to include custom view
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
    // Also clear custom filters
    Object.keys(selectedFilters).forEach(key => {
      selectedFilters[key] = [];
    });
    
    // Hide active filters container
    document.getElementById('activeFiltersContainer').style.display = 'none';
    
    // Clear active filters display
    document.getElementById('activeFilters').innerHTML = '';
    
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
  
  // Reset date range to last 30 days
  setDateRange('last30days');
  
  // Reset search
  document.getElementById('searchInput').value = '';
  
  // Clear selected products
  selectedProducts = [];
  
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

// Initialize custom view by product functionality
function initializeCustomViewByProduct() {
  const modal = document.getElementById('customViewProductModal');
  const customViewBtn = document.getElementById('customViewProductBtn');
  const closeModalBtn = modal.querySelector('.close-modal');
  const applyCustomViewBtn = document.getElementById('applyCustomViewProduct');
  const cancelCustomViewBtn = document.getElementById('cancelCustomViewProduct');
  
  // Populate filter dropdowns
  populateProductFilterDropdowns();
  
  // Open modal when Custom View by Product button is clicked
  customViewBtn.addEventListener('click', function() {
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent scrolling behind modal
    
    // Refresh the product list
    updateProductList();
    updateSelectedProductsDisplay();
  });
  
  // Close modal on X button click
  closeModalBtn.addEventListener('click', function() {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  });
  
  // Close modal when clicking outside the modal content
  window.addEventListener('click', function(e) {
    if (e.target === modal) {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  });
  
  // Apply custom view by product
  applyCustomViewBtn.addEventListener('click', function() {
    // Apply the product filters
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // Reset category filters when using product view
    Object.keys(selectedFilters).forEach(key => {
      selectedFilters[key] = [];
    });
    
    // Check if any products are selected
    const hasActiveProducts = selectedProducts.length > 0;
    
    // Show/hide the active filters container
    document.getElementById('activeFiltersContainer').style.display = hasActiveProducts ? 'flex' : 'none';
    
    // Update the active filters display with selected products
    updateActiveProductFiltersDisplay();
    
    // Update the dashboard with the selected products
    showLoading();
    setTimeout(function() {
      updateDashboard();
      hideLoading();
    }, 500);
  });
  
  // Cancel custom view
  cancelCustomViewBtn.addEventListener('click', function() {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  });
  
  // Set up filter change events
  document.getElementById('productFilterVendor').addEventListener('change', updateProductList);
  document.getElementById('productFilterWheel').addEventListener('change', updateProductList);
  document.getElementById('productFilterBoltPattern').addEventListener('change', updateProductList);
  document.getElementById('productFilterFinish').addEventListener('change', updateProductList);
  
  // Set up product search input
  document.getElementById('productSearchInput').addEventListener('input', function() {
    updateProductList();
  });
}

// Populate product filter dropdowns
function populateProductFilterDropdowns() {
  // Vendor filter
  const vendors = [...new Set(sampleData.map(item => item.vendor))].sort();
  populateProductFilter('productFilterVendor', vendors);
  
  // Wheel filter
  const wheels = [...new Set(sampleData.map(item => item.wheel))].sort();
  populateProductFilter('productFilterWheel', wheels);
  
  // Bolt pattern filter
  const boltPatterns = [...new Set(sampleData.map(item => item.boltPattern))].sort();
  populateProductFilter('productFilterBoltPattern', boltPatterns);
  
  // Finish filter
  const finishes = [...new Set(sampleData.map(item => item.finish))].sort();
  populateProductFilter('productFilterFinish', finishes);
}

// Populate a product filter dropdown
function populateProductFilter(elementId, options) {
  const dropdown = document.getElementById(elementId);
  
  // Clear existing options except the first one
  const firstOption = dropdown.querySelector('option:first-child');
  dropdown.innerHTML = '';
  dropdown.appendChild(firstOption);
  
  // Add options
  options.forEach(option => {
    const optionElement = document.createElement('option');
    optionElement.value = option;
    optionElement.textContent = option;
    dropdown.appendChild(optionElement);
  });
}

// Update product list based on filters
function updateProductList() {
  const vendorFilter = document.getElementById('productFilterVendor').value;
  const wheelFilter = document.getElementById('productFilterWheel').value;
  const boltPatternFilter = document.getElementById('productFilterBoltPattern').value;
  const finishFilter = document.getElementById('productFilterFinish').value;
  const searchTerm = document.getElementById('productSearchInput').value.toLowerCase();
  
  // Get unique product titles with filtered attributes
  const productTitles = new Set();
  const productDetails = {};
  
  sampleData.forEach(item => {
    if (vendorFilter && item.vendor !== vendorFilter) return;
    if (wheelFilter && item.wheel !== wheelFilter) return;
    if (boltPatternFilter && item.boltPattern !== boltPatternFilter) return;
    if (finishFilter && item.finish !== finishFilter) return;
    
    const productTitle = item.productTitle;
    
    // Skip if product doesn't match search term
    if (searchTerm && !productTitle.toLowerCase().includes(searchTerm)) return;
    
    productTitles.add(productTitle);
    
    // Store product details for display
    if (!productDetails[productTitle]) {
      productDetails[productTitle] = {
        vendor: item.vendor,
        wheel: item.wheel,
        size: item.size,
        boltPattern: item.boltPattern,
        finish: item.finish
      };
    }
  });
  
  // Sort product titles alphabetically
  const sortedProductTitles = Array.from(productTitles).sort();
  
  // Render product list
  const productList = document.getElementById('productList');
  productList.innerHTML = '';
  
  if (sortedProductTitles.length === 0) {
    const noProductsRow = document.createElement('tr');
    noProductsRow.innerHTML = '<td colspan="3" style="text-align: center; padding: 20px;">No products match the selected filters</td>';
    productList.appendChild(noProductsRow);
    return;
  }
  
  sortedProductTitles.forEach(title => {
    const details = productDetails[title];
    const row = document.createElement('tr');
    
    // Add selected class if this product is in the selected products list
    if (selectedProducts.includes(title)) {
      row.classList.add('selected');
    }
    
    row.innerHTML = `
      <td class="product-title-cell">${title}</td>
      <td class="product-vendor-cell">${details.vendor}</td>
      <td class="product-info-cell">${details.size} | ${details.boltPattern} | ${details.finish}</td>
    `;
    
    // Add click event to toggle selection
    row.addEventListener('click', function() {
      toggleProductSelection(title, row);
    });
    
    productList.appendChild(row);
  });
}

// Toggle product selection
function toggleProductSelection(productTitle, row) {
  const index = selectedProducts.indexOf(productTitle);
  
  if (index === -1) {
    // Add to selected products
    selectedProducts.push(productTitle);
    row.classList.add('selected');
  } else {
    // Remove from selected products
    selectedProducts.splice(index, 1);
    row.classList.remove('selected');
  }
  
  // Update selected products display
  updateSelectedProductsDisplay();
}

// Update the display of selected products in the modal
function updateSelectedProductsDisplay() {
  const selectedProductsContainer = document.getElementById('selectedProducts');
  selectedProductsContainer.innerHTML = '';
  
  // Create pill elements for each selected product
  selectedProducts.forEach(productTitle => {
    const pill = document.createElement('div');
    pill.className = 'filter-pill';
    pill.innerHTML = `
      <span class="filter-pill-text">${productTitle}</span>
      <span class="filter-pill-remove" data-product="${productTitle}">×</span>
    `;
    
    // Add click event to remove button
    pill.querySelector('.filter-pill-remove').addEventListener('click', function() {
      const product = this.dataset.product;
      
      // Remove from selected products
      const index = selectedProducts.indexOf(product);
      if (index !== -1) {
        selectedProducts.splice(index, 1);
      }
      
      // Remove pill from display
      pill.remove();
      
      // Update product list to reflect deselection
      const productRows = document.querySelectorAll('#productList tr');
      productRows.forEach(row => {
        const titleCell = row.querySelector('.product-title-cell');
        if (titleCell && titleCell.textContent === product) {
          row.classList.remove('selected');
        }
      });
      
      // Show message if no products selected
      if (selectedProducts.length === 0) {
        showNoProductsSelectedMessage();
      }
    });
    
    selectedProductsContainer.appendChild(pill);
  });
  
  // Show a message if no products are selected
  if (selectedProducts.length === 0) {
    showNoProductsSelectedMessage();
  }
}

// Show message when no products are selected
function showNoProductsSelectedMessage() {
  const selectedProductsContainer = document.getElementById('selectedProducts');
  const noProductsMsg = document.createElement('div');
  noProductsMsg.textContent = 'No products selected';
  noProductsMsg.style.color = '#a0a0a0';
  selectedProductsContainer.appendChild(noProductsMsg);
}

// Update the active filters display with selected products
function updateActiveProductFiltersDisplay() {
  const activeFiltersContainer = document.getElementById('activeFilters');
  activeFiltersContainer.innerHTML = '';
  
  // Create pill elements for each selected product
  selectedProducts.forEach(productTitle => {
    const pill = document.createElement('div');
    pill.className = 'filter-pill';
    pill.innerHTML = `
      <span class="filter-pill-text">tag: Product ${productTitle}</span>
      <span class="filter-pill-remove" data-product="${productTitle}">×</span>
    `;
    
    // Add click event to remove button
    pill.querySelector('.filter-pill-remove').addEventListener('click', function() {
      const product = this.dataset.product;
      
      // Remove from selected products
      const index = selectedProducts.indexOf(product);
      if (index !== -1) {
        selectedProducts.splice(index, 1);
      }
      
      // Remove pill from display
      pill.remove();
      
      // Check if any products are still active
      const hasActiveProducts = selectedProducts.length > 0;
      
      // Show/hide the active filters container
      document.getElementById('activeFiltersContainer').style.display = hasActiveProducts ? 'flex' : 'none';
      
      // Update the dashboard
      showLoading();
      setTimeout(function() {
        updateDashboard();
        hideLoading();
      }, 500);
    });
    
    activeFiltersContainer.appendChild(pill);
  });
}

// Format date for display as MM/DD (more readable for charts)
function formatDateShort(dateStr) {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}/${day}`;
}