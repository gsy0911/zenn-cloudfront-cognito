import { ICloudFrontStack } from './CloudFrontStack';
import { ICognitoStack } from './CognitoStack';
import {
  Environment
} from 'aws-cdk-lib';

const newlyGenerateS3BucketBaseName: string = "newly-generate-s3-bucket-base-name"
const accountId: string = "00001111222"
const domain: string = "your.domain.com"
const referer: string = "referer-using-s3-cognito"
const subDomain1: string = `app1.${domain}`
const subDomain2: string = `app2.${domain}`
const cognitoDomainPrefix: string = "cognito-unique-domain-example"

export const paramsCloudFront1Stack: ICloudFrontStack = {
  s3: {
    bucketName: `${newlyGenerateS3BucketBaseName}-1`,
    referer: referer
  },
  cloudfront: {
    certificate: `arn:aws:acm:us-east-1:${accountId}:certificate/{unique-id}`,
    domainNames: [subDomain1],
    route53DomainName: domain,
    route53RecordName: subDomain1
  }
}

export const paramsCloudFront2Stack: ICloudFrontStack = {
  s3: {
    bucketName: `${newlyGenerateS3BucketBaseName}-2`,
    referer: referer
  },
  cloudfront: {
    certificate: `arn:aws:acm:us-east-1:${accountId}:certificate/{unique-id}`,
    domainNames: [subDomain2],
    route53DomainName: domain,
    route53RecordName: subDomain2
  }
}


export const paramsCognitoStack: ICognitoStack = {
  domainPrefix: cognitoDomainPrefix,
  callbackUrls: [`https://${subDomain1}/oauth2/idpresponse`, `https://${subDomain2}/oauth2/idpresponse`],
  logoutUrls: [`https://${subDomain1}/signout`, `https://${subDomain2}/signout`]
}

export const envApNortheast1: Environment = {
  account: accountId,
  region: "ap-northeast-1"
}

export const envUsEast1: Environment = {
  account: accountId,
  region: "us-east-1"
}
