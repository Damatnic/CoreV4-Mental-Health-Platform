// Web Worker Type Definitions for Mental Health Crisis Processing
// Comprehensive types for all Web Worker APIs used in the application

declare global {
  // Web Worker Global Scope
  interface DedicatedWorkerGlobalScope extends WorkerGlobalScope {
    readonly name: string;
    onmessage: ((this: DedicatedWorkerGlobalScope, ev: MessageEvent) => any) | null;
    onmessageerror: ((this: DedicatedWorkerGlobalScope, ev: MessageEvent) => any) | null;
    close(): void;
    postMessage(message: unknown, transfer?: Transferable[]): void;
    postMessage(message: unknown, options?: StructuredSerializeOptions): void;
  }

  interface WorkerGlobalScope extends EventTarget {
    readonly caches: CacheStorage;
    readonly crypto: Crypto;
    readonly indexedDB: IDBFactory;
    readonly isSecureContext: boolean;
    readonly location: WorkerLocation;
    readonly navigator: WorkerNavigator;
    onerror: ((this: WorkerGlobalScope, ev: ErrorEvent) => any) | null;
    onlanguagechange: ((this: WorkerGlobalScope, ev: Event) => any) | null;
    onoffline: ((this: WorkerGlobalScope, ev: Event) => any) | null;
    ononline: ((this: WorkerGlobalScope, ev: Event) => any) | null;
    onrejectionhandled: ((this: WorkerGlobalScope, ev: PromiseRejectionEvent) => any) | null;
    onunhandledrejection: ((this: WorkerGlobalScope, ev: PromiseRejectionEvent) => any) | null;
    readonly origin: string;
    readonly performance: Performance;
    readonly self: WorkerGlobalScope & typeof globalThis;
    atob(data: string): string;
    btoa(data: string): string;
    clearInterval(id?: number): void;
    clearTimeout(id?: number): void;
    createImageBitmap(image: ImageBitmapSource, options?: ImageBitmapOptions): Promise<ImageBitmap>;
    createImageBitmap(image: ImageBitmapSource, sx: number, sy: number, sw: number, sh: number, options?: ImageBitmapOptions): Promise<ImageBitmap>;
    fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
    importScripts(...urls: string[]): void;
    queueMicrotask(callback: VoidFunction): void;
    reportError(e: unknown): void;
    setInterval(handler: TimerHandler, timeout?: number, ...arguments: unknown[]): number;
    setTimeout(handler: TimerHandler, timeout?: number, ...arguments: unknown[]): number;
    structuredClone(value: unknown, options?: StructuredSerializeOptions): unknown;
  }

  interface WorkerLocation {
    readonly hash: string;
    readonly host: string;
    readonly hostname: string;
    readonly href: string;
    readonly origin: string;
    readonly pathname: string;
    readonly port: string;
    readonly protocol: string;
    readonly search: string;
    toString(): string;
  }

  interface WorkerNavigator extends NavigatorID, NavigatorLanguage, NavigatorOnLine, NavigatorConcurrentHardware {
    readonly connection: NetworkInformation | undefined;
    readonly deviceMemory: number | undefined;
    readonly hardwareConcurrency: number;
    readonly locks: LockManager;
    readonly mediaCapabilities: MediaCapabilities;
    readonly permissions: Permissions;
    readonly serviceWorker: ServiceWorkerContainer;
    readonly storage: StorageManager;
    readonly userAgentData: NavigatorUAData | undefined;
    readonly webdriver: boolean;
  }

  // Service Worker specific types
  interface ServiceWorkerGlobalScope extends WorkerGlobalScope {
    readonly clients: Clients;
    onactivate: ((this: ServiceWorkerGlobalScope, ev: ExtendableEvent) => any) | null;
    onfetch: ((this: ServiceWorkerGlobalScope, ev: FetchEvent) => any) | null;
    oninstall: ((this: ServiceWorkerGlobalScope, ev: ExtendableEvent) => any) | null;
    onmessage: ((this: ServiceWorkerGlobalScope, ev: ExtendableMessageEvent) => any) | null;
    onmessageerror: ((this: ServiceWorkerGlobalScope, ev: MessageEvent) => any) | null;
    onnotificationclick: ((this: ServiceWorkerGlobalScope, ev: NotificationEvent) => any) | null;
    onnotificationclose: ((this: ServiceWorkerGlobalScope, ev: NotificationEvent) => any) | null;
    onpush: ((this: ServiceWorkerGlobalScope, ev: PushEvent) => any) | null;
    onpushsubscriptionchange: ((this: ServiceWorkerGlobalScope, ev: PushSubscriptionChangeEvent) => any) | null;
    onsync: ((this: ServiceWorkerGlobalScope, ev: SyncEvent) => any) | null;
    readonly registration: ServiceWorkerRegistration;
    skipWaiting(): Promise<void>;
  }

  interface ExtendableEvent extends Event {
    waitUntil(f: Promise<unknown>): void;
  }

  interface FetchEvent extends ExtendableEvent {
    readonly clientId: string;
    readonly handled: Promise<void>;
    readonly preloadResponse: Promise<unknown>;
    readonly request: Request;
    readonly resultingClientId: string;
    respondWith(r: Response | Promise<Response>): void;
  }

  interface ExtendableMessageEvent extends ExtendableEvent {
    readonly data: unknown;
    readonly lastEventId: string;
    readonly origin: string;
    readonly ports: ReadonlyArray<MessagePort>;
    readonly source: Client | ServiceWorker | MessagePort | null;
  }

  interface NotificationEvent extends ExtendableEvent {
    readonly action: string;
    readonly notification: Notification;
    readonly reply: string;
  }

  interface PushEvent extends ExtendableEvent {
    readonly data: PushMessageData | null;
  }

  interface PushMessageData {
    arrayBuffer(): ArrayBuffer;
    blob(): Blob;
    json(): unknown;
    text(): string;
  }

  interface PushSubscriptionChangeEvent extends ExtendableEvent {
    readonly newSubscription: PushSubscription | null;
    readonly oldSubscription: PushSubscription | null;
  }

  interface SyncEvent extends ExtendableEvent {
    readonly lastChance: boolean;
    readonly tag: string;
  }

  interface Clients {
    claim(): Promise<void>;
    get(id: string): Promise<Client | undefined>;
    matchAll(options?: ClientQueryOptions): Promise<ReadonlyArray<Client>>;
    openWindow(url: string | URL): Promise<WindowClient | null>;
  }

  interface ClientQueryOptions {
    includeUncontrolled?: boolean;
    type?: ClientTypes;
  }

  type ClientTypes = 'all' | 'sharedworker' | 'window' | 'worker';

  interface Client {
    readonly frameType: FrameType;
    readonly id: string;
    readonly type: ClientTypes;
    readonly url: string;
    postMessage(message: unknown, transfer?: Transferable[]): void;
    postMessage(message: unknown, options?: StructuredSerializeOptions): void;
  }

  type FrameType = 'auxiliary' | 'nested' | 'none' | 'top-level';

  interface WindowClient extends Client {
    readonly ancestorOrigins: ReadonlyArray<string>;
    readonly focused: boolean;
    readonly visibilityState: VisibilityState;
    focus(): Promise<WindowClient>;
    navigate(url: string | URL): Promise<WindowClient | null>;
  }

  // Shared Worker types
  interface SharedWorkerGlobalScope extends WorkerGlobalScope {
    readonly name: string;
    onconnect: ((this: SharedWorkerGlobalScope, ev: MessageEvent) => any) | null;
    close(): void;
  }

  // Performance API for Web Workers
  interface Performance {
    readonly eventCounts: EventCounts;
    readonly navigation: PerformanceNavigation;
    readonly timeOrigin: number;
    readonly timing: PerformanceTiming;
    clearMarks(markName?: string): void;
    clearMeasures(measureName?: string): void;
    clearResourceTimings(): void;
    getEntries(): PerformanceEntryList;
    getEntriesByName(name: string, type?: string): PerformanceEntryList;
    getEntriesByType(type: string): PerformanceEntryList;
    mark(markName: string, markOptions?: PerformanceMarkOptions): PerformanceMark;
    measure(measureName: string, startOrMeasureOptions?: string | PerformanceMeasureOptions, endMark?: string): PerformanceMeasure;
    now(): number;
    setResourceTimingBufferSize(maxSize: number): void;
    toJSON(): unknown;
  }

  interface PerformanceMarkOptions {
    detail?: unknown;
    startTime?: number;
  }

  interface PerformanceMeasureOptions {
    detail?: unknown;
    duration?: number;
    end?: string | number;
    start?: string | number;
  }

  // Transferable objects for efficient data transfer
  interface Transferable {}

  interface ArrayBuffer extends Transferable {
    readonly byteLength: number;
    slice(begin: number, end?: number): ArrayBuffer;
  }

  interface MessagePort extends EventTarget, Transferable {
    onmessage: ((this: MessagePort, ev: MessageEvent) => any) | null;
    onmessageerror: ((this: MessagePort, ev: MessageEvent) => any) | null;
    close(): void;
    postMessage(message: unknown, transfer?: Transferable[]): void;
    start(): void;
  }

  interface ImageBitmap extends Transferable {
    readonly height: number;
    readonly width: number;
    close(): void;
  }

  interface OffscreenCanvas extends EventTarget, Transferable {
    height: number;
    width: number;
    convertToBlob(options?: ImageEncodeOptions): Promise<Blob>;
    getContext(contextId: '2d', options?: unknown): OffscreenCanvasRenderingContext2D | null;
    getContext(contextId: 'bitmaprenderer', options?: unknown): ImageBitmapRenderingContext | null;
    getContext(contextId: 'webgl', options?: unknown): WebGLRenderingContext | null;
    getContext(contextId: 'webgl2', options?: unknown): WebGL2RenderingContext | null;
    getContext(contextId: string, options?: unknown): OffscreenRenderingContext | null;
    transferToImageBitmap(): ImageBitmap;
  }

  type OffscreenRenderingContext = OffscreenCanvasRenderingContext2D | ImageBitmapRenderingContext | WebGLRenderingContext | WebGL2RenderingContext;

  interface StructuredSerializeOptions {
    transfer?: Transferable[];
  }

  interface ImageEncodeOptions {
    quality?: number;
    type?: string;
  }

  type ImageBitmapSource = ImageBitmap | ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | OffscreenCanvas | VideoFrame | Blob;

  interface ImageBitmapOptions {
    colorSpaceConversion?: ColorSpaceConversion;
    imageOrientation?: ImageOrientation;
    premultiplyAlpha?: PremultiplyAlpha;
    resizeHeight?: number;
    resizeQuality?: ResizeQuality;
    resizeWidth?: number;
  }

  type ColorSpaceConversion = 'default' | 'none';
  type ImageOrientation = 'flipY' | 'from-image' | 'none';
  type PremultiplyAlpha = 'default' | 'none' | 'premultiply';
  type ResizeQuality = 'high' | 'low' | 'medium' | 'pixelated';

  // Web Worker constructor types
  interface Worker extends EventTarget {
    onerror: ((this: Worker, ev: ErrorEvent) => any) | null;
    onmessage: ((this: Worker, ev: MessageEvent) => any) | null;
    onmessageerror: ((this: Worker, ev: MessageEvent) => any) | null;
    postMessage(message: unknown, transfer?: Transferable[]): void;
    postMessage(message: unknown, options?: StructuredSerializeOptions): void;
    terminate(): void;
  }

  const Worker: {
    prototype: Worker;
    new(scriptURL: string | URL, options?: WorkerOptions): Worker;
  };

  interface WorkerOptions {
    credentials?: RequestCredentials;
    name?: string;
    type?: WorkerType;
  }

  type WorkerType = 'classic' | 'module';

  interface SharedWorker extends EventTarget {
    readonly port: MessagePort;
    onerror: ((this: SharedWorker, ev: ErrorEvent) => any) | null;
  }

  const SharedWorker: {
    prototype: SharedWorker;
    new(scriptURL: string | URL, options?: string | WorkerOptions): SharedWorker;
  };

  // Web Worker utilities
  type TimerHandler = string | Function;

  // Error handling in Workers
  interface ErrorEvent extends Event {
    readonly colno: number;
    readonly error: unknown;
    readonly filename: string;
    readonly lineno: number;
    readonly message: string;
  }

  interface PromiseRejectionEvent extends Event {
    readonly promise: Promise<unknown>;
    readonly reason: unknown;
  }

  // Additional Navigator interfaces
  interface NavigatorID {
    readonly appCodeName: string;
    readonly appName: string;
    readonly appVersion: string;
    readonly platform: string;
    readonly product: string;
    readonly productSub: string;
    readonly userAgent: string;
    readonly vendor: string;
    readonly vendorSub: string;
  }

  interface NavigatorLanguage {
    readonly language: string;
    readonly languages: ReadonlyArray<string>;
  }

  interface NavigatorOnLine {
    readonly onLine: boolean;
  }

  interface NavigatorConcurrentHardware {
    readonly hardwareConcurrency: number;
  }

  // Lock Manager for Web Workers
  interface LockManager {
    query(): Promise<LockManagerSnapshot>;
    request(name: string, callback: LockGrantedCallback): Promise<unknown>;
    request(name: string, options: LockOptions, callback: LockGrantedCallback): Promise<unknown>;
  }

  interface LockManagerSnapshot {
    held?: LockInfo[];
    pending?: LockInfo[];
  }

  interface LockInfo {
    clientId?: string;
    mode?: LockMode;
    name?: string;
  }

  interface LockOptions {
    ifAvailable?: boolean;
    mode?: LockMode;
    signal?: AbortSignal;
    steal?: boolean;
  }

  interface LockGrantedCallback {
    (lock: Lock | null): unknown;
  }

  interface Lock {
    readonly mode: LockMode;
    readonly name: string;
  }

  type LockMode = 'exclusive' | 'shared';

  // Media Capabilities for Web Workers
  interface MediaCapabilities {
    decodingInfo(configuration: MediaDecodingConfiguration): Promise<MediaCapabilitiesDecodingInfo>;
    encodingInfo(configuration: MediaEncodingConfiguration): Promise<MediaCapabilitiesEncodingInfo>;
  }

  // Permissions API for Web Workers
  interface Permissions {
    query(permissionDesc: PermissionDescriptor): Promise<PermissionStatus>;
  }

  interface PermissionDescriptor {
    name: PermissionName;
  }

  interface PermissionStatus extends EventTarget {
    readonly name: PermissionName;
    onchange: ((this: PermissionStatus, ev: Event) => any) | null;
    readonly state: PermissionState;
  }

  type PermissionName = 'camera' | 'microphone' | 'notifications' | 'persistent-storage' | 'push' | 'screen-wake-lock' | 'storage-access' | 'top-level-storage-access';
  type PermissionState = 'denied' | 'granted' | 'prompt';

  // Service Worker Container for Web Workers
  interface ServiceWorkerContainer extends EventTarget {
    readonly controller: ServiceWorker | null;
    oncontrollerchange: ((this: ServiceWorkerContainer, ev: Event) => any) | null;
    onmessage: ((this: ServiceWorkerContainer, ev: MessageEvent) => any) | null;
    onmessageerror: ((this: ServiceWorkerContainer, ev: MessageEvent) => any) | null;
    readonly ready: Promise<ServiceWorkerRegistration>;
    getRegistration(clientURL?: string | URL): Promise<ServiceWorkerRegistration | undefined>;
    getRegistrations(): Promise<ReadonlyArray<ServiceWorkerRegistration>>;
    register(scriptURL: string | URL, options?: RegistrationOptions): Promise<ServiceWorkerRegistration>;
    startMessages(): void;
  }

  interface RegistrationOptions {
    scope?: string;
    type?: WorkerType;
    updateViaCache?: ServiceWorkerUpdateViaCache;
  }

  type ServiceWorkerUpdateViaCache = 'all' | 'imports' | 'none';

  // Navigator UA Data for Web Workers
  interface NavigatorUAData {
    readonly brands: ReadonlyArray<NavigatorUABrandVersion>;
    readonly mobile: boolean;
    readonly platform: string;
    getHighEntropyValues(hints: string[]): Promise<UADataValues>;
    toJSON(): UALowEntropyJSON;
  }

  interface NavigatorUABrandVersion {
    readonly brand: string;
    readonly version: string;
  }

  interface UADataValues {
    readonly architecture?: string;
    readonly bitness?: string;
    readonly brands?: NavigatorUABrandVersion[];
    readonly formFactor?: string;
    readonly fullVersionList?: NavigatorUABrandVersion[];
    readonly mobile?: boolean;
    readonly model?: string;
    readonly platform?: string;
    readonly platformVersion?: string;
    readonly uaFullVersion?: string;
    readonly wow64?: boolean;
  }

  interface UALowEntropyJSON {
    readonly brands: NavigatorUABrandVersion[];
    readonly mobile: boolean;
    readonly platform: string;
  }

  // Global scope type checking
  const self: WorkerGlobalScope & typeof globalThis;

  // Crisis processing specific types for mental health application
  interface CrisisWorkerMessage {
    type: 'ANALYZE_CRISIS_DATA' | 'PROCESS_EMERGENCY_ALERT' | 'CALCULATE_RISK_SCORE' | 'VALIDATE_SAFETY_PLAN';
    data: unknown;
    id?: string;
    timestamp?: number;
  }

  interface CrisisWorkerResponse {
    type: string;
    result: unknown;
    error?: string;
    processingTime: number;
    id?: string;
  }
}

export {};