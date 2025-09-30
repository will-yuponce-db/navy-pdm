# Navy Predictive Maintenance (PdM) System

A comprehensive predictive maintenance system for Navy gas turbine engines, built with React/TypeScript frontend and Flask/SQLite backend.

## Features

- **Work Order Management**: Create, update, and track maintenance work orders
- **Parts Inventory**: Manage parts inventory with stock level monitoring
- **Real-time Notifications**: Get alerts for critical issues and low stock
- **Analytics Dashboard**: View maintenance KPIs and fleet readiness
- **User Authentication**: Role-based access control
- **Responsive Design**: Works on desktop and mobile devices

## Architecture

### Frontend (React/TypeScript)
- **Framework**: React with TypeScript
- **State Management**: Redux Toolkit
- **UI Components**: Custom components with Material-UI styling
- **Routing**: React Router
- **Build Tool**: Vite

### Backend (Flask/SQLite)
- **Framework**: Flask with Python
- **Database**: SQLite
- **Authentication**: JWT tokens
- **API**: RESTful endpoints
- **CORS**: Enabled for frontend integration

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- pip3

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install Python dependencies:
```bash
pip3 install -r requirements.txt
```

3. Seed the database with initial data:
```bash
python3 seed_data.py
```

4. Start the Flask server:
```bash
python3 run.py
```

The backend will be available at `http://localhost:5000`

### Frontend Setup

1. Navigate to the project root:
```bash
cd navy-pdm
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Default Users

The system comes with two default users:

1. **Admin User**
   - Email: `admin@navy.mil`
   - Password: `admin123`
   - Role: `admin`
   - Full system access

2. **Maintenance Manager**
   - Email: `maint.manager@navy.mil`
   - Password: `maint123`
   - Role: `maintenance_manager`
   - Limited access to work orders, parts, and analytics

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/change-password` - Change password

### Work Orders
- `GET /api/work-orders` - Get all work orders (with pagination and filters)
- `GET /api/work-orders/<id>` - Get specific work order
- `POST /api/work-orders` - Create new work order
- `PATCH /api/work-orders/<id>` - Update work order
- `DELETE /api/work-orders/<id>` - Delete work order
- `PATCH /api/work-orders/bulk` - Bulk update work orders

### Parts
- `GET /api/parts` - Get all parts (with pagination and filters)
- `GET /api/parts/<id>` - Get specific part
- `POST /api/parts` - Create new part
- `PATCH /api/parts/<id>` - Update part
- `DELETE /api/parts/<id>` - Delete part
- `PATCH /api/parts/<id>/stock` - Update stock level

### Analytics
- `GET /api/analytics/maintenance-kpis` - Get maintenance KPIs
- `GET /api/analytics/performance` - Get performance metrics
- `GET /api/analytics/fleet-readiness` - Get fleet readiness data
- `GET /api/analytics/predictive-insights` - Get predictive insights

### Health Check
- `GET /api/health` - Server health check

## Database Schema

The SQLite database contains the following tables:

- **user**: User accounts and authentication
- **work_order**: Work order records
- **part**: Parts inventory
- **notification**: System notifications

## Development

### Backend Development
- The Flask server runs in debug mode by default
- Database changes require running the seed script again
- API endpoints are documented in the Flask app

### Frontend Development
- Uses Vite for fast development and hot reloading
- Redux DevTools available in development
- TypeScript for type safety
- ESLint for code quality

## Production Deployment

### Backend
1. Set environment variables:
   - `SECRET_KEY`: Flask secret key
   - `DATABASE_URL`: Database connection string
2. Use a production WSGI server like Gunicorn
3. Set up reverse proxy with Nginx

### Frontend
1. Build the production bundle:
```bash
npm run build
```
2. Serve the built files with a web server
3. Configure environment variables for API endpoints

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team.