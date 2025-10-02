import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { Construct } from 'constructs';

interface WebStackProps extends cdk.StackProps {
  wsUrl: string;
  httpUrl: string;
}

export class WebStack extends cdk.Stack {
  public readonly distributionUrl: string;
  public readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: WebStackProps) {
    super(scope, id, props);

    const { wsUrl, httpUrl } = props;

    // S3 bucket for static website
    this.bucket = new s3.Bucket(this, 'LastWordsWebBucket', {
      bucketName: undefined, // Let CDK generate unique name
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // CloudFront Origin Access Control
    const oac = new cloudfront.CfnOriginAccessControl(this, 'OAC', {
      originAccessControlConfig: {
        name: 'LastWordsOAC',
        originAccessControlOriginType: 's3',
        signingBehavior: 'always',
        signingProtocol: 'sigv4',
      },
    });

    // CloudFront distribution
    const distribution = new cloudfront.Distribution(this, 'LastWordsDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(this.bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.seconds(0),
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.seconds(0),
        },
      ],
    });

    // Grant CloudFront access to S3 bucket
    this.bucket.addToResourcePolicy(
      new cdk.aws_iam.PolicyStatement({
        actions: ['s3:GetObject'],
        resources: [this.bucket.arnForObjects('*')],
        principals: [new cdk.aws_iam.ServicePrincipal('cloudfront.amazonaws.com')],
        conditions: {
          StringEquals: {
            'AWS:SourceArn': `arn:aws:cloudfront::${this.account}:distribution/${distribution.distributionId}`,
          },
        },
      })
    );

    this.distributionUrl = `https://${distribution.distributionDomainName}`;

    // Deploy config.js with actual URLs after stack is created
    // Note: This is a placeholder - actual deployment happens separately
    new s3deploy.BucketDeployment(this, 'DeployConfig', {
      sources: [
        s3deploy.Source.data(
          'config.js',
          `window.__CONFIG__ = { WS_URL: "${wsUrl}", HTTP_URL: "${httpUrl}" };`
        ),
      ],
      destinationBucket: this.bucket,
      distribution,
      distributionPaths: ['/config.js'],
    });

    // Outputs
    new cdk.CfnOutput(this, 'BucketName', {
      value: this.bucket.bucketName,
      exportName: 'LastWordsWebBucketName',
    });

    new cdk.CfnOutput(this, 'DistributionURL', {
      value: this.distributionUrl,
      exportName: 'LastWordsDistributionURL',
    });

    new cdk.CfnOutput(this, 'DistributionId', {
      value: distribution.distributionId,
      exportName: 'LastWordsDistributionId',
    });

    // Output the config for manual update
    new cdk.CfnOutput(this, 'ConfigJS', {
      value: `window.__CONFIG__ = { WS_URL: "${wsUrl}", HTTP_URL: "${httpUrl}" };`,
      description: 'Copy this to web/public/config.js before deploying web app',
    });
  }
}
