export default {
    "preset-name"                : "コミックのビビ", // Name of this preset. As you like.
    "preset-description"         : "BiBi Comics Preset.", // Description for this preset. As you like.
    "preset-author"              : "chocolatkey", // Name of the author of this preset. As you like.
    "preset-author-href"         : "https://chocolatkey.com", // URI of a website, etc. of the author of this preset. As you like.

    "website-name-in-title"      : "/", // "" or name of your website replaces string "BiB/i" in <title>.

    "remove-bibi-website-link"   : true, // true or false (if true, the link to BiB/i Website is not to be added in setting-menu)

    "bookshelf"                  : "../bookshelf/", // relative path from bib/i/index.html (if the origin is included in "trustworthy-origins", URI begins with "http://" or "https://" for COR-allowed server is OK).

    "reader-view-mode"           : "paged", // "paged" or "vertical" or "horizontal" ("paged" is for flipping, "vertical" and "horizontal" are for scrolling)
    "reader-view-mode-mobile"    : "vertical",
    "fix-reader-view-mode"       : "no", // "yes" or "no" or "desktop" or "mobile"
    "single-page-always"         : "mobile", // "yes" or "no" or "desktop" or "mobile"

    "autostart"                  : "desktop", // "yes" or "no" or "desktop" or "mobile"
    "start-in-new-window"        : "mobile", // "yes" or "no" or "desktop" or "mobile"

    "use-full-height"            : "yes", // "yes" or "no" or "desktop" or "mobile"
    "use-menubar"                : "yes", // "yes" or "no" or "desktop" or "mobile"
    "use-nombre"                 : "yes", // "yes" or "no" or "desktop" or "mobile"
    "use-slider"                 : "yes", // "yes" or "no" or "desktop" or "mobile"
    "use-arrows"                 : "yes", // "yes" or "no" or "desktop" or "mobile"
    "use-keys"                   : "yes", // "yes" or "no" or "desktop" or "mobile"
    "use-swipe"                  : "yes", // "yes" or "no" or "desktop" or "mobile"
    "use-cookie"                 : "yes", // "yes" or "no" or "desktop" or "mobile"

    "cookie-expires"             : 1000 * 60 * 60 * 24 * 3, // milli-seconds (ex. 1000ms * 60s * 60m * 24h * 3d = 3days)

    "ui-font-family"             : "", // CSS font-family value as "'Helvetica', sans-serif" or ""

    "book-background"            : "black", // CSS background value or ""

    "spread-gap"                 : 0, // px
    "spread-margin"              : 0, // px

    "spread-border-radius"       : "", // CSS border-radius value or ""
    "spread-box-shadow"          : "", // CSS box-shadow value or ""

    "item-padding-left"          : 0, // px
    "item-padding-right"         : 0, // px
    "item-padding-top"           : 0, // px
    "item-padding-bottom"        : 0, // px

    "flipper-width"              : 0.3, // ratio (lower than 1) or px (1 or higher)

    "preprocess-html-always"     : "no", // "yes" or "no" or "desktop" or "mobile"

    "page-breaking"              : false, // true or false (if true, CSS "page-break-before/after: always;" will work, partially)

    "epub-additional-stylesheet" : "", // path from spine-item or http:// URI or ""
    "epub-additional-script"     : "", // path from spine-item or http:// URI or ""

    // =================================================================================================

    "extensions": [
        // TODOOOO
        //{ "name": "Analytics", "src" : "extensions/analytics/analytics.js", "tracking-id": "" }, // "tracking-id": Your own Google Analytics tracking id, as "UA-********-*"
        /////{ "name": "Loupe", "src": "/static/bib/i/extensions/loupe/loupe.js", "mode": "", "max-scale": 4 },
        //{ "name": "Share", "src" : "extensions/share/share.js" },
        /////{ "name": "Unaccessibilizer", "src": "/static/bib/i/extensions/unaccessibilizer/unaccessibilizer.js", "select-elements": "prevent", "save-images": "prevent", "use-contextmenu": "prevent" },
        // ------------------------------------------------------------------------------------------
        { "name": "Bibi", "4U" : "w/0" } // (*'-'*)
    ],

    "trustworthy-origins": []

};