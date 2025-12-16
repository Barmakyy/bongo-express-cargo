import { useState, useEffect, useContext } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { FaBars, FaTimes, FaUserCircle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/');
  };

  const navLinks = [
    { to: '/', text: 'Home' },
    { to: '/about', text: 'About' },
    { to: '/services', text: 'Services' },
    { to: '/contact', text: 'Contact' },
  ];

  let dashboardPath = '/customer/dashboard'; // Default for customer
  if (user?.role === 'admin') {
    dashboardPath = '/admin/dashboard';
  } else if (user?.role === 'staff') {
    dashboardPath = '/staff/dashboard';
  }

  const mobileMenuVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  };

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-primary shadow-lg' : 'bg-primary/80'}`}>
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-white" onClick={() => setIsOpen(false)}>
          Bongo<span className="text-accent">Express</span>
        </Link>
        <div className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => (
            <NavLink key={link.to} to={link.to} className={({ isActive }) => `text-white hover:text-accent transition-colors ${isActive ? 'text-accent' : ''}`}>
              {link.text}
            </NavLink>
          ))}
          {user ? (
            <>
              <NavLink to={dashboardPath} className={({ isActive }) => `text-white hover:text-accent transition-colors ${isActive ? 'text-accent' : ''}`}>Dashboard</NavLink>
              <button onClick={handleLogout} className="text-white hover:text-accent transition-colors">Logout</button>
              <FaUserCircle className="text-white text-2xl" />
            </>
          ) : (
            <>
              <NavLink to="/login" className="bg-accent text-primary font-bold py-2 px-4 rounded-lg hover:bg-yellow-400 transition-colors">Login</NavLink>
              <NavLink to="/register" className="text-white border border-white py-2 px-4 rounded-lg hover:bg-white hover:text-primary transition-colors">Register</NavLink>
            </>
          )}
        </div>
        <div className="md:hidden">
          <button onClick={() => setIsOpen(!isOpen)} className="text-white focus:outline-none">
            {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="md:hidden absolute top-full left-0 w-full bg-primary shadow-xl"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={mobileMenuVariants}
          >
            <div className="flex flex-col items-center space-y-6 py-8">
              {navLinks.map((link) => (
                <NavLink key={link.to} to={link.to} onClick={() => setIsOpen(false)} className={({ isActive }) => `text-white text-lg hover:text-accent transition-colors ${isActive ? 'text-accent' : ''}`}>
                  {link.text}
                </NavLink>
              ))}
              <div className="border-t border-gray-700 w-full my-4"></div>
              {user ? (
                <>
                  <NavLink to={dashboardPath} onClick={() => setIsOpen(false)} className="text-white text-lg hover:text-accent transition-colors">Dashboard</NavLink>
                  <button onClick={handleLogout} className="text-white text-lg hover:text-accent transition-colors">Logout</button>
                </>
              ) : (
                <NavLink to="/login" onClick={() => setIsOpen(false)} className="bg-accent text-primary font-bold py-3 px-6 rounded-lg hover:bg-yellow-400 transition-colors w-full text-center">Login / Register</NavLink>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;