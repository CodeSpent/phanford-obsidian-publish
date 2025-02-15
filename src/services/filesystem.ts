import fs from "fs";
import path from "path";

class FilesystemService {
  /**
   * Ensures a directory exists, and if it doesn't, creates it recursively.
   * @param targetDirectory - The full path to the directory to ensure.
   */
  static ensureDirectoryExists(targetDirectory: string): void {
    if (!fs.existsSync(targetDirectory)) {
      fs.mkdirSync(targetDirectory, { recursive: true });
      console.log(`Created directory: ${targetDirectory}`);
    }
  }

  /**
   * Writes content to the specified file path, creating the file if it doesn’t exist.
   * @param filePath - The full path to the file being written.
   * @param content - The content to write to the file.
   */
  static writeToFile(filePath: string, content: string): void {
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`File written to: ${filePath}`);
  }

  /**
   * Resolves the target file path within the repository structure.
   * @param repoPath - Root path of the cloned repository (e.g., /tmp/temp-repo).
   * @param subDir - Subdirectory where the file will reside (e.g., "articles").
   * @param slug - Slug for the file name (e.g., "my-article").
   * @param fileName - The name of the file (e.g., "index.mdx").
   * @returns The full path to the target file.
   */
  static getTargetFilePath(repoPath: string, subDir: string, slug: string, fileName: string): string {
    return path.join(repoPath, subDir, slug, fileName);
  }
}

export default FilesystemService;