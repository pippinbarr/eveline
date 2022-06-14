BasicGame.Preloader = function (game) {

	this.background = null;
	this.preloadBar = null;

	this.ready = false;

};

BasicGame.Preloader.prototype = {

	preload: function () {

		//	These are the assets we loaded in Boot.js
		//	A nice sparkly background and a loading progress bar
		// this.background = this.add.sprite(0, 0, 'preloaderBackground');
		this.preloadBar = this.add.sprite(0, 0, 'preloaderBar');
		this.preloadBar.y = this.game.canvas.width/2 - this.preloadBar.height/2;

		//	This sets the preloadBar sprite as a loader sprite.
		//	What that does is automatically crop the sprite from 0 to full-width
		//	as the files below are loaded in.
		// this.load.setPreloadSprite(this.preloadBar);

		this.load.spritesheet('avatar_1','assets/images/avatar_1.png',56,140);
		this.load.image('avatar_seated_1','assets/images/avatar_seated_1.png');
		this.load.image('avatar_lying_down_1','assets/images/avatar_lying_down_1.png');
		this.load.spritesheet('avatar_2','assets/images/avatar_2.png',56,140);
		this.load.image('avatar_seated_2','assets/images/avatar_seated_2.png');
		this.load.image('avatar_lying_down_2','assets/images/avatar_lying_down_2.png');
		this.load.spritesheet('avatar_3','assets/images/avatar_3.png',56,140);
		this.load.image('avatar_seated_3','assets/images/avatar_seated_3.png');
		this.load.image('avatar_lying_down_3','assets/images/avatar_lying_down_3.png');
		this.load.spritesheet('avatar_4','assets/images/avatar_4.png',56,140);
		this.load.image('avatar_seated_4','assets/images/avatar_seated_4.png');
		this.load.image('avatar_lying_down_4','assets/images/avatar_lying_down_4.png');

		this.load.image('pixel','assets/images/pixel.png');
		this.load.image('studio_bg','assets/images/studio_bg.png');
		this.load.image('desk','assets/images/desk.png');
		this.load.image('chair','assets/images/chair.png');
		this.load.image('shelves','assets/images/shelves.png');
		this.load.image('coffee_table','assets/images/coffee_table.png');
		this.load.image('armchair','assets/images/armchair.png');
		this.load.image('telephone','assets/images/telephone.png');
		this.load.image('cityscape','assets/images/cityscape.png');
		this.load.image('plant','assets/images/plant.png');

		this.load.image('typewriter_full_bg','assets/images/typewriter_full_bg.png');

		this.load.spritesheet('floor_lamp','assets/images/floor_lamp.png',9,32);

		// SFX

		this.load.audio('keySFX',['assets/sounds/typewriter_key.mp3','assets/sounds/typewriter_key.ogg']);
		this.load.audio('bellSFX',['assets/sounds/bell.mp3','assets/sounds/bell.ogg']);
		this.load.audio('paperOnSFX',['assets/sounds/paper_on.mp3','assets/sounds/paper_on.ogg']);
		this.load.audio('paperOffSFX',['assets/sounds/paper_off.mp3','assets/sounds/paper_off.ogg']);
		this.load.audio('carriageReturnSFX',['assets/sounds/carriage_return.mp3','assets/sounds/carriage_return.ogg']);

		// this.load.audio('keySFX',['assets/sounds/typewriter_key.ogg']);
		// this.load.audio('bellSFX',['assets/sounds/bell.ogg']);

		// MUSIC

		this.load.audio('radio_one',['assets/music/radio_one.mp3','assets/music/radio_one.ogg']);
		this.load.audio('radio_two',['assets/music/radio_two.mp3','assets/music/radio_two.ogg']);
		this.load.audio('radio_three',['assets/music/radio_three.mp3','assets/music/radio_three.ogg']);

		// this.load.audio('radio_one',['assets/music/radio_one.ogg']);
		// this.load.audio('radio_two',['assets/music/radio_two.ogg']);
		// this.load.audio('radio_three',['assets/music/radio_three.ogg']);


		// TEXTS

		this.load.text('the_metamorphosis', 'assets/texts/the_metamorphosis.txt');
		this.load.text('eveline', 'assets/texts/eveline.txt');
		this.load.text('moby_dick', 'assets/texts/moby_dick.txt');

		// FONTS

		// this.load.bitmapFont('atari', 'assets/fonts/atari.png', 'assets/fonts/atari.xml');

	},


	create: function () {

		//	Once the load has finished we disable the crop because we're going to sit in the update loop for a short while as the music decodes
		this.preloadBar.cropEnabled = false;

	},


	update: function () {

		if (this.cache.isSoundDecoded('radio_three') && this.ready == false) {
			this.ready = true;
			this.state.start('Menu');
		}

	}

};
