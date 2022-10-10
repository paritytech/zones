import * as Z from "../../mod.ts";
import { Client, client } from "../client.ts";
import { stream } from "../Stream.ts";

function clientStream<Client_ extends Z.$<Client>>(client: Client_) {
  return stream<unknown>()(client, (client) => {
    return {
      open(push) {
        return client.listen((stop) => {
          this.close = stop;
          return push;
        });
      },
      close: () => {},
    };
  });
}

interface SendProps {
  method: string;
  args: unknown[];
}

const clientStream_ = clientStream(client("wss..."));
type G = Z.E<typeof clientStream_>;

function call<
  Client_ extends Z.$<Client>,
  Payload extends Z.Rec$<SendProps>,
>(
  client: Client_,
  payload: Payload,
) {
  const clientStream_ = clientStream(client);
  const id = Z.call(client, (client) => client.id());
  const call = Z.call(
    Z.rec({ client, payload: Z.rec(payload) }),
    ({ client, payload }) => client.send(payload),
  );
  // NO
  // const filtered = Z.filter((event) => {
  //   return event.id === id;
  // });
  // const once = Z.once(filtered);
}
