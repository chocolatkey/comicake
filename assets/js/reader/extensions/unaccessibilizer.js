/*!
 *                                                                                                                          (℠)
 * # BiB/i Extension: Unaccessibilizer
 *
 * - "What a..."
 * - Reluctantly coded by Satoru MATSUSHIMA. - http://bibi.epub.link or https://github.com/satorumurmur/bibi
 * - Public Domain. - http://unlicense.org/UNLICENSE
 *
 * - No rippers or script kiddies were harmed in the making of this code - chocolatkey
 */
//TODO
import X from "../X";

let unaccessibilize = function(Item) {
    // select-elements
    if(X.Presets.Unaccessibilizer["select-elements"]) {
        ["-webkit-", "-moz-", "-ms-", ""].forEach(function(Prefix) {
            ["user-select", "user-drag"].forEach(function(Property) {
                Item.Body.style[Prefix + Property] = "none";
            });
        });
    }
    // save-images
    if(X.Presets.Unaccessibilizer["save-images"]) {
        Array.prototype.forEach.call(Item.Body.querySelectorAll("img, svg, image"), function(Img) {
            ["-webkit-", "-moz-", "-ms-", ""].forEach(function(Prefix) {
                ["user-select", "user-drag"].forEach(function(Property) {
                    Img.style[Prefix + Property] = "none";
                });
                if(O.Mobile) Img.style[Prefix + "pointer-events"] = "none";
            });
            Img.draggable = false;
            Img.addEventListener("contextmenu", O.preventDefault);
        });
    }
    // use-contextmenu
    if(X.Presets.Unaccessibilizer["use-contextmenu"]) {
        Item.contentDocument.addEventListener("contextmenu", O.preventDefault);
    }
};

E.bind("bibi:postprocessed-item-content", function(Item) {
    unaccessibilize(Item);
});

unaccessibilize(O);

exports default {

}