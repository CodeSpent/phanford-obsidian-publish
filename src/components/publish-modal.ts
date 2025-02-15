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
    const {
      repo,
      githubToken,
      gitAuthorName,
      gitAuthorEmail,
      githubUsername,
      gitRemote,
      gitRef,
    } = this.plugin.settings;

    const gitAuthor = {
      name: gitAuthorName.value,
      email: gitAuthorEmail.value,
    };

    const articleTitle = ContentService.getActiveNoteName(app);
    const cleanTitle = articleTitle.replace(/\.[^/.]+$/, "");

    const content = await ContentService.getActiveNoteContent(app);

    const tempPath = "/tmp/";

    try {
      await ContentService.publishArticle(
          tempPath,
          repo.value,
          gitRemote.value,
          gitRef.value,
          githubToken.value,
          githubUsername.value,
          cleanTitle,
          content,
          gitAuthor
      );

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