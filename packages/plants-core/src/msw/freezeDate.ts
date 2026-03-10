/**
 * Deterministic Date freeze for Chromatic / Storybook snapshots.
 *
 * Replaces `globalThis.Date` with a frozen constructor that returns `fixedNow`
 * when called with no arguments, while still supporting `new Date(value)`.
 *
 * Critical: the frozen constructor shares `OriginalDate.prototype` by identity
 * (not via setPrototypeOf) so that `new Date() instanceof Date` remains true.
 * Without this, Zod's `z.coerce.date()` fails its instanceof check.
 */

const OriginalDate = globalThis.Date;

export function freezeDate(fixedNow: Date) {
    const Frozen = function (this: Date, ...args: unknown[]) {
        if (args.length === 0) {
            return new OriginalDate(fixedNow);
        }
        return new (OriginalDate as unknown as new (...a: unknown[]) => Date)(...args);
    } as unknown as DateConstructor;
    Object.setPrototypeOf(Frozen, OriginalDate);
    // oxlint-disable-next-line @typescript-eslint/no-explicit-any -- Assigning prototype for instanceof compatibility
    (Frozen as any).prototype = OriginalDate.prototype;
    Frozen.now = () => fixedNow.getTime();
    Frozen.parse = OriginalDate.parse.bind(OriginalDate);
    Frozen.UTC = OriginalDate.UTC.bind(OriginalDate);
    globalThis.Date = Frozen;
}

export function restoreDate() {
    globalThis.Date = OriginalDate;
}
