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

import O from "../O";

let unaccessibilize = function(Item) {
    // select-elements
    ["-webkit-", "-moz-", "-ms-", ""].forEach(function(Prefix) {
        ["user-select", "user-drag"].forEach(function(Property) {
            Item.style[Prefix + Property] = "none";
        });
    });
    // save-images
    Array.prototype.forEach.call(Item.querySelectorAll("img, svg, image"), function(Img) {
        ["-webkit-", "-moz-", "-ms-", ""].forEach(function(Prefix) {
            ["user-select", "user-drag"].forEach(function(Property) {
                Img.style[Prefix + Property] = "none";
            });
            if(O.Mobile) Img.style[Prefix + "pointer-events"] = "none";
        });
        Img.draggable = false;
        Img.addEventListener("contextmenu", O.preventDefault);
    });
    // use-contextmenu
    Item.addEventListener("contextmenu", O.preventDefault);
};

//unaccessibilize(O);

export default unaccessibilize;