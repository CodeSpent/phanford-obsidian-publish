import {
  App,
  Plugin,
  PluginSettingTab,
  Setting,
  Modal,
  Notice,
} from "obsidian";

export default class PublishPlugin extends Plugin {
  async onload() {
    console.log("PublishPlugin loaded");

    // Add a settings tab in the Obsidian preferences UI
    this.addSettingTab(new PublishSettingTab(this.app, this));

    // Add a "Publish" command to your plugin settings tab
    this.addCommand({
      id: "publish-content",
      name: "Publish Content",
      callback: () => {
        // Opens the modal to set content type and frontmatter
        new PublishModal(this.app).open();
      },
    });
  }

  onunload() {
    console.log("PublishPlugin unloaded");
  }
}

// Modal to handle the "Publish" form
class PublishModal extends Modal {
  contentType: string; // Stores selected content type from dropdown
  frontmatter: Record<string, string> = {}; // Stores frontmatter key-value pairs

  constructor(app: App) {
    super(app);
    // Set default content type
    this.contentType = "";
  }

  onOpen() {
    const { contentEl } = this;

    // Title of Modal
    contentEl.createEl("h2", { text: "Publish Content" });

    // Dropdown for content type
    const dropdown = contentEl.createEl("select", { cls: "dropdown" });
    ["Blog", "Note", "Tutorial", "Other"].forEach((type) => {
      const option = dropdown.createEl("option", { text: type });
      if (type === this.contentType) option.selected = true;
    });

    dropdown.onchange = (event) => {
      this.contentType = (event.target as HTMLSelectElement).value;
    };

    // Input Blocks for Frontmatter
    const frontmatterSection = contentEl.createEl("div", { cls: "frontmatter-fields" });
    this.addFrontmatterField(frontmatterSection); // Add the first key-value pair input by default

    const addFieldButton = contentEl.createEl("button", { text: "Add Field" });
    addFieldButton.onclick = () => this.addFrontmatterField(frontmatterSection);

    // Submit Publishing Action
    const submitButton = contentEl.createEl("button", { text: "Publish" });
    submitButton.onclick = () => {
      if (!this.contentType) {
        new Notice("Please select a content type.");
        return;
      }

      console.log("Content Type:", this.contentType);
      console.log("Frontmatter:", this.frontmatter);

      // Simulate publishing (replace with GitHub implementation later)
      new Notice("Your content is being published...");

      // Clear fields and Close Modal
      this.close();
    };
  }

  addFrontmatterField(container: HTMLElement) {
    const field = container.createEl("div", { cls: "frontmatter-field" });

    const keyInput = field.createEl("input", {
      type: "text",
      placeholder: "Key (e.g., title)",
    });
    const valueInput = field.createEl("input", {
      type: "text",
      placeholder: "Value (e.g., My First Post)",
    });

    // Add logic to store values into the frontmatter object
    keyInput.oninput = () => {
      const key = keyInput.value.trim();
      const value = valueInput.value.trim();
      if (key) this.frontmatter[key] = value;
    };
    valueInput.oninput = () => {
      const key = keyInput.value.trim();
      const value = valueInput.value.trim();
      if (key) this.frontmatter[key] = value;
    };

    // Remove Button to delete the field
    const removeButton = field.createEl("button", { text: "Remove" });
    removeButton.onclick = () => {
      delete this.frontmatter[keyInput.value.trim()]; // Clean up the frontmatter entry
      container.removeChild(field); // Remove the UI field
    };

    container.appendChild(field);
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

// Options tab to manage plugin settings (Placeholder for future configuration)
class PublishSettingTab extends PluginSettingTab {
  plugin: PublishPlugin;

  constructor(app: App, plugin: PublishPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();
    containerEl.createEl("h2", { text: "Publish Plugin Settings" });

    // Example setting (can be extended to manage GitHub repository details)
    new Setting(containerEl)
      .setName("Repository URL")
      .setDesc("The GitHub repository to publish content to.")
      .addText((text) =>
        text.setPlaceholder("https://github.com/user/repo").onChange((value) => {
          console.log("Repository URL:", value);
          // Save URL or other settings logic here
        }),
      );
  }
}