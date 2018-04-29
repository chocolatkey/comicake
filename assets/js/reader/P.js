import O from "./O";
import Preset from "./Preset";

//==============================================================================================================================================
//----------------------------------------------------------------------------------------------------------------------------------------------

//-- Presets

//----------------------------------------------------------------------------------------------------------------------------------------------

class P { // Bibi.Preset
    constructor() {
        this.habitat = {};
    }

    initialize() {
        O.applyTo(this.habitat, Preset);
        O.SettingTypes.Boolean.forEach((Property) => {
            if(this.habitat[Property] !== true) this.habitat[Property] = false;
        });
        O.SettingTypes.YesNo.forEach((Property) => {
            if(typeof this.habitat[Property] == "string") this.habitat[Property] = /^(yes|no|mobile|desktop)$/.test(this.habitat[Property]) ? this.habitat[Property] : "no";
            else                               this.habitat[Property] = this.habitat[Property] ? "yes" : "no";
        });
        O.SettingTypes.Integer.forEach((Property) => {
            this.habitat[Property] = (typeof this.habitat[Property] != "number" || this.habitat[Property] < 0) ? 0 : Math.round(this.habitat[Property]);
        });
        O.SettingTypes.Number.forEach((Property) => {
            if(typeof this.habitat[Property] != "number") this.habitat[Property] = 0;
        });
        if(!/^(horizontal|vertical|paged)$/.test(this.habitat["reader-view-mode"])) this.habitat["reader-view-mode"] = "paged";
        if(!/^([\w\d]+:)?\/\//.test(this.habitat["bookshelf"])) {
            if(/^\//.test(this.habitat["bookshelf"])) this.habitat["bookshelf"] = O.Origin + this.habitat["bookshelf"];
            else                           this.habitat["bookshelf"] = O.getPath(location.href.split("?")[0].replace(/[^\/]*$/, "") + this.habitat["bookshelf"]);
            this.habitat["bookshelf"] = this.habitat["bookshelf"].replace(/\/$/, "");
        }
        if(!(this.habitat["trustworthy-origins"] instanceof Array)) this.habitat["trustworthy-origins"] = [];
        if(!this.habitat["trustworthy-origins"].includes(O.Origin)) this.habitat["trustworthy-origins"].unshift(O.Origin);
        var ExtensionsToBeLoaded = [];
        this.habitat["extensions"].forEach((FileInfo) => {
            if(
                typeof FileInfo["name"] != "string" || !FileInfo["name"] || FileInfo["name"] == "Bibi" ||
                typeof FileInfo["src"]  != "string" || !FileInfo["src"]
            ) return;
            FileInfo.FileIndexInPreset = ExtensionsToBeLoaded.length;
            ExtensionsToBeLoaded.push(FileInfo);
        });
        this.X = this.habitat["extensions"] = ExtensionsToBeLoaded;
    }
}

export default (new P);