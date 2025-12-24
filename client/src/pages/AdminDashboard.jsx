import { useState, useEffect, useContext, useRef } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  FaTachometerAlt,
  FaTruck,
  FaUsers,
  FaUserSecret,
  FaCreditCard,
  FaEnvelope,
  FaCog,
  FaBars,
  FaTimes,
  FaSearch,
  FaBell,
  FaUserCircle,
  FaSignOutAlt
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';

const sidebarVariants = {
  open: {
    x: 0,
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  },
  closed: {
    x: '-100%',
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  },
};

const navItems = [
  { to: '/admin/dashboard', icon: <FaTachometerAlt />, text: 'Dashboard' },
  { to: '/admin/dashboard/shipments', icon: <FaTruck />, text: 'Shipments' },
  { to: '/admin/dashboard/customers', icon: <FaUsers />, text: 'Customers' },
  { to: '/admin/dashboard/staff', icon: <FaUserSecret />, text: 'Staff' },
  { to: '/admin/dashboard/payments', icon: <FaCreditCard />, text: 'Payments' },
  { to: '/admin/dashboard/messages', icon: <FaEnvelope />, text: 'Messages' },
  { to: '/admin/dashboard/settings', icon: <FaCog />, text: 'Settings' },
];

const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  useEffect(() => {
    // This effect should only run on route changes, not when the sidebar is opened.
    // It closes the sidebar on mobile when the user navigates.
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  }, [location.pathname, setIsOpen]);

  const NavItem = ({ to, icon, text }) => (
    <NavLink
      to={to}
      end={to === '/admin/dashboard'}
      className={({ isActive }) =>
        `flex items-center p-3 my-1 rounded-lg transition-colors ${
          isActive
            ? 'bg-accent text-primary'
            : 'text-gray-300 hover:bg-primary-dark hover:text-white'
        }`
      }
    >
      <span className="mr-4 text-xl">{icon}</span>
      <span className="font-medium">{text}</span>
    </NavLink>
  );

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className="fixed inset-y-0 left-0 bg-primary text-white w-64 space-y-6 py-7 px-2 z-40 transform lg:translate-x-0 lg:static lg:inset-0"
        variants={sidebarVariants}
        initial="closed"
        animate={isOpen ? 'open' : 'closed'}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <Link to="/" className="text-white text-2xl font-bold px-4 flex items-center">
          <>Bongo<span className="text-accent">Express</span></>
        </Link>

        <nav>
          {navItems.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </nav>
        <div className="px-4 absolute bottom-4 w-full">
          <button onClick={handleLogout} className="w-full text-left flex items-center p-3 rounded-lg transition-colors text-gray-300 hover:bg-primary-dark hover:text-white">
            <span className="mr-4 text-xl"><FaCog /></span><span className="font-medium">Logout</span>
          </button>
        </div>
      </motion.aside>
    </>
  );
};

const TopNavbar = ({ isSidebarOpen, setIsSidebarOpen, user }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const notificationRef = useRef(null);
  const { user: authUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications');
        setNotifications(res.data.data.notifications);
      } catch (error) {
        console.error('Failed to fetch notifications');
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setDropdownOpen(false);
      if (notificationRef.current && !notificationRef.current.contains(event.target)) setNotificationOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      clearInterval(interval);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);

  const handleNotificationClick = async (notification) => {
    try {
      // Navigate first for a faster user experience
      navigate(notification.link);
      setNotificationOpen(false);

      // Then mark as read
      await api.patch(`/notifications/${notification._id}/read`);

      // Update state to remove the notification from the list
      setNotifications(prev => prev.filter(n => n._id !== notification._id));
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  };

  return (
    <header className="bg-white shadow-sm p-4 flex justify-between items-center">
      {/* Hamburger Menu for mobile */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="text-gray-500 focus:outline-none lg:hidden"
      >
        {isSidebarOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
      </button>

      {/* Search Bar */}
      <div className="relative hidden md:block">
        <FaSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search shipments, customers..."
          className="bg-gray-100 focus:bg-white focus:ring-2 focus:ring-primary border border-gray-200 rounded-full py-2 pl-10 pr-4 w-80 transition-all"
        />
      </div>

      {/* Right-side icons and profile */}
      <div className="flex items-center space-x-6">
        <div className="relative" ref={notificationRef}>
          <button onClick={() => setNotificationOpen(!notificationOpen)} className="text-gray-500 hover:text-primary relative">
            <FaBell size={22} />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                {notifications.length}
              </span>
            )}
          </button>
          <AnimatePresence>
            {notificationOpen && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-xl z-20">
                <div className="p-3 font-bold border-b">Notifications</div>
                <div className="py-1 max-h-80 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map(notif => (
                      <div key={notif._id} onClick={() => handleNotificationClick(notif)} className="px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                        <p>{notif.text}</p>
                        <p className="text-xs text-gray-400 mt-1">{new Date(notif.createdAt).toLocaleString()}</p>
                      </div>
                    ))
                  ) : (
                    <p className="px-4 py-3 text-sm text-gray-500">No new notifications.</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="relative" ref={dropdownRef}>
          <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center space-x-2">
            {user?.profilePicture ? (
              <img src={`http://localhost:5000${user.profilePicture}`} alt="Admin" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <FaUserCircle size={28} className="text-gray-600" />
            )}
            <span className="hidden md:inline font-medium text-gray-700">{user?.name || 'Admin'}</span>
          </button>
          <AnimatePresence>
            {dropdownOpen && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-xl z-20 py-1">
                <Link to="/admin/dashboard/settings" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <FaCog className="inline mr-2" />Settings
                </Link>
                <button onClick={handleLogout} className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <FaSignOutAlt className="inline mr-2" />Logout
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

const AdminDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const { user } = useContext(AuthContext);
  const [companyLogo, setCompanyLogo] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get('/settings');
        setCompanyLogo(response.data.data.settings.logo);
      } catch (error) {
        console.error('Failed to load settings for dashboard display.');
      }
    };
    fetchSettings();
  }, []);

  // Handle window resize to show/hide sidebar automatically
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavbar
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          user={user}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={useLocation().pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="p-4 md:p-8"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;