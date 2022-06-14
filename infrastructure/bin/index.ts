import {
  App,
  Tags
} from 'aws-cdk-lib';
import * as lib from '../lib';

const app = new App();

const description = "example@1.0.0"

// simple
const cloudfrontSimple = new lib.CloudFrontStack(
  app,
  "example-cloudfront-simple",
  lib.paramsCloudFront1Stack,
  {env: lib.envApNortheast1, description}
)
Tags.of(cloudfrontSimple).add("project", "cloudfront-simple")

// with cognito
const cognito = new lib.CognitoStack(app, "example-cognito", lib.paramsCognitoStack, {description})
const cognitoLambdaEdge = new lib.LambdaEdgeAuthStack(
  app,
  "example-lambda-edge",
  {env: lib.envUsEast1, description}
)
const cloudFront1Cognito = new lib.CloudFrontCognitoStack(
  app,
  "example-cloudfront-cognito-1",
  {...lib.paramsCloudFront1Stack, lambdaEdgeStackId: "example-lambda-edge"},
  {env: lib.envApNortheast1, description}
)
const cloudFront2Cognito = new lib.CloudFrontCognitoStack(
  app,
  "example-cloudfront-cognito-2",
  {...lib.paramsCloudFront2Stack, lambdaEdgeStackId: "example-lambda-edge"},
  {env: lib.envApNortheast1, description}
)

Tags.of(cognito).add("project", "zenn-cloudfront-cognito")
Tags.of(cognitoLambdaEdge).add("project", "zenn-cloudfront-cognito")
Tags.of(cloudFront1Cognito).add("project", "zenn-cloudfront-cognito")
Tags.of(cloudFront2Cognito).add("project", "zenn-cloudfront-cognito")


app.synth();
