import * as Z from "../../mod.ts";
import { Client, client } from "../client.ts";
import { stream } from "../Stream.ts";

//
//
//

type Cb = (event: unknown) => void;
const cbCtx = Z.ctx<{ cb?: Cb }>(() => ({}));

interface Block {}

// all we need is `map`, `filter` and maybe one more util to pipe events into other effects
const watch_ = stream<Block>()(client, (_client) => ({
  open(_push) {
    return undefined!;
  },
  close: () => {},
}));

// const newHeadsStream = C.rpcSub(client, "chain_subscribeNewHeads");
// const blockNumStream = Z.select(newHeadsStream, "params", "result", "number");
// const blockHashStream = C.rpcCall(client, "chain_getBlockHash", blockNumStream);
// const blockStream = C.blockRead(Z.select(blockHashStream, "result"));

// const watchMapped_ = rpcCall(
//   "chain_getBlock",
//   Z.select(
//     Z.select(
//       "result",
//     ),
//     "number",
//   ),
// );

// function rpcWatch<Client$ extends Z.$<Client>>(client: Client$) {
//   const common = Z.ls(client, cbCtx(client));

//   // should we be able to somehow hook into non-stop-triggered watch exits?
//   const watch = Z.stream<unknown>()(common, ([client, ctx]) => {
//     return (push, done) => {
//       ctx.cb = (event: unknown) => {
//         push(event);
//       };
//       return client.watch(ctx.cb);
//     };
//   });

//   const unwatch = Z.call(common, ([client, ctx]) => {
//     return client.unwatch(ctx.cb);
//   });

//   return Z.drop(watch, unwatch);
// }

// interface RpcCallProps {
//   client: Client;
//   method: string;
//   args: unknown[];
// }

// function rpcCall<Props$ extends Z.Rec$<RpcCallProps>>(props: Props$) {
//   const id = Z.id(props);

//   const predicate = Z.call(id, (id) => {
//     return (e: { id: string }) => {
//       e.id === id;
//     };
//   });

//   const rpcWatch_ = rpcWatch(props.client);

//   const filtered = Z.watch.filter(rpcWatch_, predicate);

//   const rpcCall_ = Z.call(Z.ls(props, id, filtered), async ([props, id]) => {
//     const sendResult = await props.client.send(props.method, id, props.args);
//     if (sendResult instanceof Error) {
//       return sendResult;
//     }
//     return;
//   });

//   return Z.call(watch.once(), rpcCall_);
// }

// function rpcSubscription<Props$ extends Z.Rec$<RpcCallProps>>(
//   props: Props$,
// ) {
// const ctx = Z.ctx<{ id?: string }>(() => ({}))(props);
// const call = Z.call(Z.ls(ctx), (ctx) => {});
// return Z.filter(
//   rpcWatch(props.client),
// );
// const octx = Z.unique();
// const id = Z.val<string>;
// const watch = Z.watch(Z.ls(client, id), ([client, id]) => {
//   return (push) => {};
// });
// const call = rpcCall(client, method, args);
// const set = Z.call(Z.ls(call, id), ([call, id]) => id.set(call.id));
// return Z.watch<Block>()(client, (client) => {
//   return (yield, done) => {
//     return client.subscribe(method, args, yield);
//   };
// });
// }
