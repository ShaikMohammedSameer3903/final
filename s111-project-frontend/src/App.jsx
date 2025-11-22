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

  const getProductImage = (product) => {
    if (product && product.imageUrl) {
      return product.imageUrl;
    }
    return 'https://via.placeholder.com/400x300?text=Our+Store';
  };

  // API base: use same-origin Nginx proxy to avoid CORS issues in Docker
  const API_BASE_URL = '/api';

  useEffect(() => {
    // Fetch products when the component mounts
    fetchProducts();
  }, []);

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
    try {
      const response = await fetch(`${API_BASE_URL}/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
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
        setCurrentPage('login');
      }
    } catch (error) {
      setFeedback('Error during registration. Please try again.');
    }
  };

  const handleLogin = async () => {
    setFeedback('');
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
        setIsAdmin(data.isAdmin === 'true');
        setUsername('');
        setPassword('');
        setCurrentPage('products');
        // Refresh products after login (admin might have extra data)
        fetchProducts();
        fetchCart(data.userId);
        fetchWishlist(data.userId);
        fetchOrders(data.userId);
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

  const fetchWishlist = async (uid = userId) => {
    if (!uid) return;
    try {
      const response = await fetch(`${API_BASE_URL}/wishlist/${uid}`);
      if (!response.ok) return;
      const data = await response.json();
      setWishlist((data.products || []));
    } catch {
      // silent
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

  // Admin product management helpers
  const resetAdminForm = () => {
    setAdminForm({
      id: null,
      name: '',
      description: '',
      price: '',
      stockQuantity: '',
      sku: '',
      imageUrl: '',
      active: true,
    });
    setAdminMessage('');
  };

  const handleAdminInputChange = (field, value) => {
    setAdminForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAdminEditProduct = (product) => {
    setAdminForm({
      id: product.id,
      name: product.name || '',
      description: product.description || '',
      price: product.price != null ? product.price : '',
      stockQuantity: product.stockQuantity != null ? product.stockQuantity : '',
      sku: product.sku || '',
      imageUrl: product.imageUrl || '',
      active: product.active != null ? product.active : true,
    });
    setCurrentPage('admin');
  };

  const handleAdminSaveProduct = async () => {
    try {
      const payload = {
        name: adminForm.name,
        description: adminForm.description,
        price: adminForm.price === '' ? 0 : Number(adminForm.price),
        stockQuantity: adminForm.stockQuantity === '' ? 0 : Number(adminForm.stockQuantity),
        sku: adminForm.sku,
        imageUrl: adminForm.imageUrl,
        active: Boolean(adminForm.active),
      };

      const isEdit = !!adminForm.id;
      const url = isEdit
        ? `${API_BASE_URL}/admin/products/${adminForm.id}`
        : `${API_BASE_URL}/admin/products`;
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        setAdminMessage(`Failed to save product (${response.status})`);
        return;
      }
      await fetchProducts();
      setAdminMessage(isEdit ? 'Product updated successfully.' : 'Product created successfully.');
      // Keep form values so admin sees what was saved
    } catch (error) {
      setAdminMessage('Error saving product.');
    }
  };

  const handleAdminDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const response = await fetch(`${API_BASE_URL}/admin/products/${productId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        setAdminMessage(`Failed to delete product (${response.status})`);
        return;
      }
      await fetchProducts();
      setAdminMessage('Product deleted successfully.');
      if (adminForm.id === productId) {
        resetAdminForm();
      }
    } catch (error) {
      setAdminMessage('Error deleting product.');
    }
  };

  const addToCart = async (product) => {
    // If user is logged in, sync with backend cart
    if (userId) {
      try {
        await fetch(`${API_BASE_URL}/cart/${userId}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: product.id, quantity: 1 }),
        });
        await fetchCart();
        return;
      } catch {
        // fall back to local cart
      }
    }

    // Local fallback
    setCart(prevCart => {
      const existingProduct = prevCart.find(item => item.id === product.id);
      if (existingProduct) {
        return prevCart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const handlePlaceOrder = async () => {
    if (!userId) {
      setOrderMessage('Please login to place an order.');
      setTimeout(() => setOrderMessage(''), 3000);
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${userId}`, {
        method: 'POST',
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setOrderMessage(data.message || `Failed to place order (${response.status})`);
      } else {
        setOrderMessage(data.message || 'Order placed successfully!');
      }
      await fetchCart();
      await fetchOrders();
      setTimeout(() => setOrderMessage(''), 3000);
    } catch {
      setOrderMessage('Error placing order.');
      setTimeout(() => setOrderMessage(''), 3000);
    }
  };

  const handleAddToWishlist = async (product) => {
    if (!userId) {
      setFeedback('Please login to use wishlist.');
      return;
    }
    try {
      await fetch(`${API_BASE_URL}/wishlist/${userId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id }),
      });
      await fetchWishlist();
    } catch {
      setFeedback('Error updating wishlist.');
    }
  };

  const handleRemoveFromWishlist = async (productId) => {
    if (!userId) return;
    try {
      await fetch(`${API_BASE_URL}/wishlist/${userId}/items/${productId}`, {
        method: 'DELETE',
      });
      await fetchWishlist();
    } catch {
      // ignore
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
                  <h2 className="section-title">Today&apos;s top picks</h2>
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
                <button
                  onClick={handleLogin}
                  className="auth-button login-button"
                >
                  Login
                </button>
              </div>
              {feedback && <p className="feedback-message">{feedback}</p>}
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

        .main-title {
          font-size: 2.25rem;
          font-weight: 800;
          color: var(--blue-800);
          margin-bottom: 1rem;
          text-align: center;
          animation: fadeIn 1s ease-in-out;
        }

        .subtitle {
          font-size: 1.25rem;
          color: var(--text-gray);
          margin-bottom: 2rem;
          text-align: center;
        }

        .section-title {
          font-size: 1.875rem;
          font-weight: 700;
          color: var(--text-dark);
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .deals-card {
          width: 100%;
          max-width: 56rem;
          padding: 1.5rem;
          background-color: var(--bg-white);
          border-radius: 1rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          margin: 0 auto;
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
          transform: scale(1.05);
        }

        .deal-item h3 {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--bg-white);
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
        `}
      </style>

      <header className="header">
        <div className="header-container">
          <div className="logo-area">
            <h1 className="logo">Our Store</h1>
            {isLoggedIn && (
              <p className="header-greeting">Hello, User #{userId}</p>
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