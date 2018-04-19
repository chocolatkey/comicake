/* global require ga */
/**
 * Main application entry point
 */
//import Turbolinks from "turbolinks";
import { READER_VERSION } from "./constants";
import { Application } from "stimulus";
import { definitionsFromContext } from "stimulus/webpack-helpers";
import { onLoadMDC } from "./mdc";

const application = Application.start();
const context = require.context("./controllers", true, /\.js$/);
application.load(definitionsFromContext(context));
onLoadMDC();

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