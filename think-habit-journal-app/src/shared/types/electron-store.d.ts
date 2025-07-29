// src/shared/types/electron-store.d.ts
declare module "electron-store" {
  interface Options<T = Record<string, unknown>> {
    name?: string;
    cwd?: string;
    encryptionKey?: string | Buffer | NodeJS.TypedArray | DataView;
    fileExtension?: string;
    clearInvalidConfig?: boolean;
    serialize?: (value: T) => string;
    deserialize?: (text: string) => T;
    projectSuffix?: string;
    schema?: any;
    defaults?: T;
    beforeEachMigration?: (store: ElectronStore<T>, context: any) => void;
    migrations?: Record<string, (store: ElectronStore<T>) => void>;
    projectVersion?: string;
    accessPropertiesByDotNotation?: boolean;
  }

  class ElectronStore<T = Record<string, unknown>> {
    constructor(options?: Options<T>);

    set<K extends keyof T>(key: K, value: T[K]): void;
    set(key: string, value: unknown): void;
    set(object: Partial<T>): void;

    get<K extends keyof T>(key: K): T[K];
    get<K extends keyof T>(key: K, defaultValue: T[K]): T[K];
    get(key: string): unknown;
    get(key: string, defaultValue: unknown): unknown;

    has(key: keyof T | string): boolean;

    delete(key: keyof T | string): void;

    clear(): void;

    size: number;
    store: T;
    path: string;

    onDidChange<K extends keyof T>(
      key: K,
      callback: (newValue?: T[K], oldValue?: T[K]) => void,
    ): () => void;

    onDidAnyChange(callback: (newValue?: T, oldValue?: T) => void): () => void;

    openInEditor(): void;
  }

  export = ElectronStore;
}
