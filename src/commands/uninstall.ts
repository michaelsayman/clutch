import { rm } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';
import chalk from 'chalk';
import { CLUTCH_DIR } from '../utils/config.js';

export async function uninstallCommand() {
  console.log();
  console.log(chalk.bold('Uninstalling Clutch'));
  console.log();

  const binPath = join(homedir(), '.local', 'bin', 'clutch');
  const oldClutchDir = join(homedir(), '.clutch'); // For backward compatibility

  try {
    console.log('→ Removing binary...');
    await rm(binPath, { force: true });
  } catch {}

  try {
    console.log('→ Removing data...');
    await rm(CLUTCH_DIR, { recursive: true, force: true });
  } catch {}

  // Also remove old location for backward compatibility
  try {
    await rm(oldClutchDir, { recursive: true, force: true });
  } catch {}

  console.log();
  console.log(chalk.green('✓') + ' Clutch uninstalled');
  console.log();
}
