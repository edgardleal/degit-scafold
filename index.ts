/**
 * index.ts
 *
 * @module index.ts
 */

const degit = require('degit');

(async () => {
  const source = process.argv[2];
  const target = process.argv[3] || __dirname;

  const emitter = degit(source, {
    cache: true,
    force: true,
    verbose: true,
  });

  emitter.on('info', (info: any) => {
    console.log(info.message);
  });

  emitter.clone(target).then(() => {
    console.log('done');
  });
})();
