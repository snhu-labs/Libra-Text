class User {
    constructor(connection = null, fullcode = 0, username = "") {
        this.connection = connection;
        this.connection.parent = this;
        this.server = null;
        this.slot = -1;
        this.tag = "";
        this.fullcode = fullcode;
        this.username = username;
        this.votedToEndSession = null;
        this.vtesSent = false;
        this.status = "unjoined";

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
            'NEXT_CONVO': 27,
            'PREV_STATS': 28,
            'NEXT_STATS': 29
        };
    }
    BeginInit() {
        this.Send({ type: this.msgTypes['INIT'] });
    }
    Send(data) {
        this.connection.sendUTF(JSON.stringify(data));
    }
    ResetStates(status = "unjoined") {
        this.status = status;
        this.votedToEndSession = null;
        this.tag = "";
    }
    OnSocketClosed(reasonCode, description) {
        console.log("OSC", reasonCode, description);
        this.parent.ResetStates();
        this.parent.server?.UserSocketClosed(reasonCode, description, this.parent.slot);
    }
    OnDataReceived(message) {
        let data = JSON.parse(message.utf8Data);
        switch(data.type) {
            case this.parent.msgTypes.INIT:
                console.log(data);
                this.parent.fullcode = data.classcode;
                this.parent.username = data.username;
                let instance = global.FindServer(data.classcode);
                if(instance.IsAllowingConnections(this.parent)) {
                    this.parent.Send({ type: this.parent.msgTypes.SLOT_NUM, slot: this.parent.slot });
                } else {
                    this.parent.Send({ type: this.parent.msgTypes.REJECTED_CONNECT });
                }
                break;
            case this.parent.msgTypes.START_TYPING:
                this.parent.server.TypingStarted(this.parent.slot);
                break;
            case this.parent.msgTypes.STOP_TYPING:
                this.parent.server.TypingStopped(this.parent.slot);
                break;
            case this.parent.msgTypes.TEXT_MSG:
                this.parent.server.ReceiveTextMessage(this.parent.slot, data);
                break;
            case this.parent.msgTypes.VTESO:
                this.parent.votedToEndSession = true;
                this.parent.vtesSent = true;
                this.parent.server.BeginVoteToEndSession(this.parent.slot);
                break;
            case this.parent.msgTypes.VTES:
                this.parent.votedToEndSession = data.vote;
                this.parent.server.VoteToEndSession(this.parent.slot);
                break;
            case this.parent.msgTypes.REJOIN:
                this.parent.server.RejoinUser(this.parent.slot);
                break;
            case this.parent.msgTypes.TELEM_EVENT:
                this.parent.server.LogTelemetryEvent(this.parent.slot, data);
                break;
            case this.parent.msgTypes.CANCEL_LOGIN:
                this.parent.server.CancelLogin(this.parent.slot);
                break;
            default:
            case this.parent.msgTypes.DEFAULT:
                break;
        }
    }
}

exports.User = User;