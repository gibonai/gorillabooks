# GorillaBooks AWS Deployment

Complete AWS infrastructure using **CloudFormation** - simple, reproducible, and requires NO pre-created resources.

## Overview

This deployment uses:
- **CloudFormation** for infrastructure-as-code (no Terraform state buckets needed!)
- **ECS Fargate** for container orchestration
- **DocumentDB** (MongoDB-compatible) for database
- **Application Load Balancer** for public access
- **ECR** for Docker image storage
- **GitHub Actions** for CI/CD

## What Gets Created

The CloudFormation stack creates **everything**:

### Networking
- VPC with public and private subnets across 2 AZs
- Internet Gateway
- Route tables
- Security groups for ALB, ECS, and DocumentDB

### Compute
- ECS Fargate cluster
- Backend service (Node.js API)
- Frontend service (Nginx serving React app)
- Auto-scaling task definitions

### Database
- DocumentDB cluster (MongoDB-compatible)
- Automatic backups
- Multi-AZ for high availability

### Load Balancing
- Application Load Balancer (publicly accessible)
- Target groups for frontend and backend
- Path-based routing (/api/* → backend, /* → frontend)

### Container Registry
- ECR repositories for backend and frontend images
- Automatic image scanning
- Lifecycle policies (keep last 10 images)

### Monitoring
- CloudWatch log groups for all services
- 7-day log retention

## Prerequisites

1. **AWS Account** with admin access
2. **AWS CLI** installed and configured (or GitHub OIDC setup for CI/CD)
3. **Docker** installed (for building images)
4. **IAM Permissions**: CloudFormation, ECS, ECR, VPC, RDS, IAM, Secrets Manager, ACM, Route53
5. **(Optional) Route53 Hosted Zone** - For custom domain with auto-generated HTTPS certificate

**No manual secrets needed!** MongoDB password and JWT secret are automatically generated in AWS Secrets Manager.

**Optional custom domain!** Provide domain name and Route53 zone ID to get automatic HTTPS with ACM certificate.

## Deployment Methods

### Option 1: GitHub Actions (Recommended)

1. **Set up GitHub OIDC** (if not already done):
   - Create an IAM OIDC identity provider in AWS
   - Create an IAM role with trust policy for GitHub Actions
   - Add role permissions: CloudFormation, ECS, ECR, VPC, RDS, IAM, Secrets Manager

2. **Set GitHub Secret** (just one!):

   **Settings → Secrets and variables → Actions → New repository secret**
   ```
   AWS_ROLE_ARN=arn:aws:iam::YOUR_ACCOUNT_ID:role/GitHubActionsRole
   ```

3. **(Optional) Configure custom domain**:

   Edit `.github/workflows/deploy.yml` directly in your repo:
   ```yaml
   env:
     AWS_REGION: us-west-2
     STACK_NAME: gorillabooks-production
     DOMAIN_NAME: 'gorillabooks.net'        # Your domain
     HOSTED_ZONE_ID: 'Z1234567890ABC'       # Your zone ID
   ```

4. **Push to main branch**:
   ```bash
   git push origin main
   ```

   **Secrets are auto-generated!** MongoDB password and JWT secret are automatically created in AWS Secrets Manager on first deployment.

4. **Monitor deployment** in GitHub Actions tab

5. **Get your URL** from the workflow output or:
   ```bash
   aws cloudformation describe-stacks \
     --stack-name gorillabooks-production \
     --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerURL`].OutputValue' \
     --output text
   ```

### Option 2: Manual Deployment Script

1. **Configure AWS CLI**:
   ```bash
   aws configure
   ```

2. **Run deployment script**:
   ```bash
   cd infrastructure
   ./deploy.sh
   ```

   **Optional - with custom domain:**
   ```bash
   export DOMAIN_NAME=gorillabooks.example.com
   export HOSTED_ZONE_ID=Z1234567890ABC
   cd infrastructure
   ./deploy.sh
   ```

   The script will:
   - Deploy CloudFormation stack (secrets auto-generated in AWS Secrets Manager)
   - Create ACM certificate and configure HTTPS (if domain provided)
   - Build and push Docker images
   - Update ECS services
   - Wait for deployment to complete
   - Show your application URL

### Option 3: Pure CloudFormation (No Docker builds)

If you just want to create infrastructure:

```bash
aws cloudformation deploy \
  --template-file infrastructure/cloudformation/main.yml \
  --stack-name gorillabooks-production \
  --parameter-overrides \
    Environment=production \
    AppName=gorillabooks \
  --capabilities CAPABILITY_IAM \
  --region us-east-1
```

Secrets are automatically generated in AWS Secrets Manager. Then manually build and push images to the created ECR repositories.

## Configuration

### Stack Parameters

| Parameter | Description | Default | Required |
|-----------|-------------|---------|----------|
| `Environment` | Environment name (production/staging) | production | No |
| `AppName` | Application name for resource naming | gorillabooks | No |
| `CertificateArn` | ACM certificate ARN for HTTPS | - | No |
| `DomainName` | Custom domain name | - | No |

**Note:** MongoDB password and JWT secret are automatically generated and stored in AWS Secrets Manager. No manual secret management needed!

### Environment Variables (set in CloudFormation)

Backend receives:
- `NODE_ENV=production`
- `PORT=3000`
- `JWT_SECRET=<from AWS Secrets Manager>`
- `MONGODB_URI=<auto-generated from DocumentDB with password from Secrets Manager>`

## Accessing Your Application

After deployment completes:

```bash
# Get your application URL
aws cloudformation describe-stacks \
  --stack-name gorillabooks-production \
  --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerURL`].OutputValue' \
  --output text
```

Visit the URL to access GorillaBooks!

## Monitoring

### View Logs

```bash
# Backend logs
aws logs tail /ecs/gorillabooks-production/backend --follow

# Frontend logs
aws logs tail /ecs/gorillabooks-production/frontend --follow
```

### Check Service Health

```bash
# List services
aws ecs list-services --cluster gorillabooks-production

# Check service status
aws ecs describe-services \
  --cluster gorillabooks-production \
  --services gorillabooks-production-backend gorillabooks-production-frontend
```

## Updating the Application

### Via GitHub Actions
Just push to main branch - it will automatically deploy.

### Manually
```bash
cd infrastructure
./deploy.sh
```

This will:
1. Update infrastructure (if template changed)
2. Build new images
3. Push to ECR
4. Force ECS to redeploy with new images

## Scaling

### Horizontal Scaling
Edit the `DesiredCount` in CloudFormation template:

```yaml
BackendService:
  Properties:
    DesiredCount: 2  # Change from 1 to 2
```

Then redeploy.

### Vertical Scaling
Edit the `Cpu` and `Memory` in task definitions:

```yaml
BackendTaskDefinition:
  Properties:
    Cpu: '512'     # 0.5 vCPU
    Memory: '1024' # 1 GB
```

## Cost Optimization

**Cost-optimized configuration for small deployments (10 users, small datasets): ~$80-95/month**

- ECS Fargate: ~$30/month (2 tasks @ 0.25 vCPU, 0.5 GB, single AZ)
- DocumentDB: ~$65/month (db.t4g.medium ARM instance, 1-day backup retention)
- ALB: ~$16/month
- Data transfer: ~$5/month
- ECR/CloudWatch: ~$2/month (3-day log retention)

**What's optimized:**
- Changed from db.t3.medium ($73/mo) to db.t4g.medium ($65/mo) - ARM-based, 10% cheaper
- Reduced backup retention from 7 days to 1 day
- Reduced CloudWatch log retention from 7 days to 3 days
- Single AZ deployment (no multi-AZ database replica)
- Removed redundant private subnet

### To Reduce Costs Further

1. **Stop services when not needed** (saves ~$30/month):
   ```bash
   aws ecs update-service \
     --cluster gorillabooks-production \
     --service gorillabooks-production-backend \
     --desired-count 0

   aws ecs update-service \
     --cluster gorillabooks-production \
     --service gorillabooks-production-frontend \
     --desired-count 0
   ```

2. **Use MongoDB Atlas free tier** instead of DocumentDB (saves ~$65/month but requires external service)

3. **Schedule automatic start/stop** using AWS Lambda and EventBridge for non-production hours

## Teardown

To completely remove everything:

```bash
# Delete the stack
aws cloudformation delete-stack \
  --stack-name gorillabooks-production \
  --region us-east-1

# Wait for deletion
aws cloudformation wait stack-delete-complete \
  --stack-name gorillabooks-production \
  --region us-east-1
```

**Note**: This deletes EVERYTHING including the database. Make sure to backup data first!

### Backup Before Teardown

```bash
# Get DocumentDB endpoint
MONGODB_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name gorillabooks-production \
  --query 'Stacks[0].Outputs[?OutputKey==`MongoDBEndpoint`].OutputValue' \
  --output text)

# Create snapshot (manual step - must be done from AWS Console or CLI)
aws docdb create-db-cluster-snapshot \
  --db-cluster-identifier gorillabooks-production-mongodb \
  --db-cluster-snapshot-identifier gorillabooks-backup-$(date +%Y%m%d)
```

## Troubleshooting

### Stack deployment fails

```bash
# Check stack events
aws cloudformation describe-stack-events \
  --stack-name gorillabooks-production \
  --max-items 20

# View specific failures
aws cloudformation describe-stack-events \
  --stack-name gorillabooks-production \
  --query 'StackEvents[?ResourceStatus==`CREATE_FAILED`]'
```

### Services won't start

```bash
# Check task failures
aws ecs describe-tasks \
  --cluster gorillabooks-production \
  --tasks $(aws ecs list-tasks --cluster gorillabooks-production --query 'taskArns[0]' --output text)

# Check stopped tasks
aws ecs list-tasks \
  --cluster gorillabooks-production \
  --desired-status STOPPED
```

### Can't access application

1. **Check ALB health**:
   ```bash
   aws elbv2 describe-target-health \
     --target-group-arn $(aws elbv2 describe-target-groups \
       --names gorillabooks-production-frontend-tg \
       --query 'TargetGroups[0].TargetGroupArn' \
       --output text)
   ```

2. **Check security groups**: Ensure ALB SG allows 80/443 from 0.0.0.0/0

3. **Check task status**: Ensure tasks are RUNNING

## Multiple Environments

To deploy staging alongside production:

```bash
aws cloudformation deploy \
  --template-file infrastructure/cloudformation/main.yml \
  --stack-name gorillabooks-staging \
  --parameter-overrides \
    Environment=staging \
    AppName=gorillabooks \
    MongoDBPassword=StagingPassword123 \
    JWTSecret=StagingJWTSecret \
  --capabilities CAPABILITY_IAM
```

Each stack is completely isolated with its own resources.

## Advanced: Adding HTTPS

1. **Request ACM certificate** in us-east-1:
   ```bash
   aws acm request-certificate \
     --domain-name gorillabooks.example.com \
     --validation-method DNS \
     --region us-east-1
   ```

2. **Validate domain** via DNS

3. **Redeploy with certificate**:
   ```bash
   aws cloudformation deploy \
     --template-file infrastructure/cloudformation/main.yml \
     --stack-name gorillabooks-production \
     --parameter-overrides \
       CertificateArn=arn:aws:acm:us-east-1:ACCOUNT:certificate/CERT_ID \
       DomainName=gorillabooks.example.com \
       MongoDBPassword=$MONGODB_PASSWORD \
       JWTSecret=$JWT_SECRET \
     --capabilities CAPABILITY_IAM
   ```

4. **Point DNS** to ALB DNS name

## Summary

✅ **Simple**: Single CloudFormation template
✅ **Reproducible**: Deploy to any AWS account
✅ **Complete**: No manual AWS console work
✅ **Clean**: One command to deploy, one to destroy
✅ **Documented**: Everything explained above

Perfect for open-source projects where others need to deploy easily!
