/* global require ga */
/**
 * Main application entry point
 */
//import Turbolinks from "turbolinks";

// https://github.com/stimulusjs/stimulus/blob/master/packages/%40stimulus/polyfills/index.js it's gonna be a package soon
import "core-js/fn/array/find";
import "core-js/fn/array/from";
import "core-js/fn/array/for-each";
import "core-js/fn/map";
import "core-js/fn/object/assign";
import "core-js/fn/promise";
import "core-js/fn/set";
import "element-closest";
import "mutation-observer-inner-html-shim";

import { READER_VERSION } from "./constants";
import { Application } from "stimulus";
import { definitionsFromContext } from "stimulus/webpack-helpers";
import { onLoadMDC } from "./mdc";

const application = Application.start();
const context = require.context("./controllers", true, /\.js$/);
application.load(definitionsFromContext(context));

document.addEventListener("DOMContentLoaded",function(){
    onLoadMDC();
});

//Turbolinks.start(); TODO: why not working!!
/* Take care of Google Analytics page views with turbolinks */
document.addEventListener("turbolinks:load", function(event) {
    onLoadMDC();
    if (typeof ga === "function") { // GA exists
        ga("set", "location", event.data.url);
        ga("send", "pageview");
    }
});
console.log("Reader client v" + READER_VERSION);