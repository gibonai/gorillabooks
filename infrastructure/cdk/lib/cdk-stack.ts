import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
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

  /**
   * Datadog secret name for API key
   * @default 'datadog-api-key'
   */
  datadogSecretName?: string;
}

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: GorillaBooksStackProps) {
    super(scope, id, props);

    const appName = props?.appName || 'gorillabooks';
    const environment = props?.environment || 'production';

    // VPC with public and private subnets across 2 AZs
    // Private subnets have NAT gateway for outbound internet (ECR, Secrets Manager)
    const vpc = new ec2.Vpc(this, 'VPC', {
      maxAzs: 2,
      natGateways: 1, // One NAT gateway for cost optimization (single point of failure but cheaper)
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS, // NAT gateway for outbound
          cidrMask: 24,
        },
      ],
    });

    // Reference existing ECR Repository (created by workflow before stack deployment)
    const repository = ecr.Repository.fromRepositoryName(
      this,
      'AppRepository',
      `${appName}-app`
    );

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

    // Reference to MongoDB Atlas secret (created manually with credentials)
    // Expected format: { "username": "...", "password": "...", "host": "...", "database": "gorillabooks" }
    const mongoSecret = secretsmanager.Secret.fromSecretNameV2(
      this,
      'MongoAtlasSecret',
      'mongodb-atlas-gorillabooks'
    );

    // Reference to Datadog API key secret
    // Expected format: { "api-key": "..." }
    const datadogSecretName = props?.datadogSecretName || 'datadog-api-key';
    const datadogSecret = secretsmanager.Secret.fromSecretNameV2(
      this,
      'DatadogSecret',
      datadogSecretName
    );

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
          DD_SERVICE: appName,
          DD_ENV: environment,
          DD_VERSION: 'latest', // TODO: Use git SHA from CI
        },
        secrets: {
          // MongoDB Atlas connection details (construct URI in app)
          DB_HOST: ecs.Secret.fromSecretsManager(mongoSecret, 'host'),
          DB_USERNAME: ecs.Secret.fromSecretsManager(mongoSecret, 'username'),
          DB_PASSWORD: ecs.Secret.fromSecretsManager(mongoSecret, 'password'),
          DB_NAME: ecs.Secret.fromSecretsManager(mongoSecret, 'database'),
          // JWT secret
          JWT_SECRET: ecs.Secret.fromSecretsManager(jwtSecret, 'secret'),
          // Datadog API key
          DD_API_KEY: ecs.Secret.fromSecretsManager(datadogSecret, 'api-key'),
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
      taskSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS, // Tasks in private subnets with DocumentDB
      },
      assignPublicIp: false, // No public IP needed - using NAT gateway
    });

    // Health check configuration
    service.targetGroup.configureHealthCheck({
      path: '/health',
      interval: cdk.Duration.seconds(30),
      timeout: cdk.Duration.seconds(5),
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 10, // Allow more retries during initial image pull
    });

    // Add HTTP → HTTPS redirect if using custom domain with certificate
    if (certificate) {
      service.loadBalancer.addRedirect({
        sourceProtocol: elbv2.ApplicationProtocol.HTTP,
        sourcePort: 80,
        targetProtocol: elbv2.ApplicationProtocol.HTTPS,
        targetPort: 443,
      });
    }

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

    // Output NAT Gateway Elastic IP for MongoDB Atlas whitelisting
    const natGateway = vpc.publicSubnets[0].node.children.find(
      (child) => child.node.id === 'NATGateway'
    );
    if (natGateway) {
      const eip = natGateway.node.children.find(
        (child) => child.node.id === 'EIP'
      ) as ec2.CfnEIP;
      if (eip) {
        new cdk.CfnOutput(this, 'NATGatewayIP', {
          value: eip.ref,
          description: 'NAT Gateway Elastic IP - Whitelist this in MongoDB Atlas',
          exportName: `${appName}-${environment}-nat-ip`,
        });
      }
    }
  }
}
