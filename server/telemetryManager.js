class TelemetryManager {
    constructor() {
		this.telemetryLog = [];
		this.dt = new Date();
		this.csvDelim = ",";
        this.logToConsole = true;
        this.startTime = null;
		this.fullcode = "";
		this.logName = "";
		this.XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
		this.telemetryActive = false;
		this.apiGatewayAddress = '<URL to API Gateway goes here>'

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
		this.lastLogLength = 0;
    }
	GetLogName() {
		return this.fullcode + "_" + this.startTime;
	}
	GetTimestamp() {
		this.dt = new Date();
		let month = this.dt.getMonth() + 1;
		return "d" + month + "-" + this.dt.getDate() + "-" + this.dt.getFullYear() + "t" + this.dt.getHours() + "-" + this.dt.getMinutes() + "-" + this.dt.getSeconds() + "-" + this.dt.getMilliseconds();
	}
    Start(fullcode = '0000') {
		this.fullcode = fullcode;
		this.telemetryActive = true;
        this.startTime = this.GetTimestamp();
        this.StartLogFlushing();
    }
	MakeEventData(data) {
		let dataObj = {};
		dataObj.SessionID = this.fullcode;
		dataObj.ActionType = data.actionType + "," + this.ParseKVSet(data.actionString);

		return dataObj;
    }
	ParseKVSet(data) {
		let parsedInfo = '';
		let dataKeys = Object.keys(data);
		if(dataKeys.length <= 0) {
			return "";
		}
		parsedInfo = dataKeys[0].toString() + ":" + (data[dataKeys[0]].toString() || " ");
		for(let d = 1; d < dataKeys.length; d++) {
			if(dataKeys[d] && dataKeys[d].trim() !== "" && dataKeys[d] !== 'eventName') {
				parsedInfo += this.csvDelim + dataKeys[d].toString() + ":" + (data[dataKeys[d]].toString() || " ");
			}
		}
		return parsedInfo;
    }
	ParseTextToTelemSafe(txt) {
		let safeText = '';
		for(let i = 0; i < txt.length; i++) {
			safeText += this.safeTextList[txt[i]] || txt[i];
		}
		return safeText;
	}
	Log(userSlot = 0, data = { eventType: "Session", actionType: "Test", actionString: {} }, forceLog = false) {
		data.userSlot = userSlot;
		if(this.telemetryActive || forceLog === true) {
			this.telemetryLog.push({ timeStamp: this.GetTimestamp(), eventName: data.eventName, eventData: this.MakeEventData(data) });
		}
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
		console.log("uploading telemetry to cloud");
		let request = new this.XMLHttpRequest();
		request.open('POST', this.apiGatewayAddress, true);
		request.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
		request.onload = () => {
			if(request.status !== 200) {
				console.error("S3 upload error:", request.status, request.statusText);
			} else {
				console.log("Telemetry uploaded.");
			}
		};
		request.send(JSON.stringify({
			logTxt: this.SerializeToCSV(),
			un: this.GetLogName()
		}));
	}
	StartLogFlushing() {
		if(this.telemetryActive) {
			this.logFlushTimer = setInterval(() => { 
				this.FlushLog(); 
			}, this.logFlushInterval);
		}
	}
	FlushLog() {
		if(this.telemetryLog.length > this.lastLogLength) {
			this.lastLogLength = this.telemetryLog.length;
			this.UploadLogToS3();
		}
	}
	StopLogFlushing() {
		clearInterval(this.logFlushTimer);
		this.logFlushTimer = null;
	}
	Reset(restart = true) {
		this.telemetryLog = [];

		if(restart) {
			this.Start(this.fullcode);
		}
	}
}

exports.TelemetryManager = new TelemetryManager();