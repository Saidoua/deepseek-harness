/** Inline stylesheet imports: the client bundler and Vite both resolve `?inline` to the CSS text. */
declare module '*.css?inline' {
  const css: string
  export default css
}
