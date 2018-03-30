define(['vendor/material'], function (mdc) {
    if (!mdc.ripple.util.supportsCssVariables(window)) {
        document.documentElement.classList.add('unsupported');
    }
    return {
        onLoadMDC: function() {
            [].forEach.call(document.querySelectorAll('.ripple'), function(surface) {
                mdc.ripple.MDCRipple.attachTo(surface);
            });
        
            [].forEach.call(document.querySelectorAll('.mdc-text-field'), function(surface) {
                mdc.textField.MDCTextField.attachTo(surface);
            });

            var drawer = new mdc.drawer.MDCTemporaryDrawer(document.querySelector('.mdc-drawer'));
            document.querySelector('.menu-toggle').addEventListener('click', function() {
                drawer.open = true;
            });
            //window.toolbarTabBar = new mdc.tabs.MDCTabBar(document.querySelector('#toolbar-tab-bar'));
        }
    }
});