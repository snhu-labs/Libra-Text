class Main extends Phaser.Scene {
    constructor() {
        super('Main');

		this.notificationsActivated = false;
		this.classCode = 0;
		this.dt = new Date();
		this.startTime = 0;

		this.teamNumber = -1;
		this.players = [null, null, null, null];
		this.vtesSent = false;
		this.VTESVisible = false;
		this.totalMsgs = 0;
		this.playerMsg = [];
		this.unreadFromA = 0;
		this.unreadFromB = 0;
		this.unreadFromC = 0;
		this.unreadFromAll = 0;
		this.playerMsg[0] = {
			msgToA: 0,
			msgToB: 0,
			msgToC: 0,
			numMsg: 0
		};
		this.playerMsg[1] = {
			msgToA: 0,
			msgToB: 0,
			msgToC: 0,
			numMsg: 0
		};
		this.playerMsg[2] = {
			msgToA: 0,
			msgToB: 0,
			msgToC: 0,
			numMsg: 0
		};
		this.playerMsg[3] = {
			msgToA: 0,
			msgToB: 0,
			msgToC: 0,
			numMsg: 0
		};
		this.textVizPct = {
			A: 0,
			B: 0,
			C: 0
		};

        this.networkManager = null;
        this.appContent = null;

        this.maxArcWidth = 20;
        this.maxTriWidth = 15;
		this.colors = {
			AllActive: '#BFBFBF',
			All: '#AAAAAA',
			AActive: '#FFD71B',
			A: '#BCAB5C',
			B: '#5B9CBB',
			BActive: '#18B4FE',
			C: '#CD8A87',
			CActive: '#FE6057',
			AllDull: '#848484',
			ADull: '#626649',
			BDull: '#395870',
			CDull: '#565363'
		};
		this.minEdgeWidth = 1;
		this.maxEdgeWidth = 20;
        this.edgeWidths = {
			AB: this.minEdgeWidth,
			AC: this.minEdgeWidth,
			BA: this.minEdgeWidth,
			BC: this.minEdgeWidth,
			CA: this.minEdgeWidth,
			CB: this.minEdgeWidth
		};

		this.convo = [[], [], [], []];
		this.rawConvo = [[], [], [], []];
		this.currentTab = 1;
		this.msgNum = 0;
		this.typeTimer = null;
		this.remoteTypeTimer = [null, null, null, null];
		this.lastTypeLen = 0;
		this.tab2Team = 2;
		this.tab3Team = 3;
		this.tab2Label = "B";
		this.tab3Label = "C";
		this.tab2Style = 'playerBTabStyle';
		this.tab3Style = 'playerCTabStyle';
		this.tab2text = "0";
		this.tab3text = "0";
		this.playerAName = "Player A";
		this.playerBName = "Player B";
		this.playerCName = "Player C";

		this.emotes = ['EmoteThanks', 'EmoteNP', 'EmoteThumbsUp', 'EmoteThumbsDown', 'EmoteIDK', 'EmoteHappy', 'EmoteSad'];
		this.emoteFN = ['thanks', 'noproblem', 'thumbsup', 'thumbsdown', 'idk', 'happy', 'sad'];

		this.playerTags = ['', 'A', 'B', 'C'];

		this.sessionStates = {
			'titleMenu': 0,
			'waitingForPlayers': 1,
			'inSession': 2,
			'resultsMenu': 3,
			'canceling': 4
		};
		this.currentState = this.sessionStates['titleMenu'];
		this.dropDelayTimer = 60;
		this.endSessionCountdownTimer = null;
		this.endSessionTimer = null;
		this.notificationTimer = null;
		this.notificationTabInterval = 1500;
		this.docTitle = "Libra";
		this.notificationTitle = "You Have A Message!";
		this.pauseMessage = "";
		
		this.safeTextList = [];
		this.safeTextList['\uE900'] = "emote:(IDK)";
		this.safeTextList['\uE902'] = "emote:(OK)";
		this.safeTextList['\uE903'] = "emote:(SAD)";
		this.safeTextList['\uE904'] = "emote:(THANKS)";
		this.safeTextList['\uE905'] = "emote:(THUMBS-DOWN)";
		this.safeTextList['\uE906'] = "emote:(THUMBS-UP)";
		this.safeTextList['\uE907'] = "emote:(HAPPY)";
        this.safeTextList[','] = ";";

		this.mode = "wide";
		this.modeSwitchEnabled = true;
		this.menu = "";
		this.iecdFrom = 0;
		this.endSessionTimerTN = -1;
	}
    preload() {
		this.load.html('appContentWide', "js/content.html");
		this.load.html('appContentThin', "js/contentThin.html");
		this.load.audio('cowbell', "audio/CowbellLoud.mp3");
    }
    create() {
		this.appContent = this.add.dom(0, 0).createFromCache('appContentWide');
		this.networkManager = new NetworkManager(this);
		ValidateGameSize();
		this.notificationSound = this.sound.add('cowbell');

		this.GoToTitleScreen();
	}
	SetThinMode() {
		if(this.modeSwitchEnabled === true) {
			this.mode = "thin";
			currentHeightMult = thinHeightMult;
			this.appContent.destroy();
			game.scale.scaleMode = Phaser.Scale.NONE;
			game.scale.autoCenter = Phaser.Scale.NO_CENTER;
			game.scale.setGameSize(360, 875);
			this.appContent = this.add.dom(0, 0).createFromCache('appContentThin');
			this.SetTeamTabs();
			this.GoToMainScreen();
			this.RedrawNotification();
			this.UpdateTextViz();
			ValidateGameSize();

			if(this.menu === "UECP") {
				this.UpdateEndChatDialog();
			} else if(this.menu === "IECD") {
				this.InitEndChatDialog(this.iecdFrom, this.players);
			} else if(this.menu === "STM") {
				if(this.endSessionTimerTN > -1) {
					this.ShowTimerMessage(this.endSessionTimerTN, 59, false);
				}
			} else if(this.menu === "PAUSE") {
				this.PauseSession(this.pauseMessage);
			}
		}
	}
	SetWideMode() {
		if(this.modeSwitchEnabled === true) {
			this.mode = "wide";
			currentHeightMult = wideHeightMult;
			this.appContent.destroy();
			game.scale.scaleMode = Phaser.Scale.WIDTH_CONTROLS_HEIGHT;
			game.scale.autoCenter = Phaser.Scale.CENTER_HORIZONTALLY;
			game.scale.setGameSize(1275, 900);
			this.appContent = this.add.dom(0, 0).createFromCache('appContentWide');
			this.SetTeamTabs();
			this.GoToMainScreen();
			this.RedrawNotification();
			this.UpdateTextViz();
			ValidateGameSize();

			if(this.menu === "UECP") {
				this.UpdateEndChatDialog();
			} else if(this.menu === "IECD") {
				this.InitEndChatDialog(this.iecdFrom, this.players);
			} else if(this.menu === "STM") {
				if(this.endSessionTimerTN > -1) {
					this.ShowTimerMessage(this.endSessionTimerTN, 59, false);
				}
			} else if(this.menu === "PAUSE") {
				this.PauseSession(this.pauseMessage);
			}
		}
	}
	IsCurrentState(state) {
		return this.currentState === this.sessionStates[state];
	}
	SetCurrentState(state) {
		if(this.sessionStates[state]) {
			this.currentState = this.sessionStates[state];
		}
	}
	TruncateText(text, length = 28) {
		if(!text ||
			text.trim() === "" || 
			text.length <= length) {
			return text;
		} else {
			return text.substring(0, length-1) + "...";
		}
	}
	GetPlayerName(teamNumber = 1, len = 28) {
		return this.TruncateText(this.players[teamNumber].name, len);
	}
	DisconnectToTitleScreen() {
		if(this.IsCurrentState('waitingForPlayers') ||
		this.IsCurrentState('inSession')) {
			this.SetCurrentState('titleMenu');
			this.networkManager = new NetworkManager(this);
			$("#titleStartRoomBtn").show();
			$("#titleCancelJoinBtn").hide();
			$("#titleWaitingText").hide();
			$("#titlePlayerAJoined").hide();
			$("#titlePlayerBJoined").hide();
			$("#titlePlayerCJoined").hide();
			$("#titleTriangle").attr("class", "libraTitleTriangleReady");

			$("#titleUsernameInputBox").val('');
			$("#titleClasscodeInputBox").val('');
	
			this.GoToTitleScreen();
		}
	}
	GoToTitleScreen() {
        $("#titleMenu").css('display', 'block');
        $("#mainFrame").css('display', 'none');
		$("#resultsMenu").css('display', 'none');
		$("#reportDownloadModal").css('display', 'none');
		this.SetCurrentState('titleMenu');

		let cc = GetQueryVariable("roomCode");
		if(cc) cc = cc.replace(/%20/g, " ");
		let n = GetQueryVariable("name");
		if(n) n = n.replace(/%20/g, " ");

		if(cc && cc.trim() !== "" && n && n.trim() !== "") {
			$("#titleUsernameInputBox").val(n);
			$("#titleClasscodeInputBox").val(cc);
			this.ValidateTitleInput();
		}
	}
    GoToMainScreen() {
        $("#titleMenu").css('display', 'none');
        $("#mainFrame").css('display', 'block');
		$("#resultsMenu").css('display', 'none');
		$("#reportDownloadModal").css('display', 'none');
    }
    GoToResultsScreen() {
        $("#titleMenu").css('display', 'none');
        $("#mainFrame").css('display', 'block');
		$("#resultsMenu").css('display', 'block');
		$("#reportDownloadModal").css('display', 'none');
		this.networkManager.SendEvent({ eventName: "Player", eventType: "Session", actionType: "ChatEnd", actionString: {}}, this.networkManager.msgTypes.TELEM_EVENT);

		this.UpdateFinalResultsViz();
		this.SetCurrentState('resultsMenu');
		this.modeSwitchEnabled = false;
		$("#slimModeBtn").attr('onclick', '');
		$("#notificationBtn").attr('onclick', '');
		$("#tab1").attr('onclick', '');
		$("#tab2").attr('onclick', '');
		$("#tab3").attr('onclick', '');
		$("#endChatBtn").attr('onclick', '');
		$("#emoteMenuBtn").attr('onclick', '');
		$("#sendBtn").attr('onclick', '');
	}
	GoToReportDownloadScreen() {
        $("#titleMenu").css('display', 'none');
        $("#mainFrame").css('display', 'block');
		$("#reportDownloadModal").css('display', 'block');
		$("#resultsContinueBtn").hide();

		let h = `<!DOCTYPE html>
		<html lang="en">
			<head>
				<meta http-equiv="content-type" content="text/html; charset=utf-8" />
				<meta charset="utf-8" />
				<title>Libra Text Summary Report</title>
				<meta http-equiv="pragma" content="no-cache" />
				<style>
		.resultsMenu {
			position: absolute; 
			left: 170px;
			top: 42px;
			width: 935px; 
			height: 806px; 
			background-color: #2f4156;
			border-radius: 5px;
			border: 3px solid #8A8D91;
			box-shadow: -8.5px 8.5px 0 0 rgba(18, 77, 107, 0.25);
		}
		.resultsFinalChatText {
			position: absolute;
			top: 21px;
			width: 100%;
			height: 21px;
			opacity: 0.75; 
			font-family: MontserratSemiBold;
			font-size: 24px;
			font-weight: 600;
			text-align: center;
			color: rgba(255, 255, 255, 0.75);
			line-height: 21px;
		}
		.finalContinueBtn {
			position: absolute;
			width: 214px;
			height: 32px;
			top: 15px;
			left: 701px;
			opacity: 1;
			border: 3px solid white;
			border-radius: 5px;
			color: white;
			font-family: MontserratSemiBold;
			font-size: 20.5px;
			text-align: center;
			line-height: 32px;
		}
		.directionOfChat {
			position: absolute; 
			left: 45px; 
			top: 82px; 
			width: 100%;
			font-family: MontserratSemiBold; 
			font-weight: 600;
			font-size: 20px; 
			color: rgba(255, 255, 255, 0.25); 
			z-index: 100;
			line-height: 20px;
		}
		.finalPlayerAName {
			position: absolute;
			left: 30px;
			top: 159px;
			z-index: 100;
			font-family: MontserratSemiBold;
			font-size: 24px;
			color: #ffc300;
			width: 280px;
			text-align: center;
		}
		.finalPlayerBName {
			position: absolute;
			left: 630px;
			top: 159px;
			z-index: 100;
			font-family: MontserratSemiBold;
			font-size: 24px;
			color: #19b4ff;
			width: 280px;
			text-align: center;
		}
		.finalPlayerCName {
			position: absolute;
			left: 330px;
			top: 567px;
			z-index: 100;
			font-family: MontserratSemiBold;
			font-size: 24px;
			color: #ff5f57;
			width: 280px;
			text-align: center;
		}
		.vizSVGHolder {
			position: absolute; 
			left: 100px; 
			top: 165px; 
			width: 400px; 
			height: 400px;
		}
		.finalSVGHolder {
			position: absolute; 
			left: 20px; 
			top: 63px; 
			width: 895px; 
			height: 546px; 
			background-color: #253548; 
			border-radius: 10px;
		}
		.finalHorizontalBarLabels {
			position: absolute;
			display: inline-flex;
			left: 27px;
			top: 55px;
			width: 841px;
			height: 24px;  
		}
		.finalHorizontalLabelPlayerA {
			width: 33.3%;
			color: #ffc300;
			font-family: MontserratBold;
			font-size: 16px;
			text-align: center;
			line-height: 24px;
		}
		.finalHorizontalLabelPlayerB {
			width: 33.4%;
			color: #19b4ff;
			font-family: MontserratBold;
			font-size: 16px;
			text-align: center;
			line-height: 24px;
		}
		.finalHorizontalLabelPlayerC {
			width: 33.3%;
			color: #ff5f57;
			font-family: MontserratBold;
			font-size: 16px;
			text-align: center;
			line-height: 24px;
		}
		.finalHorizontalVizBarHolder {
			position: absolute;
			display: inline-flex;
			left: 27px;
			top: 81px;
			width: 841px;
			height: 48px;
			border-radius: 5px;
		}
		.finalHorizontalVizPlayerA {
			width: 33.3%;
			background-color: #ffc300;
			border-top-left-radius: 5px;
			border-bottom-left-radius: 5px;
			color: #2f4156;
			font-family: MontserratBold;
			font-size: 16px;
			text-align: center;
			line-height: 48px;
		}
		.finalHorizontalVizPlayerB {
			width: 33.4%;
			background-color: #19b4ff;
			color: #2f4156;
			font-family: MontserratBold;
			font-size: 16px;
			text-align: center;
			line-height: 48px;
		}
		.finalHorizontalVizPlayerC {
			width: 33.3%;
			background-color: #ff5f57;
			border-top-right-radius: 5px;
			border-bottom-right-radius: 5px;
			color: #2f4156;
			font-family: MontserratBold;
			font-size: 16px;
			text-align: center;
			line-height: 48px;
		}
		.finalTextBarVizHolder {
			background-color: #253548;
			border-radius: 10px;
			position: absolute;
			left: 20px;
			top: 627px;
			width: 895px;
			height: 159px;
		}
		.numberOfMessages {
			position: absolute;
			left: 22px;
			top: 19px;
			width: 100%;
			font-family: MontserratSemiBold;
			font-size: 20px;
			color: rgba(255, 255, 255, 0.25);
			line-height: 20px;
		}
		</style>
		</head>
		<body>`;

		if(this.mode === "thin") {
			$("#finalSVGTransform").attr("transform", "scale(0.9) translate(165, -60)");
		}

		let resultsMenu = $('<div>').append($('#resultsMenu').clone()).html();
		h += `${resultsMenu}</body></html>`;
		let blob = new Blob([h], { type: "text/html" });
		let link = document.createElement("a");
		link.download = `report-${this.GetReportName()}.html`;
		link.href = URL.createObjectURL(blob);
		console.log(link.href); // this line should be here
		link.click();

		if(this.mode === "thin") {
			$("#finalSVGTransform").attr("transform", "scale(0.5) translate(0, 70)");
		}

		window.setTimeout(() => {
			window.onbeforeunload = "";
			let oldref = window.location.href.split("?"[0])[0];
			window.location.href = oldref + "?&roomCode=" + this.classCode + "&name=" + this.players[this.teamNumber].name;
		}, 3500);

		$("#resultsMenu").css('display', 'none');
	}
	GetReportName() {
		return this.classCode + "_" + this.startTime;
	}
	ValidateTitleInput(e) {
		if(e !== null && e !== undefined && e.keyCode === 13) {
			this.LogIn();
		}
		this.classCode = $("#titleClasscodeInputBox").val().trim();
		if (this.classCode.length > 4) {
			$("#titleClasscodeInputBox").val($("#titleClasscodeInputBox").val().trim().slice(0,4)); 
		}
		if($("#titleUsernameInputBox").val().trim() !== "" && 
			this.classCode !== "" &&
			this.classCode.length === 4 &&
			!Number.isNaN(this.classCode)) {
				$("#titleTriangle").removeClass('libraTitleTriangleNormal');
				$("#titleTriangle").addClass('libraTitleTriangleReady');
				$("#titleClasscodeInputBox").removeClass('libraTitleClasscodeInputNormal');
				$("#titleClasscodeInputBox").addClass('libraTitleClasscodeInputReady');
				$("#titleStartRoomBtn").removeClass('libraStartRoomBtnNormal');
				$("#titleStartRoomBtn").addClass('libraStartRoomBtnReady');
		} else {
			$("#titleTriangle").removeClass('libraTitleTriangleReady');
			$("#titleTriangle").addClass('libraTitleTriangleNormal');
			$("#titleClasscodeInputBox").removeClass('libraTitleClasscodeInputReady');
			$("#titleClasscodeInputBox").addClass('libraTitleClasscodeInputNormal');
			$("#titleStartRoomBtn").removeClass('libraStartRoomBtnReady');
			$("#titleStartRoomBtn").addClass('libraStartRoomBtnNormal');
		}
	}
	UnsetTeam(teamNumber) {
		switch(this.teamNumber) {
			case 1:
				this.players[1] = null;
				this.playerAName = "";
				$("#textVizPlayerAName").text("");
				break;
			case 2:
				this.players[2] = null;
				this.playerBName = "";
				$("#textVizPlayerBName").text("");
				break;
			case 3:
				this.players[3] = null;
				this.playerCName = "";
				$("#textVizPlayerCName").text("");
				break;
		}
		this.teamNumber = -1;
	}
	SetTeam(playerSlot, netPlayer) {
		switch(playerSlot) {
			case 1:
				this.players[1] = netPlayer;
				this.playerAName = netPlayer.name;
				$("#textVizPlayerAName").text(this.TruncateText(this.playerAName));
				$("#textVizPlayerAName").css("color", this.colors[`AActive`]);
				break;
			case 2:
				this.players[2] = netPlayer;
				this.playerBName = netPlayer.name;
				$("#textVizPlayerBName").text(this.TruncateText(this.playerBName));
				$("#textVizPlayerBName").css("color", this.colors[`BActive`]);
				break;
			case 3:
				this.players[3] = netPlayer;
				this.playerCName = netPlayer.name;
				$("#textVizPlayerCName").text(this.TruncateText(this.playerCName));
				$("#textVizPlayerCName").css("color", this.colors[`CActive`]);
				break;
			default:
				break;
		}
	}
	CancelLogin(sendNetMsg = true) {
		if(sendNetMsg === true) {
			this.SetCurrentState('canceling');
			this.networkManager.CancelLogin();
		}
		this.UnsetTeam(this.teamNumber);
		window.setTimeout(() => {
			$("#titleStartRoomBtn").show();
			$("#titleCancelJoinBtn").hide();
			$("#titleWaitingText").hide();
			$("#titlePlayerAJoined").hide();
			$("#titlePlayerBJoined").hide();
			$("#titlePlayerCJoined").hide();
			$("#titleTriangle").attr("class", "libraTitleTriangleReady");

			this.SetCurrentState('titleMenu');
		}, 2000);
	}
	LogIn() {
		console.warn("LOGIN");
		this.classCode = $("#titleClasscodeInputBox").val().trim();
		if($("#titleUsernameInputBox").val().trim() !== "" && 
		this.classCode !== "" &&
		this.classCode.length === 4 &&
		!Number.isNaN(this.classCode)) {
			$("#titleStartRoomBtn").hide();
			$("#titleCancelJoinBtn").show();
			$("#titleWaitingText").show();
			$("#titlePlayerAJoined").show();
			$("#titlePlayerBJoined").show();
			$("#titlePlayerCJoined").show();

			this.networkManager.Initialize(this.classCode, $("#titleUsernameInputBox").val().trim(), () => {
				console.trace("connected");
			});
		}
	}
	SetSlot(slot) {
		this.teamNumber = slot;
	}
	PlayerJoined(slot) {
		$(`#titlePlayer${this.playerTags[slot]}Joined`).attr("class", `player${this.playerTags[slot]}Dot`);
		$("#titleTriangle").attr("class", `libraTitleTriangle${this.playerTags[slot]}`);
	}
	PlayerUnjoined(player) {
		$(`#titlePlayer${player}Joined`).attr("class", `playerDotUnjoined`);
		if(this.playerTags[this.teamNumber] === player) {
			$("#titleTriangle").attr("class", "libraTitleTriangleReady");
		}
	}
	StartSession(playersInfo) {
			this.players = [];
			for(let p = 1; p < playersInfo.length; p++) {
				this.players[p] = {};
				this.players[p] = playersInfo[p];
			}

			let aLabel, bLabel, cLabel;
			this.players[1] ? aLabel = this.GetPlayerName(1) : aLabel = "";
			this.players[2] ? bLabel = this.GetPlayerName(2) : bLabel = "";
			this.players[3] ? cLabel = this.GetPlayerName(3) : cLabel = "";

			$("#textVizPlayerAName").text(aLabel);
			$("#finalPlayerA").text(aLabel);
			if(aLabel.length >= 18) {
				$("#textVizPlayerAName").css("font-size", "16px");
				$("#finalPlayerA").css("font-size", "16px");
			}
			$("#textVizPlayerBName").text(bLabel);
			$("#finalPlayerB").text(bLabel);
			if(bLabel.length >= 18) {
				$("#textVizPlayerBName").css("font-size", "16px");
				$("#finalPlayerB").css("font-size", "16px");
			}
			$("#textVizPlayerCName").text(cLabel);
			$("#finalPlayerC").text(cLabel);
			if(cLabel.length >= 18) {
				$("#textVizPlayerCName").css("font-size", "16px");
				$("#finalPlayerC").css("font-size", "16px");
			}
			
			this.SetTeamTabs();
			this.GoToMainScreen();

			this.startTime = this.GetTimestamp();

			this.ShowConvo(0);
			this.networkManager.SendEvent({ eventName: "Session", eventType: "Session", actionType: "ChatStart", actionString: { PlayerA: aLabel, PlayerB: bLabel, PlayerC: cLabel }}, this.networkManager.msgTypes.TELEM_EVENT);
	}
	GetTimestamp() {
		this.dt = new Date();
		let month = this.dt.getMonth() + 1;
		return "d" + month + "-" + this.dt.getDate() + "-" + this.dt.getFullYear() + "t" + this.dt.getHours() + "-" + this.dt.getMinutes() + "-" + this.dt.getSeconds() + "-" + this.dt.getMilliseconds();
	}
	CalculateEdgeWidths() {
		this.totalMsgs = 0;
		if (this.playerMsg && this.playerMsg.length > 0) {
			// Add all messages from/to each player
			this.totalMsgs += this.playerMsg[1].msgToB;
			this.totalMsgs += this.playerMsg[1].msgToC;
			this.totalMsgs += this.playerMsg[2].msgToA;
			this.totalMsgs += this.playerMsg[2].msgToC;
			this.totalMsgs += this.playerMsg[3].msgToA;
			this.totalMsgs += this.playerMsg[3].msgToB;
			if (this.totalMsgs > 0) {
				// Divide 100 by that total to get % rep of each message
				let msgPct = 1 / this.totalMsgs;
				// Multiply each arc # by %
				this.edgeWidths["AB"] = Math.round(this.minEdgeWidth + ((this.maxEdgeWidth - this.minEdgeWidth) * (this.playerMsg[1].msgToB * msgPct)));
				this.edgeWidths["AC"] = Math.round(this.minEdgeWidth + ((this.maxEdgeWidth - this.minEdgeWidth) * (this.playerMsg[1].msgToC * msgPct)));
				this.edgeWidths["BA"] = Math.round(this.minEdgeWidth + ((this.maxEdgeWidth - this.minEdgeWidth) * (this.playerMsg[2].msgToA * msgPct)));
				this.edgeWidths["BC"] = Math.round(this.minEdgeWidth + ((this.maxEdgeWidth - this.minEdgeWidth) * (this.playerMsg[2].msgToC * msgPct)));
				this.edgeWidths["CA"] = Math.round(this.minEdgeWidth + ((this.maxEdgeWidth - this.minEdgeWidth) * (this.playerMsg[3].msgToA * msgPct)));
				this.edgeWidths["CB"] = Math.round(this.minEdgeWidth + ((this.maxEdgeWidth - this.minEdgeWidth) * (this.playerMsg[3].msgToB * msgPct)));
				this.textVizPct["A"] = ((this.playerMsg[1].msgToB + this.playerMsg[1].msgToC) * msgPct * 100).toFixed(1);
				this.textVizPct["B"] = ((this.playerMsg[2].msgToA + this.playerMsg[2].msgToC) * msgPct * 100).toFixed(1);
				this.textVizPct["C"] = ((this.playerMsg[3].msgToA + this.playerMsg[3].msgToB) * msgPct * 100).toFixed(1);
			} else {
				this.edgeWidths["AB"] = this.minEdgeWidth;
				this.edgeWidths["AC"] = this.minEdgeWidth;
				this.edgeWidths["BA"] = this.minEdgeWidth;
				this.edgeWidths["BC"] = this.minEdgeWidth;
				this.edgeWidths["CA"] = this.minEdgeWidth;
				this.edgeWidths["CB"] = this.minEdgeWidth;
				this.textVizPct["A"] = 0;
				this.textVizPct["B"] = 0;
				this.textVizPct["C"] = 0;
			}
		} else {
			this.edgeWidths["AB"] = this.minEdgeWidth;
			this.edgeWidths["AC"] = this.minEdgeWidth;
			this.edgeWidths["BA"] = this.minEdgeWidth;
			this.edgeWidths["BC"] = this.minEdgeWidth;
			this.edgeWidths["CA"] = this.minEdgeWidth;
			this.edgeWidths["CB"] = this.minEdgeWidth;
			this.textVizPct["A"] = 0;
			this.textVizPct["B"] = 0;
			this.textVizPct["C"] = 0;
		}
	}
	GetEdgeWidth(name) {
		return this.edgeWidths[name];
	}
    SetArcWidth(arcName, width, isResults = false) {
        if(width > 0) {
            let aw = width < this.maxArcWidth ? width : this.maxArcWidth;
            let tw = width < this.maxTriWidth ? width : this.maxTriWidth;

			if(!isResults) {
				$(`#Arc${arcName}`).attr("stroke-width", aw);
				$(`#Tri${arcName}`).attr("stroke-width", tw);
			} else {
				$(`#resultsArc${arcName}`).attr("stroke-width", aw);
				$(`#resultsTri${arcName}`).attr("stroke-width", tw);
			}
        }
	}
	SetTypingNotification() {
		let label = this.GetTypingTeams();
		if(label !== '') {
			$("#typingNotification").html(label);
			$("#typingNotification").show();
		} else {
			$("#typingNotification").hide();
		}
	}
	ClearTeamTyping(teamNumber) {
		if(this.remoteTypeTimer[teamNumber]) {
			window.clearTimeout(this.remoteTypeTimer[teamNumber]);
			this.remoteTypeTimer[teamNumber] = null;
		}

		this.SetTypingNotification();
	}
	GetTypingTeams() {
		let type = '';
		let num = 0;
		let typing = [];
		if(this.remoteTypeTimer[1]) {
			typing.push({
				color: this.colors['AActive'],
				name: this.GetPlayerName(1, 8)
			});
			num++;
		}
		if(this.remoteTypeTimer[2]) {
			typing.push({
				color: this.colors['BActive'],
				name: this.GetPlayerName(2, 8)
			});
			num++;
		}
		if(this.remoteTypeTimer[3]) {
			typing.push({
				color: this.colors['CActive'],
				name: this.GetPlayerName(3, 8)
			});
			num++;
		}

		if(num === 2) {
			type = `<div style='color: #bfbfbf;'>`;
			for(let t = 0; t < typing.length; t++) {
				type += `<span style='color: ${typing[t].color};'>${typing[t].name}</span>`;
				if(t < typing.length-2) {
					type += ', ';
				} else {
					type += ' and ';
				}
			}
			type += ' are typing...</div>';
		} else if (num === 1) {
			type = `<div style='color: #bfbfbf;'><span style='color: ${typing[0].color};'>${typing[0].name}</span> is typing...</div>`;
		} else if(num === 3) {
			type = `<div style='color: #bfbfbf;'>Everyone is typing...</div>`;
		} else {
			type = '';
		}

		return type;
	}
    SetTeamTyping(teamNumber, isTyping = false) {
		this.ClearTeamTyping(teamNumber);

		if(isTyping) {
			this.remoteTypeTimer[teamNumber] = window.setTimeout(() => {
				this.SetTeamTyping(teamNumber, false);
			}, 2500);
		} else {
			this.ClearTeamTyping(teamNumber);
		}

		this.SetTypingNotification();
	}
	RedrawNotification() {
		if(this.notificationsActivated) {
			$("#notificationBtn").removeClass('notificationButtonOff');
			$("#notificationBtn").addClass('notificationButtonOn');
		} else {
			$("#notificationBtn").removeClass('notificationButtonOn');
			$("#notificationBtn").addClass('notificationButtonOff');
		}
	}
	NotificationToggle() {
		if(!this.notificationsActivated) {
			this.notificationsActivated = true;
			$("#notificationBtn").removeClass('notificationButtonOff');
			$("#notificationBtn").addClass('notificationButtonOn');
		} else {
			this.notificationsActivated = false;
			$("#notificationBtn").removeClass('notificationButtonOn');
			$("#notificationBtn").addClass('notificationButtonOff');
		}
	}
    SetTeamTabs() {
		if (this.teamNumber === 1) {
			if(this.players[2]) {
				this.tab2Team = 2;
				this.tab2Label = this.GetPlayerName(2, 14);
				this.tab2Style = 'playerBTabStyle';
				this.tab2ActiveFillStyle = this.colors["BActive"];
				this.tab2FillStyle = this.colors["BDull"];
			}

			if(this.players[3]) {
				this.tab3Team = 3;
				this.tab3Label = this.GetPlayerName(3, 14);
				this.tab3Style = 'playerCTabStyle';
				this.tab3ActiveFillStyle = this.colors["CActive"];
				this.tab3FillStyle = this.colors["CDull"];
			}
		} else if (this.teamNumber === 2) {
			if(this.players[1]) {
				this.tab2Team = 1;
				this.tab2Label = this.GetPlayerName(1, 14);
				this.tab2Style = 'playerATabStyle';
				this.tab2ActiveFillStyle = this.colors["AActive"];
				this.tab2FillStyle = this.colors["ADull"];
			}

			if(this.players[3]) {
				this.tab3Team = 3;
				this.tab3Label = this.GetPlayerName(3, 14);
				this.tab3Style = 'playerCTabStyle';
				this.tab3ActiveFillStyle = this.colors["CActive"];
				this.tab3FillStyle = this.colors["CDull"];
			}
		} else {
			if(this.players[1]) {
				this.tab2Team = 1;
				this.tab2Label = this.GetPlayerName(1, 14);
				this.tab2Style = 'playerATabStyle';
				this.tab2ActiveFillStyle = this.colors["AActive"];
				this.tab2FillStyle = this.colors["ADull"];
			}

			if(this.players[2]) {
				this.tab3Team = 2;
				this.tab3Label = this.GetPlayerName(2, 14);
				this.tab3Style = 'playerBTabStyle';
				this.tab3ActiveFillStyle = this.colors["BActive"];
				this.tab3FillStyle = this.colors["BDull"];
			}
		}
		$("#tab2name").text(this.tab2Label);
		if(this.tab2Label.length > 10 && this.tab2Label.length <= 16) {
			$("#tab2").css("font-size", "16px");
		}
		$("#tab2").addClass(this.tab2Style);
		$("#tab3name").text(this.tab3Label);
		if(this.tab3Label.length > 10 && this.tab3Label.length <= 16) {
			$("#tab3").css("font-size", "16px");
		}
		$("#tab3").addClass(this.tab3Style);
	}
    Tab1Clicked() {
        this.tab1text = 0;
		this.currentTab = 1;
		this.unreadFromAll = 0;
		this.ShowConvo(0);
		$("#tab1unread").text(0);
		$("#tab1unread").hide();
		$("#convoHolder").css("border-color", this.colors['AllActive']);
    }
    Tab2Clicked() {
        this.tab2text = 0;
		this.currentTab = 2;
		this[`unreadFrom${this.playerTags[this.tab2Team]}`] = 0;
		this.ShowConvo(this.tab2Team);
		$("#tab2unread").text(0);
		$("#tab2unread").hide();
		$("#convoHolder").css("border-color", this.colors[`${this.playerTags[this.tab2Team]}Active`]);
    }
    Tab3Clicked() {
        this.tab3text = 0;
		this.currentTab = 3;
		this[`unreadFrom${this.playerTags[this.tab3Team]}`] = 0;
		this.ShowConvo(this.tab3Team);
		$("#tab3unread").text(0);
		$("#tab3unread").hide();
		$("#convoHolder").css("border-color", this.colors[`${this.playerTags[this.tab3Team]}Active`]);
	}
	GetTeamTab(slot) {
		if(slot === this.tab2Team) {
			return 2;
		} else if(slot === this.tab3Team) {
			return 3;
		}
		return 0;
	}
    GetConvoTab(to, from) {
		if (to === 0 || to === from) {
			return 1;
		}
		if ((from === this.teamNumber && to === this.tab2Team) || (from === this.tab2Team && to === this.teamNumber)) {
			return 2;
		}
		if ((from === this.teamNumber && to === this.tab3Team) || (from === this.tab3Team && to === this.teamNumber)) {
			return 3;
		}
		return -1;
	}
	GetConvoTabFromIndex(index) {
		if(index === 0) {
			return 1;
		}
		if(index === this.tab2Team) {
			return 2;
		}
		if(index === this.tab3Team) {
			return 3;
		}
		return -1;
	}
    GetConvoIndex(to, from) {
		if (to === 0 || to === from) {
			return 0;
		}
		if ((from === this.teamNumber && to === this.tab2Team) || (from === this.tab2Team && to === this.teamNumber)) {
			return this.tab2Team;
		}
		if ((from === this.teamNumber && to === this.tab3Team) || (from === this.tab3Team && to === this.teamNumber)) {
			return this.tab3Team;
		}
		return -1;
	}

    SetTyping(event) {
		$("#emoteMenu").hide(); 
        if ("chatInputBox" === $(document.activeElement)[0].id) {
			if(event.keyCode !== 13) {
				if (this.typeTimer !== null) {
					window.clearTimeout(this.typeTimer);
					this.typeTimer = null;
				}
				this.networkManager.SendEvent({}, this.networkManager.msgTypes.START_TYPING );
				this.typeTimer = window.setTimeout(() => {
					this.networkManager.SendEvent({}, this.networkManager.msgTypes.STOP_TYPING);
				}, 2500);
			} else {
				this.SendButtonClicked();
			}
        }
	}
	CancelTypingTimer() {
		if(this.typeTimer) {
			window.clearTimeout(this.typeTimer);
			this.typeTimer = null;
		}
	}
    SendButtonClicked() {
        if ($("#chatInputBox").val().trim() !== "") {
            let msgTxt = $("#chatInputBox").val();
            msgTxt = msgTxt.replace(/[<\\/>]/g, "");

			$("#emoteMenu").hide();
			if(msgTxt.trim() !== "") {
				this.SendTextMessage(msgTxt);
			}
			$("#chatInputBox").val("");
			this.CancelTypingTimer();
        }
	}
	SendTextMessage(txt) {
		let toTeamNumber = 0;
		switch (this.currentTab) {
			case 1:
				toTeamNumber = 0;
				break;
			case 2:
				toTeamNumber = this.tab2Team;
				break;
			case 3:
				toTeamNumber = this.tab3Team;
				break;
		}
		let scannedText = ScanText(txt);
		this.networkManager.SendEvent({ teamNumber: this.teamNumber, toTeam: toTeamNumber, msg: scannedText.rawText, dashMsg: scannedText.text, isFlagged: scannedText.isFlagged }, this.networkManager.msgTypes.TEXT_MSG);
		this.msgNum++;
		this.networkManager.SendEvent({ eventName: "Player", eventType: "Player", actionType: "Message_Order", actionString: { MessageNum: this.msgNum, From: this.teamNumber, To: toTeamNumber, ProfanityFlagged: scannedText.isFlagged, Text: this.ParseTextToTelemSafe(txt) }}, this.networkManager.msgTypes.TELEM_EVENT);
	}
	ParseTextToTelemSafe(txt) {
		let safeText = '';
		for(let i = 0; i < txt.length; i++) {
			safeText += this.safeTextList[txt[i]] || txt[i];
		}
		return safeText;
	}
	ResetTabNotification() {
		if(this.notificationTimer) {
			window.clearInterval(this.notificationTimer);
			this.notificationTimer = null;
		}
		document.title = this.docTitle;
	}
	SetTabNotification() {
		this.ResetTabNotification();
		this.notificationTimer = window.setInterval(() => {
			if(document.title === this.docTitle) {
				document.title = this.notificationTitle;
			} else {
				document.title = this.docTitle;
			}
		}, this.notificationTabInterval);
	}
	PlayNotificationSound() {
		if(this.notificationsActivated) {
			this.notificationSound.play();
		}
	}
    SetUnreadStats(to, from) {
		$("#tab1unread").hide();
		$("#tab2unread").hide();
		$("#tab3unread").hide();
		if(to === this.teamNumber && to !== from) {
			let teamTab = this.GetConvoTab(to, from);
			if(this.currentTab === 1 || this.currentTab !== teamTab) { // going to be an unread message
				switch(from) {
					case 1:
						this.unreadFromA++;
						this.tab2text = this.unreadFromA;
						$("#tab2unread").text(this.tab2text);
						$("#tab2unread").show();
						break;
					case 2:
						this.unreadFromB++;
						if(from === this.tab2Team) {
							this.tab2text = this.unreadFromB;
							$("#tab2unread").text(this.tab2text);
							$("#tab2unread").show();
						} else if(from === this.tab3Team) {
							this.tab3text = this.unreadFromB;
							$("#tab3unread").text(this.tab3text);
							$("#tab3unread").show();
						}
						break;
					case 3:
						this.unreadFromC++;
						this.tab3text = this.unreadFromC;
						$("#tab3unread").text(this.tab3text);
						$("#tab3unread").show();
						break;
				}
				if(!tabIsFocused) {
					this.SetTabNotification();
				}
				this.PlayNotificationSound();
			}
		} else if(to === 0 && this.currentTab !== 1) {
			this.unreadFromAll++;
			this.tab1text = this.unreadFromAll;
			$("#tab1unread").text(this.tab1text);
			$("#tab1unread").show();
			if(!tabIsFocused) {
				this.SetTabNotification();
			}
			this.PlayNotificationSound();
		}
	}
	ReceiveTextMessage(msg) {
		let convoIndex = this.GetConvoIndex(msg.toTeam, msg.teamNumber);
		if (convoIndex !== -1 && 
			(msg.teamNumber === this.teamNumber || msg.toTeam === this.teamNumber || msg.toTeam === 0)) {
			this.SetUnreadStats(msg.toTeam, msg.teamNumber);
			this.UpdateConvo(convoIndex, { to: msg.toTeam, text: msg.msg, teamNumber: msg.teamNumber });
		}
	}
	ReceiveStats(data) {
		this.playerMsg = data.playerMsg;
		this.UpdateTextViz();
	}
	UpdateFinalResultsViz() {
		this.CalculateEdgeWidths();

		this.SetArcWidth("AB", this.GetEdgeWidth("AB"), true);
        this.SetArcWidth("AC", this.GetEdgeWidth("AC"), true);
        this.SetArcWidth("BA", this.GetEdgeWidth("BA"), true);
        this.SetArcWidth("BC", this.GetEdgeWidth("BC"), true);
        this.SetArcWidth("CA", this.GetEdgeWidth("CA"), true);
        this.SetArcWidth("CB", this.GetEdgeWidth("CB"), true);

		let apct = this.textVizPct['A'];
		let bpct = this.textVizPct['B'];
		let cpct = this.textVizPct['C'];

		if(this.totalMsgs > 0) {
			if(apct > 0) {
				$("#finalHorizontalLabelPlayerA").css("width", `${apct}%`);
				$("#finalHorizontalLabelPlayerA").text(`${apct}%`);
				$("#finalHorizontalVizPlayerA").css("width", `${apct}%`);
				$("#finalHorizontalVizPlayerA").show();
			} else {
				$("#finalHorizontalLabelPlayerA").css("width", `${apct}%`);
				$("#finalHorizontalLabelPlayerA").text('');
				$("#finalHorizontalVizPlayerA").css("width", `${apct}%`);
				$("#finalHorizontalVizPlayerA").hide();
			}
			if(bpct > 0) {
				$("#finalHorizontalLabelPlayerB").css("width", `${bpct}%`);
				$("#finalHorizontalLabelPlayerB").text(`${bpct}%`);
				$("#finalHorizontalVizPlayerB").css("width", `${bpct}%`);
				$("#finalHorizontalVizPlayerB").show();
			} else {
				$("#finalHorizontalLabelPlayerB").css("width", `${bpct}%`);
				$("#finalHorizontalLabelPlayerB").text('');
				$("#finalHorizontalVizPlayerB").css("width", `${bpct}%`);
				$("#finalHorizontalVizPlayerB").hide();
			}
			if(cpct > 0) {
				$("#finalHorizontalLabelPlayerC").css("width", `${cpct}%`);
				$("#finalHorizontalLabelPlayerC").text(`${cpct}%`);
				$("#finalHorizontalVizPlayerC").css("width", `${cpct}%`);
				$("#finalHorizontalVizPlayerC").show();
			} else {
				$("#finalHorizontalLabelPlayerC").css("width", `${cpct}%`);
				$("#finalHorizontalLabelPlayerC").text('');
				$("#finalHorizontalVizPlayerC").css("width", `${cpct}%`);
				$("#finalHorizontalVizPlayerC").hide();
			}
		}
	}
	UpdateTextViz() {
		this.CalculateEdgeWidths();

		this.SetArcWidth("AB", this.GetEdgeWidth("AB"));
        this.SetArcWidth("AC", this.GetEdgeWidth("AC"));
        this.SetArcWidth("BA", this.GetEdgeWidth("BA"));
        this.SetArcWidth("BC", this.GetEdgeWidth("BC"));
        this.SetArcWidth("CA", this.GetEdgeWidth("CA"));
		this.SetArcWidth("CB", this.GetEdgeWidth("CB"));
		
		let aLabel, bLabel, cLabel;
		this.players[1] ? aLabel = this.GetPlayerName(1) : aLabel = "";
		this.players[2] ? bLabel = this.GetPlayerName(2) : bLabel = "";
		this.players[3] ? cLabel = this.GetPlayerName(3) : cLabel = "";

		$("#textVizPlayerAName").text(aLabel);
		$("#finalPlayerA").text(aLabel);
		if(aLabel.length >= 18) {
			$("#textVizPlayerAName").css("font-size", "16px");
			$("#finalPlayerA").css("font-size", "16px");
		}
		$("#textVizPlayerBName").text(bLabel);
		$("#finalPlayerB").text(bLabel);
		if(bLabel.length >= 18) {
			$("#textVizPlayerBName").css("font-size", "16px");
			$("#finalPlayerB").css("font-size", "16px");
		}
		$("#textVizPlayerCName").text(cLabel);
		$("#finalPlayerC").text(cLabel);
		if(cLabel.length >= 18) {
			$("#textVizPlayerCName").css("font-size", "16px");
			$("#finalPlayerC").css("font-size", "16px");
		}

		let apct = this.textVizPct['A'];
		let bpct = this.textVizPct['B'];
		let cpct = this.textVizPct['C'];

		if(this.totalMsgs > 0) {
			if(apct > 0) {
				$("#horizontalLabelPlayerA").css("width", `${apct}%`);
				$("#horizontalLabelPlayerA").text(`${apct}%`);
				$("#horizontalVizPlayerA").css("width", `${apct}%`);
				$("#horizontalVizPlayerA").show();
			} else {
				$("#horizontalLabelPlayerA").css("width", `${apct}%`);
				$("#horizontalLabelPlayerA").text('');
				$("#horizontalVizPlayerA").css("width", `${apct}%`);
				$("#horizontalVizPlayerA").hide();
			}
			if(bpct > 0) {
				$("#horizontalLabelPlayerB").css("width", `${bpct}%`);
				$("#horizontalLabelPlayerB").text(`${bpct}%`);
				$("#horizontalVizPlayerB").css("width", `${bpct}%`);
				$("#horizontalVizPlayerB").show();
			} else {
				$("#horizontalLabelPlayerB").css("width", `${bpct}%`);
				$("#horizontalLabelPlayerB").text('');
				$("#horizontalVizPlayerB").css("width", `${bpct}%`);
				$("#horizontalVizPlayerB").hide();
			}
			if(cpct > 0) {
				$("#horizontalLabelPlayerC").css("width", `${cpct}%`);
				$("#horizontalLabelPlayerC").text(`${cpct}%`);
				$("#horizontalVizPlayerC").css("width", `${cpct}%`);
				$("#horizontalVizPlayerC").show();
			} else {
				$("#horizontalLabelPlayerC").css("width", `${cpct}%`);
				$("#horizontalLabelPlayerC").text('');
				$("#horizontalVizPlayerC").css("width", `${cpct}%`);
				$("#horizontalVizPlayerC").hide();
			}
		}
	}
    UpdateConvo(convoIndex = 0, convoChunk) {
        let sp, bubbleStyle, teamColor, teamName, margin, innerStyle;
		if (convoChunk.teamNumber === 1) {
			bubbleStyle = 'textBubbleA';
			teamName = this.players[1].name;
			teamColor = "#FFD71B";
		} else if (convoChunk.teamNumber === 2) {
			bubbleStyle = 'textBubbleB';
			teamName = this.players[2].name;
			teamColor = "#18B4FE";
		} else if (convoChunk.teamNumber === 3) {
			bubbleStyle = 'textBubbleC';
			teamName = this.players[3].name;
			teamColor = "#FE6057";
		}
		
		if (convoChunk.teamNumber === this.teamNumber) {
			teamName = "You:";
			margin = "margin-left: 20px;";
			innerStyle = "margin-right: 150px;";
		} else {
			margin = "margin-left: 150px;";
			innerStyle = "margin-right: 20px;";
		}
		if (convoChunk.text !== "") {
			sp = `<span style='font-family: icomoon;'>${convoChunk.text}</span>`;
		}

		this.SetTeamTyping(+convoChunk.teamNumber, false);
		this.rawConvo[convoIndex].push({
			to: convoChunk.to,
			from: convoChunk.teamNumber,
			text: convoChunk.text
		});
		this.convo[convoIndex].push(`<div id='ce${convoIndex}-${this.convo[convoIndex].length}' style='${margin} font-size: 20px; color: ${teamColor};' >${teamName}<div class='${bubbleStyle}' style='${innerStyle}'>${sp}</div></div>`);
		if(this.GetConvoTab(convoChunk.to, convoChunk.teamNumber) === this.currentTab) {
			this.ShowConvo(convoIndex);
		}
	}
	SetConvoForIndex(convoIndex = 0, convoChunks = [], showUpdated = false) {
		this.convo[convoIndex] = [];
        let sp, bubbleStyle, teamColor, teamName, margin, innerStyle;
		for(let c = 0; c < convoChunks.length; c++) {
			console.log(this.teamNumber, convoChunks[c]);
			if (convoChunks[c].teamNumber === 1) {
				bubbleStyle = 'textBubbleA';
				teamName = this.players[1].name;
				teamColor = "#FFD71B";
			} else if (convoChunks[c].teamNumber === 2) {
				bubbleStyle = 'textBubbleB';
				teamName = this.players[2].name;
				teamColor = "#18B4FE";
			} else if (convoChunks[c].teamNumber === 3) {
				bubbleStyle = 'textBubbleC';
				teamName = this.players[3].name;
				teamColor = "#FE6057";
			}
			
			if (convoChunks[c].teamNumber === this.teamNumber) {
				teamName = "You:";
				margin = "margin-left: 20px;";
				innerStyle = "margin-right: 150px;";
			} else {
				margin = "margin-left: 150px;";
				innerStyle = "margin-right: 20px;";
			}
			if (convoChunks[c].msg !== "") {
				sp = `<span style='font-family: icomoon;'>${convoChunks[c].msg}</span>`;
			}
				
			this.convo[convoIndex].push(`<div id='ce${convoIndex}-${this.convo[convoIndex].length}' style='${margin} font-size: 20px; color: ${teamColor};' >${teamName}<div class='${bubbleStyle}' style='${innerStyle}'>${sp}</div></div>`);
		}

		if(this.GetConvoTabFromIndex(convoIndex) === this.currentTab || showUpdated === true) {
			this.ShowConvo(convoIndex);
		}
	}
	PauseSession(msg = "") {
		this.menu = "PAUSE";
		this.pauseMessage = msg;
		this.modeSwitchEnabled = false;
		$(`#tab1`).css("background-color", this.colors[`AllDull`]);
		$(`#tab1`).attr("onclick", "");
		$(`#tab2`).css("background-color", this.tab2FillStyle);
		$(`#tab2`).attr("onclick", "");
		$(`#tab3`).css("background-color", this.tab3FillStyle);
		$(`#tab3`).attr("onclick", "");

		$(`#endChatBtn`).attr("onclick", "");
		$(`#emoteMenuBtn`).attr("onclick", "");
		$(`#chatInputBox`).prop("disabled", true);
		$(`#sendBtn`).attr("onclick", "");

		if(this.pauseMessage !== "") {
			$("#frostText").text(this.pauseMessage);
		} else {
			$("#frostText").text("Visualization paused until team member rejoins.");
		}

		$("#vizFrost").show();
	}
	UnpauseSession() {
		this.menu = "";
		this.pauseMessage = "";
		this.modeSwitchEnabled = true;
		$(`#tab1`).css("background-color", this.colors[`AllActive`]);
		$(`#tab1`).attr("onclick", "game.scene.scenes[0].Tab1Clicked();");
		$(`#tab2`).css("background-color", this.tab2ActiveFillStyle);
		$(`#tab2`).attr("onclick", "game.scene.scenes[0].Tab2Clicked();");
		$(`#tab3`).css("background-color", this.tab3ActiveFillStyle);
		$(`#tab3`).attr("onclick", "game.scene.scenes[0].Tab3Clicked();");

		$(`#endChatBtn`).attr("onclick", "game.scene.scenes[0].EndChatClicked();");
		$(`#emoteMenuBtn`).attr("onclick", `$("#emoteMenu").toggle();`);
		$(`#chatInputBox`).prop("disabled", false);
		$(`#sendBtn`).attr("onclick", `game.scene.scenes[0].SendButtonClicked();`);

		$("#vizFrost").hide();
	}
	EndChatClicked() {
		this.vtesSent = true;
		this.networkManager.SendEvent({ vote: true }, this.networkManager.msgTypes.VTESO);
		this.networkManager.SendEvent({ eventName: "Player", eventType: "Player", actionType: "QuitRequest", actionString: { Team: this.teamNumber }}, this.networkManager.msgTypes.TELEM_EVENT);
	}
	ResumeTimerMessage() {
		$("#endChatBtn").attr("onclick", "game.scene.scenes[0].EndChatClicked();");
		$("#endChatYesBtn").attr("onclick", "game.scene.scenes[0].EndChatVoteYes();");
		$("#endChatNoBtn").attr("onclick", "game.scene.scenes[0].EndChatVoteNo();");

		$("#endChatBtnHolder").hide();
		$("#endChatTimer").show();
	}
	DoImmediateEndSession() {
		$("#endChatBtn").attr("onclick", "game.scene.scenes[0].EndChatClicked();");
		$("#endChatYesBtn").attr("onclick", "game.scene.scenes[0].EndChatVoteYes();");
		$("#endChatNoBtn").attr("onclick", "game.scene.scenes[0].EndChatVoteNo();");

		$("#endChatBtnHolder").hide();

		this.vtesSent = true;
		this.networkManager.SendEvent({}, this.networkManager.msgTypes.VTHE);
		this.networkManager.SendEvent({ eventName: "Player", eventType: "Player", actionType: "Quit", actionString: { Team: this.teamNumber }}, this.networkManager.msgTypes.TELEM_EVENT);

		this.CancelEndSessionCountdownTimer();
		this.EndSession();
	}
	Show5SecondMessage() {
		$("#PlayerAVote").hide();
		$("#PlayerBVote").hide();
		$("#PlayerCVote").hide();
		$("#endChatPrompt").html('Both partners have lost connection, session is ending...');
		$("#endChatNotification").show();
		$("#endChatPrompt").show();
		$("#endChatBtnHolder").hide();
		$("#endChatTimer").hide();
	}
	CancelEndSessionCountdownTimer() {
		if(this.endSessionCountdownTimer) {
			window.clearInterval(this.endSessionCountdownTimer);
			this.endSessionCountdownTimer = null;
		}
		if(this.endSessionTimer) {
			window.clearTimeout(this.endSessionTimer);
			this.endSessionTimer = null;
		}
	}
	ShowTimerMessage(from = 0, delayTime = 59, doUpdate = true) {
		$("#PlayerAVote").hide();
		$("#PlayerBVote").hide();
		$("#PlayerCVote").hide();
		$("#endChatPrompt").html(`Player <span id='endChatRequestor'>Player</span> has disconnected. Session will end if they are unable to rejoin.`);
		$("#endChatRequestor").css("color", this.colors[`${this.playerTags[from]}Active`]);
		$("#endChatRequestor").text(this.TruncateText(this.players[from].name, 18));
		$("#endChatNotification").show();
		$("#endChatPrompt").show();
		$("#endChatBtnHolder").hide();
		$("#endChatTimer").show();
		if(doUpdate === true) {
			this.UpdateTimerMessage(from, delayTime);
		}
		this.menu = "STM";
	}
	UpdateTimerMessage(from, delayTime) {
		let timeLabel = ":";
		delayTime--;
		if(parseInt(delayTime) >= 10)
			timeLabel += delayTime;
		else
			timeLabel += "0" + delayTime;
		timeLabel += " until end of session.";
		$("#endChatTimer").text(timeLabel);
		this.CancelEndSessionCountdownTimer();
		if(delayTime <= 0) {
			this.endSessionTimerTN = -1;
			this.CancelEndSessionCountdownTimer();
			this.EndSession();
		} else {
			this.endSessionCountdownTimer = window.setInterval((from, delayTime) => {
				this.UpdateTimerMessage(from, delayTime);
			}, 1000, from, delayTime);
		}
	}
	InitEndChatDialog(from = 0, players) {
		this.menu = "IECD";
		this.iecdFrom = from;
		$("#endChatBtn").attr("onclick", "");
		$("#PlayerAVote").hide();
		$("#PlayerBVote").hide();
		$("#PlayerCVote").hide();
		$("#endChatPrompt").html(`Player <span id='endChatRequestor'>Player</span> has requested to end the chat and get the results. If everyone agrees, the chat will end.  Would you like to end the chat?`);
		$("#endChatRequestor").css("color", this.colors[`${this.playerTags[from]}Active`]);
		$("#endChatRequestor").text(this.TruncateText(this.players[from].name, 18));
		$("#endChatNotification").show();
		$("#endChatPrompt").show();
		$("#endChatBtnHolder").show();
		$("#endChatTimer").hide();
	}
	UpdateEndChatPlayer(teamNum, players = this.players) {
		$("#endChatBtn").attr("onclick", "");
		let elTag = `#Player${this.playerTags[teamNum]}Vote`;
		if(players[teamNum]) {
			let col = this.colors[`${this.playerTags[teamNum]}Active`];
			let name = this.TruncateText(players[teamNum].name, 18);
			let dotLeft = '130px';
			if(this.mode === "thin") {
				dotLeft = '55px';
			}
			if(this.teamNumber !== teamNum) {
				if(players[teamNum].votedToEndSession === true) {
					$(elTag).html(`<div style='left: ${dotLeft}; width: 16px; height: 16px; border-radius: 100%; background-color: ${col}; position: absolute; margin-right: 10px;'></div><div style='left: 160px;'>Player <span style='color: ${col};'>${name}</span> agreed to end the chat.</div>`);
				} else if(players[teamNum].votedToEndSession === false) {
					$(elTag).html(`<div style='left: ${dotLeft}; width: 16px; height: 16px; border-radius: 100%; background-color: ${col}; position: absolute; margin-right: 10px;'></div><div style='left: 160px;'>Player <span style='color: ${col};'>${name}</span> does not want to end the chat.</div>`);
				} else if(players[teamNum].votedToEndSession === null) {
					$(elTag).html(`<div style='left: ${dotLeft}; width: 16px; height: 16px; border-radius: 100%; background-color: ${col}; position: absolute; margin-right: 10px;'></div><div style='left: 160px;'>Waiting for <span style='color: ${col};'>${name}</span>.</div>`);
				}
			} else {
				if(players[this.teamNumber].vtesSent === true) {
					$(elTag).html(`<div style='left: ${dotLeft}; width: 16px; height: 16px; border-radius: 100%; background-color: ${col}; position: absolute; margin-right: 10px;'></div><div style='left: 160px;'><span style='color: ${col};'>You</span> have requested to end the chat and get the results.  If everyone agrees, the chat will end.</div>`);
				} else if(players[this.teamNumber].votedToEndSession === true) {
					$(elTag).html(`<div style='left: ${dotLeft}; width: 16px; height: 16px; border-radius: 100%; background-color: ${col}; position: absolute; margin-right: 10px;'></div><div style='left: 160px;'><span style='color: ${col};'>You</span> agreed to end the chat.</div>`);
				} else if(players[this.teamNumber].votedToEndSession === false) {
					$(elTag).html(`<div style='left: ${dotLeft}; width: 16px; height: 16px; border-radius: 100%; background-color: ${col}; position: absolute; margin-right: 10px;'></div><div style='left: 160px;'><span style='color: ${col};'>You</span> do not want to end the chat.</div>`);
				}
			}
		} else {
			$(elTag).html('');
		}
	}
	UpdateEndChatDialog() {
		this.menu = "UECP";
		$("#endChatNotification").show();
		$("#endChatPrompt").hide();
		$("#endChatBtnHolder").hide();

		this.UpdateEndChatPlayer(1, this.players);
		this.UpdateEndChatPlayer(2, this.players);
		this.UpdateEndChatPlayer(3, this.players);

		$("#PlayerAVote").show();
		$("#PlayerBVote").show();
		$("#PlayerCVote").show();
	}
	EndChatVoteYes(id) {
		$(`#vt${id}Y`).hide();
		$(`#vt${id}N`).hide();
		this.networkManager.SendEvent({ vote: true }, this.networkManager.msgTypes.VTES);
		this.networkManager.SendEvent({ eventName: "Player", eventType: "Player", actionType: "QuitVote", actionString: { Team: this.teamNumber, Vote: "Yes" }}, this.networkManager.msgTypes.TELEM_EVENT);
	}
	EndChatVoteNo(id) {
		$(`#vt${id}Y`).hide();
		$(`#vt${id}N`).hide();
		this.networkManager.SendEvent({ vote: false }, this.networkManager.msgTypes.VTES);
		this.networkManager.SendEvent({ eventName: "Player", eventType: "Player", actionType: "QuitVote", actionString: { Team: this.teamNumber, Vote: "No" }}, this.networkManager.msgTypes.TELEM_EVENT);
	}
	SetEndChatToReset(msg = "") {
		$("#endChatBtn").attr("onclick", "");
		$("#endChatPrompt").html(msg);
		$("#endChatPrompt").show();
		$("#endChatBtnHolder").hide();
		$("#endChatTimer").hide();
		$("#PlayerAVote").hide();
		$("#PlayerBVote").hide();
		$("#PlayerCVote").hide();
	}
	ResetEndChat() {
		this.menu = "";
		this.iecdFrom = 0;
		$("#endChatBtn").attr("onclick", "game.scene.scenes[0].EndChatClicked();");
		this.vtesSent = false;
		this.VTESVisible = false;
		this.players[1].vtes = false;
		this.players[1].vtesSent = false;
		this.players[1].votedToEndSession = null;
		this.players[2].vtes = false;
		this.players[2].vtesSent = false;
		this.players[2].votedToEndSession = null;
		this.players[3].vtes = false;
		this.players[3].vtesSent = false;
		this.players[3].votedToEndSession = null;
		$("#endChatPrompt").html("");
		$("#endChatPrompt").hide();
		$("#endChatBtnHolder").hide();
		$("#endChatTimer").hide();
		$("#endChatNotification").hide();
	}
	ShowConvo(convoIndex = 0) {
		$("#convoDisplay").empty();
		$("#convoDisplay").append(this.convo[convoIndex]);

		window.setTimeout(() => {
			if($("#convoDisplay")) {
				$("#convoDisplay").css("display", "block");
				if($("#convoDisplay")[0])
					$("#convoDisplay").scrollTop($("#convoDisplay")[0].scrollHeight);
			}
		}, 100);
	}
	FinalContinueClicked() {
		this.GoToReportDownloadScreen();
	}
	EndSession() {
		this.menu = "";
		this.GoToResultsScreen();
	}
	TimedEndSession() {
		this.Show5SecondMessage();
		window.setTimeout(() => {
			this.EndSession();
		}, 5000);
	}
	EndSessionWithTimer(teamNumber) {
		this.endSessionTimerTN = teamNumber;
		this.ShowTimerMessage(teamNumber, this.dropDelayTimer);
		this.endSessionTimer = window.setTimeout(() => {
			this.CancelEndSessionCountdownTimer();
			this.EndSession();
		}, (this.dropDelayTimer * 1000));
	}
}