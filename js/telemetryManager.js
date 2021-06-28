class TelemetryManager {
	constructor() {
		this.telemetryLog = [];
		this.dt = new Date();
		this.csvDelim = ",";
		this.logToConsole = false;
		this.classcode = "";
		this.startTime = this.GetTimestamp();
		this.logName = "";
		this.teamNumber = 0;
		this.telemetryActive = true;
		this.apiGatewayAddress = '<Put your AWS API Gateway address here>';

		this.safeTextList = [];
		this.safeTextList['\uE900'] = "emote:(IDK)";
		this.safeTextList['\uE902'] = "emote:(OK)";
		this.safeTextList['\uE903'] = "emote:(SAD)";
		this.safeTextList['\uE904'] = "emote:(THANKS)";
		this.safeTextList['\uE905'] = "emote:(THUMBS-DOWN)";
		this.safeTextList['\uE906'] = "emote:(THUMBS-UP)";
		this.safeTextList['\uE907'] = "emote:(HAPPY)";
		this.safeTextList[','] = ";";

		this.logFlushTimer = null;
		this.logFlushInterval = 60000;
	}
	GetLogName() {
		return this.classcode + "_" + this.teamNumber + "_" + this.startTime;
	}
	GetTimestamp() {
		this.dt = new Date();
		let month = this.dt.getMonth() + 1;
		return "d" + month + "-" + this.dt.getDate() + "-" + this.dt.getFullYear() + "t" + this.dt.getHours() + "-" + this.dt.getMinutes() + "-" + this.dt.getSeconds() + "-" + this.dt.getMilliseconds();
	}
	MakeEventData(data) {
		let dataObj = {};
		dataObj.GameID = this.classcode;
		dataObj.ActionType = data.actionType + "," + this.ParseKVSet(data.actionString);

		return dataObj;
	}
	Log(eventName = "TestEvt", data = { eventType: "Game", actionType: "Test", actionString: {} }, forceLog = false) {
		if(this.telemetryActive || forceLog === true) {
			this.telemetryLog.push({ timeStamp: this.GetTimestamp(), eventName: eventName, eventData: this.MakeEventData(data) });
		}
		if(this.logToConsole) {
			console.log("TELEMETRY:", { eventName: eventName, eventData: this.MakeEventData(data) });
		}
	}
	ParseTextToTelemSafe(txt) {
		let safeText = '';
		for(let i = 0; i < txt.length; i++) {
			safeText += this.safeTextList[txt[i]] || txt[i];
		}
		return safeText;
	}
	ParseKVSet(data) {
		let parsedInfo = '';
		let dataKeys = Object.keys(data);
		if(dataKeys.length <= 0) {
			return "";
		}
		parsedInfo = dataKeys[0].toString() + ":" + (data[dataKeys[0]].toString() || " ");
		for(let d = 1; d < dataKeys.length; d++) {
			if(dataKeys[d] && dataKeys[d].trim() !== "") {
				parsedInfo += this.csvDelim + dataKeys[d].toString() + ":" + (data[dataKeys[d]].toString() || " ");
			}
		}
		return parsedInfo;
	}
	DataToCSV(data) {
		let dataKeys = Object.keys(data);
		let result = dataKeys[0] + ":" + data[dataKeys[0]];
		for (let d = 1; d < dataKeys.length; d++) {
			result += this.csvDelim + dataKeys[d] + ":" + data[dataKeys[d]];
		}
		return result;
	}
	SerializeToCSV() {
		let result = "";
		result += "Time Stamp,Event Name,Event Data";
		for (let i = 0; i < this.telemetryLog.length; i++) {
			result += `${this.telemetryLog[i].timeStamp},${this.telemetryLog[i].eventName},${this.DataToCSV(this.telemetryLog[i].eventData)}\n`;
		}
		return result;
	}
	UploadLogToS3() {
		console.log("Uploading telemetry to cloud");
		$.post(this.apiGatewayAddress,
			JSON.stringify({
				logTxt: this.SerializeToCSV(),
				un: this.GetLogName()
			}),
			function (data, status) {
				console.log("status", status, data);
			},
			"json");
		console.log("Telemetry Uploaded");
	}
	StartLogFlushing() {
		if(this.telemetryActive) {
			this.logFlushTimer = window.setInterval(() => { 
				this.FlushLog(); 
			}, this.logFlushInterval);
		}
	}
	FlushLog() {
		this.UploadLogToS3();
	}
	StopLogFlushing() {
		window.cancelInterval(this.logFlushTimer);
		this.logFlushTimer = null;
	}
}