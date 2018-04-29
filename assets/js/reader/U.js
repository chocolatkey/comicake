import O from "./O";
import E from "./E";
import settings from "./S";
import X from "./S";
import R from "./R";
import P from "./P";

//==============================================================================================================================================
//----------------------------------------------------------------------------------------------------------------------------------------------

//-- URI-Defined Settings (FileName, Queries, Hash, and EPUBCFI)

//----------------------------------------------------------------------------------------------------------------------------------------------

class U { // Bibi.SettingsInURI
    constructor() {
        this.habitat = {};
    }

    initialize() { // formerly O.readExtras

        var Q = this.parseQuery(location.search);
        var H = this.parseHash(location.hash);
    
        this.habitat["book"] = (() => {
            var Book = Q["book"] ? Q["book"] : O.Body.getAttribute("data-bibi-book");
            if(typeof Book != "string") return undefined;
            Book = decodeURIComponent(Book).replace(/\/+$/, "");
            if(/^([\w\d]+:)?\/\//.test(Book)) { // absolute URI
                if(/^\/\//.test(Book)) Book = location.protocol + Book;
            }
            return Book;
        })();
    
        var applyToU = (DataString) => {
            if(typeof DataString != "string") return {};
            DataString.replace(" ", "").split(",").forEach((PnV) => {
                PnV = PnV.split(":"); if(!PnV[0]) return;
                if(!PnV[1]) {
                    switch(PnV[0]) {
                    case "horizontal":
                    case "vertical":
                    case "paged":
                        PnV[1] = PnV[0], PnV[0] = "reader-view-mode";
                        break;
                    default:
                        if(O.SettingTypes.YesNo.includes(PnV[0])) PnV[1] = "yes";
                        else PnV[0] = undefined;
                    }
                } else {
                    switch(PnV[0]) {
                    case "parent-title":
                    case "parent-uri":
                    case "parent-origin":
                    case "parent-pipi-path":
                    case "parent-bibi-label":
                    case "parent-holder-id":
                        PnV[1] = this.decode(PnV[1]);
                        break;
                    case "reader-view-mode":
                        if(!/^(horizontal|vertical|paged)$/.test(PnV[1])) PnV[1] = undefined;
                        break;
                    case "to":
                        PnV[1] = R.getBibiToDestination(PnV[1]);
                        break;
                    case "nav":
                        PnV[1] = /^[1-9]\d*$/.test(PnV[1]) ? PnV[1] * 1 : undefined;
                        break;
                    case "preset":
                        break;
                    default:
                        if(O.SettingTypes.YesNo.includes(PnV[0])) {
                            if(PnV[1] == "true" ) PnV[1] = "yes";
                            else if(PnV[1] == "false") PnV[1] = "no";
                            else if(!/^(yes|no|mobile|desktop)$/.test(PnV[1])) PnV[1] = undefined;
                        }
                        else PnV[0] = undefined;
                    }
                }
                if(PnV[0] && (PnV[1] || typeof PnV[1] == "string" || typeof PnV[1] == "number")) this.habitat[PnV[0]] = PnV[1];
            });
        };
    
        if(H["bibi"]) {
            applyToU(H["bibi"]);
        }
    
        if(H["pipi"]) {
            applyToU(H["pipi"]);
            if(this.habitat["parent-origin"] && this.habitat["parent-origin"] != O.Origin) P.habitat["trustworthy-origins"].push(this.habitat["parent-origin"]);
            if(history.replaceState) history.replaceState(null, null, location.href.replace(/[\,#]pipi\([^\)]*\)$/g, ""));
        }
    
        if(H["epubcfi"]) {
            this.habitat["epubcfi"] = H["epubcfi"];
            E.add("bibi:readied", () => {
                if(X["EPUBCFI"]) settings.S["to"] = this.habitat["to"] = X["EPUBCFI"].getDestination(H["epubcfi"]);
            });
        }
    
    }
    
    
    decode(Str) {
        return decodeURIComponent(Str.replace("_BibiKakkoClose_", ")").replace("_BibiKakkoOpen_", "("));
    }
    
    
    parseQuery(Q) {
        if(typeof Q != "string") return {};
        Q = Q.replace(/^\?/, "");
        var Params = {};
        Q.split("&").forEach((PnV) => {
            PnV = PnV.split("=");
            if(/^[a-z]+$/.test(PnV[0])) Params[PnV[0]] = PnV[1];
        });
        return Params;
    }
    
    
    parseHash(H) {
        if(typeof H != "string") return {};
        H = H.replace(/^#/, "");
        var Params = {}, CurrentPosition = 0;
        var parseFragment = () => {
            var Foothold = CurrentPosition, Label = "";
            while(/[a-z_]/.test(H.charAt(CurrentPosition))) CurrentPosition++;
            if(H.charAt(CurrentPosition) == "(") Label = H.substr(Foothold, CurrentPosition - 1 - Foothold + 1), CurrentPosition++; else return {};
            while(H.charAt(CurrentPosition) != ")") CurrentPosition++;
            if(Label) Params[Label] = H.substr(Foothold, CurrentPosition - Foothold + 1).replace(/^[a-z_]+\(/, "").replace(/\)$/, "");
            CurrentPosition++;
        };
        parseFragment();
        while(H.charAt(CurrentPosition) == ",") {
            CurrentPosition++;
            parseFragment();
        }
        return Params;
    }
}

export default (new U);