import { Placeholder, PlaceholderApplied } from "../../Placeholder.ts";
import * as U from "../../util.ts";
import * as c from "./common.ts";

export type DisallowOverrides<T extends PlaceholderApplied[]> = {
  [K in keyof T]: K extends DisallowOverrides._0<T> ? T[K]
    : c.SolePlaceholderApplied;
};
namespace DisallowOverrides {
  export type _0<T extends PlaceholderApplied[]> = Parameters<
    _0_Assert<
      U.ValueOf<
        U.U2I<
          U.ValueOf<
            {
              [K in keyof T as K extends `${number}` ? K : never]: T[K] extends
                PlaceholderApplied<Placeholder<infer PK>>
                ? { [_ in PK]: (key: K) => void }
                : never;
            }
          >
        >
      >
    >
  >[0];
  type _0_Assert<T> = T extends ((i: any) => void) ? T : never;
}

declare function overridesDisallowed<T extends PlaceholderApplied[]>(
  ...rest: DisallowOverrides<T>
): void;

overridesDisallowed(
  // @ts-expect-error: intentional
  c.clientFactory("wss..."),
  c.clientFactory("wss..."),
  c.retryDelay(100),
  c.retryDelay(100),
  c.logger(console.log),
  c.logger(console.log),
);
