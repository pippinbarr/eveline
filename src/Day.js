BasicGame.Day = function (game) {

};

BasicGame.Day.prototype = new Phaser.State();

BasicGame.Day.prototype.parent = Phaser.State;

State = {
  WALKING: 'WALKING',
  TYPING: 'TYPING',
  READING: 'READING',
  PHONING: 'PHONING',
  DISTRACTED: 'DISTRACTED',
  DAY_ENDING: 'DAY_ENDING',
  INTRESTITIAL: 'INTERSTITIAL'
}

ManuscriptState = {
  WRITING: 'WRITING',
  MAKE_FIRST_AGENT_CALL: 'MAKE_FIRST_AGENT_CALL',
  MADE_FIRST_AGENT_CALL: 'MADE_FIRST_AGENT_CALL',
  MAKE_SECOND_AGENT_CALL: 'MAKE_SECOND_AGENT_CALL',
  FINAL_WRITING: 'FINAL_WRITING'
}

Trigger = {
  DESK: 'DESK',
  RADIO: 'RADIO',
  TELEPHONE: 'TELEPHONE',
  PLANT: 'PLANT',
  ARMCHAIR: 'ARMCHAIR',
  BOOK: 'BOOK',
  RUG: 'RUG',
  WINDOW: 'WINDOW',
  LAMP: 'LAMP',
  DOOR: 'DOOR',
  NONE: 'NONE'
}

Direction = {
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
  UP: 'UP',
  DOWN: 'DOWN'
}


BasicGame.Day.prototype = {

  create: function () {
    Phaser.State.prototype.create.call(this);

    // localStorage.clear();


    MIN_DAILY_WRITING_TIME = 3 * 60 * 60 * 1000; // Three hours in millis.
    DISTRACTED_MULTIPLIER = 480; // How much faster time passes when distracted
    TYPING_MULTIPLIER = 480; // How much faster time passes while typing

    THOUGHT_TIME_RANGE = 20;
    THOUGHT_TIME_MIN = 10;

    this.state = State.WALKING;

    // Background colour for early morning
    this.game.stage.backgroundColor = '#222222';

    // Load the current day from storage. If nothing, it's day one.
    this.day = localStorage.getItem('day') || 0;
    this.day++; // Now increment the day (a day passes when you start a day)
    var storedDate = localStorage.getItem('date');
    if (storedDate == null) {
      this.date = new Date();
    }
    else {
      this.date = new Date(Date.parse(storedDate));
      this.date.setDate(this.date.getDate() + 1);
    }
    this.timeElapsed = 0;

    // Start physics
    this.physics.startSystem(Phaser.Physics.ARCADE);

    // Set up the various groups
    this.bgGroup = this.game.add.group();
    this.colliders = this.game.add.group();
    this.window = this.game.add.group();
    this.triggers = this.game.add.group();
    this.triggers.visible = false;

    // Set up the basic sprites for the room
    this.setupWalls();
    this.setupRoom();
    this.setupWindow();
    this.setupPlant();

    // Radio
    this.radioStation = 0; // Off
    this.radio = [null,this.game.add.audio('radio_one',1),this.game.add.audio('radio_two',0.4),this.game.add.audio('radio_three',0.4)];

    // Avatar
    this.avatarIndex = localStorage.getItem('avatarIndex') || (Math.floor(Math.random() * 4) + 1);
    this.writer = new Avatar(this.game,this.avatarIndex,360,320);
    this.colliders.add(this.writer);

    this.writerSeatedNoBook = this.addSprite(24,344,'avatar_seated_' + this.avatarIndex,0,this.colliders);
    this.writerSeatedNoBook.visible = false;

    this.writerLyingDown = this.addSprite(260,400,'avatar_lying_down_' + this.avatarIndex,0,this.colliders);
    this.writerLyingDown.visible = false;

    // User-interface
    this.uiMessage = new UIMessage(this.game,true);
    this.game.add.existing(this.uiMessage);

    // Difficulty
    DIFFICULTY = localStorage.getItem('difficulty') || 'NORMAL';

    // Activity user-interfaces
    this.typing = new Typing(this.game,this,this.typingComplete.bind(this),localStorage.getItem('typing'));
    this.game.add.existing(this.typing);
    this.manuscriptState = localStorage.getItem('manuscriptState') || ManuscriptState.WRITING;
    this.hadFirstNightmareConversation = localStorage.getItem('hadFirstNightmareConversation') || false;

    this.book = new Book(this.game,this,localStorage.getItem('book'));
    this.game.add.existing(this.book);

    // Dialog (can be above the typing)
    this.dialog = new Dialog(this.game);
    this.game.add.existing(this.dialog);
    this.thoughtTimer = null;

    // Intersitials
    this.interstitial = new Interstitial(this.game,this);
    this.game.add.existing(this.interstitial);

    // Final setup
    this.writer.freeze();
    this.state = State.INTERSTITIAL;

    if (this.manuscriptState != ManuscriptState.MAKE_SECOND_AGENT_CALL) {
      this.interstitial.fadeIn(this.getDateString(this.date),this.startOfDayInterstitialFadedIn.bind(this),null,true,this);
    }
    else if (localStorage.getItem('seenThreeWeeksLater') == null) {
      localStorage.setItem('seenThreeWeeksLater',true)
      this.interstitial.fadeIn("Three weeks later...",this.startOfDayInterstitialFadedIn.bind(this),null,true,this);
    }
    else {
      this.interstitial.fadeIn(this.getDateString(this.date),this.startOfDayInterstitialFadedIn.bind(this),null,true,this);
    }
  },

  update: function () {
    this.handleCollisions();
    this.handleTriggers();
    this.handleInput();
    this.handleTime();

    this.colliders.sort('depth');
  },

  shutdown: function () {

  },

  typingComplete: function () {
    // This is called when the manuscript is finished.
    // this.typing.hide();
    // console.log("typingComplete called");
    this.uiMessage.hide();
    this.deskTrigger.enabled = false;
    this.manuscriptState = ManuscriptState.MAKE_FIRST_AGENT_CALL;

    // Save the new manuscript state!
    // localStorage.setItem('manuscriptState',this.manuscriptState);
    this.save();

    this.showDialog(MANUSCRIPT_COMPLETE,this.typing.manuscriptCompleteDialogComplete.bind(this.typing));
  },

  handleTime: function () {

    // Time doesn't pass if you should be writing the final thing
    if (this.manuscriptState == ManuscriptState.FINAL_WRITING) return;

    // Time doesn't pass if you should be making a call
    if (this.manuscriptState == ManuscriptState.MAKE_FIRST_AGENT_CALL) return;
    if (this.manuscriptState == ManuscriptState.MAKE_SECOND_AGENT_CALL) return;

    // Time doesn't pass during a dialog
    if (this.dialog.running) return;


    switch (this.state) {
      case State.WALKING:
      // Time elapses at real rate if you're just walking around
      this.timeElapsed += this.game.time.elapsed;
      break;

      case State.TYPING:
      // Time elapses at 60 times rate if you're writing, meaning
      // a day's work takes three minutes.
      if (this.typing.typing) this.timeElapsed += TYPING_MULTIPLIER*this.game.time.elapsed;
      // Otherwise time doesn't pass at all!s
      break;

      case State.PHONING:
      case State.INTERSTITIAL:
      // Time doesn't elapse during interstitials or on the phone
      return;
      break;

      case State.READING:
      case State.DISTRACTED:
      // Time elapses at 60 times rate if you're distracted, meaning
      // a day's work takes 1.5 minutes
      this.timeElapsed += DISTRACTED_MULTIPLIER*this.game.time.elapsed;
      break;
    }

    if (this.timeElapsed >= MIN_DAILY_WRITING_TIME && this.state != State.DAY_ENDING) {
      this.handleEndOfDay();
      this.state = State.DAY_ENDING;
    }
  },

  handleEndOfDay: function () {
    if (this.dialog.running) {
      this.endOfDayTimer = this.game.time.events.add(Phaser.Timer.SECOND * 1, this.handleEndOfDay, this);
      return;
    }

    if (this.writer.currentTrigger) this.writer.currentTrigger.enabled = false;
    this.typing.disable();
    this.book.disable();
    this.uiMessage.visible = false;

    if (this.manuscriptState == ManuscriptState.WRITING) this.showDialog(DAY_END_DIALOG,this.endOfDayFadeOut.bind(this));
    else this.endOfDayFadeOut();
  },

  endOfDayFadeOut: function () {

    this.state = State.INTERSTITIAL;

    var endOfDayMessage = '';
    var daysToAdd = 0;

    if (this.typing.completed) {
      if (this.manuscriptState == ManuscriptState.MAKE_FIRST_AGENT_CALL) {
        endOfDayMessage = "Must remember to call the agent tomorrow."
      }
      else if (this.manuscriptState == ManuscriptState.MADE_FIRST_AGENT_CALL) {
        endOfDayMessage = "Now all you have to do is wait.";
        daysToAdd = 20;
        this.manuscriptState = ManuscriptState.MAKE_SECOND_AGENT_CALL;
        // localStorage.setItem('manuscriptState',this.manuscriptState);
        this.save();
      }
    }
    else if (this.typing.getNumWords() == 0) {
      // Didn't write anything!
      endOfDayMessage = "You didn't write anything today.";
    }
    else if (this.typing.getNumWords() == 1) {
      endOfDayMessage = "Just the one word today.";
    }
    else if (this.typing.getNumWords() < 10) {
      endOfDayMessage = "You managed " + this.typing.getNumWords() + " words today.";
    }
    else {
      endOfDayMessage = "You wrote " + this.typing.getNumWords() + " words today.";
    }

    this.day += daysToAdd;
    this.date.setDate(this.date.getDate() + daysToAdd);

    this.interstitial.fadeIn(endOfDayMessage,this.endOfDayFadedIn.bind(this),2,false,this);
    if (this.radio[this.radioStation] != null) this.radio[this.radioStation].fadeOut(2000);
  },

  endOfDayFadedIn: function () {
    this.game.time.events.add(Phaser.Timer.SECOND * 2, this.fadeOutEndOfDay, this);
  },

  fadeOutEndOfDay: function () {
    this.interstitial.fadeOut(this.startNewDay.bind(this),null,true);
  },

  startNewDay: function () {
    this.save();

    this.game.state.start('Day');
  },

  save: function () {
    localStorage.setItem('avatarIndex',this.avatarIndex);
    localStorage.setItem('day',this.day);
    localStorage.setItem('date',this.date);
    localStorage.setItem('typing',this.typing.getSaveString());
    localStorage.setItem('book',this.book.getSaveString());
    localStorage.setItem('manuscriptState',this.manuscriptState);
    localStorage.setItem('hadFirstNightmareConversation',this.hadFirstNightmareConversation);
    localStorage.setItem('difficulty',DIFFICULTY);
  },

  startedFinalTyping: function () {
    this.handleEndOfGame();
  },

  handleEndOfGame: function () {
    this.state = State.INTERSTITIAL;
    this.interstitial.fadeIn('THE END',this.endOfGameFadedIn.bind(this),10,false,this);
    localStorage.clear();
  },

  endOfGameFadedIn: function () {
    this.interstitial.fadeIn('THE END',null,null,this);
    this.typing.disable();
  },


  handleInput: function () {
    this.handleTriggerInput();

    // For debugging.
    // if (this.game.input.keyboard.downDuration(Phaser.KeyCode.ALT,1)) {
    //   localStorage.clear();
    //   this.game.state.start('Day');
    // }
  },

  handleTriggerInput: function () {
    if (!this.game.input.keyboard.downDuration(Phaser.KeyCode.SPACEBAR,1)) {
      return;
    }

    if (this.state != State.WALKING && this.state != State.DISTRACTED) {
      return;
    }
    if (this.writer.currentTrigger == null) {
      return;
    }
    if (!this.writer.currentTrigger.enabled) {
      return;
    }

    if (this.dialog.running) {
      return;
    }

    switch (this.writer.currentTrigger.triggerType) {
      case Trigger.DESK:
      this.typing.show(this.typingFinished.bind(this));
      this.writer.freeze();
      this.state = State.TYPING;
      if (this.manuscriptState == ManuscriptState.FINAL_WRITING) {
        // this.handleEndOfGame();
      }
      break;

      case Trigger.TELEPHONE:

      if (this.manuscriptState == ManuscriptState.FINAL_WRITING) {
        this.showDialog(NO_TIME_FOR_THAT_PHONE);
        return;
      }

      if (DIFFICULTY == 'NIGHTMARE' && this.typing.getText().split(' ').length < 200) {
        this.showDialog(NOT_ENOUGH_WRITING);
        return;
      }

      this.uiMessage.hide();
      this.state = State.PHONING;
      this.phoneTrigger.enabled = false;
      if (DIFFICULTY == 'NIGHTMARE') {
        if (!this.hadFirstNightmareConversation) {
          this.showDialog(NIGHTMARE_FIRST_CALL,this.nightmarePhoneFinished.bind(this));
          this.hadFirstNightmareConversation = true;
        }
        else {
          this.showDialog(NIGHTMARE_OTHER_CALL,this.nightmarePhoneFinished.bind(this));
        }
      }
      else {
        if (this.typing.completed) {
          if (this.manuscriptState == ManuscriptState.MAKE_FIRST_AGENT_CALL) {
            this.showDialog(MANUSCRIPT_CALL,this.phoneFinished.bind(this));
          }
          else if (this.manuscriptState == ManuscriptState.MAKE_SECOND_AGENT_CALL){
            this.showDialog(MANUSCRIPT_RESULT_CALL,this.phoneFinished.bind(this));
          }
          else if (this.manuscriptState == Manuscript.FINAL_WRITING) {
            this.showDialog(FINAL_WRITING_CALL,this.phoneFinished.bind(this));
          }
          else {
            this.showDialog(NO_MANUSCRIPT_CALL,this.phoneFinished.bind(this));
          }
        }
        else {
          this.showDialog(NO_MANUSCRIPT_CALL,this.phoneFinished.bind(this));
        }
      }

      break;

      case Trigger.PLANT:

      if (this.manuscriptState == ManuscriptState.FINAL_WRITING) {
        this.showDialog(NO_TIME_FOR_THAT_PLANT);
        return;
      }

      if (!this.plant.visible) {
        this.writer.freeze();
        this.plant.visible = true;
        this.state = State.DISTRACTED;
        this.startThoughts(PLANT_THOUGHTS);
      }
      else {
        this.writer.unfreeze();
        this.plant.visible = false;
        this.state = State.WALKING;
        this.stopThoughts();
      }
      break;

      case Trigger.ARMCHAIR:

      if (this.manuscriptState == ManuscriptState.FINAL_WRITING) {
        this.showDialog(NO_TIME_FOR_THAT_ARMCHAIR);
        return;
      }

      if (this.writer.visible) {
        this.writer.freeze();
        this.writer.visible = false;
        this.writerSeatedNoBook.visible = true;
        this.state = State.DISTRACTED;
        this.startThoughts(ARMCHAIR_THOUGHTS);
      }
      else {
        this.writer.unfreeze();
        this.writer.visible = true;
        this.writerSeatedNoBook.visible = false;
        this.state = State.WALKING;
        this.stopThoughts();
      }
      break;

      case Trigger.BOOK:

      if (this.manuscriptState == ManuscriptState.FINAL_WRITING) {
        this.showDialog(NO_TIME_FOR_THAT_BOOK);
        return;
      }

      this.book.show(this.readingFinished.bind(this));
      this.writer.freeze();
      this.state = State.READING;
      break;

      case Trigger.RUG:

      if (this.manuscriptState == ManuscriptState.FINAL_WRITING) {
        this.showDialog(NO_TIME_FOR_THAT_RUG);
        return;
      }

      if (this.writer.visible) {
        this.writer.freeze();
        this.writer.visible = false;
        this.writerLyingDown.visible = true;
        this.state = State.DISTRACTED;
        this.startThoughts(RUG_THOUGHTS);
      }
      else {
        this.writer.unfreeze();
        this.writer.visible = true;
        this.writerLyingDown.visible = false;
        this.state = State.WALKING;
        this.stopThoughts();
      }
      break;

      case Trigger.LAMP:

      if (this.manuscriptState == ManuscriptState.FINAL_WRITING) {
        this.showDialog(NO_TIME_FOR_THAT_LAMP);
        return;
      }

      this.lamp.frame = (1 - this.lamp.frame);
      break;

      case Trigger.RADIO:

      if (this.manuscriptState == ManuscriptState.FINAL_WRITING) {
        this.showDialog(NO_TIME_FOR_THAT_RADIO);
        return;
      }

      if (this.radio[this.radioStation] != null) this.radio[this.radioStation].stop();
      this.radioStation = (this.radioStation + 1) % (this.radio.length);
      if (this.radio[this.radioStation] != null) this.radio[this.radioStation].loopFull(1);
      break;

      case Trigger.WINDOW:

      if (this.manuscriptState == ManuscriptState.FINAL_WRITING) {
        this.showDialog(NO_TIME_FOR_THAT_WINDOW);
        return;
      }

      if (this.window.visible) {
        this.window.visible = false;
        this.writer.unfreeze();
        this.state = State.WALKING;
        this.stopThoughts();
      }
      else {
        this.window.visible = true;
        this.writer.freeze();
        this.state = State.DISTRACTED;
        this.startThoughts(WINDOW_THOUGHTS);
      }
      break;

      case Trigger.DOOR:
      case Trigger.NONE:
      break;

    }
  },

  handleCollisions: function () {
    this.physics.arcade.collide(this.writer,this.colliders,null,null,this);
  },

  handleTriggers: function () {
    var triggers = this.physics.arcade.overlap(this.writer,this.triggers,this.handleTrigger,null,this);
    if (!triggers) {
      this.writer.currentTrigger = null;
      this.uiMessage.hide();
    }
  },

  handleTrigger: function (writer, trigger) {
    this.writer.currentTrigger = trigger;

    if (!trigger.enabled) return;

    switch (trigger.triggerType) {
      case Trigger.DESK:
      if (!this.typing.completed || this.manuscriptState == ManuscriptState.FINAL_WRITING) this.uiMessage.show("Press SPACE to sit at the typewriter.");
      else this.writer.currentTrigger = null;
      break;

      case Trigger.TELEPHONE:
      this.uiMessage.show("Press SPACE to call a literary agent.");
      break;

      case Trigger.ARMCHAIR:
      if (this.writer.visible) {
        this.uiMessage.show("Press SPACE to sit in the armchair.");
      }
      else {
        this.uiMessage.show("Press SPACE to stand up.");
      }
      break;

      case Trigger.BOOK:
      this.uiMessage.show("Press SPACE to read The Metamorphosis by Franz Kafka.");
      break;

      case Trigger.RUG:
      if (this.writer.visible) {
        this.uiMessage.show("Press SPACE to lie down on the rug.");
      }
      else {
        this.uiMessage.show("Press SPACE to stand up.");
      }
      break;

      case Trigger.PLANT:
      if (!this.plant.visible) {
        this.uiMessage.show("Press SPACE to look at the plant.");
      }
      else {
        this.uiMessage.show("Press SPACE to look away.");
      }
      break;

      case Trigger.LAMP:
      if (this.lamp.frame == 0) {
        this.uiMessage.show("Press SPACE to turn on the lamp.");
      }
      else {
        this.uiMessage.show("Press SPACE to turn off the lamp.");
      }
      break;

      case Trigger.RADIO:
      switch (this.radioStation) {
        case 0:
        this.uiMessage.show("Press SPACE to tune the radio to station one.");
        break;

        case 1:
        this.uiMessage.show("Press SPACE to tune the radio to station two.");
        break;

        case 2:
        this.uiMessage.show("Press SPACE to tune the radio to station three.");
        break;

        case 3:
        this.uiMessage.show("Press SPACE to turn the radio off.");
        break;

      }
      break;

      case Trigger.DOOR:
      this.writer.setVelocity(0,-WALK_V_SPEED);
      this.writer.keys.enabled = false;
      this.game.time.events.add(Phaser.Timer.SECOND * 0.75, this.showDoorLeaving, this);
      break;

      case Trigger.WINDOW:
      if (this.window.visible) {
        this.uiMessage.show("Press SPACE to look away.");
      }
      else {
        this.uiMessage.show("Press SPACE to look out the window.");
      }
      break;

      case Trigger.NONE:
      break;
    }
  },

  showDoorLeaving: function () {
    if (this.manuscriptState == ManuscriptState.MAKE_FIRST_AGENT_CALL) {
      this.showDialog(NO_LEAVING_MAKE_THE_FIRST_CALL);
    }
    else if (this.manuscriptState == ManuscriptState.MAKE_SECOND_AGENT_CALL) {
      this.showDialog(NO_LEAVING_MAKE_THE_SECOND_CALL);
    }
    else if (this.manuscriptState == ManuscriptState.FINAL_WRITING) {
      this.showDialog(NO_LEAVING_FINAL_WRITING);
    }
    else {
      this.showDialog(NO_LEAVING);
    }
  },

  showDialog: function (text,callback) {
    this.writer.freeze();
    if (callback) {
      this.dialog.show(text,callback);
    }
    else {
      this.dialog.show(text,this.dialogEnded.bind(this));
    }
  },

  dialogEnded: function () {
    this.state = State.WALKING;
    this.writer.unfreeze();
  },

  typingFinished: function () {
    this.state = State.WALKING;
    this.writer.unfreeze();
  },

  readingFinished: function () {
    this.state = State.WALKING;
    this.writer.unfreeze();
  },

  phoneFinished: function () {

    if (this.typing.completed) {
      // Phone call was about sending it in
      if (this.manuscriptState == ManuscriptState.MAKE_FIRST_AGENT_CALL) {
        this.manuscriptState = ManuscriptState.MADE_FIRST_AGENT_CALL;
        this.phoneTrigger.enabled = false;
        this.handleEndOfDay();
      }
      // Phone call was about getting the bad news
      else if (this.manuscriptState == ManuscriptState.MAKE_SECOND_AGENT_CALL) {
        this.manuscriptState = ManuscriptState.FINAL_WRITING;
        // localStorage.setItem('manuscriptState',this.manuscriptState);
        this.save();
        this.state = State.WALKING;
        this.writer.unfreeze();
        this.typing.resetFinalWriting(this.startedFinalTyping.bind(this));
        this.deskTrigger.enabled = true;
        this.phoneTrigger.enabled = true;
      }
      else {
        this.state = State.WALKING;
        this.writer.unfreeze();
        this.phoneTrigger.enabled = true;
      }
    }
    // Phone call was not needed
    else {
      this.state = State.WALKING;
      this.writer.unfreeze();
      this.phoneTrigger.enabled = true;
    }
  },

  nightmarePhoneFinished: function () {
    window.open("data:text/ascii;charset=ascii,"+"Pippin's email is: pippin.barr@gmail.com%0D%0D%0D"+this.typing.getText(), "", "_blank")
    this.state = State.WALKING;
    this.writer.unfreeze();
    this.phoneTrigger.enabled = true;
  },

  startOfDayInterstitialFadedIn: function () {
    this.game.time.events.add(Phaser.Timer.SECOND * 2, this.interstitial.fadeOut, this.interstitial, this.interstitialFadedOut, 2, false);
  },

  interstitialFadedOut: function () {
    this.state = State.WALKING;
    this.writer.unfreeze();


    switch (this.manuscriptState) {
      case ManuscriptState.WRITING:
      if (this.day == 1) {
        this.showDialog(DAY_ONE_DIALOG);
      }
      else {
        this.showDialog(DAY_START_DIALOG);
      }
      break;
      case ManuscriptState.MAKE_FIRST_AGENT_CALL:
      this.showDialog(DAY_START_MAKE_FIRST_AGENT_CALL_DIALOG);
      break;
      case ManuscriptState.MADE_FIRST_AGENT_CALL:
      break;
      case ManuscriptState.MAKE_SECOND_AGENT_CALL:
      this.showDialog(FINAL_DAY_DIALOG);
      break;
      case ManuscriptState.FINAL_WRITING:
      this.showDialog(DAY_START_FINAL_WRITING_DIALOG);
      this.typing.resetFinalWriting(this.startedFinalTyping.bind(this));
      break;
    }
  },

  //////////////////////////////////////////////////
  //
  // SETUP FUNCTIONS
  //
  //////////////////////////////////////////////////

  setupRoom: function () {
    // BACKGROUND
    this.bg = this.addSprite(0,0,'studio_bg',null,this.bgGroup);

    // OBJECTS (including collision)
    this.desk = this.addSprite(140,292-(11*4),'desk',0.5,this.colliders);
    this.chair = this.addSprite(188,324,'chair',0.5,this.colliders);
    this.shelves = this.addSprite(64,212,'shelves',0.5,this.colliders);
    this.lamp = this.addSprite(432,240,'floor_lamp',0.5,this.colliders);
    this.telephone = this.addSprite(16,240,'telephone',1.5,this.colliders);
    this.coffee_table = this.addSprite(80,420,'coffee_table',0.2,this.colliders);
    this.armchair = this.addSprite(8,368,'armchair',0.2,this.colliders);

    // TRIGGERS
    this.deskTrigger = this.addTrigger(this.chair,Trigger.DESK);
    this.lampTrigger = this.addTrigger(this.lamp,Trigger.LAMP);
    this.phoneTrigger = this.addTrigger(this.telephone,Trigger.TELEPHONE);
    this.plantTrigger = this.addTrigger({
      x: this.shelves.x + this.shelves.width/2 - 10,
      y: this.shelves.y + this.shelves.height,
      width: 20,
      height: 20
    },Trigger.PLANT);
    this.armchairTrigger = this.addTrigger({
      x: this.armchair.x,
      y: this.armchair.y + 55,
      width: this.armchair.width,
      height: this.armchair.height
    },
    Trigger.ARMCHAIR);
    this.radioTrigger = this.addTrigger({
      x: 272,
      y: 354,
      width: 20,
      height: 10
    },
    Trigger.RADIO);
    this.rugTrigger = this.addTrigger({
      x: 318,
      y: 410,
      width: 20,
      height: 10
    },
    Trigger.RUG);
    this.bookTrigger = this.addTrigger({
      x: 100,
      y: 420,
      width: 20,
      height: 80
    },
    Trigger.BOOK);
    this.doorTrigger = this.addTrigger({
      x: this.bottomWallLeft.x + this.bottomWallLeft.width,
      y: this.bottomWallLeft.y + this.bottomWallLeft.height,
      width: this.bottomWallRight.x - this.bottomWallLeft.x + this.bottomWallLeft.width,
      height: 40
    },
    Trigger.DOOR);
    this.windowTrigger = this.addTrigger({
      x: 360,
      y: 300,
      width: 10,
      height: 60
    },
    Trigger.WINDOW);
  },


  setupWalls: function () {
    this.leftWall = this.game.add.sprite(-40,0,'pixel');
    this.leftWall.width = 40;
    this.leftWall.height = this.game.height;
    this.game.physics.enable(this.leftWall, Phaser.Physics.ARCADE);
    this.colliders.add(this.leftWall);
    this.leftWall.body.immovable = true;
    this.leftWall.visible = false;

    this.rightWall = this.game.add.sprite(this.game.width,0,'pixel');
    this.rightWall.width = 40;
    this.rightWall.height = this.game.height;
    this.game.physics.enable(this.rightWall, Phaser.Physics.ARCADE);
    this.colliders.add(this.rightWall);
    this.rightWall.body.immovable = true;
    this.rightWall.visible = false;

    this.topWall = this.game.add.sprite(0,308,'pixel');
    this.topWall.width = this.game.width;
    this.topWall.height = 40;
    this.game.physics.enable(this.topWall, Phaser.Physics.ARCADE);
    this.colliders.add(this.topWall);
    this.topWall.body.immovable = true;
    this.topWall.visible = false;

    this.bottomWallLeft = this.game.add.sprite(0,this.game.height - 8,'pixel');
    this.bottomWallLeft.width = 310;
    this.bottomWallLeft.height = 40;
    this.game.physics.enable(this.bottomWallLeft, Phaser.Physics.ARCADE);
    this.colliders.add(this.bottomWallLeft);
    this.bottomWallLeft.body.immovable = true;
    this.bottomWallLeft.visible = false;

    this.bottomWallRight = this.game.add.sprite(416,this.game.height - 8,'pixel');
    this.bottomWallRight.width = this.game.width - this.bottomWallRight.x;
    this.bottomWallRight.height = 40;
    this.game.physics.enable(this.bottomWallRight, Phaser.Physics.ARCADE);
    this.colliders.add(this.bottomWallRight);
    this.bottomWallRight.body.immovable = true;
    this.bottomWallRight.visible = false;
  },


  setupWindow: function () {
    this.windowBG = this.game.add.sprite(0,0,'pixel');
    this.windowBG.width = this.game.width;
    this.windowBG.height = this.game.height;
    this.windowBG.tint = 0x222222;

    this.cityscape = this.game.add.sprite(0,0,'cityscape');

    this.window.add(this.windowBG);
    this.window.add(this.cityscape);

    this.window.visible = false;
  },


  setupPlant: function () {
    this.plant = this.game.add.sprite(0,0,'plant');
    this.plant.width = this.game.width;
    this.plant.height = this.game.height;

    this.plant.visible = false;
  },


  addSprite: function (x, y, name, ratio, group) {
    var sprite = new Phaser.Sprite(this.game,x,y,name);
    sprite.width *= 4;
    sprite.height *= 4;
    if (group == this.colliders && ratio != 0) {
      this.game.physics.enable(sprite,Phaser.Physics.ARCADE);
      sprite.body.immovable = true;
      sprite.body.height = sprite.height * ratio;
      sprite.body.offset.y = sprite.height - sprite.body.height;
      sprite.depth = sprite.body.y + sprite.body.offset.y + sprite.body.height;
    }
    group.add(sprite);
    return sprite;
  },


  addTrigger: function (toSprite, type) {
    var triggerHeightRadius = 10;
    var trigger = this.game.add.sprite(0,0,'pixel');
    trigger.x = toSprite.x;
    trigger.y = toSprite.y - triggerHeightRadius;
    trigger.width = toSprite.width;
    trigger.height = triggerHeightRadius*2 + toSprite.height;
    this.game.physics.enable(trigger,Phaser.Physics.ARCADE);
    trigger.triggerType = type;
    this.triggers.add(trigger);
    trigger.enabled = true;
    return trigger;
  },


  getDateString: function (date) {
    var day = '';
    switch (date.getDay()) {
      case 0: day = 'Sunday'; break;
      case 1: day = 'Monday'; break;
      case 2: day = 'Tuesday'; break;
      case 3: day = 'Wednesday'; break;
      case 4: day = 'Thursday'; break;
      case 5: day = 'Friday'; break;
      case 6: day = 'Saturday'; break;
    }
    var month = '';
    switch (date.getMonth()) {
      case 0: month = 'January'; break;
      case 1: month = 'February'; break;
      case 2: month = 'March'; break;
      case 3: month = 'April'; break;
      case 4: month = 'May'; break;
      case 5: month = 'June'; break;
      case 6: month = 'July'; break;
      case 7: month = 'August'; break;
      case 8: month = 'September'; break;
      case 9: month = 'October'; break;
      case 10: month = 'November'; break;
      case 11: month = 'December'; break;
    }
    return day;// + ", " + date.getDate() + " " + month + " " + date.getFullYear();
  },


  startThoughts: function (thoughts) {
    this.thoughtTimer = this.game.time.events.add(Phaser.Timer.SECOND * THOUGHT_TIME_RANGE + THOUGHT_TIME_MIN, this.showThought, this, thoughts);
    this.writer.thoughtTriggerEnabled = this.writer.currentTrigger.enabled;
  },


  showThought: function (thoughts) {
    if (!this.dialog.running) {
      this.writer.currentTrigger.enabled = false;
      this.uiMessage.hide();
      this.showDialog(thoughts,this.thoughtComplete.bind(this));
    }
    this.thoughtTimer = this.game.time.events.add(Phaser.Timer.SECOND * THOUGHT_TIME_RANGE + THOUGHT_TIME_MIN, this.showThought, this, thoughts);
  },

  thoughtComplete: function () {
    this.writer.currentTrigger.enabled = this.writer.thoughtTriggerEnabled;
  },

  stopThoughts: function () {
    if (this.thoughtTimer) this.game.time.events.remove(this.thoughtTimer);
    this.writer.currentTrigger.enabled = this.writer.thoughtTriggerEnabled;
  }

};

BasicGame.Day.prototype.constructor = BasicGame.Day;
