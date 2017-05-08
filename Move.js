function MoveClass(cardsDown){
	this.cardsDown = cardsDown;
	this.isWinningMove;
	this.kind = getKind();
	this.isSpecialTwo = isSpecialTwo();
	
	function getNum1s(bitmap){
		var indices = [];
		for(var i=0;i<52;i++){
			if(bitmap[i] === "1"){
				indices.push(i);
			}
		}
		return indices;
	}
	
	function isSpecialTwo(){
		var indices = getNum1s(cardsDown);
		var num1s = indices.length;
		if(num1s == 1 && indices[0] >= 48){
			return "single";
		}
		else if(num1s == 2 && indices[0] >= 48 && indices[1] >= 48){
			return "pair";
		}
		else if(num1s == 3 && indices[0] >= 48 && indices[1] >= 48 && indices[2] >= 48){
			return "triplet";
		}
		else if(num1s == 4 && indices[0] >= 48 && indices[1] >= 48 && indices[2] >= 48 && indices[3] >= 48){
			return "quad";
		}
		return false;
	}

	function getKind(){
		var indices = getNum1s(cardsDown);
		var num1s = indices.length;
		var isSeq = true;
		var kind = false;
		switch(num1s){
			case 0:
				kind = "passed";
				break;
			case 1:
				kind = "single";
				break;
			case 2:
				if(Math.floor(indices[0]/4) == Math.floor(indices[1]/4)){
					kind = "pair";
				}
				break;
			case 3:
				if(Math.floor(indices[0]/4) == Math.floor(indices[1]/4) && Math.floor(indices[1]/4) == Math.floor(indices[2]/4)){
					kind = "triplet";
				}
				break;
			case 4:
				if(Math.floor(indices[0]/4) == Math.floor(indices[1]/4) && Math.floor(indices[1]/4) == Math.floor(indices[2]/4) && Math.floor(indices[2]/4) == Math.floor(indices[3]/4)){
					kind = "quad";
				}
				break;
		}
		
		//look for sequence
		if(num1s >= 3 && num1s <= 12){
			for(var i=0;i<indices.length-1;i++){
				if(indices[i] < 48 && indices[i+1] < 48){
					if(Math.floor(indices[i]/4) != Math.floor(indices[i+1]/4) && Math.floor(indices[i]/4) + 1 == Math.floor(indices[i+1]/4)){
						isSeq = true;
					}
					else{
						isSeq = false;
						break;	
					}
				}
				else{
					isSeq = false;
					break;
				}
			}
			if(isSeq){
				kind = num1s + "seq";
			}
		}
		
		//look for 3pairs
		if(num1s == 6 
			&& indices[0] < 48
			&& indices[1] < 48
			&& indices[2] < 48
			&& indices[3] < 48
			&& indices[4] < 48
			&& indices[5] < 48
			&& Math.floor(indices[0]/4) + 1 == Math.floor(indices[2]/4) 
			&& Math.floor(indices[2]/4) + 1 == Math.floor(indices[4]/4) 
			&& Math.floor(indices[0]/4) == Math.floor(indices[1]/4) 
			&& Math.floor(indices[2]/4) == Math.floor(indices[3]/4) 
			&& Math.floor(indices[4]/4) == Math.floor(indices[5]/4)){
			kind = "3pairs";
		}
		
		//look for 4pairs
		if(num1s == 8 
			&& indices[0] < 48
			&& indices[1] < 48
			&& indices[2] < 48
			&& indices[3] < 48
			&& indices[4] < 48
			&& indices[5] < 48
			&& indices[6] < 48
			&& indices[7] < 48
			&& Math.floor(indices[0]/4) + 1 == Math.floor(indices[2]/4) 
			&& Math.floor(indices[2]/4) + 1 == Math.floor(indices[4]/4) 
			&& Math.floor(indices[4]/4) + 1 == Math.floor(indices[6]/4) 
			&& Math.floor(indices[0]/4) == Math.floor(indices[1]/4) 
			&& Math.floor(indices[2]/4) == Math.floor(indices[3]/4) 
			&& Math.floor(indices[4]/4) == Math.floor(indices[5]/4) 
			&& Math.floor(indices[6]/4) == Math.floor(indices[7]/4)){
			kind = "4pairs";
		}
		
		return kind;
	}
}

MoveClass.prototype.isSubsetOf = function(bitmap){
	for(var i=0;i<52;i++){
		if(bitmap[i] - this.cardsDown[i] == -1){
			return false;
		}
	}
	return true;
};

MoveClass.prototype.getRemainingOutOf = function(bitmap){
	var res = [];
	for(var i=0;i<52;i++){
		res.push(bitmap[i] - this.cardsDown[i]);
	}
	return res.join("");
};

MoveClass.prototype.cuts = function(moveObj){
	var cuts = false;
	var specialTwo = moveObj.isSpecialTwo;
	var moveKind = this.kind;
	if(moveKind == moveObj.kind && this.cardsDown.lastIndexOf("1") > moveObj.cardsDown.lastIndexOf("1")){
		cuts = true;
	}
	else if(specialTwo === "single"){
		if(moveKind === "3pairs" || moveKind === "4pairs" || moveKind == "quad"){
			cuts = true;
		}
	}
	else if(specialTwo === "pair"){
		if(moveKind === "4pairs" || moveKind == "quad"){
			cuts = true;
		}
	}
	return cuts;
};

module.exports = MoveClass;