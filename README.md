# zenn-cloudfront-cognito

## AWS Services

- Amazon CloudFront
- Amazon S3
- Amazon Cognito
- Lambda@Edge
- Amazon Route 53

## CDK - only

- CustomResource
- AWS Systems Manager (SSM)

## Usage

### 1. setup local-develop-environment

```shell
$ cd infrastructure
$ npm install
```

### 2. setup local-params

```shell
$ cd infrastructure
$ cp lib/params.example.ts lib/params.ts
$ cp lib/lambda/shared/configuration.example.json lib/lambda/shared/configuration.json
```


### 3. setup AWS-environment


### 4. deploy simple CloudFront + S3

```shell
$ cd infrastructure
$ cdk deploy example-cloudfront-simple
```

### 5. deploy CloudFront + Cognito (Lambda@Edge)

```shell
$ cd infrastructure
$ cdk deploy example-cognito
$ cdk deploy example-lambda-edge
$ cdk deploy example-cloudfront-cognito-1
$ cdk deploy example-cloudfront-cognito-2
```



# references

- [AWS公式：Authorization@Edge using cookies: Protect your Amazon CloudFront content from being downloaded by unauthenticated users](https://aws.amazon.com/jp/blogs/networking-and-content-delivery/authorizationedge-using-cookies-protect-your-amazon-cloudfront-content-from-being-downloaded-by-unauthenticated-users/)
- [AWS公式：Amazon CloudFront と AWS Lambda@Edge による署名付き Cookie ベースの認証: パート 2 – 認可](https://aws.amazon.com/jp/blogs/news/signed-cookie-based-authentication-with-amazon-cloudfront-and-aws-lambdaedge-part-2-authorization/)
- [【AWS Black Belt Online Seminar】Amazon Cognito](https://d1.awsstatic.com/webinars/jp/pdf/services/20200630_AWS_BlackBelt_Amazon%20Cognito.pdf)
- [AWS CDKで別リージョンに基本認証用Lambda@Edgeを作成するスタックをデプロイしてAmazon CloudFrontに設定する](https://tech.nri-net.com/entry/aws_cdk_cross_region_stack_deployment_lambda_edge)
- [Lambda@Edge 関数のログが見つからないときの対処方法](https://dev.classmethod.jp/articles/tsnote-lambda-edge-log-region/)
- [SaaS on AWS における認証認可の実装パターンとは ?](https://aws.amazon.com/jp/builders-flash/202108/saas-authorization-implementation-pattern/?awsf.filter-name=*all)
- [Cookieのセキュリティ周りでいちばんややこしいDomain属性をしっかり理解する](https://qiita.com/HAYASHI-Masayuki/items/209039717c15834603d8)
