// Sample data for dashboard
const purchaseData = {
  transactions: [
    { 
      id: '10045', 
      date: 'April 28, 2025', 
      items: ['Organic Broccoli', 'Fresh Spinach', 'Ripe Avocados'], 
      total: 19.42 
    },
    { 
      id: '10039', 
      date: 'April 21, 2025', 
      items: ['Weekly Veggie Box - Small', 'Organic Free-Range Eggs'], 
      total: 30.48 
    },
    { 
      id: '10028', 
      date: 'April 14, 2025', 
      items: ['Sweet Potatoes', 'Organic Carrots', 'Fresh Ginger Root'], 
      total: 12.72 
    },
    { 
      id: '10021', 
      date: 'April 7, 2025', 
      items: ['Cucumber', 'Bell Peppers', 'Lettuce'], 
      total: 15.99 
    },
    { 
      id: '10015', 
      date: 'March 31, 2025', 
      items: ['Weekly Veggie Box - Small'], 
      total: 24.99 
    }
  ],
  monthlyData: [
    { name: 'Jan', amount: 65.25 },
    { name: 'Feb', amount: 78.50 },
    { name: 'Mar', amount: 92.80 },
    { name: 'Apr', amount: 103.60 },
    { name: 'May', amount: 45.75 }
  ],
  categoryData: [
    { name: 'Vegetables', value: 157.35, color: '#4CAF50' },
    { name: 'Fruits', value: 83.25, color: '#8BC34A' },
    { name: 'Herbs', value: 45.50, color: '#CDDC39' },
    { name: 'Subscription Boxes', value: 99.80, color: '#FFC107' }
  ]
};

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Tab functionality
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  // Add click event listeners to all tab buttons
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.getAttribute('data-tab');
      
      // Remove 'active' class from all buttons and content sections
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Add 'active' class to the clicked button and corresponding content
      button.classList.add('active');
      document.getElementById(tabId).classList.add('active');
    });
  });

  // Dashboard view toggle functionality
  const viewButtons = document.querySelectorAll('.view-toggle button');
  const tabs = document.querySelectorAll('.tab-content');
  
  viewButtons.forEach(button => {
    button.addEventListener('click', function() {
      const viewName = this.getAttribute('data-view');
      
      // Toggle active class on buttons
      viewButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      
      // Show the selected tab
      tabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.id === `${viewName}Tab`) {
          tab.classList.add('active');
        }
      });
    });
  });

  // Profile Form Handling
  const profileForm = document.querySelector('#profile form');
  if (profileForm) {
    profileForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Validate passwords if they're being changed
      const currentPassword = document.getElementById('current-password');
      const newPassword = document.getElementById('new-password');
      const confirmPassword = document.getElementById('confirm-password');
      
      if (newPassword.value || confirmPassword.value) {
        if (!currentPassword.value) {
          alert('Please enter your current password');
          return;
        }
        
        if (newPassword.value !== confirmPassword.value) {
          alert('New passwords do not match');
          return;
        }
        
        if (newPassword.value.length < 8) {
          alert('Password must be at least 8 characters long');
          return;
        }
      }
      
      // Simulate form submission with success message
      const saveBtn = document.querySelector('.save-btn');
      const originalText = saveBtn.textContent;
      
      saveBtn.textContent = 'Saving...';
      saveBtn.disabled = true;
      
      setTimeout(() => {
        alert('Profile updated successfully!');
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
        
        // Clear password fields
        currentPassword.value = '';
        newPassword.value = '';
        confirmPassword.value = '';
      }, 1000);
    });
    
    // Cancel button functionality
    const cancelBtn = document.querySelector('.cancel-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to cancel your changes?')) {
          profileForm.reset();
        }
      });
    }
    
    // Delete account button functionality
    const deleteBtn = document.querySelector('.delete-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
          if (confirm('All your data will be lost. Please confirm once more to proceed.')) {
            alert('Account deletion request submitted. You will receive a confirmation email.');
          }
        }
      });
    }
  }

  // Order History Interactions
  const viewDetailsBtns = document.querySelectorAll('.view-details-btn');
  viewDetailsBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const orderCard = this.closest('.order-card');
      const orderNumber = orderCard.querySelector('.order-number').textContent;
      alert(`Viewing details for ${orderNumber}`);
      // In a real application, this would redirect to an order details page or show a modal
    });
  });
  
  const reorderBtns = document.querySelectorAll('.reorder-btn');
  reorderBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const orderCard = this.closest('.order-card');
      const orderNumber = orderCard.querySelector('.order-number').textContent;
      alert(`Adding items from ${orderNumber} to your cart`);
      // In a real application, this would add the items to the cart
    });
  });

  // Wishlist Interactions
  const addToCartBtns = document.querySelectorAll('.add-to-cart-btn');
  addToCartBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const productCard = this.closest('.wishlist-product');
      const productName = productCard.querySelector('.wishlist-product-name').textContent;
      alert(`Added ${productName} to your cart`);
      
      // Update cart count (just for UI demonstration)
      const cartCount = document.querySelector('.cart-count');
      if (cartCount) {
        cartCount.textContent = parseInt(cartCount.textContent) + 1;
      }
    });
  });
  
  const removeWishlistBtns = document.querySelectorAll('.remove-btn');
  removeWishlistBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const productCard = this.closest('.wishlist-product');
      const productName = productCard.querySelector('.wishlist-product-name').textContent;
      
      if (confirm(`Remove ${productName} from your wishlist?`)) {
        // Animate removal
        productCard.style.opacity = '0';
        setTimeout(() => {
          productCard.style.display = 'none';
          
          // Check if wishlist is empty
          const visibleProducts = document.querySelectorAll('.wishlist-product[style="display: none;"]');
          const totalProducts = document.querySelectorAll('.wishlist-product').length;
          
          if (visibleProducts.length === totalProducts) {
            document.querySelector('.wishlist-empty-state').style.display = 'block';
          }
        }, 300);
      }
    });
  });

  // Subscriptions Interactions
  const customizeBtn = document.querySelector('.customize-btn');
  if (customizeBtn) {
    customizeBtn.addEventListener('click', function() {
      alert('Opening box customization options');
      // In a real application, this would open a modal or redirect to a customization page
    });
  }
  
  const skipDeliveryBtn = document.querySelector('.skip-delivery-btn');
  if (skipDeliveryBtn) {
    skipDeliveryBtn.addEventListener('click', function() {
      if (confirm('Are you sure you want to skip your next delivery on May 6, 2025?')) {
        alert('Your next delivery has been skipped');
        this.textContent = 'Delivery Skipped';
        this.disabled = true;
      }
    });
  }
  
  const cancelSubscriptionBtn = document.querySelector('.cancel-subscription-btn');
  if (cancelSubscriptionBtn) {
    cancelSubscriptionBtn.addEventListener('click', function() {
      if (confirm('Are you sure you want to cancel your subscription?')) {
        if (confirm('Would you like to provide feedback on why you\'re cancelling?')) {
          prompt('Please tell us why you\'re cancelling your subscription:');
        }
        alert('Your subscription has been cancelled');
      }
    });
  }
  
  const subscribeBtns = document.querySelectorAll('.subscribe-btn');
  subscribeBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const option = this.closest('.subscription-option');
      const planName = option.querySelector('h4').textContent;
      alert(`Starting subscription process for ${planName}`);
      // In a real application, this would redirect to a subscription sign-up page
    });
  });

  // Settings Interactions
  const toggleSwitches = document.querySelectorAll('.toggle-switch input[type="checkbox"]');
  toggleSwitches.forEach(toggle => {
    toggle.addEventListener('change', function() {
      const settingName = this.id;
      const isEnabled = this.checked;
      console.log(`Setting ${settingName} is now ${isEnabled ? 'enabled' : 'disabled'}`);
      // In a real application, this would update the user's preferences in the database
    });
  });
  
  const settingsSelects = document.querySelectorAll('.settings-select');
  settingsSelects.forEach(select => {
    select.addEventListener('change', function() {
      const settingName = this.id;
      const selectedValue = this.value;
      console.log(`Setting ${settingName} changed to ${selectedValue}`);
      // In a real application, this would update the user's preferences in the database
    });
  });
  
  const saveSettingsBtn = document.querySelector('.save-settings-btn');
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', function() {
      alert('Settings saved successfully');
    });
  }
  
  const resetSettingsBtn = document.querySelector('.reset-settings-btn');
  if (resetSettingsBtn) {
    resetSettingsBtn.addEventListener('click', function() {
      if (confirm('Are you sure you want to reset all settings to default?')) {
        // Reset toggle switches
        toggleSwitches.forEach(toggle => {
          toggle.checked = toggle.id === 'order-updates' || 
                           toggle.id === 'promotional-emails' || 
                           toggle.id === 'sms-notifications' || 
                           toggle.id === 'contactless-delivery';
        });
        
        // Reset selects
        document.getElementById('preferred-time').value = 'afternoon';
        document.getElementById('language').value = 'en';
        document.getElementById('currency').value = 'usd';
        
        // Reset delivery instructions
        document.querySelector('.delivery-instructions').value = 'Leave with security if not at home.';
        
        alert('Settings have been reset to default');
      }
    });
  }

  // Payment Method Interactions
  const editPaymentBtns = document.querySelectorAll('.edit-payment-btn');
  editPaymentBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const paymentMethod = this.closest('.payment-method');
      const paymentName = paymentMethod.querySelector('.payment-name').textContent;
      alert(`Editing payment method: ${paymentName}`);
      // In a real application, this would open a payment method edit form
    });
  });
  
  const removePaymentBtns = document.querySelectorAll('.remove-payment-btn');
  removePaymentBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const paymentMethod = this.closest('.payment-method');
      const paymentName = paymentMethod.querySelector('.payment-name').textContent;
      
      if (confirm(`Are you sure you want to remove ${paymentName}?`)) {
        // Check if this is the default payment method
        const isDefault = paymentMethod.querySelector('.default-badge');
        if (isDefault) {
          alert('Cannot remove default payment method. Please set another payment method as default first.');
          return;
        }
        
        // Animate removal
        paymentMethod.style.opacity = '0';
        setTimeout(() => {
          paymentMethod.style.display = 'none';
        }, 300);
      }
    });
  });
  
  const setDefaultBtns = document.querySelectorAll('.set-default-btn');
  setDefaultBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      // Remove default badge from current default
      const currentDefault = document.querySelector('.default-badge');
      if (currentDefault) {
        const defaultParent = currentDefault.closest('.payment-actions');
        currentDefault.remove();
        
        // Add "Set as Default" button to the previous default
        const setDefaultBtn = document.createElement('button');
        setDefaultBtn.className = 'set-default-btn';
        setDefaultBtn.textContent = 'Set as Default';
        setDefaultBtn.addEventListener('click', function() {
          alert('This would set a new default payment method');
        });
        defaultParent.prepend(setDefaultBtn);
      }
      
      // Add default badge to new default
      const paymentActions = this.closest('.payment-actions');
      this.remove();
      
      const defaultBadge = document.createElement('span');
      defaultBadge.className = 'default-badge';
      defaultBadge.textContent = 'Default';
      paymentActions.prepend(defaultBadge);
      
      const paymentName = this.closest('.payment-method').querySelector('.payment-name').textContent;
      alert(`${paymentName} is now your default payment method`);
    });
  });
  
  const addPaymentBtn = document.querySelector('.add-payment-btn');
  if (addPaymentBtn) {
    addPaymentBtn.addEventListener('click', function() {
      alert('Opening add payment method form');
      // In a real application, this would open a form to add a new payment method
    });
  }

  // Dashboard functionality
  // Initialize the dashboard if elements exist
  if (document.getElementById('statsTab')) {
    // Update stats summary
    updateStatsSummary();
    
    // Render all charts and tables
    renderCategoryPieChart();
    renderRecentOrders();
    renderMonthlyBarChart();
    renderTransactionsTable();
    
    // Set up time range change
    const timeRange = document.getElementById('timeRange');
    if (timeRange) {
      timeRange.addEventListener('change', function() {
        // In a real application, you would fetch new data based on the selected time range
        console.log(`Time range changed to: ${this.value}`);
      });
    }
  }
});

// Dashboard helper functions
function updateStatsSummary() {
  const totalSpent = purchaseData.transactions.reduce((sum, transaction) => sum + transaction.total, 0);
  const ordersCount = purchaseData.transactions.length;
  const avgOrder = totalSpent / ordersCount;
  
  const totalSpentEl = document.getElementById('totalSpent');
  const ordersCountEl = document.getElementById('ordersCount');
  const avgOrderEl = document.getElementById('avgOrder');
  
  if (totalSpentEl) totalSpentEl.textContent = `$${totalSpent.toFixed(2)}`;
  if (ordersCountEl) ordersCountEl.textContent = ordersCount;
  if (avgOrderEl) avgOrderEl.textContent = `$${avgOrder.toFixed(2)}`;
}

function renderCategoryPieChart() {
  const pieChart = document.getElementById('categoryPieChart');
  const pieLegend = document.getElementById('pieLegend');
  
  if (!pieChart || !pieLegend) return;
  
  // Clear any existing content
  pieChart.innerHTML = '';
  pieLegend.innerHTML = '';
  
  // Calculate total for percentages
  const total = purchaseData.categoryData.reduce((sum, category) => sum + category.value, 0);
  
  // Create slices
  let startAngle = 0;
  purchaseData.categoryData.forEach(category => {
    const percentage = category.value / total;
    const degrees = percentage * 360;
    
    const slice = document.createElement('div');
    slice.className = 'pie-slice';
    slice.style.backgroundColor = category.color;
    slice.style.transform = `rotate(${startAngle}deg)`;
    slice.style.clipPath = `polygon(50% 50%, 100% 50%, 100% 0, 0 0)`;
    
    // For slices larger than 180 degrees, we need to adjust the clip-path
    if (degrees > 180) {
      slice.style.clipPath = `polygon(50% 50%, 100% 50%, 100% 0, 0 0, 0 100%, 100% 100%)`;
      
      // Add a second slice for the remaining portion
      const remainingSlice = document.createElement('div');
      remainingSlice.className = 'pie-slice';
      remainingSlice.style.backgroundColor = category.color;
      remainingSlice.style.transform = `rotate(${startAngle + 180}deg)`;
      remainingSlice.style.clipPath = `polygon(50% 50%, 100% 50%, 100% 100%, 0 100%, 0 0, ${(degrees - 180) / 180 * 50}% 0)`;
      pieChart.appendChild(remainingSlice);
    }
    
    pieChart.appendChild(slice);
    
    // Add legend item
    const legendItem = document.createElement('div');
    legendItem.className = 'legend-item';
    
    const colorBox = document.createElement('div');
    colorBox.className = 'legend-color';
    colorBox.style.backgroundColor = category.color;
    
    const nameText = document.createElement('span');
    nameText.textContent = `${category.name} (${(percentage * 100).toFixed(0)}%)`;
    
    legendItem.appendChild(colorBox);
    legendItem.appendChild(nameText);
    pieLegend.appendChild(legendItem);
    
    startAngle += degrees;
  });
}

function renderRecentOrders() {
  const recentOrdersList = document.getElementById('recentOrdersList');
  if (!recentOrdersList) return;
  
  recentOrdersList.innerHTML = '';
  
  // Display just the 3 most recent orders
  purchaseData.transactions.slice(0, 3).forEach(transaction => {
    const orderItem = document.createElement('div');
    orderItem.className = 'order-item';
    
    const orderHeader = document.createElement('div');
    orderHeader.className = 'order-header';
    
    const orderNumber = document.createElement('span');
    orderNumber.className = 'order-number';
    orderNumber.textContent = `Order #${transaction.id}`;
    
    const orderDate = document.createElement('span');
    orderDate.className = 'order-date';
    orderDate.textContent = transaction.date;
    
    orderHeader.appendChild(orderNumber);
    orderHeader.appendChild(orderDate);
    
    const orderProducts = document.createElement('div');
    orderProducts.className = 'order-products';
    orderProducts.textContent = transaction.items.join(', ');
    
    const orderTotal = document.createElement('div');
    orderTotal.className = 'order-total';
    orderTotal.textContent = `$${transaction.total.toFixed(2)}`;
    
    orderItem.appendChild(orderHeader);
    orderItem.appendChild(orderProducts);
    orderItem.appendChild(orderTotal);
    
    recentOrdersList.appendChild(orderItem);
  });
}

function renderMonthlyBarChart() {
  const barChart = document.getElementById('monthlyBarChart');
  const xAxis = document.getElementById('xAxis');
  const yAxis = document.getElementById('yAxis');
  
  if (!barChart || !xAxis || !yAxis) return;
  
  // Clear existing content
  barChart.innerHTML = '';
  xAxis.innerHTML = '';
  yAxis.innerHTML = '';
  
  // Find max value for scaling
  const maxAmount = Math.max(...purchaseData.monthlyData.map(month => month.amount));
  const roundedMax = Math.ceil(maxAmount / 20) * 20; // Round up to nearest 20
  
  // Create Y-axis labels
  for (let i = 5; i >= 0; i--) {
    const value = (roundedMax / 5) * i;
    const label = document.createElement('div');
    label.textContent = `$${value}`;
    yAxis.appendChild(label);
  }
  
  // Create bars and X-axis labels
  purchaseData.monthlyData.forEach(month => {
    // Create bar container
    const barContainer = document.createElement('div');
    barContainer.className = 'bar-container';
    
    // Create bar with height relative to max value
    const bar = document.createElement('div');
    bar.className = 'bar';
    const heightPercentage = (month.amount / roundedMax) * 100;
    bar.style.height = `${heightPercentage}%`;
    
    // Add value label
    const valueLabel = document.createElement('div');
    valueLabel.className = 'bar-value';
    valueLabel.textContent = `$${month.amount.toFixed(0)}`;
    bar.appendChild(valueLabel);
    
    barContainer.appendChild(bar);
    barChart.appendChild(barContainer);
    
    // Add X-axis label
    const xLabel = document.createElement('div');
    xLabel.textContent = month.name;
    xAxis.appendChild(xLabel);
  });
}

function renderTransactionsTable() {
  const tableBody = document.getElementById('transactionsTableBody');
  if (!tableBody) return;
  
  tableBody.innerHTML = '';
  
  purchaseData.transactions.forEach(transaction => {
    const row = document.createElement('tr');
    
    // Order ID cell
    const idCell = document.createElement('td');
    idCell.textContent = `#${transaction.id}`;
    row.appendChild(idCell);
    
    // Date cell
    const dateCell = document.createElement('td');
    dateCell.textContent = transaction.date;
    row.appendChild(dateCell);
    
    // Items cell
    const itemsCell = document.createElement('td');
    itemsCell.className = 'item-cell';
    itemsCell.textContent = transaction.items.join(', ');
    row.appendChild(itemsCell);
    
    // Total cell
    const totalCell = document.createElement('td');
    totalCell.textContent = `$${transaction.total.toFixed(2)}`;
    totalCell.style.textAlign = 'right';
    row.appendChild(totalCell);
    
    // Actions cell
    const actionsCell = document.createElement('td');
    actionsCell.className = 'action-cell';
    
    const viewBtn = document.createElement('button');
    viewBtn.className = 'action-btn view-btn';
    viewBtn.textContent = 'View';
    viewBtn.addEventListener('click', () => {
      alert(`Viewing details for order #${transaction.id}`);
    });
    
    const reorderBtn = document.createElement('button');
    reorderBtn.className = 'action-btn reorder-btn';
    reorderBtn.textContent = 'Reorder';
    reorderBtn.addEventListener('click', () => {
      alert(`Reordering items from order #${transaction.id}`);
    });
    
    actionsCell.appendChild(viewBtn);
    actionsCell.appendChild(reorderBtn);
    row.appendChild(actionsCell);
    
    tableBody.appendChild(row);
  });
}