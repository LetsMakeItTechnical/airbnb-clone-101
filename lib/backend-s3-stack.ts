import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { BlockPublicAccess, Bucket, BucketEncryption } from 'aws-cdk-lib/aws-s3';

export class AppS3Stack extends Stack {
  bucket: Bucket;
  constructor(scope: Construct, id: string, _context: {}, props?: StackProps) {
    super(scope, id, props);

    const BUCKET_NAME = 'app-bucket-serverless-patterns';

    const appBucket = new Bucket(this, 'appBucket', {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      bucketName: BUCKET_NAME,
      encryption: BucketEncryption.KMS_MANAGED,
      enforceSSL: true,
      publicReadAccess: false,
      removalPolicy: RemovalPolicy.DESTROY,
      versioned: false,
      autoDeleteObjects: true,
    });

    this.bucket = appBucket;
  }
}
