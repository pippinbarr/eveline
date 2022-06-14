Avatar = function (game, index, x, y) {
	Phaser.Sprite.call(this, game, x, y, 'avatar_' + index);

	WALK_H_SPEED = 100;
	WALK_V_SPEED = 75;

	this.animations.add('left_right_walking',[0,1,2,3,4,5,6,7],10,true);
	this.animations.add('left_right_idle',[22],0,false)
	this.animations.add('up_walking',[15,16,17,18,19,20],10,true);
	this.animations.add('up_idle',[21],0,false);
	this.animations.add('down_walking',[8,9,10,11,12,13],10,true);
	this.animations.add('down_idle',[14],0,false);

	this.anchor.x = 0.5;
	this.direction = Direction.UP;
	this.currentTrigger = Trigger.NONE;

	this.game.physics.enable(this, Phaser.Physics.ARCADE);
	this.body.offset.y = this.height - 12;
	this.body.height = 12;
	this.body.velocity.x = this.body.velocity.y = 0;
	this.depth = this.body.y;
	this.keys = this.game.input.keyboard.createCursorKeys();
	this.keys.enabled = true;
	this.currentTrigger = Trigger.NONE;

	this.updateAnimation();
};

Avatar.prototype = Object.create(Phaser.Sprite.prototype);

Avatar.prototype.constructor = Avatar;

Avatar.prototype.update = function () {
	Phaser.Sprite.prototype.update.call(this);

	this.handleInput();
	this.updateAnimation();
	this.depth = this.body.y + this.body.height;
};

Avatar.prototype.destroy = function () {
	Phaser.Sprite.prototype.destroy.call(this);
};

Avatar.prototype.handleInput = function () {
	if (!this.keys.enabled) return;

	if (this.keys.left.isDown) this.setVelocity(-WALK_H_SPEED,0);
	else if (this.keys.right.isDown) this.setVelocity(WALK_H_SPEED,0);
	else if (this.keys.up.isDown) this.setVelocity(0,-WALK_V_SPEED);
	else if (this.keys.down.isDown) this.setVelocity(0,WALK_V_SPEED);
	else this.setVelocity(0,0);

	this.updateAnimation();
};

Avatar.prototype.freeze = function () {
	this.setVelocity(0,0);
	this.keys.enabled = false;
}

Avatar.prototype.unfreeze = function () {
	this.setVelocity(0,0);
	this.keys.enabled = true;
}

Avatar.prototype.setVelocity = function (vx,vy) {
	this.body.velocity.x = vx;
	this.body.velocity.y = vy;
	if (vx < 0) this.direction = Direction.LEFT;
	else if (vx > 0) this.direction = Direction.RIGHT;
	else if (vy < 0) this.direction = Direction.UP;
	else if (vy > 0) this.direction = Direction.DOWN;
},

Avatar.prototype.updateAnimation = function () {
	switch (this.direction) {
		case Direction.LEFT:
		this.scale.x = -1;
		if (this.body.velocity.x != 0) this.play("left_right_walking");
		else this.play("left_right_idle");
		break;

		case Direction.RIGHT:
		this.scale.x = 1;
		if (this.body.velocity.x != 0) this.play("left_right_walking");
		else this.play("left_right_idle");
		break;

		case Direction.UP:
		if (this.body.velocity.y < 0) this.play("up_walking");
		else this.play("up_idle");
		break;

		case Direction.DOWN:
		if (this.body.velocity.y > 0) this.play("down_walking");
		else this.play("down_idle");
		break;
	}
};
