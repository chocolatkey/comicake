import O from "./O";
import E from "./E";
import sML from "../vendor/sML";
import U from "./U";
import B from "./B";
import settings from "./S";
import R from "./R";
import I from "./I";
import Bibi from "./Bibi";
import P from "./P";

import axios from "axios";
import { DEBUG, CREDITS, PLACEHOLDER, COMMENTS } from "../constants";
import cdn from "../cdn";

//==============================================================================================================================================
//----------------------------------------------------------------------------------------------------------------------------------------------

//-- Loader

//----------------------------------------------------------------------------------------------------------------------------------------------

class L { // Bibi.Loader
    constructor() {
        this.preprocessResources_Settings = {
            CSS: {
                FileExtensionRE: /\.css$/,
                ReplaceRules: [
                    [/\/\*[.\s\S]*?\*\/|[^\{\}]+\{\s*\}/gm, ""],
                    [/(-(epub|webkit)-)?column-count\s*:\s*1\s*([;\}])/g, "$1column-count: auto$4"]
                ],
                NestingRE: /(@import\s*(?:url\()?["']?)(?!(?:https?|data):)(.+?\.css)(['"]?(?:\))?\s*;)/g,
                ResAttributesAndExtensions: {
                    "url" : "gif|png|jpe?g|svg|ttf|otf|woff"
                },
                getResMatchRE: () => {
                    return /url\(["']?(?!(?:https?|data):)(.+?)['"]?\)/g;
                },
                init: () => {
                    if(sML.UA.WebKit || sML.UA.Blink) {
                        return;
                    }
                    this.ReplaceRules.push([/-(epub|webkit)-/g, ""]);
                    if(sML.UA.Gecko) {
                        this.ReplaceRules.push([/text-combine-horizontal:\s*([^;\}]+)\s*([;\}])/g, "text-combine-upright: $1$2"]);
                        this.ReplaceRules.push([/text-combine:\s*horizontal\s*([;\}])/g, "text-combine-upright: all$1"]);
                        return;
                    }
                    if(sML.UA.Edge) {
                        this.ReplaceRules.push([/text-combine-(upright|horizontal)\s*:\s*([^;\}\s]+)\s*([;\}])/g, "text-combine-horizontal: $2; text-combine-upright: $2$3"]);
                        this.ReplaceRules.push([/text-combine\s*:\s*horizontal\s*([;\}])/g, "text-combine-horizontal: all; text-combine-upright: all$1"]);
                    }
                    if(sML.UA.InternetExplorer) {
                        this.ReplaceRules.push([/writing-mode\s*:\s*vertical-rl\s*([;\}])/g,   "writing-mode: tb-rl$1"]);
                        this.ReplaceRules.push([/writing-mode\s*:\s*vertical-lr\s*([;\}])/g,   "writing-mode: tb-lr$1"]);
                        this.ReplaceRules.push([/writing-mode\s*:\s*horizontal-tb\s*([;\}])/g, "writing-mode: lr-tb$1"]);
                        this.ReplaceRules.push([/text-combine-(upright|horizontal)\s*:\s*([^;\}\s]+)\s*([;\}])/g, "-ms-text-combine-horizontal: $2$3"]);
                        this.ReplaceRules.push([/text-combine\s*:\s*horizontal\s*([;\}])/g, "-ms-text-combine-horizontal: all$1"]);
                    }
                    if(/^(zho?|chi|kor?|ja|jpn)$/.test(B.Language)) {
                        this.ReplaceRules.push([/text-align\s*:\s*justify\s*([;\}])/g, "text-align: justify; text-justify: inter-ideograph$1"]);
                    }
                }
            },
            SVG: {
                FileExtensionRE: /\.svg$/,
                ReplaceRules: [
                    [/<!--\s+[.\s\S]*?\s+-->/gm, ""]
                ],
                NestingRE: /(<img\s+(?:\w+\s*=\s*["'].*?['"]\s+)*src\s*=\s*["'])(?!(?:https?|data):)(.+?\.svg?)(['"][^>]*>)/g,
                ResAttributesAndExtensions: {
                    "href"       : "css",
                    "src"        : "gif|png|jpe?g|js",
                    "xlink:href" : "gif|png|jpe?g"
                }
            },
            HTML: {
                FileExtensionRE: /\.(xhtml|xml|html?)$/,
                ReplaceRules: [
                    [/<!--\s+[.\s\S]*?\s+-->/gm, ""]
                ],
                NestingRE: /(<iframe\s+(?:\w+\s*=\s*["'].*?['"]\s+)*src\s*=\s*["'])(?!(?:https?|data):)(.+?\.(xhtml|xml|html?))(['"][^>]*>)/g,
                ResAttributesAndExtensions: {
                    "href"       : "css",
                    "src"        : "gif|png|jpe?g|svg|js|mp[34]|m4[av]|webm",
                    "xlink:href" : "gif|png|jpe?g"
                }
            }
        };

        let discussionTemplate = document.createElement("div");
        discussionTemplate.innerHTML = "Herro";
        this.ExtraInnerHTML = discussionTemplate.outerHTML;
    }

    wait() {
        return new Promise((resolve) => {
            this.wait.resolve = () => { resolve(); delete this.wait.resolve; };
            O.Busy = false;
            sML.removeClass(O.HTML, "busy");
            sML.addClass(O.HTML, "waiting");
            E.dispatch("bibi:waits");
            O.log("(waiting)", "-*");
            I.note("");
        }).then(() => {
            O.Busy = true;
            sML.addClass(O.HTML, "busy");
            sML.removeClass(O.HTML, "waiting");
            I.note("Loading...");
        });
    }
    
    
    play() {
        if(settings.S["start-in-new-window"]) return window.open(location.href);
        this.Played = true;
        this.wait.resolve();
        E.dispatch("bibi:played");
    }
    
    
    loadBook(PathOrData) {
        B.initialize();
        R.reset();
        this.Preprocessed = false;
        this.Loaded = false;
        O.Busy = true;
        sML.addClass(O.HTML, "busy");
        sML.addClass(O.HTML, "loading");
        I.note("Loading...");
        O.log("Initializing Book...", "*:");
        return new Promise((resolve, reject) => {
            this.loadBook.resolve = () => { resolve.apply(this.loadBook, arguments); delete this.loadBook.resolve; delete this.loadBook.reject; };
            this.loadBook.reject  = () => {
                reject.apply(this.loadBook, arguments);
                I.Veil.Cover.className = "";
                console.error("Epic Fail");
            };
            if(PathOrData.Path) {
                // Online
                if(!DEBUG && !P.habitat["trustworthy-origins"].includes(PathOrData.Path.replace(/^([\w\d]+:\/\/[^/]+).*$/, "$1")))
                    return this.loadBook.reject("The Origin of the Path of the Book Is Not Allowed.");
                B.Path = PathOrData.Path;
                axios.get(B.Path).then((e) => {
                    this.manifest = e.data;
                    // Online Manifest
                    B.Unzipped = true; // Satisfy our Satoru overlords
                    O.log("Comic: " + B.Path + " (WebPub Manifest)", "-*");
                    this.loadBook.resolve();
                }).catch((error) => {
                    // Failed to load the manifest, daihen!
                    this.loadBook.reject("Failed to load manifest: " + error);
                });
            } else {
                this.loadBook.reject("WebPub Manifest Location not specified...Weird");
            }
        }).then(() => {
            B.PathDelimiter = B.Unzipped ? "/" : " > ";
            O.log("Book Initialized.", "/*");
            //this.loadContainer();
            this.processPackageDocument(this.manifest);
        }).catch((ErrorMessage) => {
            I.note(ErrorMessage, 99999999999, "ErrorOccured");
            O.error(ErrorMessage);
            return false;
        });
    }
    
    
    loadContainer() {
        O.log("Loading Container XML: " + B.Path + B.PathDelimiter + B.Container.Path + " ...", "*:");
        O.openDocument(B.Container.Path).then(this.processContainer).then(this.onLoadContainer);
    }
    
    
    processContainer(Doc) {
        B.Package.Path = Doc.getElementsByTagName("rootfile")[0].getAttribute("full-path");
        B.Package.Dir  = B.Package.Path.replace(/\/?[^\/]+$/, "");
    }
    
    
    onLoadContainer() {
        O.log("Container XML Loaded.", "/*");
        this.loadPackageDocument();
    }
    
    
    loadPackageDocument() {
        O.log("Loading Package Document: " + B.Path + B.PathDelimiter + B.Package.Path + " ...", "*:");
        O.openDocument(B.Package.Path).then(this.processPackageDocument).then(this.onLoadPackageDocument);
    }
    
    
    processPackageDocument(Doc) {
    
        B.Package.Metadata["rendition:layout"] = "pre-paginated",
        B.Package.Metadata["rendition:orientation"] = "portrait", // I think this is right?
        B.Package.Metadata["rendition:spread"] = "landscape", // TODO
        B.Package.Spine["page-progression-direction"] = "rtl", // TODO
        B.Package.Manifest["cover-image"].Path = cdn.image(Doc.metadata.image);
        B.Language = Doc.metadata.language;
        B.ID = Doc.metadata.identifier,
        B.Title = Doc.metadata.subtitle;
        var parr = [];
        Bibi.forEach(Doc.metadata.publisher, function(publisher) {
            parr.push(publisher.name);
        });
        B.Publisher = parr.join(", ");
        var carr = [];
        Bibi.forEach(Doc.metadata.author, function(person) {
            carr.push(person.name);
        });
        Bibi.forEach(Doc.metadata.artist, function(person) {
            if(carr.indexOf(person.name) == -1)
                carr.push(person.name);
        });
        B.Creator = carr.join(", "),
        B.Publisher = parr.join(", ");
        B.ID = Doc.metadata.identifier,
        B.WritingMode = B.PPD = B.Package.Spine["page-progression-direction"];
        if(/^(zho?|chi|kor?|ja|jpn)$/.test(B.Language)) {
            B.WritingMode = (B.PPD == "rtl") ? "tb-rl" : "lr-tb";
        } else if(/^(aze?|ara?|ui?g|urd?|kk|kaz|ka?s|ky|kir|kur?|sn?d|ta?t|pu?s|bal|pan?|fas?|per|ber|msa?|may|yid?|heb?|arc|syr|di?v)$/.test(B.Language)) {
            B.WritingMode = "rl-tb";
        } else if(/^(mo?n)$/.test(B.Language)) {
            B.WritingMode = "tb-lr";
        } else {
            B.WritingMode = "lr-tb";
        }
        this.LoadedSpreads = 0;
        Bibi.forEach(Doc.spine, (e, t) => {
            let humanIndex = t + 1;
            let n = "item-" + sML.String.pad(humanIndex, 0, 3);
            //console.log(n);
            //var o = t % 2 ? "right" : "left";
            var o = CREDITS ? (t % 2 ? "left" : "right") : (t % 2 ? "right" : "left");
            let isCredits = (CREDITS && humanIndex == CREDITS) ? true : false; // Credits page
            let isLandscape = ((e.width > e.height) && !isCredits) ? true : false; // Spreads 'n stuff
            if((settings.S.FSP && settings.S.RVM != "vertical") || isLandscape) {
                o = "center";
            }
            B.Package.Manifest.items[n] = e;
            if(isCredits) { // Adjust cover page size
                let senpai;
                if(t == 0)
                    senpai = Doc.spine[t + 1];
                else
                    senpai = Doc.spine[t - 1];

                let wratio = senpai.width / e.width;
                e.width = senpai.width;
                e.height *= wratio;
            }
            B.Package.Spine.itemrefs.push({
                idref: n,
                linear: "yes",
                "page-spread": o, // Alternate R & L
                "rendition:layout": "pre-paginated",
                "rendition:orientation": "portrait",
                "rendition:page-spread": o,
                "rendition:spread": "landscape", // TODO
                viewport: {
                    height: e.height,
                    width: e.width,
                }
            });
            if(!(t % 2) || (settings.S.FSP && settings.S.RVM != "vertical") || isLandscape) 
                this.LoadedSpreads ++;
        });
        //var discPageNum = Object.keys(B.Package.Manifest.items).length + 1;
        //console.log("DPN: " + discPageNum);
        //var n = "item-" + sML.String.pad(discPageNum, 0, 3);
        if(COMMENTS && false) {
            B.Package.Manifest.items["extra"] = {
                href: ""
            };
            B.Package.Spine.itemrefs.push({
                idref: "extra",
                linear: "yes",
                "page-spread": "center",
                "rendition:layout": "pre-paginated",
                "rendition:orientation": "landscape",
                "rendition:page-spread": "center",
                "rendition:spread": "landscape", // TODO
                viewport: {
                    height: 600,
                    width: 800
                }
            });
        }
        
        
        //if(constants.CREDITS)
        //    L.LoadedSpreads ++;
        
        if(B.Title && false) {
            var BookIDFragments = [B.Title];
            if(B.Creator)   BookIDFragments.push(B.Creator);
            if(B.Publisher) BookIDFragments.push(B.Publisher);
            BookIDFragments = BookIDFragments.join(" - ").replace(/&amp;?/gi, "&").replace(/&lt;?/gi, "<").replace(/&gt;?/gi, ">");
            O.Title.innerHTML = "";
            O.Title.appendChild(document.createTextNode(BookIDFragments + " | " + (settings.S["website-name-in-title"] ? settings.S["website-name-in-title"] : "BiB/i")));
        }

        var IDLogs = [];
        if(B.Title)     IDLogs.push(B.Title);
        if(B.Creator)   IDLogs.push(B.Creator);
        if(B.Publisher) IDLogs.push(B.Publisher);
        IDLogs.push("Language: \""  + B.Language + "\"");
        O.log(IDLogs.join(" / "), "-*");

        var MetaLogs = [];
        MetaLogs.push("rendition:layout: \"" + B.Package.Metadata["rendition:layout"] + "\"");
        MetaLogs.push("rendition:orientation: \"" + B.Package.Metadata["rendition:orientation"] + "\"");
        MetaLogs.push("rendition:spread: \"" + B.Package.Metadata["rendition:spread"] + "\"");
        MetaLogs.push("page-progression-direction: \"" + B.Package.Spine["page-progression-direction"] + "\"");
        O.log(MetaLogs.join(" / "), "-*");
        var vSet = false;
        if(settings.S["use-cookie"]) {
            var BibiCookie = O.Cookie.remember(O.RootPath);
            var BookCookie = O.Cookie.remember(B.ID);
            if(BibiCookie) {
                if(!U["reader-view-mode"] && BibiCookie.RVM) {
                    settings.S["reader-view-mode"] = BibiCookie.RVM;
                    vSet = true;
                }
            }
            if(BookCookie) {
                if(!U["to"] && BookCookie.Position) settings.S["to"] = BookCookie.Position;
            }
        }
        if(!vSet && O.Mobile && (settings.S["reader-view-mode"] != settings.S["reader-view-mode-mobile"])) {
            settings.S["reader-view-mode"] = settings.S["reader-view-mode-mobile"];
        }
        settings.update(),
        E.dispatch("bibi:loaded-package-document");
        this.createCover();
        this.prepareSpine(() => {
            return document.createElement("div");
        }),
        /*this.loadNavigation().then(function() { // Taken care of by framework
            E.dispatch("bibi:prepared");
            this.loadItemsInSpreads();
        });*/
        E.dispatch("bibi:prepared");
        this.loadItemsInSpreads();
    
    }
    
    
    onLoadPackageDocument() {
        E.dispatch("bibi:loaded-package-document");
        O.log("Package Document Loaded.", "/*");
        this.createCover();
        this.prepareSpine();
        this.loadNavigation().then(() => {
            E.dispatch("bibi:prepared");
            if(settings.S["autostart"] || this.Played) {
                this.loadItemsInSpreads();
            } else {
                this.wait().then(() => {
                    this.loadItemsInSpreads();
                });
            }
        });
    }
    
    
    createCover() {
    
        O.log("Creating Cover...", "*:");
    
        I.Veil.Cover.Info.innerHTML = I.Panel.BookInfo.Cover.Info.innerHTML = "";
    
        if(B.Package.Manifest["cover-image"].Path) {
            R.CoverImage.Path = B.Package.Manifest["cover-image"].Path;
        }
        I.Veil.Cover.Info.innerHTML = I.Panel.BookInfo.Cover.Info.innerHTML = (() => {
            var BookID = [];
            if(B.Title)     BookID.push("<strong>" + B.Title     + "</strong>");
            if(B.Creator)   BookID.push("<em>"     + B.Creator   + "</em>");
            if(B.Publisher) BookID.push("<span>"   + B.Publisher + "</span>");
            return BookID.join(" ");
        })();
    
        if(R.CoverImage.Path) {
            O.log("Cover Image: " + R.CoverImage.Path, "-*");
            this.CoverImageObj = sML.create("img");
            this.CoverImageObj.load = () => {
                //O.log('Loading Cover Image: ' + B.Path + B.PathDelimiter + R.CoverImage.Path + ' ...', "*:");
                var Img = this.CoverImageObj;
                Img.src = B.Files[R.CoverImage.Path] ? O.getDataURI(R.CoverImage.Path, B.Files[R.CoverImage.Path]) : R.CoverImage.Path;
                Img.timeout = setTimeout(() => { Img.ontimeout(); }, 3000);
            };
            this.CoverImageObj.onload = () => {
                if(this.CoverImageObj.TimedOut) return false;
                clearTimeout(this.CoverImageObj.timeout);
                //O.log('Cover Image Loaded.', "/*");
                sML.style(I.Veil.Cover, { backgroundImage: "url(" + this.CoverImageObj.src + ")" });
                if (O.Body.clientHeight < this.CoverImageObj.height) {
                    sML.style(I.Veil.Cover, { backgroundSize: "contain" });
                } else {
                    sML.style(I.Veil.Cover, { backgroundSize: "auto" });
                }
                I.Panel.BookInfo.Cover.insertBefore(this.CoverImageObj, I.Panel.BookInfo.Cover.Info);
                I.Veil.Cover.className = I.Panel.BookInfo.Cover.className = "with-cover-image";
            };
            this.CoverImageObj.ontimeout = () => {
                this.CoverImageObj.TimedOut = true;
                //O.log('Cover Image Request Timed Out.', "/*");
                I.Veil.Cover.className = I.Panel.BookInfo.Cover.className = "without-cover-image";
            };
            this.CoverImageObj.load();
        } else {
            O.log("No Cover Image.", "-*");
            I.Veil.Cover.className = I.Panel.BookInfo.Cover.className = "without-cover-image";
        }
    
        O.log("Cover Created.", "/*");
        E.dispatch("bibi:created-cover", R.CoverImage.Path);
    
    }
    
    
    prepareSpine(ItemMaker) {
    
        O.log("Preparing Spine...", "*:");
    
        // For Spread Pairing of Pre-Paginated
        if(B.PPD == "rtl") var SpreadPairBefore = "right", SpreadPairAfter = "left";
        else               var SpreadPairBefore = "left",  SpreadPairAfter = "right";
    
        B.FileDigit = (B.Package.Spine["itemrefs"].length + "").length;
        if(B.FileDigit < 3) B.FileDigit = 3;
    
        if(typeof ItemMaker != "function") ItemMaker = () => {
            return sML.create("iframe", {
                scrolling: "no",
                allowtransparency: "true"
            });
        };
    
        // Spreads, Boxes, and Items
        sML.each(B.Package.Spine["itemrefs"], (index, Spine) => {
            let ItemRef = Spine[index], ItemIndex = R.Items.length;
            // Item: A
            var Item = ItemMaker(this);
            sML.addClass(Item, "item");
            Item.ItemRef = ItemRef;
            Item.Path = O.getPath(B.Package.Dir, B.Package.Manifest["items"][ItemRef["idref"]].href);
            Item.Dir = Item.Path.replace(/\/?[^\/]+$/, "");
            R.AllItems.push(Item);
            if(ItemRef["linear"] != "yes") return R.NonLinearItems.push(Item);
            R.Items.push(Item);
            // SpreadBox & Spread
            var SpreadBox, Spread;
            if(ItemRef["page-spread"] == "center") {
                Item.IsSpreadCenter = true;
            } else if(ItemRef["page-spread"] == SpreadPairBefore) {
                Item.IsSpreadPairBefore = true;
            } else if(ItemRef["page-spread"] == SpreadPairAfter && ItemIndex > 0) {
                Item.IsSpreadPairAfter = true;
                var PreviousItem = R.Items[ItemIndex - 1];
                if(PreviousItem.IsSpreadPairBefore) {
                    PreviousItem.SpreadPair = Item;
                    Item.SpreadPair = PreviousItem;
                    Spread = PreviousItem.Spread;
                    SpreadBox = Spread.SpreadBox;
                }
            }
            if(!Item.SpreadPair) {
                SpreadBox = R.Main.Book.appendChild(sML.create("div", { className: "spread-box" }));
                Spread = SpreadBox.appendChild(sML.create("div", { className: "spread" }));
                Spread.SpreadBox = SpreadBox;
                Spread.Items = [];
                Spread.Pages = [];
                Spread.SpreadIndex = R.Spreads.length;
                R.Spreads.push(Spread);
            }
            // ItemBox
            var ItemBox = Spread.appendChild(sML.create("div", { className: "item-box" }));
            // Item: B
            Item.Spread = Spread;
            Item.ItemBox = ItemBox;
            Item.Pages = [];
            Item.ItemIndexInSpread = Spread.Items.length;
            Item.ItemIndex         =           ItemIndex;
            Item.id = "item-" + sML.String.pad(Item.ItemIndex + 1, 0, B.FileDigit);
            Spread.Items.push(Item);
            [SpreadBox, Spread, ItemBox, Item].forEach(function(Ele) {
                Ele.RenditionLayout = ItemRef["rendition:layout"];
                Ele.PrePaginated = (Ele.RenditionLayout == "pre-paginated");
                sML.addClass(Ele, ItemRef["rendition:layout"]);
            });
            [ItemBox, Item].forEach(function(Ele) {
                if(ItemRef["page-spread"]) {
                    sML.addClass(Ele, "page-spread-" + ItemRef["page-spread"]);
                }
                if(ItemRef["bibi:layout"]) {
                    sML.addClass(Ele, "layout-" + ItemRef["bibi:layout"]);
                }
            });
        });
    
        O.log(R.Items.length + " Item" + (R.Items.length > 1 ? "s" : "") + " in " + R.Spreads.length + " Spread" + (R.Spreads.length > 1 ? "s" : ""), "-*");
    
        O.log("Spine Prepared.", "/*");
    
    }
    
    
    loadNavigation() {
    
        if(B.Package.Manifest["nav"].Path) {
            I.Panel.BookInfo.Navigation.Path = B.Package.Manifest["nav"].Path;
            I.Panel.BookInfo.Navigation.Type = "Navigation Document";
        } else if(B.Package.Manifest["toc-ncx"].Path) {
            I.Panel.BookInfo.Navigation.Path = B.Package.Manifest["toc-ncx"].Path;
            I.Panel.BookInfo.Navigation.Type = "TOC-NCX";
        } 
    
        return new Promise(function(resolve, reject) {
            if(!I.Panel.BookInfo.Navigation.Type) {
                O.log("No Navigation Document or TOC-NCX.", "-*");
                return resolve();
            }
            O.log("Loading Navigation: " + B.Path + B.PathDelimiter + I.Panel.BookInfo.Navigation.Path + " ...", "*:");
            O.openDocument(I.Panel.BookInfo.Navigation.Path).then(function(Doc) {
                I.Panel.BookInfo.Navigation.innerHTML = "";
                var NavContent = document.createDocumentFragment();
                if(I.Panel.BookInfo.Navigation.Type == "Navigation Document") {
                    sML.each(Doc.querySelectorAll("nav"), () => {
                        switch(this.getAttribute("epub:type")) {
                        case "toc":       sML.addClass(this, "bibi-nav-toc"); break;
                        case "landmarks": sML.addClass(this, "bibi-nav-landmarks"); break;
                        case "page-list": sML.addClass(this, "bibi-nav-page-list"); break;
                        }
                        sML.each(this.querySelectorAll("*"), () => { this.removeAttribute("style"); });
                        NavContent.appendChild(this);
                    });
                } else {
                    var NavUL = (function(Ele) {
                        var ChildNodes = Ele.childNodes;
                        var UL = undefined;
                        for(var l = ChildNodes.length, i = 0; i < l; i++) {
                            if(ChildNodes[i].nodeType == 1 && /^navPoint$/i.test(ChildNodes[i].tagName)) {
                                var NavPoint = ChildNodes[i];
                                var NavLabel = NavPoint.getElementsByTagName("navLabel")[0];
                                var Content = NavPoint.getElementsByTagName("content")[0];
                                var Text = NavPoint.getElementsByTagName("text")[0];
                                if(!UL) UL = document.createElement("ul");
                                var LI = sML.create("li", { id: NavPoint.getAttribute("id") }); LI.setAttribute("playorder", NavPoint.getAttribute("playorder"));
                                var A = sML.create("a", { href: Content.getAttribute("src"), innerHTML: Text.innerHTML.trim() });
                                UL.appendChild(LI).appendChild(A);
                                var ChildUL = arguments.callee(NavPoint);
                                if(ChildUL) LI.appendChild(ChildUL);
                            }
                        }
                        return UL;
                    })(Doc.getElementsByTagName("navMap")[0]);
                    if(NavUL) NavContent.appendChild(document.createElement("nav")).appendChild(NavUL);
                }
                I.Panel.BookInfo.Navigation.appendChild(NavContent);
                I.Panel.BookInfo.Navigation.Body = I.Panel.BookInfo.Navigation;
                //delete NavContent; delete Doc;
                this.postprocessItem.coordinateLinkages(I.Panel.BookInfo.Navigation, "InNav");
                R.resetNavigation();
                O.log("Navigation Loaded.", "/*");
                resolve();
            });
        }).then(() => {
            E.dispatch("bibi:loaded-navigation", I.Panel.BookInfo.Navigation.Path);
        });
    
    }
    
    
    loadItemsInSpreads() {
        this.LoadingContentDescription = R.Items.length + " Items in " + (R.Spreads.length) + " Spreads" + (COMMENTS ? " (including 1 discussion page)" : ""),
        O.stamp("Load Items in Spreads"),
        O.log("Loading " + this.LoadingContentDescription + "...", "*:"),
        R.resetStage();
    
        R.Main.Book.style.opacity = 0,
        this.LoadedLowSources = 0,
        this.LoadedImages = 0,
        this.LoadedItems = 0;
        R.ToBeLaidOutLater = true;
        window.addEventListener("resize", this.listenResizingWhileLoading);
        Bibi.forEach(R.Items, (e, t) => {
            "extra" != e.ItemRef.idref ? this.loadItem(e) : this.loadExtraItem(e);
            e.HTML = e.Body = e.Content,
            e.id = "extra" != e.ItemRef.idref ? e.ItemRef.idref : "item-" + sML.String.pad(1 * R.Items[t - 1].ItemRef.idref.replace(/^item-/, "") + 1, 0, 3),
            e.Content.id = e.id.replace(/^item-/, "p-"),
            e.ItemBox.appendChild(e),
            e.contentDocument = {},
            e.contentDocument.addEventListener = e.contentDocument.removeEventListener = function() {}
            ;
            var n = e.ItemBox.appendChild(sML.create("span", {
                className: "page"
            }));
            n.Item = e,
            n.Spread = e.Spread,
            n.PageIndex = R.Pages.length,
            n.PageIndexInSpread = e.Spread.Pages.length,
            n.PageIndexInItem = e.Pages.length,
            R.Pages.push(n),
            e.Spread.Pages.push(n),
            e.Pages.push(n);
        }),
        this.SingleLeftItems = R.Main.Book.querySelectorAll(".item-box:first-child.page-spread-left > .item") || [],
        this.SingleRightItems = R.Main.Book.querySelectorAll(".item-box:last-child.page-spread-right > .item") || [],
        this.SingleCenterItems = R.Main.Book.querySelectorAll(".item-box:first-child:last-child.page-spread-center > .item") || [],
        Bibi.forEach(this.SingleLeftItems, function(e) {
            sML.addClass(e.Spread, "single-left-spread"),
            sML.addClass(e.Spread, "image-item-box");
        }),
        Bibi.forEach(this.SingleRightItems, function(e) {
            sML.addClass(e.Spread, "single-right-spread");
            sML.addClass(e.Spread, "image-item-box");
        }),
        Bibi.forEach(this.SingleCenterItems, function(e) {
            sML.addClass(e.Spread, "single-center-spread");
            sML.addClass(e.Spread, "image-item-box");
        });
    }
    
    
    preprocessResources() {
        return new Promise(function(resolve, reject) {
            if(B.Unzipped) {
                var FileExtensionRE = (() => {
                    if(sML.UA.Gecko || sML.UA.Edge) return /\.(xhtml|xml|html?|css)$/;
                    if(settings.S["preprocess-html-always"]) return /\.(xhtml|xml|html?)$/;
                    return null;
                })();
                if(!FileExtensionRE) return resolve();
                var FilesToBeLoaded = 0;
                for(var FilePath in B.Package.Manifest.Files) {
                    if(FileExtensionRE.test(FilePath)) {
                        B.Files[FilePath] = "";
                        FilesToBeLoaded++;
                    }
                }
                if(!FilesToBeLoaded) return resolve();
                var FilesLoaded = 0;
                for(var FilePath in B.Files) {
                    (function(FilePath) {
                        O.download(B.Path + "/" +  FilePath).then(function(XHR) {
                            B.Files[FilePath] = XHR.responseText;
                            FilesLoaded++;
                            if(FilesLoaded >= FilesToBeLoaded) return resolve("ToPreprocess");
                        });
                    })(FilePath);
                }
            } else {
                for(var FilePath in B.Files) if(typeof B.Package.Manifest.Files[FilePath] == "undefined") B.Files[FilePath] = "";
                resolve("ToPreprocess");
            }
        }).then(function(ToPreprocess) {
            if(!ToPreprocess) return;
            for(var Type in this.preprocessResources_Settings) if(this.preprocessResources_Settings[Type].init) this.preprocessResources_Settings[Type].init();
            E.dispatch("bibi:is-going-to:preprocess-resources");
            var Log = [];
            ["CSS", "SVG", "HTML"].forEach(function(Type) {
                var Count = 0;
                for(var FilePath in B.Files) {
                    if(!this.preprocessResources_Settings[Type].FileExtensionRE.test(FilePath)) continue;
                    this.preprocessResources_preprocessFile(FilePath, this.preprocessResources_Settings[Type]);
                    Count++;
                }
                if(Count) Log.push(Count + " " + Type + (Count >= 2 ? "s" : ""));
            });
            if(Log.length) O.log("Preprocessed " + Log.join(", "), "-*");
            this.Preprocessed = true;
            E.dispatch("bibi:preprocessed-resources");
        });
    }
    
    preprocessResources_preprocessFile(FilePath, Setting) {
        if(B.Files[FilePath].Preprocessed) return B.Files[FilePath];
        var FileContent = B.Files[FilePath];
        if(!B.Files[FilePath] || !Setting.FileExtensionRE.test(FilePath)) return FileContent;
        if(Setting.ReplaceRules) {
            Setting.ReplaceRules.forEach(function(ReplaceRule) {
                if(ReplaceRule) FileContent = FileContent.replace(ReplaceRule[0], ReplaceRule[1]);
            });
        }
        if(Setting.NestingRE) {
            var Nestings = FileContent.match(Setting.NestingRE);
            if(Nestings) {
                Nestings.forEach(function(Nesting) {
                    var NestingPath = O.getPath(FilePath.replace(/[^\/]+$/, ""), Nesting.replace(Setting.NestingRE, "$2"));
                    if(B.Files[NestingPath]) {
                        FileContent = FileContent.replace(
                            Nesting, Nesting.replace(
                                Setting.NestingRE, "$1" + O.getDataURI(NestingPath, this.preprocessResources_preprocessFile(NestingPath, Setting)) + "$3"
                            )
                        );
                    }
                });
            }
        }
        FileContent = this.preprocessResources_replaceResourceReferences(FilePath, FileContent, Setting);
        B.Files[FilePath] = FileContent.replace(/[\r\n]+/gm, "\n").trim();
        B.Files[FilePath].Preprocessed = true;
        return B.Files[FilePath];
    }
    
    
    preprocessResources_replaceResourceReferences(FilePath, FileContent, Setting) {
        if(!FileContent || !FilePath || !Setting || !Setting.ResAttributesAndExtensions) return FileContent;
        if(typeof Setting.getResMatchRE != "function") Setting.getResMatchRE = function(At) { return (new RegExp("<\\??[a-zA-Z1-6:\-]+[^>]*? " + At + "[ \t]*=[ \t]*['\"](?!(?:https?|data):)([^\"]+?)['\"]", "g")); };
        var FileDir = FilePath.replace(/\/?[^\/]+$/, "");
        for(var Attribute in Setting.ResAttributesAndExtensions) {
            var ResMatchRE = Setting.getResMatchRE(Attribute);
            var ResMatches = FileContent.match(ResMatchRE);
            if(ResMatches) {
                var ExtRE = new RegExp("\." + Setting.ResAttributesAndExtensions[Attribute] + "$", "i");
                ResMatches.forEach(function(Match) {
                    var ResPathInSource = Match.replace(ResMatchRE, "$1");
                    var ResPath = O.getPath(FileDir, (!/^(\.*\/+|#)/.test(ResPathInSource) ? "./" : "") + ResPathInSource);
                    var ResFilePathAndHash = ResPath.split("#");
                    var ResFilePath = ResFilePathAndHash[0];
                    if(ExtRE.test(ResFilePath)) {
                        if(B.Files[ResFilePath]) {
                            FileContent = FileContent.replace(Match, Match.replace(ResPathInSource, O.getDataURI(ResFilePath, B.Files[ResFilePath]) + (ResFilePathAndHash[1] ? "#" + ResFilePathAndHash[1] : "")));
                        } else {
                            FileContent = FileContent.replace(Match, Match.replace(ResPathInSource, B.Path + "/" + ResPath));
                        }
                    }
                });
            }
        }
        return FileContent;
    }
    
    
    loadSpread(Spread) {
        Spread.Loaded = false;
        Spread.LoadedItems = 0;
        Spread.Items.forEach(this.loadItem);
    }

    loadExtraItem(e) {
        e.Content = e.appendChild(sML.create("div", {
            className: "item-content extra-content",
            innerHTML: this.ExtraInnerHTML,
            Item: e
        }));
        sML.addClass(e.Spread.SpreadBox, "extra-spread-box");
        /*delete ComiCake.ExtraInnerHTML,
        ComiCake.Extra = e.Content,
        O.download("/" + (ComiCake["4pComics"] ? ComiCake.Book.Region + "/" : "") + ComiCake.Book.Category + "/" + ComiCake.Book.WorkID + "/meta.json").then(function(e) {
            e && ComiCake.applyMeta(e)
        })*/
    }
    
    loadItem(e) {
        e.ImageSource = e.Path;
        e.Loaded = false;
        e.TimeCard = {};
        e.stamp = (What) => { O.stamp(What, e.TimeCard); };

        var child = sML.create("img", {
            className: "item-content item-image",
            alt: ""
        });
        child.onload = () => {this.onLoadPlaceholder(e); };
        e.Content = e.appendChild(child);
        e.Content.src = PLACEHOLDER;
        /*e.Content.addEventListener("touchstart", function(e) {
            I.Swiper && e.touches.length >= 2 && I.Swiper.close()
        }),
        e.Content.addEventListener("touchend", function(e) {
            I.Swiper && I.Swiper.open()
        })*/
    }

    onLoadPlaceholder(e) {
        e.Loaded = true; // "Loaded"
        this.LoadedItems++;
        this.LoadedLowSources++;
        if(this.LoadedLowSources >= R.Items.length - 1){
            //O.log(ComiCake.LoadingContentDescription, "-*");
            //this.layOut();
        }
        0 == e.ItemIndex && this.loadImage(e); // Start load chain
    }

    loadImage(e) {
        var child = sML.create("img");
        child.src = cdn.image(e.ImageSource);
        child.onload = () => { this.onLoadImage(e); };
    }

    onLoadImage(e) {
        this.LoadedImages++;
        //E.dispatch("bibi:loaded-item", e);
        e.stamp("Loaded");
        sML.addClass(e.ItemBox, "image-item-box");
        sML.addClass(e, "image-item");
        e.Content.onload = function() {};
        e.Content.src = cdn.image(e.ImageSource);
        //this.layOut();
        e.ItemIndex + 1 < R.Items.length && setTimeout(() => { //  - 1 for old comments idea
            this.loadImage(R.Items[e.ItemIndex + 1]);
        }, 10),
        0 == e.ItemIndex && setTimeout(() => {
            R.Main.Book.style.opacity = "",
            this.onLoadItemsInSpreads();
        }, O.Mobile ? 99 : 1);
    }
    
    
    loadItem_writeItemHTML(Item, HTML, Head, Body) {
        Item.ItemBox.appendChild(Item);
        Item.contentDocument.open();
        Item.contentDocument.write(HTML ? HTML.replace(/^<\?.+?\?>/, "") : [
            "<!DOCTYPE html>",
            "<html>",
            "<head>" + Head + "</head>",
            "<body onload=\"setTimeout(() => { parent.L.postprocessItem(parent.R.Items[" + Item.ItemIndex + "]); document.body.removeAttribute('onload'); return false; }, 0);\">" + Body + "</body>",
            "</html>"
        ].join(""));
        Item.contentDocument.close();
    }
    
    
    postprocessItem(Item) {
    
        Item.stamp("Postprocess");
    
        Item.PostprocessTrialCount = Item.PostprocessTrialCount || 1;
    
        if(
            !Item.contentDocument.documentElement ||
            !Item.contentDocument.head ||
            !Item.contentDocument.body
        ) {
            if(Item.PostprocessTrialCount > 10) {
                return O.error("Faled to load an Item: " + Item.Path);
            } else {
                return setTimeout(() => {
                    Item.PostprocessTrialCount++;
                    this.postprocessItem(Item);
                }, 100);
            }
        }
    
        Item.HTML = Item.contentDocument.documentElement;
        Item.Head = Item.contentDocument.head;
        Item.Body = Item.contentDocument.body;
    
        Item.HTML.Item = Item.Head.Item = Item.Body.Item = Item;
    
        var XMLLang = Item.HTML.getAttribute("xml:lang"), Lang = Item.HTML.getAttribute("lang");
        if(!XMLLang && !Lang) Item.HTML.setAttribute("xml:lang", B.Language), Item.HTML.setAttribute("lang", B.Language);
        else if(!XMLLang         ) Item.HTML.setAttribute("xml:lang", Lang);
        else if(            !Lang)                                                 Item.HTML.setAttribute("lang", XMLLang);
    
        sML.addClass(Item.HTML, sML.Environments.join(" "));
        sML.each(Item.Body.querySelectorAll("link"), () => { Item.Head.appendChild(this); });
    
        if(settings.S["epub-additional-stylesheet"]) Item.Head.appendChild(sML.create("link",   { rel: "stylesheet", href: settings.S["epub-additional-stylesheet"] }));
        if(settings.S["epub-additional-script"])     Item.Head.appendChild(sML.create("script", { src: settings.S["epub-additional-script"] }));
    
        Item.StyleSheets = [];
        sML.appendStyleRule("html", "-webkit-text-size-adjust: 100%;", Item.contentDocument);
        sML.each(Item.HTML.querySelectorAll("link, style"), () => {
            if(/^link$/i.test(this.tagName)) {
                if(!/^(alternate )?stylesheet$/.test(this.rel)) return;
                if((sML.UA.Safari || sML.OS.iOS) && this.rel == "alternate stylesheet") return; //// Safari does not count "alternate stylesheet" in document.styleSheets.
            }
            Item.StyleSheets.push(this);
        });
    
        Item.BibiProperties = {};
        var BibiProperties = Item.HTML.getAttribute("data-bibi-properties");
        if(BibiProperties) {
            BibiProperties.replace(/[\s\t\r\n]+/g, " ").split(" ").forEach(function(Property) {
                if(Property) Item.BibiProperties[Property] = true;
            });
        }
    
        var Elements = Item.contentDocument.querySelectorAll("body>*");
        if(Elements && Elements.length) {
            var LengthOfElements = 0;
            for(var l = Elements.length, i = 0; i < l; i++) {
                if(!/^(script|style)$/i.test(Elements[i].tagName)) LengthOfElements++;
            }
            if(LengthOfElements == 1) {
                if(/^svg$/i.test(Item.Body.firstElementChild.tagName)) {
                    Item.Outsourcing = true;
                    Item.ImageItem = true;
                    Item.SingleSVGOnlyItem = true;
                } else if(/^img$/i.test(Item.Body.firstElementChild.tagName)) {
                    Item.Outsourcing = true;
                    Item.ImageItem = true;
                    Item.SingleIMGOnlyItem = true;
                } else if(/^iframe$/i.test(Item.Body.firstElementChild.tagName)) {
                    Item.Outsourcing = true;
                    Item.FrameItem = true;
                    Item.SingleFrameOnlyItem = true;
                } else if(!O.getElementInnerText(Item.Body)) {
                    if(Item.Body.querySelectorAll("img, svg, video, audio").length - Item.Body.querySelectorAll("svg img, video img, audio img").length == 1) {
                        Item.Outsourcing = true;
                        Item.ImageItem = true;
                    } else if(Item.Body.getElementsByTagName("iframe").length == 1) {
                        Item.Outsourcing = true;
                        Item.FrameItem = true;
                    }
                }
            }
        }
    
        E.dispatch("bibi:is-going-to:postprocess-item-content", Item);
    
        this.postprocessItem_processSVGs(Item);
        this.postprocessItem_defineViewport(Item);
        this.postprocessItem_coordinateLinkages(Item);
    
        new Promise(function(resolve, reject) {
            Item.CSSLoadingTimerID = setInterval(() => {
                if(Item.contentDocument.styleSheets.length < Item.StyleSheets.length) return;
                clearInterval(Item.CSSLoadingTimerID);
                this.postprocessItem_patchStyles(Item);
                resolve();
            }, 100);
        }).then(() => {
            E.dispatch("bibi:postprocessed-item-content", Item);
            E.dispatch("bibi:postprocessed-item", Item);
            this.onLoadItem(Item);
        });
    }
    
    
    postprocessItem_processSVGs(Item) {
        if(sML.UA.InternetExplorer) {
            sML.each(Item.Body.getElementsByTagName("svg"), () => {
                var ChildImages = this.getElementsByTagName("image");
                if(ChildImages.length == 1) {
                    var ChildImage = ChildImages[0];
                    if(ChildImage.getAttribute("width") && ChildImage.getAttribute("height")) {
                        this.setAttribute("width",  ChildImage.getAttribute("width"));
                        this.setAttribute("height", ChildImage.getAttribute("height"));
                    }
                }
            });
        }
    }
    
    
    postprocessItem_defineViewport(Item) {
        var ItemRef = Item.ItemRef;
        sML.each(Item.Head.getElementsByTagName("meta"), () => { // META Viewport
            if(this.name == "viewport") {
                ItemRef["viewport"].content = this.getAttribute("content");
                if(ItemRef["viewport"].content) {
                    var ViewportWidth  = ItemRef["viewport"].content.replace( /^.*?width=([^\, ]+).*$/, "$1") * 1;
                    var ViewportHeight = ItemRef["viewport"].content.replace(/^.*?height=([^\, ]+).*$/, "$1") * 1;
                    if(!isNaN(ViewportWidth) && !isNaN(ViewportHeight)) {
                        ItemRef["viewport"].width  = ViewportWidth;
                        ItemRef["viewport"].height = ViewportHeight;
                    }
                }
            }
        });
        if(ItemRef["rendition:layout"] == "pre-paginated" && !(ItemRef["viewport"].width * ItemRef["viewport"].height)) { // If Fixed-Layout Item without Viewport
            var ItemImage = Item.Body.firstElementChild;
            if(Item.SingleSVGOnlyItem) { // If Single-SVG-HTML or SVG-in-Spine, Use ViewBox for Viewport.
                if(ItemImage.getAttribute("viewBox")) {
                    ItemRef["viewBox"].content = ItemImage.getAttribute("viewBox");
                    var ViewBoxCoords  = ItemRef["viewBox"].content.split(" ");
                    if(ViewBoxCoords.length == 4) {
                        var ViewBoxWidth  = ViewBoxCoords[2] * 1 - ViewBoxCoords[0] * 1;
                        var ViewBoxHeight = ViewBoxCoords[3] * 1 - ViewBoxCoords[1] * 1;
                        if(ViewBoxWidth && ViewBoxHeight) {
                            if(ItemImage.getAttribute("width")  != "100%") ItemImage.setAttribute("width",  "100%");
                            if(ItemImage.getAttribute("height") != "100%") ItemImage.setAttribute("height", "100%");
                            ItemRef["viewport"].width  = ItemRef["viewBox"].width  = ViewBoxWidth;
                            ItemRef["viewport"].height = ItemRef["viewBox"].height = ViewBoxHeight;
                        }
                    }
                }
            } else if(Item.SingleIMGOnlyItem) { // If Single-IMG-HTML or Bitmap-in-Spine, Use IMG "width" / "height" for Viewport.
                ItemRef["viewport"].width  = parseInt(getComputedStyle(ItemImage).width);
                ItemRef["viewport"].height = parseInt(getComputedStyle(ItemImage).height);
            }
        }
    }
    
    
    postprocessItem_coordinateLinkages(Item, InNav) {
        var Path = Item.Path;
        var RootElement = Item.Body;
        sML.each(RootElement.getElementsByTagName("a"), function(i) {
            var A = this;
            if(InNav) {
                A.NavANumber = i + 1;
                A.addEventListener(O["pointerdown"], function(Eve) { Eve.stopPropagation(); });
                A.addEventListener(O["pointerup"],   function(Eve) { Eve.stopPropagation(); });
            }
            var HrefPathInSource = A.getAttribute("href");
            if(!HrefPathInSource) {
                if(InNav) {
                    A.addEventListener("click", function(Eve) { Eve.preventDefault(); Eve.stopPropagation(); return false; });
                    sML.addClass(A, "bibi-bookinfo-inactive-link");
                }
                return;
            }
            if(/^[a-zA-Z]+:/.test(HrefPathInSource)) {
                if(HrefPathInSource.split("#")[0] == location.href.split("#")[0]) {
                    var HrefHashInSource = HrefPathInSource.split("#")[1];
                    HrefPathInSource = (HrefHashInSource ? "#" + HrefHashInSource : R.Items[0].Path);
                } else {
                    return A.setAttribute("target", A.getAttribute("target") || "_blank");
                }
            }
            var HrefPath = O.getPath(Path.replace(/\/?([^\/]+)$/, ""), (!/^\.*\/+/.test(HrefPathInSource) ? "./" : "") + (/^#/.test(HrefPathInSource) ? Path.replace(/^.+?([^\/]+)$/, "$1") : "") + HrefPathInSource);
            var HrefFnH = HrefPath.split("#");
            var HrefFile = HrefFnH[0] ? HrefFnH[0] : Path;
            var HrefHash = HrefFnH[1] ? HrefFnH[1] : "";
            R.Items.forEach(function(rItem) {
                if(HrefFile == rItem.Path) {
                    A.setAttribute("data-bibi-original-href", HrefPathInSource);
                    A.setAttribute("href", "bibi://" + B.Path.replace(/^\w+:\/\//, "") + B.PathDelimiter + HrefPath);
                    A.InNav = InNav;
                    A.Destination = {
                        Item: rItem,
                        ElementSelector: (HrefHash ? "#" + HrefHash : undefined)
                    };
                    this.postprocessItem_coordinateLinkages_setJump(A);
                    return;
                }
            });
            if(HrefHash && /^epubcfi\(.+\)$/.test(HrefHash)) {
                A.setAttribute("data-bibi-original-href", HrefPathInSource);
                if(X["EPUBCFI"]) {
                    A.setAttribute("href", "bibi://" + B.Path.replace(/^\w+:\/\//, "") + B.PathDelimiter + "#" + HrefHash);
                    A.InNav = InNav;
                    A.Destination = X["EPUBCFI"].getDestination(HrefHash);
                    this.postprocessItem_coordinateLinkages_setJump(A);
                } else {
                    A.removeAttribute("href");
                    A.addEventListener("click", () => { return false; });
                    if(!O.Mobile) {
                        A.addEventListener(O["pointerover"], () => { I.Help.show("(This link uses EPUBCFI. BiB/i needs the extension.)"); return false; });
                        A.addEventListener(O["pointerout"],  () => { I.Help.hide(); return false; });
                    }
                }
            }
            if(InNav && typeof settings.S["nav"] == (i + 1) && A.Destination) settings.S["to"] = A.Destination;
        });
    }
    
    postprocessItem_coordinateLinkages_setJump(A) {
        A.addEventListener("click", (Eve) => {
            Eve.preventDefault(); 
            Eve.stopPropagation();
            if(A.Destination) {
                var Go = this.Opened ? () => {
                    E.dispatch("bibi:commands:focus-on", { Destination: A.Destination, Duration: 0 });
                } : () => {
                    if(settings.S["start-in-new-window"]) return window.open(location.href + (location.hash ? "," : "#") + "pipi(nav:" + A.NavANumber + ")");
                    settings.S["to"] = A.Destination;
                    this.play();
                };
                A.InNav ? I.Panel.toggle({ callback: Go }) : Go();
            }
            return false;
        });
        /*
        A.addEventListener(O["pointerdown"], function(Eve) {
            Eve.preventDefault(); 
            Eve.stopPropagation();
            return false;
        });
        */
    }
    
    
    postprocessItem_patchStyles(Item) {
    
        if(!this.Preprocessed) {
            if(sML.UA.InternetExplorer) {
                if(!B.Unzipped) return false;
                var IsCJK = /^(zho?|chi|kor?|ja|jpn)$/.test(B.Language);
                O.editCSSRules(Item.contentDocument, function(CSSRule) {
                    if(/(-(epub|webkit)-)?writing-mode: vertical-rl; /.test(  CSSRule.cssText)) CSSRule.style.writingMode = "tb-rl";
                    if(/(-(epub|webkit)-)?writing-mode: vertical-lr; /.test(  CSSRule.cssText)) CSSRule.style.writingMode = "tb-lr";
                    if(/(-(epub|webkit)-)?writing-mode: horizontal-tb; /.test(CSSRule.cssText)) CSSRule.style.writingMode = "lr-tb";
                    if(/(-(epub|webkit)-)?(text-combine-upright|text-combine-horizontal): all; /.test(CSSRule.cssText)) CSSRule.style.msTextCombineHorizontal = "all";
                    if(IsCJK && / text-align: justify; /.test(CSSRule.cssText)) CSSRule.style.textJustify = "inter-ideograph";
                });
            } else {
                O.editCSSRules(Item.contentDocument, function(CSSRule) {
                    if(/(-(epub|webkit)-)?column-count: 1; /.test(CSSRule.cssText)) CSSRule.style.columnCount = CSSRule.style.webkitColumnCount = CSSRule.style.epubColumnCount = "auto";
                });
            }
        }
        if(sML.UA.Gecko) {
            Array.prototype.forEach.call(Item.Body.getElementsByTagName("a"), function(A) {
                var ComputedStyle = getComputedStyle(A);
                if(/^vertical-/.test(ComputedStyle.writingMode)) {
                    if(ComputedStyle.textDecoration ==  "overline") A.style.textDecoration = "underline";
                    else if(ComputedStyle.textDecoration == "underline") A.style.textDecoration =  "overline";
                }
            });
        }
    
        var ItemHTMLComputedStyle = getComputedStyle(Item.HTML);
        var ItemBodyComputedStyle = getComputedStyle(Item.Body);
        if(ItemHTMLComputedStyle[O.WritingModeProperty] != ItemBodyComputedStyle[O.WritingModeProperty]) {
            sML.style(Item.HTML, {
                "writing-mode": ItemBodyComputedStyle[O.WritingModeProperty]
            });
        }
        Item.HTML.WritingMode = O.getWritingMode(Item.HTML);
        sML.addClass(Item.HTML, "writing-mode-" + Item.HTML.WritingMode);
        if(/-rl$/.test(Item.HTML.WritingMode)) if(ItemBodyComputedStyle.marginLeft != ItemBodyComputedStyle.marginRight) Item.Body.style.marginLeft = ItemBodyComputedStyle.marginRight;
        else if(/-lr$/.test(Item.HTML.WritingMode)) if(ItemBodyComputedStyle.marginRight != ItemBodyComputedStyle.marginLeft) Item.Body.style.marginRight = ItemBodyComputedStyle.marginLeft;
        else                                        if(ItemBodyComputedStyle.marginBottom != ItemBodyComputedStyle.marginTop) Item.Body.style.marginBottom = ItemBodyComputedStyle.marginTop;
        if(Item.HTML.style) { sML.style(Item.ItemBox, this.postprocessItem_patchStyles_getBackgroundStyle(Item.HTML)); Item.HTML.style.background = "transparent"; }
        if(Item.Body.style) { sML.style(Item,         this.postprocessItem_patchStyles_getBackgroundStyle(Item.Body)); Item.Body.style.background = "transparent"; }
        sML.each(Item.Body.getElementsByTagName("img"), () => {
            this.Bibi = {
                DefaultStyle: {
                    "margin":            (this.style.margin          ? this.style.margin          : ""),
                    "width":             (this.style.width           ? this.style.width           : ""),
                    "height":            (this.style.height          ? this.style.height          : ""),
                    "vertical-align":    (this.style.verticalAlign   ? this.style.verticalAlign   : ""),
                    "page-break-before": (this.style.pageBreakBefore ? this.style.pageBreakBefore : ""),
                    "page-break-after":  (this.style.pageBreakAfter  ? this.style.pageBreakAfter  : "")
                }
            };
        });
    }
    
    postprocessItem_patchStyles_getBackgroundStyle(Ele) {
        var ComputedStyle = getComputedStyle(Ele);
        return {
            backgroundColor: ComputedStyle.backgroundColor,
            backgroundImage: ComputedStyle.backgroundImage,
            backgroundRepeat: ComputedStyle.backgroundRepeat,
            backgroundPosition: ComputedStyle.backgroundPosition,
            backgroundSize: ComputedStyle.backgroundSize
        };
    }
    
    
    onLoadItem(Item) {
        Item.Loaded = true;
        this.LoadedItems++;
        if(Item.ImageItem) {
            sML.addClass(Item.ItemBox, "image-item-box");
            sML.addClass(Item, "image-item");
        }
        E.dispatch("bibi:loaded-item", Item);
        Item.stamp("Loaded");
        var Spread = Item.Spread;
        Spread.LoadedItems++;
        if(Spread.LoadedItems == Spread.Items.length) this.onLoadSpread(Spread);
        I.note("Loading... (" + (this.LoadedItems) + "/" + R.Items.length + " Items Loaded.)");
    }
    
    
    onLoadSpread(Spread) {
        this.LoadedSpreads++;
        Spread.ImageSpread = true;
        Spread.Items.forEach(function(Item) {
            if(!Item.ImageItem) Spread.ImageSpread = false;
        });
        if(Spread.ImageSpread) {
            sML.addClass(Spread.SpreadBox, "image-spread-box");
            sML.addClass(Spread, "image-spread");
        }
        E.dispatch("bibi:loaded-spread", Spread);
        if(!R.ToBeLaidOutLater) R.resetSpread(Spread);
        if(this.LoadedSpreads == R.Spreads.length) this.onLoadItemsInSpreads();
    }
    
    
    onLoadItemsInSpreads() {
        B.Files = {};
        //R.resetPages();
        O.stamp("Items in Spreads Loaded"),
        O.log(this.LoadingContentDescription + " Loaded.", "/*"),
        delete this.LoadingContentDescription,
        E.dispatch("bibi:loaded-items"),
        E.dispatch("bibi:loaded-spreads"),
        E.dispatch("bibi:loaded-items-in-spreads"),
        //this.ScrollCoordsNeedToBeTreated = this.detectThatScrollCoordsNeedToBeTreated(),
        this.Preprocessed = true;
        E.dispatch("bibi:preprocessed-resources");
        I.setUIState(I.Menu.Config.SubPanel.WindowSection.ButtonGroup.children[0].children[0], settings.S.FSP ? "active" : "default");
        this.onLoadBook();
    }
    
    
    onLoadBook() {
    
        this.Loaded = true;
        O.Busy = false;
        sML.removeClass(O.HTML, "busy");
        sML.removeClass(O.HTML, "loading");
    
        O.stamp("Book Loaded");
        //O.log("Book Loaded.", "/*");
        E.dispatch("bibi:loaded-book");
    
        this.open();
    }
    
    
    open() {
    
        window.removeEventListener("resize", this.listenResizingWhileLoading);
        delete this.listenResizingWhileLoading;

        R.updateOrientation();
        R.layOut({
            Destination: (() => {
                if(settings.S["to"]) {
                    var HatchedDestination = R.focusOn_hatchDestination(settings.S["to"]);
                    if(HatchedDestination) return HatchedDestination;
                }
                return "head";
            })()
        });
    
        R.getCurrent();
    
        E.dispatch("bibi:laid-out:for-the-first-time");
    
        setTimeout(() => {
            if(I.Veil) I.Veil.close();
            setTimeout(() => {
                if(I.Menu) I.Menu.close();
                if(I.Slider) I.Slider.close();
            }, 888);
            document.body.click(); // To responce for user scrolling/keypressing immediately
            this.Opened = true;
            I.note("");
            E.dispatch("bibi:opened");
            O.stamp("Enjoy");
            //O.log("Enjoy Readings!", "-0"); // No fun allowed
        }, 1);
    }
}

export default (new L);