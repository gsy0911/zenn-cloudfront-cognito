import {
  App,
  Duration,
  Stack,
  StackProps,
  aws_certificatemanager as acm,
  aws_route53,
  aws_route53_targets,
  aws_cloudfront,
  aws_lambda,
  aws_s3,
  RemovalPolicy,
  aws_iam,
  aws_s3_deployment,
  aws_ssm,
} from 'aws-cdk-lib';
import {ICloudFrontStack} from './CloudFrontStack';
import * as path from "path";

export interface ICloudFrontCognitoStack extends ICloudFrontStack {
  lambdaEdgeStackId: string
}

export class CloudFrontCognitoStack extends Stack {

  constructor(scope: App, id: string, params: ICloudFrontCognitoStack, props?: StackProps) {
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
    const checkAuthVersionParam = aws_ssm.StringParameter.fromStringParameterAttributes(this, 'checkAuthSsmParam', {
      parameterName: `/cdk/EdgeFunctionArn/${params.lambdaEdgeStackId}/checkAuth`,
    }).stringValue;
    const parseAuthVersionParam = aws_ssm.StringParameter.fromStringParameterAttributes(this, 'parseAuthSsmParam', {
      parameterName: `/cdk/EdgeFunctionArn/${params.lambdaEdgeStackId}/parseAuth`,
    }).stringValue;
    const refreshAuthVersionParam = aws_ssm.StringParameter.fromStringParameterAttributes(this, 'refreshAuthSsmParam', {
      parameterName: `/cdk/EdgeFunctionArn/${params.lambdaEdgeStackId}/refreshAuth`,
    }).stringValue;
    const signOutVersionParam = aws_ssm.StringParameter.fromStringParameterAttributes(this, 'signOutSsmParam', {
      parameterName: `/cdk/EdgeFunctionArn/${params.lambdaEdgeStackId}/signOut`,
    }).stringValue;

    const checkAuthVersion = aws_lambda.Version.fromVersionArn(this, "checkAuthVersion", checkAuthVersionParam)
    const parseAuthVersion = aws_lambda.Version.fromVersionArn(this, "parseAuthVersion", parseAuthVersionParam)
    const refreshAuthVersion = aws_lambda.Version.fromVersionArn(this, "refreshAuthVersion", refreshAuthVersionParam)
    const signOutArnVersion = aws_lambda.Version.fromVersionArn(this, "signOutVersionArnVersion", signOutVersionParam)

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
              pathPattern: "/logout",
              // TTLの設定を30分にしている。
              maxTtl: Duration.seconds(1800),
              minTtl: Duration.seconds(1800),
              defaultTtl: Duration.seconds(1800),
            },
            {
              pathPattern: "/oauth2/idpresponse",
              lambdaFunctionAssociations: [
                {
                  eventType: aws_cloudfront.LambdaEdgeEventType.VIEWER_REQUEST,
                  lambdaFunction: parseAuthVersion
                }
              ],
              // TTLの設定を30分にしている。
              maxTtl: Duration.seconds(1800),
              minTtl: Duration.seconds(1800),
              defaultTtl: Duration.seconds(1800),
            },
            {
              pathPattern: "/refreshauth",
              lambdaFunctionAssociations: [
                {
                  eventType: aws_cloudfront.LambdaEdgeEventType.VIEWER_REQUEST,
                  lambdaFunction: refreshAuthVersion
                }
              ],
              // TTLの設定を30分にしている。
              maxTtl: Duration.seconds(1800),
              minTtl: Duration.seconds(1800),
              defaultTtl: Duration.seconds(1800),
            },
            {
              pathPattern: "/signout",
              lambdaFunctionAssociations: [
                {
                  eventType: aws_cloudfront.LambdaEdgeEventType.VIEWER_REQUEST,
                  lambdaFunction: signOutArnVersion
                }
              ],
              // TTLの設定を30分にしている。
              maxTtl: Duration.seconds(1800),
              minTtl: Duration.seconds(1800),
              defaultTtl: Duration.seconds(1800),
            },
            {
              isDefaultBehavior: true,
              pathPattern: "*",
              lambdaFunctionAssociations: [
                {
                  eventType: aws_cloudfront.LambdaEdgeEventType.VIEWER_REQUEST,
                  lambdaFunction: checkAuthVersion
                }
              ],
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
