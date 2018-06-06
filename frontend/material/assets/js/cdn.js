import { USECDN } from "./constants";
import { parse } from "./vendor/parseuri";
export default {
    seededRandom: function(seed, max, min) {
        max = max || 1;
        min = min || 0;
        seed = (seed * 9301 + 49297) % 233280;
        var rnd = seed / 233280;
        return min + rnd * (max - min);
    },
    // For now just Photon
    image: function(item/*, options*/) {
        if(!item) return null;
        if(typeof item == "string") {
            if(!USECDN) return item;
            const url = item;
            item = new Object;
            item.ImageSource = url;
            item.ImageIndex = 0;
        }
        if(!USECDN) return item.ImageSource;
        const ele = parse(item.ImageSource);
        let hash = item.ItemIndex;
        for (var i = 0; i < ele.host.length; i++) {
            hash = ((hash << 5) - hash) + ele.host.charCodeAt(i);
            hash = hash & hash; // Convert to 32bit integer
        }

        return "https://i" + Math.floor(this.seededRandom(hash, 0, 2)) + ".wp.com/" + ele.authority + ele.path + "?quality=100";
    }
};