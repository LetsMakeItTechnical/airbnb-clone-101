import { CfnOutput, Duration, Stack, StackProps, Token } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { SecurityGroup, SelectedSubnets, Vpc } from 'aws-cdk-lib/aws-ec2';
import { PrismaFunction } from './construct/prisma-function';
import { Code, LayerVersion, Runtime } from 'aws-cdk-lib/aws-lambda';
import {
  Effect,
  ManagedPolicy,
  PolicyDocument,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from 'aws-cdk-lib/aws-iam';

export class MigrationAppStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    context: {
      vpc: Vpc;
      privateEgressSubnets: SelectedSubnets;
      securityGroup?: SecurityGroup;
      host: string;
      port: string;
      engine: string;
      username: string;
      password: string;
      dbname: string;
    },
    props?: StackProps
  ) {
    super(scope, id, props);

    const vpc = context.vpc;

    const securityGroup = new SecurityGroup(this, 'MigrationRunnerLambdaSG', {
      vpc,
      description: 'Lambda Security Group',
      allowAllOutbound: true,
    });

    // Lambda Role
    const lambdaRole = new Role(this, 'migrationLambdaRole', {
      roleName: 'migration-lambda-role',
      description: 'Lambda role for migration application',
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      inlinePolicies: {
        ec2NetworkInterface: new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: ['ec2:CreateNetworkInterface'],
              resources: ['*'], // Adjust the resource accordingly
            }),
          ],
        }),
        all: new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              resources: ['*'],
              actions: ['*'],
            }),
          ],
        }),
        cloudWatchLogs: new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              resources: [` "arn:aws:logs:*:*:*"`],
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:DescribeLogGroups',
                'logs:DescribeLogStreams',
                'logs:PutLogEvents',
              ],
            }),
          ],
        }),
      },
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('ReadOnlyAccess'),
        ManagedPolicy.fromManagedPolicyArn(
          this,
          'LambdaBasicExeRole',
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    const lambdaLayer = new LayerVersion(this, 'MigrationRunnerLambdaLayer', {
      code: Code.fromAsset('shared'),
      compatibleRuntimes: [Runtime.NODEJS_16_X, Runtime.NODEJS_18_X],
      description: `Lambda Layer`,
    });

    const migrationRunner = new PrismaFunction(this, 'MigrationRunner', {
      entry: 'lambda-fns/migration-runner.ts',
      memorySize: 256,
      role: lambdaRole,
      runtime: Runtime.NODEJS_18_X,
      timeout: Duration.minutes(1),
      vpc,
      vpcSubnets: context.vpc.selectSubnets(context.privateEgressSubnets),
      securityGroups: [securityGroup],
      layers: [lambdaLayer],
      environment: {
        DATABASE_URL: `postgresql://${context.username}:${context.password}@${
          context.host
        }:${Token.asString(context.port)}/${context.dbname}`,
      },
      database: {
        host: context.host,
        port: context.port,
        engine: context.engine,
        username: context.username,
        password: context.password,
        dbname: context.dbname,
      },
      depsLockFilePath: './package-lock.json',
    });

    new CfnOutput(this, `MigrationRunnerLambdaArn`, { value: migrationRunner.functionArn });
  }
}
