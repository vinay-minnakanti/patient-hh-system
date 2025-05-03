import psycopg2
import os

# Directly using the connection string
DATABASE_URL = "postgresql://admin:9yV0OiJ7s9g50qv8BPNlUEl8A5tA5DuW@dpg-d0b9hc6uk2gs73ch3o3g-a.oregon-postgres.render.com/patienthistory"

try:
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    cur.execute("SELECT * FROM visits LIMIT 5;")
    rows = cur.fetchall()
    for row in rows:
        print(row)
    conn.close()
    print("✅ Connection successful.")
except Exception as e:
    print("❌ Connection failed:", e)
