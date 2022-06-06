
import { IBundleOptions } from 'father-build/src/types';
export default {
  esm:{
    type:'babel',
    mjs: true
  },
  cjs: {type: 'babel'},
  target: 'node',
  runtimeHelpers: true,
} as IBundleOptions
