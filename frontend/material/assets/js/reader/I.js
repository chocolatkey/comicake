import O from "./O";
import E from "./E";
import sML from "../vendor/sML";
import settings from "./S";
import buttonGroup from "./I/buttonGroup";
import subPanel from "./I/subPanel";
import Bibi from "./Bibi";
import R from "./R";
import B from "./B";
import L from "./L";
import { COMMENTS } from "../constants";

//==============================================================================================================================================
//----------------------------------------------------------------------------------------------------------------------------------------------

//-- User Interfaces

//----------------------------------------------------------------------------------------------------------------------------------------------

class I { // Bibi.UserInterfaces
    constructor() {
        this.isPointerStealth_Checkers = [];
        /*isPointerStealth.addChecker(fun) {
            if(typeof fun == "function" && !I.isPointerStealth.Checkers.includes(fun)) this.isPointerStealth.Checkers.push(fun);
        }*/
        this.s_ontouchstart = event => this.Swiper.ontouchstart(event);
        this.s_ontouchmove = event => this.Swiper.ontouchmove(event);
        this.s_ontouchend = event => this.Swiper.ontouchend(event);
        this.s_onwheel = event => R.onwheel(event);

        this.s_nombreshow = () => this.Nombre.show;
        this.s_nombrehide = () => this.Nombre.hide;        
    }

    initialize() {
        this.createNotifier();
        this.createVeil();
    
        E.bind("bibi:readied", () => {
            this.createPanel();
            this.createHelp();
            this.createPoweredBy();
        });
    
        E.bind("bibi:prepared", () => {
            this.createMenu();
            /*this.createNombre();
            this.createSlider();
            this.createArrows();
            this.createKeyListener();
            this.createSwiper();
            this.createSpinner();*/
            if(!(O.Mobile && settings.S.RVM == "vertical"))
                this.createNombre();
            this.createSlider();
            // Custom cool vertical slider
            sML.appendStyleRule([
                "html.Blink.view-vertical div#bibi-slider, html.WebKit.view-vertical div#bibi-slider"
            ].join(", "), "width: 10px;");

            this.createArrows();
            this.createKeyListener();
            this.createSwiper();
            this.createSpinner();
        });
    
    }
    
    
    note(Msg, Time, ErrorOccured) {
        clearTimeout(this.note.Timer);
        if(!Msg) this.note.Time = 0;
        else     this.note.Time = (typeof Time == "number") ? Time : (O.Busy ? 9999 : 2222);
        if(this.Notifier) {
            this.Notifier.Board.innerHTML = "<p" + (ErrorOccured ? " class=\"error\"" : "") + ">" + Msg + "</p>";
            sML.addClass(O.HTML, "notifier-shown");
            this.note.Timer = setTimeout(() => { sML.removeClass(O.HTML, "notifier-shown"); }, this.note.Time);
        }
        if(!O.Mobile) {
            if(O.statusClearer) clearTimeout(O.statusClearer);
            window.status = "BiB/i: " + Msg;
            O.statusClearer = setTimeout(() => { window.status = ""; }, this.note.Time);
        }
    }
    
    
    createNotifier() {
    
        this.Notifier = O.Body.appendChild(sML.create("div", { id: "bibi-notifier" }));
    
        this.Notifier.Board = this.Notifier.appendChild(sML.create("div", { id: "bibi-notifier-board" }));
    
        E.dispatch("bibi:created-notifier");
    
    }
    
    
    createVeil() {
    
        this.Veil = this.setToggleAction(O.Body.appendChild(sML.create("div", { id: "bibi-veil" })), {
            // Translate: 240, /* % */ // Rotate: -48, /* deg */ // Perspective: 240, /* px */
            onopened:  () => {
                sML.addClass(O.HTML, "veil-opened");
                sML.removeClass(this.Veil, "closed");
            },
            onclosed: () => {
                sML.addClass(this.Veil, "closed");
                sML.removeClass(O.HTML, "veil-opened");
            }
        });
    
        this.Veil.open();
    
        this.Veil.Cover = this.Veil.appendChild(sML.create("div", { id: "bibi-veil-cover" }));
        this.Veil.Cover.Info = this.Veil.Cover.appendChild(
            sML.create("p", { id: "bibi-veil-cover-info" })
        );
    
        var PlayButtonTitle = (O.Mobile ? "Tap" : "Click") + " to Open";
        this.Veil.PlayButton = this.Veil.appendChild(
            sML.create("p", { id: "bibi-veil-play", title: PlayButtonTitle,
                innerHTML: "<span class=\"non-visual\">" + PlayButtonTitle + "</span>",
                play: (Eve) => {
                    Eve.stopPropagation();
                    L.play();
                    //M.post("bibi:play:button:" + location.href);
                    E.dispatch("bibi:played:by-button");
                },
                hide: () => {
                    this.removeEventListener("click", this.Veil.PlayButton.play);
                    sML.style(this, {
                        opacity: 0,
                        cursor: "default"
                    });
                }
            })
        );
        this.Veil.PlayButton.addEventListener("click", event => this.Veil.PlayButton.play(event));
        E.add("bibi:played", () => {
            this.Veil.PlayButton.hide();
        });
    
        E.dispatch("bibi:created-veil");
    
    }
    
    
    createPanel() {
    
        this.Panel = O.Body.appendChild(sML.create("div", { id: "bibi-panel" }));
        this.setToggleAction(this.Panel, {
            onopened: (Opt) => {
                sML.addClass(O.HTML, "panel-opened");
                E.dispatch("bibi:opened-panel");
            },
            onclosed: (Opt) => {
                sML.removeClass(O.HTML, "panel-opened");
                E.dispatch("bibi:closed-panel");
            }
        });
        E.add("bibi:commands:open-panel",   (Opt) => { this.Panel.open(Opt); });
        E.add("bibi:commands:close-panel",  (Opt) => { this.Panel.close(Opt); });
        E.add("bibi:commands:toggle-panel", (Opt) => { this.Panel.toggle(Opt); });
        this.Panel.Labels = {
            default: { default: "Open this Index", ja: "この目次を開く" },
            active: { default: "Close this Index", ja: "この目次を閉じる" }
        };
        this.setFeedback(this.Panel, { StopPropagation: true });
        this.Panel.addTapEventListener("tapped", () => { E.dispatch("bibi:commands:toggle-panel"); });
    
        // Optimize to Scrollbar Size
        sML.appendStyleRule("html.page-rtl div#bibi-panel:after", "bottom: " + (O.Scrollbars.Height) + "px;");
    
        // Book Info
        this.Panel.BookInfo = this.Panel.appendChild(
            sML.create("div", { id: "bibi-panel-bookinfo" })
        );
        this.Panel.BookInfo.Box = this.Panel.BookInfo.appendChild(
            sML.create("div", { id: "bibi-panel-bookinfo-box" })
        );
        this.Panel.BookInfo.Navigation = this.Panel.BookInfo.Box.appendChild(
            sML.create("div", { id: "bibi-panel-bookinfo-navigation" })
        );
        this.Panel.BookInfo.Cover = this.Panel.BookInfo.Box.appendChild(
            sML.create("div", { id: "bibi-panel-bookinfo-cover" })
        );
        this.Panel.BookInfo.Cover.Info = this.Panel.BookInfo.Cover.appendChild(
            sML.create("p", { id: "bibi-panel-bookinfo-cover-info" })
        );
    
        this.SubPanels = [];
        this.createPanel_createShade();
    
        E.dispatch("bibi:created-panel");
    
    }    
    
    createPanel_createShade() {
    
        this.Shade = O.Body.appendChild(
            sML.create("div", { id: "bibi-shade",
                open: () => {
                    sML.addClass(O.HTML, "shade-opened");
                    clearTimeout(this.Timer_openShade);
                    clearTimeout(this.Timer_closeShade);
                    this.Timer_openShade = setTimeout(() => { sML.addClass(O.HTML, "shade-visible"); }, 0);
                },
                close: () => {
                    sML.removeClass(O.HTML, "shade-visible");
                    clearTimeout(this.Timer_openShade);
                    clearTimeout(this.Timer_closeShade);
                    this.Timer_closeShade = setTimeout(() => { sML.removeClass(O.HTML, "shade-opened"); }, 150);
                }
            })
        );
    
        this.observeTap(this.Shade, { StopPropagation: true });
    
        //this.Shade.addTapEventListener("tap", R.ontap);
    
        this.Shade.addTapEventListener("tapped", () => {
            this.SubPanels.forEach((SubPanel) => {
                SubPanel.close();
            });
            this.Panel.close();
        });
    
    }
    
    
    createMenu() {
    
        // Menus
        if(!settings.S["use-menubar"]) sML.addClass(O.HTML, "without-menubar");
        this.Menu = document.getElementById("bibi-menu");//.appendChild(sML.create("div", { id: "bibi-menu", on: { "click": function(Eve) { Eve.stopPropagation(); } } }));
        this.FAB = document.getElementById("comments-fab");
        this.FAB.Hover = true;
        this.setFeedback(this.FAB);
        this.Menu.Height = this.Menu.offsetHeight;
        this.setHoverActions(this.Menu);
        this.setToggleAction(this.Menu, {
            onopened: () => {
                sML.addClass(O.HTML, "menu-opened");
                E.dispatch("bibi:opened-menu");
            },
            onclosed: () => {
                sML.removeClass(O.HTML, "menu-opened");
                E.dispatch("bibi:closed-menu");
            }
        });
        E.add("bibi:closed-slider",        () => { this.Menu.close(); });
        E.add("bibi:commands:open-menu",   (Opt) => { this.Menu.open(Opt); });
        E.add("bibi:commands:close-menu",  (Opt) => { this.Menu.close(Opt); });
        E.add("bibi:commands:toggle-menu", (Opt) => { this.Menu.toggle(Opt); });
        E.add("bibi:scrolls", () => {
            let isVert = (settings.S.RVM == "vertical");
            let cindex = R.getCurrent().Page.PageIndex;
            let eindex = R.Pages.length - 1;/*isVert ? R.Pages.length - 1 : R.Pages.length - 1;*/
            clearTimeout(this.FAB.Tea);
            if(/*settings.S.RVM == "vertical" && */(cindex > 0) && (cindex < eindex)) {
                this.Menu.Hot = false;
                sML.removeClass(this.Menu, "hot");
                this.Menu.Hover = true;
                E.dispatch("bibi:unhovers", null, this.Menu);
                //if(!this.FAB.Targeted)
                clearTimeout(this.FAB.uncannyDelay);
                if(this.Panel.UIState != "active")
                    E.dispatch("bibi:unhovers", null, this.FAB);
                // document.body.requestPointerLock(); TODO
            } else {
                /*if(!this.Menu.Hot) *///sML.addClass(this.Menu, "hot");
                ///this.Menu.Hot = true;
                E.dispatch("bibi:hovers", null, this.Menu);
                clearTimeout(this.Menu.Timer_cool);
                this.FAB.uncannyDelay = setTimeout(() => {
                    // Because when scrolling starts, page is still old
                    if(R.getCurrent().Page.PageIndex == cindex)
                        E.dispatch("bibi:hovers", null, this.FAB);
                }, 234);
                this.FAB.Targeted = true;
                this.Menu.Tea = setTimeout(() => {
                    // TODO: fix recurring even though cleared
                    if(this.Panel.UIState != "active") {
                        this.FAB.Targeted = false;
                        E.dispatch("bibi:unhovers", null, this.FAB);
                    }
                }, 3456);
            }
            if(/*!isVert && */this.Menu.Hot) {
                clearTimeout(this.Menu.Timer_cool);
                this.Menu.Timer_cool = setTimeout(() => {
                    this.Menu.Hot = false;
                    sML.removeClass(this.Menu, "hot");
                    sML.removeClass(this.Menu, "hover");
                    //sML.removeClass(this.FAB, "hover");
                    //this.FAB.Targeted = false;
                }, 1234);
            }
        });
        if(!O.Mobile) {
            E.add("bibi:moved-pointer", (Eve) => {
                if(this.isPointerStealth()) return false;
                var BibiEvent = O.getBibiEvent(Eve);
                clearTimeout(this.Menu.Timer_close);
                if(BibiEvent.Coord.Y < this.Menu.offsetHeight * 1.5) {
                    E.dispatch("bibi:hovers", Eve, this.Menu);
                } else if(this.Menu.Hover) {
                    this.Menu.Timer_close = setTimeout(() => {
                        E.dispatch("bibi:unhovers", Eve, this.Menu);
                    }, 123);
                }
                if(COMMENTS) {
                    if(BibiEvent.Division.X == "right" && BibiEvent.Division.Y == "bottom") {
                        E.dispatch("bibi:hovers", Eve, this.FAB);
                        clearTimeout(this.Menu.Tea);
                        if(!this.FAB.Targeted) { // meh
                            this.Menu.Tea = setTimeout(() => {
                                if(this.Panel.UIState != "active") {
                                    this.FAB.Targeted = false;
                                    E.dispatch("bibi:unhovers", null, this.FAB);
                                }
                            }, 3456);
                        }
                    } else {
                        if(!this.FAB.Targeted) {
                            clearTimeout(this.Menu.Tea);
                            E.dispatch("bibi:unhovers", Eve, this.FAB);
                        }
                    }
                }
            });
        }
        E.add("bibi:tapped", (Eve) => {
            if(this.isPointerStealth()) return false;
            var BibiEvent = O.getBibiEvent(Eve);
            //if(BibiEvent.Coord.Y < this.Menu.offsetHeight) return false;
            if(settings.S.RVM == "horizontal") {
                if(BibiEvent.Coord.Y > window.innerHeight - O.Scrollbars.Height) return false;
            } else if(settings.S.RVM == "vertical") {
                if(BibiEvent.Coord.X > window.innerWidth  - O.Scrollbars.Width)  return false;
            }
            if(BibiEvent.Target.tagName) {
                if(/bibi-slider/.test(BibiEvent.Target.className + BibiEvent.Target.id)) return false;
                if(O.isAnchorContent(BibiEvent.Target)) return false;
            }
            switch(settings.S.ARD) {
            case "ttb": return (BibiEvent.Division.Y == "middle") ? E.dispatch("bibi:commands:toggle-menu") : false;
            default   : return (BibiEvent.Division.X == "center") ? E.dispatch("bibi:commands:toggle-menu") : false;
            }
        });
        this.Menu.L = this.Menu.getElementsByClassName("mdc-toolbar__section--align-start")[0].insertBefore(sML.create("div", { id: "bibi-menu-l" }), this.Menu.getElementsByClassName("mdc-toolbar__section--align-start")[0].firstChild);
        this.Menu.R = this.Menu.getElementsByClassName("mdc-toolbar__section--align-end")[0].appendChild(sML.create("div", { id: "bibi-menu-r" }));
        //this.Menu.open();
    
        // Optimize to Scrollbar Size
        sML.appendStyleRule([
            "html.view-vertical div#bibi-menu"
        ].join(", "), "width: calc(100% - " + (O.Scrollbars.Width) + "px);");
        sML.appendStyleRule([
            "html.view-vertical.panel-opened div#bibi-menu",
            "html.view-vertical.subpanel-opened div#bibi-menu"
        ].join(", "), "width: 100%; padding-right: " + (O.Scrollbars.Width) + "px;");
    
        // TODO: Make great again
        //this.createMenu_createPanelSwitch();
    
        this.SettingMenuComponents = [];
        if(!settings.S["fix-reader-view-mode"])                                                                     this.SettingMenuComponents.push("ViewModeButtons");
        if(O.WindowEmbedded)                                                                               this.SettingMenuComponents.push("NewWindowButton");
        if(O.FullscreenEnabled/* && !O.Mobile*/)                                                               this.SettingMenuComponents.push("FullscreenButton");
        if(settings.S["website-href"] && /^https?:\/\/[^\/]+/.test(settings.S["website-href"]) && settings.S["website-name-in-menu"]) this.SettingMenuComponents.push("WebsiteLink");
        if(!settings.S["remove-bibi-website-link"])                                                                 this.SettingMenuComponents.push("BibiWebsiteLink");
        if(this.SettingMenuComponents.length) this.createMenu_createSettingMenu();

        //if(settings.S.RVM == "vertical")
        /*E.dispatch("bibi:hovers", null, this.Menu);
        clearTimeout(this.Menu.Timer_cool);
        this.Menu.Timer_cool = setTimeout(() => {
            this.Menu.Hot = false;
            sML.removeClass(this.Menu, "hot");
            sML.removeClass(this.Menu, "hover");
        }, 1234);*/
    
        E.dispatch("bibi:created-menu");
    
    }
    
    
    createMenu_createPanelSwitch() {
        // Panel Switch
        this.PanelSwitch = new buttonGroup({ Area: this.Menu.L, Sticky: true });
        this.PanelSwitch.addButton({
            Type: "toggle",
            Labels: {
                default: { default: "Open Index", ja: "目次を開く" },
                active:  { default: "Close Index", ja: "目次を閉じる" }
            },
            Help: true,
            Icon: "<span class=\"bibi-icon bibi-icon-toggle-panel\"><span class=\"bar-1\"></span><span class=\"bar-2\"></span><span class=\"bar-3\"></span></span>",
            action: () => {
                this.Panel.toggle();
            }
        });
        this.PanelSwitch = this.PanelSwitch.Buttons[0]; // CAN'T EVEN AGAIN
        E.add("bibi:opened-panel",  () => {
            this.setUIState(this.PanelSwitch, "active");
            // TODO: add info to panel
        });
        E.add("bibi:closed-panel", () => { this.setUIState(this.PanelSwitch, ""); });
        E.add("bibi:started", () => {
            sML.style(this.PanelSwitch, { display: "block" });
        });
    
    }
    
    
    createMenu_createSettingMenu() {
    
        this.Menu.Config = {};
        // Button
        this.Menu.Config.Button = new buttonGroup({ Area: this.Menu.R, Sticky: true });
        this.Menu.Config.Button.addButton({
            Type: "toggle",
            Labels: {
                default: { default: "Settings", ja: "設定を変更" },
                active:  { default: "Close Settings Menu", ja: "設定メニューを閉じる" }
            },
            Help: true,
            Icon: "<span class=\"bibi-icon bibi-icon-setting\"></span>"
        });
        this.Menu.Config.Button = this.Menu.Config.Button.Buttons[0]; // CAN'T EVEN

        // Sub Panel
        this.Menu.Config.SubPanel = new subPanel({ Opener: this.Menu.Config.Button, id: "bibi-subpanel_change-view" });
    
        if(this.SettingMenuComponents.includes("ViewModeButtons")                                                                   ) this.createMenu_createSettingMenu_createViewModeSection();
        if(this.SettingMenuComponents.includes("NewWindowButton") || this.SettingMenuComponents.includes("FullscreenButton")) this.createMenu_createSettingMenu_createWindowSection();
        if(this.SettingMenuComponents.includes("WebsiteLink")     || this.SettingMenuComponents.includes("BibiWebsiteLink") ) this.createMenu_createSettingMenu_createLinkageSection();
    
    }
    
    
    createMenu_createSettingMenu_createViewModeSection() {
    
        // Shapes
        var Shape = {};
        Shape.Item         = "<span class=\"bibi-shape bibi-shape-item\"></span>";
        Shape.Spread       = "<span class=\"bibi-shape bibi-shape-spread\">" + Shape.Item + Shape.Item + "</span>";
    
        // Icons
        var Icon = {};
        Icon["paged"]      = "<span class=\"bibi-icon bibi-icon-view-paged\"><span class=\"bibi-shape bibi-shape-spreads bibi-shape-spreads-paged\">" + Shape.Spread + Shape.Spread + Shape.Spread + "</span></span>";
        Icon["horizontal"] = "<span class=\"bibi-icon bibi-icon-view-horizontal\"><span class=\"bibi-shape bibi-shape-spreads bibi-shape-spreads-horizontal\">" + Shape.Spread + Shape.Spread + Shape.Spread + "</span></span>";
        Icon["vertical"]   = "<span class=\"bibi-icon bibi-icon-view-vertical\"><span class=\"bibi-shape bibi-shape-spreads bibi-shape-spreads-vertical\">" + Shape.Spread + Shape.Spread + Shape.Spread + "</span></span>";

        let changeView = (val) => {
            R.changeView(val);
        };
    
        this.Menu.Config.SubPanel.ViewModeSection = this.Menu.Config.SubPanel.addSection({
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
                        action: () => changeView("paged") // fuck it
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
                        action: () => R.changeView(this.Value)
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
                        action: () => changeView("vertical") // fuck it
                    }
                ]
            }
        });
    
        E.add("bibi:updated-settings", () => {
            this.Menu.Config.SubPanel.ViewModeSection.ButtonGroup.Buttons.forEach((Button) => {
                this.setUIState(Button, (Button.Value == settings.S.RVM ? "active" : "default"));
            });
        });
    
    }
    
    
    createMenu_createSettingMenu_createWindowSection() {
    
        var Buttons = [];
    
        // New Window
        if(this.SettingMenuComponents.includes("NewWindowButton")) Buttons.push({
            Type: "link",
            Labels: {
                default: { default: "Open in New Window", ja: "あたらしいウィンドウで開く" }
            },
            Icon: "<span class=\"bibi-icon bibi-icon-open-newwindow\"></span>",
            href: O.RequestedURL,
            target: "_blank"
        });

        // Force Single Page Reading
        let FSPToggle = {
            Type: "toggle",
            action: () => {
                var Button = this;
                settings.S.FSP = !settings.S.FSP;
                if(settings.S["use-cookie"]) {
                    O.Cookie.eat(O.RootPath, { "force-single-page": settings.S.FSP });
                }
                this.note("Refresh to apply changes");
                /*
                I'm just gonna end up fighting bibi more
                window.removeEventListener(O["resize"], R.catchOnresize);
                R.Main.removeEventListener("scroll", R.catchOnscroll);
                this.Panel.close();
                this.SubPanels.forEach((SubPanel) => {
                    SubPanel.close();
                });
                this.Menu.close();
                if(this.Slider) this.Slider.close();
                O.Busy = true;
                sML.addClass(O.HTML, "busy");
                L.loadBook({ Path: B.Path });
                //I.Panel.parentNode.removeChild(I.Panel);
                //I.createPanel();*/
                if(settings.S.FSP) {
                    E.dispatch("bibi:relaxed-fsp");
                } else {
                    E.dispatch("bibi:enforced-fsp");
                }
            },
            Labels: {
                default: { default: "Single Page Only", ja: "単一ページだけ" },
                active:  { default: "Single Page Only", ja: "単一ページだけ" }
            },
            Icon: "<span class=\"bibi-icon bibi-icon-toggle-forcesinglepage\"></span>",
            className: "vertical-hidden"
        };

        // Fullscreen
        if(this.SettingMenuComponents.includes("FullscreenButton")) Buttons.push(FSPToggle, {
            Type: "toggle",
            Labels: {
                default: { default: "Enter Fullscreen", ja: "フルスクリーンモード" },
                active:  { default: "Exit Fullscreen", ja: "フルスクリーンモード解除" }
            },
            Icon: "<span class=\"bibi-icon bibi-icon-toggle-fullscreen\"></span>",
            action: () => {
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

        this.Menu.Config.SubPanel.WindowSection = this.Menu.Config.SubPanel.addSection({
            Labels: { default: { default: "Window Operation", ja: "ウィンドウ操作" } },
            ButtonGroup: {
                Buttons: Buttons
            }
        });
    
    }
    
    
    createMenu_createSettingMenu_createLinkageSection() {
    
        var Buttons = [];
    
        if(this.SettingMenuComponents.includes("WebsiteLink")) Buttons.push({
            Type: "link",
            Labels: {
                default: { default: settings.S["website-name-in-menu"].replace(/&/gi, "&amp;").replace(/</gi, "&lt;").replace(/>/gi, "&gt;") }
            },
            Icon: "<span class=\"bibi-icon bibi-icon-open-newwindow\"></span>",
            href: settings.S["website-href"],
            target: "_blank"
        });
    
        if(this.SettingMenuComponents.includes("BibiWebsiteLink")) Buttons.push({
            Type: "link",
            Labels: {
                default: { default: "BiB/i | Official Website" }
            },
            Icon: "<span class=\"bibi-icon bibi-icon-open-newwindow\"></span>",
            href: Bibi["href"],
            target: "_blank"
        });
    
        this.Menu.Config.SubPanel.addSection({
            Labels: { default: { default: "Link" + (Buttons.length > 1 ? "s" : ""), ja: "リンク" } },
            ButtonGroup: {
                Buttons: Buttons
            }
        });
    
    }
    
    
    
    createHelp() {
    
        this.Help = O.Body.appendChild(sML.create("div", { id: "bibi-help" }));
        this.Help.Message = this.Help.appendChild(sML.create("p", { className: "hidden", id: "bibi-help-message" }));
    
        this.Help.show = (HelpText) => {
            clearTimeout(this.Help.Timer_deactivate1);
            clearTimeout(this.Help.Timer_deactivate2);
            sML.addClass(this.Help, "active");
            this.Help.Message.innerHTML = HelpText;
            setTimeout(() => {
                sML.addClass(this.Help, "shown");
            }, 0);
        };
        this.Help.hide = () => {
            this.Help.Timer_deactivate1 = setTimeout(() => {
                sML.removeClass(this.Help, "shown");
                this.Help.Timer_deactivate2 = setTimeout(() => { 
                    sML.removeClass(this.Help, "active");
                }, 200);
            }, 100);
        };
    
        // Optimize to Scrollbar Size
        sML.appendStyleRule([
            "html.view-paged div#bibi-help",
            "html.view-horizontal div#bibi-help",
            "html.page-rtl.panel-opened div#bibi-help"
        ].join(", "), "bottom: " + (O.Scrollbars.Height) + "px;");
    
    }
    
    
    createPoweredBy() {
    
        this.PoweredBy = O.Body.appendChild(sML.create("div", { id: "bibi-poweredby", innerHTML: [
            "<p>",
            "<a href=\"" + Bibi["href"] + "\" target=\"_blank\" title=\"BiB/i | Official Website\">",
            "<span>BiB/i</span>",
            "<img class=\"bibi-logo-white\" alt=\"\" src=\"" + O.RootPath + "bibi/images/bibi-logo_white.png\" />",
            "<img class=\"bibi-logo-black\" alt=\"\" src=\"" + O.RootPath + "bibi/images/bibi-logo_black.png\" />",
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
    
    
    createNombre() {
    
        if(!settings.S["use-nombre"]) return;
    
        // Progress > Nombre
        this.Nombre = O.Body.appendChild(sML.create("div", { id: "bibi-nombre",
            show: () => {
                clearTimeout(this.Nombre.Timer_hot);
                clearTimeout(this.Nombre.Timer_vanish);
                sML.addClass(this.Nombre, "active");
                this.Nombre.Timer_hot = setTimeout(() => { sML.addClass(this.Nombre, "hot"); }, 10);
            },
            hide: () => {
                clearTimeout(this.Nombre.Timer_hot);
                clearTimeout(this.Nombre.Timer_vanish);
                sML.removeClass(this.Nombre, "hot");
                this.Nombre.Timer_vanish = setTimeout(() => { sML.removeClass(this.Nombre, "active"); }, 255);
            },
            progress: (PageInfo) => {
                clearTimeout(this.Nombre.Timer_hide);
                if(!PageInfo || !PageInfo.Pages) PageInfo = R.getCurrent();
                if(typeof PageInfo.Percent != "number") PageInfo.Percent = Math.floor((PageInfo.Pages.EndPage.PageIndex + 1) / R.Pages.length * 100);
                if(!R.Current.Page) return;
                this.Nombre.Current.innerHTML = (() => {
                    var PageNumber = PageInfo.Pages.StartPage.PageIndex + 1;
                    if(PageInfo.Pages.StartPage != PageInfo.Pages.EndPage) PageNumber += "<span class=\"delimiter\">-</span>" + (PageInfo.Pages.EndPage.PageIndex + 1);
                    return PageNumber;
                })();
                this.Nombre.Delimiter.innerHTML = "/";
                this.Nombre.Total.innerHTML     = R.Pages.length;
                this.Nombre.Percent.innerHTML   = "(" + PageInfo.Percent + "<span class=\"unit\">%</span>)";
                this.Nombre.show();
                this.Nombre.Timer_hide = setTimeout(this.Nombre.hide, 1234);
            }
        }));
        this.Nombre.Current   = this.Nombre.appendChild(sML.create("span", { id: "bibi-nombre-current"   }));
        this.Nombre.Delimiter = this.Nombre.appendChild(sML.create("span", { id: "bibi-nombre-delimiter" }));
        this.Nombre.Total     = this.Nombre.appendChild(sML.create("span", { id: "bibi-nombre-total"     }));
        this.Nombre.Percent   = this.Nombre.appendChild(sML.create("span", { id: "bibi-nombre-percent"   }));
        E.add("bibi:scrolls", this.Nombre.progress);
        E.add("bibi:resized", this.Nombre.progress);
        E.add("bibi:opened", () => { setTimeout(this.Nombre.progress, 321); });
        if(settings.S["use-slider"]) {
            sML.appendStyleRule("html.view-paged div#bibi-nombre",      "bottom: " + (O.Scrollbars.Height + 2) + "px;");
        }
        if(true) {
            sML.appendStyleRule("html.view-horizontal div#bibi-nombre", "bottom: " + (O.Scrollbars.Height + 2) + "px;");
            sML.appendStyleRule("html.view-vertical div#bibi-nombre",    "right: " + (O.Scrollbars.Height + 2) + "px;");
        }
    
        E.dispatch("bibi:created-nombre");
    
    }
    
    
    createSlider() {
    
        if(!settings.S["use-slider"]) return;
    
        this.Slider = O.Body.appendChild(
            sML.create("div", { id: "bibi-slider",
                reset: () => {
                    if(settings.S.ARD == "ttb") this.Slider.SIZE = { L: "Height", l: "height" }, this.Slider.AXIS = { b: "top",   OB: "Top",  ob: "top",  XY: "Y" };
                    else if(settings.S.ARD == "rtl") this.Slider.SIZE = { L: "Width",  l: "width"  }, this.Slider.AXIS = { b: "right", OB: "Left", ob: "left", XY: "X" };
                    else                    this.Slider.SIZE = { L: "Width",  l: "width"  }, this.Slider.AXIS = { b: "left",  OB: "Left", ob: "left", XY: "X" };
                    this.Slider.Spreads.innerHTML = "";
                    this.Slider.Pages.innerHTML = "";
                    R.Spreads.forEach((Spread, i) => {
                        var SpreadBit = this.Slider.Spreads.appendChild(sML.create("div", { id: "bibi-slider-spreadbit-" + (i + 1) }));
                        SpreadBit.style[this.Slider.SIZE.l] = (  1 / R.Pages.length * Spread.Pages.length * 100) + "%";
                        SpreadBit.style[this.Slider.AXIS.b] = (100 / R.Pages.length * Spread.Pages[0].PageIndex) + "%";
                    });
                    R.Pages.forEach((Page, i) => {
                        var PageBit = this.Slider.Pages.appendChild(sML.create("div", { id: "bibi-slider-pagebit-" + (i + 1) }));
                        PageBit.style[this.Slider.SIZE.l] = (  1 / R.Pages.length * 100) + "%";
                        PageBit.style[this.Slider.AXIS.b] = (100 / R.Pages.length *   i) + "%";
                        PageBit.PageNumber = i + 1;
                        if(this.Nombre) {
                            PageBit.addEventListener(O["pointerover"], () => {
                                if(this.Slider.Sliding) return;
                                clearTimeout(this.Slider.Timer_PageBitPointerOut);
                                this.Nombre.progress({ Pages: { StartPage: R.Pages[i], EndPage: R.Pages[i] } });
                            });
                            PageBit.addEventListener(O["pointerout"], () => {
                                if(this.Slider.Sliding) return;
                                this.Slider.Timer_PageBitPointerOut = setTimeout(() => {
                                    clearTimeout(this.Nombre.Timer_hide);
                                    this.Nombre.hide();
                                }, 200);
                            });
                        }
                        PageBit.Labels = { default: { default: "Slider Page" } };
                        this.setFeedback(PageBit);
                    });
                },
                progress: () => {
                    if(this.Slider.Sliding) return;
                    var Current = this.Slider.Current;
                    Current.style.top = Current.style.right = Current.style.bottom = Current.style.left = Current.style.width = Current.style.height = "";
                    Current.className = (R.Current.Pages.length > 1) ? "two-pages" : "";
                    if(settings.S.RVM == "paged" || this.Slider.UIState == "active") {
                        Current.style[this.Slider.SIZE.l] = (100 / R.Pages.length) * R.Current.Pages.length + "%";
                        Current.style[this.Slider.AXIS.b] = (R.Current.Pages.StartPage.PageIndex / R.Pages.length * 100) + "%";
                    } else {
                        Current.style[this.Slider.SIZE.l]  = (R.Main["offset" + this.Slider.SIZE.L]  / R.Main["scroll" + this.Slider.SIZE.L] * 100) + "%";
                        Current.style[this.Slider.AXIS.ob] = (R.Main["scroll" + this.Slider.AXIS.OB] / R.Main["scroll" + this.Slider.SIZE.L] * 100) + "%";
                    }
                },
                flip: () => {
                    var SlidedDistance = this.Slider.Status.CurrentCoord - this.Slider.Status.StartCoord;
                    var TargetPageIndex = this.Slider.Status.StartPageIndex + Math.round(R.Pages.length * (SlidedDistance / this.Slider["offset" + this.Slider.SIZE.L] * (settings.S.ARD != "ttb" && settings.S.PPD == "rtl" ? -1 : 1)));
                    if(TargetPageIndex < 0)                  TargetPageIndex = 0;
                    else if(TargetPageIndex > R.Pages.length - 1) TargetPageIndex = R.Pages.length - 1;
                    var TargetPage = R.Pages[TargetPageIndex];
                    if(TargetPage != R.Current.Pages.StartPage && TargetPage != R.Current.Pages.EndPage) {
                        E.dispatch("bibi:commands:focus-on", { Destination: TargetPage, Duration: 0 });
                    }
                    if(this.Slider.Sliding) {
                        sML.style(this.Slider.Current, { transform: "translate" + this.Slider.AXIS.XY + "(" + SlidedDistance + "px)" });
                    } else {
                        sML.style(this.Slider.Current, { transform: "" });
                        this.Slider.progress();
                    }
                },
                slide: (Eve) => {
                    var SliderEdges = [
                        this.Slider["offset" + this.Slider.AXIS.OB],
                        this.Slider["offset" + this.Slider.AXIS.OB] + this.Slider["offset" + this.Slider.SIZE.L]
                    ];
                    var CurrentCoord = O.getBibiEventCoord(Eve)[this.Slider.AXIS.XY];
                    if(CurrentCoord < SliderEdges[0]) CurrentCoord = SliderEdges[0];
                    else if(CurrentCoord > SliderEdges[1]) CurrentCoord = SliderEdges[1];
                    this.Slider.Status.CurrentCoord = CurrentCoord;
                    this.Slider.flip();
                },
                startSliding: (Eve) => {
                    if(!Eve.target || !Eve.target.id || !/^bibi-slider-/.test(Eve.target.id)) return;
                    Eve.preventDefault();
                    this.Slider.Sliding = true;
                    this.Slider.Status = {
                        StartPageIndex: R.Current.Pages.StartPage.PageIndex,
                        StartCoord: (Eve.target == this.Slider.Current) ?
                            O.getBibiEventCoord(Eve)[this.Slider.AXIS.XY] :
                            this.Slider["offset" + this.Slider.AXIS.OB] + this.Slider.Current["offset" + this.Slider.AXIS.OB] + this.Slider.Current["offset" + this.Slider.SIZE.L]  / 2
                    };
                    this.Slider.Status.CurrentCoord = this.Slider.Status.StartCoord;
                    clearTimeout(this.Slider.Timer_endSliding);
                    sML.addClass(O.HTML, "slider-sliding");
                    E.add("bibi:moved-pointer", this.Slider.slide);
                },
                endSliding: (Eve) => {
                    if(!this.Slider.Sliding) return;
                    this.Slider.Sliding = false;
                    E.remove("bibi:moved-pointer", this.Slider.slide);
                    this.Slider.Status.CurrentCoord = O.getBibiEventCoord(Eve)[this.Slider.AXIS.XY];
                    this.Slider.flip();
                    this.Slider.Timer_endSliding = setTimeout(() => { sML.removeClass(O.HTML, "slider-sliding"); }, 125);
                },
                activate: () => {
                    if(this.Nombre) {
                        this.Slider.Current.removeEventListener(O["pointerover"], this.s_nombreshow);
                        this.Slider.Current.removeEventListener(O["pointerout"],  this.s_nombrehide);
                    }
                    O.HTML.addEventListener(O["pointerdown"], this.Slider.startSliding);
                    R.Items.concat(O).forEach((Item) => { Item.HTML.addEventListener(O["pointerup"], this.Slider.endSliding); });
                    E.add("bibi:scrolls", this.Slider.progress);
                    this.Slider.progress();
                },
                deactivate: () => {
                    if(this.Nombre) {
                        this.Slider.Current.removeEventListener(O["pointerover"], this.s_nombreshow);
                        this.Slider.Current.removeEventListener(O["pointerout"],  this.s_nombrehide);
                    }
                    O.HTML.removeEventListener(O["pointerdown"], this.Slider.startSliding);
                    R.Items.concat(O).forEach((Item) => { Item.HTML.removeEventListener(O["pointerup"], this.Slider.endSliding); });
                    E.remove("bibi:scrolls", this.Slider.progress);
                }
            })
        );
        this.Slider.Spreads      = this.Slider.appendChild(sML.create("div", { id: "bibi-slider-spreads" }));
        this.Slider.Pages        = this.Slider.appendChild(sML.create("div", { id: "bibi-slider-pages" }));
        this.Slider.CurrentPages = this.Slider.appendChild(sML.create("div", { id: "bibi-slider-currentpages" }));
        this.Slider.Current      = this.Slider.CurrentPages.appendChild(sML.create("div", { id: "bibi-slider-currentpagebits" }));
        this.Slider.Current.Labels = { default: { default: "Slider Current" } };
        this.setFeedback(this.Slider.Current);
        this.setToggleAction(this.Slider, {
            onopened: () => {
                this.Slider.progress();
                sML.addClass(O.HTML, "slider-opened");
                //this.Shade.open(); // bad
                E.dispatch("bibi:opened-slider");
            },
            onclosed: () => {
                this.Slider.progress();
                sML.removeClass(O.HTML, "slider-opened");
                //this.Shade.close(); // bad
                E.dispatch("bibi:closed-slider");
            }
        });
        E.add("bibi:commands:open-slider",   (Opt) => { this.Slider.open(Opt); });
        E.add("bibi:commands:close-slider",  (Opt) => { this.Slider.close(Opt); });
        E.add("bibi:commands:toggle-slider", (Opt) => { this.Slider.toggle(Opt); });
        E.add("bibi:tapped", (Eve) => {
            if(!L.Opened) return false;
            if(this.isPointerStealth()) return false;
            var BibiEvent = O.getBibiEvent(Eve);
            if(BibiEvent.Target.tagName) {
                if(/bibi-slider/.test(BibiEvent.Target.id)) return false;
                if(O.isAnchorContent(BibiEvent.Target)) return false;
                if(settings.S.RVM == "horizontal" && BibiEvent.Coord.Y > window.innerHeight - O.Scrollbars.Height) return false;
            }
            switch(settings.S.ARD) {
            case "ttb": return (BibiEvent.Division.Y == "middle") ? E.dispatch("bibi:commands:toggle-slider") : false;
            default   : return (BibiEvent.Division.X == "center") ? E.dispatch("bibi:commands:toggle-slider") : false;
            }
        });
        E.add("bibi:opened",   this.Slider.activate);
        //E.add("bibi:opened",   this.Slider.open);
        E.add("bibi:laid-out", this.Slider.reset);
        E.add("bibi:closed-panel", this.Slider.close);
    
        // Optimize to Scrollbar Size
        sML.appendStyleRule([
            "html.view-paged div#bibi-slider",
            "html.view-horizontal div#bibi-slider"
        ].join(", "), "height: " + (O.Scrollbars.Height) + "px;");
        sML.appendStyleRule([
            "html.view-vertical div#bibi-slider"
        ].join(", "), "width: " + (O.Scrollbars.Width) + "px;");
    
        E.dispatch("bibi:created-slider");
    
    }
    
    
    createArrows() {
    
        if(!settings.S["use-arrows"]) return;
    
        this.Arrows = {
            update: () => {
                if(settings.S.RVM == "vertical") {
                    this.Arrows["top"] = this.Arrows.Back, this.Arrows["bottom"] = this.Arrows.Forward;
                    this.Arrows["left"] = this.Arrows["right"] = undefined;
                } else {
                    if(settings.S.PPD == "ltr") this.Arrows["left"]  = this.Arrows.Back, this.Arrows["right"] = this.Arrows.Forward;
                    else               this.Arrows["right"] = this.Arrows.Back, this.Arrows["left"]  = this.Arrows.Forward;
                    this.Arrows["top"] = this.Arrows["bottom"] = undefined;
                }
            },
            navigate: () => {
                setTimeout(() => {
                    R.getCurrent();
                    [this.Arrows.Back, this.Arrows.Forward].forEach((Arrow) => {
                        if(Arrow.isAvailable()) sML.addClass(Arrow, "glowing");
                    });
                    setTimeout(() => {
                        [this.Arrows.Back, this.Arrows.Forward].forEach((Arrow) => {
                            sML.removeClass(Arrow, "glowing");
                        });
                    }, 1234);
                }, 400);
            },
            check: () => {
                [this.Arrows.Back, this.Arrows.Forward].forEach((Arrow) => {
                    if(Arrow.isAvailable()) sML.replaceClass(Arrow, "unavailable",   "available");
                    else                    sML.replaceClass(Arrow,   "available", "unavailable");
                });
            },
            areAvailable: (BibiEvent) => {
                if(!L.Opened) return false;
                if(this.Panel && this.Panel.UIState == "active") return false;
                if(this.Menu && BibiEvent.Coord.Y < this.Menu.offsetHeight * 1.5) return false;
                if(settings.S.RVM == "vertical") {
                    if(BibiEvent.Coord.X > window.innerWidth  - O.Scrollbars.Width)  return false;
                } else if(settings.S.RVM == "horizontal") {
                    if(BibiEvent.Coord.Y > window.innerHeight - O.Scrollbars.Height) return false;
                } else {
                    if(this.Slider && BibiEvent.Coord.Y > window.innerHeight - this.Slider.offsetHeight) return false;
                }
                if(BibiEvent.Target.ownerDocument.documentElement == O.HTML) {
                    if(BibiEvent.Target == O.HTML || BibiEvent.Target == O.Body) return true;
                    if(/^(bibi-main|bibi-arrow|bibi-help|bibi-poweredby)/.test(BibiEvent.Target.id)) return true;
                    if(/^(spread|item)/.test(BibiEvent.Target.className)) return true;
                } else {
                    return O.isAnchorContent(BibiEvent.Target) ? false : true;
                }
                return false;
            }
        };
    
        sML.addClass(O.HTML, "arrows-active");
    
        this.Arrows.Back = this.Arrows["back"] = O.Body.appendChild(
            sML.create("div", { id: "bibi-arrow-back",
                Distance: -1,
                Labels: {
                    default: { default: "Back", ja: "戻る" }
                },
                isAvailable: () => {
                    return (L.Opened && (R.Current.Pages.StartPage != R.Pages[0] || R.Current.Pages.StartPageRatio != 100));
                }
            })
        );
        this.Arrows.Forward = this.Arrows["forward"] = O.Body.appendChild(
            sML.create("div", { id: "bibi-arrow-forward",
                Distance: +1,
                Labels: {
                    default: { default: "Forward", ja: "進む" }
                },
                isAvailable: () => {
                    return (L.Opened && (R.Current.Pages.EndPage != R.Pages[R.Pages.length - 1] || R.Current.Pages.EndPageRatio != 100));
                }
            })
        );
        this.Arrows.Back.Pair = this.Arrows.Forward;
        this.Arrows.Forward.Pair = this.Arrows.Back;
        [this.Arrows.Back, this.Arrows.Forward].forEach((Arrow) => {
            this.setFeedback(Arrow);
            Arrow.addTapEventListener("tap", (Eve) => {
                if(L.Opened) E.dispatch("bibi:commands:move-by", { Distance: Arrow.Distance });
            });
            Arrow.showHelp = Arrow.hideHelp = () => {};
        });
    
        if(!O.Mobile) {
            E.add("bibi:moved-pointer", (Eve) => { // try hovering
                if(!L.Opened) return false;
                if(this.isPointerStealth()) return false;
                var BibiEvent = O.getBibiEvent(Eve);
                if(this.Arrows.areAvailable(BibiEvent)) {
                    var Dir = (settings.S.RVM == "vertical") ? BibiEvent.Division.Y : BibiEvent.Division.X;
                    if(this.Arrows[Dir]) {
                        if(this.Arrows[Dir].isAvailable()) {
                            E.dispatch("bibi:hovers",   Eve, this.Arrows[Dir]);
                            E.dispatch("bibi:unhovers", Eve, this.Arrows[Dir].Pair);
                            BibiEvent.Target.ownerDocument.documentElement.setAttribute("data-bibi-cursor", Dir);
                            return;
                        } else {
                            BibiEvent.Target.ownerDocument.documentElement.setAttribute("data-bibi-cursor", "no");
                            return;
                        }
                    } else {
                        switch(settings.S.ARD) {
                        case "ttb": (BibiEvent.Division.Y == "middle") ? BibiEvent.Target.ownerDocument.documentElement.setAttribute("data-bibi-cursor", "menu") : false; break;
                        default   : (BibiEvent.Division.X == "center") ? BibiEvent.Target.ownerDocument.documentElement.setAttribute("data-bibi-cursor", "menu") : false;
                        }
                        E.dispatch("bibi:unhovers", Eve, this.Arrows.Back);
                        E.dispatch("bibi:unhovers", Eve, this.Arrows.Forward);
                        return;
                    }                
                }
                E.dispatch("bibi:unhovers", Eve, this.Arrows.Back);
                E.dispatch("bibi:unhovers", Eve, this.Arrows.Forward);
                R.Items.concat(O).forEach((Item) => {
                    Item.HTML.removeAttribute("data-bibi-cursor");
                });
            });
            E.add("bibi:opened", () => {
                R.Items.concat(O).forEach((Item) => {
                    sML.each(Item.Body.querySelectorAll("img"), function(){ this.addEventListener(O["pointerdown"], O.preventDefault); });
                });
            });
        }
    
        E.add("bibi:tapped", (Eve) => { // try moving
            if(!L.Opened) return false;
            if(this.isPointerStealth()) return false;
            var BibiEvent = O.getBibiEvent(Eve);
            if(/^bibi-arrow-/.test(BibiEvent.Target.id)) return false;
            if(!this.Arrows.areAvailable(BibiEvent)) return false;
            var Dir = (settings.S.RVM == "vertical") ? BibiEvent.Division.Y : BibiEvent.Division.X;
            if(this.Arrows[Dir] && this.Arrows[Dir].isAvailable()) {
                //E.dispatch("bibi:commands:move-by", { Distance: this.Arrows[Dir].Distance });
                E.dispatch("bibi:taps",   Eve, this.Arrows[Dir]);
                E.dispatch("bibi:tapped", Eve, this.Arrows[Dir]);
            }
        });
    
        E.add("bibi:commands:move-by", (Par) => { // indicate direction
            if(!L.Opened) return false;
            if(!Par || !Par.Distance) return false;
            var Dir = "";
            switch(Par.Distance) {
            case -1 : Dir = "back";    break;
            case  1 : Dir = "forward"; break;
            }
            if(Dir && this.Arrows[Dir]) return E.dispatch("bibi:tapped", null, this.Arrows[Dir]);
        });
    
        E.add("bibi:loaded-item", (Item) => {
            
            sML.appendStyleRule("html[data-bibi-cursor=\"left\"]",   "cursor: w-resize;", Item.contentDocument);
            sML.appendStyleRule("html[data-bibi-cursor=\"right\"]",  "cursor: e-resize;", Item.contentDocument);
            sML.appendStyleRule("html[data-bibi-cursor=\"top\"]",    "cursor: n-resize;", Item.contentDocument);
            sML.appendStyleRule("html[data-bibi-cursor=\"bottom\"]", "cursor: s-resize;", Item.contentDocument);
            sML.appendStyleRule("html[data-bibi-cursor=\"menu\"]", "cursor: cell;", Item.contentDocument);
            sML.appendStyleRule("html[data-bibi-cursor=\"no\"]", "cursor: not-allowed;", Item.contentDocument);
            
            //sML.appendStyleRule("html[data-bibi-cursor]", "cursor: pointer;", Item.contentDocument);
        });
    
        E.add("bibi:opened",           () =>    { this.Arrows.update(); this.Arrows.check(); this.Arrows.navigate(); });
        E.add("bibi:updated-settings", () =>    { this.Arrows.update(); });
        E.add("bibi:changed-view",     () =>    { this.Arrows.navigate(); });
        E.add("bibi:scrolled",         () =>    { this.Arrows.check(); });
    
        E.dispatch("bibi:created-arrows");
    
    }
    
    
    createKeyListener() {
        if(!settings.S["use-keys"]) return;
        // Keys
        this.KeyListener = {
            ActiveKeys: {},
            KeyCodes: { "keydown": {}, "keyup": {}, "keypress": {} },
            updateKeyCodes: function(EventTypes, KeyCodesToUpdate) {
                if(typeof EventTypes.join != "function")  EventTypes = [EventTypes];
                if(typeof KeyCodesToUpdate == "function") KeyCodesToUpdate = KeyCodesToUpdate();
                EventTypes.forEach((EventType) => {
                    this.KeyCodes[EventType] = sML.edit(this.KeyCodes[EventType], KeyCodesToUpdate);
                });
            },
            MovingParameters: {
                "Space":  1,  "Page Up":     -1,  "Page Down":      1,  "End": "foot",  "Home": "head",
                "SPACE": -1,  "PAGE UP": "head",  "PAGE DOWN": "foot",  "END": "foot",  "HOME": "head"
            },
            updateMovingParameters: () => {
                switch(settings.S.ARD) {
                case "ttb": return sML.edit(this.KeyListener.MovingParameters, {
                    "Up Arrow":     -1,  "Right Arrow":      0,  "Down Arrow":      1,  "Left Arrow":      0,
                    "W":            -1,  "D":                0,  "S":               1,  "A":               0,
                    "UP ARROW": "head",  "RIGHT ARROW":     "",  "DOWN ARROW": "foot",  "LEFT ARROW":     ""
                });
                case "ltr": return sML.edit(this.KeyListener.MovingParameters, {
                    "Up Arrow":      0,  "Right Arrow":      1,  "Down Arrow":      0,  "Left Arrow":     -1,
                    "W":             0,  "D":                1,  "S":               0,  "A":              -1,
                    "UP ARROW":     "",  "RIGHT ARROW": "foot",  "DOWN ARROW":     "",  "LEFT ARROW": "head"
                });
                case "rtl": return sML.edit(this.KeyListener.MovingParameters, {
                    "Up Arrow":      0,  "Right Arrow":     -1,  "Down Arrow":      0,  "Left Arrow":      1,
                    "W":             0,  "D":               -1,  "S":               0,  "A":               1,
                    "UP ARROW":     "",  "RIGHT ARROW": "head",  "DOWN ARROW":     "",  "LEFT ARROW": "foot"
                });
                default: return sML.edit(this.KeyListener.MovingParameters, {
                    "Up Arrow":      0,  "Right Arrow":      0,  "Down Arrow":      0,  "Left Arrow":      0,
                    "W":             0,  "D":                0,  "S":               0,  "A":               0,
                    "UP ARROW":     "",  "RIGHT ARROW":     "",  "DOWN ARROW":     "",  "LEFT ARROW":     ""
                });
                }
            },
            getBibiKeyName: (Eve) => {
                var KeyName = this.KeyListener.KeyCodes[Eve.type][Eve.keyCode];
                return KeyName ? KeyName : "";
            },
            onEvent: (Eve) => {
                if(!L.Opened) return false;
                Eve.BibiKeyName = this.KeyListener.getBibiKeyName(Eve);
                Eve.BibiModifierKeys = [];
                if(Eve.shiftKey) Eve.BibiModifierKeys.push("Shift");
                if(Eve.ctrlKey)  Eve.BibiModifierKeys.push("Control");
                if(Eve.altKey)   Eve.BibiModifierKeys.push("Alt");
                if(Eve.metaKey)  Eve.BibiModifierKeys.push("Meta");
                //if(!Eve.BibiKeyName) return false;
                if(Eve.BibiKeyName) Eve.preventDefault();
                return true;
            },
            onkeydown:  (Eve) => {
                if(!this.KeyListener.onEvent(Eve)) return false;
                if(Eve.BibiKeyName) {
                    if(!this.KeyListener.ActiveKeys[Eve.BibiKeyName]) {
                        this.KeyListener.ActiveKeys[Eve.BibiKeyName] = Date.now();
                    } else {
                        E.dispatch("bibi:is-holding-key", Eve);
                    }
                }
                E.dispatch("bibi:downs-key", Eve);
            },
            onkeyup:    (Eve) => {
                if(!this.KeyListener.onEvent(Eve)) return false;
                if(this.KeyListener.ActiveKeys[Eve.BibiKeyName] && Date.now() - this.KeyListener.ActiveKeys[Eve.BibiKeyName] < 300) {
                    E.dispatch("bibi:touches-key", Eve);
                    E.dispatch("bibi:touched-key", Eve);
                }
                if(Eve.BibiKeyName) {
                    if(this.KeyListener.ActiveKeys[Eve.BibiKeyName]) {
                        delete this.KeyListener.ActiveKeys[Eve.BibiKeyName];
                    }
                }
                E.dispatch("bibi:ups-key", Eve);
            },
            onkeypress:  (Eve) => {
                if(!this.KeyListener.onEvent(Eve)) return false;
                E.dispatch("bibi:presses-key", Eve);
            },
            observe: () => {
                [O].concat(R.Items).forEach((Item) => {
                    ["keydown", "keyup", "keypress"].forEach((EventName) => {
                        Item.contentDocument.addEventListener(EventName, this.KeyListener["on" + EventName], false);
                    });
                });
            },
            tryMoving: (Eve) => {
                if(!Eve.BibiKeyName) return false;
                var MovingParameter = this.KeyListener.MovingParameters[!Eve.shiftKey ? Eve.BibiKeyName : Eve.BibiKeyName.toUpperCase()];
                if(!MovingParameter) return false;
                Eve.preventDefault();
                if(typeof MovingParameter == "number") E.dispatch("bibi:commands:move-by",  { Distance:    MovingParameter });
                else if(typeof MovingParameter == "string") E.dispatch("bibi:commands:focus-on", { Destination: MovingParameter });
            }
        };
    
        this.KeyListener.updateKeyCodes(["keydown", "keyup", "keypress"], {
            32: "Space"
        });
        this.KeyListener.updateKeyCodes(["keydown", "keyup"], {
            33: "Page Up",     34: "Page Down",
            35: "End",         36: "Home",
            37: "Left Arrow",  38: "Up Arrow",  39: "Right Arrow",  40: "Down Arrow",
            65: "A",           87: "W",         68: "D",            83: "S",
        });
    
        E.add("bibi:updated-settings", (   ) => { this.KeyListener.updateMovingParameters(); });
        E.add("bibi:opened",           (   ) => { this.KeyListener.updateMovingParameters(); this.KeyListener.observe(); });
    
        E.add("bibi:touched-key",      (Eve) => { this.KeyListener.tryMoving(Eve); });
    
        E.dispatch("bibi:created-keylistener");
    
    }
    
    
    createSwiper() {
    
        if(!settings.S["use-swipe"]) return;
    
        this.Swiper = {
            update: () => {
                settings.S.RVM == "paged" ? this.Swiper.open() : this.Swiper.close();
                return this.Swiper.State;
            },
            activateElement: (Ele) => {
                Ele.addEventListener("touchstart", this.s_ontouchstart);
                Ele.addEventListener("touchmove", this.s_ontouchmove);
                Ele.addEventListener("touchend", this.s_ontouchend);
                if(!O.Mobile) {
                    Ele.addEventListener("wheel", this.s_onwheel);
                    sML.each(Ele.querySelectorAll("img"), function(){ this.addEventListener(O["pointerdown"], O.preventDefault); });
                }
            },
            deactivateElement: (Ele) => {
                Ele.removeEventListener("touchstart", this.s_ontouchstart);
                Ele.removeEventListener("touchmove", this.s_ontouchmove);
                Ele.removeEventListener("touchend", this.s_ontouchend);
                if(!O.Mobile) {
                    Ele.removeEventListener("wheel", this.s_onwheel);
                    sML.each(Ele.querySelectorAll("img"), function(){ this.removeEventListener(O["pointerdown"], O.preventDefault); });
                }
            },
            ontouchstart: (Eve) => {
                var EventCoord = O.getBibiEventCoord(Eve);
                this.Swiper.TouchStartedOn = { X: EventCoord.X, Y: EventCoord.Y, T: Eve.timeStamp };
            },
            ontouchmove: (Eve) => {
                if(Eve.touches.length == 1 && document.body.clientWidth / window.innerWidth <= 1) Eve.preventDefault();
            },
            ontouchend: (Eve) => {
                if(!this.Swiper.TouchStartedOn) return;
                if(document.body.clientWidth / window.innerWidth <= 1 && Eve.timeStamp - this.Swiper.TouchStartedOn.T <= 300) {
                    var EventCoord = O.getBibiEventCoord(Eve);
                    var VarX = EventCoord.X - this.Swiper.TouchStartedOn.X;
                    var VarY = EventCoord.Y - this.Swiper.TouchStartedOn.Y;
                    if(Math.sqrt(Math.pow(VarX, 2) + Math.pow(VarY, 2)) >= 10) {
                        var Deg = Math.atan2((VarY ? VarY * -1 : 0), VarX) * 180 / Math.PI;
                        var From = "", To = "";
                        if( 120 >= Deg && Deg >=   60) From = "bottom", To = "top";
                        else if(  30 >= Deg && Deg >=  -30) From = "left",   To = "right";
                        else if( -60 >= Deg && Deg >= -120) From = "top",    To = "bottom";
                        else if(-150 >= Deg || Deg >=  150) From = "right",  To = "left";
                        if(this.Arrows[From] && this.Arrows[From].isAvailable()) {
                            E.dispatch("bibi:commands:move-by", { Distance: this.Arrows[From].Distance });
                        }
                    }
                }
                delete this.Swiper.TouchStartedOn;
            },
            onwheeled: (Eve) => {
                if(!Eve.BibiSwiperWheel) return;
                clearTimeout(this.Swiper.onwheeled.Timer_cooldown);
                this.Swiper.onwheeled.Timer_cooldown = setTimeout(() => { this.Swiper.onwheeled.hot = false; }, 248);
                if(!this.Swiper.onwheeled.hot) {
                    this.Swiper.onwheeled.hot = true;
                    E.dispatch("bibi:commands:move-by", { Distance: Eve.BibiSwiperWheel.Distance });
                }
            }/*,
            addButton: () => {
                this.Menu.Config.SubPanel.SwipeSection = this.Menu.Config.SubPanel.addSection({
                    //Labels: { default: { default: 'Settings', ja: '操作設定' } }
                    ButtonGroup: {
                        Buttons: [
                            {
                                Type: "toggle",
                                Labels: {
                                    default: { default: 'Swipe', ja: 'スワイプ操作' },
                                    active:  { default: 'Swipe', ja: 'スワイプ操作' }
                                },
                                Icon: '<span class="bibi-icon bibi-icon-toggle-swipe"></span>',
                                action: () => {
                                    this.Swiper.toggle();
                                    this.Panel.close();
                                    this.Menu.close();
                                }
                            }
                        ]
                    }
                });
                this.Swiper.Button = this.Menu.Config.SubPanel.SwipeSection.ButtonGroup.Buttons[0];
                E.add("bibi:activated-touch",   () => { this.setState(this.Swiper.Button, "active"); });
                E.add("bibi:deactivated-touch", () => { this.setState(this.Swiper.Button, ""); });
            }*/
        };
    
        this.setToggleAction(this.Swiper, {
            onopened: () => {
                sML.addClass(O.HTML, "swipe-active");
                if(!O.Mobile) E.add("bibi:wheeled", this.Swiper.onwheeled);
                this.Swiper.activateElement(R.Main);
                R.Items.forEach((Item) => { this.Swiper.activateElement(Item.HTML); });
            },
            onclosed: () => {
                sML.removeClass(O.HTML, "swipe-active");
                if(!O.Mobile) E.remove("bibi:wheeled", this.Swiper.onwheeled);
                this.Swiper.deactivateElement(R.Main);
                R.Items.forEach((Item) => { this.Swiper.deactivateElement(Item.HTML); });
            }
        });
    
        E.add("bibi:laid-out:for-the-first-time", () => {
            this.Swiper.update();
            E.add("bibi:updated-settings", () => { this.Swiper.update(); });
            //this.Swiper.addButton();
        });
        E.add("bibi:commands:activate-swipe",   () => { this.Swiper.open(); });
        E.add("bibi:commands:deactivate-swipe", () => { this.Swiper.close(); });
        E.add("bibi:commands:toggle-swipe",     () => { this.Swiper.toggle(); });
    
        E.dispatch("bibi:created-swiper");
    
    }
    
    
    createSpinner() {
    
        this.Spinner = O.Body.appendChild(sML.create("div", { id: "bibi-spinner" }));
        for(var i = 1; i <= 12; i++) this.Spinner.appendChild(document.createElement("span"));
        E.dispatch("bibi:created-spinner");
    
    }
    
    
    setToggleAction(Ele, Par) {
        //console.warn(Ele); TODO FIX
        if(!Par) Par = {}; // { open: Function, close: Function }
        return sML.edit(Ele, {
            UIState: "default",
            open: (Opt) => {
                if(!Opt) Opt = {}; // { callback: Function, CallbackTime: Number }
                if(Ele.UIState == "default") {
                    //Ele.Locked = true;
                    this.setUIState(Ele, "active");
                    if(Par.onopened) Par.onopened.apply(Ele, arguments);
                } else {
                    Opt.CallbackTime = 0;
                }
                Ele.callback(Opt);
                return Ele.UIState;
            },
            close: (Opt) => {
                if(!Opt) Opt = {}; // { callback: Function, CallbackTime: Number }
                if(Ele.UIState == "active") {
                    this.setUIState(Ele, "default");
                    if(Par.onclosed) Par.onclosed.apply(Ele, arguments);
                } else {
                    Opt.CallbackTime = 0;
                }
                Ele.callback(Opt);
                return Ele.UIState;
            },
            toggle: (Opt) => {
                return (Ele.UIState == "default" ? Ele.open(Opt) : Ele.close(Opt));
            },
            callback: (Opt) => {
                if(Opt && typeof Opt.callback == "function") setTimeout(() => { Opt.callback.call(Ele); }, (typeof Opt.CallbackTime == "number" ? Opt.CallbackTime : 250));
            }
        });
    }
    
    
    distillLabels(Labels) {
        if(typeof Labels != "object" || !Labels) Labels = {};
        for(var State in Labels) Labels[State] = this.distillLabels_distillLanguage(Labels[State]);
        if(!Labels["default"])                       Labels["default"]  = this.distillLabels_distillLanguage();
        if(!Labels["active"]   && Labels["default"]) Labels["active"]   = Labels["default"];
        if(!Labels["disabled"] && Labels["default"]) Labels["disabled"] = Labels["default"];
        return Labels;
    }
    
    distillLabels_distillLanguage(Label) {
        if(typeof Label != "object" || !Label) Label = { default: Label };
        if(typeof Label["default"] != "string")  {
            if(typeof Label["en"] == "string")       Label["default"]  = Label["en"];
            else if(typeof Label[O.Language] == "string") Label["default"]  = Label[O.Language];
            else                                          Label["default"]  = "";
        }
        if(typeof Label[O.Language] != "string") {
            if(typeof Label["default"] == "string")  Label[O.Language] = Label["default"];
            else if(typeof Label["en"]      == "string")  Label[O.Language] = Label["en"];
            else                                          Label[O.Language] = "";
        }
        return Label;
    }
    
    
    observeHover(Ele) {
        Ele.addEventListener(O["pointerover"], (Eve) => { E.dispatch("bibi:hovers",   Eve, Ele); });
        Ele.addEventListener(O["pointerout"],  (Eve) => { E.dispatch("bibi:unhovers", Eve, Ele); });
        return Ele;
    }
    
    
    setHoverActions(Ele) {
        E.add("bibi:hovers", (Eve) => {
            if(Ele.Hover) return Ele;
            if(Ele.isAvailable && !Ele.isAvailable(Eve)) return Ele;
            Ele.Hover = true;
            sML.addClass(Ele, "hover");
            if(Ele.showHelp) Ele.showHelp();
            return Ele;
        }, Ele);
        E.add("bibi:unhovers", (Eve) => {
            if(!Ele.Hover) return Ele;
            Ele.Hover = false;
            sML.removeClass(Ele, "hover");
            if(Ele.hideHelp) Ele.hideHelp();
            return Ele;
        }, Ele);
        return Ele;
    }
    
    
    
    observeTap(Ele, Opt) {
        if(!Opt) Opt = {};
        
        if(!Ele.addTapEventListener) {
            Ele.addTapEventListener = (EN, Fun) => {
                if(EN == "tap") EN = "taps";
                E.add("bibi:" + EN, (Eve, Ele) => {
                    return Fun.call(Ele, Eve);
                }, Ele);
                return Ele;
            };
            Ele.addEventListener(O["pointerdown"], (Eve) => {
                clearTimeout(Ele.Timer_tap);
                Ele.TouchStart = { Time: Date.now(), Event: Eve, Coord: O.getBibiEventCoord(Eve) };
                Ele.Timer_tap = setTimeout(() => { delete Ele.TouchStart; }, 333);
                if(Opt.PreventDefault)  Eve.preventDefault();
                if(Opt.StopPropagation) Eve.stopPropagation();
            });
            Ele.addEventListener(O["pointerup"], (Eve) => {
                if(Ele.TouchStart) {
                    if((Date.now() - Ele.TouchStart.Time) < 300) {
                        var TouchEndCoord = O.getBibiEventCoord(Eve);
                        if(Math.abs(TouchEndCoord.X - Ele.TouchStart.Coord.X) < 5 && Math.abs(TouchEndCoord.Y - Ele.TouchStart.Coord.Y) < 5) {
                            E.dispatch("bibi:taps",   Ele.TouchStart.Event, Ele);
                            E.dispatch("bibi:tapped", Ele.TouchStart.Event, Ele);
                        }
                    }
                    delete Ele.TouchStart;
                }
                if(Opt.PreventDefault)  Eve.preventDefault();
                if(Opt.StopPropagation) Eve.stopPropagation();
            });
        }
        return Ele;
    }
    
    
    setTapAction(Ele) {
        var ontapped = (() => {
            switch(Ele.Type) {
            case "toggle": return (Eve) => {
                if(Ele.UIState == "disabled") return false;
                this.setUIState(Ele, Ele.UIState == "default" ? "active" : "default");
            };
            case "radio": return (Eve) => {
                if(Ele.UIState == "disabled") return false;
                Ele.ButtonGroup.Buttons.forEach((Button) => {
                    if(Button != Ele) this.setUIState(Button, "");
                });
                this.setUIState(Ele, "active");
            };
            default: return (Eve) => {
                if(Ele.UIState == "disabled") return false;
                this.setUIState(Ele, "active");
                clearTimeout(Ele.Timer_deactivate);
                Ele.Timer_deactivate = setTimeout(() => {
                    this.setUIState(Ele, "");
                }, 200);
            };
            }
        })();
        Ele.addTapEventListener("tapped", (Eve) => {
            if(Ele.isAvailable && !Ele.isAvailable(Eve)) return Ele;
            if(Ele.Type == "radio" && Ele.UIState == "active") return Ele;
            if(Ele.UIState == "disabled") return Ele;
            ontapped.call(Ele, Eve);
            if(Ele.hideHelp) Ele.hideHelp();
            if(Ele.note) Ele.note();
            return Ele;
        });
        return Ele;
    }
    
    
    setFeedback(Ele, Opt) {
        if(!Opt) Opt = {};
        Ele.Labels = this.distillLabels(Ele.Labels);
        if(Ele.Labels) {
            if(Opt.Help) {
                Ele.showHelp = () => {
                    if(this.Help && Ele.Labels[Ele.UIState]) this.Help.show(Ele.Labels[Ele.UIState][O.Language]);
                    return Ele;
                };
                Ele.hideHelp = () => {
                    if(this.Help) this.Help.hide();
                    return Ele;
                };
            }
            if(Ele.Notes) Ele.note = () => {
                if(Ele.Labels[Ele.UIState]) setTimeout(() => { this.note(Ele.Labels[Ele.UIState][O.Language]); }, 0);
                return Ele;
            };
        }
        if(!O.Mobile) this.observeHover(Ele);
        this.setHoverActions(Ele);
        this.observeTap(Ele, Opt);
        this.setTapAction(Ele);
        Ele.addTapEventListener("tap", (Eve) => {
            if(Ele.isAvailable && !Ele.isAvailable()) return false;
            E.dispatch("bibi:is-going-to:tap:ui", Ele);
        });
        Ele.addTapEventListener("tapped", (Eve) => {
            E.dispatch("bibi:tapped:ui", Ele);
        });
        this.setUIState(Ele, "default");
        return Ele;
    }
    
    
    setUIState(UI, UIState) {
        if(!UIState) UIState = "default";
        UI.PreviousUIState = UI.UIState;
        if(UIState == UI.UIState) return;
        UI.UIState = UIState;
        if(UI.tagName) {
            if(UI.Labels && UI.Labels[UI.UIState] && UI.Labels[UI.UIState][O.Language]) {
                UI.title = UI.Labels[UI.UIState][O.Language].replace(/<[^>]+>/g, "");
                if(UI.Label) UI.Label.innerHTML = UI.Labels[UI.UIState][O.Language];
            }
            sML.replaceClass(UI, UI.PreviousUIState, UI.UIState);
        }
        return UI.UIState;
    }
    
    isPointerStealth() {
        var IsPointerStealth = false;
        this.isPointerStealth_Checkers.forEach((checker) => { if(checker()) IsPointerStealth = true; });
        return IsPointerStealth;
    }
}

export default (new I);