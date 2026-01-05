interface Logger {
    info: (obj: object | string) => void;
    warn: (obj: object | string) => void;
    error: (obj: object | string) => void;
}
export declare function processNewReviews(logger: Logger): Promise<void>;
export {};
//# sourceMappingURL=aiProcessor.d.ts.map