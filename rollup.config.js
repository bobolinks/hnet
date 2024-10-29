// import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';

export default [
  {
    input: 'src/index.ts',
    plugins: [typescript(), json()],
    output: [
      {
        format: 'esm',
        file: 'dist/index.module.js',
        sourcemap: true,
      },
    ],
  },
  {
    input: 'src/index.ts',
    plugins: [typescript(), json()],
    output: [
      {
        format: 'cjs',
        file: 'dist/index.cjs',
        sourcemap: true,
      },
    ],
  },
  {
    input: 'src/socket/node.ts',
    plugins: [typescript(), json()],
    output: [
      {
        format: 'esm',
        file: 'dist/so.node.module.js',
        sourcemap: true,
      },
    ],
  },
  {
    input: 'src/socket/node.ts',
    plugins: [typescript(), json()],
    output: [
      {
        format: 'cjs',
        file: 'dist/so.node.cjs',
        sourcemap: true,
      },
    ],
  },
  {
    input: 'src/socket/wx.ts',
    plugins: [typescript(), json()],
    output: [
      {
        format: 'esm',
        file: 'dist/so.wx.module.js',
        sourcemap: true,
      },
    ],
  },
  {
    input: 'src/socket/wx.ts',
    plugins: [typescript(), json()],
    output: [
      {
        format: 'cjs',
        file: 'dist/so.wx.cjs',
        sourcemap: true,
      },
    ],
  },
];
