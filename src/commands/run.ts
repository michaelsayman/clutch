import { readdir, readFile, appendFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { select } from '@inquirer/prompts';
import { execa } from 'execa';
import chalk from 'chalk';
import ora from 'ora';
import { PROJECTS_DIR, REPOS_DIR, ProjectMetadata } from '../utils/config.js';

export async function runCommand(projectName?: string) {
  console.log();
  console.log(chalk.cyan.bold('⚡ Processing files'));
  console.log();

  // Select project if not specified
  if (!projectName) {
    const allItems = await readdir(PROJECTS_DIR, { withFileTypes: true });
    const projects = allItems
      .filter(item => item.isDirectory() && !item.name.startsWith('.'))
      .map(item => item.name);

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
          try {
            const metadata: ProjectMetadata = JSON.parse(
              await readFile(join(PROJECTS_DIR, proj, 'metadata.json'), 'utf-8')
            );
            const completed = (await readFile(join(PROJECTS_DIR, proj, 'completed.txt'), 'utf-8').catch(() => ''))
              .split('\n').filter(Boolean).length;

            return {
              name: `${proj} (${completed}/${metadata.total_files} files)`,
              value: proj,
            };
          } catch {
            return null;
          }
        })
      ).then(choices => choices.filter(Boolean) as { name: string; value: string }[]);

      projectName = await select({
        message: 'Select project:',
        choices,
      });
    }
  }

  const projectDir = join(PROJECTS_DIR, projectName);
  const repoDir = join(REPOS_DIR, projectName);

  // Get stats
  const metadata: ProjectMetadata = JSON.parse(await readFile(join(projectDir, 'metadata.json'), 'utf-8'));
  const allFilesContent = await readFile(join(projectDir, 'all_files.txt'), 'utf-8');
  const allFiles = allFilesContent.split('\n').filter(Boolean);
  const completedContent = await readFile(join(projectDir, 'completed.txt'), 'utf-8').catch(() => '');
  const completedSet = new Set(completedContent.split('\n').filter(Boolean));
  const remainingFiles = allFiles.filter(f => !completedSet.has(f));

  const completed = completedSet.size;
  const remaining = remainingFiles.length;
  const percentage = metadata.total_files > 0 ? Math.round((completed / metadata.total_files) * 100) : 0;

  console.log(`Progress: ${chalk.cyan.bold(percentage + '%')} ${chalk.dim(`(${completed}/${metadata.total_files} files, ${remaining} remaining)`)}`);
  console.log();

  if (remaining === 0) {
    console.log(chalk.green('✓ All files processed!'));
    console.log();
    return;
  }

  // Select worker count
  let workerCount = await select({
    message: 'Select worker count:',
    choices: [
      { name: '1 worker (debug mode)', value: 1 },
      { name: '10 workers (slower, lower API usage)', value: 10 },
      { name: '20 workers (balanced)', value: 20 },
      { name: '30 workers (faster)', value: 30 },
      { name: '40 workers (high speed)', value: 40 },
      { name: '50 workers (maximum speed)', value: 50 },
      { name: 'Custom number of workers', value: -1 },
    ],
  });

  if (workerCount === -1) {
    const { input } = await import('@inquirer/prompts');
    workerCount = parseInt(await input({
      message: 'Enter number of workers:',
      validate: (value) => {
        const num = parseInt(value);
        if (isNaN(num) || num < 1) return 'Please enter a number greater than 0';
        if (num > 500) return 'Maximum 500 workers allowed';
        return true;
      },
    }));
  }

  console.log();
  console.log(chalk.cyan(`→ Starting ${workerCount} workers...`));
  console.log();

  const spinner = ora({
    text: `Processing files: 0/${remaining} completed`,
    color: 'cyan'
  }).start();

  let processedCount = 0;
  const errors: string[] = [];

  // Process files with concurrency control
  const processFile = async (filePath: string): Promise<void> => {
    console.log(chalk.dim(`  Starting: ${filePath.substring(filePath.lastIndexOf('/') + 1)}`));
    try {
      // Focused prompt with targeted exploration
      const prompt = `Read the file at ${filePath} in repository ${repoDir}. Quickly check its imports/exports and what files reference it. Provide a detailed description (MAXIMUM 400 characters) covering: what it does, its purpose, key functionality, how it connects to other parts of the codebase, and its role. Be thorough but efficient. Return ONLY the description text.`;

      const result = await execa('claude', [
        '--dangerously-skip-permissions',
        '-p',
        prompt
      ], {
        reject: false, // Don't throw on non-zero exit
        timeout: 300000, // 5 minute timeout per file
        stdin: 'ignore', // FIX: Claude Code hangs with piped stdin
      });

      if (result.exitCode !== 0) {
        throw new Error(`Claude exited with code ${result.exitCode}: ${result.stderr}`);
      }

      const description = result.stdout.trim().replace(/\n/g, ' ').substring(0, 400);

      // Append to descriptions.jsonl
      const entry = JSON.stringify({ file: filePath, desc: description }) + '\n';
      await appendFile(join(projectDir, 'descriptions.jsonl'), entry);

      // Mark as completed
      await appendFile(join(projectDir, 'completed.txt'), filePath + '\n');

      processedCount++;
      spinner.text = `Processing files: ${processedCount}/${remaining} completed (${errors.length} errors)`;
    } catch (error) {
      errors.push(filePath);
      // Log first few errors for debugging
      if (errors.length <= 3) {
        spinner.warn(`Error processing ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
        spinner.start();
      }
      spinner.text = `Processing files: ${processedCount}/${remaining} completed (${errors.length} errors)`;
    }
  };

  // Process files with worker pool - maintain exactly workerCount concurrent workers
  console.log(chalk.dim(`\nProcessing ${remainingFiles.length} files with ${workerCount} concurrent workers...`));
  console.log(chalk.dim(`First file: ${remainingFiles[0]}`));
  console.log();

  // Create a worker pool that maintains constant concurrency
  let fileIndex = 0;
  const workers: Promise<void>[] = [];

  for (let i = 0; i < workerCount; i++) {
    const worker = (async () => {
      while (fileIndex < remainingFiles.length) {
        const currentIndex = fileIndex++;
        if (currentIndex < remainingFiles.length) {
          await processFile(remainingFiles[currentIndex]);
        }
      }
    })();
    workers.push(worker);
  }

  await Promise.all(workers);

  spinner.succeed(`Processed ${processedCount}/${remaining} files (${errors.length} errors)`);

  if (errors.length > 0) {
    console.log();
    console.log(chalk.yellow(`⚠ ${errors.length} files failed to process`));
    console.log(chalk.dim('Run the command again to retry failed files'));
  }

  console.log();
  console.log(chalk.dim('Output:'), chalk.white.bold(join(projectDir, 'descriptions.jsonl')));
  console.log();
}
