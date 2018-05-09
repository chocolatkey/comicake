import E from "../E";
import O from "../O";
import sML from "../../vendor/sML";
import buttonGroup from "./buttonGroup";
import I from "../I";

export default class subPanel {
    constructor(Par) {
        if(!Par) Par = {};
        if(typeof Par.className != "string" || !Par.className) delete Par.className;
        if(typeof Par.id        != "string" || !Par.id)        delete Par.id;
        Par.className = "bibi-subpanel" + (Par.className ? " " + Par.className : "");
        Par.Sections = [];
    
        var SubPanel = O.Body.appendChild(sML.create("div", Par));
        SubPanel.addEventListener(O["pointerdown"], (Eve) => { Eve.stopPropagation(); });
        SubPanel.addEventListener(O["pointerup"],   (Eve) => { Eve.stopPropagation(); });
    
        I.setToggleAction(SubPanel, {
            onopened: (Opt) => {
                I.SubPanels.forEach((SP) => {
                    if(SP == SubPanel) return;
                    SP.close({ ForAnotherSubPanel: true });
                });
                sML.addClass(SubPanel, "opened");
                sML.addClass(O.HTML, "subpanel-opened");
                I.Shade.open();
                if(SubPanel.Opener) {
                    SubPanel.Bit.adjust(SubPanel.Opener);
                    I.setUIState(SubPanel.Opener, "active");
                }
                if(Par.onopened) Par.onopened.apply(SubPanel, arguments);
            },
            onclosed: (Opt) => {
                console.log("subclosed");
                console.dir(SubPanel);
                sML.removeClass(SubPanel, "opened");
                if(!Opt || !Opt.ForAnotherSubPanel) {
                    sML.removeClass(O.HTML, "subpanel-opened");
                    I.Shade.close();
                }
                if(SubPanel.Opener) {
                    I.setUIState(SubPanel.Opener, "default");
                }
                if(Par.onclosed) Par.onclosed.apply(SubPanel, arguments);
            }
        });
        if(SubPanel.Opener) SubPanel.Opener.addTapEventListener("tapped", () => { SubPanel.toggle(); });
        E.add("bibi:opened-panel",  () => { SubPanel.close(); });
        E.add("bibi:closed-panel", () => { SubPanel.close(); });
    
        SubPanel.Bit = SubPanel.appendChild(sML.create("span", { className: "bibi-subpanel-bit",
            SubPanel: SubPanel,
            adjust: (Ele) => {
                if(!Ele) return;
                var Center = O.getElementCoord(Ele).X + Ele.offsetWidth / 2 - O.getElementCoord(this.SubPanel).X;
                sML.style(this.SubPanel, { transformOrigin: Center + "px 0" });
                sML.style(this.SubPanel.Bit, { left: Center + "px" });
            }
        }));
        I.SubPanels.push(SubPanel);
        SubPanel.class = this;
        SubPanel.addSection = this.addSection;
        SubPanel.addButtonGroup = this.addButtonGroup;
        this.SubPanel = SubPanel;

        return SubPanel;
    }
    
    
    addSection(Par) { // classifies of Subpanel / classify SubPanelSection
        if(!Par) Par = {};
        Par.className = "bibi-subpanel-section";
        var SubPanelSection = sML.create("div", Par);
        // HGroup
        if(SubPanelSection.Labels) {
            SubPanelSection.Labels = I.distillLabels(SubPanelSection.Labels);
            SubPanelSection.appendChild(
                sML.create("div",  { className: "bibi-hgroup" })
            ).appendChild(
                sML.create("p",    { className: "bibi-h" })
            ).appendChild(
                sML.create("span", { className: "bibi-h-label", innerHTML: SubPanelSection.Labels["default"][O.Language] })
            );
        }
        // PGroup: Setting
        if(SubPanelSection.Notes) {
            SubPanelSection.Notes.forEach((Note) => {
                if(!Note.Position || Note.Position == "before") {
                    if(!SubPanelSection.PGroup_Before) SubPanelSection.PGroup_Before = sML.create("div", { className: "bibi-pgroup bibi-pgroup_before" });
                    var PGroup = SubPanelSection.PGroup_Before;
                } else if(Note.Position == "after") {
                    if(!SubPanelSection.PGroup_After)  SubPanelSection.PGroup_After  = sML.create("div", { className: "bibi-pgroup bibi-pgroup_after"  });
                    var PGroup = SubPanelSection.PGroup_After;
                }
                Note = I.distillLabels(Note);
                PGroup.appendChild(sML.create("p", { className: "bibi-p", innerHTML: Note["default"][O.Language] }));
            });
        }
        // PGroup: Before
        if(SubPanelSection.PGroup_Before) SubPanelSection.appendChild(SubPanelSection.PGroup_Before);
        // ButtonGroup
        SubPanelSection.addButtonGroup = this.addButtonGroup;
        if(SubPanelSection.ButtonGroup) SubPanelSection.addButtonGroup(SubPanelSection.ButtonGroup);
        this.appendChild(SubPanelSection);
        this.Sections.push(SubPanelSection);
        
        // PGroup: After
        if(SubPanelSection.PGroup_After)  SubPanelSection.appendChild(SubPanelSection.PGroup_After);
        return SubPanelSection;
    }
    
    addButtonGroup(Par) {
        if(!Par) return;
        Par.Area = this;
        this.ButtonGroup = new buttonGroup(Par);
        return this.ButtonGroup;
    }
}