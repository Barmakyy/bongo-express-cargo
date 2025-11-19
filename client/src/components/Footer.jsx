import { FaFacebook, FaTwitter, FaLinkedin } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-primary text-gray-300 py-12">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-8 text-center md:text-left">
          <div>
            <h3 className="text-xl font-bold text-white mb-4">BongoExpressCargo</h3>
            <p>Minhaj Tower, Unit Floor Plot 05, Carlifonia Kamkunji Nairobi</p>
            <div className="flex justify-center md:justify-start space-x-4 mt-4">
              <a href="#" className="hover:text-accent"><FaFacebook size={24} /></a>
              <a href="#" className="hover:text-accent"><FaTwitter size={24} /></a>
              <a href="#" className="hover:text-accent"><FaLinkedin size={24} /></a>
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="hover:text-accent">Home</Link></li>
              <li><Link to="/about" className="hover:text-accent">About Us</Link></li>
              <li><Link to="/services" className="hover:text-accent">Services</Link></li>
              <li><Link to="/contact" className="hover:text-accent">Contact</Link></li>
            </ul>
          </div>
        </div>
        <div className="text-center mt-8 pt-8 border-t border-gray-700">
          <p>&copy; {new Date().getFullYear()} BongoExpressCargo. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;