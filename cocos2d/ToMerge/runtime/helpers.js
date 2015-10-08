
var detachingNodes = {};

module.exports = {
    init: function () {
        if (CC_EDITOR) {
            Fire.engine.on('post-update', this._debounceNodeEvent);

            // 场景重建时，有可能引用改变ID不变，这里先 flush 一下以免事件顺序错乱
            Fire.engine.on('pre-launch-scene', this._debounceNodeEvent);
        }
    },

    // assert(node)
    onNodeAttachedToParent: function (node) {
        if (CC_EDITOR) {
            var uuid = cc(node).uuid;
            if (!uuid) {
                return;
            }
            var nodeWithSameId = detachingNodes[uuid];
            if (nodeWithSameId) {
                delete detachingNodes[uuid];
                if (nodeWithSameId === node) {
                    // debounce
                    return;
                }
                else {
                    // flush previous detach event
                    Fire.engine.emit('node-detach-from-scene', {
                        targetN: nodeWithSameId
                    });
                }
            }
            // new node
            Fire.engine.emit('node-attach-to-scene', {
                targetN: node
            });
        }
    },

    // assert(node)
    onNodeDetachedFromParent: function (node) {
        if (CC_EDITOR) {
            var uuid = cc(node).uuid;
            if (!uuid) {
                return;
            }
            detachingNodes[uuid] = node;
        }
    },

    _debounceNodeEvent: function () {
        if (CC_EDITOR) {
            for (var uuid in detachingNodes) {
                var node = detachingNodes[uuid];
                Fire.engine.emit('node-detach-from-scene', {
                    targetN: node
                });
            }
            detachingNodes = {};
        }
    }
};
