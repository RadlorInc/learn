// Built into the learning app's public/ folder, where /play loads it in a frame (`npm run build:game` at the repo
// root, which the app's build runs first). `npm run dev` here still serves it standalone on :5190.
export default { base: './', build: { outDir: '../public/blockcraft', emptyOutDir: true } };
