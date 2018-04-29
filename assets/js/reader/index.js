/*!
 *                                                                                                                                (℠)
 *  # BiB/i
 *
 *  - "EPUB Reader on Your Web Site."
 *  - Copyright (c) Satoru MATSUSHIMA - http://bibi.epub.link or https://github.com/satorumurmur/bibi
 *  - Licensed under the MIT license. - http://www.opensource.org/licenses/mit-license.php
 *  - Heavily modified by chocolatkey
 *
 *  ## Components:
 *  1. Native Promise Only ... Copyright (c) Kyle Simpson - https://github.com/getify/native-promise-only (Licensed under the MIT license.)
 *  2. easing.js ... Copyright (c) Dan Rogers - https://github.com/danro/easing-js (Licensed under the MIT license.)
 *  3. sML ... Copyright (c) Satoru MATSUSHIMA - https://github.com/satorumurmur/sML (Licensed under the MIT license.)
 *  4. BiB/i (heart)
 *
 */

/**
 * "@bower_components/easing" : "danro/easing-js#*",
   "@bower_components/sML" : "satorumurmur/sML#0.999.47"
 */
import "core-js/fn/array/find";
import "core-js/fn/array/from";
import "core-js/fn/array/for-each";
import "core-js/fn/map";
import "core-js/fn/object/assign";
import "core-js/fn/promise";
import "core-js/fn/set";
import "element-closest";
import "mutation-observer-inner-html-shim";

import { DEBUG } from "../constants";
import { onLoadMDC } from "../mdc";
import Bibi from "./Bibi";

document.addEventListener("DOMContentLoaded",function(){
    onLoadMDC();
    Bibi.welcome();    
});

// Check that service workers are registered
if ("serviceWorker" in navigator &&  !DEBUG) {
    // Use the window load event to keep the page load performant
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").then(reg => {
            console.log("SW registered: ", reg);
        }).catch(registrationError => {
            console.error("SW registration failed: ", registrationError);
        });
    });
}