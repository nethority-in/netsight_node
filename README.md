# NetSight Node.js Server

This folder contains Node.js server-side modules for the NetSight application. This is separate from the React frontend and Laravel backend.

## Setup Instructions

1. **Install Dependencies**
   ```bash
   cd node-server
   npm install
   ```

2. **Configure Environment Variables**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` with your database credentials and configuration.

3. **Start the Server**
   ```bash
   # Development mode (with auto-reload)
   npm run dev

   # Production mode
   npm start
   ```

## Project Structure

```
node-server/
├── src/
│   ├── config/          # Configuration files (database, etc.)
│   ├── routes/          # API routes
│   ├── controllers/     # Request handlers
│   ├── models/          # Data models
│   ├── services/        # Business logic
│   ├── middleware/      # Custom middleware
│   └── utils/           # Utility functions
├── .env.example         # Environment variables template
├── .gitignore          # Git ignore file
├── package.json        # Node.js dependencies
└── README.md           # This file
```

## Features

- Express.js server
- MySQL database connection
- CORS enabled
- Environment variable configuration
- Modular structure for easy expansion

## API Endpoints

- `GET /health` - Health check endpoint
- `GET /api/test` - Test endpoint with database connection

## Integration

This Node.js server can work alongside:
- **React Frontend** (in the root directory)
- **Laravel Backend** (separate Laravel project)

The server can handle specific Node.js modules and services that need to run independently.
