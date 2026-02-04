// Minimal test of execa + claude
import { execa } from 'execa';

console.log('Testing execa with Claude Code...\n');

const prompt = 'Say hello in 5 words';

console.log('Calling claude with execa...');
console.log('Command:', 'claude --dangerously-skip-permissions -p', prompt);
console.log('');

try {
  const result = await execa('claude', [
    '--dangerously-skip-permissions',
    '-p',
    prompt
  ], {
    reject: false,
    timeout: 30000,
    all: true,
  });

  console.log('=== RESULT ===');
  console.log('Exit code:', result.exitCode);
  console.log('Signal:', result.signal);
  console.log('Killed:', result.killed);
  console.log('Timed out:', result.timedOut);
  console.log('Stdout:', result.stdout);
  console.log('Stderr:', result.stderr);
  console.log('All:', result.all);
  console.log('');

  if (result.exitCode === 0) {
    console.log('✓ SUCCESS!');
  } else {
    console.log('✗ FAILED!');
  }
} catch (error) {
  console.log('=== ERROR ===');
  console.log(error);
}
