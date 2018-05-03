export const DEBUG = true; // Are we debugging?
const GLOBAL_BASE = "";
export const API_BASE = GLOBAL_BASE + "/api"; // Base for API
export const STATIC_BASE = GLOBAL_BASE + "/static"; // Base for static assets
export const READER_BASE = GLOBAL_BASE + "/r"; // Base URL on domain for the reader
export function seriesLink(slug) {
    return READER_BASE + "/series/" + slug + "/";
}
export const READER_VERSION = "0.0.1"; // Don't change unless you modify the code
export const PLACEHOLDER = "/static/img/placeholder.svg"; // Placeholder for images that haven't loaded
export const CREDITS = 2; // Position of credits page. 0 = none
export const COMMENTS = true; // Whether or not to enable end-of-chapter discussion
export const USECDN = false; // Use CDNs for images