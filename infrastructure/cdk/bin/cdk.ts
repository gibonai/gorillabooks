#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { CdkStack } from '../lib/cdk-stack';

const app = new cdk.App();

// Get context parameters from CLI (e.g., -c domainName=example.com)
const domainName = app.node.tryGetContext('domainName');
const hostedZoneId = app.node.tryGetContext('hostedZoneId');
const environment = app.node.tryGetContext('environment') || 'production';
const appName = app.node.tryGetContext('appName') || 'gorillabooks';

new CdkStack(app, 'GorillaBooks', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
  },
  domainName,
  hostedZoneId,
  environment,
  appName,
});
