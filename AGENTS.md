# AGENTS.md

## Stack
- React
- Go

## Backend API
- Base URL (dev): `http://localhost:8090`
- `GET /api/people` → `string[]` of person IDs
- `GET /api/workouts/:person_id` → `Workout[]`
- `POST /api/workouts` → body `{ PersonID, HeartRate, Calories, Duration }`
- CORS is configured on the Go side for `http://localhost:3000` — update
  `main.go`'s CORS middleware if the frontend's dev port changes.


## Commands
### Go API
- `go run .`
### Dashboard
- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run lint` — run ESLint
 
