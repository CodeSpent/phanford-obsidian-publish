import fs from "fs";
import path from "path";
import slugify from "slugify";
import {App} from "obsidian";
import GitService from "./git";

class ContentService {
  /**
   * Ensures a directory exists at the specified target path, creating it if necessary.
   * @param targetDirectory - Full path to the required directory.
   */
  static ensureDirectoryExists(targetDirectory: string): void {
    if (!fs.existsSync(targetDirectory)) {
      fs.mkdirSync(targetDirectory, {recursive: true});
      console.log(`Created directory: ${targetDirectory}`);
    }
  }

  /**
   * Writes the given content to a specified file path, creating or overwriting the file.
   * @param filePath - Full path to the target file.
   * @param content - Content to write to the file.
   */
  static writeToFile(filePath: string, content: string): void {
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`File written to: ${filePath}`);
  }

  /**
   * Constructs the target file path for an article.
   * @param repoPath - Repository's root directory.
   * @param subDir - Subdirectory where the article resides (e.g., "articles").
   * @param slug - Slugified title for the article directory.
   * @param fileName - Target file name (e.g., "index.mdx").
   * @returns Full path to the target file.
   */
  static getTargetFilePath(repoPath: string, subDir: string, slug: string, fileName: string): string {
    return path.join(repoPath, subDir, slug, fileName);
  }

  /**
   * Gets the active note's file name.
   * @param app - The Obsidian app instance.
   * @returns The file name of the active note.
   * @throws An error if no active note is found.
   */
  static getActiveNoteName(app: App): string {
    const activeFile = app.workspace.getActiveFile();
    if (!activeFile) throw new Error("No active note selected.");
    return activeFile.name;
  }

  /**
   * Gets the active note's content.
   * @param app - The Obsidian app instance.
   * @returns A promise resolving to the note content.
   * @throws An error if no active note is found.
   */
  static async getActiveNoteContent(app: App): Promise<string> {
    const activeFile = app.workspace.getActiveFile();
    if (!activeFile) throw new Error("No active note selected.");
    return await app.vault.read(activeFile);
  }

  /**
   * Publishes an article by creating directories/files in the cloned repository
   * and delegating Git operations to GitService.
   * @param repoPath - Repository root directory (temporary local clone).
   * @param remoteUrl - URL of the Git remote repository.
   * @param gitRemote - Git remote.
   * @param gitRef - Git ref (branch).
   * @param token - GitHub access token for authentication.
   * @param username - GitHub username.
   * @param articleTitle - Title of the article.
   * @param content - Content of the article formatted as markdown.
   * @param author - Git author information { name, email }.
   */
  static async publishArticle(
      repoPath: string,
      remoteUrl: string,
      gitRemote: string,
      gitRef: string,
      token: string,
      username: string,
      articleTitle: string,
      content: string,
      author: {
        name: string;
        email: string;
      }, commitMessage: string): Promise<void> {

    console.log(`Preparing to publish article: ${articleTitle}`);

    await GitService.cloneRepository(repoPath, remoteUrl, username, token);

    const slug = slugify(articleTitle, {lower: true, strict: true});

    const subDir = "articles";
    const fileName = "index.mdx";
    const filePath = this.getTargetFilePath(repoPath, subDir, slug, fileName);

    this.ensureDirectoryExists(path.dirname(filePath));

    this.writeToFile(filePath, content);

    const relativeFilePath = path.relative(repoPath, filePath);
    const builtCommitMessage = `content: ${commitMessage}\n\n${subDir}/${slug}`

    await GitService.stageFile(repoPath, relativeFilePath);
    await GitService.commitChanges(repoPath, builtCommitMessage, author);
    await GitService.pullChanges(repoPath, username, author, token, gitRemote, gitRef);
    await GitService.pushChanges(repoPath, username, token, gitRemote, gitRef);
  }
}

export default ContentService;