# GorillaBooks - Detailed Deployment Specifications (Cost-Optimized)

## Complete Resource Breakdown

**Optimized for small deployments: 10 concurrent users, small datasets, no high-availability requirements**

### Networking Layer

#### VPC
- **CIDR Block**: 10.0.0.0/16 (65,536 IP addresses)
- **DNS Support**: Enabled
- **DNS Hostnames**: Enabled
- **Region**: us-east-1 (configurable)

#### Subnets (3 Total - Cost-Optimized)
1. **Public Subnet 1**
   - CIDR: 10.0.1.0/24 (256 IPs)
   - AZ: us-east-1a
   - Auto-assign public IP: Yes
   - Use: ECS tasks (backend/frontend), ALB

2. **Public Subnet 2**
   - CIDR: 10.0.2.0/24 (256 IPs)
   - AZ: us-east-1b
   - Auto-assign public IP: Yes
   - Use: ALB requires 2 AZs

3. **Private Subnet 1**
   - CIDR: 10.0.3.0/24 (256 IPs)
   - AZ: us-east-1a
   - Auto-assign public IP: No
   - Use: DocumentDB single instance (no replica)

#### Internet Gateway
- **Type**: Standard IGW
- **Attached to**: VPC
- **Purpose**: Public internet access for public subnets

#### Route Tables
- **Public Route Table**: Routes 0.0.0.0/0 → Internet Gateway
- **Associated with**: Public Subnet 1 & 2

#### Security Groups (3 Total)

1. **ALB Security Group**
   - Inbound:
     - Port 80 (HTTP) from 0.0.0.0/0
     - Port 443 (HTTPS) from 0.0.0.0/0
   - Outbound: All traffic
   - Purpose: Public access to application

2. **ECS Security Group**
   - Inbound:
     - Port 3000 from ALB Security Group (backend API)
     - Port 80 from ALB Security Group (frontend)
   - Outbound: All traffic
   - Purpose: Container communication

3. **DocumentDB Security Group**
   - Inbound:
     - Port 27017 from ECS Security Group only
   - Outbound: None needed
   - Purpose: Database isolation

---

## Database Layer

### DocumentDB Cluster

#### Cluster Specifications
- **Engine**: Amazon DocumentDB (MongoDB 4.0 compatible)
- **Cluster Type**: Single-master, multi-AZ capable
- **Cluster Identifier**: `gorillabooks-production-mongodb`
- **Master Username**: `gorillabooks`
- **Master Password**: Provided via parameter (min 8 chars)
- **Port**: 27017

#### Instance Configuration (Cost-Optimized)
- **Instance Count**: 1 (single instance, no replicas)
- **Instance Class**: `db.t4g.medium` (ARM-based Graviton2, ~10% cheaper than t3)
  - **vCPUs**: 2
  - **Memory**: 4 GB RAM
  - **Network Performance**: Up to 5 Gbps
  - **Storage**: Auto-scaling from 10 GB to 64 TB (SSD)
  - **I/O Performance**: Moderate (suitable for small workloads)

#### High Availability & Backup (Cost-Optimized)
- **Multi-AZ**: No (single AZ deployment for cost savings)
- **Backup Retention**: 1 day (reduced from 7 days)
- **Backup Window**: 03:00-04:00 UTC
- **Maintenance Window**: Monday 04:00-05:00 UTC
- **Automatic Backups**: Enabled
- **Snapshot Type**: Automated daily

#### DocumentDB Limitations (Important!)
- **Sharding**: NOT SUPPORTED in DocumentDB
  - DocumentDB is NOT a sharded cluster
  - Single-master with read replicas only
  - No native MongoDB sharding support
- **Maximum Database Size**: 64 TB per cluster
- **Maximum Connections**: ~1,000 concurrent connections per instance
- **Replica Set Name**: `rs0` (single replica set, not sharded)

#### Replication Configuration
- **Read Replicas**: 0 (default deployment)
  - Can add up to 15 read replicas
  - Replicas would be `db.t3.medium` instances in different AZs
- **Replication Lag**: Typically < 100ms
- **Read Preference**: `secondaryPreferred` (will use replicas when available)

#### Storage
- **Type**: SSD-backed
- **Encryption at Rest**: AWS KMS (default encryption)
- **Encryption in Transit**: TLS required
- **IOPS**: Burst up to 3,000 IOPS, baseline depends on size
- **Initial Allocation**: 10 GB (auto-grows)

#### Performance Characteristics (db.t3.medium)
- **Expected Throughput**: ~5,000 queries/second (simple reads)
- **Write Performance**: ~1,000 writes/second
- **Suitable For**:
  - Small to medium applications
  - <100 concurrent users
  - <10 GB active dataset
  - Development/staging environments

#### Cost (db.t4g.medium, us-east-1, Cost-Optimized)
- **Instance Cost**: ~$0.089/hour = ~$65/month (ARM-based Graviton2)
- **Storage**: $0.10/GB-month (~$1 for 10GB)
- **I/O**: $0.20 per million requests (~$1 for light usage)
- **Backup Storage**: $0.021/GB-month (1-day retention, minimal cost)
- **Estimated Total**: ~$67-70/month for small deployment

---

## Compute Layer

### ECS Fargate Cluster
- **Cluster Name**: `gorillabooks-production`
- **Launch Type**: FARGATE (serverless, no EC2 instances)
- **Container Insights**: Disabled (to save costs, can enable)

### Backend Task Definition

#### Resource Allocation
- **CPU**: 256 CPU units (0.25 vCPU)
- **Memory**: 512 MB
- **Network Mode**: `awsvpc` (each task gets ENI)
- **Platform Version**: LATEST

#### Container Configuration
- **Container Name**: `backend`
- **Image**: `{account}.dkr.ecr.us-east-1.amazonaws.com/gorillabooks-backend:latest`
- **Port Mapping**: 3000:3000 (TCP)
- **Essential**: Yes (task fails if this container stops)

#### Environment Variables
```
NODE_ENV=production
PORT=3000
JWT_SECRET={from CloudFormation parameter}
MONGODB_URI=mongodb://gorillabooks:{password}@{cluster-endpoint}:27017/gorillabooks?tls=true&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false
```

#### Logging (Cost-Optimized)
- **Log Driver**: awslogs
- **Log Group**: `/ecs/gorillabooks-production/backend`
- **Retention**: 3 days (reduced from 7 for cost savings)
- **Stream Prefix**: `ecs`

#### Performance Expectations
- **Memory Baseline**: ~150-200 MB at idle
- **CPU Baseline**: ~5-10% at idle
- **Handles**: ~100 concurrent requests
- **Auto-restarts**: On failure

### Frontend Task Definition

#### Resource Allocation
- **CPU**: 256 CPU units (0.25 vCPU)
- **Memory**: 512 MB
- **Network Mode**: `awsvpc`

#### Container Configuration
- **Container Name**: `frontend`
- **Image**: `{account}.dkr.ecr.us-east-1.amazonaws.com/gorillabooks-frontend:latest`
- **Port Mapping**: 80:80 (TCP)
- **Web Server**: Nginx (Alpine-based)
- **Essential**: Yes

#### Static Assets
- **React build**: Pre-built, served by Nginx
- **Nginx Config**: Proxies /api/* to backend ALB target
- **Gzip**: Enabled for text assets
- **Cache Headers**: Set for static assets

#### Logging (Cost-Optimized)
- **Log Driver**: awslogs
- **Log Group**: `/ecs/gorillabooks-production/frontend`
- **Retention**: 3 days (reduced from 7 for cost savings)

### ECS Services

#### Backend Service
- **Service Name**: `gorillabooks-production-backend`
- **Desired Count**: 1 task
- **Minimum Healthy**: 0% (allows full replacement)
- **Maximum Healthy**: 200% (allows blue/green deploys)
- **Deployment Type**: Rolling update
- **Health Check Grace Period**: 0 seconds
- **Load Balancer**: Attached to backend target group
- **Auto Scaling**: Not configured (can add)

#### Frontend Service
- **Service Name**: `gorillabooks-production-frontend`
- **Desired Count**: 1 task
- **Minimum Healthy**: 0%
- **Maximum Healthy**: 200%
- **Deployment Type**: Rolling update
- **Load Balancer**: Attached to frontend target group

#### Task Placement (Cost-Optimized)
- **Strategy**: Single AZ deployment (us-east-1a)
- **Network**: Public subnet 1 only (with public IPs)
- **Why Public Subnets**: No NAT Gateway (saves ~$32/month)
  - Tasks get public IPs
  - Egress to internet for package downloads
  - Ingress from ALB only
- **Why Single AZ**: Reduces cross-AZ data transfer costs, simpler deployment

---

## Load Balancing Layer

### Application Load Balancer

#### Configuration
- **Name**: `gorillabooks-production-alb`
- **Scheme**: internet-facing (publicly accessible)
- **IP Address Type**: IPv4
- **Subnets**: Public Subnet 1 & 2
- **Security Group**: ALB Security Group

#### Target Groups (2 Total)

1. **Backend Target Group**
   - **Name**: `gorillabooks-production-backend-tg`
   - **Port**: 3000
   - **Protocol**: HTTP
   - **Target Type**: IP (Fargate)
   - **Health Check**:
     - Path: `/health`
     - Interval: 30 seconds
     - Timeout: 5 seconds
     - Healthy threshold: 2 consecutive successes
     - Unhealthy threshold: 3 consecutive failures
     - Success codes: 200
   - **Deregistration Delay**: 30 seconds

2. **Frontend Target Group**
   - **Name**: `gorillabooks-production-frontend-tg`
   - **Port**: 80
   - **Protocol**: HTTP
   - **Target Type**: IP
   - **Health Check**:
     - Path: `/`
     - Interval: 30 seconds
     - Timeout: 5 seconds
     - Healthy threshold: 2
     - Unhealthy threshold: 3
     - Success codes: 200

#### Listeners & Routing

1. **HTTP Listener (Port 80)**
   - **Default Action**: Forward to frontend target group
   - **Rule 1** (Priority 1):
     - Condition: Path is `/api/*` OR `/health`
     - Action: Forward to backend target group
   - **Rule 2** (Default):
     - Condition: All other paths
     - Action: Forward to frontend target group

#### Request Flow
```
User → ALB (Port 80) →
  /api/* → Backend Target Group → Backend Task (Port 3000)
  /*     → Frontend Target Group → Frontend Task (Port 80)
```

#### Performance
- **Connection Idle Timeout**: 60 seconds
- **Cross-Zone Load Balancing**: Enabled
- **Access Logs**: Disabled (to save costs)
- **Request Tracing**: Disabled

---

## Container Registry

### ECR Repositories (2 Total)

#### Backend Repository
- **Name**: `gorillabooks-backend`
- **Image Scanning**: Enabled on push
- **Encryption**: AES-256
- **Lifecycle Policy**: Keep last 10 images, delete older
- **Tag Immutability**: Disabled (allows overwriting tags)

#### Frontend Repository
- **Name**: `gorillabooks-frontend`
- **Image Scanning**: Enabled
- **Encryption**: AES-256
- **Lifecycle Policy**: Keep last 10 images
- **Tag Immutability**: Disabled

#### Image Sizes (Approximate)
- **Backend Image**: ~150-200 MB (Node.js + dependencies)
- **Frontend Image**: ~50-80 MB (Nginx + React build)

---

## Monitoring & Logging

### CloudWatch Log Groups

1. **Backend Logs**
   - **Path**: `/ecs/gorillabooks-production/backend`
   - **Retention**: 7 days
   - **Logs Include**:
     - Application logs (console.log)
     - HTTP request logs (Morgan)
     - Error traces
     - Database connection logs

2. **Frontend Logs**
   - **Path**: `/ecs/gorillabooks-production/frontend`
   - **Retention**: 7 days
   - **Logs Include**:
     - Nginx access logs
     - Nginx error logs

### CloudWatch Metrics (Automatic)

#### ECS Metrics
- Task CPU utilization
- Task memory utilization
- Network bytes in/out

#### ALB Metrics
- Request count
- Target response time
- Healthy/unhealthy host count
- HTTP 4xx/5xx errors

#### DocumentDB Metrics
- CPU utilization
- Database connections
- Read/write latency
- Network throughput

---

## IAM Roles & Permissions

### ECS Task Execution Role
- **Purpose**: Pull images from ECR, write logs to CloudWatch
- **Managed Policy**: `AmazonECSTaskExecutionRolePolicy`
- **Permissions**:
  - `ecr:GetAuthorizationToken`
  - `ecr:BatchCheckLayerAvailability`
  - `ecr:GetDownloadUrlForLayer`
  - `ecr:BatchGetImage`
  - `logs:CreateLogStream`
  - `logs:PutLogEvents`

**Note**: No task role is configured (tasks run without AWS API access)

---

## Resource Limits & Quotas

### Per AWS Account Defaults (us-east-1)
- **VPCs**: 5 (we use 1)
- **ECS Clusters**: 10,000 (we use 1)
- **Fargate Tasks per Service**: 1,000 (we use 1 each)
- **ALBs**: 50 (we use 1)
- **Target Groups**: 3,000 (we use 2)
- **DocumentDB Instances**: 40 (we use 1)

### Scaling Considerations

#### Current Capacity
- **Database**: Supports ~100 concurrent users
- **Backend**: ~100 concurrent API requests
- **Frontend**: ~1,000 concurrent connections (Nginx)

#### To Scale Up
1. **Add read replicas** to DocumentDB (for read-heavy loads)
2. **Increase task count** (DesiredCount: 2-5)
3. **Upgrade instance classes** (db.r5.large, 512 CPU units)
4. **Add auto-scaling** policies

---

## Total Resource Count

| Resource Type | Count | Purpose |
|---------------|-------|---------|
| VPC | 1 | Network isolation |
| Subnets | 3 | 2 public, 1 private (single AZ) |
| Internet Gateway | 1 | Public internet access |
| Route Tables | 1 | Routing configuration |
| Security Groups | 3 | Network security |
| ECR Repositories | 2 | Container images |
| DocumentDB Cluster | 1 | Database cluster |
| DocumentDB Instances | 1 | Database compute |
| ECS Cluster | 1 | Container orchestration |
| ECS Task Definitions | 2 | Container specs |
| ECS Services | 2 | Running tasks |
| ECS Tasks (running) | 2 | Actual containers |
| Application Load Balancer | 1 | Traffic distribution |
| Target Groups | 2 | Backend + frontend |
| ALB Listeners | 1 | HTTP listener |
| ALB Rules | 1 | Path-based routing |
| CloudWatch Log Groups | 2 | Application logs |
| IAM Roles | 1 | Task execution |
| **TOTAL** | **28** | **Cost-optimized stack** |

---

## Cost Breakdown (Monthly, us-east-1) - Cost-Optimized

| Service | Specification | Cost |
|---------|---------------|------|
| ECS Fargate - Backend | 1 task × 0.25 vCPU × 0.5 GB × 730 hrs, single AZ | ~$15 |
| ECS Fargate - Frontend | 1 task × 0.25 vCPU × 0.5 GB × 730 hrs, single AZ | ~$15 |
| DocumentDB - Instance | 1 × db.t4g.medium × 730 hrs (ARM Graviton2) | ~$65 |
| DocumentDB - Storage | ~10 GB | ~$1 |
| DocumentDB - I/O | Light usage | ~$1 |
| DocumentDB - Backup | 1-day retention | <$1 |
| Application Load Balancer | 730 hrs | ~$16 |
| ALB - LCU (processing) | Light usage | ~$2 |
| ECR - Storage | ~0.3 GB (10 images) | <$1 |
| CloudWatch Logs | ~0.5 GB/month, 3-day retention | <$1 |
| Data Transfer - Out | ~5 GB/month | <$1 |
| **TOTAL** | | **~$117/month** |

**Savings from original: ~$10/month (8% reduction)**

Key optimizations:
- db.t4g.medium (ARM) instead of db.t3.medium: -$8/month
- 1-day backup retention instead of 7 days: -$1/month
- 3-day log retention instead of 7 days: -$1/month
- Single AZ deployment (reduced cross-AZ transfer): minimal savings

### Further Cost Optimization Options

1. **Stop services when not in use**: Save ~$30/month (ECS tasks)
   ```bash
   aws ecs update-service --cluster gorillabooks-production \
     --service gorillabooks-production-backend --desired-count 0
   ```

2. **Use MongoDB Atlas free tier**: Save ~$65/month (but requires external service, lose AWS integration)

3. **Schedule auto-start/stop**: Use Lambda + EventBridge to stop services during off-hours

4. **Smallest possible DocumentDB**: Already using smallest practical instance (db.t4g.medium)

---

## Performance Expectations

### Throughput
- **API Requests**: ~100-200 req/sec (single backend task)
- **Static Assets**: ~1,000 req/sec (Nginx frontend)
- **Database Queries**: ~5,000 reads/sec, ~1,000 writes/sec

### Latency
- **ALB → Task**: <10ms
- **Backend → Database**: <5ms (same VPC)
- **End-to-End (p50)**: ~50-100ms
- **End-to-End (p99)**: ~200-500ms

### Concurrent Users
- **Supported**: ~100-200 concurrent users
- **Database Connections**: Max 1,000 (pool of ~50 recommended)

---

## Important Notes

### What This Is NOT
- **Not globally distributed** (single region)
- **Not highly available** (single task per service)
- **Not auto-scaling** (fixed 1 task count)
- **Not sharded database** (DocumentDB doesn't support sharding)
- **Not HTTPS** (unless certificate provided)
- **Not CDN-backed** (no CloudFront)

### What This IS
- ✅ Production-ready for small applications
- ✅ Easy to reproduce in any AWS account
- ✅ Fully automated deployment
- ✅ Monitored and logged
- ✅ Isolated and secure
- ✅ Cost-effective for startups
- ✅ Horizontally scalable (add tasks/replicas)

### Recommended For
- Startup MVPs
- Internal tools
- Development/staging environments
- Applications with <1,000 users
- Budget-conscious deployments

### NOT Recommended For
- High-traffic production (>10,000 req/min)
- Mission-critical systems requiring 99.99% uptime
- Global applications (use multi-region)
- Applications requiring MongoDB sharding
- PCI/HIPAA compliance (needs additional controls)
