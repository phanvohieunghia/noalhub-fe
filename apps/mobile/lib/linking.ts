import * as Linking from "expo-linking";
import { useEffect } from "react";
import { useRouter } from "expo-router";

/**
 * Deep linking prefixes supported by the application.
 */
export const LINKING_PREFIXES = [
  "noalhub://",
  "https://noalhub.com",
  "http://localhost:3000",
];

/**
 * Allowed path patterns to prevent open redirects or unsafe route traversal.
 * Complies with docs/mobile.md §5.8.
 */
const ALLOWED_PATH_PATTERNS = [
  /^\/$/,
  /^\/chat$/,
  /^\/chat\/[a-zA-Z0-9_-]+$/,
  /^\/friends(?:\?(?:tab=(?:friends|requests|search))?)?$/,
  /^\/profile$/,
  /^\/profile\/[a-zA-Z0-9_.-]+$/,
  /^\/blog$/,
  /^\/blog\/[a-zA-Z0-9_-]+$/,
  /^\/\(auth\)\/login$/,
  /^\/\(auth\)\/register$/,
];

/**
 * Validates whether a relative path or incoming deep link path is safe to navigate to.
 */
export function isSafeDeepLinkPath(path: string): boolean {
  if (!path || typeof path !== "string") return false;

  // Prevent directory traversal or protocol injections
  if (path.includes("..") || path.includes("//") || path.includes("\\")) {
    return false;
  }

  // Ensure path starts with a leading slash
  const normalized = path.startsWith("/") ? path : `/${path}`;

  return ALLOWED_PATH_PATTERNS.some((pattern) => pattern.test(normalized));
}

/**
 * Parses an incoming URL (from scheme or universal link) into a validated Expo Router path.
 * Returns null if the URL is invalid, untrusted, or unsafe.
 */
export function parseSafeDeepLink(rawUrl: string): string | null {
  try {
    const parsed = Linking.parse(rawUrl);
    if (!parsed.path) {
      return null;
    }

    let targetPath = parsed.path.startsWith("/") ? parsed.path : `/${parsed.path}`;

    // Append query params if any
    if (parsed.queryParams && Object.keys(parsed.queryParams).length > 0) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(parsed.queryParams)) {
        if (typeof value === "string") {
          searchParams.set(key, value);
        }
      }
      const qs = searchParams.toString();
      if (qs) {
        targetPath = `${targetPath}?${qs}`;
      }
    }

    if (isSafeDeepLinkPath(targetPath)) {
      return targetPath;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Generates an absolute deep link URL using the configured scheme.
 */
export function buildDeepLink(path: string): string {
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return Linking.createURL(cleanPath);
}

/**
 * Hook to listen for inbound deep links and safely navigate.
 */
export function useDeepLinkHandler() {
  const router = useRouter();

  useEffect(() => {
    // Handle initial link if app was launched via deep link
    void Linking.getInitialURL().then((url) => {
      if (url) {
        const safePath = parseSafeDeepLink(url);
        if (safePath) {
          router.push(safePath as any);
        }
      }
    });

    // Handle deep links while app is running
    const subscription = Linking.addEventListener("url", (event) => {
      const safePath = parseSafeDeepLink(event.url);
      if (safePath) {
        router.push(safePath as any);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [router]);
}
