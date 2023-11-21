import 'source-map-support/register';

import { App, Token } from 'aws-cdk-lib';
import { AppStack } from '../lib/app-stack';
import { AppS3Stack } from '../lib/backend-s3-stack';
import { BackendVpcStack } from '../lib/backend-vpc-stack';
import { BackendRedisStack } from '../lib/backend-redis-stack';
import { BackendRdsStack } from '../lib/backend-rds-stack';
import { MigrationAppStack } from '../lib/backend-migration-stack';

const app = new App();

const config = { rdsInstanceClass: 't4g', rdsInstanceSize: 'medium' };

const backendVpcStack = new BackendVpcStack(app, 'BackendVpcStack');

const backendRdsStack = new BackendRdsStack(
  app,
  'BackendRdsStackDB',
  {},
  {
    vpc: backendVpcStack.vpc,
    securityGroup: backendVpcStack.securityGroup,
    instance: {
      class: config.rdsInstanceClass,
      size: config.rdsInstanceSize,
    },
  }
);

backendRdsStack.addDependency(backendVpcStack);

const backendRedisStack = new BackendRedisStack(
  app,
  'BackendRedisStack',
  {},
  {
    vpc: backendVpcStack.vpc,
    securityGroup: backendVpcStack.securityGroup,
    instance: {
      class: config.rdsInstanceClass,
      size: config.rdsInstanceSize,
    },
  }
);

backendRedisStack.addDependency(backendVpcStack);

const appS3Stack = new AppS3Stack(app, 'AppS3Stack', {});

const appStack = new AppStack(app, 'AppStack', {
  vpc: backendVpcStack.vpc,
  privateEgressSubnets: backendVpcStack.privateEgressSubnets,
  securityGroup: backendVpcStack.securityGroup,
  host: backendRdsStack.cluster.clusterEndpoint.hostname,
  port: Token.asString(backendRdsStack.cluster.clusterEndpoint.port),
  engine: backendRdsStack.secret.secretValueFromJson('engine').toString(),
  username: backendRdsStack.secret.secretValueFromJson('username').toString(),
  password: backendRdsStack.secret.secretValueFromJson('password').toString(),
  dbname: backendRdsStack.secret.secretValueFromJson('dbname').toString(),
  redisPort: backendRedisStack.cluster.attrRedisEndpointPort,
  redisHost: backendRedisStack.cluster.attrRedisEndpointAddress,
  bucket: appS3Stack.bucket,
});

appStack.addDependency(appS3Stack);
appStack.addDependency(backendVpcStack);
appStack.addDependency(backendRdsStack);

const backendMigrationStack = new MigrationAppStack(app, 'MigrationAppStack', {
  vpc: backendVpcStack.vpc,
  privateEgressSubnets: backendVpcStack.privateEgressSubnets,
  securityGroup: backendVpcStack.securityGroup,
  host: backendRdsStack.cluster.clusterEndpoint.hostname,
  port: Token.asString(backendRdsStack.cluster.clusterEndpoint.port),
  engine: backendRdsStack.secret.secretValueFromJson('engine').toString(),
  username: backendRdsStack.secret.secretValueFromJson('username').toString(),
  password: backendRdsStack.secret.secretValueFromJson('password').toString(),
  dbname: backendRdsStack.secret.secretValueFromJson('dbname').toString(),
});

backendMigrationStack.addDependency(backendVpcStack);
backendMigrationStack.addDependency(backendRdsStack);
