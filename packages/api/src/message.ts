/**
 * An **untranslated** message: an i18n key plus its parameters.
 *
 * The data layer (zod schemas, error mappers) runs at module scope, loaded once
 * at import — it does not and cannot know any request's locale. So it returns a
 * key, and components translate it at render time with `useMessage()` from
 * `@noalhub/i18n` (`docs/i18n.md` §7.3).
 *
 * A bare string is still valid wherever a `Message` is accepted: that is a
 * sentence written by the **backend**, with no matching key, shown verbatim.
 */
export type Message = { key: string; values?: Record<string, string | number> };

export function isMessage(value: unknown): value is Message {
  return typeof value === "object" && value !== null && "key" in value;
}

/**
 * An `Error` carrying an untranslated `Message`.
 *
 * A separate class is needed because `Error.message` is a `string`: stuffing a
 * key in there leaves the catch site unable to tell "a key to translate" from
 * "a sentence the backend sent". Here `message` keeps the key for logs and
 * stack traces, while `text` is what actually gets translated.
 */
export class MessageError extends Error {
  readonly text: Message;

  constructor(text: Message) {
    super(text.key);
    this.name = "MessageError";
    this.text = text;
  }
}

/** Extract the displayable part of an arbitrary error. */
export function messageOf(error: unknown): Message | string {
  if (error instanceof MessageError) return error.text;
  if (error instanceof Error) return error.message;
  return { key: "common.errors.unknown" };
}
