# GitHub OIDC Setup for AWS Deployment

## Overview

GitHub OIDC (OpenID Connect) allows GitHub Actions to authenticate to AWS without storing long-lived credentials (access keys). Instead, GitHub generates short-lived tokens that AWS trusts.

## What You Already Have

Since you mentioned OIDC is already set up, you should have:

1. ✅ IAM OIDC Identity Provider in AWS for GitHub
2. ✅ IAM Role with trust policy for your GitHub repository
3. ✅ Permissions attached to that role

## GitHub Actions Configuration

### Option 1: Store Role ARN as Secret (Recommended for Flexibility)

If you manage multiple environments or might change the role:

**GitHub Secret Required:**
```
AWS_ROLE_ARN=arn:aws:iam::123456789012:role/GitHubActionsRole
```

**Workflow (current setup):**
```yaml
- name: Configure AWS credentials
  uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
    aws-region: us-east-1
```

### Option 2: Hardcode Role ARN (Zero Secrets Required!)

If the role ARN never changes:

**No GitHub secrets needed!**

**Update workflow to:**
```yaml
env:
  AWS_REGION: us-east-1
  STACK_NAME: gorillabooks-production
  AWS_ROLE_ARN: arn:aws:iam::123456789012:role/GitHubActionsRole  # Your actual role ARN

# ... then in the job:
- name: Configure AWS credentials
  uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: ${{ env.AWS_ROLE_ARN }}
    aws-region: ${{ env.AWS_REGION }}
```

## IAM Role Trust Policy

Your IAM role should have a trust policy like this:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:YOUR_GITHUB_ORG/gorillabooks:*"
        }
      }
    }
  ]
}
```

Replace:
- `123456789012` with your AWS account ID
- `YOUR_GITHUB_ORG` with your GitHub username/org

## Required IAM Permissions

Your role needs these permissions (attach as policies):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudformation:*",
        "ec2:*",
        "ecs:*",
        "ecr:*",
        "rds:*",
        "docdb:*",
        "logs:*",
        "iam:GetRole",
        "iam:CreateRole",
        "iam:DeleteRole",
        "iam:AttachRolePolicy",
        "iam:DetachRolePolicy",
        "iam:PutRolePolicy",
        "iam:DeleteRolePolicy",
        "iam:PassRole",
        "secretsmanager:CreateSecret",
        "secretsmanager:GetSecretValue",
        "secretsmanager:PutSecretValue",
        "secretsmanager:DeleteSecret",
        "elasticloadbalancing:*"
      ],
      "Resource": "*"
    }
  ]
}
```

Or use AWS managed policies:
- `PowerUserAccess` (broad access, easy)
- Or custom policies for least privilege

## How It Works

1. **GitHub Action runs** → Requests OIDC token from GitHub
2. **OIDC token** → Contains claims about repo, branch, workflow
3. **AWS validates token** → Checks trust policy conditions
4. **Assumes role** → Gets temporary credentials (valid ~1 hour)
5. **Deploys infrastructure** → Uses temporary credentials
6. **Credentials expire** → After workflow completes

## Verification

Check if OIDC is working:

```bash
# List OIDC providers in your AWS account
aws iam list-open-id-connect-providers

# Check if GitHub OIDC provider exists
aws iam get-open-id-connect-provider \
  --open-id-connect-provider-arn arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com

# Check role trust policy
aws iam get-role --role-name GitHubActionsRole --query 'Role.AssumeRolePolicyDocument'
```

## Summary

### With OIDC + Secret (Current Setup):
- **GitHub Secrets Needed**: 1 (`AWS_ROLE_ARN`)
- **Pros**: Flexible, can change role without updating workflow
- **Cons**: Need to manage one secret

### With OIDC + Hardcoded ARN:
- **GitHub Secrets Needed**: 0 (completely zero!)
- **Pros**: Absolutely zero secrets to manage
- **Cons**: Need to update workflow file if role changes

Both are secure - OIDC means no long-lived credentials anywhere!

## Choose Your Approach

**For most users**: Option 2 (hardcode ARN) is simplest - **truly zero secrets required!**

Just update the workflow file with your actual role ARN and you're done.
