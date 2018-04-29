import O from "./O";
import E from "./E";
import sML from "../vendor/sML";
import P from "./P";

//==============================================================================================================================================
//----------------------------------------------------------------------------------------------------------------------------------------------

//-- Extensions - Special Thanks: @shunito

//----------------------------------------------------------------------------------------------------------------------------------------------


let X = {}; // Bibi.Extensions


X.initialize = function() {
    X.Files = {};
    X.Presets = {};
    X.Loaded = [];
    X.Added = [];
};


X.loadFilesInPreset = function() {
    return new Promise(function(resolve, reject) {
        O.log("Loading Extension File" + (P.X.length > 1 ? "s" : "") + "...", "*:");
        var loadFile = function(FileInfo) {
            if(X.Files[FileInfo["name"]]) {
                O.log("\"name\" of Extension File \"" + FileInfo["name"] + "\" is already taken.", "-*");
                loadFile(P.X[FileInfo.FileIndexInPreset + 1]);
                return false;
            }
            X.Files[FileInfo["name"]] = FileInfo;
            X.Presets[FileInfo["name"]] = P.X[FileInfo["name"]] = {};
            for(var Option in FileInfo) P.X[FileInfo["name"]][Option] = FileInfo[Option];
            document.head.appendChild(
                sML.create("script", { className: "bibi-extension-script", id: "bibi-extension-script_" + FileInfo["name"], name: FileInfo["name"], src: FileInfo["src"],// async: "async",
                    onload: function() {
                        X.Loaded.push(FileInfo);
                        if(FileInfo.FileIndexInPreset + 1 == P.X.length) {
                            /*
                            if(X.Loaded.length) {
                                var LoadedExtensionFiles = "";
                                X.Loaded.forEach(function(LoadedExtension) { LoadedExtensionFiles += ", " + LoadedExtension["name"]; });
                                LoadedExtensionFiles = LoadedExtensionFiles.replace(/^, /, "");
                                O.log('Extension File' + (X.Loaded.length > 1 ? 's' : '') + ': ' + LoadedExtensionFiles, "-*");
                            }
                            */
                            if(X.Added.length) {
                                var AddedExtensions = "";
                                X.Added.forEach(function(AddedExtension) { AddedExtensions += ", " + AddedExtension["name"]; });
                                AddedExtensions = AddedExtensions.replace(/^, /, "");
                                O.log("Extension" + (X.Added.length > 1 ? "s" : "") + ": " + AddedExtensions, "-*");
                            }
                            O.log("Extension File" + (X.Loaded.length > 1 ? "s" : "") + " Loaded.", "/*");
                            return resolve();
                        }
                        loadFile(P.X[FileInfo.FileIndexInPreset + 1]);
                    }
                })
            );
        };
        loadFile(P.X[0]);
    });
};

X.add = function(Extension) {
    if(!Extension || typeof Extension != "object") {
        return function() { return false; };
    }
    if(typeof Extension["name"] != "string" || !Extension["name"]) {
        O.log("Extension name is invalid.", "-*");
        return function() { return false; };
    }
    if(X[Extension["name"]]) {
        O.log("Extension name \"" + Extension["name"] + "\" is reserved or already taken.", "-*");
        return function() { return false; };
    }
    if(typeof Extension["description"] != "string") Extension["decription"] = undefined;
    if(typeof Extension["author"]      != "string") Extension["author"]     = undefined;
    if(typeof Extension["version"]     != "string") Extension["version"]    = undefined;
    if(typeof Extension["build"]       != "number") Extension["build"]      = undefined;
    if(!(X.Extensions instanceof Array)) X.Extensions = [];
    X.Extensions.push(Extension);
    X[Extension["name"]] = Extension;
    X[Extension["name"]].Options = {};
    X.Added.push(Extension);
    return function(onReadied) {
        if(typeof onReadied == "function") E.bind("bibi:readied", function() { return onReadied.call(Extension); });
        return function(onPrepared) {
            if(typeof onPrepared == "function") E.bind("bibi:prepared", function() { return onPrepared.call(Extension); });
            return function(onOpened) {
                if(typeof onOpened == "function") E.bind("bibi:opened", function() { return onOpened.call(Extension); });
            };
        };
    };
};

export default X;