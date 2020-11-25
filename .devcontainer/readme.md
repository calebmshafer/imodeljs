# Build & Test in a Linux Container on Windows

The iModel.js repository provides this configuration for quickly getting a development environment setup for working the iModel.js source in an isolated Linux container.  This can be used with VS Code locally and in the future [GitHub Codespaces](https://github.com/features/codespaces).

## How to use the container

1. Install Docker Desktop or Docker for Linux on your local machine. (See [docs](https://aka.ms/vscode-remote/containers/getting-started) for additional details.)

1. Increase Docker settings if possible. We recommend at least 4 vCPUs and 4 GB of RAM (8 GB recommended)
    > **Note:** The [Resource Monitor](https://marketplace.visualstudio.com/items?itemName=mutantdino.resourcemonitor) extension is included in the container so you can keep an eye on CPU/Memory in the status bar.

1. Install/update VS Code extension [Remote - Containers](https://aka.ms/vscode-remote/download/containers).

1. Press <kbd>Ctrl/Cmd</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd> and select **Remote-Containers: Clone Repository in Container Volume...**.

    > For performance reasons (e.g. 10x), we do **not** recommend mount/share source code with the host computer and the container. When VS Code is "connected" to the container, all file operations you perform in the GUI are done in the *container*, not the host. At this time, the best way to share changes with the host is to create a Git branch, and push/pull both sides to keep them in sync.

1. Type `https://github.com/imodeljs/imodeljs` (or a branch or PR URL) in the input box and press <kbd>Enter</kbd>.

1. After the container is running, use VS Code's Terminal to perform normal build commands such as `rush install`, `rush rebuild`, and `rush test`. You should also have access to the same launch profiles in VS Code for debugging.

When you are done, click the green area in the status bar, and select 'Remote-Containers: Reopen Folder Locally' to switch back to a local view on your host.

### Notes

VS Code injects Git authorization tokens into the container, so you can fetch/pull/push as you would otherwise do on the host. VS Code also mounts your .gitconfig file from the host in the container, so your configured name/email/aliases etc. are available in the container.

### Terminal

- Use VS Code's Terminal window to interact directly with the container.
- The file system is **case-sensitive** (tab completion is configured to be *not* case-sensitive)
- The container is configured with zsh + oh-my-zsh + fzf for some additional niceties (e.g. case-insensitivity, git info at the prompt, and fuzzy history search).

### Common issues

- `rush test` fails with "... reporter blew up with error \\ Error: EINVAL: invalid argument, readlink ..."
  - Cause: unknown
  - Workaround: `rm -rf common/temp` and do `rush` install/rebuild/test again
  - To know earlier if you will have this problem, after a `rush rebuild`, run `find -L common/temp -type l`, and if anything other than common/temp/pnpm-store or common/temp/pnpm-local is reported, repeat the above workaround
