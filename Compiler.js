var log_compiler_conversions = NLOG;

Array.prototype.toString = function() {
    ret = "";
    for (var i = 0; i < this.length; i++) {
        if (i !== 0) ret += ",";
        ret += this[i];
    }
    return "[" + ret + "]";
}

Array.prototype.addInOrder = function(value, compare) {
    if (compare === undefined) compare = function (a, b) { return a < b; };

    this.push(0);
    for (var i = this.length - 2; i >= 0 && compare(value, this[i]); i--) {
        this[i+1] = this[i];
    };
    this[i+1] = value;
}

function CodeDef(str) {
    this.str = str;
    this.index = 0;
    this.saves = [];
    this.lineSaves = [];
    this.lineNumber = 1;
    this.save = function() { this.saves.push(this.index); this.lineSaves.push(this.lineNumber)};
    this.restore = function() { this.index = this.saves.pop(); this.lineNumber = this.lineSaves.pop(); };
    this.release = function() { this.saves.pop(); this.lineSaves.pop(); }
    this.get = function() { return this.done() ? '\b' : this.str.charAt(this.index); };
    this.next = function() { this.lineNumber += (this.str.charAt(this.index) == '\n') ? 1 : 0; this.index++; if (this.skipcomment) this.skipcomment(); };
    this.hasNext = function() { return this.index < this.str.length; };
    this.done = function() { return this.index >= this.str.length; };
    this.indexBack = function(i) { var ret = ""; while(this.str.charAt(i) !== '\n' && i > 0) ret = this.str.charAt(--i) + ret; return ret;};
    this.hereBack = function() { var ret = ""; var i = this.index; while( (this.index < i + 150 || this.str[i] !== '\n') && i > 0) ret = this.str[--i] + ret; return "\nCODE:\n"+ret;};
    this.white = function () { ch = this.get(); return ch == ' '|| ch == '\t'|| ch == '\n'; }
    this.clearWhite = function() { while(!this.done() && this.white()) this.next(); }
    this.hereForward = function() { var ret=""; var i=this.index; while(i < this.str.length && (this.index + 50 > i || this.str[i] !== '\n'))ret+=this.str[i++];return "\nCODE:\n"+ret; };
    
    this.skipcomment = function() { if (this.str.charAt(this.index) == '/') { this.index++; while(this.str.charAt(this.index) != '/' && this.str.charAt(this.index) != '\n') this.index++; if (this.str.charAt(this.index) == '/') this.index++; } };
}

function ConversionDefinition(type, output, inputs, selectors, pseudocode) {
    this.output = output;
    this.inputs = inputs;
    this.name = output;

    for (var i = 0; i < inputs.length; i++) this.name += "," + inputs[i];
    if (selectors.length != 0) this.name += ":" + selectors[0];
    for (var i = 1; i < selectors.length; i++) this.name += "," + selectors[i];
    
    this.pseudocode = type + ">" + this.name + "\n" + pseudocode;
}

function compile(str) {
    var code = new CodeDef(str);
    var pseudocode = "";
    var conversions = 0;
    var inlines = 0;

    LOG("Compiling...");

    code.clearWhite();
    while (!code.done()) {
        try {
            var res = parseElement(code);
            pseudocode += res[0];
            conversions += res[1];
            inlines += res[2];
        } catch (e) {
            LOG(e + code.hereBack() + "<ERROR|" + code.hereForward().substring(7));
            return [[],[]];
        }
        code.clearWhite();
    }

    log_compiler_conversions([]);

    LOG("Compiled! " + conversions + " Conversions and " + inlines + " Inline Calls");

    return pseudocode;
}

function parseElement(code) {

    var compiledcode = "";
    var conversions = 0;
    var inlines = 0;
    var start_index = code.index;

    var add = function(type, output, inputs, selectors, pseudocode) {
        compiledcode += new ConversionDefinition(type, output, inputs, selectors, pseudocode).pseudocode + "\n";
        conversions++;
    }

    var genericVar_MAP_name = {};
    var output = parseConversionType(code, genericVar_MAP_name);
    code.clearWhite();

    switch (code.get()) {

        //  Case for Definition
        case 'i':
            code.next();
            if (code.get() != 's') throw "Expected keyword 'is' but found 'i" + code.get() + "'";
            var types = [];
            do {
                code.next();
                code.clearWhite();

                //  Generic type
                if (code.get() == "'") {
                    code.next();
                    code.clearWhite();
                    var type = "[A]" + output + "." + parseLiteral(code);
                    code.clearWhite();
                    if (code.get() !== "'") throw code.lineNumber + ": Expected a \"'\" here";
                    code.next();
                }

                //  Actual type
                else {
                    var type = parseConversionType(code, genericVar_MAP_name);
                }
                
                for (var i = 0; i < types.length; i++)
                    if (types[i] == type)
                        throw code.lineNumber + ": Data type without unique types";
                
                types.addInOrder(type);
                code.clearWhite();
            } while(code.get() == ',');

            switch(types.length) {
                case 0:
                    throw "Definition of \"" + output + "\" does not contain any types";
                    break;

                //  The conversion is a Specification
                case 1:

                    //  Find the conversion
                    var pseudocode = 0;
                    if (code.get() == ':') {
                        code.next();
                        code.clearWhite();
                        pseudocode = parseConversion(code, {"value":0}, {"value":types[0]}, {}, {}, {}).pseudocode();
                        
                        add("Specification",
                            output,
                            types,
                            [],
                            pseudocode);    
                    }
                    else {
                        pseudocode = "Data Structure>1\n";
                        
                        add("Conversion",
                            output,
                            types,
                            [],
                            pseudocode);    
                    }
                    break;

                //  The conversion is a Combination
                default:
                    if (code.get() == ':') throw "Combination definition cannot contain a conversion";
                    add("Conversion",
                        output,
                        types,
                        [],
                        "Data Structure>" + types.length + "\n");
                   break;
            }

            for (var i = 0; i < types.length; i++) {
                add("Conversion",
                    types[i], 
                    [output], 
                    [],
                    "Element>" + i + "\nParam>0\nExtract>" + i + "\n");

                if (types.length == 1) continue;
                
                var injectArray = [types[i]];
                injectArray.addInOrder(output);

                var injectSig = output + "," + types.join(',');
                if (injectSig == output + "," + injectArray.join(','))
                    continue;

                var pseudocode = "Enter>" + injectSig;

                pseudocode += "\n";
                for (var j = 0; j < types.length; j++)
                {
                    if (j == i)
                    {
                        pseudocode += "Param>" + (injectArray[0] == types[j] ? 0 : 1) + "\n";
                    }
                    else
                    {
                        pseudocode += "Enter>" + types[j] + "," + output + "\n";
                        pseudocode += "Param>" + (injectArray[0] == output ? 0 : 1) + "\n";
                        pseudocode += "Call>" + types[j] + "," + output + "\n";
                    }
                }
                pseudocode += "Call>" + injectSig;
                
                pseudocode += "\n";

                add("Conversion",
                    output,
                    injectArray,
                    [],
                    pseudocode);
            }

            break;
        //  Case for Conversion
        case 'f':
            var keyword = "";
            code.next();
            keyword += code.get();
            code.next();
            keyword += code.get();
            code.next();
            keyword += code.get();
            if (keyword != "rom") throw code.lineNumber + ": Expected keyword 'from' but found 'f" + keyword + "'";

            var varname_MAP_number = {};
            var varname_MAP_type = {};
            var inputs = [];
            var selectors = [];
            do {
                code.next();

                code.clearWhite();
                var type = parseConversionType(code, genericVar_MAP_name);
                
                code.clearWhite();
                switch(code.get()) {
                    case '(':
                        code.next();
                        
                        code.clearWhite();
                        var varname = parseLiteral(code);

                        varname_MAP_type[varname] = type;
                        inputs.addInOrder(type);

                        code.clearWhite();
                        if (code.get() != ')') throw code.lineNumber + ": Expected ')'  " + code.hereBack();
                        code.next();
                        break;
                    case '-':
                        if (type.indexOf("'") != -1 && type.indexOf('[') != -1) 
                            throw code.lineNumber + ": Selector cannot have generic parameters  " + code.hereBack();
                        code.next();

                        var selector = parseLiteral(code);
                        selectors.addInOrder(selector + "-" + type, function(a, b){
                            var aTic = a.indexOf("-");
                            var bTic = b.indexOf("-");
                            var aType = a.substring(aTic+1, a.length);
                            var bType = b.substring(bTic+1, b.length);
                            if (aType == bType) {
                                return a.substring(0, aTic) < a.substring(0, bTic);
                            }
                            return aType < bType;
                        });
                        break;
                    default:
                        throw code.lineNumber + ": Expected '('  " + code.hereBack();
                        break;
                } 
                
                code.clearWhite();
            } while (code.get() == ',');
            if (code.get() != ':') throw code.lineNumber + ": Expected ':' at the end of conversion definition  " + code.hereBack();
            code.next();
            code.clearWhite();

            var skip = {};
            for (var key in varname_MAP_type) {
                var type = varname_MAP_type[key];
                for (var i = 0; i < inputs.length; i++) {
                    if (inputs[i] == type && !skip[i]) break;
                }
                skip[i] = true;
                varname_MAP_number[key] = i;
            }

            var subconv_MAP_number = {"_COUNT":0};
            var subconv_MAP_type = {};
            var subConversions = parseSubConversions(code, varname_MAP_number, varname_MAP_type, genericVar_MAP_name, subconv_MAP_number, subconv_MAP_type);

            add("Conversion",
                output, 
                inputs, 
                selectors, 
                subConversions + 
                parseConversion(code, varname_MAP_number, varname_MAP_type, genericVar_MAP_name, subconv_MAP_number, subconv_MAP_type).pseudocode());
            //  Remember to seperate selectors from input
            //    and log the selector type as a valid type
            break;
        //  Case for impure mode call
        case '=':
            code.next();
            code.clearWhite();
            var call = [];
            do {
                code.clearWhite();
                call.push(parseType(code));
                code.clearWhite();
            } while (code.get() == ',' && (code.next() || true));
            code.clearWhite();
            var data = "";
            while (code.get() != ':') { data += code.get(); code.next(); }
            code.next();
            compiledcode += "Inline>" + output + "=" + call.join(',') + "<" + data + "\n";
            inlines++;
    }

    log_compiler_conversions(["Compiled Element"]);
    log_compiler_conversions(["Source Code"]);
    log_compiler_conversions(code.str.substring(start_index, code.index).replace(/^\n*$/g,""));
    log_compiler_conversions([]);
    log_compiler_conversions(["Pseudo Code"]);
    log_compiler_conversions(compiledcode.replace(/^\n*$/g,""));
    log_compiler_conversions([]);
    log_compiler_conversions([]);

    return [compiledcode, conversions, inlines];
}

function VariableConversion(varNumber, type) {
    this.varNumber = varNumber;
    this.type = type;
    this.pseudocode = function() {
        return "Param>" + this.varNumber + "\n";
    };
}

function SubConversion(subNumber, type) {
    this.subNumber = subNumber;
    this.type = type;
    this.pseudocode = function() {
        return "Sub>" + this.subNumber + "\n";
    };
}

function ConstantConversion(constantStr) {
    if (isNaN(constantStr)) {
        if (constantStr == "Nothing") {
            this.type = "Nothing";
            this.pseudocode = function() {
                //return "Ask>Nothing" + "\n";
                return "Nothing>\n";
            }
        }
        else if (constantStr[0] == '"') {
            this.type = "Character";
            this.pseudocode = function() {
                return "Character>" + constantStr.substring(1, constantStr.length-1) + "\n";
            };
        }
        else
        {
            throw "Unknown constant: " + constantStr;
        }
    }
    else {
        this.type = "Number";
        this.pseudocode = function() {
            return "Number>" + parseFloat(constantStr) + "\n";
        };
    }
}

function SelectorConversion(selector, type) {
    this.type = "-" + type;
    this.selector = selector;
    this.pseudocode = function() {
        return "Selector>" + this.type.substring(1) + "-" + this.selector + "\n";
    };
}

function AskConversion(caseName, type) {
    this.type = type;
    this.caseName = caseName;
    this.pseudocode = function() {
        return "Ask>" + caseName + "\n";
    }
}

function AnswersConversion(case_MAP_conversion) {
    this.case_MAP_conversion = case_MAP_conversion;
    this.pseudocode = function() {
        var bc = "";
        for (var key in this.case_MAP_conversion) {
            bc += "Answer>" + key + "\n";
            bc += this.case_MAP_conversion[key].pseudocode();
        }
        return bc;
    }
}

function InjectionConversion(value, injectInTo) {
    this.value = value;
    this.injectInTo = injectInTo;
    this.type = this.injectInTo.type;
    
    this.value.containing = this;
    this.injectInTo.containing = this;
    
    this.pseudocode = function() {
        var inputs = [this.type];
        inputs.addInOrder(this.value.type);
        var conversion = this.type + "," + inputs.join(",");
        var bc = "Enter>" + conversion + "\n";
        
        if (inputs[0] == this.value.type) {
          bc += this.value.pseudocode();
          bc += this.injectInTo.pseudocode();
        }
        else {
          bc += this.injectInTo.pseudocode();
          bc += this.value.pseudocode();
        }
        
//        bc += "Inject>" + this.injectInTo.type + "," + inputs[0] + "," + inputs[1] + "\n";
        bc += "Call>" + conversion + "\n";
        return bc;
    }
}

function ActualConversion(output, inputs) {
    this.type = output;
    this.output = output;
    this.inputs = inputs;

    for (var i = 0; i < this.inputs.length; i++) {
        this.inputs[i].containing = this;
        var next = this.inputs[i].input;
        while(next) {
            next.containing = this;
            next = next.input;
        }
    }

    this.pseudocode = function() {
        var bc = "Enter>" + this.signature + "\n";

        for(var i = 0; i < this.inputs.length; i++) {
            bc += this.inputs[i].pseudocode();
        }
        
        if (this.answers) bc += this.answers.pseudocode();
        
        bc += "Call>" + this.signature + "\n";

        return bc;
    };
    this.signature = output;
    for (var i = 0 ; i < inputs.length; i++)
        this.signature += "," + inputs[i].type;
}

function ContinuationConversion(output, input) {
    this.type = output;
    this.output = output;
    this.input = input;
    this.input.nextStage = this;
    this.pseudocode = function() {
        var bc = "Enter>" + this.signature + "\n";
        bc += this.input.pseudocode();
        if (this.answers) bc += this.answers.pseudocode();
        bc += "Call>" + this.signature + "\n";
        return bc;
    };
    this.signature = this.output + "," + this.input.type;
}

function parseSubConversions(code, varname_MAP_number, varname_MAP_type, genericVar_MAP_name, subconv_MAP_number, subconv_MAP_type) {
    code.clearWhite();
    code.save();
    
    try {
    var subname = parseLiteral(code);
    } catch(e) { code.restore(); return ""; }
    if (subconv_MAP_number[subname] !== undefined) { throw code.lineNumber + "Multiple subconversions definitions for " + subname + ". " + code.hereBack(); }
    
    subconv_MAP_number[subname] = subconv_MAP_number["_COUNT"]++;
    code.clearWhite();
    
    if (code.get() !== ':') { code.restore(); delete subconv_MAP_number[subname]; return ""; }
    code.next();
    code.clearWhite();
    
    var pseudocode = parseConversion(code, varname_MAP_number, varname_MAP_type, genericVar_MAP_name, subconv_MAP_number, subconv_MAP_type);
    subconv_MAP_type[subname] = pseudocode.output;
    
    code.release();
    return "SubConversion>" + subname + "\n" + pseudocode.pseudocode() + parseSubConversions(code, varname_MAP_number, varname_MAP_type, genericVar_MAP_name, subconv_MAP_number, subconv_MAP_type);
}

function parseConversion(code, varname_MAP_number, varname_MAP_type, genericVar_MAP_name, subconv_MAP_number, subconv_MAP_type) {

    //  Inital conversion that can have more conversions applied to its result
    var initalConversion = undefined;

    switch(code.get()) {

        //  Case of a multiple argument conversion
        case '[':
            var inputs = [];
            do {
                code.next();
                code.clearWhite();
                var input = parseConversion(code, varname_MAP_number, varname_MAP_type, genericVar_MAP_name, subconv_MAP_number, subconv_MAP_type);
                inputs.addInOrder(input, function(a, b) { 
                    /*if (a.selector && b.selector) {
                        if (a.type == b.type)
                            return a.selector < b.selector;
                        else
                            return a.type < b.type; 
                    }
                    else if (a.selector) {
                        return false;
                    }
                    else if (b.selector) {
                        return true;
                    }
                    else {
                        return a.type < b.type; 
                    }*/
                    return a.type < b.type; 
                });
                code.clearWhite();
            } while(code.get() == ',');
            if (code.get() != ']') throw code.lineNumber + ": Expected ']' to complete conversion  " + code.hereBack();
            code.next();
            code.clearWhite();
            if (code.get() != '>') throw code.lineNumber + ": Expected '>' in multiple argument conversion but got '" + code.get() + "'    " + code.hereBack();
            code.next();
            code.clearWhite();
            initalConversion = new ActualConversion(parseConversionType(code, genericVar_MAP_name), inputs);
            code.clearWhite();
            if (code.get() == "{") {
                initalConversion.answers = parseAnswers(code, varname_MAP_number, varname_MAP_type, genericVar_MAP_name, subconv_MAP_number, subconv_MAP_type);
                code.clearWhite();
            }
            break;

        //  Case of an ask
        case '{':
            code.next();
            code.clearWhite();
            var caseName = parseLiteral(code);
            code.clearWhite();
            var type = parseType(code);
            code.clearWhite();
            if (code.get() != '}') throw code.lineNumber + ": Expected '}' in multiple argument conversion but got '" + code.get() + "'    " + code.hereBack();
            code.next();
            initalConversion = new AskConversion(caseName, type);
            break;

        // Case of an injection
        case '(':
            code.next();
            code.clearWhite();
            var value = parseConversion(code, varname_MAP_number, varname_MAP_type, genericVar_MAP_name, subconv_MAP_number, subconv_MAP_type);
            code.clearWhite();
            if (code.get() != '-') throw code.lineNumber + ": Unexpected '" + code.get() + "'";
            code.next();
            if (code.get() != '>') throw code.lineNumber + ": Unexpected '" + code.get() + "'";
            code.next();
            code.clearWhite();
            var injectInTo = parseConversion(code, varname_MAP_number, varname_MAP_type, genericVar_MAP_name, subconv_MAP_number, subconv_MAP_type);
            code.clearWhite();
            if (code.get() != ')') throw code.lineNumber + ": Unexpected '" + code.get() + "'";
            code.next();
            initalConversion = new InjectionConversion(value, injectInTo);
            break;

        default:
            var paramOrConstant = parseLiteral(code);
            
            //  [paramOrConstant] is the first name of a selector
            if (code.get() == '-') {
                code.next();
                var type = parseLiteral(code);
                initalConversion = new SelectorConversion(paramOrConstant, type);
            }
            
            //  [paramOrConstant] is a constant
            else if (varname_MAP_number[paramOrConstant] === undefined &&
                     subconv_MAP_number[paramOrConstant] === undefined) {
                initalConversion = new ConstantConversion(paramOrConstant);
            }

            //  [paramOrConstant] is a parameter
            else if (varname_MAP_number[paramOrConstant] !== undefined) {
                initalConversion = new VariableConversion(
                    varname_MAP_number[paramOrConstant],
                    varname_MAP_type[paramOrConstant]);
            }
            
            else if (subconv_MAP_number[paramOrConstant] !== undefined) {
                initalConversion = new SubConversion(
                    subconv_MAP_number[paramOrConstant],
                    subconv_MAP_type[paramOrConstant]);
            }
            else {
                throw "Cannot find thing";
            }
            break;
    }

    code.clearWhite();
    while (code.get() == '>') {
        code.next();
        code.clearWhite();
        initalConversion = (initalConversion.signature) ?
            new ContinuationConversion(parseConversionType(code, genericVar_MAP_name),  initalConversion) :
            new ActualConversion      (parseConversionType(code, genericVar_MAP_name), [initalConversion]);
        code.clearWhite();
        if (code.get() == "{") {
            initalConversion.answers = parseAnswers(code, varname_MAP_number, varname_MAP_type, genericVar_MAP_name, subconv_MAP_number, subconv_MAP_type);
            code.clearWhite();
        }
    }

    return initalConversion;
}

function parseAnswers(code, varname_MAP_number, varname_MAP_type, genericVar_MAP_name, subconv_MAP_number, subconv_MAP_type) {
    //  Doesn't parse inputs given by Ask; only inputs to the original function
    code.next();
    var case_MAP_conversion = {};
    do {
        code.clearWhite();
        var caseName = parseLiteral(code);
        code.clearWhite();
        if (code.get() != ':') throw code.lineNumber + "Expected ':' after " + code.hereBack();
        code.next();
        code.clearWhite();
        var conv = parseConversion(code, varname_MAP_number, varname_MAP_type, genericVar_MAP_name, subconv_MAP_number, subconv_MAP_type);
        case_MAP_conversion[caseName] = conv;
        code.clearWhite();
    } while (code.get() != "}");
    code.next();
    return new AnswersConversion(case_MAP_conversion);
}

function parseConversionType(code, genericVar_MAP_name) {
    var type = "";

    //  Parse the generic element if it exists
    if (code.get() == '[') {
        code.next();
        var genericVar = parseLiteral(code);

        if (!genericVar_MAP_name[genericVar]) {
            var count = 0;
            for (key in genericVar_MAP_name) count++;
            genericVar_MAP_name[genericVar] = createGenericNameFromCount(count);
        }
        type += "[" + genericVar_MAP_name[genericVar] + "]";
        
        if (code.get() != ']') throw "Expected ']' but found '" + code.get() + "'";
        code.next();
    }
    try {
        type += parseType(code);
    } catch(e) {
        if (type == "") {
            if (code.get() == '-') {
                code.next();
                return "-" + parseLiteral(code);
            }
            else {
                throw e + code.hereBack();
            }
        }
    }
    return type;
}

function parseDefinitionType(code) {
    return parseLiteral(code) + parseQuotedType(code);
}
/*
function parseQuotedType(code) {
     var nested = 0;            //  How many type specifications to expect
    var type = "";            //  Final type name

    //  Find how many type specifications there are by counting the preceding single quotes
    while (code.get() == "'") { nested++; code.next(); type += "'"; }

    //  Pull out each literal for the type specification
    //  While loop does not run if there are not type specifications
    while (--nested >= 0) {
        type += parseLiteral(code);

        //  Make sure a single quote is present to finish the type specification
        if (code.get() != "'") throw "Expected \"'\" but found \"" + code.get() + "\"";
        code.next();
        type += "'";
    }
    return type;
}
*/
//  List ' Number ' from Number
function parseQuotedType(code) {
    code.save();
    code.clearWhite();
    if (code.get() !== "'") { code.restore(); return ""; }
    //code.release();
    code.next();
    code.clearWhite();
    var count = 0;
    var type = "";
    while(true) {
        try {
            code.save();
            code.clearWhite();
            var t = parseLiteral(code);
            code.clearWhite();
            if (code.get() !== "'") { code.restore(); break; }
            code.next();
            code.release();
            count++;
            type += "'" + t;
        }
        catch (e) {
            code.restore();
            break;
        }
    }
    while (count > 1) {
        code.clearWhite();
        if (code.get() !== "'") 
        {
            var errorToBe = "Expected \"'\" but found \"" + code.get() + "\"" + " " + type;

            //  Case of TYPE'SUB' ends a function and the next function returns TYPE'SUB'
            //    Compiler thinks its one big type but doesn't end with the appropriate
            //    number of quotes
            try
            {
                code.restore();
                code.save();
                code.clearWhite();
                if (code.get() !== "'") throw "a"; 
                code.next();
                code.clearWhite();
                type = "'" + parseLiteral(code);
                code.clearWhite();
                if (code.get() !== "'") throw "b"; 
                code.next();
                return type + "'";
            } catch(e) { code.restore(); throw e +errorToBe; }
        }
        type += "'";
        code.next();
        count--;
    }
    return type + "'";
}

function parseType(code) {
    return parseLiteral(code) + parseQuotedType(code);
}

function parseGeneric(code) {
    if (code.get() != "'") throw "Expected \"'\" but found \"" + code.get() + "\"";
    code.next();
    var generic = parseLiteral(code);
    if (code.get() != "'") throw "Expected \"'\" but found \"" + code.get() + "\"";
    return generic;
}

function parseLiteral(code) {
    var literal = "";
    var isQuoted = code.get() === '"';
    while(
        //  Tokens that are not allowed in literals
        isQuoted || (
        !code.done() && (
        !code.white() && 
        code.get() != ':' && 
        code.get() != ',' &&
        code.get() != '(' &&
        code.get() != ')' &&
        code.get() != '[' &&
        code.get() != ']' &&
        code.get() != "'" &&
        code.get() != '-' &&
        code.get() != '{' &&
        code.get() != '}' &&
        code.get() != '>'))) 
    {
        literal += code.get();
        code.next();

        if (isQuoted && code.get() == '"') { literal += '"'; code.next(); break; }
        if (isQuoted && code.done()) throw "Expected \" to complete string";
    }
    if (literal == "") throw code.lineNumber + ": Expected literal but found nothing  " + code.hereBack();
    return literal;
}

function createGenericNameFromCount(count) {
    switch(count) {
        case 0: return "A";
        case 1: return "B";
        case 2: return "C";
        case 3: return "D";
        case 4: return "E";
        case 5: return "F";
        case 6: return "G";
        case 7: return "H";
        default: return "SUCKS";
    }
}

function Test(str) {
    print("::Test::");
    print(str);
    print("\n");
    var results = parse(str);
    for (var i = 0; i < results[0].length; i++) {
        print("\t\t" + results[0][i].name + "\n" + results[0][i].pseudocode);
    }
    print("\n");
}
