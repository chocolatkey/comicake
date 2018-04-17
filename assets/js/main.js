/* global ga */
require.config({
    //baseUrl: "/static/js",
    paths: {
        Bibi: ["/static/bib/i/res/scripts/bibi"]
    },
    shim: {
        "Bibi": {
            //deps: ["Bibi"],
            /*exports: "Bibi",
            init: function(Bibi) {
                console.dir(Bibi);
            }*/
        }
    },
    //waitSeconds: 15
});

require([
    "vendor/turbolinks",
    "vendor/stimulus.umd",
    "mdc",
    "nav",
    "reader"
], function(turbolinks, Stimulus, material, nav, reader) {
    material.onLoadMDC();
    /* Take care of Google Analytics page views with turbolinks */
    document.addEventListener("turbolinks:load", function(event) {
        material.onLoadMDC();
        if (typeof ga === "function") { // GA exists
            ga("set", "location", event.data.url);
            ga("send", "pageview");
        }
    });

    const application = Stimulus.Application.start();
    application.register("search", nav.Search);
    application.register("clickable", nav.Clickable);
    //if(typeof lol) {
    application.register("reader", reader.Reader);
    //}
    /*const nav = require(['./nav'], function(nav){
        //console.dir(nav);
        application.register("search", nav.Search);
        application.register("clickable", nav.Clickable);
    });*/
});