export const API_HEADERS = {
    "Accept": "application/json, text/plain, */*"
    //Cache-Control: max-age=3600
};
export function seriesLink(slug) {
    return window.comicake.PATHS.reader + "series/" + slug + "/";
}
export function readerLink(uuid) {
    return window.comicake.PATHS.reader + "read/" + uuid + "/";
}
export const COMMENTS = window.comicake.SOCIAL.disqus; // Either disqus code or false/null
export const DISCORD = window.comicake.SOCIAL.discord; // Discord group ID, optional
export const DEBUG = window.comicake.DEBUG;
export const USECDN = true;