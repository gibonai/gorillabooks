import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as docdb from 'aws-cdk-lib/aws-docdb';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';

export interface GorillaBooksStackProps extends cdk.StackProps {
  /**
   * Custom domain name (e.g., gorillabooks.net)
   * If provided, will create ACM certificate and Route53 record
   */
  domainName?: string;

  /**
   * Hosted Zone ID for the domain
   * Required if domainName is provided
   */
  hostedZoneId?: string;

  /**
   * Environment name
   * @default 'production'
   */
  environment?: string;

  /**
   * Application name
   * @default 'gorillabooks'
   */
  appName?: string;
}

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: GorillaBooksStackProps) {
    super(scope, id, props);

    const appName = props?.appName || 'gorillabooks';
    const environment = props?.environment || 'production';

    // VPC with public and private subnets across 2 AZs
    // This automatically creates proper subnetting for DocumentDB
    const vpc = new ec2.Vpc(this, 'VPC', {
      maxAzs: 2,
      natGateways: 0, // Cost optimization: no NAT gateways
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    // ECR Repository for the consolidated app image
    const repository = new ecr.Repository(this, 'AppRepository', {
      repositoryName: `${appName}-app`,
      imageScanOnPush: true,
      lifecycleRules: [
        {
          description: 'Keep last 10 images',
          maxImageCount: 10,
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For dev/testing
    });

    // JWT Secret - auto-generated
    const jwtSecret = new secretsmanager.Secret(this, 'JWTSecret', {
      secretName: `${appName}-${environment}-jwt-secret`,
      description: 'JWT signing secret for GorillaBooks',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({}),
        generateStringKey: 'secret',
        passwordLength: 64,
        excludeCharacters: '"@/\\\'',
      },
    });

    // DocumentDB Cluster with auto-generated credentials
    const dbCluster = new docdb.DatabaseCluster(this, 'Database', {
      masterUser: {
        username: appName,
      },
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T4G,
        ec2.InstanceSize.MEDIUM
      ),
      instances: 1,
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      backup: {
        retention: cdk.Duration.days(1),
        preferredWindow: '03:00-04:00',
      },
      preferredMaintenanceWindow: 'mon:04:00-mon:05:00',
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For dev/testing
    });

    // ECS Cluster
    const cluster = new ecs.Cluster(this, 'Cluster', {
      vpc,
      clusterName: `${appName}-${environment}`,
    });

    // Handle custom domain and certificate
    let certificate: acm.ICertificate | undefined;
    let domainZone: route53.IHostedZone | undefined;

    if (props?.domainName && props?.hostedZoneId) {
      // Look up existing hosted zone
      domainZone = route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
        hostedZoneId: props.hostedZoneId,
        zoneName: props.domainName,
      });

      // Create ACM certificate with DNS validation
      certificate = new acm.Certificate(this, 'Certificate', {
        domainName: props.domainName,
        validation: acm.CertificateValidation.fromDns(domainZone),
      });
    }

    // Single Fargate Service with ALB
    // This serves both the API and frontend static files
    const service = new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'Service', {
      cluster,
      serviceName: `${appName}-${environment}`,
      cpu: 256,
      memoryLimitMiB: 512,
      desiredCount: 1,
      taskImageOptions: {
        image: ecs.ContainerImage.fromEcrRepository(repository, 'latest'),
        containerName: 'app',
        containerPort: 3000,
        environment: {
          NODE_ENV: 'production',
          PORT: '3000',
        },
        secrets: {
          // MongoDB connection string with credentials
          MONGODB_URI: ecs.Secret.fromSecretsManager(
            dbCluster.secret!,
            'uri'
          ),
          // JWT secret
          JWT_SECRET: ecs.Secret.fromSecretsManager(jwtSecret, 'secret'),
        },
        logDriver: ecs.LogDrivers.awsLogs({
          streamPrefix: appName,
          logRetention: 3, // 3 days retention for cost optimization
        }),
      },
      // Custom domain configuration (optional)
      ...(certificate && domainZone && {
        certificate,
        domainName: props?.domainName,
        domainZone,
      }),
      publicLoadBalancer: true,
      assignPublicIp: true, // Tasks in public subnets (no NAT gateway needed)
    });

    // Allow ECS tasks to connect to DocumentDB
    dbCluster.connections.allowDefaultPortFrom(
      service.service,
      'Allow ECS tasks to connect to DocumentDB'
    );

    // Health check configuration
    service.targetGroup.configureHealthCheck({
      path: '/health',
      interval: cdk.Duration.seconds(30),
      timeout: cdk.Duration.seconds(5),
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 3,
    });

    // Outputs
    new cdk.CfnOutput(this, 'RepositoryUri', {
      value: repository.repositoryUri,
      description: 'ECR Repository URI',
      exportName: `${appName}-${environment}-repository-uri`,
    });

    new cdk.CfnOutput(this, 'LoadBalancerURL', {
      value: `https://${service.loadBalancer.loadBalancerDnsName}`,
      description: 'Application Load Balancer URL',
      exportName: `${appName}-${environment}-alb-url`,
    });

    new cdk.CfnOutput(this, 'ClusterName', {
      value: cluster.clusterName,
      description: 'ECS Cluster Name',
      exportName: `${appName}-${environment}-cluster-name`,
    });

    new cdk.CfnOutput(this, 'ServiceName', {
      value: service.service.serviceName,
      description: 'ECS Service Name',
      exportName: `${appName}-${environment}-service-name`,
    });

    if (props?.domainName) {
      new cdk.CfnOutput(this, 'DomainURL', {
        value: `https://${props.domainName}`,
        description: 'Application Domain URL',
      });
    }
  }
}
