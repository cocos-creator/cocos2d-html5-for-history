function visitWrapper (wrapper, visitor) {
    visitor(wrapper);

    var childrenN = wrapper.childrenN;
    for (var i = 0; i < childrenN.length; i++) {
        visitor(cc(childrenN[i]));
    }
}

var Prefab = cc.FireClass({
    name: 'cc.Prefab',
    extends: cc.Asset,

    properties: {
        data: null
    },

    createNode: function (cb) {
        if (CC_EDITOR) {
            var node = cc.instantiate(this);
            cb(null, node);
        }
    },

    _instantiate: function () {
        var initNodeAndChildren = cc.Runtime.NodeWrapper._initNodeAndChildren;
        var wrapperToNode = new cc.deserialize.W2NMapper();

        // instantiate wrappers
        var data = cc.instantiate._clone(this.data, null, wrapperToNode);

        var newWrapper = data.w;

        // create nodes
        cc.engine._isCloning = true;
        initNodeAndChildren([data], null, wrapperToNode);
        cc.engine._isCloning = false;

        // reassociate nodes
        wrapperToNode.apply();

        newWrapper._onAfterInstantiate();

        if (CC_EDITOR) {
            Editor.PrefabUtils.onPrefabInstantiated(this, newWrapper);
        }

        return newWrapper.targetN;
    }
});

cc._Prefab = module.exports = Prefab;
