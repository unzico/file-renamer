export function toPromise<T>(value: T) {
  return new Promise<T>((res) => res(value));
}
