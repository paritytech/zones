import * as Z from "../mod.ts";

class ClientConnectError extends Error {
  override readonly name = "ClientConnectError";
}
class ClientDisconnectError extends Error {
  override readonly name = "ClientDisconnectError";
}

export function client<Url extends Z.$<string>>(url: Url) {
  return Z.drop(
    Z.call(url, (url) => {
      console.log("CONNECT");
      if (false as boolean) {
        return new ClientConnectError();
      }
      return new WebSocket(url);
    }),
    (client) => {
      console.log("DISCONNECT");
      if (false as boolean) {
        return new ClientDisconnectError();
      }
      client.close();
      return;
    },
  );
}

const root = client("wss://rpc.polkadot.io");

const result = await Z.run()(root);

console.log(Z.throwIfError(result));
