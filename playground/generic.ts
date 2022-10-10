declare function callFactory(def: (x: any) => any): any;

// TODO: (or maybe not) constrain to be unary, where the param is obj,
// as this would force a situation in which doc comments aren't useful
// (docs can be attached to prop keys)... nah

export const theoreticalAdd = callFactory((def) => {
  return def(
    <A extends string | number, B extends string | number>(
      a: A,
      b: B,
    ): A extends string ? string : B extends string ? string : number => {
      return ({ [typeof a]: true, [typeof b]: true })["string"]
        ? `${a}_${b}`
        : (a as number) + (b as number) as any;
    },
  );
});
