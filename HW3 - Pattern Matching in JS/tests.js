// This function is used by the test harness to pretty-print values.
// Right now it doesn't handle undefined, functions, NaN, Number.POSITIVE_INFINITY, etc.
// Feel free to modify / extend it as you see fit.
// (FYI, pretty-printing is not used by our grading scripts.)

function prettyPrintValue(value) {
  return JSON.stringify(value);
}

// Helper functions used in the tests

function greaterThan(n) {
  return function(x) { return x > n; };
}

function isNumber(x) {
  return typeof x === 'number';
}

// Tests!

tests(
  {
    name: 'wildcard',
    code: 'match(123,\n' +
          '  _, function(x) { return x + 2; }\n' +
          ')',
    expected: 125
  },
  {
    name: 'literal pattern',
    code: 'match(123,\n' +
          '  42,  function() { return "aaa"; },\n' +
          '  123, function() { return "bbb"; },\n' +
          '  444, function() { return "ccc"; }\n' +
          ')',
    expected: "bbb"
  },
  {
    name: 'array pattern',
    code: 'match(["+", 5, 7],\n' +
          '  ["+", _, _], function(x, y) { return x + y; }\n' +
          ')',
    expected: 12
  },
  {
    name: 'many',
    code: 'match(["sum", 1, 2, 3, 4],\n' +
          '  ["sum", many(when(isNumber))], function(ns) {\n' +
          '                                   return ns.reduce(function(x, y) { return x + y; });\n' +
          '                                 }\n' +
          ')',
    expected: 10
  },
  {
    name: 'many pairs',
    code: 'match([[1, 2], [3, 4], [5, 6]],\n' +
          '  [many([_, _])], function(pts) { return JSON.stringify(pts); }\n' +
          ')',
    expected: "[1,2,3,4,5,6]"
  },
  {
    name: 'post many',
    code: 'match([[1, 2], "dummy", [3, 4], [5, 6]],\n' +
          '  [many([_, _]), "dummy", many([_, _])],\n' +
          '  function(l1, l2) { return JSON.stringify(l1) + JSON.stringify(l2); }\n' +
          ')',
    expected: "[1,2][3,4,5,6]"
  },
  {
    name: 'many many',
    code: 'match([[1, 2, "and", "p", 2, "end"], "dummy", 3, "xyz"],\n' +
          '  [many([many(when(isNumber)), "and", many(_)]), "dummy", many(_)],\n' +
          '  function(l1, l2) { return JSON.stringify(l1) + JSON.stringify(l2); }\n' +
          ')',
    expected: "[[1,2],[\"p\",2,\"end\"]][3,\"xyz\"]"
  },
  {
    name: 'when',
    code: 'match(5,\n' +
          '  when(greaterThan(8)), function(x) { return x + " is greater than 8"; },\n' +
          '  when(greaterThan(2)), function(x) { return x + " is greater than 2"; }\n' +
          ')',
    expected: "5 is greater than 2"
  },
  {
    name: 'first match wins',
    code: 'match(123,\n' +
          '  _,   function(x) { return x; },\n' +
          '  123, function()  { return 4; }\n' +
          ')',
    expected: 123
  },
  {
    name: 'match failed',
    code: 'match(3,\n' +
          '  1,   function() { return 1; },\n' +
          '  2,   function() { return 2; },\n' +
          '  [3], function() { return 3; }\n' +
          ')',
    shouldThrow: true
  },
  {
    name: 'pattern list does not have enough patterns',
    code: 'match([3,2],\n' +
          '  [1],   function() { return 1; },\n' +
          '  [3],   function() { return 2; },\n' +
          '  [2], function() { return 3; }\n' +
          ')',
    shouldThrow: true
  },
  {
    name: 'pattern list has too many patterns',
    code: 'match([3],\n' +
          '  [3, 2],   function() { return 1; },\n' +
          '  [3, 1],   function() { return 2; },\n' +
          '  [3, 3, 1], function() { return 3; }\n' +
          ')',
    shouldThrow: true
  },
  {
    name: 'nested match 1',
    code: 'match([3, [2, 3, [3, 4]]],\n' +
          '  [3, [2, 3, [_, 5]]],   function() { return Array.prototype.slice.call(arguments, 0);},\n' +
          '  [3, [2, 4, [_, 4]]],   function() { return Array.prototype.slice.call(arguments, 0);},\n' +
          '  [3, [_, 3, _]], function() { return Array.prototype.slice.call(arguments, 0);}\n' +
          ')',
    expected: [2,[3,4]]
  },
  {
    name: 'many 1',
    code: 'match([3, 3, 3, 3],\n' +
          '  [many(4), many(2)],   function() { return Array.prototype.slice.call(arguments, 0);},\n' +
          '  [many(3), many(2), many(4), many(when(greaterThan(4)))],  function() { return Array.prototype.slice.call(arguments, 0);},\n' +
          '  [3, 3, 1, 3], function() { return Array.prototype.slice.call(arguments, 0);}\n' +
          ')',
    expected: [[],[],[],[]]
  },
  {
    name: 'nested complex 1',
    code: 'match([3, 3, [3, 3], [3, 3], [2, [2, [2, 2]]]],\n' +
          '  [many(when(greaterThan(2))), many([3, 3]), [2,[2,[2,2]]]], function() { return Array.prototype.slice.call(arguments, 0);}\n' +
          ')',
    expected: [[3, 3], []]
  },
  {
    name: 'nested complex 2',
    code: 'match([3, 3, [3, 3], [3, 3], [2, [2, [2, 2]]]],\n' +
          '  [many(when(greaterThan(2))), many([3, 3]), [_,[2,[2,2]]]], function() { return Array.prototype.slice.call(arguments, 0);}\n' +
          ')',
    expected: [[3, 3], [], 2]
  },
  {
    name: 'nested complex 1',
    code: 'match([3, 3, [3, 3], [3, 3], [2, [2, [2, 2]]]],\n' +
          '  [many(when(greaterThan(2))), many([3, 3]), [_,[_,[2,2]]]], function() { return Array.prototype.slice.call(arguments, 0);}\n' +
          ')',
    expected: [[3, 3], [], 2, 2]
  },
  {
    name: 'nested complex 4',
    code: 'match([3, 3, [3, 3], [3, 3], [2, [2, [2, 2]]]],\n' +
          '  [many(when(greaterThan(2))), many([3, 3]), [2,[2,[many(when(greaterThan(1)))]]]], function() { return Array.prototype.slice.call(arguments, 0);}\n' +
          ')',
    expected: [[3, 3], [], [2, 2]]
  },
  {
    name: 'nested complex 5',
    code: 'match([3, 3, [3, 3], [3, 3], [2, [2, [2, 2, 2]]]],\n' +
          '  [many(when(greaterThan(2))), many([3, 3]), [2,[2,[many(when(greaterThan(1))), _]]]], function() { return Array.prototype.slice.call(arguments, 0);}\n' +
          ')',
    shouldThrow: true
  }
);
