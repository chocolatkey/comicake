import { MDCRipple } from "@material/ripple";
import { MDCTemporaryDrawer } from "@material/drawer/temporary";
export function onLoadMDC() {
    Array.prototype.slice.call(document.querySelectorAll(".ripple")).forEach(surface => {
        MDCRipple.attachTo(surface);
    });

    var drawerItem = document.querySelector(".mdc-drawer");
    if(drawerItem)
        var drawer = new MDCTemporaryDrawer(document.querySelector(".mdc-drawer"));
    var menuToggleItem = document.querySelector(".menu-toggle");
    if(menuToggleItem)
        menuToggleItem.addEventListener("click", function() {
            drawer.open = true;
        });
    //window.toolbarTabBar = new mdc.tabs.MDCTabBar(document.querySelector('#toolbar-tab-bar'));
}