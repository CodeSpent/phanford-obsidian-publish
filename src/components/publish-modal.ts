import { App, Modal, Notice } from "obsidian";
import ContentService from "../services/content";
import GitService from "../services/git";
import slugify from "slugify";

export default class PublishModal extends Modal {
  contentType: string = "Article";
  branch: string = this.plugin.settings.gitRef.value;
  commitMessage: string = "";

  constructor(app: App, private plugin: any) {
    super(app);
    this.plugin = plugin;
  }

  onOpen() {
    const { contentEl } = this;

    contentEl.createEl("h2", { text: "Publish Content" });

    const diffContainer = contentEl.createDiv({ cls: "diff-container" });
    diffContainer.createEl("h3", { text: "Changes Preview:" });

    const diffBox = diffContainer.createEl("pre", { cls: "git-diff" });
    diffBox.style.whiteSpace = "pre-wrap";
    diffBox.style.overflowY = "auto";
    diffBox.style.maxHeight = "300px";

    this.loadDiff(diffBox).then(r => r);
    this.createBranchInput(contentEl).then(r => r);

    const commitMessageContainer = contentEl.createDiv({ cls: "commit-message-container" });
    commitMessageContainer.createEl("h3", { text: "Write Commit Message:" });

    const commitMessageInput = commitMessageContainer.createEl("textarea", {
      cls: "commit-message-input",
      placeholder: "Enter your commit message here...",
    });
    commitMessageInput.style.width = "100%";
    commitMessageInput.style.minHeight = "100px";
    commitMessageInput.focus();

    commitMessageInput.oninput = (event) => {
      this.commitMessage = (event.target as HTMLTextAreaElement).value;
    };

    const submitButton = contentEl.createEl("button", { text: "Publish" });
    submitButton.style.marginTop = "20px";
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

  /**
   * Loads and displays the diff for the current note.
   */
  async loadDiff(diffBox: HTMLElement) {
    try {
      const articleTitle = ContentService.getActiveNoteName(this.app);
      const cleanTitle = articleTitle.replace(/\.[^/.]+$/, "");
      const filePath = `articles/${slugify(cleanTitle, { lower: true, strict: true })}/index.mdx`;

      const diff = await GitService.getFileDiff("/tmp/", filePath, this.plugin.settings.gitRef.value);

      if (!diff) {
        diffBox.textContent = "No changes detected.";
      } else {
        diffBox.textContent = diff;
      }
    } catch (error) {
      console.error("Error generating diff:", error);
      diffBox.textContent = "Failed to display the diff.";
    }
  }

  /**
   * Creates a dropdown menu to select the Git branch.
   */
  async createBranchInput(container: HTMLElement) {
    const branchLabel = container.createEl("h3", { text: "Enter Branch Name:" });

    const branchInput = container.createEl("input", {
      type: "text",
      cls: "branch-input",
      value: this.plugin.settings.gitRef.value,
    });

    branchInput.style.width = "100%";
    branchInput.style.marginBottom = "10px";

    branchInput.oninput = (event) => {
      this.branch = (event.target as HTMLInputElement).value;
      console.log("Updated branch input:", this.branch);
    };

    container.appendChild(branchInput);
  }

  /**
   * Handles the publish operation.
   */
  async handlePublish() {
    const { app } = this;
    const {
      repo,
      githubToken,
      gitAuthorName,
      gitAuthorEmail,
      githubUsername,
      gitRemote,
    } = this.plugin.settings;

    if (!this.commitMessage.trim()) {
      new Notice("Commit message cannot be empty.");
      return;
    }

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
          this.branch,
          githubToken.value,
          githubUsername.value,
          cleanTitle,
          content,
          gitAuthor,
          this.commitMessage
      );

      new Notice("Content published successfully!");
    } catch (error) {
      console.error("Error during publish:", error);
      new Notice(`Failed to publish content: ${error.message}`);
    }
  }

  async onClose() {
    this.contentEl.empty();
  }
}