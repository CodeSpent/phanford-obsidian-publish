import {
    type App,
    Notice,
    Plugin, type PluginManifest,
} from "obsidian";
import PublishSettingTab from "./components/publish-setting-tab";
import PublishModal from "./components/publish-modal";
import * as fs from "node:fs";
import git from "isomorphic-git";
import http from "isomorphic-git/http/node";

export interface PluginSetting {
    value: string;
    inputType: "text" | "password" | "number";
    description: string;
    placeholder: string;
}

export interface IPublishPluginSettings {
    [key: string]: PluginSetting;
}

export const DEFAULT_SETTINGS: IPublishPluginSettings = {
    repo: {
        value: "",
        inputType: "text",
        description: "URL of GitHub repository to publish content to.",
        placeholder: "https://github.com/user/repo",
    },
    gitRemote: {
        value: "origin",
        inputType: "text",
        description: "Git remote to publish content to.",
        placeholder: "origin",
    },
    gitRef: {
        value: "main",
        inputType: "text",
        description: "Git reference to publish content to.",
        placeholder: "main",
    },
    githubUsername: {
        value: "",
        inputType: "text",
        description: "Username for GitHub authentication.",
        placeholder: "Enter your GitHub username."
    },
    githubToken: {
        value: "",
        inputType: "password",
        description: "Personal Access Token for GitHub authentication.",
        placeholder: "Enter your GitHub token.",
    },
    gitAuthorName: {
        value: "",
        inputType: "text",
        description: "Git author name.",
        placeholder: "Enter your name.",
    },
    gitAuthorEmail: {
        value: "",
        inputType: "text",
        description: "Git author email.",
        placeholder: "Enter your email.",
    },
};


export default class PublishPlugin extends Plugin {

    settings: IPublishPluginSettings = DEFAULT_SETTINGS as IPublishPluginSettings;

    constructor(app: App, manifest: PluginManifest) {
        super(app, manifest);
    }
    
    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    async onload() {
        await this.loadSettings();
        this.addSettingTab(new PublishSettingTab(this.app, this));

        this.addCommand({
            id: "publish-content",
            name: "Publish Content",
            callback: () => {
                new PublishModal(this.app, this).open();
            },
        });
    }


    onunload() {
        // TODO: Research what clean up is necessary
    }
}