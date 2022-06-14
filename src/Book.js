Book = function (game,context,saveData) {
	Phaser.Group.call(this, game);

	LINE_WIDTH = 38; // Number of characters allowed per line
	TEXT_X_OFFSET = 40;
	TEXT_Y_OFFSET = 50;
	MAX_TEXT_HEIGHT = 400;

	var save = JSON.parse(saveData);

	this.context = context;

	this.book = this.game.cache.getText('the_metamorphosis').split('\n');

	this.bg = new Phaser.Sprite(game,0,0,'typewriter_full_bg');
	this.bg.width *= 4;
	this.bg.height *= 4;

	this.paper = new Phaser.Sprite(game,20,0,'pixel');
	this.paper.width = 440;
	this.paper.height = 570;

	this.text = new Phaser.Text(game,0,0,'',{ font: '12px Courier,monospace', fill: '#000000' });

	this.page = new Phaser.Group(game);

	this.page.add(this.paper);
	this.page.add(this.text);

	this.add(this.bg);
	this.add(this.page);

	this.pages = save != null ? JSON.parse(save.pages) : [{line: 0, word: 0}];
	this.currentPage = save != null ? save.currentPage : 0;

	this.text.text = save != null ? save.text : '';
	this.text.x = this.paper.x + TEXT_X_OFFSET;
	this.text.y = this.paper.y + TEXT_Y_OFFSET;

	this.bookInput = this.game.input.keyboard.createCursorKeys();

	this.bookInputEnabled = false;

	this.uiMessage = new UIMessage(game,true);
	this.add(this.uiMessage);

	this.loadPage();

	this.visible = false;
};

Book.prototype = Object.create(Phaser.Group.prototype);

Book.prototype.constructor = Book;

Book.prototype.update = function () {
	Phaser.Group.prototype.update.call(this);

	this.handleInput();
};

Book.prototype.destroy = function () {
	Phaser.Group.prototype.destroy.call(this);
};

Book.prototype.show = function (callback) {
	this.visible = true;
	this.callback = callback;
	this.bookInputEnabled = true;
	this.uiMessage.show("ARROW KEYS to turn pages. ESCAPE to put the book down.");
};

Book.prototype.hide = function () {
	this.visible = false;
	this.callback();
};

Book.prototype.handleInput = function () {
	if (!this.visible) return;
	if (!this.bookInputEnabled) return;

	if (this.bookInput.left.downDuration(1) || this.bookInput.up.downDuration(1)) {
		this.currentPage = Math.max(0,this.currentPage-1);
		this.loadPage();
	}
	else if (this.bookInput.right.downDuration(1) || this.bookInput.down.downDuration(1)) {
		if (this.pages[this.currentPage + 1].line < this.book.length) {
			this.currentPage++;
		}
		this.loadPage();
	}

	if (this.game.input.keyboard.downDuration(Phaser.KeyCode.ESC,1)) {
		// localStorage.setItem('book',this.getSaveString());
		this.context.save();
		this.hide();
		return;
	}
};

Book.prototype.loadPage = function () {
	if (!this.visible) return;

	this.text.text = '';

	var line = this.pages[this.currentPage].line;
	var word = this.pages[this.currentPage].word;
	var char = 0;

	if (line >= this.book.length) return;

	var currentLine = this.book[line].split(" ");
	var currentWord = currentLine[word];

	var currentLineLength = 0;

	while (this.text.height < MAX_TEXT_HEIGHT) {

		increaseWordForNextPage = false;

		if (char >= currentWord.length) {
			char = 0;
			word++;
			if (word >= currentLine.length) {
				word = 0;
				line++;
				if (line >= this.book.length) {
					break;
				}
				else {
					currentLine = this.book[line].split(" ");
					currentWord = currentLine[word];
					this.text.text += "\n";
					currentLineLength = 0;
				}
			}
			else {
				currentWord = currentLine[word];
				if (currentLineLength + currentWord.length > LINE_WIDTH) {
					this.text.text += "\n";
					currentLineLength = 0;
				}
				else {
					this.text.text += " ";
				}
			}
		}
		else {
			if (currentWord.charAt(char) == '\r' || currentWord.charAt(char) == '\n') {
				char++
			}
			else {
				this.text.text += currentWord.charAt(char);
				char++;
				currentLineLength++;
			}
		}
	}
	if (this.currentPage == this.pages.length-1) {
		this.pages.push({line: line, word: word});
	}
};


Book.prototype.getSaveString = function () {
	var saveData = {
		text: this.text.text,
		pages: JSON.stringify(this.pages),
		currentPage: this.currentPage,
	};
	return JSON.stringify(saveData);
};


Book.prototype.disable = function () {
	this.bookInputEnabled = false;
	this.uiMessage.visible = false;
}
