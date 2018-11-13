import Layer from './../../../util/render/layer'
import global from './../../global'
import resources from './../resources'
import Sprite from './../../../util/render/sprite'
import director from './../../../util/render/director'
import ReadyLayer from './ready-layer'
import State from './../../common/state'
import Fruit from './friut'
import Vec2 from './../../../util/math/vec2'
import FruitType from './fruit-type'
import TWEEN from 'tween.js'
class GameLayer extends Layer {
    constructor() {
        super();
        this._state = new State();
        this._state.setState('ready');
        this._addFruitCurrentTime = 0;
        let bg = new PIXI.Sprite(global.resource[resources.bj].texture);
        this.addChild(bg);
        let readyLayer = new ReadyLayer(() => {
            this.removeChild(readyLayer);
            //把准备层删掉
            this._addFruitCurrentTime = new Date().getTime();
            this._state.setState('game-start');
        });
        this.addChild(readyLayer);
        // director.root.ticker.add(this.update.bind(this));
        this._addFruitPreTimeDisList = [100, 150, 200, 200] //每次出水果的时间间隔
        this._addFruitPreTimeDis = 50;
        this.nowTime = new Date().getTime();
        this._fruitCount = 1;
        this._fruitMap = {};

        this._cutEffectLayer = new Layer();
        this.addChild(this._cutEffectLayer);


        this._fruitLayer = new Layer();
        this.addChild(this._fruitLayer);

        this._particleLayer = new Layer();
        this.addChild(this._particleLayer);

        this.interactive = true;
        this.on('pointerdown', this.touchStart.bind(this))
            .on('pointerup', this.touchEnd.bind(this))
            .on('pointerupoutside', this.touchEnd.bind(this))
            .on('pointermove', this.touchMove.bind(this));

        this._isTouching = false;



        this._cutTrailLayer = new Layer();
        this.addChild(this._cutTrailLayer);


        this._cutSize = 10;
    

        this._cutPoint = [];
        for (let i = 0; i < this._cutSize; i++) {
            this._cutPoint.push({
                x: director.width * 0.5 + (this._cutSize - 1) * -0.5 * 10 + 10 * i,
                y: director.height
            })
        }
        this._cutTrail = new PIXI.mesh.Rope(global.resource[resources.blade].texture, this._cutPoint);
        this._cutTrail.blendmode = PIXI.BLEND_MODES.ADD;
        this._cutTrailLayer.addChild(this._cutTrail);

        

    }
    touchStart() {
        console.log('touch start');
        this._isTouching = true;
    }
    touchMove(event) {
        if (this._isTouching) {
            let data = event.data;
            let touchPos = data.getLocalPosition(this);
            // console.log('touch pos = ' + JSON.stringify(touchPos));
            for (let i in this._fruitMap) {
                let fruit = this._fruitMap[i];
                let dis = new Vec2(touchPos.x, touchPos.y).distance(new Vec2(fruit.position.x, fruit.position.y));
                // console.log('dis = ' + dis);
                // console.log('width = ' + fruit.width);
                if (dis < fruit.width) {
                    if (fruit.cut()) {
                        this.playCutEffect(fruit.getType(), fruit.position);
                    }
                }
            }
           
            
        }
    }
    touchEnd() {
        this._isTouching = false;
    }
    update(dt) {
        
        if (this._state.getState() === 'game-start') {
            if (this._addFruitCurrentTime > this._addFruitPreTimeDis) {
                this._addFruitCurrentTime = 0;
                this._addFruitPreTimeDis = this._addFruitPreTimeDisList[Math.round(Math.random() * (this._addFruitPreTimeDisList.length - 1))];
                // console.log('add fruit pre time dis = ' + this._addFruitPreTimeDis);
                this.addOneFruit();
            } else {
                this._addFruitCurrentTime += dt;
            }
        }



        let mousePoint = director.root.renderer.plugins.interaction.mouse.global;
        this._cutPoint.shift();
        this._cutPoint.push({
            x: mousePoint.x,
            y: mousePoint.y
        });        
        if (this._isTouching){
            this._cutTrail.visible = true;
        }else{
            this._cutTrail.visible = false;
        }

        for (let i in this._fruitMap){
            this._fruitMap[i].update(dt);
        }
    }
    addOneFruit() {
        //添加一个水果
        // console.log('添加一个水果')
        let fruit = new Fruit();
        fruit.init(this, this._fruitCount);
        this._fruitMap[this._fruitCount] = fruit;
        this._fruitCount++;
        // this.addChild(fruit);
        this._fruitLayer.addChild(fruit);
    }
    fruitActionCb(state, fruitId) {
        switch (state) {
            case 'run-end':
                if (this._fruitMap[fruitId]) {
                    this._fruitLayer.removeChild(this._fruitMap[fruitId]);
                    delete this._fruitMap[fruitId];
                }


                break;
            default:
                break;
        }
    }
    playCutEffect(type, position) {
        console.log('player cut effect = ' + type);
        let effectStr = ['_e', '_e_2', '_e_1'];
        let str = effectStr[Math.round(Math.random() * (effectStr.length - 1))];
        let effect = new Sprite(global.resource[resources[FruitType[type] + str]].texture);
        this._cutEffectLayer.addChild(effect);
        effect.position = position;
        effect.rotation = Math.random() * Math.PI * 2;
        let action = new TWEEN.Tween(effect)
            .to({ alpha: 0 }, Math.random() * 200 + 600)
            .onComplete(() => {
                this._cutEffectLayer.removeChild(effect);
            });
        action.start();

    }

   
}
export default GameLayer;