class NetworkManager {
	constructor(parent) {
		this.username = "placeholder";
		this.classcode = "0001";
		this.players = [];
		this.successCallback = null;
		this.main = parent;
		this.isRunning = false;

		this.msgTypes = {
			'DEFAULT': 0,
			'INIT': 1,
			'START_TYPING': 2,
			'STOP_TYPING': 3,
			'TEXT_MSG': 4,
			'VTHE': 5,
			'VTES': 6,
			'CUPC': 7,
            'CANCEL_LOGIN': 8,
			'CONVO_PACK': 9,
			'PAUSE_SESS': 10,
			'UNPAUSE_SESS': 11,
			'END_SESS': 12,
			'REJOIN': 13,
			'SESS_END': 14,
			'SLOT_NUM': 15,
			'TELEM_EVENT': 16,
			'SESS_START': 17,
			'PLAYER_JOIN': 18,
			'SEND_STATS': 19,
			'SESS_CONT': 20,
			'REJECTED_CONNECT': 21,
			'VTESO': 22,
			'SINGLE_DROP': 23,
			'DUAL_DROP': 24,
			'DROPCANCEL': 25,
			'PREV_CONVO': 26,
			'NEXT_CONVO': 27
		};

		this.isTeacherMsg = {
			"txm": true,
			"startTyping": false,
			"stopTyping": false
		}

		this.address = '<Address of ws/wss server goes here>';
		this.port = 9701;
		this.serverSocket = null;

	}
	Initialize(classcode = "0001", name = "", successCallback = null) {
		this.username = name;
		this.classcode = classcode;
		if (successCallback !== null && typeof successCallback === 'function') {
			this.successCallback = successCallback;
		}

		this.Connect();
	}
	Connect() {
		let address = `${this.address}:${this.port}/?cc=${this.classcode}&un=${this.username}`;
		console.log("Connecting...");
		this.serverSocket = null;
		this.serverSocket = new WebSocket(address);
		this.serverSocket.parent = this;
		this.serverSocket.onopen = this.OnOpenCB;
		this.serverSocket.onclose = this.OnCloseCB;
		this.serverSocket.onerror = this.OnErrorCB;
		this.serverSocket.onmessage = this.OnMessageCB;
		this.isRunning = true;

		if(this.successCallback !== null && typeof this.successCallback === 'function') {
			this.successCallback();
		}
	}
	OnOpenCB() {
		console.log('Connected Successfully.');
	}
	OnCloseCB() {
		console.log("Connection closed.");
	}
	OnErrorCB(err) {
		console.error("Socket Error:", err);
	}
	OnMessageCB(msg) {
		this.parent.RouteMessage(JSON.parse(msg.data));
	}
	RouteMessage(data) {
		switch(data.type) {
			case this.msgTypes.INIT:
				this.SendEvent({ type: this.msgTypes.INIT, classcode: this.classcode, username: this.username });
				break;
			case this.msgTypes.REJECTED_CONNECT:
				this.main.CancelLogin(false);
				break;
			case this.msgTypes.SLOT_NUM:
				this.main.SetSlot(data.slot);
				break;
			case this.msgTypes.PLAYER_JOIN:
				this.main.PlayerJoined(data.slot);
				break;
			case this.msgTypes.START_TYPING:
				this.main.SetTeamTyping(data.teamNumber, true);
				break;
			case this.msgTypes.STOP_TYPING:
				this.main.SetTeamTyping(data.teamNumber, false);
				break;
			case this.msgTypes.TEXT_MSG:
				this.main.ReceiveTextMessage(data);
				break;
			case this.msgTypes.SEND_STATS:
				this.main.ReceiveStats(data);
				break;
			case this.msgTypes.SESS_END:
			case this.msgTypes.VTHE:
				this.main.SetEndChatToReset("Session ending.");
				window.setTimeout(() => {
					this.main.EndSession();
				}, 3000);
				break;
			case this.msgTypes.SESS_CONT:
				this.main.SetEndChatToReset("Group elected to continue the chat.");
				window.setTimeout(() => {
					this.main.ResetEndChat();
				}, 5000);
				break;
			case this.msgTypes.VTESO:
				this.main.players = data.players;
				if(data.teamNumber !== this.main.teamNumber) {
					this.main.InitEndChatDialog(data.teamNumber, data.players);
				} else {
					this.main.UpdateEndChatDialog();
				}
				this.main.VTESVisible = true;
				break;
			case this.msgTypes.VTES:
				this.main.players = data.players;
				this.main.UpdateEndChatPlayer(data.teamNumber, data.players);
				break;
			case this.msgTypes.CUPC:
				let ci = this.main.GetConvoIndex(this.main.teamNumber, msg.msg.teamNumber);
				if(this.main.convo[ci] && this.main.convo[ci].length <= 0) {
					this.main.convo[ci] = msg.msg.convo;
				}
				break;
			case this.msgTypes.PAUSE_SESS:
				this.main.PauseSession("Chat room has been paused by your teacher.");
				break;
			case this.msgTypes.UNPAUSE_SESS:
				this.main.UnpauseSession();
				break;
			case this.msgTypes.END_SESS:
				this.main.SetEndChatToReset("Session ending.");
				window.setTimeout(() => {
					this.main.EndSession();
				}, 3000);
				break;
			case this.msgTypes.SESS_START:
				this.main.StartSession(data.players);
				break;
			case this.msgTypes.REJOIN:
				this.SendEvent({ type: this.msgTypes.REJOIN });
				break;
			case this.msgTypes.CONVO_PACK:
				this.main.SetConvoForIndex(data.convoIndex, data.convoChunks, false);
				break;
			case this.msgTypes.SINGLE_DROP:
				this.main.EndSessionWithTimer(data.teamNumber);
				break;
			case this.msgTypes.DUAL_DROP:
				this.main.TimedEndSession();
				break;
			case this.msgTypes.DROPCANCEL:
				window.setTimeout((player) => {
					this.main.SetTeam(player.slot, player);
					let tabNr = this.main.GetTeamTab(player.slot);
					if(player.tag !== "" && tabNr > 1) {
						$(`#textVizPlayer${player.tag}Name`).css("color", this.main.colors[`${player.tag}Active`]);
						$(`#tab${tabNr}`).attr("onclick", `game.scene.scenes[0].Tab${tabNr}Clicked();`);
						$(`#tab${tabNr}`).css("background-color", this.main.colors[`${player.tag}Active`]);
					}
					$("#vizFrost").hide();
					this.main.CancelEndSessionCountdownTimer();
					this.main.ResetEndChat();
				}, 500, data.player);
				break;
			default:
			case this.msgTypes.DEFAULT:
				console.log(data);
				break;
		}
	}
	SendEvent(data = {}, evtType = this.msgTypes.DEFAULT) {
		if(this.serverSocket.readyState < 2) {
			if(!data.type || data.type === undefined) {
				data.type = evtType;
			}
			this.serverSocket.send(JSON.stringify(data));
		} else {
			console.warn("Socket closed - message not sent");
		}
	}
	CancelLogin() {
		this.SendEvent({ type: this.msgTypes.CANCEL_LOGIN });
		window.setTimeout(() => {
			this.serverSocket.close(1000, "Cancel");
		}, 1000);
	}
	Logout() {
		this.serverSocket.close(1000, "Logging out.");
	}
}