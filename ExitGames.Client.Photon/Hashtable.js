class Hashtable {
    constructor () {
        this.value = [];
    }
    set(key,value) {
        this.value.push({key,value});
    }
}