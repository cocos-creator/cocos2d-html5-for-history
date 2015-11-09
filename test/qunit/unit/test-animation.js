largeModule('Animation', SetupEngine);

var color = cc.color;
var Color = cc.Color;
var v2 = cc.v2;

test('computeNullRatios', function () {
    var computeNullRatios = cc._Test.computeNullRatios;
    var computedRatio;
    var keyFrames;

    // smoke tests
    keyFrames = [
        { ratio: 0.1 }
    ];
    computeNullRatios([]);
    computeNullRatios(keyFrames);
    strictEqual(keyFrames[0].ratio, 0.1, 'should not change exists ratio');
    computedRatio = keyFrames[0].computedRatio;
    ok(computedRatio === 0.1 || computedRatio === undefined, 'computedRatio should == ratio if presented');
    //
    keyFrames = [
        {}
    ];
    computeNullRatios(keyFrames);
    strictEqual(keyFrames[0].ratio, undefined, 'should not modify keyFrames');
    strictEqual(keyFrames[0].computedRatio, 0, 'computedRatio should be 0 if only one frame');

    keyFrames = [
        {},
        {}
    ];
    computeNullRatios(keyFrames);
    strictEqual(keyFrames[0].computedRatio, 0, 'computedRatio should be 0 on first frame');
    strictEqual(keyFrames[1].computedRatio, 1, 'computedRatio should be 1 on last frame');

    keyFrames = [
        {},
        {},
        {},
        {}
    ];
    computeNullRatios(keyFrames);
    strictEqual(keyFrames[1].computedRatio, 1 / 3, 'computedRatio should be 1/3 to make the difference between subsequent keyframe ratios are equal');
    strictEqual(keyFrames[2].computedRatio, 2 / 3, 'computedRatio should be 2/3 to make the difference between subsequent keyframe ratios are equal');

    keyFrames = [
        {ratio: 0},
        {},
        {ratio: 0.5}
    ];
    computeNullRatios(keyFrames);
    strictEqual(keyFrames[1].computedRatio, 0.25, 'computedRatio should be 0.25 to make the difference between subsequent keyframe ratios are equal');
});

test('EntityAnimator.animate', function () {

    var EntityAnimator = cc._Test.EntityAnimator;
    var entity = new cc.ENode();
    var renderer = entity.addComponent(cc.SpriteRenderer);

    var animator = new EntityAnimator(entity);
    var animation = animator.animate([
        {
            props: { x: 50, scaleX: 10 },
            comps: {
                'cc.Sprite': { color: Color.WHITE }
            }
        },
        {
            props: { x: 100, scaleX: 20 },
            comps: {
                'cc.Sprite': { color: color(1, 1, 1, 0) }
            }
        }
    ]);

    var posCurve = animation.curves[0];
    var scaleCurve = animation.curves[1];
    var colorCurve = animation.curves[2];
    strictEqual(animation.curves.length, 3, 'should create 3 curve');
    strictEqual(posCurve.target, entity, 'target of posCurve should be entity');
    strictEqual(posCurve.prop, 'x', 'propName of posCurve should be x');
    strictEqual(scaleCurve.target, entity, 'target of scaleCurve should be entity');
    strictEqual(scaleCurve.prop, 'scaleX', 'propName of scaleCurve should be scaleX');
    strictEqual(colorCurve.target, renderer, 'target of colorCurve should be sprite renderer');
    strictEqual(colorCurve.prop, 'color', 'propName of colorCurve should be color');

    deepEqual(posCurve.values, [50, 100], 'values of posCurve should equals keyFrames');
    deepEqual(scaleCurve.values, [10, 20], 'values of scaleCurve should equals keyFrames');
    deepEqual(colorCurve.values, [Color.WHITE, color(1, 1, 1, 0)], 'values of colorCurve should equals keyFrames');

    deepEqual(posCurve.ratios, [0, 1], 'ratios of posCurve should equals keyFrames');
    deepEqual(scaleCurve.ratios, [0, 1], 'ratios of scaleCurve should equals keyFrames');
    deepEqual(colorCurve.ratios, [0, 1], 'ratios of colorCurve should equals keyFrames');

    animator.update(0);
    deepEqual(entity.x, 50, 'first frame should play until the end of this frame');

    animator.update(100);
    strictEqual(animator.isPlaying, false, 'animator should not update if non playing animation');
    deepEqual(entity.x, 100, 'first frame should play until the end of this frame');
});

test('DynamicAnimCurve', function () {
    var DynamicAnimCurve = cc._Test.DynamicAnimCurve;
    var anim = new DynamicAnimCurve();
    var target = {
        height: 1,
        position: v2(123, 456),
        foo: {
            bar: color(0.5, 0.5, 0.5, 0.5),
        }
    };
    anim.target = target;
    anim.prop = 'height';
    anim.values = [10, 100];
    anim.ratios = [0.5, 1.0];
    anim.sample(null, 0.1, null);

    strictEqual(target.height, 10, 'The keyframe value whose ratio is out of ranges should just clamped');

    anim.prop = 'position';
    anim.subProps = ['x'];
    anim.values = [50, 100];
    anim.ratios = [0.0, 1.0];
    anim.sample(null, 0.1, null);

    deepEqual(target.position, v2(55, 456), 'The composed position should animated');

    anim.target = target;
    anim.prop = 'foo';
    anim.subProps = ['bar', 'a'];
    anim.values = [0.5, 1.0];
    anim.ratios = [0.0, 1.0];
    anim.sample(null, 0.1, null);

    deepEqual(target.foo, { bar: color(0.5, 0.5, 0.5, 0.55) }, 'The composed color should animated');
});

test('MotionPathCurve', function () {
    var MotionPathCurve = cc._Test.MotionPathCurve;

    // var points = [
    //     {
    //         pos: [0, 0]
    //     },

    //     {
    //         pos: [100, 100],
    //         in:  [50,  100],
    //         out: [150, 50]
    //     },

    //     {
    //         pos: [300, 200],
    //         in:  [300, 300],
    //         out: [200, 200]
    //     },

    //     {
    //         pos: [400, 0]
    //     }
    // ];

    var xCurve = new MotionPathCurve();
    var target = {
        x: 0,
        y: 0
    };

    xCurve.target = target;
    xCurve.prop = 'x';
    xCurve.values = [100, 0, 400];
    xCurve.ratios = [0, 0.5, 1];
    xCurve.motionPaths = [null, [[100, 50, 150], [300, 300, 200]], null];

    xCurve.sample(null, 0.25, null);
    strictEqual(target.x, 50, 'should not calc motion path if from value have no motion path');

    xCurve.sample(null, 0.5, null);
    strictEqual(target.x, 0, 'should calc motion path');

    xCurve.sample(null, 0.5 + (0.5 / 3 * 0.2), null);
    close(target.x, cc.bezierAt(0, 0, 50, 100, 0.2), 000001, 'should calc motion path at ratio 0.2 of first motion path section');

    xCurve.sample(null, 0.5 + (0.5 / 3), null);
    close(target.x, 100, 000001, 'should calc motion path at ratio 0 of second motion path');

    xCurve.sample(null, 0.5 + (0.5 / 3 * 1.5), null);
    close(target.x, cc.bezierAt(100, 150, 300, 300, 0.5), 000001, 'should calc motion path at ratio 0.5 of second motion path');

    xCurve.sample(null, 0.5 + (0.5 / 3 * 2), null);
    close(target.x, 300, 000001, 'should calc motion path at ratio 0 of third motion path');

    xCurve.sample(null, 0.5 + (0.5 / 3 * 2.9), null);
    close(target.x, cc.bezierAt(300, 200, 400, 400, 0.9), 000001, 'should calc motion path at ratio 0.9 of third motion path');

    xCurve.sample(null, 1.1, null);
    strictEqual(target.x, 400, 'should calc motion path at ratio 0.9 of third motion path');
});

test('AnimationNode', function () {
    var EntityAnimator = cc._Test.EntityAnimator;

    var entity = new cc.ENode();
    entity.x = 321;
    var renderer = entity.addComponent(cc.SpriteRenderer);

    var animator = new EntityAnimator(entity);
    var animation = animator.animate([
        {
            props: { x: 50, scale: v2(1, 1) },
            comps: {
                'cc.Sprite': { color: Color.WHITE }
            }
        },
        {
            props: { x: 100, scale: v2(2, 2) },
            comps: {
                'cc.Sprite': { color: color(255, 255, 255, 0) }
            }
        }
    ], {
        delay: 0.3,
        duration: 1.3,
        speed: 0.5,
        repeatCount: 1.25
    });

    animation.update(0.2);
    deepEqual(entity.x, 321, 'should not play animation while delay');

    animation.update(0.2);
    deepEqual(entity.x, 50, 'should play first key frame after delay');

    var actualDuration = animation.duration / animation.speed;
    animation.update(actualDuration / 2);
    deepEqual(entity.scale, 1.5, 'should play second key frame');

    animation.update(actualDuration / 2);
    deepEqual(renderer.color, color(255, 255, 255, 0), 'should play the last key frame');

    animation.update(actualDuration / 4);
    deepEqual(renderer.color, color(255, 255, 255, 255 * 0.75), 'should repeat animation');
    strictEqual(animation.isPlaying, false, 'should stop animation');

    animation.update(actualDuration / 4);
    deepEqual(renderer.color, color(255, 255, 255, 255 * 0.75), 'should not animate if stopped');
});

test('wrapMode', function () {
    var EntityAnimator = cc._Test.EntityAnimator;

    var entity = new cc.ENode();

    var animator = new EntityAnimator(entity);
    var animation = animator.animate([
        {
            props: { x: 10 },
        },
        {
            props: { x: 110 },
        }
    ], {
        delay: 0.3,
        duration: 1.3,
        speed: 0.5,
        wrapMode: cc.WrapMode.Reverse,
        repeatCount: Infinity
    });

    animation.update(0.3);

    var actualDuration = animation.duration / animation.speed;
    animation.update(actualDuration / 4);
    strictEqual(entity.x, 75 + 10, 'should play reversed animation');

    animation.wrapMode = cc.WrapMode.PingPong;
    animation.time = 0;
    animation.update(actualDuration / 4);
    strictEqual(entity.x, 25 + 10, 'should play animation as specified in 0 iteration');
    animation.update(actualDuration * 6);
    close(entity.x, 25 + 10, 0.000001, 'should play animation as specified in even iterations');

    animation.time = 0;
    animation.update(actualDuration / 4 + actualDuration);
    strictEqual(entity.x, 75 + 10, 'should played in the reverse direction in odd iterations');
});

test('createBatchedProperty', function () {
    var createBatchedProperty = cc._Test.createBatchedProperty;

    function test(path, mainValue, animValue) {
        return createBatchedProperty(path, path.indexOf('.'), mainValue, animValue);
    }

    var pos = v2(123, 456);
    var actual = test('position.y', pos, 321);
    ok(actual !== pos, 'should clone a new value');
    deepEqual(actual, v2(123, 321), 'checking value x');

    actual = test('p.x', pos, 321);
    deepEqual(actual, v2(321, 456), 'checking value y');

    var MyValue = cc.Class({
        extends: cc.ValueType,
        ctor: function () {
            this.abc = {
                def: {
                    gh: arguments[0]
                }
            };
        },
        clone: function () {
            return new MyValue(this.abc.def.gh);
        }
    });
    var myValue = new MyValue(520);
    actual = test('myValue.abc.def.gh', myValue, 521);
    strictEqual(actual.abc.def.gh, 521, 'checking value gh');
});

test('initClipData', function () {
    var initClipData = cc._Test.initClipData;

    var entity = new cc.ENode();
    entity.name = 'foo';
    var renderer = entity.addComponent(cc.SpriteRenderer);

    var childEntity = new cc.ENode();
    childEntity.name = 'bar';
    var childRenderer = childEntity.addComponent(cc.SpriteRenderer);

    entity.addChild(childEntity);

    var clip = new cc.AnimationClip();
    var state = new cc.AnimationState(clip);
    initClipData(entity, state);
    strictEqual(state.curves.length, 0, 'should create empty animation');

    clip = new cc.AnimationClip();
    clip._duration = 10;
    clip.curveData = {
        props: {
            position: [
                { frame: 0, value: v2(50, 100) },
                { frame: 5, value: v2(100, 75) },
                { frame: 10, value: v2(100, 50) }
            ],
            'scale.x': [
                { frame: 0, value: 10 },
                { frame: 10, value: 20 }
            ],
            'scale.y': [
                { frame: 0, value: 10 },
                { frame: 5, value: 12 },
                { frame: 10, value: 20 }
            ]
        },

        comps: {
            'cc.Sprite': {
                'color.a': [
                    { frame: 0, value: 1 },
                    { frame: 10, value: 0 }
                ]
            }
        },

        paths: {
            'bar': {
                props: {
                    position: [
                        { frame: 0, value: v2(50, 100) },
                        { frame: 5, value: v2(100, 75) },
                        { frame: 10, value: v2(100, 50) },
                    ]
                },

                comps: {
                    'cc.Sprite': {
                        'color.a': [
                            { frame: 0, value: 1 },
                            { frame: 10, value: 0 }
                        ]
                    }
                }
            }
        }
    };

    state = new cc.AnimationState(clip);
    initClipData(entity, state);

    var posCurve = state.curves[0];
    var scaleCurveX = state.curves[1];
    var scaleCurveY = state.curves[2];
    var colorCurve = state.curves[3];

    strictEqual(state.curves.length, 6, 'should create 6 curve');
    strictEqual(posCurve.target, entity, 'target of posCurve should be transform');
    strictEqual(posCurve.prop, 'position', 'propName of posCurve should be position');
    strictEqual(scaleCurveX.target, entity, 'target of scaleCurve should be transform');
    strictEqual(scaleCurveX.prop, 'scale', 'propName of scaleCurve should be scale');
    strictEqual(colorCurve.target, renderer, 'target of colorCurve should be sprite renderer');
    strictEqual(colorCurve.prop, 'color', 'propName of colorCurve should be color');

    deepEqual(posCurve.values, [v2(50, 100), v2(100, 75), v2(100, 50)], 'values of posCurve should equals keyFrames');

    deepEqual(scaleCurveY.values, [10, 12, 20], 'values of scaleCurve should equals keyFrames');

    deepEqual(colorCurve.values, [1, 0], 'values of colorCurve should equals keyFrames');

    deepEqual(posCurve.ratios, [0, 0.5, 1], 'ratios of posCurve should equals keyFrames');
    deepEqual(colorCurve.ratios, [0, 1], 'ratios of colorCurve should equals keyFrames');
});

test('initClipData with motionPath', function () {
    var MotionPathCurve = cc._Test.MotionPathCurve;
    var initClipData = cc._Test.initClipData;

    var entity = new cc.ENode();
    entity.name = 'foo';
    var renderer = entity.addComponent(cc.SpriteRenderer);

    var childEntity = new cc.ENode();
    childEntity.name = 'bar';
    var childRenderer = childEntity.addComponent(cc.SpriteRenderer);

    entity.addChild(childEntity);

    var clip = new cc.AnimationClip();
    clip._duration = 10;
    clip.curveData = {
        props: {
            x: [
                { frame: 0, value: 0 },
                { frame: 5, value: 50, motionPath: [[100, 50, 150], [300, 300, 200]] },
                { frame: 10, value: 400 }
            ],

            rotation: [
                {frame: 0, value: 30},
                {frame: 3, value: 100}
            ]
        },

        comps: {
            'cc.Sprite': {
                'color.a': [
                    { frame: 0, value: 1 },
                    { frame: 10, value: 0 }
                ]
            }
        },

        paths: {
            'bar': {
                props: {
                    y: [
                        { frame: 0, value: 0 },
                        { frame: 5, value: 50 },
                        { frame: 10, value: 100 }
                    ]
                },

                comps: {
                    'cc.Sprite': {
                        'color.a': [
                            { frame: 0, value: 1 },
                            { frame: 10, value: 0 }
                        ]
                    }
                }
            }
        }
    };

    var state = new cc.AnimationState(clip);
    initClipData(entity, state);

    strictEqual(state.curves.length, 5, 'should create 5 curves');
    strictEqual(state.curves[0] instanceof MotionPathCurve, true, 'entity x prop should create MotionPathCurve');
    strictEqual(state.curves[1] instanceof MotionPathCurve, false, 'entity rotation prop should not create MotionPathCurve');
    strictEqual(state.curves[3] instanceof MotionPathCurve, true, 'entity x prop should create MotionPathCurve');

    deepEqual(state.curves[0].motionPaths, [undefined, [[100, 50, 150], [300, 300, 200]], undefined], 'should add motion path to curve');

    // make first frame perfect
    state.update(0);

    // update time
    state.update(5 + (5 / 3 * 1.5));
    close(entity.x, cc.bezierAt(100, 150, 300, 300, 0.5), 000001, 'should calc motion path at ratio 0.5 of second motion path');

});

test('Animation Component', function () {
    var initClipData = cc._Test.initClipData;

    var entity = new cc.ENode();
    var animation = entity.addComponent(cc.AnimationComponent);

    entity.x = 400;

    var clip = new cc.AnimationClip();
    clip._duration = 10;
    clip._name = 'test';
    clip.curveData = {
        props: {
            x: [
                { frame: 0, value: 0 },
                { frame: 5, value: 50 },
                { frame: 10, value: 100 }
            ]
        }
    };

    animation.addClip(clip);

    strictEqual(animation._clips.length, 1, 'should add 1 clip');

    var state = animation.getAnimationState('test');
    strictEqual(state.clip, clip, 'should create state with clip');

    animation.play('test');
    animation.sample();
    strictEqual(entity.x, 0, 'target property should equals value in frame 0s');

    animation.play('test', 5);
    animation.sample();
    strictEqual(entity.x, 50, 'target property should equals value in frame 5s');

    animation.play('test', 10);
    animation.sample();
    strictEqual(entity.x, 100, 'target property should equals value in frame 10s');

    animation.removeClip(clip);
    strictEqual(animation._clips.length, 0, 'should remove clip');
    strictEqual(animation.getAnimationState('test'), null, 'should remove state');
});
