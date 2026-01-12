# Multi-Vendor ERP Frontend

A comprehensive React-based frontend for the Multi-Vendor ERP system. Built with React 18, Material UI 5, Redux Toolkit, and TypeScript.

## Features

### Role-Based Access
- **Admin/Super Admin**: Full system management including users, vendors, products, inventory, orders, warehouses, and delivery agents
- **Vendor**: Product management, inventory, suppliers, purchase orders, sales orders
- **Warehouse Staff**: Stock management, inbound/outbound operations, inventory adjustments
- **Delivery Agent**: Delivery management, order tracking, COD collection

### Key Features
- 🔐 OTP-based passwordless authentication
- 📊 Role-specific dashboards with analytics
- 📦 Complete inventory management
- 🛒 Order management (Purchase & Sales)
- 🚚 Delivery tracking
- 🌙 Dark mode support
- 📱 Responsive design (desktop-first)

## Tech Stack

- **React 18** - UI Library
- **TypeScript** - Type safety
- **Material UI 5** - Component library
- **Redux Toolkit** - State management
- **React Router 6** - Routing
- **Axios** - HTTP client
- **Recharts** - Charts and visualizations

## Project Structure

```
src/
├── api/                 # API services and client
│   ├── client.ts        # Axios instance with interceptors
│   ├── auth.ts          # Authentication API
│   ├── users.ts         # Users API
│   ├── vendors.ts       # Vendors & Suppliers API
│   ├── products.ts      # Products, Variants & Categories API
│   ├── warehouses.ts    # Warehouses & Locations API
│   ├── inventory.ts     # Inventory & Logs API
│   ├── purchaseOrders.ts # Purchase Orders API
│   ├── salesOrders.ts   # Sales Orders API
│   ├── delivery.ts      # Delivery Agents & Assignments API
│   └── notifications.ts # Notifications API
├── components/          # Reusable components
│   └── common/          # Common UI components
├── features/            # Role-based feature modules
│   ├── admin/
│   ├── vendor/
│   ├── warehouse/
│   └── delivery/
├── hooks/               # Custom React hooks
├── layouts/             # Layout components
│   ├── MainLayout.tsx   # Main app layout with sidebar
│   ├── AuthLayout.tsx   # Authentication pages layout
│   ├── Sidebar.tsx      # Navigation sidebar
│   └── Header.tsx       # App header
├── pages/               # Page components
│   ├── auth/            # Authentication pages
│   ├── admin/           # Admin dashboard pages
│   ├── vendor/          # Vendor dashboard pages
│   ├── warehouse/       # Warehouse dashboard pages
│   └── delivery/        # Delivery agent pages
├── routes/              # Routing configuration
├── store/               # Redux store
│   ├── index.ts         # Store configuration
│   └── slices/          # Redux slices
├── theme/               # Material UI theme
├── types/               # TypeScript type definitions
└── utils/               # Utility functions
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend API running (Django)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd erp-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update `.env` with your API URL:
```
REACT_APP_API_URL=http://localhost:8000/api/v1
```

5. Start the development server:
```bash
npm start
```

The app will be available at `http://localhost:3000`

## Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier

## API Integration

The frontend integrates with the Django backend API. Key features:

### Authentication
- OTP-based passwordless login
- JWT tokens with automatic refresh
- Token stored in localStorage

### API Client Features
- Automatic token attachment
- 401 response handling with token refresh
- Request/response interceptors
- File upload support

## Role Routes

| Role | Base Route | Dashboard |
|------|------------|-----------|
| Admin/Super Admin | `/admin` | `/admin/dashboard` |
| Vendor | `/vendor` | `/vendor/dashboard` |
| Warehouse/Staff | `/warehouse` | `/warehouse/dashboard` |
| Delivery Agent | `/delivery` | `/delivery/dashboard` |

## Components

### Common Components
- `LoadingScreen` - Full-page loading indicator
- `StatusChip` - Status indicator chip with category-based colors
- `StatsCard` - Dashboard statistics card
- `PageHeader` - Page title with breadcrumbs and actions
- `DataTable` - Generic data table with pagination, sorting, and selection
- `ConfirmDialog` - Confirmation dialog
- `EmptyState` - Empty state placeholder

## Theme

Custom Material UI theme with:
- Light and dark mode
- Custom color palette
- Status-specific colors for vendors, orders, deliveries, etc.
- Custom component overrides

## State Management

Redux Toolkit slices:
- `authSlice` - Authentication state
- `uiSlice` - UI state (sidebar, dark mode, notifications)

## Contributing

1. Create a feature branch
2. Make your changes
3. Run linting and tests
4. Submit a pull request

## License

MIT License
