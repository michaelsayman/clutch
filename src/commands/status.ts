import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import chalk from 'chalk';
import { PROJECTS_DIR, ProjectMetadata, ProjectStatus } from '../utils/config.js';

export async function statusCommand() {
  console.log();
  console.log(chalk.cyan.bold('📊 Projects'));
  console.log();

  try {
    const allItems = await readdir(PROJECTS_DIR, { withFileTypes: true });
    const projects = allItems
      .filter(item => item.isDirectory() && !item.name.startsWith('.'))
      .map(item => item.name);

    if (projects.length === 0) {
      console.log(chalk.dim('No projects initialized yet'));
      console.log();
      console.log(chalk.dim('Get started:'));
      console.log('  ' + chalk.white.bold('clutch init <repo-url>'));
      console.log();
      return;
    }

    const statuses: ProjectStatus[] = [];

    for (const project of projects) {
      try {
        const metadataPath = join(PROJECTS_DIR, project, 'metadata.json');
        const completedPath = join(PROJECTS_DIR, project, 'completed.txt');

        const metadata: ProjectMetadata = JSON.parse(await readFile(metadataPath, 'utf-8'));
        const completedContent = await readFile(completedPath, 'utf-8').catch(() => '');
        const completed = completedContent.split('\n').filter(Boolean).length;
        const percentage = metadata.total_files > 0 ? Math.round((completed / metadata.total_files) * 100) : 0;

        statuses.push({
          name: project,
          metadata,
          completed,
          total: metadata.total_files,
          percentage,
        });
      } catch {}
    }

    for (const status of statuses) {
      const icon = status.completed === status.total ? chalk.green('✓') :
                   status.completed === 0 ? chalk.dim('○') : chalk.yellow('⋯');

      const percentColor = status.percentage === 100 ? chalk.green :
                          status.percentage > 0 ? chalk.cyan : chalk.dim;

      const nameDisplay = status.completed === status.total ?
        chalk.white(status.name) :
        chalk.white.bold(status.name);

      console.log(
        ` ${icon} ${nameDisplay.padEnd(40)} ${percentColor(String(status.percentage).padStart(3) + '%')} ${chalk.dim(`(${status.completed}/${status.total} files)`)}`
      );
    }
    console.log();
  } catch (error) {
    console.log(chalk.dim('No projects initialized yet'));
    console.log();
    console.log(chalk.dim('Get started:'));
    console.log('  ' + chalk.white.bold('clutch init <repo-url>'));
    console.log();
  }
}
