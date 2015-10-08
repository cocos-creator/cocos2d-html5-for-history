
var LayoutWrapper = require('./layout');

var ScrollViewWrapper = cc.FireClass({
    name: 'Runtime.ScrollViewWrapper',
    extends: LayoutWrapper,

    properties: {
        direction: {
            get: function () {
                return this.targetN.getDirection();
            },
            set: function (value) {
                if (typeof value === 'number' && !isNaN(value)) {
                    this.targetN.setDirection(value);

                    this.doLayout();
                }
                else {
                    cc.error('The new direction must be number');
                }
            },
            type: Runtime.ScrollDirection
        },

        bounce: {
            get: function () {
                return this.targetN.isBounceEnabled();
            },
            set: function (value) {
                if (typeof value === 'boolean') {
                    this.targetN.setBounceEnabled(value);
                }
                else {
                    cc.error('The new bounce must be boolean');
                }
            }
        },

        innerSize: {
            get: function () {
                var size = this.targetN.getInnerContainerSize();
                return new cc.Vec2(size.width, size.height);
            },
            set: function (value) {
                if ( value instanceof cc.Vec2 ) {
                    this.targetN.setInnerContainerSize( cc.size(value.x, value.y) );

                    this.doLayout();
                }
                else {
                    cc.error('The new innerSize must be cc.Vec2');
                }
            }
        },

        _direction: {
            default: Runtime.ScrollDirection.None,
            type: Runtime.ScrollDirection
        },

        _bounce: {
            default: false
        },

        _innerSize: {
            default: null
        }
    },

    doLayout: function () {
        this.targetN._innerContainer.requestDoLayout();
        LayoutWrapper.prototype.doLayout.call(this);
    },

    onBeforeSerialize: function () {
        LayoutWrapper.prototype.onBeforeSerialize.call(this);

        this._direction = this.direction;
        this._bounce = this.bounce;
        this._innerSize = [this.innerSize.x, this.innerSize.y];
    },

    createNode: function (node) {
        node = node || new ccui.ScrollView();

        LayoutWrapper.prototype.createNode.call(this, node);

        node.setDirection( this._direction );
        node.setBounceEnabled( this._bounce );

        var innerSize = this._innerSize;
        if (innerSize) node.setInnerContainerSize( cc.size(innerSize[0], innerSize[1]) );

        return node;
    }
});

Runtime.ScrollViewWrapper = module.exports = ScrollViewWrapper;
