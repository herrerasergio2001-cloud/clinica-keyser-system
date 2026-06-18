export type UUID = string;

export type ApiResult<T> = {
  data: T;
  meta?: Record<string, unknown>;
};
