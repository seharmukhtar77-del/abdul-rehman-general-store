import {cp,rm} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});
await cp('frontend/dist','dist',{recursive:true});
console.log('Frontend dist copied to root dist');
