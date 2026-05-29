

class Game {
    static Players = {}
    static World = {}
    Player = {};
    constructor (ActorNr,Player) {
        this.ActorNr = ActorNr;
        this.Player = Player || {};
    }
    update () {
        Game.Players[this.ActorNr] = this.Player;
    }
}



export default Game