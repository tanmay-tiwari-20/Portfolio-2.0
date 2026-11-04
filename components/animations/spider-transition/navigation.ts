export interface NavigationAttributes {
  download?: boolean;
  target?: string;
}

export interface NavigationClick {
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  defaultPrevented: boolean;
}

/** Hash changes retain the current page and belong to native anchor navigation. */
export function routeKey(href: string): string {
  const url = new URL(href, "https://portfolio.invalid");
  return `${url.pathname}${url.search}`;
}

/** Return only ordinary, same-origin page navigations that we may intercept. */
export function getNavigationTarget(
  href: string,
  currentHref: string,
  attributes: NavigationAttributes,
  event: NavigationClick,
): URL | null {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    attributes.download ||
    (attributes.target && attributes.target.toLowerCase() !== "_self")
  ) {
    return null;
  }

  try {
    const current = new URL(currentHref);
    const destination = new URL(href, current);
    if (
      !["http:", "https:"].includes(destination.protocol) ||
      destination.origin !== current.origin ||
      destination.pathname === "/api" ||
      destination.pathname.startsWith("/api/") ||
      routeKey(destination.href) === routeKey(current.href)
    ) {
      return null;
    }
    return destination;
  } catch {
    // An invalid URL must keep normal browser handling, never break the click.
    return null;
  }
}
