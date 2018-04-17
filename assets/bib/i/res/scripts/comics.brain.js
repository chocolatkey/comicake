/*!
 *
 * # ComiCake Reader v0.0.1
 * - chocolatkey 2018-04-07
 *
 * ## Powered by BiB/i | EPUB Reader on your website
 * - Copyright (c) Satoru MATSUSHIMA (℠)
 * - Licensed under the MIT License.
 * - http://bibi.epub.link + https://github.com/satorumurmur/bibi
 *
 */
ComiCake = {};
ComiCake.forEach = function(e, t) {
    return Array.prototype.forEach.call(e, t)
};


Bibi.ready = function() {
    O.HTML.className = O.HTML.className + " js";
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
        P["trustworthy-origins"].push("https://yrkz.localtunnel.me"); // O.Origin
        L.loadBook({ Path: (/^([\w\d]+:)?\/\//.test(U["book"]) ? "" : P["bookshelf"] + "/") + U["book"] });
        // TODO promise then and catch for above function
    });

    setTimeout(function() { E.dispatch("bibi:readied"); }, (O.Mobile ? 999 : 1));

    O.ReadiedURL = location.href;

};

L.loadBook = function(PathOrData) {
    B.initialize();
    R.reset();
    L.Preprocessed = false;
    L.Loaded = false;
    O.Busy = true;
    sML.addClass(O.HTML, "busy");
    sML.addClass(O.HTML, "loading");
    I.note('Loading...');
    O.log("Initializing Chapter...", "*:");
    return new Promise(function(resolve, reject) {
        L.loadBook.resolve = function() { resolve.apply(L.loadBook, arguments); delete L.loadBook.resolve; delete L.loadBook.reject; };
        L.loadBook.reject  = function() {  reject.apply(L.loadBook, arguments); delete L.loadBook.resolve; delete L.loadBook.reject; I.Veil.Cover.className = ""; };
        if(PathOrData.Path) {
            // Online
            if(!P["trustworthy-origins"].includes(PathOrData.Path.replace(/^([\w\d]+:\/\/[^\/]+).*$/, "$1"))) return L.loadBook.reject('The Origin of the Path of the Book Is Not Allowed.');
            B.Path = PathOrData.Path;
            O.download(B.Path).then(function(e) {
                B._manifest = JSON.parse(e.response);
                // Online Manifest
                B.Unzipped = true; // Satisfy our Satoru overlords
                O.log('Comic: ' + B.Path + ' (WebPub Manifest)', "-*");
                L.loadBook.resolve();
            }).catch(function() {
                // Failed to load the manifest, daihen!
                L.loadBook.reject('Failed to load manifest!');
            });
        } else {
            L.loadBook.reject('WebPub Manifest Location not specified...Weird');
        }
    }).then(function() {
        B.PathDelimiter = B.Unzipped ? "/" : " > ";
        O.log("Book Initialized.", "/*");
        L.loadContainer();
    }).catch(function(ErrorMessage) {
        I.note(ErrorMessage, 99999999999, "ErrorOccured");
        O.error(ErrorMessage);
        return false;
    });
};

ComiCake.layOut = function() {
    /*ComiCake.forEach(ComiCake.SingleLeftItems, function(e) {
        e.Spread.style.paddingRight = e.offsetWidth + "px"
    }),
    ComiCake.forEach(ComiCake.SingleRightItems, function(e) {
        e.Spread.style.paddingLeft = e.offsetWidth + "px"
    }),
    ComiCake.forEach(R.Spreads, function(e, t) {
        var n = 90;
        "portrait" == R.Orientation ? e.style.margin = "0 0 0 " + Math.max(n, (window.innerWidth - e.offsetWidth / 2) / 2) + "px" : e.style.margin = "0 " + Math.max(n, (window.innerWidth - e.offsetWidth) / 2) + "px"
    }),*/
    /*R.Current.Page && R.focusOn({
        Destination: R.Current.Page,
        Duration: 0
    })*/
};

E.add("bibi:changed-orientation", ComiCake.layOut);
/*R.layOut = function() {
    R.getCurrent();
    var e = ComiCake.PreviousPage ? ComiCake.PreviousPage : R.Current.Page;
    ComiCake.PreviousPage = void 0,
    R.resetStage(),
    e && E.dispatch("bibi:commands:focus-on", {
        Destination: {
            SpreadIndex: e.Spread.SpreadIndex,
            PageProgressInSpread: e.PageIndexInSpread / e.Spread.Pages.length
        },
        Duration: 0
    }),
    ComiCake.layOut(),
    E.dispatch("bibi:laid-out")
};*/

L.loadContainer = function() {
    L.loadPackageDocument();
}



L.loadPackageDocument = function() {
    if(!B._manifest)
        O.download(B.Path).then(function(e) {
            B._manifest = JSON.parse(e.response);
            L.processPackageDocument(B._manifest);
        }).catch(function(e) {
            console.log(e);
            console.log("Failed to re-download manifest!?");
        })
    else
        L.processPackageDocument(B._manifest);
};

L.processPackageDocument = function(Doc) {
    //ComiCake.Book.define();
    B.Package.Metadata["rendition:layout"] = "pre-paginated",
    B.Package.Metadata["rendition:orientation"] = "portrait", // I think this is right?
    B.Package.Metadata["rendition:spread"] = "landscape", // TODO
    B.Package.Spine["page-progression-direction"] = "rtl", // TODO
    B.Package.Manifest["cover-image"].Path = Doc.metadata.image;
    B.Language = Doc.metadata.language;
    B.ID = Doc.metadata.identifier,
    B.Title = Doc.metadata.subtitle;
    parr = [];
    sML.each(Doc.metadata.publisher, function(publisher) {
        parr.push(publisher.name);
    });
    B.Publisher = parr.join(", "),
    carr = [];
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
    };
    L.LoadedSpreads = 0;
    ComiCake.forEach(Doc.spine, function(e, t) {
        var n = "item-" + sML.String.pad(t + 1, 0, 3);
        //var o = t % 2 ? "left" : "right";
        var o = t % 2 ? "right" : "left";
        console.log("Item: " + n + " direction " + o);
        if(S.FSP) {
            o = "center";
        }
        //B.Package.Manifest.items[n] = {
        B.Package.Manifest.items[n] = e;
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
                width: e.width
            }
        });
        if(!(t % 2) || S.FSP) 
            L.LoadedSpreads ++;
    });
    // TODO: Push discussion page at end
    
    if(B.Title) {
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
    IDLogs.push('Language: "'  + B.Language + '"');
    O.log(IDLogs.join(' / '), "-*");

    var MetaLogs = [];
    MetaLogs.push('rendition:layout: "' + B.Package.Metadata["rendition:layout"] + '"');
    MetaLogs.push('rendition:orientation: "' + B.Package.Metadata["rendition:orientation"] + '"');
    MetaLogs.push('rendition:spread: "' + B.Package.Metadata["rendition:spread"] + '"');
    MetaLogs.push('page-progression-direction: "' + B.Package.Spine["page-progression-direction"] + '"');
    O.log(MetaLogs.join(' / '), "-*");

    if(S["use-cookie"]) {
        var BibiCookie = O.Cookie.remember(O.RootPath);
        var BookCookie = O.Cookie.remember(B.ID);
        if(BibiCookie) {
            if(!U["reader-view-mode"] && BibiCookie.RVM) S["reader-view-mode"] = BibiCookie.RVM;
        }
        if(BookCookie) {
            if(!U["to"] && BookCookie.Position) S["to"] = BookCookie.Position;
        }
    }
    S.update(),
    E.dispatch("bibi:loaded-package-document");
    L.createCover();
    L.prepareSpine(function(e) {
        return document.createElement("div")
    }),
    /*L.loadNavigation().then(function() { // Taken care of by framework
        E.dispatch("bibi:prepared");
        L.loadItemsInSpreads();
    });*/
    E.dispatch("bibi:prepared");
    L.loadItemsInSpreads();
};

L.createCover = function() {

    O.log('Creating Cover...', "*:");

    I.Veil.Cover.Info.innerHTML = I.Panel.BookInfo.Cover.Info.innerHTML = "";

    if(B.Package.Manifest["cover-image"].Path) {
        R.CoverImage.Path = B.Package.Manifest["cover-image"].Path;
    }

    I.Veil.Cover.Info.innerHTML = I.Panel.BookInfo.Cover.Info.innerHTML = (function() {
        var BookID = [];
        if(B.Title)     BookID.push('<strong>' + B.Title     + '</strong>');
        if(B.Creator)   BookID.push('<em>'     + B.Creator   + '</em>');
        if(B.Publisher) BookID.push('<span>'   + B.Publisher + '</span>');
        return BookID.join(" ");
    })();

    if(R.CoverImage.Path) {
        O.log('Cover Image: ' + R.CoverImage.Path, "-*");
        sML.create("img", {
            load: function() {
                //O.log('Loading Cover Image: ' + R.CoverImage.Path + ' ...', "*:");
                var Img = this;
                Img.src = B.Files[R.CoverImage.Path] ? O.getDataURI(R.CoverImage.Path, B.Files[R.CoverImage.Path]) : R.CoverImage.Path;
                Img.timeout = setTimeout(function() { Img.ontimeout(); }, 5000)
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
        O.log('No Cover Image.', "-*");
        I.Veil.Cover.className = I.Panel.BookInfo.Cover.className = "without-cover-image";
    }

    O.log('Cover Created.', "/*");
    E.dispatch("bibi:created-cover", R.CoverImage.Path);
};

I.createPoweredBy = function() {

    I.PoweredBy = O.Body.appendChild(sML.create("div", { id: "bibi-poweredby", innerHTML: [
        '<p>',
            '<a href="' + Bibi["href"] + '" target="_blank" title="BiB/i | Official Website">',
                '<span>BiB/i</span>',
                '<img class="bibi-logo-white" alt="" src="' + O.RootPath + 'res/images/bibi-logo_white.png" />',
                '<img class="bibi-logo-black" alt="" src="' + O.RootPath + 'res/images/bibi-logo_black.png" />',
            '</a>',
        '</p>'
    ].join("") }));

    // Optimize to Scrollbar Size
    sML.appendStyleRule([
        "html.view-paged div#bibi-poweredby",
        "html.view-horizontal div#bibi-poweredby",
        "html.page-rtl.panel-opened div#bibi-poweredby"
    ].join(", "), "bottom: " + (O.Scrollbars.Height) + "px;");

};

L.loadItem = function(e) {
    e.ImageSource = e.Path;
    e.Loaded = false;
    e.TimeCard = {};
    e.stamp = function(What) { O.stamp(What, e.TimeCard); };
    e.Content = e.appendChild(sML.create("img", {
        className: "item-content item-image",
        alt: "",
        onload: function() {
            L.loadItem.onLoadPlaceholder(e)
        }
    }));
    e.Content.src = "http://localhost:8000/static/img/placeholder.svg"; // TODO CHANGE JUST TEMP
    /*e.Content.addEventListener("touchstart", function(e) {
        I.Swiper && e.touches.length >= 2 && I.Swiper.close()
    }),
    e.Content.addEventListener("touchend", function(e) {
        I.Swiper && I.Swiper.open()
    })*/
};

L.loadItem.onLoadPlaceholder = function(e) {
    e.Loaded = true; // "Loaded"
    L.LoadedItems++;
    ComiCake.LoadedLowSources++;
    if(ComiCake.LoadedLowSources >= R.Items.length - 1){
        //O.log(ComiCake.LoadingContentDescription, "-*");
        ComiCake.layOut();
    }
    0 == e.ItemIndex && L.loadItem.loadImage(e)
};

L.loadItem.loadImage = function(e) {
    sML.create("img", {
        onload: function() {
            L.loadItem.onLoadImage(e)
        }
    }).src = e.ImageSource
};

L.onLoadItemsInSpreads = function() {
    B.Files = {};
    //R.resetPages();
    O.stamp("Items in Spreads Loaded"),
    O.log(ComiCake.LoadingContentDescription + " Loaded.", "/*"),
    delete ComiCake.LoadingContentDescription,
    E.dispatch("bibi:loaded-items"),
    E.dispatch("bibi:loaded-spreads"),
    E.dispatch("bibi:loaded-items-in-spreads"),
    ComiCake.ScrollCoordsNeedToBeTreated = ComiCake.detectThatScrollCoordsNeedToBeTreated(),
    L.Preprocessed = true;
    E.dispatch("bibi:preprocessed-resources");
    I.setUIState(I.Menu.Config.SubPanel.WindowSection.ButtonGroup.children[0].children[0], S.FSP ? "active" : "default");
    L.onLoadBook()
};

ComiCake.detectThatScrollCoordsNeedToBeTreated = function() {
    var e = R.Main.scrollLeft;
    R.Main.scrollLeft = 10;
    var t = !sML.UA.InternetExplorer && 10 == R.Main.scrollLeft;
    return R.Main.scrollLeft = e,
    t
};

R.getFrameState = function() {
    var e = sML.Coord.getScrollCoord(R.Main)
      , t = sML.Coord.getClientSize(R.Main);
    return ComiCake.ScrollCoordsNeedToBeTreated && (e.X = e.X + t.W - R.Main.scrollWidth),
    {
        Coord: e,
        Size: t
    }
};

R.focusOn.getScrollTarget = function(e) {
    var t = {
        Frame: R.Main,
        X: 0,
        Y: 0
    }
      , n = (sML.Coord.getScrollCoord(R.Main),
    sML.Coord.getClientSize(R.Main));
    return ComiCake.ScrollCoordsNeedToBeTreated && (e = e - n.W + R.Main.scrollWidth),
    t[S.AXIS.L] = e * R.Scale,
    t
};
/*
R.focusOn.getScrollTarget = function(FocusPoint) {
    var ScrollTarget = { Frame: R.Main, X: 0, Y: 0 };
    ScrollTarget[S.AXIS.L] = FocusPoint;
    return ScrollTarget;
};*/

L.loadItem.onLoadImage = function(e) {
    ComiCake.LoadedImages++;
    //E.dispatch("bibi:loaded-item", e);
    e.stamp("Loaded");
    sML.addClass(e.ItemBox, "image-item-box");
    sML.addClass(e, "image-item");
    e.Content.onload = function() {}
    ,
    e.Content.src = e.ImageSource,
    ComiCake.layOut(),
    e.ItemIndex + 1 < R.Items.length - 1 && setTimeout(function() {
        L.loadItem.loadImage(R.Items[e.ItemIndex + 1])
    }, 10),
    0 == e.ItemIndex && setTimeout(function() {
        R.Main.Book.style.opacity = "",
        L.onLoadItemsInSpreads()
    }, O.Mobile ? 99 : 1)
};

ComiCake.loadExtraItem = function(e) {
    e.Content = e.appendChild(sML.create("div", {
        className: "item-content extra-content",
        innerHTML: ComiCake.ExtraInnerHTML,
        Item: e
    })),
    sML.addClass(e.Spread.SpreadBox, "extra-spread-box"),
    delete ComiCake.ExtraInnerHTML,
    ComiCake.Extra = e.Content,
    O.download("/" + (ComiCake["4pComics"] ? ComiCake.Book.Region + "/" : "") + ComiCake.Book.Category + "/" + ComiCake.Book.WorkID + "/meta.json").then(function(e) {
        e && ComiCake.applyMeta(e)
    })
};

L.loadItemsInSpreads = function() {
    ComiCake.LoadingContentDescription = R.Items.length + " Items in " + (R.Spreads.length) + " Spreads (includes 1 discussion page)",
    O.stamp("Load Items in Spreads"),
    O.log("Loading " + ComiCake.LoadingContentDescription + "...", "*:"),
    R.resetStage(),

    R.Main.Book.style.opacity = 0,
    ComiCake.LoadedLowSources = 0,
    ComiCake.LoadedImages = 0,
    L.LoadedItems = 0;
    R.ToBeLaidOutLater = true;
    window.addEventListener("resize", L.listenResizingWhileLoading);
    ComiCake.forEach(R.Items, function(e, t) {
        "extra" != e.ItemRef.idref ? L.loadItem(e) : ComiCake.loadExtraItem(e),
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
        e.Pages.push(n)
    }),
    ComiCake.SingleLeftItems = R.Main.Book.querySelectorAll(".item-box:first-child.page-spread-left > .item") || [],
    ComiCake.SingleRightItems = R.Main.Book.querySelectorAll(".item-box:last-child.page-spread-right > .item") || [],
    ComiCake.SingleCenterItems = R.Main.Book.querySelectorAll(".item-box:first-child:last-child.page-spread-center > .item") || [],
    ComiCake.forEach(ComiCake.SingleLeftItems, function(e) {
        sML.addClass(e.Spread, "single-left-spread"),
        sML.addClass(e.Spread, "image-item-box")
    }),
    ComiCake.forEach(ComiCake.SingleRightItems, function(e) {
        sML.addClass(e.Spread, "single-right-spread")
        sML.addClass(e.Spread, "image-item-box")
    }),
    ComiCake.forEach(ComiCake.SingleCenterItems, function(e) {
        sML.addClass(e.Spread, "single-center-spread")
        sML.addClass(e.Spread, "image-item-box")
    })
};

R.initialize = function() {

    R.Main      = O.Body.insertBefore(sML.create("div", { id: "bibi-main", Transformation: { Scale: 1, Translation: { X: 0, Y: 0 } } }), O.Body.firstElementChild);
    R.Sub       = O.Body.insertBefore(sML.create("div", { id: "bibi-sub" }),  R.Main.nextSibling);
    R.Main.Book =  R.Main.appendChild(sML.create("div", { id: "bibi-main-book", "classList": ["book"] }));

    //R.Main = O.Body.querySelector("main"),
    //R.Main.Book = O.Body.querySelector(".book"),
    //R.Sub = O.Body.insertBefore(sML.create("div"), R.Main.nextSibling)

    R.reset();

    E.add("bibi:scrolled", function() {
        R.getCurrent();
        if(S["use-cookie"] && R.Current.Page) {
            O.Cookie.eat(B.ID, {
                "Position": {
                    SpreadIndex: R.Current.Pages.StartPage.Spread.SpreadIndex,
                    PageProgressInSpread: R.Current.Pages.StartPage.PageIndexInSpread / R.Current.Pages.StartPage.Spread.Pages.length
                }
            });
        }
    });

    //if(!O.Mobile) {
        O.HTML.addEventListener(O["pointermove"], R.onpointermove);
        //O.HTML.addEventListener(O["pointerover"], R.onpointermove);
        //O.HTML.addEventListener(O["pointerout"],  R.onpointermove);
        E.add("bibi:loaded-item", function(Item) {
            Item.HTML.addEventListener(O["pointermove"], R.onpointermove);
            //Item.HTML.addEventListener(O["pointerover"], R.onpointermove);
            //Item.HTML.addEventListener(O["pointerout"],  R.onpointermove);
        });
    //}

    I.observeTap(O.HTML);
    O.HTML.addTapEventListener("tap",         R.ontap);
    O.HTML.addEventListener(O["pointerdown"], R.onpointerdown);
    O.HTML.addEventListener(O["pointerup"],   R.onpointerup);
    E.add("bibi:loaded-item", function(Item) {
        I.observeTap(Item.HTML);
        Item.HTML.addTapEventListener("tap",         R.ontap);
        Item.HTML.addEventListener(O["pointerdown"], R.onpointerdown);
        Item.HTML.addEventListener(O["pointerup"],   R.onpointerup);
    });

};

R.resetItem.asPrePaginatedItem = function(Item) {
    var ItemIndex = Item.ItemIndex, ItemRef = Item.ItemRef, ItemBox = Item.ItemBox, Spread = Item.Spread;
    Item.HTML.style.margin = Item.HTML.style.padding = Item.Body.style.margin = Item.Body.style.padding = 0;
    var StageB = R.Stage[S.SIZE.B];
    var StageL = R.Stage[S.SIZE.L];
    var PageB = StageB;
    var PageL = StageL;
    Item.style.padding = 0;
    if(Item.Scale) {
        var Scale = Item.Scale;
        delete Item.Scale;
    } else {
        var Scale = 1;
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
};

R.layOutSpread = function(Spread) {
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
            SpreadBox.PaddingBefore = 0;
            SpreadBox.PaddingAfter = 0;
        }
    } else if(S.RVM == "paged") {
        if(Spread.SpreadIndex == 0) {
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
};

R.resetSpread = function(Spread) {
    O.stamp("Reset Spread " + Spread.SpreadIndex + " Start");
    E.dispatch("bibi:is-going-to:reset-spread", Spread);
    Spread.Items.forEach(function(Item) {
        R.resetItem(Item);
    });
    var SpreadBox = Spread.SpreadBox;
    SpreadBox.style["margin" + S.BASE.B] = SpreadBox.style["margin" + S.BASE.A] = "";
    SpreadBox.style["margin" + S.BASE.E] = SpreadBox.style["margin" + S.BASE.S] = "auto";
    SpreadBox.style.padding = SpreadBox.style.width = SpreadBox.style.height = "";
    if(Spread.RenditionLayout == "reflowable" || (S.BRL == "reflowable" && S.SLA == "vertical") || (S.BRL == "pre-paginated" && S.SLA == "vertical")) { // || S.FSP
        if(Spread.Items.length == 2/* && !S.FSP*/) {
            // Always show single page spreads when vertical
            if(false && (R.Stage.Width > Spread.Items[0].ItemBox.offsetWidth + Spread.Items[1].ItemBox.offsetWidth)) {
                var Width  =          Spread.Items[0].ItemBox.offsetWidth + Spread.Items[1].ItemBox.offsetWidth;
                var Height = Math.max(Spread.Items[0].ItemBox.offsetHeight, Spread.Items[1].ItemBox.style.offsetHeight);
            } else {
                var Width  = Math.max(Spread.Items[0].ItemBox.offsetWidth,   Spread.Items[1].ItemBox.offsetWidth);
                var Height =          Spread.Items[0].ItemBox.offsetHeight + Spread.Items[1].ItemBox.offsetHeight;
            }
        } else {
            /*if(S.FSP && S.RVM == "paged" && Spread.Items.length == 2) {
                
            } else {
                */var Width  = Spread.Items[0].ItemBox.offsetWidth;
                var Height = Spread.Items[0].ItemBox.offsetHeight;/*
            }*/
        }
    } else {
        if(Spread.Items.length == 2) {
            var Width  =          Spread.Items[0].ItemBox.offsetWidth + Spread.Items[1].ItemBox.offsetWidth;
            var Height = Math.max(Spread.Items[0].ItemBox.offsetHeight, Spread.Items[1].ItemBox.style.offsetHeight);
        } else {
            var Width  = Spread.Items[0].ItemBox.offsetWidth * (Spread.Items[0].ItemRef["page-spread"] == "left" || Spread.Items[0].ItemRef["page-spread"] == "right" ? 2 : 1);
            var Height = Spread.Items[0].ItemBox.offsetHeight;
        }
    }
    SpreadBox.style.width  = Math.ceil(Width) + "px";
    SpreadBox.style.height = Math.ceil(Height) + "px";
    Spread.style["border-radius"] = S["spread-border-radius"];
    Spread.style["box-shadow"]    = S["spread-box-shadow"];
    E.dispatch("bibi:reset-spread", Spread);
    O.stamp("Reset Spread " + Spread.SpreadIndex + " End");
};

I.createKeyListener = function() {

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

};

I.createMenu = function() {

    // Menus
    if(!S["use-menubar"]) sML.addClass(O.HTML, "without-menubar");
    I.Menu = document.getElementById("bibi-menu");//.appendChild(sML.create("div", { id: "bibi-menu", on: { "click": function(Eve) { Eve.stopPropagation(); } } }));
    I.Menu.Height = I.Menu.offsetHeight;
    I.setHoverActions(I.Menu);
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
    E.add("bibi:scrolls", function() {
        clearTimeout(I.Menu.Timer_cool);
        if(!I.Menu.Hot) sML.addClass(I.Menu, "hot");
        I.Menu.Hot = true;
        I.Menu.Timer_cool = setTimeout(function() {
            I.Menu.Hot = false;
            sML.removeClass(I.Menu, "hot");
        }, 1234);
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

    I.createMenu.createPanelSwitch();

    I.createMenu.SettingMenuComponents = [];
    if(!S["fix-reader-view-mode"])                                                                     I.createMenu.SettingMenuComponents.push("ViewModeButtons");
    if(O.WindowEmbedded)                                                                               I.createMenu.SettingMenuComponents.push("NewWindowButton");
    if(O.FullscreenEnabled && !O.Mobile)                                                               I.createMenu.SettingMenuComponents.push("FullscreenButton");
    if(S["website-href"] && /^https?:\/\/[^\/]+/.test(S["website-href"]) && S["website-name-in-menu"]) I.createMenu.SettingMenuComponents.push("WebsiteLink");
    if(!S["remove-bibi-website-link"])                                                                 I.createMenu.SettingMenuComponents.push("BibiWebsiteLink");
    if(I.createMenu.SettingMenuComponents.length) I.createMenu.createSettingMenu();

    E.dispatch("bibi:created-menu");

};


I.createMenu.createPanelSwitch = function() {

    // Panel Switch
    I.PanelSwitch = I.createButtonGroup({ Area: I.Menu.L, Sticky: true }).addButton({
        Type: "toggle",
        Labels: {
            default: { default: 'Open Index', ja: '目次を開く' },
            active:  { default: 'Close Index', ja: '目次を閉じる' }
        },
        Help: true,
        Icon: '<span class="bibi-icon bibi-icon-toggle-panel"><span class="bar-1"></span><span class="bar-2"></span><span class="bar-3"></span></span>',
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

};


I.createMenu.createSettingMenu = function() {

    I.Menu.Config = {};

    // Button
    I.Menu.Config.Button = I.createButtonGroup({ Area: I.Menu.R, Sticky: true }).addButton({
        Type: "toggle",
        Labels: {
            default: { default: 'Setting', ja: '設定を変更' },
            active:  { default: 'Close Setting-Menu', ja: '設定メニューを閉じる' }
        },
        Help: true,
        Icon: '<span class="bibi-icon bibi-icon-setting"></span>'
    });

    // Sub Panel
    I.Menu.Config.SubPanel = I.createSubPanel({ Opener: I.Menu.Config.Button, id: "bibi-subpanel_change-view" });

    if(I.createMenu.SettingMenuComponents.includes("ViewModeButtons")                                                                   ) I.createMenu.createSettingMenu.createViewModeSection();
    if(I.createMenu.SettingMenuComponents.includes("NewWindowButton") || I.createMenu.SettingMenuComponents.includes("FullscreenButton")) I.createMenu.createSettingMenu.createWindowSection();
    if(I.createMenu.SettingMenuComponents.includes("WebsiteLink")     || I.createMenu.SettingMenuComponents.includes("BibiWebsiteLink") ) I.createMenu.createSettingMenu.createLinkageSection();

};


I.createMenu.createSettingMenu.createViewModeSection = function() {

    // Shapes
    var Shape = {};
    Shape.Item         = '<span class="bibi-shape bibi-shape-item"></span>';
    Shape.Spread       = '<span class="bibi-shape bibi-shape-spread">' + Shape.Item + Shape.Item + '</span>';

    // Icons
    var Icon = {};
    Icon["paged"]      = '<span class="bibi-icon bibi-icon-view-paged"><span class="bibi-shape bibi-shape-spreads bibi-shape-spreads-paged">' + Shape.Spread + Shape.Spread + Shape.Spread + '</span></span>';
    Icon["horizontal"] = '<span class="bibi-icon bibi-icon-view-horizontal"><span class="bibi-shape bibi-shape-spreads bibi-shape-spreads-horizontal">' + Shape.Spread + Shape.Spread + Shape.Spread + '</span></span>';
    Icon["vertical"]   = '<span class="bibi-icon bibi-icon-view-vertical"><span class="bibi-shape bibi-shape-spreads bibi-shape-spreads-vertical">' + Shape.Spread + Shape.Spread + Shape.Spread + '</span></span>';

    var changeView = function() {
        R.changeView(this.Value);
    };

    I.Menu.Config.SubPanel.ViewModeSection = I.Menu.Config.SubPanel.addSection({
        Labels: { default: { default: 'Choose Layout', ja: 'レイアウトを選択' } },
        ButtonGroup: {
            Buttons: [
                {
                    Type: "radio",
                    Labels: {
                        default: {
                            default: '<span class="non-visual-in-label">Layout:</span> Each Page <small>(Flip with ' + (O.Mobile ? 'Tap/Swipe' : 'Click/Wheel') + ')</small>',
                            ja: 'ページ単位表示<small>（' + (O.Mobile ? 'タップ／スワイプ' : 'クリック／ホイール') + 'で移動）</small>'
                        }
                    },
                    Notes: true,
                    Icon: Icon["paged"],
                    Value: "paged",
                    action: changeView
                },
                {
                    Type: "radio",
                    Labels: {
                        default: {
                            default: '<span class="non-visual-in-label">Layout:</span> All Pages <small>(Horizontal Scroll)</small>',
                            ja: '全ページ表示<small>（横スクロール移動）</small>'
                        }
                    },
                    Notes: true,
                    Icon: Icon["horizontal"],
                    Value: "horizontal",
                    action: changeView
                },
                {
                    Type: "radio",
                    Labels: {
                        default: {
                            default: '<span class="non-visual-in-label">Layout:</span> All Pages <small>(Vertical Scroll)</small>',
                            ja: '全ページ表示<small>（縦スクロール移動）</small>'
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

};


I.createMenu.createSettingMenu.createWindowSection = function() {

    var Buttons = [];

    // New Window
    if(I.createMenu.SettingMenuComponents.includes("NewWindowButton")) Buttons.push({
        Type: "link",
        Labels: {
            default: { default: 'Open in New Window', ja: 'あたらしいウィンドウで開く' }
        },
        Icon: '<span class="bibi-icon bibi-icon-open-newwindow"></span>',
        href: O.RequestedURL,
        target: "_blank"
    });

    // Force Single Page Reading
    FSPToggle = {
        Type: "toggle",
        Labels: {
            default: { default: 'Force Single Page', ja: '' },
            active:  { default: 'Force Single Page', ja: '' }
        },
        Icon: '<span class="bibi-icon bibi-icon-toggle-forcesinglepage"></span>',
        action: function() {
            var Button = this;
            S.FSP = !S.FSP;
            if(S["use-cookie"]) {
                O.Cookie.eat(O.RootPath, { "force-single-page": S.FSP });
            }
            window.removeEventListener(O["resize"], R.onresize);
            R.Main.removeEventListener("scroll", R.onscroll);
            L.loadBook({ Path: B.Path });
            I.Panel.parentNode.removeChild(I.Panel);
            I.createPanel();
            if(S.FSP) {
                E.dispatch("bibi:relaxed-fsp");
            } else {
                E.dispatch("bibi:enforced-fsp");
            }
        }
    };
    if(I.createMenu.SettingMenuComponents.includes("FullscreenButton")) Buttons.push(FSPToggle, {
        Type: "toggle",
        Labels: {
            default: { default: 'Enter Fullscreen', ja: 'フルスクリーンモード' },
            active:  { default: 'Exit Fullscreen', ja: 'フルスクリーンモード解除' }
        },
        Icon: '<span class="bibi-icon bibi-icon-toggle-fullscreen"></span>',
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
        Labels: { default: { default: 'Window Operation', ja: 'ウィンドウ操作' } },
        ButtonGroup: {
            Buttons: Buttons
        }
    });

};


I.createMenu.createSettingMenu.createLinkageSection = function() {

    var Buttons = [];

    if(I.createMenu.SettingMenuComponents.includes("WebsiteLink")) Buttons.push({
        Type: "link",
        Labels: {
            default: { default: S["website-name-in-menu"].replace(/&/gi, '&amp;').replace(/</gi, '&lt;').replace(/>/gi, '&gt;') }
        },
        Icon: '<span class="bibi-icon bibi-icon-open-newwindow"></span>',
        href: S["website-href"],
        target: "_blank"
    });

    if(I.createMenu.SettingMenuComponents.includes("BibiWebsiteLink")) Buttons.push({
        Type: "link",
        Labels: {
            default: { default: "BiB/i | Official Website" }
        },
        Icon: '<span class="bibi-icon bibi-icon-open-newwindow"></span>',
        href: Bibi["href"],
        target: "_blank"
    });

    I.Menu.Config.SubPanel.addSection({
        Labels: { default: { default: 'Link' + (Buttons.length > 1 ? 's' : ''), ja: 'リンク' } },
        ButtonGroup: {
            Buttons: Buttons
        }
    });

};