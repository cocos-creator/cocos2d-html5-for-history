var JS = require('./js');

/**
 * The base class of most of all the objects in Fireball.
 * @class CCObject
 * @constructor
 */
function CCObject () {

    /**
     * @property _name
     * @type string
     * @default ""
     * @private
     */
    this._name = '';

    /**
     * @property _objFlags
     * @type number
     * @default 0
     * @private
     */
    this._objFlags = 0;
}


// definitions for CCObject.Flags

var Destroyed = 1 << 0;
var ToDestroy = 1 << 1;
var DontSave = 1 << 2;
var EditorOnly  = 1 << 3;
var Dirty = 1 << 4;
var DontDestroy = 1 << 5;
//var NodeSavedAsWrapper = 1 << 6;
var Destroying = 1 << 9;
var HideInGame = 1 << 10;
var HideInEditor = 1 << 11;
//var Prefab = 1 << 12,
var IsOnLoadCalled = 1 << 13;
var Hide = HideInGame | HideInEditor;
// should not clone or serialize these flags
var PersistentMask = ~(ToDestroy | Dirty | Destroying | DontDestroy |
                       IsOnLoadCalled);

/**
 * Bit mask that controls object states.
 * @class Flags
 * @static
 * @private
 */
CCObject.Flags = {

    /**
     * The object will not be saved.
     * @property DontSave
     * @type number
     */
    DontSave: DontSave,

    /**
     * The object will not be saved when building a player.
     * @property EditorOnly
     * @type number
     */
    EditorOnly: EditorOnly,

    Dirty: Dirty,

    /**
     * Dont destroy automatically when loading a new scene.
     * @property DontDestroy
     * @private
     */
    DontDestroy: DontDestroy,

    PersistentMask: PersistentMask,

    // FLAGS FOR ENGINE

    Destroying: Destroying,

    /**
     * Hide in game and hierarchy.
     * This flag is readonly, it can only be used as an argument of scene.addEntity() or Entity.createWithFlags()
     * @property HideInGame
     * @type number
     */
    HideInGame: HideInGame,

    // FLAGS FOR EDITOR

    /**
     * This flag is readonly, it can only be used as an argument of scene.addEntity() or Entity.createWithFlags()
     * @property HideInEditor
     * @type number
     */
    HideInEditor: HideInEditor,

    /**
     * Hide in game view, hierarchy, and scene view... etc.
     * This flag is readonly, it can only be used as an argument of scene.addEntity() or Entity.createWithFlags()
     * @property Hide
     * @type number
     */
    Hide: Hide,

    // FLAGS FOR COMPONENT

    IsOnLoadCalled: IsOnLoadCalled,

};

require('./CCFireClass').fastDefine('cc.Object', CCObject, ['_name', '_objFlags']);

// internal static

var objectsToDestroy = [];

Object.defineProperty(CCObject, '_deferredDestroy', {
    value: function () {
        var deleteCount = objectsToDestroy.length;
        for (var i = 0; i < deleteCount; ++i) {
            var obj = objectsToDestroy[i];
            if (!(obj._objFlags & Destroyed)) {
                obj._destroyImmediate();
            }
        }
        // if we called b.destory() in a.onDestroy(), objectsToDestroy will be resized,
        // but we only destroy the objects which called destory in this frame.
        if (deleteCount === objectsToDestroy.length) {
            objectsToDestroy.length = 0;
        }
        else {
            objectsToDestroy.splice(0, deleteCount);
        }

        if (CC_EDITOR) {
            deferredDestroyTimer = -1;
        }
    },
    enumerable: false
});

if (CC_EDITOR) {
    Object.defineProperty(CCObject, '_clearDeferredDestroyTimer', {
        value: function () {
            if (deferredDestroyTimer !== -1) {
                clearTimeout(deferredDestroyTimer);
                deferredDestroyTimer = -1;
            }
        },
        enumerable: false
    });
}

// MEMBER

var prototype = CCObject.prototype;

/**
 * The name of the object.
 * @property name
 * @type string
 * @default ""
 */
JS.getset(prototype, 'name',
    function () {
        return this._name;
    },
    function (value) {
        this._name = value;
    }
);

/**
 * Indicates whether the object is not yet destroyed
 * @property isValid
 * @type boolean
 * @default true
 * @readOnly
 */
JS.get(prototype, 'isValid', function () {
    return !(this._objFlags & Destroyed);
});

var deferredDestroyTimer = -1;

/**
 * Destroy this CCObject, and release all its own references to other resources.
 *
 * After destroy, this CCObject is not usable any more.
 * You can use cc.isValid(obj) (or obj.isValid if obj is non-nil) to check whether the object is destroyed before
 * accessing it.
 *
 * @method destroy
 * @return {Boolean} whether it is the first time the destroy being called
 */
prototype.destroy = function () {
    if (this._objFlags & Destroyed) {
        cc.warn('object already destroyed');
        return false;
    }
    if (this._objFlags & ToDestroy) {
        return false;
    }
    this._objFlags |= ToDestroy;
    objectsToDestroy.push(this);

    if (deferredDestroyTimer === -1 && cc.engine && ! cc.engine._isUpdating && CC_EDITOR) {
        // auto destroy immediate in edit mode
        deferredDestroyTimer = setTimeout(CCObject._deferredDestroy, 1);
    }
    return true;
};

/**
 * Clear all references in the instance.
 *
 * NOTE: this method will not clear the getter or setter functions which defined in the INSTANCE of CCObject.
 *       You can override the _destruct method if you need.
 * @method _destruct
 * @private
 */
prototype._destruct = function () {
    // 允许重载destroy
    // 所有可枚举到的属性，都会被清空
    for (var key in this) {
        if (this.hasOwnProperty(key)) {
            var type = typeof this[key];
            switch (type) {
                case 'string':
                    this[key] = '';
                    break;
                case 'object':
                    this[key] = null;
                    break;
                case 'function':
                    this[key] = null;
                    break;
                default:
                    break;
            }
        }
    }
};

/**
 * Called before the object being destroyed.
 * @method _onPreDestroy
 * @private
 */
prototype._onPreDestroy = null;

prototype._destroyImmediate = function () {
    if (this._objFlags & Destroyed) {
        cc.error('object already destroyed');
        return;
    }
    // engine internal callback
    if (this._onPreDestroy) {
        this._onPreDestroy();
    }
    // do destroy
    this._destruct();
    // mark destroyed
    this._objFlags |= Destroyed;
};

if (CC_EDITOR) {
    /**
     * The customized serialization for this object. (Editor Only)
     * @method _serialize
     * @param {Boolean} exporting
     * @return {object} the serialized json data object
     * @private
     */
    prototype._serialize = null;
}

/**
 * Init this object from the custom serialized data.
 * @method _deserialize
 * @param {object} data - the serialized json data
 * @param {_Deserializer} ctx
 * @private
 */
prototype._deserialize = null;

/**
 * @module cc
 */
/**
 * Checks whether the object is non-nil and not yet destroyed
 * @method isValid
 * @param {object|any} value
 * @return {Boolean} whether is valid
 */
cc.isValid = function (value) {
    if (typeof value === 'object') {
        return !!value && !(value._objFlags & Destroyed);
    }
    else {
        return typeof value !== 'undefined';
    }
};

cc.Object = CCObject;
module.exports = CCObject;
