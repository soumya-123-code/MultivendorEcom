# ERP E-Commerce Admin Dashboard

A modern, production-grade React frontend for the ERP E-Commerce backend system. Built with TypeScript, Material-UI, Redux Toolkit, and React Query.

## 🚀 Features

- **Modern Stack**: React 18, TypeScript, Material-UI v5
- **State Management**: Redux Toolkit + React Query for optimal caching
- **Dark Mode**: Beautiful dark theme by default with light mode option
- **Responsive Design**: Mobile-first approach, works on all devices
- **OTP Authentication**: Passwordless login with JWT tokens
- **Role-Based Access**: Admin, Vendor, Staff, Customer, Delivery Agent
- **Real-time Updates**: React Query for automatic data synchronization

## 📦 Tech Stack

- **Framework**: React 18 with TypeScript
- **UI Library**: Material-UI v5 with custom theme
- **State Management**: Redux Toolkit
- **Data Fetching**: TanStack React Query
- **Routing**: React Router v6
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts
- **Animations**: Framer Motion
- **HTTP Client**: Axios with interceptors
- **Date Handling**: date-fns

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── common/         # General components (StatusChip, StatsCard, etc.)
│   ├── forms/          # Form components
│   ├── tables/         # Data tables
│   ├── charts/         # Chart components
│   └── modals/         # Modal dialogs
├── pages/              # Page components
│   ├── auth/           # Login, password reset
│   ├── dashboard/      # Main dashboard
│   ├── products/       # Product management
│   ├── categories/     # Category management
│   ├── orders/         # Sales order management
│   ├── purchase-orders/# Purchase order management
│   ├── inventory/      # Stock management
│   ├── warehouses/     # Warehouse management
│   ├── vendors/        # Vendor management
│   ├── customers/      # Customer management
│   ├── users/          # User management
│   └── settings/       # App settings
├── layouts/            # Layout components
├── hooks/              # Custom React hooks
├── services/           # API services
│   └── api/           # API client and endpoints
├── store/              # Redux store
│   └── slices/        # Redux slices
├── theme/              # MUI theme configuration
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## 🔧 Installation

1. **Clone and install dependencies**:
```bash
cd erp-frontend
npm install
```

2. **Configure environment**:
```bash
cp .env.example .env
# Edit .env with your API URL
```

3. **Start development server**:
```bash
npm start
```

## 🔌 API Integration

The frontend is designed to work with the Django backend at `/api/v1/`. Key endpoints:

### Authentication
- `POST /auth/request-otp/` - Request OTP
- `POST /auth/verify-otp/` - Verify OTP and get tokens
- `POST /auth/refresh/` - Refresh access token
- `POST /auth/logout/` - Logout

### Products
- `GET /products/` - List products
- `POST /products/` - Create product
- `GET /products/{id}/` - Get product
- `PATCH /products/{id}/` - Update product
- `DELETE /products/{id}/` - Delete product

### Categories
- `GET /categories/` - List categories
- `GET /categories/tree/` - Category tree
- `POST /categories/` - Create category

### Orders
- `GET /sales-orders/` - List orders
- `GET /sales-orders/{id}/` - Get order
- `POST /sales-orders/{id}/status/` - Update status

### Purchase Orders
- `GET /purchase-orders/` - List POs
- `POST /purchase-orders/` - Create PO
- `POST /purchase-orders/{id}/approve/` - Approve PO

### Inventory
- `GET /inventory/` - List inventory
- `POST /inventory/adjust/` - Adjust stock
- `POST /inventory/transfer/` - Transfer stock

### Warehouses
- `GET /warehouses/` - List warehouses
- `GET /warehouses/{id}/locations/` - Get locations

## 🎨 Theming

The application uses a custom Material-UI theme with:

- **Primary Color**: Electric Indigo (#6366f1)
- **Secondary Color**: Vibrant Cyan (#22d3ee)
- **Dark Background**: Midnight Navy (#0f0f23)
- **Paper Background**: Deep Purple (#1a1a2e)

### Customizing Theme

Edit `src/theme/index.ts` to modify colors, typography, and component styles.

## 📱 Responsive Breakpoints

- **xs**: 0px
- **sm**: 600px
- **md**: 900px
- **lg**: 1200px
- **xl**: 1536px

## 🔐 Authentication Flow

1. User enters email
2. Backend sends OTP to email
3. User enters OTP
4. Backend returns JWT tokens (access + refresh)
5. Access token stored in localStorage
6. Axios interceptor adds token to requests
7. On 401 error, refresh token is used automatically

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage
```

## 🏭 Production Build

```bash
npm run build
```

Output will be in the `build/` directory.

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API URL | `http://localhost:8000/api/v1` |
| `REACT_APP_NAME` | Application name | `ERP Commerce Admin` |
| `REACT_APP_VERSION` | Application version | `2.0.0` |

## 🤝 Contributing

1. Follow the existing code style
2. Write TypeScript with proper types
3. Use functional components with hooks
4. Add proper error handling
5. Write tests for new features

## 📄 License

MIT License - See LICENSE file for details.

---

Built with ❤️ for modern e-commerce management
