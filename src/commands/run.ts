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
  const workerCount = await select({
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
    try {
      // Read PROJECT_CONTEXT.md if it exists
      let context = '';
      try {
        context = await readFile(join(projectDir, 'PROJECT_CONTEXT.md'), 'utf-8');
      } catch {}

      const prompt = context
        ? `Using this project context:\n\n${context}\n\nAnalyze the file at ${filePath} and provide a detailed description (MAXIMUM 400 characters) of what it does, its purpose, and key functionality. Be thorough but stay within the character limit. Return ONLY the description text, nothing else.`
        : `Analyze the file at ${filePath} and provide a detailed description (MAXIMUM 400 characters) of what it does, its purpose, and key functionality. Be thorough but stay within the character limit. Return ONLY the description text, nothing else.`;

      const { stdout } = await execa('claude', [
        '--dangerously-skip-permissions',
        '-p',
        prompt
      ]);

      const description = stdout.trim().replace(/\n/g, ' ').substring(0, 400);

      // Append to descriptions.jsonl
      const entry = JSON.stringify({ file: filePath, desc: description }) + '\n';
      await appendFile(join(projectDir, 'descriptions.jsonl'), entry);

      // Mark as completed
      await appendFile(join(projectDir, 'completed.txt'), filePath + '\n');

      processedCount++;
      spinner.text = `Processing files: ${processedCount}/${remaining} completed (${errors.length} errors)`;
    } catch (error) {
      errors.push(filePath);
      spinner.text = `Processing files: ${processedCount}/${remaining} completed (${errors.length} errors)`;
    }
  };

  // Process files in batches with concurrency control
  for (let i = 0; i < remainingFiles.length; i += workerCount) {
    const batch = remainingFiles.slice(i, i + workerCount);
    await Promise.all(batch.map(processFile));
  }

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
