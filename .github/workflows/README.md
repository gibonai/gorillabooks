# CI/CD Workflow

This directory contains the GitHub Actions workflow for continuous integration and deployment.

## Workflow: `ci-cd.yml`

A single, unified workflow that handles linting, testing, building, and deployment with proper job dependencies.

### Triggers

- **Push to `main` or `develop`**: Runs lint/test on both branches, but only deploys from `main`
- **Pull Requests to `main` or `develop`**: Runs lint/test only (no deployment)
- **Manual**: Can be triggered via workflow_dispatch

### Jobs

The workflow consists of 4 jobs with the following dependency chain:

```
backend-lint-test ─┐
                   ├─> deploy-infrastructure ─> deploy-application
frontend-lint-test ─┘
```

#### 1. `backend-lint-test`
- Installs backend dependencies with npm ci
- Runs ESLint
- Runs TypeScript type checking
- Runs Jest unit tests
- **Blocks deployment** if any checks fail

#### 2. `frontend-lint-test`
- Installs frontend dependencies with npm ci
- Runs ESLint
- Runs TypeScript type checking
- **Blocks deployment** if any checks fail

#### 3. `deploy-infrastructure`
- **Depends on**: Both lint/test jobs passing
- **Only runs on**: `main` branch (not PRs or `develop`)
- Deploys CloudFormation stack
- Creates/updates:
  - VPC and networking
  - ECS cluster and services
  - Application Load Balancer
  - ECR repositories
  - Auto-generated secrets in Secrets Manager
  - Optional: ACM certificate and Route53 DNS (if domain configured)
- Outputs ECR repository URIs and cluster name for next job

#### 4. `deploy-application`
- **Depends on**: Infrastructure deployment completing
- **Only runs on**: `main` branch (not PRs or `develop`)
- Builds Docker images for backend and frontend
- Pushes images to ECR
- Forces ECS service updates
- Waits for services to stabilize
- Displays application URL

### Configuration

Edit environment variables at the top of `ci-cd.yml`:

```yaml
env:
  AWS_REGION: us-west-2
  STACK_NAME: gorillabooks-production
  # Optional: Set these to enable custom domain with HTTPS
  DOMAIN_NAME: ''  # e.g., gorillabooks.net
  HOSTED_ZONE_ID: ''  # e.g., Z1234567890ABC
```

### Required GitHub Secrets

**Required:**
- `AWS_ROLE_ARN` - IAM role ARN for OIDC authentication (see `infrastructure/GITHUB_OIDC_SETUP.md`)
  - Example: `arn:aws:iam::123456789012:role/GitHubActionsRole`
  - Set in: Repository Settings → Secrets and variables → Actions → Secrets

**Optional Repository Variables:**
- `AWS_REGION` - AWS region to deploy to (defaults to `us-west-2` if not set)
  - Example: `us-west-2`
  - Set in: Repository Settings → Secrets and variables → Actions → Variables

### Optional: Custom Domain

To enable HTTPS with a custom domain:

1. Ensure you have a Route53 hosted zone in AWS
2. Set `DOMAIN_NAME` and `HOSTED_ZONE_ID` in the workflow file
3. Push to main - the workflow will automatically create ACM certificates and configure DNS

See `infrastructure/DOMAIN_SETUP.md` for detailed instructions.

### Workflow Behavior

| Branch | Push | Pull Request |
|--------|------|--------------|
| `main` | ✅ Lint → Test → Build → Deploy | ✅ Lint → Test only |
| `develop` | ✅ Lint → Test only | ✅ Lint → Test only |
| Other | ❌ No workflow | ❌ No workflow |

### Troubleshooting

**Cache errors**: The workflow uses `cache-dependency-path` to specify exact package-lock.json locations, which prevents cache errors in GitHub Actions.

**Deployment blocked**: If infrastructure or application deployment fails, check:
- CloudFormation stack events in AWS console
- ECS task logs in CloudWatch
- ECR repository permissions
- Secrets Manager secrets are created

**Tests failing**: Fix lint/test errors before merging to `main` - the deployment jobs won't run if tests fail.

### Local Testing

You can test the deployment steps locally:

```bash
# Test backend
cd backend
npm ci
npm run lint
npm run type-check
npm test

# Test frontend
cd frontend
npm ci
npm run lint
npm run type-check

# Test infrastructure deployment
cd infrastructure
./deploy.sh
```
