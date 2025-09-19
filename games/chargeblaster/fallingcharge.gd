extends Area2D

var speed = 180
var charge_type = 1 if randi() % 2 == 0 else -1

func _ready():
	# Make sure the Sprite node is named 'Sprite'
	$Sprite.modulate = Color(1,0,0) if charge_type == 1 else Color(0,0,1)
	
	# Connect the signal properly using Callable (Godot 4)
	if get_parent().has_method("_on_fallingcharge_body_entered"):
		body_entered.connect(Callable(get_parent(), "_on_fallingcharge_body_entered"))

func _process(delta):
	position.y += speed * delta
	if position.y > 600:
		queue_free()
