function _result(r, v) { return {'res': r, 'val': v}; }

function _failed_error() { return new Error("match failed"); }
function _pattern_error() { return new Error("invalid pattern"); }

function Pat(){}
Pat.prototype.match = function() { throw _pattern_error(); };

var _ = new Pat();
_.match = function(v) { return _result(1, v); };

When_Pat.prototype = new Pat();
function When_Pat(f) { this.match = function(v) { return _result(f(v) ? 1 : 0, v); } };
function when(f) { return new When_Pat(f); };

Many_Pat.prototype = new Pat();
function Many_Pat(p) {
    this.match = function(l) {
        if(!(l instanceof Array) || l.length < 1) return _result(0, undefined);
        try {
            var r = _pmatch(l[0], p);
            var rt = this.match(l.slice(1));
            return _result(rt.res + 1, rt.res ? r.concat(rt.val) : r);
        } catch (e) { return _result(0, undefined); }
    }
};
function many(p) { return new Many_Pat(p); };

function match(value) {
    for(var i = 1; i < arguments.length; i += 2)
        try { return arguments[i+1].apply(undefined, _pmatch(value, arguments[i])); } catch(e) {}

    throw _failed_error();
};

function _sane_equal(v1, v2) {
    return (v1 === v2 || (v1 instanceof Array && v2 instanceof Array && v1.length == 0 && v2.length == 0));
}

function _pmatch(value, pat) {
    if(_sane_equal(value, pat)) return [];

    if(!(value instanceof Array && pat instanceof Array) && pat instanceof Pat) {
        var r = pat.match(value);
        if(r.res) return [r.val];
    } else if(value instanceof Array && value.length > 0 && pat instanceof Array && pat.length > 0) {
        if(pat[0] instanceof Many_Pat) {
            var r = pat[0].match(value);
            if(r.res) return [r.val].concat(_pmatch(value.slice(r.res), pat.slice(1)));
            return _pmatch(value, pat.slice(1));
        } else if(pat[0] instanceof Pat) {
            var r = pat[0].match(value[0]);
            if(r.res) return [r.val].concat(_pmatch(value.slice(1), pat.slice(1)));
        } else return _pmatch(value[0], pat[0]).concat(_pmatch(value.slice(1), pat.slice(1)));
    } else if(pat[0] instanceof Many_Pat) return _pmatch(value, pat.slice(1));

    throw _failed_error();
};
