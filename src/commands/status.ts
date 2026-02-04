import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import chalk from 'chalk';
import { PROJECTS_DIR, ProjectMetadata, ProjectStatus } from '../utils/config.js';

export async function statusCommand() {
  console.log();
  console.log(chalk.bold('Projects'));
  console.log();

  try {
    const projects = await readdir(PROJECTS_DIR);

    if (projects.length === 0) {
      console.log('No projects initialized');
      console.log();
      console.log('Initialize a project:');
      console.log('  ' + chalk.bold('clutch init <repo-url>'));
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
      const icon = status.completed === status.total ? '✓' :
                   status.completed === 0 ? '○' : '⋯';

      console.log(
        ` ${icon} ${status.name.padEnd(30)} ${String(status.percentage).padStart(3)}% complete (${status.completed}/${status.total} files)`
      );
    }
    console.log();
  } catch (error) {
    console.log('No projects initialized');
    console.log();
    console.log('Initialize a project:');
    console.log('  ' + chalk.bold('clutch init <repo-url>'));
    console.log();
  }
}
