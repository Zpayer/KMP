
 class StreamBuffer
{
     constructor(buf)
    {
        this.buf = buf?[...buf]:[];
        this.len = this.buf.length;
    }
    ToArray(){return [...this.buf]}
    GetBuffer(){return new Uint8Array(this.ToArray).buffer;}
    Read(l) { let u = this.buf.slice(this.pos,this.pos+l); this.pos+=l ; return u}
    ReadByte() {return this.Read(1)[0]}
    WriteByte(value){this.buf.push(Number(value))}
    WriteBytes(...bytes){this.buf.push(...bytes)}
    Write(bytes){this.buf.push(...bytes)}
    DefaultInitialSize = 0;
    pos=0;
    len=0;
    buf=[];
}

export default StreamBuffer;