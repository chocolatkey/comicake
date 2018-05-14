/*!
 *
 * # BiB/i Extension: Loupe (for Pointing Devices)
 *
 * - "Zooming-in Utility: Users can zoom-in the book with pointing devices."
 * - Copyright (c) Satoru MATSUSHIMA - http://bibi.epub.link or https://github.com/satorumurmur/bibi
 * - Licensed under the MIT license. - http://www.opensource.org/licenses/mit-license.php
 *
 */

import settings from '../S';
import O from '../O';
import B from '../B';
import I from '../I';
import R from '../R';
import E from '../E';
import L from '../L';
import sML from "../../vendor/sML";
import buttonGroup from "../I/buttonGroup";
import subPanel from "../I/subPanel";


class Loupe {
    prepare() {
        this.mode = "pointer-only"; // X.Presets.Loupe["mode"] = pointer-only or with-keys
        this.max_scale = 4;
        if(O.Mobile) return;
        this.initialize();
        if(this.mode == "with-keys") I.setUIState(this.SubPanel.Sections[0].ButtonGroup.Buttons[0], "active");
        this.toggle();
        if(settings.S["use-cookie"]) try { this.transform(O.Cookie.remember(B.ID).Loupe.Transformation); } catch(Err) {}
        this.onTransformEnd();
    }
    

    initialize() {
        if(O.Mobile) return;
        if(this.mode == "with-keys" && !settings.S["use-keys"]) return;

        /*I.isPointerStealth.addChecker(function() {
            return this.isAvailable("CHECK-STEALTH");
        });*/
        I.isPointerStealth_Checkers.push(() => this.isAvailable("CHECK-STEALTH"))

        I.setToggleAction(this, {
            onopened: () => {
                sML.addClass(O.HTML, "loupe-active");
                sML.addClass(O.HTML, "loupe-" + this.mode);
                if(this.mode == "with-keys") I.setUIState(this.SubPanel.Sections[0].ButtonGroup.Buttons[0], "active");
            },
            onclosed: () => {
                this.scale(1);
                sML.removeClass(O.HTML, "loupe-" + this.mode);
                sML.removeClass(O.HTML, "loupe-active");
                if(this.mode == "with-keys") I.setUIState(this.SubPanel.Sections[0].ButtonGroup.Buttons[0], "default");
            }
        });

        E.add("bibi:commands:activate-loupe",   () =>      { this.open(); });
        E.add("bibi:commands:deactivate-loupe", () =>      { this.close(); });
        E.add("bibi:commands:toggle-loupe",     () =>      { this.toggle(); });
        E.add("bibi:commands:scale",            (Scale) => { this.scale(Scale); });

        E.add("bibi:tapped",         (Eve) => { this.ontapped(     Eve); });
        E.add("bibi:downed-pointer", (Eve) => { this.onpointerdown(Eve); });
        E.add("bibi:upped-pointer",  (Eve) => { this.onpointerup(  Eve); });
        E.add("bibi:moved-pointer",  (Eve) => { this.onpointermove(Eve); });

        E.add("bibi:changed-scale", (Scale) => { O.log('Changed Scale: ' + Scale); });

        // Button Group
        this.ButtonGroup = new buttonGroup({ Area: I.Menu.R, Sticky: true, Tiled: true, id: "bibi-buttongroup_loupe", className: "mhide" });

        if(this.mode == "with-keys") {
            // Button
            this.MenuButton = this.ButtonGroup.addButton({
                Type: "toggle",
                Labels: {
                    default: {
                        default: 'Zoom-in/out',
                        ja: '拡大機能'
                    },
                    active: {
                        default: 'Close Zoom-in/out Menu',
                        ja: '拡大機能メニューを閉じる'
                    }
                },
                Icon: '<span class="bibi-icon bibi-icon-loupe bibi-icon-loupe-menu"></span>',
                Help: true
            });
            // SubPanel
            this.SubPanel = new subPanel({
                Opener: this.MenuButton,
                id: "bibi-subpanel_loupe",
                open: () => {}
            });
            this.SubPanel.addSection({
                Labels: {
                    default: {
                        default: 'Zoom-in/out or Reset',
                        ja: '拡大縮小とリセット'
                    }
                },
                ButtonGroup: {
                    Buttons: [{
                        Type: "toggle",
                        Labels: {
                            default: {
                                default: 'Zoom-in/out',
                                ja: '拡大機能'
                            },
                            active: {
                                default: 'Zoom-in/out <small>(activated)</small>',
                                ja: '拡大機能<small>（現在有効）</small>'
                            }
                        },
                        Icon: '<span class="bibi-icon bibi-icon-loupe bibi-icon-loupe-zoomin"></span>',
                        action: () => { this.toggle(); }
                    }, {
                        Type: "normal",
                        Labels: {
                            default: { default: 'Reset Zoom-in/out', ja: '元のサイズに戻す' }
                        },
                        Icon: '<span class="bibi-icon bibi-icon-loupe bibi-icon-loupe-reset"></span>',
                        action: () => { this.scale(1); }
                    }]
                },
                Notes: [{
                    Position: "after",
                    default: {
                        default: ['<strong>Zoom-in/out is activated</strong>:', '* Space + Click to Zoom-in'].join('<br />'),
                        ja: ['<strong>拡大機能が有効のとき</strong>：', '・スペースキーを押しながらクリックで拡大'].join('<br />')
                    }
                }, {
                    Position: "after",
                    default: {
                        default: ['<strong>Zoomed-in</strong>:', '* Space + Shift + Click to Zoom-out', '* Space + Drag to Move the Book'].join('<br />'),
                        ja: ['<strong>拡大中</strong>：', '・スペース + Shift キーを押しながらクリックで縮小', '・スペースキーを押しながらドラッグで本を移動'].join('<br />')
                    }
                }]
            });
        } else {
            this.ZoomInButton = this.ButtonGroup.addButton({
                Type: "normal",
                Labels: {
                    default: { default: 'Zoom-in', ja: '拡大する' }
                },
                Icon: '<span class="bibi-icon bibi-icon-loupe bibi-icon-loupe-zoomin"></span>',
                Help: true,
                action: () => { this.scale(this.adjustScale(R.Main.Transformation.Scale + 0.5)); }
            });
            this.ZoomResetButton = this.ButtonGroup.addButton({
                Type: "normal",
                Labels: {
                    default: { default: 'Reset Zoom-in/out', ja: '元のサイズに戻す' }
                },
                Icon: '<span class="bibi-icon bibi-icon-loupe bibi-icon-loupe-reset"></span>',
                Help: true,
                action: () => { this.scale(1); }
            });
            this.ZoomOutButton = this.ButtonGroup.addButton({
                Type: "normal",
                Labels: {
                    default: { default: 'Zoom-out', ja: '縮小する' }
                },
                Icon: '<span class="bibi-icon bibi-icon-loupe bibi-icon-loupe-zoomout"></span>',
                Help: true,
                action: () => { this.scale(this.adjustScale(R.Main.Transformation.Scale - 0.5)); }
            });
        }

        E.dispatch("bibi:created-loupe-menu");
        E.dispatch("bibi:created-loupe");
    }

    scale(Scl, BibiEvent) { // Scl: Scale
        if(typeof Scl != "number") return false;
        Scl = Math.round(Scl * 100) / 100;
        if(Scl == R.Main.Transformation.Scale) return;
        E.dispatch("bibi:changes-scale", Scl);
        if(Scl == 1) {
            this.transform({ Scale: 1, Translation: { X: 0, Y: 0 } });
        } else {
            if(this.UIState != "active") return false;
            if(!BibiEvent) BibiEvent = { Coord: { X: R.Main.offsetWidth / 2, Y: R.Main.offsetHeight / 2 } };
            this.transform({
                Scale: Scl,
                Translation: {
                    X: BibiEvent.Coord.X - (BibiEvent.Coord.X - R.Main.Transformation.Translation.X) * (Scl / R.Main.Transformation.Scale),
                    Y: BibiEvent.Coord.Y - (BibiEvent.Coord.Y - R.Main.Transformation.Translation.Y) * (Scl / R.Main.Transformation.Scale)
                }
            });
        }
        E.dispatch("bibi:changed-scale", R.Main.Transformation.Scale);
    };

    transform(Tfm) { // Tfm: Transformation
        if(!Tfm) return;
        clearTimeout(this.Timer_onTransformEnd);
        sML.addClass(O.HTML, "transforming");
        if(Tfm.Translation.X > 0) Tfm.Translation.X = 0;
        if(Tfm.Translation.Y > 0) Tfm.Translation.Y = 0;
        if(Tfm.Translation.X < R.Main.offsetWidth  * (1 - Tfm.Scale)) Tfm.Translation.X = R.Main.offsetWidth  * (1 - Tfm.Scale);
        if(Tfm.Translation.Y < R.Main.offsetHeight * (1 - Tfm.Scale)) Tfm.Translation.Y = R.Main.offsetHeight * (1 - Tfm.Scale);
        sML.style(R.Main, {
            transform: ((Ps) => {
                     if(Tfm.Translation.X && Tfm.Translation.Y) Ps.push( "translate(" + Tfm.Translation.X + "px" + ", " + Tfm.Translation.Y + "px" + ")");
                else if(Tfm.Translation.X                     ) Ps.push("translateX(" + Tfm.Translation.X + "px"                                   + ")");
                else if(                     Tfm.Translation.Y) Ps.push("translateY("                                   + Tfm.Translation.Y + "px" + ")");
                     if(Tfm.Scale != 1                        ) Ps.push(     "scale(" + Tfm.Scale                                                  + ")");
                return Ps.join(" ");
            })([])
        });
        R.Main.Transformation = Tfm;
        this.Timer_onTransformEnd = setTimeout(() => {
                 if(R.Main.Transformation.Scale == 1) sML.removeClass(O.HTML, "zoomed-in" ), sML.removeClass(O.HTML, "zoomed-out");
            else if(R.Main.Transformation.Scale <  1) sML.removeClass(O.HTML, "zoomed-in" ),    sML.addClass(O.HTML, "zoomed-out");
            else                                      sML.removeClass(O.HTML, "zoomed-out"),    sML.addClass(O.HTML, "zoomed-in" );
            sML.removeClass(O.HTML, "transforming");
            this.onTransformEnd();
            if(settings.S["use-cookie"]) O.Cookie.eat(O.BookURL, { Loupe: { Transformation: R.Main.Transformation } });
        }, 345);
    }

    isAvailable(Mode, Eve) {
        if(!L.Opened) return false;
        if(this.UIState != "active") return false;
        if(settings.S.BRL == "reflowable") return false;
        if(Mode == "CHECK-STEALTH") {
            if(!I.KeyListener.ActiveKeys["Space"] && !this.Dragging) return false;
        } else if(Mode == "TAP") {
            if(!I.KeyListener.ActiveKeys["Space"]) return false;
        } else if(Mode == "MOVE") {
            if(R.Main.Transformation.Scale == 1) return false;
        } else {
            if(!R.PointerIsDowned) return false;
        }
        return true;
    };

    onTransformEnd() {
        if(this.mode == "with-keys") {
            I.setUIState(this.SubPanel.Sections[0].ButtonGroup.Buttons[1], (R.Main.Transformation.Scale == 1) ? "disabled" : "default");
        } else {
            I.setUIState(this.ZoomInButton,    (R.Main.Transformation.Scale == this.max_scale) ? "disabled" : "default");
            I.setUIState(this.ZoomResetButton, (R.Main.Transformation.Scale ==                            1) ? "disabled" : "default");
            I.setUIState(this.ZoomOutButton,   (R.Main.Transformation.Scale ==                            1) ? "disabled" : "default");
        }
    };

    adjustScale(Scl) {
             if(Scl < 1                           ) return 1;
        else if(Scl > this.max_scale) return this.max_scale;
        return Scl;
    };

    ontapped(Eve) {
        if(!this.isAvailable("TAP", Eve)) return false;
        var BibiEvent = O.getBibiEvent(Eve);
        if(BibiEvent.Target.tagName) {
            if(/bibi-menu|bibi-slider/.test(BibiEvent.Target.id)) return false;
            if(O.isAnchorContent(BibiEvent.Target)) return false;
            if(S.RVM == "horizontal" && BibiEvent.Coord.Y > window.innerHeight - O.Scrollbars.Height) return false;
        }
        this.scale(this.adjustScale(R.Main.Transformation.Scale + 0.5 * (Eve.shiftKey ? -1 : 1)), BibiEvent);
    };

    onpointerdown(Eve) {
        this.PointerDownCoord = O.getBibiEvent(Eve).Coord;
        this.PointerDownTransformation = {
            Scale: R.Main.Transformation.Scale,
            Translation: {
                X: R.Main.Transformation.Translation.X,
                Y: R.Main.Transformation.Translation.Y
            }
        };
    };

    onpointerup(Eve) {
        sML.removeClass(O.HTML, "dragging");
        this.Dragging = false;
        delete this.PointerDownCoord;
        delete this.PointerDownTransformation;
    };

    onpointermove(Eve) {
        if(!this.isAvailable("MOVE", Eve)) return false;
        if(R.Main.Transformation.Scale == 1 || !this.PointerDownCoord) return;
        this.Dragging = true;
        sML.addClass(O.HTML, "dragging");
        var BibiEvent = O.getBibiEvent(Eve);
        clearTimeout(this.Timer_TransitionRestore);
        sML.style(R.Main, { transition: "none", cursor: "move" });
        this.transform({
            Scale: R.Main.Transformation.Scale,
            Translation: {
                X: this.PointerDownTransformation.Translation.X + (BibiEvent.Coord.X - this.PointerDownCoord.X),
                Y: this.PointerDownTransformation.Translation.Y + (BibiEvent.Coord.Y - this.PointerDownCoord.Y)
            }
        });
        this.Timer_TransitionRestore = setTimeout(() => { sML.style(R.Main, { transition: "", cursor: "" }); }, 234);
    }
}

export default (new Loupe);