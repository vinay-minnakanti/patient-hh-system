# health-records-service/main.py
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import psycopg2
from typing import List
import jwt
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# DB Connection
conn = psycopg2.connect(os.getenv("postgresql://admin:9yV0OiJ7s9g50qv8BPNlUEl8A5tA5DuW@dpg-d0b9hc6uk2gs73ch3o3g-a.oregon-postgres.render.com/patienthistory"))
cur = conn.cursor()

# JWT secret
JWT_SECRET = os.getenv("JWT_SECRET", "your_jwt_secret")

class Visit(BaseModel):
    hospital: str
    date: str
    reason: str

class VisitResponse(Visit):
    id: int
    user_id: int


def get_user_id(authorization: str = Header(...)):
    try:
        token = authorization.split(" ")[1]
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload['userId']
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.get("/api/visits", response_model=List[VisitResponse])
def get_visits(user_id: int = Depends(get_user_id)):
    cur.execute("SELECT id, user_id, hospital, date, reason FROM visits WHERE user_id = %s ORDER BY date DESC", (user_id,))
    rows = cur.fetchall()
    return [dict(id=row[0], user_id=row[1], hospital=row[2], date=row[3], reason=row[4]) for row in rows]

@app.post("/api/visits")
def add_visit(visit: Visit, user_id: int = Depends(get_user_id)):
    cur.execute(
        "INSERT INTO visits (user_id, hospital, date, reason) VALUES (%s, %s, %s, %s)",
        (user_id, visit.hospital, visit.date, visit.reason)
    )
    conn.commit()
    return {"message": "Visit added successfully"}

# SQL for table:
# CREATE TABLE visits (
#     id SERIAL PRIMARY KEY,
#     user_id INTEGER NOT NULL,
#     hospital VARCHAR(255),
#     date DATE,
#     reason TEXT
# );
