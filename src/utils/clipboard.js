/**
 * Copies text to the clipboard using the standard async Clipboard API.
 * Returns a boolean indicating success rather than throwing, since the
 * call site (a click handler) wants to show feedback either way without
 * needing a try/catch of its own. The Clipboard API requires a secure
 * context (HTTPS, or localhost during development) and can reject for
 * permission reasons in some browsers/embedded contexts -- both are
 * handled here as a clean false return rather than an unhandled
 * rejection.
 */
export async function copyToClipboard(text) {
  if (!navigator.clipboard || !navigator.clipboard.writeText) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
