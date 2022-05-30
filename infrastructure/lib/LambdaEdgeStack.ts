import { Construct } from "constructs";
import {
  aws_iam,
  aws_lambda,
  aws_lambda_nodejs,
  Stack,
  StackProps
} from "aws-cdk-lib";
import { XRegionParam } from "./XRegionParam";


interface IDefNodejsFunctionProps {
  constructor: Construct
  id: string
  lambdaNamePrefix: string
  dirName: string
  role: aws_iam.IRole
}

const defNodejsFunction = (props: IDefNodejsFunctionProps): aws_lambda_nodejs.NodejsFunction => {

  const functionProps: aws_lambda_nodejs.NodejsFunctionProps = {
    functionName: `${props.lambdaNamePrefix}Function`,
    entry: `./lib/lambda/edge/${props.dirName}/index.ts`,
    handler: "handler",
    role: props.role,
    bundling: {
      preCompilation: true,
      loader: {
        ".html": "text"
      }
    },
    runtime: aws_lambda.Runtime.NODEJS_14_X,
    architecture: aws_lambda.Architecture.X86_64,
    awsSdkConnectionReuse: false,
  }

  const lambdaFunction = new aws_lambda_nodejs.NodejsFunction(props.constructor, props.lambdaNamePrefix, functionProps)
  new aws_lambda.Alias(props.constructor, `${props.lambdaNamePrefix}Alias`, {
    aliasName: 'latest',
    version: lambdaFunction.currentVersion,
  })
  new XRegionParam(props.constructor, `x-region-param-${props.lambdaNamePrefix}`, {
    region: "ap-northeast-1"
  }).putSsmParameter({
    parameterName: `/cdk/EdgeFunctionArn/${props.id}/${props.lambdaNamePrefix}`,
    parameterValue: `${lambdaFunction.functionArn}:${lambdaFunction.currentVersion.version}`,
    parameterDataType: "text",
    idName: `x-region-param-id-${props.id}`
  })
  return lambdaFunction
}

export class LambdaEdgeAuthStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    /** lambda role */
    const role = new aws_iam.Role(this, 'lambdaRole', {
      roleName: `${id}-lambda-role`,
      assumedBy: new aws_iam.CompositePrincipal(
        new aws_iam.ServicePrincipal('lambda.amazonaws.com'),
        new aws_iam.ServicePrincipal('edgelambda.amazonaws.com'),
      ),
      managedPolicies: [
        aws_iam.ManagedPolicy.fromManagedPolicyArn(this, 'CWFullAccess', 'arn:aws:iam::aws:policy/CloudWatchFullAccess')
      ]
    })

    const parseAuth = defNodejsFunction({
      constructor: this,
      id,
      lambdaNamePrefix: "parseAuth",
      dirName: "parse-auth",
      role: role
    })

    const checkAuth = defNodejsFunction({
      constructor: this,
      id,
      lambdaNamePrefix: "checkAuth",
      dirName: "check-auth",
      role: role,
    })

    const refreshAuth = defNodejsFunction({
      constructor: this,
      id,
      lambdaNamePrefix: "refreshAuth",
      dirName: "refresh-auth",
      role: role
    })

    const httpHeaders = defNodejsFunction({
      constructor: this,
      id,
      lambdaNamePrefix: "httpHeaders",
      dirName: "http-headers",
      role: role
    })

    const signOut = defNodejsFunction({
      constructor: this,
      id,
      lambdaNamePrefix: "signOut",
      dirName: "sign-out",
      role: role
    })

    const trailingSlash = defNodejsFunction({
      constructor: this,
      id,
      lambdaNamePrefix: "trailingSlash",
      dirName: "rewrite-trailing-slash",
      role: role
    })
  }
}
