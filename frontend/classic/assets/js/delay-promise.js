export default function delayPromise(duration) {
    return function(...args){
        return new Promise(function(resolve, reject){
            setTimeout(function(){
                resolve(...args);
            }, duration);
        });
    };
}