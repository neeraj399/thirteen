function PlayerClass(id){
	this.id = id;
	this.numCards;
	this.position;
	var wsConnObj;
	var room;
	var roomsAsGuest = [];
	var deal;
	var currentCards;
	var moves = [];
	var visibleMoves = [];
	var timerSI;
	this.setTimer = function(timeoutId){
		timerSI = timeoutId;
	};
	this.clearTimer = function(){
		clearInterval(timerSI);
	};
	this.setWSConnObj = function(connObj){
		wsConnObj = connObj;
	};
	this.getWSConnObj = function(){
		return wsConnObj;
	};
	
	this.joinRoom = function(roomObj){
		room = roomObj;
		roomObj.addPlayer(this);
		this.direction = roomObj.players.length - 1;
	};
	this.joinRoomAsGuest = function(roomObj){
		roomsAsGuest.push(roomObj);
		roomObj.addViewer(this);
	};
	this.leaveRoom = function(roomObj){
		var players = roomObj.getPlayers();
		var thisPlayerFound = false;
		for(var i=0;i<player.length;i++){
			if(this.id == players[i].id){
				thisPlayerFound = true;
				break;
			}
		}
		if(!thisPlayerFound){
			return false;
		}
		room = undefined;
		roomObj.removePlayer(this);
	};
	
	this.getRoom = function(){
		return room;
	};
	
	this.setDeal = function(dealObj){
		deal = dealObj;
		this.setCurrentCards(dealObj.getDealBitmap());
	};
	this.getDeal = function(){
		return deal;
	};
	
	this.getCurrentCards = function(){
		return currentCards;
	};
	
	this.setCurrentCards = function(cards){
		currentCards = cards;
		this.numCards = (function(cards){
			var numCards = 0;
			for(var i=0;i<52;i++){
				numCards += parseInt(cards[i]);
			}
			return numCards;
		})(cards);
	};
	
	this.getMoves = function(){
		return moves;
	};
	
	this.getVisibleMoves = function(){
		return visibleMoves;
	};
	
	this.getLastMove = function(){
		if(moves.length == 0){
			return false;
		}
		return moves[moves.length - 1];
	};
	
	this.getLastVisibleMove = function(){
		if(visibleMoves.length == 0){
			return false;
		}
		return visibleMoves[visibleMoves.length - 1];
	};
	
	this.setLastMove = function(moveObj){
		moves.push(moveObj);
		if(moveObj.kind != "passed"){
			visibleMoves.push(moveObj);
		}
		this.clearTimer();
	};
	
	(this.constructor.objs = this.constructor.objs || {})[id] = this;
}

PlayerClass.prototype.setAsStarting = function(){
	this.isStartingPlayer = true;
};

PlayerClass.prototype.removeAsStarting = function(){
	this.isStartingPlayer = false;
};

PlayerClass.prototype.canJoinRoom = function(roomObj){
	var players = roomObj.getPlayers();
	if(players.length == 4){
		return false;
	}
	for(var i=0;i<players.length;i++){
		if(this.id == players[i].id){
			return false;
		}
	}
	if(typeof roomObj.getGame() != "undefined"){
		return false;
	}
	return true;
};


module.exports = PlayerClass;
