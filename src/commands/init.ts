import { mkdir, writeFile, readdir } from 'fs/promises';
import { join, basename } from 'path';
import { execa } from 'execa';
import ora from 'ora';
import chalk from 'chalk';
import { CLUTCH_DIR, REPOS_DIR, PROJECTS_DIR, ProjectMetadata } from '../utils/config.js';

export async function initCommand(repoUrl: string) {
  console.log();
  console.log(chalk.cyan.bold('🚀 Initializing repository'));
  console.log();

  const repoName = basename(repoUrl, '.git');
  const repoDir = join(REPOS_DIR, repoName);
  const projectDir = join(PROJECTS_DIR, repoName);

  console.log(chalk.dim('Repository:'), chalk.white(repoName));
  console.log(chalk.dim('URL:'), chalk.white(repoUrl));
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
    console.log(chalk.cyan('→ Generating project context with Claude...'));
    console.log();
    try {
      const claudeProcess = execa('claude', [
        '--dangerously-skip-permissions',
        '-p',
        `Analyze repository at ${repoDir} and create PROJECT_CONTEXT.md at ${join(projectDir, 'PROJECT_CONTEXT.md')} with: project purpose, architecture, technologies, repo structure, main features. Then append 'SUCCESS' to ${join(projectDir, 'init_log.txt')} and EXIT.`
      ]);

      // Stream Claude's output
      if (claudeProcess.stdout) {
        for await (const chunk of claudeProcess.stdout) {
          process.stdout.write(chalk.dim(chunk.toString()));
        }
      }

      await claudeProcess;
      console.log();
      console.log(chalk.green('✓') + ' Context generated');
    } catch (error) {
      console.log();
      console.log(chalk.yellow('⚠') + ' Context generation skipped (Claude Code not available)');
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
    console.log(chalk.green.bold('✓ Initialization complete!'));
    console.log();
    console.log(chalk.dim('  Files found:'), chalk.cyan.bold(files.length.toString()));
    console.log(chalk.dim('  Lines of code:'), chalk.cyan.bold(totalLoc.toLocaleString()));
    console.log();
    console.log(chalk.dim('Next step:'), chalk.white.bold(`clutch run ${repoName}`));
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
  // Include EVERYTHING except .git directory
  const { stdout } = await execa('find', [
    dir,
    '-type', 'f',
    '!', '-path', '*/.git/*',
  ]);

  return stdout.split('\n').filter(Boolean);
}

async function readFile(path: string): Promise<string> {
  const { readFile: fsReadFile } = await import('fs/promises');
  return fsReadFile(path, 'utf-8');
}
