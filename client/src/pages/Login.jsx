import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [is2faStep, setIs2faStep] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useContext(AuthContext);
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (is2faStep) {
      try {
        const response = await api.post('/auth/2fa/login', { ...formData, token: twoFactorToken });
        const { token, data } = response.data;
        login(data.user, token);
        showNotification('Login successful!', 'success');
        if (data.user.role === 'admin') navigate('/admin/dashboard');
        else navigate('/customer/dashboard');
      } catch (err) {
        showNotification(err.response?.data?.message || 'Login failed. Please try again.', 'error');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    try {
      const response = await api.post('/auth/login', formData);

      if (response.data.status === '2fa_required') {
        setIs2faStep(true);
        showNotification('Please enter your 2FA code.', 'info');
      } else {
        const { token, data } = response.data;
        login(data.user, token);
        showNotification('Login successful!', 'success');
        // Redirect based on role
        if (data.user.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/customer/dashboard');
        }
      }
    } catch (err) {
      showNotification(err.response?.data?.message || 'Login failed. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-primary mb-6">Login</h2>
        <form onSubmit={handleSubmit}>
          {!is2faStep ? (
            <>
              <div className="mb-4">
                <label className="block text-gray-700">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div className="text-sm text-right mb-6">
                <Link to="/forgot-password" className="font-medium text-primary hover:text-opacity-80">
                  Forgot your password?
                </Link>
              </div>
            </>
          ) : (
            <div className="mb-4">
              <label className="block text-gray-700 text-center mb-2">Enter Your 2FA Code</label>
              <input
                type="text"
                value={twoFactorToken}
                onChange={(e) => setTwoFactorToken(e.target.value)}
                className="w-full text-center text-2xl tracking-widest font-mono px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
          )}
          <button type="submit" disabled={isSubmitting} className="w-full bg-primary text-white py-2 rounded-lg hover:bg-opacity-90 transition-colors disabled:bg-primary/70">
            {isSubmitting ? 'Submitting...' : (is2faStep ? 'Verify' : 'Login')}
          </button>
        </form>
        <p className="text-center mt-4">
          Don't have an account? <Link to="/register" className="text-primary hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;