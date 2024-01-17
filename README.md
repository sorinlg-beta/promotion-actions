# GitOps Promotion Actions

Promotion actions to support a trunk-based Continuous Delivery model with deployment stages implemented via long-lived branches (tracked by ArgoCD), and GitHub pull requests and fast-forward only merge driving promotion.

## `open-promotion-request`

Open a pull request to promote a commit from one deployment stage to the next.

## `find-promotion-request`

Find an open, mergeable pull request targeting a defined promotion stage branch, and with a specific commit at the head of the source branch.

## `fast-forward-merge`

Run a fast-forward-only merge from source to target branch.
