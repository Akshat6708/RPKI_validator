# RPKI BGP Validator

A real-time BGP route validation system that monitors live BGP announcements and validates them against RPKI (Resource Public Key Infrastructure) records.

## 🏗️ Architecture

This system consists of three main components:

1. **Validator Service** - Real-time BGP stream processor with RPKI validation
2. **Dashboard Backend** - HTTP API server for data retrieval
3. **Web Dashboard** - Real-time visualization frontend (React + TypeScript)

### Data Flow
```
RIS Live WebSocket → Validator → RPKI Routinator → PostgreSQL → Dashboard Backend → Web UI
```

## ✨ Features

- ⚡ Real-time BGP UPDATE monitoring via RIPE NIS RIS Live
- 🛡️ RPKI validation against local Routinator instance
- 📊 Interactive web dashboard with live metrics
- 📈 Time-series analysis of validation trends
- 🎯 Intelligent filtering of expected invalid routes
- 🗄️ PostgreSQL persistence for historical analysis

## 🔧 Prerequisites

### Required Services
- **PostgreSQL** (v12+)
- **Routinator** (RPKI validator)
- **Python** (v3.8+)
- **Node.js** (v16+) for the dashboard UI

### System Requirements
- Stable internet connection for BGP feed
- Minimum 2GB RAM
- ~1GB disk space for RPKI cache

## 📦 Installation

### 1. Clone the repository
```bash
git clone https://github.com/Akshat6708/RPKI_validator.git
cd RPKI_validator
```

### 2. Set up Python environment
```bash
# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Linux/Mac)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Set up PostgreSQL
```bash
# Create database
createdb bgpdb

# Create table
psql -d bgpdb -f schema.sql
```

### 4. Install and run Routinator
```bash
# Install Routinator (see https://routinator.docs.nlnetlabs.nl/)
cargo install routinator

# Initialize RPKI cache
routinator init

# Run Routinator server
routinator server --rtr 0.0.0.0:3323 --http 0.0.0.0:3325
```

### 5. Set up Dashboard UI
```bash
cd bgp-monitor-ui
npm install
npm run dev
```

## 🚀 Usage

### Running the Validator
```bash
# Activate virtual environment
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Run validator (runs for 5 minutes by default)
python app.py
```

### Running the Dashboard Backend
```bash
python dashboard_backend.py
```

### Accessing the Dashboard
Open your browser and navigate to:
```
http://localhost:5173  # Development mode
```

## ⚙️ Configuration

### Database Configuration
Edit database settings in `app.py` and `dashboard_backend.py`:
```python
DB_CONFIG = {
    "dbname": "bgpdb",
    "user": "postgres",
    "password": "your_password",
    "host": "localhost",
    "port": "5432"
}
```

### Validator Settings
Modify in `app.py`:
```python
RUN_DURATION_MINUTES = 5  # How long to collect data
ROUTINATOR_API_URL = "http://localhost:3325/validity"
RIS_LIVE_URL = "wss://ris-live.ripe.net/v1/ws/"
```

## 📊 Database Schema

```sql
CREATE TABLE bgp_validation_logs (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    asn VARCHAR(20),
    prefix VARCHAR(50),
    max_length INT,
    validity_state VARCHAR(20),  -- 'valid' | 'invalid' | 'not-found'
    reason TEXT
);
```

## 🔍 API Endpoints

### Dashboard Backend (Port 8080)
- `GET /api/data` - Current statistics and recent logs
- `GET /api/timeseries` - 30-minute time-bucketed validation trends

## 🐛 Troubleshooting

### Common Issues

**"Connection refused" error**
- Ensure PostgreSQL is running on the correct port
- Check Routinator is accessible at localhost:3325

**"No data in dashboard"**
- Run `app.py` first to collect BGP data
- Check database connection settings

**"WebSocket connection failed"**
- Verify internet connectivity
- RIPE RIS Live may be temporarily unavailable

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [RIPE NIS](https://www.ripe.net/) for RIS Live BGP feed
- [NLnet Labs](https://nlnetlabs.nl/) for Routinator
- [RPKI](https://www.rfc-editor.org/rfc/rfc6810.html) standards community

## 📧 Contact

Akshat - [@Akshat6708](https://github.com/Akshat6708)

Project Link: [https://github.com/Akshat6708/RPKI_validator](https://github.com/Akshat6708/RPKI_validator)
