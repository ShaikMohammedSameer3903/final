import React, { useState, useEffect } from 'react';

// The following is a self-contained React application using standard CSS.
// All styles are defined within a <style> tag.
// This version removes all Tailwind CSS classes from the JSX.

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [orders, setOrders] = useState([]);
  const [orderMessage, setOrderMessage] = useState('');
  const [feedback, setFeedback] = useState('');
  const [adminForm, setAdminForm] = useState({
    id: null,
    name: '',
    description: '',
    price: '',
    stockQuantity: '',
    sku: '',
    imageUrl: '',
    active: true,
  });
  const [adminMessage, setAdminMessage] = useState('');
  const [profile, setProfile] = useState(null);
  const [loggedInUsername, setLoggedInUsername] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const getProductImage = (product) => {
    const label = encodeURIComponent(product?.name || 'Our Store');
    return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='400' height='300' fill='%231d4ed8'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='20'>${label}</text></svg>`;
  };

  const fetchProfile = async (uid = userId) => {
    if (!uid) return;
    try {
      const response = await fetch(`${API_BASE_URL}/users/${uid}`);
      if (!response.ok) return;
      const data = await response.json();
      setProfile(data);
    } catch {
      // silent
    }
  };

  // API base: use same-origin Nginx proxy to avoid CORS issues in Docker
  const API_BASE_URL = '/api';

  useEffect(() => {
    // Fetch products when the component mounts
    fetchProducts();
  }, []);

  useEffect(() => {
    if (currentPage === 'profile' && isLoggedIn && userId && !profile) {
      fetchProfile(userId);
    }
  }, [currentPage, isLoggedIn, userId, profile]);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/products`);
      const data = await response.json().catch(() => ({ message: 'Unexpected response from server.' }));
      if (!response.ok) {
        console.error('Failed to fetch products:', data?.message || `Failed to fetch products (${response.status})`);
        return;
      }
      if (data.length === 0) {
        // If no products, add some dummy data
        await fetch(`${API_BASE_URL}/products/add-dummy-data`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        const updatedResponse = await fetch(`${API_BASE_URL}/products`);
        const updatedData = await updatedResponse.json();
        setProducts(updatedData);
      } else {
        setProducts(data);
      }
    } catch (error) {
      console.error('Network error:', error);
    }
  };

  const handleRegister = async () => {
    setFeedback('');
    if (!username || !password || !email || !firstName || !lastName) {
      setFeedback('All fields are required for registration.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, email, firstName, lastName }),
      });
      const data = await response.json().catch(() => ({ message: 'Unexpected response from server.' }));
      if (!response.ok) {
        setFeedback(data?.message || `Registration failed (${response.status})`);
        return;
      }
      setFeedback(data.message);
      if (data.message.includes('successful')) {
        setUsername('');
        setPassword('');
        setEmail('');
        setFirstName('');
        setLastName('');
        setCurrentPage('login');
      }
    } catch (error) {
      setFeedback('Error during registration. Please try again.');
    }
  };

  const handleLogin = async () => {
    setFeedback('');
    if (!username || !password) {
      setFeedback('Username and password are required.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json().catch(() => ({ message: 'Unexpected response from server.' }));
      if (!response.ok) {
        setFeedback(data?.message || `Login failed (${response.status})`);
        return;
      }
      setFeedback(data.message);
      if (data.message.includes('successful')) {
        setIsLoggedIn(true);
        if (data.userId) {
          setUserId(data.userId);
        }
        setLoggedInUsername(username);
        setIsAdmin(data.isAdmin === 'true');
        setUsername('');
        setPassword('');
        setCurrentPage('products');
        // Refresh products after login (admin might have extra data)
        fetchProducts();
        fetchCart(data.userId);
        fetchWishlist(data.userId);
        fetchOrders(data.userId);
        fetchProfile(data.userId);
      }
    } catch (error) {
      setFeedback('Error during login. Please try again.');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsAdmin(false);
    setUserId(null);
    setCart([]);
    setWishlist([]);
    setOrders([]);
    setProfile(null);
    setLoggedInUsername('');
    setCurrentPage('home');
  };

  // Helpers to sync with backend for logged-in users
  const fetchCart = async (uid = userId) => {
    if (!uid) return;
    try {
      const response = await fetch(`${API_BASE_URL}/cart/${uid}`);
      if (!response.ok) return;
      const data = await response.json();
      setCart((data.cartItems || []).map(ci => ({
        id: ci.id,
        productId: ci.product?.id,
        name: ci.product?.name,
        price: ci.unitPrice,
        quantity: ci.quantity,
      })));
    } catch {
      // silent fail
    }
  };

  const fetchOrders = async (uid = userId) => {
    if (!uid) return;
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${uid}`);
      if (!response.ok) return;
      const data = await response.json();
      setOrders(data || []);
    } catch {
      // silent
    }
  };

  const fetchWishlist = async (uid = userId) => {
    if (!uid) return;
    try {
      const response = await fetch(`${API_BASE_URL}/wishlist/${uid}`);
      if (!response.ok) return;
      const data = await response.json();
      setWishlist(data.products || []);
    } catch {
      // silent
    }
  };

  const addToCart = async (product) => {
    if (!userId) {
      setFeedback('Please login to add items to your cart.');
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/cart/${userId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        setFeedback(error?.message || 'Failed to add to cart.');
        return;
      }
      setFeedback('Added to cart!');
      fetchCart(userId);
    } catch (error) {
      setFeedback('Error adding to cart. Please try again.');
    }
  };

  const handleAddToWishlist = async (product) => {
    if (!userId) {
      setFeedback('Please login to add items to your wishlist.');
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/wishlist/${userId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        setFeedback(error?.message || 'Failed to add to wishlist.');
        return;
      }
      setFeedback('Added to wishlist!');
      fetchWishlist(userId); // Refresh wishlist
    } catch (error) {
      setFeedback('Error adding to wishlist. Please try again.');
    }
  };

  const handleRemoveFromWishlist = async (productId) => {
    if (!userId) {
      setFeedback('Please login to manage your wishlist.');
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/wishlist/remove/${userId}/${productId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        setFeedback(error?.message || 'Failed to remove from wishlist.');
        return;
      }
      setWishlist(wishlist.filter(item => item.id !== productId));
    } catch (error) {
      setFeedback('Error removing from wishlist. Please try again.');
    }
  };

  const handlePlaceOrder = async () => {
    if (!userId) {
      setOrderMessage('You must be logged in to place an order.');
      return;
    }
    if (cart.length === 0) {
      setOrderMessage('Your cart is empty.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/orders/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setOrderMessage(data?.message || 'Failed to place order.');
        return;
      }
      setOrderMessage('Order placed successfully! Your order ID is ' + data.orderId);
      setCart([]); // Clear cart
      fetchOrders(userId); // Refresh orders
    } catch (error) {
      setOrderMessage('Error placing order. Please try again.');
    }
  };

  const handleAdminInputChange = (field, value) => {
    setAdminForm(prev => ({ ...prev, [field]: value }));
  };

  const resetAdminForm = () => {
    setAdminForm({
      id: null, name: '', description: '', price: '',
      stockQuantity: '', sku: '', imageUrl: '', active: true,
    });
  };

  const handleAdminSaveProduct = async () => {
    const { id, ...productData } = adminForm;
    const url = id ? `${API_BASE_URL}/products/${id}` : `${API_BASE_URL}/products`;
    const method = id ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });
      const data = await response.json();
      if (!response.ok) {
        setAdminMessage(data?.message || 'Failed to save product.');
        return;
      }
      setAdminMessage(`Product ${id ? 'updated' : 'created'} successfully.`);
      resetAdminForm();
      fetchProducts();
    } catch (error) {
      setAdminMessage('Error saving product.');
    }
  };

  const handleAdminEditProduct = (product) => {
    setAdminForm({ ...product, price: product.price.toString() });
  };

  const handleAdminDeleteProduct = async (productId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        setAdminMessage(error?.message || 'Failed to delete product.');
        return;
      }
      setAdminMessage('Product deleted successfully.');
      fetchProducts();
    } catch (error) {
      setAdminMessage('Error deleting product.');
    }
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'home':
        return (
          <div className="content home">
            <div className="home-hero">
              <div className="home-hero-text">
                <h1 className="main-title">Welcome to Our Store</h1>
                <p className="subtitle">
                  Discover best deals on mobiles, fashion, electronics, groceries and more.
                </p>
                <button
                  type="button"
                  className="auth-button login-button home-hero-button"
                  onClick={() => setCurrentPage('products')}
                >
                  Start Shopping
                </button>
              </div>
              <div className="home-hero-deals">
                <div className="deals-card">
                  <h2 className="section-title">Today's top picks</h2>
                  <div className="deals-grid">
                    <div className="deal-item deal-green">
                      <h3>Up to 50% off on headphones</h3>
                    </div>
                    <div className="deal-item deal-purple">
                      <h3>Buy 1 Get 1 on fashion</h3>
                    </div>
                    <div className="deal-item deal-red">
                      <h3>Free delivery on prime deals</h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="home-categories-section">
              <h2 className="section-title">Shop by category</h2>
              <div className="home-categories-grid">
                {['Mobiles', 'Electronics', 'Fashion', 'Home & Kitchen', 'Beauty', 'Grocery'].map(cat => (
                  <div key={cat} className="home-category-card">
                    <p>{cat}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'products':
        return (
          <div className="content products-page">
            <h2 className="section-title text-center">All Products</h2>
            <div className="products-grid">
              {products.map(product => (
                <div key={product.id} className="product-card">
                  <div className="product-image-wrapper">
                    <img
                      src={getProductImage(product)}
                      alt={product.name}
                      className="product-image"
                    />
                  </div>
                  <div className="product-card-body">
                    <h3 className="product-name">{product.name}</h3>
                    <p className="product-description">{product.description}</p>
                    <p className="product-price">${product.price.toFixed(2)}</p>
                  </div>
                  <div className="product-card-actions">
                    <button
                      onClick={() => addToCart(product)}
                      className="add-to-cart-button"
                    >
                      Add to Cart
                    </button>
                    <button
                      onClick={() => handleAddToWishlist(product)}
                      className="auth-button login-button"
                    >
                      Add to Wishlist
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'cart': {
        const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        return (
          <div className="content cart-page">
            <h2 className="section-title text-center">Your Cart</h2>
            {cart.length === 0 ? (
              <p className="empty-cart-message">Your cart is empty.</p>
            ) : (
              <div className="cart-container">
                <div className="cart-items-list">
                  {cart.map(item => (
                    <div key={item.id} className="cart-item">
                      <div>
                        <h3>{item.name}</h3>
                        <p>Quantity: {item.quantity}</p>
                      </div>
                      <p className="cart-item-price">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="cart-summary">
                  <p className="cart-total">Total: ${total.toFixed(2)}</p>
                  <button
                    onClick={handlePlaceOrder}
                    className="place-order-button"
                  >
                    Place Order
                  </button>
                </div>
                {orderMessage && (
                  <div className="order-message">
                    {orderMessage}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }
      case 'wishlist':
        if (!userId) {
          return (
            <div className="content">
              <h2 className="section-title">Your Wishlist</h2>
              <p className="subtitle">Please login to view your wishlist.</p>
            </div>
          );
        }
        return (
          <div className="content products-page">
            <h2 className="section-title text-center">Your Wishlist</h2>
            {wishlist.length === 0 ? (
              <p className="empty-cart-message">Your wishlist is empty.</p>
            ) : (
              <div className="products-grid">
                {wishlist.map(product => (
                  <div key={product.id} className="product-card">
                    <div className="product-image-wrapper">
                      <img
                        src={getProductImage(product)}
                        alt={product.name}
                        className="product-image"
                      />
                    </div>
                    <div className="product-card-body">
                      <h3 className="product-name">{product.name}</h3>
                      <p className="product-description">{product.description}</p>
                      <p className="product-price">${product.price.toFixed(2)}</p>
                    </div>
                    <div className="product-card-actions">
                      <button
                        onClick={() => addToCart(product)}
                        className="add-to-cart-button"
                      >
                        Add to Cart
                      </button>
                      <button
                        onClick={() => handleRemoveFromWishlist(product.id)}
                        className="logout-button"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'profile':
        if (!isLoggedIn || !userId) {
          return (
            <div className="content">
              <h2 className="section-title">Your Profile</h2>
              <p className="subtitle">Please login to view your profile.</p>
            </div>
          );
        }
        return (
          <div className="content profile-page">
            <div className="profile-card">
              <div className="profile-header">
                <div className="profile-avatar">
                  {(profile?.firstName?.[0] || profile?.username?.[0] || loggedInUsername?.[0] || 'U').toUpperCase()}
                </div>
                <div>
                  <h2 className="profile-name">
                    {profile?.firstName || profile?.username || loggedInUsername || `User #${userId}`}
                  </h2>
                  <p className="profile-username">@{profile?.username || loggedInUsername}</p>
                </div>
              </div>
              <div className="profile-details">
                <div className="profile-detail-row">
                  <span className="profile-label">Email</span>
                  <span className="profile-value">{profile?.email || 'Not set'}</span>
                </div>
                <div className="profile-detail-row">
                  <span className="profile-label">Phone</span>
                  <span className="profile-value">{profile?.phoneNumber || 'Not set'}</span>
                </div>
                <div className="profile-detail-row">
                  <span className="profile-label">Address</span>
                  <span className="profile-value">
                    {profile?.address || profile?.city
                      ? `${profile?.address || ''} ${profile?.city || ''}`.trim()
                      : 'Not set'}
                  </span>
                </div>
                <div className="profile-detail-row">
                  <span className="profile-label">Country</span>
                  <span className="profile-value">{profile?.country || 'Not set'}</span>
                </div>
              </div>
              <div className="profile-stats">
                <div className="profile-stat">
                  <span className="profile-stat-number">{orders.length}</span>
                  <span className="profile-stat-label">Orders</span>
                </div>
                <div className="profile-stat">
                  <span className="profile-stat-number">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                  <span className="profile-stat-label">Items in Cart</span>
                </div>
                <div className="profile-stat">
                  <span className="profile-stat-number">{wishlist.length}</span>
                  <span className="profile-stat-label">Wishlist</span>
                </div>
              </div>
            </div>
          </div>
        );
      case 'orders':
        if (!userId) {
          return (
            <div className="content">
              <h2 className="section-title">Your Orders</h2>
              <p className="subtitle">Please login to view your orders.</p>
            </div>
          );
        }
        return (
          <div className="content products-page">
            <h2 className="section-title text-center">Your Orders</h2>
            {orders.length === 0 ? (
              <p className="empty-cart-message">You have no orders yet.</p>
            ) : (
              <div className="cart-items-list">
                {orders.map(order => (
                  <div key={order.id} className="cart-item">
                    <div>
                      <h3>Order #{order.id}</h3>
                      <p>Status: {order.status}</p>
                      <p>Items: {order.totalQuantity}</p>
                    </div>
                    <p className="cart-item-price">
                      ${order.totalPrice?.toFixed ? order.totalPrice.toFixed(2) : order.totalPrice}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'register':
        return (
          <div className="content auth-page">
            <div className="auth-form-card">
              <h2 className="section-title">Register</h2>
              <p className="auth-subtitle">Create your Our Store account to track orders and wishlist.</p>
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-field"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                />
                <input
                  type="text"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                />
                <input
                  type="text"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="input-field"
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="input-field"
                />
                <button
                  onClick={handleRegister}
                  className="auth-button register-button"
                >
                  Register
                </button>
              </div>
              {feedback && <p className="feedback-message">{feedback}</p>}
            </div>
          </div>
        );
      case 'login':
        return (
          <div className="content auth-page">
            <div className="auth-form-card">
              <h2 className="section-title">Login</h2>
              <p className="auth-subtitle">Sign in to continue shopping and view your profile.</p>
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-field"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field"
                />
                <button
                  type="button"
                  className="auth-button login-button"
                  onClick={handleLogin}
                >
                  Login
                </button>
                <button
                  type="button"
                  className="auth-button register-button"
                  onClick={() => setCurrentPage('register')}
                >
                  Create an account
                </button>
              </div>
              {feedback && (
                <div className="feedback-message">{feedback}</div>
              )}
            </div>
          </div>
        );
      case 'admin':
        if (!isLoggedIn || !isAdmin) {
          return (
            <div className="content">
              <h2 className="section-title">Admin Area</h2>
              <p className="subtitle">You must be an admin to view this page.</p>
            </div>
          );
        }
        return (
          <div className="content products-page">
            <h2 className="section-title text-center">Admin - Manage Products</h2>
            <div className="auth-form-card" style={{ marginBottom: '2rem' }}>
              <h3 className="section-title" style={{ marginBottom: '1rem' }}>
                {adminForm.id ? 'Edit Product' : 'Add New Product'}
              </h3>
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Name"
                  value={adminForm.name}
                  onChange={(e) => handleAdminInputChange('name', e.target.value)}
                  className="input-field"
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={adminForm.description}
                  onChange={(e) => handleAdminInputChange('description', e.target.value)}
                  className="input-field"
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={adminForm.price}
                  onChange={(e) => handleAdminInputChange('price', e.target.value)}
                  className="input-field"
                  step="0.01"
                />
                <input
                  type="number"
                  placeholder="Stock Quantity"
                  value={adminForm.stockQuantity}
                  onChange={(e) => handleAdminInputChange('stockQuantity', e.target.value)}
                  className="input-field"
                />
                <input
                  type="text"
                  placeholder="SKU"
                  value={adminForm.sku}
                  onChange={(e) => handleAdminInputChange('sku', e.target.value)}
                  className="input-field"
                />
                <input
                  type="text"
                  placeholder="Image URL"
                  value={adminForm.imageUrl}
                  onChange={(e) => handleAdminInputChange('imageUrl', e.target.value)}
                  className="input-field"
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={adminForm.active}
                    onChange={(e) => handleAdminInputChange('active', e.target.checked)}
                  />
                  Active
                </label>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={handleAdminSaveProduct}
                    className="auth-button login-button"
                  >
                    {adminForm.id ? 'Update Product' : 'Create Product'}
                  </button>
                  {adminForm.id && (
                    <button
                      type="button"
                      onClick={resetAdminForm}
                      className="auth-button register-button"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {adminMessage && <p className="feedback-message">{adminMessage}</p>}
              </div>
            </div>

            <div className="products-grid">
              {products.map(product => (
                <div key={product.id} className="product-card">
                  <div className="product-image-wrapper">
                    <img
                      src={getProductImage(product)}
                      alt={product.name}
                      className="product-image"
                    />
                  </div>
                  <div className="product-card-body">
                    <h3 className="product-name">{product.name}</h3>
                    <p className="product-description">{product.description}</p>
                    <p className="product-price">${product.price.toFixed(2)}</p>
                    <p className="product-description">Stock: {product.stockQuantity ?? 0}</p>
                    <p className="product-description">SKU: {product.sku || '-'}</p>
                  </div>
                  <div className="product-card-actions">
                    <button
                      onClick={() => handleAdminEditProduct(product)}
                      className="add-to-cart-button"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleAdminDeleteProduct(product.id)}
                      className="logout-button"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'cart':
        const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        return (
          <div className="content cart-page">
            <h2 className="section-title text-center">Your Cart</h2>
            {cart.length === 0 ? (
              <p className="empty-cart-message">Your cart is empty.</p>
            ) : (
              <div className="cart-container">
                <div className="cart-items-list">
                  {cart.map(item => (
                    <div key={item.id} className="cart-item">
                      <div>
                        <h3>{item.name}</h3>
                        <p>Quantity: {item.quantity}</p>
                      </div>
                      <p className="cart-item-price">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
                <div className="cart-summary">
                  <p className="cart-total">Total: ${total.toFixed(2)}</p>
                  <button
                    onClick={handlePlaceOrder}
                    className="place-order-button"
                  >
                    Place Order
                  </button>
                </div>
                {orderMessage && (
                  <div className="order-message">
                    {orderMessage}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const navItems = [
    { name: 'Home', page: 'home', visible: true },
    { name: 'Products', page: 'products', visible: true },
    { name: 'Cart', page: 'cart', visible: true },
    { name: 'Wishlist', page: 'wishlist', visible: isLoggedIn },
    { name: 'Profile', page: 'profile', visible: isLoggedIn },
    { name: 'Orders', page: 'orders', visible: isLoggedIn },
    { name: 'Register', page: 'register', visible: !isLoggedIn },
    { name: 'Login', page: 'login', visible: !isLoggedIn },
    { name: 'Admin', page: 'admin', visible: isLoggedIn && isAdmin },
  ];

  return (
    <div className="app-container">
      <style>
        {`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');

        :root {
            --bg-light: #f9fafb;
            --bg-white: #ffffff;
            --text-dark: #111827;
            --text-gray: #374151;
            --text-light-gray: #6b7280;
            --blue-800: #1e40af;
            --blue-600: #2563eb;
            --blue-700: #1d4ed8;
            --green-600: #16a34a;
            --green-700: #15803d;
            --red-500: #ef4444;
            --red-600: #dc2626;
            --border-gray: #d1d5db;
        }

        .app-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          font-family: 'Inter', sans-serif;
          background-color: var(--bg-light);
          color: var(--text-dark);
        }

        .header {
          background-color: var(--blue-800);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          padding: 0.75rem 1rem 0.5rem;
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .header-container {
          max-width: 1280px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .logo-area {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }

        .logo {
          font-size: 1.875rem;
          font-weight: 800;
          color: var(--bg-white);
        }

        .header-greeting {
          font-size: 0.8rem;
          color: var(--bg-white);
          opacity: 0.9;
        }

        .search-container {
          flex-grow: 1;
          max-width: 32rem;
        }

        .search-wrapper {
          display: flex;
          align-items: stretch;
          background-color: var(--bg-white);
          border-radius: 0.5rem;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }

        .search-input {
          width: 100%;
          padding: 0.6rem 0.75rem;
          border: none;
          outline: none;
        }

        .search-input:focus {
          outline: none;
        }

        .search-button {
          padding: 0 1.25rem;
          background-color: var(--blue-600);
          color: var(--bg-white);
          border: none;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
        }

        .search-button:hover {
          background-color: var(--blue-700);
        }

        .nav {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .nav-link {
          color: var(--bg-white);
          font-weight: 600;
          transition: color 0.2s ease, border-color 0.2s ease;
          cursor: pointer;
          padding-bottom: 0.15rem;
          border-bottom: 2px solid transparent;
        }

        .nav-link:hover {
          color: #e5e7eb;
        }

        .nav-link-active {
          border-bottom-color: var(--bg-white);
        }

        .category-bar {
          margin-top: 0.5rem;
          background-color: #1d4ed8;
        }

        .category-scroll {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0.35rem 0.5rem 0.6rem;
          display: flex;
          gap: 0.5rem;
          overflow-x: auto;
        }

        .category-chip {
          border: none;
          border-radius: 9999px;
          padding: 0.35rem 0.9rem;
          font-size: 0.85rem;
          background-color: var(--bg-white);
          color: var(--text-gray);
          white-space: nowrap;
          cursor: pointer;
        }

        .category-chip:hover {
          background-color: #e5e7eb;
        }

        .logout-button {
          background-color: var(--red-500);
          color: var(--bg-white);
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          font-weight: 600;
          transition: background-color 0.3s ease;
          border: none;
          cursor: pointer;
        }

        .logout-button:hover {
          background-color: var(--red-600);
        }

        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .content {
          flex: 1;
          padding: 2rem;
          background-color: var(--bg-light);
          display: flex;
          flex-direction: column;
        }

        .content.home {
          background: radial-gradient(circle at top, #1d4ed8 0, #0f172a 35%, #020617 80%);
          color: #e5e7eb;
          align-items: center;
          justify-content: center;
          perspective: 1400px;
        }

        .home-hero {
          width: 100%;
          max-width: 1120px;
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
          gap: 2rem;
          align-items: center;
          margin-bottom: 3rem;
        }

        .home-hero-text {
          transform: translateY(10px);
          animation: fadeIn 0.9s ease-out forwards;
        }

        .main-title {
          font-size: 2.25rem;
          font-weight: 800;
          background: linear-gradient(to right, #f97316, #facc15, #22c55e);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          margin-bottom: 1rem;
          text-align: left;
          letter-spacing: 0.02em;
          animation: fadeIn 1s ease-in-out;
        }

        .subtitle {
          font-size: 1.25rem;
          color: #d1d5db;
          margin-bottom: 2rem;
          text-align: left;
          max-width: 32rem;
        }

        .home-hero-button {
          width: auto;
          padding-inline: 2.75rem;
          padding-block: 0.9rem;
          border-radius: 9999px;
          font-size: 1rem;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          background: linear-gradient(135deg, #f97316, #ec4899, #6366f1);
          border: none;
          position: relative;
          box-shadow:
            0 18px 45px rgba(0,0,0,0.55),
            0 0 0 1px rgba(248, 250, 252, 0.14);
          transform: translateY(0);
          transition:
            transform 0.18s ease-out,
            box-shadow 0.18s ease-out,
            filter 0.18s ease-out;
        }

        .home-hero-button::after {
          content: '';
          position: absolute;
          inset: 2px;
          border-radius: inherit;
          border: 1px solid rgba(248, 250, 252, 0.25);
          pointer-events: none;
        }

        .home-hero-button:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow:
            0 24px 60px rgba(0,0,0,0.7),
            0 0 0 1px rgba(248, 250, 252, 0.18);
          filter: brightness(1.05);
        }

        .home-hero-button:active {
          transform: translateY(0px) scale(0.99);
          box-shadow:
            0 10px 25px rgba(0,0,0,0.6),
            0 0 0 1px rgba(248, 250, 252, 0.2);
        }

        .section-title {
          font-size: 1.875rem;
          font-weight: 700;
          color: var(--text-dark);
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .content.home .section-title {
          color: #e5e7eb;
        }

        .deals-card {
          width: 100%;
          max-width: 30rem;
          padding: 1.75rem;
          border-radius: 1.5rem;
          background: radial-gradient(circle at top left, rgba(59,130,246,0.25), transparent 55%),
                      radial-gradient(circle at bottom right, rgba(236,72,153,0.25), transparent 60%),
                      rgba(15,23,42,0.92);
          box-shadow:
            0 30px 80px rgba(15,23,42,0.9),
            0 0 0 1px rgba(148,163,184,0.3);
          margin-left: auto;
          transform-style: preserve-3d;
          transform: rotateY(-16deg) rotateX(6deg) translateY(10px);
          transition: transform 0.4s ease, box-shadow 0.4s ease;
        }

        .deals-grid {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 1.5rem;
        }

        .deal-item {
          padding: 1.5rem;
          border-radius: 0.75rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          transition: transform 0.3s ease;
        }

        .deal-item:hover {
          transform: translateY(-6px) scale(1.04) translateZ(18px);
        }

        .deal-item h3 {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--bg-white);
        }

        .home-categories-section {
          width: 100%;
          max-width: 1120px;
          margin: 0 auto;
        }

        .home-categories-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 1.25rem;
          margin-top: 1.25rem;
        }

        .home-category-card {
          padding: 1.2rem 1.4rem;
          border-radius: 1rem;
          background: linear-gradient(135deg, rgba(15,118,110,0.2), rgba(37,99,235,0.3));
          border: 1px solid rgba(148,163,184,0.5);
          box-shadow:
            0 16px 40px rgba(15,23,42,0.75),
            0 0 0 1px rgba(15,23,42,0.9);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          color: #f9fafb;
          transform-style: preserve-3d;
          transform: translateZ(0);
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
        }

        .home-category-card p {
          font-weight: 600;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          font-size: 0.85rem;
        }

        .home-category-card::after {
          content: '➜';
          font-size: 1rem;
          opacity: 0.8;
        }

        .home-category-card:hover {
          transform: translateY(-4px) translateZ(14px) scale(1.02);
          box-shadow:
            0 22px 50px rgba(15,23,42,0.95),
            0 0 0 1px rgba(248,250,252,0.36);
          border-color: rgba(248,250,252,0.5);
        }

        .deal-green {
          background-image: linear-gradient(to bottom right, #4ade80, #16a34a);
        }

        .deal-purple {
          background-image: linear-gradient(to bottom right, #c084fc, #9333ea);
        }

        .deal-red {
          background-image: linear-gradient(to bottom right, #f87171, #dc2626);
        }

        .auth-page {
          align-items: center;
          justify-content: center;
          flex-grow: 1;
          background: radial-gradient(circle at top, #1d4ed8 0, #f9fafb 55%);
        }

        .auth-form-card {
          width: 100%;
          max-width: 28rem;
          padding: 2rem;
          background-color: var(--bg-white);
          border-radius: 1rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          text-align: center;
        }

        .auth-subtitle {
          font-size: 0.95rem;
          color: var(--text-light-gray);
          margin-bottom: 1.5rem;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .input-field {
          width: 100%;
          padding: 0.75rem;
          border-radius: 0.5rem;
          border: 1px solid var(--border-gray);
          transition: all 0.3s ease;
        }

        .input-field:focus {
          outline: none;
          box-shadow: 0 0 0 2px var(--blue-600);
        }

        .auth-button {
          width: 100%;
          padding: 0.75rem;
          border-radius: 0.5rem;
          font-weight: 600;
          transition: background-color 0.3s ease, box-shadow 0.3s ease;
          border: none;
          cursor: pointer;
          color: var(--bg-white);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        
        .auth-button:hover {
          background-color: var(--blue-700);
        }

        .register-button {
          background-color: var(--blue-600);
        }

        .login-button {
          background-color: var(--blue-600);
        }

        .feedback-message {
          margin-top: 1rem;
          text-align: center;
          color: var(--red-500);
        }

        .products-grid {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 2rem;
        }

        .product-card {
          background-color: var(--bg-white);
          padding: 1.5rem;
          border-radius: 1rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: transform 0.3s ease;
        }

        .product-card:hover {
          transform: scale(1.05);
        }

        .product-image-wrapper {
          width: 100%;
          margin-bottom: 1rem;
          border-radius: 0.75rem;
          overflow: hidden;
          background-color: #e5e7eb;
        }

        .product-image {
          width: 100%;
          height: 180px;
          object-fit: cover;
          display: block;
        }

        .product-card-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .product-card-actions {
          margin-top: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .product-name {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-dark);
          margin-bottom: 0.5rem;
        }

        .product-description {
          color: var(--text-light-gray);
          margin-bottom: 1rem;
        }

        .product-price {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--green-600);
          margin-bottom: 1rem;
        }

        .add-to-cart-button {
          width: 100%;
          background-color: var(--blue-600);
          color: var(--bg-white);
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          font-weight: 600;
          transition: background-color 0.3s ease;
          border: none;
          cursor: pointer;
        }
        
        .add-to-cart-button:hover {
          background-color: var(--blue-700);
        }

        .empty-cart-message {
          text-align: center;
          color: var(--text-light-gray);
          font-size: 1.25rem;
          flex-grow: 1;
        }

        .cart-page {
          display: flex;
          flex-direction: column;
          flex-grow: 1;
        }

        .cart-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex-grow: 1;
          justify-content: center;
        }

        .cart-items-list {
          width: 100%;
          max-width: 56rem;
          background-color: var(--bg-white);
          padding: 2rem;
          border-radius: 1rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          margin-bottom: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .cart-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .cart-item:last-child {
          border-bottom: none;
        }

        .cart-item-price {
          font-weight: 700;
        }

        .cart-summary {
          width: 100%;
          max-width: 28rem;
          background-color: var(--bg-white);
          padding: 2rem;
          border-radius: 1rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .cart-total {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-dark);
          margin-bottom: 1rem;
        }

        .place-order-button {
          width: 100%;
          background-color: var(--green-600);
          color: var(--bg-white);
          padding: 0.75rem;
          border-radius: 0.5rem;
          font-weight: 600;
          font-size: 1.125rem;
          transition: background-color 0.3s ease;
          border: none;
          cursor: pointer;
        }

        .place-order-button:hover {
          background-color: var(--green-700);
        }

        .order-message {
          position: fixed;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          padding: 1rem;
          background-color: var(--green-600);
          color: var(--bg-white);
          border-radius: 0.5rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          z-index: 50;
          animation: slideUp 0.5s ease-out forwards;
        }
        
        .footer {
          background-color: var(--text-dark);
          color: var(--bg-white);
          padding: 1rem;
          text-align: center;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slideUp {
          from { transform: translateY(100px) translateX(-50%); opacity: 0; }
          to { transform: translateY(0) translateX(-50%); opacity: 1; }
        }

        @media (min-width: 768px) {
          .main-title {
            font-size: 3.75rem;
          }
          .subtitle {
            font-size: 1.5rem;
          }
          .deals-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .products-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .deals-grid {
            grid-template-columns: repeat(3, 1fr);
          }
          .products-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (min-width: 1280px) {
          .products-grid {
            grid-template-columns: repeat(4, 1fr);
          }

          .search-container {
            width: 100%;
            max-width: 40rem;
          }

          .search-wrapper {
            max-width: 40rem;
          }
        }

        .profile-page {
          align-items: center;
          justify-content: center;
        }

        .profile-card {
          width: 100%;
          max-width: 40rem;
          padding: 2rem;
          background-color: var(--bg-white);
          border-radius: 1.25rem;
          box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.2),
                      0 10px 10px -5px rgba(15, 23, 42, 0.1);
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .profile-header {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .profile-avatar {
          width: 3.5rem;
          height: 3.5rem;
          border-radius: 9999px;
          background-color: var(--blue-600);
          color: var(--bg-white);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: 700;
        }

        .profile-name {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0;
        }

        .profile-username {
          font-size: 0.9rem;
          color: var(--text-light-gray);
        }

        .profile-details {
          border-top: 1px solid #e5e7eb;
          padding-top: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .profile-detail-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.95rem;
        }

        .profile-label {
          color: var(--text-light-gray);
        }

        .profile-value {
          font-weight: 500;
        }

        .profile-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 1rem;
          margin-top: 0.5rem;
        }

        .profile-stat {
          background-color: #eff6ff;
          border-radius: 0.75rem;
          padding: 0.75rem;
          text-align: center;
        }

        .profile-stat-number {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--blue-700);
        }

        .profile-stat-label {
          font-size: 0.8rem;
          color: var(--text-light-gray);
        }
      `}
      </style>

      <header className="header">
        <div className="header-container">
          <div className="logo-area">
            <h1 className="logo">Our Store</h1>
            {isLoggedIn && (
              <p className="header-greeting">
                Hello, {profile?.firstName || profile?.username || loggedInUsername || `User #${userId}`}
              </p>
            )}
          </div>
          <div className="search-container">
            <div className="search-wrapper">
              <input
                type="text"
                placeholder="Search for products, brands and more..."
                className="search-input"
              />
              <button type="button" className="search-button">Search</button>
            </div>
          </div>
          <nav className="nav">
            {navItems.map(item => item.visible && (
              <button
                key={item.page}
                type="button"
                onClick={() => setCurrentPage(item.page)}
                className={`nav-link ${currentPage === item.page ? 'nav-link-active' : ''}`}
              >
                {item.name}
              </button>
            ))}
            {isLoggedIn && (
              <button
                type="button"
                onClick={handleLogout}
                className="logout-button"
              >
                Logout
              </button>
            )}
          </nav>
        </div>
        <div className="category-bar">
          <div className="category-scroll">
            {['Best Sellers','Mobiles','Fashion','Electronics','Home & Kitchen','Beauty','Books','Grocery'].map(label => (
              <button key={label} type="button" className="category-chip">
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="main-content">{renderContent()}</main>

      <footer className="footer">
        <div className="footer-container">
          <p>&copy; {new Date().getFullYear()} Our Store. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;