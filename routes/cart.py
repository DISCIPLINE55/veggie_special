from flask import Blueprint, jsonify, request, session
from flask import current_app as app
import datetime
import random
import string

cart_routes = Blueprint('cart_routes', __name__)

def calculate_cart_totals(cart_items):
    """Calculate cart totals including subtotal, delivery, tax, and total"""
    subtotal = sum(item['price'] * item['quantity'] for item in cart_items)
    delivery = 0 if subtotal >= 50 else 4.99  # Free delivery over $50
    tax = subtotal * 0.07  # Assuming 7% tax
    total = subtotal + delivery + tax
    
    return {
        "subtotal": round(subtotal, 2),
        "delivery": round(delivery, 2),
        "tax": round(tax, 2),
        "total": round(total, 2)
    }


@cart_routes.route('/api/cart', methods=['GET'])
def get_cart():
    """API endpoint to get the user's cart"""
    cart = session.get('cart', [])
    
    # Get product details for cart items
    products = app.config['PRODUCTS']
    for item in cart:
        product = next((p for p in products if p['id'] == item['product_id']), None)
        if product:
            item['image'] = product['image']
            item['unit'] = product['unit']
    
    totals = calculate_cart_totals(cart)
    
    return jsonify({
        "items": cart,
        "totals": totals,
        "item_count": sum(item['quantity'] for item in cart)
    })


@cart_routes.route('/api/cart/add', methods=['POST'])
def add_to_cart():
    """API endpoint to add an item to the cart"""
    data = request.json
    product_id = data.get('product_id')
    quantity = data.get('quantity', 1)
    
    if not product_id:
        return jsonify({"error": "Product ID is required"}), 400
    
    # Find the product
    products = app.config['PRODUCTS']
    product = next((p for p in products if p['id'] == product_id), None)
    if not product:
        return jsonify({"error": "Product not found"}), 404
    
    # Check if product is in stock
    if not product.get('inStock', True):
        return jsonify({"error": "Product is out of stock"}), 400
    
    # Get the current price (regular or sale)
    price = product.get('salePrice', product['price']) if product.get('sale', False) else product['price']
    
    # Check if product is already in cart
    cart = session.get('cart', [])
    for item in cart:
        if item['product_id'] == product_id:
            item['quantity'] += quantity
            session.modified = True
            
            totals = calculate_cart_totals(cart)
            return jsonify({
                "message": "Cart updated",
                "cart": cart,
                "totals": totals,
                "item_count": sum(item['quantity'] for item in cart)
            })
    
    # Add new item to cart
    cart.append({
        "product_id": product_id,
        "name": product['name'],
        "price": price,
        "quantity": quantity,
        "image": product['image'],
        "unit": product['unit']
    })
    
    session['cart'] = cart
    totals = calculate_cart_totals(cart)
    
    return jsonify({
        "message": "Item added to cart",
        "cart": cart,
        "totals": totals,
        "item_count": sum(item['quantity'] for item in cart)
    })


@cart_routes.route('/api/cart/update', methods=['PUT'])
def update_cart():
    """API endpoint to update an item quantity in the cart"""
    data = request.json
    product_id = data.get('product_id')
    quantity = data.get('quantity', 1)
    
    if not product_id:
        return jsonify({"error": "Product ID is required"}), 400
    
    cart = session.get('cart', [])
    for item in cart:
        if item['product_id'] == product_id:
            if quantity <= 0:
                cart.remove(item)
            else:
                item['quantity'] = quantity
            
            session['cart'] = cart
            totals = calculate_cart_totals(cart)
            
            return jsonify({
                "message": "Cart updated",
                "cart": cart,
                "totals": totals,
                "item_count": sum(item['quantity'] for item in cart)
            })
    
    return jsonify({"error": "Item not found in cart"}), 404


@cart_routes.route('/api/cart/remove', methods=['DELETE'])
def remove_from_cart():
    """API endpoint to remove an item from the cart"""
    product_id = request.args.get('product_id', type=int)
    if not product_id:
        return jsonify({"error": "Product ID required"}), 400
    
    cart = session.get('cart', [])
    cart = [item for item in cart if item['product_id'] != product_id]
    
    session['cart'] = cart
    totals = calculate_cart_totals(cart)
    
    return jsonify({
        "message": "Item removed from cart",
        "cart": cart,
        "totals": totals,
        "item_count": sum(item['quantity'] for item in cart)
    })


@cart_routes.route('/api/cart/clear', methods=['DELETE'])
def clear_cart():
    """API endpoint to clear the entire cart"""
    session['cart'] = []
    return jsonify({
        "message": "Cart cleared",
        "cart": [],
        "totals": {
            "subtotal": 0,
            "delivery": 0,
            "tax": 0,
            "total": 0
        },
        "item_count": 0
    })


@cart_routes.route('/api/cart/apply-promo', methods=['POST'])
def apply_promo():
    """API endpoint to apply a promo code to the cart"""
    data = request.json
    promo_code = data.get('promo_code', '').upper()
    
    if not promo_code:
        return jsonify({"error": "Promo code is required"}), 400
    
    # In a real app, you would validate the promo code against a database
    # For this example, we'll use some hard-coded promo codes
    promo_codes = {
        "WELCOME10": {"type": "percent", "value": 10},
        "FREESHIP": {"type": "free_shipping", "value": 0},
        "SAVE20": {"type": "percent", "value": 20},
        "5DOLLARS": {"type": "fixed", "value": 5}
    }
    
    if promo_code not in promo_codes:
        return jsonify({"error": "Invalid promo code"}), 400
    
    # Store the applied promo code in session
    session['promo_code'] = {
        "code": promo_code,
        "discount": promo_codes[promo_code]
    }
    
    # Recalculate totals with the promo code
    cart = session.get('cart', [])
    totals = calculate_cart_totals(cart)
    
    # Apply the discount
    discount = promo_codes[promo_code]
    if discount["type"] == "percent":
        discount_amount = totals["subtotal"] * (discount["value"] / 100)
        totals["discount"] = round(discount_amount, 2)
        totals["total"] = round(totals["total"] - discount_amount, 2)
    elif discount["type"] == "fixed":
        discount_amount = min(discount["value"], totals["subtotal"])
        totals["discount"] = round(discount_amount, 2)
        totals["total"] = round(totals["total"] - discount_amount, 2)
    elif discount["type"] == "free_shipping":
        totals["discount"] = round(totals["delivery"], 2)
        totals["delivery"] = 0
        totals["total"] = round(totals["total"] - totals["discount"], 2)
    
    return jsonify({
        "message": f"Promo code {promo_code} applied",
        "totals": totals,
        "promo": {
            "code": promo_code,
            "discount_type": discount["type"],
            "discount_value": discount["value"],
            "discount_amount": totals.get("discount", 0)
        }
    })


@cart_routes.route('/api/cart/remove-promo', methods=['DELETE'])
def remove_promo():
    """API endpoint to remove a promo code from the cart"""
    if 'promo_code' in session:
        del session['promo_code']
    
    cart = session.get('cart', [])
    totals = calculate_cart_totals(cart)
    
    return jsonify({
        "message": "Promo code removed",
        "totals": totals
    })


@cart_routes.route('/api/checkout', methods=['POST'])
def checkout():
    """API endpoint to process checkout"""
    # Get form data
    data = request.json
    
    # Validate required fields
    required_fields = ['email', 'firstName', 'lastName', 'address', 'city', 'state', 'zip', 'paymentMethod']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400
    
    # Process payment (in a real app, you would integrate with a payment processor)
    cart = session.get('cart', [])
    if not cart:
        return jsonify({"error": "Cart is empty"}), 400
    
    # Calculate totals
    totals = calculate_cart_totals(cart)
    
    # Apply promo code if any
    if 'promo_code' in session:
        promo = session['promo_code']
        discount = promo['discount']
        
        if discount["type"] == "percent":
            discount_amount = totals["subtotal"] * (discount["value"] / 100)
            totals["discount"] = round(discount_amount, 2)
            totals["total"] = round(totals["total"] - discount_amount, 2)
        elif discount["type"] == "fixed":
            discount_amount = min(discount["value"], totals["subtotal"])
            totals["discount"] = round(discount_amount, 2)
            totals["total"] = round(totals["total"] - discount_amount, 2)
        elif discount["type"] == "free_shipping":
            totals["discount"] = round(totals["delivery"], 2)
            totals["delivery"] = 0
            totals["total"] = round(totals["total"] - totals["discount"], 2)
    
    # Apply delivery method cost
    if data.get('deliveryMethod') == 'express':
        # Add express delivery fee
        express_fee = 4.99
        totals["delivery"] = round(express_fee, 2)
        totals["total"] = round(totals["total"] + express_fee, 2)
    
    # Create order
    order = {
        "order_id": ''.join(random.choices(string.ascii_uppercase + string.digits, k=8)),
        "date": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "customer": {
            "name": f"{data['firstName']} {data['lastName']}",
            "email": data['email'],
            "address": f"{data['address']}, {data['city']}, {data['state']} {data['zip']}"
        },
        "items": cart,
        "delivery": {
            "method": data.get('deliveryMethod', 'standard'),
            "address": f"{data['address']}, {data['city']}, {data['state']} {data['zip']}",
            "estimate": "May 3-4, 2025" if data.get('deliveryMethod') != 'express' else "May 3, 2025"
        },
        "payment": {
            "method": data['paymentMethod'],
            # In a real app, you would not store full payment details
            "last4": data.get('cardNumber', '')[-4:] if data.get('cardNumber') else "",
        },
        "totals": totals
    }
    
    # In a real app, you would save the order to a database
    # For this example, we'll store it in the session
    if 'orders' not in session:
        session['orders'] = []
    
    session['orders'].append(order)
    
    # Clear the cart and promo code
    session['cart'] = []
    if 'promo_code' in session:
        del session['promo_code']
    
    return jsonify({"success": True, "order": order})


@cart_routes.route('/api/orders', methods=['GET'])
def get_orders():
    """API endpoint to get user's order history"""
    # In a real app, you would fetch this from a database
    # For this example, we'll get it from the session
    orders = session.get('orders', [])
    
    return jsonify(orders)


@cart_routes.route('/api/order/<order_id>', methods=['GET'])
def get_order(order_id):
    """API endpoint to get a specific order by ID"""
    orders = session.get('orders', [])
    order = next((o for o in orders if o['order_id'] == order_id), None)
    
    if not order:
        return jsonify({"error": "Order not found"}), 404
    
    return jsonify(order)