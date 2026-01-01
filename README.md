# 🏠 EstageGo - Real Estate Search & Management Platform

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=0a0a0a)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-8.x-47A248?logo=mongodb&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?logo=socketdotio&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Cloudinary-Media-3448C5?logo=cloudinary&logoColor=white)
![Rasa](https://img.shields.io/badge/Rasa-ChatBot-5B245F?logo=rasa&logoColor=white)
![License](https://img.shields.io/badge/License-ISC-blue)

EstageGo is a comprehensive platform for searching, managing, and transacting real estate properties. The application provides real-time communication, artificial intelligence, integrated payment support, and advanced user management features.

---

Production: https://frontend-v24l.onrender.com/


## 🎯 Project Overview

EstageGo is a full-stack web application designed to connect buyers, sellers, and renters with real estate agents and brokers. The platform supports:

- **Advanced property search** with sophisticated filtering capabilities
- **Listing management** for real estate agents
- **Real-time communication** between users via Socket.IO
- **AI chatbot** for 24/7 customer support (Rasa)
- **Secure user authentication** with JWT
- **Integrated payment processing** via VNPay
- **Media management** with Cloudinary
- **Review & rating system**
- **Member management and service packages**

---

## 👨‍💻 Development Team

| # | Student ID | Name |
|---|-----------|------|
| 1 | 22110295 | Đặng Đăng Duy |
| 2 | 22110338 | Nguyễn Văn Hùng |
| 3 | 22110450 | Võ Văn Tuấn |

---

## ✨ Key Features

### 🏠 Property Management
- ✅ Create/Edit/Delete property listings
- ✅ Advanced search and filtering (location, price, area, property type)
- ✅ Detailed address support (Province/City, District/County, Ward/Commune)
- ✅ Listing tier management (Tier config)
- ✅ User activity history

### 👥 User Management
- ✅ Registration and login
- ✅ Google OAuth authentication
- ✅ Password reset via email
- ✅ User profiles
- ✅ Agent follow system
- ✅ Wishlist (favorite properties)
- ✅ Membership packages and feature restrictions

### 💬 Real-time Communication
- ✅ 1:1 messaging between users
- ✅ Text, image, file, and audio messages
- ✅ Message reactions
- ✅ Real-time notifications for new messages
- ✅ Online/offline status
- ✅ Typing indicators
- ✅ Message metadata support

### 🤖 AI Assistant (Rasa Chatbot)
- ✅ 24/7 customer support bot
- ✅ Property search and recommendations
- ✅ Contact management (add/remove/list)
- ✅ Integration with React interface
- ✅ Support for multiple intents and conversation flows

### 💰 Payment & Service Packages
- ✅ VNPay integration
- ✅ Membership package management
- ✅ Transaction history
- ✅ Secure signature verification

### ⭐ Reviews & Ratings
- ✅ Rate agents
- ✅ Rate property listings
- ✅ Display average ratings
- ✅ Review history management

### 📧 Notifications
- ✅ Email notifications
- ✅ Real-time in-app notifications
- ✅ Notifications for friend requests, new messages, etc.
- ✅ Twilio integration (SMS optional)

---

## 🗂️ Project Structure

```
EstageGo/
├── 📦 package.json                      # Root package config
├── 📖 README.md                         # This file
│
├── 🔧 backend/                          # Node.js/Express server
│   ├── package.json                     # Backend dependencies
│   ├── jsconfig.json                    # JavaScript config
│   ├── src/
│   │   ├── server.js                    # Entry point
│   │   ├── config/                      # Application configuration
│   │   │   ├── cloudinary.js            # Cloudinary setup
│   │   │   ├── cors.js                  # CORS configuration
│   │   │   ├── environment.js           # Environment variables
│   │   │   └── ...
│   │   ├── controllers/                 # Request handling logic
│   │   │   ├── authController.js        # Authentication
│   │   │   ├── propertyController.js    # Property management
│   │   │   ├── messageController.js     # Message handling
│   │   │   └── ...
│   │   ├── models/                      # MongoDB schemas
│   │   │   ├── users.js                 # User schema
│   │   │   ├── properties.js            # Property schema
│   │   │   ├── messages.js              # Message schema
│   │   │   ├── reviews.js               # Review schema
│   │   │   ├── agentFollows.js          # Agent follow schema
│   │   │   ├── wishlists.js             # Wishlist schema
│   │   │   ├── province.js              # Province/State
│   │   │   ├── district.js              # District/County
│   │   │   ├── ward.js                  # Ward/Commune
│   │   │   └── ...
│   │   ├── services/                    # Business logic
│   │   │   ├── emailService.js          # Email sending
│   │   │   ├── uploadService.js         # Media upload
│   │   │   ├── paymentService.js        # Payment processing
│   │   │   └── ...
│   │   ├── middlewares/                 # Express middlewares
│   │   │   ├── authMiddleware.js        # JWT verification
│   │   │   ├── errorMiddleware.js       # Error handling
│   │   │   └── ...
│   │   ├── routes/                      # API routes
│   │   │   ├── v1/                      # Version 1 API
│   │   │   │   ├── auth.js
│   │   │   │   ├── properties.js
│   │   │   │   ├── messages.js
│   │   │   │   └── ...
│   │   │   └── v2/                      # Version 2 API
│   │   ├── sockets/                     # Socket.IO handlers
│   │   │   ├── messageSocket.js         # Message events
│   │   │   ├── notificationSocket.js    # Notification events
│   │   │   └── ...
│   │   ├── validations/                 # Input validation schemas
│   │   ├── providers/                   # External services
│   │   ├── utils/                       # Utility functions
│   │   └── seeds/                       # Database seed data
│
├── 🎨 frontend/                         # React/Vite application
│   ├── package.json                     # Frontend dependencies
│   ├── vite.config.js                   # Vite configuration
│   ├── jsconfig.json                    # JavaScript config
│   ├── index.html                       # HTML entry point
│   ├── src/
│   │   ├── main.jsx                     # App entry
│   │   ├── App.jsx                      # Root component
│   │   ├── index.css                    # Global styles
│   │   ├── apis/                        # API calls to backend
│   │   │   ├── authApi.js
│   │   │   ├── propertyApi.js
│   │   │   ├── messageApi.js
│   │   │   └── ...
│   │   ├── components/                  # React components
│   │   │   ├── AgentPage/               # Agent detail page
│   │   │   ├── PropertyCard/            # Property card
│   │   │   ├── ChatBox/                 # Chat interface
│   │   │   ├── Header/                  # Navigation
│   │   │   ├── Footer/                  # Footer
│   │   │   ├── FilterPanel/             # Search filter
│   │   │   └── ...
│   │   ├── contexts/                    # React Context API
│   │   ├── hooks/                       # Custom React hooks
│   │   ├── layouts/                     # Layout components
│   │   ├── pages/                       # Page components
│   │   │   ├── HomePage.jsx
│   │   │   ├── PropertyDetailsPage.jsx
│   │   │   ├── ChatPage.jsx
│   │   │   ├── ProfilePage.jsx
│   │   │   └── ...
│   │   ├── redux/                       # Redux state management
│   │   │   ├── slices/
│   │   │   └── store.js
│   │   ├── schemas/                     # Validation schemas
│   │   ├── utils/                       # Utility functions
│   │   ├── lib/                         # Helper libraries
│   │   └── assets/                      # Images, icons, fonts
│   └── public/                          # Static assets
│       ├── images/
│       ├── fonts/
│       ├── geojson/                     # Map data
│       └── icon/
│
├── 🤖 rasa_assistant/                   # Rasa chatbot
│   ├── config.yml                       # Rasa config
│   ├── credentials.yml                  # Credentials
│   ├── endpoints.yml                    # API endpoints
│   ├── domain/                          # Domain config
│   │   ├── add_contact.yml              # Add contact intent
│   │   ├── list_contacts.yml            # List contacts intent
│   │   ├── remove_contact.yml           # Remove contact intent
│   │   ├── search_property.yml          # Search property intent
│   │   └── shared.yml                   # Shared definitions
│   ├── actions/                         # Custom actions
│   │   ├── action_template.py           # Template action
│   │   ├── add_contact.py               # Add contact action
│   │   ├── list_contacts.py             # List contacts action
│   │   ├── remove_contact.py            # Remove contact action
│   │   ├── search_property.py           # Search property action
│   │   ├── db.py                        # Database interaction
│   │   └── __init__.py
│   ├── data/                            # Training data
│   │   ├── patterns.yml                 # NLU patterns
│   │   └── flows/                       # Dialog flows
│   ├── db/                              # Data storage
│   │   └── contacts.json                # Contacts database
│   └── e2e_tests/                       # End-to-end tests
│       ├── happy_paths/                 # Successful scenarios
│       ├── corrections/                 # Error correction flows
│       └── cancelations/                # Cancellation flows
│
└── 📚 docs/                             # Documentation
```

---

## 📋 System Requirements

### Backend
- **Node.js**: 18.x or higher
- **MongoDB**: 6.x (Local or MongoDB Atlas)
- **npm** or **yarn**

### Frontend
- **Node.js**: 18.x or higher
- **npm** or **yarn**
- **Modern browser** supporting ES6+

### Rasa Chatbot
- **Python**: 3.8 or higher
- **Rasa**: 3.x
- **Rasa SDK**: 3.x

---

## 🚀 Installation & Setup

### 1️⃣ Clone Repository

```bash
git clone https://github.com/DangDuyy/EstageGo.git
cd EstageGo
```

### 2️⃣ Install Dependencies

#### Install all (Backend + Frontend)
```bash
yarn install:all
```

#### Install Backend only
```bash
cd backend
yarn install
```

#### Install Frontend only
```bash
cd frontend
yarn install
```

### 3️⃣ Configure Environment Variables

#### Backend - Create `backend/.env` file

```env
# ========== SERVER ==========
NODE_ENV=development
LOCAL_DEV_APP_HOST=localhost
LOCAL_DEV_APP_PORT=8017
WEBSITE_DOMAIN_DEVELOPMENT=http://localhost:5173
WEBSITE_DOMAIN_PRODUCTION=https://yourdomain.com
BUILD_MODE=dev
AUTHOR=EstageGo Team

# ========== DATABASE ==========
MONGO_URI=mongodb://127.0.0.1:27017
DATABASE_NAME=estagego

# ========== AUTH & JWT ==========
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_EXPIRE_TIME=365d
JWT_RESET_PASSWORD_EXPIRE=15m

# ========== CLOUDINARY (Media Upload) ==========
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# ========== EMAIL SERVICE ==========
GMAIL_USER=your_email@gmail.com
GMAIL_PASSWORD=your_app_password
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=noreply@estagego.com
FROM_NAME=EstageGo

# ========== PAYMENT (VNPay) ==========
VNP_TMN_CODE=your_vnpay_tmncode
VNP_HASH_SECRET=your_vnpay_hash_secret
VNP_CHECKOUT_URL=https://sandbox.vnpayment.vn/paygate
VNP_API_URL=https://api.vnpayment.vn

# ========== OAUTH (Google) ==========
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:8017/auth/google/callback

# ========== SMS SERVICE (Twilio - Optional) ==========
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# ========== RASA CHATBOT ==========
RASA_SERVER_URL=http://localhost:5005

# ========== CORS ==========
CORS_ORIGIN=http://localhost:5173,https://yourdomain.com
```

#### Frontend - Create `frontend/.env` (if needed)

```env
VITE_BUILD_MODE=development
VITE_API_URL=http://localhost:8017
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### 4️⃣ Start MongoDB

#### Local MongoDB
```bash
# Windows - If installed via MSI
mongod

# Or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

#### MongoDB Atlas (Cloud)
Update `MONGO_URI` in `.env` with connection string from Atlas

### 5️⃣ Run Backend

```bash
cd backend
yarn dev
```

Server will run at: `http://localhost:8017`

### 6️⃣ Run Frontend

Open new terminal:
```bash
cd frontend
yarn dev
```

App will run at: `http://localhost:5173`

### 7️⃣ Run Rasa Chatbot (Optional)

```bash
cd rasa_assistant
rasa run --port 5005
```

Or run with actions server:
```bash
# Terminal 1
rasa run -m models --enable-api --cors "*" --port 5005

# Terminal 2
rasa run actions --port 5055
```

---

## 🏗️ System Architecture

### Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (React/Vite)              │
│  - Components, Pages, Redux State Management         │
│  - Real-time Chat UI, Property Search, Profile      │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP/WebSocket
┌──────────────────────▼──────────────────────────────┐
│             API Server (Node.js/Express)             │
│  ├─ REST API Routes (v1, v2)                        │
│  ├─ Socket.IO Server (Real-time messaging)          │
│  ├─ Authentication & Authorization                  │
│  └─ Business Logic Services                         │
└──────────────────────┬──────────────────────────────┘
                       │ Mongoose ODM
┌──────────────────────▼──────────────────────────────┐
│           MongoDB Database                           │
│  ├─ Users & Profiles                               │
│  ├─ Properties & Listings                          │
│  ├─ Messages & Conversations                       │
│  ├─ Reviews & Ratings                              │
│  ├─ Transactions & Payments                        │
│  └─ Geographic Data (Province/District/Ward)       │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│          External Services Integration               │
│  ├─ Cloudinary (Media Storage)                      │
│  ├─ VNPay (Payment Gateway)                         │
│  ├─ Gmail/SendGrid (Email Service)                  │
│  ├─ Twilio (SMS Service - Optional)                 │
│  ├─ Google OAuth (Authentication)                   │
│  └─ Rasa (AI Chatbot)                              │
└──────────────────────────────────────────────────────┘
```

---

## 📡 API Routes

### Authentication Routes (`/V1/auth`)
- `POST /register` - Register new user
- `POST /login` - User login
- `POST /logout` - User logout
- `POST /refresh-token` - Refresh access token
- `POST /forgot-password` - Request password reset
- `PUT /reset-password/:token` - Reset password
- `GET /verify-email/:token` - Verify email address
- `GET /google` - OAuth Google login
- `GET /google/callback` - Google callback

### User Routes (`/V1/users`)
- `GET /:id` - Get user information
- `PUT /:id` - Update user profile
- `DELETE /:id` - Delete account
- `GET /:id/activity` - Get activity history
- `POST /:id/follow-agent` - Follow an agent
- `DELETE /:id/unfollow-agent/:agentId` - Unfollow agent

### Property Routes (`/V1/properties`)
- `GET` - List properties (with filters)
- `POST` - Create new listing
- `GET /:id` - Get property details
- `PUT /:id` - Update listing
- `DELETE /:id` - Delete listing
- `POST /:id/add-to-wishlist` - Add to favorites
- `DELETE /:id/remove-from-wishlist` - Remove from favorites

### Message Routes (`/V1/messages`)
- `GET /conversations` - List conversations
- `GET /conversations/:conversationId` - Get conversation details
- `POST /send` - Send message
- `PUT /:messageId` - Edit message
- `DELETE /:messageId` - Delete message
- `POST /:messageId/react` - Add reaction

### Review Routes (`/V1/reviews`)
- `GET /properties/:propertyId` - Get property reviews
- `POST /properties/:propertyId` - Write property review
- `GET /agents/:agentId` - Get agent reviews
- `POST /agents/:agentId` - Write agent review

### Payment Routes (`/V1/payments`)
- `POST /create-payment` - Create payment transaction
- `GET /payment-return` - Handle VNPay return
- `GET /transaction-history` - Get transaction history
- `GET /transaction/:id` - Get transaction details

### Membership Routes (`/V1/membership`)
- `GET /packages` - List membership packages
- `POST /upgrade` - Upgrade membership
- `GET /my-membership` - Get current membership

### Geographic Routes (`/V1/geographic`)
- `GET /provinces` - List provinces/cities
- `GET /provinces/:provinceId/districts` - List districts
- `GET /districts/:districtId/wards` - List wards

---

## 🔌 Socket.IO Events

### Message Events
- `message:send` - Send new message
- `message:received` - Receive message
- `message:edited` - Message edited
- `message:deleted` - Message deleted
- `message:reaction` - Add reaction

### Presence Events
- `user:online` - User online
- `user:offline` - User offline
- `typing:start` - Start typing
- `typing:stop` - Stop typing

### Notification Events
- `notification:new` - New notification
- `notification:read` - Mark as read
- `notification:delete` - Delete notification

### Agent Events
- `agent:follow` - Follow agent
- `agent:unfollow` - Unfollow agent
- `agent:request` - Send contact request

---

## 🤖 Rasa Chatbot Intents

### Intents
- `add_contact` - Add new contact
- `list_contacts` - List contacts
- `remove_contact` - Remove contact
- `search_property` - Search properties
- `greet` - Greeting
- `goodbye` - Goodbye
- `thankyou` - Thank you
- `deny` - Deny
- `affirm` - Affirm

### Entities
- `contact_name` - Contact name
- `property_type` - Property type
- `location` - Location
- `price_range` - Price range
- `area` - Area size

---

## 🔐 Security & Authentication

### JWT (JSON Web Tokens)
- Uses HS256 algorithm
- Expiration: 365 days (configurable)
- Secure refresh token storage
- CSRF protection

### Password Security
- Encrypted with bcryptjs (salt rounds: 10)
- Password reset via email
- Never store plain text passwords

### CORS Configuration
- Allow cross-origin requests from frontend
- Limited methods: GET, POST, PUT, DELETE, OPTIONS
- Credentials: true

### Input Validation
- Using Joi & Zod schemas
- Validate all user inputs
- Prevent SQL injection and XSS attacks

---

## 📦 Main Dependencies

### Backend
| Package | Version | Purpose |
|---------|---------|---------|
| express | ^5.1.0 | Web framework |
| mongoose | ^8.18.0 | MongoDB ODM |
| jsonwebtoken | ^9.0.2 | JWT authentication |
| bcryptjs | ^3.0.2 | Password hashing |
| socket.io | ^4.8.1 | Real-time communication |
| cloudinary | ^2.7.0 | Media storage |
| joi | ^17.13.3 | Input validation |
| zod | ^4.1.9 | Schema validation |
| vnpay | ^2.4.4 | Payment gateway |
| nodemailer | ^7.0.10 | Email service |
| twilio | ^5.10.5 | SMS service |
| @google/generative-ai | ^0.24.1 | Google AI API |

### Frontend
| Package | Version | Purpose |
|---------|---------|---------|
| react | ^18 | UI library |
| vite | ^5 | Build tool |
| axios | ^1.5.1 | HTTP client |
| @reduxjs/toolkit | ^2.0.1 | State management |
| react-router-dom | ^6 | Routing |
| tailwindcss | ^3 | CSS utility |
| @radix-ui | ^1 | UI components |
| framer-motion | ^11 | Animations |
| @react-google-maps/api | ^2.20 | Google Maps |
| @react-oauth/google | ^0.12 | Google OAuth |
| socket.io-client | ^4.8 | Real-time client |
| recharts | - | Charts & graphs |

---

## 🛠️ Useful Scripts

### Root Scripts
```bash
yarn install:all      # Install all dependencies
yarn install:fe       # Install frontend
yarn install:be       # Install backend
yarn dev:fe           # Run frontend
yarn dev:be           # Run backend
```

### Backend Scripts
```bash
yarn dev              # Run development mode
yarn production       # Build & run production
yarn build            # Build project
yarn lint             # Check code style
```

### Frontend Scripts
```bash
yarn dev              # Run development server
yarn build            # Build production
yarn preview          # Preview production build
yarn lint             # Fix linting errors
yarn lint:ci          # Check linting (CI mode)
```

---

## 🧪 Testing

### Running Tests
```bash
# Backend (if tests exist)
cd backend
yarn test

# Frontend (if tests exist)
cd frontend
yarn test
```

### End-to-End Tests (Rasa)
```bash
cd rasa_assistant
rasa test
```

---

## 📝 Database Models

### Users
```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  firstName: String,
  lastName: String,
  avatar: String (Cloudinary URL),
  phone: String,
  bio: String,
  role: String (user, agent, admin),
  address: String,
  province: ObjectId,
  district: ObjectId,
  ward: ObjectId,
  membership: ObjectId,
  isEmailVerified: Boolean,
  isPhoneVerified: Boolean,
  isBlocked: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Properties
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  type: String (buy, sell, rent),
  category: String (apartment, house, land, etc),
  price: Number,
  area: Number,
  bedrooms: Number,
  bathrooms: Number,
  images: [String], (Cloudinary URLs),
  address: String,
  province: ObjectId,
  district: ObjectId,
  ward: ObjectId,
  latitude: Number,
  longitude: Number,
  agent: ObjectId,
  tier: ObjectId,
  status: String (active, pending, sold),
  views: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### Messages
```javascript
{
  _id: ObjectId,
  conversationId: ObjectId,
  sender: ObjectId,
  content: String,
  type: String (text, image, file, audio),
  media: {
    url: String,
    type: String,
    size: Number
  },
  reactions: [
    {
      userId: ObjectId,
      emoji: String
    }
  ],
  isRead: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🐛 Troubleshooting

### Connection Issues
**Problem**: Cannot connect to MongoDB
```
SOLUTION: 
- Ensure MongoDB is running (mongod process)
- Check MONGO_URI in .env file
- If using MongoDB Atlas, add IP address to whitelist
```

**Problem**: Backend port already in use
```bash
# Kill process using port 8017 (Windows)
netstat -ano | findstr :8017
taskkill /PID <PID> /F

# Or change port in .env
LOCAL_DEV_APP_PORT=8018
```

### Authentication Issues
**Problem**: JWT token expired
```
SOLUTION:
- Use refresh token to get new token
- Or login again
```

### Media Upload Issues
**Problem**: Cloudinary upload fails
```
SOLUTION:
- Check API key & secret
- Ensure cloud name is correct
- Check file size (max 20MB)
```

### Real-time Issues
**Problem**: Socket.IO connection fails
```
SOLUTION:
- Ensure server runs on correct port
- Check CORS settings
- Clear cache & refresh page
```

---

## 📚 Documentation

Detailed documentation available at:
- [Backend Documentation](./backend/README.md)
- [Frontend Documentation](./frontend/README.md)
- [Rasa Chatbot Guide](./rasa_assistant/README.md)
- [Project Structure](./docs/)

---

## 🚀 Deployment

### Docker Deployment

#### Build & Run with Docker Compose
```bash
docker-compose up --build
```

#### Individual Containers
```bash
# Backend
docker build -t estagego-backend ./backend
docker run -p 8017:8017 --env-file .env estagego-backend

# Frontend
docker build -t estagego-frontend ./frontend
docker run -p 5173:5173 estagego-frontend
```

### Production Build

#### Backend
```bash
cd backend
yarn build
NODE_ENV=production node ./build/src/server.js
```

#### Frontend
```bash
cd frontend
yarn build
# Deploy `dist/` folder to static hosting (Vercel, Netlify, S3, etc)
```

---

## 📊 Performance Optimization

- ✅ Code splitting with Vite
- ✅ Lazy loading components
- ✅ Image optimization with Cloudinary
- ✅ Database indexing
- ✅ Redis caching (optional)
- ✅ CDN for static assets
- ✅ Minification & compression

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Standards
- Use ESLint & Prettier
- Follow JavaScript naming conventions
- Write meaningful commit messages
- Add comments for complex logic
- Update documentation

---

## 📄 License

This project is licensed under the ISC License - see [LICENSE](LICENSE) file for details.

---

## 📞 Support & Contact

- **Issues**: [GitHub Issues](https://github.com/DangDuyy/EstageGo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/DangDuyy/EstageGo/discussions)
- **Email**: support@estagego.com

---

## 🎉 Acknowledgments

- Thanks to all contributors
- MongoDB & Mongoose team
- Express.js & Node.js community
- React & Vite teams
- Rasa team for NLP framework
- Cloudinary for media storage
- VNPay for payment integration

---

<div align="center">

**Made with ❤️ by EstageGo Team**

[⭐ Star us on GitHub](https://github.com/DangDuyy/EstageGo) | [🐛 Report Bug](https://github.com/DangDuyy/EstageGo/issues) | [💡 Request Feature](https://github.com/DangDuyy/EstageGo/issues)

</div>
