# health-records-service/main.py
from fastapi import FastAPI, HTTPException, Depends, Header, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import psycopg2
import os
import jwt
import boto3
from uuid import uuid4
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv
load_dotenv()



app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# DB Connection
DATABASE_URL = os.getenv("DATABASE_URL")
conn = psycopg2.connect(DATABASE_URL)
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
    
s3 = boto3.client('s3',
    region_name=os.getenv("AWS_S3_REGION"),
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY")
)

S3_BUCKET = os.getenv("AWS_S3_BUCKET")

@app.get("/api/visits")
def get_visits(user_id: int = Depends(get_user_id)):
    try:
        cur.execute("""
            SELECT id, user_id, hospital, date, reason, doctor, notes, document_url
            FROM visits
            WHERE user_id = %s
            ORDER BY date DESC
        """, (user_id,))
        rows = cur.fetchall()

        visits = []
        for row in rows:
            visits.append({
                "id": row[0],
                "user_id": row[1],
                "hospital": row[2],
                "date": row[3].isoformat(),
                "reason": row[4],
                "doctor": row[5],
                "notes": row[6],
                "document_url": row[7]
            })

        return JSONResponse(content=visits)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/visits")
def add_visit(
    user_id: int = Depends(get_user_id),
    date: str = Form(...),
    hospital: str = Form(...),
    doctor: str = Form(...),
    reason: str = Form(...),
    notes: str = Form(...),
    file: UploadFile = File(None)
):
    file_url = None
    if file:
        file_ext = file.filename.split(".")[-1]
        s3_key = f"documents/{uuid4()}.{file_ext}"
        s3.upload_fileobj(
            file.file,
            S3_BUCKET,
            s3_key,
            ExtraArgs={"ACL": "public-read"}
        )
        file_url = f"https://{S3_BUCKET}.s3.{os.getenv('AWS_S3_REGION')}.amazonaws.com/{s3_key}"

    cur.execute(
        """
        INSERT INTO visits (user_id, hospital, date, reason, doctor, notes, document_url)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """,
        (user_id, hospital, date, reason, doctor, notes, file_url)
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
