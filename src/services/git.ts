import fs from "fs";
import path from "path";
import * as git from "isomorphic-git";
import http from "isomorphic-git/http/node";
import slugify from "slugify";

class GitService {
  /**
   * Prepares the local repository for use (clone or ensure exists).
   * @param repoPath - Local path for the repository.
   * @param remoteUrl - Remote URL of the repository to clone (if not initialized).
   * @param token - Authentication token for private repositories.
   */
  static async prepareRepository(repoPath: string, remoteUrl: string, token: string, username: string): Promise<void> {
    if (!fs.existsSync(repoPath)) {
      console.log(`Cloning repository to ${repoPath}...`);
      await git.clone({
        fs,
        http,
        dir: repoPath,
        url: remoteUrl,
        onAuth: token
            ? () => ({
              username: username,
              password: token,
            })
            : undefined,
      });
    } else {
      console.log(`Repository already exists at ${repoPath}`);
    }

    // Ensure the repository is initialized properly with a default branch and an initial commit.
    await this.ensureInitialCommit(repoPath, "main");
  }

  /**
   * Ensures the repository has an initial commit and explicitly sets the default branch if HEAD is not found.
   */
  static async ensureInitialCommit(repoPath: string, defaultBranch: string): Promise<void> {
    try {
      const hasHead = await git.resolveRef({ fs, dir: repoPath, ref: "HEAD" }).catch(() => null);

      if (!hasHead) {
        console.log("HEAD not found. Performing repository initialization...");
        await git.init({ fs, dir: repoPath, defaultBranch });
        const readmePath = path.join(repoPath, "README.md");
        if (!fs.existsSync(readmePath)) {
          fs.writeFileSync(readmePath, "# Initial Commit\n");
          console.log(`Created initial file: ${readmePath}`);
        }
        await git.add({ fs, dir: repoPath, filepath: "README.md" });
        await git.commit({
          fs,
          dir: repoPath,
          message: "Initial commit",
          author: { name: "Default Author", email: "default@example.com" },
        });
        console.log("Initial commit created.");
      } else {
        console.log("Repository already has HEAD.");
      }
    } catch (error) {
      console.error("Failed to create initial commit:", error);
      throw error;
    }
  }

  /**
   * Publishes an article to the repository.
   * @param repoPath - Local path to the repository.
   * @param articleTitle - The article's title, used for directory slugging.
   * @param content - Content to write to the file.
   * @param author - Git author information ({ name, email }).
   * @param username - GitHub Username.
   * @param token - GitHub Personal Access Token (PAT).
   */
  static async publishArticle(
      repoPath: string,
      articleTitle: string,
      content: string,
      author: { name: string; email: string },
      username: string,
      token: string
  ): Promise<void> {


    try {
      const sluggedTitle = slugify(articleTitle, {lower: true, strict: true});
      const targetDirectory = path.join("articles", sluggedTitle);
      const fileName = "index.mdx";

      this.ensureDirectoryExists(repoPath, targetDirectory);

      const filePath = path.join(repoPath, targetDirectory, fileName);
      fs.writeFileSync(filePath, content);
      console.log(`File created at: ${filePath}`);

      await git.add({fs, dir: repoPath, filepath: path.join(targetDirectory, fileName)});

      const commitMessage = this.constructCommitMessage(fileName, targetDirectory);
      await git.commit({
        fs,
        dir: repoPath,
        message: commitMessage,
        author,
      });
      console.log(`Committed changes with message: "${commitMessage}"`);

      console.log("Pushing changes to the remote...");
      console.table({
        repoPath,
        targetDirectory,
        fileName,
        commitMessage,
        author,
        username,

      })
      await git.push({
        fs,
        http,
        dir: repoPath,
        remote: "origin",
        ref: "main",
        onAuth: () => (
            {username: token, password: 'x-oauth-basic'}
        ),
      });
      console.log("Changes pushed successfully!");
    } catch (error) {
      console.error("Error publishing article:", error);
      throw error;
    }
  }

  /**
   * Ensures the target directory exists or creates it.
   */
  static ensureDirectoryExists(repoPath: string, targetDirectory: string): void {
    const targetPath = path.join(repoPath, targetDirectory);
    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath, { recursive: true });
      console.log(`Created directory: ${targetPath}`);
    }
  }

  /**
   * Constructs a commit message.
   * Example: "Publish articles/my-article-slug: index.mdx"
   */
  static constructCommitMessage(fileName: string, directory: string): string {
    return `Publish ${directory}: ${fileName}`;
  }
}

export default GitService;