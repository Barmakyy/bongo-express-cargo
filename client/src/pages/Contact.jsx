import React, { useState } from 'react';
import { motion } from "framer-motion";
import { FaMapMarkerAlt, FaEnvelope, FaPhone, FaSpinner } from "react-icons/fa";
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useNotification } from '../context/NotificationContext';

const Contact = () => {
  const [formData, setFormData] = useState({ sender: '', email: '', subject: '', body: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showNotification } = useNotification();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/messages', formData);
      showNotification('Message sent successfully! We will get back to you soon.', 'success');
      setFormData({ sender: '', email: '', subject: '', body: '' }); // Reset form
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to send message. Please try again.';
      showNotification(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const trustedCompanies = [
    '/path/to/logo1.svg', // Replace with actual paths to your logo assets
    '/path/to/logo2.svg',
    '/path/to/logo3.svg',
    '/path/to/logo4.svg',
    '/path/to/logo5.svg',
  ];

  return (
    <div className="bg-gray-50">
      {/* Hero Section */}
      <section
        className="relative h-[50vh] bg-cover bg-center flex items-center justify-center text-white"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2832&auto=format&fit=crop')" }}
      >
        <div className="absolute inset-0 bg-black/60"></div>
        <motion.div
          className="relative z-10 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl font-extrabold">Contact Us</h1>
          <p className="mt-4 text-sm text-gray-300">
            <Link to="/" className="hover:text-accent">Home</Link> / <span className="text-white">Contact Us</span>
          </p>
        </motion.div>
      </section>

      {/* Main Contact Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Left Side: Info Card */}
            <div className="bg-primary text-white p-8 rounded-2xl shadow-lg">
              <h2 className="text-2xl font-bold mb-4 text-accent">Need More Information? Get in Touch</h2>
              <p className="text-gray-300 mb-8">
                Our team is available to answer your questions about shipping, tracking, and our services.
              </p>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="bg-accent/20 p-3 rounded-full"><FaPhone className="text-accent" size={20} /></div>
                  <div>
                    <h3 className="font-semibold">Phone Number</h3>
                    <p className="text-gray-200">+254712274897</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="bg-accent/20 p-3 rounded-full"><FaEnvelope className="text-accent" size={20} /></div>
                  <div>
                    <h3 className="font-semibold">Email Address</h3>
                    <p className="text-gray-200">info@bongoexpress.co.ke</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="bg-accent/20 p-3 rounded-full"><FaMapMarkerAlt className="text-accent" size={20} /></div>
                  <div>
                    <h3 className="font-semibold">Office Location</h3>
                    <p className="text-gray-200">Minhaj Tower, Carlifonia Kamkunji, Nairobi</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: Form */}
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <h2 className="text-2xl font-bold mb-2 text-primary">Send Message</h2>
              <p className="text-gray-500 mb-6">We'll get back to you as soon as possible.</p>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="relative">
                  <input
                    type="text"
                    name="sender"
                    id="sender"
                    placeholder=" "
                    className="block px-3.5 pb-2.5 pt-4 w-full text-sm text-gray-900 bg-transparent rounded-lg border border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-primary peer"
                    value={formData.sender}
                    onChange={handleChange}
                    required
                  />
                  <label htmlFor="sender" className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-left bg-white px-2 peer-focus:px-2 peer-focus:text-primary peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto start-1">
                    Full Name
                  </label>
                </div>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    id="email"
                    placeholder=" "
                    className="block px-3.5 pb-2.5 pt-4 w-full text-sm text-gray-900 bg-transparent rounded-lg border border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-primary peer"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                  <label htmlFor="email" className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-left bg-white px-2 peer-focus:px-2 peer-focus:text-primary peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto start-1">
                    Email Address
                  </label>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    name="subject"
                    id="subject"
                    placeholder=" "
                    className="block px-3.5 pb-2.5 pt-4 w-full text-sm text-gray-900 bg-transparent rounded-lg border border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-primary peer"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                  />
                  <label htmlFor="subject" className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-left bg-white px-2 peer-focus:px-2 peer-focus:text-primary peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto start-1">
                    Subject
                  </label>
                </div>
                <div className="relative">
                  <textarea
                    name="body"
                    id="body"
                    rows="4"
                    placeholder=" "
                    className="block px-3.5 pb-2.5 pt-4 w-full text-sm text-gray-900 bg-transparent rounded-lg border border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-primary peer"
                    value={formData.body}
                    onChange={handleChange}
                    required
                  ></textarea>
                  <label htmlFor="body" className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-left bg-white px-2 peer-focus:px-2 peer-focus:text-primary peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-6 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto start-1">
                    Your Message
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-accent text-primary font-bold py-3 rounded-lg hover:bg-yellow-400 transition-colors disabled:bg-yellow-300 flex items-center justify-center"
                >
                  {isSubmitting ? <FaSpinner className="animate-spin" /> : 'Send Message'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6 text-center">
          <h3 className="text-lg font-semibold text-gray-500 mb-6">Trusted by 50+ top companies</h3>
          <div className="flex flex-wrap justify-center items-center gap-x-16 gap-y-8">
            <div className="flex items-center text-gray-400">
              <svg className="h-8 w-8 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-5h2v5h-2zm0-7V7h2v3h-2z"/></svg>
              <span className="text-xl font-bold">Innovate</span>
            </div>
            <div className="flex items-center text-gray-400">
              <svg className="h-8 w-8 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5-10-5-10 5z"/></svg>
              <span className="text-xl font-bold">Apex</span>
            </div>
            <div className="flex items-center text-gray-400">
              <svg className="h-8 w-8 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M20.5 10H19V7c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v3h-1.5c-.82 0-1.5.68-1.5 1.5v7c0 .82.68 1.5 1.5 1.5h9c.82 0 1.5-.68 1.5-1.5v-7c0-.82-.68-1.5-1.5-1.5zM15 7h2v3h-2V7z"/></svg>
              <span className="text-xl font-bold">Quantum</span>
            </div>
            <div className="flex items-center text-gray-400">
              <svg className="h-8 w-8 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
              <span className="text-xl font-bold">Synergy</span>
            </div>
            <div className="flex items-center text-gray-400">
              <svg className="h-8 w-8 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>
              <span className="text-xl font-bold">Global</span>
            </div>
          </div>
        </div>
      </section>

      {/* Embedded Map Section */}
      <section>
        <iframe
          title="BongoExpressCargo Location"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3988.8343339304!2d36.84369867496535!3d-1.2729919987168936!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x182f16d333121555%3A0x1a8a15f530f93539!2sMinhaj%20Towers!5e0!3m2!1sen!2ske!4v1720000000000!5m2!1sen!2ske"
          className="w-full h-[450px]"
          style={{ border: 0 }}
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
      </section>
    </div>
  );
};

export default Contact;
