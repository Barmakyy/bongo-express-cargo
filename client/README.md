# Logistics Management System

A full-stack web application for managing shipments, customers, staff, and logistics operations. This system provides role-based dashboards for admins, staff, and customers, with features including shipment tracking, payment management, messaging, and real-time notifications.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [System Architecture](#system-architecture)
- [Workflow](#workflow)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [User Roles](#user-roles)

## 🎯 Project Overview

This logistics management system is designed to streamline shipping operations for a logistics company with multiple branches. It handles the complete lifecycle of shipments from creation to delivery, with comprehensive tracking, payment processing, and communication features.

### Key Capabilities

- **Multi-branch operations** across Nairobi, Mombasa, Kisumu, Nakuru, and Eldoret
- **Role-based access control** for Admin, Staff, and Customer users
- **Guest booking system** for non-registered users
- **Real-time shipment tracking** with QR code generation
- **Payment management** and processing
- **Internal messaging system**
- **Notification system** for shipment updates
- **Document uploads** for shipments

## 🛠 Tech Stack

### Frontend

- **Framework:** React 19.1.1
- **Build Tool:** Vite 7.1.7
- **Routing:** React Router DOM 7.9.4
- **Styling:** Tailwind CSS 4.1.16
- **HTTP Client:** Axios 1.13.0
- **Charts:** Recharts 3.3.0
- **Animations:** Framer Motion 12.23.24
- **Icons:** React Icons 5.5.0
- **Date Handling:** date-fns 4.1.0

### Backend

- **Runtime:** Node.js
- **Framework:** Express.js 4.19.2
- **Database:** MongoDB (via Mongoose 8.4.1)
- **Authentication:** JWT (jsonwebtoken 9.0.2)
- **Password Hashing:** bcryptjs 2.4.3
- **Email Service:** Nodemailer 7.0.10
- **File Uploads:** Multer 2.0.2
- **QR Code Generation:** qrcode 1.5.4
- **PDF Generation:** pdfkit 0.17.2
- **2FA:** Speakeasy 2.0.0
- **Validation:** Validator 13.12.0
- **Unique IDs:** nanoid 5.0.7

### Development Tools

- **Package Manager:** pnpm
- **Linting:** ESLint 9.36.0
- **Code Style:** PostCSS 8.5.6
- **Dev Server:** Nodemon 3.1.2 (backend)

## ✨ Features

### Admin Dashboard

- **Dashboard Overview:** View analytics, statistics, and KPIs
- **Shipment Management:** Create, update, track, and manage all shipments
- **Customer Management:** View, add, and manage customer accounts
- **Staff Management:** Manage staff members across branches
- **Payment Tracking:** Monitor and manage payment records
- **Messaging:** Internal communication system
- **Settings:** System configuration and preferences

### Staff Dashboard

- **Dashboard Overview:** Branch-specific analytics and metrics
- **Create Shipments:** Generate new shipments with QR codes
- **Shipment Management:** Handle assigned shipments
- **Payment Processing:** Record and manage payments
- **Messaging:** Communicate with admin and customers
- **Branch-specific Operations:** Manage shipments for assigned branch

### Customer Dashboard

- **Dashboard Overview:** Personal shipment statistics
- **Track Shipments:** Real-time tracking of personal shipments
- **Payment History:** View payment records and invoices
- **Messages:** Communicate with staff and support
- **Settings:** Profile and account management
- **Shipment History:** Complete history of all shipments

### Public Features

- **Guest Booking:** Create shipments without registration
- **Public Tracking:** Track shipments using tracking number
- **Authentication:** Login, register, password reset
- **Information Pages:** About, Services, Contact

## 🏗 System Architecture

### Frontend Architecture

```
client/
├── src/
│   ├── components/        # Reusable UI components
│   ├── pages/            # Route-based page components
│   ├── context/          # React Context providers
│   │   ├── AuthContext.jsx
│   │   ├── NotificationContext.jsx
│   │   └── ThemeContext.jsx
│   ├── hooks/            # Custom React hooks
│   ├── api/              # API configuration (Axios)
│   └── assets/           # Static assets
```

### Backend Architecture

```
server/
├── controllers/          # Business logic handlers
├── models/              # MongoDB schemas
│   ├── User.js
│   ├── Shipment.js
│   ├── Payment.js
│   ├── Message.js
│   ├── Notification.js
│   └── Setting.js
├── routes/              # API route definitions
├── middleware/          # Auth & validation middleware
└── utils/               # Helper functions (email, etc.)
```

### Database Models

**User Model**

- Roles: customer, admin, staff
- Status: Active, Inactive, Idle
- Branch assignment for staff
- Profile information and authentication

**Shipment Model**

- Unique shipment ID (10-character alphanumeric)
- Origin, destination, and status tracking
- Customer or guest details
- Staff assignment and branch
- Timeline tracking with timestamps
- Document attachments

**Payment Model**

- Linked to shipments and customers
- Payment methods and status tracking
- Amount and transaction records

**Message Model**

- Internal messaging between users
- Support for attachments

**Notification Model**

- User-specific notifications
- Read/unread status tracking

**Setting Model**

- System-wide configuration
- User preferences

## 🔄 Workflow

### 1. User Registration & Authentication

```
Guest → Register → Email Verification → Login → JWT Token → Access Dashboard
```

- Users register with name, email, and password
- Passwords are hashed using bcryptjs
- JWT tokens are issued for authenticated sessions
- Password reset via email with token

### 2. Shipment Creation (Staff/Admin)

```
Login → Dashboard → Create Shipment → Enter Details → Generate QR Code → Assign Staff → Save
```

- Staff creates shipment with origin, destination, and customer details
- System generates unique 10-character shipment ID
- QR code is generated for easy tracking
- Shipment assigned to staff member
- Customer receives notification

### 3. Guest Booking

```
Home → Guest Booking → Enter Details → Submit → Receive Tracking Number
```

- Non-registered users can create shipments
- Guest provides name, phone, and shipment details
- Tracking number issued for shipment monitoring

### 4. Shipment Tracking

```
Enter Tracking Number → View Real-time Status → See Location & Timeline
```

- Public tracking page accessible without login
- Shows current status, location, and complete timeline
- Updates as shipment progresses through stages

### 5. Payment Processing

```
Shipment Created → Payment Due → Staff Records Payment → Customer Notified
```

- Payments linked to specific shipments
- Multiple payment methods supported
- Payment history tracked for customers
- Receipt generation

### 6. Messaging & Notifications

```
Event Trigger → Notification Created → User Notified → View in Dashboard
```

- Real-time notifications for shipment updates
- Internal messaging between users
- Email notifications via Nodemailer

## 🚀 Installation

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- pnpm (or npm/yarn)

### Setup Steps

1. **Clone the repository**

```bash
git clone <repository-url>
cd practice
```

2. **Install dependencies**

Backend:

```bash
cd server
pnpm install
```

Frontend:

```bash
cd client
pnpm install
```

3. **Environment Configuration**

Create `.env` file in the `server` directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/logistics
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_email_password
CLIENT_URL=http://localhost:5173
```

4. **Start MongoDB**

```bash
# If using local MongoDB
mongod
```

5. **Run the application**

Backend (from server directory):

```bash
pnpm dev
# or
pnpm start
```

Frontend (from client directory):

```bash
pnpm dev
```

6. **Access the application**

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`

## 📖 Usage

### Development

```bash
# Start backend with auto-reload
cd server && pnpm dev

# Start frontend with HMR
cd client && pnpm dev
```

### Production Build

```bash
# Build frontend
cd client && pnpm build

# Preview production build
cd client && pnpm preview

# Run backend in production
cd server && pnpm start
```

## 📁 Project Structure

### Frontend (`/client`)

```
src/
├── api/
│   └── axios.js              # Axios instance configuration
├── components/
│   ├── Navbar.jsx            # Main navigation bar
│   ├── Footer.jsx            # Footer component
│   └── ScrollToTop.jsx       # Auto-scroll utility
├── context/
│   ├── AuthContext.jsx       # Authentication state
│   ├── NotificationContext.jsx  # Notification management
│   └── ThemeContext.jsx      # Theme management
├── pages/
│   ├── Home.jsx              # Landing page
│   ├── Login.jsx             # User login
│   ├── Register.jsx          # User registration
│   ├── AdminDashboard.jsx    # Admin layout
│   ├── StaffDashboard.jsx    # Staff layout
│   ├── CustomerDashboard.jsx # Customer layout
│   └── ...                   # Other pages
└── hooks/
    └── useMediaQuery.js      # Responsive design hook
```

### Backend (`/server`)

```
├── controllers/
│   ├── authController.js          # Authentication logic
│   ├── shipmentController.js      # Shipment CRUD
│   ├── dashboardController.js     # Dashboard analytics
│   ├── customerController.js      # Customer management
│   ├── staffController.js         # Staff management
│   ├── paymentController.js       # Payment processing
│   ├── messageController.js       # Messaging system
│   └── ...
├── models/
│   ├── User.js               # User schema
│   ├── Shipment.js           # Shipment schema
│   ├── Payment.js            # Payment schema
│   ├── Message.js            # Message schema
│   └── Notification.js       # Notification schema
├── routes/
│   ├── authRoutes.js         # Auth endpoints
│   ├── shipmentRoutes.js     # Shipment endpoints
│   ├── customerRoutes.js     # Customer endpoints
│   └── ...
├── middleware/
│   └── authMiddleware.js     # JWT verification
├── utils/
│   └── email.js              # Email service
└── uploads/                  # File upload directory
```

## 🔌 API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

### Shipments

- `GET /api/shipments` - Get all shipments (admin)
- `POST /api/shipments` - Create new shipment
- `GET /api/shipments/:id` - Get shipment details
- `PUT /api/shipments/:id` - Update shipment
- `DELETE /api/shipments/:id` - Delete shipment

### Customers

- `GET /api/customers` - Get all customers
- `POST /api/customers` - Create customer
- `GET /api/customers/:id` - Get customer details
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Payments

- `GET /api/payments` - Get all payments
- `POST /api/payments` - Create payment record
- `GET /api/payments/:id` - Get payment details

### Messages

- `GET /api/messages` - Get user messages
- `POST /api/messages` - Send message
- `PUT /api/messages/:id` - Mark as read/reply

### Tracking

- `GET /api/track/:trackingNumber` - Public shipment tracking

## 👥 User Roles

### Admin

- Full system access
- Manage all shipments, customers, and staff
- View system-wide analytics
- Configure system settings
- Access to all branches

### Staff

- Branch-specific access
- Create and manage shipments
- Process payments
- Communicate with customers
- View branch analytics

### Customer

- View personal shipments
- Track shipments in real-time
- View payment history
- Communicate with support
- Manage account settings

### Guest

- Create shipments without registration
- Track shipments using tracking number
- Limited access to booking features

## 📝 License

This project is licensed under the ISC License.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📧 Contact

For questions or support, please contact the development team.

---

**Built with ❤️ using React, Node.js, and MongoDB**
