# ✅ FASTAPI - health-records-service/main.py (no .env, only AWS Secrets Manager)

import boto3, json, os
from fastapi import FastAPI, HTTPException, Depends, Header, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from uuid import uuid4
import psycopg2
import jwt
import boto3

# Step 1: Load secrets from AWS Secrets Manager
def load_secrets():
    client = boto3.client("secretsmanager", region_name="us-east-2")
    secret = client.get_secret_value(SecretId="patient-health-system-secrets")
    secrets = json.loads(secret["SecretString"])
    os.environ.update(secrets)

load_secrets()

# Step 2: FastAPI Setup
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Step 3: Database & AWS Clients
conn = psycopg2.connect(os.getenv("DATABASE_URL"))
cur = conn.cursor()

s3 = boto3.client(
    's3',
    region_name=os.getenv("AWS_S3_REGION"),
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY")
)
S3_BUCKET = os.getenv("AWS_S3_BUCKET")

JWT_SECRET = os.getenv("JWT_SECRET")

# Step 4: Models
class Visit(BaseModel):
    hospital: str
    date: str
    reason: str

class VisitResponse(Visit):
    id: int
    user_id: int

# Step 5: JWT Token Parsing
def get_user_id(authorization: str = Header(...)):
    try:
        token = authorization.split(" ")[1]
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload['userId']
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

# Step 6: Routes
@app.get("/api/visits")
def get_visits(user_id: int = Depends(get_user_id)):
    cur.execute("""
        SELECT id, user_id, hospital, date, reason, doctor, notes, document_url
        FROM visits WHERE user_id = %s ORDER BY date DESC
    """, (user_id,))
    rows = cur.fetchall()
    return JSONResponse(content=[{
        "id": r[0], "user_id": r[1], "hospital": r[2], "date": r[3].isoformat(),
        "reason": r[4], "doctor": r[5], "notes": r[6], "document_url": r[7]
    } for r in rows])

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
        ext = file.filename.split(".")[-1]
        s3_key = f"documents/{uuid4()}.{ext}"
        s3.upload_fileobj(
            file.file, S3_BUCKET, s3_key,
            ExtraArgs={"ContentType": file.content_type, "ContentDisposition": "inline"}
        )
        file_url = f"https://{S3_BUCKET}.s3.{os.getenv('AWS_S3_REGION')}.amazonaws.com/{s3_key}"

    cur.execute("""
        INSERT INTO visits (user_id, hospital, date, reason, doctor, notes, document_url)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, (user_id, hospital, date, reason, doctor, notes, file_url))
    conn.commit()
    return {"message": "Visit added successfully"}
