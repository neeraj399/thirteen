var http = require('http');
var fs = require('fs');
var WebSocketServer = require('ws').Server;
/* var  */Room = require('./Room.js');
/* var  */Player = require('./Player.js');
/* var  */Game = require('./Game.js');
/* var  */Deal = require('./Deal.js');
/* var  */Move = require('./Move.js');
/* var  */mysql = require('mysql');

var playerID = 567;	//////////////////////////<----------------------------------------------DUMMY
var allWSConnections = [];

var server = http.createServer(function(request, response) {
	console.log('http request received for path' + request.url);
	
	/* if(request.url == "/"){
		fs.readFile("rooms.html", function(err, data){
			response.writeHead(200, {'Content-Type': 'text/html'});
			response.write(data);
			response.end();
		});
	} */
	
	fs.readFile("index.html", function(err, data){
		//debugger;
		response.writeHead(200, {'Content-Type': 'text/html'});
		response.write(data);
		response.end();
	});
});

server.listen(3000, function() {
    console.log((new Date()) + ' Server is listening on port 3000');
});

var wss = new WebSocketServer({ 
	server: server 
});

new Room(1);	//////////////////////////<----------------------------------------------DUMMY
new Room(2);	//////////////////////////<----------------------------------------------DUMMY
new Room(3);	//////////////////////////<----------------------------------------------DUMMY
new Room(4);	//////////////////////////<----------------------------------------------DUMMY
new Room(5);	//////////////////////////<----------------------------------------------DUMMY
new Room(6);	//////////////////////////<----------------------------------------------DUMMY
new Room(7);	//////////////////////////<----------------------------------------------DUMMY
new Room(8);	//////////////////////////<----------------------------------------------DUMMY
new Room(9);	//////////////////////////<----------------------------------------------DUMMY
new Room(10);	//////////////////////////<----------------------------------------------DUMMY
new Room(11);	//////////////////////////<----------------------------------------------DUMMY
new Room(12);	//////////////////////////<----------------------------------------------DUMMY

wss.on('connection', function(connObj){
	
	var playerObj = new Player(playerID++);	//create player object for this connection
	playerObj.setWSConnObj(connObj);
	allWSConnections.push(connObj);
	//send this player its info
	sendToPlayers([playerObj], {
		action: "you",
		you: playerObj
	});
	
	connObj.on('message', function(message){
		//debugger;
		var messageObj = JSON.parse(message);
		console.log('websocket message received:', messageObj);
		var action = messageObj.action;
		
		switch(action){
			case "getRooms":
				var roomObjs = Room.getRooms();
				sendToPlayers([playerObj], {
					action: "roomsInfo",
					rooms: roomObjs
				});
				break;
			case "joinRoomAsGuest":
				var roomId = messageObj.roomId;	//////////////////////////<----------------------------------------------DUMMY
				var roomObj = Room.getObj(roomId);
				playerObj.joinRoomAsGuest(roomObj);
				var roomMembers = roomObj.getAllMembers();
				sendToPlayers([playerObj], {
					action: "roomJoined",
					room: roomObj
				});
				/* sendToPlayers(roomMembers, {
					action: "roomUpdate",
					room: roomObj
				}); */
				var gameObj = roomObj.getGame();
				if(typeof gameObj != "undefined"){
					sendToPlayers([playerObj], {
						action: "gameUpdate",
						game: gameObj
					});
					/* sendToPlayers(roomMembers, {
						action: "startTimerForPlayer",
						game: gameObj
					}); */
				}
				break;
			case "joinRoom":
				var roomId = messageObj.roomId;	//////////////////////////<----------------------------------------------DUMMY
				var roomObj = Room.getObj(roomId);
				if(!playerObj.canJoinRoom(roomObj)){
					sendToPlayers([playerObj], {
						action: "cantJoinRoom",
						room: roomObj
					});
					return;
				}
				playerObj.joinRoom(roomObj);
				
				sendToPlayers([playerObj], {
					action: "roomJoined",
					room: roomObj
				});
				
				var roomMembers = roomObj.getAllMembers();
				sendToPlayers(roomMembers, {
					action: "roomUpdate",
					room: roomObj
				});
				
				if(roomObj.canStartGame()){
					//debugger;
					startGameStartTimer(roomObj, true);
				}
				break;
			case "leaveRoom":
				var roomObj = playerObj.getRoom();
				var roomMembers = roomObj.getAllMembers();
				var gameObj = roomObj.getGame();
				if(typeof gameObj != "undefined"){	//there is a game going on
					if(gameObj.removePlayer(playerObj)){
						sendToPlayers(roomMembers, {
							action: "gameLeft",
							player: playerObj
						});
						sendToPlayers(roomMembers, {
							action: "gameUpdate",
							game: gameObj
						});
					}
					if(gameObj.isGameEnded()){
						sendToPlayers(roomMembers, {
							action: "gameEnded",
							game: gameObj
						});
						roomObj.deleteGame();
						startGameStartTimer(roomObj);
					}
				}
				if(roomObj.removePlayer(playerObj)){
					sendToPlayers(roomMembers, {
						action: "roomLeft",
						player: playerObj
					});
					sendToPlayers(roomMembers, {
						action: "roomUpdate",
						room: roomObj
					});
				}
				
				break;
			case "placeCards":
				//debugger;
				var roomObj = playerObj.getRoom();
				var gameObj = roomObj.getGame();
				if(typeof gameObj == "undefined" || playerObj.direction != gameObj.nextPlayerDirectionToMove){
					return;
				}
				var roomPlayers = roomObj.getPlayers();
				var roomViewers = roomObj.getViewers();
				var roomMembers = roomObj.getAllMembers();
				var lastVisibleMove = gameObj.getLastVisibleMove();
				//var cardsOnTable = roomObj.cardsOnTable;	//typeof lastVisibleMove != "undefined"?lastVisibleMove.cardsDown:undefined;
				var moveCards = messageObj.cardsDown;
				var moveObj = new Move(moveCards);
				var moveKind = moveObj.kind;
				var playerCurrentCards = playerObj.getCurrentCards();
				if(gameObj.hadAllPasses() || (gameObj.getMoves().length == 0 && playerObj.isStartingPlayer)){	//everyone passed or first move
					if(moveKind && moveObj.isSubsetOf(playerCurrentCards)){	//a valid move
						if(moveKind != "passed"){
							playerObj.setCurrentCards(moveObj.getRemainingOutOf(playerCurrentCards));
							if(playerObj.numCards == 0){
								gameObj.assignNextAvailablePosToPlayer(playerObj);
								moveObj.isWinningMove = true;
							}
							//roomObj.cardsOnTable = moveObj.cardsDown;
							gameObj.setLastMove(moveObj);
							playerObj.setLastMove(moveObj);
							sendToPlayers([playerObj], {
								action: "stopTimers"
							});
							sendToPlayers(roomMembers, {
								action: "validMove",
								move: moveObj
							});
							sendUpdatedCardsToPlayers([playerObj]);
							if(gameObj.isGameEnded()){	//game has ended
								gameObj.assignNextAvailablePosToPlayer(gameObj.getPlayerWithNoPos());
								sendToPlayers(roomMembers, {
									action: "gameEnded",
									game: gameObj
								});
								roomObj.deleteGame();
								startGameStartTimer(roomObj);
								
							}
							else{
								sendToPlayers(roomMembers, {
									action: "gameUpdate",
									game: gameObj
								});
								sendCardsRequestToNextPlayer(roomObj, gameObj);	
							}
							
						}
						else{
							sendToPlayers([playerObj], {
								action: "invalidMove",
								message: "Can't pass on an empty table."
							});
						}
					}
					else{
						sendToPlayers([playerObj], {
							action: "invalidMove",
							message: "Invalid move."
						});
					}
				}
				else{	//there are cards on the table
					if(moveKind && moveObj.isSubsetOf(playerCurrentCards)){	//a valid move
						if(moveKind != "passed"){
							if(moveObj.cuts(gameObj.getLastVisibleMove())){
								playerObj.setCurrentCards(moveObj.getRemainingOutOf(playerCurrentCards));
								if(playerObj.numCards == 0){
									gameObj.assignNextAvailablePosToPlayer(playerObj);
									moveObj.isWinningMove = true;
								}
								//roomObj.cardsOnTable = moveObj.cardsDown;
								gameObj.setLastMove(moveObj);
								playerObj.setLastMove(moveObj);
								sendToPlayers([playerObj], {
									action: "stopTimers"
								});
								sendToPlayers(roomMembers, {
									action: "validMove",
									move: moveObj
								});
								sendUpdatedCardsToPlayers([playerObj]);
								if(gameObj.isGameEnded()){	//game has ended
									gameObj.assignNextAvailablePosToPlayer(gameObj.getPlayerWithNoPos());
									sendToPlayers(roomMembers, {
										action: "gameEnded",
										game: gameObj
									});
									roomObj.deleteGame();
									startGameStartTimer(roomObj);
								}
								else{
									sendToPlayers(roomMembers, {
										action: "gameUpdate",
										game: gameObj
									});
									sendCardsRequestToNextPlayer(roomObj, gameObj);	
								}
							}
							else{
								sendToPlayers([playerObj], {
									action: "invalidMove",
									message: "Invalid move."
								});
							}
						}
						else{
							//roomObj.cardsOnTable = moveObj.cardsDown;
							gameObj.setLastMove(moveObj);
							playerObj.setLastMove(moveObj);
							sendToPlayers([playerObj], {
								action: "stopTimers"
							});
							sendToPlayers(roomMembers, {
								action: "passed"
							});
							sendToPlayers(roomMembers, {
								action: "gameUpdate",
								game: gameObj
							});
							sendCardsRequestToNextPlayer(roomObj, gameObj);
						}
					}
					else{
						sendToPlayers([playerObj], {
							action: "invalidMove",
							message: "Invalid move."
						});
					}
				}
				break;
		}
	});
});

function startGameStartTimer(roomObj, firstGame){
	var roomMembers = roomObj.getAllMembers();
	if(roomObj.canStartGame()){
		
		roomObj.currentTimeLeft = 10;
		function setCurrentTime(){
			roomObj.currentTimeLeft--;
			if(roomObj.currentTimeLeft > 0){
				setTimeout(setCurrentTime, 1000);
			}
		}
		setCurrentTime();
		
		sendToPlayers(roomMembers, {
			action: "gameStartCountdown",
			room: roomObj
		});
		
		roomObj.setTimer(setTimeout(function(){
			if(roomObj.canStartGame()){
				startGame(roomObj, firstGame);
			}
		}, 10000));
	}
}

function startGame(roomObj, firstGame){
	//debugger;
	var roomPlayers = roomObj.getPlayers();
	var viewers = roomObj.getViewers();
	var allMembers = roomPlayers.concat(viewers);
	var dealCards = createDealCards();
	var startingPlayer;
	for(var i=0;i<4;i++){
		var player = roomPlayers[i];
		player.setDeal(new Deal(dealCards[i].join("")));
		if(firstGame){
			if(dealCards[i][0] == "1"){
				startingPlayer = player;
				startingPlayer.setAsStarting();
			}
			else{
				player.removeAsStarting();
			}
		}
		else if(player.isStartingPlayer){
			startingPlayer = player;
		}
	}
	var gameObj = new Game(roomPlayers);
	gameObj.nextPlayerDirectionToMove = startingPlayer.direction;
	roomObj.addGame(gameObj);
	console.log("game started", roomObj);
	sendUpdatedCardsToPlayers(roomPlayers);
	sendToPlayers(allMembers, {
		action: "gameStart",
		game: gameObj
	});
	sendToPlayers([startingPlayer], {
		action: "placeCards"
	});
	startTimer(startingPlayer, roomObj, gameObj, true);
}

function sendToPlayers(players, JSONObj){
	for(var i=0;i<players.length;i++){
		var playerConnObj = players[i].getWSConnObj();
		playerConnObj.send(JSON.stringify(JSONObj));
	}
}

function sendToAll(JSONObj){
	for(var i=0;i<allWSConnections.length;i++){
		var connObj = allWSConnections[i];
		connObj.send(JSON.stringify(JSONObj));
	}
}



function sendUpdatedCardsToPlayers(players){
	for(var i=0;i<players.length;i++){
		sendToPlayers([players[i]], {
			action: "updateCards",
			cards: players[i].getCurrentCards()
		});
	}
}

function sendCardsRequestToNextPlayer(roomObj, gameObj){
	var nextDir = gameObj.nextPlayerDirectionToMove;
	var players = roomObj.getPlayers();
	var allMembers = roomObj.getAllMembers();	//players.concat(viewers);
	var player;
	for(var i=0;i<players.length;i++){
		if(players[i].direction == nextDir){
			player = players[i];
			if(typeof player.position != "undefined"){	//the person has won with a valid position
				//simulate a pass 
				var moveObj = new Move((function(){
					var str = "";
					for(var i=0;i<52;i++){
						str += "0";
					}
					return str;
				})());
				gameObj.setLastMove(moveObj);
				player.setLastMove(moveObj);
				sendToPlayers([player], {
					action: "stopTimers"
				});
				sendToPlayers(allMembers, {
					action: "passed"
				});
				sendToPlayers(allMembers, {
					action: "gameUpdate",
					game: gameObj
				});
				sendCardsRequestToNextPlayer(roomObj, gameObj);
			}
			else if(gameObj.hadAllPasses()){
				sendToPlayers([player], {
					action: "placeFreshCards"
				});
				roomObj.cardsOnTable = [];
				startTimer(player, roomObj, gameObj, true);
				sendToPlayers(allMembers, {
					action: "cleanTable",
					game: gameObj
				});
			}
			else{
				sendToPlayers([player], {
					action: "placeCards"
				});
				startTimer(player, roomObj, gameObj);
			}
			
			break;
			
			/* //if(player.getLastVisibleMove().cardsDown == gameObj.getLastVisibleMove().cardsDown){
			if(gameObj.hadAllPasses()){
				sendToPlayers([player], {
					action: "placeFreshCards"
				});
				sendToPlayers(players, {
					action: "cleanTable"
				});
			}
			else{
				sendToPlayers([player], {
					action: "placeCards"
				});
			} */
		}
	}
	
	/* if(gameObj.hadAllPasses()){
		for(var i=0;i<players.length;i++){
			if(players[i].direction == nextDir){
				sendToPlayers([players[i]], {
					action: "placeFreshCards"
				});
				break;
			}
		}
		sendToPlayers(players, {
			action: "cleanTable"
		});
		return;
	}
	for(var i=0;i<players.length;i++){
		if(players[i].direction == nextDir){
			sendToPlayers([players[i]], {
				action: "placeCards"
			});
			break;
		}
	} */
}

function startTimer(playerObj, roomObj, gameObj, freshCards){
	//console.log("calling startTimer for ", playerObj, roomObj, gameObj, freshCards);
	playerObj.currentTimeLeft = 30;
	function setCurrentTime(){
		playerObj.currentTimeLeft--;
		if(playerObj.currentTimeLeft == 10 && gameObj.nextPlayerDirectionToMove == playerObj.direction){
			sendToPlayers([playerObj], {
				action: "startTimerForPlayer"
			}); 
		}
		if(playerObj.currentTimeLeft > 0){
			setTimeout(setCurrentTime, 1000);
		}
	}
	setCurrentTime();
	
	playerObj.setTimer(setTimeout(function(){
		var allMembers = roomObj.getAllMembers();
		//simulate a pass or a lowest card move depending on 'freshCards'
		var moveObj = new Move((function(){
			var str = "";
			for(var i=0;i<52;i++){
				str += "0";
			}
			if(freshCards){
				var playerCards = playerObj.getCurrentCards();
				var lowestCardIndex = playerCards.indexOf("1");
				str = str.substr(0, lowestCardIndex) + "1" + str.substr(lowestCardIndex+1);
			}
			return str;
		})());
		if(freshCards){
			playerObj.setCurrentCards(moveObj.getRemainingOutOf(playerObj.getCurrentCards()));
			if(playerObj.numCards == 0){
				gameObj.assignNextAvailablePosToPlayer(playerObj);
				moveObj.isWinningMove = true;
			}
		}
		
		gameObj.setLastMove(moveObj);
		playerObj.setLastMove(moveObj);
		sendToPlayers([playerObj], {
			action: "stopTimers"
		});
		if(freshCards){
			sendToPlayers(allMembers, {
				action: "validMove",
				move: moveObj
			});
			sendUpdatedCardsToPlayers([playerObj]);
			if(gameObj.isGameEnded()){	//game has ended
				gameObj.assignNextAvailablePosToPlayer(gameObj.getPlayerWithNoPos());
				sendToPlayers(allMembers, {
					action: "gameEnded",
					game: gameObj
				});
				//var roomObj = gameObj.getParentRoom();
				roomObj.deleteGame();
				startGameStartTimer(roomObj);
			}
			else{
				sendToPlayers(allMembers, {
					action: "gameUpdate",
					game: gameObj
				});
				sendCardsRequestToNextPlayer(roomObj, gameObj);	
			}
		}
		else{
			sendToPlayers(allMembers, {
				action: "passed"
			});
			sendToPlayers(allMembers, {
				action: "gameUpdate",
				game: gameObj
			});
			sendCardsRequestToNextPlayer(roomObj, gameObj);
		}
	}, 30000));
}

function createDealCards(){
	function shuffleAllCards(){
		var cards = [];
		var tempCard, temp1, temp2;
		for(var i=0;i<52;i++){
			cards.push(i);
		}
		for(i=0;i<1000;i++){
			temp1 = Math.floor(Math.random()*52);
			temp2 = Math.floor(Math.random()*52);
			(temp1==temp2) && (temp2 = (temp2 + 1)%52);
			tempCard = cards[temp1];
			cards[temp1] = cards[temp2];
			cards[temp2] = tempCard;
		}
		return cards;
	}
	
	function getEmpty52(){
		var emp = [];
		for(var i=0;i<52;i++){
			emp.push(0);
		}
		return emp;
	}
	var deals = [getEmpty52(), getEmpty52(), getEmpty52(), getEmpty52()];
	var shuffledCards = shuffleAllCards();
	for(var i=0;i<52;i++){
		deals[Math.floor(i/13)][shuffledCards[i]] = 1;
	}
	return deals;
}

