function RoomClass(id){
	this.id = id;
	this.players = [];
	var viewers = [];
	this.numViewers;
	this.cardsOnTable = [];
	
	var game;
	this.addGame = function(gameObj){
		game = gameObj;
		gameObj.setParentRoom(this);
	};
	this.getGame = function(){
		return game;
	};
	this.deleteGame = function(){
		for(var i=0;i<this.players.length;i++){
			var player = this.players[i];
			if(player.position == 1){
				player.setAsStarting();
			}
			else{
				player.removeAsStarting();
			}
			player.position = undefined;
		}
		game = undefined;
	};
	
	var timerSI;
	this.setTimer = function(timeoutId){
		timerSI = timeoutId;
	};
	this.clearTimer = function(){
		clearInterval(timerSI);
	};
	
	this.addViewer = function(playerObj){
		viewers.push(playerObj);
		this.numViewers = viewers.length;
	};
	
	this.getViewers = function(){
		return viewers;
	};
	
	this.removeViewer = function(playerObj){
		for(var i=0;i<viewers.length;i++){
			if(viewers[i].id == playerObj.id){
				viewers.splice(i, 1);
				this.numViewers = viewers.length;
				return true;
			}
		}
		return false;
	};
	
	this.getAllMembers = function(){
		return this.getPlayers().concat(this.getViewers());
	};
	
	(this.constructor.objs = this.constructor.objs || {})[id] = this;
}

RoomClass.prototype.addPlayer = function(playerObj){
	this.players.push(playerObj);
};

RoomClass.prototype.removePlayer = function(playerObj){
	for(var i=0;i<this.players.length;i++){
		if(this.players[i].id == playerObj.id){
			this.players.splice(i, 1);
			return true;
		}
	}
	return false;
};


RoomClass.prototype.canStartGame = function(){
	if(this.players.length != 4){
		return false;
	}
	if(typeof this.getGame() != "undefined"){
		return false;
	}
	return true;
};

RoomClass.prototype.getPlayers = function(){
	return this.players;
};

RoomClass.getObj = function(id){
	return RoomClass.objs[id];
};

RoomClass.getRooms = function(callback){
	var roomObjs = [];
	for(var id in RoomClass.objs){
		roomObjs.push(RoomClass.objs[id]);
	}
	return roomObjs;
};

module.exports = RoomClass;
