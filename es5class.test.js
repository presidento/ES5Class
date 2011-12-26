(function() { "use strict";

var canSeal = (function() {
    if ( !Object.seal ) { return false; }
    var s = {};
    Object.seal(s);
    try { s.s = true; } catch(e) {}
    return !s.s;
}());

module('basics');

test('public functions', function() {
    function SuperClass() {
        var that = ES5Class.create( this );

        that.public.test = function() {
            ok(true, 'super function called');
            return 'super';
        };

        return ES5Class.finalize( that );
    }
    function SubClass() {
        var that = ES5Class.create( this, SuperClass );

        that.public.test = function() {
            ok(true, 'sub function called');
            return 'sub';
        };

        return ES5Class.finalize( that );
    }

    equals( new SuperClass().test(), 'super');
    equals( new SubClass().test(), 'sub');
});

test('instanceOf', function() {
    function SuperClass() {
        var that = ES5Class.create( this );
        return ES5Class.finalize( that );
    }
    function Class() {
        var that = ES5Class.create( this, SuperClass );
        return ES5Class.finalize( that );
    }
    function SubClass() {
        var that = ES5Class.create( this, Class );
        return ES5Class.finalize( that );
    }

    ok( ES5Class.instanceOf( new Class(), Class ), 'class' );
    ok( ES5Class.instanceOf( new Class(), SuperClass ), 'superclass' );
    ok( ES5Class.instanceOf( new SubClass(), SuperClass ), 'super-super-class' );
    ok( !ES5Class.instanceOf( new Class(), SubClass ), 'subclass' );
    ok( !ES5Class.instanceOf( {}, SuperClass ), '{}' );
    ok( !ES5Class.instanceOf( true, SuperClass ), 'true' );
    ok( !ES5Class.instanceOf( null, SuperClass ), 'null' );
    ok( !ES5Class.instanceOf( undefined, SuperClass ), 'undefined' );
    ok( !ES5Class.instanceOf( 0, SuperClass ), '0' );
    ok( !ES5Class.instanceOf( '', SuperClass ), '""' );
});

test('bad call', function() {
    var newThis;
    (new function() {newThis = this;}());

    raises( function() { ES5Class.create(); }, TypeError,  'ES5Class.create()');
    raises( function() { ES5Class.create( this ); }, TypeError,  'ES5Class.create( window )');
    raises( function() { ES5Class.create( {} ); }, TypeError,  'ES5Class.create( {} )');
    raises( function() { ES5Class.create( newThis, {} ); }, TypeError,  'ES5Class.create( this, {} )');
    raises( function() { ES5Class.create( newThis, 0 ); }, TypeError,  'ES5Class.create( this, 0 )');
    raises( function() { ES5Class.create( newThis, null ); }, TypeError,  'ES5Class.create( this, null )');
});

module('properties', {
    SuperClass: function() {
        var that = ES5Class.create( this );

        that.private.privVar = 'super private';
        that.protected.protVar = 'super protected';
        that.public.publVar = 'super public';
        that.public.publ2 = 'super public2';

        that.public.test = function() {
            equals( that.privVar, 'super private');
            equals( that.protVar, 'super protected');
            equals( that.publVar, 'super public');
        }

        return ES5Class.finalize( that );
    }
});

test('create', function() {
    var obj = new this.SuperClass();
    obj.test();
    ok( typeof obj.privVar === 'undefined', 'object\'s private variable is unaccessable');
    ok( typeof obj.protVar === 'undefined', 'object\'s protected variable is unaccessable');
    equals( obj.publVar, 'super public');
});

test('inheritance', function() {
    function Class( SuperClass ) {
        var that = ES5Class.create( this, SuperClass );

        that.public.test = function() {
            ok( typeof that.privVar === 'undefined', 'super\'s private variable is unaccessable');
            equals( that.protVar, 'super protected');
            equals( that.publVar, 'super public');
        }

        return ES5Class.finalize( that );
    };

    new Class( this.SuperClass ).test();
});

test('redefine', function() {
    function Class( SuperClass ) {
        var that = ES5Class.create( this, SuperClass );

        that.private.privVar = 'sub private';
        that.protected.protVar = 'sub protected';
        that.public.publVar = 'sub public';

        that.public.test = function() {
            equals( that.privVar, 'sub private');
            equals( that.protVar, 'sub protected');
            equals( that.publVar, 'sub public');
        }

        return ES5Class.finalize( that );
    }

    new Class( this.SuperClass ).test();
});

test('change visibility', function() {
    var SuperClass = this.SuperClass;
    function Class() {
        var that = ES5Class.create( this, SuperClass );

        ES5Class.changeVisibility('protVar', that.public);
        ES5Class.changeVisibility('publVar', that.protected);

        return ES5Class.finalize( that );
    }

    function SubClass() {
        var that = ES5Class.create( this, Class );
        
        that.public.test = function() {
            equals( that.publVar, 'super public' );
            equals( that.protVar, 'super protected' );
        }
        
        return ES5Class.finalize( that );
    }

    var sc = new SubClass();
    sc.test();
    equals( sc.protVar, 'super protected');
    equals( typeof sc.publVar, 'undefined');
});

module('methods', {
    SuperClass: function() {
        var that = ES5Class.create( this );

        that.private.privFunc = function() { return 'super private'; };
        that.protected.protFunc = function() { return 'super protected'; };
        that.public.publFunc = function() { return 'super public'; };

        that.public.test = function() {
            equals( that.privFunc(), 'super private');
            equals( that.protFunc(), 'super protected');
            equals( that.publFunc(), 'super public');
        }

        return ES5Class.finalize( that );
    }
});

test('create', function() {
    new this.SuperClass().test();
});

test('inheritance', function() {
    function Class( SuperClass ) {
        var that = ES5Class.create( this, SuperClass );

        that.public.test = function() {
            ok( typeof that.privFunc === 'undefined', 'super\'s private method is unaccessable');
            equals( that.protFunc(), 'super protected');
            equals( that.publFunc(), 'super public');
        }

        return ES5Class.finalize( that );
    };

    new Class( this.SuperClass ).test();
});

test('redefine & super', function() {
    function Class( SuperClass ) {
        var that = ES5Class.create( this, SuperClass );

        that.private.privFunc = function() { return 'sub private'; };
        that.protected.protFunc = function() { return 'sub protected'; };
        that.public.publFunc = function() { return 'sub public'; };

        that.public.test = function() {
            equals( that.privFunc(), 'sub private');
            equals( that.protFunc(), 'sub protected');
            equals( that.publFunc(), 'sub public');

            ok( typeof that['super'].privFunc === 'undefined', 'super\'s private method is unaccessable');
            equals( that['super'].protFunc(), 'super protected');
            equals( that['super'].publFunc(), 'super public');
        }

        return ES5Class.finalize( that );
    }

    new Class( this.SuperClass ).test();
});

test('change visibility', function() {
    var SuperClass = this.SuperClass;
    function Class() {
        var that = ES5Class.create( this, SuperClass );

        ES5Class.changeVisibility('protFunc', that.public);
        ES5Class.changeVisibility('publFunc', that.protected);

        return ES5Class.finalize( that );
    }

    function SubClass() {
        var that = ES5Class.create( this, Class );
        
        that.public.test = function() {
            equals( that.publFunc(), 'super public' );
            equals( that.protFunc(), 'super protected' );
        }
        
        return ES5Class.finalize( that );
    }

    var sc = new SubClass();
    sc.test();
    equals( sc.protFunc(), 'super protected');
    equals( typeof sc.publFunc, 'undefined');
});


module('accessors', {
    SuperClass: function() {
        var that = ES5Class.create( this );

        that.private.privVar = 'super private';
        that.protected.protVar = 'super protected';
        that.public.publVar = 'super public';

        that.private.privFunc = function() { return that.privVar; };
        that.private.protFunc = function() { return that.protVar; };
        that.private.publFunc = function() { return that.publVar; };

        that.public.privAcc = function() { return that.privFunc(); };
        that.public.protAcc = function() { return that.protFunc(); };
        that.public.publAcc = function() { return that.publFunc(); };

        that.public.test = function() {
            equals( that.privAcc(), 'super private');
            equals( that.protAcc(), 'super protected');
            equals( that.publAcc(), 'super public');
        }

        return ES5Class.finalize( that );
    }
});

test('create', function() {
    new this.SuperClass().test();
});

test('inheritance', function() {
    function Class( SuperClass ) {
        var that = ES5Class.create( this, SuperClass );

        that.public.test = function() {
            equals( that.privAcc(), 'super private');
            equals( that.protAcc(), 'super protected');
            equals( that.publAcc(), 'super public');
        }

        return ES5Class.finalize( that );
    };

    new Class( this.SuperClass ).test();
});

test('redefine properties', function() {
    function Class( SuperClass ) {
        var that = ES5Class.create( this, SuperClass );

        that.privVar = 'sub private';
        that.protVar = 'sub protected';
        that.publVar = 'sub public';

        that.public.test = function() {
            equals( that.privAcc(), 'super private');
            equals( that.protAcc(), 'sub protected');
            equals( that.publAcc(), 'sub public');
        }

        return ES5Class.finalize( that );
    }

    new Class( this.SuperClass ).test();
});

test('grandchild', function() {
    var SuperClass = this.SuperClass;

    function Child1() {
        var that = ES5Class.create( this, SuperClass);
        return ES5Class.finalize( that );
    };
    function Child() {
        var that = ES5Class.create( this, Child1 );
        return ES5Class.finalize( that );
    };

    function GrandChild() {
        var that = ES5Class.create( this, Child );

        that.privVar = 'sub private';
        that.protVar = 'sub protected';
        that.publVar = 'sub public';

        that.public.test = function() {
            equals( that.privAcc(), 'super private');
            equals( that.protAcc(), 'sub protected');
            equals( that.publAcc(), 'sub public');
        }

        return ES5Class.finalize( that );
    }

    new GrandChild().test();
});

module('constructor', {
    Class: function() {
        var that = ES5Class.create( this, arguments );

        that.public.primVar = 'myVar';
        that.public.funcVar = null;
        that.public.objVar = {};

        that.__constructor__ = function( variables ) {
            that.funcVar = function(){};
            if ( typeof variables !== 'object' ) {
                return;
            }
            for ( var k in variables ) {
                if ( variables.hasOwnProperty(k) ) {
                    that[k] = variables[k];
                }
            }
        };

        return ES5Class.finalize( that );
    }
});

test('basic test', function() {
    function MyClass() {
        var that = ES5Class.create( this, arguments );

        that.protected.v = 2;
        that.protected.f = function(){ return 2; };
        that.protected.fn = null;
        
        that.__constructor__ = function(variable, funct) {
            that.v = variable;
            that.fn = funct;
            try { // methods cannot be changed
                that.f = funct;
            } catch(e) {}
            try { // you can not add new properties here
                that.nonExists = 'not work';
            } catch(e) {}
        };


        that.public.test = function() {
            equals(that.v, 4, 'Property can be changed');
            equals(that.fn(), 4, 'Function as property');
            warn(!canSeal).equals(that.f(), 2, 'Methods can not be changed');
            warn(!canSeal).equals(typeof that.nonExists, 'undefined');
        };

        return ES5Class.finalize( that );
    }

    var c = new MyClass(4, function(){return 4;});
    try { // c.v is not public
        c.v = 6;
    } catch (e) {}
    c.test();

    function SubClass() {
        var that = ES5Class.create( this, arguments, MyClass );

        that.__constructor__ = function( variable ) {
            that['super'].__constructor__( variable + 1, function(){return 4;} );
        };

        return ES5Class.finalize( that );
    }

    var sc = new SubClass(3);
    sc.test();
});

test('function as property', function() {
    var c = new this.Class();
    equals(typeof c.funcVar, 'function');
    c.funcVar = function() { return 42; }
    equals(c.funcVar(), 42);
});


test('setting the values in the constructor', function() {
    var c = new this.Class({
        funcVar: function() {},
        primVar: 42,
        objVar: { prop: 'prop' }
    });

    equals(typeof c.funcVar, 'function');
    equals(c.primVar, 42);
    equals(c.objVar.prop, 'prop');
});

test('subclass with super as object', function() {
    var Class = this.Class;
    function SubClass() {
        var that = ES5Class.create( this, arguments, new Class({primVar: 100}));
        return ES5Class.finalize(that);
    };

    var s = new SubClass();
    equals(s.primVar, 100);
});

test('calling the constructor of the super class', function() {
    var Class = this.Class;
    function SubClass() {
        var that = ES5Class.create( this, arguments, Class);

        that.__constructor__ = function() {
            that['super'].__constructor__({ primVar: 99});
        };
        return ES5Class.finalize(that);
    }

    var s = new SubClass();
    equals(s.primVar, 99);
});

test('implicit call of the constructor of the super class', function() {
    var Class = this.Class;
    function SubClass() {
        var that = ES5Class.create( this, arguments, Class);

        that.__constructor__ = function() {
            that['super'].__constructor__({ primVar: 96});
        };
        return ES5Class.finalize(that);
    }

    function SubSubClass() {
        var that = ES5Class.create( this, arguments, SubClass);
        return ES5Class.finalize(that);
    }

    var s = new SubSubClass();
    equals(s.primVar, 96);
});

test('does not call the constructor of the super class when there is a constructor in the subclass', function() {
    var Class = this.Class;
    function SubClass() {
        var that = ES5Class.create( this, arguments, Class);

        that.__constructor__ = function() {};

        return ES5Class.finalize(that);
    }

    var s = new SubClass();
    strictEqual(s.funcVar, null);
});

module('method call from a private method', {
    SuperClass: function() {
        var that = ES5Class.create( this );

        that.private.privFunc = function() { return 'super private'; };
        that.protected.protFunc = function() { return 'super protected'; };
        that.public.publFunc = function() { return 'super public'; };

        that.private.privMethod = function() { return that.privFunc(); };
        that.private.protMethod = function() { return that.protFunc(); };
        that.private.publMethod = function() { return that.publFunc(); };

        that.public.privCall = function() { return that.privMethod(); };
        that.public.protCall = function() { return that.protMethod(); };
        that.public.publCall = function() { return that.publMethod(); };

        that.public.test = function() {
            equals( that.privCall(), 'super private');
            equals( that.protCall(), 'super protected');
            equals( that.publCall(), 'super public');
        }

        return ES5Class.finalize( that );
    }
});

test('create', function() {
    new this.SuperClass().test();
});

test('inheritance', function() {
    function Class( SuperClass ) {
        var that = ES5Class.create( this, new SuperClass() );

        that.public.test = function() {
            equals( that.privCall(), 'super private');
            equals( that.protCall(), 'super protected');
            equals( that.publCall(), 'super public');
        }

        return ES5Class.finalize( that );
    };

    new Class( this.SuperClass ).test();
});

test('redefine properties', function() {
    function Class( SuperClass ) {
        var that = ES5Class.create( this, new SuperClass() );

        that.private.privFunc = function() { return 'sub private'; };
        that.protected.protFunc = function() { return 'sub protected'; };
        that.public.publFunc = function() { return 'sub public'; };

        that.public.test = function() {
            equals( that.privCall(), 'super private');
            equals( that.protCall(), 'sub protected');
            equals( that.publCall(), 'sub public');
        }

        return ES5Class.finalize( that );
    }

    new Class( this.SuperClass ).test();
});

test('grandchildren', function() {
    var SuperClass = this.SuperClass;

    function Child() {
        var that = ES5Class.create( this, new SuperClass() );
        return ES5Class.finalize( that );
    };

    function GrandChild() {
        var that = ES5Class.create( this, new Child() );

        that.private.privFunc = function() { return 'sub private'; };
        that.protected.protFunc = function() { return 'sub protected'; };
        that.public.publFunc = function() { return 'sub public'; };

        that.public.test = function() {
            equals( that.privCall(), 'super private');
            equals( that.protCall(), 'sub protected');
            equals( that.publCall(), 'sub public');
        }

        return ES5Class.finalize( that );
    }

    new GrandChild().test();
});

module('seal the class', {
    Class: function() {
        var that = ES5Class.create( this );

        that.public.testProperties = function() {
            try { that.public.nonExistsPub = 2; } catch(e) {}
            try { that.protected.nonExistsProt = 2; } catch(e) {}
            try { that.private.nonExistsPriv = 2; } catch(e) {}
            warn(!canSeal).equals('undefined', typeof that.nonExistsPub);
            warn(!canSeal).equals('undefined', typeof that.nonExistsProt);
            warn(!canSeal).equals('undefined', typeof that.nonExistsPriv);
        };

        that.public.testMethods = function() {
            try { that.public.nonExistsPub = function() {}; } catch(e) {}
            try { that.protected.nonExistsProt = function() {}; } catch(e) {}
            try { that.private.nonExistsPriv = function() {}; } catch(e) {}
            warn(!canSeal).equals('undefined', typeof that.nonExistsPub);
            warn(!canSeal).equals('undefined', typeof that.nonExistsProt);
            warn(!canSeal).equals('undefined', typeof that.nonExistsPriv);
        };

        return ES5Class.finalize( that );
    }
});

test('properties', function() {
    new this.Class().testProperties();
});

test('methods', function() {
    new this.Class().testMethods();
});

}()); // "use strict";