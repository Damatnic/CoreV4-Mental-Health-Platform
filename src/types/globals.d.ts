/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="webworker" />

// Browser and DOM API Type Declarations for Mental Health Application
// This file ensures TypeScript recognizes browser-specific globals
// Critical for crisis intervention features that rely on browser APIs

declare global {
  // Navigator API extensions for battery and network status
  interface Navigator {
    getBattery?: () => Promise<BatteryManager>;
    connection?: NetworkInformation;
    mozConnection?: NetworkInformation;
    webkitConnection?: NetworkInformation;
  }

  // Battery Manager API
  interface BatteryManager extends EventTarget {
    charging: boolean;
    chargingTime: number;
    dischargingTime: number;
    level: number;
    onchargingchange: ((this: BatteryManager, ev: Event) => any) | null;
    onchargingtimechange: ((this: BatteryManager, ev: Event) => any) | null;
    ondischargingtimechange: ((this: BatteryManager, ev: Event) => any) | null;
    onlevelchange: ((this: BatteryManager, ev: Event) => any) | null;
  }

  // Network Information API
  interface NetworkInformation extends EventTarget {
    downlink?: number;
    downlinkMax?: number;
    effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
    rtt?: number;
    saveData?: boolean;
    type?: 'bluetooth' | 'cellular' | 'ethernet' | 'none' | 'wifi' | 'wimax' | 'other' | 'unknown';
    onchange?: ((this: NetworkInformation, ev: Event) => any) | null;
    ontypechange?: ((this: NetworkInformation, ev: Event) => any) | null;
  }

  // Geolocation types for crisis location services
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

  // IndexedDB API for offline crisis data storage
  const indexedDB: IDBFactory;
  
  interface IDBFactory {
    open(name: string, version?: number): IDBOpenDBRequest;
    deleteDatabase(name: string): IDBOpenDBRequest;
    cmp(first: any, second: any): number;
  }

  interface IDBOpenDBRequest extends IDBRequest<IDBDatabase> {
    onblocked: ((this: IDBOpenDBRequest, ev: Event) => any) | null;
    onupgradeneeded: ((this: IDBOpenDBRequest, ev: IDBVersionChangeEvent) => any) | null;
  }

  interface IDBDatabase extends EventTarget {
    name: string;
    version: number;
    objectStoreNames: DOMStringList;
    close(): void;
    createObjectStore(name: string, options?: IDBObjectStoreParameters): IDBObjectStore;
    deleteObjectStore(name: string): void;
    transaction(storeNames: string | string[], mode?: IDBTransactionMode): IDBTransaction;
    onabort: ((this: IDBDatabase, ev: Event) => any) | null;
    onclose: ((this: IDBDatabase, ev: Event) => any) | null;
    onerror: ((this: IDBDatabase, ev: Event) => any) | null;
    onversionchange: ((this: IDBDatabase, ev: IDBVersionChangeEvent) => any) | null;
  }

  // Notification API for crisis alerts
  type NotificationPermission = 'default' | 'denied' | 'granted';
  
  interface NotificationOptions {
    actions?: NotificationAction[];
    badge?: string;
    body?: string;
    data?: any;
    dir?: NotificationDirection;
    icon?: string;
    image?: string;
    lang?: string;
    renotify?: boolean;
    requireInteraction?: boolean;
    silent?: boolean;
    tag?: string;
    timestamp?: number;
    vibrate?: VibratePattern;
  }

  interface NotificationAction {
    action: string;
    title: string;
    icon?: string;
  }

  type NotificationDirection = 'auto' | 'ltr' | 'rtl';
  type VibratePattern = number | number[];

  class Notification extends EventTarget {
    constructor(title: string, options?: NotificationOptions);
    static readonly permission: NotificationPermission;
    static requestPermission(): Promise<NotificationPermission>;
    readonly title: string;
    readonly dir: NotificationDirection;
    readonly lang: string;
    readonly body: string;
    readonly tag: string;
    readonly image: string | undefined;
    readonly icon: string | undefined;
    readonly badge: string | undefined;
    readonly vibrate: ReadonlyArray<number>;
    readonly timestamp: number;
    readonly renotify: boolean;
    readonly silent: boolean;
    readonly requireInteraction: boolean;
    readonly data: any;
    readonly actions: ReadonlyArray<NotificationAction>;
    close(): void;
    onclick: ((this: Notification, ev: Event) => any) | null;
    onclose: ((this: Notification, ev: Event) => any) | null;
    onerror: ((this: Notification, ev: Event) => any) | null;
    onshow: ((this: Notification, ev: Event) => any) | null;
  }

  // Service Worker types for offline crisis support
  interface ServiceWorkerRegistration extends EventTarget {
    scope: string;
    updateViaCache: 'all' | 'imports' | 'none';
    active: ServiceWorker | null;
    installing: ServiceWorker | null;
    waiting: ServiceWorker | null;
    getNotifications(filter?: GetNotificationOptions): Promise<Notification[]>;
    showNotification(title: string, options?: NotificationOptions): Promise<void>;
    update(): Promise<void>;
    unregister(): Promise<boolean>;
    onupdatefound: ((this: ServiceWorkerRegistration, ev: Event) => any) | null;
    pushManager: PushManager;
  }

  interface GetNotificationOptions {
    tag?: string;
  }

  interface PushManager {
    getSubscription(): Promise<PushSubscription | null>;
    permissionState(options?: PushSubscriptionOptionsInit): Promise<PushPermissionState>;
    subscribe(options?: PushSubscriptionOptionsInit): Promise<PushSubscription>;
  }

  interface PushSubscription {
    endpoint: string;
    expirationTime: number | null;
    options: PushSubscriptionOptions;
    getKey(name: PushEncryptionKeyName): ArrayBuffer | null;
    toJSON(): PushSubscriptionJSON;
    unsubscribe(): Promise<boolean>;
  }

  interface PushSubscriptionOptions {
    applicationServerKey: ArrayBuffer | null;
    userVisibleOnly: boolean;
  }

  interface PushSubscriptionOptionsInit {
    applicationServerKey?: BufferSource | string;
    userVisibleOnly?: boolean;
  }

  interface PushSubscriptionJSON {
    endpoint?: string;
    expirationTime?: number | null;
    keys?: Record<string, string>;
  }

  type PushEncryptionKeyName = 'auth' | 'p256dh';
  type PushPermissionState = 'denied' | 'granted' | 'prompt';

  // Crypto API for secure data handling
  interface Crypto {
    subtle: SubtleCrypto;
    getRandomValues<T extends ArrayBufferView | null>(array: T): T;
    randomUUID(): string;
  }

  interface SubtleCrypto {
    decrypt(algorithm: AlgorithmIdentifier | RsaOaepParams | AesCtrParams | AesCbcParams | AesGcmParams, key: CryptoKey, data: BufferSource): Promise<ArrayBuffer>;
    deriveBits(algorithm: AlgorithmIdentifier | EcdhKeyDeriveParams | HkdfParams | Pbkdf2Params, baseKey: CryptoKey, length: number): Promise<ArrayBuffer>;
    deriveKey(algorithm: AlgorithmIdentifier | EcdhKeyDeriveParams | HkdfParams | Pbkdf2Params, baseKey: CryptoKey, derivedKeyType: AlgorithmIdentifier | AesDerivedKeyParams | HmacImportParams | HkdfParams | Pbkdf2Params, extractable: boolean, keyUsages: KeyUsage[]): Promise<CryptoKey>;
    digest(algorithm: AlgorithmIdentifier, data: BufferSource): Promise<ArrayBuffer>;
    encrypt(algorithm: AlgorithmIdentifier | RsaOaepParams | AesCtrParams | AesCbcParams | AesGcmParams, key: CryptoKey, data: BufferSource): Promise<ArrayBuffer>;
    exportKey(format: 'jwk', key: CryptoKey): Promise<JsonWebKey>;
    exportKey(format: 'raw' | 'pkcs8' | 'spki', key: CryptoKey): Promise<ArrayBuffer>;
    generateKey(algorithm: RsaHashedKeyGenParams | EcKeyGenParams, extractable: boolean, keyUsages: KeyUsage[]): Promise<CryptoKeyPair>;
    generateKey(algorithm: AesKeyGenParams | HmacKeyGenParams, extractable: boolean, keyUsages: KeyUsage[]): Promise<CryptoKey>;
    generateKey(algorithm: AlgorithmIdentifier, extractable: boolean, keyUsages: KeyUsage[]): Promise<CryptoKeyPair | CryptoKey>;
    importKey(format: 'jwk', keyData: JsonWebKey, algorithm: AlgorithmIdentifier | RsaHashedImportParams | EcKeyImportParams | HmacImportParams | AesKeyAlgorithm, extractable: boolean, keyUsages: KeyUsage[]): Promise<CryptoKey>;
    importKey(format: 'raw' | 'pkcs8' | 'spki', keyData: BufferSource, algorithm: AlgorithmIdentifier | RsaHashedImportParams | EcKeyImportParams | HmacImportParams | AesKeyAlgorithm, extractable: boolean, keyUsages: KeyUsage[]): Promise<CryptoKey>;
    sign(algorithm: AlgorithmIdentifier | RsaPssParams | EcdsaParams, key: CryptoKey, data: BufferSource): Promise<ArrayBuffer>;
    unwrapKey(format: KeyFormat, wrappedKey: BufferSource, unwrappingKey: CryptoKey, unwrapAlgorithm: AlgorithmIdentifier | RsaOaepParams | AesCtrParams | AesCbcParams | AesGcmParams, unwrappedKeyAlgorithm: AlgorithmIdentifier | RsaHashedImportParams | EcKeyImportParams | HmacImportParams | AesKeyAlgorithm, extractable: boolean, keyUsages: KeyUsage[]): Promise<CryptoKey>;
    verify(algorithm: AlgorithmIdentifier | RsaPssParams | EcdsaParams, key: CryptoKey, signature: BufferSource, data: BufferSource): Promise<boolean>;
    wrapKey(format: KeyFormat, key: CryptoKey, wrappingKey: CryptoKey, wrapAlgorithm: AlgorithmIdentifier | RsaOaepParams | AesCtrParams | AesCbcParams | AesGcmParams): Promise<ArrayBuffer>;
  }

  interface CryptoKey {
    readonly algorithm: KeyAlgorithm;
    readonly extractable: boolean;
    readonly type: KeyType;
    readonly usages: KeyUsage[];
  }

  interface CryptoKeyPair {
    privateKey: CryptoKey;
    publicKey: CryptoKey;
  }

  type KeyFormat = 'jwk' | 'pkcs8' | 'raw' | 'spki';
  type KeyType = 'private' | 'public' | 'secret';
  type KeyUsage = 'decrypt' | 'deriveBits' | 'deriveKey' | 'encrypt' | 'sign' | 'unwrapKey' | 'verify' | 'wrapKey';
  type BufferSource = ArrayBuffer | ArrayBufferView;

  const crypto: Crypto;

  // Cache API for offline resources
  const caches: CacheStorage;

  interface CacheStorage {
    delete(cacheName: string): Promise<boolean>;
    has(cacheName: string): Promise<boolean>;
    keys(): Promise<string[]>;
    match(request: RequestInfo | URL, options?: CacheQueryOptions): Promise<Response | undefined>;
    open(cacheName: string): Promise<Cache>;
  }

  interface Cache {
    add(request: RequestInfo | URL): Promise<void>;
    addAll(requests: (RequestInfo | URL)[]): Promise<void>;
    delete(request: RequestInfo | URL, options?: CacheQueryOptions): Promise<boolean>;
    keys(request?: RequestInfo | URL, options?: CacheQueryOptions): Promise<ReadonlyArray<Request>>;
    match(request: RequestInfo | URL, options?: CacheQueryOptions): Promise<Response | undefined>;
    matchAll(request?: RequestInfo | URL, options?: CacheQueryOptions): Promise<ReadonlyArray<Response>>;
    put(request: RequestInfo | URL, response: Response): Promise<void>;
  }

  interface CacheQueryOptions {
    ignoreMethod?: boolean;
    ignoreSearch?: boolean;
    ignoreVary?: boolean;
  }

  // Performance APIs for monitoring crisis response times
  interface PerformanceNavigationTiming extends PerformanceResourceTiming {
    domComplete: number;
    domContentLoadedEventEnd: number;
    domContentLoadedEventStart: number;
    domInteractive: number;
    loadEventEnd: number;
    loadEventStart: number;
    redirectCount: number;
    type: NavigationType;
    unloadEventEnd: number;
    unloadEventStart: number;
  }

  type NavigationType = 'navigate' | 'reload' | 'back_forward' | 'prerender';

  // Text encoding/decoding for secure data handling
  class TextEncoder {
    constructor();
    encode(input?: string): Uint8Array;
    encodeInto(source: string, destination: Uint8Array): TextEncoderEncodeIntoResult;
  }

  interface TextEncoderEncodeIntoResult {
    read: number;
    written: number;
  }

  class TextDecoder {
    constructor(label?: string, options?: TextDecoderOptions);
    decode(input?: BufferSource, options?: TextDecodeOptions): string;
    readonly encoding: string;
    readonly fatal: boolean;
    readonly ignoreBOM: boolean;
  }

  interface TextDecoderOptions {
    fatal?: boolean;
    ignoreBOM?: boolean;
  }

  interface TextDecodeOptions {
    stream?: boolean;
  }

  // Base64 encoding functions
  function btoa(data: string): string;
  function atob(data: string): string;

  // HTML Element types for form handling
  interface HTMLElement extends Element {
    accessKey: string;
    contentEditable: string;
    dir: string;
    draggable: boolean;
    hidden: boolean;
    innerText: string;
    lang: string;
    offsetHeight: number;
    offsetLeft: number;
    offsetParent: Element | null;
    offsetTop: number;
    offsetWidth: number;
    spellcheck: boolean;
    tabIndex: number;
    title: string;
    blur(): void;
    click(): void;
    focus(options?: FocusOptions): void;
  }

  interface HTMLButtonElement extends HTMLElement {
    autofocus: boolean;
    disabled: boolean;
    form: HTMLFormElement | null;
    formAction: string;
    formEnctype: string;
    formMethod: string;
    formNoValidate: boolean;
    formTarget: string;
    name: string;
    type: 'submit' | 'reset' | 'button';
    value: string;
  }

  interface HTMLDivElement extends HTMLElement {
    align: string;
  }

  interface HTMLInputElement extends HTMLElement {
    accept: string;
    alt: string;
    autocomplete: string;
    autofocus: boolean;
    checked: boolean;
    defaultChecked: boolean;
    defaultValue: string;
    disabled: boolean;
    files: FileList | null;
    form: HTMLFormElement | null;
    height: number;
    max: string;
    maxLength: number;
    min: string;
    minLength: number;
    multiple: boolean;
    name: string;
    pattern: string;
    placeholder: string;
    readOnly: boolean;
    required: boolean;
    size: number;
    src: string;
    step: string;
    type: string;
    value: string;
    valueAsDate: Date | null;
    valueAsNumber: number;
    width: number;
    checkValidity(): boolean;
    reportValidity(): boolean;
    select(): void;
    setCustomValidity(error: string): void;
    setRangeText(replacement: string): void;
    setSelectionRange(start: number | null, end: number | null, direction?: 'forward' | 'backward' | 'none'): void;
    stepDown(n?: number): void;
    stepUp(n?: number): void;
  }

  interface HTMLTextAreaElement extends HTMLElement {
    autofocus: boolean;
    cols: number;
    defaultValue: string;
    disabled: boolean;
    form: HTMLFormElement | null;
    maxLength: number;
    minLength: number;
    name: string;
    placeholder: string;
    readOnly: boolean;
    required: boolean;
    rows: number;
    value: string;
    wrap: string;
    checkValidity(): boolean;
    reportValidity(): boolean;
    select(): void;
    setCustomValidity(error: string): void;
    setRangeText(replacement: string): void;
    setSelectionRange(start: number | null, end: number | null, direction?: 'forward' | 'backward' | 'none'): void;
  }

  interface HTMLSelectElement extends HTMLElement {
    autofocus: boolean;
    disabled: boolean;
    form: HTMLFormElement | null;
    length: number;
    multiple: boolean;
    name: string;
    options: HTMLOptionsCollection;
    required: boolean;
    selectedIndex: number;
    selectedOptions: HTMLCollectionOf<HTMLOptionElement>;
    size: number;
    type: string;
    value: string;
    add(element: HTMLOptionElement | HTMLOptGroupElement, before?: HTMLElement | number | null): void;
    checkValidity(): boolean;
    item(index: number): HTMLOptionElement | null;
    namedItem(name: string): HTMLOptionElement | null;
    remove(index?: number): void;
    reportValidity(): boolean;
    setCustomValidity(error: string): void;
  }

  interface HTMLFormElement extends HTMLElement {
    acceptCharset: string;
    action: string;
    autocomplete: string;
    elements: HTMLFormControlsCollection;
    encoding: string;
    enctype: string;
    length: number;
    method: string;
    name: string;
    noValidate: boolean;
    target: string;
    checkValidity(): boolean;
    reportValidity(): boolean;
    reset(): void;
    submit(): void;
  }

  // Event types for interaction handling
  interface KeyboardEvent extends UIEvent {
    readonly altKey: boolean;
    readonly code: string;
    readonly ctrlKey: boolean;
    readonly isComposing: boolean;
    readonly key: string;
    readonly location: number;
    readonly metaKey: boolean;
    readonly repeat: boolean;
    readonly shiftKey: boolean;
    getModifierState(keyArg: string): boolean;
  }

  interface TouchEvent extends UIEvent {
    readonly altKey: boolean;
    readonly changedTouches: TouchList;
    readonly ctrlKey: boolean;
    readonly metaKey: boolean;
    readonly shiftKey: boolean;
    readonly targetTouches: TouchList;
    readonly touches: TouchList;
  }

  interface Touch {
    readonly clientX: number;
    readonly clientY: number;
    readonly force: number;
    readonly identifier: number;
    readonly pageX: number;
    readonly pageY: number;
    readonly radiusX: number;
    readonly radiusY: number;
    readonly rotationAngle: number;
    readonly screenX: number;
    readonly screenY: number;
    readonly target: EventTarget;
  }

  interface TouchList {
    readonly length: number;
    item(index: number): Touch | null;
    [index: number]: Touch;
  }

  // Window globals
  const prompt: (message?: string, defaultValue?: string) => string | null;
}

export {};