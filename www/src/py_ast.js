"use strict";

(function($B){

// binary operator tokens
var binary_ops = {
    '+': 'Add', '-': 'Sub', '*': 'Mult', '/': 'Div', '//': 'FloorDiv',
    '%': 'Mod', '**': 'Pow', '<<': 'LShift', '>>': 'RShift', '|': 'BitOr',
    '^': 'BitXor', '&': 'BitAnd', '@': 'MatMult'
    }

// boolean operator tokens
var boolean_ops = {'and': 'And', 'or': 'Or'}

// comparison operator tokens
var comparison_ops = {
    '==': 'Eq', '!=': 'NotEq', '<': 'Lt', '<=': 'LtE', '>': 'Gt', '>=': 'GtE',
    'is': 'Is', 'is_not': 'IsNot', 'in': 'In', 'not_in': 'NotIn'}

var unary_ops = {unary_inv: 'Invert', unary_pos: 'UAdd', unary_neg: 'USub', unary_not: 'Not'}

var op_types = $B.op_types = [binary_ops, boolean_ops, comparison_ops, unary_ops]

var _b_ = $B.builtins

var ast = $B.ast = {}

for(var kl in $B.ast_classes){
    var args = $B.ast_classes[kl],
        body = ''
    if(typeof args == "string"){
        if(args.length > 0){
            for(var arg of args.split(',')){
                if(arg.endsWith('*')){
                    arg = arg.substr(0, arg.length - 1)
                    body += ` this.${arg} = $B.$list(${arg} === undefined ? [] : ${arg})\n`
                }else if(arg.endsWith('?')){
                    arg = arg.substr(0, arg.length - 1)
                    body += ` this.${arg} = ${arg}\n`
                }else{
                    body += ` this.${arg} = ${arg}\n`
                }
            }
        }
        var arg_list = args.replace(/[*?]/g, '').split(',')
        ast[kl] = Function(...arg_list, body)
        ast[kl]._fields = args.split(',')
    }else{
        ast[kl] = args.map(x => ast[x])
    }
    ast[kl].$name = kl
}

// Function that creates Python ast instances for ast objects generated by
// method .ast() of classes in py2js.js
$B.ast_js_to_py = function(obj){
    $B.create_python_ast_classes()
    if(obj === undefined){
        return _b_.None
    }else if(Array.isArray(obj)){
        return $B.$list(obj.map($B.ast_js_to_py))
    }else{
        var class_name = obj.constructor.$name,
            py_class = $B.python_ast_classes[class_name],
            py_ast_obj = {
                __class__: py_class
            }
        if(py_class === undefined){
            return obj
        }
        for(var field of py_class._fields){
            py_ast_obj[field] = $B.ast_js_to_py(obj[field])
        }
        py_ast_obj._attributes = $B.fast_tuple([])
        for(var loc of ['lineno', 'col_offset',
                        'end_lineno', 'end_col_offset']){
            if(obj[loc] !== undefined){
                py_ast_obj[loc] = obj[loc]
                py_ast_obj._attributes.push(loc)
            }
        }
        return py_ast_obj
    }
}

$B.ast_py_to_js = function(obj){
    if(obj === undefined || obj === _b_.None){
        return undefined
    }else if(Array.isArray(obj)){
        return obj.map($B.ast_py_to_js)
    }else if(typeof obj == "string"){
        return obj
    }else{
        var class_name = $B.class_name(obj),
            js_class = $B.ast[class_name]
        if(js_class === undefined){
            return obj
        }
        var js_ast_obj = new js_class()
        for(var field of js_class._fields){
            if(field.endsWith('?') || field.endsWith('*')){
                field = field.substr(0, field.length - 1)
            }
            js_ast_obj[field] = $B.ast_py_to_js(obj[field])
        }
        for(var loc of ['lineno', 'col_offset',
                        'end_lineno', 'end_col_offset']){
            if(obj[loc] !== undefined){
                js_ast_obj[loc] = obj[loc]
            }
        }
        return js_ast_obj
    }
}

$B.create_python_ast_classes = function(){
    if($B.python_ast_classes){
        return
    }
    $B.python_ast_classes = {}
    for(var klass in $B.ast_classes){
        $B.python_ast_classes[klass] = (function(kl){
            var _fields,
                raw_fields
            if(typeof $B.ast_classes[kl] == "string"){
                if($B.ast_classes[kl] == ''){
                    raw_fields = _fields = []
                }else{
                    raw_fields = $B.ast_classes[kl].split(',')
                    _fields = raw_fields.map(x =>
                        (x.endsWith('*') || x.endsWith('?')) ?
                        x.substr(0, x.length - 1) : x)
                }
            }
            var cls = $B.make_class(kl),
                $defaults = {},
                slots = {},
                nb_args = 0
            if(raw_fields){
                for(let i = 0, len = _fields.length; i < len; i++){
                    let f = _fields[i],
                        rf = raw_fields[i]
                    nb_args++
                    slots[f] = null
                    if(rf.endsWith('*')){
                        $defaults[f] = []
                    }else if(rf.endsWith('?')){
                        $defaults[f] = _b_.None
                    }
                }
            }
            cls.__match_args__ = $B.fast_tuple(Object.keys(slots))

            cls.$factory = function(){
                var $ = $B.args(klass, nb_args, $B.clone(slots), Object.keys(slots),
                        arguments, $B.clone($defaults), null, 'kw')
                var res = {
                    __class__: cls,
                    _attributes: $B.fast_tuple([])
                }
                for(let key in $){
                    if(key == 'kw'){
                        for(let item of _b_.dict.$iter_items($.kw)){
                            res[item.key] = item.value
                        }
                    }else{
                        res[key] = $[key]
                    }
                }
                if(klass == "Constant"){
                    res.value = $B.AST.$convert($.value)
                }
                return res
            }
            if(_fields){
                cls._fields = _fields
            }
            cls.__mro__ = [$B.AST, _b_.object]
            cls.__module__ = 'ast'
            cls.__dict__ = $B.empty_dict()

            // For fields that end with "?", set class attribute to None
            // Used in ast.dump to skip printing the field
            if(raw_fields){
                for(let i=0, len=raw_fields.length; i < len; i++){
                    var raw_field = raw_fields[i]
                    if(raw_field.endsWith('?')){
                        _b_.dict.$setitem(cls.__dict__, _fields[i], _b_.None)
                    }
                }
            }

            return cls
        })(klass)
    }
}

// Map operators to ast type (BinOp, etc.) and name (Add, etc.)
var op2ast_class = $B.op2ast_class = {},
    ast_types = [ast.BinOp, ast.BoolOp, ast.Compare, ast.UnaryOp]

for(var i = 0; i < 4; i++){
    for(var op in op_types[i]){
        op2ast_class[op] = [ast_types[i], ast[op_types[i][op]]]
    }
}

})(__BRYTHON__);
