# Secrets Management with AWS Secrets Manager

GorillaBooks uses AWS Secrets Manager to automatically generate and securely store sensitive credentials. No manual secret generation or management is required!

## How It Works

### Automatic Secret Generation

When you deploy the CloudFormation stack, it automatically:

1. **Generates a MongoDB password** (32 characters)
   - Stored in: `gorillabooks-production-mongodb-password`
   - Used by: DocumentDB cluster and ECS backend tasks

2. **Generates a JWT signing secret** (64 characters)
   - Stored in: `gorillabooks-production-jwt-secret`
   - Used by: ECS backend tasks for JWT token signing

### Secret Rotation

Secrets are generated **once** during stack creation and persist across updates. They are only regenerated if:
- The Secrets Manager resource is deleted
- You manually rotate the secret in AWS Secrets Manager console

### Accessing Secrets

#### Via AWS CLI

```bash
# Get MongoDB password
aws secretsmanager get-secret-value \
  --secret-id gorillabooks-production-mongodb-password \
  --query SecretString --output text | jq -r .password

# Get JWT secret
aws secretsmanager get-secret-value \
  --secret-id gorillabooks-production-jwt-secret \
  --query SecretString --output text | jq -r .secret
```

#### Via AWS Console

1. Go to **AWS Secrets Manager** in the console
2. Find secrets prefixed with `gorillabooks-production-`
3. Click **Retrieve secret value** to view

#### From ECS Tasks

ECS tasks automatically receive secrets as environment variables:
- Backend receives `JWT_SECRET` from Secrets Manager
- Backend receives `MONGODB_URI` with password injected from Secrets Manager

## Cost

AWS Secrets Manager pricing:
- **$0.40/month per secret** = $0.80/month for both secrets
- **$0.05 per 10,000 API calls** (negligible for this application)

**Total cost: ~$0.80/month** added to infrastructure costs.

## Security Benefits

✅ **No secrets in Git** - Nothing to accidentally commit
✅ **No GitHub Secrets** - No manual secret management in GitHub
✅ **Automatic encryption** - Secrets encrypted at rest with AWS KMS
✅ **IAM-controlled access** - Only ECS tasks can read secrets
✅ **Audit trail** - CloudTrail logs all secret access
✅ **Rotation ready** - Can enable automatic rotation if needed

## IAM Permissions Required

The ECS Task Execution Role needs:
```json
{
  "Effect": "Allow",
  "Action": [
    "secretsmanager:GetSecretValue"
  ],
  "Resource": [
    "arn:aws:secretsmanager:us-east-1:ACCOUNT:secret:gorillabooks-production-mongodb-password-*",
    "arn:aws:secretsmanager:us-east-1:ACCOUNT:secret:gorillabooks-production-jwt-secret-*"
  ]
}
```

This is automatically configured in the CloudFormation template.

## Migration from Manual Secrets

If you previously deployed with manual secrets (`MONGODB_PASSWORD` and `JWT_SECRET` parameters), the new deployment will:

1. Create new auto-generated secrets in Secrets Manager
2. Use the new secrets for new deployments
3. **Important**: The MongoDB password will change, requiring DocumentDB cluster recreation

To avoid downtime during migration:
1. Note your current MongoDB password
2. After deploying new stack, manually update the Secrets Manager secret to match old password
3. Or: Accept brief downtime as DocumentDB cluster is recreated with new password

## Troubleshooting

### Secret Not Found Error

If ECS tasks fail with "secret not found":
1. Check that Secrets Manager secrets exist:
   ```bash
   aws secretsmanager list-secrets --query 'SecretList[?contains(Name, `gorillabooks`)]'
   ```
2. Verify ECS Task Execution Role has permissions
3. Check CloudFormation stack deployed successfully

### Cannot Connect to Database

If backend can't connect to DocumentDB:
1. Verify secret contains password:
   ```bash
   aws secretsmanager get-secret-value --secret-id gorillabooks-production-mongodb-password
   ```
2. Check DocumentDB cluster is using correct password
3. Verify MONGODB_URI environment variable is correct in ECS task definition

## Manual Secret Rotation (Optional)

To rotate secrets without redeploying:

```bash
# Rotate MongoDB password
aws secretsmanager rotate-secret \
  --secret-id gorillabooks-production-mongodb-password \
  --rotation-lambda-arn arn:aws:lambda:REGION:ACCOUNT:function:RotateSecret

# Or generate new random secret
aws secretsmanager update-secret \
  --secret-id gorillabooks-production-mongodb-password \
  --generate-secret-string '{"PasswordLength":32,"ExcludeCharacters":"\"@/\\\\"}'
```

**Note**: After rotating MongoDB password, you must also update the DocumentDB master password to match.

## Summary

With Secrets Manager integration:
- ✅ Zero manual secret management
- ✅ Secure by default
- ✅ Simple deployment (`./deploy.sh` or push to GitHub)
- ✅ Production-ready security
- ✅ Cost: less than $1/month

Just deploy and go!
