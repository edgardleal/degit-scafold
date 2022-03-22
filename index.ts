/**
 * index.ts
 *
 * @module index.ts
 */

import fs from 'fs';
import path from 'path';

const degit = require('degit');
const globule = require('globule');
const inquirer = require('inquirer');
const Mustache = require('mustache');

const PROMPTS_CONFIG_FILE_NAME = 'template-prompts.json';

(async () => {
  const source = process.argv[2];
  const target = process.argv[3] || __dirname;

  const emitter = degit(source, {
    verbose: true,
  });

  emitter.on('info', (info: any) => {
    console.log(info.message); // eslint-disable-line
  });

  await emitter.clone(target);

  const promptFilePath = path.join(target, PROMPTS_CONFIG_FILE_NAME);
  const promptConfigExists = fs.existsSync(promptFilePath);
  if (promptConfigExists) {
    const filepaths = [
      ...globule.find(`${target}/**/*.ts`),
      ...globule.find(`${target}/**/*.js`),
      ...globule.find(`${target}/**/*.json`),
    ];

    const prompsConfig = JSON.parse(fs.readFileSync(promptFilePath).toString());

    const context = await inquirer.prompt(prompsConfig);
    console.log('Context: %o', context); // eslint-disable-line
    for (let i = 0; i < filepaths.length; i += 1) {
      const filePath = filepaths[i];
      const content = fs.readFileSync(filePath).toString();
      const result = Mustache.render(content, context);
      fs.writeFileSync(filePath, result);
    }

    fs.unlinkSync(promptFilePath);
  }

  console.log('done'); // eslint-disable-line
})();
