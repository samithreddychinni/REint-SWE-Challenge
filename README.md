# UK Day-Ahead Wind Forecast and Procurement Desk

This application helps a UK electricity utility trading desk evaluate national wind generation forecasts for January 2026 day-ahead purchase decisions. It compares actual generation from Elexon `FUELHH` against wind forecasts from Elexon `WINDFOR` and quantifies the supply shortfall buffer needed from non-renewable generation.

## Data boundaries and alignment rules

The Elexon BMRS endpoints have three structural characteristics that determine how the backend aligns the series.

1. `FUELHH` reports actual wind output (`fuelType=WIND`) at 30-minute settlement periods (48 periods per day). `WINDFOR` reports forecasted wind output at 60-minute intervals on the hour. In hourly mode, the backend averages the two 30-minute `FUELHH` intervals (`HH:00` and `HH:30`) to match each hourly forecast. In 30-minute mode, the backend compares each half-hour settlement period against the active hourly forecast.
2. Each `WINDFOR` batch starts at `21:00 UTC` on the day before publication. Raw API responses therefore contain backcast rows where `publishTime` is later than `startTime` (lead times down to `-25.5` hours). The alignment step removes all rows where `publishTime > startTime`.
3. Day-ahead purchase decisions for delivery on January 1 happen on December 31, and decisions made on January 31 cover delivery on February 1. The ingestion module fetches data from `2025-12-30` through `2026-02-02` and caches the JSON files in `backend/data/`.

## Forecast selection and error definition

The portal supports two forecast selection rules:

1. **Day-Ahead Cutoff (`D-1`)**: For any delivery timestamp on UTC day `D`, the backend selects the latest forecast published at or before the chosen cutoff time on day `D-1` (default `09:30 UTC` before the UK day-ahead auction gate closure).
2. **Rolling Horizon**: For any target timestamp `T`, the backend selects the latest forecast where `publishTime <= T - horizon`.

Forecast error is defined from the buyer perspective:

```
Error (MW) = Forecast (MW) - Actual (MW)
Shortfall (MW) = max(0, Forecast (MW) - Actual (MW))
```

A positive error means actual wind output fell short of the forecast. That shortfall represents the volume that the utility must cover from thermal or other dispatchable generation. The `P90 Shortfall` metric gives the MW deduction that covers wind under-generation in 90 percent of intervals.

## Repository layout

| Path | Description |
| :--- | :--- |
| `Dockerfile` | Builds the React frontend and serves the full application from FastAPI on port `8000`. |
| `docker-compose.yml` | Runs the container on port `8000` and persists the Elexon JSON cache in `backend/data/`. |
| `backend/requirements.txt` | Python package dependencies for the API server and test suite. |
| `backend/app/config.py` | Elexon endpoint URLs, fetch date bounds, and default query parameters. |
| `backend/app/models.py` | Pydantic schemas for time series points, summary metrics, and analytical breakdowns. |
| `backend/app/elexon.py` | Fetches and caches `FUELHH` and `WINDFOR` stream datasets from Elexon BMRS. |
| `backend/app/alignment.py` | Aligns 30-minute actuals with 60-minute forecasts and enforces the decision cutoff rule. |
| `backend/app/metrics.py` | Computes MAE, RMSE, bias, MAPE, P90/P95 shortfall quantiles, horizon buckets, and daily rows. |
| `backend/app/main.py` | FastAPI application exposing `/api/health`, `/api/dashboard`, and static frontend assets. |
| `backend/tests/` | Unit tests for forecast cutoff selection, horizon filtering, and error quantile math. |
| `frontend/src/types.ts` | TypeScript interfaces matching the backend response models. |
| `frontend/src/api.ts` | HTTP client for `/api/dashboard`. |
| `frontend/src/components/ControlBar.tsx` | Controls for decision rule, `D-1` cutoff time, forecast horizon, date range, and resolution. |
| `frontend/src/components/KpiStrip.tsx` | Summary cards for mean output, MAE, bias, and P90 shortfall risk. |
| `frontend/src/components/ForecastChart.tsx` | Time series chart of actual wind output, forecast output, and shortfall intervals. |
| `frontend/src/components/ProcurementCalculator.tsx` | Calculator that converts target demand and error buffer policy into firm thermal purchase volume. |
| `frontend/src/components/HorizonErrorChart.tsx` | Bar and line chart showing MAE and P90 shortfall across lead time buckets (`0-6h` to `42-48h`). |
| `frontend/src/components/HourlyProfileChart.tsx` | Diurnal error profile across UTC hours `00:00` to `23:00`. |
| `frontend/src/components/ErrorDistributionChart.tsx` | Histogram of forecast error separating surplus hours from shortfall hours. |
| `frontend/src/components/DailySummaryTable.tsx` | Daily ledger of forecasted GWh, actual GWh, MAE, bias, and P90 shortfall for January 2026. |

## How to start the application

### Option 1: Run with Docker Compose

1. Build and start the container from the repository root:
   ```bash
   docker compose up --build
   ```
2. Open `http://localhost:8000` in your browser. On the first request, the backend downloads the January 2026 datasets from Elexon and caches them in `backend/data/`.

### Option 2: Run backend and frontend locally

1. Install Python dependencies and start the FastAPI server on port `8000`:
   ```bash
   cd backend
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   uvicorn app.main:app --reload --port 8000
   ```
2. Run the backend unit tests:
   ```bash
   cd backend
   pytest
   ```
3. In a second terminal, install frontend packages and start the Vite development server on port `5173`:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
4. Open `http://localhost:5173` in your browser. Vite proxies `/api` requests to `http://127.0.0.1:8000`.
