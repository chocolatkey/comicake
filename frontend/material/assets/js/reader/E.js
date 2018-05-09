//==============================================================================================================================================
//----------------------------------------------------------------------------------------------------------------------------------------------

//-- Events - Special Thanks: @KitaitiMakoto & @shunito

//----------------------------------------------------------------------------------------------------------------------------------------------

class E { // Bibi.Events
    add(Name, Listener, Ele) {
        if(typeof Name != "string" || !/^bibi:/.test(Name) || typeof Listener != "function") return false;
        if(!Listener.bibiEventListener) Listener.bibiEventListener = (Eve) => { return Listener.call(document, Eve.detail); };
        (Ele ? Ele : document).addEventListener(Name, Listener.bibiEventListener, false);
        return Listener;
    }
    
    
    remove(Name, Listener, Ele) {
        if(typeof Name != "string" || !/^bibi:/.test(Name) || typeof Listener != "function" || typeof Listener.bibiEventListener != "function") return false;
        (Ele ? Ele : document).removeEventListener(Name, Listener.bibiEventListener);
        return Listener;
    }
    
    
    bind(Name, Listener, Ele) {
        if(typeof Name != "string" || !/^bibi:/.test(Name) || typeof Listener != "function") return false;
        Ele = (Ele ? Ele : document);
        if(!Ele.BibiBindedEventListeners) Ele.BibiBindedEventListeners = {};
        if(!(Ele.BibiBindedEventListeners[Name] instanceof Array)) Ele.BibiBindedEventListeners[Name] = [];
        Ele.BibiBindedEventListeners[Name] = Ele.BibiBindedEventListeners[Name].filter((Binded) => {
            if(Binded != Listener) return true;
            return false;
        });
        Ele.BibiBindedEventListeners[Name].push(Listener);
        return Ele.BibiBindedEventListeners[Name].length - 1;
    }
    
    
    unbind(Name, Listener, Ele) {
        if(typeof Name != "string") return false;
        Ele = (Ele ? Ele : document);
        if(!Ele.BibiBindedEventListeners || !(Ele.BibiBindedEventListeners[Name] instanceof Array)) return false;
        if(typeof Listener == "undefined") {
            delete Ele.BibiBindedEventListeners[Name];
            return 0;
        }
        if(typeof Listener == "number") {
            if(typeof Ele.BibiBindedEventListeners[Name][Listener] != "function") return false;
            Listener = Ele.BibiBindedEventListeners[Name][Listener];
        }
        Ele.BibiBindedEventListeners[Name] = Ele.BibiBindedEventListeners[Name].filter((Binded) => {
            if(Binded != Listener) return true;
            return false;
        });
        return Ele.BibiBindedEventListeners[Name].length;
    }
    
    
    dispatch(Name, Detail, Ele) {
        // console.log('//////// ' + Name);
        if(typeof Name != "string") return false;
        Ele = (Ele ? Ele : document);
        if(Ele.BibiBindedEventListeners && Ele.BibiBindedEventListeners[Name] instanceof Array) {
            Ele.BibiBindedEventListeners[Name].forEach((bindedEventListener) => {
                if(typeof bindedEventListener == "function") bindedEventListener.call(Ele, Detail);
            });
        }
        return Ele.dispatchEvent(new CustomEvent(Name, { detail: Detail }));
    }
}

export default (new E);