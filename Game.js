function GameClass(players){
	this.players = players;
	this.hadAllPasses;
	this.cardsOnTable;
	this.nextPlayerDirectionToMove;
	var moves = [];
	var visibleMoves = [];
	var parentRoom;
	var nextAvailablePos = 1;
	var nextAvailablePosFromBack = 4;
	
	
	this.setParentRoom = function(roomObj){
		parentRoom = roomObj;
	};
	this.getParentRoom = function(){
		return parentRoom;
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
			this.getParentRoom().cardsOnTable = this.cardsOnTable = moveObj.cardsDown;
		}
		var dir = (this.nextPlayerDirectionToMove + 1)%4;
		/* while(typeof this.getPlayerByDirection(dir).position != "undefined"){
			dir = (dir + 1)%4;
		} */
		this.nextPlayerDirectionToMove = dir;
	};
	
	this.getPlayerByDirection = function(dir){
		for(var i=0;i<4;i++){
			if(dir == players[i].direction){
				return players[i];
			}
		}
	};
	
	this.getNextPlayerToMove = function(){
		return this.getPlayerByDirection(this.nextPlayerDirectionToMove);
	};
	
	this.hadAllPasses = function(){
		/* if(nextAvailablePos == 1 //all 4 players are left
			&& moves.length > 3 
			&& moves[moves.length - 1].kind == "passed" 
			&& moves[moves.length - 2].kind == "passed" 
			&& moves[moves.length - 3].kind == "passed"){
			return true;
		}
		else if(nextAvailablePos == 2 //3 players are left
			&& moves.length > 2 
			&& moves[moves.length - 1].kind == "passed" 
			&& moves[moves.length - 2].kind == "passed"){
			return true;	
		}
		else if(nextAvailablePos == 3 //2 players are left
			&& moves.length > 1 
			&& moves[moves.length - 1].kind == "passed"){
			return true;	
		} */
		/* var nextPlayerToMove = this.getNextPlayerToMove();
		if(nextPlayerToMove.getLastVisibleMove() && this.getLastVisibleMove() && nextPlayerToMove.getLastVisibleMove().cardsDown == this.getLastVisibleMove().cardsDown){
			return true;
		} */
		
		if(moves.length > 3 
			&& moves[moves.length - 1].kind == "passed" 
			&& moves[moves.length - 2].kind == "passed" 
			&& moves[moves.length - 3].kind == "passed"){
			return true;	
		}
		return false;
	};
	
	/* this.setNextAvailablePosition = function(pos){
		nextAvailablePos = pos;
	};
	
	this.getNextAvailablePosition = function(){
		return nextAvailablePos;
	}; */
	
	this.assignNextAvailablePosToPlayer = function(playerObj){
		playerObj.position = nextAvailablePos++;
	};
	
	this.assignNextAvailablePosFromBackToPlayer = function(playerObj){
		playerObj.position = nextAvailablePosFromBack--;
	};
	
	this.getNextAvailablePos = function(){
		return nextAvailablePos;
	};
	
	this.getPlayerWithNoPos = function(){
		for(var i=0;i<this.players.length;i++){
			if(typeof players[i].position == "undefined"){
				return players[i];
			}
		}
	};
	
	this.removePlayer = function(playerObj){
		for(var i=0;i<this.players.length;i++){
			if(this.players[i].id == playerObj.id){
				var player = players[i];
				this.assignNextAvailablePosFromBackToPlayer(player);
				this.players.splice(i, 1);
				return true;
			}
		}
		return false;
	};
	
	this.isGameEnded = function(){
		if(nextAvailablePos == 4 || nextAvailablePosFromBack == 1){
			return true;
		}
		return false;
	};
}

module.exports = GameClass;