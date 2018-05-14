import E from "./E";
import O from "./O";
import sML from "../vendor/sML";
import B from "./B";
import I from "./I";
import settings from "./S";
import L from "./L";
import X from "./X";

//==============================================================================================================================================
//----------------------------------------------------------------------------------------------------------------------------------------------

//-- Reader

//----------------------------------------------------------------------------------------------------------------------------------------------

class R { // Bibi.Reader
    constructor() {
        this.DefaultPageRatio = { X: 103, Y: 148 };//{ X: 1, Y: Math.sqrt(2) };
        this.onwheel.PreviousWheels = [];
        this.PreviousCoord = { X:0, Y:0 };

        this.catchOnresize = event => this.onresize(event);
        this.catchOnscroll = event => this.onscroll(event);

    }

    initialize() {

        this.Main      = O.Body.insertBefore(sML.create("div", { id: "bibi-main", Transformation: { Scale: 1, Translation: { X: 0, Y: 0 } } }), O.Body.firstElementChild);
        this.Sub       = O.Body.insertBefore(sML.create("div", { id: "bibi-sub" }),  this.Main.nextSibling);
        this.Main.Book =  this.Main.appendChild(sML.create("div", { id: "bibi-main-book" }));
    
        this.reset();
    
        E.add("bibi:scrolled", () => {
            this.getCurrent();
            if(settings.S["use-cookie"] && this.Current.Page) {
                O.Cookie.eat(B.ID, {
                    "Position": {
                        SpreadIndex: this.Current.Pages.StartPage.Spread.SpreadIndex,
                        PageProgressInSpread: this.Current.Pages.StartPage.PageIndexInSpread / this.Current.Pages.StartPage.Spread.Pages.length
                    }
                });
            }
        });
    
        E.add("bibi:resized", () => {
            this.layOut({
                Reset: true,
                Setting: (Option && Option.Setting ? Option.Setting : undefined)
            });
        });
    
        //if(!O.Mobile) {
        O.HTML.addEventListener(O["pointermove"], event => this.onpointermove(event));
        //O.HTML.addEventListener(O["pointerover"], this.onpointermove);
        //O.HTML.addEventListener(O["pointerout"],  this.onpointermove);
        E.add("bibi:loaded-item", (Item) => {
            Item.HTML.addEventListener(O["pointermove"], event => this.onpointermove(event));
            //Item.HTML.addEventListener(O["pointerover"], this.onpointermove);
            //Item.HTML.addEventListener(O["pointerout"],  this.onpointermove);
        });
        //}
    
        I.observeTap(O.HTML);
        O.HTML.addTapEventListener("tap",         event => this.ontap(event));
        O.HTML.addEventListener(O["pointerdown"], event => this.onpointerdown(event));
        O.HTML.addEventListener(O["pointerup"],   event => this.onpointerup(event));
        E.add("bibi:loaded-item", (Item) => {
            I.observeTap(Item.HTML);
            Item.HTML.addTapEventListener("tap",         event => this.ontap(event));
            Item.HTML.addEventListener(O["pointerdown"], event => this.onpointerdown(event));
            Item.HTML.addEventListener(O["pointerup"],   event => this.onpointerup(event));
        });
    
    }
    
    
    reset() {
        this.Started = false;
        this.AllItems = [], this.NonLinearItems = [];
        this.Spreads = [], this.Items = [], this.Pages = [];
        this.CoverImage = { Path: "" };
        this.Current = {};
        this.Main.Book.innerHTML = this.Sub.innerHTML = "";
    }
    
    
    resetStage() {
        this.Stage = {};
        this.Columned = false;
        this.Main.Book.style.padding = this.Main.Book.style.width = this.Main.Book.style.height = "";
        this.Stage.Width  = O.Body.clientWidth;
        this.Stage.Height = O.Body.clientHeight;
        if(/FBAN/.test(navigator.userAgent)) {
            this.Stage.Height = window.innerHeight;
            O.HTML.style.height = window.innerHeight + "px";
            window.scrollTo(0, 0);
        }
        if(settings.S["use-full-height"]) {
            sML.addClass(O.HTML, "book-full-height");
        } else {
            sML.removeClass(O.HTML, "book-full-height");
            this.Stage.Height -= I.Menu.Height;
        }
        if(settings.S.RVM == "paged") {
            if(I.Slider) this.Stage.Height -= O.Scrollbars.Height;
            this.Stage.PageGap = this.Main.Book.style["padding" + settings.S.BASE.S] = this.Main.Book.style["padding" + settings.S.BASE.E] = 0;
        } else {
            this.Stage[settings.S.SIZE.B] -= O.Scrollbars[settings.S.SIZE.B] + settings.S["spread-margin"] * 2;
            this.Stage.PageGap = settings.S["spread-gap"];
            this.Main.Book.style["padding" + settings.S.BASE.S] = settings.S["spread-margin"] + "px";
            this.Main.Book.style["padding" + settings.S.BASE.E] = settings.S["spread-margin"] + "px";
        }
        this.Stage.Orientation = (this.Stage.Width / this.Stage.Height > 1.4) ? "landscape" : "portrait";
        this.Stage.BunkoLength = Math.floor(this.Stage[settings.S.SIZE.B] * this.DefaultPageRatio[settings.S.AXIS.L] / this.DefaultPageRatio[settings.S.AXIS.B]);
        if(settings.S["book-background"]) O.HTML.style["background"] = settings.S["book-background"];
    }
    
    resetSpread(Spread) {
        O.stamp("Reset Spread " + Spread.SpreadIndex + " Start");
        E.dispatch("bibi:is-going-to:reset-spread", Spread);
        Spread.Items.forEach((Item) => {
            this.resetItem(Item);
        });
        var SpreadBox = Spread.SpreadBox;
        SpreadBox.style["margin" + settings.S.BASE.B] = SpreadBox.style["margin" + settings.S.BASE.A] = "";
        SpreadBox.style["margin" + settings.S.BASE.E] = SpreadBox.style["margin" + settings.S.BASE.S] = "auto";
        SpreadBox.style.padding = SpreadBox.style.width = SpreadBox.style.height = "";
        var Width, Height;
        if(Spread.RenditionLayout == "reflowable" || (settings.S.BRL == "reflowable" && settings.S.SLA == "vertical") || (settings.S.BRL == "pre-paginated" && settings.S.SLA == "vertical")) { // || settings.S.FSP
            if(Spread.Items.length == 2/* && !settings.S.FSP*/) {
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
                /*if(settings.S.FSP && settings.S.RVM == "paged" && Spread.Items.length == 2) {
                    
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
        Spread.style["border-radius"] = settings.S["spread-border-radius"];
        Spread.style["box-shadow"]    = settings.S["spread-box-shadow"];
        E.dispatch("bibi:reset-spread", Spread);
        O.stamp("Reset Spread " + Spread.SpreadIndex + " End");
    }
    
    
    
    resetItem(Item) {
        O.stamp("Reset Item " + Item.ItemIndex + " Start");
        O.stamp("Reset Start", Item.TimeCard);
        E.dispatch("bibi:is-going-to:reset-item", Item);
        Item.Reset = false;
        Item.Pages = [];
        Item.scrolling = "no";
        Item.Spreaded = false;
        Item.style.margin = Item.style.padding = Item.style.width = Item.style.height = "";
        Item.HTML.style[settings.S.SIZE.b] = Item.HTML.style[settings.S.SIZE.l] = "";
        sML.style(Item.HTML, { "transform-origin": "", "transformOrigin": "", "transform": "", "column-width": "", "column-gap": "", "column-rule": "" });
        Item.Columned = false, Item.ColumnBreadth = 0, Item.ColumnLength = 0, Item.ColumnGap = 0;
        if(Item.PrePaginated) this.resetItem_asPrePaginatedItem(Item);
        //else if(Item.Outsourcing)  this.resetItem_asReflowableOutsourcingItem(Item);
        //else                       this.resetItem_asReflowableItem(Item);
        Item.Reset = true;
        E.dispatch("bibi:reset-item", Item);
        O.stamp("Reset End", Item.TimeCard);
        O.stamp("Reset Item " + Item.ItemIndex + " End");
    }
    /*
    resetItem_asReflowableItem(Item) {
        var ItemIndex = Item.ItemIndex, ItemRef = Item.ItemRef, ItemBox = Item.ItemBox, Spread = Item.Spread;
        var StageB = this.Stage[settings.S.SIZE.B];
        var StageL = this.Stage[settings.S.SIZE.L];
        var PageGap = this.Stage.PageGap;
        if(!/fill/.test(ItemRef["bibi:layout"])) {
            StageB  -= (settings.S["item-padding-" + settings.S.BASE.s] + settings.S["item-padding-" + settings.S.BASE.e]);
            StageL  -= (settings.S["item-padding-" + settings.S.BASE.b] + settings.S["item-padding-" + settings.S.BASE.a]);
            PageGap += (settings.S["item-padding-" + settings.S.BASE.b] + settings.S["item-padding-" + settings.S.BASE.a]);
            Item.style["padding-" + settings.S.BASE.b] = settings.S["item-padding-" + settings.S.BASE.b] + "px";
            Item.style["padding-" + settings.S.BASE.a] = settings.S["item-padding-" + settings.S.BASE.a] + "px";
            Item.style["padding-" + settings.S.BASE.s] = settings.S["item-padding-" + settings.S.BASE.s] + "px";
            Item.style["padding-" + settings.S.BASE.e] = settings.S["item-padding-" + settings.S.BASE.e] + "px";
        }
        var PageB = StageB;
        var PageL = StageL;
        if(!settings.S["single-page-always"] && /-tb$/.test(B.WritingMode) && settings.S.SLA == "horizontal" && !/fill-spread/.test(ItemRef["bibi:layout"])) {
            var BunkoL = Math.floor(PageB * this.DefaultPageRatio[settings.S.AXIS.L] / this.DefaultPageRatio[settings.S.AXIS.B]);
            var StageHalfL = Math.floor((StageL - PageGap) / 2);
            if(StageHalfL >= BunkoL) {
                Item.Spreaded = true;
                PageL = StageHalfL;
            }
        }
        Item.style[settings.S.SIZE.b] = PageB + "px";
        Item.style[settings.S.SIZE.l] = PageL + "px";
        this.resetItem_asReflowableItem_adjustContent(Item, PageB, PageL, PageGap);
        var ItemL = sML.UA.InternetExplorer ? Item.Body["client" + settings.S.SIZE.L] : Item.HTML["scroll" + settings.S.SIZE.L];
        var Pages = Math.ceil((ItemL + PageGap) / (PageL + PageGap));
        ItemL = (PageL + PageGap) * Pages - PageGap;
        Item.style[settings.S.SIZE.l] = ItemL + "px";
        if(sML.UA.InternetExplorer) Item.HTML.style[settings.S.SIZE.l] = "100%";
        var ItemBoxB = PageB;
        var ItemBoxL = ItemL + ((settings.S.RVM == "paged" && Item.Spreaded && Pages % 2) ? (PageGap + PageL) : 0);
        if(!/fill/.test(ItemRef["bibi:layout"])) {
            ItemBoxB += (settings.S["item-padding-" + settings.S.BASE.s] + settings.S["item-padding-" + settings.S.BASE.e]);
            ItemBoxL += (settings.S["item-padding-" + settings.S.BASE.b] + settings.S["item-padding-" + settings.S.BASE.a]);
        }
        ItemBox.style[settings.S.SIZE.b] = ItemBoxB + "px";
        ItemBox.style[settings.S.SIZE.l] = ItemBoxL + "px";
        for(var i = 0; i < Pages; i++) {
            var Page = ItemBox.appendChild(sML.create("span", { className: "page" }));
            if(!/fill/.test(ItemRef["bibi:layout"])) {
                Page.style["padding" + settings.S.BASE.B] = settings.S["item-padding-" + settings.S.BASE.b] + "px";
                Page.style["padding" + settings.S.BASE.A] = settings.S["item-padding-" + settings.S.BASE.a] + "px";
                Page.style["padding" + settings.S.BASE.S] = settings.S["item-padding-" + settings.S.BASE.s] + "px";
                Page.style["padding" + settings.S.BASE.E] = settings.S["item-padding-" + settings.S.BASE.e] + "px";
            }
            Page.style[settings.S.SIZE.b] = PageB + "px";
            Page.style[settings.S.SIZE.l] = PageL + "px";
            Page.style[settings.S.BASE.b] = (PageL + PageGap) * i + "px";
            Page.Item = Item, Page.Spread = Spread;
            Page.PageIndexInItem = Item.Pages.length;
            Item.Pages.push(Page);
        }
        return Item;
    }

    resetItem_asReflowableItem_adjustContent(Item, PageB, PageL, PageGap) {
        E.dispatch("bibi:is-going-to:adjust-content", Item);
        var WordWrappingStyleSheetIndex = sML.appendStyleRule("*", "word-wrap: break-word;", Item.contentDocument); ////
        this.resetItem_asReflowableItem_adjustContent_fitImages(Item, PageB, PageL);
        this.resetItem_asReflowableItem_adjustContent_columify(Item, PageB, PageL, PageGap);
        if(settings.S["page-breaking"]) this.resetItem_asReflowableItem_adjustContent_breakPages(Item, PageB);
        sML.deleteStyleRule(WordWrappingStyleSheetIndex, Item.contentDocument); ////
        E.dispatch("bibi:adjusted-content", Item);
    }

    resetItem_asReflowableItem_adjustContent_fitImages(Item, PageB, PageL) {
        sML.each(Item.Body.getElementsByTagName("img"), () => {
            if(!this.Bibi || !this.Bibi.DefaultStyle) return;
            //this.style.display       = this.Bibi.DefaultStyle["display"];
            //this.style.verticalAlign = this.Bibi.DefaultStyle["vertical-align"];
            this.style.width         = this.Bibi.DefaultStyle["width"];
            this.style.height        = this.Bibi.DefaultStyle["height"];
            var B = parseFloat(getComputedStyle(this)[settings.S.SIZE.b]);
            var L = parseFloat(getComputedStyle(this)[settings.S.SIZE.l]);
            var MaxB = Math.floor(Math.min(parseFloat(getComputedStyle(Item.Body)[settings.S.SIZE.b]), PageB));
            var MaxL = Math.floor(Math.min(parseFloat(getComputedStyle(Item.Body)[settings.S.SIZE.l]), PageL));
            if(B > MaxB || L > MaxL) {
                //if(getComputedStyle(this).display == "inline") this.style.display = "inline-block";
                //this.style.verticalAlign = "top";
                this.style[settings.S.SIZE.b] = Math.floor(parseFloat(getComputedStyle(this)[settings.S.SIZE.b]) * Math.min(MaxB / B, MaxL / L)) + "px";
                this.style[settings.S.SIZE.l] = "auto";
            }
        });
    }

    resetItem_asReflowableItem_adjustContent_columify(Item, PageB, PageL, PageGap) {
        if(settings.S.RVM == "paged" || Item.HTML["offset"+ settings.S.SIZE.B] > PageB) {
            this.Columned = Item.Columned = true, Item.ColumnBreadth = PageB, Item.ColumnLength = PageL, Item.ColumnGap = PageGap;
            Item.HTML.style[settings.S.SIZE.b] = PageB + "px";
            Item.HTML.style[settings.S.SIZE.l] = PageL + "px";
            sML.style(Item.HTML, {
                "column-fill": "auto",
                "column-width": Item.ColumnLength + "px",
                "column-gap": Item.ColumnGap + "px",
                "column-rule": ""
            });
        }
    }

    resetItem_asReflowableItem_adjustContent_breakPages(Item, PageB) {
        var PBR; // PageBreakerRulers
        if(Item.Body["offset" + settings.S.SIZE.B] <= PageB) PBR = [(settings.S.SLA == "vertical" ? "Top" : "Left"), window["inner" + settings.S.SIZE.L], settings.S.SIZE.L, settings.S.SIZE.l, settings.S.BASE.a];
        else                                        PBR = [(settings.S.SLA == "vertical" ? "Left" : "Top"), PageB, settings.S.SIZE.B, settings.S.SIZE.b, settings.S.BASE.e];
        sML.each(Item.contentDocument.querySelectorAll("html>body *"), () => {
            var ComputedStyle = getComputedStyle(this);
            if(ComputedStyle.pageBreakBefore != "always" && ComputedStyle.pageBreakAfter != "always") return;
            if(this.BibiPageBreakerBefore) this.BibiPageBreakerBefore.style[PBR[3]] = "";
            if(this.BibiPageBreakerAfter)  this.BibiPageBreakerAfter.style[PBR[3]] = "";
            var Ele = this,                                 BreakPoint  = Ele["offset" + PBR[0]], Add = 0;
            while(Ele.offsetParent) Ele = Ele.offsetParent, BreakPoint += Ele["offset" + PBR[0]];
            if(settings.S.SLD == "rtl") BreakPoint = window["innerWidth"] + BreakPoint * -1 - this["offset" + PBR[2]];
            if(ComputedStyle.pageBreakBefore == "always") {
                if(!this.BibiPageBreakerBefore) this.BibiPageBreakerBefore = this.parentNode.insertBefore(sML.create("span", { className: "bibi-page-breaker-before" }, { display: "block" }), this);
                Add = (PBR[1] - BreakPoint % PBR[1]); if(Add == PBR[1]) Add = 0;
                this.BibiPageBreakerBefore.style[PBR[3]] = Add + "px";
            }
            if(ComputedStyle.pageBreakAfter == "always") {
                BreakPoint += Add + this["offset" + PBR[2]];
                this.style["margin-" + PBR[4]] = 0;
                if(!this.BibiPageBreakerAfter) this.BibiPageBreakerAfter = this.parentNode.insertBefore(sML.create("span", { className: "bibi-page-breaker-after" }, { display: "block" }), this.nextSibling);
                Add = (PBR[1] - BreakPoint % PBR[1]); if(Add == PBR[1]) Add = 0;
                this.BibiPageBreakerAfter.style[PBR[3]] = Add + "px";
            }
        });
    }
    
    resetItem_asReflowableOutsourcingItem(Item, Fun) {
        var ItemIndex = Item.ItemIndex, ItemRef = Item.ItemRef, ItemBox = Item.ItemBox, Spread = Item.Spread;
        Item.style.margin = "auto";
        Item.style.padding = 0;
        var StageB = this.Stage[settings.S.SIZE.B];
        var StageL = this.Stage[settings.S.SIZE.L];
        var PageB = StageB;
        var PageL = StageL;
        if(!settings.S["single-page-always"] && settings.S.SLA == "horizontal" && !/fill-spread/.test(ItemRef["bibi:layout"])) {
            var BunkoL = Math.floor(PageB * this.DefaultPageRatio[settings.S.AXIS.L] / this.DefaultPageRatio[settings.S.AXIS.B]);
            var StageHalfL = Math.floor((StageL - this.Stage.PageGap) / 2);
            if(StageHalfL > BunkoL) {
                Item.Spreaded = true;
                PageL = StageHalfL;
            }
        }
        Item.style[settings.S.SIZE.b] = ItemBox.style[settings.S.SIZE.b] = PageB + "px";
        Item.style[settings.S.SIZE.l] = ItemBox.style[settings.S.SIZE.l] = PageL + "px";
        if(Item.ImageItem) {
            if(Item.HTML["scroll" + settings.S.SIZE.B] <= PageB && Item.HTML["scroll" + settings.S.SIZE.L] <= PageL) {
                var ItemBodyComputedStyle = getComputedStyle(Item.Body);
                Item.style.width = Item.Body.offsetWidth + parseFloat(ItemBodyComputedStyle.marginLeft) + parseFloat(ItemBodyComputedStyle.marginRight) + "px";
            } else {
                if((settings.S.SLD == "ttb" && Item.HTML["scroll" + settings.S.SIZE.B] > PageB) || (settings.S.SLA == "horizontal" && Item.HTML["scroll" + settings.S.SIZE.L] > PageL)) {
                    var TransformOrigin = (/rl/.test(Item.HTML.WritingMode)) ? "100% 0" : "0 0";
                } else {
                    var TransformOrigin =  "50% 0";
                }
                var Scale = Math.floor(Math.min(PageB / Item.HTML["scroll" + settings.S.SIZE.B], PageL / Item.HTML["scroll" + settings.S.SIZE.L]) * 100) / 100;
                sML.style(Item.HTML, {
                    "transform-origin": TransformOrigin,
                    "transform": "scale(" + Scale + ")"
                });
            }
            sML.each(Item.Body.getElementsByTagName("img"), function() {
                var IMG = this;
                IMG.style.maxWidth = "none";
                setTimeout(function() {
                    IMG.style.maxWidth = "";
                }, 0);
            });
        } else if(Item.FrameItem) {
            var IFrame = Item.Body.getElementsByTagName("iframe")[0];
            IFrame.style[settings.S.SIZE.b] = IFrame.style[settings.S.SIZE.l] = "100%";
        }
        var Page = ItemBox.appendChild(sML.create("span", { className: "page" }));
        Page.style[settings.S.SIZE.b] = PageB + "px";
        Page.style[settings.S.SIZE.l] = PageL + "px";
        Page.style[settings.S.BASE.b] = 0;
        Page.Item = Item, Page.Spread = Spread;
        Page.PageIndexInItem = Item.Pages.length;
        Item.Pages.push(Page);
        return Item;
    }*/
    
    resetItem_asPrePaginatedItem(Item) {
        var ItemIndex = Item.ItemIndex, ItemRef = Item.ItemRef, ItemBox = Item.ItemBox, Spread = Item.Spread;
        Item.HTML.style.margin = Item.HTML.style.padding = Item.Body.style.margin = Item.Body.style.padding = 0;
        var StageB = this.Stage[settings.S.SIZE.B];
        var StageL = this.Stage[settings.S.SIZE.L];
        var PageB = StageB;
        var PageL = StageL;
        Item.style.padding = 0;
        var Scale;
        if(Item.Scale) {
            Scale = Item.Scale;
            delete Item.Scale;
        } else {
            Scale = 1;
            // (settings.S.BRL == "pre-paginated" && settings.S.SLA == "vertical") || 
            if(this.Stage.Orientation == ItemRef["rendition:spread"] || ItemRef["rendition:spread"] == "both") {
                var SpreadViewPort = { Width: ItemRef["viewport"].width, Height: ItemRef["viewport"].height };
                if(Item.SpreadPair) SpreadViewPort.Width += Item.SpreadPair.ItemRef["viewport"].width;
                else if(ItemRef["page-spread"] == "right" || ItemRef["page-spread"] == "left") SpreadViewPort.Width += SpreadViewPort.Width;
                Scale = Math.min(
                    PageB / SpreadViewPort[settings.S.SIZE.B],
                    PageL / SpreadViewPort[settings.S.SIZE.L]
                );
            } else {
                Scale = Math.min(
                    PageB / ItemRef["viewport"][settings.S.SIZE.b],
                    PageL / ItemRef["viewport"][settings.S.SIZE.l]
                );
            }
            if(Item.SpreadPair) Item.SpreadPair.Scale = Scale;
        }
        var SO /*= ScaleOptimizing*/ = 1 / Scale;
        PageL = Math.floor(ItemRef["viewport"][settings.S.SIZE.l] * Scale);
        PageB = Math.floor(ItemRef["viewport"][settings.S.SIZE.b] * (PageL / ItemRef["viewport"][settings.S.SIZE.l]));
        ItemBox.style[settings.S.SIZE.l] = PageL      + "px";
        ItemBox.style[settings.S.SIZE.b] = PageB      + "px";
        Item.style[settings.S.SIZE.l] = PageL * SO + "px";
        Item.style[settings.S.SIZE.b] = PageB * SO + "px";
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
        Page.style[settings.S.SIZE.b] = PageB + "px";
        Page.style[settings.S.SIZE.l] = PageL + "px";
        Page.Item = Item, Page.Spread = Spread;
        Page.PageIndexInItem = Item.Pages.length;
        Item.Pages.push(Page);
        return Item;
    }
    
    resetPages() {
        this.Pages.forEach((Page) => {
            Page.parentNode.removeChild(Page);
        });
        this.Pages = [];
        this.Spreads.forEach((Spread) => {
            Spread.Pages = [];
            Spread.Items.forEach((Item) => {
                Item.Pages.forEach((Page) => {
                    Page.PageIndexInSpread = Spread.Pages.length; Spread.Pages.push(Page);
                    Page.PageIndex         =      this.Pages.length;      this.Pages.push(Page);
                    Page.id = "page-" + sML.String.pad(Page.PageIndex + 1, 0, B.FileDigit);
                });
            });
        });
        return this.Pages;
    }
    
    resetNavigation() {/*
        if(settings.S.PPD == "rtl") {
            var theWidth = I.Panel.Navigation.scrollWidth - window.innerWidth;
            I.Panel.NavigationBox.scrollLeft = I.Panel.NavigationBox.scrollWidth - window.innerWidth;
        }
    */}
    
    
    layOutSpread(Spread) {
        O.stamp("Lay Out Spread " + Spread.SpreadIndex + " Start");
        E.dispatch("bibi:is-going-to:lay-out-spread", Spread);
        var SpreadBox = Spread.SpreadBox;
        SpreadBox.style.padding = "";
        SpreadBox.PaddingBefore = SpreadBox.PaddingAfter = 0;
        if(settings.S.SLA == "horizontal") {
            // Set padding-start + padding-end of SpreadBox
            if(SpreadBox.offsetHeight < this.Stage[settings.S.SIZE.B]) {
                var SpreadBoxPaddingTop    = Math.floor((this.Stage[settings.S.SIZE.B] - SpreadBox.offsetHeight) / 2);
                var SpreadBoxPaddingBottom = this.Stage[settings.S.SIZE.B] - (SpreadBoxPaddingTop + SpreadBox.offsetHeight);
                SpreadBox.style.paddingTop    = SpreadBoxPaddingTop + "px";
                SpreadBox.style.paddingBottom = SpreadBoxPaddingBottom + "px";
            }
        }
        if(settings.S.BRL == "pre-paginated") {
            if(this.Stage[settings.S.SIZE.L] >= SpreadBox["offset" + settings.S.SIZE.L]) {
                SpreadBox.PaddingBefore = SpreadBox.PaddingAfter = Math.ceil((this.Stage[settings.S.SIZE.L] - SpreadBox["offset" + settings.S.SIZE.L]) / 2);
            } else {
                var FirstItemInSpread = Spread.Items[0];
                if(this.Stage[settings.S.SIZE.L] >= FirstItemInSpread["offset" + settings.S.SIZE.L]) {
                    SpreadBox.PaddingBefore = Math.ceil((this.Stage[settings.S.SIZE.L] - FirstItemInSpread["offset" + settings.S.SIZE.L]) / 2);
                }
                var LastItemInSpread = Spread.Items[Spread.Items.length - 1];
                if(this.Stage[settings.S.SIZE.L] >= LastItemInSpread["offset" + settings.S.SIZE.L]) {
                    SpreadBox.PaddingAfter = Math.ceil((this.Stage[settings.S.SIZE.L] - LastItemInSpread["offset" + settings.S.SIZE.L]) / 2);
                }
            }
            if(Spread.SpreadIndex != 0) {
                var PreviousSpreadBox = this.Spreads[Spread.SpreadIndex - 1].SpreadBox;
                SpreadBox.PaddingBefore = SpreadBox.PaddingBefore - PreviousSpreadBox.PaddingAfter;
                if(SpreadBox.PaddingBefore < I.Menu.offsetHeight) SpreadBox.PaddingBefore = I.Menu.offsetHeight;
            }
            if(settings.S.RVM == "vertical") { // No vertical padding
                if(Spread.SpreadIndex == 0)
                    SpreadBox.PaddingBefore = 64;
                else
                    SpreadBox.PaddingBefore = 0;
                if(Spread.SpreadIndex + 1 == this.Spreads.length)
                    SpreadBox.PaddingAfter = 64;
                else
                    SpreadBox.PaddingAfter = 0;
            }
        } else if(settings.S.RVM == "paged") {
            if(Spread.SpreadIndex == 0) {
            } else {
                SpreadBox.PaddingBefore = this.Stage.PageGap;
            }
        } else {
            if(Spread.SpreadIndex == 0) {
                SpreadBox.PaddingBefore = Math.floor((this.Stage[settings.S.SIZE.L] - SpreadBox["offset" + settings.S.SIZE.L]) / 2);
            } else {
                SpreadBox.PaddingBefore = this.Stage.PageGap;
            }
            if(Spread.SpreadIndex == this.Spreads.length - 1) {
                SpreadBox.PaddingAfter  = Math.ceil( (this.Stage[settings.S.SIZE.L] - SpreadBox["offset" + settings.S.SIZE.L]) / 2);
            }
        }
        if(SpreadBox.PaddingBefore > 0) SpreadBox.style["padding" + settings.S.BASE.B] = SpreadBox.PaddingBefore + "px";
        if(SpreadBox.PaddingAfter  > 0) SpreadBox.style["padding" + settings.S.BASE.A] = SpreadBox.PaddingAfter  + "px";
        // Adjust this.Main.Book (div#epub-content-main)
        var MainContentLength = 0;
        this.Spreads.forEach((Spread) => {
            MainContentLength += Spread.SpreadBox["offset" + settings.S.SIZE.L];
        });
        this.Main.Book.style[settings.S.SIZE.b] = "";
        this.Main.Book.style[settings.S.SIZE.l] = MainContentLength + "px";
        E.dispatch("bibi:laid-out-spread", Spread);
        O.stamp("Lay Out Spread " + Spread.SpreadIndex + " End");
    }
    
    
    /*
    layOutStage() {
        var StageLength = 0;
        for(var l = this.Spreads.length, i = 0; i < l; i++) StageLength += this.Spreads[i].SpreadBox["offset" + settings.S.SIZE.L];
        this.Main.Book.style[settings.S.SIZE.l] = StageLength + "px";
    }
    */
    
    
    layOut(Opt) {
    
        /*
            Opt: {
                Destination: BibiDestination,
                Reset: Boolean,
                Setting: BibiSetting (Optional),
                callback: Function (Optional)
            }
        */
        if(!Opt) Opt = {};
    
        if(this.LayingOut) return false;
        this.LayingOut = true;
    
        O.log("Laying out...", "*:");
        O.stamp("Lay Out Start");
        E.dispatch("bibi:is-going-to:lay-out", Opt);
    
        window.removeEventListener(O["resize"], this.catchOnresize);
        this.Main.removeEventListener("scroll", this.catchOnscroll);
    
        O.Busy = true;
        sML.addClass(O.HTML, "busy");
        sML.addClass(O.HTML, "laying-out");
        if(!Opt.NoNotification) I.note("Laying Out...");
    
        if(!Opt.Destination) {
            this.getCurrent();
            var CurrentPage = this.Current.Pages.StartPage;
            Opt.Destination = {
                SpreadIndex: CurrentPage.Spread.SpreadIndex,
                PageProgressInSpread: CurrentPage.PageIndexInSpread / CurrentPage.Spread.Pages.length
            };
        }
    
        if(Opt.Setting) settings.update(Opt.Setting);
    
        O.log([
            "reader-view-mode: \"" + settings.S.RVM + "\"",
            "spread-layout-direction: \"" + settings.S.SLD + "\"",
            "apparent-reading-direction: \"" + settings.S.ARD + "\""
        ].join(" / "), "-*");
    
        if(typeof Opt.before == "function") Opt.before();
    
        //setTimeout(function() {
    
        if(Opt.Reset || this.ToBeLaidOutLater) {
            this.ToBeLaidOutLater = false;
            this.resetStage();
            this.Spreads.forEach((Spread) => { this.resetSpread(Spread); });
            this.resetPages();
            this.resetNavigation();
        }
        this.Spreads.forEach((Spread) => { this.layOutSpread(Spread); });
    
        this.Columned = false;
        for(var l = this.Items.length, i = 0; i < l; i++) {
            var Style = this.Items[i].HTML.style;
            if(Style["-webkit-column-width"] || Style["-moz-column-width"] || Style["-ms-column-width"] || Style["column-width"]) {
                this.Columned = true;
                break;
            }
        }
    
        E.dispatch("bibi:commands:focus-on", { Destination: Opt.Destination, Duration: 0 });
    
        O.Busy = false;
        sML.removeClass(O.HTML, "busy");
        sML.removeClass(O.HTML, "laying-out");
        if(!Opt.NoNotification) I.note("");
    
        window.addEventListener(O["resize"], this.catchOnresize);
        this.Main.addEventListener("scroll", this.catchOnscroll);
    
        this.LayingOut = false;
    
        if(typeof Opt.callback == "function") Opt.callback();
    
        E.dispatch("bibi:laid-out");
        O.stamp("Lay Out End");
        O.log("Laid out.", "/*");
    
        //}, 1);
    
    }
    
    updateOrientation() {
        var PreviousOrientation = this.Orientation;
        if(typeof window.orientation != "undefined") {
            this.Orientation = (window.orientation == 0 || window.orientation == 180) ? "portrait" : "landscape";
        } else {
            var W = window.innerWidth  - (settings.S.SLA == "vertical"   ? O.Scrollbars.Width  : 0);
            var H = window.innerHeight - (settings.S.SLA == "horizontal" ? O.Scrollbars.Height : 0);
            this.Orientation = W / H < 1.4 /* Math.floor(Math.sqrt(2) * 10) / 10 */ ? "portrait" : "landscape";
        }
        if(this.Orientation != PreviousOrientation) {
            E.dispatch("bibi:changes-orientation", this.Orientation);
            sML.removeClass(O.HTML, "orientation-" + PreviousOrientation);
            sML.addClass(   O.HTML, "orientation-" + this.Orientation);
            E.dispatch("bibi:changed-orientation", this.Orientation);
        }
    }
    
    onscroll(Eve) {
        if(!L.Opened) return;
        if(!this.Scrolling) {
            sML.addClass(O.HTML, "scrolling");
            this.Scrolling = true;
            Eve.BibiScrollingBegun = true;
        }
        E.dispatch("bibi:scrolls", Eve);
        clearTimeout(this.Timer_onscrolled);
        this.Timer_onscrolled = setTimeout(function() {
            this.Scrolling = false;
            sML.removeClass(O.HTML, "scrolling");
            E.dispatch("bibi:scrolled", Eve);
        }, 123);
    }
    
    onresize(Eve) {
        if(!L.Opened) return;
        if(!this.Resizing) sML.addClass(O.HTML, "resizing");
        this.Resizing = true;
        E.dispatch("bibi:resizes", Eve);
        clearTimeout(this.Timer_afterresized);
        clearTimeout(this.Timer_onresized);
        this.Timer_onresized = setTimeout(() => {
            O.Busy = true;
            sML.addClass(O.HTML, "busy");
            this.updateOrientation();
            this.Timer_afterresized = setTimeout(() => {
                E.dispatch("bibi:resized", Eve);
                O.Busy = false;
                this.Resizing = false;
                sML.removeClass(O.HTML, "busy");
                sML.removeClass(O.HTML, "resizing");
            }, 100);
        }, O.Mobile ? 444 : 222);
    }
    
    ontap(Eve) {
        E.dispatch("bibi:taps",   Eve);
        E.dispatch("bibi:tapped", Eve);
    }
    
    onpointerdown(Eve) {
        E.dispatch("bibi:downs-pointer",  Eve);
        this.PointerIsDowned = true;
        E.dispatch("bibi:downed-pointer", Eve);
    }
    
    onpointerup(Eve) {
        E.dispatch("bibi:ups-pointer",   Eve);
        this.PointerIsDowned = false;
        E.dispatch("bibi:upped-pointer", Eve);
    }
    
    onpointermove(Eve) {
        var CC = O.getBibiEventCoord(Eve), PC = this.PreviousCoord;
        if(PC.X != CC.X || PC.Y != CC.Y) E.dispatch("bibi:moved-pointer",   Eve);
        else                             E.dispatch("bibi:stopped-pointer", Eve);
        this.PreviousCoord = CC;
    }
    
    onwheel(Eve) {
        Eve.preventDefault();
        if(Math.abs(Eve.deltaX) > Math.abs(Eve.deltaY)) {
            var CW = {}, PWs = this.onwheel.PreviousWheels, PWl = PWs.length, Wheeled = false;
            CW.Distance = (Eve.deltaX < 0 ? -1 : 1) * (settings.S.ARD == "rtl" ? -1 : 1);
            CW.Delta = Math.abs(Eve.deltaX);
            if(!PWs[PWl - 1]) {
                CW.Accel = 1, CW.Wheeled = "start";
            } else if(CW.Distance != PWs[PWl - 1].Distance) {
                CW.Accel = 1;
                if(PWl >= 3 && PWs[PWl - 2].Distance != CW.Distance && PWs[PWl - 3].Distance != CW.Distance) CW.Wheeled = "reverse";
            } else if(CW.Delta > PWs[PWl - 1].Delta) {
                CW.Accel =  1;
                if(PWl >= 3 && PWs[PWl - 1].Accel == -1 && PWs[PWl - 2].Accel == -1 && PWs[PWl - 3].Accel == -1) CW.Wheeled = "serial";
            } else if(CW.Delta < PWs[PWl - 1].Delta) {
                CW.Accel = -1;
            } else {
                CW.Accel = PWs[PWl - 1].Accel;
            }
            if(CW.Wheeled) {
                Eve.BibiSwiperWheel = CW;
                E.dispatch("bibi:wheeled", Eve);
            }
            if(PWl >= 3) PWs.shift();
            PWs.push(CW);
        }
        clearTimeout(this.onwheel.Timer_stop);
        this.onwheel.Timer_stop = setTimeout(() => { this.onwheel.PreviousWheels = []; }, 192);
    }
    
    changeView(RVM) {
        if(settings.S["fix-reader-view-mode"] || typeof RVM != "string" || settings.S.RVM == RVM || !/^(paged|horizontal|vertical)$/.test(RVM)) return false;
        if(L.Opened) {
            I.Panel.close();
            I.SubPanels.forEach((SubPanel) => {
                SubPanel.close();
            });
            I.Menu.close();
            if(I.Slider) I.Slider.close();
            O.Busy = true;
            sML.addClass(O.HTML, "busy");
            setTimeout(() => {
                if(RVM != "paged") {
                    this.Spreads.forEach((Spread) => {
                        Spread.style.opacity = "";
                    });
                }
                this.layOut({
                    Reset: true,
                    Setting: { "reader-view-mode": RVM },
                    callback: () => {
                        //Option["page-progression-direction"] = settings.S.PPD;
                        E.dispatch("bibi:changed-view", RVM);
                        sML.removeClass(O.HTML, "busy");
                        O.Busy = false;
                    }
                });
            }, 888);
        } else {
            settings.update({ "reader-view-mode": RVM });
            L.play();
        }
        if(settings.S["use-cookie"]) {
            O.Cookie.eat(O.RootPath, { "RVM": RVM });
        }
    }
    
    
    getFrameState() {
        return {
            Coord: sML.Coord.getScrollCoord(this.Main),
            Size: sML.Coord.getClientSize(this.Main)
        };
    }
    
    
    getCurrentPages() {
        var FrameState = this.getFrameState();
        var FrameScrollCoord = FrameState.Coord;
        var FrameClientSize  = FrameState.Size;
        FrameScrollCoord = {
            Left:   FrameScrollCoord.X,
            Right:  FrameScrollCoord.X + FrameClientSize.Width,
            Top:    FrameScrollCoord.Y,
            Bottom: FrameScrollCoord.Y + FrameClientSize.Height,
        };
        FrameScrollCoord.Before = FrameScrollCoord[settings.S.BASE.B];
        FrameScrollCoord.After  = FrameScrollCoord[settings.S.BASE.A];
        var Pages = [], Ratio = [], Status = [], BiggestRatio = 0, Done = false;
        this.Pages.forEach((Page, i) => {
            if(!Done) {
                var PageCoord = sML.getCoord(Page);
                PageCoord.Before = PageCoord[settings.S.BASE.B];
                PageCoord.After  = PageCoord[settings.S.BASE.A];
                var LengthInside = Math.min(FrameScrollCoord.After * settings.S.AXIS.PM, PageCoord.After * settings.S.AXIS.PM) - Math.max(FrameScrollCoord.Before * settings.S.AXIS.PM, PageCoord.Before * settings.S.AXIS.PM);
                
                var PageRatio = (LengthInside <= 0 || !PageCoord[settings.S.SIZE.L] || isNaN(LengthInside)) ? 0 : Math.round(LengthInside / PageCoord[settings.S.SIZE.L] * 100);
                if(PageRatio <= 0) {
                    if(Pages.length) Done = true;
                } else if(PageRatio > BiggestRatio) {
                    Pages = [Page];
                    Ratio = [PageRatio];
                    Status = [this.getCurrentPages_getStatus(PageRatio, PageCoord, FrameScrollCoord)];
                    BiggestRatio = PageRatio;
                } else if(PageRatio == BiggestRatio) {
                    Pages.push(Page);
                    Ratio.push(PageRatio);
                    Status.push(this.getCurrentPages_getStatus(PageRatio, PageCoord, FrameScrollCoord));
                }
            }
        });
        var Params = {
            Ratio: Ratio,                          Status: Status,
            StartPage: Pages[0],              StartPageRatio: Ratio[0],              StartPageStatus: Status[0],
            EndPage: Pages[Pages.length - 1], EndPageRatio: Ratio[Ratio.length - 1], EndPageStatus: Status[Status.length - 1]
        };
        for(var Property in Params) Pages[Property] = Params[Property];
        return Pages;
    }
    
    getCurrentPages_getStatus(PageRatio, PageCoord, FrameScrollCoord) {
        if(PageRatio >= 100) return "including";
        var Status = [];
        if(window["inner" + settings.S.SIZE.L] < PageCoord[settings.S.SIZE.L]) Status.push("oversize");
        var FrameBefore = FrameScrollCoord.Before;
        var FrameAfter  = FrameScrollCoord.After;
        if(FrameBefore * settings.S.AXIS.PM <  PageCoord.Before * settings.S.AXIS.PM) Status.push("entering");
        if(FrameBefore * settings.S.AXIS.PM == PageCoord.Before * settings.S.AXIS.PM) Status.push("entered");
        if(FrameAfter  * settings.S.AXIS.PM == PageCoord.After  * settings.S.AXIS.PM) Status.push("passsing");
        if(FrameAfter  * settings.S.AXIS.PM  > PageCoord.After  * settings.S.AXIS.PM) Status.push("passed");
        return Status.join(" ");
    }
    
    getCurrent() {
        this.Current.Pages = this.getCurrentPages();
        this.Current.Page = this.Current.Pages.EndPage;
        this.Current.Percent = Math.floor((this.Current.Pages.EndPage.PageIndex + 1) / this.Pages.length * 100);
        this.classifyCurrent();
        return this.Current;
    }
    
    
    classifyCurrent() {
        this.Spreads.forEach((Spread) => {
            Spread.IsCurrent = false;
            Spread.Items.forEach((Item) => {
                Item.IsCurrent = false;
                Item.Pages.forEach((Page) => {
                    Page.IsCurrent = false;
                    this.Current.Pages.forEach((CurrentPage) => {
                        if(Page == CurrentPage) {
                            Page.IsCurrent = true;
                            Item.IsCurrent = true;
                            Spread.IsCurrent = true;
                        }
                    });
                    if(Page.IsCurrent) sML.replaceClass(Page, "not-current", "current");
                    else               sML.replaceClass(Page, "current", "not-current");
                });
                if(Item.IsCurrent) [Item, Item.ItemBox].forEach((Ele) => { sML.replaceClass(Ele, "not-current", "current"); });
                else               [Item, Item.ItemBox].forEach((Ele) => { sML.replaceClass(Ele, "current", "not-current"); });
            });
            if(Spread.IsCurrent) [Spread, Spread.SpreadBox].forEach((Ele) => { sML.replaceClass(Ele, "not-current", "current"); });
            else                 [Spread, Spread.SpreadBox].forEach((Ele) => { sML.replaceClass(Ele, "current", "not-current"); });
        });
    }
    
    
    focusOn(Par) {
        if(this.Moving) return false;
        if(!Par) return false;
        if(typeof Par == "number") Par = { Destination: Par };
        Par.Destination = this.focusOn_hatchDestination(Par.Destination);
        if(!Par.Destination) return false;
        E.dispatch("bibi:is-going-to:focus-on", Par);
        this.Moving = true;
        var FocusPoint = 0;
        if(settings.S["book-rendition-layout"] == "reflowable") {
            if(Par.Destination.Edge == "head") {
                FocusPoint = (settings.S.SLD != "rtl") ? 0 : this.Main.Book["offset" + [settings.S.SIZE.L]] - sML.Coord.getClientSize(this.Main)[settings.S.SIZE.L];
            } else if(Par.Destination.Edge == "foot") {
                FocusPoint = (settings.S.SLD == "rtl") ? 0 : this.Main.Book["offset" + [settings.S.SIZE.L]] - sML.Coord.getClientSize(this.Main)[settings.S.SIZE.L];
            } else {
                FocusPoint = O.getElementCoord(Par.Destination.Page)[settings.S.AXIS.L];
                if(Par.Destination.Side == "after") FocusPoint += (Par.Destination.Page["offset" + settings.S.SIZE.L] - this.Stage[settings.S.SIZE.L]) * settings.S.AXIS.PM;
                if(settings.S.SLD == "rtl") FocusPoint += Par.Destination.Page.offsetWidth - this.Stage.Width;
            }
        } else {
            if(this.Stage[settings.S.SIZE.L] > Par.Destination.Page.Spread["offset" + settings.S.SIZE.L]) {
                FocusPoint = O.getElementCoord(Par.Destination.Page.Spread)[settings.S.AXIS.L];
                FocusPoint -= Math.floor((this.Stage[settings.S.SIZE.L] - Par.Destination.Page.Spread["offset" + settings.S.SIZE.L]) / 2);
            } else {
                FocusPoint = O.getElementCoord(Par.Destination.Page)[settings.S.AXIS.L];
                if(this.Stage[settings.S.SIZE.L] > Par.Destination.Page["offset" + settings.S.SIZE.L]) FocusPoint -= Math.floor((this.Stage[settings.S.SIZE.L] - Par.Destination.Page["offset" + settings.S.SIZE.L]) / 2);
            }
        }
        if(typeof Par.Destination.TextNodeIndex == "number") this.selectTextLocation(Par.Destination); // Colorize Destination with Selection
        var ScrollTarget = this.focusOn_getScrollTarget(FocusPoint);
        sML.scrollTo(ScrollTarget, {
            ForceScroll: true,
            Duration: ((settings.S.RVM == "paged") ? 0 : Par.Duration),
            callback: () => {
                this.getCurrent();
                this.Moving = false;
                if(Par.callback) Par.callback(Par);
                E.dispatch("bibi:focused-on", Par);
            }
        });
        return true;
    }
    
    
    focusOn_hatchDestination(Destination) { // from Page, Element, or Edge
        if(!Destination) return null;
        if(typeof Destination == "number" || (typeof Destination == "string" && /^\d+$/.test(Destination))) {
            Destination = this.getBibiToDestination(Destination);
        } else if(typeof Destination == "string") {
            if(Destination == "head" || Destination == "foot") {
                Destination = { Edge: Destination };
            } else if(X["EPUBCFI"]) {
                Destination = X["EPUBCFI"].getDestination(Destination);
            }
        } else if(Destination.tagName) {
            if(typeof Destination.PageIndex   == "number") Destination = { Page: Destination };
            else if(typeof Destination.ItemIndex   == "number") Destination = { Item: Destination };
            else if(typeof Destination.SpreadIndex == "number") Destination = { Spread: Destination }; 
            else Destination = { Element: Destination };
        }
        if(Destination.Page    && !Destination.Page.parentElement)    delete Destination.Page;
        if(Destination.Item    && !Destination.Item.parentElement)    delete Destination.Item;
        if(Destination.Spread  && !Destination.Spread.parentElement)  delete Destination.Spread;
        if(Destination.Element && !Destination.Element.parentElement) delete Destination.Element;
        if(typeof Destination.Edge == "string") {
            if(Destination.Edge == "head") Destination.Page = this.Pages[0];
            else                           Destination.Page = this.Pages[this.Pages.length - 1], Destination.Edge = "foot";
        } else {
            if(!Destination.Element) {
                if(!Destination.Item) {
                    if(typeof Destination.ItemIndexInAll == "number") Destination.Item = this.AllItems[Destination.ItemIndexInAll];
                    else if(typeof Destination.ItemIndex      == "number") Destination.Item =    this.Items[Destination.ItemIndex];
                    else {
                        if(!Destination.Spread && typeof Destination.SpreadIndex == "number") Destination.Spread = this.Spreads[Destination.SpreadIndex];
                        if(Destination.Spread) {
                            if(typeof Destination.PageIndexInSpread == "number") Destination.Page = Destination.Spread.Pages[Destination.PageIndexInSpread];
                            else if(typeof Destination.ItemIndexInSpread == "number") Destination.Item = Destination.Spread.Items[Destination.ItemIndexInSpread];
                            else                                                      Destination.Item = Destination.Spread.Items[0];
                        }
                    }
                }
                if(Destination.Item && typeof Destination.ElementSelector == "string") {
                    Destination.Element = Destination.Item.contentDocument.querySelector(Destination.ElementSelector);
                }
            }
            if(Destination.Element) {
                Destination.Page = this.focusOn_getNearestPageOfElement(Destination.Element);
            } else if(!Destination.Page){
                if(Destination.Spread) {
                    if(typeof Destination.PageIndexInSpread    == "number") Destination.Page = Destination.Spread.Pages[Destination.PageIndexInSpread];
                    else if(typeof Destination.PageProgressInSpread == "number") Destination.Page = Destination.Spread.Pages[Math.floor(Destination.Spread.Pages.length * Destination.PageProgressInSpread)];
                }
                if(!Destination.Page && Destination.Item) Destination.Page = Destination.Item.Pages[0];
            }
        }
        if(!Destination.Page) return null;
        Destination.Item = Destination.Page.Item;
        Destination.Spread = Destination.Page.Spread;
        return Destination;
    }
    
    focusOn_getNearestPageOfElement(Ele) {
        var Item = Ele.ownerDocument.body.Item;
        if(!Item) return this.Pages[0];
        if(Item.Columned) {
            sML.style(Item.HTML, { "column-width": "" });
            var ElementCoordInItem = O.getElementCoord(Ele)[settings.S.AXIS.B];
            if(settings.S.PPD == "rtl" && settings.S.SLA == "vertical") {
                ElementCoordInItem = Item.offsetWidth - (settings.S["item-padding-left"] + settings.S["item-padding-right"]) - ElementCoordInItem - Ele.offsetWidth;
            }
            sML.style(Item.HTML, { "column-width": Item.ColumnLength + "px" });
            var NearestPage = Item.Pages[Math.ceil(ElementCoordInItem / Item.ColumnBreadth - 1)];
        } else {
            var ElementCoordInItem = O.getElementCoord(Ele)[settings.S.AXIS.L];
            if(settings.S.SLD == "rtl" && settings.S.SLA == "horizontal") {
                ElementCoordInItem = Item.HTML.offsetWidth - ElementCoordInItem - Ele.offsetWidth;
            }
            var NearestPage = Item.Pages[0];
            for(var l = Item.Pages.length, i = 0; i < l; i++) {
                ElementCoordInItem -= Item.Pages[i]["offset" + settings.S.SIZE.L];
                if(ElementCoordInItem <= 0) {
                    NearestPage = Item.Pages[i];
                    break;
                }
            }
        }
        return NearestPage;
    }

    focusOn_getScrollTarget(FocusPoint) {
        var ScrollTarget = { Frame: this.Main, X: 0, Y: 0 };
        ScrollTarget[settings.S.AXIS.L] = FocusPoint;
        return ScrollTarget;
    }


    selectTextLocation(Destination) {
        if(typeof Destination.TextNodeIndex != "number") return;
        var DestinationNode = Destination.Element.childNodes[Destination.TextNodeIndex];
        if(!DestinationNode || !DestinationNode.textContent) return;
        var Sides = { Start: { Node: DestinationNode, Index: 0 }, End: { Node: DestinationNode, Index: DestinationNode.textContent.length } };
        if(Destination.TermStep) {
            if(Destination.TermStep.Preceding || Destination.TermStep.Following) {
                Sides.Start.Index = Destination.TermStep.Index, Sides.End.Index = Destination.TermStep.Index;
                if(Destination.TermStep.Preceding) Sides.Start.Index -= Destination.TermStep.Preceding.length;
                if(Destination.TermStep.Following)   Sides.End.Index += Destination.TermStep.Following.length;
                if(Sides.Start.Index < 0 || DestinationNode.textContent.length < Sides.End.Index) return;
                if(DestinationNode.textContent.substr(Sides.Start.Index, Sides.End.Index - Sides.Start.Index) != Destination.TermStep.Preceding + Destination.TermStep.Following) return;
            } else if(Destination.TermStep.Side && Destination.TermStep.Side == "a") {
                Sides.Start.Node = DestinationNode.parentNode.firstChild; while(Sides.Start.Node.childNodes.length) Sides.Start.Node = Sides.Start.Node.firstChild;
                Sides.End.Index = Destination.TermStep.Index - 1;
            } else {
                Sides.Start.Index = Destination.TermStep.Index;
                Sides.End.Node = DestinationNode.parentNode.lastChild; while(Sides.End.Node.childNodes.length) Sides.End.Node = Sides.End.Node.lastChild;
                Sides.End.Index = Sides.End.Node.textContent.length;
            }
        }
        return sML.select(Sides);
    }
    
    
    moveBy(Par) {
        if(this.Moving || !L.Opened) return false;
        if(!Par) return false;
        if(typeof Par == "number") Par = { Distance: Par };
        if(!Par.Distance || typeof Par.Distance != "number") return false;
        Par.Distance *= 1;
        if(Par.Distance == 0 || isNaN(Par.Distance)) return false;
        Par.Distance = Par.Distance < 0 ? -1 : 1;
        E.dispatch("bibi:is-going-to:move-by", Par);
        var CurrentEdge = "", Side = "";
        if(Par.Distance > 0) CurrentEdge = "EndPage",   Side = "before";
        else                 CurrentEdge = "StartPage", Side = "after";
        this.getCurrent();
        var CurrentPage = this.Current.Pages[CurrentEdge];
        var ToFocus = (
            this.Columned ||
            settings.S.BRL == "pre-paginated" ||
            CurrentPage.Item.PrePaginated ||
            CurrentPage.Item.Outsourcing ||
            CurrentPage.Item.Pages.length == 1 ||
            (Par.Distance < 0 && CurrentPage.PageIndexInItem == 0) ||
            (Par.Distance > 0 && CurrentPage.PageIndexInItem == CurrentPage.Item.Pages.length - 1)
        );
        var callback = Par.callback;
        Par.callback = (Par) => {
            if(typeof callback == "function") callback(Par);
            E.dispatch("bibi:moved-by", Par);
        };
        if(!ToFocus) {
            E.dispatch("bibi:commands:scroll-by", Par);
        } else {
            var CurrentPageStatus = this.Current.Pages[CurrentEdge + "Status"];
            var CurrentPageRatio  = this.Current.Pages[CurrentEdge + "Ratio"];
            if(/(oversize)/.test(CurrentPageStatus)) {
                if(Par.Distance > 0) {
                    if(CurrentPageRatio >= 90)             Side = "before";
                    else if(/entering/.test(CurrentPageStatus)) Side = "before", Par.Distance =  0;
                    else if( /entered/.test(CurrentPageStatus)) Side = "after",  Par.Distance =  0;
                } else {
                    if(CurrentPageRatio >= 90)             Side = "after";
                    else if( /passing/.test(CurrentPageStatus)) Side = "before", Par.Distance =  0;
                    else if(  /passed/.test(CurrentPageStatus)) Side = "after",  Par.Distance =  0;
                }
            } else {
                if(Par.Distance > 0) {
                    if(   /enter/.test(CurrentPageStatus)) Side = "before", Par.Distance =  0;
                } else {
                    if(    /pass/.test(CurrentPageStatus)) Side = "after",  Par.Distance =  0;
                }
            }
            //sML.log([CurrentPageStatus, CurrentPageRatio, Par.Distance, Side].join(" / "));
            var DestinationPageIndex = CurrentPage.PageIndex + Par.Distance;
            if(DestinationPageIndex <                  0) DestinationPageIndex = 0;
            else if(DestinationPageIndex > this.Pages.length - 1) DestinationPageIndex = this.Pages.length - 1;
            var DestinationPage = this.Pages[DestinationPageIndex];
            if(settings.S.BRL == "pre-paginated" && DestinationPage.Item.SpreadPair) {
                if(settings.S.SLA == "horizontal" && this.Stage[settings.S.SIZE.L] > DestinationPage.Spread["offset" + settings.S.SIZE.L]) {
                    if(Par.Distance < 0 && DestinationPage.PageIndexInSpread == 0) DestinationPage = DestinationPage.Spread.Pages[1];
                    if(Par.Distance > 0 && DestinationPage.PageIndexInSpread == 1) DestinationPage = DestinationPage.Spread.Pages[0];
                }
            }
            Par.Destination = { Page: DestinationPage, Side: Side };
            E.dispatch("bibi:commands:focus-on", Par);
        }
        return true;
    }
    
    scrollBy(Par) {
        if(!Par) return false;
        if(typeof Par == "number") Par = { Distance: Par };
        if(!Par.Distance || typeof Par.Distance != "number") return false;
        E.dispatch("bibi:is-going-to:scroll-by", Par);
        this.Moving = true;
        var ScrollTarget = {
            Frame: this.Main,
            X: 0, Y: 0
        };
        var CurrentScrollCoord = sML.Coord.getScrollCoord(this.Main);
        switch(settings.S.SLD) {
        case "ttb": ScrollTarget.Y = CurrentScrollCoord.Y + (this.Stage.Height + this.Stage.PageGap) * Par.Distance;      break;
        case "ltr": ScrollTarget.X = CurrentScrollCoord.X + (this.Stage.Width  + this.Stage.PageGap) * Par.Distance;      break;
        case "rtl": ScrollTarget.X = CurrentScrollCoord.X + (this.Stage.Width  + this.Stage.PageGap) * Par.Distance * -1; break;
        }
        sML.scrollTo(ScrollTarget, {
            ForceScroll: true,
            Duration: ((settings.S.RVM == "paged") ? 0 : Par.Duration),
            callback: () => {
                this.getCurrent();
                this.Moving = false;
                if(Par.callback) Par.callback(Par);
                E.dispatch("bibi:scrolled-by", Par);
            }
        });
        return true;
    }
    
    getBibiToDestination (BibitoString) {
        if(typeof BibitoString == "number") BibitoString = "" + BibitoString;
        if(typeof BibitoString != "string" || !/^[1-9][0-9]*(-[1-9][0-9]*(\.[1-9][0-9]*)*)?$/.test(BibitoString)) return null;
        var ElementSelector = "", InE = BibitoString.split("-"), ItemIndexInAll = parseInt(InE[0]) - 1, ElementIndex = InE[1] ? InE[1] : null;
        if(ElementIndex) ElementIndex.split(".").forEach((Index) => { ElementSelector += ">*:nth-child(" + Index + ")"; });
        return {
            BibitoString: BibitoString,
            ItemIndexInAll: ItemIndexInAll,
            ElementSelector: (ElementSelector ? "body" + ElementSelector : undefined)
        };
    }
}

export default (new R);