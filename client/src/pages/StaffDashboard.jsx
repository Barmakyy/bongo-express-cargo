import { useState, useEffect, useContext, useRef } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  FaTachometerAlt,
  FaTruck,
  FaCog,
  FaEnvelope,
  FaMoneyBillWave,
  FaPlusCircle,
  FaBars,
  FaTimes,
  FaUserCircle,
  FaSignOutAlt,
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';

const sidebarVariants = {
  open: { x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
  closed: { x: '-100%', transition: { type: 'spring', stiffness: 300, damping: 30 } },
};

const navItems = [
  { to: '/staff/dashboard', icon: <FaTachometerAlt />, text: 'Dashboard' },
  { to: '/staff/dashboard/shipments', icon: <FaTruck />, text: 'Shipments' },
  { to: '/staff/dashboard/create-shipment', icon: <FaPlusCircle />, text: 'Create Shipment' },
  { to: '/staff/dashboard/messages', icon: <FaEnvelope />, text: 'Messages' },
  { to: '/staff/dashboard/payments', icon: <FaMoneyBillWave />, text: 'Payments' },
  { to: '/staff/dashboard/settings', icon: <FaCog />, text: 'Settings' },
];

const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setIsOpen(false); // Close sidebar on mobile
    navigate('/');
  };

  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  }, [location.pathname, setIsOpen]);

  const NavItem = ({ to, icon, text }) => (
    <NavLink
      to={to}
      end={to === '/staff/dashboard'}
      className={({ isActive }) =>
        `flex items-center p-3 my-1 rounded-lg transition-colors ${
          isActive ? 'bg-accent text-primary' : 'text-gray-300 hover:bg-primary-dark hover:text-white'
        }`
      }
    >
      <span className="mr-4 text-xl">{icon}</span>
      <span className="font-medium">{text}</span>
    </NavLink>
  );

  return (
    <>
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

      <motion.aside
        className="fixed inset-y-0 left-0 bg-primary text-white w-64 py-7 px-2 z-40 transform lg:translate-x-0 lg:static lg:inset-0 flex flex-col"
        variants={sidebarVariants}
        initial="closed"
        animate={isOpen ? 'open' : 'closed'}
      >
        <Link to="/" className="text-white text-2xl font-bold px-4 flex items-center">
          Bongo<span className="text-accent">Express</span>
        </Link>

        <nav className="grow space-y-6">
          {navItems.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </nav>

        <div className="px-2">
          <button onClick={handleLogout} className="flex items-center p-3 my-1 rounded-lg transition-colors text-gray-300 hover:bg-red-500 hover:text-white w-full">
            <span className="mr-4 text-xl"><FaSignOutAlt /></span>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </motion.aside>
    </>
  );
};

const TopNavbar = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownRef]);

  return (
    <header className="bg-white shadow-sm p-4 flex justify-between items-center">
      <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-gray-500 focus:outline-none lg:hidden">
        {isSidebarOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
      </button>

      <div className="flex-1"></div>

      <div className="flex items-center space-x-6">
        <div className="relative" ref={dropdownRef}>
          <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center space-x-2">
            {user?.profilePicture ? (
              <img src={`http://localhost:5000${user.profilePicture}`} alt="User" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <FaUserCircle size={28} className="text-gray-600" />
            )}
            <span className="hidden md:inline font-medium text-gray-700">{user?.name || 'Staff'}</span>
          </button>
          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-xl z-20 py-1"
              >
                <Link to="/staff/dashboard/settings" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
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

const StaffDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);

  // Handle window resize to show/hide sidebar automatically
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavbar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
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

export default StaffDashboard;