/**
* DD_roundies, this adds rounded-corner CSS in standard browsers and VML sublayers in IE that accomplish a similar appearance when comparing said browsers.
* Author: Drew Diller
* Email: drew.diller@gmail.com
* URL: http://www.dillerdesign.com/experiment/DD_roundies/
* Version: 0.0.1a
* Licensed under the MIT License: http://dillerdesign.com/experiment/DD_roundies/#license
*
* Usage:
* DD:roundtangle.addRule('#doc .container', 5); // selector and radius
* DD:roundtangle.addRule('.box', 5, true); // selector, radius, and optional addition of border-radius code for standard browsers.
**/

var DD_roundies = {
	ns: 'DD_roundies',
	createVmlNameSpace: function() { /* enable VML */
		if (document.namespaces && !document.namespaces[this.ns]) {
		  document.namespaces.add(this.ns, 'urn:schemas-microsoft-com:vml');
		}
	},
	createVmlStyleSheet: function() { /* style VML, enable behaviors */
		/*
			Just in case lots of other developers have added
			lots of other stylesheets using document.createStyleSheet
			and hit the 31-limit mark, let's not use that method!
			further reading: http://msdn.microsoft.com/en-us/library/ms531194(VS.85).aspx
		*/
		var style = document.createElement('style');
		document.documentElement.firstChild.insertBefore(style, document.documentElement.firstChild.firstChild);
		if (style.styleSheet) { /* IE */
			var styleSheet = style.styleSheet;
			styleSheet.addRule(this.ns + '\\:*', '{behavior:url(#default#VML)}');
			styleSheet.addRule(this.ns + '\\:shape', 'position:absolute; left:0px; top:0px;  z-index:-1;');
			this.styleSheet = styleSheet;
		}
		else {
			this.styleSheet = style;
		}
	},
	
	/**
	* This is the method to use in a document.
	* @param {String} selector - REQUIRED - a CSS selector, such as '#doc .container'
	* @param {Integer} radius - REQUIRED - the desired radius for the box corners
	* @param {Boolean} standards - OPTIONAL - true if you also wish to output -moz-border-radius/-webkit-border-radius/border-radius declarations
	**/
	addRule: function(selector, radius, standards) {
		if (this.styleSheet.addRule) { /* IE */
			this.styleSheet.addRule(selector, 'behavior:expression(DD_roundies.roundifyElement.call(this, ' + radius + '))'); /* seems to execute the function without adding it to the stylesheet - interesting... */
		}
		else {
			this.styleSheet.appendChild(document.createTextNode(selector + ' {border-radius:' + radius + 'px; -moz-border-radius:' + radius + 'px; -webkit-border-radius:' + radius + 'px;}'));
		}
	},
	
	roundifyElement: function(rad) {
		this.style.behavior = 'none';
		this.style.zoom = 1;
		if (this.currentStyle.position == 'static') {
			this.style.position = 'relative';
		}
		this.vml = document.createElement(DD_roundies.ns + ':shape');
		
		/* methods */
		var self = this;
		this.interceptPropertyChanges = function() {
			switch (event.propertyName) {
				case 'style.border':
				case 'style.borderWidth':
				case 'style.padding':
					self.applyVML.call(self);
					break;
				case 'style.borderColor':
					self.updateVmlStrokeColor.call(self);
					break;
				case 'style.backgroundColor':
					self.updateVmlFill.call(self);
			};
		};
		this.applyVML = function() {
			this.runtimeStyle.cssText = '';
			this.updateVmlFill();
			this.updateVmlStrokeWeight();
			this.updateVmlStrokeColor();
			this.updateVmlDimensions();
			this.updateVmlPath();
			this.hideSourceBorder();
		};
		this.hideSourceBorder = function() {
			this.runtimeStyle.border = 'none';
			var sides = ['Top', 'Left', 'Right', 'Bottom'];
			for (var i=0; i<4; i++) {
				this.runtimeStyle['padding' + sides[i]] = parseInt(this.currentStyle['padding' + sides[i]]) + parseInt(this.realBorderWidth) + 'px';
			}
		};
		this.updateVmlStrokeWeight = function() {
			this.realBorderWidth = parseInt(this.currentStyle.borderWidth, 10);
			if (this.realBorderWidth.toString() == 'NaN') {
				this.realBorderWidth = 0;
			}
			this.halfRealBorderWidth = Math.floor(this.realBorderWidth/2);
			this.vml.strokeweight = this.realBorderWidth + 'px';
			this.vml.stroked = !(this.realBorderWidth === 0);
		};
		this.updateVmlStrokeColor = function() {
			this.vml.strokecolor = this.currentStyle.borderColor;
		};
		this.updateVmlFill = function() {
			this.runtimeStyle.backgroundColor = '';
			if (this.currentStyle && (this.currentStyle.backgroundImage != 'none' || (this.currentStyle.backgroundColor && this.currentStyle.backgroundColor != 'transparent'))) {
				this.vml.filled = true;
				if (!this.vml.filler) {
					this.vml.filler = document.createElement(DD_roundies.ns + ':fill');
					this.vml.appendChild(this.vml.filler);
				}
				if (this.currentStyle.backgroundImage) {
					var bg = this.currentStyle.backgroundImage;
					this.vml.filler.src = bg.substr(5, bg.lastIndexOf('")')-5);
					this.vml.filler.type = 'tile';
				}
				if (this.currentStyle.backgroundColor) {
					this.vml.filler.color = this.currentStyle.backgroundColor;
				}
				this.runtimeStyle.background = 'none';
			}
			else {
				this.vml.filled = false;
			}
		};
		this.updateVmlDimensions = function() {
			if (!this.dim) {
				this.dim = {};
			}
			this.dim.w = this.offsetWidth;
			this.dim.h = this.offsetHeight;
			this.vml.style.width = this.dim.w;
			this.vml.style.height = this.dim.h;
			this.vml.coordorigin = -this.halfRealBorderWidth + ' ' + -this.halfRealBorderWidth;
			this.vml.coordsize = (this.dim.w+this.realBorderWidth) + ' '+ (this.dim.h+this.realBorderWidth);
		};
		this.updateVmlPath = function() {
			this.vml.path = 'm0,'+rad+'qy'+rad+',0l'+(this.dim.w-rad)+',0qx'+this.dim.w+','+rad+'l'+this.dim.w+','+(this.dim.h-rad)+'qy'+(this.dim.w-rad)+','+this.dim.h+'l'+rad+','+this.dim.h+'qx0,'+(this.dim.h-rad)+'xe';
		};
		this.handlePseudoHover = function() {
			setTimeout(function() { /* wouldn't work as intended without setTimeout */
				self.runtimeStyle.backgroundColor = '';
				self.updateVmlFill.call(self);
				self.updateVmlStrokeColor.call(self);
			}, 1);
		};
		
		/* set up element */
		this.insertBefore(this.vml, this.firstChild);
		this.applyVML();
		
		/* add change handlers */
		if (this.nodeName == 'A') {
			this.attachEvent('onmouseleave', this.handlePseudoHover);
			this.attachEvent('onmouseenter', this.handlePseudoHover);
		}
		this.attachEvent('onpropertychange', this.interceptPropertyChanges);
		this.attachEvent('onresize', function() {
			self.updateVmlDimensions.call(self);
			self.updateVmlPath.call(self);
		});
	}
};
DD_roundies.createVmlNameSpace();
DD_roundies.createVmlStyleSheet();