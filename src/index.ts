#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { select, input, confirm } from '@inquirer/prompts';
import { initCommand } from './commands/init.js';
import { runCommand } from './commands/run.js';
import { statusCommand } from './commands/status.js';
import { updateCommand } from './commands/update.js';
import { uninstallCommand } from './commands/uninstall.js';

const VERSION = '1.2.1';

const LOGO = `
 ██████╗██╗     ██╗   ██╗████████╗ ██████╗██╗  ██╗
██╔════╝██║     ██║   ██║╚══██╔══╝██╔════╝██║  ██║
██║     ██║     ██║   ██║   ██║   ██║     ███████║
██║     ██║     ██║   ██║   ██║   ██║     ██╔══██║
╚██████╗███████╗╚██████╔╝   ██║   ╚██████╗██║  ██║
 ╚═════╝╚══════╝ ╚═════╝    ╚═╝    ╚═════╝╚═╝  ╚═╝
`;

const program = new Command();

program
  .name('clutch')
  .description('AI-powered file description generator for GitHub repositories')
  .version(VERSION);

program
  .command('init <repo-url>')
  .description('Initialize a new repository for processing')
  .action(initCommand);

program
  .command('run [project]')
  .description('Process files with AI workers')
  .action(runCommand);

program
  .command('status')
  .alias('list')
  .description('Show all projects and their progress')
  .action(statusCommand);

program
  .command('update')
  .description('Check for updates and update clutch')
  .action(updateCommand);

program
  .command('uninstall')
  .description('Remove clutch from your system')
  .action(uninstallCommand);

// Interactive mode when no arguments
async function interactiveMode() {
  console.clear();
  console.log(chalk.cyan(LOGO));
  console.log(chalk.dim('  AI-powered repository documentation with Claude Code'));
  console.log(chalk.dim('  Version ' + VERSION));
  console.log();

  while (true) {
    const action = await select({
      message: chalk.bold('What would you like to do?'),
      choices: [
        { name: '🚀 Initialize a new repository', value: 'init' },
        { name: '⚡ Process files with AI', value: 'run' },
        { name: '📊 View project status', value: 'status' },
        { name: '🔄 Check for updates', value: 'update' },
        { name: '❓ Show help', value: 'help' },
        { name: '🗑️  Uninstall clutch', value: 'uninstall' },
        { name: '👋 Exit', value: 'exit' },
      ],
    });

    switch (action) {
      case 'init': {
        const repoUrl = await input({
          message: 'Enter repository URL:',
          validate: (value) => {
            if (!value) return 'Repository URL is required';
            if (!value.startsWith('http')) return 'Please enter a valid URL';
            return true;
          },
        });
        await initCommand(repoUrl);
        console.log();
        await input({ message: chalk.dim('Press Enter to continue...') });
        console.clear();
        console.log(chalk.cyan(LOGO));
        console.log(chalk.dim('  AI-powered repository documentation with Claude Code'));
        console.log(chalk.dim('  Version ' + VERSION));
        console.log();
        break;
      }
      case 'run':
        await runCommand();
        console.log();
        await input({ message: chalk.dim('Press Enter to continue...') });
        console.clear();
        console.log(chalk.cyan(LOGO));
        console.log(chalk.dim('  AI-powered repository documentation with Claude Code'));
        console.log(chalk.dim('  Version ' + VERSION));
        console.log();
        break;
      case 'status':
        await statusCommand();
        console.log();
        await input({ message: chalk.dim('Press Enter to continue...') });
        console.clear();
        console.log(chalk.cyan(LOGO));
        console.log(chalk.dim('  AI-powered repository documentation with Claude Code'));
        console.log(chalk.dim('  Version ' + VERSION));
        console.log();
        break;
      case 'update':
        await updateCommand();
        console.log();
        await input({ message: chalk.dim('Press Enter to continue...') });
        console.clear();
        console.log(chalk.cyan(LOGO));
        console.log(chalk.dim('  AI-powered repository documentation with Claude Code'));
        console.log(chalk.dim('  Version ' + VERSION));
        console.log();
        break;
      case 'uninstall': {
        const confirmed = await confirm({
          message: 'Are you sure you want to uninstall?',
          default: false,
        });
        if (confirmed) {
          await uninstallCommand();
          process.exit(0);
        }
        break;
      }
      case 'help':
        program.help();
        break;
      case 'exit':
        console.clear();
        console.log();
        console.log(chalk.cyan('  Thanks for using Clutch! 👋'));
        console.log();
        process.exit(0);
    }
  }
}

// Parse arguments or run interactive mode
const args = process.argv.slice(2);
if (args.length === 0) {
  interactiveMode();
} else {
  program.parse(process.argv);
}
