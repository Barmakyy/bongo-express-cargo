import React, { useState, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUser, FaLock, FaCamera, FaSpinner, FaSave, FaShieldAlt, FaTimes } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import api from '../api/axios';

const TabButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 font-semibold rounded-t-lg border-b-2 transition-colors ${
      active ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-primary hover:border-gray-300'
    }`}
  >
    {children}
  </button>
);

const ProfileSettings = () => {
  const { user, setUser } = useContext(AuthContext);
  const { showNotification } = useNotification();
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await api.patch('/auth/update-me', formData);
      setUser(res.data.data.user);
      showNotification('Profile updated successfully!', 'success');
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to update profile.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('profilePicture', file);
    setIsUploading(true);

    try {
      const uploadRes = await api.post('/uploads/customer-profile-picture', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const updateRes = await api.patch('/auth/update-me', { profilePicture: uploadRes.data.filePath });
      setUser(updateRes.data.data.user);
      showNotification('Profile picture updated!', 'success');
    } catch (err) {
      showNotification('Failed to upload picture.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <form onSubmit={handleProfileUpdate} className="space-y-6">
        <div className="flex items-center space-x-6">
          <div className="relative">
            <img
              src={user?.profilePicture ? `http://localhost:5000${user.profilePicture}` : `https://ui-avatars.com/api/?name=${user?.name}&background=FBBF24&color=0B1D3A`}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover"
            />
            <label htmlFor="picture-upload" className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-opacity-90">
              {isUploading ? <FaSpinner className="animate-spin" /> : <FaCamera />}
            </label>
            <input id="picture-upload" type="file" className="hidden" onChange={handlePictureUpload} accept="image/*" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{user?.name}</h2>
            <p className="text-gray-500">{user?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email Address</label>
            <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Phone Number</label>
          <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
        </div>
        <div className="text-right">
          <button type="submit" disabled={isSaving} className="bg-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-opacity-90 transition-colors flex items-center justify-center ml-auto disabled:bg-primary/70">
            {isSaving ? <FaSpinner className="animate-spin mr-2" /> : <FaSave className="mr-2" />}
            Save Changes
          </button>
        </div>
      </form>
    </motion.div>
  );
};

const PasswordSettings = () => {
  const { showNotification } = useNotification();
  const [passwords, setPasswords] = useState({ currentPassword: '', password: '' });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passwords.password !== confirmPassword) {
      showNotification('New passwords do not match.', 'error');
      return;
    }
    setIsSaving(true);
    try {
      await api.patch('/auth/update-password', passwords);
      showNotification('Password updated successfully!', 'success');
      setPasswords({ currentPassword: '', password: '' });
      setConfirmPassword('');
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to update password.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <form onSubmit={handlePasswordUpdate} className="space-y-6 max-w-md">
        <div>
          <label className="block text-sm font-medium text-gray-700">Current Password</label>
          <input
            type="password"
            name="currentPassword"
            value={passwords.currentPassword}
            onChange={handleInputChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">New Password</label>
          <input
            type="password"
            name="password"
            value={passwords.password}
            onChange={handleInputChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            required
          />
        </div>
        <div className="text-right">
          <button type="submit" disabled={isSaving} className="bg-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-opacity-90 transition-colors flex items-center justify-center ml-auto disabled:bg-primary/70">
            {isSaving ? <FaSpinner className="animate-spin mr-2" /> : <FaLock className="mr-2" />}
            Update Password
          </button>
        </div>
      </form>
    </motion.div>
  );
};

const TwoFactorAuthSetup = ({ onClose, onVerified }) => {
  const [setupInfo, setSetupInfo] = useState(null);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const { showNotification } = useNotification();

  useEffect(() => {
    const fetchSetupInfo = async () => {
      try {
        const res = await api.post('/auth/2fa/setup');
        setSetupInfo(res.data.data);
      } catch (err) {
        showNotification('Failed to start 2FA setup.', 'error');
        onClose();
      } finally {
        setLoading(false);
      }
    };
    fetchSetupInfo();
  }, []);

  const handleVerify = async (e) => {
    e.preventDefault();
    setVerifying(true);
    try {
      await api.post('/auth/2fa/verify', { token });
      showNotification('2FA enabled successfully!', 'success');
      onVerified();
      onClose();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Invalid token.', 'error');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-primary">Set Up Two-Factor Authentication</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><FaTimes size={20} /></button>
        </div>
        <div className="p-6 space-y-4 text-center">
          {loading ? (
            <FaSpinner className="animate-spin text-primary text-4xl mx-auto" />
          ) : (
            <>
              <p className="text-gray-600">1. Scan this QR code with your authenticator app (e.g., Google Authenticator, Authy).</p>
              <img src={setupInfo.qrCode} alt="2FA QR Code" className="mx-auto my-4 border p-2" />
              <p className="text-gray-600">2. Enter the 6-digit code from your app to verify.</p>
              <form onSubmit={handleVerify} className="flex flex-col items-center gap-4">
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="123456"
                  maxLength="6"
                  className="text-center text-2xl tracking-widest font-mono w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  required
                />
                <button type="submit" disabled={verifying} className="bg-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-opacity-90 transition-colors flex items-center justify-center disabled:bg-primary/70">
                  {verifying ? <FaSpinner className="animate-spin mr-2" /> : null}
                  Verify & Enable
                </button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const SecuritySettings = () => {
  const { user, setUser } = useContext(AuthContext);
  const { showNotification } = useNotification();
  const [isDisabling, setIsDisabling] = useState(false);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);

  const handleDisable2FA = async () => {
    if (!window.confirm('Are you sure you want to disable Two-Factor Authentication?')) return;
    setIsDisabling(true);
    try {
      await api.post('/auth/2fa/disable');
      const updatedUser = { ...user, twoFactorEnabled: false };
      setUser(updatedUser);
      showNotification('2FA has been disabled.', 'success');
    } catch (err) {
      showNotification('Failed to disable 2FA.', 'error');
    } finally {
      setIsDisabling(false);
    }
  };

  const handle2FAVerified = () => {
    const updatedUser = { ...user, twoFactorEnabled: true };
    setUser(updatedUser);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h3 className="text-lg font-bold text-gray-800 mb-4">Two-Factor Authentication (2FA)</h3>
      {user?.twoFactorEnabled ? (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
          <p className="font-semibold text-green-800">2FA is currently enabled on your account.</p>
          <button onClick={handleDisable2FA} disabled={isDisabling} className="mt-4 bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition-colors disabled:bg-red-400">
            {isDisabling ? <FaSpinner className="animate-spin" /> : 'Disable 2FA'}
          </button>
        </div>
      ) : (
        <div className="bg-gray-100 p-4 rounded-lg">
          <p className="text-gray-700">Add an extra layer of security to your account by enabling 2FA.</p>
          <button onClick={() => setIsSetupModalOpen(true)} className="mt-4 bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 transition-colors">
            Enable 2FA
          </button>
        </div>
      )}
      <AnimatePresence>
        {isSetupModalOpen && <TwoFactorAuthSetup onClose={() => setIsSetupModalOpen(false)} onVerified={handle2FAVerified} />}
      </AnimatePresence>
    </motion.div>
  );
};

const CustomerSettings = () => {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="bg-gray-50 p-4 md:p-8 min-h-full">
      <h1 className="text-3xl font-bold text-primary mb-8">Account Settings</h1>

      <div className="bg-white p-6 rounded-2xl shadow-md">
        <div className="flex border-b mb-6">
          <TabButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')}>
            <FaUser className="inline mr-2" /> Profile
          </TabButton>
          <TabButton active={activeTab === 'security'} onClick={() => setActiveTab('security')}>
            <FaLock className="inline mr-2" /> Security
          </TabButton>
          <TabButton active={activeTab === '2fa'} onClick={() => setActiveTab('2fa')}>
            <FaShieldAlt className="inline mr-2" /> Two-Factor Auth
          </TabButton>
        </div>

        <div>
          {activeTab === 'profile' && <ProfileSettings />}
          {activeTab === 'security' && <PasswordSettings />}
          {activeTab === '2fa' && <SecuritySettings />}
        </div>
      </div>
    </div>
  );
};

export default CustomerSettings;