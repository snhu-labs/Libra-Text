class ConversationFeed { 
	constructor(convoContainer = "", slot = 0, parent = null) {
		this.convoContainer = convoContainer;
		this.slot = slot;
		this.parent = parent;

		this.playerColorsHex = ["#DFDFDF", "#ffc300", "#19b4ff", "#ff5f57"];
		this.playerNames = ["Everyone", "Team A", "Team B", "Team C"];
		this.textBubbleStyles = [
			"",
			"font: 18px MontserratMedium; line-height: 22px; border: 2px solid #FFD71B; background-color: #FFD71B; color: #202020; padding-top: 0px; padding-left: 5px; padding-right: 5px; padding-bottom: 5px; border-radius: 8px; margin: 4px; margin-left: -5px;",
			"font: 18px MontserratMedium; line-height: 22px; border: 2px solid #18B4FE; background-color: #18B4FE; color: #202020; padding-top: 0px; padding-left: 5px; padding-right: 5px; padding-bottom: 5px; border-radius: 8px; margin: 4px; margin-left: -5px; margin-right: 40px;",
			"font: 18px MontserratMedium; line-height: 22px; border: 2px solid #FE6057; background-color: #FE6057; color: #202020; padding-top: 0px; padding-left: 5px; padding-right: 5px; padding-bottom: 5px; border-radius: 8px; margin: 4px; margin-right: -5px;"
		];

		this.convoDisplayName = `convoDisplay${this.slot}`;
		this.convoDisplay = "";
		this.convoEntries = [];
		this.convoEntries[0] = [];
		this.curConvoIdx = 0;

		this.Initialize();
	}
	Initialize() {
		this.convoDisplay = "";
		this.convoEntries = [];
		this.convoEntries[0] = [];
		this.curConvoIdx = 0;
		this.DrawConversation();
	}
	DrawConversation(idx = this.curConvoIdx) {
		$("#" + this.convoContainer).empty();

		this.convoDisplay = `<div id='${this.convoDisplayName}' style='display: block; background-color: #58616A; width: 338px; height: auto;'>`;

		if(!this.convoEntries[idx]) {
			this.convoEntries[idx] = [];
		}

		if(this.convoEntries[idx]) {
			let name = '';
			for (let i = 0; i < this.convoEntries[idx].length; i++) {
				name = this.parent?.players[this.convoEntries[idx][i].to]?.name || 'Unknown';
				this.convoDisplay += `<div id='c${this.slot}e-${i}' style='margin-left: 45px; font-size: 20px; color: ${this.playerColorsHex[this.convoEntries[idx][i].from]};' >${this.parent.players[this.convoEntries[idx][i].from].name} &gt;&gt; <span style='color: ${this.playerColorsHex[this.convoEntries[idx][i].to]};'>${name}</span><div style='${this.textBubbleStyles[this.convoEntries[idx][i].from]}'><span style='font-family: icomoon;'>${this.convoEntries[idx][i].text}</span></div></div>`;
			}
		}
		this.convoDisplay += "</div>";

		$("#" + this.convoContainer).append(this.convoDisplay);
		
		window.setTimeout(() => {
			if($(`#${this.convoDisplayName}`)) {
				$(`#${this.convoDisplayName}`).css("display", "block");
				if($(`#gcfSlot${this.slot}CFrame`)[0])
					$(`#gcfSlot${this.slot}CFrame`).scrollTop($(`#${this.convoDisplayName}`)[0].scrollHeight);
			}
		}, 100);
	}
	PrevConvo() {
		--this.curConvoIdx;
		if(this.curConvoIdx <= 0) {
			this.curConvoIdx = 0;
		} else if(this.curConvoIdx >= this.convoEntries.length-1) {
			this.curConvoIdx = this.convoEntries.length - 1;
		}
		this.DrawConversation(this.curConvoIdx);
		$(`#gcfSlot${this.slot}Session`).text(`- ${this.curConvoIdx + 1}`);
	}
	NextConvo() {
		++this.curConvoIdx;
		if(this.curConvoIdx <= 0) {
			this.curConvoIdx = 0;
		} else if(this.curConvoIdx >= this.convoEntries.length) {
			this.curConvoIdx = this.convoEntries.length - 1;
		}
		this.DrawConversation(this.curConvoIdx);
		$(`#gcfSlot${this.slot}Session`).text(`- ${this.curConvoIdx + 1}`);
	}
	ScanForBadWords(msg) {
		let result = false;
		return result;
	}
	ReceiveTextMessage(msg) {
		this.SetConvo(msg.sessionNum);
		this.convoEntries[msg.sessionNum].push({ raw: msg.msg, text: msg.dashMsg, from: msg.teamNumber, to: msg.toTeam });
		this.DrawConversation();
	}
	SetConvo(sessionNum, draw = false) {
		if(!this.convoEntries[sessionNum]) {
			this.convoEntries[sessionNum] = [];
		}
		this.curConvoIdx = sessionNum;
		if(draw === true) {
			this.DrawConversation();
		}
	}
	Reset() {
		this.convoDisplay = "";
		this.DrawConversation();
	}
	ExportConvos() {
		let result = [];

		for(let i = 0; i < this.convoEntries.length; i++) {
			result.push(`Roomcode: ${this.parent.classcode}-${i+1}`);
			result.push('From,To,Message');
			for(let e = 0; e < this.convoEntries[i].length; e++) {
				result.push(`${this.parent.players[this.convoEntries[i][e].from].name || ''},${this.parent.players[this.convoEntries[i][e].to].name || ''},${this.convoEntries[i][e].raw}`);
			}
		}

		return result;
	}
}