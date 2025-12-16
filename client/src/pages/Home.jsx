import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaShippingFast, FaGlobe, FaHeadset, FaPlane, FaTruck, FaWarehouse, FaBoxOpen, FaUserTie } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeInOut' } },
};

// 🟦 HERO SECTION
const HeroSection = () => {
  const [trackingId, setTrackingId] = useState('');
  const navigate = useNavigate();

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    if (trackingId.trim()) {
      navigate(`/track/${trackingId.trim()}`);
    }
  };

  return (
    <div
      className="relative h-[70vh] md:h-[90vh] bg-cover bg-center flex items-center justify-center text-white"
      style={{
        backgroundImage: "url('https://streamlinetransportlogistics.com/wp-content/uploads/2024/11/R.jpeg')",
      }}
    >
      {/* Gradient overlay for elegant tone */}
      <div className="absolute inset-0 bg-linear-to-r from-primary/90 via-black/70 to-black/40"></div>

      <motion.div
        className="relative z-10 text-center p-6 w-full max-w-4xl"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        <h1 className="text-4xl md:text-6xl font-extrabold mb-4 leading-tight">
          Delivering Beyond Borders
        </h1>
        <p className="text-lg md:text-2xl mb-8 max-w-3xl mx-auto text-gray-100">
          Reliable, Fast, and Secure Logistics Solutions.
        </p>
        <div className="mt-8 max-w-xl mx-auto">
          <form onSubmit={handleTrackSubmit}>
            <div className="flex flex-col sm:flex-row gap-2 bg-white/20 backdrop-blur-sm p-2 rounded-xl border border-white/30">
              <input
                type="text"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                placeholder="Enter your tracking ID"
                className="grow w-full px-5 py-3 border-0 bg-transparent text-white placeholder-gray-300 focus:ring-0 outline-none"
              />
              <button type="submit" className="bg-accent text-primary font-bold py-3 px-8 rounded-lg hover:bg-yellow-400 transition-colors text-lg">
                Track Package
              </button>
            </div>
          </form>
          <Link to="/book-shipment" className="mt-4 inline-block bg-transparent border-2 border-white text-white font-bold py-3 px-8 rounded-lg hover:bg-white hover:text-primary transition-colors text-lg">
            Book a Shipment
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

// 🟡 FEATURES SECTION
const FeatureCard = ({ icon, title, description }) => (
  <motion.div
    className="bg-white p-8 rounded-xl shadow-lg text-center border-t-4 border-yellow-400"
    whileHover={{ y: -10, transition: { duration: 0.3 } }}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, amount: 0.5 }}
    variants={fadeIn}
  >
    <div className="text-accent text-5xl mb-4 inline-block">{icon}</div>
    <h3 className="text-xl font-bold mb-2 text-gray-800">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </motion.div>
);

const FeaturesSection = () => (
  <section className="py-20 bg-linear-to-b from-gray-50 to-gray-100">
    <div className="container mx-auto px-6">
      <div className="grid md:grid-cols-3 gap-8">
        <FeatureCard
          icon={<FaShippingFast />}
          title="Fast Delivery"
          description="We ensure your packages are delivered on time, every time, with our optimized routing."
        />
        <FeatureCard
          icon={<FaGlobe />}
          title="Global Reach"
          description="Connecting businesses across the world with our extensive logistics network."
        />
        <FeatureCard
          icon={<FaHeadset />}
          title="24/7 Support"
          description="Our dedicated support team is always available to help you with any inquiries."
        />
      </div>
    </div>
  </section>
);

// ⚪ ABOUT PREVIEW SECTION
const AboutPreviewSection = () => (
  <section className="py-20 bg-white">
    <div className="container mx-auto px-6">
      <motion.div 
        className="grid md:grid-cols-2 gap-12 items-center"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={fadeIn}
      >
        <img src="https://www.itefy.com/res/stockphotos/Warehouse-Logistics.jpg" alt="Our Team" className="rounded-2xl shadow-2xl w-full h-auto" />
        <div className="text-left">
          <h2 className="text-3xl font-bold mb-4 text-primary">Your Trusted Logistics Partner</h2>
          <p className="text-gray-600 mb-6">
            With over a decade of experience, BongoExpressCargo is dedicated to providing top-tier logistics and supply chain solutions. Our mission is to empower businesses by making shipping simple, transparent, and efficient.
          </p>
          <Link to="/about" className="bg-primary text-white font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-colors">
            Learn More
          </Link>
        </div>
      </motion.div>
    </div>
  </section>
);

// 🧭 SERVICES OVERVIEW
const ServiceCard = ({ icon, title, description }) => (
  <motion.div
    className="bg-white p-6 rounded-lg shadow-md text-center border-t-4 border-yellow-400"
    whileHover={{ y: -8, scale: 1.03 }}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, amount: 0.5 }}
    variants={fadeIn}
  >
    <div className="text-accent text-4xl mb-4 inline-block">{icon}</div>
    <h3 className="text-xl font-bold mb-2 text-gray-800">{title}</h3>
    <p className="text-gray-600 text-sm">{description}</p>
  </motion.div>
);

const ServicesOverviewSection = () => (
  <section className="py-20 bg-linear-to-b from-white to-gray-50">
    <div className="container mx-auto px-6 text-center">
      <h2 className="text-3xl font-bold mb-12 text-primary">Comprehensive Logistics Services</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <ServiceCard icon={<FaPlane />} title="Air Freight" description="Fast and reliable air cargo solutions for urgent shipments." />
        <ServiceCard icon={<FaTruck />} title="Road Transport" description="Flexible and cost-effective ground transportation across the nation." />
        <ServiceCard icon={<FaWarehouse />} title="Warehousing" description="Secure and scalable storage solutions for your inventory." />
        <ServiceCard icon={<FaBoxOpen />} title="Door-to-Door" description="Seamless end-to-end delivery from your location to the destination." />
      </div>
    </div>
  </section>
);

// 📊 STATS SECTION
const StatsSection = () => (
  <section className="py-20 bg-linear-to-r from-yellow-400 to-yellow-500 text-gray-900">
    <div className="container mx-auto px-6 text-center">
      <h2 className="text-3xl font-bold mb-12">Our Journey in Numbers</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
          <p className="text-5xl font-extrabold text-gray-900">15+</p>
          <p className="text-xl mt-2">Years in Service</p>
        </motion.div>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }} variants={fadeIn}>
          <p className="text-5xl font-extrabold text-gray-900">5K+</p>
          <p className="text-xl mt-2">Clients Served</p>
        </motion.div>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }} variants={fadeIn}>
          <p className="text-5xl font-extrabold text-gray-900">1M+</p>
          <p className="text-xl mt-2">Deliveries Completed</p>
        </motion.div>
      </div>
    </div>
  </section>
);

// 💬 TESTIMONIALS SECTION
const TestimonialCard = ({ quote, name, company }) => (
  <motion.div 
    className="bg-white p-8 rounded-xl shadow-lg"
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, amount: 0.5 }}
    variants={fadeIn}
  >
    <p className="text-gray-600 italic mb-4">"{quote}"</p>
    <div className="flex items-center">
      <div className="bg-yellow-400 rounded-full p-2 mr-4">
        <FaUserTie className="text-primary" size={20} />
      </div>
      <div>
        <p className="font-bold text-primary">{name}</p>
        <p className="text-sm text-gray-500">{company}</p>
      </div>
    </div>
  </motion.div>
);

const TestimonialsSection = () => (
  <section className="py-20 bg-linear-to-b from-gray-50 to-white">
    <div className="container mx-auto px-6 text-center">
      <h2 className="text-3xl font-bold mb-12 text-primary">What Our Clients Say</h2>
      <div className="grid md:grid-cols-3 gap-8">
        <TestimonialCard quote="BongoExpressCargo transformed our supply chain. Their efficiency and customer service are second to none." name="Mohamed Ali" company="Innovate Inc." />
        <TestimonialCard quote="The best logistics partner we've ever had. Always on time, always reliable." name="Amina Hassan" company="Marketplace Co." />
        <TestimonialCard quote="Their global reach and customs expertise have been a game-changer for our international business." name="James Mwangi" company="Global Exports" />
      </div>
    </div>
  </section>
);

// 🚚 CTA SECTION
const CTASection = () => (
  <section className="py-20 bg-gray-100 text-center">
    <motion.div 
      className="container mx-auto px-6"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.5 }}
      variants={fadeIn}
    >
      <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary">Ready to Ship with Confidence?</h2>
      <p className="text-lg md:text-xl mb-8 text-gray-600">
        Let’s move your business forward — contact us today.
      </p>
      <Link
        to="/contact"
        className="bg-yellow-400 text-gray-900 font-bold py-3 px-8 rounded-lg hover:bg-yellow-500 transition-colors text-lg"
      >
        Get Started
      </Link>
    </motion.div>
  </section>
);

const Home = () => {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <AboutPreviewSection />
      <ServicesOverviewSection />
      <StatsSection />
      <TestimonialsSection />
      <CTASection />
    </>
  );
};

export default Home;
