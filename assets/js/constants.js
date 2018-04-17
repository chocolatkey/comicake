define({
    API_BASE: "/api",
    STATIC_BASE: "/static",
    READER_BASE: "/r",
    seriesLink: function(slug) {
        return "/r/series/" + slug + "/";
    },
    READER_VERSION: "0.0.1",
    PLACEHOLDER: "/static/img/placeholder.svg",
    CREDITS: true,
    COMMENTS: true,
    useCDN: false,
    DEBUG: true
});