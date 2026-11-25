/** Explicit HTTP-only loopback dialer. URL identities may come from the catalog;
 * response content is fictional and only 127.0.0.1 is dialed. No public DNS/TLS occurs. */
import { createServer, request, type IncomingMessage, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import type { RequestOptions } from "node:https";
import { createFixtureSourceTransport } from "../../../lib/monitoring/transport";
export async function loopback(handler: (request: IncomingMessage, response: ServerResponse) => void) {
  const calls: { path: string; headers: IncomingMessage["headers"] }[] = [], options: RequestOptions[] = [];
  const server = createServer((req,res) => { calls.push({ path: req.url!, headers: req.headers }); handler(req,res); });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const port = (server.address() as AddressInfo).port;
  const transport = createFixtureSourceTransport({
    resolve: async () => [{ address: "93.184.216.34", family: 4 }],
    dial: (input, onResponse) => {
      options.push(input);
      return request({ hostname: "127.0.0.1", port, method: "GET", path: input.path, headers: input.headers, agent: false, maxHeaderSize: input.maxHeaderSize }, onResponse);
    },
  });
  return { transport, calls, options, close: () => new Promise<void>(resolve => { server.closeAllConnections(); server.close(() => resolve()); }) };
}
