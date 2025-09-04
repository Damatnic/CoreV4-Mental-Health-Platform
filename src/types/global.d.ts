/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// Browser APIs
declare global {
  interface Window {
    AudioContext: typeof AudioContext;
    webkitAudioContext: typeof AudioContext;
    crypto: Crypto;
    gtag?: (command: string, eventName: string, parameters: Record<string, unknown>) => void;
    speechSynthesis: SpeechSynthesis;
    SpeechSynthesisUtterance: typeof SpeechSynthesisUtterance;
    webkitSpeechRecognition?: typeof SpeechRecognition;
    WebSocket: typeof WebSocket;
    getEventListeners?: (target: EventTarget, event: string) => EventListener[];
    matchMedia: (query: string) => MediaQueryList;
    PerformanceObserver: typeof PerformanceObserver;
    performance: Performance & {
      memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
      };
    };
    Notification: typeof Notification;
    RTCPeerConnection: typeof RTCPeerConnection;
    indexedDB: IDBFactory;
  }

  interface Navigator {
    geolocation: Geolocation;
    share?: (data?: ShareData) => Promise<void>;
    serviceWorker: ServiceWorkerContainer;
    userAgent: string;
    vibrate?: (pattern: number | number[]) => boolean;
  }

  interface Document {
    documentElement: HTMLElement;
    activeElement: Element | null;
  }

  // Node.js globals for build scripts
  namespace NodeJS {
    interface Global {
      gc?: () => void;
      fetch?: typeof fetch;
      WebSocket?: typeof WebSocket;
      PerformanceObserver?: typeof PerformanceObserver;
      Notification?: typeof Notification;
      webkitSpeechRecognition?: typeof SpeechRecognition;
    }
  }

  // Global variables
  const global: NodeJS.Global & typeof globalThis;
  const process: NodeJS.Process;
  const Buffer: typeof Buffer;

  // Service Worker types
  interface ServiceWorkerGlobalScope extends WorkerGlobalScope {
    skipWaiting(): Promise<void>;
    clients: Clients;
  }

  interface Clients {
    claim(): Promise<void>;
    get(id: string): Promise<Client | undefined>;
    matchAll(options?: ClientQueryOptions): Promise<Client[]>;
    openWindow(url: string): Promise<WindowClient | null>;
  }

  interface Client {
    id: string;
    type: ClientType;
    url: string;
    postMessage(message: unknown, transfer?: Transferable[]): void;
  }

  interface WindowClient extends Client {
    focus(): Promise<WindowClient>;
    navigate(url: string): Promise<WindowClient | null>;
    visibilityState: VisibilityState;
  }

  type ClientType = 'window' | 'worker' | 'sharedworker';

  interface ClientQueryOptions {
    includeUncontrolled?: boolean;
    type?: ClientType;
  }

  // Web APIs for crisis features
  interface GeolocationPosition {
    coords: GeolocationCoordinates;
    timestamp: number;
  }

  interface GeolocationCoordinates {
    latitude: number;
    longitude: number;
    altitude: number | null;
    accuracy: number;
    altitudeAccuracy: number | null;
    heading: number | null;
    speed: number | null;
  }

  interface ShareData {
    text?: string;
    title?: string;
    url?: string;
    files?: File[];
  }

  // IndexedDB types
  interface IDBFactory {
    open(name: string, version?: number): IDBOpenDBRequest;
    deleteDatabase(name: string): IDBOpenDBRequest;
    cmp(first: unknown, second: unknown): number;
  }

  // Crypto types
  interface Crypto {
    subtle: SubtleCrypto;
    getRandomValues<T extends ArrayBufferView | null>(array: T): T;
  }

  interface SubtleCrypto {
    encrypt(
      algorithm: AlgorithmIdentifier | RsaOaepParams | AesCtrParams | AesCbcParams | AesGcmParams,
      key: CryptoKey,
      data: BufferSource
    ): Promise<ArrayBuffer>;
    decrypt(
      algorithm: AlgorithmIdentifier | RsaOaepParams | AesCtrParams | AesCbcParams | AesGcmParams,
      key: CryptoKey,
      data: BufferSource
    ): Promise<ArrayBuffer>;
    generateKey(
      algorithm: RsaHashedKeyGenParams | EcKeyGenParams | HmacKeyGenParams | AesKeyGenParams,
      extractable: boolean,
      keyUsages: KeyUsage[]
    ): Promise<CryptoKey | CryptoKeyPair>;
  }

  // PWA types
  interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  }

  // Media Query types
  interface MediaQueryList {
    matches: boolean;
    media: string;
    addEventListener(event: 'change', listener: (this: MediaQueryList, ev: MediaQueryListEvent) => void): void;
    removeEventListener(event: 'change', listener: (this: MediaQueryList, ev: MediaQueryListEvent) => void): void;
  }

  interface MediaQueryListEvent extends Event {
    matches: boolean;
    media: string;
  }
}

// Vite environment variables
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_WS_URL?: string;
  readonly VITE_ENCRYPTION_KEY?: string;
  readonly VITE_PUBLIC_KEY?: string;
  readonly MODE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly SSR: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
  readonly hot?: {
    accept: (cb?: (mod: unknown) => void) => void;
    dispose: (cb: () => void) => void;
  };
}

// Module declarations
declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.jpeg' {
  const content: string;
  export default content;
}

declare module '*.gif' {
  const content: string;
  export default content;
}

declare module '*.webp' {
  const content: string;
  export default content;
}

declare module '*.woff' {
  const content: string;
  export default content;
}

declare module '*.woff2' {
  const content: string;
  export default content;
}

declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

declare module '*.module.css' {
  const classes: Record<string, string>;
  export default classes;
}

declare module '*.json' {
  const content: unknown;
  export default content;
}

// Worker module declarations
declare module '*?worker' {
  const workerConstructor: {
    new (): Worker;
  };
  export default workerConstructor;
}

declare module '*?worker&inline' {
  const workerConstructor: {
    new (): Worker;
  };
  export default workerConstructor;
}

// Fix for process.env
declare namespace NodeJS {
  interface ProcessEnv {
    readonly NODE_ENV: 'development' | 'production' | 'test';
    readonly PUBLIC_URL?: string;
  }

  interface Process {
    readonly env: ProcessEnv;
  }
}

export {};