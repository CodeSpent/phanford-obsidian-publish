import {type App, PluginSettingTab, Setting} from "obsidian";
import type PublishPlugin from "../main";

export default class PublishSettingTab extends PluginSettingTab {
    plugin: PublishPlugin;

    constructor(app: App, plugin: PublishPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl("h2", { text: "Publish Plugin Settings" });

        Object.keys(this.plugin.settings).forEach((key) => {
            const settingMetadata = this.plugin.settings[key];

            new Setting(containerEl)
                .setName(key.charAt(0).toUpperCase() + key.slice(1))
                .setDesc(settingMetadata.description)
                .addText((text) => {
                    text.inputEl.type = settingMetadata.inputType;
                    text.setValue(settingMetadata.value || "");

                    text.setPlaceholder(settingMetadata.placeholder);
                    text.onChange(async (value) => {
                        this.plugin.settings[key].value = value;
                        await this.plugin.saveSettings();
                    });
                });
        });
    }
}