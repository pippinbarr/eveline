UIMessage = function (game, top) {
	Phaser.Group.call(this, game);

	this.bg = this.game.add.sprite(0,0,'pixel');
	this.bg.width = game.width;
	this.bg.height = 30;
	this.bg.tint = 0x000000;
	this.text = new Phaser.Text(game,0,0,'',{ font: '14px monospace', align: 'center', fill: '#ffffff' });
	this.text.anchor.x = this.text.anchor.y = 0.5;
	this.text.x = this.game.width/2;
	this.text.y = this.bg.height/2 + 4;
	this.add(this.bg);
	this.add(this.text);
	this.visible = false;

	this.top = top;

	if (this.top) {
		this.bg.y = 0;
	}
	else {
		this.bg.y = this.game.height - this.bg.height;
	}
	this.text.y = this.bg.y + this.bg.height/2 + 4;

};

UIMessage.prototype = Object.create(Phaser.Group.prototype);

UIMessage.prototype.constructor = UIMessage;

UIMessage.prototype.update = function () {
	Phaser.Group.prototype.update.call(this);
};

UIMessage.prototype.destroy = function () {
	Phaser.Group.prototype.destroy.call(this);
};

UIMessage.prototype.show = function(text) {
	this.text.text = text;
	this.bg.height = this.text.height * 1.2;
	if (this.top) {
		this.bg.y = 0;
	}
	else {
		this.bg.y = this.game.height - this.bg.height;
	}
	this.text.y = this.bg.y + this.bg.height/2 + 4;
	this.visible = true;
	// console.log("UIMessage.show(" + text + ")");
};

UIMessage.prototype.hide = function() {
	this.text.text = '';
	this.visible = false;
	// console.log("UIMessage.hide()");
};
