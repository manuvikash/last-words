#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DataStack } from '../lib/data-stack';
import { ApiStack } from '../lib/api-stack';
import { WebStack } from '../lib/web-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
};

const dataStack = new DataStack(app, 'LastWordsDataStack', { env });
const apiStack = new ApiStack(app, 'LastWordsApiStack', {
  env,
  table: dataStack.table,
});
const webStack = new WebStack(app, 'LastWordsWebStack', {
  env,
  wsUrl: apiStack.wsUrl,
  httpUrl: apiStack.httpUrl,
});

app.synth();
