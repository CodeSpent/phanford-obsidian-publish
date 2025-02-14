import yaml from "js-yaml";
import { App } from "obsidian";
import fs from "fs";

class ContentService {
  /**
   * Reads the content of a note file.
   * @param filePath - The path to the note file.
   * @returns The raw note content as a string.
   */
  static async readNoteContent(filePath: string): Promise<string> {
    return fs.promises.readFile(filePath, "utf-8");
  }

  /**
   * Writes updated content to a note file.
   * @param filePath - The path to the note file.
   * @param content - The content to write to the note file.
   */
  static async writeNoteContent(filePath: string, content: string): Promise<void> {
    await fs.promises.writeFile(filePath, content, "utf-8");
  }

  /**
   * Gets the active note's content (if available).
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
   * Gets the path of the currently active note.
   * @param app - The Obsidian app instance.
   * @returns The path of the active note.
   * @throws An error if no active note is found.
   */
  static getActiveNotePath(app: App): string {
    const activeFile = app.workspace.getActiveFile();
    if (!activeFile) throw new Error("No active note selected.");
    return activeFile.path;
  }

  /**
   * Applies frontmatter to the given note content.
   * If frontmatter already exists in the content, it will replace it with the new frontmatter.
   * @param frontmatter - The frontmatter object to apply.
   * @param content - The raw note content.
   * @returns The updated content with the applied frontmatter.
   */
  static applyFrontmatterToContent(frontmatter: Record<string, any>, content: string): string {
    const frontmatterString = `---\n${yaml.dump(frontmatter)}---\n\n`;

    const frontmatterRegex = /^---\n[\s\S]*?\n---\n/;
    if (frontmatterRegex.test(content)) {
      return content.replace(frontmatterRegex, frontmatterString);
    }
    return frontmatterString + content;
  }

  /**
   * Processes the note by applying the frontmatter and saving the updated content to the file.
   * @param filePath - Path to the note file.
   * @param frontmatter - Frontmatter object provided by Publish Modal.
   * @returns The final updated content with the applied frontmatter.
   */
  static async processNote(filePath: string, frontmatter: Record<string, any>): Promise<string> {
    const content = await this.readNoteContent(filePath);
    const updatedContent = this.applyFrontmatterToContent(frontmatter, content);
    await this.writeNoteContent(filePath, updatedContent);
    return updatedContent;
  }
}

export default ContentService;