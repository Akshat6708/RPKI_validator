import websocket
import json
import requests
import psycopg2
import ssl
import threading
import queue
import time
import datetime

# --- CONFIGURATION ---
ROUTINATOR_API_URL = "http://localhost:3323/validity"
RIS_LIVE_URL = "wss://ris-live.ripe.net/v1/ws/"
RUN_DURATION_MINUTES = 5

DB_CONFIG = {
    "dbname": "bgpdb",
    "user": "postgres",
    "password": "Akshat@6708",
    "host": "localhost",
    "port": "5433"
}

task_queue = queue.Queue()
start_time = None

# ---------- DB ----------
def get_db_connection():
    try:
        return psycopg2.connect(**DB_CONFIG)
    except Exception as e:
        print(f"❌ DB Error: {e}")
        return None

def init_db():
    conn = get_db_connection()
    if not conn:
        return
    cur = conn.cursor()
    cur.execute("""
    CREATE TABLE IF NOT EXISTS bgp_validation_logs (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        asn VARCHAR(20),
        prefix VARCHAR(50),
        max_length INT,
        validity_state VARCHAR(20),
        reason TEXT
    );
    """)
    conn.commit()
    cur.close()
    conn.close()
    print("✅ Database ready")

def save_to_db(asn, prefix, max_length, validity, reason):
    conn = get_db_connection()
    if not conn:
        return
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO bgp_validation_logs (asn, prefix, max_length, validity_state, reason)
        VALUES (%s, %s, %s, %s, %s)
    """, (asn, prefix, max_length, validity, reason))
    conn.commit()
    cur.close()
    conn.close()

# ---------- HELPERS ----------
def clean_prefix(prefix):
    try:
        ip, mask = prefix.split('/')
        mask = int(mask)
        if '.' in ip and mask > 32:
            return None
        if ':' in ip and mask > 128:
            return None
        return prefix
    except:
        return None

def get_origin_asn(path):
    if not path:
        return None
    for asn in reversed(path):
        if isinstance(asn, int) and 0 < asn < 4294967295:
            return asn
    return None

def is_time_up():
    return (datetime.datetime.now() - start_time).total_seconds() > RUN_DURATION_MINUTES * 60

# ---------- RPKI ----------
def check_rpki(asn, prefix):
    prefix = clean_prefix(prefix)
    if not prefix:
        return None

    try:
        r = requests.get(
            ROUTINATOR_API_URL,
            params={"asn": asn, "prefix": prefix},
            timeout=15
        )
        if r.status_code == 200:
            return r.json()
    except:
        pass
    return None

# ---------- WORKER ----------
def worker():
    print("👷 Worker started")
    while not is_time_up():
        try:
            asn, prefix = task_queue.get(timeout=2)
        except queue.Empty:
            continue

        result = check_rpki(asn, prefix)
        if not result:
            task_queue.task_done()
            continue

        validity = result['validated_route']['validity']['state']
        reason = result['validated_route']['validity'].get('reason')
        max_len = None

        vrps = result['validated_route']['validity'].get('VRPs', {}).get('matched', [])
        if vrps:
            max_len = vrps[0].get('max_length')

        # --- FILTER FALSE INVALIDS ---
        if validity == "invalid" and max_len:
            prefix_len = int(prefix.split('/')[-1])
            if prefix_len > max_len:
                # expected invalid → ignore
                task_queue.task_done()
                continue

        print(f"✔ AS{asn} {prefix} [{validity}] maxLen={max_len}")
        save_to_db(asn, prefix, max_len, validity, reason)

        task_queue.task_done()

# ---------- WEBSOCKET ----------
def on_message(ws, message):
    if is_time_up():
        ws.close()
        return

    try:
        msg = json.loads(message)
        if msg.get("type") != "ris_message":
            return

        data = msg.get("data", {})
        path = data.get("path", [])
        announcements = data.get("announcements", [])

        origin_asn = get_origin_asn(path)
        if not origin_asn:
            return

        for ann in announcements:
            for prefix in ann.get("prefixes", []):
                task_queue.put((origin_asn, prefix))
    except:
        pass

def on_open(ws):
    print("🌐 Connected to RIS Live")
    ws.send(json.dumps({
        "type": "ris_subscribe",
        "data": {
            "host": "rrc01",
            "type": "UPDATE",
            "require": "announcements"
        }
    }))

def on_error(ws, error):
    print("⚠️ WS Error:", error)

def on_close(ws, *args):
    print("🔌 WS Closed")

# ---------- MAIN ----------
if __name__ == "__main__":
    init_db()
    start_time = datetime.datetime.now()

    threading.Thread(target=worker, daemon=True).start()

    while not is_time_up():
        ws = websocket.WebSocketApp(
            RIS_LIVE_URL,
            on_open=on_open,
            on_message=on_message,
            on_error=on_error,
            on_close=on_close
        )
        ws.run_forever(
            sslopt={"cert_reqs": ssl.CERT_NONE},
            ping_interval=30,
            ping_timeout=10
        )
        time.sleep(5)

    print("🏁 Finished")
