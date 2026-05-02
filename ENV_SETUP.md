# Environment Variables Setup

## API Configuration

This project uses environment variables for API configuration. Create a `.env` file in the root directory with the following:

### Required Environment Variables

```env
# API Base URL
VITE_API_BASE_URL=https://localhost:44311/api
```

### Environment Files

1. **`.env`** - Default environment (used when no specific env file is found)
2. **`.env.development`** - Development environment
3. **`.env.production`** - Production environment
4. **`.env.local`** - Local overrides (git-ignored)

### Setup Instructions

1. Create a `.env` file in the root directory:
   ```bash
   touch .env
   ```

2. Add your API base URL:
   ```env
   VITE_API_BASE_URL=https://localhost:44311/api
   ```

3. For different environments, create:
   - `.env.development` for development
   - `.env.production` for production

### Important Notes

- All environment variables must be prefixed with `VITE_` to be accessible in the client-side code
- Never commit `.env` files with sensitive data to version control
- The `.env.example` file shows the required variables without actual values

### Example Configuration

```env
# Development
VITE_API_BASE_URL=https://localhost:44311/api

# Production (example)
# VITE_API_BASE_URL=https://api.yourdomain.com/api
```

