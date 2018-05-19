import { MDCRipple } from "@material/ripple";
//import { MDCTabBar } from "@material/tabs";
import { MDCTemporaryDrawer } from "@material/drawer/temporary";
export function onLoadMDC() {
    Array.prototype.slice.call(document.querySelectorAll(".ripple")).forEach(surface => {
        MDCRipple.attachTo(surface);
    });

    let drawerItem = document.querySelector(".mdc-drawer");
    if(drawerItem) {
        var drawer = new MDCTemporaryDrawer(drawerItem);
        let menuToggleItem = document.querySelector(".menu-toggle");
        if(menuToggleItem)
            menuToggleItem.addEventListener("click", function() {
                drawer.open = true;
            });
    }
    // let toolbarTabBar = new MDCTabBar(document.querySelector('.toolbar-tab-bar')); TODO later
}