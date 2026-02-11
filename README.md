# Texify - Textile ERP System

Texify is a modern ERP (Enterprise Resource Planning) system built specifically for the textile industry.  
It helps manage purchase deals, sales, delivery challans, tax invoices, inventory, and party records in one centralized platform.

Built using the **MERN Stack (MongoDB, Express.js, React, Node.js)**.

---

## 🚀 Features

### 🔐 Authentication
- User Registration (Sign Up)
- User Login (Sign In)
- JWT-based authentication
- Password encryption using Bcrypt

### 📊 Dashboard
- Overview of business operations
- Quick access to core modules

### 🏭 Party Management
- Add and manage suppliers, buyers, and vendors
- Maintain contact and GST details

### 🧵 Quality & Deal Management
- Create and manage fabric qualities
- Purchase & Sales deal tracking

### 🚚 Delivery Challan Management
- Generate delivery challans
- Attach bale details
- Printable challan format

### 🧾 Tax Invoice Generation
- GST-compliant invoice creation
- Linked with delivery challans
- Printable invoice format

### 📦 Inventory Management
- Track purchases
- Monitor stock movement
- Raw material tracking

### ⚙️ Company Settings
- Configure company profile
- Used for challan and invoice printing

### 📱 Responsive UI
- Mobile-friendly interface
- Optimized for desktop and mobile browsers

---

## 🛠️ Tech Stack

### Frontend
- React.js
- Tailwind CSS
- Radix UI
- React Router
- Axios
- Lucide React

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT (Authentication)
- Bcryptjs (Password Encryption)

---

## 🏗️ Project Structure

Texify/
│
├── backend/
│ ├── models/
│ ├── routes/
│ ├── controllers/
│ └── middleware/
│
├── frontend/
│ ├── components/
│ ├── pages/
│ └── lib/
│
└── README.mdTexify/
│
├── backend/
│ ├── models/
│ ├── routes/
│ ├── controllers/
│ └── middleware/
│
├── frontend/
│ ├── components/
│ ├── pages/
│ └── lib/
│
└── README.md


---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v16+)
- MongoDB (Local or MongoDB Atlas)

---

### 1️⃣ Clone Repository

```bash
git clone https://github.com/Sharjeel21/Texify.git
cd Texify

2️⃣ Backend Setup
cd backend
npm install

Create .env file:

PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key

Run backend:

npm start

3️⃣ Frontend Setup
cd frontend
npm install
npm start


🤝 Contribution

Pull requests are welcome.
For major changes, please open an issue first to discuss improvements.