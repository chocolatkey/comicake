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
import "whatwg-fetch";

import { DEBUG, API_BASE, API_HEADERS, COMMENTS, readerLink } from "../constants";
import { onLoadMDC } from "../mdc";
import Bibi from "./Bibi";
import B from "./B";
import E from "./E";
import I from "./I";
import sML from "../vendor/sML";

import Mustache from "mustache";
import { MDCIconToggle } from "@material/icon-toggle";
import chapterSelectTemplate from "../mst/chapterSelect.html";
import chapterListTemplate from "../mst/chapterList.html";
let dthread = null;
import qs from "qs";

let chaptersLoaded = false;
let commentsLoaded = false;
var selector = document.getElementById("cakeSelectChapters"); // Desktop
var lister = document.getElementById("cakeListChapters"); // Mobile
let commentsToggle;

let getChapters = () => {
    if(chaptersLoaded)
        return;
    chaptersLoaded = true;
    const params = {
        comic: B.OID,
        language: B.Language,
        ordering: "volume,chapter,subchapter",
        n: 1000
    };
    fetch(API_BASE + "/chapters.json?" + qs.stringify(params), {
        headers: API_HEADERS,
        credentials: DEBUG ? "include" : "omit"
        //headers: { "Cache-Control": "max-age=300" }
    }).then(response => {
        if (!response.ok) {
            var error = new Error(response.statusText);
            error.message = response;
            throw error;
        }
        return response.json();
    }).then(data => {
        if(data.count > 1000)
            console.error("Too many chapters to fetch!"); // TODO: Raven report

        const chapters = data.results;
        let finalized = {
            "volumes": []
        };
        let nVolume = 0;
        let currentVolume = {
            "no": false,
            "chapters": []
        };
        chapters.forEach(chapter => {
            if(chapter.volume != nVolume) {
                currentVolume["no"] = nVolume == 0 ? false : nVolume;
                finalized.volumes.push(currentVolume);
                nVolume = chapter.volume;
                currentVolume = {
                    "chapters": []
                };
            }
            currentVolume["chapters"].push({
                "selected": chapter.id == B.CID ? true : false,
                "name": chapter.title,
                "uuid": chapter.uniqid,
                "url": readerLink(chapter.uniqid)
            });
        });
        currentVolume["no"] = nVolume == 0 ? false : nVolume;
        finalized.volumes.push(currentVolume);

        // Desktop
        if(data.count <= 1) { // This is the only chapter?
            selector.outerHTML = data.results[0].title;
            document.getElementById("cakeChapters").style = "background: none;";

        } else {
            const selectorDom = Mustache.render(chapterSelectTemplate, finalized);
            selector.innerHTML = selectorDom;
            selector.addEventListener("change", () => {
                window.location.href = readerLink(selector[selector.selectedIndex].value);
            });
        }

        // Mobile
        const listDom = Mustache.render(chapterListTemplate, finalized);
        lister.innerHTML = listDom;
    }).catch(error => {
        console.error(error);
        lister.innerHTML = `<div class="mdc-drawer__toolbar-spacer">Error: ${error.message}</div>`;
        selector.outerHTML = selector[0].innerHTML;
    });
};

document.addEventListener("DOMContentLoaded", () => {
    Bibi.welcome();
    onLoadMDC();
    Mustache.parse(chapterSelectTemplate);
    Mustache.parse(chapterListTemplate);
    selector = document.getElementById("cakeSelectChapters"); // Desktop
    lister = document.getElementById("cakeListChapters"); // Mobile]
    selector.addEventListener("focus", event => getChapters(event));
    selector.addEventListener("mouseover", event => getChapters(event));
    document.querySelector(".menu-toggle").addEventListener("click", event => getChapters(event));
});

E.add("bibi:closed-panel", () => {
    I.FAB.Targeted = false;
    setTimeout(() => commentsToggle.on = false, 123);
    
});

E.add("bibi:opened-panel", () => {
    I.FAB.Targeted = true;
    setTimeout(() => commentsToggle.on = true, 123);
});

E.add("bibi:opened-menu", () => getChapters());

// Comments
E.add("bibi:opened", () => {
    if(!COMMENTS)
        return;
    commentsToggle = document.getElementById("comments-fab-icon");
    commentsToggle.addEventListener("click", () => {
        console.warn("ToGGLED");
        I.Panel.toggle();
        if(!commentsLoaded) {
            commentsLoaded = true;
            if(typeof COMMENTS != "string") {
                console.error("Comment constant is not a string!");
                return;
            }
            I.Panel.innerHTML += "<div id=\"disqus_thread\"></div>";
            dthread = document.getElementById("disqus_thread");
            window.disqus_config = function () {
                this.page.identifier = B.ID;
                this.page.title = document.title;
            };
            var d = document, s = d.createElement("script");
            s.src = "https://" + COMMENTS + ".disqus.com/embed.js";
            s.setAttribute("data-timestamp", + new Date());
            (d.head || d.body).appendChild(s);
            sML.addClass(dthread, "shown");
        }
    });
    commentsToggle = new MDCIconToggle(commentsToggle);
});

// Check that service workers are registered
if ("serviceWorker" in navigator && !DEBUG) {
    // Use the window load event to keep the page load performant
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").then(reg => {
            console.log("SW registered: ", reg);
        }).catch(registrationError => {
            console.error("SW registration failed: ", registrationError);
        });
    });
}