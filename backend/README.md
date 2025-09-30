# Navy PdM Flask Backend

This is the Flask backend server for the Navy Predictive Maintenance (PdM) system with SQLite database.

## Setup

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Run the seed script to populate the database:
```bash
python seed_data.py
```

3. Start the Flask server:
```bash
python run.py
```

The server will be available at `http://localhost:5000`

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

### Notifications
- `GET /api/notifications` - Get all notifications
- `PATCH /api/notifications/<id>/read` - Mark notification as read
- `PATCH /api/notifications/read-all` - Mark all notifications as read
- `DELETE /api/notifications/<id>` - Delete notification

### Analytics
- `GET /api/analytics/maintenance-kpis` - Get maintenance KPIs
- `GET /api/analytics/performance` - Get performance metrics
- `GET /api/analytics/fleet-readiness` - Get fleet readiness data
- `GET /api/analytics/predictive-insights` - Get predictive insights

### Health Check
- `GET /api/health` - Server health check

## Default Users

The seed script creates two default users:

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

## Database

The application uses SQLite database (`navy_pdm.db`) with the following tables:
- `user` - User accounts and authentication
- `work_order` - Work order records
- `part` - Parts inventory
- `notification` - System notifications

## Environment Variables

- `SECRET_KEY` - Flask secret key (default: 'dev-secret-key-change-in-production')
- `DATABASE_URL` - Database connection string (default: 'sqlite:///navy_pdm.db')

## Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## CORS

CORS is enabled for all origins to allow frontend integration.
