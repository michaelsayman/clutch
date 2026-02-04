import { execa } from 'execa';
import chalk from 'chalk';
import ora from 'ora';

const CURRENT_VERSION = '1.2.0';

export async function updateCommand() {
  console.log();
  console.log(chalk.cyan.bold('🔄 Checking for updates'));
  console.log();

  const spinner = ora('Checking latest version...').start();

  try {
    // Get latest release version from GitHub
    const result = await execa('curl', [
      '-s',
      'https://api.github.com/repos/michaelsayman/clutch/releases/latest'
    ], {
      stdin: 'ignore',
    });

    const release = JSON.parse(result.stdout);
    const latestVersion = release.tag_name.replace('v', '');

    spinner.stop();

    console.log(chalk.dim('Current version:'), chalk.white(CURRENT_VERSION));
    console.log(chalk.dim('Latest version:'), chalk.white(latestVersion));
    console.log();

    if (latestVersion === CURRENT_VERSION) {
      console.log(chalk.green('✓ You have the latest version!'));
      console.log();
      return;
    }

    console.log(chalk.yellow(`→ Update available: v${latestVersion}`));
    console.log();
    console.log(chalk.dim('Updating clutch...'));
    console.log();

    // Run the install script
    const updateSpinner = ora('Downloading and installing...').start();

    await execa('bash', ['-c',
      'curl -fsSL https://raw.githubusercontent.com/michaelsayman/clutch/main/install.sh | bash'
    ], {
      stdin: 'ignore',
      stdout: 'inherit',
      stderr: 'inherit',
    });

    updateSpinner.succeed('Updated successfully!');
    console.log();
    console.log(chalk.green(`✓ Clutch updated to v${latestVersion}`));
    console.log();
    console.log(chalk.dim('All your project data is preserved in ~/clutch/'));
    console.log();

  } catch (error) {
    spinner.fail('Failed to check for updates');
    console.error(error);
    process.exit(1);
  }
}
