// Sends `import 'typescript'` to the TypeScript 5 copy (see i18n.mjs).
export async function resolve(specifier, context, next) {
  if (specifier === 'typescript') {
    return next('typescript5', {
      ...context,
      parentURL: new URL('../package.json', import.meta.url).href,
    })
  }
  return next(specifier, context)
}
