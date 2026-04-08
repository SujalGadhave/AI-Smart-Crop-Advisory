# KrishiMitra Backend

Spring Boot backend service for KrishiMitra.

## Tech stack

- Java 17
- Spring Boot 3.2.5
- Spring Security (JWT)
- Spring Data JPA
- MySQL (runtime)
- H2 (test profile usage in integration tests)

## Prerequisites

- JDK 17
- Maven 3.9+
- MySQL running locally (or use your remote DB)

## Configuration

Main runtime properties are in `src/main/resources/application.properties`.

Key environment variables:

- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `AI_SERVICE_URL` (defaults to `http://localhost:8000/predict`)

## Run locally

If Maven is in PATH:

```bash
cd backend
mvn spring-boot:run
```

Windows PowerShell with explicit Maven path:

```powershell
Set-Location C:\ALL_GIT_REPO\KrushiMitra\backend
& "C:\Users\admin\.maven\maven-3.9.14\bin\mvn.cmd" spring-boot:run
```

## Build

```bash
mvn -DskipTests compile
```

## Tests

Run all backend tests:

```bash
mvn test
```

Current smoke test class:

- `src/test/java/com/krishimitra/backend/ApiSmokeIntegrationTest.java`

The integration tests run with in-memory H2 settings defined in the test annotation, so they do not require your MySQL instance for execution.

## Main API routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/crop/detect` (requires JWT)
- `GET /api/crop/reports`
- `GET /api/advisory`
- `GET /api/weather`
- `GET /api/market`
