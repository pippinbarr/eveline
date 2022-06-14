BasicGame.WritingTest = function (game) {
  //	When a State is added to Phaser it automatically has the following properties set on it, even if they already exist:

  this.game;		//	a reference to the currently running game
  this.add;		//	used to add sprites, text, groups, etc
  this.camera;	//	a reference to the game camera
  this.cache;		//	the game cache
  this.input;		//	the global input manager (you can access this.input.keyboard, this.input.mouse, as well from it)
  this.load;		//	for preloading assets
  this.math;		//	lots of useful common math operations
  this.sound;		//	the sound manager - add a sound, play one, set-up markers, etc
  this.stage;		//	the game stage
  this.time;		//	the clock
  this.tweens;    //  the tween manager
  this.state;	    //	the state manager
  this.world;		//	the game world
  this.particles;	//	the particle manager
  this.physics;	//	the physics manager
  this.rnd;		//	the repeatable random number generator

  //	You can use any of these from any function within this State.
  //	But do consider them as being 'reserved words', i.e. don't create a property for your own game called "world" or you'll over-write the world reference.

};


BasicGame.WritingTest.prototype = new Phaser.State();

BasicGame.WritingTest.prototype.parent = Phaser.State;

WritingTestState = {
  PLAY: 'PLAY',
};

var mText = [
"One morning, when Gregor Samsa woke from troubled dreams, he found",
"himself transformed in his bed into a horrible vermin.  He lay on",
"his armour-like back, and if he lifted his head a little he could",
"see his brown belly, slightly domed and divided by arches into stiff",
"sections.  The bedding was hardly able to cover it and seemed ready",
"to slide off any moment.  His many legs, pitifully thin compared",
"with the size of the rest of him, waved about helplessly as he",
"looked."
]

BasicGame.WritingTest.prototype = {

  create: function () {

    Phaser.State.prototype.create.call(this);

    // this.game.sound.mute = true;

    this.game.stage.backgroundColor = '#000000';
    this.state = WritingTestState.PLAY;

    // this.typing = this.game.add.bitmapText(8, 8, 'atari','',18);
    this.typing = this.add.text(8,8,'',{ font: 'bold 14px monospace', fill: '#ffffff' });
    this.lineChars = 0;
    this.lineIndex = 0;
    this.charIndex = 0;

    this.game.input.keyboard.addCallbacks(this,null,this.handleKeyPress,null);

  },


  update: function () {

    Phaser.State.prototype.update.call(this);

  },


  handleKeyPress: function (context, e) {
    this.typing.text += mText[this.lineIndex].charAt(this.charIndex);
    this.charIndex++;
    if (this.charIndex > mText[this.lineIndex].length) {
      this.typing.text += "\n";
      this.charIndex = 0;
      this.lineIndex++;
    }
  },



  shutdown: function () {

  }

};




BasicGame.WritingTest.prototype.constructor = BasicGame.WritingTest;
