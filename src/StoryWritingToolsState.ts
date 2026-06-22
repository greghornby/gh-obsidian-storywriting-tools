import {
  normalizePath,
  Plugin,
} from 'obsidian';

export interface LocalState {
  visibleMetadataFiles: string[];
}

export interface GlobalState {}

const DEFAULT_LOCAL_STATE: LocalState = {
  visibleMetadataFiles: [],
};

const DEFAULT_GLOBAL_STATE: GlobalState = {};

type StateFile = {
  global: GlobalState;
};

export class StoryWritingToolsState {
  private localState: LocalState = {...DEFAULT_LOCAL_STATE};
  private globalState: GlobalState = {...DEFAULT_GLOBAL_STATE};

  constructor(private plugin: Plugin) {}

  async load() {
    const filePath = this.getStateFilePath();

    if (!filePath) {
      return;
    }

    const exists = await this.plugin.app.vault.adapter.exists(filePath);
    if (!exists) {
      await this.saveGlobalState();
      return;
    }

    const stateFile = JSON.parse(await this.plugin.app.vault.adapter.read(filePath)) as Partial<StateFile>;

    this.globalState = {
      ...DEFAULT_GLOBAL_STATE,
      ...stateFile.global,
    };
  }

  getLocalState<K extends keyof LocalState>(key: K): LocalState[K] {
    return this.localState[key];
  }

  setLocalState<K extends keyof LocalState>(key: K, value: LocalState[K]) {
    this.localState = {
      ...this.localState,
      [key]: value,
    };
  }

  getGlobalState<K extends keyof GlobalState>(key: K): GlobalState[K] {
    return this.globalState[key];
  }

  async setGlobalState<K extends keyof GlobalState>(key: K, value: GlobalState[K]) {
    this.globalState = {
      ...this.globalState,
      [key]: value,
    };

    await this.saveGlobalState();
  }

  isMetadataVisible(filePath: string) {
    return this.localState.visibleMetadataFiles.includes(filePath);
  }

  setMetadataHidden(filePath: string, isHidden: boolean) {
    const hiddenFiles = new Set(this.localState.visibleMetadataFiles);

    if (isHidden) {
      hiddenFiles.add(filePath);
    } else {
      hiddenFiles.delete(filePath);
    }

    this.setLocalState('visibleMetadataFiles', Array.from(hiddenFiles));
  }

  toggleMetadataHidden(filePath: string) {
    this.setMetadataHidden(filePath, !this.isMetadataVisible(filePath));
  }

  private async saveGlobalState() {
    const filePath = this.getStateFilePath();

    if (!filePath) {
      return;
    }

    const stateFile: StateFile = {
      global: this.globalState,
    };

    await this.plugin.app.vault.adapter.write(
      filePath,
      JSON.stringify(stateFile, null, 2),
    );
  }

  private getStateFilePath() {
    if (!this.plugin.manifest.dir) {
      return null;
    }

    return normalizePath(`${this.plugin.manifest.dir}/.state.json`);
  }
}
