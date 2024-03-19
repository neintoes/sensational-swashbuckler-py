//  gh1 - throwing knives
//  bh1.1 - scrolling background
//  bh1.2 - dash back
//  bh1.3 - throwing knife collection
//  gh2 - parry
//  bh2.1 - lives
//  bh2.2 - progress bar
//  bh2.3 - falling floor tiles 
//  vars
let speed = 8
let deceleration = 0.95
let max_enemy_speed = -75
let gravity = 8
//  bh1.3
let daggers_collected = 1
//  /bh1.3
//  bh2.3
let floor_index = 0
//  /bh2.3
let enemies_to_reset : Sprite[] = []
let orange_images = [assets.image`orange low`, assets.image`orange mid`, assets.image`orange high`]
let orange_animations = [assets.animation`orange attack low`, assets.animation`orange attack mid`, assets.animation`orange attack high`]
let red_images = [assets.image`red low`, assets.image`red mid`, assets.image`red high`]
let red_animations = [assets.animation`red attack low`, assets.animation`red attack mid`, assets.animation`red attack high`]
//  sprites
let orange = sprites.create(assets.image`orange low`, SpriteKind.Player)
sprites.setDataNumber(orange, "stance", 0)
sprites.setDataBoolean(orange, "attacking", false)
//  setup
//  bh2.1
info.setLife(3)
//  /bh2.1
tiles.setCurrentTilemap(assets.tilemap`level`)
//  bh1.1
//  scene.set_background_color(9)
scene.setBackgroundImage(assets.image`background`)
scroller.scrollBackgroundWithCamera(scroller.CameraScrollMode.OnlyHorizontal)
//  /bh1.1 
//  bh2.2
let progress_bar = statusbars.create(160, 6, StatusBarKind.Energy)
progress_bar.max = (tilesAdvanced.getTilemapWidth() - 2) * 16
progress_bar.bottom = 120
progress_bar.setColor(4, 11)
//  /bh2.2
tiles.placeOnRandomTile(orange, assets.tile`orange spawn`)
scene.cameraFollowSprite(orange)
game.onUpdateInterval(1500, function spawn_enemy() {
    let enemy: Sprite;
    if (sprites.allOfKind(SpriteKind.Enemy).length < 3) {
        enemy = sprites.create(assets.image`red low`, SpriteKind.Enemy)
        sprites.setDataNumber(enemy, "stance", 0)
        enemy.setPosition(orange.x + 110, orange.y)
    }
    
})
scene.onOverlapTile(SpriteKind.Player, assets.tile`end`, function end_reached(orange: Sprite, location: tiles.Location) {
    game.over(true)
})
controller.up.onEvent(ControllerButtonEvent.Pressed, function heighten_stance() {
    let new_player_stance = sprites.readDataNumber(orange, "stance") + 1
    if (new_player_stance < 3) {
        sprites.setDataNumber(orange, "stance", new_player_stance)
        orange.setImage(orange_images[new_player_stance])
    }
    
})
controller.down.onEvent(ControllerButtonEvent.Pressed, function lower_stance() {
    let new_player_stance = sprites.readDataNumber(orange, "stance") - 1
    if (new_player_stance > -1) {
        sprites.setDataNumber(orange, "stance", new_player_stance)
        orange.setImage(orange_images[new_player_stance])
    }
    
})
//  gh1
//  /bh1.3
//  timer.throttle("throw dagger", 2000, throw_dagger)
controller.B.onEvent(ControllerButtonEvent.Pressed, function throttle_throw_dagger() {
    //  bh1.3
    
    if (daggers_collected > 0) {
        timer.throttle("throw dagger", 2000, function throw_dagger() {
            let dagger: Sprite;
            dagger = sprites.createProjectileFromSprite(image.create(16, 16), orange, 100, 0)
            dagger.left = orange.x
            orange.vx = -20
            animation.runImageAnimation(dagger, assets.animation`throwing dagger`, 50, true)
        })
        daggers_collected -= 1
    }
    
})
function overlap_dagger(duelist: Sprite, dagger: Sprite) {
    if (sprites.readDataBoolean(duelist, "attacking")) {
        dagger.vx *= -1.25
    } else if (duelist.kind() == SpriteKind.Enemy) {
        duelist.destroy()
        dagger.destroy()
    } else {
        game.over(false)
    }
    
}

sprites.onOverlap(SpriteKind.Enemy, SpriteKind.Projectile, overlap_dagger)
sprites.onOverlap(SpriteKind.Player, SpriteKind.Projectile, overlap_dagger)
scene.onHitWall(SpriteKind.Projectile, function dagger_hit_wall(dagger: Sprite, location: tiles.Location) {
    dagger.destroy()
})
//  /gh1
//  /bh2.1
sprites.onOverlap(SpriteKind.Player, SpriteKind.Enemy, function hit(orange: Sprite, red: Sprite) {
    let dagger_pickup: Sprite;
    let orange_stance = sprites.readDataNumber(orange, "stance")
    let red_stance = sprites.readDataNumber(red, "stance")
    //  gh2
    //  if orange_stance == red_stance:
    //      orange.vx -= 50
    //      red.vx += 25
    //      scene.camera_shake(2, 100)
    if (sprites.readDataBoolean(orange, "parrying") && !sprites.readDataBoolean(red, "stunned")) {
        stun(red)
    } else if (orange_stance == red_stance) {
        orange.vx -= 50
        red.vx += 25
        scene.cameraShake(2, 100)
    } else if (sprites.readDataBoolean(orange, "attacking")) {
        //  /gh2
        //  bh1.3
        if (randint(1, 4) == 1) {
            dagger_pickup = sprites.create(assets.image`dagger pickup`, SpriteKind.Food)
            dagger_pickup.x = red.x
            dagger_pickup.bottom = red.bottom
        }
        
        //  /bh1.3
        red.destroy()
    } else if (!sprites.readDataBoolean(red, "stunned")) {
        //  gh2
        //  else:
        //  /gh2
        //  bh2.1
        //  game.over(False)
        if (info.life() > 0) {
            info.changeLifeBy(-1)
            tiles.placeOnRandomTile(orange, assets.tile`orange spawn`)
        }
        
    }
    
})
//  bh1.3
sprites.onOverlap(SpriteKind.Player, SpriteKind.Food, function collect_dagger(orange: Sprite, dagger: Sprite) {
    
    daggers_collected += 1
    music.baDing.play()
    dagger.destroy()
})
//  /bh1.3
function reset_player() {
    let stance = sprites.readDataNumber(orange, "stance")
    orange.setImage(orange_images[stance])
    sprites.setDataBoolean(orange, "attacking", false)
    //  gh2
    sprites.setDataBoolean(orange, "parrying", false)
}

//  /gh2
function player_attack() {
    sprites.setDataBoolean(orange, "attacking", true)
    let stance = sprites.readDataNumber(orange, "stance")
    animation.runImageAnimation(orange, orange_animations[stance], 40, false)
    timer.after(400, reset_player)
}

function reset_enemy() {
    //  tweak (allows for use of method when resetting other aspects of enemy behaviour)
    if (enemies_to_reset.length < 1) {
        return
    }
    
    //  /tweak
    let enemy = enemies_to_reset[0]
    enemies_to_reset.shift()
    let stance = sprites.readDataNumber(enemy, "stance")
    enemy.setImage(red_images[stance])
    sprites.setDataBoolean(enemy, "attacking", false)
    //  gh2
    sprites.setDataBoolean(enemy, "stunned", false)
}

//  /gh2
function enemy_attack(enemy: Sprite) {
    sprites.setDataBoolean(enemy, "attacking", true)
    let stance = sprites.readDataNumber(enemy, "stance")
    animation.runImageAnimation(enemy, red_animations[stance], 40, false)
    enemies_to_reset.push(enemy)
    timer.after(400, reset_enemy)
}

function randomise_enemy_stance(enemy: Sprite) {
    let current_stance = sprites.readDataNumber(enemy, "stance")
    if (!(current_stance == 1)) {
        current_stance = 1
    } else {
        current_stance += randint(-1, 1)
    }
    
    enemy.setImage(red_images[current_stance])
    sprites.setDataNumber(enemy, "stance", current_stance)
}

function enemy_behaviour(enemy: Sprite) {
    if (!sprites.readDataBoolean(enemy, "stunned")) {
        if (enemy.vx > max_enemy_speed) {
            enemy.vx -= 0.5
        }
        
        if (!sprites.readDataBoolean(enemy, "attacking")) {
            //  tweak
            if (randint(1, 60) == 1) {
                //  /tweak
                enemy_attack(enemy)
            }
            
            if (randint(1, 60) == 1) {
                randomise_enemy_stance(enemy)
            }
            
        }
        
    }
    
}

function player_movement() {
    if (controller.right.isPressed()) {
        orange.vx += speed
    } else if (controller.left.isPressed()) {
        orange.vx -= speed
    }
    
    orange.vx *= deceleration
}

//  gh2
function stun(red: Sprite) {
    sprites.setDataBoolean(red, "stunned", true)
    red.vx = 20
    red.sayText("!", 3000)
    enemies_to_reset.removeElement(red)
    enemies_to_reset.push(red)
    timer.after(3000, reset_enemy)
}

controller.player2.A.onEvent(ControllerButtonEvent.Pressed, function throttle_parry() {
    timer.throttle("parry", 3000, function parry() {
        sprites.setDataBoolean(orange, "parrying", true)
        animation.runImageAnimation(orange, assets.animation`orange parry`, 40, false)
        timer.after(320, reset_player)
    })
})
//  /gh2
//  bh1.2
controller.combos.attachCombo("ll", function dash_back() {
    orange.vx = -200
})
//  /bh1.2
//  bh 2.3
function knockdown_next_pier() {
    
    let next_pier_location = tiles.getTileLocation(floor_index, tilesAdvanced.getTilemapHeight() - 1)
    tiles.setTileAt(next_pier_location, assets.tile`danger`)
    tiles.setWallAt(next_pier_location, false)
    music.knock.play()
    floor_index += 1
    timer.after(1000, knockdown_next_pier)
}

timer.after(5000, knockdown_next_pier)
//  /bh2.3
function player_behaviour() {
    //  gh2
    // if controller.A.is_pressed() and not sprites.read_data_boolean(orange, "attacking"):
    if (controller.A.isPressed() && !sprites.readDataBoolean(orange, "attacking") && !sprites.readDataBoolean(orange, "parrying")) {
        //  /gh2
        player_attack()
    }
    
    player_movement()
}

//  bh2.2
function update_progress_bar() {
    progress_bar.value = orange.x
}

//  /bh2.2
//  bh 2.3
game.onUpdate(function tick() {
    for (let enemy of sprites.allOfKind(SpriteKind.Enemy)) {
        enemy_behaviour(enemy)
    }
    player_behaviour()
    //  bh2.2
    update_progress_bar()
    //  /bh2.2    
    //  bh 2.3 - would prefer a more readable method of checking the tile below the player
    if (!tiles.tileAtLocationIsWall(tiles.getTileLocation(Math.idiv(orange.x, 16), Math.idiv(orange.y, 16) + 1))) {
        game.over(false)
    }
    
})
