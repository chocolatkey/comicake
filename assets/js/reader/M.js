import E from "./E";
import O from "./O";
import settings from "./S";

//==============================================================================================================================================
//----------------------------------------------------------------------------------------------------------------------------------------------

//-- Messages - Special Thanks: @KitaitiMakoto

//----------------------------------------------------------------------------------------------------------------------------------------------


export default class M { // Bibi.Messages
    post(Msg, TargetOrigin) {
        if(!O.WindowEmbedded) return false;
        if(typeof Msg != "string" || !Msg) return false;
        if(typeof TargetOrigin != "string" || !TargetOrigin) TargetOrigin = "*";
        return window.parent.postMessage(Msg, TargetOrigin);
    }
    
    
    receive(Data) {
        try {
            Data = JSON.parse(Data);
            if(typeof Data != "object" || !Data) return false;
            for(var EventName in Data) if(/^bibi:commands:/.test(EventName)) E.dispatch(EventName, Data[EventName]);
            return true;
        } catch(Err) {}
        return false;
    }
    
    
    gate(Eve) {
        if(!Eve || !Eve.data) return;
        for(var l = settings.S["trustworthy-origins"].length, i = 0; i < l; i++) if(settings.S["trustworthy-origins"][i] == Eve.origin) return M.receive(Eve.data);
    }
}