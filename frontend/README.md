# KrishiMitra Frontend

React + Vite frontend for the KrishiMitra demo app.

## Tech stack

- React 19
- Vite 8
- React Router
- Axios
- Tailwind CSS
- Vitest + Testing Library

## Prerequisites

- Node.js 20+
- npm 10+

## Setup

```bash
npm install
```

## Environment

The frontend reads backend base URL from `VITE_API_BASE_URL`.

- Default: `http://localhost:8080`

Windows PowerShell example:

```powershell
$env:VITE_API_BASE_URL="http://localhost:8080"
npm run dev -- --host
```

## Run locally

```bash
npm run dev -- --host
```

## Scripts

- `npm run dev` - start development server
- `npm run build` - production build
- `npm run preview` - preview production build
- `npm run lint` - run ESLint
- `npm run test` - run Vitest in watch mode
- `npm run test:run` - run Vitest once

## Testing

Current integration test covers login -> upload -> detect flow:

- `src/App.integration.test.jsx`

Run only this test:

```bash
npm run test:run -- src/App.integration.test.jsx
```

Run all frontend tests:

```bash
npm run test:run
```

## Notes

- API calls are centralized in `src/services/api.js`.
- This frontend expects backend endpoints under `/api/*`.
