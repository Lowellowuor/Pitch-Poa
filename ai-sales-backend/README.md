# AI Sales Backend

A professional, production-ready Node.js backend for AI-powered sales platform for small vendors.

##  Features

- **RESTful API Architecture** - Clean separation of concerns with controllers, services, and repositories
- **Authentication & Authorization** - JWT-based authentication with role-based access control
- **Database Integration** - MongoDB with Mongoose ODM, including indexes and data validation
- **Input Validation** - Comprehensive request validation using Joi schemas
- **Error Handling** - Centralized error handling with custom ApiError class
- **Logging** - Winston-based logging with different log levels and file rotation
- **Security** - Helmet.js for security headers, CORS configuration, rate limiting
- **File Upload** - Multer integration for handling file uploads
- **Testing Ready** - Jest and Supertest configured for unit and integration tests
- **AI Integration** - Modular AI service layer for predictions and recommendations

##  Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd ai-sales-backend