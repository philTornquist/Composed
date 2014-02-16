var log_linker_restructure = NLOG;
var log_missing = NLOG;
var log_jitting = NLOG;

function DataStore()
{
	this.Generics         = {};     //  Mapping of generic conversions to their bytecode structure
	this.Conversions      = {};     //  Mapping of conversions to its bytecode
    
    this.Hints            = {};
    this.Specifics        = {};
    this.Types            = {};
    this.Selectors        = {};     //  Mapping of selelctor types to an array of possible selectors
    this.Asks             = {};     //  Contains all asks of each conversion
    this.SubConversions   = {};     //  Contains array of subconversion names
    
    this.Links            = {};     //  Mapping of conversion calls to their location in [Text]
    this.Missing          = {};
    
    this.ToRun            = [];     //  Contains all conversions to be run
    
    this.Passes           = [];
    this.PassCompiled     = [];
    
    this.JITName          = function(a){return a;};
    this.JITed            = {};     //  Contains the JIT compiled calls
    
    
    this.Passes = [
        remove_redundant_conversions,
        reorder_answers,
        JS_expand_element,
        JS_insert_end_tags,
        JS_insert_param_names,
        JS_insert_commas,
        JS_compile
        
    ];
    /*this.Passes = [
    
    function(Data, conversion, struc) { return build_structure(struc, 0); },
    function(Data, conversion, struc) { return operateAST(Data, struc, undefined, removeRedundantConversions); },
    function(Data, conversion, struc) { return operateAST(Data, struc, undefined, JS_expandElement, conversion); },
    function(Data, conversion, struc) { return operateAST(Data, struc, undefined, JS_reorderAnswers, conversion); },
    function(Data, conversion, struc) { return operateAST(Data, struc, undefined, inlineConversion, conversion); },
    function(Data, conversion, struc) { return operateAST(Data, struc, undefined, JS_addEndConversion); },
    function(Data, conversion, struc) { return operateAST(Data, struc, undefined, JS_insertCommas); },
    function(Data, conversion, struc) { return operateAST(Data, struc, undefined, JS_insertParamNames, conversion); },
    function(Data, conversion, struc) { return operateAST(Data, struc, JS_Compile, undefined, conversion); },
    function(Data, conversion, struc) { 
        var bc = JS_collapse_structure(struc).join("");
        var args = Data.PassCompiled[Data.CurrentPass-2][conversion][1].split(">")[1];
    
        document.getElementById("jsCode").value += "function " + conversion + "(" + args + ") {\n" + bc + "\n}\n\n";
        
        return new Function(args+",$evaluation$", bc);
    } ];*/
}

function load_bytecode(Data, bytecode)
{
    bytecode = bytecode.split("\n")
    
    var name = "";
    var code = [];
    
    for (var i = 0; i < bytecode.length; i++)
    {
        var ins = bytecode[i].split(">")[0];
        var data = bytecode[i].split(">")[1];
        switch(ins)
        {
            case "Specification":
            case "Conversion":
                if (name !== "")
                    load_conversion(Data, name, code);
                name = data;
                code = [bytecode[i]];
                break;
            case "Inline":
                Data.ToRun.push(data);
                break;
            default:
                if (bytecode[i] !== "")
                    code.push(bytecode[i]);
                break;
        }
    }
    
    if (name !== "")
        load_conversion(Data, name, code);
}

//  Loads conversion into Linker
function load_conversion(Data, conversion, bytecode)
{
    //  Split into bytecode instructions
	if (!(bytecode instanceof Array)) bytecode = bytecode.split("\n");

    //  Conversion is generic
	if (is_generic(conversion)) 
	{
        //  Change array of bytecode instructions into its structure
		Data.Generics[conversion] = bytecode;

        //  If  the conversion is to build a data structure
        //    Then add is to the list of data structure types
		if (bytecode[1].split(">")[0] == "Data Structure")
        {
			Data.Types[generic_type(output_of(conversion))] = conversion;
            if (bytecode[1].split(">")[1] == "1")
                Data.Specifics[generic_type(output_of(conversion))] = true;
        }
        else if (bytecode[1].split(">")[0] == "Specification") {
            Data.Types[generic_type(output_of(conversion))] = conversion;
            Data.Specifics[generic_type(output_of(conversion))] = true;
        }
	}
    //  Conversion is not generic
	else 
    {
		Data.Conversions[conversion] = compile_conversion(Data, conversion, bytecode);
        delete Data.Missing[conversion];
    }
}

//  Links all loaded conversions
function link_conversions(Data)
{
    //  False when nothing happened in one iteration of the while loop
	var notDone = true;
    var missing = false;
	while (notDone) {
	    notDone = false;
        missing = false;
        //  For all conversion calls
     	for (var conversion in Data.Missing)
    	{
            if (!is_generic(conversion))
            {
                var funct = accepts_selector(Data, conversion);
                if (funct)
                {
                    Data.Conversions[conversion] = funct;
                    delete Data.Missing[conversion];
                    notDone = true;
                    continue;
                }
            }

            //  Otherwise try to match a generic conversion
    		var relocation = 0;
    		for (var generic in Data.Generics)
    		{
                //  Try to match
     			relocation = generic_match(conversion, generic);

                //  Match failed
    			if (!relocation) continue;

    			notDone = true;

                //  Built-in generic call
                if (Data.Generics[generic] instanceof Function)
                {
                    Data.Conversions[conversion] = Data.Generics[generic];
                    Data.Asks[conversion] = Data.Asks[generic];
                }
                //  Replace generic types in generic bytecode to build a real conversion
    			else
                {
                    var funct = accepts_selector(Data, conversion);
                    if (funct)
                        Data.Conversions[conversion] = funct;
                    else
                    {
                        var bytecode = build_conversion(Data, conversion, relocation, Data.Generics[generic], 0);
                        Data.Conversions[conversion] = compile_conversion(Data, conversion, bytecode);
                    }
                }
    			break;
    		}
            if (relocation)
                delete Data.Missing[conversion];
            else
                missing = true;
    	}
	}
    
    if (missing)
    {
        log_missing(["MISSING"]);
        for(var conversion in Data.Missing)
            log_missing(conversion);
        log_missing([]);
    }
    else
    {
        log_jitting(["JITTING"]);
        
        document.getElementById("bytecode").value = "";
        
        for (var i = 0; i < Data.Passes.length; i++)
        {
            var pass = Data.Passes[i];
            Data.CurrentPass = i;
            if (Data.PassCompiled.length <= i) Data.PassCompiled.push({});
            
            for (var conversion in Data.Conversions)
            {
                if (Data.JITed[Data.JITName(conversion)] !== undefined)
                    continue;
                
                var bc = i >= 1 ? Data.PassCompiled[i-1][conversion] : Data.Conversions[conversion];
            
                Data.PassCompiled[i][conversion] = (bc instanceof Function) ? bc : pass(Data, conversion, bc, 0);
            }
        }
        
        for (var conversion in Data.PassCompiled[1])
            if (!( Data.PassCompiled[1][conversion] instanceof Function))
            document.getElementById("bytecode").value += Data.PassCompiled[1][conversion].join("\n") + "\n\n";
        
        for (var conversion in Data.PassCompiled[Data.PassCompiled.length-1])
            Data.JITed[Data.JITName(conversion)] = Data.PassCompiled[Data.PassCompiled.length-1][conversion];
        
        log_jitting([]);
    }
}

//  Used for calling a conversion that has not been built yet
function create_conversion(Data, conversion)
{
    //  Add this call to all function calls (sort of)
    if (Data.Conversions[conversion]) 
        return true;
        
	Data.Missing[conversion] = true;

	link_conversions(Data);
    return Data.Conversions[conversion] !== undefined;
}

function accepts_selector(Data, conversion) {

    if (conversion == "Point2D,Number,Number,Type")
        var h = 10;
    var inputs = inputs_of(conversion);
	var output = output_of(conversion);
    if (is_selector(inputs[0]))
    {
        return function() {
            var selects = [];
            var newCall = output;
            
            var args = [];
            for (var i = 0; i < arguments.length; i++)
                args.push(arguments[i]);
            
            for (var i = 0; i < inputs.length; i++)
            {
                if (is_selector(inputs[i]))
                {
                    var sel = args.splice(i, 1); 
                    selects.push(sel[0]);
                }
                else
                    newCall += "," + inputs[i];
            }
            
            newCall += ":" + selects.join(",");
            var funct = Data.JITed[Data.JITName(newCall)];
            if (!funct) 
            {
                create_conversion(Data, newCall);
                funct = Data.JITed[Data.JITName(newCall)];
            }
            return funct.apply(this, args);
        }
    }
	return undefined;
}

//  Returns a function that can be polled for relocation information
function generic_match(conversion, generic)
{
	//  Information about the modifications to change [generic] into [conversion]
	var genericName_MAP_type = {};
	var paramMap = {};

    //  Fail if output types dont match
	if (!type_match(output_of(generic),output_of(conversion), genericName_MAP_type)) return;

    //  Match the selectors of the inputs
    var selGen = selectors_of(generic);
    var selConv = selectors_of(conversion);
    if (selGen.length !== selConv.length) return;
    for (var i = 0; i < selGen.length; i++)
        if (selGen[i] !== selConv[i]) return;

    //  Get the inputs of both conversions
	var inpGen = inputs_of(generic);
	var inpConv = inputs_of(conversion);
	if (inpGen.length !== inpConv.length) return;

	//  Lists of remaining inputs that need to be checked
	//    Done this way to provide relocation information about inputs
	var toCheckConv = [];
	var toCheckGen = [];
	for (var i = 0; i < inpGen.length; i++) {
		toCheckConv.push(i);
		toCheckGen.push(i);
        paramMap[i] = i;
	}

	//  Match up all non-generic inputs to [generic]
	for (var i = toCheckGen.length - 1; i >= 0; i--) {
		if (!is_generic(inpGen[toCheckGen[i]])) {
			for (var j = toCheckConv.length - 1; i >= 0; i--) {
				if (inpGen[toCheckGen[i]] === inpConv[toCheckConv[j]]) {
					toCheckGen.splice(i, 1);
					toCheckConv.splice(j, 1);
					paramMap[toCheckGen[i]] = toCheckConv[j];
					break;
				}
			}
			if (j < 0) return;
		}
	}

	//  Tries every combination to find a possible match to the generic inputs of [generic]
	var check_generics = function(checkGen, checkConv, genericName_MAP_type) {
		for(var i = 0; i < checkGen.length; i++)
		for(var j = 0; j < checkConv.length; j++) {
			
			var clone = {};
			for (var key in genericName_MAP_type)
				clone[key] = genericName_MAP_type[key];

			if (type_match(inpGen[checkGen[i]], inpConv[checkConv[j]], clone)) {
				paramMap[checkGen[i]] = checkConv[j];
				var nCheckGen = [];
				var nCheckConv = [];
				for(var k = 0; k < checkGen.length; k++) if (k !== i) nCheckGen.push(checkGen[k]);
				for(var k = 0; k < checkConv.length; k++) if (k !== j) nCheckConv.push(checkConv[k]);
				if (nCheckGen.length == 0 && nCheckConv.length == 0) return clone;
				var res = 0;
				if (res = check_generics(nCheckGen, nCheckConv, clone)) {
					return res;
				}
			}
		}
		return checkGen.length == 0 && checkConv.length == 0 ? genericName_MAP_type : undefined;
	}
	genericName_MAP_type = check_generics(toCheckGen, toCheckConv, genericName_MAP_type);

    //  Matching generic types failed
	if (!genericName_MAP_type) return;

    //  Relocation function for building new bytecode
	return function(element, index) {
		switch(element) {
			case "GenVar":
				return genericName_MAP_type[index];
			case "Param":
				return paramMap[index];
            case "Generic":
                return generic;
            case ".PRINT":
                var ret = "";
                var a = genericName_MAP_type;
                for(var key in genericName_MAP_type)
                    ret += key + ": " + genericName_MAP_type[key] + "\n";
                for(var key in paramMap)
                    ret += key + ": " + paramMap[key];
                return ret;
			default:
				throw "Undefined element of relocation: " + element;
		}
	};
}

function type_match(gen_type, conv_type, genericName_MAP_type) {
    //  Generic types require more work to match
	if (is_generic(gen_type)) {
		var type = generic_type(gen_type);

        //  Fail if the type in the generic type does not match the first part of the real type
		if (type !== conv_type.substring(0, type.length)) return false;

        //  Count the number of subtypes in [gen_type]
        for (var gen_subtypes = 0; gen_type[gen_type.length - 1 - gen_subtypes] == "'"; gen_subtypes++);
        
        //  The rest of the conversion type will replace the generic_variable minus extra subtype '
		var gen_var_value = conv_type.substring(type.length - gen_subtypes, conv_type.length - gen_subtypes);

        //  Fail if [gen_type] is just a generic variable
        //  and the rest does start with a quote
        if (type !== "" && gen_var_value[0] !== "'") return false;

        //  If the [gen_var_value] starts with a quote
        //  strip a quote off either end
        if (gen_var_value[0] === "'") {
			gen_var_value = gen_var_value.substring(1, gen_var_value.length);
			gen_var_value = gen_var_value.substring(0, gen_var_value.length - 1);
		}

        //  If the generic variable has already been assigned a type
        //  check if the new found type matches
		if (genericName_MAP_type[generic_variable(gen_type)]) {
			if (genericName_MAP_type[generic_variable(gen_type)] !== gen_var_value)
				return false;
		}
        //  Otherwise assign the generic variable to [gen_var_value]
		else
			genericName_MAP_type[generic_variable(gen_type)] = gen_var_value;

		return true;
	}
    //  Non-Generic types should just be the same
	else {
		return gen_type === conv_type;
	}
}

function build_conversion(Data, conversion, relocation, bytecode, i)
{
    log_linker_restructure(["Restructure"]);

    log_linker_restructure(["GENERIC: " + relocation("Generic")]);
	log_linker_restructure(bytecode.join('\n'));

    log_linker_restructure(["RELOCATION"]);
    log_linker_restructure(relocation(".PRINT"));
    log_linker_restructure([]);

	bytecode = compile_generic(Data, conversion, relocation, bytecode, i);	
	bytecode = order_inputs(conversion, bytecode, i);
    
    log_linker_restructure([]);
    log_linker_restructure(["CONVERSION: " + conversion]);
	log_linker_restructure(bytecode.join('\n'));
    log_linker_restructure([]);

    log_linker_restructure([]);

	return bytecode;
}

function order_inputs(conversion, bytecode, i) {
	var nc = [];

	var compare = function(a,b) {
		var type = function(bytecode) {
			if (bytecode.length > 1) return output_of(bytecode[0].split(">")[1]);
			else {
				switch(BCins(bytecode[0])) {
					case "Param":
						return inputs_of(conversion)[parseInt(BCdata(bytecode[0]))];
                    case "Number":
                        return "Number";
                    case "Character":
                        return "Charachter";
					default:
						throw "ORder not implemented " + BCins(bytecode[0]);
				}
			}
		}
		return type(a) < type(b);	
	}

    for (; i < bytecode.length; i++)
    {
        switch(BCins(bytecode[i]))
        {
            case "Enter":
            /*
                var inputs = [];
                do
                {
                    var inp = value_at(bytecode, i+1);
                    inp = order_inputs(conversion, inp, 0);
                    inputs.addInOrder(inp, compare);
                    i += inp.length;
                } while(BCins(bytecode[i+1]) !== "Call");*/
                var counter = {};
                var inputs = [];
                var answers = [];
                var code = forall_inputs(bytecode, i, function(bc, i) { 
                    inputs.addInOrder(order_inputs(conversion, bc, i), compare); 
                },
                function(bc, i, answer) { 
                    var nc = order_inputs(conversion, bc, i);
                    nc.unshift("Answer>"+answer); 
                    answers.push(nc); 
                    return [];
                }, counter);
            
                /*for (var j = 0; j < inputs.length; j++)
                    for (var k = 0; k < inputs[j].length; k++)
                        nc.push(inputs[j][k]);*/
                nc.push(code[0]);
                for(var j = 0; j < inputs.length; j++)
                    for (var k = 0; k < inputs[j].length; k++)
                        nc.push(inputs[j][k]);
                
                for(var j = 0; j < answers.length; j++)
                    for (var k = 0; k < answers[j].length; k++)
                        nc.push(answers[j][k]);
                nc.push(code[code.length-1]);
                    
                i += counter.value;
                    
                break;
            case "SubConversion":
                var code = value_at(bytecode, i+1);
                code = order_inputs(conversion, code, 0);
                nc.push(bytecode[i]);
                for (var j = 0; j < code.length; j++) nc.push(code[j]);
                i += code.length;
                break;
            default:
                nc.push(bytecode[i]);
                break;
        }
    }
	return nc;
}

function compile_generic(Data, conversion, relocation, bytecode, i) {
	var nc = [];
	for (; i < bytecode.length; i++) {
	    switch(BCins(bytecode[i])) {
            case "Conversion":
                nc.push(BCins(bytecode[i]) + ">" + conversion);
                break;
			case "Param":
				nc.push("Param>" + relocation("Param", parseInt(BCdata(bytecode[i]))));
				break;
			case "Element":
				var dataType = inputs_of(conversion)[0];
				if (dataType.indexOf("'") !== -1)
				{
					var dataGenVar = dataType.substring(dataType.indexOf("'") + 1, dataType.length - 1);
					dataType = dataType.substring(0, dataType.indexOf("'"));
				}
				var dataConversion = Data.Types[dataType];
				
				if (dataGenVar)
				{
					var relocation = function() { return dataGenVar; }
					var oInputs = inputs_of(dataConversion);
					var dInputs = [];
					dataConversion = replace_generic(output_of(dataConversion), relocation);
					for (var j = 0; j < oInputs.length; j++)
						dInputs.addInOrder(replace_generic(oInputs[j], relocation));
				}
				else
					dInputs = inputs_of(dataConversion);
				
				for (var j = 0; j < dInputs.length; j++)
					if (dInputs[j] === output_of(conversion))
						nc.push("Element>" + j);
				break;
			case "Enter":
			case "Call":
				if (BCdata(bytecode[i]).indexOf('[') !== -1) { 
					var inputs = inputs_of(BCdata(bytecode[i]));
					var nInputs = [];
					
					for (var j = 0; j < inputs.length; j++) 
						nInputs.addInOrder(replace_generic(inputs[j], relocation));
	
					var newConv = replace_generic(output_of(BCdata(bytecode[i])), relocation);
					for (var j = 0; j < nInputs.length; j++) newConv += "," + nInputs[j];
					nc.push(BCins(bytecode[i]) + ">" + newConv);
				}
                else
                {
                    nc.push(bytecode[i]);
                }
				break;
			default:
				nc.push(bytecode[i]);
				break;
		}
	}
	return nc;
}

//  Returns pointer to start of conversion in code section
function compile_conversion(Data, conversion, bytecode)
{
    Data.Hints[conversion] = {};
    
    var selectors = selectors_of(conversion);
    for (var i = 0; i < selectors.length; i++)
    {
        var sel_type = selector_type(selectors[i]);
        if (!Data.Selectors[sel_type]) Data.Selectors[sel_type] = {};
        Data.Selectors[sel_type][selector_select(selectors[i])] = true;
    }

    var ask_count = 0;
	for (var i = 0; i < bytecode.length; i++)
	{
		var tmp = bytecode[i].split(">");
		var ins = tmp[0];
		var data = tmp[1];
		switch(ins)
		{
			case "Enter":
                if (data === conversion) Data.Hints[data].Recursive = true;
                if (Data.Conversions[data] === undefined) Data.Missing[data] = true;
				if (!Data.Links[data]) Data.Links[data] = [];
				Data.Links[data].push(conversion + ">" + i);
				break;
            case "Selector":
                var sel_type = selector_type(data);
                if (!Data.Selectors[sel_type]) Data.Selectors[sel_type] = {};
                Data.Selectors[sel_type][selector_select(data)] = true;
                break;
            case "Ask":
                if (!Data.Asks[conversion]) Data.Asks[conversion] = {};
                if (Data.Asks[conversion][data] === undefined)
                    Data.Asks[conversion][data] = ask_count++;
                break;
            case "SubConversion":
                if (!Data.SubConversions[conversion]) Data.SubConversions[conversion] = [];
                Data.SubConversions[conversion].push(data);
                break;
		}	
	}	
	if (bytecode[1].split(">")[0] == "Data Structure" ||
        bytecode[0].split(">")[0] == "Specification") 
    {
        Data.Types[output_of(conversion)] = conversion;
        if (bytecode[0].split(">")[0] == "Specification")
            Data.Specifics[output_of(conversion)] = true;
    }
    
    return bytecode;
}


function isDataStructureConversion(Data, conversion)
{
	return Data.DataStructures[output_of(conversion)] === conversion;
}

function replace_generic(type, relocation) {
	if (type[0] !== '[') return type;
	if (type[type.length - 1] === ']') return relocation("GenVar", type[1]);
    else if (type[type.length - 1] === "'")
    {
        //  Count quotes in type
        var quotes = "'";
        var index = type.length;
        while ( type[--index] == "'" ) quotes += "'";
        return type.substring(3, index+2) + relocation("GenVar", type[1]) + quotes;
    }
	else return type.substring(3) + "'" + relocation("GenVar", type[1]) + "'";
}


function print_conversions(Data)
{
    for (var conversion in Data.Conversions)
    {
        if (Data.Conversions[conversion] instanceof Function) continue;
        print_structure(build_structure(Data.Conversions[conversion]));
    }
}





function CALL(Data, call) 
{
	var funct = Data.JITed[Data.JITName(call)];
    if (funct === undefined)
    {
      var ip = create_conversion(Data, call);
      funct = Data.JITed[Data.JITName(call)];
    }
	if (funct === undefined)
		throw "Conversion does not exist: " + call;

	return funct;
}

function runInline()
{
    LOG(["Running Inline Conversions"]);
    function dataifyParamString(str)
    {
        str += ",";
        var result = [];
        var bracecount = 0;
        var needs_more_work = false;
        var last_substring = 0;
        for(var i = 0; i < str.length; i++)
        {
            switch(str[i])
            {
                case '[':
                    bracecount++;
                    if (!needs_more_work) last_substring++;
                    needs_more_work = true;
                    break;
                case ']':
                    bracecount--;
                    break;
                case ',':
                    if (bracecount !== 0) break;
                    var substring = str.substring(last_substring, i);
                    if (needs_more_work) result.push(dataifyParamString(substring.substring(0, substring.length-1)));
                    else result.push( isFinite(substring) ? parseInt(substring) : substring);
                    needs_more_work = false;
                    last_substring = i+1;
                    break;
            }
        }
        return result;
    }

    for (var i = 0; i < Data.ToRun.length; i++)
    {
        var split = Data.ToRun[i].split("<");
        var params = dataifyParamString(split[1]);
        
        split = split[0].split('=')
        var call = split[1];
        var assign = split[0];

        var funct = CALL(Data, call);
        var test = funct.apply(Data.JITed, params);
        test = test !== undefined ? test : "Nothing";
        
        var logStr = assign + ": ";
        
        
        if (output_of(call) == "String") 
        {
            function compact_string(composedStr) {
                if (composedStr == "Nothing") return "";
                return composedStr[0] + compact_string(composedStr[1]);
            }
            logStr += "\"" + compact_string(test) + "\" ";
        }
        
        
        logStr += test + " = " + call + " < " + params;
        
        LOG(logStr);
    }
    LOG([]);
}
