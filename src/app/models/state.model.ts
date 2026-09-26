export type State<T> =
  | { state: 'loading' }
  | { state: 'empty' }
  | { state: 'error' }
  | ({ state: 'loaded' } & T);
