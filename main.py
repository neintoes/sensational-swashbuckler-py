# gh1 - throwing knives
# bh1.1 - scrolling background
# bh1.2 - dash back
# bh1.3 - throwing knife collection

# gh2 - parry
# bh2.1 - lives
# bh2.2 - progress bar
# bh2.3 - falling floor tiles 

# vars
speed = 8
deceleration = 0.95
max_enemy_speed = -75
gravity = 8
# bh1.3
daggers_collected = 1
# /bh1.3
# bh2.3
floor_index = 0
# /bh2.3
enemies_to_reset: List[Sprite] = []

orange_images = [
    assets.image("orange low"),
    assets.image("orange mid"),
    assets.image("orange high")
    ]
orange_animations = [
    assets.animation("orange attack low"),
    assets.animation("orange attack mid"),
    assets.animation("orange attack high")
    ]
red_images = [
    assets.image("red low"), 
    assets.image("red mid"),
    assets.image("red high")
    ]
red_animations = [
    assets.animation("red attack low"),
    assets.animation("red attack mid"),
    assets.animation("red attack high")
    ]

# sprites
orange = sprites.create(assets.image("orange low"), SpriteKind.player)
sprites.set_data_number(orange, "stance", 0)
sprites.set_data_boolean(orange, "attacking", False)

# setup
# bh2.1
info.set_life(3)
# /bh2.1
tiles.set_current_tilemap(assets.tilemap("level"))
# bh1.1
# scene.set_background_color(9)
scene.set_background_image(assets.image("background"))
scroller.scroll_background_with_camera(scroller.CameraScrollMode.ONLY_HORIZONTAL)
# /bh1.1 
# bh2.2
progress_bar = statusbars.create(160, 6, StatusBarKind.Energy)
progress_bar.max = (tilesAdvanced.get_tilemap_width() - 2) * 16
progress_bar.bottom = 120
progress_bar.set_color(4, 11)
# /bh2.2
tiles.place_on_random_tile(orange, assets.tile("orange spawn"))
scene.camera_follow_sprite(orange)

def spawn_enemy():
    if len(sprites.all_of_kind(SpriteKind.enemy)) < 3:
        enemy = sprites.create(assets.image("red low"), SpriteKind.enemy)
        sprites.set_data_number(enemy, "stance", 0)
        enemy.set_position(orange.x + 110, orange.y)
game.on_update_interval(1500, spawn_enemy)

def end_reached(orange, location):
    game.over(True)
scene.on_overlap_tile(SpriteKind.player, assets.tile("end"), end_reached)

def heighten_stance():
    new_player_stance = sprites.read_data_number(orange, "stance") + 1
    if new_player_stance < 3:
        sprites.set_data_number(orange, "stance", new_player_stance)
        orange.set_image(orange_images[new_player_stance])
controller.up.on_event(ControllerButtonEvent.PRESSED, heighten_stance)

def lower_stance():
    new_player_stance = sprites.read_data_number(orange, "stance") - 1
    if new_player_stance > -1:
        sprites.set_data_number(orange, "stance", new_player_stance)
        orange.set_image(orange_images[new_player_stance])
controller.down.on_event(ControllerButtonEvent.PRESSED, lower_stance)

# gh1
def throw_dagger():
    dagger = sprites.create_projectile_from_sprite(image.create(16, 16), orange, 100, 0)
    dagger.left = orange.x 
    orange.vx = -20
    animation.run_image_animation(dagger, assets.animation("throwing dagger"), 50, True) 

def throttle_throw_dagger():
    # bh1.3
    global daggers_collected
    if daggers_collected > 0:
        timer.throttle("throw dagger", 2000, throw_dagger)
        daggers_collected -= 1
    # /bh1.3
    # timer.throttle("throw dagger", 2000, throw_dagger)
controller.B.on_event(ControllerButtonEvent.PRESSED, throttle_throw_dagger)

def overlap_dagger(duelist, dagger):
    if sprites.read_data_boolean(duelist, "attacking"):
        dagger.vx *= -1.25
    elif duelist.kind() == SpriteKind.enemy:
        duelist.destroy()
        dagger.destroy()
    else:
        game.over(False)
sprites.on_overlap(SpriteKind.enemy, SpriteKind.projectile, overlap_dagger)
sprites.on_overlap(SpriteKind.player, SpriteKind.projectile, overlap_dagger)

def dagger_hit_wall(dagger, location):
    dagger.destroy()
scene.on_hit_wall(SpriteKind.projectile, dagger_hit_wall)
# /gh1

def hit(orange, red):
    orange_stance = sprites.read_data_number(orange, "stance")
    red_stance = sprites.read_data_number(red, "stance")
    # gh2
    # if orange_stance == red_stance:
    #     orange.vx -= 50
    #     red.vx += 25
    #     scene.camera_shake(2, 100)
    if sprites.read_data_boolean(orange, "parrying") and not sprites.read_data_boolean(red, "stunned"):
        stun(red)
    elif orange_stance == red_stance:
        orange.vx -= 50
        red.vx += 25
        scene.camera_shake(2, 100)
    # /gh2
    elif sprites.read_data_boolean(orange, "attacking"):
        # bh1.3
        if randint(1, 4) == 1:
            dagger_pickup = sprites.create(assets.image("dagger pickup"), SpriteKind.food)
            dagger_pickup.x = red.x
            dagger_pickup.bottom = red.bottom 
        # /bh1.3
        red.destroy()
    # gh2
    # else:
    elif not sprites.read_data_boolean(red, "stunned"):
    # /gh2
        # bh2.1
        # game.over(False)
        if info.life() > 0:
            info.change_life_by(-1)
            tiles.place_on_random_tile(orange, assets.tile("orange spawn"))
        # /bh2.1
sprites.on_overlap(SpriteKind.player, SpriteKind.enemy, hit)

# bh1.3
def collect_dagger(orange, dagger):
    global daggers_collected
    daggers_collected += 1
    music.ba_ding.play()
    dagger.destroy()
sprites.on_overlap(SpriteKind.player, SpriteKind.food, collect_dagger)
# /bh1.3

def reset_player():
    stance = sprites.read_data_number(orange, "stance")
    orange.set_image(orange_images[stance])
    sprites.set_data_boolean(orange, "attacking", False)
    # gh2
    sprites.set_data_boolean(orange, "parrying", False)
    # /gh2

def player_attack():
    sprites.set_data_boolean(orange, "attacking", True)
    stance = sprites.read_data_number(orange, "stance")
    animation.run_image_animation(orange, orange_animations[stance], 40, False)
    timer.after(400, reset_player)
        
def reset_enemy():
    # tweak (allows for use of method when resetting other aspects of enemy behaviour)
    if len(enemies_to_reset) < 1:
        return
    # /tweak
    enemy = enemies_to_reset[0]
    enemies_to_reset.shift()
    stance = sprites.read_data_number(enemy, "stance")
    enemy.set_image(red_images[stance])
    sprites.set_data_boolean(enemy, "attacking", False)
    # gh2
    sprites.set_data_boolean(enemy, "stunned", False)
    # /gh2

def enemy_attack(enemy: Sprite):
    sprites.set_data_boolean(enemy, "attacking", True)
    stance = sprites.read_data_number(enemy, "stance")
    animation.run_image_animation(enemy, red_animations[stance], 40, False)
    enemies_to_reset.append(enemy)
    timer.after(400, reset_enemy)

def randomise_enemy_stance(enemy: Sprite):
    current_stance = sprites.read_data_number(enemy, "stance")
    if not current_stance == 1:
        current_stance = 1
    else:
        current_stance += randint(-1, 1)
    enemy.set_image(red_images[current_stance])
    sprites.set_data_number(enemy, "stance", current_stance)

def enemy_behaviour(enemy: Sprite):
    if not sprites.read_data_boolean(enemy, "stunned"):
        if enemy.vx > max_enemy_speed:
            enemy.vx -= 0.5
        if not sprites.read_data_boolean(enemy, "attacking"):
            # tweak
            if randint(1, 60) == 1:
            # /tweak
                enemy_attack(enemy)
            if randint(1, 60) == 1 :
                randomise_enemy_stance(enemy)
    
def player_movement():
    if controller.right.is_pressed():
        orange.vx += speed
    elif controller.left.is_pressed():
        orange.vx -= speed
    orange.vx *= deceleration

# gh2
def stun(red: Sprite):
    sprites.set_data_boolean(red, "stunned", True)
    red.vx = 20
    red.say_text("!", 3000)
    enemies_to_reset.remove_element(red)
    enemies_to_reset.append(red)
    timer.after(3000, reset_enemy)

def parry():
    sprites.set_data_boolean(orange, "parrying", True)
    animation.run_image_animation(orange, assets.animation("orange parry"), 40, False)
    timer.after(320, reset_player)

def throttle_parry():
    timer.throttle("parry", 3000, parry)
controller.player2.A.on_event(ControllerButtonEvent.PRESSED, throttle_parry)
# /gh2

# bh1.2
def dash_back():
    orange.vx = -200
controller.combos.attach_combo("ll", dash_back)
# /bh1.2

# bh 2.3
def knockdown_next_pier():
    global floor_index
    next_pier_location = tiles.get_tile_location(floor_index, tilesAdvanced.get_tilemap_height() - 1)
    tiles.set_tile_at(next_pier_location, assets.tile("danger"))
    tiles.set_wall_at(next_pier_location, False)
    music.knock.play()
    floor_index += 1
    timer.after(1000, knockdown_next_pier)
timer.after(5000, knockdown_next_pier)
# /bh2.3


def player_behaviour():
    # gh2
    #if controller.A.is_pressed() and not sprites.read_data_boolean(orange, "attacking"):
    if controller.A.is_pressed() and not sprites.read_data_boolean(orange, "attacking") and not sprites.read_data_boolean(orange, "parrying"):
    # /gh2
        player_attack()
    player_movement()

# bh2.2
def update_progress_bar():
    progress_bar.value = orange.x
# /bh2.2

def tick():
    for enemy in sprites.all_of_kind(SpriteKind.enemy):
        enemy_behaviour(enemy)
    player_behaviour()
    # bh2.2
    update_progress_bar()
    # /bh2.2    
    # bh 2.3 - would prefer a more readable method of checking the tile below the player
    if not tiles.tile_at_location_is_wall(tiles.get_tile_location(orange.x // 16, (orange.y // 16) + 1)):
        game.over(False)
    # bh 2.3
game.on_update(tick)
