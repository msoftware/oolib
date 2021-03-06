/*
 * oolib.js 1.0
 * (c) 2012 Zsolt Szloboda, Idya Ltd.
 * Released under the MIT license
 */

// CommmonJS module

var arraySlice, Base;

arraySlice = Array.prototype.slice;

function Dummy() {
}

function Interface() {
}

function createClass(/* ?superClassFn, members */) {
	var superClassFn, members, proto, publicMethods, createMethod, key, m;
	superClassFn = arguments[0];
	if ((typeof superClassFn) === "function") {
		members = arguments[1];
	} else {
		members = superClassFn;
		superClassFn = undefined;
	}
	function classFn() {
		var o, iface, key;
		if (this instanceof classFn) { // called with new: construct
			o = this;
			o.iface = iface = new Interface();
			for (key in publicMethods) {
				(function() {
					var m;
					m = publicMethods[key];
					iface[key] = function() {
						return m.apply(o, arguments);
					};
				}());
			}
			if (null != createMethod) {
				createMethod.apply(o, arguments);
			}
			return iface;
		} else { // called as a function: inherit
			return createClass(classFn, arguments[0]);
		}
	}
	if (null != superClassFn) {
		Dummy.prototype = superClassFn.prototype;
		proto = new Dummy();
		proto.constructor = classFn;
		classFn.prototype = proto;
		classFn.superclass = superClassFn;
		proto._super = function(methodName /* , *arg */) {
			var args;
			args = arraySlice.call(arguments, 1);
			return superClassFn.prototype[methodName].apply(this, args);
		};
		proto._superApply = function(methodName, args) {
			return superClassFn.prototype[methodName].apply(this, args);
		};
	} else {
		proto = classFn.prototype;
	}
	if (null != members) {
		for (key in members) {
			proto[key] = members[key];
		}
	}
	publicMethods = {};
	for (key in proto) {
		if (key.charAt(0) === "_") {
			continue;
		}
		m = proto[key];
		if ((typeof m) !== "function") {
			continue;
		}
		if (key === "constructor") {
			continue;
		}
		publicMethods[key] = m;
	}
	createMethod = proto._create;
	if ((typeof createMethod) !== "function") {
		createMethod = undefined;
	}
	return classFn;
}

Base = createClass({

	// member variables: _destroyFns

	_create: function() {
		var a, c, i, proto, fn;
		this._destroyFns = [];
		a = [];
		c = this.constructor;
		while (null != c) {
			a.push(c);
			c = c.superclass;
		}
		for (i = a.length - 1; i >= 0; i--) {
			c = a[i];
			proto = c.prototype;
			if (null != proto) {
				if (proto.hasOwnProperty("_dispose")) {
					fn = proto._dispose;
					if ((typeof fn) === "function") {
						this._addDestroyFn(fn);
					}
				}
				if (proto.hasOwnProperty("_init")) {
					fn = proto._init;
					if ((typeof fn) === "function") {
						fn.apply(this, arguments);
					}
				}
			}
		}
	},

	isInstanceOf: function(classFn) {
		return (this instanceof classFn);
	},

	_addDestroyFn: function(fn) {
		this._destroyFns.push(fn);
	},

	destroy: function() {
		var i, dfns;
		dfns = this._destroyFns;
		for (i = dfns.length - 1; i >= 0; i--) {
			dfns[i].call(this);
		}
		delete this._destroyFns;
	}
});

function isInterfaceOf(o, classFn) {
	if (!(o instanceof Interface)) {
		return false;
	}
	if ((typeof o.isInstanceOf) === "function") {
		return o.isInstanceOf(classFn);
	}
}

exports.createClass = createClass;
exports.Interface = Interface;
exports.Base = Base;
exports.isInterfaceOf = isInterfaceOf;
