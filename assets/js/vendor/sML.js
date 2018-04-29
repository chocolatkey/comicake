/*!
 *                                                                                                                         (℠)
 *  sML JavaScript Library
 *
 *  - "I'm a Simple and Middling Library."
 *  - Copyright (c) Satoru MATSUSHIMA - https://github.com/satorumurmur/sML
 *  - Licensed under the MIT license. - http://www.opensource.org/licenses/mit-license.php
 *  
 *  - Patches applied by chocolatkey
 */ 

let sML = (function() { var Version = "0.999.47", Build = 201704101657;

//==============================================================================================================================================
//----------------------------------------------------------------------------------------------------------------------------------------------

//-- Polarstar

//----------------------------------------------------------------------------------------------------------------------------------------------

    var sML = function(S) {
        var SML = (typeof S == "string") ? [sML.create.apply(this, arguments)] : (S.length ? S : [S]);
        if(window.__proto__) SML.__proto__ = sML.SML; else for(var M in sML.SML) SML[M] = sML.SML[M];
        return SML;
    };

    sML["version"] = Version, sML["build"] = Build;

    var nUA = navigator.userAgent;
    var getVersion = function(Prefix, Reference) {
        var N = parseFloat(nUA.replace(new RegExp("^.*" + Prefix + "[ :\\/]?(\\d+([\\._]\\d+)?).*$"), Reference ? Reference : "$1").replace(/_/g, "."));
        return (!isNaN(N) ? N : undefined);
    };

    sML.OperatingSystem = sML.OS = (function(OS) {
        if(/iP(hone|ad|od( touch)?);/.test(nUA)) OS.iOS          = getVersion("CPU (iP(hone|ad|od( touch)?) )?OS", "$4");
        else if(          /OS X 10[\._]\d/.test(nUA)) OS.macOS        = getVersion("OS X ");
        else if(  /Windows Phone( OS)? \d/.test(nUA)) OS.WindowsPhone = getVersion("Windows Phone OS") || getVersion("Windows Phone");
        else if(        /Windows( NT)? \d/.test(nUA)) OS.Windows      = (function(W) { return (W >= 10 ? W : W >= 6.3 ? 8.1 : W >= 6.2 ? 8 : W >= 6.1 ? 7 : W); })(getVersion("Windows NT") || getVersion("Windows"));
        else if(              /Android \d/.test(nUA)) OS.Android      = getVersion("Android");
        else if(                    /CrOS/.test(nUA)) OS.Chrome       = true;
        else if(                    /X11;/.test(nUA)) OS.Linux        = true;
        else if(                 /Firefox/.test(nUA)) OS.Firefox      = true;
        return OS;
    })({});

    sML.UserAgent = sML.UA = (function(UA) {
        if(/Gecko\/\d/.test(nUA)) {
            UA.Gecko = getVersion("rv");
            if(/Firefox\/\d/.test(nUA)) UA.Firefox = getVersion("Firefox");
        } else if(/Edge\/\d/.test(nUA)) {
            UA.Edge = getVersion("Edge");
        } else if(/Chrome\/\d/.test(nUA)) {
            UA.Blink = getVersion("Chrome") || true;
            if( /OPR\/\d/.test(nUA)) UA.Opera  = getVersion("OPR");
            else if(/Silk\/\d/.test(nUA)) UA.Silk   = getVersion("Silk");
            else                          UA.Chrome = UA.Blink;
        } else if(/AppleWebKit\/\d/.test(nUA)) {
            UA.WebKit = getVersion("AppleWebKit");
            if(   /CriOS \d/.test(nUA)) UA.Chrome  = getVersion("CriOS");
            else if(   /FxiOS \d/.test(nUA)) UA.Firefox = getVersion("FxiOS");
            else if(/Version\/\d/.test(nUA)) UA.Safari  = getVersion("Version");
        } else if(/Trident\/\d/.test(nUA)) {
            UA.Trident          = getVersion("Trident"); 
            UA.InternetExplorer = getVersion("rv") || getVersion("MSIE");
        }
        try { UA.Flash = parseFloat(navigator.mimeTypes["application/x-shockwave-flash"].enabledPlugin.description.replace(/^.+?([\d\.]+).*$/, "$1")); } catch(e) {}
        return UA;
    })({});

    sML.Environments = sML.Env = (function(Env) {
        ["OS", "UA"].forEach(function(OS_UA) { for(var Param in sML[OS_UA]) if(Param != "Flash" && sML[OS_UA][Param]) Env.push(Param); });
        return Env;
    })([]);

    //----------------------------------------------------------------------------------------------------------------------------------------------

    sML.log = function() { try { console.log.apply(console, arguments); } catch(e) {} };

    sML.write = function() {
        document.open();
        for(var i = 0, L = arguments.length; i < L; i++) document.write(arguments[i]);
        document.close();
    };




    //==============================================================================================================================================
    //----------------------------------------------------------------------------------------------------------------------------------------------

    //-- Fill

    //----------------------------------------------------------------------------------------------------------------------------------------------

    sML.Fill = {
        Prefixes: ["webkit", "moz", "MS", "ms", "o"],
        carePrefix: function(O, P) {
            if(P in O) return O[P];
            P = P[0].toUpperCase() + P.slice(1);
            for(var Property = "", i = 0, L = this.Prefixes.length; i < L; i++) {
                Property = this.Prefixes[i] + P;
                if(Property in O) return O[Property];
            }
            return undefined;
        }
    };

    if(sML.UA.InternetExplorer <= 9) {
        if(typeof window.console     == "undefined") window.console     =            {};
        if(typeof window.console.log != "function" ) window.console.log = function() {};
    }

    window.requestAnimationFrame = sML.Fill.carePrefix(window, "requestAnimationFrame") || function(F) { setTimeout(F, 1000/60); };

    if(!window.CustomEvent || (typeof window.CustomEvent !== "function") && (window.CustomEvent.toString().indexOf("CustomEventConstructor") === -1)) {
        window.CustomEvent = function(EventName, Option) {
            Option = Option || { bubbles: false, cancelable: false, detail: undefined };
            var Eve = document.createEvent("CustomEvent");
            Eve.initCustomEvent(EventName, Option.bubbles, Option.cancelable, Option.detail);
            return Eve;
        };
        window.CustomEvent.prototype = window.Event.prototype;
    }




    //==============================================================================================================================================
    //----------------------------------------------------------------------------------------------------------------------------------------------

    //-- Events

    //----------------------------------------------------------------------------------------------------------------------------------------------

    sML.Event = {
        add:    function(Obj, ELs) { for(var EN in ELs)    Obj.addEventListener(EN, ELs[EN], false); return Obj; },
        remove: function(Obj, ELs) { for(var EN in ELs) Obj.removeEventListener(EN, ELs[EN]);        return Obj; },
        preventDefault:  function(Eve) { Eve.preventDefault(); },
        stopPropagation: function(Eve) { Eve.stopPropagation(); },
        OnResizeFont: {
            RegularFunctions: [],
            onZoomInFunctions: [],
            onZoomOutFunctions: [],
            addEventListener: function(F, S) {
                if(S && S > 0) this.onZoomInFunctions.push(F);
                else if(S && S < 0) this.onZoomOutFunctions.push(F);
                else                this.RegularFunctions.push(F);
            },
            detect: function(Ele, Tim) {
                if(!Ele) var Ele = document.body;
                if(!Tim) var Tim = 200;
                this.checker = Ele;
                this.timer = setInterval(function() {
                    var currentHeight = sML.Coord.getElementSize(sML.onResizeFont.checker).h;
                    if(sML.onResizeFont.prevHeight && sML.onResizeFont.prevHeight != currentHeight) {
                        var Functions = sML.onResizeFont.RegularFunctions;
                        if(sML.onResizeFont.prevHeight && sML.onResizeFont.prevHeight < currentHeight) {
                            Functions = Functions.concat(sML.onResizeFont.onZoomInFunctions);
                        } else if(sML.onResizeFont.prevHeight && sML.onResizeFont.prevHeight > currentHeight) {
                            Functions = Functions.concat(sML.onResizeFont.onZoomOutFunctions);
                        }
                        for(var i = 0, L = Functions.length; i < L; i++) Functions[i]();
                    }
                    sML.onResizeFont.prevHeight = currentHeight;
                }, Tim);
            },
            stopDetect: function() {
                if(this.timer) clearTimeout(this.timer);
            }
        }
    };

    sML.addEventListener = sML.Event.add;
    sML.removeEventListener = sML.Event.remove;




    //==============================================================================================================================================
    //----------------------------------------------------------------------------------------------------------------------------------------------

    //-- Timers / AnimationFrames

    //----------------------------------------------------------------------------------------------------------------------------------------------

    sML.Timers = {
        setTimeout:  function() {
            var Tim = Array.prototype.shift.call(arguments);
            var Fun = Array.prototype.shift.call(arguments);
            Array.prototype.unshift.call(arguments, Tim);
            Array.prototype.unshift.call(arguments, Fun);
            return setTimeout.apply(window, arguments);
        },
        setInterval: function() {
            var Tim = Array.prototype.shift.call(arguments);
            var Fun = Array.prototype.shift.call(arguments);
            Array.prototype.unshift.call(arguments, Tim);
            Array.prototype.unshift.call(arguments, Fun);
            return setInterval.apply(window, arguments);
        }
    };

    sML.setTimeout  = sML.Timers.setTimeout;
    sML.setInterval = sML.Timers.setInterval;

    //----------------------------------------------------------------------------------------------------------------------------------------------

    sML.Drawer = {
        draw: function(What, Fun) {
            if(!What.ToBeDrawn) {
                requestAnimationFrame(function() {
                    Fun.apply(What, arguments);
                    What.ToBeDrawn = false;
                });
                What.ToBeDrawn = true;
            }
        }
    };

    sML.draw = sML.Drawer.draw;




    //==============================================================================================================================================
    //----------------------------------------------------------------------------------------------------------------------------------------------

    //-- Object / DOM / Elements

    //----------------------------------------------------------------------------------------------------------------------------------------------

    sML.set = sML.edit = function(Obj, Pros, Sty) {
        for(var Pro in Pros) {
            if(Pro == "on" || Pro == "extraHTML") continue;
            if(/^data-/.test(Pro)) Obj.setAttribute(Pro, Pros[Pro]);
            else                   Obj[Pro] = Pros[Pro];
        }
        if(Pros) {
            if(Pros.extraHTML) Obj.innerHTML = Obj.innerHTML + Pros.extraHTML;
            if(Pros.on) sML.Event.add(Obj, Pros.on);
            if(Sty) sML.CSS.set(Obj, Sty);
        }
        return Obj;
    };

    sML.create = function(TN, Pros, Sty) {
        return sML.set(document.createElement(TN), Pros, Sty);
    };

    sML.changeClass = sML.changeClassName = function(Ele, CN) {
        if(CN) Ele.className = CN;
        else Ele.removeAttribute("class");
        return Ele.className;
    };

    sML.addClass = sML.addClassName = function(Ele, CN) {
        if(typeof CN != "string") return Ele.className;
        CN = CN.trim().replace(/ +/g, " ");
        if(!CN) return Ele.className;
        if(Ele.className) {
            if((" " + Ele.className + " ").indexOf(" " + CN + " ") > -1) return Ele.className;
            CN = Ele.className + " " + CN;
        }
        return sML.changeClass(Ele, CN);
    };

    sML.removeClass = sML.removeClassName = function(Ele, CN) {
        if(!Ele.className) return "";
        if(typeof CN != "string") return Ele.className;
        CN = CN.trim().replace(/ +/g, " ");
        if(!CN) return Ele.className;
        if((" " + Ele.className + " ").indexOf(" " + CN + " ") <  0) return Ele.className;
        CN = (" " + Ele.className + " ").replace(" " + CN + " ", " ").trim().replace(/ +/g, " ");
        return sML.changeClass(Ele, CN);
    };

    sML.replaceClass = sML.replaceClassName = function(Ele, RCN, ACN) {
        sML.removeClass(Ele, RCN);
        return sML.addClass(Ele, ACN);
    };

    sML.appendChildren = function(Par, Eles) {
        if(!Eles.length) Eles = [Eles];
        for(var i = 0, L = Eles.length; i < L; i++) Par.appendChild(Eles[i]);
        return Eles;
    };

    sML.deleteElement = function(Ele) {
        if(Ele.parentNode) Ele.parentNode.removeChild(Ele);
        Ele.innerHTML = "", Ele = null;
    //delete Ele;
    };

    sML.hatch = function() {
        for(var HTML = "", i = 0, L = arguments.length; i < L; i++) HTML += arguments[i];
        var Egg = document.createElement("div"), Chick = document.createDocumentFragment();
        Egg.innerHTML = HTML;
        for(var i = 0, L = Egg.childNodes.length; i < L; i++) Chick.appendChild(Egg.firstChild);
        return Chick;
    };

    sML.cloneObject = function(Obj) {
        var Fun = function() {};
        Fun.prototype = Obj;
        return new Fun();
    };




    //==============================================================================================================================================
    //----------------------------------------------------------------------------------------------------------------------------------------------

    //-- CSS

    //----------------------------------------------------------------------------------------------------------------------------------------------

    sML.CSS = {
        Prefix:        (sML.UA.WebKit || sML.UA.Blink ? "Webkit"              : (sML.UA.Gecko ? "Moz"           : (sML.UA.Trident ? "ms"              : ""))),
        TransitionEnd: (sML.UA.WebKit || sML.UA.Blink ? "webkitTransitionEnd" : (sML.UA.Gecko ? "transitionend" : (sML.UA.Trident ? "MSTransitionEnd" : ""))),
        AnimationEnd:  (sML.UA.WebKit || sML.UA.Blink ? "webkitAnimationEnd"  : (sML.UA.Gecko ? "animationend"  : (sML.UA.Trident ? "MSAnimationEnd"  : ""))),
        Catalogue : [],
        getSFO : function(Ele) {
            for(var i = 0, L = this.Catalogue.length; i < L; i++) if(this.Catalogue[i].Element == Ele) return this.Catalogue[i];
            return this.Catalogue[this.Catalogue.push({ Element: Ele }) - 1];
        },
        getComputedStyle: function(Ele, Pro) {
            var Sty = Ele.currentStyle || document.defaultView.getComputedStyle(Ele, (Pro ? Pro : "")); 
            return Sty;
        },
        StyleSheets: [],
        getStyleSheet: function(Doc) {
            for(var i = 0, L = this.StyleSheets.length; i < L; i++) {
                if(this.StyleSheets[i].StyleFor == Doc) {
                    return this.StyleSheets[i].StyleSheet;
                }
            }
            var Sty = Doc.createElement("style");
            Sty.appendChild(Doc.createTextNode(""));
            Doc.getElementsByTagName("head")[0].appendChild(Sty);
            this.StyleSheets.push({ StyleFor: Doc, StyleSheet: Sty.sheet });
            return Sty.sheet;
        },
        appendRule: function(Sel, Sty, Doc) {
            if(!Sel || !Sty) return null;
            Doc = Doc ? Doc : document;
            var SS = this.getStyleSheet(Doc);
            if(!SS) return null;
            if(typeof Sel.join == "function") { // ["html", "body"]
                Sel = Sel.join(", ");
            }
            if(typeof Sty.join == "function") { // ["display: block;", "position: static;"]
                Sty = Sty.join(" ");
            } else if(typeof Sty == "object") { // { display: "block", position: "static" }
                var TSty = [];
                for(var Pro in Sty) {
                    TSty.push(Pro.trim() + ": " + Sty[Pro].replace(/;?\s*$/, "").trim() + ";");
                }
                Sty = TSty.join(" ");
            }
            return SS.insertRule(Sel + "{" + Sty + "}", SS.cssRules.length);
        },
        deleteRule: function(Ind, Doc) {
            var SS = this.getStyleSheet(Doc ? Doc : document);
            if(SS) return SS.deleteRule(Ind);
        },
        setProperty: function(Ele, Pro, Val) {
            if(!Ele || !Pro) return Ele;
            if(/^(animation|background(-s|S)ize|box|break|column|filter|flow|hyphens|region|shape|transform|transition|writing)/.test(Pro)) { // 2013/09/25
                Ele.style[this.Prefix + Pro.replace(/(-|^)([a-z])/g, function (M0, M1, M2) { return M2 ? M2.toUpperCase() : ""; })] = Val;
            } else if(Pro == "float") {
                Pro = "cssFloat";
            }
            Ele.style[Pro] = Val;
            return Ele;
        },
        addTransitionEndListener: function(Ele, Fun) {
            if(typeof Fun != "function") return;
            Ele.sMLTransitionEndListener = Fun;
            Ele.addEventListener(this.TransitionEnd, Ele.sMLTransitionEndListener);
        },
        removeTransitionEndListener: function(Ele) {
            if(typeof Ele.sMLTransitionEndListener != "function") return;
            Ele.removeEventListener(this.TransitionEnd, Ele.sMLTransitionEndListener);
            delete Ele.sMLTransitionEndListener;
        },
        set: function(Ele, Sty, callback) {
            if(!Ele || typeof Sty != "object") return Ele;
            this.removeTransitionEndListener(Ele);
            if(typeof callback == "function") {
                this.removeTransitionEndListener(Ele);
                this.addTransitionEndListener(Ele, callback);
            }
            if(Sty instanceof Array) {
                Sty.forEach(function(ProVal) {
                    ProVal = ProVal.split(":");
                    var Pro = ProVal.shift().trim(), Val = ProVal.join("").replace(/;\s*$/, "").trim();
                    this.setProperty(Ele, Pro, Val);
                });
            } else {
                for(var Pro in Sty) if(/^transition/.test(Pro)) this.setProperty(Ele, Pro, Sty[Pro]), delete(Sty[Pro]);
                for(var Pro in Sty) this.setProperty(Ele, Pro, Sty[Pro]);
            }
            return Ele;
        },
        getRGB: function(Pro) {
            var RGB = Pro.replace(/rgb\(([\d\., ]+)\)/, "$1").replace(/\s/g, "").split(",");
            for(var i = 0, L = RGB.length; i < L; i++) RGB[i] = parseInt(RGB[i]);
            return RGB;
        },
        getRGBA: function(Pro) {
            var RGBA = Pro.replace(/rgba?\(([\d\., ]+)\)/, "$1").replace(/\s/g, "").split(",");
            for(var i = 0, L = RGBA.length; i < L; i++) RGBA[i] = parseInt(RGBA[i]);
            if(!RGBA[3]) RGBA[3] = 1;
            return RGBA;
        }
    };

    sML.style = sML.css = function(E, PV, Cb) { return sML.CSS.set(E, PV, Cb); };
    sML.appendStyleRule = sML.appendCSSRule = function(Sel, Sty, PD) { return sML.CSS.appendRule(Sel, Sty, PD); };
    sML.deleteStyleRule = sML.deleteCSSRule = function(Ind, PD) { return sML.CSS.deleteRule(Ind, PD); };



    //==============================================================================================================================================
    //----------------------------------------------------------------------------------------------------------------------------------------------

    //-- Easing

    //----------------------------------------------------------------------------------------------------------------------------------------------

    sML.Easing = (typeof window.easing == "object") ? window.easing : {};

    sML.Easing.linear = function(Pos) { return Pos; };
    sML.Easing.getEaser = function(Eas) {
        return function(Pos) {
            return Pos + Eas / 100 * (1 - Pos) * Pos;
        };
    };



    //==============================================================================================================================================
    //----------------------------------------------------------------------------------------------------------------------------------------------

    //-- Transition

    //----------------------------------------------------------------------------------------------------------------------------------------------

    sML.Transition = {
        set : function(Ele, Par) {
            if(!Par) Par = {};
            if(Ele.sMLTransition) clearTimeout(Ele.sMLTransition.Timer);
            Ele.sMLTransition = {
                Element:                                                                    Ele ,
                CurrentFrame:                                                                 0 , // "C"urrent Frame (auto)
                Frames:       (Par.Frames                        ? Par.Frams        :        10), // "F"rames
                TimePerFrame: (Par.TimePerFrame                  ? Par.TimePerFrame :        10), // "T"ime/Frames (milli-seconds)
                Easing:       (Par.Easing                        ? Par.Easing       : undefined), // "E"asing (default)
                EasingX:      (Par.EasingX                       ? Par.EasingX      : undefined), // "X" for Easing (default)
                before:       (typeof Par.before   == "function" ? Par.before       : undefined),
                among:        (typeof Par.among    == "function" ? Par.among        : undefined),
                after:        (typeof Par.after    == "function" ? Par.after        : undefined),
                callback:     (typeof Par.callback == "function" ? Par.callback     : undefined),
                getNext: function(Sta, End, Eas, EasX) {
                    var X = 1, Step = this.CurrentFrame / this.Frames;
                    if(!Eas  && this.Easing ) var Eas  = this.Easing;
                    if(!EasX && this.EasingX) var EasX = this.EasingX;
                    if(!Eas)       X = Step;
                    else if( EasX == 0) X = Step + Eas / (100 * Math.PI) * Math.sin(Math.PI * Step);
                    else if(!EasX)      X = Step + Eas / 100 * (1 - Step) * Step;
                    else                X = (100 + EasX * Eas) * Step / (2 * EasX * Eas * Step + 100 - EasX * Eas);
                    return Sta + (End - Sta) * X;
                },
                getNextColor: function(Sta, End, Eas, EasX) { // [R, G, B(, A)], [R, G, B(, A)], Easing, EasingX
                    if(Sta.length == 3 && End.length == 4) Sta[3] = 1;
                    else if(Sta.length == 4 && End.length == 3) End[3] = 1;
                    for(var RGBA = [], i = 0, L = Sta.length; i < L; i++) RGBA[i] = Math.round(this.getNext(Sta[i], End[i]));
                    return RGBA;
                },
                begin: function() {
                    if(this.before) this.before.call(Ele, Ele.sMLTransition);
                    (function() {
                        if(this.CurrentFrame++ != this.Frames) {
                            if(this.among) this.among.call(Ele, Ele.sMLTransition);
                            this.Timer = setTimeout(arguments.callee, this.TimePerFrame);
                        } else {
                            if(this.after)    this.after.call(Ele, Ele.sMLTransition);
                            if(this.callback) this.callback.call(Ele, Ele.sMLTransition);
                        }
                    })();
                }
            };
            return Ele.sMLTransition;
        }
    };

    sML.transition = function(Ele, Par) {
        sML.Transition.set(Ele, Par).begin();
    };




    //==============================================================================================================================================
    //----------------------------------------------------------------------------------------------------------------------------------------------

    //-- Coord / Scroller

    //----------------------------------------------------------------------------------------------------------------------------------------------

    sML.Coord = {
        getXY: function(X, Y) {
            return { X:X, x:X, Y:Y, y:Y };
        },
        getWH: function(W, H) {
            return { Width:W, width:W, W:W, w:W, Height:H, height:H, H:H, h:H };
        },
        getXYTRBLCMWH: function(X, Y, T, R, B, L, C, M, W, H) {
            return {
                X:X, x:X,
                Y:Y, y:Y,
                Top:   T, top:   T, T:T, t:T,
                Right: R, right: R, R:R, r:R,
                Bottom:B, bottom:B, B:B, b:B,
                Left:  L, left:  L, L:L, l:L,
                Center:C, center:C, C:C, c:C,
                Middle:M, middle:M, M:M, m:M,
                Width: W, width: W, W:W, w:W,
                Height:H, height:H, H:H, h:H
            };
        },
        getScreenSize: function() {
            return this.getWH(screen.availWidth, screen.availHeight);
        },
        getScrollSize: function (Obj) {
            if(!Obj || Obj == window || Obj == document) Obj = document.documentElement;
            return this.getWH(Obj.scrollWidth, Obj.scrollHeight);
        },
        getOffsetSize: function (Obj) {
            if(!Obj || Obj == window) Obj = document.documentElement;
            if(Obj == document) return this.getScrollSize(document.documentElement);
            return this.getWH(Obj.offsetWidth, Obj.offsetHeight);
        },
        getClientSize: function (Obj) {
            if(!Obj || Obj == window) Obj = document.documentElement;
            if(Obj == document) return this.getScrollSize(document.documentElement);
            return this.getWH(Obj.clientWidth, Obj.clientHeight);
        },
        getDocumentSize: function() {
            return this.getScrollSize(document.documentElement);
        },
        getWindowSize: function() {
            return this.getOffsetSize(document.documentElement);
        },
        getElementSize: function (Obj) {
            return this.getOffsetSize(Obj);
        },
        getWindowCoord: function(Obj) {
            return this.getXY((window.screenLeft || window.screenX), (window.screenTop  || window.screenY));
        },
        getElementCoord: function (Obj, Par) {
            var RtL = (Par && Par.RtL);
            var X = Obj.offsetLeft, Y = Obj.offsetTop;
            if(RtL) X = X + Obj.offsetWidth - this.getOffsetSize(document.documentElement).W;
            while(Obj.offsetParent) Obj = Obj.offsetParent, X += Obj.offsetLeft, Y += Obj.offsetTop;
            return this.getXY(X, Y);
        },
        getScrollCoord: function(Obj) {
            if(!Obj || Obj == window) return this.getXY(
                (window.scrollX || window.pageXOffset || document.documentElement.scrollLeft),
                (window.scrollY || window.pageYOffset || document.documentElement.scrollTop)
            );
            return this.getXY(Obj.scrollLeft, Obj.scrollTop);
        },
        getScrollLimitCoord: function(Obj, Par) {
            var RtL = (Par && Par.RtL);
            if(!Obj || Obj == window) Obj = document.documentElement;
            var SS = this.getScrollSize(Obj), OS = this.getClientSize(Obj);
            return this.getXY(
                (SS.W - OS.W) * (RtL ? -1 : 1),
                (SS.H - OS.H)
            );
        },
        getEventCoord: function(Eve) {
            return (Eve ? this.getXY(Eve.pageX, Eve.pageY) : this.getXY(0, 0));
        },
        getCoord: function(Obj, Par) {
            if(Par && Par.RtL) return this.getCoord_RtL(Obj);
            /**/ if(Obj == screen)   var WH = this.getScreenSize(),                         LT = { X: 0,    Y: 0 },          RB = { X: WH.W,        Y:        WH.H };
            else if(Obj == window)   var WH = this.getOffsetSize(document.documentElement), LT = this.getScrollCoord(),      RB = { X: LT.X + WH.W, Y: LT.Y + WH.H };
            else if(Obj == document) var WH = this.getScrollSize(document.documentElement), LT = { X: 0,    Y: 0 },          RB = { X: WH.W,        Y:        WH.H };
            else if(Obj.tagName)     var WH = this.getOffsetSize(Obj),                      LT = this.getElementCoord(Obj),  RB = { X: LT.X + WH.W, Y: LT.Y + WH.H };
            else return {};
            return this.getXYTRBLCMWH(
            /*  XY  */ LT.X, LT.Y,
                /* TRBL */ LT.Y, RB.X, RB.Y, LT.X,
                /*  CM  */ Math.round((LT.X + RB.X) / 2), Math.round((LT.Y + RB.Y) / 2),
                /*  WH  */ WH.W, WH.H
            );
        },
        getCoord_RtL: function(Obj) {
        /**/ if(Obj == screen)   var WH = this.getScreenSize(),                         RT = { X: WH.W, Y: 0 },            LB = { X: 0,           Y:        WH.H };
            else if(Obj == window)   var WH = this.getOffsetSize(document.documentElement), RT = this.getScrollCoord(),        LB = { X: RT.X - WH.W, Y: RT.Y + WH.H };
            else if(Obj == document) var WH = this.getScrollSize(document.documentElement), RT = { X: 0, Y: 0 },               LB = { X: WH.W,        Y:        WH.H };
            else if(Obj.tagName)     var WH = this.getElementSize(Obj),                     RT = this.getElementCoord(Obj, 1), LB = { X: RT.X - WH.W, Y: RT.Y + WH.H };
            else return {};
            return this.getXYTRBLCMWH(
            /*  XY  */ RT.X, RT.Y,
                /* TRBL */ RT.Y, RT.X, LB.Y, LB.X,
                /*  CM  */ Math.round((LB.X + RT.X) / 2), Math.round((RT.Y + LB.Y) / 2),
                /*  WH  */ WH.W, WH.H
            );
        }
    };

    sML.getCoord = function() { return sML.Coord.getCoord.apply(sML.Coord, arguments); };

    sML.Scroller = {
        distillSetting: function(Tar, Opt) {
            var Setting = {};
            if(Tar instanceof HTMLElement) Setting.Target = sML.Coord.getElementCoord(Tar);
            else if(typeof Tar == "number")     Setting.Target = { X: undefined, Y: Tar   };
            else if(Tar)                        Setting.Target = { X: Tar.X,     Y: Tar.Y };
            else                                return false;
            Setting.Frame = (Tar.Frame && Tar.Frame instanceof HTMLElement) ? Tar.Frame : window;
            Setting.scrollTo = (Setting.Frame && Setting.Frame instanceof HTMLElement) ? function(X, Y) { Setting.Frame.scrollLeft = X; Setting.Frame.scrollTop = Y; } : window.scrollTo;
            Setting.Start = sML.Coord.getScrollCoord(Setting.Frame);
            Setting.Start.Time = (new Date()).getTime();
            if(typeof Setting.Target.X != "number") Setting.Target.X = Setting.Start.X;
            if(typeof Setting.Target.Y != "number") Setting.Target.Y = Setting.Start.Y;
            if(!Opt) Opt = {};
            Setting.Duration = (typeof Opt.Duration == "number" && Opt.Duration >= 0) ? Opt.Duration : 100;
            Setting.ease = (function() {
                switch(typeof Opt.Easing) {
                case "function": return Opt.Easing;
                case "string"  : return sML.Easing[Opt.Easing] ? sML.Easing[Opt.Easing] : sML.Easing.linear;
                case "number"  : return sML.Easing.getEaser(Opt.Easing);
                }
                return sML.Easing.linear;
            })();
            Setting.before   = typeof Opt.before   == "function" ? Opt.before   : function() {};
            Setting.among    = typeof Opt.among    == "function" ? Opt.among    : function() {};
            Setting.after    = typeof Opt.after    == "function" ? Opt.after    : function() {};
            Setting.callback = typeof Opt.callback == "function" ? Opt.callback : function() {};
            Setting.canceled = typeof Opt.canceled == "function" ? Opt.canceled : function() {};
            Setting.ForceScroll = Opt.ForceScroll;
            return Setting;
        },
        scrollTo: function(Tar, Opt) {
            this.Setting = this.distillSetting(Tar, Opt);
            if(!this.Setting) return false;
            this.scrollTo_begin();
        },
        scrollTo_begin: function() {
            clearTimeout(this.Timer);
            this.Setting.ForceScroll ? this.preventUserScrolling() : this.addScrollCancelation();
            this.Setting.before();
            this.scrollTo_among();
        },
        scrollTo_among: function() {
            var Progress = this.Setting.Duration ? ((new Date()).getTime() - this.Setting.Start.Time) / this.Setting.Duration : 1;
            if(Progress >= 1) return this.scrollTo_end();
            Progress = this.Setting.ease(Progress);
            this.Setting.scrollTo(
                Math.round(this.Setting.Start.X + (this.Setting.Target.X - this.Setting.Start.X) * Progress),
                Math.round(this.Setting.Start.Y + (this.Setting.Target.Y - this.Setting.Start.Y) * Progress)
            );
            this.Setting.among();
            this.Timer = setTimeout(function() { sML.Scroller.scrollTo_among(); }, 10);
        },
        scrollTo_end: function() {
            this.Setting.scrollTo(this.Setting.Target.X, this.Setting.Target.Y);
            this.Setting.after();
            this.Setting.callback();
            this.Setting.ForceScroll ? sML.Scroller.allowUserScrolling() : sML.Scroller.removeScrollCancelation();
            delete(this.Setting);
        },
        cancelScrolling: function() {
            clearTimeout(sML.Scroller.Timer);
            sML.Scroller.Setting.canceled();
            delete(sML.Scroller.Setting);
            sML.Scroller.removeScrollCancelation();
        },
        addScrollCancelation: function() {
            ["keydown", "mousedown", "wheel"].forEach(function(EveN) { document.addEventListener(   EveN, sML.Scroller.cancelScrolling); });
        },
        removeScrollCancelation: function() {
            ["keydown", "mousedown", "wheel"].forEach(function(EveN) { document.removeEventListener(EveN, sML.Scroller.cancelScrolling); });
        },
        preventUserScrolling: function() {
            ["keydown", "mousedown", "wheel"].forEach(function(EveN) { document.addEventListener(   EveN, sML.Scroller.preventDefault ); });
        },
        allowUserScrolling: function() {
            ["keydown", "mousedown", "wheel"].forEach(function(EveN) { document.removeEventListener(EveN, sML.Scroller.preventDefault ); });
        },
        preventDefault: function(Eve) {
            return Eve.preventDefault();
        }
    };

    sML.scrollTo = function() { sML.Scroller.scrollTo.apply(sML.Scroller, arguments); };




    //==============================================================================================================================================
    //----------------------------------------------------------------------------------------------------------------------------------------------

    //-- Ajax

    //----------------------------------------------------------------------------------------------------------------------------------------------

    sML.Ajax = {
        open : function(Par) {
            if(!Par || typeof Par.URI != "string" || typeof Par.onsuccess != "function") return false;
            var XHR = new XMLHttpRequest();
            if(!Par.Query)          Par.Query = null;
            if(!Par.Auth)           Par.Auth = ["", ""];
            if(!Par.MimeType)       Par.MimeType = null;
            if(!Par.onsuccess)      Par.onsuccess = function() {};
            if(!Par.onfailed)       Par.onfailed  = function() { sML.each(arguments, function() { sML.log(this + ""); }); };
            if(!Par.ontimeout)      Par.ontimeout = Par.onfailed;
            if(Par.Async !== false) Par.Async = true;
            Par.Method = (Par.Method && /^POST$/i.test(Par.Method)) ? "POST" : "GET";
            var QueryString = "";
            if(Par.Query) for(var Q in Par.Query) QueryString += "&" + Q + "=" + encodeURIComponent(Par.Query[Q]);
            if(QueryString) {
                if(Par.method == "GET") {
                    Par.URI = Par.URI + ((Par.URI.indexOf("?") > 0) ? QueryString : QueryString.replace(/^&/, "?"));
                    QueryString = null;
                } else if(Par.Method == "POST") {
                    QueryString = QueryString.replace(/^&/, "");
                }
            }
            XHR.sMLAjaxTimeout = 0, XHR.sMLAjaxTimeoutTimer = setTimeout(function() { XHR.sMLAjaxTimeout = 1; Par.ontimeout("sML.AJAX.get Timeout: " + Par.URI); }, 10000);
            Par.onstate4 = function(rT, rX) {
                if(XHR.sMLAjaxTimeout) return;
                clearTimeout(XHR.sMLAjaxTimeoutTimer);
                if(XHR.status == 200 || XHR.status == 0) Par.onsuccess(rT, rX);
                else                                     Par.onfailed("sML.AJAX.get Failed: (" + XHR.status + ") " + URL);
            //delete XHR;
            };
            XHR.onreadystatechange = function() {
                switch(this.readyState) {
                //  case 1: if(Par.onstate1) return Par.onstate1.call(this, this.responseText, this.responseXML); break; // loading
                //  case 2: if(Par.onstate2) return Par.onstate2.call(this, this.responseText, this.responseXML); break; // loaded
                //  case 3: if(Par.onstate3) return Par.onstate3.call(this, this.responseText, this.responseXML); break; // interactive
                case 4:                  return Par.onstate4.call(this, this.responseText, this.responseXML); break; // complete
                }
            };
            if(Par.MimeType) XHR.overrideMimeType(Par.MimeType);
            XHR.open(Par.Method, Par.URI, Par.Async, Par.Auth[0], Par.Auth[1]);
            if(Par.Method == "POST") XHR.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            XHR.send(QueryString);
            return XHR;
        }
    };

    sML.ajax = sML.Ajax.open;




    //==============================================================================================================================================
    //----------------------------------------------------------------------------------------------------------------------------------------------

    //-- Location / Hash / Query / History

    //----------------------------------------------------------------------------------------------------------------------------------------------

    sML.Location = {
        RE: new RegExp("^((([a-z]+)://([^/\\?#]+))(/[^\\?#]*))(\\?[^\\?#]*)?(#[^#]*)?$"),
        getFile:         function(U   ) { return (U ? U : location.href).replace(this.RE, "$1"); },
        getOrigin:       function(U   ) { return (U ? U : location.href).replace(this.RE, "$2"); },
        getProtocol:     function(U   ) { return (U ? U : location.href).replace(this.RE, "$3"); },
        getHost:         function(U   ) { return (U ? U : location.href).replace(this.RE, "$4"); },
        getPathname:     function(U   ) { return (U ? U : location.href).replace(this.RE, "$5"); },
        getSearch:       function(U   ) { return (U ? U : location.href).replace(this.RE, "$6"); },
        getHash:         function(U   ) { return (U ? U : location.href).replace(this.RE, "$7"); },
        getDirectory:    function(U   ) { return this.getFile(U).replace(/\/[^\/]*$/, ""); },
        getId:           function(U   ) { return this.getHash(U).replace("#", ""); },
        getQueries:      function(U   ) {
            var UnQs = (U ? U : location.href).split("?");
            if(UnQs.length != 2) return {};
            var Queries = {};
            var KnVs = UnQs[1].replace(/#.*$/, "").split("&");
            for(var i = 0, L = KnVs.length; i < L; i++) {
                if(!KnVs[i]) continue;
                var KnV = KnVs[i].split("=");
                if(KnV.length < 2) KnV[1] = null;
                else if(KnV.length > 2) KnV[1] = KnVs[i].replace(KnV[0] + "=", "");
                Queries[KnV[0]] = KnV[1];
            }
            return Queries;
        },
        isIndexFile:     function(U   ) { return (/index\.(x?html?|php|cgi|[ja]spx?)$/.test(this.getPathname(U))); },
        isSameFile:      function(U, L) { return (this.getFile(U)      == (L ? this.getOrigin(L)    : (location.protocol + "//" + location.host + location.pathname))                         ); },
        isSameOrigin:    function(U, L) { return (this.getOrigin(U)    == (L ? this.getOrigin(L)    : (location.protocol + "//" + location.host))                                             ); },
        isSameProtocol:  function(U, L) { return (this.getProtocol(U)  == (L ? this.getProtocol(L)  : (location.protocol))                                                                    ); },
        isSameHost:      function(U, L) { return (this.getHost(U)      == (L ? this.getHost(L)      : (location.host))                                                                        ); },
        isSameHash:      function(U, L) { return (this.getHash(U)      == (L ? this.getHash(L)      : (location.hash))                                                                        ); },
        isSameDirectory: function(U, L) { return (this.getDirectory(U) == (L ? this.getDirectory(L) : (location.protocol + "//" + location.host + location.pathname).replace(/\/[^\/]*$/, ""))); },
        isSameId:        function(U, L) { return (this.getId(U)        == (L ? this.getId(L)        : (location.hash).replace("#", ""))                                                       ); }
    };

    sML.getQueries = sML.Location.getQueries;




    //==============================================================================================================================================
    //----------------------------------------------------------------------------------------------------------------------------------------------

    //-- Cookie

    //----------------------------------------------------------------------------------------------------------------------------------------------

    sML.Cookies = {
        read: function(CookieName) {
            if(typeof CookieName != "string" || !CookieName) return "";
            CookieName = encodeURIComponent(CookieName);
            var CookieParts = document.cookie.split("; "), CookieValue = "";
            for(var i = 0, L = CookieParts.length; i < L; i++) {
                if(CookieParts[i].substr(0, CookieName.length + 1) == (CookieName + "=")) {
                    CookieValue = CookieParts[i].substr(CookieName.length + 1, CookieParts[i].length);
                    break;
                }
            }
            return decodeURIComponent(CookieValue);
        },
        write: function(CookieName, CookieValue, Opt) {
            if(typeof CookieName  != "string" || !CookieName) return false;
            if(typeof CookieValue != "string") return false;
            if(typeof Opt != "object") Opt = {};
            CookieName  = encodeURIComponent(CookieName);
            CookieValue = encodeURIComponent(CookieValue);
            Opt.Path    = (typeof Opt.Path    == "string") ? Opt.Path    : location.pathname.replace(/[^\/]+$/, "");
            Opt.Expires = (typeof Opt.Expires == "number") ? Opt.Expires : 86400000; // a day
            var D = new Date();
            document.cookie = [
                CookieName + "=" + CookieValue,
                "path=" + Opt.Path,
                "expires=" + D.toGMTString(D.setTime(D.getTime() + Opt.Expires))
            ].join("; ");
            return document.cookie;
        }
    };




    //==============================================================================================================================================
    //----------------------------------------------------------------------------------------------------------------------------------------------

    //-- JSON

    //----------------------------------------------------------------------------------------------------------------------------------------------

    sML.JSON = {
        parse:     function(Str) { try { return JSON.parse(Str);     } catch(Err) { return {}; } },
        stringify: function(Obj) { try { return JSON.stringify(Obj); } catch(Err) { return ""; } }
    };




    //==============================================================================================================================================
    //----------------------------------------------------------------------------------------------------------------------------------------------

    //-- Array / Collection

    //----------------------------------------------------------------------------------------------------------------------------------------------

    sML.each = function(Obj, Fun, Sta, End) {
        for(var i = (Sta ? Sta : 0), L = (End ? End + 1 : Obj.length); i < L; i++) if(Fun.call(Obj[i], i, Obj) === false) break;
        return Obj;
    };

    if(!Array.prototype.includes) {
        Array.prototype.includes = function(Item) {
            for(var i = 0, L = this.length; i < L; i++) {
                if(this[i] == Item) return true;
            }
        };
    }




    //==============================================================================================================================================
    //----------------------------------------------------------------------------------------------------------------------------------------------

    //-- Math

    //----------------------------------------------------------------------------------------------------------------------------------------------

    sML.Math = {
        sum: function() {
            var Sum = 0;
            for(var i = 0, L = arguments.length; i < L; i++) {
                var Num = 0;
                if(typeof arguments[i] == "number") Num = arguments[i];
                else if(typeof arguments[i] == "string") Num = arguments[i].length;
                Sum += Num;
            }
            return Sum;
        },
        random: function(Min, Max) {
            if(isNaN(Min) && isNaN(Max)) Min = 0, Max = 1;
            else if(isNaN(Min)              ) Min = 0         ;
            else if(              isNaN(Max))          Max = 0;
            Min = Math.min(Min, Max), Max = Math.max(Min, Max);
            return Math.floor(Math.random() * (Max - Min + 1)) + Min;
        }
    };




    //==============================================================================================================================================
    //----------------------------------------------------------------------------------------------------------------------------------------------

    //-- String / Number

    //----------------------------------------------------------------------------------------------------------------------------------------------

    sML.String = {
        pad: function(Nat, Pad, Dig) {
            Nat = Nat + "";
            if(typeof Nat == "number") Nat = Nat + "";
            if(typeof Pad == "number") Pad = Pad + "";
            if(typeof Nat != "string" || typeof Pad != "string" || typeof Dig != "number" || Dig < 1 || Nat.length >= Dig) return Nat;
            while(Nat.length < Dig) Nat = Pad + Nat;
            return Nat.slice(-Dig);
        },
        insertZeroWidthSpace: function(Str) {
            return Str.replace(/(?=\w)/g, "&#x200B;");
        },
        replace: function(Str, Reps) {
            if(!(Reps instanceof Array)) Reps = [Reps];
            Reps.forEach(function(Rep) {
                if(Rep instanceof Array && Rep.length == 2 && (typeof Rep[0] == "string" || Rep[0] instanceof RegExp) && typeof Rep[1] == "string") Str.replace(Rep[0], Rep[1]);
            });
            return Str;
        }
    };

    sML.getLength = function(Obj) {
        if(typeof Obj == "object") {
            if(Obj instanceof Array) return Obj.length;
            var L = 0;
            for(var i in Obj) L++;
            return L;
        }
        if(typeof Obj == "string") return        Obj.length;
        if(typeof Obj == "number") return ("" + Obj).length;
        return null;
    };




    //==============================================================================================================================================
    //----------------------------------------------------------------------------------------------------------------------------------------------

    //-- Range / Selection

    //----------------------------------------------------------------------------------------------------------------------------------------------

    sML.Range = {
        getRange: function(Sides, OwnerDocument) {
            if(!Sides) return null;
            if(!OwnerDocument) OwnerDocument = Sides.Start.Node.ownerDocument;
            var R = OwnerDocument.createRange();
            R.setStart(Sides.Start.Node, (typeof Sides.Start.Index == "number" ? Sides.Start.Index : Sides.Start.Node.textContent.indexOf(Sides.Start.Text)));
            R.setEnd(    Sides.End.Node, (typeof   Sides.End.Index == "number" ?   Sides.End.Index :   Sides.End.Node.textContent.indexOf(  Sides.End.Text) + Sides.End.Text.length));
            return R;
        },
        flat: function(T) { return T.replace(/[\r\n]/g, ""); },
        escape: function(T) { return this.flat(T).replace(/([\(\)\{\}\[\]\,\.\-\+\*\?\!\:\^\$\/\\])/g, "\\$1"); },
        distill: function(T, F, L) { for(var D = "", i = F; i <= L; i++) D += T[i]; return D; },
        find: function(SearchText, TargetNode) {
        // Initialize
            if(!TargetNode) TargetNode = document.body;
            if(typeof SearchText != "string" || !SearchText || this.flat(TargetNode.textContent).indexOf(SearchText) < 0) return null;
            if(TargetNode.nodeType == 3) return { Start: { Node: TargetNode, Text: SearchText }, End: { Node: TargetNode, Text: SearchText } };
            var TextContents = [], SNI = 0, ENI = TargetNode.childNodes.length - 1, D = "", F = {};
            for(var i = 0; i <= ENI; i++) {
                if(this.flat(TargetNode.childNodes[i].textContent).indexOf(SearchText) >= 0) return this.find(SearchText, TargetNode.childNodes[i]);
                TextContents.push(TargetNode.childNodes[i].textContent);
            }
            // Get StartNode
            D = this.distill(TextContents, SNI + 1, ENI);
            while(D && this.flat(D).indexOf(SearchText) >= 0) SNI++, D = this.distill(TextContents, SNI + 1, ENI);
            var SN = TargetNode.childNodes[SNI];
            // Get StartText
            var SS = 0, SE = SN.textContent.length - 1, ST = "";
            D = this.distill(SN.textContent, SS, SE);
            while(this.flat(D) && !(new RegExp("^" + this.escape(D))).test(SearchText)) SS++, D = this.distill(SN.textContent, SS, SE);
            ST = this.flat(D);
            // Dive StartNode
            while(SN.nodeType != 3) F = this.find(ST, SN), SN = F.Start.Node, ST = F.Start.Text;
            // Get EndNode
            D = this.distill(TextContents, SNI, ENI - 1);
            while(D && this.flat(D).indexOf(SearchText) >= 0) ENI--, D = this.distill(TextContents, SNI, ENI - 1);
            var EN = TargetNode.childNodes[ENI];
            // Get EndText
            var ES = 0, EE = EN.textContent.length - 1, ET = "";
            D = this.distill(EN.textContent, ES, EE);
            while(this.flat(D) && !(new RegExp(this.escape(D) + "$")).test(SearchText)) EE--, D = this.distill(EN.textContent, ES, EE);
            ET = this.flat(D);
            // Dive EndNode
            while(EN.nodeType != 3) F = this.find(ET, EN), EN = F.End.Node, ET = F.End.Text;
            // Return
            return {
                Start: { Node: SN, Text: ST },
                End: { Node: EN, Text: ET }
            };
        }
    };

    sML.Selection = {
        selectRange: function(R) {
            if(!R) return null;
            var S = window.getSelection();
            S.removeAllRanges();
            S.addRange(R);
            return R;
        },
        getSelectedText: ((sML.UA.InternetExplorer < 9) ? function() {
            var S = "" + document.selection.createRange().text;
            return (S ? S : "");
        } : function() {
            var S = "" + window.getSelection();
            return (S ? S : "");
        })
    };
    sML.getSelection = function() { return sML.Selection.getSelectedText(); };

    sML.select = function(Sides, OwnerDocument)   { return sML.Selection.selectRange(sML.Range.getRange(Sides, OwnerDocument)); };
    sML.find   = function(SearchText, TargetNode) { return sML.Selection.selectRange(sML.Range.getRange(sML.Range.find(SearchText, TargetNode))); };




    //==============================================================================================================================================
    //----------------------------------------------------------------------------------------------------------------------------------------------

    //-- Fullscreen

    //----------------------------------------------------------------------------------------------------------------------------------------------

    sML.Fullscreen = {
        Enabled: (function(Doc) {
            return (
                Doc.fullscreenEnabled || // Standard
            Doc.webkitFullscreenEnabled ||
            Doc.mozFullScreenEnabled ||
            Doc.msFullscreenEnabled
            );
        })(document),
        request: (function(Ele) {
            var getFunction = function(M) { return function(O) { if(!O) O = Ele; return O[M](); }; };
            if(Ele.requestFullscreen)                             return getFunction("requestFullscreen"); // Standard
            if(Ele.webkitRequestFullscreen)                       return getFunction("webkitRequestFullscreen");
            if(Ele.mozRequestFullScreen)                          return getFunction("mozRequestFullScreen");
            if(Ele.msRequestFullscreen)                           return getFunction("msRequestFullscreen");
            return function() { return false; };
        })(document.documentElement),
        exit: (function(Doc) {
            var getFunction = function(M) { return function(O) { if(!O) O = Doc; return O[M](); }; };
            if(Doc.exitFullscreen)                                return getFunction("exitFullscreen"); // Standard
            if(Doc.webkitExitFullscreen)                          return getFunction("webkitExitFullscreen");
            if(Doc.mozCancelFullScreen)                           return getFunction("mozCancelFullScreen");
            if(Doc.msExitFullscreen)                              return getFunction("msExitFullscreen");
            return function() { return false; };
        })(document),
        getElement: (function(Doc) {
            var getFunction = function(M) { return function(O) { if(!O) O = Doc; return O[M]; }; };
            if(typeof Doc.fullscreenElement       != "undefined") return getFunction("fullscreenElement"); // Starndard
            if(typeof Doc.webkitFullscreenElement != "undefined") return getFunction("webkitFullscreenElement");
            if(typeof Doc.mozFullscreenElement    != "undefined") return getFunction("mozFullscreenElement");
            if(typeof Doc.msFullscreenElement     != "undefined") return getFunction("msFullscreenElement");
            return function() { return null; };
        })(document)
    };

    sML.requestFullscreen = sML.Fullscreen.request;
    sML.exitFullscreen = sML.Fullscreen.exit;
    sML.getFullscreenElement = sML.Fullscreen.getElement;




    //==============================================================================================================================================
    //----------------------------------------------------------------------------------------------------------------------------------------------

    //-- SML

    //----------------------------------------------------------------------------------------------------------------------------------------------

    sML.SML = {
        each:           function(F)        { sML.each(this, F); return this; },
        set:            function(P, S)     { return this.each(function() { var O = this; sML.set(O, P, S); }); },
        style:          function(S)        { return this.each(function() { var O = this; sML.style(O, S); }); },
        appendChild:    function(Es)       { return this.each(function() { var O = this; sML.each(Es, function() { O.appendChild(this); }); }); },
        preppendChild:  function(E)        { return this.each(function() { var O = this; sML.each(Es, function() { O.insertBefore(this, S.firstChild); }); }); },
        insertBefore:   function(E, S)     { return this.each(function() { var O = this; sML.each(Es, function() { O.insertBefore(this, S); }); }); },
        insertAfter:    function(E, S)     { return this.each(function() { var O = this; sML.each(Es, function() { O.insertBefore(this, S.nextSibling); }); }); },
        addClass:       function(CN)       { return this.each(function() { var O = this; sML.addClass(O, CN); }); },
        removeClass:    function(CN)       { return this.each(function() { var O = this; sML.removeClass(O, CN); }); },
        replaceClass:   function(RCN, ACN) { return this.each(function() { var O = this; sML.replaceClass(O, RCN, ACN); }); }
    };




    //==============================================================================================================================================
    //----------------------------------------------------------------------------------------------------------------------------------------------

    //-- Readied ?

    //----------------------------------------------------------------------------------------------------------------------------------------------

    window.addEventListener("unload", function() { window.sML = null; delete window.sML; });

    return sML;

})();

export default sML;