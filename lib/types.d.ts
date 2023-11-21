import { SecurityGroup, SelectedSubnets, Vpc } from 'aws-cdk-lib/aws-ec2';

type Instance = {
  class: string;
  size: string;
};

export type CDKContext = {
  appName: string;
  region: string;
  environment: string;
  branchName: string;
  accountNumber: string;
  currentBranch: string;
};

export interface RDSContext {
  vpc: Vpc;
  instance: Instance;
  securityGroup: SecurityGroup;
}

export interface RedisContext {
  vpc: Vpc;
  instance: Instance;
  securityGroup: SecurityGroup;
}

export type LambdaDefinition = {
  name: string;
  memoryMB?: number;
  timeoutMins?: number;
  isPrivate: boolean;
  hasParams?: boolean;
  params?: string;
  endpoint?: string;
  methods?: string[];
  environment?: {
    [key: string]: string;
  };
};
