import * as Z from "../mod.ts";

export function client<Url extends Z.$<string>>(url: Url) {
  return Z.use(url, (_url) => {
    return Z.drop(
      Z.call(() => {
        return undefined! as Promise<Client | _ClientConnectError>;
      }),
      (client) => {
        return client.disconnect();
      },
    );
  });
}

const endpoint_ = Symbol();
const endpoint = Z._<string>()(endpoint_);

const client_ = client(endpoint);

const run = Z.run({
  apply: [endpoint("wss...")],
});
const result = await run(client_, undefined!);

//
//
//

export interface Client {
  id(): string;
  listen(
    init: (stop: () => void) => (message: unknown) => void,
  ): Promise<void | _ClientListenError>;
  send(props: {
    method: string;
    args: unknown[];
  }): _ClientSendError | void;
  disconnect(): Promise<void | _ClientDisconnectError>;
}

class _ClientConnectError extends Error {}
class _ClientSendError extends Error {}
class _ClientListenError extends Error {}
class _ClientDisconnectError extends Error {}
