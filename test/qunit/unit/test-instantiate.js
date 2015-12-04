﻿largeModule('Instantiate');

(function () {
    var match = function (obj, expect, info) {
        deepEqual(cc.instantiate(obj), expect, info);
    };

    test('basic', function () {
        match({}, {}, 'smoke test1');

        match({ 1: 1, 2: [2, {3: '3'}]}, {1: 1, 2: [2, {3: '3'}]}, 'simple test1');

        var obj = {};
        var clone = cc.instantiate({
            ref1: obj,
            ref2: obj,
        });
        strictEqual(clone.ref1, clone.ref2, 'should track the same reference');

        // test class

        var BaseAsset = function () {
            this.inheritProp = 321;
        };
        var MyAsset = (function () {
            var _super = BaseAsset;

            function MyAsset () {
                _super.call(this);

                this.emptyArray = [];
                this.array = [1, '2', {a:3}, [4, [5]], true];
                this.string = 'unknown';
                this.number = 1;
                this.boolean = true;
                this.emptyObj = {};
                this.obj = {};
            }
            cc.js.extend(MyAsset, _super);
            cc.js.setClassName('MyAsset', MyAsset);

            // should not instantiate --------------------------
            MyAsset.staticFunc = function () { };
            MyAsset.staticProp = cc.Enum({
                UseBest: -1,
                Ascending: -1,
                Descending: -1
            });
            MyAsset.prototype.protoFunc = function () { };
            MyAsset.prototype.protoProp = 123;
            // -------------------------------------------------

            return MyAsset;
        })();
        var asset = new MyAsset();
        asset.dynamicProp = false;
        var expect = new MyAsset();
        expect.dynamicProp = false;

        var clone = cc.instantiate(asset);

        strictEqual(asset.constructor, clone.constructor, 'instantiated should has the same type');
        deepEqual(clone, expect, 'can instantiate class');

        cc.js.unregisterClass(MyAsset);
    });

    test('objFlags and hash id', function () {
        var obj = new cc.Object();
        obj._objFlags = cc.Object.Flags.EditorOnly;

        var clone = cc.instantiate(obj);

        strictEqual(clone._objFlags, cc.Object.Flags.EditorOnly, 'can clone obj flags');

        //var hashObj = new cc.HashObject();
        //var id = hashObj.id;    // generate id
        //var clonedHashObj = cc.instantiate(hashObj);
        //
        //notEqual(clonedHashObj.id, id, 'should not clone id');
        //notEqual(clonedHashObj.hashCode, hashObj.hashCode, 'should not clone hashCode');
    });

    test('CCClass', function () {
        var Sprite = cc.Class({
            name: 'Sprite',
            ctor: function () {
                this.image = 'sprite.png';
            },
            properties: {
                size: new cc.Vec2(128, 128),
                _isValid: {
                    default: true,
                    visible: true,
                    serializable: false
                },
            }
        });

        var sprite = new Sprite();
        sprite.image = 'blabla';
        sprite.size = new cc.Vec2(32, 2);
        sprite._isValid = false;

        var clone = cc.instantiate(sprite);

        strictEqual(sprite.constructor, clone.constructor, 'instantiated should has the same type');
        deepEqual(clone.size, new cc.Vec2(32, 2), 'can clone variable defined by property');
        strictEqual(clone.image, 'sprite.png', 'should not clone variable which not defined by property');
        strictEqual(clone._isValid, true, 'should not clone non-serialized field');

        cc.js.unregisterClass(Sprite);
    });

    test('ValueType', function () {
        var obj = {
            pos: new cc.Vec2(1, 2)
        };
        var clone = cc.instantiate(obj);

        ok(obj.pos !== clone.pos, 'value type should be cloned');
        strictEqual(obj.pos.x, clone.pos.x, 'checking x');
        strictEqual(obj.pos.y, clone.pos.y, 'checking y');
    });

    test('Circular Reference', function () {
        function MyAsset () {
            // array1 = [1, array2]
            // array2 = [array1, 2]
            this.array1 = [1];
            this.array2 = [this.array1, 2];
            this.array1.push(this.array2);

            this.dict1 = {num: 1};
            this.dict2 = {num: 2, other: this.dict1};
            this.dict1.other = this.dict2;
        }
        var clone = cc.instantiate(new MyAsset());

        deepEqual(new MyAsset(), clone, 'can instantiate');
        strictEqual(clone.array1[1], clone.array2, 'two arrays can circular reference each other 1');
        strictEqual(clone.array2[0], clone.array1, 'two arrays can circular reference each other 2');
        strictEqual(clone.dict1.other, clone.dict2, 'two dicts can circular reference each other 1');
        strictEqual(clone.dict2.other, clone.dict1, 'two dicts can circular reference each other 2');
    });

    test('asset reference', function () {
        var sprite = {};
        sprite.sprite = new cc.SpriteFrame();

        var clone = cc.instantiate(sprite);

        ok(sprite.sprite === clone.sprite, 'should not clone asset');
    });

    test('node', function () {
        var node = new cc.ENode();
        var child = new cc.ENode();
        child.parent = node;
        cc.director.getScene().addChild(node);

        var clone = cc.instantiate(node);

        ok(clone.parent === null, 'root of cloned node should not have parent');
        ok(clone.children[0].parent === clone, 'cloned child node should have parent');
    });

    test('component', function () {
        var Script = cc.Class({
            name: '2154648724566',
            extends: cc.Component,
        });

        var node = new cc.ENode();
        node.addComponent(Script);

        var clone = cc.instantiate(node);

        strictEqual(!!clone.getComponent(Script), true, 'should be added');

        cc.js.unregisterClass(Script);
    });

    test('redirect reference', function () {
        var Script = cc.Class({
            name: '2154648724566',
            extends: cc.Component,
            properties: {
                nodeInComp: {
                    default: null,
                    type: cc.ENode
                },
                nodeArrayInComp: {
                    default: [],
                    type: cc.ENode
                },
                otherNodeInComp: {
                    default: null,
                    type: cc.ENode
                },
                childComp: null,
                otherComp: null,
            }
        });

        var parent = new cc.ENode('parent');
        var child = new cc.ENode('child');
        var other = new cc.ENode('other');
        parent.addChild(child);
        child.parent = parent;
        var parentComp = parent.addComponent(Script);
        var childComp = child.addComponent(Script);
        var otherComp = other.addComponent(Script);

        parentComp.nodeInComp = child;
        parentComp.nodeArrayInComp = [child, other];
        parentComp.otherNodeInComp = other;
        parentComp.childComp = childComp;
        parentComp.otherComp = otherComp;
        childComp.nodeInComp = parent;
        childComp.nodeArrayInComp = [parent, other];
        childComp.otherNodeInComp = other;

        var cloneParent = cc.instantiate(parent);
        var cloneChild = cloneParent._children[0];
        var cloneParentComp = cloneParent.getComponent(Script);
        var cloneChildComp = cloneChild.getComponent(Script);

        notEqual(child, cloneChild, 'should clone child');
        strictEqual(cloneChild.parent, cloneParent, 'should redirect parent reference');

        ok(cloneParentComp.nodeInComp === cloneChild, 'should redirect child reference');
        fastArrayEqual(cloneParentComp.nodeArrayInComp, [cloneChild, other], 'should redirect array of child reference');
        ok(cloneChildComp.nodeInComp === cloneParent, 'should redirect parent reference in component');
        fastArrayEqual(cloneChildComp.nodeArrayInComp, [cloneParent, other], 'should redirect array of parent reference');
        ok(cloneParentComp.otherNodeInComp === other, 'should not clone other node in parent');
        ok(cloneChildComp.otherNodeInComp === other, 'should not clone other node in child');

        ok(cloneParentComp.childComp === cloneChildComp, 'should redirect child component');
        ok(cloneParentComp.otherComp === otherComp, 'should not clone other component');

        cc.js.unregisterClass(Script);
    });
})();
