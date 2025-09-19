extends Node2D

var score = 0
var charge_scene

func _ready():
	randomize()
	charge_scene = preload("res://FallingCharge.tscn")
	$Timer.timeout.connect(spawn_charge)
	$Timer.start()
	$ScoreLabel.text = "Score: 0"
	$RuleLabel.text = "Catch opposite charges!"

func spawn_charge():
	var charge = charge_scene.instantiate()
	charge.position = Vector2(randf() * 480, -20)
	add_child(charge)

func collect_charge(charge_type):
	if charge_type == -1:
		score += 10
		$Particles2D.emitting = true
		$RuleLabel.text = "Opposite charges ATTRACT! F = kq₁q₂/r²"
	else:
		score -= 5
		$RuleLabel.text = "Like charges REPEL! F = kq₁q₂/r²"
	$ScoreLabel.text = "Score: %s" % score
	await get_tree().create_timer(0.3).timeout
	$Particles2D.emitting = false
