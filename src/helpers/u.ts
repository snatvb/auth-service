export * as array from './array'

export function excludeDirty<A extends object, Key extends keyof A>(
  user: A,
  keys: Key[],
): Omit<A, Key> {
  for (const key of keys) {
    delete user[key]
  }
  return user
}
