import { useCDN } from "./constants";
export default {
    image: function(absolutePath, options) {
        //console.log(p.parse(absolutePath));
        if(useCDN)
            console.log("Use CDN");
        return absolutePath;
    }
};