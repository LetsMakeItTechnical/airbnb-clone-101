import { Stack, StackProps } from 'aws-cdk-lib';
import { SecurityGroup, SelectedSubnets, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export class BackendVpcStack extends Stack {
  readonly vpc: Vpc;
  readonly privateEgressSubnets: SelectedSubnets;
  readonly securityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = new Vpc(this, 'VPC', {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'ingress',
          subnetType: SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'compute',
          subnetType: SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 28,
          name: 'rds',
          subnetType: SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    const privateEgressSubnets = vpc.selectSubnets({
      subnetType: SubnetType.PRIVATE_WITH_EGRESS,
    });

    const securityGroup = new SecurityGroup(this, 'SecurityGroup', {
      vpc,
    });

    this.vpc = vpc;
    this.privateEgressSubnets = privateEgressSubnets;
    this.securityGroup = securityGroup;
  }
}
