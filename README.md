# Kakukli Backend API Documentation

Express.js API with Prisma and Vercel deployment, featuring user authentication with username and password.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Deployment to Vercel](#deployment-to-vercel)
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- PostgreSQL database (local or cloud provider)
- Prisma CLI (optional, for database migrations)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd kakukli-backend
```

2. Install dependencies:
```bash
npm install
```

3. Copy the example environment file:
```bash
cp .env.example .env
```

4. Update the `.env` file with your database connection strings (see [Environment Variables](#environment-variables))

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration (Prisma)
DATABASE_URL="postgresql://postgres:password@localhost:5432/your_database"
DIRECT_URL="postgresql://postgres:password@localhost:5432/your_database"

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRATION=7d
```

**Important:**
- `DATABASE_URL`: Your PostgreSQL database connection string (can use PgBouncer for connection pooling)
- `DIRECT_URL`: Direct connection to your PostgreSQL database (without PgBouncer)
- `JWT_SECRET`: A strong random string for signing JWT tokens

**Getting Database Connection Strings:**
- **Local PostgreSQL**: Install PostgreSQL locally or use Docker
- **Cloud PostgreSQL**: Use services like Neon, Railway, Supabase, or any PostgreSQL hosting provider
- **Prisma Postgres**: Use Prisma's own database hosting service

## Database Setup

1. Set up your PostgreSQL database (local or cloud)
2. Configure your connection strings in `.env`
3. Run Prisma migrations:
```bash
npx prisma migrate dev
```

The Prisma schema includes:
- Users table with username, email, and password hash
- Indexes for better query performance
- Automatic updated_at timestamp

## Running the Application

### Development Mode
```bash
npm run dev
```
The server will start on `http://localhost:3000` with auto-reload.

### Production Mode
```bash
npm start
```

### Health Check
```bash
GET http://localhost:3000/health
```

## Deployment to Vercel

### Option 1: Vercel CLI

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

4. Set environment variables in Vercel dashboard:
   - Go to your project settings
   - Add all environment variables from `.env.example`

### Option 2: GitHub Integration

1. Push your code to GitHub
2. Go to https://vercel.com/new
3. Import your repository
4. Configure environment variables
5. Deploy

### Option 3: Vercel Dashboard

1. Connect your Git repository to Vercel
2. Configure the build settings:
   - Root Directory: `/`
   - Build Command: `npm install` (or leave empty)
   - Output Directory: `/src`
3. Add environment variables
4. Deploy

## API Endpoints

### Swagger UI Documentation

Interactive API documentation is available at:
- **Swagger UI**: http://localhost:3000/api-docs
- **OpenAPI JSON Spec**: http://localhost:3000/api-docs.json

The Swagger UI provides:
- Complete API documentation with request/response schemas
- Interactive testing interface (Try it out)
- JWT authentication support via Bearer token
- Real-time API testing without additional tools

### Authentication

#### Register User
Create a new user account.

```
POST /api/auth/register
Content-Type: application/json

Request Body:
{
  "username": "johndoe",
  "password": "password123"
}

Response (201 Created):
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "username": "johndoe",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z",
    "last_login": null
  }
}
```

#### Login
Authenticate user and receive JWT token.

```
POST /api/auth/login
Content-Type: application/json

Request Body:
{
  "username": "johndoe",
  "password": "password123"
}

Response (200 OK):
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "username": "johndoe",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z",
    "last_login": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Get Current User Profile
Retrieve the authenticated user's profile.

```
GET /api/auth/me
Authorization: Bearer <token>

Response (200 OK):
{
  "user": {
    "id": "uuid",
    "username": "johndoe",
    "created_at": "2024-01-01T00:00:00.000Z",
    "last_login": "2024-01-01T00:00:00.000Z",
    "is_active": true
  }
}
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication.

### How to Use

1. **Login** with username and password to receive a JWT token
2. **Include the token** in the Authorization header for protected routes:
   ```
   Authorization: Bearer <your-token>
   ```

### Error Responses

```json
// Invalid credentials
{
  "error": "Invalid credentials"
}

// Missing token
{
  "error": "Access denied. No token provided."
}

// Invalid token
{
  "error": "Invalid token"
}

// Expired token
{
  "error": "Token expired"
}

// Account deactivated
{
  "error": "Account is deactivated"
}
```

## Project Structure

```
kakukli-backend/
├── database/
│   └── schema.sql          # Legacy database schema (optional)
├── prisma/
│   └── schema.prisma       # Prisma database schema
├── scripts/
│   ├── generate_kbli_import.js    # Generate SQL from Excelel
│   ├── import_kbli_prisma.js      # Direct Prisma import
│   └── README_KBLI_IMPORT.md      # Import guide
├── src/
│   ├── config/
│   │   ├── prisma.js       # Prisma client configuration
│   │   └── swagger.js      # Swagger configuration
│   ├── middleware/
│   │   └── auth.js         # JWT authentication middleware
│   ├── routes/
│   │   ├── auth.js         # Authentication routes
│   │   └── test.js         # Test routes for Swagger
│   └── index.js            # Application entry point
├── .env.example            # Environment variables template
├── .gitignore              # Git ignore file
├── package.json            # Dependencies
├── prisma.config.ts        # Prisma configuration
├── vercel.json             # Vercel deployment configuration
└── README.md               # This file
```

## KBLI Data Import

To import KBLI mapping data from Excel to database:

```bash
# Method 1: Direct import via Prisma (Recommended)
npm run kbli:import

# Method 2: Generate SQL script
npm run kbli:generate-sql

# View detailed import guide
npm run kbli:help
```

See `scripts/README_KBLI_IMPORT.md` for complete instructions.

## Security Best Practices

1. **Never commit `.env` file** - Contains sensitive database credentials
2. **Use strong JWT_SECRET** - Generate a random 64+ character string
3. **Use parameterized queries** - Prisma ORM protects against SQL injection
4. **Use HTTPS in production** - Vercel provides this automatically
5. **Validate and sanitize input** - Prevent XSS and other attacks
6. **Use bcrypt for passwords** - Already implemented with salt rounds
7. **Set appropriate token expiration** - Balance security and UX
8. **Keep dependencies updated** - Run `npm audit` regularly

## Testing with cURL

### Register a new user:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'
```

### Login:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'
```

### Get user profile:
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Testing with Swagger UI

Swagger UI provides an interactive interface to explore and test all API endpoints:

1. **Open Swagger UI**: Navigate to http://localhost:3000/api-docs
2. **Explore Endpoints**: Click on any endpoint to see request/response schemas
3. **Try It Out**: 
   - Click the "Try it out" button on any endpoint
   - Fill in the request body or parameters
   - Click "Execute" to make the request
   - View the response, status code, and headers
4. **Authenticate**: 
   - Click the "Authorize" button at the top
   - Enter your JWT token (without "Bearer " prefix)
   - Click "Authorize" to enable authenticated endpoint testing

### Adding Swagger Documentation to New Routes

To add Swagger documentation to new routes, use JSDoc comments:

```javascript
/**
 * @swagger
 * /api/your-endpoint:
 *   get:
 *     summary: Description of endpoint
 *     description: Detailed description
 *     tags: [Category Name]
 *     responses:
 *       200:
 *         description: Success response
 */
router.get('/your-endpoint', (req, res) => {
  // Your code
});
```

The documentation is automatically generated from JSDoc annotations in your route files.

## License

MIT
