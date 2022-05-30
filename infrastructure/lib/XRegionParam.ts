import {
  Stack,
  custom_resources,
} from 'aws-cdk-lib';
import {Construct} from 'constructs';

export interface IXRegionParam {
  region?: string
}

export interface IGetSsmParam {
  parameterName: string
  idName: string
}

export interface IPutSsmParam {
  parameterName: string
  parameterValue: string
  parameterDataType: string
  idName: string
}



export class XRegionParam extends Construct {
  private stack: Stack
  public region: string

  constructor(scope: Construct, id: string, props: IXRegionParam) {
    super(scope, id)

    this.stack = Stack.of(this)
    this.region = props.region ? props.region : this.stack.region
  }

  getSsmParameter(props: IGetSsmParam): string {
    // const stack = Stack.of(this)
    const paramRegion = this.region

    const resultParams = new custom_resources.AwsCustomResource(this, props.idName, {
      policy: custom_resources.AwsCustomResourcePolicy.fromSdkCalls({
        resources: custom_resources.AwsCustomResourcePolicy.ANY_RESOURCE
      }),
      onUpdate: {
        service: "SSM",
        action: "getParameter",
        parameters: {
          Name: props.parameterName,
        },
        region: paramRegion,
        physicalResourceId: custom_resources.PhysicalResourceId.of(props.idName)
      }},
    )
    return resultParams.getResponseField("Parameter.Value")
  }

  putSsmParameter(props: IPutSsmParam) {
    // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SSM.html#putParameter-property
    new custom_resources.AwsCustomResource(this, props.idName, {
      policy: custom_resources.AwsCustomResourcePolicy.fromSdkCalls({
        resources: custom_resources.AwsCustomResourcePolicy.ANY_RESOURCE
      }),
      onUpdate: {
        service: "SSM",
        action: "putParameter",
        parameters: {
          Name: props.parameterName,
          Value: props.parameterValue,
          DataType: props.parameterDataType,
          Type: "String",
          Overwrite: true
        },
        region: this.region,
        physicalResourceId: custom_resources.PhysicalResourceId.of(props.idName)
      }},
    )
  }
}
