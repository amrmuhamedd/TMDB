# TMDB API

## Project Description

A scalable CRUD application that consumes The Movie Database (TMDB) APIs to provide a comprehensive movie management system. This application allows users to browse, search, filter, and interact with movie data while maintaining high performance through effective caching and database design.

## Tech Stack

- **Backend Framework**: NestJS (Node.js)
- **Database**: MongoDB with Mongoose ODM
- **Caching**: Redis
- **Authentication**: JWT-based authentication
- **API Documentation**: Swagger/OpenAPI
- **Testing**: Jest
- **Containerization**: Docker & Docker Compose
- **External APIs**: TMDB API for movie data

## Features

- User authentication and authorization
- Movie listing, searching, filtering, and pagination
- Personal watchlist management
- Movie rating system with average ratings
- Genre-based filtering
- Redis caching for improved performance
- API rate limiting protection
- Comprehensive test coverage (≥85%)

## Getting Started

### Local Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/amrmuhamedd/TMDB.git
   cd TMDB
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

3. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```

4. Fill in the required environment variables in the `.env` file, including:
   - Database connection string
   - JWT secrets
   - TMDB API key (get one from [TMDB website](https://www.themoviedb.org/settings/api))
   - Other configuration as needed

5. Start MongoDB and Redis locally (or use remote instances)

6. Run the development server:
   ```bash
   yarn start:dev
   ```

7. Access the API at `http://localhost:5000` (or whatever port you configured)

### Using Docker Compose

For a containerized development environment, you can use Docker Compose:

1. Make sure Docker and Docker Compose are installed on your system

2. Create a `.env` file from the example if you haven't already:
   ```bash
   cp .env.example .env
   ```

3. Fill in the environment variables in the `.env` file

4. Build and start the containers:
   ```bash
   docker-compose up -d
   ```
   This will start the following services:
   - API backend (NestJS application)
   - MongoDB database
   - Redis cache

5. Access the API at `http://localhost:8080`

6. To stop the containers:
   ```bash
   docker-compose down
   ```

## API Documentation

After starting the application, you can access the Swagger API documentation at:
- Local development: `http://localhost:5000/docs`
- Docker: `http://localhost:8080/docs`

## Testing

Run the test suite with:
```bash
yarn test
```

For test coverage:
```bash
yarn test:cov
```
