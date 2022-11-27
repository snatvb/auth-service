export function renderText<T extends Record<string, string | number>>(
  text: string,
  params: T,
) {
  return text.replace(/\${([^}]+)}/g, (_, key) => {
    return String(params[key])
  })
}
