import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import Services from './pages/Services.jsx';
import Contact from './pages/Contact.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import DashboardOverview from './pages/DashboardOverview.jsx';
import Shipments from './pages/Shipments.jsx';
import Customers from './pages/Customers.jsx';
import Staff from './pages/Staff.jsx';
import Payments from './pages/Payments.jsx';
import Settings from './pages/Settings.jsx';
import Messages from './pages/Messages.jsx';
import StaffDashboardOverview from './pages/StaffDashboardOverview.jsx';
import StaffShipments from './pages/StaffShipments.jsx';
import StaffMessages from './pages/StaffMessages.jsx';
import StaffPayments from './pages/StaffPayments.jsx';
import StaffCreateShipment from './pages/StaffCreateShipment.jsx';
import StaffDashboard from './pages/StaffDashboard.jsx';
import CustomerDashboard from './pages/CustomerDashboard.jsx';
import CustomerDashboardOverview from './pages/CustomerDashboardOverview.jsx';
import CustomerMessages from './pages/CustomerMessages.jsx';
import CustomerSettings from './pages/CustomerSettings.jsx';
import CustomerPayments from './pages/CustomerPayments.jsx';
import ShipmentTracker from './pages/ShipmentTracker.jsx';
import CustomerShipments from './pages/CustomerShipments.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import GuestBooking from './pages/GuestBooking.jsx';
import TrackingPage from './pages/TrackingPage.jsx';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { NotificationProvider } from './context/NotificationContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'about', element: <About /> },
      { path: 'services', element: <Services /> },
      { path: 'contact', element: <Contact /> },
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      { path: 'forgot-password', element: <ForgotPassword /> },
      { path: 'reset-password/:token', element: <ResetPassword /> },
      { path: 'book-shipment', element: <GuestBooking /> },
      { path: 'track', element: <TrackingPage /> },
      { path: 'track/:trackingId', element: <TrackingPage /> },
      {
        path: 'admin/dashboard',
        element: <AdminDashboard />,
        children: [
          { index: true, element: <DashboardOverview /> },
          { path: 'shipments', element: <Shipments /> },
          { path: 'customers', element: <Customers /> },
          { path: 'staff', element: <Staff /> },
          { path: 'payments', element: <Payments /> },
          { path: 'settings', element: <Settings /> },
          { path: 'messages', element: <Messages /> },
        ],
      },
      {
        path: 'customer/dashboard',
        element: <CustomerDashboard />,
        children: [
          { index: true, element: <CustomerDashboardOverview /> },
          { path: 'shipments', element: <CustomerShipments /> },
          { path: 'messages', element: <CustomerMessages /> },
          { path: 'payments', element: <CustomerPayments /> },
          { path: 'settings', element: <CustomerSettings /> },
          { path: 'shipments/:id/track', element: <ShipmentTracker /> },
        ],
      },
      {
        path: 'staff/dashboard',
        element: <StaffDashboard />,
        children: [
          { index: true, element: <StaffDashboardOverview /> },
          { path: 'shipments', element: <StaffShipments /> },
          { path: 'create-shipment', element: <StaffCreateShipment /> },
          { path: 'messages', element: <StaffMessages /> },
          { path: 'payments', element: <StaffPayments /> },
          { path: 'settings', element: <CustomerSettings /> },
        ],
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <NotificationProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </NotificationProvider>
  </React.StrictMode>,
);
