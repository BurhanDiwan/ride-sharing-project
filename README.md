# Ride-Sharing Backend Application

A complete backend platform for a ride-sharing service connecting riders and drivers with real-time tracking, fare estimation, RBAC authentication, Mapbox integration, ratings, analytics, and data export.

## Features

- **Authentication & RBAC**: JWT-based authentication with role-based access control (Rider, Driver, Admin).
- **Ride Management**: Ride booking, status lifecycle (`requested` -> `accepted` -> `in_progress` -> `completed` / `cancelled`), driver assignment.
- **Smart Driver Matching**: Geospatial querying with MongoDB 2dsphere indexes to match riders with nearest available drivers.
- **Fare Calculation Engine**: Dynamic fare estimation based on base fare, distance, travel duration, and peak-hour surge pricing.
- **Mapbox Integration**: Directions, routing distance, duration, and reverse geocoding via Mapbox API.
- **Real-Time Communication**: Socket.io WebSocket support for instant notifications and live tracking updates.
- **Search & Filters**: Comprehensive ride search by destination, driver rating, and estimated time of arrival; driver filtering by distance and rider ratings.
- **Ratings & Reviews**: Post-ride rating system with automatic recalculation of driver's aggregate rating.
- **Analytics & Data Visualization**: Endpoints for ride trends (daily/weekly/monthly), driver performance metrics, earnings over time, and user engagement statistics.
- **Export System**: Export ride history dynamically in both CSV and formatted PDF formats.
- **API Documentation**: Detailed API reference in `docs/api.md`.
- **Automated Tests**: Unit and integration test suite using Jest, Supertest, and mongodb-memory-server.

## Project Structure

```
ride-sharing-app/
├── config/
│   ├── db.js
│   └── mapbox.js
├── controllers/
│   ├── analyticsController.js
│   ├── authController.js
│   ├── driverController.js
│   ├── exportController.js
│   ├── ratingController.js
│   └── rideController.js
├── docs/
│   └── api.md
├── middleware/
│   ├── auth.js
│   └── rbac.js
├── models/
│   ├── Notification.js
│   ├── Rating.js
│   ├── Ride.js
│   └── User.js
├── routes/
│   ├── analytics.js
│   ├── auth.js
│   ├── drivers.js
│   ├── export.js
│   ├── ratings.js
│   └── rides.js
├── services/
│   ├── fareService.js
│   ├── matchingService.js
│   └── notificationService.js
├── tests/
│   ├── auth.test.js
│   ├── drivers.test.js
│   ├── fare.test.js
│   └── rides.test.js
├── utils/
│   ├── csvGenerator.js
│   └── pdfGenerator.js
├── websocket/
│   └── socket.js
├── .env
├── .env.example
├── package.json
├── README.md
└── server.js
```

## Setup & Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/rideshare
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
SURGE_MULTIPLIER=1.5
BASE_FARE=2.50
PER_KM_RATE=1.20
PER_MINUTE_RATE=0.30
```

3. Run in development mode:
```bash
npm run dev
```

4. Or start production server:
```bash
npm start
```

5. Run test suite:
```bash
npm test
```
