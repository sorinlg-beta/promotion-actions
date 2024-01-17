import * as core from '@actions/core';
import { context, getOctokit } from '@actions/github';

type Status = "error" | "failure" | "pending" | "success";

async function run() {
  const token: string = core.getInput('github-token', { required: true });
  const github = getOctokit(token);
  const stages: string[] = JSON.parse(core.getInput('stages'));
  const source: string = core.getInput('source');
  const statusContext: string = core.getInput('context');
  const sourceStage = source.replace("refs/heads/", "");

  const updateStatus = async (state: Status, message: string) => {
    console.log(`Updating commit status to ${state} with message ${message}`);
    await github.rest.repos.createCommitStatus({
      owner: context.repo.owner,
      repo: context.repo.repo,
      sha: context.sha,
      context: statusContext,
      state: state,
      description: message,
    });
  };

  const stagesMap = stages.reduce((map: Record<string, boolean>, stage: string) => {
    const [stageName, autoPromote] = stage.split(":");
    map[stageName] = autoPromote === "auto";
    return map;
  }, {});

  const stagesArray = Object.keys(stagesMap);
  const sourceIndex = stagesArray.indexOf(sourceStage);

  if (sourceIndex === -1 || sourceIndex === stagesArray.length - 1) {
    await updateStatus("failure", `Source stage ${sourceStage} not found or no target stage`);
    core.setOutput('result', false);
    return;
  }

  const targetStage = stagesArray[sourceIndex + 1];
  const autoPromote = stagesMap[targetStage];

  const { data: openPRs } = await github.rest.pulls.list({
    owner: context.repo.owner,
    repo: context.repo.repo,
    state: "open",
    head: `${context.repo.owner}:${sourceStage}`,
    base: targetStage,
  });

  if (openPRs.length === 0) {
    const { data: newPR } = await github.rest.pulls.create({
      owner: context.repo.owner,
      repo: context.repo.repo,
      title: `Promote ${sourceStage} to ${targetStage}${autoPromote ? " (auto)" : ""}`,
      head: sourceStage,
      base: targetStage,
    });
    console.log(`Created PR: ${newPR.url}`);
  } else {
    console.log(`Existing PR: ${openPRs[0].url}`);
  }

  await updateStatus("success", `Opened promotion request from ${sourceStage} to ${targetStage}${autoPromote ? " (auto)" : ""}`);
  core.setOutput('result', autoPromote);
}

run().catch(error => core.setFailed(error instanceof Error ? error.message : 'An unknown error occurred'));
