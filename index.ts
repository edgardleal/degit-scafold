/**
 * index.ts
 *
 * @module index.ts
 */

import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import { spawnSync } from 'child_process';

const degit = require('degit');
const globule = require('globule');
const Mustache = require('mustache');

const PROMPTS_CONFIG_FILE_NAME = 'template-prompts.json';

type CommandName = 'rm' | 'mv' | 'cp';

/**
 * Scafold configuration
 */
export interface ScafoldConfiguration {
  questions: inquirer.QuestionCollection;
  pre: string[][],
  post: string[][],
}

function functionParser(key: string, value: string): string {
  let result = '';
  if (
    typeof value === 'string'
    && value.startsWith('/Function(')
    && value.endsWith(')/')
  ) {
    result = value.substring(10, value.length - 2);
    // eslint-disable-next-line no-eval
    return (0, eval)(`(${result})`);
  }
  return value;
}

const COMMANDS: { [key: string]: (args: string[]) => void } = {
  mv: (args: string[]) => {
    spawnSync('mv', args);
  },
  cp: (args: string[]) => {
    spawnSync('cp', args);
  },
  rm: (args: string[]) => {
    spawnSync('rm', args);
  },
};

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
      ...globule.find(`${target}/**/*.template`),
    ];

    const prompsConfig: ScafoldConfiguration = JSON.parse(
      fs.readFileSync(promptFilePath).toString(),
      functionParser,
    );

    if (prompsConfig.pre) {
      prompsConfig.pre.forEach((command: string[]) => {
        const key = command.shift();
        COMMANDS[`${key}`](command);
      });
    }

    const context = await inquirer.prompt(prompsConfig.questions);
    console.log('Context: %o', context); // eslint-disable-line
    for (let i = 0; i < filepaths.length; i += 1) {
      const filePath = filepaths[i];
      const content = fs.readFileSync(filePath).toString();
      const result = Mustache.render(content, context);
      fs.writeFileSync(filePath, result);
    }

    fs.unlinkSync(promptFilePath);

    if (prompsConfig.post) {
      prompsConfig.post.forEach((command: string[]) => {
        const key = command.shift();
        COMMANDS[`${key}`](command);
      });
    }
  }

  console.log('done'); // eslint-disable-line
})();
