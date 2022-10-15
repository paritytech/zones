import * as Z from "../mod.ts";
import * as U from "../util/mod.ts";

class ClientConnectError extends Error {
  override readonly name = "ClientConnectError";
}
class ClientDisconnectError extends Error {
  override readonly name = "ClientDisconnectError";
}

/** Fake client (to mock interaction with interfaces such as `WebSockets`) */
class InnerClient {
  constructor(readonly discoveryValue: string) {}

  close = (): Promise<void | ClientDisconnectError> => {
    return new Promise<void>((resolve) => {
      setTimeout(resolve, 1000);
    });
  };

  send = (methodName: string, args: unknown[]) => {
    return new Promise<{
      methodName: string;
      args: unknown[];
    }>((resolve) => {
      return setTimeout(() => {
        resolve({ methodName, args });
      }, 1000);
    });
  };
}

function client<Url extends Z.$<string>>(url: Url) {
  return Z.call(url, (url) => {
    console.log("ENTER CLIENT");
    if (false as boolean) {
      return new ClientConnectError();
    }
    return new InnerClient(url);
  });
}

function call<
  Client extends Z.$<InnerClient>,
  Method extends Z.$<string>,
  Args extends Z.Ls$<unknown[]>,
>(
  client: Client,
  method: Method,
  args: Args,
) {
  return Z.call(
    Z.ls(client, method, Z.ls(...args), Z.rc(client)),
    async ([client, method, args, clientRc]) => {
      console.log("ENTER CALL");
      const result = await client.send(method, args);
      if (clientRc == 2) {
        console.log("CLOSE CLIENT");
        const maybeCloseError = await client.close();
        if (maybeCloseError instanceof Error) return maybeCloseError;
      }
      return result;
    },
  );
}

const root = call(client("wss://rpc.polkadot.io"), "someMethod", [1, 2, 3]);

const result = await Z.runtime()(root);

console.log(U.throwIfError(result));
