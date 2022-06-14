var FADE_TIME = 1;

Interstitial = function (game,context) {
	Phaser.Group.call(this, game);

	this.context = context;

	this.fadeTime = FADE_TIME;

	this.bg = this.game.add.sprite(0,0,'pixel');
	this.bg.anchor.x = this.bg.anchor.y = 0.5;
	this.bg.x = game.width/2;
	this.bg.y = game.width/2;
	this.bg.width = game.width;
	this.bg.height = game.height;
	this.bg.tint = 0x000000;

	this.text = new Phaser.Text(game,0,0,'Day 1',{ font: '16px monospace', fill: '#ffffff' });
	this.text.anchor.x = this.text.anchor.y = 0.5;
	this.text.x = game.width/2;
	this.text.y = game.height/2;
	this.text.wordWrap = true;
	this.text.wordWrapWidth = game.width * 0.75;

	this.add(this.bg);
	this.add(this.text);
	this.visible = false;
};

Interstitial.prototype = Object.create(Phaser.Group.prototype);

Interstitial.prototype.constructor = Interstitial;

Interstitial.prototype.update = function () {
	Phaser.Group.prototype.update.call(this);
};

Interstitial.prototype.destroy = function () {
	Phaser.Group.prototype.destroy.call(this);
};

Interstitial.prototype.show = function(text,fadeIn,fadeOut,callback) {
	this.text.text = text;
	this.visible = true;
	this.text.alpha = 0;
	var tween = this.game.add.tween(this.text).to( {
		alpha: 1 },
		Phaser.Timer.SECOND * this.fadeTime,
		Phaser.Easing.Linear.None,
		true);
	tween.onComplete.addOnce(this.fadeInComplete,this);

	this.callback = callback;
};

Interstitial.prototype.fadeIn = function(text,callback,fadeTime,startOnBlack) {
	this.text.text = text;
	this.callback = callback;

	this.visible = true;
	// this.alpha = 0;

	// If we start on black then we just wait and then fade in the text
	if (startOnBlack) {
		this.bg.alpha = 1;
		this.text.alpha = 0;
		this.game.time.events.add(Phaser.Timer.SECOND * (fadeTime ? fadeTime : this.fadeTime), this.fadeInText.bind(this), this, callback, fadeTime);
	}
	// Otherwise we fade in the black then fade in the text after
	else {
		this.bg.alpha = 0;
		this.text.alpha = 0;
		var bgTween = this.game.add.tween(this.bg).to( {
			alpha: 1 },
			Phaser.Timer.SECOND * (fadeTime ? fadeTime : this.fadeTime),
			Phaser.Easing.Linear.None,
			true);

			// console.log("fadeTime of " + fadeTime)
		bgTween.onComplete.addOnce(this.fadeInText,this,0,callback,fadeTime);
	}
};

Interstitial.prototype.fadeInText = function (target,tween,callback,fadeTime) {

	var textTween = this.game.add.tween(this.text).to( {
		alpha: 1 },
		Phaser.Timer.SECOND * (fadeTime ? fadeTime : this.fadeTime),
		Phaser.Easing.Linear.None,
		true);


	if (this.callback != null) textTween.onComplete.addOnce(this.callback,this.context);
};

Interstitial.prototype.fadeOut = function (callback,fadeTime,endOnBlack) {
	this.callback = callback;

	var tween = this.game.add.tween(this.text).to( {
		alpha: 0 },
		Phaser.Timer.SECOND * (fadeTime ? fadeTime/2 : this.fadeTime),
		Phaser.Easing.Linear.None,
		true);

		if (!endOnBlack) {
			tween.onComplete.addOnce(this.fadeOutBG,this,0,callback,fadeTime);
		}
		else {
			if (callback != null) tween.onComplete.addOnce(callback,this);
		}
};

Interstitial.prototype.fadeOutBG = function (target,tween,callback,fadeTime) {
	var bgTween = this.game.add.tween(this.bg).to( {
		alpha: 0 },
		Phaser.Timer.SECOND * (fadeTime ? fadeTime/2 : this.fadeTime),
		Phaser.Easing.Linear.None,
		true);

	if (callback != null) bgTween.onComplete.addOnce(callback,this.context);
};

Interstitial.prototype.show = function() {
	this.text.text = '';
	this.visible = true;
	this.alpha = 1;
	if (this.callback != null) this.callback();
};

Interstitial.prototype.hide = function() {
	this.text.text = '';
	this.visible = false;
	if (this.callback != null) this.callback();
};
