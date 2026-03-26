# KrishiMitra Hackathon Prototype

A demo-friendly prototype of KrishiMitra with the original three-tier architecture:

- **Frontend**: React + Vite + Tailwind + React Router + Axios
- **Backend**: Spring Boot (Web, Security + JWT, Data JPA) with endpoints for auth, crop detection, advisory, weather, and market prices
- **AI microservice**: FastAPI stub with a focused `/predict` endpoint returning seeded PlantVillage classes
- **Database**: MySQL for the demo (H2 in-memory for local dev fallback)

## Demo flow (2–3 minutes)
1. Register/Login
2. Upload crop image (tomato/potato/corn)
3. See disease result with confidence and treatment
4. View rule-based advisory + weather snapshot
5. Check seeded mandi prices and trend

## Quick start (local dev)
### Backend
```bash
cd backend
mvn spring-boot:run
```
By default this uses H2 in-memory. Set `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, and `SPRING_DATASOURCE_PASSWORD` to point at MySQL. AI service URL can be set via `AI_SERVICE_URL` (defaults to `http://localhost:8000/predict`).

### AI service
```bash
cd ai-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
The AI service now builds a lightweight color-texture classifier from seeded leaf samples on first use and caches the trained weights at `ai-service/disease_model.joblib`, so inference runs fully offline.

### Frontend
```bash
cd frontend
npm install
npm run dev -- --host
```
Set `VITE_API_BASE_URL` to point to the backend (default `http://localhost:8080`).

## Docker Compose demo
```bash
docker-compose up --build
```
Services:
- **mysql** on `3306`
- **ai-service** on `8000`
- **backend** on `8080` (uses MySQL + AI service inside the network)

## API overview
- `POST /api/auth/register` — create prototype user, returns JWT
- `POST /api/auth/login` — authenticate and return JWT
- `POST /api/crop/detect` — secured; sends image + crop to AI service and stores report
- `GET /api/advisory?cropType=&city=&season=` — rule-based recommendations
- `GET /api/weather?city=` — normalized weather snapshot using Open-Meteo (with fallback)
- `GET /api/market?cropType=&city=` — seeded mandi prices + mini trend
- FastAPI `POST /predict` — returns top disease class with confidence for target crop

## Notes
- Crops limited to tomato, potato, and corn for the demo.
- Advisory and market data are lightweight seeded mappings to keep the prototype reliable.
- Multilingual support (English, Hindi, Marathi) for main UI labels.
- JWT is prototype-grade and should be replaced for production.
