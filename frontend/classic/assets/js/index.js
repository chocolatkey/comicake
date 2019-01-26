/* global require ga */
/**
 * Main application entry point
 */
import Turbolinks from "turbolinks";
import "@stimulus/polyfills";

import { DEBUG } from "./constants";
import { Application } from "stimulus";
import { definitionsFromContext } from "stimulus/webpack-helpers";

const application = Application.start();
const context = require.context("./controllers", true, /\.js$/);
application.load(definitionsFromContext(context));

Turbolinks.start();

/* Take care of Google Analytics page views with turbolinks */
document.addEventListener("turbolinks:load", function(event) {
    if (typeof ga === "function") { // GA exists
        ga("set", "location", event.data.url);
        ga("send", "pageview");
    }
});