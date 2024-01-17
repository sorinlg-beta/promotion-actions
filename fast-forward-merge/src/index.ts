import * as core from '@actions/core';
import * as exec from '@actions/exec';

async function run() {
  const baseRef: string = core.getInput('baseRef');
  const headRef: string = core.getInput('headRef');

  console.log(`Fast-Forwarding ${baseRef} to ${headRef}`);

  await exec.exec('git', ['switch', baseRef]);
  await exec.exec('git', ['merge', '--ff-only', `origin/${headRef}`]);
  await exec.exec('git', ['push', 'origin', baseRef]);
}

run().catch(error => core.setFailed(error instanceof Error ? error.message : 'An unknown error occurred'));
