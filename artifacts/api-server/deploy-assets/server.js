/**
 * server.js — iisnode entry point (CommonJS)
 *
 * iisnode requires the Node.js entry to be a plain .js file.
 * This thin wrapper dynamically imports the ESM server bundle
 * (server-deploy.mjs) which is compiled by esbuild from server-deploy.ts.
 *
 * Dynamic import() is available in CommonJS modules (Node 12+), so no
 * "type":"module" is needed in package.json.
 */

// iisnode sets PORT to a Windows named-pipe string such as
//   \\.\pipe\iisnode\brainepedia\1\0
// Make sure the env var survives into the child ESM module.
// (It is already in process.env — no action needed; this comment is
//  intentional documentation for future maintainers.)

import('./server-deploy.mjs').catch(function (err) {
  console.error('[server.js] Failed to load server-deploy.mjs:', err);
  process.exit(1);
});
