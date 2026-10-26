# Ride Sharing API Documentation

Base URL: `http://localhost:5000/api`

## Authentication

### Register
- **POST** `/auth/register`
- **Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "rider",
  "phone": "1234567890"
}
```
- **Response:** `201 Created`
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": { "id": "...", "name": "John Doe", "email": "john@example.com", "role": "rider" }
}
```

### Login
- **POST** `/auth/login`
- **Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```
- **Response:** `200 OK` - Returns token and user object

### Get Profile
- **GET** `/auth/profile`
- **Headers:** `Authorization: Bearer <token>`
- **Response:** `200 OK` - Returns user data

### Update Profile
- **PUT** `/auth/profile`
- **Headers:** `Authorization: Bearer <token>`
- **Body:** `{ "name": "New Name", "phone": "0987654321" }`

---

## Rides

### Create Ride
- **POST** `/rides`
- **Auth:** Rider only
- **Body:**
```json
{
  "pickupAddress": "123 Main St",
  "pickupCoordinates": [-73.9857, 40.7484],
  "dropoffAddress": "456 Park Ave",
  "dropoffCoordinates": [-73.9712, 40.7648]
}
```
- **Response:** `201 Created` - Returns ride object with fare breakdown

### Get Rides
- **GET** `/rides?status=requested&page=1&limit=10`
- **Auth:** Required
- **Response:** Paginated ride list

### Get Ride by ID
- **GET** `/rides/:id`
- **Auth:** Required (rider, assigned driver, or admin)

### Search Rides
- **GET** `/rides/search?destination=park&driverRating=4&maxEta=30`
- **Auth:** Required

### Accept Ride
- **PUT** `/rides/:id/accept`
- **Auth:** Driver only

### Start Ride
- **PUT** `/rides/:id/start`
- **Auth:** Assigned driver only

### Complete Ride
- **PUT** `/rides/:id/complete`
- **Auth:** Assigned driver only

### Cancel Ride
- **PUT** `/rides/:id/cancel`
- **Auth:** Rider, assigned driver, or admin
- **Body:** `{ "reason": "Changed plans" }`

### Estimate Fare
- **POST** `/rides/estimate-fare`
- **Auth:** Required
- **Body:**
```json
{
  "pickupCoordinates": [-73.9857, 40.7484],
  "dropoffCoordinates": [-73.9712, 40.7648]
}
```

---

## Drivers

### Update Availability
- **PUT** `/drivers/availability`
- **Auth:** Driver only
- **Body:** `{ "isAvailable": true, "coordinates": [-73.9857, 40.7484] }`

### Update Location
- **PUT** `/drivers/location`
- **Auth:** Driver only
- **Body:** `{ "coordinates": [-73.99, 40.75] }`

### Get Driver Rides (filtered)
- **GET** `/drivers/rides?status=requested&sortBy=distance&minRating=4&maxDistance=10`
- **Auth:** Driver only

### Get Available Drivers
- **GET** `/drivers/available`
- **Auth:** Required

### Get Driver Stats
- **GET** `/drivers/stats/:id?`
- **Auth:** Required

---

## Ratings

### Create Rating
- **POST** `/ratings`
- **Auth:** Rider only
- **Body:**
```json
{
  "rideId": "ride_object_id",
  "rating": 5,
  "review": "Great driver!"
}
```

### Get Driver Ratings
- **GET** `/ratings/driver/:driverId?page=1&limit=10`
- **Auth:** Required

### Get Rating by Ride
- **GET** `/ratings/ride/:rideId`
- **Auth:** Required

---

## Analytics

### Ride Trends
- **GET** `/analytics/trends?period=daily`
- **Auth:** Admin only
- **Periods:** daily, weekly, monthly

### Driver Performance
- **GET** `/analytics/driver-performance`
- **Auth:** Admin only

### Earnings Over Time
- **GET** `/analytics/earnings?driverId=xxx&period=monthly`
- **Auth:** Driver or Admin

### User Engagement
- **GET** `/analytics/engagement`
- **Auth:** Admin only

---

## Notifications

### Get Notifications
- **GET** `/analytics/notifications?page=1&limit=20`
- **Auth:** Required

### Mark Notification Read
- **PUT** `/analytics/notifications/:id/read`
- **Auth:** Required

### Mark All Read
- **PUT** `/analytics/notifications/read-all`
- **Auth:** Required

---

## Export

### Export Ride History as CSV
- **GET** `/export/csv`
- **Auth:** Required
- **Response:** CSV file download

### Export Ride History as PDF
- **GET** `/export/pdf`
- **Auth:** Required
- **Response:** PDF file download

---

## Error Responses

All error responses follow:
```json
{
  "success": false,
  "error": "Error message here"
}
```

Common status codes:
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## WebSocket Events

Connect to the server URL with Socket.IO client.

### Client Events (emit)
- `join_room` - Join a room (pass user ID to receive notifications)
- `leave_room` - Leave a room

### Server Events (listen)
- `notification` - Real-time notification with ride status updates
