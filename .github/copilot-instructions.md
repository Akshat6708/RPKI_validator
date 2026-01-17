# RPKI BGP Validator - AI Coding Agent Instructions

## Architecture Overview

This is a **real-time BGP route validation system** that monitors live BGP announcements and validates them against RPKI (Resource Public Key Infrastructure) records. The system has three main components:

1. **Validator Service** ([app.py](app.py)) - Real-time BGP stream processor with RPKI validation
2. **Dashboard Backend** ([dashboard_backend.py](dashboard_backend.py)) - HTTP API server for data retrieval
3. **Web Dashboard** ([dashboard.html](dashboard.html)) - Real-time visualization frontend

### Data Flow
```
RIS Live WebSocket → app.py → RPKI Routinator API → PostgreSQL → dashboard_backend.py → Web UI
```

## Key Components & Responsibilities

### 1. Validator ([app.py](app.py))
- **WebSocket Consumer**: Connects to RIPE NIS RIS Live (`wss://ris-live.ripe.net/v1/ws/`) for real-time BGP UPDATE messages
- **Worker Thread**: Processes validation tasks from queue (`task_queue`)
- **RPKI Validation**: Queries local Routinator API (`http://localhost:3325/validity`) with ASN + prefix pairs
- **Database Persistence**: Logs validation results to PostgreSQL `bgp_validation_logs` table
- **Time-boxed Execution**: Runs for `RUN_DURATION_MINUTES` (default: 5 minutes) then exits

**Critical Logic - False Invalid Filtering**:
```python
# Lines 130-137: Filters out expected invalids
if validity == "invalid" and max_len:
    prefix_len = int(prefix.split('/')[-1])
    if prefix_len > max_len:
        # expected invalid → ignore
        continue
```
This prevents logging route announcements that are invalid due to prefix length exceeding VRP max_length (expected behavior, not security issue).

### 2. Dashboard Backend ([dashboard_backend.py](dashboard_backend.py))
- **HTTP Server**: Runs on port 8080 using `http.server` module
- **API Endpoints**:
  - `GET /` or `/dashboard` → Serves [dashboard.html](dashboard.html)
  - `GET /api/data` → Returns stats (valid/invalid/not-found counts) + last 15 logs
  - `GET /api/timeseries` → Returns 30-minute time-bucketed validation trends
- **Database Queries**: Uses PostgreSQL aggregations with `COUNT(*) FILTER (WHERE ...)` pattern

### 3. Frontend ([dashboard.html](dashboard.html))
- **Vanilla JS + Tailwind CSS**: No build step required
- **Chart.js**: Line chart (trends) + Doughnut chart (distribution)
- **Auto-refresh**: Polls `/api/data` and `/api/timeseries` every few seconds when "Live" toggle is active

## Database Schema

**Table**: `bgp_validation_logs`
```sql
- id (SERIAL PRIMARY KEY)
- timestamp (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- asn (VARCHAR(20))
- prefix (VARCHAR(50))
- max_length (INT, nullable)
- validity_state (VARCHAR(20)) -- 'valid' | 'invalid' | 'not-found'
- reason (TEXT, nullable)
```

## External Dependencies

### Required Services
1. **PostgreSQL** (localhost:5433) - Database: `bgpdb`, User: `postgres`
2. **Routinator** (localhost:3325) - Local RPKI validator API (must be running before [app.py](app.py))
3. **RIPE RIS Live** (wss://ris-live.ripe.net/v1/ws/) - External BGP feed

### Python Dependencies
- `websocket-client` (not `websockets` - note the hyphen)
- `psycopg2-binary` for PostgreSQL
- `requests` for HTTP API calls

## Critical Configuration

**Hard-coded in [app.py](app.py) lines 11-18**:
```python
ROUTINATOR_API_URL = "http://localhost:3325/validity"
RIS_LIVE_URL = "wss://ris-live.ripe.net/v1/ws/"
RUN_DURATION_MINUTES = 5

DB_CONFIG = {
    "dbname": "bgpdb",
    "user": "postgres",
    "password": "Akshat@6708",  # WARNING: Hardcoded credential
    "host": "localhost",
    "port": "5433"
}
```

## Developer Workflows

### Running the System
```bash
# 1. Start PostgreSQL (port 5433)
# 2. Start Routinator: routinator server --rtr 0.0.0.0:3323 --http 0.0.0.0:3325
# 3. Start validator (runs for 5 mins then exits)
python app.py

# 4. Start dashboard server (runs indefinitely)
python dashboard_backend.py

# 5. Open browser: http://localhost:8080
```

### Adding New Validation Logic
- Modify `check_rpki()` function in [app.py](app.py:96-108)
- Adjust filtering logic in `worker()` function [app.py](app.py:130-137)
- Update database schema in `init_db()` if adding new fields

### Debugging
- **No validation results**: Check if Routinator is running (`curl http://localhost:3325/validity?asn=13335&prefix=1.1.1.0/24`)
- **WebSocket disconnects**: Check `on_error()` and `on_close()` handlers in [app.py](app.py:182-187)
- **Dashboard not loading**: Ensure [dashboard.html](dashboard.html) is in same directory as [dashboard_backend.py](dashboard_backend.py)

## Code Conventions

1. **No Environment Variables**: All config is hardcoded (not production-ready)
2. **Mixed Language Comments**: Some Hindi comments in [dashboard_backend.py](dashboard_backend.py) (e.g., "Database connection banata hai" = "Creates database connection")
3. **No Error Recovery**: [app.py](app.py) exits after `RUN_DURATION_MINUTES` regardless of completion status
4. **Synchronous HTTP API**: Uses Python's built-in `http.server`, not async frameworks
5. **Queue-based Concurrency**: Single worker thread processes validation tasks from `task_queue`

## Common Pitfalls

- **Wrong websocket library**: Use `websocket-client` (import as `websocket`), not `websockets`
- **Database port**: Uses non-standard port 5433 (not 5432)
- **SSL Verification Disabled**: WebSocket connects with `sslopt={"cert_reqs": ssl.CERT_NONE}` ([app.py](app.py:205)
- **Time-limited Execution**: [app.py](app.py) will auto-exit after 5 minutes - not a bug
