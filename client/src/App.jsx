import { Outlet, useLocation } from "react-router-dom";
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from "./components/ScrollToTop";

function App() {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/admin/dashboard') || location.pathname.startsWith('/customer/dashboard') || location.pathname.startsWith('/staff/dashboard');

  return (
    <div className="flex flex-col min-h-screen bg-light text-gray-800">
      <ScrollToTop />
      {!isDashboard && <Navbar />}
      <main className="grow">
        <Outlet />
      </main>
      {!isDashboard && <Footer />}
    </div>
  );
}

export default App;
