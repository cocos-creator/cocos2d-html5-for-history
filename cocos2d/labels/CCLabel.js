/*global cc */

/****************************************************************************
 Copyright (c) 2015 Chukong Technologies Inc.

 http://www.cocos2d-x.org

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 ****************************************************************************/

var EventTarget = require("../cocos2d/core/event/event-target");

cc.FontLetterDefinition = function() {
    this._u = 0;
    this._v = 0;
    this._width = 0;
    this._height = 0;
    this._offsetX = 0;
    this._offsetY = 0;
    this._textureID = 0;
    this._validDefinition = false;
    this._xAdvance = 0;
};

cc.FontAtlas = function(fntConfig) {
    this._lineHeight = fntConfig.commonHeight;
    this._fontSize = fntConfig.fontSize;
    this._letterDefinitions = {};
    this._fntConfig = fntConfig;
};

cc.FontAtlas.prototype = {
    constructor: cc.FontAtlas,
    setFontSize: function(fontSize) {
        this._fontSize = fontSize;
    },
    getOriginalFontSize: function() {
        return this._fntConfig.fontSize;
    },
    addLetterDefinitions: function(letter, letterDefinition) {
        this._letterDefinitions[letter] = letterDefinition;
    },
    cloneLetterDefinition: function(){
        var copyLetterDefinitions = {};
        for(var key in this._letterDefinitions){
            var value = new cc.FontLetterDefinition();
            cc.js.mixin(value, this._letterDefinitions[key]);
            copyLetterDefinitions[key] = value;
        }
        return copyLetterDefinitions;
    },
    assignLetterDefinitions: function(letterDefinition){
        for(var key in this._letterDefinitions){
            var newValue = letterDefinition[key];
            var oldValue = this._letterDefinitions[key];
            cc.js.mixin(oldValue, newValue);
        }
    },
    scaleFontLetterDefinition: function(scaleFactor) {
        for (var fontDefinition in this._letterDefinitions) {
            this._letterDefinitions[fontDefinition]._width *= scaleFactor;
            this._letterDefinitions[fontDefinition]._height *= scaleFactor;
            this._letterDefinitions[fontDefinition]._offsetX *= scaleFactor;
            this._letterDefinitions[fontDefinition]._offsetY *= scaleFactor;
            this._letterDefinitions[fontDefinition]._xAdvance *= scaleFactor;
        }
    },

    getLetterDefinitionForChar: function(char){
        var hasKey = this._letterDefinitions.hasOwnProperty(char.charCodeAt(0));
        var letterDefinition;
        if(hasKey){
            letterDefinition = this._letterDefinitions[char.charCodeAt(0)];
        }else{
            letterDefinition = null;
        }
        return letterDefinition;
    }
};

cc.LetterInfo = function(){
    this._char = "";
    this._valid = true;
    this._positionX = 0;
    this._positionY = 0;
    this._atlasIndex = 0;
    this._lineIndex = 0;
};

cc.Label = cc.Node.extend({
    __CHINESE_REG: /^[\u4E00-\u9FFF\u3400-\u4DFF]+$/,
    __JAPANESE_REG: /[\u3000-\u303F]|[\u3040-\u309F]|[\u30A0-\u30FF]|[\uFF00-\uFFEF]|[\u4E00-\u9FAF]|[\u2605-\u2606]|[\u2190-\u2195]|\u203B/g,
    __KOREAN_REG: /^[\u1100-\u11FF]|[\u3130-\u318F]|[\uA960-\uA97F]|[\uAC00-\uD7AF]|[\uD7B0-\uD7FF]+$/,
    _hAlign: cc.TextAlignment.LEFT, //0 left, 1 center, 2 right
    _vAlign: cc.VerticalTextAlignment.TOP, //0 bottom,1 center, 2 top
    _string: "",
    _fontSize: 20,
    _initFontSizeFromFile: true,
    _overFlow: 0, //0 clamp, 1 shrink 2, resize to content
    _isWrapText: true,
    _numberOfLines: 0,
    _spacingX: 0,
    _lettersInfo: [],
    //add variables for layout
    _linesWidth: [],
    _linesOffsetX: [],
    _textDesiredHeight: 0,
    _letterOffsetY: 0,
    _tailoredTopY: 0,
    _tailoredBottomY: 0,
    _originalFontSize: 0,

    _blendFunc: null,
    _labelSkinDirty: true,
    _labelType: 0, //0 is ttf, 1 is bmfont.
    _fontHandle: "", //a ttf font name or a bmfont file path.
    //add variables for bmfont
    _opacityModifyRGB: false,
    _config: null,
    _fontAtlas: null,
    _bmfontScale: 1.0,

    // max width until a line break is added
    _lineHeight: 0,
    _lineSpacing: 0,
    _additionalKerning: 0,
    _horizontalKernings: [],
    _maxLineWidth: 0,
    _labelDimensions: cc.size(0, 0),
    _labelWidth: 0,
    _labelHeight: 0,
    _lineBreakWithoutSpaces: false,
    _imageOffset: null,

    _reusedLetter: null,
    _reusedRect: cc.rect(0,0,0,0),

    _textureLoaded: false,
    _className: "Label",
    _spriteBatchNode: null,

    //fontHandle it is a font name or bmfont file.
    ctor: function(string, fontHandle, type) {
        fontHandle = fontHandle || "";
        this._fontHandle = fontHandle;
        type = type || 0;
        this._labelType = type;
        string = string || "";
        this._string = string;

        cc.Node.prototype.ctor.call(this);
        this.setAnchorPoint(cc.p(0.5, 0.5));
        this.setContentSize(cc.size(128, 128));
        this._blendFunc = cc.BlendFunc._alphaNonPremultiplied();

        //init bmfont
        if (type === 1) {
            this._initBMFontWithString(this._string, this._fontHandle);
        }else{
            this.setFontFileOrFamily(fontHandle);
            this.setString(this._string);
        }
    },
    setFile: function(filename){
        if(filename){
            this._fontHandle = filename;
            var self = this;
            if(this._labelType === 1){
                //try to release the previous resource
                if(this._config && this._spriteBatchNode && this._fontAtlas){
                    this._resetBMFont();
                }

                var texture;
                cc.loader.load(this._fontHandle, function(err, results){
                    if(err){
                        cc.log("cc.Label._initBMFontWithString(): Impossible to create font. Please check file");
                    }

                    self._config = results[0];
                    self.createFontChars();
                    texture = cc.textureCache.addImage(self._config.atlasName);
                    var locIsLoaded = texture.isLoaded();
                    self._textureLoaded = locIsLoaded;
                    if (!locIsLoaded) {
                        texture.once("load", function(event) {
                            var self = this;

                            if (!self._spriteBatchNode) {
                                self._createSpriteBatchNode(texture);
                            }
                            self._textureLoaded = true;
                            self.emit("load");
                        }, self);
                    } else {
                        self._createSpriteBatchNode(texture);
                    }
                });
            }
            else{
                this.setFontFileOrFamily(filename);
            }
        }
    },
    _resetBMFont: function(){
        this._fontAtlas = [];
        this._config = [];
        if(this._spriteBatchNode){
            this.removeChild(this._spriteBatchNode);
            this._spriteBatchNode = null;
        }
    },
    //FIXME: toggle not working
    setLabelType: function(type){
        if(this._labelType === type) return;
        this._labelType = type;
        if(type === 0){
            this._spriteBatchNode.getTextureAtlas().removeAllQuads();
        }
        this._createRenderCmd();
        this._notifyLabelSkinDirty();
    },
    _initBMFontWithString: function(str, fntFile) {
        var self = this;
        if (self._config) {
            cc.log("cc.Label._initBMFontWithString(): re-init is no longer supported");
            return false;
        }
        this._imageOffset = cc.p(0, 0);
        this._cascadeColorEnabled = true;
        this._cascadeOpacityEnabled = true;
        this.setFile(fntFile);

    },
    _createSpriteBatchNode: function(texture){
        this._spriteBatchNode = new cc.SpriteBatchNode(texture, this._string.length);
        this._spriteBatchNode.setCascadeColorEnabled(true);
        this._spriteBatchNode.setCascadeOpacityEnabled(true);
        this.addChild(this._spriteBatchNode);

        this._updateContent();
        this.setColor(this.color);
    },

    setHorizontalAlign: function(align) {
        if (this._hAlign === align) return;
        this._hAlign = align;
        this._notifyLabelSkinDirty();
    },

    getHorizontalAlign: function() {
        return this._hAlign;
    },

    setVerticalAlign: function(align) {
        if (this._vAlign === align) return;
        this._vAlign = align;
        this._notifyLabelSkinDirty();
    },

    getVerticalAlign: function() {
        return this._vAlign;
    },

    setString: function(string) {
        if (this._string === string) return;
        this._string = string;
        this._notifyLabelSkinDirty();
    },

    //this method is used as createFontAtlas
    createFontChars: function() {
        if (!this._config) {
            return;
        }

        this._fontAtlas = new cc.FontAtlas(this._config);

        this._lineHeight = this._fontAtlas._lineHeight;
        if(this._initFontSizeFromFile){
            this.setFontSize(this._fontAtlas._fontSize);
        }

        var locCfg = this._config;
        var locFontDict = locCfg.fontDefDictionary;

        for (var fontDef in locFontDict) {
            var letterDefinition = new cc.FontLetterDefinition();

            var tempRect = locFontDict[fontDef].rect;
            cc.rectPointsToPixels(tempRect);


            letterDefinition._offsetX = locFontDict[fontDef].xOffset;
            letterDefinition._offsetY = locFontDict[fontDef].yOffset;
            letterDefinition._width = tempRect.width;
            letterDefinition._height = tempRect.height;
            letterDefinition._u = tempRect.x + this._imageOffset.x;
            letterDefinition._v = tempRect.y + this._imageOffset.y;
            //FIXME: only one texture supported for now
            letterDefinition._textureID = 0;
            letterDefinition._validDefinition = true;
            letterDefinition._xAdvance = locFontDict[fontDef].xAdvance;

            this._fontAtlas.addLetterDefinitions(fontDef, letterDefinition);
        }
    },
    _computeHorizontalKerningForText: function(text){
        var stringLen = this.getStringLength();
        var locKerningDict = this._config.kerningDict;

        var prev = -1;
        for(var i = 0; i < stringLen; ++i){
            var key = this._string.charCodeAt(i);
            var kerningAmount = locKerningDict[(prev << 16) | (key & 0xffff)] || 0;
            if(i < stringLen - 1){
                this._horizontalKernings[i] = kerningAmount;
            }else{
                this._horizontalKernings[i] = 0;
            }
            prev = key;
        }
    },

    getString: function() {
        return this._string;
    },
    getStringLength: function(){
        return this._string.length;
    },

    enableWrapText: function(enabled) {
        if (this._isWrapText === enabled) return;
        //when label is in resize mode, wrap is disabled.
        if(this._overFlow === 2){
            return;
        }
        this._isWrapText = enabled;
        this._rescaleWithOriginalFontSize();
        this._notifyLabelSkinDirty();
    },
    _rescaleWithOriginalFontSize: function(){
        var renderingFontSize = this._getRenderingFontSize();
        if (this._originalFontSize - renderingFontSize >= 1) {
            this._scaleFontSizeDown(this._originalFontSize);
        }
    },

    isWrapTextEnabled: function() {
        return this._isWrapText;
    },

    setFontSize: function(fntSize) {
        this._fontSize = fntSize;
        this._originalFontSize = fntSize;
        this._initFontSizeFromFile = false;
        this._notifyLabelSkinDirty();
    },

    getFontSize: function() {
        return this._fontSize;
    },

    setOverflow: function(overflow) {
        if (this._overFlow === overflow) return;
        this._overFlow = overflow;
        if(this._overFlow === 2){
            this.setDimensions(this._labelDimensions.width, 0);
            this.enableWrapText(true);
        }
        this._rescaleWithOriginalFontSize();
        this._notifyLabelSkinDirty();
    },

    getOverflow: function() {
        return this._overFlow;
    },

    setSpacingX: function(spacing) {
        if (this._spacingX === spacing) return;
        this._spacingX = spacing;
        if(this._labelIsTTF === false)
            this._notifyLabelSkinDirty();
    },

    setLineHeight: function(lineHeight) {
        if (this._lineHeight === lineHeight) return;
        this._lineHeight = lineHeight;
        this._labelSkinDirty = true;
    },
    setLineBreakWithoutSpace: function(lineBreakFlag){
        if(this._lineBreakWithoutSpaces === lineBreakFlag) return;

        this._lineBreakWithoutSpaces = lineBreakFlag;
        this._notifyLabelSkinDirty();
    },
    getSpacingX: function() {
        return this._spacingX;
    },

    getLineHeight: function() {
        return this._lineHeight;
    },

    setFontFileOrFamily: function( fontHandle ) {
        fontHandle = fontHandle || "Arial";
        var extName = cc.path.extname(fontHandle);

        //specify font family name directly
        if( extName === null) {
            this._fontHandle = fontHandle;
            this._labelIsTTF = true;
            this._notifyLabelSkinDirty();
            return;
        }
        //add resource path
        fontHandle = cc.path.join(cc.loader.resPath, fontHandle);

        if(extName === ".ttf") {
            this._labelIsTTF = true;
            this._fontHandle = this._loadTTFFont(fontHandle);
        }
        else {
            //todo add bmfont here
            this._fontHandle = fontHandle;
            this._labelIsTTF = false;
            this._notifyLabelSkinDirty();
        }
    },

    _loadTTFFont : function(fontHandle){
        var ttfIndex = fontHandle.lastIndexOf(".ttf");
        if(ttfIndex === -1) return fontHandle;
        var slashPos = fontHandle.lastIndexOf("/");
        var fontFamilyName;
        if(slashPos === -1) fontFamilyName = fontHandle.substring(0,ttfIndex ) + "_LABEL";
        else fontFamilyName = fontHandle.substring(slashPos + 1, ttfIndex) + "_LABEL";
        var self = this;
        if(FontFace) {
            var fontFace = new FontFace(fontFamilyName, "url('" + fontHandle + "')");
            fontFace.load().then( function (loadedFace) {
                document.fonts.add(loadedFace);
                self._notifyLabelSkinDirty();
            });
        } else {
            //fall back implementations
            var doc = document, fontStyle = document.createElement("style");
            fontStyle.type = "text/css";
            doc.body.appendChild(fontStyle);

            var fontStr = "";
            if(isNaN(fontFamilyName - 0))
                fontStr += "@font-face { font-family:" + fontFamilyName + "; src:";
            else
                fontStr += "@font-face { font-family:'" + fontFamilyName + "'; src:";

            fontStr += "url('" + fontHandle + "');";

            fontStyle.textContent = fontStr + "}";

            //<div style="font-family: PressStart;">.</div>
            var preloadDiv = document.createElement("div");
            var _divStyle =  preloadDiv.style;
            _divStyle.fontFamily = name;
            preloadDiv.innerHTML = ".";
            _divStyle.position = "absolute";
            _divStyle.left = "-100px";
            _divStyle.top = "-100px";
            doc.body.appendChild(preloadDiv);
            self.scheduleOnce(self._notifyLabelSkinDirty,2);
        }

        return fontFamilyName;
    },

    setContentSize: function(size, height) {
        var oldWidth = this._contentSize.width;
        var oldHeight = this._contentSize.height;
        if(this._labelType === 0){
            cc.Node.prototype.setContentSize.call(this, size,height);
            if (oldWidth === this._contentSize.width && oldHeight === this._contentSize.height) {
                return;
            }
            this._notifyLabelSkinDirty();
        }else if (this._labelType === 1){
            if(!height){
                if(oldWidth === size.width && oldHeight === size.height) return;
                this.setDimensions(size.width, size.height);
            }else{
                if(oldWidth === size && oldHeight === height) return;
                this.setDimensions(size, height);
            }
        }
    },

    setBlendFunc: function (src, dst) {
        var locBlendFunc = this._blendFunc;
        if (dst === undefined) {
            locBlendFunc.src = src.src;
            locBlendFunc.dst = src.dst;
        } else {
            locBlendFunc.src = src;
            locBlendFunc.dst = dst;
        }
    },


    getBlendFunc: function() {
        return new cc.BlendFunc(this._blendFunc.src, this._blendFunc.dst);
    },

    _notifyLabelSkinDirty: function() {
        this._labelSkinDirty = true;

        if(this._renderCmd)
            this._renderCmd.setDirtyFlag(cc.Node._dirtyFlags.textDirty);

        if(this._labelType === 1){
            if(CC_EDITOR){
                this._updateContent();
                this.setColor(this.color);
                this._labelSkinDirty = false;
            }
        }
    },
    _createRenderCmd: function() {
        if (this._labelType === 0) {
            if (cc._renderType === cc.game.RENDER_TYPE_WEBGL)
                return new cc.Label.TTFWebGLRenderCmd(this);
            else
                return new cc.Label.TTFCanvasRenderCmd(this);
        } else if (this._labelType === 1) {
            if (cc._renderType === cc.game.RENDER_TYPE_WEBGL) {
                return new cc.Label.BMFontWebGLRenderCmd(this);
            }else{
                return new cc.Label.BMFontCanvasRenderCmd(this);
            }

        }
    },

    _computeAlignmentOffset: function() {
        this._linesOffsetX = [];
        switch (this._hAlign) {
            case cc.TextAlignment.LEFT:
                for (var i = 0; i < this._numberOfLines; ++i) {
                    this._linesOffsetX.push(0);
                }
                break;
            case cc.TextAlignment.CENTER:
                this._linesWidth.forEach(function(lineWidth) {
                    this._linesOffsetX.push((this._contentSize.width - lineWidth) / 2);
                }.bind(this));
                break;
            case cc.TextAlignment.RIGHT:
                this._linesWidth.forEach(function(lineWidth) {
                    this._linesOffsetX.push(this._contentSize.width - lineWidth);
                }.bind(this));
                break;
            default:
                break;
        }

        switch (this._vAlign) {
            case cc.VerticalTextAlignment.TOP:
                this._letterOffsetY = this._contentSize.height;
                break;
            case cc.VerticalTextAlignment.CENTER:
                this._letterOffsetY = (this._contentSize.height + this._textDesiredHeight) / 2;
                break;
            case cc.VerticalTextAlignment.BOTTOM:
                this._letterOffsetY = this._textDesiredHeight;
                break;
            default:
                break;
        }
    },
    _getFirstCharLen: function(text, startIndex, textLen){
        return 1;
    },

    _isCJK_unicode: function(ch){
        return this.__CHINESE_REG.test(ch) || this.__JAPANESE_REG.test(ch) || this.__KOREAN_REG.test(ch);
    },
    //Checking whether the character is a whitespace
    _isspace_unicode: function(ch){
        ch = ch.charCodeAt(0);
        return  ((ch >= 9 && ch <= 13) || ch === 32 || ch === 133 || ch === 160 || ch === 5760
                 || (ch >= 8192 && ch <= 8202) || ch === 8232 || ch === 8233 || ch === 8239
                 || ch === 8287 || ch === 12288);
    },
    _getFirstWordLen: function(text, startIndex, textLen){
        var character = text.charAt(startIndex);
        if(this._isCJK_unicode(character) || character === "\n" || this._isspace_unicode(character)){
            return 1;
        }

        var len = 1;
        for(var index = startIndex + 1; index < textLen; ++index){
            character = text.charAt(index);
            if(character === "\n" || this._isspace_unicode(character) || this._isCJK_unicode(character)){
                break;
            }
            len++;
        }

        return len;
    },
    _updateBMFontScale: function(){
        var originalFontSize = this._fontAtlas._fontSize;
        if(this._labelType === 1){
            this._bmfontScale = this._fontSize * cc.contentScaleFactor() / originalFontSize;
        }else{
            this._bmfontScale = 1;
        }

    },
    getContentSize: function(foreceUpdate){
        if(foreceUpdate){
            if(this._labelType === 1 && this._labelSkinDirty){
                this._updateContent();
            }
            return this._contentSize;
        }else{
            return cc.Node.prototype.getContentSize.call(this);
        }
    },

    _multilineTextWrap: function(nextTokenFunc){
        var textLen = this.getStringLength();
        var lineIndex = 0;
        var nextTokenX = 0;
        var nextTokenY = 0;
        var longestLine = 0;
        var letterRight = 0;

        var contentScaleFactor = cc.contentScaleFactor();
        var lineSpacing = this._lineSpacing * contentScaleFactor;
        var highestY = 0;
        var lowestY = 0;
        var letterDef = null;
        var letterPosition = cc.p(0,0);

        this._updateBMFontScale();

        for(var index = 0; index < textLen;){
            var character = this._string.charAt(index);
            if(character === "\n"){
                this._linesWidth.push(letterRight);
                letterRight = 0;
                lineIndex++;
                nextTokenX = 0;
                nextTokenY -= this._lineHeight * this._bmfontScale + lineSpacing;
                this._recordPlaceholderInfo(index, character);
                index++;
                break;
            }

            var tokenLen = nextTokenFunc(this._string, index, textLen);
            var tokenHighestY = highestY;
            var tokenLowestY = lowestY;
            var tokenRight = letterRight;
            var nextLetterX = nextTokenX;
            var newLine = false;

            for(var tmp = 0; tmp < tokenLen; ++tmp){
                var letterIndex = index + tmp;
                character = this._string.charAt(letterIndex);
                if(character === "\r"){
                    this._recordPlaceholderInfo(letterIndex, character);
                    continue;
                }
                letterDef = this._fontAtlas.getLetterDefinitionForChar(character);
                if(!letterDef){
                    this._recordPlaceholderInfo(letterIndex, character);
                    console.log("Can't find letter definition in font file for letter:" + character);
                    continue;
                }

                var letterX = (nextLetterX + letterDef._offsetX * this._bmfontScale) / contentScaleFactor;
                if(this._isWrapText && this._maxLineWidth > 0 && nextTokenX > 0 && letterX + letterDef._width * this._bmfontScale > this._maxLineWidth){
                    this._linesWidth.push(letterRight);
                    letterRight = 0;
                    lineIndex++;
                    nextTokenX = 0;
                    nextTokenY -= (this._lineHeight * this._bmfontScale + lineSpacing);
                    newLine = true;
                    break;
                }else{
                    letterPosition.x = letterX;
                }

                letterPosition.y = (nextTokenY - letterDef._offsetY * this._bmfontScale) / contentScaleFactor;
                this._recordLetterInfo(letterPosition, character, letterIndex, lineIndex);

                if(letterIndex + 1 < this._horizontalKernings.length && letterIndex < textLen - 1){
                    nextLetterX += this._horizontalKernings[letterIndex + 1];
                }

                nextLetterX += letterDef._xAdvance * this._bmfontScale + this._additionalKerning;

                tokenRight = letterPosition.x + letterDef._width * this._bmfontScale;

                if(tokenHighestY < letterPosition.y){
                    tokenHighestY = letterPosition.y;
                }

                if(tokenLowestY > letterPosition.y - letterDef._height * this._bmfontScale){
                    tokenLowestY = letterPosition.y - letterDef._height * this._bmfontScale;
                }

            } //end of for loop

            if(newLine) continue;

            nextTokenX = nextLetterX;
            letterRight = tokenRight;

            if(highestY < tokenHighestY){
                highestY = tokenHighestY;
            }
            if(lowestY > tokenLowestY){
                lowestY = tokenLowestY;
            }
            if(longestLine < letterRight){
                longestLine = letterRight;
            }

            index += tokenLen;
        } //end of for loop

        this._linesWidth.push(letterRight);

        this._numberOfLines = lineIndex + 1;
        this._textDesiredHeight = (this._numberOfLines * this._lineHeight * this._bmfontScale) / contentScaleFactor;
        if(this._numberOfLines > 1){
            this._textDesiredHeight += (this._numberOfLines - 1) * this._lineSpacing;
        }

        var contentSize = cc.size(this._labelWidth, this._labelHeight);
        if(this._labelWidth <= 0){
            contentSize.width = longestLine;
        }
        if(this._labelHeight <= 0){
            contentSize.height = this._textDesiredHeight;
        }
        cc.Node.prototype.setContentSize.call(this, contentSize);

        this._tailoredTopY = contentSize.height;
        this._tailoredBottomY = 0;
        if(highestY > 0){
            this._tailoredTopY = contentSize.height + highestY;
        }
        if(lowestY < -this._textDesiredHeight){
            this._tailoredBottomY = this._textDesiredHeight + lowestY;
        }

        return true;
    },
    multilineTextWrapByWord: function(){
        return this._multilineTextWrap(this._getFirstWordLen.bind(this));
    },
    multilineTextWrapByChar: function(){
        return this._multilineTextWrap(this._getFirstCharLen.bind(this));
    },
    isVerticalClamp: function(){
        if(this._textDesiredHeight > this._contentSize.height){
            return true;
        }else{
            return false;
        }
    },
    isHorizontalClamp: function(){
        var letterClamp = false;

        for(var ctr = 0; ctr < this.getStringLength(); ++ctr){
            if(this._lettersInfo[ctr]._valid){
                var letterDef = this._fontAtlas._letterDefinitions[this._lettersInfo[ctr]._char];

                var px = this._lettersInfo[ctr]._positionX + letterDef._width / 2 * this._bmfontScale;
                if(this._labelWidth > 0){
                    if(px > this._contentSize.width){
                        letterClamp = true;
                        break;
                    }
                }
            }
        }

        return letterClamp;
    },

    _shrinkLabelToContentSize: function(lambda){
        var fontSize = this._getRenderingFontSize();

        var i = 0;
        var tempLetterDefinition = this._fontAtlas.cloneLetterDefinition();
        var originalLineHeight = this._lineHeight;
        var flag = true;

        while(lambda()){
            ++i;

            var newFontSize = fontSize - i;
            flag = false;
            if(newFontSize <= 0){
                break;
            }

            var scale = newFontSize / fontSize;
            this._fontAtlas.assignLetterDefinitions(tempLetterDefinition);
            this._fontAtlas.scaleFontLetterDefinition(scale);
            this.setLineHeight(originalLineHeight * scale);
            if(this._maxLineWidth > 0 && !this._lineBreakWithoutSpaces){
                this.multilineTextWrapByWord();
            }else{
                this.multilineTextWrapByChar();
            }
            this._computeAlignmentOffset();
        }

        this.setLineHeight(originalLineHeight);
        this._fontAtlas.assignLetterDefinitions(tempLetterDefinition);

        if(!flag){
            if(fontSize -i >= 0){
                this._scaleFontSizeDown(fontSize - i);
            }
        }
    },

    _getRenderingFontSize: function(){
        return this._fontSize;
    },
    _scaleFontSizeDown: function(fontSize){
        var shouldUpdateContent = true;
        //1 is BMFont
        if(this._labelType === 1){
            if(!fontSize){
                fontSize = 0.1;
                shouldUpdateContent = false;
            }
            this._fontSize = fontSize;
        }
        if(shouldUpdateContent){
            this._updateContent();
        }
    },
    _updateContent: function(){
        var updateFinished = true;

        if(this._fontAtlas){
            this._computeHorizontalKerningForText(this._string);
            updateFinished = this.alignText();
        }
        if(updateFinished){
            this._labelSkinDirty = false;
        }
    },
    alignText: function(){
        var ret = true;

        do{
            if(!this._spriteBatchNode) return true;


            this._textDesiredHeight = 0;
            this._linesWidth = [];
            if(this._maxLineWidth > 0 && !this._lineBreakWithoutSpaces){
                this.multilineTextWrapByWord();
            }else{
                this.multilineTextWrapByChar();
            }

            this._computeAlignmentOffset();

            //shrink
            if(this._overFlow === 1){
                var fontSize = this._getRenderingFontSize();

                if(fontSize > 0 && this.isVerticalClamp()){
                    this._shrinkLabelToContentSize(this.isVerticalClamp.bind(this));
                }
            }

            if(!this._updateQuad()){
                ret = false;
                if(!this._isWrapText && this._overFlow === 1){
                    this._shrinkLabelToContentSize(this.isHorizontalClamp.bind(this));
                }
                break;
            }
        }while(0);

        return ret;
    },
    _updateQuad: function(){
        var ret = true;

        this._spriteBatchNode.removeAllChildren();


        var letterClamp = false;
        for(var ctr = 0; ctr < this._string.length; ++ctr){
            if(this._lettersInfo[ctr]._valid){
                var letterDef = this._fontAtlas._letterDefinitions[this._lettersInfo[ctr]._char];

                this._reusedRect.height = letterDef._height;
                this._reusedRect.width = letterDef._width;
                this._reusedRect.x = letterDef._u;
                this._reusedRect.y = letterDef._v;

                var py = this._lettersInfo[ctr]._positionY + this._letterOffsetY;

                if(this._labelHeight > 0){
                    if(py > this._tailoredTopY){
                        var clipTop = py - this._tailoredTopY;
                        this._reusedRect.y += clipTop;
                        this._reusedRect.height -= clipTop;
                        py = py - clipTop;
                    }

                    if(py - letterDef._height * this._bmfontScale < this._tailoredBottomY){
                        this._reusedRect.height = (py < this._tailoredBottomY) ? 0 : (py - this._tailoredBottomY);
                    }
                }

                if(!this._isWrapText){
                    var px = this._lettersInfo[ctr]._positionX + letterDef._width / 2 * this._bmfontScale + this._linesOffsetX[this._lettersInfo[ctr]._lineIndex];

                    if(this._labelWidth > 0){
                        if(px > this._contentSize.width || px < 0){
                            //0 is Clamp, 1 is shrink, 2 is resize
                            if(this._overFlow === 0){
                                this._reusedRect.width = 0;
                            }else if(this._overFlow === 1){
                                if(letterDef._width > 0 && this._contentSize.width > letterDef._width){
                                    letterClamp = true;
                                    ret = false;
                                    break;
                                }else{
                                    //clamp
                                    this._reusedRect.width = 0;
                                }
                            }
                        }
                    }
                }

                if(this._reusedRect.height > 0 && this._reusedRect.width > 0){
                    var fontChar = this.getChildByTag(ctr);
                    var locTexture = this._spriteBatchNode._renderCmd._texture || this._spriteBatchNode.textureAtlas.texture;

                    if(!fontChar){
                        fontChar = new cc.Sprite();
                        fontChar.initWithTexture(locTexture);
                        fontChar.setAnchorPoint(cc.p(0,1));
                    }
                    this._reusedLetter = fontChar;

                    this._reusedLetter.setTextureRect(this._reusedRect, false, this._reusedRect.size);

                    var letterPositionX = this._lettersInfo[ctr]._positionX + this._linesOffsetX[this._lettersInfo[ctr]._lineIndex];
                    this._reusedLetter.setPosition(letterPositionX, py);

                    var index = this._spriteBatchNode.getChildren().length;

                    this._lettersInfo[ctr]._atlasIndex = index;

                    this._updateLetterSpriteScale(this._reusedLetter);

                    // this._spriteBatchNode.insertQuadFromSprite(this._reusedLetter, index);
                    this._spriteBatchNode.addChild(this._reusedLetter);

                }
            }
        }

        return ret;
    },
    _updateLetterSpriteScale: function(sprite){
        if(this._labelType === 1 && this._fontSize > 0){
            sprite.setScale(this._bmfontScale);
        }
    },

    _recordPlaceholderInfo: function(letterIndex, char){
        if(letterIndex >= this._lettersInfo.length){
            var tmpInfo = new cc.LetterInfo();
            this._lettersInfo.push(tmpInfo);
        }

        this._lettersInfo[letterIndex]._char = char;
        this._lettersInfo[letterIndex]._valid = false;
    },

    _recordLetterInfo: function(letterPosition, character, letterIndex, lineIndex){
        if(letterIndex >= this._lettersInfo.length){
            var tmpInfo = new cc.LetterInfo();
            this._lettersInfo.push(tmpInfo);
        }
        character = character.charCodeAt(0);

        this._lettersInfo[letterIndex]._lineIndex = lineIndex;
        this._lettersInfo[letterIndex]._char = character;
        this._lettersInfo[letterIndex]._valid = this._fontAtlas._letterDefinitions[character]._validDefinition;
        this._lettersInfo[letterIndex]._positionX = letterPosition.x;
        this._lettersInfo[letterIndex]._positionY = letterPosition.y;
    },
    setDimensions: function(width, height){
        if(this._overFlow === 2){
            height = 0;
        }
        if(height !== this._labelHeight || width !== this._labelWidth){
            this._labelWidth = width;
            this._labelHeight = height;
            this._labelDimensions.width = width;
            this._labelDimensions.height = height;

            this._maxLineWidth = width;
            if(this._overFlow === 1){
                if(this._originalFontSize > 0){
                    this._restoreFontSize();
                }
            }
            this._notifyLabelSkinDirty();
        }
    },
    _restoreFontSize: function(){
        if(this._labelType === 1){
            this._fontSize = this._originalFontSize;
        }
    }
});

var _p = cc.Label.prototype;
EventTarget.polyfill(_p);

cc.Label.Type = cc.Enum({
    TTF: 0,
    BMFont: 1
});
cc.Label.Overflow = cc.Enum({
    CLAMP: 0,
    SHRINK: 1,
    RESIZE: 2
});
