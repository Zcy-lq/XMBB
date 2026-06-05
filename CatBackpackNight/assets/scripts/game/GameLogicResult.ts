export type GameLogicErrorCode =
  | 'config_missing'
  | 'invalid_input'
  | 'insufficient_currency'
  | 'insufficient_item'
  | 'inventory_full'
  | 'already_claimed'
  | 'already_purchased'
  | 'daily_limit_reached'
  | 'not_ready'
  | 'not_owned'
  | 'locked'
  | 'max_level'
  | 'prerequisite_missing'
  | 'ad_not_completed'
  | 'unavailable';

export interface GameLogicResult<T = void> {
  ok: boolean;
  data?: T;
  reason?: GameLogicErrorCode;
  message: string;
}

export function success<T = void>(data?: T, message = 'ok'): GameLogicResult<T> {
  return { ok: true, data, message };
}

export function failure<T = void>(reason: GameLogicErrorCode, message: string, data?: T): GameLogicResult<T> {
  return { ok: false, reason, message, data };
}

export function failureFrom<T>(result: GameLogicResult): GameLogicResult<T> {
  return failure<T>(result.reason ?? 'invalid_input', result.message);
}
