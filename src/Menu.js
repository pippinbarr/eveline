DIFFICULTY = 'NORMAL';


BasicGame.Menu = function (game)
{
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
  //	But do consider them as being 'reserved words', i.e. don't create a property for your own game called world or you'll over-write the world reference.
};



BasicGame.Menu.prototype = {

  create: function () {

    this.game.stage.backgroundColor = '#CCCCCC';

    // Game selection

    // localStorage.clear();

    var margin = 32;
    this.bg = this.game.add.sprite(margin,0,'pixel');
    this.bg.height = this.game.height;
    this.bg.width = this.game.width - 2*margin;

    this.titleMenu = this.game.add.group();

    this.titleText = new Phaser.Text(this.game,100,100,'Eveline\n-------',{ font: '12px Courier,monospace', fill: '#000000' });
    // this.titleText.anchor.x = this.titleText.anchor.y = 0.5;
    this.titleMenu.add(this.titleText);

    if (localStorage.getItem('day')) {
      this.continueText = new Phaser.Text(this.game,this.titleText.x,this.titleText.y + this.titleText.height + 10,'Continue.',{ font: '12px Courier,monospace', fill: '#000000' });
      // this.continueText.anchor.x = this.continueText.anchor.y = 0.5;
      this.titleMenu.add(this.continueText);
    }

    var newGameY = (this.continueText ? (this.continueText.y + this.continueText.height + 10) : this.titleText.y + this.titleText.height + 20);
    this.newGameText = new Phaser.Text(this.game,this.titleText.x,newGameY,'New game.',{ font: '12px Courier,monospace', fill: '#000000' });
    // this.newGameText.anchor.x = this.newGameText.anchor.y = 0.5;
    this.titleMenu.add(this.newGameText);

    if (this.continueText) {
      this.markerText = new Phaser.Text(this.game,this.continueText.x - 12,this.continueText.y,'>',{ font: '12px Courier,monospace', fill: '#000000' });
      this.selected = this.continueText;
    }
    else {
      this.markerText = new Phaser.Text(this.game,this.newGameText.x - 12,this.newGameText.y,'>',{ font: '12px Courier,monospace', fill: '#000000' });
      this.selected = this.newGameText;
    }

    this.game.add.existing(this.markerText);

    // this.titleMenu.visible = false;

    // Difficulty selection

    this.difficultyMenu = this.game.add.group();

    this.skillText = new Phaser.Text(this.game,100,100,'Skill level:',{ font: '12px Courier,monospace', fill: '#000000' });
    // this.skillText.anchor.x = this.skillText.anchor.y = 0.5;
    this.difficultyMenu.add(this.skillText);

    this.normalText = new Phaser.Text(this.game,this.skillText.x,this.skillText.y + this.skillText.height + 10,'Normal.',{ font: '12px Courier,monospace', fill: '#000000' });
    // this.normalText.anchor.x = this.normalText.anchor.y = 0.5;
    this.difficultyMenu.add(this.normalText);

    this.nightmareText = new Phaser.Text(this.game,this.skillText.x,this.normalText.y + this.normalText.height + 10,'Nightmare!',{ font: '12px Courier,monospace', fill: '#000000' });
    // this.nightmareText.anchor.x = this.nightmareText.anchor.y = 0.5;
    this.difficultyMenu.add(this.nightmareText);

    this.backText = new Phaser.Text(this.game,this.nightmareText.x,this.nightmareText.y + this.nightmareText.height + 10,'Go back.',{ font: '12px Courier,monospace', fill: '#000000' });
    // this.nightmareText.anchor.x = this.nightmareText.anchor.y = 0.5;
    this.difficultyMenu.add(this.backText);

    this.difficultyMenu.visible = false;


    // UI

    this.uiMessage = new UIMessage(this.game,false);
    this.uiMessage.show("Use ARROW KEYS and ENTER to select an option.");

    this.keySFX = this.game.add.audio('keySFX',0.3);


    // this.game.input.keyboard.onDownCallback = this.handleKeyDown;

    this.interstitial = new Interstitial(this.game,this);
    this.interstitial.show('');
    this.interstitial.fadeOutBG();

  },



  update: function () {

    if (this.game.input.keyboard.downDuration(Phaser.KeyCode.DOWN,1)) {
      this.keySFX.play();
      if (this.titleMenu.visible && this.selected == this.continueText) {
        this.selected = this.newGameText;
      }
      else if (this.difficultyMenu.visible && this.selected == this.normalText) {
        this.selected = this.nightmareText;
      }
      else if (this.difficultyMenu.visible && this.selected == this.nightmareText) {
        this.selected = this.backText;
      }
    }
    else if (this.game.input.keyboard.downDuration(Phaser.KeyCode.UP,1)) {
      this.keySFX.play();
      if (this.titleMenu.visible && this.selected == this.newGameText && this.continueText) {
        this.selected = this.continueText;
      }
      else if (this.difficultyMenu.visible && this.selected == this.nightmareText) {
        this.selected = this.normalText;
      }
      else if (this.difficultyMenu.visible && this.selected == this.backText) {
        this.selected = this.nightmareText;
      }
    }
    else if (this.game.input.keyboard.downDuration(Phaser.KeyCode.ENTER,1)) {
      this.keySFX.play();
      if (this.titleMenu.visible) {
        if (this.selected == this.continueText) {
          this.game.state.start('Day');
        }
        else if (this.selected == this.newGameText) {
          localStorage.clear();
          this.titleMenu.visible = false;
          this.difficultyMenu.visible = true;
          this.selected = this.normalText;
        }
      }
      else if (this.difficultyMenu.visible) {
        if (this.selected == this.normalText) {
          localStorage.setItem('difficulty','NORMAL');
          // console.log("Menu calling fadeIn");
          this.interstitial.fadeIn('',this.startGame.bind(this),1,false,this);
        }
        else if (this.selected == this.nightmareText) {
          localStorage.setItem('difficulty','NIGHTMARE');
          this.interstitial.fadeIn('',this.startGame.bind(this),null,false,this);
        }
        else if (this.selected == this.backText) {
          this.difficultyMenu.visible = false;
          this.titleMenu.visible = true;
          if (this.continueText) this.selected = this.continueText;
          else this.selected = this.newGameText;
        }
      }
    }

    this.markerText.y = this.selected.y;
  },

  startGame: function () {
    // console.log("Day calling state.start");
    this.game.state.start('Day');
  },


  shutdown: function () {

    this.game.input.keyboard.onDownCallback = null;

  }

};
