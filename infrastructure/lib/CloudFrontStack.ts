import * as path from 'path';
import {
  App,
  aws_certificatemanager as acm,
  aws_cloudfront,
  aws_route53,
  aws_route53_targets,
  aws_iam,
  aws_s3,
  aws_s3_deployment,
  Duration,
  RemovalPolicy,
  Stack,
  StackProps
} from 'aws-cdk-lib';


export interface ICloudFrontStack {
  s3: {
    bucketName: string
    referer: string
  }
  cloudfront: {
    /** us-east-1のACMのARN*/
    certificate: `arn:aws:acm:us-east-1:${string}:certificate/${string}`
    domainNames: string[]
    route53DomainName: string
    route53RecordName: string
  }
}

export class CloudFrontStack extends Stack {

  constructor(scope: App, id: string, params: ICloudFrontStack, props?: StackProps) {
    super(scope, id, props);

    const contentS3 = new aws_s3.Bucket(this, "s3Content", {
      bucketName: params.s3.bucketName,
      removalPolicy: RemovalPolicy.DESTROY,
      publicReadAccess: true,
      websiteIndexDocument: "index.html",
    })

    contentS3.addToResourcePolicy(
      new aws_iam.PolicyStatement({
        sid: "Allow get requests originating from Cloudfront.",
        effect: aws_iam.Effect.ALLOW,
        principals: [new aws_iam.AnyPrincipal()],
        actions: ["s3:GetObject", "s3:GetObjectVersion"],
        resources: [`arn:aws:s3:::${params.s3.bucketName}/*`],
        conditions: {StringLike: {"aws:Referer": params.s3.referer}}
      })
    )

    new aws_s3_deployment.BucketDeployment(this, 'DeployWebsite', {
      sources: [aws_s3_deployment.Source.asset(path.join(__dirname, 'example_html'))],
      destinationBucket: contentS3,
    });

    const s3StaticHostingDomain = `${params.s3.bucketName}.s3-website-ap-northeast-1.amazonaws.com`

    const certificate = acm.Certificate.fromCertificateArn(this, "virginiaCertificate", params.cloudfront.certificate)
    const distribution = new aws_cloudfront.CloudFrontWebDistribution(this, "web-distribution", {
      originConfigs: [
        {
          customOriginSource: {
            domainName: s3StaticHostingDomain,
            originHeaders: {
              // ここはデプロイ後にS3のRefererと同じ値を設定すること
              "Referer": params.s3.referer
            },
            originProtocolPolicy: aws_cloudfront.OriginProtocolPolicy.HTTP_ONLY
          },
          behaviors: [
            {
              isDefaultBehavior: true,
              pathPattern: "*",
              // TTLの設定を30分にしている。
              maxTtl: Duration.seconds(1800),
              minTtl: Duration.seconds(1800),
              defaultTtl: Duration.seconds(1800),
            }
          ]
        }
      ],
      errorConfigurations: [
        {
          errorCode: 403,
          responsePagePath: "/index.html",
          responseCode: 200,
          errorCachingMinTtl: 0
        },
        {
          errorCode: 404,
          responsePagePath: "/index.html",
          responseCode: 200,
          errorCachingMinTtl: 0
        }
      ],
      defaultRootObject: "index.html",
      viewerCertificate: aws_cloudfront.ViewerCertificate.fromAcmCertificate(certificate, {
        aliases: [params.cloudfront.route53RecordName],
        securityPolicy: aws_cloudfront.SecurityPolicyProtocol.TLS_V1,
        sslMethod: aws_cloudfront.SSLMethod.SNI
      })
    })

    // Route 53 for cloudfront
    const cloudfrontHostedZone = aws_route53.HostedZone.fromLookup(this, "cloudfront-hosted-zone", {
      domainName: params.cloudfront.route53DomainName
    })
    new aws_route53.ARecord(this, "cloudfront-a-record", {
      zone: cloudfrontHostedZone,
      recordName: params.cloudfront.route53RecordName,
      target: aws_route53.RecordTarget.fromAlias(new aws_route53_targets.CloudFrontTarget(distribution))
    })
  }
}
