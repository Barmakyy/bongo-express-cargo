import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTruck,
  FaShip,
  FaPlane,
  FaWarehouse,
  FaRoad,
  FaBoxOpen,
} from "react-icons/fa";
import { Link } from "react-router-dom";

const fadeIn = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const services = [
  {
    icon: <FaTruck className="text-5xl text-accent mb-4" />,
    title: "Road Freight",
    desc: "Reliable and flexible road transport across cities and borders — fast, safe, and on time.",
    details:
      "Our road freight service offers extensive coverage across regions, with GPS tracking and route optimization to ensure your goods arrive on time. We handle everything from small parcels to large cargo shipments.",
    image:
      "https://mercer-trans.com/wp-content/uploads/2024/07/Freight-Logistics-101-Header-Photo--e1721080947292.jpg",
  },
  {
    icon: <FaShip className="text-5xl text-accent mb-4" />,
    title: "Ocean Freight",
    desc: "Affordable, global shipping with full container and less-than-container load options.",
    details:
      "We partner with leading international carriers to provide cost-effective and secure sea freight services. Whether it’s FCL, LCL, or project cargo, we ensure your shipments are efficiently managed.",
    image:
      "https://arktransportation.com/wp-content/uploads/2024/09/Ocean-Cargo-for-Blog-2-2000x1124-1-1200x800.jpg",
  },
  {
    icon: <FaPlane className="text-5xl text-accent mb-4" />,
    title: "Air Freight",
    desc: "Fast and reliable air cargo delivery for urgent shipments worldwide.",
    details:
      "BongoExpressCargo Air Freight ensures rapid delivery of time-sensitive cargo. We offer door-to-door, airport-to-airport, and express options tailored to your business needs.",
    image:
      "https://www.itln.in/h-upload/2023/07/20/52174-india-bright-spot-for-global-air-freight.webp",
  },
  {
    icon: <FaWarehouse className="text-5xl text-accent mb-4" />,
    title: "Warehousing",
    desc: "Secure, tech-driven storage facilities to handle your goods with care and precision.",
    details:
      "Our modern warehouses are equipped with 24/7 surveillance, inventory management systems, and temperature control — ensuring maximum safety and efficiency for your goods.",
    image:
      "https://www.dhl.com/discover/adobe/dynamicmedia/deliver/dm-aid--fb2074c7-45b1-4634-945b-cbf007e04a1c/desktop-image-1920x918.jpg?preferwebp=true&quality=82",
  },
  {
    icon: <FaRoad className="text-5xl text-accent mb-4" />,
    title: "Last Mile Delivery",
    desc: "Efficient last-mile logistics to ensure your parcels reach customers right on time.",
    details:
      "We specialize in last-mile delivery services that bridge the gap between distribution hubs and final destinations. With real-time tracking, we guarantee transparency and reliability.",
    image:
      "https://mobisoftinfotech.com/resources/wp-content/uploads/2021/02/last-mile-delivery-services.png",
  },
  {
    icon: <FaBoxOpen className="text-5xl text-accent mb-4" />,
    title: "Customs Clearance",
    desc: "Smooth customs processes with expert documentation and on-ground support.",
    details:
      "Our customs experts manage all the complex documentation and regulatory compliance, saving you time and avoiding unnecessary delays at ports and borders.",
    image:
      "https://www.hartlogistic.com/wp-content/uploads/2021/10/Figure-1-Customs-Clearance-Kenya.jpg",
  },
];

const Services = () => {
  const [selectedService, setSelectedService] = useState(null);

  return (
    <div className="bg-light text-gray-800">
      {/* 🌍 Hero Section */}
      <section
        className="relative h-[60vh] bg-cover bg-center flex items-center justify-center text-white"
        style={{
          backgroundImage:
            "url('https://www.skillsforlogistics.org/wp-content/uploads/2023/07/3554469_8b80_9.jpg')",
        }}
      >
        <div className="absolute inset-0 bg-linear-to-r from-black/80 to-black/50"></div>
        <motion.div
          className="relative z-10 text-center px-6"
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 text-accent">
            Our Logistics Services
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto text-gray-100">
            Comprehensive transport and supply chain solutions tailored for your business.
          </p>
        </motion.div>
      </section>

      {/* 🚚 Services Grid */}
      <section className="py-20 container mx-auto px-6">
        <motion.h2
          className="text-4xl font-bold text-center text-primary mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
        >
          What We Offer
        </motion.h2>

        <div className="grid md:grid-cols-3 sm:grid-cols-2 gap-10">
          {services.map((service, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -8 }}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              className="bg-white shadow-lg rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer"
              onClick={() => setSelectedService(service)}
            >
              <div
                className="h-52 bg-cover bg-center"
                style={{ backgroundImage: `url(${service.image})` }}
              ></div>
              <div className="p-6 text-center">
                {service.icon}
                <h3 className="text-2xl font-semibold mb-3 text-primary">
                  {service.title}
                </h3>
                <p className="text-gray-700 mb-4">{service.desc}</p>
                <button className="inline-block bg-accent text-primary font-bold py-2 px-6 rounded-lg hover:bg-yellow-400 transition-colors">
                  Learn More
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 🟢 Call to Action */}
      <section className="py-20 bg-gray-100 text-center">
        <motion.div
          className="max-w-3xl mx-auto px-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
        >
          <h2 className="text-4xl font-bold mb-6 text-primary">
            Ready to Ship with BongoExpressCargo?
          </h2>
          <p className="text-lg mb-8 text-gray-600">
            Partner with us for seamless delivery, global coverage, and real-time tracking.
          </p>
          <Link
            to="/contact"
            className="bg-accent text-primary font-bold py-3 px-10 rounded-lg hover:bg-yellow-400 transition-colors text-lg"
          >
            Book a Shipment
          </Link>
        </motion.div>
      </section>

      {/* 🪟 Modal for Service Details */}
      <AnimatePresence>
        {selectedService && (
          <motion.div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedService(null)}
          >
            <motion.div
              className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden relative"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedService.image}
                alt={selectedService.title}
                className="w-full h-56 object-cover"
              />
              <div className="p-6">
                <h3 className="text-3xl font-bold text-primary mb-4">
                  {selectedService.title}
                </h3>
                <p className="text-gray-700 mb-6">{selectedService.details}</p>
                <button
                  onClick={() => setSelectedService(null)}
                  className="bg-primary text-white py-2 px-6 rounded-lg hover:bg-accent hover:text-primary transition-all font-semibold"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Services;
