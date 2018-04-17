/* global B O E L M P R S U I X sML Bibi */
// TODO: separate this shit up a little, I mean look at the size of this file...
define(["vendor/stimulus.umd", "vendor/turbolinks", "constants", "vendor/axios", "vendor/mustache", "Bibi", "cdn"],
    function (Stimulus, turbolinks, constants, axios, Mustache, _Bibi, cdn) {
        class Reader extends Stimulus.Controller {
            static get targets() {
                return ["hamburger"];
            }

            forEach(e, t) {
                return Array.prototype.forEach.call(e, t);
            }

            openPanel() {
                if(this.hasChapters)
                    return;
                console.log("Fetching chapters for nav display");
                /*axios.get(constants.API_BASE + "/comics/", {
                    params: {
                        search: query
                    }
                }).then(function (response) {
                    console.log(response.data);
                    E.dispatch("bibi:loaded-navigation", "lol");
                }).catch(function (error) {
                    console.error(error);
                    _this.suggestionAllowed = false; // Kill to prevent hammering with errors
                });*/
                this.hasChapters = true;
            }

            welcome() {
                O.stamp("Welcome!");
                O.log("Welcome! - ComiCake Reader v" + constants.READER_VERSION + " powered by BiB/i v" + Bibi["version"] + " (" + Bibi["build"] + ") ", "-0");
                E.dispatch("bibi:says-welcome");
            
                O.RequestedURL = location.href;
                O.BookURL = O.Origin + location.pathname + location.search;
            
                O.Language = (function() {
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
                    if(sML.OS.iOS) {
                        O.Head.appendChild(sML.create("meta", { name: "apple-mobile-web-app-capable",          content: "yes"   }));
                        O.Head.appendChild(sML.create("meta", { name: "apple-mobile-web-app-status-bar-style", content: "white" }));
                    }
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
            
                this.init();
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

            init() {
                // Reader
                R.initialize();

                // UI
                //I.initialize();

                I.createNotifier();
                I.createVeil();

                E.bind("bibi:prepared", function() {
                    if(!(O.Mobile && S.RVM == "vertical"))
                        I.createNombre();
                    I.createSlider();
                    // Custom cool vertical slider
                    sML.appendStyleRule([
                        "html.Blink.view-vertical div#bibi-slider, html.WebKit.view-vertical div#bibi-slider"
                    ].join(", "), "width: 10px;");

                    I.createArrows();
                    I.createKeyListener();
                    I.createSwiper();
                    I.createSpinner();
                });

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
                // U.initialize();
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
                    } catch(e) { console.error(e); }
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
                S.initialize();

                sML.removeClass(O.HTML, "welcome");

                // Ready ?
                var PromiseForLoadingExtensions = new Promise(function(resolve) { //, reject
                    return (P.X.length) ? X.loadFilesInPreset().then(resolve) : resolve();
                });
                PromiseForLoadingExtensions.then(function() {
                    E.add("bibi:commands:move-by",     function(Par) { R.moveBy(Par); });
                    E.add("bibi:commands:scroll-by",   function(Par) { R.scrollBy(Par); });
                    E.add("bibi:commands:focus-on",    function(Par) { R.focusOn(Par); });
                    E.add("bibi:commands:change-view", function(RVM) { R.changeView(RVM); });
                    window.addEventListener("message", M.gate, false);
                    this.ready();
                }.bind(this));
            }

            ready() {
                //O.HTML.className = O.HTML.className + " js"; Modernizer substitute
                sML.addClass(O.HTML, "ready");
            
                E.add("bibi:readied", function() {
                    sML.removeClass(O.HTML, "ready");
                    if(S["use-cookie"]) {
                        var BibiCookie = O.Cookie.remember(O.RootPath);
                        if(BibiCookie) {
                            if(BibiCookie["force-single-page"])
                                S.FSP = true;
                            else
                                S.FSP = false; // Force Single Page
                        }
                    }
                    //P["trustworthy-origins"].push("https://yrkz.localtunnel.me"); // O.Origin
                    this.loadBook({ Path: this.bookManifestUrl });
                    // TODO promise then and catch for above function
                }.bind(this));
            
                setTimeout(function() { E.dispatch("bibi:readied"); }, (O.Mobile ? 999 : 1));
                I.createPanel();
                I.Panel.Labels = {
                    default: { default: "Open this Index", ja: "この目次を開く" },
                    active: { default: "Close this Index", ja: "この目次を閉じる" }
                };
                this.createMenu();
                I.createHelp();
                this.createPoweredBy();
            
                O.ReadiedURL = location.href;
            }

            loadBook(PathOrData) {
                B.initialize();
                R.reset();
                L.Preprocessed = false;
                L.Loaded = false;
                O.Busy = true;
                sML.addClass(O.HTML, "busy");
                sML.addClass(O.HTML, "loading");
                I.note("Loading...");
                O.log("Initializing Chapter...", "*:");
                return new Promise(function(resolve, reject) {
                    L.loadBook.resolve = function() { resolve.apply(L.loadBook, arguments); delete L.loadBook.resolve; delete L.loadBook.reject; };
                    L.loadBook.reject  = function() {
                        reject.apply(L.loadBook, arguments);
                        delete L.loadBook.resolve;
                        delete L.loadBook.reject;
                        I.Veil.Cover.className = "";
                        console.error("Epic Fail");
                    };
                    if(PathOrData.Path) {
                        // Online
                        if(!constants.DEBUG && !P["trustworthy-origins"].includes(PathOrData.Path.replace(/^([\w\d]+:\/\/[^/]+).*$/, "$1")))
                            return L.loadBook.reject("The Origin of the Path of the Book Is Not Allowed.");
                        B.Path = PathOrData.Path;
                        axios.get(B.Path).then(function(e) {
                            this.manifest = e.data;
                            // Online Manifest
                            B.Unzipped = true; // Satisfy our Satoru overlords
                            O.log("Comic: " + B.Path + " (WebPub Manifest)", "-*");
                            L.loadBook.resolve();
                        }.bind(this)).catch(function (error) {
                            // Failed to load the manifest, daihen!
                            L.loadBook.reject("Failed to load manifest: " + error);
                        }.bind(this));
                    } else {
                        L.loadBook.reject("WebPub Manifest Location not specified...Weird");
                    }
                }.bind(this)).then(function() {
                    B.PathDelimiter = B.Unzipped ? "/" : " > ";
                    O.log("Book Initialized.", "/*");
                    this.processPackageDocument(this.manifest);
                    /*if(S.RVM != "vertical") {
                        clearTimeout(I.Menu.Timer_cool);
                        I.Menu.Timer_cool = setTimeout(function() {
                            I.Menu.Hot = false;
                            sML.removeClass(I.Menu, "hot");
                            sML.removeClass(I.Menu, "hover");
                        }, 3000);
                    } else {                        
                    }*/
                }.bind(this)).catch(function(ErrorMessage) {
                    I.note(ErrorMessage, 99999999999, "ErrorOccured");
                    O.error(ErrorMessage);
                    //console.log(ErrorMessage); // TODO REMOVE
                    return false;
                });
            }

            processPackageDocument(Doc) {
                B.Package.Metadata["rendition:layout"] = "pre-paginated",
                B.Package.Metadata["rendition:orientation"] = "portrait", // I think this is right?
                B.Package.Metadata["rendition:spread"] = "landscape", // TODO
                B.Package.Spine["page-progression-direction"] = "rtl", // TODO
                B.Package.Manifest["cover-image"].Path = Doc.metadata.image;
                B.Language = Doc.metadata.language;
                B.ID = Doc.metadata.identifier,
                B.Title = Doc.metadata.subtitle;
                var parr = [];
                sML.each(Doc.metadata.publisher, function(publisher) {
                    parr.push(publisher.name);
                });
                B.Publisher = parr.join(", ");
                var carr = [];
                sML.each(Doc.metadata.author, function(person) {
                    carr.push(person.name);
                });
                sML.each(Doc.metadata.artist, function(person) {
                    if(carr.indexOf(person.name) == -1)
                        carr.push(person.name);
                });
                B.Creator = parr.join(", "),
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
                L.LoadedSpreads = 0;
                this.forEach(Doc.spine, function(e, t) {
                    var n = "item-" + sML.String.pad(t + 1, 0, 3);
                    //console.log(n);
                    //var o = t % 2 ? "right" : "left";
                    var o = constants.CREDITS ? (t % 2 ? "left" : "right") : (t % 2 ? "right" : "left");
                    if(S.FSP) {
                        o = "center";
                    }
                    //B.Package.Manifest.items[n] = {
                    B.Package.Manifest.items[n] = e;
                    if(constants.CREDITS && t == 1) { // Adjust cover page size
                        var wratio = Doc.spine[t - 1].width / e.width;
                        e.width = Doc.spine[t - 1].width;
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
                    if(!(t % 2) || S.FSP) 
                        L.LoadedSpreads ++;
                }.bind(constants));
                //var discPageNum = Object.keys(B.Package.Manifest.items).length + 1;
                //console.log("DPN: " + discPageNum);
                //var n = "item-" + sML.String.pad(discPageNum, 0, 3);
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
                //if(constants.CREDITS)
                //    L.LoadedSpreads ++;
                
                if(B.Title && false) {
                    var BookIDFragments = [B.Title];
                    if(B.Creator)   BookIDFragments.push(B.Creator);
                    if(B.Publisher) BookIDFragments.push(B.Publisher);
                    BookIDFragments = BookIDFragments.join(" - ").replace(/&amp;?/gi, "&").replace(/&lt;?/gi, "<").replace(/&gt;?/gi, ">");
                    O.Title.innerHTML = "";
                    O.Title.appendChild(document.createTextNode(BookIDFragments + " | " + (S["website-name-in-title"] ? S["website-name-in-title"] : "BiB/i")));
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
                if(S["use-cookie"]) {
                    var BibiCookie = O.Cookie.remember(O.RootPath);
                    var BookCookie = O.Cookie.remember(B.ID);
                    if(BibiCookie) {
                        if(!U["reader-view-mode"] && BibiCookie.RVM) {
                            S["reader-view-mode"] = BibiCookie.RVM;
                            vSet = true;
                        }
                    }
                    if(BookCookie) {
                        if(!U["to"] && BookCookie.Position) S["to"] = BookCookie.Position;
                    }
                }
                if(!vSet && O.Mobile && (S["reader-view-mode"] != S["reader-view-mode-mobile"])) {
                    S["reader-view-mode"] = S["reader-view-mode-mobile"];
                }
                S.update(),
                E.dispatch("bibi:loaded-package-document");
                this.createCover();
                L.prepareSpine(function() {
                    return document.createElement("div");
                }),
                /*L.loadNavigation().then(function() { // Taken care of by framework
                    E.dispatch("bibi:prepared");
                    L.loadItemsInSpreads();
                });*/
                E.dispatch("bibi:prepared");
                this.loadItemsInSpreads();
            }

            loadItemsInSpreads() {
                this.LoadingContentDescription = R.Items.length + " Items in " + (R.Spreads.length) + " Spreads" + constants.COMMENTS ? " (including 1 discussion page)" : "",
                O.stamp("Load Items in Spreads"),
                O.log("Loading " + this.LoadingContentDescription + "...", "*:"),
                R.resetStage();
            
                R.Main.Book.style.opacity = 0,
                this.LoadedLowSources = 0,
                this.LoadedImages = 0,
                L.LoadedItems = 0;
                R.ToBeLaidOutLater = true;
                window.addEventListener("resize", L.listenResizingWhileLoading);
                this.forEach(R.Items, function(e, t) {
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
                }.bind(this)),
                this.SingleLeftItems = R.Main.Book.querySelectorAll(".item-box:first-child.page-spread-left > .item") || [],
                this.SingleRightItems = R.Main.Book.querySelectorAll(".item-box:last-child.page-spread-right > .item") || [],
                this.SingleCenterItems = R.Main.Book.querySelectorAll(".item-box:first-child:last-child.page-spread-center > .item") || [],
                this.forEach(this.SingleLeftItems, function(e) {
                    sML.addClass(e.Spread, "single-left-spread"),
                    sML.addClass(e.Spread, "image-item-box");
                }),
                this.forEach(this.SingleRightItems, function(e) {
                    sML.addClass(e.Spread, "single-right-spread");
                    sML.addClass(e.Spread, "image-item-box");
                }),
                this.forEach(this.SingleCenterItems, function(e) {
                    sML.addClass(e.Spread, "single-center-spread");
                    sML.addClass(e.Spread, "image-item-box");
                });
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
                e.stamp = function(What) { O.stamp(What, e.TimeCard); };

                var child = sML.create("img", {
                    className: "item-content item-image",
                    alt: ""
                });
                child.onload = function() {this.onLoadPlaceholder(e); }.bind(this);
                e.Content = e.appendChild(child);
                e.Content.src = constants.PLACEHOLDER;
                /*e.Content.addEventListener("touchstart", function(e) {
                    I.Swiper && e.touches.length >= 2 && I.Swiper.close()
                }),
                e.Content.addEventListener("touchend", function(e) {
                    I.Swiper && I.Swiper.open()
                })*/
            }

            onLoadPlaceholder(e) {
                e.Loaded = true; // "Loaded"
                L.LoadedItems++;
                this.LoadedLowSources++;
                if(this.LoadedLowSources >= R.Items.length - 1){
                    //O.log(ComiCake.LoadingContentDescription, "-*");
                    //this.layOut();
                }
                0 == e.ItemIndex && this.loadImage(e);
            }
            
            loadImage(e) {
                var child = sML.create("img");
                child.src = cdn.image(e.ImageSource);
                child.onload = function() { this.onLoadImage(e); }.bind(this);
            }

            onLoadImage(e) {
                this.LoadedImages++;
                //E.dispatch("bibi:loaded-item", e);
                e.stamp("Loaded");
                sML.addClass(e.ItemBox, "image-item-box");
                sML.addClass(e, "image-item");
                e.Content.onload = function() {};
                e.Content.src = e.ImageSource;
                //this.layOut();
                e.ItemIndex + 1 < R.Items.length - 1 && setTimeout(function() {
                    this.loadImage(R.Items[e.ItemIndex + 1]);
                }.bind(this), 10),
                0 == e.ItemIndex && setTimeout(function() {
                    R.Main.Book.style.opacity = "",
                    this.onLoadItemsInSpreads();
                }.bind(this), O.Mobile ? 99 : 1);
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
                L.Preprocessed = true;
                E.dispatch("bibi:preprocessed-resources");
                I.setUIState(I.Menu.Config.SubPanel.WindowSection.ButtonGroup.children[0].children[0], S.FSP ? "active" : "default");
                L.onLoadBook();
            }

            resetItemasPrePaginatedItem(Item) {
                var /*ItemIndex = Item.ItemIndex, */ItemRef = Item.ItemRef, ItemBox = Item.ItemBox, Spread = Item.Spread;
                Item.HTML.style.margin = Item.HTML.style.padding = Item.Body.style.margin = Item.Body.style.padding = 0;
                var StageB = R.Stage[S.SIZE.B];
                var StageL = R.Stage[S.SIZE.L];
                var PageB = StageB;
                var PageL = StageL;
                Item.style.padding = 0;
                var Scale;
                if(Item.Scale) {
                    Scale = Item.Scale;
                    delete Item.Scale;
                } else {
                    Scale = 1;
                    if(R.Stage.Orientation == ItemRef["rendition:spread"] || ItemRef["rendition:spread"] == "both") {
                        var SpreadViewPort = { Width: ItemRef["viewport"].width, Height: ItemRef["viewport"].height };
                        if(Item.SpreadPair) SpreadViewPort.Width += Item.SpreadPair.ItemRef["viewport"].width;
                        else if(ItemRef["page-spread"] == "right" || ItemRef["page-spread"] == "left") SpreadViewPort.Width += SpreadViewPort.Width;
                        Scale = Math.min(
                            PageB / SpreadViewPort[S.SIZE.B],
                            PageL / SpreadViewPort[S.SIZE.L]
                        );
                    } else {
                        Scale = Math.min(
                            PageB / ItemRef["viewport"][S.SIZE.b],
                            PageL / ItemRef["viewport"][S.SIZE.l]
                        );
                    }
                    if(Item.SpreadPair) Item.SpreadPair.Scale = Scale;
                }
                var SO /*= ScaleOptimizing*/ = 1 / Scale;
                PageL = Math.floor(ItemRef["viewport"][S.SIZE.l] * Scale);
                PageB = Math.floor(ItemRef["viewport"][S.SIZE.b] * (PageL / ItemRef["viewport"][S.SIZE.l]));
                ItemBox.style[S.SIZE.l] = PageL      + "px";
                ItemBox.style[S.SIZE.b] = PageB      + "px";
                Item.style[S.SIZE.l] = PageL * SO + "px";
                Item.style[S.SIZE.b] = PageB * SO + "px";
                var TransformOrigin = (/rl/.test(Item.HTML.WritingMode)) ? "100% 0" : "0 0";
                sML.style(Item.HTML, {
                    "width": ItemRef["viewport"].width + "px",
                    "height": ItemRef["viewport"].height + "px",
                    "transform-origin": TransformOrigin,
                    "transformOrigin": TransformOrigin,
                    "transform": "scale(" + (Scale * SO) + ")"
                });
                sML.style(Item, {
                    "transform-origin": "0 0",
                    "transformOrigin": "0 0",
                    "transform": "scale(" + (1 / SO) + ")"
                });
                var Page = ItemBox.appendChild(sML.create("span", { className: "page" }));
                if(ItemRef["page-spread"] == "right") Page.style.right = 0;
                else                                  Page.style.left  = 0;
                Page.style[S.SIZE.b] = PageB + "px";
                Page.style[S.SIZE.l] = PageL + "px";
                Page.Item = Item, Page.Spread = Spread;
                Page.PageIndexInItem = Item.Pages.length;
                Item.Pages.push(Page);
                return Item;
            }
            
            layOutSpread(Spread) {
                O.stamp("Lay Out Spread " + Spread.SpreadIndex + " Start");
                E.dispatch("bibi:is-going-to:lay-out-spread", Spread);
                var SpreadBox = Spread.SpreadBox;
                SpreadBox.style.padding = "";
                SpreadBox.PaddingBefore = SpreadBox.PaddingAfter = 0;
                if(S.SLA == "horizontal") {
                    // Set padding-start + padding-end of SpreadBox
                    if(SpreadBox.offsetHeight < R.Stage[S.SIZE.B]) {
                        var SpreadBoxPaddingTop    = Math.floor((R.Stage[S.SIZE.B] - SpreadBox.offsetHeight) / 2);
                        var SpreadBoxPaddingBottom = R.Stage[S.SIZE.B] - (SpreadBoxPaddingTop + SpreadBox.offsetHeight);
                        SpreadBox.style.paddingTop    = SpreadBoxPaddingTop + "px";
                        SpreadBox.style.paddingBottom = SpreadBoxPaddingBottom + "px";
                    }
                }
                if(S.BRL == "pre-paginated") {
                    if(R.Stage[S.SIZE.L] >= SpreadBox["offset" + S.SIZE.L]) {
                        SpreadBox.PaddingBefore = SpreadBox.PaddingAfter = Math.ceil((R.Stage[S.SIZE.L] - SpreadBox["offset" + S.SIZE.L]) / 2);
                    } else {
                        var FirstItemInSpread = Spread.Items[0];
                        if(R.Stage[S.SIZE.L] >= FirstItemInSpread["offset" + S.SIZE.L]) {
                            SpreadBox.PaddingBefore = Math.ceil((R.Stage[S.SIZE.L] - FirstItemInSpread["offset" + S.SIZE.L]) / 2);
                        }
                        var LastItemInSpread = Spread.Items[Spread.Items.length - 1];
                        if(R.Stage[S.SIZE.L] >= LastItemInSpread["offset" + S.SIZE.L]) {
                            SpreadBox.PaddingAfter = Math.ceil((R.Stage[S.SIZE.L] - LastItemInSpread["offset" + S.SIZE.L]) / 2);
                        }
                    }
                    if(Spread.SpreadIndex != 0) {
                        var PreviousSpreadBox = R.Spreads[Spread.SpreadIndex - 1].SpreadBox;
                        SpreadBox.PaddingBefore = SpreadBox.PaddingBefore - PreviousSpreadBox.PaddingAfter;
                        if(SpreadBox.PaddingBefore < I.Menu.offsetHeight) SpreadBox.PaddingBefore = I.Menu.offsetHeight;
                    }
                    if(S.RVM == "vertical") { // No vertical padding
                        if(Spread.SpreadIndex == 0)
                            SpreadBox.PaddingBefore = 64;
                        else
                            SpreadBox.PaddingBefore = 0;
                        SpreadBox.PaddingAfter = 0;
                    }
                } else if(S.RVM == "paged") {
                    if(Spread.SpreadIndex == 0) {
                        //
                    } else {
                        SpreadBox.PaddingBefore = R.Stage.PageGap;
                    }
                } else {
                    if(Spread.SpreadIndex == 0) {
                        SpreadBox.PaddingBefore = Math.floor((R.Stage[S.SIZE.L] - SpreadBox["offset" + S.SIZE.L]) / 2);
                    } else {
                        SpreadBox.PaddingBefore = R.Stage.PageGap;
                    }
                    if(Spread.SpreadIndex == R.Spreads.length - 1) {
                        SpreadBox.PaddingAfter  = Math.ceil( (R.Stage[S.SIZE.L] - SpreadBox["offset" + S.SIZE.L]) / 2);
                    }
                }
                if(SpreadBox.PaddingBefore > 0) SpreadBox.style["padding" + S.BASE.B] = SpreadBox.PaddingBefore + "px";
                if(SpreadBox.PaddingAfter  > 0) SpreadBox.style["padding" + S.BASE.A] = SpreadBox.PaddingAfter  + "px";
                // Adjust R.Main.Book (div#epub-content-main)
                var MainContentLength = 0;
                R.Spreads.forEach(function(Spread) {
                    MainContentLength += Spread.SpreadBox["offset" + S.SIZE.L];
                });
                //console.dir(SpreadBox);
                R.Main.Book.style[S.SIZE.b] = "";
                R.Main.Book.style[S.SIZE.l] = MainContentLength + "px";
                E.dispatch("bibi:laid-out-spread", Spread);
                O.stamp("Lay Out Spread " + Spread.SpreadIndex + " End");
            }
            
            resetSpread(Spread) {
                O.stamp("Reset Spread " + Spread.SpreadIndex + " Start");
                E.dispatch("bibi:is-going-to:reset-spread", Spread);
                Spread.Items.forEach(function(Item) {
                    R.resetItem(Item);
                });
                var SpreadBox = Spread.SpreadBox;
                SpreadBox.style["margin" + S.BASE.B] = SpreadBox.style["margin" + S.BASE.A] = "";
                SpreadBox.style["margin" + S.BASE.E] = SpreadBox.style["margin" + S.BASE.S] = "auto";
                SpreadBox.style.padding = SpreadBox.style.width = SpreadBox.style.height = "";
                var Width, Height;
                if(Spread.RenditionLayout == "reflowable" || (S.BRL == "reflowable" && S.SLA == "vertical") || (S.BRL == "pre-paginated" && S.SLA == "vertical")) { // || S.FSP
                    if(Spread.Items.length == 2/* && !S.FSP*/) {
                        // Always show single page spreads when vertical
                        var bibis_way = false;
                        if(bibis_way && (R.Stage.Width > Spread.Items[0].ItemBox.offsetWidth + Spread.Items[1].ItemBox.offsetWidth)) {
                            Width  =          Spread.Items[0].ItemBox.offsetWidth + Spread.Items[1].ItemBox.offsetWidth;
                            Height = Math.max(Spread.Items[0].ItemBox.offsetHeight, Spread.Items[1].ItemBox.style.offsetHeight);
                        } else {
                            Width  = Math.max(Spread.Items[0].ItemBox.offsetWidth,   Spread.Items[1].ItemBox.offsetWidth);
                            Height =          Spread.Items[0].ItemBox.offsetHeight + Spread.Items[1].ItemBox.offsetHeight;
                        }
                    } else {
                        /*if(S.FSP && S.RVM == "paged" && Spread.Items.length == 2) {
                            
                        } else {*/
                        Width  = Spread.Items[0].ItemBox.offsetWidth;
                        Height = Spread.Items[0].ItemBox.offsetHeight;/*
                        }*/
                    }
                } else {
                    if(Spread.Items.length == 2) {
                        Width  =          Spread.Items[0].ItemBox.offsetWidth + Spread.Items[1].ItemBox.offsetWidth;
                        Height = Math.max(Spread.Items[0].ItemBox.offsetHeight, Spread.Items[1].ItemBox.style.offsetHeight);
                    } else {
                        Width  = Spread.Items[0].ItemBox.offsetWidth * (Spread.Items[0].ItemRef["page-spread"] == "left" || Spread.Items[0].ItemRef["page-spread"] == "right" ? 2 : 1);
                        Height = Spread.Items[0].ItemBox.offsetHeight;
                    }
                }
                SpreadBox.style.width  = Math.ceil(Width) + "px";
                SpreadBox.style.height = Math.ceil(Height) + "px";
                if(Spread.SpreadIndex === 0) {
                    //SpreadBox.style.height = (Math.ceil(Height) + 64) + "px";
                }
                Spread.style["border-radius"] = S["spread-border-radius"];
                Spread.style["box-shadow"]    = S["spread-box-shadow"];
                E.dispatch("bibi:reset-spread", Spread);
                O.stamp("Reset Spread " + Spread.SpreadIndex + " End");
            }
            
            createKeyListener() {
            
                if(!S["use-keys"]) return;
            
                // Keys
                I.KeyListener = {
                    ActiveKeys: {},
                    KeyCodes: { "keydown": {}, "keyup": {}, "keypress": {} },
                    updateKeyCodes: function(EventTypes, KeyCodesToUpdate) {
                        if(typeof EventTypes.join != "function")  EventTypes = [EventTypes];
                        if(typeof KeyCodesToUpdate == "function") KeyCodesToUpdate = KeyCodesToUpdate();
                        EventTypes.forEach(function(EventType) {
                            I.KeyListener.KeyCodes[EventType] = sML.edit(I.KeyListener.KeyCodes[EventType], KeyCodesToUpdate);
                        });
                    },
                    MovingParameters: {
                        "Space":  1,  "Page Up":     -1,  "Page Down":      1,  "End": "foot",  "Home": "head",
                        "SPACE": -1,  "PAGE UP": "head",  "PAGE DOWN": "foot",  "END": "foot",  "HOME": "head"
                    },
                    updateMovingParameters: function() {
                        switch(S.ARD) {
                        case "ttb": return sML.edit(I.KeyListener.MovingParameters, {
                            "Up Arrow":     -1,  "Right Arrow":      0,  "Down Arrow":      1,  "Left Arrow":      0,
                            "W":            -1,  "D":                0,  "S":               1,  "A":               0,
                            "UP ARROW": "head",  "RIGHT ARROW":     "",  "DOWN ARROW": "foot",  "LEFT ARROW":     ""
                        });
                        case "ltr": return sML.edit(I.KeyListener.MovingParameters, {
                            "Up Arrow":      0,  "Right Arrow":      1,  "Down Arrow":      0,  "Left Arrow":     -1,
                            "W":             0,  "D":                1,  "S":               0,  "A":              -1,
                            "UP ARROW":     "",  "RIGHT ARROW": "foot",  "DOWN ARROW":     "",  "LEFT ARROW": "head"
                        });
                        case "rtl": return sML.edit(I.KeyListener.MovingParameters, {
                            "Up Arrow":      0,  "Right Arrow":     -1,  "Down Arrow":      0,  "Left Arrow":      1,
                            "W":             0,  "D":               -1,  "S":               0,  "A":               1,
                            "UP ARROW":     "",  "RIGHT ARROW": "head",  "DOWN ARROW":     "",  "LEFT ARROW": "foot"
                        });
                        default: return sML.edit(I.KeyListener.MovingParameters, {
                            "Up Arrow":      0,  "Right Arrow":      0,  "Down Arrow":      0,  "Left Arrow":      0,
                            "W":             0,  "D":                0,  "S":               0,  "A":               0,
                            "UP ARROW":     "",  "RIGHT ARROW":     "",  "DOWN ARROW":     "",  "LEFT ARROW":     ""
                        });
                        }
                    },
                    getBibiKeyName: function(Eve) {
                        var KeyName = I.KeyListener.KeyCodes[Eve.type][Eve.keyCode];
                        return KeyName ? KeyName : "";
                    },
                    onEvent: function(Eve) {
                        if(!L.Opened) return false;
                        Eve.BibiKeyName = I.KeyListener.getBibiKeyName(Eve);
                        Eve.BibiModifierKeys = [];
                        if(Eve.shiftKey) Eve.BibiModifierKeys.push("Shift");
                        if(Eve.ctrlKey)  Eve.BibiModifierKeys.push("Control");
                        if(Eve.altKey)   Eve.BibiModifierKeys.push("Alt");
                        if(Eve.metaKey)  Eve.BibiModifierKeys.push("Meta");
                        //if(!Eve.BibiKeyName) return false;
                        if(Eve.BibiKeyName) Eve.preventDefault();
                        return true;
                    },
                    onkeydown:  function(Eve) {
                        if(!I.KeyListener.onEvent(Eve)) return false;
                        if(Eve.BibiKeyName) {
                            if(!I.KeyListener.ActiveKeys[Eve.BibiKeyName]) {
                                I.KeyListener.ActiveKeys[Eve.BibiKeyName] = Date.now();
                            } else {
                                E.dispatch("bibi:is-holding-key", Eve);
                            }
                        }
                        E.dispatch("bibi:downs-key", Eve);
                    },
                    onkeyup:    function(Eve) {
                        if(!I.KeyListener.onEvent(Eve)) return false;
                        if(I.KeyListener.ActiveKeys[Eve.BibiKeyName] && Date.now() - I.KeyListener.ActiveKeys[Eve.BibiKeyName] < 300) {
                            E.dispatch("bibi:touches-key", Eve);
                            E.dispatch("bibi:touched-key", Eve);
                        }
                        if(Eve.BibiKeyName) {
                            if(I.KeyListener.ActiveKeys[Eve.BibiKeyName]) {
                                delete I.KeyListener.ActiveKeys[Eve.BibiKeyName];
                            }
                        }
                        E.dispatch("bibi:ups-key", Eve);
                    },
                    onkeypress:  function(Eve) {
                        if(!I.KeyListener.onEvent(Eve)) return false;
                        E.dispatch("bibi:presses-key", Eve);
                    },
                    observe: function() {
                        [O].concat(R.Items).forEach(function(Item) {
                            ["keydown", "keyup", "keypress"].forEach(function(EventName) {
                                Item.contentDocument.addEventListener(EventName, I.KeyListener["on" + EventName], false);
                            });
                        });
                    },
                    tryMoving: function(Eve) {
                        if(!Eve.BibiKeyName) return false;
                        var MovingParameter = I.KeyListener.MovingParameters[!Eve.shiftKey ? Eve.BibiKeyName : Eve.BibiKeyName.toUpperCase()];
                        if(!MovingParameter) return false;
                        Eve.preventDefault();
                        if(typeof MovingParameter == "number") E.dispatch("bibi:commands:move-by",  { Distance:    MovingParameter });
                        else if(typeof MovingParameter == "string") E.dispatch("bibi:commands:focus-on", { Destination: MovingParameter });
                    }
                };
            
                I.KeyListener.updateKeyCodes(["keydown", "keyup", "keypress"], {
                    32: "Space"
                });
                I.KeyListener.updateKeyCodes(["keydown", "keyup"], {
                    33: "Page Up",     34: "Page Down",
                    35: "End",         36: "Home",
                    37: "Left Arrow",  38: "Up Arrow",  39: "Right Arrow",  40: "Down Arrow",
                    65: "A",           87: "W",         68: "D",            83: "S",
                });
            
                E.add("bibi:updated-settings", function(   ) { I.KeyListener.updateMovingParameters(); });
                E.add("bibi:opened",           function(   ) { I.KeyListener.updateMovingParameters(); I.KeyListener.observe(); });
            
                E.add("bibi:touched-key",      function(Eve) { I.KeyListener.tryMoving(Eve); });
            
                E.dispatch("bibi:created-keylistener");
            }
            
            setHoverActions(Ele) {
                E.add("bibi:hovers", function(Eve) {
                    if(Ele.Hover) return Ele;
                    if(Ele.isAvailable && !Ele.isAvailable(Eve)) return Ele;
                    Ele.Hover = true;
                    sML.addClass(Ele, "hover");
                    if(Ele.showHelp) Ele.showHelp();
                    return Ele;
                }, Ele);
                E.add("bibi:unhovers", function(Eve) {
                    if(!Ele.Hover) return Ele;
                    Ele.Hover = false;
                    sML.removeClass(Ele, "hover");
                    if(Ele.hideHelp) Ele.hideHelp();
                    return Ele;
                }, Ele);
                return Ele;
            }

            createMenu() {
                // Menus
                if(!S["use-menubar"]) sML.addClass(O.HTML, "without-menubar");
                I.Menu = document.getElementById("bibi-menu");//.appendChild(sML.create("div", { id: "bibi-menu", on: { "click": function(Eve) { Eve.stopPropagation(); } } }));
                I.Menu.Height = I.Menu.offsetHeight;
                this.setHoverActions(I.Menu);
                I.setToggleAction(I.Menu, {
                    onopened: function() {
                        sML.addClass(O.HTML, "menu-opened");
                        E.dispatch("bibi:opened-menu");
                    },
                    onclosed: function() {
                        sML.removeClass(O.HTML, "menu-opened");
                        E.dispatch("bibi:closed-menu");
                    }
                });
                E.add("bibi:closed-slider",        function(   ) { I.Menu.close(); });
                E.add("bibi:commands:open-menu",   function(Opt) { I.Menu.open(Opt); });
                E.add("bibi:commands:close-menu",  function(Opt) { I.Menu.close(Opt); });
                E.add("bibi:commands:toggle-menu", function(Opt) { I.Menu.toggle(Opt); });
                //E.add("bibi:focused-on", function(Par) { console.dir(Par); });
                E.add("bibi:scrolls", function() {
                    var isVert = (S.RVM == "vertical");
                    var cindex = R.getCurrent().Page.PageIndex;
                    var eindex = isVert ? R.Pages.length : R.Pages.length - 1;
                    if(/*S.RVM == "vertical" && */(cindex > 0) && (cindex < eindex)) {
                        I.Menu.Hot = false;
                        sML.removeClass(I.Menu, "hot");
                        I.Menu.Hover = true;
                        E.dispatch("bibi:unhovers", null, I.Menu);
                        // document.body.requestPointerLock(); TODO
                    } else {
                        clearTimeout(I.Menu.Timer_cool);
                        /*if(!I.Menu.Hot) */sML.addClass(I.Menu, "hot");
                        I.Menu.Hot = true;
                        E.dispatch("bibi:hovers", null, I.Menu);
                    }
                    if(!isVert && I.Menu.Hot) {
                        clearTimeout(I.Menu.Timer_cool);
                        I.Menu.Timer_cool = setTimeout(function() {
                            I.Menu.Hot = false;
                            sML.removeClass(I.Menu, "hot");
                            sML.removeClass(I.Menu, "hover");
                        }, 1234);
                    }
                });
                if(!O.Mobile) {
                    E.add("bibi:moved-pointer", function(Eve) {
                        if(I.isPointerStealth()) return false;
                        var BibiEvent = O.getBibiEvent(Eve);
                        clearTimeout(I.Menu.Timer_close);
                        if(BibiEvent.Coord.Y < I.Menu.offsetHeight * 1.5) {
                            E.dispatch("bibi:hovers", Eve, I.Menu);
                        } else if(I.Menu.Hover) {
                            I.Menu.Timer_close = setTimeout(function() {
                                E.dispatch("bibi:unhovers", Eve, I.Menu);
                            }, 123);
                        }
                    });
                }
                E.add("bibi:tapped", function(Eve) {
                    if(I.isPointerStealth()) return false;
                    var BibiEvent = O.getBibiEvent(Eve);
                    //if(BibiEvent.Coord.Y < I.Menu.offsetHeight) return false;
                    if(S.RVM == "horizontal") {
                        if(BibiEvent.Coord.Y > window.innerHeight - O.Scrollbars.Height) return false;
                    } else if(S.RVM == "vertical") {
                        if(BibiEvent.Coord.X > window.innerWidth  - O.Scrollbars.Width)  return false;
                    }
                    if(BibiEvent.Target.tagName) {
                        if(/bibi-slider/.test(BibiEvent.Target.className + BibiEvent.Target.id)) return false;
                        if(O.isAnchorContent(BibiEvent.Target)) return false;
                    }
                    switch(S.ARD) {
                    case "ttb": return (BibiEvent.Division.Y == "middle") ? E.dispatch("bibi:commands:toggle-menu") : false;
                    default   : return (BibiEvent.Division.X == "center") ? E.dispatch("bibi:commands:toggle-menu") : false;
                    }
                });
                I.Menu.L = I.Menu.getElementsByClassName("mdc-toolbar__section--align-start")[0].insertBefore(sML.create("div", { id: "bibi-menu-l" }), I.Menu.getElementsByClassName("mdc-toolbar__section--align-start")[0].firstChild);
                I.Menu.R = I.Menu.getElementsByClassName("mdc-toolbar__section--align-end")[0].appendChild(sML.create("div", { id: "bibi-menu-r" }));
                //I.Menu.open();
            
                // Optimize to Scrollbar Size
                sML.appendStyleRule([
                    "html.view-vertical div#bibi-menu"
                ].join(", "), "width: calc(100% - " + (O.Scrollbars.Width) + "px);");
                sML.appendStyleRule([
                    "html.view-vertical.panel-opened div#bibi-menu",
                    "html.view-vertical.subpanel-opened div#bibi-menu"
                ].join(", "), "width: 100%; padding-right: " + (O.Scrollbars.Width) + "px;");
            
                this.createMenucreatePanelSwitch();
            
                this.createMenu.SettingMenuComponents = [];
                if(!S["fix-reader-view-mode"])                                                                     this.createMenu.SettingMenuComponents.push("ViewModeButtons");
                if(O.WindowEmbedded)                                                                               this.createMenu.SettingMenuComponents.push("NewWindowButton");
                if(O.FullscreenEnabled/* && !O.Mobile*/)                                                               this.createMenu.SettingMenuComponents.push("FullscreenButton");
                if(S["website-href"] && /^https?:\/\/[^/]+/.test(S["website-href"]) && S["website-name-in-menu"]) this.createMenu.SettingMenuComponents.push("WebsiteLink");
                if(!S["remove-bibi-website-link"])                                                                 this.createMenu.SettingMenuComponents.push("BibiWebsiteLink");
                if(this.createMenu.SettingMenuComponents.length) this.createMenucreateSettingMenu();
            
                //if(S.RVM == "vertical")
                E.dispatch("bibi:hovers", null, I.Menu);
                I.Menu.Hover = false;
                
                E.dispatch("bibi:created-menu");
            }

            createMenucreatePanelSwitch() {

                // Panel Switch
                I.PanelSwitch = I.createButtonGroup({ Area: I.Menu.L, Sticky: true }).addButton({
                    Type: "toggle",
                    Labels: {
                        default: { default: "Open Index", ja: "目次を開く" },
                        active:  { default: "Close Index", ja: "目次を閉じる" }
                    },
                    Help: true,
                    Icon: "<span class=\"bibi-icon bibi-icon-toggle-panel\"><span class=\"bar-1\"></span><span class=\"bar-2\"></span><span class=\"bar-3\"></span></span>",
                    action: function() {
                        I.Panel.toggle();
                    }
                });
                E.add("bibi:opened-panel",  function() {
                    I.setUIState(I.PanelSwitch, "active");
                });
                E.add("bibi:closed-panel", function() { I.setUIState(I.PanelSwitch, ""); });
                E.add("bibi:started", function() {
                    sML.style(I.PanelSwitch, { display: "block" });
                });
            
            }
            
            
            createMenucreateSettingMenu() {
            
                I.Menu.Config = {};
            
                // Button
                I.Menu.Config.Button = I.createButtonGroup({ Area: I.Menu.R, Sticky: true }).addButton({
                    Type: "toggle",
                    Labels: {
                        default: { default: "Setting", ja: "設定を変更" },
                        active:  { default: "Close Setting-Menu", ja: "設定メニューを閉じる" }
                    },
                    Help: true,
                    Icon: "<span class=\"bibi-icon bibi-icon-setting\"></span>"
                });
            
                // Sub Panel
                I.Menu.Config.SubPanel = I.createSubPanel({ Opener: I.Menu.Config.Button, id: "bibi-subpanel_change-view" });
            
                if(this.createMenu.SettingMenuComponents.includes("ViewModeButtons")                                                                   ) this.createMenucreateSettingMenucreateViewModeSection();
                if(this.createMenu.SettingMenuComponents.includes("NewWindowButton") || this.createMenu.SettingMenuComponents.includes("FullscreenButton")) this.createMenucreateSettingMenucreateWindowSection();
                if(this.createMenu.SettingMenuComponents.includes("WebsiteLink")     || this.createMenu.SettingMenuComponents.includes("BibiWebsiteLink") ) this.createMenucreateSettingMenucreateLinkageSection();
            
            }
            
            
            createMenucreateSettingMenucreateViewModeSection() {
            
                // Shapes
                var Shape = {};
                Shape.Item         = "<span class=\"bibi-shape bibi-shape-item\"></span>";
                Shape.Spread       = "<span class=\"bibi-shape bibi-shape-spread\">" + Shape.Item + Shape.Item + "</span>";
            
                // Icons
                var Icon = {};
                Icon["paged"]      = "<span class=\"bibi-icon bibi-icon-view-paged\"><span class=\"bibi-shape bibi-shape-spreads bibi-shape-spreads-paged\">" + Shape.Spread + Shape.Spread + Shape.Spread + "</span></span>";
                Icon["horizontal"] = "<span class=\"bibi-icon bibi-icon-view-horizontal\"><span class=\"bibi-shape bibi-shape-spreads bibi-shape-spreads-horizontal\">" + Shape.Spread + Shape.Spread + Shape.Spread + "</span></span>";
                Icon["vertical"]   = "<span class=\"bibi-icon bibi-icon-view-vertical\"><span class=\"bibi-shape bibi-shape-spreads bibi-shape-spreads-vertical\">" + Shape.Spread + Shape.Spread + Shape.Spread + "</span></span>";
            
                var changeView = function() {
                    R.changeView(this.Value);
                };
            
                I.Menu.Config.SubPanel.ViewModeSection = I.Menu.Config.SubPanel.addSection({
                    Labels: { default: { default: "Choose Layout", ja: "レイアウトを選択" } },
                    ButtonGroup: {
                        Buttons: [
                            {
                                Type: "radio",
                                Labels: {
                                    default: {
                                        default: "<span class=\"non-visual-in-label\">Layout:</span> Each Page <small>(Flip with " + (O.Mobile ? "Tap/Swipe" : "Click/Wheel") + ")</small>",
                                        ja: "ページ単位表示<small>（" + (O.Mobile ? "タップ／スワイプ" : "クリック／ホイール") + "で移動）</small>"
                                    }
                                },
                                Notes: true,
                                Icon: Icon["paged"],
                                Value: "paged",
                                action: changeView
                            },
                            /*{
                                Type: "radio",
                                Labels: {
                                    default: {
                                        default: "<span class=\"non-visual-in-label\">Layout:</span> All Pages <small>(Horizontal Scroll)</small>",
                                        ja: "全ページ表示<small>（横スクロール移動）</small>"
                                    }
                                },
                                Notes: true,
                                Icon: Icon["horizontal"],
                                Value: "horizontal",
                                action: changeView
                            },*/
                            {
                                Type: "radio",
                                Labels: {
                                    default: {
                                        default: "<span class=\"non-visual-in-label\">Layout:</span> All Pages <small>(Vertical Scroll)</small>",
                                        ja: "全ページ表示<small>（縦スクロール移動）</small>"
                                    }
                                },
                                Notes: true,
                                Icon: Icon["vertical"],
                                Value: "vertical",
                                action: changeView
                            }
                        ]
                    }
                });
            
                E.add("bibi:updated-settings", function() {
                    I.Menu.Config.SubPanel.ViewModeSection.ButtonGroup.Buttons.forEach(function(Button) {
                        I.setUIState(Button, (Button.Value == S.RVM ? "active" : "default"));
                    });
                });
            
            }
            
            
            createMenucreateSettingMenucreateWindowSection() {
            
                var Buttons = [];
            
                // New Window
                if(this.createMenu.SettingMenuComponents.includes("NewWindowButton")) Buttons.push({
                    Type: "link",
                    Labels: {
                        default: { default: "Open in New Window", ja: "あたらしいウィンドウで開く" }
                    },
                    Icon: "<span class=\"bibi-icon bibi-icon-open-newwindow\"></span>",
                    href: O.RequestedURL,
                    target: "_blank"
                });
            
                // Force Single Page Reading
                var _me = this;
                var FSPToggle = {
                    Type: "toggle",
                    Labels: {
                        default: { default: "Force Single Page", ja: "" },
                        active:  { default: "Force Single Page", ja: "" }
                    },
                    Icon: "<span class=\"bibi-icon bibi-icon-toggle-forcesinglepage\"></span>",
                };
                FSPToggle.action = function() {
                    var Button = this;
                    S.FSP = !S.FSP;
                    if(S["use-cookie"]) {
                        O.Cookie.eat(O.RootPath, { "force-single-page": S.FSP });
                    }
                    window.removeEventListener(O["resize"], R.onresize);
                    R.Main.removeEventListener("scroll", R.onscroll);
                    _me.loadBook({ Path: B.Path });
                    //I.Panel.parentNode.removeChild(I.Panel);
                    //I.createPanel();
                    if(S.FSP) {
                        E.dispatch("bibi:relaxed-fsp");
                    } else {
                        E.dispatch("bibi:enforced-fsp");
                    }
                }.bind(_me);

                if(this.createMenu.SettingMenuComponents.includes("FullscreenButton")) Buttons.push(FSPToggle, {
                    Type: "toggle",
                    Labels: {
                        default: { default: "Enter Fullscreen", ja: "フルスクリーンモード" },
                        active:  { default: "Exit Fullscreen", ja: "フルスクリーンモード解除" }
                    },
                    Icon: "<span class=\"bibi-icon bibi-icon-toggle-fullscreen\"></span>",
                    action: function() {
                        var Button = this;
                        if(!O.FullscreenElement.Fullscreen) {
                            sML.requestFullscreen(O.FullscreenElement);
                        } else {
                            sML.exitFullscreen(O.FullscreenDocument);
                        }
                        if(!O.FullscreenElement.Fullscreen) {
                            O.FullscreenElement.Fullscreen = true;
                            E.dispatch("bibi:requested-fullscreen");
                            sML.addClass(O.HTML, "fullscreen");
                        } else {
                            O.FullscreenElement.Fullscreen = false;
                            E.dispatch("bibi:exited-fullscreen");
                            sML.removeClass(O.HTML, "fullscreen");
                        }
                    }
                });
            
                I.Menu.Config.SubPanel.WindowSection = I.Menu.Config.SubPanel.addSection({
                    Labels: { default: { default: "Window Operation", ja: "ウィンドウ操作" } },
                    ButtonGroup: {
                        Buttons: Buttons
                    }
                });
            
            }
            
            
            createMenucreateSettingMenucreateLinkageSection() {
                var Buttons = [];
            
                if(this.createMenu.SettingMenuComponents.includes("WebsiteLink")) Buttons.push({
                    Type: "link",
                    Labels: {
                        default: { default: S["website-name-in-menu"].replace(/&/gi, "&amp;").replace(/</gi, "&lt;").replace(/>/gi, "&gt;") }
                    },
                    Icon: "<span class=\"bibi-icon bibi-icon-open-newwindow\"></span>",
                    href: S["website-href"],
                    target: "_blank"
                });
            
                if(this.createMenu.SettingMenuComponents.includes("BibiWebsiteLink")) Buttons.push({
                    Type: "link",
                    Labels: {
                        default: { default: "BiB/i | Official Website" }
                    },
                    Icon: "<span class=\"bibi-icon bibi-icon-open-newwindow\"></span>",
                    href: Bibi["href"],
                    target: "_blank"
                });
            
                I.Menu.Config.SubPanel.addSection({
                    Labels: { default: { default: "Link" + (Buttons.length > 1 ? "s" : ""), ja: "リンク" } },
                    ButtonGroup: {
                        Buttons: Buttons
                    }
                });
            }

            createCover() {
                O.log("Creating Cover...", "*:");
            
                I.Veil.Cover.Info.innerHTML = I.Panel.BookInfo.Cover.Info.innerHTML = "";
            
                if(B.Package.Manifest["cover-image"].Path) {
                    R.CoverImage.Path = B.Package.Manifest["cover-image"].Path;
                }
            
                I.Veil.Cover.Info.innerHTML = I.Panel.BookInfo.Cover.Info.innerHTML = (function() {
                    var BookID = [];
                    if(B.Title)     BookID.push("<strong>" + B.Title     + "</strong>");
                    if(B.Creator)   BookID.push("<em>"     + B.Creator   + "</em>");
                    if(B.Publisher) BookID.push("<span>"   + B.Publisher + "</span>");
                    return BookID.join(" ");
                })();
            
                if(R.CoverImage.Path) {
                    O.log("Cover Image: " + R.CoverImage.Path, "-*");
                    sML.create("img", {
                        load: function() {
                            //O.log('Loading Cover Image: ' + R.CoverImage.Path + ' ...', "*:");
                            var Img = this;
                            Img.src = B.Files[R.CoverImage.Path] ? O.getDataURI(R.CoverImage.Path, B.Files[R.CoverImage.Path]) : R.CoverImage.Path;
                            Img.timeout = setTimeout(function() { Img.ontimeout(); }, 5000);
                        },
                        onload: function() {
                            if(this.TimedOut) return false;
                            clearTimeout(this.timeout);
                            //O.log('Cover Image Loaded.', "/*");
                            sML.style(I.Veil.Cover, { backgroundImage: "url(" + this.src + ")" });
                            if (O.Body.clientHeight < this.height) {
                                sML.style(I.Veil.Cover, { backgroundSize: "contain" });
                            } else {
                                sML.style(I.Veil.Cover, { backgroundSize: "auto" });
                            }
                            I.Panel.BookInfo.Cover.insertBefore(this, I.Panel.BookInfo.Cover.Info);
                            I.Veil.Cover.className = I.Panel.BookInfo.Cover.className = "with-cover-image";
                        },
                        ontimeout: function() {
                            this.TimedOut = true;
                            //O.log('Cover Image Request Timed Out.', "/*");
                            I.Veil.Cover.className = I.Panel.BookInfo.Cover.className = "without-cover-image";
                        }
                    }).load();
                } else {
                    O.log("No Cover Image.", "-*");
                    I.Veil.Cover.className = I.Panel.BookInfo.Cover.className = "without-cover-image";
                }
            
                O.log("Cover Created.", "/*");
                E.dispatch("bibi:created-cover", R.CoverImage.Path);
            }
            
            createPoweredBy() {
            
                I.PoweredBy = O.Body.appendChild(sML.create("div", { id: "bibi-poweredby", innerHTML: [
                    "<p>",
                    "<a href=\"" + Bibi["href"] + "\" target=\"_blank\" title=\"BiB/i | Official Website\">",
                    "<span>BiB/i</span>",
                    "<img class=\"bibi-logo-white\" alt=\"\" src=\"" + O.RootPath + "res/images/bibi-logo_white.png\" />",
                    "<img class=\"bibi-logo-black\" alt=\"\" src=\"" + O.RootPath + "res/images/bibi-logo_black.png\" />",
                    "</a>",
                    "</p>"
                ].join("") }));
            
                // Optimize to Scrollbar Size
                sML.appendStyleRule([
                    "html.view-paged div#bibi-poweredby",
                    "html.view-horizontal div#bibi-poweredby",
                    "html.page-rtl.panel-opened div#bibi-poweredby"
                ].join(", "), "bottom: " + (O.Scrollbars.Height) + "px;");
            }

            loadNaviagation(){
                return new Promise(function(resolve/*, reject*/) {
                    if(!I.Panel.BookInfo.Navigation.Type) {
                        O.log("No Navigation Document or TOC-NCX.", "-*");
                        return resolve();
                    }
                    O.log("Loading Navigation: " + B.Path + B.PathDelimiter + I.Panel.BookInfo.Navigation.Path + " ...", "*:");
                    O.openDocument(I.Panel.BookInfo.Navigation.Path).then(function(Doc) {
                        I.Panel.BookInfo.Navigation.innerHTML = "";
                        var NavContent = document.createDocumentFragment();
                        if(I.Panel.BookInfo.Navigation.Type == "Navigation Document") {
                            sML.each(Doc.querySelectorAll("nav"), function() {
                                switch(this.getAttribute("epub:type")) {
                                case "toc":       sML.addClass(this, "bibi-nav-toc"); break;
                                case "landmarks": sML.addClass(this, "bibi-nav-landmarks"); break;
                                case "page-list": sML.addClass(this, "bibi-nav-page-list"); break;
                                }
                                sML.each(this.querySelectorAll("*"), function() { this.removeAttribute("style"); });
                                NavContent.appendChild(this);
                            });
                        } else {
                            var NavUL = (function(Ele) {
                                var ChildNodes = Ele.childNodes;
                                var UL = undefined;
                                for(var l = ChildNodes.length, i = 0; i < l; i++) {
                                    if(ChildNodes[i].nodeType == 1 && /^navPoint$/i.test(ChildNodes[i].tagName)) {
                                        var NavPoint = ChildNodes[i];
                                        //var NavLabel = NavPoint.getElementsByTagName("navLabel")[0];
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
                        L.postprocessItem.coordinateLinkages(I.Panel.BookInfo.Navigation, "InNav");
                        R.resetNavigation();
                        O.log("Navigation Loaded.", "/*");
                        resolve();
                    });
                }.bind(this)).then(function() {
                    E.dispatch("bibi:loaded-navigation", I.Panel.BookInfo.Navigation.Path);
                });
            }

            getCurrent() {
                // Much struggle such wow
                //console.dir(R.getFrameState());
                //console.dir(R.getCurrentPages());
                //debugger;
                return R.Current.Pages = R.getCurrentPages(),
                R.Current.Page = R.Current.Pages.EndPage,
                R.Current.Percent = Math.floor((R.Current.Pages.EndPage.PageIndex + 1) / R.Pages.length * 100),
                R.classifyCurrent(),
                R.Current;
            }

            detectThatScrollCoordsNeedToBeTreated() {
                var e = R.Main.scrollLeft;
                R.Main.scrollLeft = 10;
                var t = !sML.UA.InternetExplorer && 10 == R.Main.scrollLeft;
                return R.Main.scrollLeft = e,
                t;
            }
            
            getFrameState() {
                //console.log(sML.Coord.getScrollCoord(R.Main));
                return {
                    Coord: sML.Coord.getScrollCoord(R.Main),
                    Size: sML.Coord.getClientSize(R.Main)
                };
            }

            getScrollTarget(FocusPoint) {
                /*var t = {
                        Frame: R.Main,
                        X: 0,
                        Y: 0
                    }
                    , n = (sML.Coord.getScrollCoord(R.Main),
                    sML.Coord.getClientSize(R.Main));
                return R.ScrollCoordsNeedToBeTreated && (e = e - n.W + R.Main.scrollWidth),
                t[S.AXIS.L] = e * R.Scale,
                t;*/
                var ScrollTarget = { Frame: R.Main, X: 0, Y: 0 };
                if(FocusPoint < R.Items[0].offsetHeight && R.getCurrent().Page.PageIndex > 0) {
                    //FocusPoint -= 64;
                }
                //console.log(FocusPoint);
                ScrollTarget[S.AXIS.L] = FocusPoint;
                return ScrollTarget;
            }

            open() {

                window.removeEventListener("resize", L.listenResizingWhileLoading);
                delete L.listenResizingWhileLoading;
            
                R.updateOrientation();
            
                R.layOut({
                    Destination: (function() {
                        if(S["to"]) {
                            var HatchedDestination = R.focusOn.hatchDestination(S["to"]);
                            if(HatchedDestination) return HatchedDestination;
                        }
                        return "head";
                    })()
                });
            
                R.getCurrent();
            
                E.dispatch("bibi:laid-out:for-the-first-time");
            
                setTimeout(function() {
                    if(I.Veil) I.Veil.close();
                    setTimeout(function() {
                        if(I.Menu) I.Menu.close();
                        if(I.Slider) I.Slider.close();
                    }, 888);
                    document.body.click(); // To respond to user scrolling/keypressing immediately
                    L.Opened = true;
                    I.note("");
                    E.dispatch("bibi:opened");
                    O.stamp("Enjoy");
                    //O.log("Enjoy Readings!", "-0"); // No fun allowed
                }, 1);
            }

            connect() {
                this.hasChapters = false;
                this.bookManifestUrl = null;
                this.manifest = null;
                var discussionTemplate = document.createElement("div");
                discussionTemplate.innerHTML = "Herro";
                this.ExtraInnerHTML = discussionTemplate.outerHTML;
                
                define(["BibiPreset"], function(Preset) {
                    console.log("PLoaded");
                    console.dir(Preset);
                });
                window.Bibi.Preset = {
                    "preset-name"                : "コミックのビビ", // Name of this preset. As you like.
                    "preset-description"         : "BiBi Comics Preset.", // Description for this preset. As you like.
                    "preset-author"              : "chocolatkey", // Name of the author of this preset. As you like.
                    "preset-author-href"         : "https://chocolatkey.com", // URI of a website, etc. of the author of this preset. As you like.
                
                    "website-name-in-title"      : "/", // "" or name of your website replaces string "BiB/i" in <title>.
                
                    "remove-bibi-website-link"   : true, // true or false (if true, the link to BiB/i Website is not to be added in setting-menu)
                
                    "bookshelf"                  : "../bookshelf/", // relative path from bib/i/index.html (if the origin is included in "trustworthy-origins", URI begins with "http://" or "https://" for COR-allowed server is OK).
                
                    "reader-view-mode"           : "paged", // "paged" or "vertical" or "horizontal" ("paged" is for flipping, "vertical" and "horizontal" are for scrolling)
                    "reader-view-mode-mobile"    : "vertical",
                    "fix-reader-view-mode"       : "no", // "yes" or "no" or "desktop" or "mobile"
                    "single-page-always"         : "mobile", // "yes" or "no" or "desktop" or "mobile"
                
                    "autostart"                  : "desktop", // "yes" or "no" or "desktop" or "mobile"
                    "start-in-new-window"        : "mobile", // "yes" or "no" or "desktop" or "mobile"
                
                    "use-full-height"            : "yes", // "yes" or "no" or "desktop" or "mobile"
                    "use-menubar"                : "yes", // "yes" or "no" or "desktop" or "mobile"
                    "use-nombre"                 : "yes", // "yes" or "no" or "desktop" or "mobile"
                    "use-slider"                 : "yes", // "yes" or "no" or "desktop" or "mobile"
                    "use-arrows"                 : "yes", // "yes" or "no" or "desktop" or "mobile"
                    "use-keys"                   : "yes", // "yes" or "no" or "desktop" or "mobile"
                    "use-swipe"                  : "yes", // "yes" or "no" or "desktop" or "mobile"
                    "use-cookie"                 : "yes", // "yes" or "no" or "desktop" or "mobile"
                
                    "cookie-expires"             : 1000 * 60 * 60 * 24 * 3, // milli-seconds (ex. 1000ms * 60s * 60m * 24h * 3d = 3days)
                
                    "ui-font-family"             : "", // CSS font-family value as "'Helvetica', sans-serif" or ""
                
                    "book-background"            : "black", // CSS background value or ""
                
                    "spread-gap"                 : 0, // px
                    "spread-margin"              : 0, // px
                
                    "spread-border-radius"       : "", // CSS border-radius value or ""
                    "spread-box-shadow"          : "", // CSS box-shadow value or ""
                
                    "item-padding-left"          : 0, // px
                    "item-padding-right"         : 0, // px
                    "item-padding-top"           : 0, // px
                    "item-padding-bottom"        : 0, // px
                
                    "flipper-width"              : 0.3, // ratio (lower than 1) or px (1 or higher)
                
                    "preprocess-html-always"     : "no", // "yes" or "no" or "desktop" or "mobile"
                
                    "page-breaking"              : false, // true or false (if true, CSS "page-break-before/after: always;" will work, partially)
                
                    "epub-additional-stylesheet" : "", // path from spine-item or http:// URI or ""
                    "epub-additional-script"     : "", // path from spine-item or http:// URI or ""
                
                    // =================================================================================================
                
                    "extensions": [
                        //{ "name": "Analytics", "src" : "extensions/analytics/analytics.js", "tracking-id": "" }, // "tracking-id": Your own Google Analytics tracking id, as "UA-********-*"
                        { "name": "Loupe", "src": "/static/bib/i/extensions/loupe/loupe.js", "mode": "", "max-scale": 4 },
                        //{ "name": "Share", "src" : "extensions/share/share.js" },
                        { "name": "Unaccessibilizer", "src": "/static/bib/i/extensions/unaccessibilizer/unaccessibilizer.js", "select-elements": "prevent", "save-images": "prevent", "use-contextmenu": "prevent" },
                        // ------------------------------------------------------------------------------------------
                        { "name": "Bibi", "4U" : "w/0" } // (*'-'*)
                    ],
                
                    "trustworthy-origins": []
                
                };
                window.Bibi.welcome = this.welcome();
                //window.L.loadItem = this.loadItem;
                /*window.L.onLoadPlaceholder = this.onLoadPlaceholder;
                window.L.onLoadImage = this.onLoadImage;
                window.L.loadImage = this.loadImage;*/
                //window.R.focusOn = this.focusOn;
                //window.R.focusOn.getScrollTarget = this.getScrollTarget;
                window.R.getFrameState = this.getFrameState;
                window.R.ScrollCoordsNeedToBeTreated = this.detectThatScrollCoordsNeedToBeTreated();
                
                window.R.resetItem.asPrePaginatedItem = this.resetItemasPrePaginatedItem;
                window.R.layOutSpread = this.layOutSpread;
                window.R.resetSpread = this.resetSpread;
                window.R.getCurrent = this.getCurrent;
                window.I.createKeyListener = this.createKeyListener;
                window.I.createMenu = this.createMenu;
                window.I.createMenu.createPanelSwitch = this.createMenucreatePanelSwitch;
                window.I.createMenu.createSettingMenu = this.createMenucreateSettingMenu;
                window.I.createMenu.createSettingMenu.createViewModeSection = this.createMenucreateSettingMenucreateViewModeSection;
                window.I.createMenu.createSettingMenu.createWindowSection = this.createMenucreateSettingMenucreateWindowSection;
                window.I.createMenu.createSettingMenu.createLinkageSection = this.createMenucreateSettingMenucreateLinkageSection;
                window.I.createPoweredBy = this.createPoweredBy;
                window.L.open = this.open;


                if(!constants.DEBUG) {
                    // TODO Override log function with raven for errors
                    window.O.log = function(Msg, Tag) {
                        if(sML.UA.Gecko && typeof Msg == "string") Msg = Msg.replace(/(https?:\/\/)/g, "");
                        if(Tag != "-x") // Errors only
                            return;
                        // TODO Raven or something
                    };
                }
                document.body.addEventListener("pointerlockchange", function () {
                    if (document.pointerLockElement === document.body) {
                        document.body.addEventListener("mousemove", function (e) {
                            if((Math.abs(e.movementX) + Math.abs(e.movementY) > 5))
                                document.exitPointerLock();
                            console.log("Mouse moved during pointer lock");
                        });
                    }
                    console.log("Pointer Lock Changed");
                });
                window.E.add("bibi:opened-panel",  function() {
                    this.openPanel();
                }.bind(this));
            }
        }
        return {
            Reader
        };
    });