# Custom Domain Configuration

GorillaBooks supports automatic HTTPS setup with your custom domain. Just provide the domain name and Route53 Hosted Zone ID - everything else is handled automatically!

## What Gets Created Automatically

When you provide a domain name:

1. ✅ **ACM Certificate** - Auto-created and validated via DNS
2. ✅ **HTTPS Listener** - ALB configured for port 443 with certificate
3. ✅ **HTTP → HTTPS Redirect** - Automatic redirect from HTTP to HTTPS
4. ✅ **Route53 A Record** - Domain points to your ALB
5. ✅ **SSL/TLS Termination** - Handled at the ALB

## Prerequisites

1. **Domain registered** (anywhere - AWS Route53, GoDaddy, Namecheap, etc.)
2. **Route53 Hosted Zone** created in AWS for your domain
3. **Domain nameservers** pointing to AWS Route53

### Setting Up Route53 Hosted Zone

If you don't have a hosted zone yet:

```bash
# Create hosted zone
aws route53 create-hosted-zone \
  --name gorillabooks.example.com \
  --caller-reference $(date +%s)

# Get the nameservers
aws route53 get-hosted-zone \
  --id /hostedzone/Z1234567890ABC \
  --query 'DelegationSet.NameServers' \
  --output table
```

Update your domain registrar to use the AWS nameservers provided.

### Getting Your Hosted Zone ID

```bash
# List all hosted zones
aws route53 list-hosted-zones \
  --query 'HostedZones[*].[Name,Id]' \
  --output table

# Or get ID for specific domain
aws route53 list-hosted-zones \
  --query 'HostedZones[?Name==`gorillabooks.example.com.`].Id' \
  --output text
```

## Deployment Methods

### Option 1: GitHub Actions (Edit Workflow File)

Simply edit `.github/workflows/deploy.yml` in your repo:

```yaml
env:
  AWS_REGION: us-west-2
  STACK_NAME: gorillabooks-production
  DOMAIN_NAME: 'gorillabooks.net'        # Your domain
  HOSTED_ZONE_ID: 'Z1234567890ABC'       # Your Route53 zone ID
```

**No secrets needed!** Domain names and zone IDs are public information.

Then commit and push:

```bash
git add .github/workflows/deploy.yml
git commit -m "Configure custom domain"
git push origin main
```

### Option 2: Deploy Script (Environment Variables)

Set environment variables before running the deploy script:

```bash
export DOMAIN_NAME=gorillabooks.example.com
export HOSTED_ZONE_ID=Z1234567890ABC

cd infrastructure
./deploy.sh
```

### Option 3: CloudFormation Direct

```bash
aws cloudformation deploy \
  --template-file infrastructure/cloudformation/main.yml \
  --stack-name gorillabooks-production \
  --parameter-overrides \
    Environment=production \
    AppName=gorillabooks \
    DomainName=gorillabooks.example.com \
    HostedZoneId=Z1234567890ABC \
  --capabilities CAPABILITY_IAM \
  --region us-west-2
```

## What Happens During Deployment

### 1. ACM Certificate Creation (~5-10 minutes)

CloudFormation creates an ACM certificate with DNS validation:

```yaml
Certificate:
  Type: AWS::CertificateManager::Certificate
  Properties:
    DomainName: gorillabooks.example.com
    ValidationMethod: DNS
    DomainValidationOptions:
      - DomainName: gorillabooks.example.com
        HostedZoneId: Z1234567890ABC
```

The DNS validation records are automatically added to your Route53 zone. ACM validates ownership and issues the certificate.

### 2. ALB HTTPS Listener

ALB gets a new HTTPS listener on port 443:

```yaml
ALBListenerHTTPS:
  Type: AWS::ElasticLoadBalancingV2::Listener
  Properties:
    Port: 443
    Protocol: HTTPS
    Certificates:
      - CertificateArn: !Ref Certificate
```

### 3. HTTP to HTTPS Redirect

HTTP listener (port 80) redirects all traffic to HTTPS:

```yaml
DefaultActions:
  - Type: redirect
    RedirectConfig:
      Protocol: HTTPS
      Port: '443'
      StatusCode: HTTP_301
```

### 4. Route53 A Record

Your domain points to the ALB:

```yaml
DNSRecord:
  Type: AWS::Route53::RecordSet
  Properties:
    Name: gorillabooks.example.com
    Type: A
    AliasTarget:
      DNSName: !GetAtt ALB.DNSName
```

## Accessing Your Application

### With Custom Domain

After deployment completes (~10-15 minutes including certificate validation):

```
https://gorillabooks.example.com
```

All HTTP traffic automatically redirects to HTTPS!

### Without Custom Domain

If you don't provide a domain, the app is accessible via ALB DNS:

```bash
# Get ALB URL
aws cloudformation describe-stacks \
  --stack-name gorillabooks-production \
  --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerURL`].OutputValue' \
  --output text
```

Output: `http://gorillabooks-production-alb-123456789.us-west-2.elb.amazonaws.com`

## Certificate Validation Timeline

| Stage | Duration | What's Happening |
|-------|----------|------------------|
| Stack creation starts | 0 min | CloudFormation begins |
| Certificate requested | 1-2 min | ACM certificate created |
| DNS validation records added | 2-3 min | Route53 records auto-created |
| DNS propagation | 3-5 min | DNS changes propagate |
| Certificate issued | 5-10 min | ACM validates and issues cert |
| ALB listener configured | 10-12 min | HTTPS listener created |
| DNS record created | 12-13 min | Domain points to ALB |
| **Stack complete** | **~15 min** | **Ready to use!** |

## Verification

### Check Certificate Status

```bash
# Get certificate ARN from stack
CERT_ARN=$(aws cloudformation describe-stack-resources \
  --stack-name gorillabooks-production \
  --query 'StackResources[?ResourceType==`AWS::CertificateManager::Certificate`].PhysicalResourceId' \
  --output text)

# Check certificate status
aws acm describe-certificate \
  --certificate-arn $CERT_ARN \
  --query 'Certificate.Status' \
  --output text
```

Should show: `ISSUED`

### Check DNS Record

```bash
# Check if domain resolves to ALB
dig gorillabooks.example.com

# Or with nslookup
nslookup gorillabooks.example.com
```

### Test HTTPS

```bash
# Test HTTPS endpoint
curl -I https://gorillabooks.example.com

# Should return 200 OK with valid certificate
```

## Troubleshooting

### Certificate Stuck in "Pending Validation"

**Problem**: ACM certificate not validating after 30+ minutes

**Solution**:
1. Check Route53 has DNS validation records:
   ```bash
   aws route53 list-resource-record-sets \
     --hosted-zone-id Z1234567890ABC \
     --query 'ResourceRecordSets[?Type==`CNAME`]'
   ```
2. Verify nameservers are correct at your domain registrar
3. DNS propagation can take up to 48 hours (usually <1 hour)

### Domain Not Resolving

**Problem**: Domain doesn't resolve to ALB

**Solution**:
1. Check Route53 A record exists:
   ```bash
   aws route53 list-resource-record-sets \
     --hosted-zone-id Z1234567890ABC \
     --query 'ResourceRecordSets[?Name==`gorillabooks.example.com.`]'
   ```
2. Verify hosted zone ID is correct
3. Wait for DNS propagation (can take 5-10 minutes)

### Certificate Domain Mismatch

**Problem**: Browser shows certificate error

**Solution**:
1. Ensure domain in certificate matches your access URL exactly
2. Check for `www` vs non-`www` mismatch
3. Certificate covers: `gorillabooks.example.com` (not `www.gorillabooks.example.com`)

### HTTP Not Redirecting to HTTPS

**Problem**: HTTP traffic doesn't redirect to HTTPS

**Solution**:
1. Verify custom domain was provided during deployment
2. Check ALB listeners:
   ```bash
   aws elbv2 describe-listeners \
     --load-balancer-arn $(aws elbv2 describe-load-balancers \
       --names gorillabooks-production-alb \
       --query 'LoadBalancers[0].LoadBalancerArn' \
       --output text)
   ```
3. Should show port 80 (redirect) and port 443 (HTTPS)

## Removing Custom Domain

To remove custom domain and revert to ALB DNS:

```bash
# Update stack without domain parameters
aws cloudformation deploy \
  --template-file infrastructure/cloudformation/main.yml \
  --stack-name gorillabooks-production \
  --parameter-overrides \
    Environment=production \
    AppName=gorillabooks \
  --capabilities CAPABILITY_IAM
```

This will:
- Delete the ACM certificate
- Remove HTTPS listener
- Remove Route53 A record
- Restore HTTP-only access via ALB DNS

## Cost Impact

Adding a custom domain costs:

| Resource | Cost |
|----------|------|
| ACM Certificate | **$0/month** (free!) |
| Route53 Hosted Zone | $0.50/month |
| Route53 Queries | $0.40 per million queries (~$0.01/month for low traffic) |
| ALB HTTPS Processing | Same as HTTP (no extra cost) |

**Total added cost: ~$0.51/month**

## Wildcard Certificates (Future Enhancement)

Current setup creates a certificate for the exact domain. To support subdomains (e.g., `api.gorillabooks.example.com`, `*.gorillabooks.example.com`), you would need to:

1. Request wildcard certificate: `*.gorillabooks.example.com`
2. Add Subject Alternative Names (SANs) to certificate
3. Configure additional Route53 records

This can be added if needed!

## Summary

**Super simple setup:**
1. Create Route53 hosted zone
2. Set `DOMAIN_NAME` and `HOSTED_ZONE_ID` environment variables
3. Deploy
4. Wait ~15 minutes for certificate validation
5. Access your app at `https://your-domain.com`

Everything else (certificate, HTTPS, DNS) is automatic!
