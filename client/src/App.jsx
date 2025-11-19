import { Outlet, useLocation } from "react-router-dom";
import Navbar from './components/Navbar';
import Footer from './components/Footer';

function App() {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/admin/dashboard') || location.pathname.startsWith('/customer/dashboard');

  return (
    <div className="flex flex-col min-h-screen bg-light text-gray-800">
      {!isDashboard && <Navbar />}
      <main className="grow">
        <Outlet />
      </main>
      {!isDashboard && <Footer />}
    </div>
  );
}

export default App;
