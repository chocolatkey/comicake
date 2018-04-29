import O from "./O";
import sML from "../vendor/sML";
import E from "./E";
import P from "./P";
import U from "./U";
import B from "./B";

//==============================================================================================================================================
//----------------------------------------------------------------------------------------------------------------------------------------------

//-- Settings

//----------------------------------------------------------------------------------------------------------------------------------------------


var S = {}; // Bibi.Settings


let initialize = function() {
    for(var Property in S) if(typeof S[Property] != "function") delete S[Property];
    O.applyTo(S, P.habitat);
    O.applyTo(S, U.habitat);
    delete S["book"];
    delete S["bookshelf"];
    O.SettingTypes.YesNo.forEach(function(Property) {
        S[Property] = decideYesNo(Property);
    });
    S["autostart"] = (!S["wait"] && (!O.WindowEmbedded || S["autostart"]));
    S["start-in-new-window"] = (S["start-in-new-window"] && O.WindowEmbedded);
};


let decideYesNo = function(Property) {
    return (S[Property] === true || S[Property] == "yes" || (S[Property] == "mobile" && O.Mobile) || (S[Property] == "desktop" && !O.Mobile));
};


let update = function(Settings) {

    var PrevBRL = S.BRL, PrevRVM = S.RVM, PrevPPD = S.PPD, PrevSLA = S.SLA, PrevSLD = S.SLD, PrevARD = S.ARD;

    if(typeof Settings == "object") for(var Property in Settings) if(typeof S[Property] != "function") S[Property] = Settings[Property];

    S.BRL = S["book-rendition-layout"] = B.Package.Metadata["rendition:layout"];
    S.BWM = S["book-writing-mode"] = (/^tb/.test(B.WritingMode) && !O.VerticalTextEnabled) ? "lr-tb" : B.WritingMode;

    // Font Family
    if(S.FontFamilyStyleIndex) sML.deleteStyleRule(S.FontFamilyStyleIndex);
    if(S["ui-font-family"]) S.FontFamilyStyleIndex = sML.appendStyleRule("html", "font-family: " + S["ui-font-family"] + " !important;");

    // Layout Settings
    S.RVM = S["reader-view-mode"];
    if(S.BRL == "reflowable") {
        if(S.BWM == "tb-rl") {
            S.PPD = S["page-progression-direction"] = "rtl";
            S.SLA = S["spread-layout-axis"] = (S.RVM == "paged") ? "vertical"   : S.RVM;
        } else if(S.BWM == "tb-lr") {
            S.PPD = S["page-progression-direction"] = "ltr";
            S.SLA = S["spread-layout-axis"] = (S.RVM == "paged") ? "vertical"   : S.RVM;
        } else if(S.BWM == "rl-tb") {
            S.PPD = S["page-progression-direction"] = "rtl";
            S.SLA = S["spread-layout-axis"] = (S.RVM == "paged") ? "horizontal" : S.RVM;
        } else {
            S.PPD = S["page-progression-direction"] = "ltr";
            S.SLA = S["spread-layout-axis"] = (S.RVM == "paged") ? "horizontal" : S.RVM;
        }
    } else {
        S.PPD = S["page-progression-direction"] = (B.PPD == "rtl") ? "rtl" : "ltr";
        S.SLA = S["spread-layout-axis"] = (S.RVM == "paged") ? "horizontal" : S.RVM;
    }
    S.SLD = S["spread-layout-direction"] = (S.SLA == "vertical") ? "ttb" : S.PPD;
    S.ARD = S["apparent-reading-direction"] = (S.RVM == "vertical") ? "ttb" : S.PPD;

    // Dictionary
    if(S.SLA == "horizontal") {
        /**/S.SIZE = { b: "height", B: "Height", l: "width",  L: "Width",  w: "length",  W: "Length",  h: "breadth", H: "Breadth" };
        if(S.PPD == "ltr") {
            S.AXIS = { B: "Y",      L: "X",      PM: +1 };
            S.BASE = { b: "left",   B: "Left",   a: "right",  A: "Right",  s: "top",     S: "Top",     e: "bottom",  E: "Bottom", c: "middle", m: "center" };
        } else {
            S.AXIS = { B: "Y",      L: "X",      PM: -1 };
            S.BASE = { b: "right",  B: "Right",  a: "left",   A: "Left",   s: "top",     S: "Top",     e: "bottom",  E: "Bottom", c: "middle", m: "center" };
        }
    } else {
        /**/S.SIZE = { b: "width",  B: "Width",  l: "height", L: "Height", w: "breadth", W: "Breadth", h: "length",  H: "Length" };
        /**/S.AXIS = { B: "X",      L: "Y",      PM: +1 };
        if(S.PPD == "ltr") {
            S.BASE = { b: "top",    B: "Top",    a: "bottom", A: "Bottom", s: "left",    S: "Left",    e: "right",   E: "Right",  c: "center", m: "middle" };
        } else {
            S.BASE = { b: "top",    B: "Top",    a: "bottom", A: "Bottom", s: "right",   S: "Right",   e: "left",    E: "Left",   c: "center", m: "middle" };
        }
    }

    // Root Class
    if(PrevBRL != S.BRL) { sML.replaceClass(O.HTML, "book-"       + PrevBRL, "book-"       + S.BRL); }
    if(PrevRVM != S.RVM) { sML.replaceClass(O.HTML, "view-"       + PrevRVM, "view-"       + S.RVM); }
    if(PrevPPD != S.PPD) { sML.replaceClass(O.HTML, "page-"       + PrevPPD, "page-"       + S.PPD); }
    if(PrevSLA != S.SLA) { sML.replaceClass(O.HTML, "spread-"     + PrevSLA, "spread-"     + S.SLA); }
    if(PrevSLD != S.SLD) { sML.replaceClass(O.HTML, "spread-"     + PrevSLD, "spread-"     + S.SLD); }
    if(PrevARD != S.ARD) { sML.replaceClass(O.HTML, "appearance-" + PrevARD, "appearance-" + S.ARD); }

    E.dispatch("bibi:updated-settings", S);

};

export default {
    S,
    initialize,
    decideYesNo,
    update
};