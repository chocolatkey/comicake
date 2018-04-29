import sML from "../vendor/sML";
import E from "./E";
import { DEBUG } from "../constants";
import settings from "./S";
import B from "./B";
import R from "./R";

//==============================================================================================================================================
//----------------------------------------------------------------------------------------------------------------------------------------------

//-- Operation Utilities

//----------------------------------------------------------------------------------------------------------------------------------------------

class O { // Bibi.Operator
    constructor() {
        this.log.Depth = 1;
        this.Origin = this.getOrigin();
        this.TimeCard = {
            Origin: Date.now(),
            getElapsed: Time => {
                return ((Time ? Time : Date.now()) - this.TimeCard.Origin);
            },
            getHMS: Milliseconds => {
                return [
                    Milliseconds / 1000 / 60 / 60,
                    Milliseconds / 1000 / 60 % 60,
                    Milliseconds / 1000 % 60
                ].map(function(Val) {
                    return sML.String.pad(Math.floor(Val), 0, 2);
                }).join(":");
            }
        };
        this.Path = (() => {
            if(DEBUG)
                return "//localhost:8000/static/";
            if(document.currentScript) return document.currentScript.src;
            var Scripts = document.getElementsByTagName("script");
            return Scripts[Scripts.length - 1].src;
        })();
        //this.RootPath = this.Path.replace(/\/res\/scripts\/.+$/, "/");
        this.RootPath = this.Path.replace(/\/assets\/bundles\/.+$/, "/static/");
        this.RootPath = this.RootPath.replace(/\/static\/bundles\/.+$/, "/static/");
        this.Cookie = {
            remember: Group => {
                var Cookie = JSON.parse(sML.Cookies.read("bibi") || "{}");
                if(typeof Group != "string" || !Group) return Cookie;
                return Cookie[Group];
            },
            eat: (Group, KeyVal, Opt) => {
                if(typeof Group != "string" || !Group) return false;
                if(typeof KeyVal != "object") return false;
                var Cookie = this.Cookie.remember();
                if(typeof Cookie[Group] != "object") Cookie[Group] = {};
                for(var Key in KeyVal) {
                    var Val = KeyVal[Key];
                    if(typeof Val == "function") continue;
                    Cookie[Group][Key] = Val;
                }
                if(!Opt) Opt = {};
                Opt.Path = location.pathname.replace(/[^\/]+$/, "");
                if(!Opt.Expires) Opt.Expires = settings.S["cookie-expires"];
                sML.Cookies.write("bibi", JSON.stringify(Cookie), Opt);
            }
        };
        
        this.ContentTypes = {
            "gif"   :       "image/gif",
            "png"   :       "image/png",
            "jpe?g" :       "image/jpeg",
            "svg"   :       "image/svg+xml",
            "mp4"   :       "video/mp4",
            "webm"  :       "video/webm",
            "mp3"   :       "audio/mpeg",
            //"mp4"   :       "audio/mp4",
            "ttf"   :        "font/truetype",
            "otf"   :        "font/opentype",
            "woff"  :        "font/woff",
            "css"   :        "text/css",
            "js"    :        "text/javascript",
            "html?" :        "text/html",
            "xhtml" : "application/xhtml+xml",
            "xml"   : "application/xml",
            "pdf"   : "application/pdf"
        };
        
        this.SettingTypes = {
            YesNo: [
                "fix-reader-view-mode",
                "single-page-always",
                "wait",
                "autostart",
                "start-in-new-window",
                "use-full-height",
                "use-menubar",
                "use-nombre",
                "use-slider",
                "use-arrows",
                "use-keys",
                "use-swipe",
                "use-cookie",
                "preprocess-html-always"
            ],
            Integer: [
                "spread-gap",
                "spread-margin",
                "item-padding-left",
                "item-padding-right",
                "item-padding-top",
                "item-padding-bottom"
            ],
            Number: [
                "cookie-expires",
                "flipper-width"
            ],
            Boolean: [
                "remove-bibi-website-link",
                "page-breaking"
            ]
        };
    }

    log(Msg, Tag) {
        if(sML.UA.Gecko && typeof Msg == "string") Msg = Msg.replace(/(https?:\/\/)/g, "");
        var Pre = "BiB/i: ";
        switch(Tag) {
        case "-x" : break;
        case  "*:": Tag  =       (this.logDepth    ) + ":";        break;
        case "/*" : Tag  = "/" + (this.logDepth - 1)      ;        break;
        default   : Tag  = "-" + (this.logDepth    )      ;        break;
        }
        switch(Tag) {
        case "-x" : Pre += "[ERROR] "; console.info(Pre + Msg); return;
        case "-0" : Pre += "━━ ";    console.info(Pre + Msg); return;
        case "-1" : Pre += " - ";              this.logDepth = 1;  break;
        case  "1:": Pre += "┌ ";              this.logDepth = 2;  break;
        case "-2" : Pre += "│ - ";            this.logDepth = 2;  break;
        case  "2:": Pre += "│┌ ";            this.logDepth = 3;  break;
        case "-3" : Pre += "││ - ";          this.logDepth = 3;  break;
        case  "3:": Pre += "││┌ ";          this.logDepth = 4;  break;
        case "-4" : Pre += "│││ - ";        this.logDepth = 4;  break;
        case  "4:": Pre += "│││┌ ";        this.logDepth = 5;  break;
        case "-5" : Pre += "││││ - ";      this.logDepth = 5;  break;
        case  "5:": Pre += "││││┌ ";      this.logDepth = 6;  break;
        case "-6" : Pre += "│││││ - ";    this.logDepth = 6;  break;
        case "/5" : Pre += "││││└ ";      this.logDepth = 5;  break;
        case "/4" : Pre += "│││└ ";        this.logDepth = 4;  break;
        case "/3" : Pre += "││└ ";          this.logDepth = 3;  break;
        case "/2" : Pre += "│└ ";            this.logDepth = 2;  break;
        case "/1" : Pre += "└ ";              this.logDepth = 1;  break;
        }
        console.log(Pre + Msg);
    } 
    
    error(Msg) {
        this.Busy = false;
        sML.removeClass(this.HTML, "busy");
        sML.removeClass(this.HTML, "loading");
        sML.removeClass(this.HTML, "waiting");
        E.dispatch("bibi:x_x", Msg);
        this.log(Msg, "-x");
        if(DEBUG)
            console.error(Msg);
        // TODO Raven
    }
    
    
    applyTo(To, From) {
        for(var Property in From) if(typeof To[Property] != "function" && typeof From[Property] != "function") To[Property] = From[Property];
    }
    
    
    download(URI, MimeType) {
        return new Promise(function(resolve, reject) {
            var XHR = new XMLHttpRequest();
            if(MimeType) XHR.overrideMimeType(MimeType);
            XHR.open("GET", URI, true);
            XHR.onloadend = function() {
                XHR.status === 200 ? resolve(XHR) : reject(XHR);
            };
            XHR.send(null);
        });
    }
    
    
    parseDocument(Path, Doc) {
        return (new DOMParser()).parseFromString(Doc, /\.(xml|opf|ncx)$/i.test(Path) ? "text/xml" : "text/html");
    }
    
    
    openDocument(Path) {
        if(B.Unzipped) {
            return this.download(B.Path + "/" +  Path).then(function(XHR) {
                return this.parseDocument(Path, XHR.responseText);
            }).catch(function(XHR) {
                this.error("XHR HTTP status: " + XHR.status + " \"" + XHR.responseURL + "\"");
            });
        } else {
            return Promise.resolve().then(function() {
                return this.parseDocument(Path, B.Files[Path]);
            });
        }
    }
    
    
    editCSSRules() {
        var Doc, Fun;
        if(typeof arguments[0] == "function") Doc = arguments[1], Fun = arguments[0];
        else if(typeof arguments[1] == "function") Doc = arguments[0], Fun = arguments[1];
        if(!Doc) Doc = document;
        if(!Doc.styleSheets || typeof Fun != "function") return;
        sML.each(Doc.styleSheets, function() {
            var StyleSheet = this;
            if(!StyleSheet.cssRules) return;
            for(var l = StyleSheet.cssRules.length, i = 0; i < l; i++) {
                var CSSRule = this.cssRules[i];
                /**/ if(CSSRule.cssRules)   arguments.callee.call(CSSRule);
                else if(CSSRule.styleSheet) arguments.callee.call(CSSRule.styleSheet);
                else Fun(CSSRule);
            }
        });
    }
    
    
    appendStyleSheetLink(Opt, Doc) {
        if(!Opt || !Opt.href) return false;
        if(!Doc) Doc = document;
        var Link = Doc.createElement("link");
        Link.rel = "stylesheet";
        if(typeof Opt.className == "string") Link.className = Opt.className;
        if(typeof Opt.id        == "string") Link.id = Opt.id;
        if(typeof Opt.media     == "string") Link.media = Opt.media;
        Link.href = Opt.href;
        return Doc.head.appendChild(Link);
    }
    
    
    isBin(Hint) {
        if(/(^|\.)(gif|jpe?g|png|ttf|otf|woff|mp[g34]|m4[av]|ogg|webm|pdf)$/i.test(Hint)) return true;
        return false;
    }
    
    getDataURI(FilePath, FileContent) {
        for(var Ext in this.ContentTypes) {
            if((new RegExp("(^|\.)" + Ext + "$", "i")).test(FilePath)) {
                return "data:" + this.ContentTypes[Ext] + ";base64," + (this.isBin(FilePath) ? btoa(FileContent) : btoa(unescape(encodeURIComponent(FileContent))));
            }
        }
        return "";
    }
    
    getWritingMode(Ele) {
        var CS = getComputedStyle(Ele);
        if(!this.WritingModeProperty)                            return (CS["direction"] == "rtl" ? "rl-tb" : "lr-tb");
        else if(     /^vertical-/.test(CS[this.WritingModeProperty])) return (CS["direction"] == "rtl" ? "bt" : "tb") + "-" + (/-lr$/.test(CS[this.WritingModeProperty]) ? "lr" : "rl");
        else if(   /^horizontal-/.test(CS[this.WritingModeProperty])) return (CS["direction"] == "rtl" ? "rl" : "lr") + "-" + (/-bt$/.test(CS[this.WritingModeProperty]) ? "bt" : "tb");
        else if(/^(lr|rl|tb|bt)-/.test(CS[this.WritingModeProperty])) return CS[this.WritingModeProperty];
    }
    
    
    getElementInnerText(Ele) {
        var InnerText = "InnerText";
        var Copy = document.createElement("div");
        Copy.innerHTML = Ele.innerHTML.replace(/ (src(set)?|source|(xlink:)?href)=/g, " data-$1=");
        sML.each(Copy.querySelectorAll("svg"),    function() { this.parentNode.removeChild(this); });
        sML.each(Copy.querySelectorAll("video"),  function() { this.parentNode.removeChild(this); });
        sML.each(Copy.querySelectorAll("audio"),  function() { this.parentNode.removeChild(this); });
        sML.each(Copy.querySelectorAll("img"),    function() { this.parentNode.removeChild(this); });
        sML.each(Copy.querySelectorAll("script"), function() { this.parentNode.removeChild(this); });
        sML.each(Copy.querySelectorAll("style"),  function() { this.parentNode.removeChild(this); });
        /**/ if(typeof Copy.textContent != "undefined") InnerText = Copy.textContent;
        else if(typeof Copy.innerText   != "undefined") InnerText = Copy.innerText;
        return InnerText.replace(/[\r\n\s\t ]/g, "");
    }
    
    
    getElementCoord(El) {
        var Coord = { X: El["offsetLeft"], Y: El["offsetTop"] };
        while(El.offsetParent) El = El.offsetParent, Coord.X += El["offsetLeft"], Coord.Y += El["offsetTop"];
        return Coord;
    }
    
    getPath() {
        var Origin = "", Path = arguments[0];
        if(arguments.length == 2 && /^[\w\d]+:\/\//.test(arguments[1])) Path  =       arguments[1];
        else for(var l = arguments.length, i = 1; i < l; i++)           Path += "/" + arguments[i];
        Path.replace(/^([a-zA-Z]+:\/\/[^\/]+)?\/*(.*)$/, function() { Origin = arguments[1], Path = arguments[2]; });
        while(/([^:\/])\/{2,}/.test(Path)) Path = Path.replace(/([^:\/])\/{2,}/g, "$1/");
        while(        /\/\.\//.test(Path)) Path = Path.replace(        /\/\.\//g,   "/");
        while(/[^\/]+\/\.\.\//.test(Path)) Path = Path.replace(/[^\/]+\/\.\.\//g,    "");
        /**/                               Path = Path.replace(      /^(\.\/)+/g,    "");
        if(Origin) Path = Origin + "/" + Path;
        return Path;
    }
    
    isAnchorContent(Ele) {
        while(Ele) {
            if(/^a$/i.test(Ele.tagName)) return true;
            Ele = Ele.parentElement;
        }
        return false;
    }
    
    stamp(What, TimeCard) {
        if(!TimeCard) TimeCard = this.TimeCard;
        var HMS = this.TimeCard.getHMS(this.TimeCard.getElapsed());
        if(TimeCard[HMS]) What = TimeCard[HMS] + " -&- " + What;
        TimeCard[HMS] = What;
    }
    
    stopPropagation(Eve) { Eve.stopPropagation(); return false; };
    preventDefault (Eve) { Eve.preventDefault();  return false; };
    
    getBibiEventCoord(Eve) {
        var Coord = { X:0, Y:0 };
        if(/^touch/.test(Eve.type)) {
            Coord.X = Eve.changedTouches[0].pageX;
            Coord.Y = Eve.changedTouches[0].pageY;
        } else {
            Coord.X = Eve.pageX;
            Coord.Y = Eve.pageY;
        }
        if(Eve.target.ownerDocument.documentElement == this.HTML) {
            Coord.X -= this.Body.scrollLeft;
            Coord.Y -= this.Body.scrollTop;
        } else {
            var Item = Eve.target.ownerDocument.documentElement.Item;
            ItemCoord = this.getElementCoord(Item);
            if(!Item.PrePaginated && !Item.Outsourcing) ItemCoord.X += settings.S["item-padding-left"], ItemCoord.Y += settings.S["item-padding-top"];
            Coord.X = (Coord.X + ItemCoord.X - R.Main.scrollLeft) * R.Main.Transformation.Scale + R.Main.Transformation.Translation.X;
            Coord.Y = (Coord.Y + ItemCoord.Y - R.Main.scrollTop ) * R.Main.Transformation.Scale + R.Main.Transformation.Translation.Y;
        }
        return Coord;
    }
    
    getBibiEvent(Eve) {
        if(!Eve) return {};
        var Coord = this.getBibiEventCoord(Eve);
        var FlipperWidth = settings.S["flipper-width"];
        var Ratio = {
            X: Coord.X / window.innerWidth,
            Y: Coord.Y / window.innerHeight
        };
        if(FlipperWidth < 1) { // Ratio
            var BorderL = BorderT =     FlipperWidth;
            var BorderR = BorderB = 1 - FlipperWidth;
        } else { // Pixel to Ratio
            var BorderL = FlipperWidth / window.innerWidth;
            var BorderT = FlipperWidth / window.innerHeight;
            var BorderR = 1 - BorderL;
            var BorderB = 1 - BorderT;
        }
        var Division = {
            X: "",
            Y: ""
        };
        if(Ratio.X < BorderL) Division.X = "left";
        else if(BorderR < Ratio.X) Division.X = "right";
        else                       Division.X = "center";
        if(Ratio.Y < BorderT) Division.Y = "top";
        else if(BorderB < Ratio.Y) Division.Y = "bottom";
        else                       Division.Y = "middle";
        return {
            Target: Eve.target,
            Coord: Coord,
            Ratio: Ratio,
            Division: Division
        };
    }
    
    getOrigin(Win) {
        var Loc = (Win ? Win : window).location;
        return Loc.origin || Loc.protocol + "//" + (Loc.host || Loc.hostname + (Loc.port ? ":" + Loc.port : ""));
    }
}

if(parent && parent != window) O.log = function() { return false; };
export default (new O);