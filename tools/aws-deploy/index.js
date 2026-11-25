'use strict';

const path = require('path');
const fs = require('fs');
const glob = require('glob');
const { createBuilder, targetFromTargetString } = require('@angular-devkit/architect');
const { Uploader } = require('@jefiozie/ngx-aws-deploy/src/lib/deploy/uploader');
const { CloudFront } = require('@jefiozie/ngx-aws-deploy/src/lib/deploy/cloudfront');

function resolveBrowserOutputPath(workspaceRoot, projectName, buildOptions) {
  const outputPath = buildOptions.outputPath ?? path.join('dist', projectName);
  const base = typeof outputPath === 'string' ? outputPath : outputPath.base;
  const browser = typeof outputPath === 'string' ? 'browser' : outputPath.browser ?? 'browser';

  return path.resolve(workspaceRoot, base, browser);
}

function getFiles(filesPath) {
  return glob
    .sync('**', {
      ignore: ['.git'],
      cwd: filesPath,
      nodir: true,
      dot: true,
    })
    .map((file) => file.split(path.sep).join('/'));
}

const ROOT_REDIRECT = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>Tijuana Rockea</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="canonical" href="/es/" />
    <meta http-equiv="refresh" content="0; url=/es/" />
    <script>
      window.location.replace('/es/' + window.location.search + window.location.hash);
    </script>
  </head>
  <body>
    <p><a href="/es/">Continuar en español</a> · <a href="/en/">Continue in English</a></p>
  </body>
</html>
`;

// The localized build only emits <locale>/index.html, so the bucket root has no
// document. Write a redirect there so https://<host>/ resolves to the default locale.
function ensureRootRedirect(outputPath) {
  const rootIndex = path.join(outputPath, 'index.html');
  if (fs.existsSync(rootIndex)) {
    return false;
  }

  fs.writeFileSync(rootIndex, ROOT_REDIRECT, 'utf8');
  return true;
}

module.exports.default = createBuilder(async (options, context) => {
  context.reportStatus('Executing deployment');

  const projectName = context.target?.project;
  if (!projectName) {
    throw new Error('Cannot deploy the application without a target');
  }

  const buildTarget = options.buildTarget || `${projectName}:build:production`;
  let deployTarget = `${projectName}:deploy`;
  if (context.target.configuration) {
    deployTarget += `:${context.target.configuration}`;
  }

  const { bucket, region, subFolder } = await context.getTargetOptions(
    targetFromTargetString(deployTarget),
  );
  const deployConfig = { bucket, region, subFolder };

  let outputPath;
  if (options.noBuild) {
    context.logger.info('📦 Skipping build');
    const buildOptions = await context.getTargetOptions(targetFromTargetString(buildTarget));
    outputPath = resolveBrowserOutputPath(context.workspaceRoot, projectName, buildOptions);
  } else {
    const overrides = { ...(options.baseHref && { baseHref: options.baseHref }) };
    const build = await context.scheduleTarget(targetFromTargetString(buildTarget), overrides);
    const buildResult = await build.result;

    if (!buildResult.success) {
      return { success: false, error: '❌ Application build failed' };
    }

    context.logger.info('✔ Build Completed');
    const buildOptions = await context.getTargetOptions(targetFromTargetString(buildTarget));
    outputPath = resolveBrowserOutputPath(context.workspaceRoot, projectName, buildOptions);
  }

  if (ensureRootRedirect(outputPath)) {
    context.logger.info('✔ Added root index.html redirect to /es/');
  }

  const files = getFiles(outputPath);
  if (files.length === 0) {
    throw new Error('Target did not produce any files, or the path is incorrect.');
  }

  context.logger.info('Start uploading files...');
  const uploader = new Uploader(context, deployConfig);
  const uploaded = await uploader.upload(files, outputPath);
  if (!uploaded) {
    return { success: false, error: '❌ Error during files upload' };
  }

  // CloudFront's DefaultRootObject only covers "/", so a request for "/en/" reaches
  // the origin as a directory and 403s. Storing each locale index under a
  // trailing-slash key makes those URLs resolve without a CloudFront Function.
  const directoryIndexes = files.filter((file) => /^[^/]+\/index\.html$/.test(file));
  for (const file of directoryIndexes) {
    const locale = file.split('/')[0];
    await uploader.uploadFile(path.join(outputPath, file), `${locale}/`);
  }

  context.logger.info('✔ Finished uploading files...');

  context.logger.info('Start CloudFront invalidation...');
  const cloudFront = new CloudFront(context, deployConfig);
  const invalidated = await cloudFront.invalidate();
  if (!invalidated) {
    return { success: false, error: '❌ Error during CloudFront invalidation' };
  }
  context.logger.info('✔ Finished CloudFront invalidation...');

  return { success: true };
});

module.exports.resolveBrowserOutputPath = resolveBrowserOutputPath;
