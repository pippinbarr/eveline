Typing = function (game, context, finishCallback, saveData) {
	Phaser.Group.call(this, game);

	this.LINE_WIDTH = 48; // Number of characters allowed per line
	PAPER_MOVE_TIME = 1;
	TEXT_X_OFFSET = 40;
	TEXT_Y_OFFSET = 80;
	CHARACTERS_PER_KEY = 2;

	this.context = context;
	this.finishCallback = finishCallback;

	this.typing = false;

	this.book = this.game.cache.getText('eveline').split('\n');

	this.bg = new Phaser.Sprite(game,0,0,'typewriter_full_bg');
	this.bg.width *= 4;
	this.bg.height *= 4;

	this.paper = new Phaser.Sprite(game,20,this.game.height - 120,'pixel');
	this.paper.width = 440;
	this.paper.height = 570;

	this.text = new Phaser.Text(game,0,0,'',{ font: '12px Courier,monospace', fill: '#000000' });

	this.page = new Phaser.Group(game);

	this.page.add(this.paper);
	this.page.add(this.text);

	this.add(this.bg);
	this.add(this.page);

	this.uiMessage = new UIMessage(game,true);
	this.add(this.uiMessage);

	this.numPages = 0; // Track number of pages written.
	this.numWords = 0; // Track number of words written.
	this.wordStarted = false;

	var save = null;
	if (saveData != null) save = JSON.parse(saveData);

	this.fullText = save ? save.fullText : '';
	this.todayText = '';
	this.completed = save ? save.completed : false;
	this.text.text = save ? save.text : '';
	if (save) this.paper.y = save.y;

	if (!this.completed) {
		this.lineIndex = save ? save.lineIndex : 0;
		this.currentLine = this.book[this.lineIndex].split(" ");
		this.wordIndex = save ? save.wordIndex : 0;
		this.currentWord = this.currentLine[this.wordIndex];
		this.charIndex = save ? save.charIndex : 0;
		this.currentLineLength = save ? save.currentLineLength : 0;
		this.typingEnabled = true;
	}

	this.text.x = this.paper.x + TEXT_X_OFFSET;
	this.text.y = this.paper.y + TEXT_Y_OFFSET;

	this.game.input.keyboard.addCallbacks(this,this.handleKeyDown,this.handleKeyUp,this.handleKeyPress);

	this.keySFX = this.game.add.audio('keySFX',0.3);
	this.bellSFX = this.game.add.audio('bellSFX',0.5);
	this.paperOnSFX = this.game.add.audio('paperOnSFX',0.5);
	this.paperOffSFX = this.game.add.audio('paperOffSFX',0.75);

	this.keyup = false;
	this.escape = true;
	this.startedTypingHandler = null;
	this.visible = false;
};

Typing.prototype = Object.create(Phaser.Group.prototype);

Typing.prototype.constructor = Typing;

Typing.prototype.update = function () {
	Phaser.Group.prototype.update.call(this);

	this.typing = false;
};

Typing.prototype.destroy = function () {
	Phaser.Group.prototype.destroy.call(this);
};

Typing.prototype.show = function (callback) {
	this.visible = true;
	this.callback = callback;
	this.keyup = false;
	if (this.escape) {
		if (this.completed) {
			this.uiMessage.show("ESCAPE to leave the typewriter.");
		}
		else {
			if (DIFFICULTY == 'NORMAL') {
				this.uiMessage.show("TYPE to type. ESCAPE to leave the typewriter.");
			}
			else if (DIFFICULTY == 'NIGHTMARE') {
				this.uiMessage.show("TYPE to type. ENTER for new line. ESCAPE to leave.");
			}
		}
	}
	else {
		if (DIFFICULTY == 'NORMAL') {
			this.uiMessage.show("TYPE to type.");
		}
		else if (DIFFICULTY == 'NIGHTMARE') {
			this.uiMessage.show("TYPE to type. ENTER for new line.");
		}
	}
};

Typing.prototype.hide = function() {
	this.visible = false;
	this.callback();
};


Typing.prototype.handleKeyDown = function (event) {
	var code = event.keyCode;
	if (!this.visible) return;
	if (!this.typingEnabled) return;
	if (code == Phaser.Keyboard.ESC && this.escape) {
		// localStorage.setItem('typing',this.getSaveString());
		this.context.save();
		this.hide();
		return;
	}
	if (this.completed) return; // Don't type if the book is finished.

	if (DIFFICULTY != 'NORMAL') return;

	if (!this.keyup) return;

	this.typing = true;
	this.keyup = false;

	if (this.startedTypingHandler != null) {
		this.startedTypingHandler();
		this.startedTypingHandler = null;
	}

	for (var i = 0; i < CHARACTERS_PER_KEY; i++) {
		// If we have reached the end of a word
		if (this.charIndex >= this.currentWord.length) {
			this.charIndex = 0;
			this.wordIndex++;
			this.numWords++;
			// If we've reached the end of the line
			if (this.wordIndex >= this.currentLine.length) {
				this.wordIndex = 0;
				this.lineIndex++;
				// If reaching the end of this line ends the book
				if (this.lineIndex >= this.book.length) {
					this.completed = true;
					this.typingEnabled = false;
					this.uiMessage.hide();
					this.finishCallback();
					break;
				}
				else {
					this.currentLine = this.book[this.lineIndex].split(" ");
					this.currentWord = this.currentLine[this.wordIndex];
					this.text.text += "\n";
					this.paper.y -= 20;
					this.text.y -= 20;
					this.currentLineLength = 0;
					this.carriageReturnSFX.play();
					break;

				}
			}
			// We have not reached the end of the line
			else {
				// So get the next word
				this.currentWord = this.currentLine[this.wordIndex];
				// Check if the word would go off the end of the typing line
				if (this.currentLineLength + this.currentWord.length > this.LINE_WIDTH) {
					this.text.text += "\n";
					this.paper.y -= 20;
					this.text.y -= 20;
					this.currentLineLength = 0;
					this.carriageReturnSFX.play();
					break;
				}
				else {
					this.text.text += " ";
					this.currentLineLength++;
					this.keySFX.play();
				}
			}
		}
		else {
			this.text.text += this.currentWord.charAt(this.charIndex);
			this.charIndex++;
			this.currentLineLength++;
			this.keySFX.play();
		}

		if (this.currentLineLength == this.LINE_WIDTH - 5) {
			// this.bellSFX.play();
		}
	}

	if (this.paper.y < -100) {
		this.paperOff();
	}

	return;
};

Typing.prototype.handleKeyUp = function (event) {
	this.keyup = true;
};

Typing.prototype.handleKeyPress = function (char, event) {

	if (!this.visible) return;
	if (!this.typingEnabled) return;
	if (this.completed) return; // Don't type if the book is finished.

	this.typing = true;

	if (DIFFICULTY != 'NIGHTMARE') return;

	if (char == '\n' || char == '\r' || char == '\r\n' || event.which == 13 || event.keyCode == 13) {
		// if (char == '\n') console.log("Char was \\n");
		// else if (char == '\r') console.log("Char was \\r");
		// else if (char == '\r\n') console.log("Char was \\r\\n");
		// else if (event.which == 13) console.log("Which was 13");
		// else if (event.keyCode == 13) console.log("Keycode was 13");
		this.text.text += "\n";
		this.carriageReturnSFX.play();
		this.fullText += "%0D";
		this.todayText += "\n";
		this.paper.y -= 20;
		this.text.y -= 20;
		this.currentLineLength = 0;
		if (this.wordStarted) {
			this.numWords++;
			this.wordStarted = false;
		}

		if (this.paper.y < -100) {
			this.paperOff();
		}
	}
	else if (this.currentLineLength + 1 > this.LINE_WIDTH) {
		// this.bellSFX.play();
		return;
	}
	else {
		if (char == ' ' && this.wordStarted) {
			this.numWords++;
			this.wordStarted = false;
		}
		else {
			this.wordStarted = true;
		}

		this.currentLineLength++;
		this.text.text += char;
		this.fullText += char;
		this.todayText += char;
		this.keySFX.play();
	}

	if (this.currentLineLength == this.LINE_WIDTH - 6) {
		this.bellSFX.play();
	}

	return;

};

Typing.prototype.manuscriptCompleteDialogComplete = function () {
	this.uiMessage.show("ESCAPE to leave the typewriter.");
	this.typingEnabled = true;
};

Typing.prototype.paperOff = function () {
	this.numPages++;
	this.typingEnabled = false;
	this.game.time.events.add(Phaser.Timer.SECOND * 2, this.startPaperOff, this);
};

Typing.prototype.startPaperOff = function () {
	this.paperOffSFX.play();
	this.game.add.tween(this.paper).to( { y: -this.paper.height }, Phaser.Timer.SECOND * PAPER_MOVE_TIME, Phaser.Easing.Linear.None, true);
	var paperTween = this.game.add.tween(this.text).to( { y: -this.paper.height + TEXT_Y_OFFSET }, Phaser.Timer.SECOND * PAPER_MOVE_TIME, Phaser.Easing.Linear.None, true);
	paperTween.onComplete.addOnce(this.paperOffComplete,this);
}


Typing.prototype.paperOffComplete = function () {
	if (this.completed) {
		// End of manuscript!
		this.visible = false;
	}
	else {
		// Start a new page
		this.game.time.events.add(Phaser.Timer.SECOND * 1, this.paperOn, this);
	}
};


Typing.prototype.paperOn = function () {
	this.text.text = '';
	this.paper.y = this.game.height;
	this.text.y = this.paper.y + TEXT_Y_OFFSET;

	this.paperOnSFX.play();

	this.game.add.tween(this.paper).to( { y: this.game.height - 120 }, Phaser.Timer.SECOND * 2, Phaser.Easing.Linear.None, true);
	var paperTween = this.game.add.tween(this.text).to( { y: this.game.height - 120 + TEXT_Y_OFFSET }, Phaser.Timer.SECOND * 2, Phaser.Easing.Linear.None, true);
	paperTween.onComplete.addOnce(this.paperOnComplete,this);
};

Typing.prototype.paperOnComplete = function () {
	this.typingEnabled = true;
	this.currentLineLength = 0;
};


Typing.prototype.getSaveString = function () {
	var saveData = {
		text: this.text.text,
		lineIndex: this.lineIndex,
		wordIndex: this.wordIndex,
		charIndex: this.charIndex,
		currentLineLength: this.currentLineLength,
		completed: this.completed,
		y: this.paper.y,
		fullText: this.fullText
	}

	return JSON.stringify(saveData);
};

Typing.prototype.resetFinalWriting = function (startedTypingHandler) {
	this.book = this.game.cache.getText('moby_dick').split('\n');
	this.completed = false;
	this.lineIndex = 0;
	this.currentLine = this.book[this.lineIndex].split(" ");
	this.wordIndex = 0;
	this.currentWord = this.currentLine[this.wordIndex];
	this.charIndex = 0;
	this.currentLineLength = 0;
	this.typingEnabled = true;
	this.text.text = '';
	this.paper.y = this.game.height - 120;
	this.text.y = this.paper.y + TEXT_Y_OFFSET;
	this.escape = false;
	this.startedTypingHandler = startedTypingHandler;
};

Typing.prototype.enable = function () {
	this.typingEnabled = true;
};

Typing.prototype.disable = function () {
	this.typingEnabled = false;
	this.uiMessage.visible = false;
};

Typing.prototype.getText = function () {
	return this.fullText;
}

Typing.prototype.getNumWords = function () {
	if (DIFFICULTY == 'NORMAL') {
		return this.numWords;
	}
	else if (DIFFICULTY == 'NIGHTMARE') {
		return this.todayText.split(' ').length;
	}
}
