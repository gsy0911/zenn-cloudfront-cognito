import {
  Duration,
  Stack,
  StackProps,
  RemovalPolicy,
  aws_cognito,
} from 'aws-cdk-lib';
import {Construct} from 'constructs';

export interface ICognitoStack {
  domainPrefix: string
  callbackUrls: `https://${string}/oauth2/idpresponse`[]
  logoutUrls: `https://${string}/signout`[]
}

export class CognitoStack extends Stack {
  constructor(scope: Construct, id: string, params: ICognitoStack, props?: StackProps) {
    super(scope, id, props);

    const userPool = new aws_cognito.UserPool(this, "userPool", {
      userPoolName: `user-pool`,
      // signUp
      // By default, self sign up is disabled. Otherwise use userInvitation
      selfSignUpEnabled: false,
      userVerification: {
        emailSubject: "Verify email message",
        emailBody: "Thanks for signing up! Your verification code is {####}",
        emailStyle: aws_cognito.VerificationEmailStyle.CODE,
        smsMessage: "Thanks for signing up! Your verification code is {####}"
      },
      // sign in
      signInAliases: {
        username: true,
        email: true
      },
      // user attributes
      standardAttributes: {
        email: {
          required: true,
          mutable: true
        },
      },
      // role, specify if you want
      mfa: aws_cognito.Mfa.OPTIONAL,
      mfaSecondFactor: {
        sms: true,
        otp: true
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
        tempPasswordValidity: Duration.days(3)
      },
      // emails, by default `no-reply@verificationemail.com` used
      accountRecovery: aws_cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: RemovalPolicy.DESTROY,
    })

    // App Clients
    userPool.addClient("privateClient", {
      userPoolClientName: "privateClient",
      generateSecret: true,
      authFlows: {
        userPassword: true,
        userSrp: true
      },
      oAuth: {
        callbackUrls: params.callbackUrls,
        logoutUrls: params.logoutUrls
      }
    })

    // App Clients
    userPool.addClient("publicClient", {
      userPoolClientName: "publicClient",
      generateSecret: false,
      authFlows: {
        userPassword: true,
        userSrp: true
      },
      oAuth: {
        callbackUrls: params.callbackUrls,
        logoutUrls: params.logoutUrls
      }
    })

    userPool.addDomain("cognito-domain", {
      cognitoDomain: {
        domainPrefix: params.domainPrefix,
      }
    })
  }
}

