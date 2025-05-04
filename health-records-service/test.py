import boto3, json

client = boto3.client("secretsmanager", region_name="us-east-2")  # use correct region
response = client.get_secret_value(SecretId="patient-health-system-secrets")
secrets = json.loads(response['SecretString'])

print("✅ Secrets loaded:")
for k, v in secrets.items():
    print(f"{k} = {v}")


# Just to test I can see the secrets or not