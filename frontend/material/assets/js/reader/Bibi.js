import sML from "../vendor/sML";
import /** as*/ O from "./O";
import E from "./E";
import R from "./R";
import I from "./I";
import X from "./X";
import P from "./P";
import U from "./U";
import settings from "./S";
import M from "./M";
import L from "./L";
import { READER_VERSION } from "../constants";

/*!
 *                                                                                                                                (℠)
 *  ## BiB/i (heart)
 *  - "Heart of BiB/i"
 *
 */

class Bibi {
    constructor() {
        this.version = READER_VERSION; // TODO FIX
        this.build = 198106091234;
        this.href = "http://bibi.epub.link";
    }

    forEach(e, t) {
        return Array.prototype.forEach.call(e, t);
    }

    //==============================================================================================================================================
    //----------------------------------------------------------------------------------------------------------------------------------------------

    //-- Welcome !

    //----------------------------------------------------------------------------------------------------------------------------------------------
    welcome() {
        O.stamp("Welcome!");
        O.log("Welcome! - ComiCake Reader v" + this.version + " powered by BiB/i b" + this.build, "-0");
        E.dispatch("bibi:says-welcome");

        O.RequestedURL = location.href;
        O.BookURL = O.Origin + location.pathname + location.search;

        O.Language = (() => {
            if(typeof navigator.language != "string") return "en";
            return (navigator.language.split("-")[0] == "ja") ? "ja" : "en";
        })();

        O.contentWindow = window;
        O.contentDocument = document;

        O.HTML  = document.documentElement; O.HTML.className = sML.Environments.join(" ") + " bibi welcome";
        O.Head  = document.head;
        O.Body  = document.body;
        O.Info  = document.getElementById("bibi-info");
        O.Title = document.getElementsByTagName("title")[0];

        // Device & Event
        if(sML.OS.iOS || sML.OS.Android) {
            O.Mobile = true;
            O.HTML.className = O.HTML.className + " Touch";
            /*if(sML.OS.iOS) {
                O.Head.appendChild(sML.create("meta", { name: "apple-mobile-web-app-capable",          content: "yes"   }));
                O.Head.appendChild(sML.create("meta", { name: "apple-mobile-web-app-status-bar-style", content: "white" }));
            }*/
            O["resize"] = "orientationchange";
            O["pointerdown"] = "touchstart";
            O["pointermove"] = "touchmove";
            O["pointerup"]   = "touchend";
        } else {
            O.Mobile = false;
            O["resize"] = "resize";
            if(sML.UA.InternetExplorer || sML.UA.Edge) {
                O["pointerdown"] = "pointerdown";
                O["pointermove"] = "pointermove";
                O["pointerup"]   = "pointerup";
                O["pointerover"] = "pointerover";
                O["pointerout"]  = "pointerout";
            } else {
                O["pointerdown"] = "mousedown";
                O["pointermove"] = "mousemove";
                O["pointerup"]   = "mouseup";
                O["pointerover"] = "mouseover";
                O["pointerout"]  = "mouseout";
            }
        }
        this.initialize();
    }

    getBook() {
        var Book = O.Body.getAttribute("data-bibi-book");
        if(typeof Book != "string") return undefined;
        Book = decodeURIComponent(Book).replace(/\/+$/, "");
        if(/^([\w\d]+:)?\/\//.test(Book)) { // absolute URI
            if(/^\/\//.test(Book)) Book = location.protocol + Book;
        }
        return Book;
    }

    initialize() {

        // Reader
        R.initialize();

        // UI
        I.initialize();

        O.NotCompatible = (sML.UA.InternetExplorer < 11) ? true : false;
        if(O.NotCompatible) {
            // Say Bye-bye
            var Msg = {
                en: "<span>I'm so Sorry....</span> <span>Your Browser Is</span> <span>Not Compatible with BiB/i.</span>",
                ja: "<span>ごめんなさい……</span> <span>お使いのブラウザでは、</span><span>ビビは動きません。</span>"
            };
            I.Veil.ByeBye = I.Veil.appendChild(
                sML.create("p", { id: "bibi-veil-byebye",
                    innerHTML: [
                        "<span lang=\"en\">", Msg["en"], "</span>",
                        "<span lang=\"ja\">", Msg["ja"], "</span>",
                    ].join("").replace(/(BiB\/i|ビビ)/g, "<a href=\"" + Bibi["href"] + "\" target=\"_blank\">$1</a>")
                })
            );
            I.note("(Your Browser Is Not Compatible)", 99999999999);
            O.log(Msg["en"].replace(/<[^>]*>/g, ""), "-*");
            E.dispatch("bibi:says-byebye");
            sML.removeClass(O.HTML, "welcome");
            return false;
        }
    
        // Say Welcome!
        I.note("Welcome!");
    
        // Extensions
        X.initialize();
    
        // Presets
        P.initialize();
    
        // User Parameters
        //U.initialize();
        this.bookManifestUrl = this.getBook();
        if(!this.bookManifestUrl)
            I.note("No manifest found", 99999999999, "ErrorOccured");        
    
        // Window Embedding
        if(window.parent == window) {
            O.WindowEmbedded = 0; // false
            O.WindowEmbeddedDetail = "Direct Opened: " + O.Origin + location.pathname + location.search;
            O.HTML.className = O.HTML.className + " window-not-embedded";
        } else {
            O.WindowEmbedded = -1; // true
            O.HTML.className = O.HTML.className + " window-embedded";
            try {
                if(location.host == parent.location.host || parent.location.href) {
                    O.WindowEmbedded = 1; // true
                    O.WindowEmbeddedDetail = "Embedded in: " + O.getOrigin(parent) + parent.location.pathname + parent.location.search;
                    O.ParentHolder = window.parent.document.getElementById(U["parent-holder-id"]);
                }
            } catch(e) {}
            if(O.WindowEmbedded == -1) O.WindowEmbeddedDetail = "Embedded in: Unreachable Parent";
        }
    
        // Fullscreen
        if((!O.WindowEmbedded || O.ParentHolder) && (O.Body.requestFullscreen || O.Body.webkitRequestFullscreen || O.Body.mozRequestFullScreen || O.Body.msRequestFullscreen)) {
            O.FullscreenEnabled = true;
            O.FullscreenElement  = O.ParentHolder ? O.ParentHolder.Bibi.Frame : O.HTML;
            O.FullscreenDocument = O.ParentHolder ? window.parent.document    : document;
            O.HTML.className = O.HTML.className + " fullscreen-enabled";
        } else {
            O.HTML.className = O.HTML.className + " fullscreen-not-enabled";
        }
    
        // Writing Mode & Font Size
        O.WritingModeProperty = (function() {
            var HTMLCS = getComputedStyle(O.HTML);
            if(/^(vertical|horizontal)-/.test(HTMLCS["-webkit-writing-mode"])) return "-webkit-writing-mode";
            if(/^(vertical|horizontal)-/.test(HTMLCS["writing-mode"]) || sML.UA.InternetExplorer) return "writing-mode";
            else return undefined;
        })();
        var SRI4VTC = sML.appendStyleRule("div#bibi-vtc", "position: absolute; left: -100px; top: -100px; width: 100px; height: 100px; -webkit-writing-mode: vertical-rl; -ms-writing-mode: tb-rl; writing-mode: vertical-rl;");
        var VTC = document.body.appendChild(sML.create("div", { id: "bibi-vtc" })); // VerticalTextChecker
        VTC.Child = VTC.appendChild(sML.create("p", { innerHTML: "aAあ亜" }));
        if(VTC.Child.offsetWidth < VTC.Child.offsetHeight) {
            O.HTML.className = O.HTML.className + " vertical-text-enabled";
            O.VerticalTextEnabled = true;
        } else {
            O.HTML.className = O.HTML.className + " vertical-text-not-enabled";
            O.VerticalTextEnabled = false;
        }
        O.DefaultFontSize = Math.min(VTC.Child.offsetWidth, VTC.Child.offsetHeight);
        document.body.removeChild(VTC);
        //delete VTC;
        sML.deleteStyleRule(SRI4VTC);
    
        // Scrollbars
        O.Scrollbars = {
            Width: window.innerWidth - O.HTML.offsetWidth,
            Height: window.innerHeight - O.HTML.offsetHeight
        };
    
        // Settings
        settings.initialize();
    
        sML.removeClass(O.HTML, "welcome");
    
        // Ready ?
        var PromiseForLoadingExtensions = new Promise(function(resolve, reject) {
            return (P.X.length) ? X.loadFilesInPreset().then(resolve) : resolve();
        });
        PromiseForLoadingExtensions.then(() => {
            E.add("bibi:commands:move-by",     (Par) => { R.moveBy(Par); });
            E.add("bibi:commands:scroll-by",   (Par) => { R.scrollBy(Par); });
            E.add("bibi:commands:focus-on",    (Par) => { R.focusOn(Par); });
            E.add("bibi:commands:change-view", (RVM) => { R.changeView(RVM); });
            window.addEventListener("message", () => M.gate, false);
            this.ready();
        });
    
    }

    ready() {
        //O.HTML.className = O.HTML.className + " js"; Modernizer substitute
        sML.addClass(O.HTML, "ready");
    
        E.add("bibi:readied", () => {
            sML.removeClass(O.HTML, "ready");
            if(settings.S["use-cookie"]) {
                var BibiCookie = O.Cookie.remember(O.RootPath);
                if(BibiCookie) {
                    if(BibiCookie["force-single-page"])
                        settings.S.FSP = true;
                    else
                        settings.S.FSP = false; // Force Single Page
                }
            }
            //P["trustworthy-origins"].push("https://yrkz.localtunnel.me"); // O.Origin
            L.loadBook({ Path: this.bookManifestUrl });
            // TODO promise then and catch for above function
        });
    
        //setTimeout(() => { E.dispatch("bibi:readied"); }, (O.Mobile ? 999 : 1)); Why even??
        
    
        O.ReadiedURL = location.href;

        E.dispatch("bibi:readied");
    
    }
}

export default (new Bibi);