export function UIU () {
    let types = {
    i64:[BigInt64Array,8],
    i32:[Int32Array,4],
    i16:[Int16Array,2],
    i8:[Int8Array,1],
    u64:[BigUint64Array,8],
    u32:[Uint32Array,4],
    u16:[Uint16Array,2],
    u8:[Uint8Array,1],
    f64:[Float64Array,8],
    f32:[Float32Array,4],
    ui16:[Uint16Array,2],
    }
    if ( arguments[0] == "set" ) return new Uint8Array(arguments[2]?new types[arguments[1]][0]([arguments[2]]).buffer:new Uint8Array(types[arguments[1]][1])).reverse();
    if ( arguments[0] == "get" ) return new types[arguments[1]][0](arguments[2]?new Uint8Array(arguments[2]).reverse().buffer:0)[0];
    
    }
export function Enum (_){
    var g={};
    var c=0;
    _.replaceAll(/\[.*?\]/g, '').replaceAll(' ','').replaceAll('\t','').split(',').map(p=>{
        if(p.includes('//')&&p.includes('\n')){
            p=p.replace(/\/\/.*?\n/g, "");
                }
            if(p.includes('\n')){
            p=p.replaceAll('\n','')
            }
        if(p!=''){
        if(p.includes('=')){
    g[p.split('=')[0]]=JSON.parse(p.split('=')[1])
    c=p.split('=')[1]
        }else{
        g[p]=c
        }}
        c++
    })
    return g
}
export function LogError (type,text) {
    console.error(`[${type}]: ${text}`)
}
export function ReverseObject (obj) {
    return Object.fromEntries(Object.entries(obj).map(([k,v])=>[v,k]))
}
