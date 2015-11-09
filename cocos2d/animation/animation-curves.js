
var bezier = require('./bezier').bezier;
var fastBezier = require('./bezier').fastBezier;

//
// 动画数据类，相当于 AnimationClip。
// 虽然叫做 AnimCurve，但除了曲线，可以保存任何类型的值。
//
// @class AnimCurve
// @constructor
//
var AnimCurve = cc.Class({
    name: 'cc.AnimCurve',

    //
    // @method sample
    // @param {number} time
    // @param {number} ratio - The normalized time specified as a number between 0.0 and 1.0 inclusive.
    // @param {Animator} animator
    //
    sample: function (time, ratio, animator) {}
});

//
// Searches the entire sorted Array for an element and returns the zero-based index of the element.
// @method binarySearch
// @param {number[]} array
// @param {number} value
// @return {number} The zero-based index of item in the sorted Array, if item is found; otherwise, a negative number that is the bitwise complement of the index of the next element that is larger than item or, if there is no larger element, the bitwise complement of array's length.
//
function binarySearch (array, value) {
    var l = 0, h = array.length - 1;
    while (l <= h) {
        var m = ((l + h) >> 1);
        if (array[m] === value) {
            return m;
        }
        if (array[m] > value) {
            h = m - 1;
        }
        else {
            l = m + 1;
        }
    }
    return ~l;
}

//
// 区别于 SampledAnimCurve。
//
// @class DynamicAnimCurve
// @constructor
// @extends AnimCurve
//
var DynamicAnimCurve = cc.Class({
    name: 'cc.DynamicAnimCurve',
    properties: {

        // The object being animated.
        // @property target
        // @type {object}
        target: null,

        // The name of the property being animated.
        // @property prop
        // @type {string}
        prop: "",

        // The values of the keyframes. (y)
        // @property values
        // @type {any[]}
        values: [],

        // The keyframe ratio of the keyframe specified as a number between 0.0 and 1.0 inclusive. (x)
        // @property ratios
        // @type {number[]}
        ratios: [],

        // @property types
        // @param {object[]}
        // Each array item maybe type:
        // - [x, x, x, x]: Four control points for bezier
        // - null: linear
        types: [],

        // @property {string[]} subProps - The path of sub property being animated.
        subProps: null
    },

    _calcValue: function (frameIndex, ratio) {
        var values = this.values;
        var fromVal = values[frameIndex - 1];
        var toVal = values[frameIndex];

        // lerp
        if (typeof fromVal === 'number') {
            value = fromVal + (toVal - fromVal) * ratio;
        }
        else {
            var lerp = fromVal.lerp;
            if (lerp) {
                value = fromVal.lerp(toVal, ratio);
            }
            else {
                // no linear lerp function, just return last frame
                value = fromVal;
            }
        }

        return value;
    },

    sample: function (time, ratio, animator) {
        var values = this.values;
        var ratios = this.ratios;
        var frameCount = ratios.length;

        if (frameCount === 0) {
            return;
        }

        // evaluate value
        var value;
        var index = binarySearch(ratios, ratio);

        if (index < 0) {
            index = ~index;

            if (index <= 0) {
                value = values[0];
            }
            else if (index >= frameCount) {
                value = values[frameCount - 1];
            }
            else {
                var fromRatio = ratios[index - 1];
                var toRatio = ratios[index];
                var type = this.types[index - 1];
                var ratioBetweenFrames = (ratio - fromRatio) / (toRatio - fromRatio);

                if (Array.isArray(type)) {
                    // bezier curve
                    ratioBetweenFrames = bezier(type, ratioBetweenFrames);
                }

                value = this._calcValue(index, ratioBetweenFrames);
            }
        }
        else {
            value = values[index];
        }

        var subProps = this.subProps;
        if (subProps) {
            // create batched value dynamically
            var mainProp = this.target[this.prop];
            var subProp = mainProp;

            for (var i = 0; i < subProps.length - 1; i++) {
                var subPropName = subProps[i];
                if (subProp) {
                    subProp = subProp[subPropName];
                }
                else {
                    return;
                }
            }

            var propName = subProps[subProps.length - 1];

            if (subProp) {
                subProp[propName] = value;
            }
            else {
                return;
            }

            value = mainProp;
        }

        // apply value
        this.target[this.prop] = value;
    }
});

DynamicAnimCurve.Linear = null;
DynamicAnimCurve.Bezier = function (controlPoints) {
    return controlPoints;
};


var MotionPathCurve = cc.Class({
    name: 'cc.MotionPathCurve',
    extends: DynamicAnimCurve,

    properties: {

        // @property motionPaths
        // @param {object[]}
        // Each array item with three control values:
        // [point, point-in, point-out]
        motionPaths: []
    },

    _calcValue: function (frameIndex, ratio) {
        var values = this.values;
        var fromVal = values[frameIndex - 1];
        var toVal = values[frameIndex];

        var motionPath = this.motionPaths[frameIndex - 1];

        // if no motion path, lerp as normal number
        if (!motionPath) {
            return fromVal + (toVal - fromVal) * ratio;
        }

        if (!Array.isArray(motionPath)) {
            cc.error('motionPath must be Array');
            return fromVal + (toVal - fromVal) * ratio;
        }

        var bezierCount = motionPath.length + 1;
        var eachRatio = 1 / bezierCount;
        var bezierIndex = (ratio / eachRatio) | 0;
        var realRatio = (ratio % eachRatio) / eachRatio;

        var c1,c2,c3,c4;
        if (bezierIndex === 0) {
            var controlPont = motionPath[bezierIndex];

            c1 = c2 = fromVal;
            c3 = controlPont[1];
            c4 = controlPont[0];
        }
        else if (bezierIndex === bezierCount - 1) {
            var controlPont = motionPath[bezierIndex - 1];

            c1 = controlPont[0];
            c2 = controlPont[2];
            c3 = c4 = toVal;
        }
        else {
            var controlPont1 = motionPath[bezierIndex - 1];
            var controlPont2 = motionPath[bezierIndex];

            c1 = controlPont1[0];
            c2 = controlPont1[2];
            c3 = controlPont2[1];
            c4 = controlPont2[0];
        }

        var value = fastBezier(c1, c2, c3, c4, realRatio);
        return value;
    }
});

if (CC_TEST) {
    cc._Test.DynamicAnimCurve = DynamicAnimCurve;
    cc._Test.MotionPathCurve = MotionPathCurve;
}

module.exports = {
    AnimCurve: AnimCurve,
    DynamicAnimCurve: DynamicAnimCurve,
    MotionPathCurve: MotionPathCurve
};
