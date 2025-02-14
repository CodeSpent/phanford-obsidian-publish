import { App, Modal, Notice } from "obsidian";
import ContentService from "../services/content";
import GitService from "../services/git";

export default class PublishModal extends Modal {
  contentType: string = "Article";

  constructor(app: App, private plugin: any) {
    super(app);
    this.plugin = plugin;
  }

  onOpen() {
    const { contentEl } = this;

    contentEl.createEl("h2", { text: "Publish Content" });

    this.createContentTypeDropdown(contentEl);

    const submitButton = contentEl.createEl("button", { text: "Publish" });
    submitButton.onclick = async () => {
      try {
        await this.handlePublish();
        new Notice("Content published successfully!");
        this.close();
      } catch (error: any) {
        new Notice(`Failed to publish content: ${error.message || "Unknown error"}`);
      }
    };
  }

  async handlePublish() {
    const { app } = this;
    const { repo, githubToken, gitAuthorName, gitAuthorEmail, githubUsername } = this.plugin.settings;

    const gitAuthor = {
      name: gitAuthorName,
      email: gitAuthorEmail,
    }
    // Get active note info
    const articleTitle = ContentService.getActiveNoteName(app);
    const content = await ContentService.getActiveNoteContent(app);

    const repoPath = "/tmp/temp-content-repo";

    try {
      // Clone or prepare the repository
      // TODO: We should create an instance of GitService to use
      await GitService.prepareRepository(repoPath, repo, githubToken, githubUsername);

      // Publish article with proper structure
      // TODO: Username & Token API is not clean, we could improve this
      // to reduce as many errors.
      //
      // It is also worth investigating why publishArticle doesn't
      // prompt a typescript error when passing a {} when expecting
      // a string.
      await GitService.publishArticle(repoPath, articleTitle, content, gitAuthor, githubUsername.value, githubToken.value);

      new Notice("Content published successfully!");
    } catch (error) {
      console.error("Error during publish:", error);
      new Notice(`Failed to publish content: ${error.message}`);
    }
  }

  createContentTypeDropdown(container: HTMLElement) {
    const dropdown = container.createEl("select", { cls: "dropdown" });

    ["Article", "Note"].forEach((type) => {
      const option = dropdown.createEl("option", { text: type });
      if (type === this.contentType) option.selected = true;
    });

    dropdown.onchange = (event) => {
      this.contentType = (event.target as HTMLSelectElement).value;
    };

    container.appendChild(dropdown);
  }

  onClose() {
    this.contentEl.empty();
  }
}