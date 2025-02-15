import * as git from "isomorphic-git";
import http from "isomorphic-git/http/node";
import fs from "fs";
import {createPatch} from "diff";

class GitService {
  /**
   * Clones a Git repository into the specified local directory.
   * @param repoPath - Local directory to clone the repository into.
   * @param remoteUrl - URL of the remote Git repository.
   * @param username - Authentication username (e.g., GitHub username).
   * @param token - Personal Access Token (PAT) for authentication.
   */
  static async cloneRepository(repoPath: string, remoteUrl: string, username: string, token: string): Promise<void> {
    console.log(`Cloning repository from ${remoteUrl} to ${repoPath}`);

    await git.clone({
      fs,
      http,
      dir: repoPath,
      url: remoteUrl,
      singleBranch: true,
      depth: 1,
      onAuth: () => ({ username, password: token }),
    });

    console.log("Repository cloned successfully.");
  }

  /**
   * Stages a file for commit.
   * @param repoPath - Local repository path.
   * @param filePath - File path to stage (relative to the repository root).
   */
  static async stageFile(repoPath: string, filePath: string): Promise<void> {
    await git.add({ fs, dir: repoPath, filepath: filePath });
    console.log(`Staged file: ${filePath}`);
  }

  /**
   * Commits staged changes to the repository.
   * @param repoPath - Local repository path.
   * @param message - Commit message.
   * @param author - Git author information { name, email }.
   */
  static async commitChanges(
      repoPath: string,
      message: string,
      author: { name: string; email: string }
  ): Promise<void> {
    await git.commit({
      fs,
      dir: repoPath,
      message,
      author,
    });
    console.log(`Committed changes with message: "${message}"`);
  }

  /**
   * Pulls the latest changes from the remote repository.
   * @param repoPath - Local repository path.
   * @param username - Authentication username (GitHub username).
   * @param author - Git author name & email.
   * @param token - Personal Access Token (PAT) for authentication.
   * @param remote - Git remote name (e.g., "origin").
   * @param ref - Git ref (branch) to pull.
   */
  static async pullChanges(
      repoPath: string,
      username: string,
      author: { name: string; email: string },
      token: string,
      remote: string,
      ref: string
  ): Promise<void> {
    await git.pull({
      fs,
      http,
      dir: repoPath,
      remote: remote,
      ref: ref,
      onAuth: () => ({ username, password: token }),
      singleBranch: true,
      author: author
    });
    console.log(`Pulled latest changes from ${remote}/${ref}`);
  }

  /**
   * Pushes the local changes to the remote repository.
   * @param repoPath - Local repository path.
   * @param username - Authentication username (GitHub username).
   * @param token - Personal Access Token (PAT) for authentication.
   * @param remote - Git remote.
   * @param ref - Git ref (branch).
   */
  static async pushChanges(
      repoPath: string,
      username: string,
      token: string,
      remote: string,
      ref: string): Promise<void> {
    await git.push({
      fs,
      http,
      dir: repoPath,
      remote: remote,
      ref: ref,
      onAuth: () => ({ username, password: token }),
    });
    console.log("Pushed changes to remote repository.");
  }

  /**
   * Lists all available branches in the repository.
   * @param repoPath - Local repository path.
   * @param remote - Whether to list remote or local branches (optional, defaults to local).
   * @returns Array of branch names.
   */
  static async listBranches(repoPath: string, remote: boolean = false): Promise<string[]> {
    try {
      const branches = await git.listBranches({
        fs,
        dir: repoPath,
        remote: remote ? "origin" : undefined,
      });
      console.log(remote ? "Remote branches:" : "Local branches:", branches);

      return branches;
    } catch (error) {
      console.error("Error listing branches:", error);
      return [];
    }
  }

  /**
   * Gets the diff between the current local content and the last committed state.
   * @param repoPath - Path to the Git repository.
   * @param filePath - File path relative to the repo root.
   * @param branch - The branch or ref to compare against (defaults to HEAD).
   * @returns The file diff as a string.
   */
  static async getFileDiff(repoPath: string, filePath: string, branch: string = "HEAD"): Promise<string> {
    const headFileBlob = await git.readBlob({
      fs,
      dir: repoPath,
      oid: await git.resolveRef({ fs, dir: repoPath, ref: branch }),
      filepath: filePath,
    }).catch(() => ({ blob: null }));

    const localFileContent = fs.existsSync(`${repoPath}/${filePath}`)
        ? fs.readFileSync(`${repoPath}/${filePath}`, "utf8")
        : "";

    const headFileContent = headFileBlob.blob
        ? new TextDecoder("utf-8").decode(headFileBlob.blob)
        : "";

    return createPatch(filePath, headFileContent, localFileContent);
  }

}

export default GitService;