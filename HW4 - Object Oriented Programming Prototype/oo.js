function throwUndeclaredClassError()    { throw 'undeclared class'; };
function throwInvalidMessageError()     { throw 'message not understood'; };
function throwDuplicateClassError()     { throw 'duplicate class declaration'; };
function throwUndeclaredIVarError()     { throw 'undeclared instance variable'; };
function throwDuplicateIVarsError()     { throw 'duplicate instance variable declaration'; };

/* ---------------------------------------------------------------------------------------------- */

function getClassFor(name) {
    if(OO.CT.hasOwnProperty(name))  return OO.CT[name];
    else                            throwUndeclaredClassError();
};

function dupVarsIn(vlist, superName) {
    var superC = getClassFor(superName);
    if ((vlist.reduce(function(p, c, i, a) { return p || (superC['vars'].indexOf(c) != -1); }, 0))
        || (superC['super'] != null && dupVarsIn(vlist, superC['super'])))
            throwDuplicateIVarsError();
    return false;
};

/* ---------------------------------------------------------------------------------------------- */

var OO = {};

OO.initializeCT = function() {
    OO.CT = {
        'Object': {
            'super'      : null,
            'vars'       : [],
            'initialize' : function() {},
            '==='        : function(_this, x) { return _this === x; },
            '!=='        : function(_this, x) { return _this !== x; },
            'isNumber'   : function(_this) { return false; },
        },
        'Number': {
            'super'      : 'Object',
            'vars'       : [],
            '+'          : function(_this, num) { return _this + num; },
            '-'          : function(_this, num) { return _this - num; },
            '*'          : function(_this, num) { return _this * num; },
            '/'          : function(_this, num) { return _this / num; },
            '%'          : function(_this, num) { return _this % num; },
            'isNumber'   : function(_this) { return true; },
        },
    };
};

OO.declareClass = function(name, superName, ivars) {
    if(OO.CT.hasOwnProperty(name))      throwDuplicateClassError(name);

    if((ivars.length != ivars.filter(function(i, p) { return ivars.indexOf(i) == p; }).length)
       || dupVarsIn(ivars, superName))  throwDuplicateIVarsError(name);

    OO.CT[name] = { 'super': superName, 'vars': ivars, };
};

OO.declareMethod = function(className, name, func) {
    getClassFor(className)[name] = func;
};

OO.instantiate = function(className) {
    var inst = { 'class': className, 'vars': {}, };

    var classo = className;
    while(classo != null) {
        classo = getClassFor(classo);
        for (var v in classo['vars'])
            inst['vars'][classo['vars'][v]] = null;
        classo = classo['super'];
    }

    var args = Array.prototype.slice.call(arguments, 1);
    args.unshift('initialize');
    args.unshift(inst);
    OO.send.apply(undefined, args);

    return inst;
};

OO.send = function(recv, func) {
    if(typeof recv === 'number') {
        var args = Array.prototype.slice.call(arguments, 1);
        args.unshift(recv);
        args.unshift("Number");
        return OO.superSend.apply(undefined, args);
    }

    var args = Array.prototype.slice.call(arguments, 0);
    args.unshift(recv['class']);
    return OO.superSend.apply(undefined, args);
};

OO.superSend = function(superName, recv, func) {
    var classo = getClassFor(superName);
    if(classo.hasOwnProperty(func)) {
        var args = Array.prototype.slice.call(arguments, 3);
        args.unshift(recv);
        return classo[func].apply(undefined, args);
    }

    if(classo['super'] === null) throwInvalidMessageError();

    var args = Array.prototype.slice.call(arguments, 0);
    args.shift(0);
    args.unshift(classo['super']);
    return OO.superSend.apply(undefined, args);
};

OO.getInstVar = function(recv, ivarName) {
    if(!recv['vars'].hasOwnProperty(ivarName)) throwUndeclaredIVarError();
    return recv['vars'][ivarName];
};

OO.setInstVar = function(recv, ivarName, val) {
    if(!recv['vars'].hasOwnProperty(ivarName)) throwUndeclaredIVarError();
    recv['vars'][ivarName] = val;
};

// ...

