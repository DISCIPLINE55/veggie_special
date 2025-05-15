from flask import Blueprint, jsonify, request
from flask import current_app as app

# Create a Blueprint for product-related routes
product_routes = Blueprint('product_routes', __name__)

@product_routes.route('/api/products/featured', methods=['GET'])
def get_featured_products():
    """API endpoint to get featured products"""
    # Get all products from the app context
    products = app.config['PRODUCTS']
    
    # Select products with high ratings (4.8 or above) or on sale
    featured = [p for p in products if p['rating'] >= 4.8 or p['sale']]
    
    # Limit to 8 featured products
    featured = featured[:8]
    
    return jsonify(featured)


@product_routes.route('/api/products/bestsellers', methods=['GET'])
def get_bestsellers():
    """API endpoint to get bestselling products"""
    # Get all products from the app context
    products = app.config['PRODUCTS']
    
    # Sort by number of reviews (assuming more reviews = more popular)
    bestsellers = sorted(products, key=lambda p: p['reviews'], reverse=True)
    
    # Limit to 8 bestsellers
    bestsellers = bestsellers[:8]
    
    return jsonify(bestsellers)


@product_routes.route('/api/products/sale', methods=['GET'])
def get_sale_products():
    """API endpoint to get products on sale"""
    # Get all products from the app context
    products = app.config['PRODUCTS']
    
    # Filter for products on sale
    sale_products = [p for p in products if p.get('sale', False)]
    
    return jsonify(sale_products)


@product_routes.route('/api/products/category/<category>', methods=['GET'])
def get_products_by_category(category):
    """API endpoint to get products by category"""
    # Get all products from the app context
    products = app.config['PRODUCTS']
    
    # Filter for products in the specified category
    category_products = [p for p in products if p['category'] == category]
    
    return jsonify(category_products)


@product_routes.route('/api/products/farm/<farm_name>', methods=['GET'])
def get_products_by_farm(farm_name):
    """API endpoint to get products from a specific farm"""
    # Get all products from the app context
    products = app.config['PRODUCTS']
    
    # Filter for products from the specified farm
    farm_products = [p for p in products if p['farmName'] == farm_name]
    
    return jsonify(farm_products)


@product_routes.route('/api/products/organic', methods=['GET'])
def get_organic_products():
    """API endpoint to get organic products"""
    # Get all products from the app context
    products = app.config['PRODUCTS']
    
    # Filter for organic products
    organic_products = [p for p in products if p.get('organic', False)]
    
    return jsonify(organic_products)


@product_routes.route('/api/products/related/<int:product_id>', methods=['GET'])
def get_related_products(product_id):
    """API endpoint to get products related to a specific product"""
    # Get all products from the app context
    products = app.config['PRODUCTS']
    
    # Find the product
    product = next((p for p in products if p['id'] == product_id), None)
    if not product:
        return jsonify({"error": "Product not found"}), 404
    
    # Find products in the same category, excluding the current product
    related = [p for p in products if p['category'] == product['category'] and p['id'] != product['id']]
    
    # Limit to 4 related products
    related = related[:4]
    
    return jsonify(related)


@product_routes.route('/api/products/filter', methods=['GET'])
def filter_products():
    """API endpoint to filter products by multiple criteria"""
    # Get all products from the app context
    products = app.config['PRODUCTS']
    
    # Get filter parameters
    category = request.args.get('category')
    min_price = request.args.get('min_price', type=float)
    max_price = request.args.get('max_price', type=float)
    rating = request.args.get('rating', type=float)
    organic = request.args.get('organic', type=int) # 1 for organic, 0 for non-organic
    on_sale = request.args.get('on_sale', type=int) # 1 for on sale, 0 for not on sale
    
    filtered_products = products
    
    # Apply filters
    if category:
        filtered_products = [p for p in filtered_products if p['category'] == category]
    
    if min_price is not None:
        filtered_products = [p for p in filtered_products if p['price'] >= min_price]
    
    if max_price is not None:
        filtered_products = [p for p in filtered_products if p['price'] <= max_price]
    
    if rating is not None:
        filtered_products = [p for p in filtered_products if p['rating'] >= rating]
    
    if organic is not None:
        filtered_products = [p for p in filtered_products if p.get('organic', False) == bool(organic)]
    
    if on_sale is not None:
        filtered_products = [p for p in filtered_products if p.get('sale', False) == bool(on_sale)]
    
    return jsonify(filtered_products)


@product_routes.route('/api/products/search', methods=['GET'])
def search_products():
    """API endpoint for more advanced product search"""
    # Get all products from the app context
    products = app.config['PRODUCTS']
    
    query = request.args.get('q', '').lower()
    if not query:
        return jsonify([])
    
    # Search in name, description, and category
    results = [p for p in products if 
              query in p['name'].lower() or 
              query in p['description'].lower() or 
              query in p['category'].lower() or
              query in p['farmName'].lower()]
    
    return jsonify(results)