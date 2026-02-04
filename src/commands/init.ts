import { mkdir, writeFile, readdir } from 'fs/promises';
import { join, basename } from 'path';
import { execa } from 'execa';
import ora from 'ora';
import chalk from 'chalk';
import { CLUTCH_DIR, REPOS_DIR, PROJECTS_DIR, ProjectMetadata } from '../utils/config.js';

export async function initCommand(repoUrl: string) {
  console.log();
  console.log(chalk.bold('Initializing repository'));
  console.log();

  const repoName = basename(repoUrl, '.git');
  const repoDir = join(REPOS_DIR, repoName);
  const projectDir = join(PROJECTS_DIR, repoName);

  console.log('Repository:', repoName);
  console.log('URL:', repoUrl);
  console.log();

  // Create directories
  await mkdir(REPOS_DIR, { recursive: true });
  await mkdir(projectDir, { recursive: true });

  // Clone repository
  const cloneSpinner = ora('Cloning repository...').start();
  try {
    const exists = await checkDirExists(repoDir);
    if (exists) {
      cloneSpinner.info('Using existing repository clone');
    } else {
      await execa('git', ['clone', repoUrl, repoDir]);
      cloneSpinner.succeed('Repository cloned');
    }
  } catch (error) {
    cloneSpinner.fail('Failed to clone repository');
    throw error;
  }

  // Find files
  const filesSpinner = ora('Analyzing files...').start();
  try {
    const files = await findFiles(repoDir);
    await writeFile(join(projectDir, 'all_files.txt'), files.join('\n'));
    filesSpinner.succeed(`Found ${files.length} files`);
  } catch (error) {
    filesSpinner.fail('Failed to analyze files');
    throw error;
  }

  // Count lines
  const locSpinner = ora('Counting lines of code...').start();
  try {
    const files = (await readFile(join(projectDir, 'all_files.txt'))).split('\n');
    let totalLoc = 0;
    const stats: string[] = [];

    for (const file of files) {
      if (!file) continue;
      try {
        const content = await readFile(file);
        const lines = content.split('\n').length;
        totalLoc += lines;
        stats.push(`${file}|${lines}`);
      } catch {}
    }

    await writeFile(join(projectDir, 'file_stats.txt'), stats.join('\n'));
    locSpinner.succeed(`Total lines: ${totalLoc.toLocaleString()}`);

    // Generate context
    const contextSpinner = ora('Generating project context...').start();
    try {
      await execa('claude', [
        '--dangerously-skip-permissions',
        '-p',
        `Analyze repository at ${repoDir} and create PROJECT_CONTEXT.md at ${join(projectDir, 'PROJECT_CONTEXT.md')} with: project purpose, architecture, technologies, repo structure, main features. Then append 'SUCCESS' to ${join(projectDir, 'init_log.txt')} and EXIT.`
      ], { stderr: 'ignore' });
      contextSpinner.succeed('Context generated');
    } catch {
      contextSpinner.warn('Context generation skipped');
    }

    // Initialize files
    await writeFile(join(projectDir, 'completed.txt'), '');
    await writeFile(join(projectDir, 'descriptions.jsonl'), '');
    await writeFile(join(projectDir, 'live_log.txt'), '');
    await writeFile(join(projectDir, 'active_workers.txt'), '');

    // Save metadata
    const metadata: ProjectMetadata = {
      repo_name: repoName,
      repo_url: repoUrl,
      total_files: files.length,
      total_loc: totalLoc,
      init_date: new Date().toISOString(),
    };
    await writeFile(join(projectDir, 'metadata.json'), JSON.stringify(metadata, null, 2));

    console.log();
    console.log(chalk.green('✓') + ' Initialization complete');
    console.log();
    console.log('  Files found:', chalk.bold(files.length.toString()));
    console.log('  Lines of code:', chalk.bold(totalLoc.toLocaleString()));
    console.log();
    console.log('Next:', chalk.bold(`clutch run ${repoName}`));
    console.log();
  } catch (error) {
    locSpinner.fail('Failed to count lines');
    throw error;
  }
}

async function checkDirExists(path: string): Promise<boolean> {
  try {
    await readdir(path);
    return true;
  } catch {
    return false;
  }
}

async function findFiles(dir: string): Promise<string[]> {
  const { stdout } = await execa('find', [
    dir,
    '-type', 'f',
    '!', '-path', '*/node_modules/*',
    '!', '-path', '*/.git/*',
    '!', '-path', '*/dist/*',
    '!', '-path', '*/build/*',
    '!', '-path', '*/.next/*',
    '!', '-path', '*/coverage/*',
    '!', '-path', '*/__pycache__/*',
    '!', '-path', '*/.cache/*',
    '!', '-path', '*/vendor/*',
    '!', '-name', 'package-lock.json',
    '!', '-name', 'yarn.lock',
    '!', '-name', '*.min.js',
    '!', '-name', '*.map',
    '!', '-name', '*.log',
  ]);
  return stdout.split('\n').filter(Boolean);
}

async function readFile(path: string): Promise<string> {
  const { readFile: fsReadFile } = await import('fs/promises');
  return fsReadFile(path, 'utf-8');
}
