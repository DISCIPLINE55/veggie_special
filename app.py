from flask import Flask, request, jsonify, session, render_template, redirect, url_for
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import os
import json
from datetime import datetime, timedelta
import uuid
import random

# Initialize Flask app with proper configuration
app = Flask(__name__, static_folder='static', template_folder='templates')
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev_secret_key')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///veggie.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SESSION_COOKIE_SECURE'] = True
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)

# Enable CORS
CORS(app, supports_credentials=True)

# Initialize database
db = SQLAlchemy(app)

# Define models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    phone = db.Column(db.String(20), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_admin = db.Column(db.Boolean, default=False)  # Added admin flag
    
    # Relationships
    addresses = db.relationship('Address', backref='user', lazy=True)
    orders = db.relationship('Order', backref='user', lazy=True)
    cart = db.relationship('Cart', backref='user', uselist=False, lazy=True)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
        
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'phone': self.phone,
            'created_at': self.created_at.isoformat()
        }

class Address(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    street = db.Column(db.String(120), nullable=False)
    apartment = db.Column(db.String(50), nullable=True)
    city = db.Column(db.String(50), nullable=False)
    region = db.Column(db.String(50), nullable=False)
    zip_code = db.Column(db.String(20), nullable=False)
    is_default = db.Column(db.Boolean, default=False)
    region_type = db.Column(db.String(20), nullable=True)  # urban, suburban, rural
    delivery_notes = db.Column(db.Text, nullable=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'street': self.street,
            'apartment': self.apartment,
            'city': self.city,
            'region': self.region,
            'zip_code': self.zip_code,
            'is_default': self.is_default,
            'region_type': self.region_type,
            'delivery_notes': self.delivery_notes
        }

class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text, nullable=True)
    image_url = db.Column(db.String(255), nullable=True)
    
    # Relationships
    products = db.relationship('Product', backref='category', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'image_url': self.image_url
        }

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    price = db.Column(db.Float, nullable=False)
    sale_price = db.Column(db.Float, nullable=True)
    stock = db.Column(db.Integer, default=0)
    image_url = db.Column(db.String(255), nullable=True)
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=False)
    is_organic = db.Column(db.Boolean, default=False)
    is_featured = db.Column(db.Boolean, default=False)
    unit = db.Column(db.String(20), nullable=False, default='kg')  # kg, bundle, piece, etc.
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    cart_items = db.relationship('CartItem', backref='product', lazy=True)
    order_items = db.relationship('OrderItem', backref='product', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'price': self.price,
            'sale_price': self.sale_price,
            'stock': self.stock,
            'image_url': self.image_url,
            'category_id': self.category_id,
            'category_name': self.category.name,
            'is_organic': self.is_organic,
            'is_featured': self.is_featured,
            'unit': self.unit
        }

class Cart(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    items = db.relationship('CartItem', backref='cart', lazy=True, cascade="all, delete-orphan")
    
    def to_dict(self):
        items = [item.to_dict() for item in self.items]
        subtotal = sum(item['price'] * item['quantity'] for item in items)
        
        return {
            'id': self.id,
            'user_id': self.user_id,
            'items': items,
            'item_count': len(items),
            'subtotal': subtotal,
            'updated_at': self.updated_at.isoformat()
        }

class CartItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    cart_id = db.Column(db.Integer, db.ForeignKey('cart.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    quantity = db.Column(db.Integer, default=1)
    
    def to_dict(self):
        return {
            'id': self.id,
            'product_id': self.product_id,
            'product_name': self.product.name,
            'product_image': self.product.image_url,
            'price': self.product.sale_price if self.product.sale_price else self.product.price,
            'unit': self.product.unit,
            'quantity': self.quantity,
            'total': (self.product.sale_price if self.product.sale_price else self.product.price) * self.quantity
        }

class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    order_number = db.Column(db.String(20), unique=True, nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, processing, shipped, delivered, cancelled
    subtotal = db.Column(db.Float, nullable=False)
    delivery_fee = db.Column(db.Float, default=0.0)
    tax = db.Column(db.Float, default=0.0)
    total = db.Column(db.Float, nullable=False)
    payment_method = db.Column(db.String(20), nullable=False)  # credit-card, paypal, mobile-money
    payment_status = db.Column(db.String(20), default='pending')  # pending, completed, failed
    delivery_method = db.Column(db.String(20), nullable=False)  # standard, express
    delivery_address = db.Column(db.Text, nullable=False)
    delivery_notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    items = db.relationship('OrderItem', backref='order', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'order_number': self.order_number,
            'status': self.status,
            'subtotal': self.subtotal,
            'delivery_fee': self.delivery_fee,
            'tax': self.tax,
            'total': self.total,
            'payment_method': self.payment_method,
            'payment_status': self.payment_status,
            'delivery_method': self.delivery_method,
            'delivery_address': self.delivery_address,
            'delivery_notes': self.delivery_notes,
            'created_at': self.created_at.isoformat(),
            'items': [item.to_dict() for item in self.items],
            'item_count': len(self.items)
        }

class OrderItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('order.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    product_name = db.Column(db.String(100), nullable=False)
    product_price = db.Column(db.Float, nullable=False)
    quantity = db.Column(db.Integer, default=1)
    total = db.Column(db.Float, nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'product_id': self.product_id,
            'product_name': self.product_name,
            'product_price': self.product_price,
            'quantity': self.quantity,
            'total': self.total
        }

class Subscription(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    subscription_type = db.Column(db.String(20), nullable=False)  # weekly, bi-weekly, monthly
    status = db.Column(db.String(20), default='active')  # active, paused, cancelled
    next_delivery_date = db.Column(db.DateTime, nullable=False)
    address_id = db.Column(db.Integer, db.ForeignKey('address.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='subscriptions', lazy=True)
    address = db.relationship('Address', backref='subscriptions', lazy=True)
    items = db.relationship('SubscriptionItem', backref='subscription', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'subscription_type': self.subscription_type,
            'status': self.status,
            'next_delivery_date': self.next_delivery_date.isoformat(),
            'address': self.address.to_dict(),
            'items': [item.to_dict() for item in self.items],
            'created_at': self.created_at.isoformat()
        }

class SubscriptionItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    subscription_id = db.Column(db.Integer, db.ForeignKey('subscription.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    quantity = db.Column(db.Integer, default=1)
    
    # Relationships
    product = db.relationship('Product', backref='subscription_items', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'product_id': self.product_id,
            'product_name': self.product.name,
            'product_price': self.product.sale_price if self.product.sale_price else self.product.price,
            'quantity': self.quantity
        }

class PromoCode(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(20), unique=True, nullable=False)
    discount_type = db.Column(db.String(20), nullable=False)  # percentage, fixed
    discount_value = db.Column(db.Float, nullable=False)
    min_purchase = db.Column(db.Float, default=0.0)
    valid_from = db.Column(db.DateTime, nullable=False)
    valid_to = db.Column(db.DateTime, nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def is_valid(self, purchase_amount):
        now = datetime.utcnow()
        return (self.is_active and 
                self.valid_from <= now <= self.valid_to and 
                purchase_amount >= self.min_purchase)
    
    def calculate_discount(self, amount):
        if self.discount_type == 'percentage':
            return amount * (self.discount_value / 100)
        else:  # fixed
            return min(self.discount_value, amount)  # Don't discount more than the amount
    
    def to_dict(self):
        return {
            'id': self.id,
            'code': self.code,
            'discount_type': self.discount_type,
            'discount_value': self.discount_value,
            'min_purchase': self.min_purchase,
            'valid_from': self.valid_from.isoformat(),
            'valid_to': self.valid_to.isoformat(),
            'is_active': self.is_active
        }

# Helper Functions
def get_or_create_cart(user_id):
    cart = Cart.query.filter_by(user_id=user_id).first()
    if not cart:
        cart = Cart(user_id=user_id)
        db.session.add(cart)
        db.session.commit()
    return cart

def generate_order_number():
    prefix = "VEG"
    timestamp = datetime.utcnow().strftime("%y%m%d")
    random_part = ''.join(random.choices('0123456789', k=4))
    return f"{prefix}-{timestamp}-{random_part}"

# Frontend Routes
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/products')
def products():
    return render_template('products.html')

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/contact')
def contact():
    return render_template('contact.html')

@app.route('/blog')
def blog():
    return render_template('blog.html')

@app.route('/account')
def account():
    return render_template('account.html')


@app.route('/landing')
def landing():
    """Render the landing page with optional parameters for modals and section anchors"""
    # Get the modal parameter if it exists
    open_modal = request.args.get('openModal', None)
    
    # Render the landing page template with the modal parameter
    return render_template('landing.html', open_modal=open_modal)

# Authentication Routes
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.json
    
    # Check if user already exists
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 400
    
    # Create new user
    user = User(
        email=data['email'],
        first_name=data['firstName'],
        last_name=data['lastName'],
        phone=data.get('phone')
    )
    user.set_password(data['password'])
    
    db.session.add(user)
    db.session.commit()
    
    # Create a cart for the user
    cart = Cart(user_id=user.id)
    db.session.add(cart)
    db.session.commit()
    
    # Set user session
    session['user_id'] = user.id
    
    return jsonify({
        'message': 'Registration successful',
        'user': user.to_dict()
    }), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    
    user = User.query.filter_by(email=data['email']).first()
    
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid email or password'}), 401
    
    # Set user session
    session['user_id'] = user.id
    
    return jsonify({
        'message': 'Login successful',
        'user': user.to_dict()
    }), 200

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    return jsonify({'message': 'Logout successful'}), 200

@app.route('/api/auth/current-user', methods=['GET'])
def current_user():
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
    user = User.query.get(user_id)
    
    if not user:
        session.pop('user_id', None)
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({
        'user': user.to_dict()
    }), 200

# Product Routes
@app.route('/api/products', methods=['GET'])
def get_products():
    category = request.args.get('category')
    is_organic = request.args.get('organic')
    is_featured = request.args.get('featured')
    search = request.args.get('search')
    
    query = Product.query
    
    if category:
        query = query.join(Category).filter(Category.name == category)
    
    if is_organic == 'true':
        query = query.filter(Product.is_organic == True)
        
    if is_featured == 'true':
        query = query.filter(Product.is_featured == True)
        
    if search:
        search_term = f"%{search}%"
        query = query.filter(Product.name.ilike(search_term) | 
                            Product.description.ilike(search_term))
    
    products = query.all()
    
    return jsonify({
        'products': [product.to_dict() for product in products]
    }), 200

@app.route('/api/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    product = Product.query.get_or_404(product_id)
    
    return jsonify({
        'product': product.to_dict()
    }), 200

# Categories Routes
@app.route('/api/categories', methods=['GET'])
def get_categories():
    categories = Category.query.all()
    
    return jsonify({
        'categories': [category.to_dict() for category in categories]
    }), 200

# Cart Routes
@app.route('/api/cart', methods=['GET'])
def get_cart():
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
    cart = get_or_create_cart(user_id)
    
    return jsonify({
        'cart': cart.to_dict()
    }), 200

@app.route('/api/cart/add', methods=['POST'])
def add_to_cart():
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
    data = request.json
    product_id = data.get('product_id')
    quantity = data.get('quantity', 1)
    
    if not product_id:
        return jsonify({'error': 'Product ID is required'}), 400
    
    product = Product.query.get(product_id)
    
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    
    cart = get_or_create_cart(user_id)
    
    # Check if product already in cart
    cart_item = CartItem.query.filter_by(cart_id=cart.id, product_id=product_id).first()
    
    if cart_item:
        cart_item.quantity += quantity
    else:
        cart_item = CartItem(cart_id=cart.id, product_id=product_id, quantity=quantity)
        db.session.add(cart_item)
    
    db.session.commit()
    
    return jsonify({
        'message': 'Product added to cart',
        'cart': cart.to_dict()
    }), 200

@app.route('/api/cart/update', methods=['PUT'])
def update_cart_item():
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
    data = request.json
    cart_item_id = data.get('cart_item_id')
    quantity = data.get('quantity')
    
    if not cart_item_id or quantity is None:
        return jsonify({'error': 'Cart item ID and quantity are required'}), 400
    
    cart = get_or_create_cart(user_id)
    cart_item = CartItem.query.filter_by(id=cart_item_id, cart_id=cart.id).first()
    
    if not cart_item:
        return jsonify({'error': 'Cart item not found'}), 404
    
    if quantity <= 0:
        db.session.delete(cart_item)
    else:
        cart_item.quantity = quantity
    
    db.session.commit()
    
    return jsonify({
        'message': 'Cart updated',
        'cart': cart.to_dict()
    }), 200

@app.route('/api/cart/remove/<int:cart_item_id>', methods=['DELETE'])
def remove_from_cart(cart_item_id):
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
    cart = get_or_create_cart(user_id)
    cart_item = CartItem.query.filter_by(id=cart_item_id, cart_id=cart.id).first()
    
    if not cart_item:
        return jsonify({'error': 'Cart item not found'}), 404
    
    db.session.delete(cart_item)
    db.session.commit()
    
    return jsonify({
        'message': 'Item removed from cart',
        'cart': cart.to_dict()
    }), 200

@app.route('/api/cart/clear', methods=['POST'])
def clear_cart():
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
    cart = get_or_create_cart(user_id)
    
    CartItem.query.filter_by(cart_id=cart.id).delete()
    db.session.commit()
    
    return jsonify({
        'message': 'Cart cleared',
        'cart': cart.to_dict()
    }), 200

# Order Routes
@app.route('/api/orders', methods=['GET'])
def get_orders():
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
    orders = Order.query.filter_by(user_id=user_id).order_by(Order.created_at.desc()).all()
    
    return jsonify({
        'orders': [order.to_dict() for order in orders]
    }), 200

@app.route('/api/orders/<string:order_number>', methods=['GET'])
def get_order(order_number):
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
    order = Order.query.filter_by(order_number=order_number, user_id=user_id).first()
    
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    
    return jsonify({
        'order': order.to_dict()
    }), 200

@app.route('/api/orders/create', methods=['POST'])
def create_order():
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
    data = request.json
    
    # Get user's cart
    cart = get_or_create_cart(user_id)
    
    if not cart.items:
        return jsonify({'error': 'Cart is empty'}), 400
    
    # Calculate order totals
    subtotal = sum(item.product.price * item.quantity for item in cart.items)
    delivery_fee = 0.0 if data.get('delivery_method') == 'standard' else 4.99
    tax = subtotal * 0.05  # 5% tax rate
    total = subtotal + delivery_fee + tax
    
    # Format address
    address_parts = [
        data.get('first_name') + ' ' + data.get('last_name'),
        data.get('street'),
        data.get('apartment', ''),
        f"{data.get('city')}, {data.get('region')} {data.get('zip_code')}"
    ]
    delivery_address = '\n'.join(filter(None, address_parts))
    
    # Create order
    order = Order(
        user_id=user_id,
        order_number=generate_order_number(),
        status='pending',
        subtotal=subtotal,
        delivery_fee=delivery_fee,
        tax=tax,
        total=total,
        payment_method=data.get('payment_method'),
        delivery_method=data.get('delivery_method'),
        delivery_address=delivery_address,
        delivery_notes=data.get('delivery_notes')
    )
    
    db.session.add(order)
    db.session.flush()  # Get order ID
    
    # Add order items
    for cart_item in cart.items:
        order_item = OrderItem(
            order_id=order.id,
            product_id=cart_item.product_id,
            product_name=cart_item.product.name,
            product_price=cart_item.product.price,
            quantity=cart_item.quantity,
            total=cart_item.product.price * cart_item.quantity
        )
        db.session.add(order_item)
    
    # Clear the cart
    CartItem.query.filter_by(cart_id=cart.id).delete()
    
    db.session.commit()
    
    return jsonify({
        'message': 'Order created successfully',
        'order': order.to_dict()
    }), 201

# Address Routes
@app.route('/api/addresses', methods=['GET'])
def get_addresses():
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
    addresses = Address.query.filter_by(user_id=user_id).all()
    
    return jsonify({
        'addresses': [address.to_dict() for address in addresses]
    }), 200

@app.route('/api/addresses', methods=['POST'])
def add_address():
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
    data = request.json
    
    address = Address(
        user_id=user_id,
        street=data.get('street'),
        apartment=data.get('apartment'),
        city=data.get('city'),
        region=data.get('region'),
        zip_code=data.get('zip_code'),
        is_default=data.get('is_default', False),
        region_type=data.get('region_type'),
        delivery_notes=data.get('delivery_notes')
    )
    
    if address.is_default:
        # Set all other addresses to non-default
        Address.query.filter_by(user_id=user_id, is_default=True).update({'is_default': False})
    
    db.session.add(address)
    db.session.commit()
    
    return jsonify({
        'message': 'Address added successfully',
        'address': address.to_dict()
    }), 201

# Subscription Routes
@app.route('/api/subscriptions', methods=['GET'])
def get_subscriptions():
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
    subscriptions = Subscription.query.filter_by(user_id=user_id).all()
    
    return jsonify({
        'subscriptions': [subscription.to_dict() for subscription in subscriptions]
    }), 200

@app.route('/api/subscriptions', methods=['POST'])
def create_subscription():
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
    data = request.json
    
    # Create subscription
    subscription = Subscription(
        user_id=user_id,
        subscription_type=data.get('subscription_type'),
        next_delivery_date=datetime.strptime(data.get('next_delivery_date'), '%Y-%m-%d'),
        address_id=data.get('address_id')
    )
    
    db.session.add(subscription)
    db.session.flush()  # Get subscription ID
    
    # Add subscription items
    for item_data in data.get('items', []):
        item = SubscriptionItem(
            subscription_id=subscription.id,
            product_id=item_data.get('product_id'),
            quantity=item_data.get('quantity', 1)
        )
        db.session.add(item)
    
    db.session.commit()
    
    return
@app.route('/api/promo-codes/validate', methods=['POST'])
def validate_promo_code():
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
    data = request.json
    code = data.get('code')
    amount = data.get('amount', 0)
    
    if not code:
        return jsonify({'error': 'Promo code is required'}), 400
    
    promo = PromoCode.query.filter_by(code=code).first()
    
    if not promo:
        return jsonify({'error': 'Invalid promo code'}), 404
    
    if not promo.is_valid(amount):
        return jsonify({'error': 'Promo code is not valid for this purchase'}), 400
    
    discount = promo.calculate_discount(amount)
    
    return jsonify({
        'message': 'Promo code applied successfully',
        'promo_code': promo.to_dict(),
        'discount': discount
    }), 200

@app.route('/api/subscriptions/<int:subscription_id>', methods=['PUT'])
def update_subscription(subscription_id):
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
    subscription = Subscription.query.filter_by(id=subscription_id, user_id=user_id).first()
    
    if not subscription:
        return jsonify({'error': 'Subscription not found'}), 404
    
    data = request.json
    
    if 'status' in data:
        subscription.status = data['status']
    
    if 'subscription_type' in data:
        subscription.subscription_type = data['subscription_type']
    
    if 'next_delivery_date' in data:
        subscription.next_delivery_date = datetime.strptime(data['next_delivery_date'], '%Y-%m-%d')
    
    if 'address_id' in data:
        subscription.address_id = data['address_id']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Subscription updated successfully',
        'subscription': subscription.to_dict()
    }), 200

@app.route('/api/subscriptions/<int:subscription_id>', methods=['DELETE'])
def cancel_subscription(subscription_id):
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
    subscription = Subscription.query.filter_by(id=subscription_id, user_id=user_id).first()
    
    if not subscription:
        return jsonify({'error': 'Subscription not found'}), 404
    
    # Instead of deleting, set status to cancelled
    subscription.status = 'cancelled'
    db.session.commit()
    
    return jsonify({
        'message': 'Subscription cancelled successfully'
    }), 200

@app.route('/api/subscriptions/<int:subscription_id>/items', methods=['POST'])
def add_subscription_item(subscription_id):
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
    subscription = Subscription.query.filter_by(id=subscription_id, user_id=user_id).first()
    
    if not subscription:
        return jsonify({'error': 'Subscription not found'}), 404
    
    data = request.json
    product_id = data.get('product_id')
    quantity = data.get('quantity', 1)
    
    if not product_id:
        return jsonify({'error': 'Product ID is required'}), 400
    
    product = Product.query.get(product_id)
    
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    
    # Check if product already in subscription
    item = SubscriptionItem.query.filter_by(subscription_id=subscription_id, product_id=product_id).first()
    
    if item:
        item.quantity += quantity
    else:
        item = SubscriptionItem(subscription_id=subscription_id, product_id=product_id, quantity=quantity)
        db.session.add(item)
    
    db.session.commit()
    
    return jsonify({
        'message': 'Product added to subscription',
        'subscription': subscription.to_dict()
    }), 200

@app.route('/api/subscriptions/<int:subscription_id>/items/<int:item_id>', methods=['PUT'])
def update_subscription_item(subscription_id, item_id):
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
    subscription = Subscription.query.filter_by(id=subscription_id, user_id=user_id).first()
    
    if not subscription:
        return jsonify({'error': 'Subscription not found'}), 404
    
    item = SubscriptionItem.query.filter_by(id=item_id, subscription_id=subscription_id).first()
    
    if not item:
        return jsonify({'error': 'Subscription item not found'}), 404
    
    data = request.json
    quantity = data.get('quantity')
    
    if quantity is None:
        return jsonify({'error': 'Quantity is required'}), 400
    
    if quantity <= 0:
        db.session.delete(item)
    else:
        item.quantity = quantity
    
    db.session.commit()
    
    return jsonify({
        'message': 'Subscription item updated',
        'subscription': subscription.to_dict()
    }), 200

@app.route('/api/subscriptions/<int:subscription_id>/items/<int:item_id>', methods=['DELETE'])
def remove_subscription_item(subscription_id, item_id):
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
    subscription = Subscription.query.filter_by(id=subscription_id, user_id=user_id).first()
    
    if not subscription:
        return jsonify({'error': 'Subscription not found'}), 404
    
    item = SubscriptionItem.query.filter_by(id=item_id, subscription_id=subscription_id).first()
    
    if not item:
        return jsonify({'error': 'Subscription item not found'}), 404
    
    db.session.delete(item)
    db.session.commit()
    
    return jsonify({
        'message': 'Item removed from subscription',
        'subscription': subscription.to_dict()
    }), 200

@app.route('/api/user/profile', methods=['GET'])
def get_profile():
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({
        'user': user.to_dict()
    }), 200

@app.route('/api/user/profile', methods=['PUT'])
def update_profile():
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.json
    
    if 'first_name' in data:
        user.first_name = data['first_name']
    
    if 'last_name' in data:
        user.last_name = data['last_name']
    
    if 'phone' in data:
        user.phone = data['phone']
    
    if 'email' in data:
        # Check if email is already taken by another user
        existing_user = User.query.filter_by(email=data['email']).first()
        if existing_user and existing_user.id != user.id:
            return jsonify({'error': 'Email already in use'}), 400
        user.email = data['email']
    
    if 'password' in data:
        user.set_password(data['password'])
    
    db.session.commit()
    
    return jsonify({
        'message': 'Profile updated successfully',
        'user': user.to_dict()
    }), 200

@app.route('/api/addresses/<int:address_id>', methods=['PUT'])
def update_address(address_id):
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
    address = Address.query.filter_by(id=address_id, user_id=user_id).first()
    
    if not address:
        return jsonify({'error': 'Address not found'}), 404
    
    data = request.json
    
    if 'street' in data:
        address.street = data['street']
    
    if 'apartment' in data:
        address.apartment = data['apartment']
    
    if 'city' in data:
        address.city = data['city']
    
    if 'region' in data:
        address.region = data['region']
    
    if 'zip_code' in data:
        address.zip_code = data['zip_code']
    
    if 'is_default' in data and data['is_default']:
        # Set all other addresses to non-default
        Address.query.filter_by(user_id=user_id, is_default=True).update({'is_default': False})
        address.is_default = True
    
    if 'region_type' in data:
        address.region_type = data['region_type']
    
    if 'delivery_notes' in data:
        address.delivery_notes = data['delivery_notes']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Address updated successfully',
        'address': address.to_dict()
    }), 200

@app.route('/api/addresses/<int:address_id>', methods=['DELETE'])
def delete_address(address_id):
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
    address = Address.query.filter_by(id=address_id, user_id=user_id).first()
    
    if not address:
        return jsonify({'error': 'Address not found'}), 404
    
    # Check if this address is associated with any subscriptions
    subs = Subscription.query.filter_by(address_id=address_id).first()
    if subs:
        return jsonify({'error': 'Cannot delete address associated with active subscriptions'}), 400
    
    # If this was the default address, set another address as default
    if address.is_default:
        other_address = Address.query.filter(Address.user_id == user_id, Address.id != address_id).first()
        if other_address:
            other_address.is_default = True
    
    db.session.delete(address)
    db.session.commit()
    
    return jsonify({
        'message': 'Address deleted successfully'
    }), 200

@app.route('/api/featured-products', methods=['GET'])
def get_featured_products():
    products = Product.query.filter_by(is_featured=True).limit(4).all()
    
    return jsonify({
        'products': [product.to_dict() for product in products]
    }), 200

@app.route('/api/organic-products', methods=['GET'])
def get_organic_products():
    products = Product.query.filter_by(is_organic=True).limit(8).all()
    
    return jsonify({
        'products': [product.to_dict() for product in products]
    }), 200

@app.route('/api/product-suggestions', methods=['GET'])
def get_product_suggestions():
    user_id = session.get('user_id')
    
    if not user_id:
        # For non-authenticated users, just return featured products
        return get_featured_products()
    
    # For authenticated users, try to get personalized suggestions
    # Based on past orders and seasonal products
    user_orders = Order.query.filter_by(user_id=user_id).all()
    
    if not user_orders:
        # No order history, return featured products
        return get_featured_products()
    
    # Extract products from past orders
    order_items = []
    for order in user_orders:
        order_items.extend(order.items)
    
    # Get product categories from past orders
    category_ids = set()
    for item in order_items:
        product = Product.query.get(item.product_id)
        if product:
            category_ids.add(product.category_id)
    
    # Get similar products from same categories
    if category_ids:
        products = Product.query.filter(Product.category_id.in_(category_ids)).limit(8).all()
        
        return jsonify({
            'products': [product.to_dict() for product in products]
        }), 200
    else:
        return get_featured_products()

@app.route('/api/admin/dashboard', methods=['GET'])
def admin_dashboard():
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
    # Check if user is admin (you'd need to add an is_admin field to User model)
    user = User.query.get(user_id)
    
    if not hasattr(user, 'is_admin') or not user.is_admin:
        return jsonify({'error': 'Not authorized'}), 403
    
    # Get key metrics
    total_users = User.query.count()
    total_orders = Order.query.count()
    total_products = Product.query.count()
    total_revenue = db.session.query(db.func.sum(Order.total)).scalar() or 0
    
    # Recent orders
    recent_orders = Order.query.order_by(Order.created_at.desc()).limit(10).all()
    
    # Low stock products
    low_stock = Product.query.filter(Product.stock < 10).all()
    
    return jsonify({
        'metrics': {
            'total_users': total_users,
            'total_orders': total_orders,
            'total_products': total_products,
            'total_revenue': total_revenue
        },
        'recent_orders': [order.to_dict() for order in recent_orders],
        'low_stock': [product.to_dict() for product in low_stock]
    }), 200

@app.route('/api/admin/products', methods=['POST'])
def admin_add_product():
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
    # Check if user is admin
    user = User.query.get(user_id)
    
    if not hasattr(user, 'is_admin') or not user.is_admin:
        return jsonify({'error': 'Not authorized'}), 403
    
    data = request.json
    
    product = Product(
        name=data['name'],
        description=data.get('description'),
        price=data['price'],
        sale_price=data.get('sale_price'),
        stock=data.get('stock', 0),
        image_url=data.get('image_url'),
        category_id=data['category_id'],
        is_organic=data.get('is_organic', False),
        is_featured=data.get('is_featured', False),
        unit=data.get('unit', 'kg')
    )
    
    db.session.add(product)
    db.session.commit()
    
    return jsonify({
        'message': 'Product added successfully',
        'product': product.to_dict()
    }), 201

@app.route('/api/admin/products/<int:product_id>', methods=['PUT'])
def admin_update_product(product_id):
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
    # Check if user is admin
    user = User.query.get(user_id)
    
    if not hasattr(user, 'is_admin') or not user.is_admin:
        return jsonify({'error': 'Not authorized'}), 403
    
    product = Product.query.get_or_404(product_id)
    data = request.json
    
    if 'name' in data:
        product.name = data['name']
    
    if 'description' in data:
        product.description = data['description']
    
    if 'price' in data:
        product.price = data['price']
    
    if 'sale_price' in data:
        product.sale_price = data['sale_price']
    
    if 'stock' in data:
        product.stock = data['stock']
    
    if 'image_url' in data:
        product.image_url = data['image_url']
    
    if 'category_id' in data:
        product.category_id = data['category_id']
    
    if 'is_organic' in data:
        product.is_organic = data['is_organic']
    
    if 'is_featured' in data:
        product.is_featured = data['is_featured']
    
    if 'unit' in data:
        product.unit = data['unit']
    
    product.updated_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({
        'message': 'Product updated successfully',
        'product': product.to_dict()
    }), 200

@app.route('/api/admin/categories', methods=['POST'])
def admin_add_category():
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
    # Check if user is admin
    user = User.query.get(user_id)
    
    if not hasattr(user, 'is_admin') or not user.is_admin:
        return jsonify({'error': 'Not authorized'}), 403
    
    data = request.json
    
    category = Category(
        name=data['name'],
        description=data.get('description'),
        image_url=data.get('image_url')
    )
    
    db.session.add(category)
    db.session.commit()
    
    return jsonify({
        'message': 'Category added successfully',
        'category': category.to_dict()
    }), 201

@app.route('/api/admin/promo-codes', methods=['POST'])
def admin_add_promo_code():
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
    # Check if user is admin
    user = User.query.get(user_id)
    
    if not hasattr(user, 'is_admin') or not user.is_admin:
        return jsonify({'error': 'Not authorized'}), 403
    
    data = request.json
    
    # Check if code already exists
    existing_code = PromoCode.query.filter_by(code=data['code']).first()
    if existing_code:
        return jsonify({'error': 'Promo code already exists'}), 400
    
    promo = PromoCode(
        code=data['code'],
        discount_type=data['discount_type'],
        discount_value=data['discount_value'],
        min_purchase=data.get('min_purchase', 0.0),
        valid_from=datetime.strptime(data['valid_from'], '%Y-%m-%d'),
        valid_to=datetime.strptime(data['valid_to'], '%Y-%m-%d'),
        is_active=data.get('is_active', True)
    )
    
    db.session.add(promo)
    db.session.commit()
    
    return jsonify({
        'message': 'Promo code added successfully',
        'promo_code': promo.to_dict()
    }), 201

@app.route('/api/newsletter/subscribe', methods=['POST'])
def newsletter_subscribe():
    data = request.json
    email = data.get('email')
    
    if not email:
        return jsonify({'error': 'Email is required'}), 400
    
    # Here you would typically add the email to your newsletter database
    # For now, we'll just return a success message
    
    return jsonify({
        'message': 'Successfully subscribed to newsletter'
    }), 200

@app.route('/api/contact', methods=['POST'])
def contact_submit():
    data = request.json
    
    # Validate required fields
    required_fields = ['name', 'email', 'message']
    for field in required_fields:
        if field not in data or not data[field]:
            return jsonify({'error': f'{field} is required'}), 400
    
    # Here you would typically save the contact form submission or send an email
    # For now, we'll just return a success message
    
    return jsonify({
        'message': 'Your message has been sent successfully'
    }), 201

# Static files route
@app.route('/', defaults={'path': 'index.html'})
@app.route('/<path:path>')
def serve_static(path):
    return app.send_static_file(path)

# Initialize database tables
# Using with_app_context instead of before_first_request
from flask import current_app

def create_tables():
    with current_app.app_context():
        db.create_all()
        
        # Add initial data if database is empty
        if not Category.query.first():
            # Add default categories
            categories = [
                Category(name='Vegetables', description='Fresh vegetables sourced from local farms', image_url='images/categories/vegetables.jpg'),
                Category(name='Fruits', description='Seasonal fruits packed with nutrients', image_url='images/categories/fruits.jpg'),
                Category(name='Herbs', description='Aromatic herbs to enhance your cooking', image_url='images/categories/herbs.jpg'),
                Category(name='Roots', description='Nutritious root vegetables', image_url='images/categories/roots.jpg')
            ]
            db.session.add_all(categories)
            db.session.commit()
            
            # Add sample products
            products = [
                Product(name='Organic Tomatoes', description='Juicy, locally grown organic tomatoes', price=3.99, stock=50, image_url='images/products/tomatoes.jpg', category_id=1, is_organic=True, unit='kg'),
                Product(name='Fresh Spinach', description='Nutrient-rich spinach leaves', price=2.49, stock=30, image_url='images/products/spinach.jpg', category_id=1, is_organic=True, is_featured=True, unit='bundle'),
                Product(name='Ripe Bananas', description='Sweet and energy-packed bananas', price=1.99, stock=100, image_url='images/products/bananas.jpg', category_id=2, unit='kg'),
                Product(name='Organic Apples', description='Crisp and sweet organic apples', price=4.99, stock=80, image_url='images/products/apples.jpg', category_id=2, is_organic=True, is_featured=True, unit='kg'),
                Product(name='Fresh Basil', description='Aromatic basil, perfect for pasta and salads', price=1.99, stock=20, image_url='images/products/basil.jpg', category_id=3, is_organic=True, unit='bundle'),
                Product(name='Sweet Potatoes', description='Versatile and nutritious sweet potatoes', price=2.99, stock=40, image_url='images/products/sweet_potatoes.jpg', category_id=4, is_featured=True, unit='kg')
            ]
            db.session.add_all(products)
            db.session.commit()

# Run the application
if __name__ == '__main__':
    # Call the create_tables function before running the app
    with app.app_context():
        create_tables()
    app.run(debug=True)