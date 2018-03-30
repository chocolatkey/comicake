requirejs([
        "vendor/turbolinks",
        "vendor/stimulus.umd",
        'mdc'
], function(turbolinks, Stimulus, material) {
    material.onLoadMDC();
    /* Take care of Google Analytics page views with turbolinks */
    document.addEventListener('turbolinks:load', function(event) {
        material.onLoadMDC();
        if (typeof ga === 'function') { // GA exists
            ga('set', 'location', event.data.url);
            ga('send', 'pageview');
        }
    });

    const application = Stimulus.Application.start();
    const nav = require(['./nav'], function(nav){
        //console.dir(nav);
        application.register("search", nav.Search);
        application.register("clickable", nav.Clickable);
    });
});