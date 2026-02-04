import { execa } from 'execa';

async function testWorker() {
  console.log('Starting test worker...');

  const prompt = 'Read the file at /Users/saymanmini/clutch/repos/openclaw/README.md and describe it in under 100 characters.';

  console.log('Calling Claude Code with execa...');

  const result = await execa('claude', [
    '--dangerously-skip-permissions',
    '-p',
    prompt
  ], {
    reject: false,
    timeout: 30000,
  });

  console.log('Exit code:', result.exitCode);
  console.log('Stdout:', result.stdout);
  console.log('Stderr:', result.stderr);
}

testWorker().catch(console.error);
