import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['./src', '!./src/uploads'],
  splitting: false,
  sourcemap: true,
  clean: true,
});
