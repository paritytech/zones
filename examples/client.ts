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

  close = () => {
    return new Promise<void>((resolve) => {
      setTimeout(resolve, 1000);
    });
  };

  send = (methodName: string) => {
    return new Promise<Record<PropertyKey, unknown>>((resolve) => {
      return setTimeout(() => {
        resolve({
          methodName,
          fakeResult: {
            a: "A",
            b: 3,
            c: true,
          },
        });
      }, 1000);
    });
  };
}

function client<Url extends Z.$<string>>(url: Url) {
  return Z.drop(
    Z.call(url, (url) => {
      console.log("CONNECT");
      if (false as boolean) {
        return new ClientConnectError();
      }
      return new InnerClient(url);
    }),
    (client) => {
      console.log("DISCONNECT");
      if (false as boolean) {
        return new ClientDisconnectError();
      }
      return client.close();
    },
  );
}

function call<Client extends Z.$<InnerClient>, Method extends Z.$<string>>(
  client: Client,
  method: Method,
) {
  return Z.call(Z.ls(client, method), ([client, method]) => {
    console.log("CALL");
    return client.send(method);
  });
}

const root = call(client("wss://rpc.polkadot.io"), "HELLO");

const result = await Z.run()(root);

console.log(U.throwIfError(result));
