class DashUser {
    constructor(connection = null) {
        this.connection = connection;
        this.connection.parent = this;
        this.status = "closed";
        this.server = null;
        this.slot = -1;
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
    OnSocketClosed(reasonCode, description) {
        console.log("OSC", reasonCode, description);
        this.parent.server?.UserSocketClosed(reasonCode, description, this.parent.slot);
        this.parent.status = "closed";
    }
    OnDataReceived(message) {
        let data = JSON.parse(message.utf8Data);
        switch(data.type) {
            case this.parent.msgTypes.INIT:
                this.parent.fullcode = data.classcode;
                this.parent.username = data.username;
                let instance = global.FindServer(data.classcode);
                console.log("Attempting registration");
                if(instance.RegisterDashboard(this.parent)) {
                    console.log("Registered on server");
                } else {
                    this.parent.Send({ type: this.parent.msgTypes.REJECTED_CONNECT });
                }
                break;
            case this.parent.msgTypes.PAUSE_SESS:
                this.parent.server?.PauseSession();
                break;
            case this.parent.msgTypes.UNPAUSE_SESS:
                this.parent.server?.UnpauseSession();
                break;
            case this.parent.msgTypes.END_SESS:
                this.parent.server?.EndSession();
                break;
            case this.parent.msgTypes.REJOIN:
                break;
            case this.parent.msgTypes.TELEM_EVENT:
                this.parent.server?.LogTelemetryEvent(this.slot, data);
                break;
            case this.parent.msgTypes.PREV_STATS:
                this.parent.server?.RequestStats(data.sessionNum);
                break;
            case this.parent.msgTypes.NEXT_STATS:
                this.parent.server?.RequestStats(data.sessionNum);
                break;
            case this.parent.msgTypes.PREV_CONVO:
                this.parent.server?.RequestConvo(data.sessionNum);
                break;
            case this.parent.msgTypes.NEXT_CONVO:
                this.parent.server?.RequestConvo(data.sessionNum);
                break;
            default:
            case this.parent.msgTypes.DEFAULT:
                break;
        }
    }
}

exports.DashUser = DashUser;