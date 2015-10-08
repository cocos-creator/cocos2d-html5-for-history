
var TextAlign = Runtime.TextAlign;
var TextAnchor = Runtime.TextAnchor;

var getAnchorPoint = (function () {
    var Anchor2Point = new Array(TextAnchor.BottomRight + 1);
    Anchor2Point[TextAnchor.TopLeft]      = cc.p(0,   1);
    Anchor2Point[TextAnchor.TopCenter]    = cc.p(0.5, 1);
    Anchor2Point[TextAnchor.TopRight]     = cc.p(1,   1);
    Anchor2Point[TextAnchor.MiddleLeft]   = cc.p(0,   0.5);
    Anchor2Point[TextAnchor.MiddleCenter] = cc.p(0.5, 0.5);
    Anchor2Point[TextAnchor.MiddleRight]  = cc.p(1,   0.5);
    Anchor2Point[TextAnchor.BottomLeft]   = cc.p(0,   0);
    Anchor2Point[TextAnchor.BottomCenter] = cc.p(0.5, 0);
    Anchor2Point[TextAnchor.BottomRight]  = cc.p(1,   0);

    return (function (textAnchor) {
        var anchorPoint = Anchor2Point[textAnchor];
        return cc.p(anchorPoint);
    });
})();


var NodeWrapper = require('./node');

var BitmapFontWrapper = cc.FireClass({
    name: 'Runtime.BitmapFontWrapper',
    extends: NodeWrapper,

    constructor: function () {
    },

    properties: {

        bitmapFont: {
            get: function () {
                return this.targetN._fntFile || '';
            },
            set: function (value) {
                this.targetN._fntFile = value;

                this.onBeforeSerialize();
                this.createNode(this.targetN);
            },
            url: Fire.BitmapFont
        },

        text: {
            get: function () {
                return this.targetN.string;
            },
            set: function ( value ) {
                if (typeof value === 'string') {
                    this.targetN.string = value;
                }
                else {
                    cc.error('The new text must be string');
                }
            }
        },

        anchor: {
            get: function () {
                return this._anchor;
            },
            set: function ( value ) {
                if (typeof value === 'number') {
                    this._anchor = value;

                    var anchorPoint = getAnchorPoint(value);
                    this.targetN.setAnchorPoint( anchorPoint );
                }
                else {
                    cc.error('The new text must be number');
                }
            },
            type: TextAnchor
        },

        align: {
            get: function () {
                // jsb not implement yet
                if (typeof jsb !== 'undefined') return TextAlign.Left;

                return this.targetN.textAlign;
            },
            set: function ( value ) {
                if (typeof value === 'number') {
                    this.targetN.textAlign = value;
                }
                else {
                    cc.error('The new text must be number');
                }
            },
            type: TextAlign
        },

        childrenN: {
            get: function () {
                return [];
            },
        },


        _text: {
            default: ""
        },

        _anchor: {
            default: TextAnchor.MiddleCenter
        },

        _align: {
            default: TextAlign.Left
        },

        _bitmapFont: {
            default: '',
            url: Fire.BitmapFont
        }
    },

    statics: {
        canHaveChildrenInEditor: false
    },

    onBeforeSerialize: function () {
        NodeWrapper.prototype.onBeforeSerialize.call(this);

        this._text = this.text;
        this._anchor = this.anchor;
        this._align = this.align;
        this._bitmapFont = this.bitmapFont;
    },

    createNode: function (node) {
        node = node || new cc.LabelBMFont();

        var bitmapFontUrl = this._bitmapFont;

        if ( bitmapFontUrl ) {
            node._fntFile = bitmapFontUrl;
            cc.loader.load( bitmapFontUrl, function (err, results) {
                node.initWithString(this._text, bitmapFontUrl);
                node.setAnchorPoint( getAnchorPoint(this._anchor) );
                node.textAlign = this._align;

                NodeWrapper.prototype.createNode.call(this, node);
            }.bind(this));
        }
        else {
            node.string = this._text;
            node.setAnchorPoint( getAnchorPoint(this._anchor) );
            node.textAlign = this._align;

            NodeWrapper.prototype.createNode.call(this, node);
        }

        return node;
    }
});

Runtime.BitmapFontWrapper = module.exports = BitmapFontWrapper;
