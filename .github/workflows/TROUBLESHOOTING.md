# GitHub Actions Troubleshooting

## AWS Credentials Issues

### Error: "AWS_REGION and AWS_ROLE_ARN env vars are not making it to the aws credentials provider"

**Cause:** GitHub Secrets and Variables are configured incorrectly or missing.

**Solution:**

1. **Verify AWS_ROLE_ARN is set as a Secret (NOT a Variable)**
   - Go to: Repository Settings → Secrets and variables → Actions → **Secrets** tab
   - Click "New repository secret"
   - Name: `AWS_ROLE_ARN`
   - Value: Your IAM role ARN (e.g., `arn:aws:iam::123456789012:role/GitHubActionsRole`)
   - ⚠️ **Important**: Must be a **Secret**, not a Variable

2. **Verify AWS_REGION (Optional)**
   - Option A: Use the default (workflow defaults to `us-west-2`)
   - Option B: Set as a Repository Variable
     - Go to: Repository Settings → Secrets and variables → Actions → **Variables** tab
     - Click "New repository variable"
     - Name: `AWS_REGION`
     - Value: Your region (e.g., `us-west-2`)

3. **Check the workflow file**
   ```yaml
   # The workflow should have:
   env:
     AWS_REGION: ${{ vars.AWS_REGION || 'us-west-2' }}

   # And in the deploy jobs:
   - name: Configure AWS credentials
     uses: aws-actions/configure-aws-credentials@v4
     with:
       role-to-assume: ${{ secrets.AWS_ROLE_ARN }}  # Must use secrets
       aws-region: ${{ env.AWS_REGION }}             # Can use env
   ```

### Error: "Error: Could not assume role with OIDC"

**Cause:** The IAM role trust policy doesn't allow GitHub Actions to assume the role.

**Solution:** Check your IAM role trust policy includes GitHub as a trusted entity:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::YOUR_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:YOUR_ORG/YOUR_REPO:*"
        }
      }
    }
  ]
}
```

See `infrastructure/GITHUB_OIDC_SETUP.md` for detailed setup instructions.

## CloudFormation Stack Issues

### Error: Stack in ROLLBACK_COMPLETE state

**Cause:** A previous deployment failed and CloudFormation rolled back all changes.

**Solution:** Delete the failed stack before redeploying:

```bash
# Delete the failed stack
aws cloudformation delete-stack \
  --stack-name gorillabooks-production \
  --region us-west-2

# Wait for deletion to complete
aws cloudformation wait stack-delete-complete \
  --stack-name gorillabooks-production \
  --region us-west-2

# Then re-run your deployment
```

### Error: Target group name too long

**Cause:** AWS has a 32-character limit for target group names.

**Solution:** Already fixed in the template. Target groups now use shortened names:
- `gorillabooks-production-be-tg` (backend)
- `gorillabooks-production-fe-tg` (frontend)

### Error: MongoDBSubnetGroup - "Internal Failure"

**Cause:** DocumentDB requires subnet groups to span at least 2 different Availability Zones.

**Solution:** Already fixed in the template. Now creates 2 private subnets:
- `PrivateSubnet1` in AZ 0 (10.0.3.0/24)
- `PrivateSubnet2` in AZ 1 (10.0.4.0/24)

## Common GitHub Actions Issues

### Workflow not running on push to main

**Check:**
1. Workflow file is in `.github/workflows/` directory
2. File has `.yml` or `.yaml` extension
3. Branch name matches exactly (case-sensitive)
4. No syntax errors in YAML (use a YAML validator)

### Deployment jobs not running

**Check:**
1. Tests passed (deployment requires tests to pass first)
2. Pushing to `main` branch (deployment only runs on `main`)
3. Not a pull request (deployment skipped on PRs)

### Cache errors

The workflow is configured **without** npm caching to avoid cache-related errors. If you want to add caching:

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '18'
    cache: 'npm'
    cache-dependency-path: backend/package-lock.json
```

But you'll need to commit `package-lock.json` files first.

## Debugging Tips

### View detailed logs

1. Go to your repository on GitHub
2. Click "Actions" tab
3. Click on the failed workflow run
4. Click on the failed job
5. Expand the failed step to see detailed error messages

### Enable debug logging

Add these secrets to your repository for more verbose logging:

- `ACTIONS_STEP_DEBUG` = `true`
- `ACTIONS_RUNNER_DEBUG` = `true`

### Test locally

You can test parts of the workflow locally:

```bash
# Test linting
npm run lint

# Test type checking
npm run type-check

# Test backend
cd backend && npm test

# Test infrastructure deployment (requires AWS CLI configured)
cd infrastructure
export AWS_REGION=us-west-2
export ENVIRONMENT=production
./deploy.sh
```

## Getting Help

If you're still stuck:

1. Check the [GitHub Actions documentation](https://docs.github.com/actions)
2. Review the workflow file: `.github/workflows/ci-cd.yml`
3. Check AWS IAM role permissions and trust policy
4. Verify all required secrets are set correctly
