/*
 * ES5Class - Real classes in ECMAScript5 environment
 *
 * Copyright (c) 2011, Máté FARKAS
 * Dual licensed under the MIT and GPL licenses.
 */
var ES5Class = (function(undefined) {
    "use strict";
    var that = {};

    var createConstantProperty;
    if ( Object.defineProperty ) {
        createConstantProperty = function( obj, name, value ) {
            Object.defineProperty(obj, name, { value: value });
        };
    } else if ( {}.__defineGetter__ ) {
        createConstantProperty = function( obj, name, value ) {
            obj.__defineGetter__(name, function() { return value; });
        };
    } else {
        throw new Error('ES5Class library is not compatible with this JS engine');
    }

    var createObject;
    if ( Object.create ) {
        createObject = function( proto ) {
            return Object.create( proto, {} );
        };
    } else {
        createObject = function( proto ) {
            function F(){}
            F.prototype = proto;
            return new F();
        };
    }

    var replaceWithAccessor;
    if ( Object.getOwnPropertyDescriptor ) {
        replaceWithAccessor = function ( obj, key ) {
            if ( typeof Object.getOwnPropertyDescriptor(obj, key).get === 'function' ) {
                return;
            }
            var value = obj[key];
            Object.defineProperty(obj, key, {
                get: function() { return value; },
                set: function(val) { value = val; }
            });
        };
    } else if ( {}.__lookupGetter__ ) {
        replaceWithAccessor = function ( obj, key ) {
            if ( obj.__lookupGetter__(key) ) {
                return;
            }
            var value = obj[key];
            delete obj[key];
            obj.__defineGetter__(key, function() { return value; });
            obj.__defineSetter__(key, function(val) { value = val; });
        };
    } else {
        throw new Error('Module lib is not compatible with this JS engine');
    }

    function replacePropertiesWithGetSet(obj) {
        for ( var key in obj ) if ( obj.hasOwnProperty(key) ) {
            if ( typeof obj[key] !== 'function' ) {
                replaceWithAccessor(obj, key);
            }
        }
    }

    var copyAccessors;
    if ( Object.getOwnPropertyDescriptor ) {
        copyAccessors = function( source, target, key ) {
            var t = Object.getOwnPropertyDescriptor(source, key);
            Object.defineProperty(target, key, {
                get: t.get,
                set: t.set,
                configurable: true,
                enumerable: true
            });
        };
    } else if ( {}.__lookupGetter__ ) {
        copyAccessors = function( source, target, key ) {
            target.__defineGetter__(key, function() { return source[key];} );
            target.__defineSetter__(key, function(val) { source[key] = val; });
        };
    } else {
        throw new Error('Module lib is not compatible with this JS engine');
    }

    function copyReferences( source, target, copyProperties ) {
        for ( var k in source ) { if ( source.hasOwnProperty( k ) && k !== 'super' && k !== 'protected' && k !== 'public' && k !== '__subclasses__') {
            if ( typeof source[k] === 'function' ) {
                target[k] = source[k];
            } else if ( copyProperties ) {
                copyAccessors( source, target, k);
            }
        }}
    }

    function isAModule( obj ) {
        return typeof obj === 'object' && obj !== null && typeof obj.__privateInstance__ === 'object';
    }

    that.instanceOf = function( obj, klass ) {
        do {
            if ( obj instanceof klass ) {
                return true;
            }
            try {
                if ( '__privateInstance__' in obj ) {
                    obj = obj.__privateInstance__['super'];
                } else {
                    return false;
                }
            } catch(e) {
                return false;
            }
        } while (obj);
        return false;
    };

    that.create = function( _this, _arguments, _super ) {
        var priv, publ, prot, subclasses, isSubclass;

        if ( arguments.length == 2 && typeof _arguments !== 'undefined' && (
                typeof _arguments === 'function' ||
                isAModule( _arguments ) ||
                typeof _arguments !== 'object' ||
                typeof _arguments.length !== 'number'
        ) ) {
            _super = _arguments;
            _arguments = undefined;
        }

        if ( typeof _this !== 'object' || _this === null || _this.constructor === Object ) {
            throw new TypeError('The first argument of Module.create must be the new "this"');
        }
        for ( var k in _this ) {
            if ( _this.hasOwnProperty( k ) && k !== '__callWOconstructor__' ) {
                throw new TypeError('The first argument of Module.create must be the new "this"');
            }
        }

        if ( typeof _super === 'function' ) {
            _super = (function() {
                var S = _super;
                S.prototype.__callWOconstructor__ = true;
                var res = new S();
                delete S.prototype.__callWOconstructor__;
                return res;
            }());
        }
        if ( typeof _super === 'undefined' ) {
            isSubclass = false;
        } else if ( isAModule( _super ) ) {
            isSubclass = true;
        } else {
            throw new TypeError('The second argument of Module.create should be an instance of Module');
        }

        publ = _this;
        prot = createObject( publ );
        subclasses = createObject( prot );
        priv = createObject( subclasses );
        priv.__constructor__arguments__ = _arguments;

        if ( isSubclass ) {
            copyReferences( _super.__privateInstance__.protected, prot, true);
            copyReferences( _super.__privateInstance__.public, publ, true );
        }

        createConstantProperty(priv, 'private', priv);
        createConstantProperty(priv, 'protected', prot);
        createConstantProperty(priv, 'public', publ);
        createConstantProperty(prot, 'protected', prot);
        createConstantProperty(publ, 'public', publ);

        createConstantProperty(prot, 'super', isSubclass ? _super.__privateInstance__.protected : null);
        createConstantProperty(priv, '__subclasses__', subclasses);
        createConstantProperty(publ, '__privateInstance__', priv);

        return priv;
    };

    that.changeVisibility = function( property, newObj ) {
        var priv = newObj.__privateInstance__;
        var oldObj = null;

        if ( priv.public.hasOwnProperty( property ) ) {
            oldObj = priv.public;
        } else if ( priv.protected.hasOwnProperty( property ) ) {
            oldObj = priv.protected;
        } else if ( priv.private.hasOwnProperty( property ) ) {
            oldObj = priv.private;
        } else {
            return;
        }

        if ( Object.getOwnPropertyDescriptor ) {
            Object.defineProperty(newObj, property, Object.getOwnPropertyDescriptor(oldObj, property));
        } else {
            var getter = oldObj.__lookupGetter__( property );
            var setter = oldObj.__lookupSetter__( property );
            if ( getter || setter ) {
                if ( getter ) {
                    newObj.__defineGetter__(property, function() { return getter(); });
                }
                if ( setter ) {
                    newObj.__defineSetter__(property, function(val) { setter(val); });
                }
            } else {
                newObj[property] = oldObj[property];
            }
        }
        delete oldObj[property];
    };

    that.finalize = function( obj ) {
        var priv = obj.__privateInstance__;
        var args = priv.__constructor__arguments__;
        delete priv.__constructor__arguments__;
        replacePropertiesWithGetSet(priv.public);
        replacePropertiesWithGetSet(priv.protected);
        if (typeof priv.__constructor__ !== 'undefined' ) {
            priv.protected.__constructor__ = priv.__constructor__;
            delete priv.__constructor__;
        }
        var callWOconstructor = priv.public.__callWOconstructor__;
        delete priv.public.__callWOconstructor__;

        var ancestor = priv['super'];
        while ( ancestor !== null ) {
            var sup = ancestor.__privateInstance__;
            copyReferences(priv.protected, sup.__subclasses__, false);
            copyReferences(priv.public, sup.__subclasses__, false);
            ancestor = sup['super'];
        }

        if ( Object.seal ) {
            Object.seal(priv.private);
            Object.seal(priv.protected);
            Object.seal(priv.public);
        }

        if ( typeof priv.__constructor__ === 'function' ) {
            if (!callWOconstructor) {
                priv.__constructor__.apply(priv, Array.prototype.slice.call(args,0));
            }
        } else if ( priv['super'] && typeof priv['super'].__constructor__ === 'function' ) {
            priv['super'].__constructor__.call(priv);
        }
        return priv.public;
    };


    return that;
})();
