import { createServer as createHttpServer } from 'node:http';
import { createServer as createViteServer } from 'vite';
import { renderToString } from 'react-dom/server';
import { createElement } from 'react';
import { readFile } from 'node:fs/promises';

const vite = await createViteServer({
  server: { middlewareMode: true },
  appType: 'custom',
});

const { initState } = await vite.ssrLoadModule('/src/state.js');
initState();

const normalizeCss = await readFile('./node_modules/modern-normalize/modern-normalize.css', 'utf8');
const appCss = await readFile('./src/styles.css', 'utf8');

const server = createHttpServer((req, res) => {
  vite.middlewares(req, res, async () => {
    try {
      const { default: App } = await vite.ssrLoadModule('/src/App.jsx');
      const html = renderToString(createElement(App));

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>${normalizeCss}</style>
    <style>${appCss}</style>
  </head>
  <body>
    <div id="root">${html}</div>
    <script type="module">
      import RefreshRuntime from "/@react-refresh";
      RefreshRuntime.injectIntoGlobalHook(window);
      window.$RefreshReg$ = () => {};
      window.$RefreshSig$ = () => (type) => type;
      window.__vite_plugin_react_preamble_installed__ = true;
    </script>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`);
    } catch (err) {
      console.error('[SSR 出错]', err);
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('服务器出错：' + err.message);
    }
  });
});

server.listen(3000, () => {
  console.log('SSR 服务器：http://localhost:3000');
});
