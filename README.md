# copbetest1

A modern, lightweight REST API built with ElysiaJS and Bun runtime featuring user management, authentication, and Swagger documentation.

## Features

- 🚀 **High Performance**: Built on Bun runtime for blazing-fast execution
- 🔄 **CRUD Operations**: Complete user management API
- 🔐 **Authentication**: Basic login functionality
- 📚 **API Documentation**: Swagger UI integration
- 🧪 **Testing**: Comprehensive unit tests with Vitest
- 🔄 **Hot Reload**: Development mode with Nodemon

## Installation

To install dependencies:

```bash
bun install
```

## Running the API

```bash
# Development mode (with hot reload)
bun run dev

# Production mode
bun run index.ts
```

The server runs on [http://localhost:3000](http://localhost:3000) by default.

## API Documentation

Explore the API using Swagger UI at [http://localhost:3000/swagger](http://localhost:3000/swagger)

## API Endpoints

| Method | Endpoint  | Description       | Request Body                                  |
| ------ | --------- | ----------------- | --------------------------------------------- |
| GET    | /hello    | Returns greeting  | -                                             |
| GET    | /users    | Get all users     | -                                             |
| GET    | /user/:id | Get user by ID    | -                                             |
| POST   | /users    | Create new user   | `{ "name": "", "email": "", "password": "" }` |
| PUT    | /user/:id | Update user       | `{ "name": "", "email": "", "password": "" }` |
| DELETE | /user/:id | Delete user       | -                                             |
| POST   | /login    | Authenticate user | `{ "email": "", "password": "" }`             |

## Project Structure

```
/
├── app/
│   ├── controller/    # Route handlers
│   ├── service/       # Business logic
│   ├── model/         # Data models and types
│   └── json/          # JSON data store
├── index.ts           # Application entry point
├── package.json       # Project configuration
└── README.md          # Documentation
```

## Testing

```bash
# Run tests
bun test
```

Tests are written using Vitest and focus on API endpoint behavior.

## Technologies

- [ElysiaJS](https://elysiajs.com/) - TypeScript framework
- [Bun](https://bun.sh) - JavaScript runtime
- [Swagger](https://swagger.io) - API documentation
- [Vitest](https://vitest.dev) - Testing framework

This project was created using `bun init` in bun v1.2.2. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
