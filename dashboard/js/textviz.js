class TextViz extends Phaser.Scene {
	constructor() {
		super('TextViz');
		this.slot = 0;

		this.minArcWidth = 1;
		this.maxArcWidth = 20;
        this.minTriWidth = 1;
        this.maxTriWidth = 15;
		this.edgeWidths = {
			AB: this.minArcWidth,
			AC: this.minArcWidth,
			BA: this.minArcWidth,
			BC: this.minArcWidth,
			CA: this.minArcWidth,
			CB: this.minArcWidth
		};
		this.totalMsgs = 0;
		this.curVizIdx = 0;
		this.lastVizIdx = 0;
		this.playerMsg = [];
		this.playerMsg[this.curVizIdx] = [];
		this.playerMsg[this.curVizIdx][0] = {
			msgToA: 0,
			msgToB: 0,
			msgToC: 0,
			numMsg: 0
		};
		this.playerMsg[this.curVizIdx][1] = {
			msgToA: 0,
			msgToB: 0,
			msgToC: 0,
			unreadFromA: 0,
			unreadFromB: 0,
			unreadFromC: 0,
			unreadFromAll: 0,
			numMsg: 0
		};
		this.playerMsg[this.curVizIdx][2] = {
			msgToA: 0,
			msgToB: 0,
			msgToC: 0,
			unreadFromA: 0,
			unreadFromB: 0,
			unreadFromC: 0,
			unreadFromAll: 0,
			numMsg: 0
		};
		this.playerMsg[this.curVizIdx][3] = {
			msgToA: 0,
			msgToB: 0,
			msgToC: 0,
			unreadFromA: 0,
			unreadFromB: 0,
			unreadFromC: 0,
			unreadFromAll: 0,
			numMsg: 0
		};
		this.textVizPct = {
			A: 0,
			B: 0,
			C: 0
		};

		this.appContent = null;
	}
	preload() { 
		this.load.html('appContent', "js/content.html");
	}
	create() {
		this.appContent = this.add.dom(0, 0).createFromCache('appContent');
		this.Init();
	}
	Init() {
		let id = this.scene.scene.game.config.parent.id;
		this.slot = id.replace("cofSlot", "").replace("ConvoViz", "");

		$("#vizHolder").attr("id", `vizHolder${this.slot}`);
		$("#ArcA").attr("id", `ArcA${this.slot}`);
		$("#ArcB").attr("id", `ArcB${this.slot}`);
		$("#ArcC").attr("id", `ArcC${this.slot}`);
		$("#ArcAB").attr("id", `ArcAB${this.slot}`);
		$("#TriAB").attr("id", `TriAB${this.slot}`);
		$("#ArcAC").attr("id", `ArcAC${this.slot}`);
		$("#TriAC").attr("id", `TriAC${this.slot}`);
		$("#ArcBA").attr("id", `ArcBA${this.slot}`);
		$("#TriBA").attr("id", `TriBA${this.slot}`);
		$("#ArcBC").attr("id", `ArcBC${this.slot}`);
		$("#TriBC").attr("id", `TriBC${this.slot}`);
		$("#ArcCA").attr("id", `TriCA${this.slot}`);
		$("#ArcCB").attr("id", `TriCB${this.slot}`);
		$("#textVizPlayerAName").attr("id", `textVizPlayerAName${this.slot}`);
		$("#textVizPlayerBName").attr("id", `textVizPlayerBName${this.slot}`);
		$("#textVizPlayerCName").attr("id", `textVizPlayerCName${this.slot}`);
		$("#horizontalLabelPlayerA").attr("id", `horizontalLabelPlayerA${this.slot}`);
		$("#horizontalLabelPlayerB").attr("id", `horizontalLabelPlayerB${this.slot}`);
		$("#horizontalLabelPlayerC").attr("id", `horizontalLabelPlayerC${this.slot}`);
		$("#horizontalVizPlayerA").attr("id", `horizontalVizPlayerA${this.slot}`);
		$("#horizontalVizPlayerB").attr("id", `horizontalVizPlayerB${this.slot}`);
		$("#horizontalVizPlayerC").attr("id", `horizontalVizPlayerC${this.slot}`);
		$("#vizFrost").attr("id", `vizFrost${this.slot}`);
	}
	Reset() {
		this.DestroyTextViz();

		this.edgeWidths = {
			AB: this.minArcWidth,
			AC: this.minArcWidth,
			BA: this.minArcWidth,
			BC: this.minArcWidth,
			CA: this.minArcWidth,
			CB: this.minArcWidth
		};

		this.totalMsgs = 0;
		this.playerMsg = [];
		this.playerMsg[this.curVizIdx] = []
		this.playerMsg[this.curVizIdx][0] = {
			msgToA: 0,
			msgToB: 0,
			msgToC: 0,
			numMsg: 0
		};
		this.playerMsg[this.curVizIdx][1] = {
			msgToA: 0,
			msgToB: 0,
			msgToC: 0,
			unreadFromA: 0,
			unreadFromB: 0,
			unreadFromC: 0,
			unreadFromAll: 0,
			numMsg: 0
		};
		this.playerMsg[this.curVizIdx][2] = {
			msgToA: 0,
			msgToB: 0,
			msgToC: 0,
			unreadFromA: 0,
			unreadFromB: 0,
			unreadFromC: 0,
			unreadFromAll: 0,
			numMsg: 0
		};
		this.playerMsg[this.curVizIdx][3] = {
			msgToA: 0,
			msgToB: 0,
			msgToC: 0,
			unreadFromA: 0,
			unreadFromB: 0,
			unreadFromC: 0,
			unreadFromAll: 0,
			numMsg: 0
		};
		this.textVizPct = {
			A: 0,
			B: 0,
			C: 0
		};
	}
	CalculateEdgeWidths() {
		this.totalMsgs = 0;
		if (this.playerMsg && this.playerMsg[this.curVizIdx] && this.playerMsg[this.curVizIdx].length > 0) {
			// Add all messages from/to each player
			this.totalMsgs += this.playerMsg[this.curVizIdx][1].msgToB;
			this.totalMsgs += this.playerMsg[this.curVizIdx][1].msgToC;
			this.totalMsgs += this.playerMsg[this.curVizIdx][2].msgToA;
			this.totalMsgs += this.playerMsg[this.curVizIdx][2].msgToC;
			this.totalMsgs += this.playerMsg[this.curVizIdx][3].msgToA;
			this.totalMsgs += this.playerMsg[this.curVizIdx][3].msgToB;
			if (this.totalMsgs > 0) {
				// Divide 100 by that total to get % rep of each message
				let msgPct = 1 / this.totalMsgs;
				// Multiply each arc # by %
				this.edgeWidths["AB"] = Math.round(this.minArcWidth + ((this.maxArcWidth - this.minArcWidth) * (this.playerMsg[this.curVizIdx][1].msgToB * msgPct))) || this.minArcWidth;
				this.edgeWidths["AC"] = Math.round(this.minArcWidth + ((this.maxArcWidth - this.minArcWidth) * (this.playerMsg[this.curVizIdx][1].msgToC * msgPct))) || this.minArcWidth;
				this.edgeWidths["BA"] = Math.round(this.minArcWidth + ((this.maxArcWidth - this.minArcWidth) * (this.playerMsg[this.curVizIdx][2].msgToA * msgPct))) || this.minArcWidth;
				this.edgeWidths["BC"] = Math.round(this.minArcWidth + ((this.maxArcWidth - this.minArcWidth) * (this.playerMsg[this.curVizIdx][2].msgToC * msgPct))) || this.minArcWidth;
				this.edgeWidths["CA"] = Math.round(this.minArcWidth + ((this.maxArcWidth - this.minArcWidth) * (this.playerMsg[this.curVizIdx][3].msgToA * msgPct))) || this.minArcWidth;
				this.edgeWidths["CB"] = Math.round(this.minArcWidth + ((this.maxArcWidth - this.minArcWidth) * (this.playerMsg[this.curVizIdx][3].msgToB * msgPct))) || this.minArcWidth;
				this.textVizPct["A"] = ((this.playerMsg[this.curVizIdx][1].msgToB + this.playerMsg[this.curVizIdx][1].msgToC) * msgPct * 100).toFixed(1);
				this.textVizPct["B"] = ((this.playerMsg[this.curVizIdx][2].msgToA + this.playerMsg[this.curVizIdx][2].msgToC) * msgPct * 100).toFixed(1);
				this.textVizPct["C"] = ((this.playerMsg[this.curVizIdx][3].msgToA + this.playerMsg[this.curVizIdx][3].msgToB) * msgPct * 100).toFixed(1);
			} else {
				this.edgeWidths["AB"] = this.minArcWidth;
				this.edgeWidths["AC"] = this.minArcWidth;
				this.edgeWidths["BA"] = this.minArcWidth;
				this.edgeWidths["BC"] = this.minArcWidth;
				this.edgeWidths["CA"] = this.minArcWidth;
				this.edgeWidths["CB"] = this.minArcWidth;
				this.textVizPct["A"] = 0;
				this.textVizPct["B"] = 0;
				this.textVizPct["C"] = 0;
			}
		} else {
			this.edgeWidths["AB"] = this.minArcWidth;
			this.edgeWidths["AC"] = this.minArcWidth;
			this.edgeWidths["BA"] = this.minArcWidth;
			this.edgeWidths["BC"] = this.minArcWidth;
			this.edgeWidths["CA"] = this.minArcWidth;
			this.edgeWidths["CB"] = this.minArcWidth;
			this.textVizPct["A"] = 0;
			this.textVizPct["B"] = 0;
			this.textVizPct["C"] = 0;
		}
	}
	GetEdgeWidth(name) {
		return this.edgeWidths[name];
	}
    SetArcWidth(arcName, width) {
		let aw = width < this.maxArcWidth ? width : this.maxArcWidth;
		let tw = width < this.maxTriWidth ? width : this.maxTriWidth;

		$(`#Arc${arcName}${this.slot}`).attr("stroke-width", aw);
		$(`#Tri${arcName}${this.slot}`).attr("stroke-width", tw);
	}
	DestroyTextViz() {
		if (this.appContent) {
			this.appContent.destroy();
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

		if(this.totalMsgs > 0) {
			if(this.textVizPct['A'] > 0) {
				$(`#horizontalLabelPlayerA${this.slot}`).css("width", `${this.textVizPct['A']}%`);
				$(`#horizontalLabelPlayerA${this.slot}`).text(`${this.textVizPct['A']}%`);
				$(`#horizontalVizPlayerA${this.slot}`).css("width", `${this.textVizPct['A']}%`);
				$(`#horizontalVizPlayerA${this.slot}`).show();
			} else {
				$(`#horizontalLabelPlayerA${this.slot}`).css("width", `${this.textVizPct['A']}%`);
				$(`#horizontalLabelPlayerA${this.slot}`).text('');
				$(`#horizontalVizPlayerA${this.slot}`).css("width", `${this.textVizPct['A']}%`);
				$(`#horizontalVizPlayerA${this.slot}`).hide();
			}
			if(this.textVizPct['B'] > 0) {
				$(`#horizontalLabelPlayerB${this.slot}`).css("width", `${this.textVizPct['B']}%`);
				$(`#horizontalLabelPlayerB${this.slot}`).text(`${this.textVizPct['B']}%`);
				$(`#horizontalVizPlayerB${this.slot}`).css("width", `${this.textVizPct['B']}%`);
				$(`#horizontalVizPlayerB${this.slot}`).show();
			} else {
				$(`#horizontalLabelPlayerB${this.slot}`).css("width", `${this.textVizPct['B']}%`);
				$(`#horizontalLabelPlayerB${this.slot}`).text('');
				$(`#horizontalVizPlayerB${this.slot}`).css("width", `${this.textVizPct['B']}%`);
				$(`#horizontalVizPlayerB${this.slot}`).hide();
			}
			if(this.textVizPct['C'] > 0) {
				$(`#horizontalLabelPlayerC${this.slot}`).css("width", `${this.textVizPct['C']}%`);
				$(`#horizontalLabelPlayerC${this.slot}`).text(`${this.textVizPct['C']}%`);
				$(`#horizontalVizPlayerC${this.slot}`).css("width", `${this.textVizPct['C']}%`);
				$(`#horizontalVizPlayerC${this.slot}`).show();
			} else {
				$(`#horizontalLabelPlayerC${this.slot}`).css("width", `${this.textVizPct['C']}%`);
				$(`#horizontalLabelPlayerC${this.slot}`).text('');
				$(`#horizontalVizPlayerC${this.slot}`).css("width", `${this.textVizPct['C']}%`);
				$(`#horizontalVizPlayerC${this.slot}`).hide();
			}
		}
	}
	LastViz() {
		this.SetViz(this.lastVizIdx);
	}
	SetupNextViz(sessionNum) {
		if(!this.playerMsg[sessionNum]) {
			this.playerMsg[sessionNum] = [];
			this.playerMsg[sessionNum][0] = {
				msgToA: 0,
				msgToB: 0,
				msgToC: 0,
				numMsg: 0
			};
			this.playerMsg[sessionNum][1] = {
				msgToA: 0,
				msgToB: 0,
				msgToC: 0,
				unreadFromA: 0,
				unreadFromB: 0,
				unreadFromC: 0,
				unreadFromAll: 0,
				numMsg: 0
			};
			this.playerMsg[sessionNum][2] = {
				msgToA: 0,
				msgToB: 0,
				msgToC: 0,
				unreadFromA: 0,
				unreadFromB: 0,
				unreadFromC: 0,
				unreadFromAll: 0,
				numMsg: 0
			};
			this.playerMsg[sessionNum][3] = {
				msgToA: 0,
				msgToB: 0,
				msgToC: 0,
				unreadFromA: 0,
				unreadFromB: 0,
				unreadFromC: 0,
				unreadFromAll: 0,
				numMsg: 0
			};
		}
	}
	SetViz(session, createData = true) {
		this.lastVizIdx = this.curVizIdx;
		this.curVizIdx = session;
		if(this.curVizIdx <= 0) {
			this.curVizIdx = 0;
		} else if(this.curVizIdx >= this.playerMsg.length) {
			if(createData === true) {
				this.curVizIdx = this.playerMsg.length;
			} else {
				this.curVizIdx = this.playerMsg.length - 1;
			}
		}
		if(createData === true) {
			this.SetupNextViz(this.curVizIdx);
		}
		this.UpdateTextViz();
		$(`#cofSlot${this.slot}Session`).text(`- ${this.curVizIdx + 1}`);
	}
	PrevViz() {
		this.SetViz(this.curVizIdx - 1, false);
	}
	NextViz() {
		this.SetViz(this.curVizIdx + 1, false);
	}
}
