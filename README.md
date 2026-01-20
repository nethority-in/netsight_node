# NetSight Node.js Server

This folder contains Node.js server-side modules for the NetSight application. This is separate from the React frontend and Laravel backend.

## Setup Instructions

1. **Install Dependencies**
   ```bash
   cd netsight_node
   npm install
   ```

2. **Configure Environment Variables**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` with your database credentials and configuration.
   
   **Database Configuration:**
   - Option 1: Use `DATABASE_URL` (Prisma standard format):
     ```
     DATABASE_URL="mysql://user:password@host:port/database"
     ```
   - Option 2: Use individual variables (backward compatible):
     ```
     DB_HOST=localhost
     DB_USER=root
     DB_PASSWORD=your_password
     DB_DATABASE=net-sight-local
     DB_PORT=3306
     ```

3. **Generate Prisma Client**
   ```bash
   npx prisma generate
   ```
   This generates the Prisma Client based on your schema.

4. **Run Database Migrations (Optional)**
   ```bash
   # Push schema to database (for development)
   npm run prisma:push
   
   # Or create a migration (recommended for production)
   npm run prisma:migrate
   ```

5. **Start the Server**
   ```bash
   # Development mode (with auto-reload)
   npm run dev

   # Production mode
   npm start
   ```

## Project Structure

```
netsight_node/
├── prisma/
│   └── schema.prisma   # Prisma schema definition
├── src/
│   ├── config/          # Configuration files (Prisma client, etc.)
│   ├── routes/          # API routes
│   ├── controllers/     # Request handlers
│   ├── models/          # TypeScript type exports (Prisma types)
│   ├── services/        # Business logic
│   ├── middleware/      # Custom middleware
│   └── utils/           # Utility functions
├── .gitignore          # Git ignore file
├── package.json        # Node.js dependencies
└── README.md           # This file
```

## Features

- Express.js server
- Prisma ORM with MySQL database connection
- CORS enabled
- Environment variable configuration
- Modular structure for easy expansion

## Prisma Commands

- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Create and apply database migrations
- `npm run prisma:push` - Push schema changes to database (development)
- `npm run prisma:studio` - Open Prisma Studio (database GUI)

## API Endpoints

- `GET /health` - Health check endpoint
- `GET /api/test` - Test endpoint with database connection

## Integration

This Node.js server can work alongside:
- **React Frontend** (in the root directory)
- **Laravel Backend** (separate Laravel project)

The server can handle specific Node.js modules and services that need to run independently.
