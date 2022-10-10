import { _ } from "../../Placeholder.ts";

export const clientFactory_ = Symbol();
export const clientFactory = _<string>()(clientFactory_);

export const retryDelay_ = Symbol();
export const retryDelay = _<number>()(retryDelay_);

export const logger_ = Symbol();
export const logger = _<(...messages: unknown[]) => void>()(logger_);

const sole_application = Symbol();
export interface SolePlaceholderApplied {
  [sole_application]: true;
}
