import { Stack, StackProps } from 'aws-cdk-lib';
import * as redis from 'aws-cdk-lib/aws-elasticache';
import { Construct } from 'constructs';
import type { RedisContext } from './types';

export class BackendRedisStack extends Stack {
  readonly cluster: redis.CfnCacheCluster;

  constructor(scope: Construct, id: string, props: StackProps, context: RedisContext) {
    super(scope, id, props);

    const { vpc, securityGroup } = context;

    // Get all public subnet ids, you can deploy it to privatesubnets as well
    const Subnets = vpc.publicSubnets.map((subnet) => {
      return subnet.subnetId;
    });

    // Create redis subnet group from subnet ids
    const redisSubnetGroup = new redis.CfnSubnetGroup(this, 'RedisSubnetGroup', {
      subnetIds: Subnets,
      description: 'Subnet group for redis',
    });

    // Create Redis Cluster
    const redisCluster = new redis.CfnCacheCluster(this, 'RedisCluster', {
      autoMinorVersionUpgrade: true,
      cacheNodeType: 'cache.t2.small',
      engine: 'redis',
      numCacheNodes: 1,
      cacheSubnetGroupName: redisSubnetGroup.ref,
      clusterName: 'airbnbclone-redis',
      vpcSecurityGroupIds: [securityGroup.securityGroupId],
    });

    // Define this redis cluster is depends on redis subnet group created first
    redisCluster.node.addDependency(redisSubnetGroup);

    this.cluster = redisCluster;
  }
}
