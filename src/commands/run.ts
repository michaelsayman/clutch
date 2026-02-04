import { readdir, readFile, appendFile } from 'fs/promises';
import { join } from 'path';
import { select } from '@inquirer/prompts';
import { execa } from 'execa';
import chalk from 'chalk';
import { PROJECTS_DIR, ProjectMetadata } from '../utils/config.js';

export async function runCommand(projectName?: string) {
  console.log();
  console.log(chalk.bold('Processing files'));
  console.log();

  // Select project if not specified
  if (!projectName) {
    const projects = await readdir(PROJECTS_DIR);

    if (projects.length === 0) {
      console.error('No projects found');
      console.log();
      console.log('Initialize a project first:');
      console.log('  clutch init <repo-url>');
      console.log();
      process.exit(1);
    }

    if (projects.length === 1) {
      projectName = projects[0];
    } else {
      const choices = await Promise.all(
        projects.map(async (proj) => {
          const metadata: ProjectMetadata = JSON.parse(
            await readFile(join(PROJECTS_DIR, proj, 'metadata.json'), 'utf-8')
          );
          const completed = (await readFile(join(PROJECTS_DIR, proj, 'completed.txt'), 'utf-8').catch(() => ''))
            .split('\n').filter(Boolean).length;

          return {
            name: `${proj} (${completed}/${metadata.total_files} files)`,
            value: proj,
          };
        })
      );

      projectName = await select({
        message: 'Select project:',
        choices,
      });
    }
  }

  const projectDir = join(PROJECTS_DIR, projectName);

  // Get stats
  const metadata: ProjectMetadata = JSON.parse(await readFile(join(projectDir, 'metadata.json'), 'utf-8'));
  const completedContent = await readFile(join(projectDir, 'completed.txt'), 'utf-8').catch(() => '');
  const completed = completedContent.split('\n').filter(Boolean).length;
  const remaining = metadata.total_files - completed;
  const percentage = metadata.total_files > 0 ? Math.round((completed / metadata.total_files) * 100) : 0;

  console.log(`Progress: ${chalk.bold(percentage + '%')} (${completed}/${metadata.total_files} files, ${remaining} remaining)`);
  console.log();

  if (remaining === 0) {
    console.log('✓ All files processed');
    console.log();
    return;
  }

  // Select worker count
  const workerChoice = await select({
    message: 'Select worker count:',
    choices: [
      { name: '10 workers (slower, lower API usage)', value: 10 },
      { name: '20 workers (balanced)', value: 20 },
      { name: '30 workers (faster)', value: 30 },
      { name: '40 workers (high speed)', value: 40 },
      { name: '50 workers (maximum speed)', value: 50 },
    ],
  });

  console.log();
  console.log(`→ Starting ${workerChoice} workers...`);
  console.log();

  // Process files (simplified - would need to implement parallel worker logic)
  console.log(chalk.yellow('Note: Worker processing not yet implemented in this version'));
  console.log();
  console.log('Output:', chalk.bold(join(projectDir, 'descriptions.jsonl')));
  console.log();
}
