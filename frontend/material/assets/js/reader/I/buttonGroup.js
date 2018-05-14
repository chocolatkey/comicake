import I from "../I";
import sML from "../../vendor/sML";

export default class buttonGroup {
    constructor(Par) {
        if(!Par || typeof Par != "object" || !Par.Area || !Par.Area.tagName) return null;
        if(typeof Par.className != "string" || !Par.className) delete Par.className;
        if(typeof Par.id        != "string" || !Par.id)        delete Par.id;
        var ClassName = ["bibi-buttongroup"];
        if (Par.className) ClassName.push(Par.className);
        if(Par.Tiled) ClassName.push("bibi-buttongroup-tiled");
        if(Par.Sticky) ClassName.push("sticky");
        Par.className = ClassName.join(" ");
        Par.IsButtonGroup = true;
        var ButtonGroup = Par.Area.appendChild(sML.create("ul", Par));
        ButtonGroup.class = this;
        ButtonGroup.addButton = this.addButton;
        if(ButtonGroup.Buttons instanceof Array) {
            ButtonGroup.Buttons.forEach((Button, i) => {
                ButtonGroup.addButton(Button, i);
            });
        }
        this.ButtonGroup = ButtonGroup;
        return ButtonGroup;
    }

    addButton(Par, i) { // classifies Button
        // i: optional
        if(!Par || typeof Par != "object") return null;
        if(!Par.ButtonGroup) Par.ButtonGroup = this;
        if(!Par.ButtonGroup.IsButtonGroup) return null;
        if(typeof Par.className != "string" || !Par.className) delete Par.className;
        if(typeof Par.id        != "string" || !Par.id)        delete Par.id;
        Par.Type = (typeof Par.Type == "string" && /^(normal|toggle|radio|link)$/.test(Par.Type)) ? Par.Type : "normal";
        Par.className = "bibi-button bibi-button-" + Par.Type + (Par.className ? " " + Par.className : "");
        if(typeof Par.Icon != "undefined" && !Par.Icon.tagName) {
            if(typeof Par.Icon == "string" && Par.Icon) {
                Par.Icon = sML.hatch(Par.Icon);
            } else {
                delete Par.Icon;
            }
        }
        Par.IsBibiButton = true;
        var Button = Par.ButtonGroup.appendChild(
            sML.create("li", { className: "bibi-buttonbox bibi-buttonbox-" + Par.Type })
        ).appendChild(
            sML.create((typeof Par.href == "string" ? "a" : "span"), Par)
        );
        if(Button.Icon) {
            Button.IconBox = Button.appendChild(sML.create("span", { className: "bibi-button-iconbox" }));
            Button.IconBox.appendChild(Button.Icon);
            Button.Icon = Button.IconBox.firstChild;
            Button.IconBox.Button = Button.Icon.Button = Button;
        }
        Button.Label = Button.appendChild(sML.create("span", { className: "bibi-button-label" }));
        I.setFeedback(Button, {
            Help: Par.Help,
            StopPropagation: true,
            PreventDefault: (Button.href ? false : true)
        });
        Button.ButtonGroup.Busy = false;
        Button.Busy = false;
        Button.isAvailable = () => {
            return (!Button.Busy && !Button.ButtonGroup.Busy);
        };
        if(typeof Button.execute == "function") Button.action = Button.execute; // for back compatibility
        if(typeof Button.action == "function") {
            Button.addTapEventListener("tapped", (Eve) => {
                if(!Button.isAvailable()) return false;
                Button.action.apply(Button, arguments);
            });
        }
        if(!(Button.ButtonGroup.Buttons instanceof Array)) Button.ButtonGroup.Buttons = [];
        if(typeof i == "number") Button.ButtonGroup.Buttons[i] = Button;
        else                     Button.ButtonGroup.Buttons.push(Button);
        return Button;
    }
}