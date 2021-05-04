import { terser } from "rollup-plugin-terser";

export default [
  {
    input: 'lib/worker.js',
    output: {
      file: 'lib/worker.min.js',
      format: 'iife'
    },
    plugins: [terser()]
  },
  {
    input: 'lib/recolored-image.js',
    output: {
      file: 'lib/recolored-image.min.js',
      format: 'esm'
    },
    plugins: [terser()]
  }
]