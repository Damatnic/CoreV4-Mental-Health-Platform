/**
 * Utility library type declarations
 * Provides types for utility functions and third-party libraries
 */

// Socket.IO Client types
declare module 'socket.io-client' {
  import { EventEmitter } from 'events';
  
  export interface ManagerOptions {
    forceNew?: boolean;
    multiplex?: boolean;
    path?: string;
    reconnection?: boolean;
    reconnectionAttempts?: number;
    reconnectionDelay?: number;
    reconnectionDelayMax?: number;
    randomizationFactor?: number;
    timeout?: number;
    autoConnect?: boolean;
    query?: Record<string, string>;
    parser?: unknown;
  }

  export interface SocketOptions extends ManagerOptions {
    auth?: Record<string, any> | ((cb: (data: Record<string, any>) => void) => void);
  }

  export interface Socket extends EventEmitter {
    id: string;
    connected: boolean;
    disconnected: boolean;
    io: unknown;
    auth: Record<string, any>;
    
    connect(): Socket;
    disconnect(): Socket;
    emit(event: string, ...args: unknown[]): Socket;
    on(event: string, fn: Function): Socket;
    once(event: string, fn: Function): Socket;
    off(event?: string, fn?: Function): Socket;
    removeListener(event: string, fn?: Function): Socket;
    removeAllListeners(event?: string): Socket;
    
    // Mental health app specific events
    onAny(fn: (event: string, ...args: unknown[]) => void): Socket;
    offAny(fn?: (event: string, ...args: unknown[]) => void): Socket;
    timeout(timeout: number): Socket;
    compress(compress: boolean): Socket;
    volatile: Socket;
  }
  
  export function io(uri?: string, opts?: Partial<SocketOptions>): Socket;
  export default io;
}

// Comlink for Web Workers
declare module 'comlink' {
  export interface TransferHandler<T = unknown, S = unknown> {
    canHandle: (value: unknown) => value is T;
    serialize: (value: T) => readonly [S, Transferable[]];
    deserialize: (value: S) => T;
  }

  export interface Endpoint {
    postMessage(message: unknown, transfer?: Transferable[]): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: {}
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: {}
    ): void;
    start?(): void;
  }

  export interface ExposeOptions {
    transferHandlers?: Map<string, TransferHandler>;
  }

  export interface WrapOptions {
    transferHandlers?: Map<string, TransferHandler>;
  }

  export function expose<T>(obj: T, endpoint?: Endpoint, options?: ExposeOptions): void;
  
  export function wrap<T = {}>(endpoint: Endpoint, options?: WrapOptions): Remote<T>;
  
  export function transfer<T>(obj: T, transferables: Transferable[]): T;
  
  export function proxy<T>(obj: T): T;
  
  export function releaseProxy(obj: unknown): void;
  
  export function windowEndpoint(
    w: PostMessageWithOrigin,
    context?: EventSource,
    targetOrigin?: string
  ): Endpoint;
  
  export type Remote<T> = {
    [P in keyof T]: T[P] extends (...args: infer Arguments) => infer Return
      ? (...args: Arguments) => Promise<Return>
      : T[P] extends (...args: infer Arguments) => Promise<infer Return>
      ? (...args: Arguments) => Promise<Return>
      : Promise<T[P]>;
  };

  interface PostMessageWithOrigin {
    postMessage(message: unknown, targetOrigin?: string, transfer?: Transferable[]): void;
  }
}

// IndexedDB wrapper
declare module 'idb' {
  export interface IDBPDatabase<DBTypes = unknown> extends IDBDatabase {
    transaction<Name extends string>(
      storeNames: Name | Name[],
      mode?: IDBTransactionMode
    ): IDBPTransaction<DBTypes, Name[]>;
    
    get<Name extends string>(
      storeName: Name,
      query: IDBValidKey | IDBKeyRange
    ): Promise<unknown>;
    
    getAll<Name extends string>(
      storeName: Name,
      query?: IDBValidKey | IDBKeyRange,
      count?: number
    ): Promise<any[]>;
    
    add<Name extends string>(
      storeName: Name,
      value: unknown,
      key?: IDBValidKey
    ): Promise<IDBValidKey>;
    
    put<Name extends string>(
      storeName: Name,
      value: unknown,
      key?: IDBValidKey
    ): Promise<IDBValidKey>;
    
    delete<Name extends string>(
      storeName: Name,
      query: IDBValidKey | IDBKeyRange
    ): Promise<void>;
    
    clear<Name extends string>(storeName: Name): Promise<void>;
    
    count<Name extends string>(
      storeName: Name,
      query?: IDBValidKey | IDBKeyRange
    ): Promise<number>;
  }

  export interface IDBPTransaction<DBTypes = unknown, StoreNames extends string[] = string[]>
    extends IDBTransaction {
    objectStore<Name extends StoreNames[number]>(name: Name): IDBPObjectStore<DBTypes>;
    store: StoreNames extends readonly [string] ? IDBPObjectStore<DBTypes> : never;
    done: Promise<void>;
  }

  export interface IDBPObjectStore<DBTypes = unknown> extends IDBObjectStore {
    get(query: IDBValidKey | IDBKeyRange): Promise<unknown>;
    getAll(query?: IDBValidKey | IDBKeyRange, count?: number): Promise<any[]>;
    add(value: unknown, key?: IDBValidKey): Promise<IDBValidKey>;
    put(value: unknown, key?: IDBValidKey): Promise<IDBValidKey>;
    delete(query: IDBValidKey | IDBKeyRange): Promise<void>;
    clear(): Promise<void>;
    count(query?: IDBValidKey | IDBKeyRange): Promise<number>;
  }

  export function openDB<DBTypes = unknown>(
    name: string,
    version?: number,
    options?: {
      upgrade?: (database: IDBPDatabase<DBTypes>, oldVersion: number, newVersion: number | null, transaction: IDBPTransaction<DBTypes>) => void;
      blocked?: (currentVersion: number, blockedVersion: number | null) => void;
      blocking?: (currentVersion: number, blockedVersion: number | null) => void;
      terminated?: () => void;
    }
  ): Promise<IDBPDatabase<DBTypes>>;
  
  export function deleteDB(
    name: string,
    options?: {
      blocked?: (currentVersion: number, blockedVersion: number | null) => void;
    }
  ): Promise<void>;
}

// Chart.js additional types
declare module 'chart.js/auto' {
  export * from 'chart.js';
  export { default } from 'chart.js';
}

// React Use library extensions
declare module 'react-use' {
  import { DependencyList, EffectCallback, MutableRefObject } from 'react';
  
  export function useLocalStorage<T>(
    key: string,
    initialValue: T
  ): [T, (value: T | ((prev: T) => T)) => void, () => void];
  
  export function useSessionStorage<T>(
    key: string,
    initialValue: T
  ): [T, (value: T | ((prev: T) => T)) => void, () => void];
  
  export function useDebounce<T>(value: T, delay: number): T;
  
  export function useThrottle<T>(value: T, ms: number): T;
  
  export function useInterval(
    callback: () => void,
    delay: number | null
  ): void;
  
  export function useTimeout(
    callback: () => void,
    delay: number
  ): [boolean, () => void, () => void];
  
  export function useToggle(
    initialValue?: boolean
  ): [boolean, (value?: boolean) => void];
  
  export function useBoolean(
    initialValue?: boolean
  ): [
    boolean,
    {
      toggle: () => void;
      setTrue: () => void;
      setFalse: () => void;
    }
  ];
  
  export function usePrevious<T>(value: T): T | undefined;
  
  export function useUpdateEffect(
    effect: EffectCallback,
    deps?: DependencyList
  ): void;
  
  export function useMount(effect: EffectCallback): void;
  
  export function useUnmount(effect: () => void | undefined): void;
  
  export function useWindowSize(): {
    width: number;
    height: number;
  };
  
  export function useMedia(query: string): boolean;
  
  export function useIsomorphicLayoutEffect(
    effect: EffectCallback,
    deps?: DependencyList
  ): void;
  
  export function useEffectOnce(effect: EffectCallback): void;
  
  export function useEvent<T extends (...args: unknown[]) => any>(handler: T): T;
  
  export function useMountedState(): () => boolean;
  
  export function useRafState<T>(
    initialState: T | (() => T)
  ): [T, (value: T | ((prev: T) => T)) => void];
}

// Crypto-JS type extensions
declare module 'crypto-js' {
  export interface CipherParams {
    ciphertext: unknown;
    key?: unknown;
    iv?: unknown;
    algorithm?: string;
    mode?: unknown;
    padding?: unknown;
    blockSize?: number;
    formatter?: unknown;
  }
  
  export interface WordArray {
    words: number[];
    sigBytes: number;
    toString(encoder?: unknown): string;
    concat(wordArray: WordArray): WordArray;
    clamp(): void;
    clone(): WordArray;
    random(nBytes: number): WordArray;
  }
  
  export namespace AES {
    function encrypt(message: string | WordArray, key: string | WordArray, cfg?: unknown): CipherParams;
    function decrypt(cipherParams: CipherParams | string, key: string | WordArray, cfg?: unknown): WordArray;
  }
  
  export namespace SHA256 {
    function hash(message: string | WordArray, cfg?: unknown): WordArray;
  }
  
  export namespace enc {
    export namespace Utf8 {
      function parse(str: string): WordArray;
      function stringify(wordArray: WordArray): string;
    }
    
    export namespace Base64 {
      function parse(str: string): WordArray;
      function stringify(wordArray: WordArray): string;
    }
    
    export namespace Hex {
      function parse(str: string): WordArray;
      function stringify(wordArray: WordArray): string;
    }
  }
  
  export function lib(cfg?: unknown): unknown;
}

// Web Vitals
declare module 'web-vitals' {
  export interface Metric {
    name: 'CLS' | 'FCP' | 'FID' | 'INP' | 'LCP' | 'TTFB';
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
    delta: number;
    entries: PerformanceEntry[];
    id: string;
    navigationType: 'navigate' | 'reload' | 'back_forward' | 'prerender';
  }
  
  export type ReportHandler = (metric: Metric) => void;
  
  export function getCLS(onReport: ReportHandler, opts?: { reportAllChanges?: boolean }): void;
  export function getFCP(onReport: ReportHandler, opts?: { reportAllChanges?: boolean }): void;
  export function getFID(onReport: ReportHandler, opts?: { reportAllChanges?: boolean }): void;
  export function getINP(onReport: ReportHandler, opts?: { reportAllChanges?: boolean }): void;
  export function getLCP(onReport: ReportHandler, opts?: { reportAllChanges?: boolean }): void;
  export function getTTFB(onReport: ReportHandler, opts?: { reportAllChanges?: boolean }): void;
  
  export function onCLS(onReport: ReportHandler, opts?: { reportAllChanges?: boolean }): void;
  export function onFCP(onReport: ReportHandler, opts?: { reportAllChanges?: boolean }): void;
  export function onFID(onReport: ReportHandler, opts?: { reportAllChanges?: boolean }): void;
  export function onINP(onReport: ReportHandler, opts?: { reportAllChanges?: boolean }): void;
  export function onLCP(onReport: ReportHandler, opts?: { reportAllChanges?: boolean }): void;
  export function onTTFB(onReport: ReportHandler, opts?: { reportAllChanges?: boolean }): void;
}