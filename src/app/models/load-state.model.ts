export type LoadState<T> =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'loaded'; data: T };
