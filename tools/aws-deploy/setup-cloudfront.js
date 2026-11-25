'use strict';

/**
 * Creates a CloudFront distribution in front of the deploy bucket using
 * Origin Access Control (OAC), so the bucket stays private.
 *
 * Requires IAM permissions:
 *   cloudfront:CreateOriginAccessControl, cloudfront:CreateDistribution,
 *   cloudfront:GetDistribution, cloudfront:ListDistributions,
 *   s3:PutBucketPolicy, s3:GetBucketPolicy
 *
 * Usage:
 *   node --env-file-if-exists=.env tools/aws-deploy/setup-cloudfront.js --dry-run
 *   node --env-file-if-exists=.env tools/aws-deploy/setup-cloudfront.js
 */

const AWS = require('aws-sdk');

const DEFAULT_LOCALE = 'es';
const CACHING_OPTIMIZED = '658327ea-f89d-4fab-a63d-7e88639e58f6';
const FUNCTION_NAME = 'ngx-aws-deploy-spa-router';

// DefaultRootObject only applies to "/", so directory requests such as /en/ reach
// the origin as-is and 403. This rewrites them to the locale index document and
// sends extension-less SPA routes to the index of their own locale.
const FUNCTION_CODE = `function handler(event) {
  var request = event.request;
  var uri = request.uri;

  if (uri.endsWith('/')) {
    request.uri = uri + 'index.html';
    return request;
  }

  var lastSegment = uri.substring(uri.lastIndexOf('/') + 1);
  if (lastSegment.indexOf('.') === -1) {
    var locale = uri.split('/')[1] === 'en' ? 'en' : 'es';
    request.uri = '/' + locale + '/index.html';
  }

  return request;
}
`;

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value;
}

function buildDistributionConfig({ bucket, region, oacId, comment, functionArn }) {
  const originId = `s3-${bucket}`;

  return {
    CallerReference: `ngx-aws-deploy-${Date.now()}`,
    Comment: comment,
    Enabled: true,
    DefaultRootObject: 'index.html',
    Origins: {
      Quantity: 1,
      Items: [
        {
          Id: originId,
          DomainName: `${bucket}.s3.${region}.amazonaws.com`,
          S3OriginConfig: { OriginAccessIdentity: '' },
          OriginAccessControlId: oacId,
        },
      ],
    },
    DefaultCacheBehavior: {
      TargetOriginId: originId,
      ViewerProtocolPolicy: 'redirect-to-https',
      TrustedSigners: { Enabled: false, Quantity: 0 },
      TrustedKeyGroups: { Enabled: false, Quantity: 0 },
      AllowedMethods: {
        Quantity: 2,
        Items: ['GET', 'HEAD'],
        CachedMethods: { Quantity: 2, Items: ['GET', 'HEAD'] },
      },
      Compress: true,
      CachePolicyId: CACHING_OPTIMIZED,
      ...(functionArn && {
        FunctionAssociations: {
          Quantity: 1,
          Items: [{ EventType: 'viewer-request', FunctionARN: functionArn }],
        },
      }),
    },
    CustomErrorResponses: {
      Quantity: 2,
      Items: [
        {
          ErrorCode: 403,
          ResponsePagePath: `/${DEFAULT_LOCALE}/index.html`,
          ResponseCode: '200',
          ErrorCachingMinTTL: 10,
        },
        {
          ErrorCode: 404,
          ResponsePagePath: `/${DEFAULT_LOCALE}/index.html`,
          ResponseCode: '200',
          ErrorCachingMinTTL: 10,
        },
      ],
    },
    HttpVersion: 'http2',
    IsIPV6Enabled: true,
    PriceClass: 'PriceClass_100',
  };
}

function buildBucketPolicy({ bucket, distributionArn }) {
  return {
    Version: '2012-10-17',
    Statement: [
      {
        Sid: 'AllowCloudFrontServicePrincipalReadOnly',
        Effect: 'Allow',
        Principal: { Service: 'cloudfront.amazonaws.com' },
        Action: 's3:GetObject',
        Resource: `arn:aws:s3:::${bucket}/*`,
        Condition: { StringEquals: { 'AWS:SourceArn': distributionArn } },
      },
    ],
  };
}

async function ensureOriginAccessControl(cloudFront, name, bucket) {
  if (process.env.NG_DEPLOY_AWS_OAC_ID) {
    return { Id: process.env.NG_DEPLOY_AWS_OAC_ID };
  }

  let existing;
  try {
    existing = await cloudFront.listOriginAccessControls({}).promise();
  } catch (error) {
    if (error.code !== 'AccessDenied') {
      throw error;
    }
    throw new Error(
      'cloudfront:ListOriginAccessControls is denied. Set NG_DEPLOY_AWS_OAC_ID to reuse an existing OAC, or grant that permission.',
    );
  }

  const match = (existing.OriginAccessControlList.Items || []).find((item) => item.Name === name);
  if (match) {
    return match;
  }

  const created = await cloudFront
    .createOriginAccessControl({
      OriginAccessControlConfig: {
        Name: name,
        Description: `OAC for ${bucket}`,
        SigningProtocol: 'sigv4',
        SigningBehavior: 'always',
        OriginAccessControlOriginType: 's3',
      },
    })
    .promise();

  return created.OriginAccessControl;
}

async function ensureFunction(cloudFront, name) {
  let existing;
  try {
    existing = await cloudFront.getFunction({ Name: name, Stage: 'LIVE' }).promise();
  } catch (error) {
    if (error.code !== 'NoSuchFunctionExists' && error.code !== 'AccessDenied') {
      throw error;
    }
  }

  if (existing) {
    return existing.FunctionSummary.FunctionMetadata.FunctionARN;
  }

  const created = await cloudFront
    .createFunction({
      Name: name,
      FunctionConfig: { Comment: 'SPA and locale index routing', Runtime: 'cloudfront-js-2.0' },
      FunctionCode: Buffer.from(FUNCTION_CODE),
    })
    .promise();

  await cloudFront
    .publishFunction({ Name: name, IfMatch: created.ETag })
    .promise();

  return created.FunctionSummary.FunctionMetadata.FunctionARN;
}

async function ensureDistribution(cloudFront, { bucket, region, oacId, comment, functionArn }) {
  const existing = await cloudFront.listDistributions({ MaxItems: '100' }).promise();
  const items = (existing.DistributionList && existing.DistributionList.Items) || [];
  const match = items.find(
    (item) =>
      item.Comment === comment &&
      (item.Origins.Items || []).some(
        (origin) => origin.DomainName === `${bucket}.s3.${region}.amazonaws.com`,
      ),
  );

  if (match) {
    const full = await cloudFront.getDistribution({ Id: match.Id }).promise();
    const config = full.Distribution.DistributionConfig;
    const associated = (
      (config.DefaultCacheBehavior.FunctionAssociations || {}).Items || []
    ).some((item) => item.FunctionARN === functionArn);

    if (associated) {
      return full.Distribution;
    }

    const updated = await cloudFront
      .updateDistribution({
        Id: match.Id,
        IfMatch: full.ETag,
        DistributionConfig: buildDistributionConfig({
          bucket,
          region,
          oacId,
          comment,
          functionArn,
        }),
      })
      .promise();

    return updated.Distribution;
  }

  const created = await cloudFront
    .createDistribution({
      DistributionConfig: buildDistributionConfig({
        bucket,
        region,
        oacId,
        comment,
        functionArn,
      }),
    })
    .promise();

  return created.Distribution;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const bucket = required('NG_DEPLOY_AWS_BUCKET');
  const region = required('NG_DEPLOY_AWS_REGION');
  const credentials = new AWS.Credentials({
    accessKeyId: required('NG_DEPLOY_AWS_ACCESS_KEY_ID'),
    secretAccessKey: required('NG_DEPLOY_AWS_SECRET_ACCESS_KEY'),
  });

  const cloudFront = new AWS.CloudFront({ region: 'us-east-1', credentials });
  const s3 = new AWS.S3({ region, credentials });

  const oacName = `${bucket}-oac`;
  const comment = `${bucket} static site`;

  if (dryRun) {
    const config = buildDistributionConfig({
      bucket,
      region,
      oacId: '<created-oac-id>',
      comment,
    });
    console.log('DRY RUN — no AWS resources will be created');
    console.log('OAC name: ' + oacName);
    console.log('Origin: ' + config.Origins.Items[0].DomainName);
    console.log('DefaultRootObject: ' + config.DefaultRootObject);
    console.log(
      'CustomErrorResponses: ' +
        config.CustomErrorResponses.Items.map((e) => `${e.ErrorCode}->${e.ResponsePagePath}`).join(', '),
    );
    console.log('Bucket policy resource: arn:aws:s3:::' + bucket + '/*');
    return;
  }

  const oac = await ensureOriginAccessControl(cloudFront, oacName, bucket);
  const oacId = oac.Id;
  console.log('Using OAC ' + oacId);

  const functionArn = await ensureFunction(cloudFront, FUNCTION_NAME);
  console.log('Using function ' + functionArn);

  const distribution = await ensureDistribution(cloudFront, {
    bucket,
    region,
    oacId,
    comment,
    functionArn,
  });
  console.log('Using distribution ' + distribution.Id);
  console.log('Domain: https://' + distribution.DomainName);

  await s3
    .putBucketPolicy({
      Bucket: bucket,
      Policy: JSON.stringify(
        buildBucketPolicy({ bucket, distributionArn: distribution.ARN }),
      ),
    })
    .promise();
  console.log('Applied bucket policy for ' + distribution.ARN);

  console.log('\nAdd this to .env and redeploy:');
  console.log('NG_DEPLOY_AWS_CF_DISTRIBUTION_ID=' + distribution.Id);
}

main().catch((error) => {
  console.error('FAILED ' + (error.code || '') + ' ' + error.message);
  process.exitCode = 1;
});

module.exports = { buildDistributionConfig, buildBucketPolicy, ensureDistribution };
