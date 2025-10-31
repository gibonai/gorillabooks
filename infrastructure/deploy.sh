#!/bin/bash

set -e

# GorillaBooks - Simple Deployment Script
# This script deploys the entire application to AWS using CloudFormation

STACK_NAME="${STACK_NAME:-gorillabooks-production}"
AWS_REGION="${AWS_REGION:-us-west-2}"
ENVIRONMENT="${ENVIRONMENT:-production}"
DOMAIN_NAME="${DOMAIN_NAME:-}"
HOSTED_ZONE_ID="${HOSTED_ZONE_ID:-}"

echo "🦍 GorillaBooks Deployment"
echo "=========================="
echo ""
echo "Stack Name: $STACK_NAME"
echo "Region: $AWS_REGION"
echo "Environment: $ENVIRONMENT"
if [ -n "$DOMAIN_NAME" ]; then
    echo "Domain: $DOMAIN_NAME"
fi
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Please run 'aws configure'"
    exit 1
fi

echo "📦 Deploying CloudFormation stack..."
echo "   Secrets will be auto-generated in AWS Secrets Manager"

# Build parameter overrides
PARAMS="Environment=$ENVIRONMENT AppName=gorillabooks"
if [ -n "$DOMAIN_NAME" ]; then
    PARAMS="$PARAMS DomainName=$DOMAIN_NAME"
    echo "   Custom domain: $DOMAIN_NAME (ACM cert will be auto-created)"
fi
if [ -n "$HOSTED_ZONE_ID" ]; then
    PARAMS="$PARAMS HostedZoneId=$HOSTED_ZONE_ID"
fi

# Deploy with error handling
set +e
aws cloudformation deploy \
    --template-file cloudformation/main.yml \
    --stack-name $STACK_NAME \
    --parameter-overrides $PARAMS \
    --capabilities CAPABILITY_IAM \
    --region $AWS_REGION \
    --no-fail-on-empty-changeset
DEPLOY_EXIT_CODE=$?
set -e

if [ $DEPLOY_EXIT_CODE -ne 0 ]; then
    echo ""
    echo "❌ CloudFormation deployment failed!"
    echo ""
    echo "Recent error events:"
    aws cloudformation describe-stack-events \
        --stack-name $STACK_NAME \
        --region $AWS_REGION \
        --max-items 30 \
        --query 'StackEvents[?contains(ResourceStatus, `FAILED`)].[Timestamp,LogicalResourceId,ResourceStatus,ResourceStatusReason]' \
        --output table
    exit $DEPLOY_EXIT_CODE
fi

echo ""
echo "✅ Infrastructure deployed successfully!"
echo ""

# Get outputs
BACKEND_ECR=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $AWS_REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`BackendECRRepository`].OutputValue' \
    --output text)

FRONTEND_ECR=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $AWS_REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`FrontendECRRepository`].OutputValue' \
    --output text)

ALB_URL=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $AWS_REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerURL`].OutputValue' \
    --output text)

CLUSTER_NAME=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $AWS_REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`ECSClusterName`].OutputValue' \
    --output text)

echo "📋 Stack Outputs:"
echo "  Backend ECR: $BACKEND_ECR"
echo "  Frontend ECR: $FRONTEND_ECR"
echo "  Cluster: $CLUSTER_NAME"
echo "  Load Balancer: $ALB_URL"
echo ""

# Build and push Docker images
echo "🐳 Building and pushing Docker images..."
echo ""

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $BACKEND_ECR

# Build and push backend
echo "Building backend..."
cd ../backend
docker build -t $BACKEND_ECR:latest .
docker push $BACKEND_ECR:latest

# Build and push frontend
echo "Building frontend..."
cd ../frontend
docker build -t $FRONTEND_ECR:latest .
docker push $FRONTEND_ECR:latest

cd ../infrastructure

echo ""
echo "✅ Images pushed successfully!"
echo ""

# Update ECS services
echo "🔄 Updating ECS services..."
aws ecs update-service \
    --cluster $CLUSTER_NAME \
    --service gorillabooks-$ENVIRONMENT-backend \
    --force-new-deployment \
    --region $AWS_REGION \
    --no-cli-pager > /dev/null

aws ecs update-service \
    --cluster $CLUSTER_NAME \
    --service gorillabooks-$ENVIRONMENT-frontend \
    --force-new-deployment \
    --region $AWS_REGION \
    --no-cli-pager > /dev/null

echo "⏳ Waiting for services to stabilize..."
aws ecs wait services-stable \
    --cluster $CLUSTER_NAME \
    --services gorillabooks-$ENVIRONMENT-backend gorillabooks-$ENVIRONMENT-frontend \
    --region $AWS_REGION

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "📍 Your application is available at:"
echo "   $ALB_URL"
echo ""
echo "💡 To tear down everything, run:"
echo "   aws cloudformation delete-stack --stack-name $STACK_NAME --region $AWS_REGION"
echo ""
