/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

/**
 * Global browser API type declarations for CoreV4
 * These types ensure browser APIs are recognized throughout the application
 */

// Ensure global browser types are available
declare global {
  // HTML Element types
  interface Window {
    HTMLDivElement: typeof HTMLDivElement;
    HTMLButtonElement: typeof HTMLButtonElement;
    HTMLInputElement: typeof HTMLInputElement;
    HTMLFormElement: typeof HTMLFormElement;
    HTMLElement: typeof HTMLElement;
    TouchEvent: typeof TouchEvent;
    Touch: typeof Touch;
    KeyboardEvent: typeof KeyboardEvent;
    MouseEvent: typeof MouseEvent;
    Event: typeof Event;
    MessageEvent: typeof MessageEvent;
  }

  // Geolocation API types
  interface GeolocationPosition {
    coords: GeolocationCoordinates;
    timestamp: number;
  }

  interface GeolocationCoordinates {
    accuracy: number;
    altitude: number | null;
    altitudeAccuracy: number | null;
    heading: number | null;
    latitude: number;
    longitude: number;
    speed: number | null;
  }

  interface GeolocationPositionError {
    code: number;
    message: string;
    PERMISSION_DENIED: number;
    POSITION_UNAVAILABLE: number;
    TIMEOUT: number;
  }

  // IndexedDB types
  interface IDBFactory {
    open(name: string, version?: number): IDBOpenDBRequest;
    deleteDatabase(name: string): IDBOpenDBRequest;
    cmp(first: unknown, second: unknown): number;
  }

  interface IDBDatabase extends EventTarget {
    name: string;
    version: number;
    objectStoreNames: DOMStringList;
    close(): void;
    createObjectStore(name: string, options?: IDBObjectStoreParameters): IDBObjectStore;
    deleteObjectStore(name: string): void;
    transaction(storeNames: string | string[], mode?: IDBTransactionMode): IDBTransaction;
  }

  interface IDBOpenDBRequest extends IDBRequest<IDBDatabase> {
    onblocked: ((this: IDBOpenDBRequest, ev: Event) => any) | null;
    onupgradeneeded: ((this: IDBOpenDBRequest, ev: IDBVersionChangeEvent) => any) | null;
  }

  interface IDBVersionChangeEvent extends Event {
    oldVersion: number;
    newVersion: number | null;
  }

  interface IDBObjectStore {
    name: string;
    keyPath: string | string[] | null;
    indexNames: DOMStringList;
    transaction: IDBTransaction;
    autoIncrement: boolean;
    add(value: unknown, key?: IDBValidKey): IDBRequest;
    clear(): IDBRequest;
    count(query?: IDBValidKey | IDBKeyRange): IDBRequest;
    createIndex(name: string, keyPath: string | string[], options?: IDBIndexParameters): IDBIndex;
    delete(query: IDBValidKey | IDBKeyRange): IDBRequest;
    deleteIndex(name: string): void;
    get(query: IDBValidKey | IDBKeyRange): IDBRequest;
    getAll(query?: IDBValidKey | IDBKeyRange, count?: number): IDBRequest;
    getAllKeys(query?: IDBValidKey | IDBKeyRange, count?: number): IDBRequest;
    getKey(query: IDBValidKey | IDBKeyRange): IDBRequest;
    index(name: string): IDBIndex;
    openCursor(query?: IDBValidKey | IDBKeyRange, direction?: IDBCursorDirection): IDBRequest;
    openKeyCursor(query?: IDBValidKey | IDBKeyRange, direction?: IDBCursorDirection): IDBRequest;
    put(value: unknown, key?: IDBValidKey): IDBRequest;
  }

  interface IDBTransaction extends EventTarget {
    db: IDBDatabase;
    error: DOMException | null;
    mode: IDBTransactionMode;
    objectStoreNames: DOMStringList;
    onabort: ((this: IDBTransaction, ev: Event) => any) | null;
    oncomplete: ((this: IDBTransaction, ev: Event) => any) | null;
    onerror: ((this: IDBTransaction, ev: Event) => any) | null;
    abort(): void;
    objectStore(name: string): IDBObjectStore;
  }

  interface IDBRequest<T = any> extends EventTarget {
    error: DOMException | null;
    onerror: ((this: IDBRequest<T>, ev: Event) => any) | null;
    onsuccess: ((this: IDBRequest<T>, ev: Event) => any) | null;
    readyState: IDBRequestReadyState;
    result: T;
    source: IDBObjectStore | IDBIndex | IDBCursor | null;
    transaction: IDBTransaction | null;
  }

  type IDBTransactionMode = "readonly" | "readwrite" | "versionchange";
  type IDBRequestReadyState = "pending" | "done";
  type IDBCursorDirection = "next" | "nextunique" | "prev" | "prevunique";
  type IDBValidKey = number | string | Date | ArrayBufferView | ArrayBuffer | IDBArrayKey;
  type IDBArrayKey = IDBValidKey[];

  interface IDBObjectStoreParameters {
    autoIncrement?: boolean;
    keyPath?: string | string[] | null;
  }

  interface IDBIndexParameters {
    multiEntry?: boolean;
    unique?: boolean;
  }

  interface IDBIndex {
    name: string;
    objectStore: IDBObjectStore;
    keyPath: string | string[];
    multiEntry: boolean;
    unique: boolean;
    count(query?: IDBValidKey | IDBKeyRange): IDBRequest;
    get(query: IDBValidKey | IDBKeyRange): IDBRequest;
    getAll(query?: IDBValidKey | IDBKeyRange, count?: number): IDBRequest;
    getAllKeys(query?: IDBValidKey | IDBKeyRange, count?: number): IDBRequest;
    getKey(query: IDBValidKey | IDBKeyRange): IDBRequest;
    openCursor(query?: IDBValidKey | IDBKeyRange, direction?: IDBCursorDirection): IDBRequest;
    openKeyCursor(query?: IDBValidKey | IDBKeyRange, direction?: IDBCursorDirection): IDBRequest;
  }

  interface IDBCursor {
    direction: IDBCursorDirection;
    key: IDBValidKey;
    primaryKey: IDBValidKey;
    source: IDBObjectStore | IDBIndex;
    advance(count: number): void;
    continue(key?: IDBValidKey): void;
    continuePrimaryKey(key: IDBValidKey, primaryKey: IDBValidKey): void;
    delete(): IDBRequest;
    update(value: unknown): IDBRequest;
  }

  interface IDBKeyRange {
    lower: unknown;
    upper: unknown;
    lowerOpen: boolean;
    upperOpen: boolean;
    includes(key: unknown): boolean;
  }

  // Global variables
  const indexedDB: IDBFactory;
  const prompt: (message?: string, defaultValue?: string) => string | null;

  // React types (if needed)
  const React: typeof import('react');

  // Ensure MessageEvent is properly typed
  interface MessageEvent<T = any> {
    data: T;
    origin: string;
    lastEventId: string;
    source: MessageEventSource | null;
    ports: readonly MessagePort[];
  }

  type MessageEventSource = WindowProxy | MessagePort | ServiceWorker;
}

// Ensure the file is treated as a module
export {};