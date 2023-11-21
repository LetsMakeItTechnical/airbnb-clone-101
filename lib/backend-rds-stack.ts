import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { InstanceClass, InstanceSize, InstanceType, SubnetType } from 'aws-cdk-lib/aws-ec2';

import {
  AuroraPostgresEngineVersion,
  Credentials,
  DatabaseCluster,
  DatabaseClusterEngine,
} from 'aws-cdk-lib/aws-rds';

import { Construct } from 'constructs';
import type { RDSContext } from './types';
import { ISecret } from 'aws-cdk-lib/aws-secretsmanager';

export class BackendRdsStack extends Stack {
  readonly cluster: DatabaseCluster;
  readonly secret: ISecret;

  constructor(scope: Construct, id: string, props: StackProps, context: RDSContext) {
    super(scope, id, props);

    const instanceType = InstanceType.of(
      context.instance.class as InstanceClass,
      context.instance.size as InstanceSize
    );

    const cluster = new DatabaseCluster(this, 'DB', {
      engine: DatabaseClusterEngine.auroraPostgres({
        version: AuroraPostgresEngineVersion.VER_15_2,
      }),
      credentials: Credentials.fromGeneratedSecret('airbnbclone'),
      storageEncrypted: true,
      backup: {
        retention: Duration.days(30),
      },
      deletionProtection: true,
      instanceProps: {
        enablePerformanceInsights: true,
        instanceType,
        vpc: context.vpc,
        publiclyAccessible: false,
        vpcSubnets: {
          subnetType: SubnetType.PRIVATE_ISOLATED,
        },
        securityGroups: [context.securityGroup],
      },
      clusterIdentifier: 'airbnbcloneDB',
      defaultDatabaseName: 'airbnbclone',
    });

    this.cluster = cluster;
    this.secret = cluster.secret!;
  }
}
