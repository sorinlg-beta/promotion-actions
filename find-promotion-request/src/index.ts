import * as core from '@actions/core';
import { context, getOctokit } from '@actions/github';

async function run() {
  const token: string = core.getInput('github-token', { required: true });
  const github = getOctokit(token);
  const targetRefs: string[] = JSON.parse(core.getInput('targetRefs'));
  const { owner, repo } = context.repo;
  const headSha: string = context.payload.pull_request?.head.sha || context.sha;
  let pr: any = context.payload.pull_request;

  console.log(`Finding PRs for ${owner}/${repo} and head.sha ${headSha} with targetRefs: ${targetRefs}`);

  if (!pr) {
    const { data: openPRs } = await github.rest.pulls.list({ owner, repo, state: 'open' });
    console.log(`Found ${openPRs.length} open PRs: ${openPRs.map(pr => pr.url)}`);
    pr = openPRs.find(pr => pr.head.sha == headSha);
  }

  if (!pr) {
    console.log(`No PR found with head.sha ${headSha}`);
    core.setOutput('promoteable', false);
    return;
  }

  console.log(`Fetching PR details for PR: ${pr.number}`)
  const { data } = await github.rest.pulls.get({ owner, repo, pull_number: pr.number });
  pr = data;

  const isMergeable = targetRefs.includes(pr.base.ref) && pr.rebaseable && ['clean', 'unstable'].includes(pr.mergeable_state);

  if (isMergeable) {
    console.log(`Found mergeable PR: ${pr.number}; baseRef: ${pr.base.ref}; headRef: ${pr.head.ref} `);
    core.setOutput('promoteable', true);
    core.setOutput('baseRef', pr.base.ref);
    core.setOutput('headRef', pr.head.ref);
    core.setOutput('prNumber', pr.number);
  } else {
    console.log(`Found non - mergeable PR: ${pr.number}; baseRef: ${pr.base.ref}; headRef: ${pr.head.ref} `);
    core.setOutput('promoteable', false);
  }
}

run().catch(error => core.setFailed(error instanceof Error ? error.message : 'An unknown error occurred'));
