import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import path from 'path';
import { CfnOutput, Stack, StackProps, Token } from 'aws-cdk-lib';
import { getParams } from './config/ssmParameters';
import { ApplicationProtocol } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Bucket } from 'aws-cdk-lib/aws-s3';

export class AppStack extends Stack {
  scope: Construct;
  constructor(
    scope: Construct,
    id: string,
    context: {
      vpc: ec2.Vpc;
      privateEgressSubnets: ec2.SelectedSubnets;
      securityGroup: ec2.SecurityGroup;
      host: string;
      port: string;
      engine: string;
      username: string;
      password: string;
      dbname: string;
      redisPort: string;
      redisHost: string;
      bucket: Bucket;
    },
    props?: StackProps
  ) {
    super(scope, id, props);
    this.scope = scope;

    const secretParams = getParams(this);

    const { vpc, securityGroup, bucket } = context;

    const appSecurityGroup: ec2.SecurityGroup = new ec2.SecurityGroup(this, 'app-security-group', {
      securityGroupName: 'app-security-group',
      description: 'app-security-group',
      allowAllOutbound: true,
      vpc,
    });

    appSecurityGroup.addIngressRule(ec2.Peer.ipv4('0.0.0.0/0'), ec2.Port.tcp(80), 'allow port 80');

    securityGroup.addIngressRule(
      appSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow internal VPC traffic'
    );

    securityGroup.addIngressRule(appSecurityGroup, ec2.Port.tcp(6379));

    const s3GatewayEndpoint = vpc.addGatewayEndpoint('s3GatewayEndpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
    });

    // Add bucket policy to restrict access to VPCE
    bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.DENY,
        resources: [bucket.bucketArn],
        actions: ['s3:ListBucket'],
        principals: [new iam.AnyPrincipal()],
        conditions: {
          StringNotEquals: {
            'aws:sourceVpce': [s3GatewayEndpoint.vpcEndpointId],
          },
        },
      })
    );

    bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.DENY,
        resources: [bucket.arnForObjects('*')],
        actions: ['s3:PutObject', 's3:GetObject'],
        principals: [new iam.AnyPrincipal()],
        conditions: {
          StringNotEquals: {
            'aws:sourceVpce': [s3GatewayEndpoint.vpcEndpointId],
          },
        },
      })
    );

    // Create the cluster
    const cluster = new ecs.Cluster(this, 'app-task-cluster', { vpc });

    // Create a load-balanced Fargate service and make it public
    const fargate = new ecs_patterns.ApplicationLoadBalancedFargateService(
      this,
      'AppFargateService',
      {
        cluster, // Required
        memoryLimitMiB: 2048,
        taskImageOptions: {
          image: ecs.ContainerImage.fromAsset(path.join(__dirname, '../')),
          containerPort: 80,
          logDriver: new ecs.AwsLogDriver({
            streamPrefix: 'app-task-log-prefix',
          }),
          environment: {
            REGION: process.env.CDK_DEFAULT_REGION!,
            BUCKET_NAME: bucket.bucketName,
            DATABASE_URL: `postgresql://${context.username}:${context.password}@${
              context.host
            }:${Token.asString(context.port)}/${context.dbname}`,

            GOOGLE_CLIENT_ID: secretParams.string('/google/client/id'),
            GOOGLE_CLIENT_SECRET: secretParams.string('/google/client/secret'),
            GITHUB_ID: secretParams.string('/github/id'),
            GITHUB_SECRET: secretParams.string('/github/secret'),

            NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: secretParams.string('/cloudinary/cloud/name'),
            NEXT_PUBLIC_CLOUDINARY_API_KEY: secretParams.string('/cloudinary/api/key'),
            CLOUDINARY_API_SECRET: secretParams.string('/cloudinary/api/secret'),

            REDIS_HOST: context.redisHost,
            REDIS_PORT: context.redisPort,

            NEXTAUTH_SECRET: secretParams.string('/nextauth/secret'),
          },
        },
        taskSubnets: { subnetType: ec2.SubnetType.PUBLIC },
        cpu: 512, // Default is 256
        desiredCount: 2, // Default is 1
        assignPublicIp: false,
        publicLoadBalancer: true, // Default is false
        securityGroups: [appSecurityGroup],
      }
    );

    fargate.taskDefinition.taskRole.addToPrincipalPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['secretsmanager:GetSecretValue'],
        resources: ['*'],
      })
    );

    // Read and Write permissions for Fargate
    bucket.grantReadWrite(fargate.taskDefinition.taskRole);

    // To get the URL of the load balancer
    const loadBalancerUrl = fargate.loadBalancer.loadBalancerDnsName;

    // Output the URL
    new CfnOutput(this, 'LoadBalancerURL', {
      value: `http://${loadBalancerUrl}`,
    });
  }
}
