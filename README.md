# 🚢 Navy Predictive Maintenance (PDM) System

A comprehensive, enterprise-grade predictive maintenance application designed for Navy fleet management. Built with React, TypeScript, Material-UI, and Redux Toolkit.

## ✨ Features

### 🎯 **Core Functionality**

- **Work Order Management**: Complete lifecycle management with status tracking, priority handling, and real-time updates
- **Fleet Maintenance Overview**: Real-time KPI dashboard with critical alerts and trend analysis
- **Parts Inventory Management**: Comprehensive parts tracking with stock alerts and supplier information
- **Advanced Analytics**: Multi-dimensional charts and real-time performance metrics

### 🎨 **User Experience**

- **Dark/Light Mode**: Seamless theme switching with persistent preferences
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Real-time Notifications**: Smart notification system with priority-based alerts
- **Advanced Search & Filtering**: Powerful search capabilities across all data views

### 📊 **Analytics & Visualization**

- **Interactive Charts**: Pie charts, bar charts, line charts, and area charts using Recharts
- **Real-time Data**: Live updates every 5 seconds for critical metrics
- **Performance Tracking**: Fleet efficiency monitoring and maintenance trend analysis
- **Predictive Analytics**: Maintenance prediction vs actual performance comparison

### 🔧 **Technical Features**

- **TypeScript**: Full type safety throughout the application
- **Redux Toolkit**: Centralized state management with proper typing
- **Error Handling**: Comprehensive error boundaries and user feedback
- **Form Validation**: Client-side validation with user-friendly error messages
- **Loading States**: Professional loading indicators and backdrop overlays

## 🚀 **Getting Started**

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd navy-pdm
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**

   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
npm start
```

### Testing

```bash
npm run test          # Run tests in watch mode
npm run test:run      # Run tests once
npm run test:ui       # Run tests with UI
npm run test:coverage # Run tests with coverage report
```

### Type Checking

```bash
npm run typecheck     # Run TypeScript type checking
```

## 📁 **Project Structure**

```
app/
├── components/           # Reusable UI components
│   ├── MaintenanceOverview.tsx    # Fleet KPI dashboard
│   ├── WorkOrderTable.tsx         # Work order management
│   ├── WorkOrderModal.tsx         # Work order creation/edit
│   ├── MaintenanceCharts.tsx     # Analytics charts
│   ├── AdvancedAnalytics.tsx     # Real-time analytics
│   ├── NotificationSystem.tsx     # Notification center
│   ├── ErrorHandling.tsx         # Error management
│   └── NavComponent.tsx          # Navigation & theme toggle
├── routes/              # Page components
│   ├── home.tsx        # Main dashboard
│   ├── workorder.tsx   # Work order page
│   ├── parts.tsx       # Parts management
│   └── assets.tsx       # Asset management
├── redux/              # State management
│   ├── store/          # Redux store configuration
│   └── services/       # Redux slices
├── types/              # TypeScript type definitions
└── constants/          # Application constants
```

## 🎯 **Key Components**

### **MaintenanceOverview**

- Real-time fleet status monitoring
- Critical alert system with visual indicators
- KPI cards with trend analysis
- Progress indicators for urgent items

### **WorkOrderTable**

- Advanced search and filtering
- Status management with context menus
- Priority-based color coding
- Bulk operations support

### **AdvancedAnalytics**

- Real-time data updates (5-second intervals)
- Multiple chart types for different insights
- Fleet efficiency monitoring
- Performance trend analysis

### **NotificationSystem**

- Priority-based notification center
- Category-based organization
- Dismissible alerts
- Real-time updates

## 🎨 **Design System**

### **Color Palette**

- **Primary**: Databricks Orange (#FF3621)
- **Secondary**: Databricks Teal (#1B3139)
- **Accent**: Myrtle Green (#2C646E)
- **Success**: Green (#4CAF50)
- **Warning**: Orange (#FF9800)
- **Error**: Red (#F44336)

### **Typography**

- **Font Family**: Inter (Google Fonts)
- **Hierarchy**: h1-h6, body1-body2, caption
- **Responsive**: Scales appropriately across devices

### **Components**

- **Material-UI**: Consistent component library
- **Custom Styling**: Tailwind CSS integration
- **Responsive Grid**: MUI Grid system
- **Theme Support**: Light/Dark mode switching

## 🔧 **Technical Stack**

- **Frontend**: React 19, TypeScript 5.8
- **UI Library**: Material-UI 7.3
- **Charts**: Recharts
- **State Management**: Redux Toolkit
- **Routing**: React Router 7
- **Styling**: Tailwind CSS 4.1
- **Build Tool**: Vite 6.3

## 📊 **Data Management**

### **Redux Store Structure**

```typescript
interface RootState {
  workOrders: WorkOrderState;
  // Future: notifications, user, settings
}
```

### **Work Order Lifecycle**

1. **Submitted** → **In Progress** → **Completed**
2. **On Hold** (can be applied at any stage)
3. **Cancelled** (can be applied at any stage)

### **Priority Levels**

- **Routine**: Standard maintenance
- **Priority**: Elevated importance
- **CASREP**: Critical, immediate attention required

## 🚀 **Performance Optimizations**

- **Code Splitting**: Route-based lazy loading
- **Memoization**: React.memo for expensive components
- **Virtual Scrolling**: For large data sets
- **Debounced Search**: Optimized search performance
- **Real-time Updates**: Efficient data refresh strategies

## 🔒 **Security Considerations**

- **Type Safety**: Full TypeScript coverage
- **Input Validation**: Client-side form validation
- **Error Boundaries**: Graceful error handling
- **XSS Protection**: Sanitized user inputs

## 🧪 **Testing Strategy**

- **Unit Tests**: Component-level testing
- **Integration Tests**: Redux store testing
- **E2E Tests**: User workflow testing
- **Performance Tests**: Load and stress testing

## 📈 **Future Enhancements**

- **Real-time WebSocket**: Live data streaming
- **Machine Learning**: Predictive maintenance algorithms
- **Mobile App**: React Native companion
- **API Integration**: Backend service connectivity
- **Advanced Reporting**: PDF export and scheduling
- **User Management**: Role-based access control

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 **License**

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 **Support**

For support and questions:

- Create an issue in the repository
- Contact the development team
- Check the documentation wiki

---

**Built with ❤️ for the U.S. Navy Fleet Management**
