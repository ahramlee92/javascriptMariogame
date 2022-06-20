kaboom ({
    global : true,
    fullscreen : true,
    scale : 2,
    debug : true,
    clearColor : [0,0,0,1] // make background colour as black
})

// const cannot be updated or re-declared
// let can be updated but not re-declared
const MOVE_SPEED = 120
const JUMP_FORCE = 360
let CURRENT_JUMP_FORCE = JUMP_FORCE
const BIG_JUMP_FORCE = 550
let isJumping = true
const FALL_DEATH = 400

// draw out maps
// level 1 map
loadRoot('https://i.imgur.com/')
loadSprite('coin', 'wbKxhcd.png')
loadSprite('evil-shroom', 'KPO3fR9.png')
loadSprite('brick', 'pogC9x5.png')
loadSprite('block', 'M6rwarW.png')
loadSprite('mario', 'Wb1qfhK.png')
loadSprite('mushroom', '0wMd92p.png')
loadSprite('surprise', 'gesQ1KP.png')
loadSprite('unboxed', 'bdrLpi6.png')
loadSprite('pipe-top-left', 'ReTPiWY.png')
loadSprite('pipe-top-right', 'hj2GK4n.png')
loadSprite('pipe-bottom-left', 'c1cYSbt.png')
loadSprite('pipe-bottom-right', 'nqQ79eI.png')

// level 2 map
loadSprite('blue-block', 'fVscIbn.png')
loadSprite('blue-brick', '3e5YRQd.png')
loadSprite('blue-steel', 'gqVoI2b.png')
loadSprite('blue-evil-shroom', 'SvV4ueD.png')
loadSprite('blue-surprise', 'RMqCc1G.png')

// pass it through level and score
scene("game", ( {level, score} ) => {
    layers(['bg', 'obj', 'ui'], 'obj')

    // game board
    const maps = [
        [
            '                                         ',
            '                                         ',
            '                                         ',
            '                                         ',
            '                                         ',
            '     %     =*=%=                         ',
            '                                         ',
            '                                -+       ',
            '                     ^      ^   ()       ',
            '==================================  =====',
        ],
        [
            '£                                         £',
            '£                                         £',
            '£                                         £',
            '£                                         £',
            '£                                         £',
            '£     %     @@@@@              x x        £',
            '£                            x x x        £',
            '£                          x x x x  x   -+£',
            '£              z      z  x x x x x  x   ()£',
            '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!',
        ]
    ]

    const levelCfg = {
        width : 20,
        height : 20,
        '=' : [sprite('block'), solid()],   // can not pass 'block', it's solid from solid() method
        '$' : [sprite('coin'), 'coin'],
        '%' : [sprite('surprise'), solid(), 'coin-surprise'],
        '*' : [sprite('surprise'), solid(), 'mushroom-surprise'],
        '}' : [sprite('unboxed'), solid()],
        '(' : [sprite('pipe-bottom-left'), solid(), scale(0.5)],
        ')' : [sprite('pipe-bottom-right'), solid(), scale(0.5)],
        '-' : [sprite('pipe-top-left'), solid(), scale(0.5), 'pipe'],
        '+' : [sprite('pipe-top-right'), solid(), scale(0.5), 'pipe'],
        '^' : [sprite('evil-shroom'), solid(), 'dangerous'],
        '#' : [sprite('mushroom'), solid(), 'mushroom', body()],

        '!' : [sprite('blue-block'), solid(), scale(0.5)],
        '£' : [sprite('blue-brick'), solid(), scale(0.5)],
        'x' : [sprite('blue-steel'), solid(), scale(0.5)],
        'z' : [sprite('blue-evil-shroom'), solid(), scale(0.5), 'dangerous'],
        '@' : [sprite('blue-surprise'), solid(), scale(0.5), 'coin-surprise'],
    }

    // change map depending on level
    const gameLevel = addLevel(maps[level], levelCfg)   // Kaboom method 

    const scoreLabel = add([
        text(score),
        pos(30,6),
        layer('ui'),    // use another layer
        {
            value : score
        }
    ])

    add([text('level ' + parseInt(level + 1)), pos(40,6)])

    function big() {
        let timer = 0
        let isBig = false
        return {
            update() {
                if(isBig) {
                    CURRENT_JUMP_FORCE = BIG_JUMP_FORCE
                    timer -= dt() // Kaboom method (delta time since last frame)
                    if(timer<=0) {
                        this.smallify()
                    }
                }
            },
            isBig() {
                return isBig
            },
            smallify() {
                this.scale = vec2(1)
                timer = 0
                isBig = false
                CURRENT_JUMP_FORCE = JUMP_FORCE
            },
            biggify(time) {
                this.scale = vec2(2)
                timer = time
                isBig = true
            }
        }
    }

    const player = add([
        sprite('mario'), solid(),
        pos(30,0),  // position
        body(), // mario for gravity
        big(),  // make mario bigger
        origin('bot')   // get rid of funny things when we use body
    ])

    action('mushroom', (m) => {
        m.move(20,0) // move mushroom around y-axis 10
    })

    // get mushroom sprouting
    player.on("headbump", (obj) => {
        if(obj.is('coin-surprise')) {
            gameLevel.spawn('$', obj.gridPos.sub(0,1))  // put coin above headbumped obj
            destroy(obj) // destroy headbumped obj
            gameLevel.spawn('}', obj.gridPos.sub(0,0))  // put unboxed under the coin after destroy obj
        }
        if(obj.is('mushroom-surprise')) {
            gameLevel.spawn('#', obj.gridPos.sub(0,1))  // put mushroom above headbumped obj
            destroy(obj) // destroy headbumped obj
            gameLevel.spawn('}', obj.gridPos.sub(0,0))  // put unboxed under the mushroom after destroy obj
        }
    })

    // destroy mushroom and make mario grow when player hit the mushroom
    player.collides('mushroom', (m) => {
        destroy(m)
        player.biggify(6)
    })

    // destroy coin and score points when player hit the coin
    player.collides('coin', (c) => {
        destroy(c)
        scoreLabel.value++
        scoreLabel.text = scoreLabel.value
    })

    const ENEMY_SPEED = 20
    // give evil mushroom some speed
    action('dangerous', (d) => {
        d.move(-ENEMY_SPEED,0)
    })

    // destroy evil mushroom when player jumps to the evil mushroom but if player just touched it then lose the game
    player.collides('dangerous', (d) => {
        if (isJumping) {
            destroy(d)
        } else {
            go('lose', {score : scoreLabel.value})
        }
    })

    player.action(() => {
        camPos(player.pos)  // camera position (follow user)
        if (player.pos.y >= FALL_DEATH) {
            go('lose' , {score : scoreLabel.value})
        }
    })

    // go to the next round through the pipe
    player.collides('pipe', () => {
        keyPress('down', () => {
            go('game', {
                level : (level + 1) % maps.length,
                score : scoreLabel.value
            })
        })
    })

    // first parameter is left arrow on the keyboard, second parameter is function
    keyDown('left', () => {
        player.move(-MOVE_SPEED,0)  // (x-axis,y-axis)
    })

    keyDown('right', () => {
        player.move(MOVE_SPEED,0)  // (x-axis,y-axis)
    })

    player.action(() => {
        if (player.grounded()) {
            isJumping = false
        }
    })

    keyPress('space', () => {
        if (player.grounded()) {
            isJumping = true
            player.jump(CURRENT_JUMP_FORCE)
        }  
    })

    keyDown('left', () => {
        player.move(-MOVE_SPEED,0)  // (x-axis,u-axis)
    })
})

scene('lose', ({score}) => {
    add([text(score, 32), origin('center'), pos(width()/2, height()/2)])
})
start("game", { level : 0, score : 0 })