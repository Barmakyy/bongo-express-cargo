import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaLock, FaSpinner } from 'react-icons/fa';
import api from '../api/axios';
import { useNotification } from '../context/NotificationContext';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { token } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== passwordConfirm) {
      showNotification('Passwords do not match.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.patch(`/auth/reset-password/${token}`, { password, passwordConfirm });
      showNotification('Password reset successfully! You can now log in with your new password.', 'success');
      navigate('/login');
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to reset password. The token may be invalid or expired.';
      showNotification(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-lg p-8"
        >
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-primary">
              Reset Your Password
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Enter your new password below.
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="password" className="sr-only">New Password</label>
                <input id="password" name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" placeholder="New Password" />
              </div>
              <div>
                <label htmlFor="password-confirm" className="sr-only">Confirm New Password</label>
                <input id="password-confirm" name="passwordConfirm" type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} required className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" placeholder="Confirm New Password" />
              </div>
            </div>

            <div>
              <button type="submit" disabled={isSubmitting} className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-primary/70">
                {isSubmitting ? <FaSpinner className="animate-spin" /> : <FaLock className="mr-2" />}
                Reset Password
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default ResetPassword;