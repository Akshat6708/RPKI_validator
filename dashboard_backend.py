from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import psycopg2
from urllib.parse import urlparse, parse_qs
import os

# Database configuration (same as validator script)
DB_CONFIG = {
    "dbname": "bgpdb",
    "user": "postgres",
    "password": "Akshat@6708",
    "host": "localhost",
    "port": "5433"
}

def get_db_connection():
    """Database connection banata hai"""
    try:
        return psycopg2.connect(**DB_CONFIG)
    except Exception as e:
        print(f"❌ DB Error: {e}")
        return None

def get_stats_from_db():
    """Database se overall statistics fetch karta hai"""
    conn = get_db_connection()
    if not conn:
        return None
    
    try:
        cur = conn.cursor()
        
        # Overall statistics
        cur.execute("""
            SELECT 
                COUNT(*) FILTER (WHERE validity_state = 'valid') as valid,
                COUNT(*) FILTER (WHERE validity_state = 'invalid') as invalid,
                COUNT(*) FILTER (WHERE validity_state = 'not-found') as not_found,
                COUNT(*) as total
            FROM bgp_validation_logs
        """)
        stats = cur.fetchone()
        
        # Recent logs (last 15 entries)
        cur.execute("""
            SELECT 
                id,
                to_char(timestamp, 'HH24:MI:SS') as time,
                asn,
                prefix,
                max_length,
                validity_state
            FROM bgp_validation_logs
            ORDER BY timestamp DESC
            LIMIT 15
        """)
        logs = cur.fetchall()
        
        cur.close()
        conn.close()
        
        return {
            'stats': {
                'valid': stats[0] or 0,
                'invalid': stats[1] or 0,
                'notFound': stats[2] or 0,
                'total': stats[3] or 0
            },
            'logs': [
                {
                    'id': log[0],
                    'timestamp': log[1],
                    'asn': log[2],
                    'prefix': log[3],
                    'maxLength': log[4] if log[4] else 'N/A',
                    'validity': log[5]
                } for log in logs
            ]
        }
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def get_timeseries_from_db():
    """Database se time-series data fetch karta hai (last 30 minutes)"""
    conn = get_db_connection()
    if not conn:
        return None
    
    try:
        cur = conn.cursor()
        
        cur.execute("""
            SELECT 
                to_char(DATE_TRUNC('minute', timestamp), 'HH24:MI') as time_bucket,
                COUNT(*) FILTER (WHERE validity_state = 'valid') as valid,
                COUNT(*) FILTER (WHERE validity_state = 'invalid') as invalid,
                COUNT(*) FILTER (WHERE validity_state = 'not-found') as not_found
            FROM bgp_validation_logs
            WHERE timestamp >= NOW() - INTERVAL '30 minutes'
            GROUP BY time_bucket
            ORDER BY time_bucket
        """)
        
        data = cur.fetchall()
        cur.close()
        conn.close()
        
        return {
            'timeseries': [
                {
                    'time': row[0],
                    'valid': row[1] or 0,
                    'invalid': row[2] or 0,
                    'notFound': row[3] or 0
                } for row in data
            ]
        }
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

class DashboardHandler(BaseHTTPRequestHandler):
    """HTTP requests handle karta hai"""
    
    def do_GET(self):
        parsed_path = urlparse(self.path)
        
        # Dashboard HTML page serve karo
        if parsed_path.path == '/' or parsed_path.path == '/dashboard':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            
            # Dashboard HTML file read karke send karo
            try:
                with open('dashboard.html', 'r', encoding='utf-8') as f:
                    self.wfile.write(f.read().encode())
            except FileNotFoundError:
                self.wfile.write(b"<h1>Error: dashboard.html not found!</h1>")
        
        # Stats data API endpoint
        elif parsed_path.path == '/api/data':
            data = get_stats_from_db()
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            if data:
                self.wfile.write(json.dumps(data).encode())
            else:
                self.wfile.write(json.dumps({'error': 'Database error'}).encode())
        
        # Timeseries data API endpoint
        elif parsed_path.path == '/api/timeseries':
            data = get_timeseries_from_db()
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            if data:
                self.wfile.write(json.dumps(data).encode())
            else:
                self.wfile.write(json.dumps({'error': 'Database error'}).encode())
        
        else:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b"404 Not Found")
    
    def log_message(self, format, *args):
        """Log messages ko clean rakhne ke liye"""
        return

def run_server(port=8080):
    """Server start karta hai"""
    server_address = ('', port)
    httpd = HTTPServer(server_address, DashboardHandler)
    
    print("=" * 60)
    print("🚀 BGP RPKI Dashboard Server Started!")
    print("=" * 60)
    print(f"📍 Dashboard URL: http://localhost:{port}")
    print(f"📊 Data endpoint: http://localhost:{port}/api/data")
    print(f"📈 Timeseries: http://localhost:{port}/api/timeseries")
    print("=" * 60)
    print("⚡ Server is running... Press Ctrl+C to stop")
    print("=" * 60)
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\n🛑 Server stopped!")
        httpd.server_close()

if __name__ == '__main__':
    # Check if dashboard.html exists
    if not os.path.exists('dashboard.html'):
        print("⚠️  WARNING: dashboard.html file not found!")
        print("📝 Please create dashboard.html file first")
        print("=" * 60)
    
    run_server(port=8080)