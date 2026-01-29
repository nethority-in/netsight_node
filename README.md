
 **Generate Prisma Client**
   ```bash
   npx prisma generate
   ```
   This generates the Prisma Client based on your schema.

 **Run Database Migrations (Optional)**
   ```bash
   # Push schema to database (for development)
   npm run prisma:push
   
   # Or create a migration (recommended for production)
   npm run prisma:migrate
   ```

5. **Start the Server**
  
   # npm run dev
   # npm start
 

## Project Structure

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

## Integration

This Node.js server can work alongside:
- **React Frontend** (in the root directory)
- **Node Backend** (separate node project)
