import * as cdk from 'aws-cdk-lib';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayv2Integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';

interface ApiStackProps extends cdk.StackProps {
  table: dynamodb.Table;
}

export class ApiStack extends cdk.Stack {
  public readonly wsUrl: string;
  public readonly httpUrl: string;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const { table } = props;

    // WebSocket API
    const wsApi = new apigatewayv2.WebSocketApi(this, 'LastWordsWS', {
      apiName: 'LastWordsWebSocket',
    });

    const wsStage = new apigatewayv2.WebSocketStage(this, 'LastWordsWSStage', {
      webSocketApi: wsApi,
      stageName: 'prod',
      autoDeploy: true,
    });

    // Lambda functions for WebSocket
    const connectHandler = new lambda.Function(this, 'WSConnectHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'connect.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/dist/ws')),
      environment: {
        TABLE_NAME: table.tableName,
      },
    });

    const disconnectHandler = new lambda.Function(this, 'WSDisconnectHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'disconnect.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/dist/ws')),
      environment: {
        TABLE_NAME: table.tableName,
      },
    });

    const defaultHandler = new lambda.Function(this, 'WSDefaultHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'default.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/dist/ws')),
      environment: {
        TABLE_NAME: table.tableName,
      },
      timeout: cdk.Duration.seconds(30),
    });

    // Grant permissions
    table.grantReadWriteData(connectHandler);
    table.grantReadWriteData(disconnectHandler);
    table.grantReadWriteData(defaultHandler);

    // Grant WebSocket management permissions to default handler
    defaultHandler.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['execute-api:ManageConnections'],
        resources: [
          `arn:aws:execute-api:${this.region}:${this.account}:${wsApi.apiId}/${wsStage.stageName}/POST/@connections/*`,
        ],
      })
    );

    // WebSocket integrations
    wsApi.addRoute('$connect', {
      integration: new apigatewayv2Integrations.WebSocketLambdaIntegration(
        'ConnectIntegration',
        connectHandler
      ),
    });

    wsApi.addRoute('$disconnect', {
      integration: new apigatewayv2Integrations.WebSocketLambdaIntegration(
        'DisconnectIntegration',
        disconnectHandler
      ),
    });

    wsApi.addRoute('$default', {
      integration: new apigatewayv2Integrations.WebSocketLambdaIntegration(
        'DefaultIntegration',
        defaultHandler
      ),
    });

    this.wsUrl = `${wsApi.apiEndpoint}/${wsStage.stageName}`;

    // HTTP API for control plane
    const httpApi = new apigateway.RestApi(this, 'LastWordsHTTP', {
      restApiName: 'LastWordsHTTP',
      deployOptions: {
        stageName: 'prod',
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    // HTTP Lambda functions
    const createLobbyHandler = new lambda.Function(this, 'CreateLobbyHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'createLobby.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/dist/http')),
      environment: {
        TABLE_NAME: table.tableName,
      },
    });

    const joinLobbyHandler = new lambda.Function(this, 'JoinLobbyHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'joinLobby.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/dist/http')),
      environment: {
        TABLE_NAME: table.tableName,
      },
    });

    const startMatchHandler = new lambda.Function(this, 'StartMatchHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'startMatch.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/dist/http')),
      environment: {
        TABLE_NAME: table.tableName,
        WS_URL: this.wsUrl,
      },
      timeout: cdk.Duration.seconds(30),
    });

    const chimeAttendeeHandler = new lambda.Function(this, 'ChimeAttendeeHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'chimeAttendee.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/dist/http')),
      environment: {
        TABLE_NAME: table.tableName,
      },
    });

    // Grant permissions
    table.grantReadWriteData(createLobbyHandler);
    table.grantReadWriteData(joinLobbyHandler);
    table.grantReadWriteData(startMatchHandler);
    table.grantReadData(chimeAttendeeHandler);

    // Grant Chime permissions
    const chimePolicy = new iam.PolicyStatement({
      actions: [
        'chime:CreateMeeting',
        'chime:CreateAttendee',
        'chime:CreateMeetingWithAttendees',
      ],
      resources: ['*'],
    });
    startMatchHandler.addToRolePolicy(chimePolicy);
    chimeAttendeeHandler.addToRolePolicy(chimePolicy);

    // HTTP routes
    const lobbies = httpApi.root.addResource('lobbies');
    lobbies.addMethod('POST', new apigateway.LambdaIntegration(createLobbyHandler));

    const lobby = lobbies.addResource('{id}');
    const lobbyJoin = lobby.addResource('join');
    lobbyJoin.addMethod('POST', new apigateway.LambdaIntegration(joinLobbyHandler));

    const matches = httpApi.root.addResource('matches');
    const matchStart = matches.addResource('start');
    matchStart.addMethod('POST', new apigateway.LambdaIntegration(startMatchHandler));

    const match = matches.addResource('{id}');
    const chimeResource = match.addResource('chime');
    const attendee = chimeResource.addResource('attendee');
    attendee.addMethod('POST', new apigateway.LambdaIntegration(chimeAttendeeHandler));

    this.httpUrl = httpApi.url;

    // Outputs
    new cdk.CfnOutput(this, 'WebSocketURL', {
      value: this.wsUrl,
      exportName: 'LastWordsWebSocketURL',
    });

    new cdk.CfnOutput(this, 'HTTPURL', {
      value: this.httpUrl,
      exportName: 'LastWordsHTTPURL',
    });
  }
}
