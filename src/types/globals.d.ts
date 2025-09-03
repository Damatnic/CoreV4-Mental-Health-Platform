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

  // Speech Recognition API for accessibility features
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
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
    cmp(first: unknown, second: unknown): number;
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
    data?: unknown;
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
    readonly data: unknown;
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
    sync?: SyncManager; // Background Sync API
  }

  // Background Sync API for offline data synchronization
  interface SyncManager {
    register(tag: string): Promise<void>;
    getTags(): Promise<string[]>;
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

  // Enhanced EventTarget and EventListener interfaces
  interface EventTarget {
    addEventListener(type: string, listener: EventListener | null, options?: boolean | AddEventListenerOptions): void;
    removeEventListener(type: string, listener: EventListener | null, options?: boolean | EventListenerOptions): void;
    dispatchEvent(event: Event): boolean;
  }

  interface EventListener {
    (evt: Event): void;
  }

  interface AddEventListenerOptions extends EventListenerOptions {
    once?: boolean;
    passive?: boolean;
    signal?: AbortSignal;
  }

  interface EventListenerOptions {
    capture?: boolean;
  }

  // Enhanced Event interface
  interface Event {
    readonly bubbles: boolean;
    cancelBubble: boolean;
    readonly cancelable: boolean;
    readonly composed: boolean;
    readonly currentTarget: EventTarget | null;
    readonly defaultPrevented: boolean;
    readonly eventPhase: number;
    readonly isTrusted: boolean;
    returnValue: boolean;
    readonly srcElement: EventTarget | null;
    readonly target: EventTarget | null;
    readonly timeStamp: number;
    readonly type: string;
    composedPath(): EventTarget[];
    initEvent(type: string, bubbles?: boolean, cancelable?: boolean): void;
    preventDefault(): void;
    stopImmediatePropagation(): void;
    stopPropagation(): void;
  }

  // Custom Event for application-specific events
  interface CustomEvent<T = any> extends Event {
    readonly detail: T;
    initCustomEvent(typeArg: string, canBubbleArg: boolean, cancelableArg: boolean, detailArg: T): void;
  }

  const CustomEvent: {
    prototype: CustomEvent;
    new<T>(typeArg: string, eventInitDict?: CustomEventInit<T>): CustomEvent<T>;
  };

  interface CustomEventInit<T = any> extends EventInit {
    detail?: T;
  }

  interface EventInit {
    bubbles?: boolean;
    cancelable?: boolean;
    composed?: boolean;
  }

  // Message Event for Web Workers and Realtime Communication
  interface MessageEvent<T = any> extends Event {
    readonly data: T;
    readonly lastEventId: string;
    readonly origin: string;
    readonly ports: ReadonlyArray<MessagePort>;
    readonly source: MessageEventSource | null;
    initMessageEvent(
      type: string,
      bubbles?: boolean,
      cancelable?: boolean,
      data?: T,
      origin?: string,
      lastEventId?: string,
      source?: MessageEventSource,
      ports?: MessagePort[]
    ): void;
  }

  type MessageEventSource = WindowProxy | MessagePort | ServiceWorker;

  interface MessagePort extends EventTarget {
    onmessage: ((this: MessagePort, ev: MessageEvent) => any) | null;
    onmessageerror: ((this: MessagePort, ev: MessageEvent) => any) | null;
    close(): void;
    postMessage(message: unknown, transfer?: Transferable[]): void;
    start(): void;
  }

  // UI Events for form and interaction handling
  interface UIEvent extends Event {
    readonly detail: number;
    readonly view: Window | null;
    readonly which: number;
    initUIEvent(typeArg: string, canBubbleArg: boolean, cancelableArg: boolean, viewArg: Window, detailArg: number): void;
  }

  interface FocusEvent extends UIEvent {
    readonly relatedTarget: EventTarget | null;
    initFocusEvent(
      typeArg: string,
      canBubbleArg: boolean,
      cancelableArg: boolean,
      viewArg: Window,
      detailArg: number,
      relatedTargetArg: EventTarget
    ): void;
  }

  interface MouseEvent extends UIEvent {
    readonly altKey: boolean;
    readonly button: number;
    readonly buttons: number;
    readonly clientX: number;
    readonly clientY: number;
    readonly ctrlKey: boolean;
    readonly metaKey: boolean;
    readonly movementX: number;
    readonly movementY: number;
    readonly offsetX: number;
    readonly offsetY: number;
    readonly pageX: number;
    readonly pageY: number;
    readonly relatedTarget: EventTarget | null;
    readonly screenX: number;
    readonly screenY: number;
    readonly shiftKey: boolean;
    readonly x: number;
    readonly y: number;
    getModifierState(keyArg: string): boolean;
    initMouseEvent(
      typeArg: string,
      canBubbleArg: boolean,
      cancelableArg: boolean,
      viewArg: Window,
      detailArg: number,
      screenXArg: number,
      screenYArg: number,
      clientXArg: number,
      clientYArg: number,
      ctrlKeyArg: boolean,
      altKeyArg: boolean,
      shiftKeyArg: boolean,
      metaKeyArg: boolean,
      buttonArg: number,
      relatedTargetArg: EventTarget
    ): void;
  }

  // Enhanced Speech Recognition API for mental health accessibility
  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    grammars: SpeechGrammarList;
    interimResults: boolean;
    lang: string;
    maxAlternatives: number;
    onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
    onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    serviceURI: string;
    abort(): void;
    start(): void;
    stop(): void;
  }

  interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
  }

  interface SpeechRecognitionErrorEvent extends Event {
    readonly error: SpeechRecognitionErrorCode;
    readonly message: string;
  }

  type SpeechRecognitionErrorCode = 'aborted' | 'audio-capture' | 'bad-grammar' | 'language-not-supported' | 'network' | 'no-speech' | 'not-allowed' | 'service-not-allowed';

  interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
  }

  interface SpeechRecognitionResult {
    readonly isFinal: boolean;
    readonly length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
  }

  interface SpeechRecognitionAlternative {
    readonly confidence: number;
    readonly transcript: string;
  }

  interface SpeechGrammarList {
    readonly length: number;
    addFromString(string: string, weight?: number): void;
    addFromURI(src: string, weight?: number): void;
    item(index: number): SpeechGrammar;
    [index: number]: SpeechGrammar;
  }

  interface SpeechGrammar {
    src: string;
    weight: number;
  }

  // Enhanced Speech Synthesis API
  interface SpeechSynthesis extends EventTarget {
    readonly paused: boolean;
    readonly pending: boolean;
    readonly speaking: boolean;
    onvoiceschanged: ((this: SpeechSynthesis, ev: Event) => any) | null;
    cancel(): void;
    getVoices(): SpeechSynthesisVoice[];
    pause(): void;
    resume(): void;
    speak(utterance: SpeechSynthesisUtterance): void;
  }

  interface SpeechSynthesisUtterance extends EventTarget {
    lang: string;
    pitch: number;
    rate: number;
    text: string;
    voice: SpeechSynthesisVoice | null;
    volume: number;
    onboundary: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any) | null;
    onend: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any) | null;
    onerror: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisErrorEvent) => any) | null;
    onmark: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any) | null;
    onpause: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any) | null;
    onresume: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any) | null;
    onstart: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any) | null;
  }

  const SpeechSynthesisUtterance: {
    prototype: SpeechSynthesisUtterance;
    new(text?: string): SpeechSynthesisUtterance;
  };

  interface SpeechSynthesisEvent extends Event {
    readonly charIndex: number;
    readonly charLength: number;
    readonly elapsedTime: number;
    readonly name: string;
    readonly utterance: SpeechSynthesisUtterance;
  }

  interface SpeechSynthesisErrorEvent extends SpeechSynthesisEvent {
    readonly error: SpeechSynthesisErrorCode;
  }

  type SpeechSynthesisErrorCode = 'audio-busy' | 'audio-hardware' | 'canceled' | 'interrupted' | 'invalid-argument' | 'language-unavailable' | 'network' | 'not-allowed' | 'synthesis-failed' | 'synthesis-unavailable' | 'text-too-long' | 'voice-unavailable';

  interface SpeechSynthesisVoice {
    readonly default: boolean;
    readonly lang: string;
    readonly localService: boolean;
    readonly name: string;
    readonly voiceURI: string;
  }

  // Media APIs for mental health therapeutic features
  interface MediaDevices extends EventTarget {
    ondevicechange: ((this: MediaDevices, ev: Event) => any) | null;
    enumerateDevices(): Promise<MediaDeviceInfo[]>;
    getDisplayMedia(constraints?: DisplayMediaStreamOptions): Promise<MediaStream>;
    getSupportedConstraints(): MediaTrackSupportedConstraints;
    getUserMedia(constraints?: MediaStreamConstraints): Promise<MediaStream>;
  }

  interface MediaDeviceInfo {
    readonly deviceId: string;
    readonly groupId: string;
    readonly kind: MediaDeviceKind;
    readonly label: string;
    toJSON(): unknown;
  }

  type MediaDeviceKind = 'audioinput' | 'audiooutput' | 'videoinput';

  interface AudioContext extends BaseAudioContext {
    readonly baseLatency: number;
    readonly outputLatency: number;
    close(): Promise<void>;
    createMediaElementSource(mediaElement: HTMLMediaElement): MediaElementAudioSourceNode;
    createMediaStreamDestination(): MediaStreamAudioDestinationNode;
    createMediaStreamSource(mediaStream: MediaStream): MediaStreamAudioSourceNode;
    getOutputTimestamp(): AudioTimestamp;
    resume(): Promise<void>;
    suspend(): Promise<void>;
  }

  const AudioContext: {
    prototype: AudioContext;
    new(contextOptions?: AudioContextOptions): AudioContext;
  };

  interface BaseAudioContext extends EventTarget {
    readonly audioWorklet: AudioWorklet;
    readonly currentTime: number;
    readonly destination: AudioDestinationNode;
    readonly listener: AudioListener;
    onstatechange: ((this: BaseAudioContext, ev: Event) => any) | null;
    readonly sampleRate: number;
    readonly state: AudioContextState;
    createAnalyser(): AnalyserNode;
    createBiquadFilter(): BiquadFilterNode;
    createBuffer(numberOfChannels: number, length: number, sampleRate: number): AudioBuffer;
    createBufferSource(): AudioBufferSourceNode;
    createChannelMerger(numberOfInputs?: number): ChannelMergerNode;
    createChannelSplitter(numberOfOutputs?: number): ChannelSplitterNode;
    createConstantSource(): ConstantSourceNode;
    createConvolver(): ConvolverNode;
    createDelay(maxDelayTime?: number): DelayNode;
    createDynamicsCompressor(): DynamicsCompressorNode;
    createGain(): GainNode;
    createIIRFilter(feedforward: number[], feedback: number[]): IIRFilterNode;
    createOscillator(): OscillatorNode;
    createPanner(): PannerNode;
    createPeriodicWave(real: number[] | Float32Array, imag: number[] | Float32Array, constraints?: PeriodicWaveConstraints): PeriodicWave;
    createScriptProcessor(bufferSize?: number, numberOfInputChannels?: number, numberOfOutputChannels?: number): ScriptProcessorNode;
    createStereoPanner(): StereoPannerNode;
    createWaveShaper(): WaveShaperNode;
    decodeAudioData(audioData: ArrayBuffer, successCallback?: DecodeSuccessCallback | null, errorCallback?: DecodeErrorCallback | null): Promise<AudioBuffer>;
  }

  type AudioContextState = 'closed' | 'running' | 'suspended';
  type DecodeSuccessCallback = (decodedData: AudioBuffer) => void;
  type DecodeErrorCallback = (error: DOMException) => void;

  // Enhanced Window interface with additional mental health app APIs
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
    speechSynthesis: SpeechSynthesis;
    gtag?: (command: 'event' | 'config' | 'set', targetId: string, parameters?: Record<string, any>) => void;
    requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
    cancelIdleCallback?: (id: number) => void;
  }

  interface IdleRequestCallback {
    (deadline: IdleDeadline): void;
  }

  interface IdleDeadline {
    readonly didTimeout: boolean;
    timeRemaining(): number;
  }

  interface IdleRequestOptions {
    timeout?: number;
  }

  // Performance Observer API for monitoring crisis response times
  interface PerformanceObserver {
    disconnect(): void;
    observe(options: PerformanceObserverInit): void;
    takeRecords(): PerformanceEntryList;
  }

  const PerformanceObserver: {
    prototype: PerformanceObserver;
    new(callback: PerformanceObserverCallback): PerformanceObserver;
  };

  interface PerformanceObserverCallback {
    (entries: PerformanceObserverEntryList, observer: PerformanceObserver): void;
  }

  interface PerformanceObserverInit {
    buffered?: boolean;
    entryTypes?: string[];
    type?: string;
  }

  type PerformanceEntryList = PerformanceEntry[];
  type PerformanceObserverEntryList = PerformanceEntry[];

  interface PerformanceEntry {
    readonly duration: number;
    readonly entryType: string;
    readonly name: string;
    readonly startTime: number;
    toJSON(): unknown;
  }

  interface PerformanceMark extends PerformanceEntry {
    readonly detail: unknown;
  }

  interface PerformanceMeasure extends PerformanceEntry {
    readonly detail: unknown;
  }

  interface PerformanceResourceTiming extends PerformanceEntry {
    readonly connectEnd: number;
    readonly connectStart: number;
    readonly decodedBodySize: number;
    readonly domainLookupEnd: number;
    readonly domainLookupStart: number;
    readonly encodedBodySize: number;
    readonly fetchStart: number;
    readonly initiatorType: string;
    readonly nextHopProtocol: string;
    readonly redirectEnd: number;
    readonly redirectStart: number;
    readonly requestStart: number;
    readonly responseEnd: number;
    readonly responseStart: number;
    readonly secureConnectionStart: number;
    readonly serverTiming: ReadonlyArray<PerformanceServerTiming>;
    readonly transferSize: number;
    readonly workerStart: number;
    toJSON(): unknown;
  }

  interface PerformanceServerTiming {
    readonly description: string;
    readonly duration: number;
    readonly name: string;
    toJSON(): unknown;
  }

  // Storage quota API for offline crisis data
  interface StorageManager {
    estimate(): Promise<StorageEstimate>;
    persist(): Promise<boolean>;
    persisted(): Promise<boolean>;
  }

  interface StorageEstimate {
    quota?: number;
    usage?: number;
    usageDetails?: StorageEstimateUsageDetails;
  }

  interface StorageEstimateUsageDetails {
    indexedDB?: number;
    caches?: number;
    serviceWorkerRegistrations?: number;
  }

  interface Navigator {
    storage?: StorageManager;
    mediaDevices?: MediaDevices;
  }

  // AbortController for cancelling network requests
  interface AbortController {
    readonly signal: AbortSignal;
    abort(reason?: unknown): void;
  }

  const AbortController: {
    prototype: AbortController;
    new(): AbortController;
  };

  interface AbortSignal extends EventTarget {
    readonly aborted: boolean;
    readonly reason: unknown;
    onabort: ((this: AbortSignal, ev: Event) => any) | null;
    throwIfAborted(): void;
  }

  const AbortSignal: {
    prototype: AbortSignal;
    abort(reason?: unknown): AbortSignal;
    timeout(milliseconds: number): AbortSignal;
  };

  // Window globals
  const prompt: (message?: string, defaultValue?: string) => string | null;
  const speechSynthesis: SpeechSynthesis;
  // Enhanced File API for mental health data import/export
  interface File extends Blob {
    readonly lastModified: number;
    readonly name: string;
    readonly webkitRelativePath: string;
  }

  interface FileList {
    readonly length: number;
    item(index: number): File | null;
    [index: number]: File;
  }

  interface FileReader extends EventTarget {
    readonly error: DOMException | null;
    onabort: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null;
    onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null;
    onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null;
    onloadend: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null;
    onloadstart: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null;
    onprogress: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null;
    readonly readyState: number;
    readonly result: string | ArrayBuffer | null;
    abort(): void;
    readAsArrayBuffer(blob: Blob): void;
    readAsBinaryString(blob: Blob): void;
    readAsDataURL(blob: Blob): void;
    readAsText(blob: Blob, encoding?: string): void;
  }

  const FileReader: {
    prototype: FileReader;
    new(): FileReader;
    readonly DONE: number;
    readonly EMPTY: number;
    readonly LOADING: number;
  };

  // PWA Manifest types
  interface BeforeInstallPromptEvent extends Event {
    readonly platforms: ReadonlyArray<string>;
    readonly userChoice: Promise<ChoiceResult>;
    prompt(): Promise<void>;
  }

  interface ChoiceResult {
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }

  // Enhanced Fetch API types
  interface Request {
    readonly body: ReadableStream<Uint8Array> | null;
    readonly bodyUsed: boolean;
    readonly cache: RequestCache;
    readonly credentials: RequestCredentials;
    readonly destination: RequestDestination;
    readonly headers: Headers;
    readonly integrity: string;
    readonly keepalive: boolean;
    readonly method: string;
    readonly mode: RequestMode;
    readonly redirect: RequestRedirect;
    readonly referrer: string;
    readonly referrerPolicy: ReferrerPolicy;
    readonly signal: AbortSignal | null;
    readonly url: string;
    arrayBuffer(): Promise<ArrayBuffer>;
    blob(): Promise<Blob>;
    clone(): Request;
    formData(): Promise<FormData>;
    json(): Promise<unknown>;
    text(): Promise<string>;
  }

  const Request: {
    prototype: Request;
    new(input: RequestInfo | URL, init?: RequestInit): Request;
  };

  interface Response {
    readonly body: ReadableStream<Uint8Array> | null;
    readonly bodyUsed: boolean;
    readonly headers: Headers;
    readonly ok: boolean;
    readonly redirected: boolean;
    readonly status: number;
    readonly statusText: string;
    readonly type: ResponseType;
    readonly url: string;
    arrayBuffer(): Promise<ArrayBuffer>;
    blob(): Promise<Blob>;
    clone(): Response;
    formData(): Promise<FormData>;
    json(): Promise<unknown>;
    text(): Promise<string>;
  }

  const Response: {
    prototype: Response;
    new(body?: BodyInit | null, init?: ResponseInit): Response;
    error(): Response;
    redirect(url: string | URL, status?: number): Response;
  };

  type RequestInfo = Request | string;
  type ResponseType = 'basic' | 'cors' | 'default' | 'error' | 'opaque' | 'opaqueredirect';
  type RequestCache = 'default' | 'force-cache' | 'no-cache' | 'no-store' | 'only-if-cached' | 'reload';
  type RequestCredentials = 'include' | 'omit' | 'same-origin';
  type RequestDestination = '' | 'audio' | 'audioworklet' | 'document' | 'embed' | 'font' | 'frame' | 'iframe' | 'image' | 'manifest' | 'object' | 'paintworklet' | 'report' | 'script' | 'serviceworker' | 'sharedworker' | 'style' | 'track' | 'video' | 'worker' | 'xslt';
  type RequestMode = 'cors' | 'navigate' | 'no-cors' | 'same-origin';
  type RequestRedirect = 'error' | 'follow' | 'manual';
  type ReferrerPolicy = '' | 'no-referrer' | 'no-referrer-when-downgrade' | 'origin' | 'origin-when-cross-origin' | 'same-origin' | 'strict-origin' | 'strict-origin-when-cross-origin' | 'unsafe-url';

  interface RequestInit {
    body?: BodyInit | null;
    cache?: RequestCache;
    credentials?: RequestCredentials;
    headers?: HeadersInit;
    integrity?: string;
    keepalive?: boolean;
    method?: string;
    mode?: RequestMode;
    redirect?: RequestRedirect;
    referrer?: string;
    referrerPolicy?: ReferrerPolicy;
    signal?: AbortSignal | null;
    window?: unknown;
  }

  interface ResponseInit {
    headers?: HeadersInit;
    status?: number;
    statusText?: string;
  }

  type BodyInit = ArrayBuffer | ArrayBufferView | Blob | FormData | ReadableStream<Uint8Array> | URLSearchParams | string;
  type HeadersInit = Headers | Record<string, string> | Iterable<readonly [string, string]>;

  interface Headers {
    append(name: string, value: string): void;
    delete(name: string): void;
    get(name: string): string | null;
    has(name: string): boolean;
    set(name: string, value: string): void;
    forEach(callbackfn: (value: string, key: string, parent: Headers) => void, thisArg?: unknown): void;
  }

  const Headers: {
    prototype: Headers;
    new(init?: HeadersInit): Headers;
  };

  // WebRTC APIs for peer-to-peer crisis support
  interface RTCPeerConnection extends EventTarget {
    readonly canTrickleIceCandidates: boolean | null;
    readonly connectionState: RTCPeerConnectionState;
    readonly currentLocalDescription: RTCSessionDescription | null;
    readonly currentRemoteDescription: RTCSessionDescription | null;
    readonly iceConnectionState: RTCIceConnectionState;
    readonly iceGatheringState: RTCIceGatheringState;
    readonly localDescription: RTCSessionDescription | null;
    onconnectionstatechange: ((this: RTCPeerConnection, ev: Event) => any) | null;
    ondatachannel: ((this: RTCPeerConnection, ev: RTCDataChannelEvent) => any) | null;
    onicecandidate: ((this: RTCPeerConnection, ev: RTCPeerConnectionIceEvent) => any) | null;
    oniceconnectionstatechange: ((this: RTCPeerConnection, ev: Event) => any) | null;
    onicegatheringstatechange: ((this: RTCPeerConnection, ev: Event) => any) | null;
    onnegotiationneeded: ((this: RTCPeerConnection, ev: Event) => any) | null;
    onsignalingstatechange: ((this: RTCPeerConnection, ev: Event) => any) | null;
    ontrack: ((this: RTCPeerConnection, ev: RTCTrackEvent) => any) | null;
    readonly pendingLocalDescription: RTCSessionDescription | null;
    readonly pendingRemoteDescription: RTCSessionDescription | null;
    readonly remoteDescription: RTCSessionDescription | null;
    readonly signalingState: RTCSignalingState;
    addIceCandidate(candidate?: RTCIceCandidateInit): Promise<void>;
    addTrack(track: MediaStreamTrack, ...streams: MediaStream[]): RTCRtpSender;
    close(): void;
    createAnswer(options?: RTCAnswerOptions): Promise<RTCSessionDescriptionInit>;
    createDataChannel(label: string, dataChannelDict?: RTCDataChannelInit): RTCDataChannel;
    createOffer(options?: RTCOfferOptions): Promise<RTCSessionDescriptionInit>;
    getConfiguration(): RTCConfiguration;
    getReceivers(): RTCRtpReceiver[];
    getSenders(): RTCRtpSender[];
    getStats(selector?: MediaStreamTrack): Promise<RTCStatsReport>;
    getTransceivers(): RTCRtpTransceiver[];
    removeTrack(sender: RTCRtpSender): void;
    setConfiguration(configuration?: RTCConfiguration): void;
    setLocalDescription(description?: RTCSessionDescriptionInit): Promise<void>;
    setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void>;
  }

  const RTCPeerConnection: {
    prototype: RTCPeerConnection;
    new(configuration?: RTCConfiguration): RTCPeerConnection;
  };

  type RTCPeerConnectionState = 'closed' | 'connected' | 'connecting' | 'disconnected' | 'failed' | 'new';
  type RTCIceConnectionState = 'checking' | 'closed' | 'completed' | 'connected' | 'disconnected' | 'failed' | 'new';
  type RTCIceGatheringState = 'complete' | 'gathering' | 'new';
  type RTCSignalingState = 'closed' | 'have-local-offer' | 'have-local-pranswer' | 'have-remote-offer' | 'have-remote-pranswer' | 'stable';

  // Console gaming theme enhancements
  interface GamepadEvent extends Event {
    readonly gamepad: Gamepad;
  }

  interface Gamepad {
    readonly axes: ReadonlyArray<number>;
    readonly buttons: ReadonlyArray<GamepadButton>;
    readonly connected: boolean;
    readonly id: string;
    readonly index: number;
    readonly mapping: GamepadMappingType;
    readonly timestamp: number;
  }

  interface GamepadButton {
    readonly pressed: boolean;
    readonly touched: boolean;
    readonly value: number;
  }

  type GamepadMappingType = '' | 'standard';

  // Additional HTML Element types for comprehensive form handling
  interface HTMLOptionElement extends HTMLElement {
    defaultSelected: boolean;
    disabled: boolean;
    form: HTMLFormElement | null;
    index: number;
    label: string;
    selected: boolean;
    text: string;
    value: string;
  }

  interface HTMLOptGroupElement extends HTMLElement {
    disabled: boolean;
    label: string;
  }

  interface HTMLOptionsCollection extends HTMLCollectionOf<HTMLOptionElement> {
    length: number;
    selectedIndex: number;
    add(element: HTMLOptionElement | HTMLOptGroupElement, before?: HTMLElement | number): void;
    remove(index: number): void;
  }

  interface HTMLCollectionOf<T extends Element> extends HTMLCollection {
    item(index: number): T | null;
    namedItem(name: string): T | null;
    [index: number]: T;
  }

  interface HTMLCollection {
    readonly length: number;
    item(index: number): Element | null;
    namedItem(name: string): Element | null;
    [index: number]: Element;
  }

  interface HTMLFormControlsCollection extends HTMLCollection {
    namedItem(name: string): RadioNodeList | Element | null;
  }

  interface RadioNodeList extends NodeList {
    value: string;
  }

  interface NodeList {
    readonly length: number;
    item(index: number): Node | null;
    forEach(callbackfn: (value: Node, key: number, parent: NodeList) => void, thisArg?: unknown): void;
    [index: number]: Node;
  }

  interface Node extends EventTarget {
    readonly baseURI: string;
    readonly childNodes: NodeListOf<ChildNode>;
    readonly firstChild: ChildNode | null;
    readonly isConnected: boolean;
    readonly lastChild: ChildNode | null;
    readonly nextSibling: ChildNode | null;
    readonly nodeName: string;
    readonly nodeType: number;
    nodeValue: string | null;
    readonly ownerDocument: Document | null;
    readonly parentElement: Element | null;
    readonly parentNode: ParentNode | null;
    readonly previousSibling: ChildNode | null;
    textContent: string | null;
    appendChild<T extends Node>(node: T): T;
    cloneNode(deep?: boolean): Node;
    compareDocumentPosition(other: Node): number;
    contains(other: Node | null): boolean;
    getRootNode(options?: GetRootNodeOptions): Node;
    hasChildNodes(): boolean;
    insertBefore<T extends Node>(node: T, child: Node | null): T;
    isDefaultNamespace(namespace: string | null): boolean;
    isEqualNode(otherNode: Node | null): boolean;
    isSameNode(otherNode: Node | null): boolean;
    lookupNamespaceURI(prefix: string | null): string | null;
    lookupPrefix(namespace: string | null): string | null;
    normalize(): void;
    removeChild<T extends Node>(child: T): T;
    replaceChild<T extends Node>(node: Node, child: T): T;
  }

  interface NodeListOf<TNode extends Node> extends NodeList {
    item(index: number): TNode | null;
    forEach(callbackfn: (value: TNode, key: number, parent: NodeListOf<TNode>) => void, thisArg?: unknown): void;
    [index: number]: TNode;
  }

  // Comprehensive Form Validation API
  interface ValidityState {
    readonly badInput: boolean;
    readonly customError: boolean;
    readonly patternMismatch: boolean;
    readonly rangeOverflow: boolean;
    readonly rangeUnderflow: boolean;
    readonly stepMismatch: boolean;
    readonly tooLong: boolean;
    readonly tooShort: boolean;
    readonly typeMismatch: boolean;
    readonly valid: boolean;
    readonly valueMissing: boolean;
  }

  // Enhanced DOM manipulation interfaces
  interface Element extends Node, ParentNode, ChildNode {
    readonly attributes: NamedNodeMap;
    readonly classList: DOMTokenList;
    readonly className: string;
    readonly clientHeight: number;
    readonly clientLeft: number;
    readonly clientTop: number;
    readonly clientWidth: number;
    id: string;
    innerHTML: string;
    readonly localName: string;
    readonly namespaceURI: string | null;
    onfullscreenchange: ((this: Element, ev: Event) => any) | null;
    onfullscreenerror: ((this: Element, ev: Event) => any) | null;
    outerHTML: string;
    readonly ownerDocument: Document;
    readonly part: DOMTokenList;
    readonly prefix: string | null;
    readonly scrollHeight: number;
    scrollLeft: number;
    scrollTop: number;
    readonly scrollWidth: number;
    readonly shadowRoot: ShadowRoot | null;
    slot: string;
    readonly tagName: string;
    attachShadow(init: ShadowRootInit): ShadowRoot;
    closest<K extends keyof HTMLElementTagNameMap>(selector: K): HTMLElementTagNameMap[K] | null;
    closest<K extends keyof SVGElementTagNameMap>(selector: K): SVGElementTagNameMap[K] | null;
    closest<E extends Element = Element>(selectors: string): E | null;
    getAttribute(qualifiedName: string): string | null;
    getAttributeNS(namespace: string | null, localName: string): string | null;
    getAttributeNames(): string[];
    getAttributeNode(qualifiedName: string): Attr | null;
    getAttributeNodeNS(namespace: string | null, localName: string): Attr | null;
    getBoundingClientRect(): DOMRect;
    getClientRects(): DOMRectList;
    getElementsByClassName(classNames: string): HTMLCollectionOf<Element>;
    getElementsByTagName<K extends keyof HTMLElementTagNameMap>(qualifiedName: K): HTMLCollectionOf<HTMLElementTagNameMap[K]>;
    getElementsByTagName<K extends keyof SVGElementTagNameMap>(qualifiedName: K): HTMLCollectionOf<SVGElementTagNameMap[K]>;
    getElementsByTagName(qualifiedName: string): HTMLCollectionOf<Element>;
    getElementsByTagNameNS(namespace: string | null, localName: string): HTMLCollectionOf<Element>;
    hasAttribute(qualifiedName: string): boolean;
    hasAttributeNS(namespace: string | null, localName: string): boolean;
    hasAttributes(): boolean;
    hasPointerCapture(pointerId: number): boolean;
    insertAdjacentElement(where: InsertPosition, element: Element): Element | null;
    insertAdjacentHTML(position: InsertPosition, text: string): void;
    insertAdjacentText(where: InsertPosition, data: string): void;
    matches(selectors: string): boolean;
    querySelector<K extends keyof HTMLElementTagNameMap>(selectors: K): HTMLElementTagNameMap[K] | null;
    querySelector<K extends keyof SVGElementTagNameMap>(selectors: K): SVGElementTagNameMap[K] | null;
    querySelector<E extends Element = Element>(selectors: string): E | null;
    querySelectorAll<K extends keyof HTMLElementTagNameMap>(selectors: K): NodeListOf<HTMLElementTagNameMap[K]>;
    querySelectorAll<K extends keyof SVGElementTagNameMap>(selectors: K): NodeListOf<SVGElementTagNameMap[K]>;
    querySelectorAll<E extends Element = Element>(selectors: string): NodeListOf<E>;
    releasePointerCapture(pointerId: number): void;
    removeAttribute(qualifiedName: string): void;
    removeAttributeNS(namespace: string | null, localName: string): void;
    removeAttributeNode(attr: Attr): Attr;
    requestFullscreen(options?: FullscreenOptions): Promise<void>;
    requestPointerLock(): void;
    scroll(options?: ScrollToOptions): void;
    scroll(x: number, y: number): void;
    scrollBy(options?: ScrollToOptions): void;
    scrollBy(x: number, y: number): void;
    scrollIntoView(arg?: boolean | ScrollIntoViewOptions): void;
    scrollTo(options?: ScrollToOptions): void;
    scrollTo(x: number, y: number): void;
    setAttribute(qualifiedName: string, value: string): void;
    setAttributeNS(namespace: string | null, qualifiedName: string, value: string): void;
    setAttributeNode(attr: Attr): Attr | null;
    setAttributeNodeNS(attr: Attr): Attr | null;
    setPointerCapture(pointerId: number): void;
    toggleAttribute(qualifiedName: string, force?: boolean): boolean;
    webkitMatchesSelector(selectors: string): boolean;
  }

  interface DOMTokenList {
    readonly length: number;
    value: string;
    toString(): string;
    add(...tokens: string[]): void;
    contains(token: string): boolean;
    item(index: number): string | null;
    remove(...tokens: string[]): void;
    replace(oldToken: string, newToken: string): boolean;
    supports(token: string): boolean;
    toggle(token: string, force?: boolean): boolean;
    forEach(callbackfn: (value: string, key: number, parent: DOMTokenList) => void, thisArg?: unknown): void;
    [index: number]: string;
  }

  interface NamedNodeMap {
    readonly length: number;
    getNamedItem(qualifiedName: string): Attr | null;
    getNamedItemNS(namespace: string | null, localName: string): Attr | null;
    item(index: number): Attr | null;
    removeNamedItem(qualifiedName: string): Attr;
    removeNamedItemNS(namespace: string | null, localName: string): Attr;
    setNamedItem(attr: Attr): Attr | null;
    setNamedItemNS(attr: Attr): Attr | null;
    [index: number]: Attr;
  }

  interface Attr extends Node {
    readonly localName: string;
    readonly name: string;
    readonly namespaceURI: string | null;
    readonly ownerDocument: Document;
    readonly ownerElement: Element | null;
    readonly prefix: string | null;
    readonly specified: boolean;
    value: string;
  }

  // Document interface for comprehensive DOM manipulation
  interface Document extends Node, DocumentOrShadowRoot, FontFaceSource, GlobalEventHandlers, NonElementParentNode, ParentNode, XPathEvaluatorBase {
    readonly URL: string;
    alinkColor: string;
    readonly all: HTMLAllCollection;
    readonly anchors: HTMLCollectionOf<HTMLAnchorElement>;
    readonly applets: HTMLCollectionOf<HTMLAppletElement>;
    bgColor: string;
    readonly body: HTMLElement;
    readonly characterSet: string;
    readonly charset: string;
    readonly compatMode: string;
    readonly contentType: string;
    cookie: string;
    readonly currentScript: HTMLOrSVGScriptElement | null;
    readonly defaultView: (WindowProxy & typeof globalThis) | null;
    designMode: string;
    dir: string;
    readonly doctype: DocumentType | null;
    readonly documentElement: HTMLElement;
    readonly documentURI: string;
    domain: string;
    readonly embeds: HTMLCollectionOf<HTMLEmbedElement>;
    fgColor: string;
    readonly forms: HTMLCollectionOf<HTMLFormElement>;
    readonly fullscreenEnabled: boolean;
    readonly head: HTMLHeadElement;
    readonly hidden: boolean;
    readonly images: HTMLCollectionOf<HTMLImageElement>;
    readonly implementation: DOMImplementation;
    readonly inputEncoding: string;
    readonly lastModified: string;
    linkColor: string;
    readonly links: HTMLCollectionOf<HTMLAnchorElement | HTMLAreaElement>;
    readonly location: Location;
    onfullscreenchange: ((this: Document, ev: Event) => any) | null;
    onfullscreenerror: ((this: Document, ev: Event) => any) | null;
    onpointerlockchange: ((this: Document, ev: Event) => any) | null;
    onpointerlockerror: ((this: Document, ev: Event) => any) | null;
    onreadystatechange: ((this: Document, ev: Event) => any) | null;
    onvisibilitychange: ((this: Document, ev: Event) => any) | null;
    readonly ownerDocument: null;
    readonly pictureInPictureEnabled: boolean;
    readonly plugins: HTMLCollectionOf<HTMLEmbedElement>;
    readonly readyState: DocumentReadyState;
    readonly referrer: string;
    readonly scripts: HTMLCollectionOf<HTMLScriptElement>;
    readonly scrollingElement: Element | null;
    readonly timeline: DocumentTimeline;
    title: string;
    readonly visibilityState: VisibilityState;
    vlinkColor: string;
    adoptNode<T extends Node>(node: T): T;
    captureEvents(): void;
    caretPositionFromPoint(x: number, y: number): CaretPosition | null;
    caretRangeFromPoint(x: number, y: number): Range;
    clear(): void;
    close(): void;
    createAttribute(localName: string): Attr;
    createAttributeNS(namespace: string | null, qualifiedName: string): Attr;
    createCDATASection(data: string): CDATASection;
    createComment(data: string): Comment;
    createDocumentFragment(): DocumentFragment;
    createElement<K extends keyof HTMLElementTagNameMap>(tagName: K, options?: ElementCreationOptions): HTMLElementTagNameMap[K];
    createElement(tagName: string, options?: ElementCreationOptions): HTMLElement;
    createElementNS(namespaceURI: 'http://www.w3.org/1999/xhtml', qualifiedName: string): HTMLElement;
    createElementNS<K extends keyof SVGElementTagNameMap>(namespaceURI: 'http://www.w3.org/2000/svg', qualifiedName: K): SVGElementTagNameMap[K];
    createElementNS(namespaceURI: 'http://www.w3.org/2000/svg', qualifiedName: string): SVGElement;
    createElementNS(namespaceURI: string | null, qualifiedName: string): Element;
    createEvent(eventInterface: 'AnimationEvent'): AnimationEvent;
    createEvent(eventInterface: 'AudioProcessingEvent'): AudioProcessingEvent;
    createEvent(eventInterface: 'BeforeUnloadEvent'): BeforeUnloadEvent;
    createEvent(eventInterface: 'ClipboardEvent'): ClipboardEvent;
    createEvent(eventInterface: 'CloseEvent'): CloseEvent;
    createEvent(eventInterface: 'CompositionEvent'): CompositionEvent;
    createEvent(eventInterface: 'CustomEvent'): CustomEvent;
    createEvent(eventInterface: 'DeviceMotionEvent'): DeviceMotionEvent;
    createEvent(eventInterface: 'DeviceOrientationEvent'): DeviceOrientationEvent;
    createEvent(eventInterface: 'DragEvent'): DragEvent;
    createEvent(eventInterface: 'ErrorEvent'): ErrorEvent;
    createEvent(eventInterface: 'Event'): Event;
    createEvent(eventInterface: 'Events'): Event;
    createEvent(eventInterface: 'FocusEvent'): FocusEvent;
    createEvent(eventInterface: 'FocusNavigationEvent'): FocusNavigationEvent;
    createEvent(eventInterface: 'GamepadEvent'): GamepadEvent;
    createEvent(eventInterface: 'HashChangeEvent'): HashChangeEvent;
    createEvent(eventInterface: 'IDBVersionChangeEvent'): IDBVersionChangeEvent;
    createEvent(eventInterface: 'InputEvent'): InputEvent;
    createEvent(eventInterface: 'KeyboardEvent'): KeyboardEvent;
    createEvent(eventInterface: 'ListeningStateChangedEvent'): ListeningStateChangedEvent;
    createEvent(eventInterface: 'MediaEncryptedEvent'): MediaEncryptedEvent;
    createEvent(eventInterface: 'MediaKeyMessageEvent'): MediaKeyMessageEvent;
    createEvent(eventInterface: 'MediaQueryListEvent'): MediaQueryListEvent;
    createEvent(eventInterface: 'MediaStreamTrackEvent'): MediaStreamTrackEvent;
    createEvent(eventInterface: 'MessageEvent'): MessageEvent;
    createEvent(eventInterface: 'MouseEvent'): MouseEvent;
    createEvent(eventInterface: 'MouseEvents'): MouseEvent;
    createEvent(eventInterface: 'MutationEvent'): MutationEvent;
    createEvent(eventInterface: 'MutationEvents'): MutationEvent;
    createEvent(eventInterface: 'OfflineAudioCompletionEvent'): OfflineAudioCompletionEvent;
    createEvent(eventInterface: 'PageTransitionEvent'): PageTransitionEvent;
    createEvent(eventInterface: 'PaymentMethodChangeEvent'): PaymentMethodChangeEvent;
    createEvent(eventInterface: 'PaymentRequestUpdateEvent'): PaymentRequestUpdateEvent;
    createEvent(eventInterface: 'PointerEvent'): PointerEvent;
    createEvent(eventInterface: 'PopStateEvent'): PopStateEvent;
    createEvent(eventInterface: 'ProgressEvent'): ProgressEvent;
    createEvent(eventInterface: 'PromiseRejectionEvent'): PromiseRejectionEvent;
    createEvent(eventInterface: 'RTCDataChannelEvent'): RTCDataChannelEvent;
    createEvent(eventInterface: 'RTCDTMFToneChangeEvent'): RTCDTMFToneChangeEvent;
    createEvent(eventInterface: 'RTCPeerConnectionIceEvent'): RTCPeerConnectionIceEvent;
    createEvent(eventInterface: 'RTCTrackEvent'): RTCTrackEvent;
    createEvent(eventInterface: 'SecurityPolicyViolationEvent'): SecurityPolicyViolationEvent;
    createEvent(eventInterface: 'SpeechSynthesisErrorEvent'): SpeechSynthesisErrorEvent;
    createEvent(eventInterface: 'SpeechSynthesisEvent'): SpeechSynthesisEvent;
    createEvent(eventInterface: 'StorageEvent'): StorageEvent;
    createEvent(eventInterface: 'SubmitEvent'): SubmitEvent;
    createEvent(eventInterface: 'TouchEvent'): TouchEvent;
    createEvent(eventInterface: 'TrackEvent'): TrackEvent;
    createEvent(eventInterface: 'TransitionEvent'): TransitionEvent;
    createEvent(eventInterface: 'UIEvent'): UIEvent;
    createEvent(eventInterface: 'UIEvents'): UIEvent;
    createEvent(eventInterface: 'WebKitAnimationEvent'): WebKitAnimationEvent;
    createEvent(eventInterface: 'WebKitTransitionEvent'): WebKitTransitionEvent;
    createEvent(eventInterface: 'WheelEvent'): WheelEvent;
    createEvent(eventInterface: string): Event;
    createNodeIterator(root: Node, whatToShow?: number, filter?: NodeFilter | null): NodeIterator;
    createProcessingInstruction(target: string, data: string): ProcessingInstruction;
    createRange(): Range;
    createTextNode(data: string): Text;
    createTreeWalker(root: Node, whatToShow?: number, filter?: NodeFilter | null): TreeWalker;
    execCommand(commandId: string, showUI?: boolean, value?: string): boolean;
    exitFullscreen(): Promise<void>;
    exitPictureInPicture(): Promise<void>;
    exitPointerLock(): void;
    getAnimations(): Animation[];
    getElementById(elementId: string): HTMLElement | null;
    getElementsByClassName(classNames: string): HTMLCollectionOf<Element>;
    getElementsByName(elementName: string): NodeListOf<HTMLElement>;
    getElementsByTagName<K extends keyof HTMLElementTagNameMap>(qualifiedName: K): HTMLCollectionOf<HTMLElementTagNameMap[K]>;
    getElementsByTagName<K extends keyof SVGElementTagNameMap>(qualifiedName: K): HTMLCollectionOf<SVGElementTagNameMap[K]>;
    getElementsByTagName(qualifiedName: string): HTMLCollectionOf<Element>;
    getElementsByTagNameNS(namespace: string | null, localName: string): HTMLCollectionOf<Element>;
    getSelection(): Selection | null;
    hasFocus(): boolean;
    hasStorageAccess(): Promise<boolean>;
    importNode<T extends Node>(node: T, deep?: boolean): T;
    open(url?: string, name?: string, features?: string): Document;
    queryCommandEnabled(commandId: string): boolean;
    queryCommandIndeterm(commandId: string): boolean;
    queryCommandState(commandId: string): boolean;
    queryCommandSupported(commandId: string): boolean;
    queryCommandValue(commandId: string): string;
    releaseEvents(): void;
    requestStorageAccess(): Promise<void>;
    write(...text: string[]): void;
    writeln(...text: string[]): void;
  }

  type VisibilityState = 'hidden' | 'visible';
  type DocumentReadyState = 'complete' | 'interactive' | 'loading';

  // Comprehensive typing for all major browser APIs used in mental health applications
}

export {};