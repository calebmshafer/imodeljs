---
ignore: true
---

# Getting Started

- [Getting Started](#getting-started)
- [Welcome](#welcome)
- [Prerequisites](prerequisites)
- [First contribution](#first-contribution) things to know before you start contributing.
- [Contributing]()

## Welcome

Thank you for taking an interest in contributing to open source and making great projects like iModel.js possible!

This guide will help you understand the overall organization of iModel.js, and help direct you to the best way to start contributing.

This document is the source of truth on how to contribute. Feel free to open a issue, if you find something is missing or not covered. Feedback is always welcome!

## Prerequisites

You must sign a [Contribution License Agreement with Bentley](../../Bentley-CLA.pdf) before your contributions will be accepted.
This a one-time requirement for Bentley projects in GitHub.
You can read more about [Contributor License Agreements](https://en.wikipedia.org/wiki/Contributor_License_Agreement) on Wikipedia.

The process for signing the CLA is managed by [cla-assistant](https://cla-assistant.io/imodeljs/imodeljs) and fully integrated into the pull request workflow.

> Note: a CLA is not required if the change is trivial (such as fixing a spelling error or a typo).

## First Contribution

The first step in contributing is finding something to work on. We always welcome any help, no matter the size of contribution!

There are many different type of contributions including:

* Bug fixes
* New features
* Documentation corrections or additions
* Example code snippets
* Sample data

### Issues

## Pull Requests

All submissions go through a review process.
We use GitHub pull requests for this purpose.
Consult [GitHub Help](https://help.github.com/articles/about-pull-requests/) for more information on using pull requests.

### Setting up your environment

1. Fork the iModel.js repository on [GitHub](https://github.com/imodeljs/imodeljs) and clone your fork locally
    > iModel.js is setup to use GitHub Codespaces if you have access to the Beta.  Visit [instructions](../../.devcontainer/readme.me) for more details.
1. Create a branch to keep everything organized in your fork. The branches should be created directly off of `master`.
    ```sh
    > git checkout -b my-branch -t upstream/master
    ```
1. If you're making documentation changes, skip to step . Otherwise, please follow the [build instructions](../../README.md#build-instructions) to build and run the tests.  Once everything is work, you're ready to start making changes!
1.

## Automated workflows in iModel.js

### Backporting Changes

Backporting changes is often important to make critical bug fixes prior to the next minor release.

A backport must be performed by a member of the iModel.js team.  If you think your pull request should be backport, please ask in the pull request thread for someone.

In the pull request, add the comment in the format,

```
@Mergifyio backport release/{releaseName}
```

For more details on how exactly backport works, https://docs.mergify.io/actions.html#backport-action.
