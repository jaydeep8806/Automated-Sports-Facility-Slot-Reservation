import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';

// Page Imports
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { VerifyEmail } from './pages/VerifyEmail';
import { Facilities } from './pages/Facilities';
import { FacilityDetail } from './pages/FacilityDetail';
import { Payment } from './pages/Payment';
import { Profile } from './pages/Profile';
import { AdminDashboard } from './pages/AdminDashboard';
import { CanteenMenu } from './pages/CanteenMenu';
import { CanteenCheckout } from './pages/CanteenCheckout';
import { CanteenConfirmation } from './pages/CanteenConfirmation';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '60px 20px', textAlign: 'center', maxWidth: '600px', margin: '40px auto', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '12px' }}>Something went wrong ⚠️</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '24px' }}>
            An unexpected error occurred while rendering this view.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ padding: '12px 24px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}
          >
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar />
            <main style={{ flex: '1 0 auto', paddingBottom: '40px' }}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/facilities" element={<Facilities />} />

              {/* Private Routes */}
              <Route 
                path="/facilities/:id" 
                element={
                  <ProtectedRoute>
                    <FacilityDetail />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/payment" 
                element={
                  <ProtectedRoute>
                    <Payment />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } 
              />

              {/* Canteen Routes */}
              <Route 
                path="/canteen" 
                element={
                  <ProtectedRoute>
                    <CanteenMenu />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/canteen/checkout" 
                element={
                  <ProtectedRoute>
                    <CanteenCheckout />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/canteen/confirmation" 
                element={
                  <ProtectedRoute>
                    <CanteenConfirmation />
                  </ProtectedRoute>
                } 
              />

              {/* Admin Routes */}
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute>
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  </ErrorBoundary>
  );
}

export default App;
