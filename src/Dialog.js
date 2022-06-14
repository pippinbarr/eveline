Dialog = function(game) {
  Phaser.Group.call(this, game);

  DIALOG_TEXT_WIDTH = 320;
  CONTINUE_TIME = 1;

  this.running = false;

  this.bgBack = new Phaser.Sprite(game, 0, 0, 'pixel');
  this.bgBack.tint = 0xffffff;
  this.bgBack.anchor.x = this.bgBack.anchor.y = 0.5;

  this.bgMid = new Phaser.Sprite(game, 0, 0, 'pixel');
  this.bgMid.tint = 0x333333;
  this.bgMid.anchor.x = this.bgMid.anchor.y = 0.5;

  this.bgFront = new Phaser.Sprite(game, 0, 0, 'pixel');
  this.bgFront.tint = 0xffffff;
  this.bgFront.anchor.x = this.bgFront.anchor.y = 0.5;

  this.bgBack.x = this.bgMid.x = this.bgFront.x = game.width / 2;
  this.bgBack.y = this.bgMid.y = this.bgFront.y = game.height / 2;

  this.text = new Phaser.Text(game, 0, 0, '', {
    font: '14px monospace',
    fill: '#000000'
  });
  this.text.wordWrap = true;
  this.text.wordWrapWidth = DIALOG_TEXT_WIDTH - 16;

  this.dialogBox = new Phaser.Group(game);

  this.dialogBox.add(this.bgBack);
  this.dialogBox.add(this.bgMid);
  this.dialogBox.add(this.bgFront);
  this.dialogBox.add(this.text);

  this.uiMessage = new UIMessage(game, true);

  this.callback = null;

  this.add(this.dialogBox);
  this.add(this.uiMessage);

  this.visible = false;
};

Dialog.prototype = Object.create(Phaser.Group.prototype);

Dialog.prototype.constructor = Dialog;

Dialog.prototype.update = function() {
  Phaser.Group.prototype.update.call(this);

  this.handleInput();
};

Dialog.prototype.destroy = function() {
  Phaser.Group.prototype.destroy.call(this);
};

Dialog.prototype.handleInput = function() {
  if (!this.visible) return;
  if (this.game.input.keyboard.downDuration(Phaser.KeyCode.SPACEBAR, 1)) {
    if (this.uiMessage.visible) {
      this.nextMessage();
    }
  }
};

Dialog.prototype.show = function(dialog, callback) {

  this.running = true;

  this.currentMessageIndex = 0;
  this.currentDialog = dialog;
  this.callback = callback;

  var index = Math.floor(Math.random() * this.currentDialog[this.currentMessageIndex].length);
  this.showMessage(this.currentDialog[this.currentMessageIndex][index]);
};

Dialog.prototype.nextMessage = function() {
  this.currentMessageIndex++;
  if (this.currentMessageIndex >= this.currentDialog.length) {
    this.hide();
    this.running = false;
    this.callback();
    return false;
  }
  else {
    var index = Math.floor(Math.random() * this.currentDialog[this.currentMessageIndex].length);
    this.game.time.events.add(Phaser.Timer.SECOND * 0.75, this.showMessage, this, this.currentDialog[this.currentMessageIndex][index]);
    this.hide();
    return true;
  }
};

Dialog.prototype.showMessage = function(messageText) {
    if (this.text.text == messageText) return;

    this.game.time.events.add(Phaser.Timer.SECOND * CONTINUE_TIME / 2, this.showContinue, this);

    this.bgBack.width = DIALOG_TEXT_WIDTH + 8 + 8 + 8;
    this.bgMid.width = DIALOG_TEXT_WIDTH + 8 + 8;
    this.bgFront.width = DIALOG_TEXT_WIDTH + 8;

    this.text.anchor.y = 0.5;
    this.text.x = this.bgFront.x - this.bgFront.width / 2 + 8;
    this.text.y = this.game.height / 2 + 2;

    this.text.text = messageText;

    this.bgBack.height = this.text.height + 8 + 8 + 8;
    this.bgMid.height = this.bgBack.height - 8;
    this.bgFront.height = this.bgMid.height - 8;

    this.visible = true;
  },

  Dialog.prototype.showContinue = function() {
    this.uiMessage.show("Press SPACE to continue");
  }

Dialog.prototype.hide = function() {
  this.text.text = '';
  this.visible = false;
  this.uiMessage.hide();
};