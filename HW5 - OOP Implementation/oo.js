function throwUndeclaredClassError()    { throw 'undeclared class'; };
function throwInvalidMessageError()     { throw 'message not understood'; };
function throwDuplicateClassError()     { throw 'duplicate class declaration'; };
function throwUndeclaredIVarError()     { throw 'undeclared instance variable'; };
function throwDuplicateIVarsError()     { throw 'duplicate instance variable declaration'; };

/* ---------------------------------------------------------------------------------------------- */

function unbox(i) { return (i instanceof Object && i.class == 'Number') ? OO.getInstVar(i, "val") : i; }

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
        'Null': {
            'super'      : 'Object',
            'vars'       : [],
        },
        'Block': {
            'super'      : 'Object',
            'vars'       : [],
        },
        'Boolean': {
            'super'      : 'Object',
            'vars'       : [],
        },
        'True': {
            'super'      : 'Boolean',
            'vars'       : [],
        },
        'False': {
            'super'      : 'Boolean',
            'vars'       : [],
        },
        'Number': {
            'super'      : 'Object',
            'vars'       : ['val'],
            'initialize' : function(_this, num) { OO.setInstVar(_this, 'val', num); },
            '+'          : function(_this, num) { return OO.getInstVar(_this, 'val') + unbox(num); },
            '*'          : function(_this, num) { return OO.getInstVar(_this, 'val') * unbox(num); },
            '-'          : function(_this, num) { return OO.getInstVar(_this, 'val') - unbox(num); },
            '/'          : function(_this, num) { return OO.getInstVar(_this, 'val') / unbox(num); },
            '%'          : function(_this, num) { return OO.getInstVar(_this, 'val') % unbox(num); },
            '>'          : function(_this, num) { return OO.getInstVar(_this, 'val') > unbox(num); },
            '<'          : function(_this, num) { return OO.getInstVar(_this, 'val') < unbox(num); },
            '>='         : function(_this, num) { return OO.getInstVar(_this, 'val') >= unbox(num); },
            '<='         : function(_this, num) { return OO.getInstVar(_this, 'val') <= unbox(num); },
            'isNumber'   : function(_this) { return true; },
            '==='        : function(_this, num) { return OO.getInstVar(_this, 'val') === unbox(num); },
            '!=='        : function(_this, num) { return OO.getInstVar(_this, 'val') !== unbox(num); },
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
        args.unshift(OO.instantiate("Number", recv));
        args.unshift('Number');
        return OO.superSend.apply(undefined, args);
    } else if(recv === null) {
        var args = Array.prototype.slice.call(arguments, 1);
        args.unshift(OO.instantiate("Null"));
        args.unshift('Null');
        return OO.superSend.apply(undefined, args);
    } else if(recv === true) {
        var args = Array.prototype.slice.call(arguments, 1);
        args.unshift(OO.instantiate("True"));
        args.unshift('True');
        return OO.superSend.apply(undefined, args);
    } else if(recv === false) {
        var args = Array.prototype.slice.call(arguments, 1);
        args.unshift(OO.instantiate("False"));
        args.unshift('False');
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

/* ---------------------------------------------------------------------------------------------- */

function thisMap(t, l, f) {
    var k = l;
    for(var i = 0; i < l.length; ++i)
        k[i] = f.call(t, l[i]);
    return k;
}

function cleanObject(init) { return $.extend(Object.create(null), init === undefined ? {} : init); };

function RetException(value, id, r) { this.val = value; this.id = id; this.r = r; };

var blockCntr, tvarCntr;
function newTVarName() { return "__temp"+ (tvarCntr++); };
function newBlockName() { return "Block" + (blockCntr++); };

O.transAST = function(ast) {
    tvarCntr = 0;
    blockCntr = 0;
    return trans.call(cleanObject({ 'blocked': false, 'methoded': false }), ast)[0];
};

function trans(ast) { return transTag[ast[0]].apply(this, ast.slice(1)); }

function wrapRetException(str1, str2) {
    return 'try { ' + str1 + '; } catch(e) { if(e instanceof RetException) '
            + (this.methoded ? '{ if(e.r && e.id == _eid_) ' + (this.blocked ? 'throw e;' : 'return e.val;') + ' else ' + str2 + '; }' : str2 + ';') + ' else throw e; }'
};

var transTag = {
    'this':         function()        { return [this.blocked ? 'OO.getInstVar(_this, "parent")' : '_this', '', '']; },
    'null':         function()        { return ['null', '', '']; },
    'true':         function()        { return ['true', '', '']; },
    'null':         function()        { return ['false', '', '']; },
    'number':       function(n)       { return [n.toString(), '', '']; },

    'getVar':       function(x)       { return [x, '', '']; },
    'getInstVar':   function(x)       { return ['OO.getInstVar(' + (this.blocked ? 'OO.getInstVar(_this, "parent")' : '_this') + ', "' + x + '")', '', '']; },

    'setVar':       function(x,e)     { var r = trans.call(this, e); return [r[1] + wrapRetException.call(this, x + ' = ' + r[0], x + ' = e.val'), '', r[2]]; },
    'setInstVar':   function(x,e)     {
        var r = trans.call(this, e), tthis = this.blocked ? 'OO.getInstVar(_this, "parent")' : '_this';
        return [r[1] + wrapRetException.call(this, 'OO.setInstVar(' + tthis + ', "' + x + '", ' + r[0] + ')', 'OO.setInstVar(' + tthis + ', "' + x + '", e.val)'), '', r[2]];
    },

    'varDecls':     function()        {
        var pre0 = '', pre1 = '';
        var names = Array.prototype.slice.call(arguments).map(function(xe) { return xe[0]; });
        var args = Array.prototype.slice.call(arguments).map(function(xe) {
                                                                var r = trans.call(this, xe[1]);
                                                                pre0 += r[1];
                                                                pre1 += r[2];
                                                                return wrapRetException.call(this, xe[0] + ' = ' + r[0], xe[0] + ' = e.val'); });
        return [pre0 + 'var ' + names.join(', ') + ';' + args.join(''), '', pre1];
    },

    'return':       function(e)       {
        var r = trans.call(this, e);
        return [r[1] + (this.blocked ? '__ret__ = ' + r[0] + ';' : 'return ' + r[0] + ';'), '', r[2]];
    },

    'new':          function(C)       {
        var ret1 = '', ret2 = '', tvars = [];

        if(arguments.length > 1) {
            tvars = Array.apply(null, Array(arguments.length - 1)).map(function(_) { return newTVarName(); });
            ret1 += 'var ' + tvars.join(',') + ';';

            var rr = thisMap(this, Array.prototype.slice.call(arguments, 1), trans);
            ret2 += rr.map(function(p) { return p[2] }).join('');
            ret1 += rr.map(function(p) { return p[1] }).join('')
                  + rr.map(function(p, i) { return wrapRetException.call(this, tvars[i] + ' = ' + p[0], tvars[i] + ' = e.val'); }).join('');
        }

        var args = arguments.length > 1 ? ', ' + tvars.join(', ') : '';
        return ['OO.instantiate("' + C + '"' + args + ')', ret1, ret2];
    },

    'send':         function(e, m)    {
        var ret1 = '', ret2 = '', tvars = [];

        tvars = Array.apply(null, Array(arguments.length - 1)).map(function(_) { return newTVarName(); });
        ret1 += 'var ' + tvars.join(',') + ';';

        var r = trans.call(this, e);
        ret1 += r[1] + wrapRetException.call(this, tvars[0] + ' = ' + r[0], tvars[0] + ' = e.val');
        ret2 += r[2];

        var rr = thisMap(this, Array.prototype.slice.call(arguments, 2), trans);
        ret2 += rr.map(function(p) { return p[2]; }).join('');
        ret1 += rr.map(function(p) { return p[1]; }).join('')
              + rr.map(function(p, i) { return wrapRetException.call(this, tvars[i+1] + ' = ' + p[0], tvars[i+1] + ' = e.val'); }).join('');

        var args = arguments.length > 2 ? ', ' + tvars.slice(1).join(', ') : '';
        return ['OO.send(' + tvars[0] + ', "' + m + '"' + args + ')', ret1, ret2];
    },
    'super':        function(m)       {
        var ret1 = '', ret2 = '', tvars = [];

        if(arguments.length > 1) {
            tvars = Array.apply(null, Array(arguments.length - 1)).map(function(_) { return newTVarName(); });

            var r = thisMap(this, Array.prototype.slice.call(arguments, 1), trans);
            ret2 += r.map(function(p) { return p[2]; }).join('');
            ret1 += r.map(function(p) { return p[1]; }).join('')
                  + r.map(function(p, i) { return wrapRetException.call(this, tvars[i] + ' = ' + p[0], tvars[i] + ' = e.val'); }).join('');
        }

        var args = arguments.length > 1 ? ', ' + tvars.join(', ') : '';
        return ['OO.superSend(getClassFor(_this["class"])["super"], _this, "' + m + '"' + args + ')', ret1, ret2];
    },

    'exprStmt':     function(e)       { var r = trans.call(this, e); return [r[1] + r[0] + ';', '', r[2]]; },

    'block':        function(xl,sl)   {
        var args = xl.length ? ', ' + xl.join(', ') : '';
        var lastExpr = -1, rret = false;
        if(sl.length) for(var i = 0; i < sl.length; ++i) if(sl[i][0] == 'exprStmt') lastExpr = i; else if(sl[i][0] == 'return') { rret = true; lastExpr = i; };
        var sufx = ' throw new RetException(__ret__, OO.getInstVar(_this, "id"), ' + (rret ? 'true' : 'false') + '); });';
        if(lastExpr != -1) sl[lastExpr][0] = 'return'
          var bName = newBlockName();
          var rr = thisMap(cleanObject({ 'blocked': true, 'methoded': true }), sl, trans);
          var pre = rr.map(function(p) { return p[2] }).join(' ')
                + 'OO.declareClass("' + bName + '", "Block", ["parent", "id"]);'
                + 'OO.declareMethod("' + bName + '", "initialize", function(_this, p, i) { OO.setInstVar(_this, "parent", p); OO.setInstVar(_this, "id", i) });';
          var safeBody = rr.map(function(p) { return 'try { ' + p[0]
                            + ' } catch(e) { if(e instanceof RetException) { if(e.r) throw e; else __ret__ = e.val; } else throw e; }' }).join('');
          var pree = 'OO.declareMethod("' + bName + '", "call", function(_this' + args +  ') { var __ret__ = null, _eid_ = {}; ' + safeBody + sufx;
        return [rr.map(function(p) { return p[1] }).join('') + 'OO.instantiate("' + bName + '", typeof _this === "undefined" ? null : _this, _eid_)', pree, pre];
    },

    'classDecl':    function(c,s,l)   {
        var args = '[' + l.map(function(n) { return '"' + n + '"' }).join(', ') + ']';
        return ['', '', 'OO.declareClass(\"' + c + '", "' + s + '", ' + args + ');'];
    },

    'methodDecl':   function(c,m,l,b) {
        var args = l.length ? ', ' + l.join(', ') : '';
        var rr = thisMap(cleanObject({ 'methoded': true }), b, trans);
        var safeBody = rr.map(function(p) { return 'try { ' + p[0]
                              + ' } catch(e) { if(e instanceof RetException) { if(e.r) { if(e.id == _eid_) return e.val; else throw e; } else __ret__ = e.val; } else throw e; }' }).join('');
                              return ['', '', rr.map(function(p) { return p[2] }).join(' ')
                                  + rr.map(function(p) { return p[1] }).join(' ')
                                  + 'OO.declareMethod("' + c + '", "' + m + '", function(_this' + args + ') { var _eid_ = {}, __ret__ = null; '
                                  + safeBody
                                  + ' return __ret__; });'];
    },

    'program':      function() {
        var rr = thisMap(this, Array.prototype.slice.call(arguments), trans);
        var safeBody = rr.map(function(p) { return 'try { ' + p[0]
                              + ' } catch(e) { if(e instanceof RetException && e.id == _eid_ && !e.r) e.val; else throw e; }' }).join('');
                              return [ 'OO.initializeCT();'
                                  + rr.map(function(p) { return p[2] }).join('')
                                  + rr.map(function(p) { return p[1] }).join('')
                                  + 'var _eid_ = {}; '
                                  + safeBody, '', ''];
    },
};
