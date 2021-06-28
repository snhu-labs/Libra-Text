class InstanceServer {
    constructor(fullcode = '0000') {
        this.fullcode = fullcode.toString();
        this.classcode = this.fullcode.substr(0, 2);
        this.sesscode = this.fullcode.substr(2, 2);
        this.telemetryManager = require('./telemetryManager').TelemetryManager;

        this.sessionStates = {
            'WAITING_FOR_USERS': 1,
            'IN_SESSION': 2,
            'RESULTS_MENU': 3,
            'CANCELING_JOIN': 4
        };
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

        this.currentState = this.sessionStates.WAITING_FOR_USERS;
        this.minimumUsersToStartSession = 4;
        this.minimumVotesToEndSession = 2;

        this.slotTags = ['0', 'A', 'B', 'C'];
        this.users = [{}]; // first slot filled with a null
        this.dashboard = null;

        this.sessionIncrement = 0;
        this.sessionInfo = [];
        this.sessionInfo[this.sessionIncrement] = {};
        this.sessionInfo[this.sessionIncrement].playerMsg = [];
		this.sessionInfo[this.sessionIncrement].playerMsg[0] = {
			msgToA: 0,
			msgToB: 0,
			msgToC: 0,
			numMsg: 0
		};
		this.sessionInfo[this.sessionIncrement].playerMsg[1] = {
			msgToA: 0,
			msgToB: 0,
			msgToC: 0,
			numMsg: 0
		};
		this.sessionInfo[this.sessionIncrement].playerMsg[2] = {
			msgToA: 0,
			msgToB: 0,
			msgToC: 0,
			numMsg: 0
		};
		this.sessionInfo[this.sessionIncrement].playerMsg[3] = {
			msgToA: 0,
			msgToB: 0,
			msgToC: 0,
			numMsg: 0
        };
        this.sessionInfo[this.sessionIncrement].rawConvo = [];
        this.sessionInfo[this.sessionIncrement].rawConvo[0] = [];
        this.sessionInfo[this.sessionIncrement].rawConvo[1] = [[], [], [], []];
        this.sessionInfo[this.sessionIncrement].rawConvo[2] = [[], [], [], []];
        this.sessionInfo[this.sessionIncrement].rawConvo[3] = [[], [], [], []];
        this.sessionInfo[this.sessionIncrement].fullConvo = [];

        this.numDropped = 0;
        this.sessionResetTimer = null;
        this.telemetryManager.Start(fullcode);
    }
    RegisterDashboard(dashboard) {
        console.log("RegisterDashboard");
        if(this.dashboard === null ||
            this.dashboard.status === "closed") {
            this.dashboard = dashboard;
            dashboard.server = this;
            this.dashboard.status = "connected";
            console.log("Registered Dashboard");
            return true;
        }
        return false;
    }
    IsAllowingConnections(user) {
        if(this.currentState === this.sessionStates.WAITING_FOR_USERS ||
            this.currentState === this.sessionStates.IN_SESSION) {
            if(user.server === this) {
                if(user.status === "dropped" || user.status === "unjoined") {
                    if(user.status === "dropped" && this.numDropped >= 1) {
                        user.status = "unjoined";
                        this.numDropped -= 1;
                        if(this.numDropped < 2) {
                            this.CancelResetTimer();
                        }
                    }
                    
                    console.log(`Receiving rejoin from ${user.username}`);
                    this.Register(user);
                    return true;
                }
            } else if(this.users.length < this.minimumUsersToStartSession) {
                console.log(`Allowing new connection from ${user.username}`);
                this.Register(user);
                return true;
            } else {
                console.log("IsAllowingConnections error 1");
            }
        } else {
            console.log("IsAllowingConnections error 2");
        }
        return false;
    }
    Register(user) {
        if(this.users.length < this.minimumUsersToStartSession) {
            let availSlot = this.GetFirstAvailableSlot(user);
            if(availSlot > 0) {
                user.server = this;
                user.tag = this.slotTags[availSlot];
                user.slot = availSlot;
                user.status = "joined";
                this.users[availSlot] = user;

                console.log(`Registered ${user.username} as user#${availSlot}`);
                for(let u = 1; u < this.users.length; u++) {
                    if(this.users[u] !== null) {
                        this.SendToUsers({ type: this.msgTypes.PLAYER_JOIN, slot: u, name: this.users[u].username }, []);
                        this.SendToDashboard({ type: this.msgTypes.PLAYER_JOIN, slot: u, name: this.users[u].username });
                    }
                }
            } else {
                console.log("Register error", availSlot);
            }

            if(this.CheckEnoughUsersToStart()) {
                this.StartSession();
            }
        }
    }
    ReconnectUser(user) {
        console.log("Reconnecting user", user.slot);
        user.server = this;
        user.tag = this.slotTags[user.slot];
        user.status = "joined";
        this.users[user.slot] = user;
        this.numDropped -= 1;
        if(this.numDropped < 2) {
            this.CancelResetTimer();
        }
        this.users[user.slot].Send({ type: this.msgTypes.REJOIN });
    }
    GetFirstAvailableSlot(user) {
        let firstEmpty = -1;
        if(this.users.length === 1 && 
            (this.users[0] && Object.keys(this.users[0]).length === 0)) {
            return 1;
        }
        for(let u = 1; u < this.users.length; u++) {
            if(!this.users[u] || Object.keys(this.users[u]).length === 0) {
                firstEmpty = u;
            } else if(this.users[u].username === user.username) {
                return u;
            }
        }
        if(firstEmpty === -1 && this.users.length < this.minimumUsersToStartSession) {
            firstEmpty = this.users.length;
        }
        return firstEmpty;
    }
    GetSubConvo(userSlot, convoIndex = 0, numEntries = 64) {
        let result = [];
        if(convoIndex === 0) {
            if(this.sessionInfo[this.sessionIncrement].rawConvo[0]) {
                for(let m = 0; m < this.sessionInfo[this.sessionIncrement].rawConvo[0].length; m++) {
                    result.push(this.sessionInfo[this.sessionIncrement].rawConvo[0][m]);
                }
            }
        } else {
            if(this.sessionInfo[this.sessionIncrement].rawConvo[userSlot][convoIndex]) {
                for(let m = 0; m < this.sessionInfo[this.sessionIncrement].rawConvo[userSlot][convoIndex].length; m++) {
                    result.push(this.sessionInfo[this.sessionIncrement].rawConvo[userSlot][convoIndex][m]);
                }
            }
        }
		return result;
	}
    RejoinUser(userSlot) {
        console.log("Sending rejoin info for", userSlot);
        // Ensure slot is set
        this.SendToUser(userSlot, { type: this.msgTypes.SLOT_NUM, slot: userSlot });
        // Start that user's session
        let ets = this.CheckEnoughUsersToStart();
        if(ets) {
            console.log("rejoin start");
            let players = this.GetPlayersPack();
            this.SendToUser(userSlot, { type: this.msgTypes.SESS_START, players: players });
        }
        // Send convos
        let entries = this.GetSubConvo(userSlot, 0);
        this.SendToUser(userSlot, { type: this.msgTypes.CONVO_PACK, convoIndex: 0, convoChunks: entries });
        entries = this.GetSubConvo(userSlot, 1);
        this.SendToUser(userSlot, { type: this.msgTypes.CONVO_PACK, convoIndex: 1, convoChunks: entries });
        entries = this.GetSubConvo(userSlot, 2);
        this.SendToUser(userSlot, { type: this.msgTypes.CONVO_PACK, convoIndex: 2, convoChunks: entries });
        entries = this.GetSubConvo(userSlot, 3);
        this.SendToUser(userSlot, { type: this.msgTypes.CONVO_PACK, convoIndex: 3, convoChunks: entries });
        // Send stats
        this.SendToUser(userSlot, { type: this.msgTypes.SEND_STATS, playerMsg: this.sessionInfo[this.sessionIncrement].playerMsg });

        // Let everyone know if we have enough to end any end-session countdowns
        if(ets) {
            this.SendToUsers({ type: this.msgTypes.DROPCANCEL, player: this.GetPlayer(userSlot) }, [userSlot]);
        }
    }
    SendToUser(userSlot, data) {
        if(this.users[userSlot] && this.users[userSlot].tag) {
            this.users[userSlot].Send(data);
        }
    }
    SendToUsers(data, excludeSlots = []) {
        for(let u = 1; u < this.users.length; u++) {
            if(!excludeSlots.includes(u)) {
                this.SendToUser(u, data);
            }
        }
    }
    SendOnlyToUsers(data, recipients = []) {
        for(let u = 1; u < this.users.length; u++) {
            if(recipients.includes(u) && this.users[u].tag) {
                this.SendToUser(u, data);
            }
        }
    }
    SendToDashboard(data) {
        if(this.dashboard) {
            this.dashboard.Send(data);
        }
    }
    GetPlayer(userSlot) {
        if(this.users[userSlot]) {
            return {
                name: this.users[userSlot].username,
                tag: this.users[userSlot].tag,
                slot: this.users[userSlot].slot,
                votedToEndSession: this.users[userSlot].votedToEndSession,
                vtesSent: this.users[userSlot].vtesSent
            }
        } else {
            return {};
        }
    }
    GetPlayersPack() {
        let res = [];
        for(let u = 0; u < this.users.length; u++) {
            res[u] = this.GetPlayer(u);
        }
        return res;
    }
    CheckEnoughUsersToStart() {
        if((this.currentState === this.sessionStates.WAITING_FOR_USERS ||
            this.currentState === this.sessionStates.IN_SESSION) && 
            this.users.length === this.minimumUsersToStartSession) {
                return true;
        }
        return false;
    }
    StartSession() {
        console.log("Starting Operations");
        this.currentState = this.sessionStates.IN_SESSION;
        let players = this.GetPlayersPack();
        this.SendToUsers({ type: this.msgTypes.SESS_START, players: players }, []);
        this.SendToDashboard({ type: this.msgTypes.SESS_START, players: players, sessionNum: this.sessionIncrement });
    }
    TypingStarted(userSlot) {
        this.SendToUsers({ type: this.msgTypes.START_TYPING, teamNumber: userSlot }, [userSlot]);
    }
    TypingStopped(userSlot) {
        this.SendToUsers({ type: this.msgTypes.STOP_TYPING, teamNumber: userSlot }, [userSlot]);
    }
    ReceiveTextMessage(userSlot, data) {
        this.SetSendStats(data);
        this.sessionInfo[this.sessionIncrement].fullConvo.push(data);
        if(this.sessionInfo[this.sessionIncrement].rawConvo[data.teamNumber]) {
            if(data.toTeam === 0) { // General channel
                this.sessionInfo[this.sessionIncrement].rawConvo[0].push(data);
                this.SendToUsers(data, []);
            } else { // Direct message
                this.sessionInfo[this.sessionIncrement].rawConvo[data.teamNumber][data.toTeam].push(data);
                this.sessionInfo[this.sessionIncrement].rawConvo[data.toTeam][data.teamNumber].push(data);
                this.SendOnlyToUsers(data, [data.teamNumber, data.toTeam]);
            }

            this.SendToUsers({ type: this.msgTypes.SEND_STATS, playerMsg: this.sessionInfo[this.sessionIncrement].playerMsg }, []);
            data.sessionNum = this.sessionIncrement;
            this.SendToDashboard(data);
            this.SendToDashboard({ type: this.msgTypes.SEND_STATS, sessionNum: this.sessionIncrement, playerMsg: this.sessionInfo[this.sessionIncrement].playerMsg });

        } else {
            console.error(`Error trying to move message for convo to/from: ${data.toTeam}/${data.teamNumber}`);
        }
    }
    RequestStats(sessionNum) {
        if(sessionNum <= this.sessionIncrement && this.sessionInfo[sessionNum].playerMsg) {
            this.SendToDashboard({ type: this.msgTypes.SEND_STATS, sessionNum: sessionNum, playerMsg: this.sessionInfo[sessionNum].playerMsg });
        }
    }
    RequestConvo(sessionNum) {
        if(sessionNum <= this.sessionIncrement && this.sessionInfo[sessionNum].fullConvo) {
            this.SendToDashboard({ type: this.msgTypes.CONVO_PACK, sessionNum: sessionNum, convoIndex: 0, convoChunks: this.sessionInfo[sessionNum].fullConvo });
        }
    }
    SetSendStats(msg) {
		switch (msg.toTeam) {
			case 1:
				this.sessionInfo[this.sessionIncrement].playerMsg[msg.teamNumber].msgToA += 1;
				break;
			case 2:
				this.sessionInfo[this.sessionIncrement].playerMsg[msg.teamNumber].msgToB += 1;
				break;
			case 3:
				this.sessionInfo[this.sessionIncrement].playerMsg[msg.teamNumber].msgToC += 1;
				break;
			case 0:
				if (msg.teamNumber !== 1) 
                    this.sessionInfo[this.sessionIncrement].playerMsg[msg.teamNumber].msgToA += 1;
				if (msg.teamNumber !== 2)
                    this.sessionInfo[this.sessionIncrement].playerMsg[msg.teamNumber].msgToB += 1;
				if (msg.teamNumber !== 3)
                    this.sessionInfo[this.sessionIncrement].playerMsg[msg.teamNumber].msgToC += 1;
				break;
			default:
				break;
		}
		switch(msg.teamNumber) {
			case 1:
				if(this.sessionInfo[this.sessionIncrement].playerMsg[msg.toTeam])
                    this.sessionInfo[this.sessionIncrement].playerMsg[msg.toTeam].msgFromA += 1;
				break;
			case 2:
				if(this.sessionInfo[this.sessionIncrement].playerMsg[msg.toTeam])
                    this.sessionInfo[this.sessionIncrement].playerMsg[msg.toTeam].msgFromB += 1;
				break;
			case 3:
				if(this.sessionInfo[this.sessionIncrement].playerMsg[msg.toTeam])
                    this.sessionInfo[this.sessionIncrement].playerMsg[msg.toTeam].msgFromC += 1;
				break;
			default:
				break;
		}
		this.sessionInfo[this.sessionIncrement].playerMsg[msg.teamNumber].numMsg += 1;
    }
    BeginVoteToEndSession(userSlot) {
        this.SendToUsers({ type: this.msgTypes.VTESO, teamNumber: userSlot, players: this.GetPlayersPack() }, []);
    }
    VoteToEndSession(userSlot) {
        if(this.currentState === this.sessionStates.IN_SESSION) {
            let noes = 0;
            let vtes = 0;
            for(let u = 1; u < this.users.length; u++) {
                if(this.users[u].votedToEndSession === true) {
                    vtes++;
                } else if(this.users[u].votedToEndSession === false) {
                    noes++;
                }
            }
            if((vtes >= this.minimumVotesToEndSession ||
                vtes >= this.users.length) && noes === 0) {
                this.SendToUsers({ type: this.msgTypes.SESS_END }, []);
                this.SendToDashboard({ type: this.msgTypes.SESS_END });
                setTimeout(() => { this.SessionEndedByVote(); }, 3000);
            } else if(noes > 0) {
                this.SendToUsers({ type: this.msgTypes.SESS_CONT }, []);
                for(let u = 1; u < this.users.length; u++) {
                    this.users[u].vtes = false;
                    this.users[u].vtesSent = false;
                    this.users[u].votedToEndSession = null;
                }
            } else {
                this.SendToUsers({ type: this.msgTypes.VTES, teamNumber: userSlot, players: this.GetPlayersPack() }, []);
            }
        }
    }
    PauseSession() {
        this.SendToUsers({ type: this.msgTypes.PAUSE_SESS }, []);
        this.telemetryManager.Log(0, { eventName: "Teacher", eventType: "Session", actionType: "TBPause", actionString: {}}, this.msgTypes.TELEM_EVENT);
    }
    UnpauseSession() {
        this.SendToUsers({ type: this.msgTypes.UNPAUSE_SESS }, []);
        this.telemetryManager.Log(0, { eventName: "Teacher", eventType: "Session", actionType: "TBUnpause", actionString: {}}, this.msgTypes.TELEM_EVENT);
    }
    EndSession() {
        this.SendToUsers({ type: this.msgTypes.END_SESS }, []);
        this.telemetryManager.Log(0, { eventName: "Teacher", eventType: "Session", actionType: "TBEnd", actionString: {}}, this.msgTypes.TELEM_EVENT);

        this.DelayedReset();
    }
    SessionEndedByVote() {
        this.currentState = this.sessionStates.RESULTS_MENU;
        this.telemetryManager.Log(0, { eventName: "Player", eventType: "Session", actionType: "End", actionString: {}}, this.msgTypes.TELEM_EVENT);

        this.DelayedReset();
    }
    CancelResetTimer() {
        if(this.sessionResetTimer) {
            clearTimeout(this.sessionResetTimer);
            this.sessionResetTimer = null;
        }
    }
    DelayedReset() {
        this.sessionResetTimer = setTimeout(() => {
            this.ResetInstance();
        }, 3000);
    }
    ResetInstance() {
        console.log(`--- Cycling Server #${this.fullcode} Instance ---`);
        if(this.dashboard) {
            this.SendToDashboard({ type: this.msgTypes.SESS_END });
        }
        this.users = [{}]; 

        this.sessionIncrement++;
        this.sessionInfo[this.sessionIncrement] = {};
        this.sessionInfo[this.sessionIncrement].playerMsg = [];
		this.sessionInfo[this.sessionIncrement].playerMsg[0] = {
			msgToA: 0,
			msgToB: 0,
			msgToC: 0,
			numMsg: 0
		};
		this.sessionInfo[this.sessionIncrement].playerMsg[1] = {
			msgToA: 0,
			msgToB: 0,
			msgToC: 0,
			numMsg: 0
		};
		this.sessionInfo[this.sessionIncrement].playerMsg[2] = {
			msgToA: 0,
			msgToB: 0,
			msgToC: 0,
			numMsg: 0
		};
		this.sessionInfo[this.sessionIncrement].playerMsg[3] = {
			msgToA: 0,
			msgToB: 0,
			msgToC: 0,
			numMsg: 0
        };
        this.sessionInfo[this.sessionIncrement].rawConvo = [];
        this.sessionInfo[this.sessionIncrement].rawConvo[0] = [];
        this.sessionInfo[this.sessionIncrement].rawConvo[1] = [[], [], [], []];
        this.sessionInfo[this.sessionIncrement].rawConvo[2] = [[], [], [], []];
        this.sessionInfo[this.sessionIncrement].rawConvo[3] = [[], [], [], []];
        this.sessionInfo[this.sessionIncrement].fullConvo = [];

        this.telemetryManager.FlushLog();
        this.telemetryManager.StopLogFlushing();
        this.telemetryManager.Reset();

        this.currentState = this.sessionStates.WAITING_FOR_USERS;

        console.log(`--- Server #${this.fullcode} Instance Cycled ---`);
    }
    LogTelemetryEvent(userSlot, telemData) {
        this.telemetryManager.Log(userSlot, telemData);
    }
    CancelLogin(userSlot) {
        if(this.users[userSlot] && this.users[userSlot] !== undefined) {
            this.users[userSlot]?.ResetStates("canceling");
            this.users[userSlot] = {};
        }
    }
    HasUser(user) {
        for(let u = 0; u < this.users.length; u++) {
            if(this.users[u].username === user.username &&
                this.users[u].fullcode === user.fullcode) {
                    return true;
                }
        }

        return false;
    }
    UserSocketClosed(reasonCode, description, userSlot) {
        if(this.currentState === this.sessionStates.IN_SESSION &&
            (this.users[userSlot]?.status !== "canceling" && 
            (reasonCode === 1001 ||
            reasonCode === 1006))) {
            console.log(`User#${userSlot} dropped: ${reasonCode}.`);
            if(this.users[userSlot] !== null &&
                this.users[userSlot] !== undefined) {
                this.users[userSlot].status = "dropped";
            }
            this.numDropped = 0;
            let excludedSlots = [];
            for(let u = 0; u < this.users.length; u++) {
                if(this.users[u].status === "dropped") {
                    this.numDropped++;
                    excludedSlots.push(u);
                }
            }
            if(this.numDropped === 1) {
                this.SendToUsers({ type: this.msgTypes.SINGLE_DROP, teamNumber: userSlot }, excludedSlots);
            } else if(this.numDropped >= 2) {
                this.SendToUsers({ type: this.msgTypes.DUAL_DROP, teamNumber: userSlot }, excludedSlots);
                this.DelayedReset();
            } 
        } else {
            console.log(`User#${userSlot} socket closed with ${reasonCode}: ${description}.`);
        }
    }
    DashboardSocketClosed(reasonCode, description) {
        if(this.dashboard !== null &&
            this.dashboard !== undefined) {
                this.dashboard.status = "closed";
        }
    }
}

exports.InstanceServer = InstanceServer;