import * as Z from "../mod.ts";

const first_ = Symbol();
const first = Z._<string>()(first_);

const second_ = Symbol();
const second = Z._<number>()(second_);

const third_ = Symbol();
const third = Z._<boolean>()(third_);

const run = Z.runtime(first.a("HELLO"));

const root = Z.call(Z.ls(first, second, third), ([first, second, third]) => {
  console.log({ first, second, third });
  return second * 42;
});

const result = await run(root, (_) =>
  _(
    second.a(100),
    third.a(true),
  ));

console.log(result);
