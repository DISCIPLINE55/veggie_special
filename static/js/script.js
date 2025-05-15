document.addEventListener('DOMContentLoaded', function() {
  // Ensure all code blocks are properly closed
});

  document.addEventListener('DOMContentLoaded', function() {
    // Add event listener for Read Full Article buttons
    const readMoreButtons = document.querySelectorAll('.read-more-btn');
    readMoreButtons.forEach(button => {
      button.addEventListener('click', function(e) {
        e.preventDefault();
        const articleId = this.dataset.article;
        const article = document.getElementById(articleId);
        if (article) {
          article.classList.toggle('expanded');
          this.textContent = article.classList.contains('expanded') ? 'Read Less' : 'Read Full Article';
        }
      });
    });

    // Initialize the site
    loadProducts();
    setupEventListeners();
    setupModals();
    setupNotificationCSS();
    initializeFilters();
    initializeFAQ();
    initializeQuickView();
    initializePagination();
    initializeCouponSystem();
  });

  
  
  // Global cart object
  const cart = {
    items: [],
    subtotal: 0,
    delivery: 0,
    tax: 0,
    total: 0
  };
  
  // Load products into product container
  function loadProducts(filter = 'all') {
    const productContainer = document.getElementById('products-container');
    if (!productContainer) return;
    
    productContainer.innerHTML = '';
    
    // Check if products variable exists globally
    if (typeof products !== 'undefined') {
      const filteredProducts = filter === 'all' 
          ? products 
          : products.filter(product => product.category === filter);
      
      filteredProducts.forEach(product => {
          const productCard = createProductCard(product);
          productContainer.appendChild(productCard);
      });
    } else {
      console.error("Products data is not defined. Make sure products.js is loaded before this script.");
      productContainer.innerHTML = '<div class="error-message">Unable to load products. Please try again later.</div>';
    }
  }
  
  // Create a product card element
  function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.id = product.id;
    
    const priceDisplay = product.sale 
        ? `<span class="price-sale">₵${product.salePrice.toFixed(2)}</span>
           <span class="price-original">₵${product.price.toFixed(2)}</span>` 
        : `<span class="price">₵${product.price.toFixed(2)}</span>`;
    
    const organicBadge = product.organic 
        ? '<span class="product-badge organic">Organic</span>' 
        : '';
    
    const saleBadge = product.sale 
        ? '<span class="product-badge sale">Sale</span>' 
        : '';
    
    card.innerHTML = `
        <div class="product-badges">
            ${organicBadge}
            ${saleBadge}
        </div>
        <div class="product-image" style="background-image: url(${product.image})"></div>
        <div class="product-info">
            <h3 class="product-name">${product.name}</h3>
            <p class="product-farm">${product.farmName}</p>
            <div class="product-rating">
                <span class="stars">${generateStarsHTML(product.rating)}</span>
                <span class="rating-score">${product.rating}</span>
                <span class="review-count">(${product.reviews})</span>
            </div>
            <div class="product-price">
                ${priceDisplay}
                <span class="product-unit">/ ${product.unit}</span>
            </div>
        </div>
        <div class="product-actions">
            <div class="quantity-control">
                <button class="quantity-btn minus">-</button>
                <input type="number" class="quantity-input" value="1" min="1" max="99">
                <button class="quantity-btn plus">+</button>
            </div>
            <button class="add-to-cart-btn" data-id="${product.id}">Add to Cart</button>
        </div>
    `;
    
    return card;
  }
  
  /**
   * Generates HTML for star ratings
   * @param {number} rating - Rating value (0-5)
   * @returns {string} - HTML string for stars
   */
  function generateStarsHTML(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    let starsHTML = '';
    
    // Add full stars
    for (let i = 0; i < fullStars; i++) {
        starsHTML += '★';
    }
    
    // Add half star if needed
    if (halfStar) {
        starsHTML += '★';
    }
    
    // Add empty stars
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += '☆';
    }
    
    return starsHTML;
  }
  
  // Set up event listeners for the site
  function setupEventListeners() {
    // Filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Update active class
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Filter products
            const filter = this.dataset.filter;
            loadProducts(filter);
        });
    });
    
    // Product search
    const productSearch = document.querySelector('.product-search');
    const productSearchBtn = document.querySelector('.product-search-btn');
    
    if (productSearchBtn) {
        productSearchBtn.addEventListener('click', function() {
            searchProducts(productSearch ? productSearch.value : '');
        });
    }
    
    if (productSearch) {
        productSearch.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchProducts(productSearch.value);
            }
        });
    }
    
    // Delegate event for product cards (for dynamically added elements)
    document.addEventListener('click', function(e) {
        // Add to cart button
        if (e.target.classList.contains('add-to-cart-btn')) {
            const productId = parseInt(e.target.dataset.id);
            const productCard = e.target.closest('.product-card');
            const quantityInput = productCard.querySelector('.quantity-input');
            const quantity = parseInt(quantityInput.value);
            
            addToCart(productId, quantity);
        }
        
        // Quantity buttons
        if (e.target.classList.contains('quantity-btn')) {
            const input = e.target.closest('.quantity-control').querySelector('.quantity-input');
            let value = parseInt(input.value);
            
            if (e.target.classList.contains('plus')) {
                input.value = Math.min(value + 1, 99);
            } else if (e.target.classList.contains('minus')) {
                input.value = Math.max(value - 1, 1);
            }
        }
    });
    
    // View more button
    const viewMoreBtn = document.querySelector('.view-more-btn');
    if (viewMoreBtn) {
        viewMoreBtn.addEventListener('click', function() {
            // In a real application, this would load more products
            alert('In a real application, this would load more products from the server.');
        });
    }
  }
  
  // Search products function
  function searchProducts(query) {
    if (!query) {
        loadProducts('all');
        return;
    }
    
    // Check if products variable exists globally
    if (typeof products === 'undefined') {
      console.error("Products data is not defined. Make sure products.js is loaded before this script.");
      return;
    }
    
    query = query.toLowerCase();
    const productContainer = document.getElementById('products-container');
    productContainer.innerHTML = '';
    
    const filteredProducts = products.filter(product => {
        return product.name.toLowerCase().includes(query) || 
               product.category.toLowerCase().includes(query) ||
               product.description.toLowerCase().includes(query) ||
               product.farmName.toLowerCase().includes(query);
    });
    
    if (filteredProducts.length === 0) {
        productContainer.innerHTML = '<div class="no-results">No products found matching your search.</div>';
        return;
    }
    
    filteredProducts.forEach(product => {
        const productCard = createProductCard(product);
        productContainer.appendChild(productCard);
    });
  }
  
  // Add product to cart
  function addToCart(productId, quantity = 1) {
    // Check if products variable exists globally
    if (typeof products === 'undefined') {
      console.error("Products data is not defined. Make sure products.js is loaded before this script.");
      return;
    }
    
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const price = product.sale ? product.salePrice : product.price;
    
    // Check if product is already in cart
    const existingItem = cart.items.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.items.push({
            id: product.id,
            name: product.name,
            price: price,
            image: product.image,
            quantity: quantity,
            unit: product.unit
        });
    }
    
    // Update cart
    updateCart();
    
    // Show cart modal
    document.getElementById('cart-modal').style.display = 'flex';
    
    // Show notification
    showNotification(`Added ${product.name} to cart!`);
  }
  
  // Update cart calculations and display
  function updateCart() {
    // Calculations
    cart.subtotal = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    cart.delivery = cart.subtotal > 500 ? 0 : 20;
    cart.tax = cart.subtotal * 0.035; 
    cart.total = cart.subtotal + cart.delivery + cart.tax;
    
    // Update cart counter
    const totalItems = cart.items.reduce((count, item) => count + item.quantity, 0);
    const cartCountElement = document.querySelector('.cart-count');
    if (cartCountElement) {
      cartCountElement.textContent = totalItems;
    }
    
    // Update cart modal
    const cartItemsContainer = document.getElementById('cart-items');
    if (!cartItemsContainer) return;
    
    cartItemsContainer.innerHTML = '';
    
    if (cart.items.length === 0) {
        cartItemsContainer.innerHTML = '<div class="empty-cart-message">Your cart is empty.</div>';
    } else {
        cart.items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            itemElement.innerHTML = `
                <div class="cart-item-image" style="background-image: url(${item.image})"></div>
                <div class="cart-item-details">
                    <h4 class="cart-item-name">${item.name}</h4>
                    <div class="cart-item-price">₵${item.price.toFixed(2)} / ${item.unit}</div>
                    <div class="cart-item-controls">
                        <div class="quantity-control small">
                            <button class="quantity-btn minus" data-id="${item.id}">-</button>
                            <input type="number" class="quantity-input" value="${item.quantity}" min="1" max="99" data-id="${item.id}">
                            <button class="quantity-btn plus" data-id="${item.id}">+</button>
                        </div>
                        <button class="remove-item" data-id="${item.id}">Remove</button>
                    </div>
                </div>
                <div class="cart-item-total">₵${(item.price * item.quantity).toFixed(2)}</div>
            `;
            cartItemsContainer.appendChild(itemElement);
        });
    }
    
    // Update cart totals
    const subtotalElement = document.getElementById('cart-subtotal');
    const deliveryElement = document.getElementById('cart-delivery');
    const totalElement = document.getElementById('cart-total');
    
    if (subtotalElement) subtotalElement.textContent = cart.subtotal.toFixed(2);
    if (deliveryElement) deliveryElement.textContent = cart.delivery.toFixed(2);
    if (totalElement) totalElement.textContent = cart.total.toFixed(2);
    
    // Update checkout modal with cart items
    updateCheckoutSummary();
  }
  
  // Update checkout summary
  function updateCheckoutSummary() {
    const summaryItemsContainer = document.getElementById('summary-items');
    if (!summaryItemsContainer) return;
    
    summaryItemsContainer.innerHTML = '';
    
    cart.items.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'summary-item';
        itemElement.innerHTML = `
            <div class="summary-item-name">${item.name} <span class="summary-item-quantity">x${item.quantity}</span></div>
            <div class="summary-item-price">₵${(item.price * item.quantity).toFixed(2)}</div>
        `;
        summaryItemsContainer.appendChild(itemElement);
    });
    
    // Update summary totals
    const subtotalElement = document.getElementById('summary-subtotal');
    const deliveryElement = document.getElementById('summary-delivery');
    const taxElement = document.getElementById('summary-tax');
    const totalElement = document.getElementById('summary-total');
    
    if (subtotalElement) subtotalElement.textContent = cart.subtotal.toFixed(2);
    if (deliveryElement) deliveryElement.textContent = cart.delivery.toFixed(2);
    if (taxElement) taxElement.textContent = cart.tax.toFixed(2);
    if (totalElement) totalElement.textContent = cart.total.toFixed(2);
  }
  
  // Show notification
  function showNotification(message) {
    // Check if notification element exists, create if not
    let notification = document.querySelector('.notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    
    notification.textContent = message;
    notification.classList.add('show');
    
    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
  }
  
  // Setup modal functionality
  function setupModals() {
    // Cart modal
    const cartModal = document.getElementById('cart-modal');
    const cartButton = document.getElementById('cart-button');
    const closeCart = document.querySelector('.close-cart');
    const continueShopping = document.getElementById('continue-shopping');
    const emptyCart = document.getElementById('empty-cart');
    const checkoutBtn = document.getElementById('checkout-btn');
    
    if (cartButton) {
        cartButton.addEventListener('click', function() {
            cartModal.style.display = 'flex';
        });
    }
    
    if (closeCart) {
        closeCart.addEventListener('click', function() {
            cartModal.style.display = 'none';
        });
    }
    
    if (continueShopping) {
        continueShopping.addEventListener('click', function() {
            cartModal.style.display = 'none';
        });
    }
    
    if (emptyCart) {
        emptyCart.addEventListener('click', function() {
            cart.items = [];
            updateCart();
        });
    }
    
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function() {
            if (cart.items.length === 0) {
                showNotification('Your cart is empty!');
                return;
            }
            
            cartModal.style.display = 'none';
            document.getElementById('payment-modal').style.display = 'flex';
        });
    }
    
    // Payment modal logic
    const paymentModal = document.getElementById('payment-modal');
    const closePayment = document.querySelector('.close-payment');
    const backToCart = document.querySelector('.back-btn');
    const paymentForm = document.getElementById('payment-form');
  
    if (closePayment) {
        closePayment.addEventListener('click', () => {
            paymentModal.style.display = 'none';
        });
    }
  
    if (backToCart) {
        backToCart.addEventListener('click', () => {
            paymentModal.style.display = 'none';
            cartModal.style.display = 'flex';
        });
    }
  
    if (paymentForm) {
        paymentForm.addEventListener('submit', function (e) {
            e.preventDefault();
            completeOrder();
        });
    }
  
    // Payment method toggle
    const paymentMethods = document.querySelectorAll('input[name="payment-method"]');
    const creditCardDetails = document.getElementById('credit-card-details');
    const mobileMoneyDetails = document.getElementById('mobile-money-details');
  
    paymentMethods.forEach(method => {
        method.addEventListener('change', function () {
            if (creditCardDetails) creditCardDetails.style.display = 'none';
            if (mobileMoneyDetails) mobileMoneyDetails.style.display = 'none';
  
            if (this.value === 'credit-card' && creditCardDetails) {
                creditCardDetails.style.display = 'block';
            } else if (this.value === 'mobile-money' && mobileMoneyDetails) {
                mobileMoneyDetails.style.display = 'block';
            }
        });
    });
  
    // Receipt modal
    const receiptModal = document.getElementById('receipt-modal');
    const closeReceipt = document.getElementById('close-receipt');
    const printReceipt = document.getElementById('print-receipt');
  
    if (closeReceipt) {
        closeReceipt.addEventListener('click', () => {
            receiptModal.style.display = 'none';
        });
    }
  
    if (printReceipt) {
        printReceipt.addEventListener('click', () => {
            window.print();
        });
    }
  
    // Close modals when clicking outside
    window.addEventListener('click', function (e) {
        if (e.target === cartModal) cartModal.style.display = 'none';
        if (e.target === paymentModal) paymentModal.style.display = 'none';
        if (e.target === receiptModal) receiptModal.style.display = 'none'; // Fixed: was incorrectly using cartModal
    });
  }
  
  // Cart item quantity + removal logic
  document.addEventListener('click', function (e) {
    if (e.target.classList.contains('quantity-btn') && e.target.dataset.id) {
        const id = parseInt(e.target.dataset.id);
        const item = cart.items.find(item => item.id === id);
        if (!item) return;
  
        const input = e.target.closest('.quantity-control').querySelector('.quantity-input');
        let value = parseInt(input.value);
  
        if (e.target.classList.contains('plus')) {
            value = Math.min(value + 1, 99);
        } else if (e.target.classList.contains('minus')) {
            value = Math.max(value - 1, 1);
        }
  
        input.value = value;
        item.quantity = value;
        updateCart();
    }
  
    if (e.target.classList.contains('remove-item') && e.target.dataset.id) {
        const id = parseInt(e.target.dataset.id);
        cart.items = cart.items.filter(item => item.id !== id);
        updateCart();
    }
  });
  
  // Complete order
  function completeOrder() {
    // Get customer info
    const firstName = document.getElementById('first-name')?.value || '';
    const lastName = document.getElementById('last-name')?.value || '';
    const email = document.getElementById('email')?.value || '';
    const address = document.getElementById('address')?.value || '';
    const city = document.getElementById('city')?.value || '';
    const state = document.getElementById('state')?.value || '';
    const zip = document.getElementById('zip')?.value || '';
  
    const orderNumber = Math.floor(100000 + Math.random() * 900000);
    const today = new Date();
  
    // Check if elements exist before setting their content
    const receiptDateElem = document.getElementById('receipt-date');
    if (receiptDateElem) receiptDateElem.textContent = today.toLocaleDateString();
    
    const customerNameElem = document.getElementById('customer-name');
    if (customerNameElem) customerNameElem.textContent = `${firstName} ${lastName}`;
    
    const customerEmailElem = document.getElementById('customer-email');
    if (customerEmailElem) customerEmailElem.textContent = email;
    
    const customerAddressElem = document.getElementById('customer-address');
    if (customerAddressElem) customerAddressElem.textContent = `${address}, ${city}, ${state} ${zip}`;
  
    const deliveryMethodRadio = document.querySelector('input[name="delivery"]:checked');
    const deliveryMethod = deliveryMethodRadio ? deliveryMethodRadio.value : 'standard';
    
    const deliveryMethodElem = document.getElementById('delivery-method');
    if (deliveryMethodElem) {
      deliveryMethodElem.textContent = deliveryMethod === 'standard' ? 'Standard Delivery' : 'Express Delivery';
    }
  
    const deliveryDate = new Date(today);
    deliveryDate.setDate(deliveryDate.getDate() + (deliveryMethod === 'standard' ? 3 : 1));
    
    const deliveryEstimateElem = document.getElementById('delivery-estimate');
    if (deliveryEstimateElem) {
      deliveryEstimateElem.textContent = `Estimated delivery: ${deliveryDate.toLocaleDateString()}`;
    }
  
    const orderNumberElem = document.getElementById('order-number');
    if (orderNumberElem) orderNumberElem.textContent = orderNumber;
  
    // Receipt items
    const receiptItemsList = document.getElementById('receipt-items-list');
    if (receiptItemsList) {
      receiptItemsList.innerHTML = '';
  
      cart.items.forEach(item => {
          const itemElement = document.createElement('div');
          itemElement.className = 'receipt-item';
          itemElement.innerHTML = `
              <div class="receipt-item-name">${item.name} <span class="receipt-item-quantity">x${item.quantity}</span></div>
              <div class="receipt-item-price">₵${(item.price * item.quantity).toFixed(2)}</div>
          `;
          receiptItemsList.appendChild(itemElement);
      });
  
      // Update totals
      const receiptSubtotalElem = document.getElementById('receipt-subtotal');
      if (receiptSubtotalElem) receiptSubtotalElem.textContent = cart.subtotal.toFixed(2);
      
      const receiptDeliveryElem = document.getElementById('receipt-delivery');
      if (receiptDeliveryElem) receiptDeliveryElem.textContent = cart.delivery.toFixed(2);
      
      const receiptTaxElem = document.getElementById('receipt-tax');
      if (receiptTaxElem) receiptTaxElem.textContent = cart.tax.toFixed(2);
      
      const receiptTotalElem = document.getElementById('receipt-total');
      if (receiptTotalElem) receiptTotalElem.textContent = cart.total.toFixed(2);
    }
  
    // Final UI update
    const paymentModal = document.getElementById('payment-modal');
    const receiptModal = document.getElementById('receipt-modal');
    
    if (paymentModal) paymentModal.style.display = 'none';
    if (receiptModal) receiptModal.style.display = 'flex';
  
    cart.items = [];
    updateCart();
  }
  
  // Add CSS for the notification
  function setupNotificationCSS() {
    const existingStyle = document.getElementById('notification-style');
    if (existingStyle) return; // Don't add duplicate styles
  
    const style = document.createElement('style');
    style.id = 'notification-style';
    style.textContent = `
    .notification {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background-color: #4CAF50;
      color: white;
      padding: 15px 25px;
      border-radius: 5px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      transform: translateY(100px);
      opacity: 0;
      transition: all 0.3s ease;
      z-index: 1000;
    }
  
    .notification.show {
      transform: translateY(0);
      opacity: 1;
    }
    `;
    document.head.appendChild(style);
  }
  
  /* Initialize FAQ Interactivity */
  function initializeFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        if (question) {
          question.addEventListener('click', () => {
              // Close all other items
              faqItems.forEach(otherItem => {
                  if (otherItem !== item) {
                      otherItem.classList.remove('active');
                  }
              });
              
              // Toggle current item
              item.classList.toggle('active');
          });
        }
    });
  }
  
  // Initialize filters
  function initializeFilters() {
    const categoryFilter = document.getElementById('category-filter');
    const sortFilter = document.getElementById('sort-filter');
    const farmFilter = document.getElementById('farm-filter');
    const searchInput = document.getElementById('product-search');
    const searchButton = document.querySelector('.filter-search-btn');
    const filterBadges = document.querySelectorAll('.filter-badge');
    
    // Skip if filters don't exist on this page
    if (!categoryFilter && !sortFilter && !farmFilter) return;
    
    // Current filter state
    const currentFilters = {
        category: 'all',
        sort: 'featured',
        farm: 'all',
        search: '',
        organic: false,
        sale: false,
        inStock: false
    };
    
    // Category filter change
    if (categoryFilter) {
      categoryFilter.addEventListener('change', () => {
          currentFilters.category = categoryFilter.value;
          applyFilters(currentFilters);
      });
    }
    
    // Sort filter change
    if (sortFilter) {
      sortFilter.addEventListener('change', () => {
          currentFilters.sort = sortFilter.value;
          applyFilters(currentFilters);
      });
    }
    
    // Farm filter change
    if (farmFilter) {
      farmFilter.addEventListener('change', () => {
          currentFilters.farm = farmFilter.value;
          applyFilters(currentFilters);
      });
    }
    
    // Search functionality
    if (searchButton && searchInput) {
      searchButton.addEventListener('click', () => {
          currentFilters.search = searchInput.value.trim();
          applyFilters(currentFilters);
      });
    }
    
    // Search on Enter key
    if (searchInput) {
      searchInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
              currentFilters.search = searchInput.value.trim();
              applyFilters(currentFilters);
          }
      });
    }
    
    // Filter badges (Organic, Sale, In Stock)
    filterBadges.forEach(badge => {
        badge.addEventListener('click', () => {
            const filterType = badge.dataset.filter;
            currentFilters[filterType] = !currentFilters[filterType];
            
            // Toggle active class
            if (currentFilters[filterType]) {
                badge.classList.add('active');
                badge.style.backgroundColor = '#c8e6c9';
            } else {
                badge.classList.remove('active');
                badge.style.backgroundColor = '#e8f5e9';
            }
            
            applyFilters(currentFilters);
        });
    });
  }
  
  // Apply filters to products
  function applyFilters(filters) {
    // Check if products variable exists globally
    if (typeof products === 'undefined') {
      console.error("Products data is not defined. Make sure products.js is loaded before this script.");
      return;
    }
    
    // Start with all products
    let filteredProducts = [...products];
    
    // Apply category filter
    if (filters.category && filters.category !== 'all') {
        filteredProducts = filteredProducts.filter(product => product.category === filters.category);
    }
    
    // Apply farm filter
    if (filters.farm && filters.farm !== 'all') {
        filteredProducts = filteredProducts.filter(product => product.farmName === filters.farm);
    }
    
    // Apply search term filter
    if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredProducts = filteredProducts.filter(product => 
            product.name.toLowerCase().includes(searchTerm) || 
            product.description?.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm) ||
            product.farmName.toLowerCase().includes(searchTerm)
        );
    }
    
    // Apply organic filter
    if (filters.organic) {
        filteredProducts = filteredProducts.filter(product => product.organic);
    }
    
    // Apply sale filter
    if (filters.sale) {
        filteredProducts = filteredProducts.filter(product => product.sale);
    }
    
    // Apply in-stock filter
    if (filters.inStock) {
        filteredProducts = filteredProducts.filter(product => product.inStock);
    }
    
    // Apply sorting
    if (filters.sort) {
        switch (filters.sort) {
            case 'price-low':
                filteredProducts.sort((a, b) => (a.sale ? a.salePrice : a.price) - (b.sale ? b.salePrice : b.price));
                break;
            case 'price-high':
                filteredProducts.sort((a, b) => (b.sale ? b.salePrice : b.price) - (a.sale ? a.salePrice : a.price));
                break;
            case 'name-asc':
                filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'name-desc':
                filteredProducts.sort((a, b) => b.name.localeCompare(a.name));
                break;
            case 'rating':
                filteredProducts.sort((a, b) => b.rating - a.rating);
                break;
        }
    }
    // Display filtered products
const productsContainer = document.getElementById('products-container') || document.getElementById('products-grid');
if (productsContainer) {
  productsContainer.innerHTML = '';
  
  if (filteredProducts.length === 0) {
    productsContainer.innerHTML = '<div class="no-results">No products found matching your criteria.</div>';
    return;
  }
  
  filteredProducts.forEach(product => {
    const productCard = createProductCard(product);
    productsContainer.appendChild(productCard);
  });
  
  // Update products count display if it exists
  const productsCountElement = document.getElementById('products-count');
  if (productsCountElement) {
    productsCountElement.textContent = `Showing ${filteredProducts.length} products`;
  }
  
  // Reset pagination if needed
  resetPagination(filteredProducts.length);
}

/**
 * Resets pagination based on the number of products
 * @param {number} totalProducts - Total number of products
 */
function resetPagination(totalProducts) {
  const pagination = document.querySelector('.pagination');
  if (!pagination) return;
  
  const pageButtons = pagination.querySelectorAll('.page-btn');
  const productsPerPage = 12; // Adjust based on your design
  const totalPages = Math.ceil(totalProducts / productsPerPage);
  
  // Hide unnecessary page buttons
  pageButtons.forEach((button, index) => {
    // Skip 'Previous' and 'Next' buttons
    if (button.textContent === 'Previous' || button.textContent === 'Next') return;
    
    const pageNum = parseInt(button.textContent);
    if (pageNum <= totalPages) {
      button.style.display = 'flex';
    } else {
      button.style.display = 'none';
    }
  });
  
  // Reset active page to 1
  pageButtons.forEach(button => button.classList.remove('active'));
  const firstPageBtn = Array.from(pageButtons).find(btn => btn.textContent === '1');
  if (firstPageBtn) {
    firstPageBtn.classList.add('active');
  }
  
  // Disable 'Previous' button on first page
  const prevButton = Array.from(pageButtons).find(btn => btn.textContent === 'Previous');
  if (prevButton) {
    prevButton.classList.add('disabled');
  }
  
  // Adjust 'Next' button state
  const nextButton = Array.from(pageButtons).find(btn => btn.textContent === 'Next');
  if (nextButton) {
    if (totalPages <= 1) {
      nextButton.classList.add('disabled');
    } else {
      nextButton.classList.remove('disabled');
    }
  }
}

/**
 * Updates the sort order dropdown based on current selection
 * @param {string} sortOrder - Current sort order
 */
function updateSortDisplay(sortOrder) {
  const sortDropdown = document.getElementById('sort-filter');
  if (sortDropdown) {
    sortDropdown.value = sortOrder;
  }
}

/**
 * Updates the active filter badges display
 * @param {Object} activeFilters - Object containing active filter states
 */
function updateFilterBadges(activeFilters) {
  const filterBadges = document.querySelectorAll('.filter-badge');
  
  filterBadges.forEach(badge => {
    const filterType = badge.dataset.filter;
    if (activeFilters[filterType]) {
      badge.classList.add('active');
      badge.style.backgroundColor = '#c8e6c9';
    } else {
      badge.classList.remove('active');
      badge.style.backgroundColor = '#e8f5e9';
    }
  });
}

/**
 * Exports the current products view for printing or sharing
 */
function exportProductsView() {
  // Implementation for exporting the current product view
  // This could generate a printable version or share link
  alert('Export functionality would be implemented here!');
}

// Add event listeners for sort and filter changes
document.addEventListener('DOMContentLoaded', function() {
  // Additional initialization if needed
  const exportButton = document.getElementById('export-products');
  if (exportButton) {
    exportButton.addEventListener('click', exportProductsView);
  }
  
  // Mobile filter toggle
  const mobileFilterToggle = document.getElementById('mobile-filter-toggle');
  const filterSidebar = document.querySelector('.product-filters');
  
  if (mobileFilterToggle && filterSidebar) {
    mobileFilterToggle.addEventListener('click', function() {
      filterSidebar.classList.toggle('show-mobile');
    });
  }
});
      
      // Initialize filters and FAQ
      initializeFilters();
      initializeFAQ();
      
      // Setup modals and notifications
      setupModals();
      setupNotificationCSS();
      
      // Load initial products
      loadProducts('all');
      
      // Setup event listeners for the site
      setupEventListeners();
    }



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
});


// Fix math calculations in cart
function updateCart() {
  // Calculations with proper precision
  cart.subtotal = parseFloat(cart.items.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2));
  cart.delivery = cart.subtotal > 500 ? 0 : 20;
  cart.tax = parseFloat((cart.subtotal * 0.035).toFixed(2)); // 3.5% VAT rate with proper rounding
  cart.total = parseFloat((cart.subtotal + cart.delivery + cart.tax).toFixed(2));
  
  // Apply any active coupon discount
  if (cart.couponDiscount > 0) {
    cart.total = parseFloat((cart.total - cart.couponDiscount).toFixed(2));
  }
  
  // Update cart counter
  const totalItems = cart.items.reduce((count, item) => count + item.quantity, 0);
  const cartCountElement = document.querySelector('.cart-count');
  if (cartCountElement) {
    cartCountElement.textContent = totalItems;
  }
  
  // Update cart modal
  const cartItemsContainer = document.getElementById('cart-items');
  if (!cartItemsContainer) return;
  
  cartItemsContainer.innerHTML = '';
  
  // Handle empty cart state
  if (cart.items.length === 0) {
    cartItemsContainer.innerHTML = '<div class="empty-cart-message">Your cart is empty.</div>';
    
    // Disable checkout button when cart is empty
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
      checkoutBtn.disabled = true;
      checkoutBtn.classList.add('disabled');
    }
    
    // Reset coupon if cart is empty
    cart.couponDiscount = 0;
    const couponInput = document.getElementById('coupon-code');
    if (couponInput) couponInput.value = '';
    const couponMessage = document.getElementById('coupon-message');
    if (couponMessage) couponMessage.textContent = '';
  } else {
    // Enable checkout button when cart has items
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
      checkoutBtn.disabled = false;
      checkoutBtn.classList.remove('disabled');
    }
    
    // Populate cart items
    cart.items.forEach(item => {
      const itemElement = document.createElement('div');
      itemElement.className = 'cart-item';
      itemElement.innerHTML = `
          <div class="cart-item-image" style="background-image: url(${item.image})"></div>
          <div class="cart-item-details">
              <h4 class="cart-item-name">${item.name}</h4>
              <div class="cart-item-price">₵${item.price.toFixed(2)} / ${item.unit}</div>
              <div class="cart-item-controls">
                  <div class="quantity-control small">
                      <button class="quantity-btn minus" data-id="${item.id}">-</button>
                      <input type="number" class="quantity-input" value="${item.quantity}" min="1" max="99" data-id="${item.id}">
                      <button class="quantity-btn plus" data-id="${item.id}">+</button>
                  </div>
                  <button class="remove-item" data-id="${item.id}">Remove</button>
              </div>
          </div>
          <div class="cart-item-total">₵${(item.price * item.quantity).toFixed(2)}</div>
      `;
      cartItemsContainer.appendChild(itemElement);
    });
  }
  
  // Update cart totals
  const subtotalElement = document.getElementById('cart-subtotal');
  const deliveryElement = document.getElementById('cart-delivery');
  const taxElement = document.getElementById('cart-tax');
  const totalElement = document.getElementById('cart-total');
  const couponDiscountElement = document.getElementById('coupon-discount');
  
  if (subtotalElement) subtotalElement.textContent = cart.subtotal.toFixed(2);
  if (deliveryElement) deliveryElement.textContent = cart.delivery.toFixed(2);
  if (taxElement) taxElement.textContent = cart.tax.toFixed(2);
  if (totalElement) totalElement.textContent = cart.total.toFixed(2);
  
  // Display coupon discount if applicable
  if (couponDiscountElement) {
    if (cart.couponDiscount > 0) {
      couponDiscountElement.textContent = `-${cart.couponDiscount.toFixed(2)}`;
      couponDiscountElement.parentElement.style.display = 'flex';
    } else {
      couponDiscountElement.parentElement.style.display = 'none';
    }
  }
  
  // Update checkout modal with cart items
  updateCheckoutSummary();
}

// Add coupon system
function initializeCouponSystem() {
  // Add coupon property to cart object if it doesn't exist
  if (!cart.hasOwnProperty('couponDiscount')) {
    cart.couponDiscount = 0;
  }
  
  // Create coupon section if it doesn't exist
  const cartTotals = document.querySelector('.cart-totals');
  if (cartTotals) {
    // Check if coupon section already exists
    let couponSection = document.getElementById('coupon-section');
    if (!couponSection) {
      // Create coupon section HTML
      couponSection = document.createElement('div');
      couponSection.id = 'coupon-section';
      couponSection.className = 'coupon-section';
      couponSection.innerHTML = `
        <div class="coupon-input-group">
          <input type="text" id="coupon-code" placeholder="Enter coupon code" class="coupon-input">
          <button id="apply-coupon" class="coupon-btn">Apply</button>
        </div>
        <div id="coupon-message" class="coupon-message"></div>
        <div class="cart-total-row coupon-discount-row" style="display: none;">
          <span>Discount:</span>
          <span id="coupon-discount">-₵0.00</span>
        </div>
      `;
      
      // Insert before the total line
      const totalRow = cartTotals.querySelector('.cart-total-row:last-child');
      if (totalRow) {
        cartTotals.insertBefore(couponSection, totalRow);
      } else {
        cartTotals.appendChild(couponSection);
      }
      
      // Add event listener for coupon button
      const applyButton = document.getElementById('apply-coupon');
      if (applyButton) {
        applyButton.addEventListener('click', function() {
          applyCoupon();
        });
      }
      
      // Add event listener for coupon input enter key
      const couponInput = document.getElementById('coupon-code');
      if (couponInput) {
        couponInput.addEventListener('keypress', function(e) {
          if (e.key === 'Enter') {
            applyCoupon();
          }
        });
      }
    }
  }
}

// Apply coupon function
function applyCoupon() {
  const couponInput = document.getElementById('coupon-code');
  const couponMessage = document.getElementById('coupon-message');
  
  if (!couponInput || !couponMessage) return;
  
  const couponCode = couponInput.value.trim().toUpperCase();
  
  // Reset message styling
  couponMessage.className = 'coupon-message';
  
  // Check if cart is empty
  if (cart.items.length === 0) {
    couponMessage.textContent = 'Your cart is empty.';
    couponMessage.classList.add('error');
    return;
  }
  
  // Sample coupon codes
  const validCoupons = {
    'FRESH10': { type: 'percentage', value: 0.10, message: '10% discount applied!' },
    'SAVE20': { type: 'percentage', value: 0.20, message: '20% discount applied!' },
    'FREESHIP': { type: 'shipping', value: 0, message: 'Free shipping applied!' },
    'DISCOUNT5': { type: 'fixed', value: 15, message: '₵15 discount applied!' }
  };
  
  if (couponCode === '') {
    couponMessage.textContent = 'Please enter a coupon code.';
    couponMessage.classList.add('error');
    return;
  }
  
  if (validCoupons[couponCode]) {
    const coupon = validCoupons[couponCode];
    
    // Apply discount based on coupon type
    if (coupon.type === 'percentage') {
      cart.couponDiscount = parseFloat((cart.subtotal * coupon.value).toFixed(2));
    } else if (coupon.type === 'shipping') {
      cart.couponDiscount = cart.delivery;
      cart.delivery = coupon.value;
    } else if (coupon.type === 'fixed') {
      cart.couponDiscount = Math.min(coupon.value, cart.subtotal);
    }
    
    couponMessage.textContent = coupon.message;
    couponMessage.classList.add('success');
  } else {
    couponMessage.textContent = 'Invalid coupon code.';
    couponMessage.classList.add('error');
    cart.couponDiscount = 0;
  }
  
  // Update cart totals
  updateCart();
}

// Fix for Read Full Article CSS
function addReadMoreCSS() {
  const style = document.createElement('style');
  style.textContent = `
    .article-content {
      max-height: 200px;
      overflow: hidden;
      transition: max-height 0.5s ease;
    }
    
    .article-content.expanded {
      max-height: 2000px;
    }
    
    .read-more-btn {
      display: inline-block;
      margin-top: 10px;
      color: #4CAF50;
      cursor: pointer;
      font-weight: 500;
    }
    
    .coupon-section {
      margin: 15px 0;
    }
    
    .coupon-input-group {
      display: flex;
    }
    
    .coupon-input {
      flex: 1;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px 0 0 4px;
    }
    
    .coupon-btn {
      padding: 8px 15px;
      background-color: #4CAF50;
      color: white;
      border: none;
      border-radius: 0 4px 4px 0;
      cursor: pointer;
    }
    
    .coupon-message {
      margin-top: 5px;
      font-size: 0.9em;
    }
    
    .coupon-message.success {
      color: #4CAF50;
    }
    
    .coupon-message.error {
      color: #f44336;
    }
    
    .disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `;
  document.head.appendChild(style);
}


// Call this function on page load
document.addEventListener('DOMContentLoaded', function() {
  addReadMoreCSS();
});



// Mobile Search Functionality for Veggie App
// Mobile Search Functionality for Veggie App

// Reference to the mobile search input and form
const mobileSearchInput = document.querySelector('.mobile-search-input');
const mobileSearchForm = document.querySelector('.mobile-search-form');

// Reference to the product container where we'll display the results
const productContainer = document.getElementById('products-container');

// Function to filter products based on search term
function filterProducts(searchTerm) {
  // Convert search term to lowercase for case-insensitive comparison
  const term = searchTerm.toLowerCase().trim();
  
  // If search term is empty, show all products
  if (term === '') {
    displayProducts(products);
    return;
  }
  
  // Filter products based on name, category, or description
  const filteredProducts = products.filter(product => {
    return product.name.toLowerCase().includes(term) || 
           product.category.toLowerCase().includes(term) || 
           product.description.toLowerCase().includes(term);
  });
  
  // Display the filtered products
  displayProducts(filteredProducts);
  
  // Show a message if no products were found
  if (filteredProducts.length === 0) {
    productContainer.innerHTML = `
      <div class="no-results">
        <p>No products found matching "${searchTerm}"</p>
        <button class="clear-search-btn">Clear Search</button>
      </div>
    `;
    
    // Add event listener to the clear search button
    document.querySelector('.clear-search-btn').addEventListener('click', () => {
      mobileSearchInput.value = '';
      displayProducts(products);
    });
  }
}

// Function to display products
function displayProducts(productsToDisplay) {
  // Clear the product container
  productContainer.innerHTML = '';
  
  // Add each product to the container
  productsToDisplay.forEach(product => {
    const productCard = createProductCard(product);
    productContainer.appendChild(productCard);
  });
  
  // Add event listeners to the add to cart buttons
  addCartButtonListeners();
}


// Function to add event listeners to cart buttons
function addCartButtonListeners() {
  const addToCartButtons = document.querySelectorAll('.add-to-cart');
  addToCartButtons.forEach(button => {
    button.addEventListener('click', () => {
      const productId = parseInt(button.dataset.id);
      addToCart(productId);
    });
  });
}

// Function to filter products by category
function filterProductsByCategory(category) {
  // Handle organic category separately since it's a property, not a category
  if (category.toLowerCase() === 'organic') {
    const organicProducts = products.filter(product => product.organic === true);
    displayProducts(organicProducts);
    
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    // No exact match for organic in filter buttons, so keep "all" selected
  } else {
    // Filter products by category
    const filteredProducts = products.filter(product => 
      product.category.toLowerCase() === category.toLowerCase()
    );
    displayProducts(filteredProducts);
    
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.filter.toLowerCase() === category.toLowerCase()) {
        btn.classList.add('active');
      }
    });
  }
  
  // Scroll to products section
  document.querySelector('.product-container').scrollIntoView({ 
    behavior: 'smooth',
    block: 'start'
  });
}

// Add event listener to the mobile search form
mobileSearchForm.addEventListener('submit', function(event) {
  event.preventDefault();
  filterProducts(mobileSearchInput.value);
});

// Add event listener for input changes (real-time filtering)
mobileSearchInput.addEventListener('input', function() {
  filterProducts(this.value);
});

// Initialize the display with all products when the page loads
document.addEventListener('DOMContentLoaded', function() {
  // Check if the products array is available
  if (typeof products !== 'undefined' && Array.isArray(products)) {
    displayProducts(products);
  } else {
    console.error('Products data is not available');
  }
  
  // Also make the main search bar functional
  const mainSearchInput = document.querySelector('.search-input');
  const mainSearchForm = document.querySelector('.search-form');
  
  if (mainSearchForm) {
    mainSearchForm.addEventListener('submit', function(event) {
      event.preventDefault();
      filterProducts(mainSearchInput.value);
    });
  }
  
  if (mainSearchInput) {
    mainSearchInput.addEventListener('input', function() {
      filterProducts(this.value);
    });
  }
  
  // Add event listeners to category "Browse All" links
  document.querySelectorAll('.category-link').forEach(link => {
    link.addEventListener('click', function(event) {
      event.preventDefault();
      
      // Get the category name from the previous sibling (h3 tag)
      const categoryHeading = this.previousElementSibling;
      if (categoryHeading && categoryHeading.tagName === 'H3') {
        const categoryName = categoryHeading.textContent.trim();
        filterProductsByCategory(categoryName);
      }
    });
  });
  
  // Also add event listeners to the product filter buttons
  document.querySelectorAll('.filter-btn').forEach(button => {
    button.addEventListener('click', function() {
      // Remove active class from all buttons
      document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      
      // Add active class to clicked button
      this.classList.add('active');
      
      // Filter products by category
      const category = this.dataset.filter;
      if (category === 'all') {
        displayProducts(products);
      } else {
        filterProductsByCategory(category);
      }
    });
  });
});

// Add this code to your fresh-groceries-landing.html page
// This will check for URL parameters and open the appropriate modal

document.addEventListener('DOMContentLoaded', function() {
  // Check URL parameters for modal opening instructions
  const urlParams = new URLSearchParams(window.location.search);
  const openModal = urlParams.get('openModal');
  
  if (openModal) {
    switch (openModal) {
      case 'process':
        openProcessModal();
        break;
      case 'organic':
        showFeatureInfo('organic');
        break;
      case 'farm':
        showFeatureInfo('farm');
        break;
      case 'delivery':
        showFeatureInfo('delivery');
        break;
    }
  }
  
  // Check for hash in URL for section scrolling
  const hash = window.location.hash;
  if (hash) {
    const targetId = hash.substring(1); // Remove the # character
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      // Slight delay to ensure page is fully loaded
      setTimeout(() => {
        targetElement.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }
});

// main.js - Script for handling all navigation and modals across both pages

// main.js - Script for handling all navigation and modals across both pages

// Function to run on BOTH the main index page and landing page
document.addEventListener('DOMContentLoaded', function() {
  // Check URL parameters for modal opening instructions
  const urlParams = new URLSearchParams(window.location.search);
  const openModal = urlParams.get('openModal');
  
  if (openModal) {
    // Slight delay to ensure page is fully loaded
    setTimeout(() => {
      switch (openModal) {
        case 'process':
          openProcessModal();
          break;
        case 'organic':
          showFeatureInfo('organic');
          break;
        case 'farm':
          showFeatureInfo('farm');
          break;
        case 'delivery':
          showFeatureInfo('delivery');
          break;
      }
    }, 300);
  }
  
  // Check for hash in URL for section scrolling
  const hash = window.location.hash;
  if (hash) {
    const targetId = hash.substring(1); // Remove the # character
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      // Slight delay to ensure page is fully loaded
      setTimeout(() => {
        targetElement.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }
  
  // Set up any click event handlers for non-anchor buttons if needed
  setupButtonEventListeners();
});

// Set up event listeners for any buttons that aren't using anchor tags
function setupButtonEventListeners() {
  // Only add these if you have buttons without anchor tags
  // Otherwise the <a href> tags in your HTML will handle navigation
  
  // Example for a button without an anchor tag parent:
  const nonAnchorButtons = document.querySelectorAll('button:not([id^="modal"])');
  nonAnchorButtons.forEach(button => {
    if (!button.closest('a')) {
      button.addEventListener('click', function() {
        // Determine which button was clicked based on class or other attributes
        if (button.classList.contains('primary')) {
          window.location.href = '/landing#products';
        } else if (button.classList.contains('secondary')) {
          window.location.href = '/landing?openModal=process';
        }
      });
    }
  });
}

// Modal functions
function openProcessModal() {
  showModal('process-modal', `
    <h2 class="modal-title">Our Farm-to-Table Process</h2>
    <p>At Fresh Groceries Delivered, we believe in transparency and quality. Here's how we bring the freshest produce to your doorstep:</p>
    
    <div class="process-steps">
      <div class="step">
        <h4>1. Harvest</h4>
        <p>Our partner farmers harvest fresh produce in the early morning hours to ensure maximum freshness.</p>
      </div>
      <div class="step">
        <h4>2. Quality Check</h4>
        <p>Each item is hand-selected and inspected for quality, freshness, and organic certification.</p>
      </div>
      <div class="step">
        <h4>3. Packaging</h4>
        <p>We use eco-friendly packaging materials to protect produce while minimizing environmental impact.</p>
      </div>
      <div class="step">
        <h4>4. Delivery</h4>
        <p>Our refrigerated vans deliver your groceries within 24 hours of harvest, maintaining the cold chain throughout.</p>
      </div>
    </div>
  `);
}

function showFeatureInfo(feature) {
  let title, content;
  
  switch (feature) {
    case 'organic':
      title = 'Our Organic Commitment';
      content = `
        <p>All our produce is certified organic, grown without synthetic pesticides or fertilizers.</p>
        <p>We work with farmers who prioritize sustainable farming practices that protect the soil, water, and biodiversity.</p>
        <p>Our organic certification means you can trust that what you're eating is clean, natural, and environmentally responsible.</p>
      `;
      break;
      
    case 'farm':
      title = 'Farm-to-Table Philosophy';
      content = `
        <p>We source directly from local farmers within a 100-mile radius of our distribution centers.</p>
        <p>By eliminating middlemen, we ensure farmers receive fair compensation and you get fresher produce.</p>
        <p>Our transparent supply chain means you can trace exactly where your food comes from.</p>
      `;
      break;
      
    case 'delivery':
      title = 'Free Delivery Service';
      content = `
        <p>We offer free delivery on all orders over $35.</p>
        <p>Our eco-friendly delivery vehicles reduce carbon emissions while bringing freshness to your doorstep.</p>
        <p>Schedule deliveries for your convenience - same-day available for orders placed before 10 AM.</p>
      `;
      break;
  }
  
  showModal(`${feature}-modal`, `
    <h2 class="modal-title">${title}</h2>
    ${content}
  `);
}

// Generic modal handling
function showModal(id, content) {
  // Create modal if it doesn't exist
  let modal = document.getElementById(id);
  
  if (!modal) {
    modal = document.createElement('div');
    modal.id = id;
    modal.className = 'modal';
    
    const modalContent = `
      <div class="modal-content">
        <span class="close" onclick="closeModal('${id}')">&times;</span>
        ${content}
      </div>
    `;
    
    modal.innerHTML = modalContent;
    document.body.appendChild(modal);
    
    // Add modal styles if not already present
    if (!document.getElementById('modalStyles')) {
      const style = document.createElement('style');
      style.id = 'modalStyles';
      style.textContent = `
        .modal {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0,0,0,0.7);
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .modal-content {
          background-color: white;
          padding: 2rem;
          border-radius: 10px;
          width: 80%;
          max-width: 600px;
          max-height: 80vh;
          overflow-y: auto;
        }
        
        .close {
          float: right;
          font-size: 1.5rem;
          cursor: pointer;
        }
        
        .modal-title {
          margin-bottom: 1rem;
          color: #4CAF50;
        }
        
        .process-steps {
          margin-top: 1.5rem;
        }
        
        .step {
          margin-bottom: 1.5rem;
          padding-left: 1.5rem;
          border-left: 3px solid #4CAF50;
        }
        
        .step h4 {
          color: #4CAF50;
          margin-bottom: 0.5rem;
        }
      `;
      document.head.appendChild(style);
    }
  }
  
  // Display the modal
  modal.style.display = 'flex';
}

function closeModal(id) {
  if (id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'none';
  } else {
    // Close all modals if no ID specified
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
      modal.style.display = 'none';
    });
  }
}