extends Sprite2D

var speed = 300

func _process(delta):
	if Input.is_action_pressed("ui_left") and position.x > 0:
		position.x -= speed * delta
	if Input.is_action_pressed("ui_right") and position.x < 480:
		position.x += speed * delta
