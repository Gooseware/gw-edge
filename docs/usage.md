# Usage

Once Vitedge is installed, you can use its CLI for developing and building.

## Development

There are 2 ways to run the app locally for development:

- SPA mode: `vitedge dev` command runs Vite directly without any SSR.
- SSR mode: `vitedge dev --ssr` command spins up a local SSR server.

SPA mode will be somewhat faster but the SSR one will have closer behavior to a production environment.

You can pass any Vite's CLI option to this command. E.g. `vitedge dev --open --port 1337`.

::: tip
The local SSR server is a Node.js environment to speed up development. This might have some inconsistencies at times with Worker environments, especially if you have third-party dependencies that rely on Node APIs instead of Web Standards. For testing your app in a Worker environment, have a look at [preview mode](#preview).
:::

### Custom dev servers

If you are deploying to Node.js environments, it might be interesting running the development environment using your own Node server. Just like Vite itself, Vitedge can run in middleware mode as follows:

```js
// my-server.js
import express from 'express'
import { createSsrServer } from 'vitedge/dev'

async function createServer() {
  const app = express()

  // Create Vitedge server in middleware mode
  const viteServer = await createSsrServer({
    server: { middlewareMode: 'ssr' },
  })

  // Use Vite's connect instance as middleware
  app.use(viteServer.middlewares)

  app.listen(3000)
}

createServer()
```

Since Vitedge requires experimental Node flags and other features when running (e.g. TypeScript, ESM and JSON imports), you can run your server using one of the following commands:

```bash
# Simple version, Vitedge applies flags
vitedge dev --ssr --middleware ./my-server.js

# Raw version for TS, manual flags
node --loader vitedge/dev/ts-loader.js --experimental-json-modules --experimental-specifier-resolution=node ./my-server.js

# Raw version for JS, manual flags
node --loader vitedge/dev/js-loader.js --experimental-json-modules --experimental-specifier-resolution=node ./my-server.js
```

If you are using CommonJS and have problems importing from `vitedge/dev`, try requiring from `vitedge/dev/index.cjs` instead.

## Production

Once the app is ready, run `vitedge build` to create 3 different builds:

- SPA build in `dist/client`.
- SSR build in `dist/ssr`
- API build in `dist/functions`

### Deploying to a Node.js environment

Any Node.js environment, such as a full server or a serverless function (Netlify, Vercel, GCP, AWS...) just need to import the built files and use them. You can find a simple Express.js example [here](https://github.com/frandiox/vitedge/tree/master/examples/node-server/index.js).

### Deploying to Cloudflare Workers

Create a worker entry script and import Vitedge to handle the event:

```js
import { handleEvent } from 'vitedge/worker'

addEventListener('fetch', (event) => {
  event.respondWith(handleEvent(event))
})
```

See a full example [here](https://github.com/frandiox/vitedge/tree/master/examples/worker-site/index.js).

::: warning NOTE
Worker Modules format is not yet supported due to a [bug in `kv-asset-handler` package](https://github.com/cloudflare/kv-asset-handler/issues/174).
:::

Currently, there are two ways to generate a bundled worker script and deploy using Wrangler CLI: Webpack or ESBuild.

#### Webpack

Make sure your `package.json`'s `main` field points to the worker **entry file** (i.e. where you use `addEventListener`, not the script output). This file can be located anywhere, but it is common to place it in `<root>/worker-site/index.js` and have a separate `<root>/worker-site/package.json` as well. Full example [here](https://github.com/frandiox/vitedge/tree/master/examples/worker-site).

Using Wrangler's Webpack build, add the following to your `<root>/worker-site/wrangler.toml`:

```toml
name = "<your app>"
account_id = "<your id>"
type = "webpack"
workers_dev = true
route = ""
zone_id = ""
webpack_config = "webpack.config.js"

[site]
bucket = "dist/client"
entry-point = "."
```

Import Vitedge's webpack configuration in your worker's webpack config file:

```js
module.exports = {
  // Add your own config here if you need
  ...require('vitedge/webpack.cjs')(options),
}
```

It will figure out the project root if this is under a Vite project directory. If it's not, then pass `{ root: '/path/to/project' }` as the options.

#### ESBuild

::: warning WARNING
ESBuild bundler is experimental, make sure you test your app before switching from Webpack.
:::

Vitedge can generate a worker script ready to be deployed using ESBuild. Follow these steps:

1. Move your worker entry file to `<root>/functions/index.js` (or `*.ts`).
2. Add `"main" : "dist/worker/script.js"` to your `<root>/package.json`.
3. Place your `wrangler.toml` file at the root (next to `package.json`) with the following content:

```toml
name = "<your app>"
account_id = "<your id>"
type = "javascript"
workers_dev = true
route = ""
zone_id = ""

[site]
bucket = "dist/client"
entry-point = "."

[build]
command = ""
watch_dir = "dist/worker"

[build.upload]
format = "service-worker"
```

If all these requirements are met, `vitedge build` command will generate an extra bundled worker script in `dist/worker/script.js`. Use this generated script to deploy with `wrangler publish`, or test your app with `wrangler dev`.

## Preview

> Only available when deploying to Cloudflare Workers. Node.js preview will be added later.

There is an experimental `vitedge preview` command which uses [Miniflare](https://github.com/mrbbot/miniflare) to imitate a Cloudflare Worker environment locally. This helps testing your app in a worker environment faster than using `wrangler dev`. Note that the preview mode is slower than normal development mode since it needs to bundle your app and run it in a sandbox.

To use the preview mode, install `miniflare@^1.3.3` as a dev-dependency in your project and follow the same steps as in [Build#ESBuild](#esbuild). Then, you can either run `vitedge build && vitedge preview` for a one-off preview, or `vitedge preview --build-watch` for incrementally building the worker when the source code changes.

The following flags from Miniflare are supported:

```bash
--wrangler-config   Path to wrangler.toml                         [string]
--wrangler-env      Environment in wrangler.toml to use           [string]
--https             Enable self-signed HTTPS
--https-key         Path to PEM SSL key                           [string]
--https-cert        Path to PEM SSL cert chain                    [string]
--https-ca          Path to SSL trusted CA certs                  [string]
--https-pfx         Path to PFX/PKCS12 SSL key/cert chain         [string]
--https-passphrase  Passphrase to decrypt SSL files               [string]
```
