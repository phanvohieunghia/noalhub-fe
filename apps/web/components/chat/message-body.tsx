/** Matches simple http/https URLs — enough for chat content, not a markdown parser. */
const URL_SPLIT = /(https?:\/\/[^\s<]+)/g;

/**
 * A version WITHOUT the `g` flag, for testing individual fragments. Reusing the
 * `g` regex for `.test()` is a latent bug: `lastIndex` persists between calls,
 * so the result alternates true/false.
 */
const IS_URL = /^https?:\/\//;

/**
 * A message's content.
 *
 * It NEVER renders raw HTML (`dangerouslySetInnerHTML`) — `body` is user data.
 * Linkifying works by splitting the string and rendering `<a>` as a React
 * element, so there is no path for injecting a tag.
 */
export function MessageBody({ body }: { body: string }) {
  const parts = body.split(URL_SPLIT);

  return (
    <span className="break-words whitespace-pre-wrap">
      {parts.map((part, index) =>
        IS_URL.test(part) ? (
          <a
            key={index}
            href={part}
            target="_blank"
            // `noreferrer` alongside `noopener`: the link was sent by someone
            // else, so the destination learns neither the referrer nor gets to
            // touch `window.opener`.
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            {part}
          </a>
        ) : (
          part
        ),
      )}
    </span>
  );
}
