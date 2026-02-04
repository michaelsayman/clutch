// Test different stdio configurations
import { execa } from 'execa';

const prompt = 'Say hello in 5 words';

const tests = [
  { name: 'Default (pipe)', options: {} },
  { name: 'Inherit stdio', options: { stdio: 'inherit' } },
  { name: 'Ignore stdin', options: { stdin: 'ignore' } },
  { name: 'Inherit all', options: { stdin: 'inherit', stdout: 'inherit', stderr: 'inherit' } },
];

for (const test of tests) {
  console.log(`\n=== Testing: ${test.name} ===`);

  try {
    const result = await execa('claude', [
      '--dangerously-skip-permissions',
      '-p',
      prompt
    ], {
      reject: false,
      timeout: 10000,
      ...test.options,
    });

    console.log('Exit code:', result.exitCode);
    console.log('Timed out:', result.timedOut);
    if (result.stdout) console.log('Stdout:', result.stdout);
    if (result.exitCode === 0) console.log('✓ SUCCESS!');
  } catch (error) {
    console.log('Error:', error.message);
  }
}
