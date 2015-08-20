var log_linking = LOG;
var log_linker_restructure = NLOG;
var log_missing = NLOG;
var log_passes = NLOG;

function DataStore()
{
	this.Generics         = {};     //  Mapping of generic conversions to their pseudocode structure
	this.Conversions      = {};     //  Mapping of conversions to its pseudocode
    
    this.Hints            = {};
    this.Specifics        = {};
    this.Types            = {};
    this.Selectors        = {};     //  Mapping of selelctor types to an array of possible selectors
    this.Asks             = {};     //  Contains all asks of each conversion
    this.SubConversions   = {};     //  Contains array of subconversion names
    
    this.Links            = {};     //  Mapping of conversion calls to their location in [Text]
    this.Missing          = {};
    
    this.Tests            = {};
    this.ToRun            = [];     //  Contains all conversions to be run
    
    this.Passes           = [];
    this.PassCompiled     = [];
    
    this.JITName          = function(a){return a;};
    this.JITed            = {};     //  Contains the JIT compiled calls
    
    
    this.Pseudo_Pass= [
        remove_redundant_conversions,
        reorder_answers,
        expand_element,
        tail_call_optimization,
        inline_conversions
    ];
        
    this.JS_Pass = [
        JS_insert_end_tags,
        JS_insert_param_names,
        JS_insert_commas,
        JS_compile
    ];
}

function JIT(Data)
{
    LOG("JITing....");
    
    var total_passes = Data.Pseudo_Pass.length + Data.JS_Pass.length;
    for (var i = 0; i < total_passes; i++)
    {
        LOG("Pass: " + (i+1) + " of " + total_passes);

        var pass = i < Data.Pseudo_Pass.length 
                    ? Data.Pseudo_Pass[i] 
                    : Data.JS_Pass[i - Data.Pseudo_Pass.length];

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

    console.log(Data);
    
    for (var conversion in Data.PassCompiled[0])
    {
        log_passes(["Compiled: " + conversion]);
        if (!(Data.PassCompiled[0][conversion] instanceof Function))
        {
            for (var i = 0; i < Data.PassCompiled.length - 1; i++)
            {
                log_passes([conversion + " Pass: " + i]);
                log_passes(Data.PassCompiled[i][conversion].join("\n"));
                log_passes([]);
            }
        }
        else
        {
            log_passes("FUNCTION");
        }
        log_passes([]);
    }
    
    var conversion_count = 0;
    for (var conversion in Data.PassCompiled[Data.PassCompiled.length-1])
    {
        conversion_count++;
        Data.JITed[Data.JITName(conversion)] = Data.PassCompiled[Data.PassCompiled.length-1][conversion];
    }
    
    LOG("JITed! " + conversion_count + " Conversions");
}

function load_pseudocode(Data, pseudocode)
{
    pseudocode = pseudocode.split("\n")
    
    var name = "";
    var code = [];
    
    for (var i = 0; i < pseudocode.length; i++)
    {
        var ins = pseudocode[i].split(">")[0];
        var data = pseudocode[i].split(">");
		data.shift();
		data = data.join('>');
        switch(ins)
        {
            case "Specification":
            case "Conversion":
                if (name !== ""){
                    load_conversion(Data, name, code);
				}
                name = data;
                code = [pseudocode[i]];
                break;
            case "Inline":
				console.log(data);
                Data.ToRun.push(data);
                break;
            default:
                if (pseudocode[i] !== "")
                    code.push(pseudocode[i]);
                break;
        }
    }
    
    if (name !== "")
        load_conversion(Data, name, code);
}

//  Loads conversion into Linker
function load_conversion(Data, conversion, pseudocode)
{
    //  Split into pseudocode instructions
	if (!(pseudocode instanceof Array)) pseudocode = pseudocode.split("\n");

    //  Conversion is generic
	if (is_generic(conversion)) 
	{
        //  Change array of pseudocode instructions into its structure
		Data.Generics[conversion] = pseudocode;

        for (var ii = 1; ii < pseudocode.length; ii++)
            if (PSins(pseudocode[ii]) !== "Hint")
                break;

        //  If  the conversion is to build a data structure
        //    Then add it to the list of data structure types
		if (pseudocode[ii].split(">")[0] == "Data Structure")
        {
			Data.Types[generic_type(output_of(conversion))] = conversion;
            if (pseudocode[ii].split(">")[1] == "1")
                Data.Specifics[generic_type(output_of(conversion))] = true;
        }
        else if (pseudocode[0].split(">")[0] == "Specification") {
            Data.Types[generic_type(output_of(conversion))] = conversion;
            Data.Specifics[generic_type(output_of(conversion))] = true;
        }
	}
    //  Conversion is not generic
	else 
    {
		Data.Conversions[conversion] = add_conversion(Data, conversion, pseudocode);
        delete Data.Missing[conversion];
    }
}

//  Links all loaded conversions
function link_conversions(Data)
{
    LOG(["LINKING..."]);
    var generic_compiled_count = 0;
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
                var inputs = inputs_of(conversion);
                var output = output_of(conversion);
                if (is_selector(inputs[0]))
                {
                    Data.Hints[conversion] = { TailRecursive:false }; 
                    Data.Conversions[conversion] = [
                        "Conversion>" + conversion,
                        "Switch>0"
                    ];
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
                log_linking(conversion);
                generic_compiled_count++;

    			notDone = true;

                //  Built-in generic call
                if (Data.Generics[generic] instanceof Function)
                {
                    Data.Conversions[conversion] = Data.Generics[generic];
                    Data.Asks[conversion] = Data.Asks[generic];
                }
                //  Replace generic types in generic pseudocode to build a real conversion
    			else
                {
                    //var funct = accepts_selector(Data, conversion);
                    //if (funct)
					//	Data.Conversions[conversion] = funct;
                    //else
                    {
                        var pseudocode = build_conversion(Data, conversion, relocation, Data.Generics[generic], 0);
                        Data.Conversions[conversion] = add_conversion(Data, conversion, pseudocode);
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
	LOG([]);
    LOG("LINKED! " + generic_compiled_count + " Conversions compiled from generics");
    
    if (missing)
    {
        log_missing(["MISSING"]);
        for(var conversion in Data.Missing)
            log_missing(conversion);
        log_missing([]);
    }
    else
    {
        JIT(Data);
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
			/*
            var funct = Data.JITed[Data.JITName(newCall)];
            if (!funct) 
            {
                create_conversion(Data, newCall);
                funct = Data.JITed[Data.JITName(newCall)];
            }
            return funct.apply(this, args);
			*/
			return Interpret(Data, newCall, args, {});
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

    //  Get the inputs and selectors of both conversions
	var inpGen = inputs_of(generic);
	var selGen = selectors_of(generic);
	var inpConv = inputs_of(conversion);
	var selConv = selectors_of(conversion);
	if (inpGen.length !== inpConv.length) return;
	if (selGen.length !== selConv.length) return;

	//  Check that all selectors in 

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
					paramMap[toCheckGen[i]] = toCheckConv[j];
					toCheckGen.splice(i, 1);
					toCheckConv.splice(j, 1);
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

    //  Relocation function for building new pseudocode
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
                    ret += key + ": " + paramMap[key] + "\n";
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

function build_conversion(Data, conversion, relocation, pseudocode, i)
{
    log_linker_restructure(["Restructure"]);

    log_linker_restructure(["GENERIC: " + relocation("Generic")]);
	log_linker_restructure(pseudocode.join('\n'));

    log_linker_restructure(["RELOCATION"]);
    log_linker_restructure(relocation(".PRINT"));
    log_linker_restructure([]);
    
    //  Build the data structure conversion for the output type
    if (Data.Types[output_of(conversion)] === undefined)
    {
        for (var type in Data.Types)
        {
            var gen_type = output_of(Data.Types[type]);
            if (is_generic(gen_type))
            {   
                var genMap = {}
                if (type_match(gen_type, output_of(conversion), genMap))
                {
                    var reloc = function (na, index) { return genMap[index]; };
                    var inputs = inputs_of(Data.Types[type]);
                    var dataType = replace_generic(gen_type, reloc);
                    for (var j = 0; j < inputs.length; j++)
                        dataType += "," + replace_generic(inputs[j], reloc);
                    Data.Missing[dataType] = true;
                    break;
                }
            }
        }
    }

	pseudocode = compile_generic(Data, conversion, relocation, pseudocode, i);	
	pseudocode = order_inputs(Data, conversion, pseudocode, i);
    
    log_linker_restructure([]);
    log_linker_restructure(["CONVERSION: " + conversion]);
	log_linker_restructure(pseudocode.join('\n'));
    log_linker_restructure([]);

    log_linker_restructure([]);

	return pseudocode;
}

function order_inputs(Data, conversion, pseudocode, i) {
	var nc = [];

	var compare = function(a,b) {
		var type = function(pseudocode) {
			if (pseudocode.length > 1) return output_of(pseudocode[0].split(">")[1]);
			else {
				switch(PSins(pseudocode[0])) {
					case "Param":
						return inputs_of(conversion)[parseInt(PSdata(pseudocode[0]))];
                    case "Number":
                        return "Number";
                    case "Character":
                        return "Charachter";
					case "Sub":
						return PSdata(pseudocode[0]).split(",")[1];
					case "Selector":
						return selector_type(PSdata(pseudocode[0]));
					default:
						throw "ORder not implemented " + PSins(pseudocode[0]);
				}
			}
		}
	if (conversion === "MatchString'ClearedWhite',Parser'ClearedWhite',String") {
		var tesat = 1;
	}
		return type(a) < type(b);	
	}

    for (; i < pseudocode.length; i++)
    {
        switch(PSins(pseudocode[i]))
        {
            case "Enter":
            /*
                var inputs = [];
                do
                {
                    var inp = value_at(pseudocode, i+1);
                    inp = order_inputs(conversion, inp, 0);
                    inputs.addInOrder(inp, compare);
                    i += inp.length;
                } while(PSins(pseudocode[i+1]) !== "Call");*/
                var counter = {};
                var inputs = [];
                var answers = [];
                var code = forall_inputs(pseudocode, i, function(bc, i) { 
                    inputs.addInOrder(order_inputs(Data, conversion, bc, i), compare); 
                },
                function(bc, i, answer) { 
                    var nc = order_inputs(Data, conversion, bc, i);
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
                var code = value_at(pseudocode, i+1);
                code = order_inputs(Data, conversion, code, 0);
                nc.push(pseudocode[i]);
                for (var j = 0; j < code.length; j++) nc.push(code[j]);
                i += code.length;
                break;
            default:
                nc.push(pseudocode[i]);
                break;
        }
    }
	return nc;
}

function compile_generic(Data, conversion, relocation, pseudocode, i) {
	var nc = [];
	for (; i < pseudocode.length; i++) {
	    switch(PSins(pseudocode[i])) {
            case "Conversion":
                nc.push(PSins(pseudocode[i]) + ">" + conversion);
                break;
			case "Param":
				nc.push("Param>" + relocation("Param", parseInt(PSdata(pseudocode[i]))));
				break;
			case "Element":
            case "Extract":
				var dataType = inputs_of(conversion)[0];
				if (dataType.indexOf("'") !== -1)
				{
					var dataGenVar = dataType.substring(dataType.indexOf("'") + 1, dataType.length - 1);
					dataType = dataType.substring(0, dataType.indexOf("'"));
				}
				var dataConversion = Data.Types[dataType];
				
				if (dataGenVar)
				{
					var reloc = function() { return dataGenVar; }
					var oInputs = inputs_of(dataConversion);
					var dInputs = [];
					dataConversion = replace_generic(output_of(dataConversion), reloc);
					for (var j = 0; j < oInputs.length; j++)
						dInputs.addInOrder(replace_generic(oInputs[j], reloc));
				}
				else
					dInputs = inputs_of(dataConversion);
				
				for (var j = 0; j < dInputs.length; j++)
					if (dInputs[j] === output_of(conversion))
						nc.push(PSins(pseudocode[i]) + ">" + j);
				break;
			case "Enter":
			case "Call":
				if (PSdata(pseudocode[i]).indexOf('[') !== -1) { 
					var inputs = inputs_of(PSdata(pseudocode[i]));
					var nInputs = [];
					
					for (var j = 0; j < inputs.length; j++) 
						nInputs.addInOrder(replace_generic(inputs[j], relocation));
	
					var newConv = replace_generic(output_of(PSdata(pseudocode[i])), relocation);
					for (var j = 0; j < nInputs.length; j++) newConv += "," + nInputs[j];
					nc.push(PSins(pseudocode[i]) + ">" + newConv);
				}
                else
                {
                    nc.push(pseudocode[i]);
                }
				break;
			case "Sub":
				if (PSdata(pseudocode[i]).indexOf('[') !== -1) { 
					var data = PSdata(pseudocode[i]).split(',');
					nc.push("Sub>" + data[0] + ',' + replace_generic(data[1], relocation));
				}
				else {
					nc.push(pseudocode[i]);
				}
				break;
			default:
				nc.push(pseudocode[i]);
				break;
		}
	}
	return nc;
}

//  Returns pointer to start of conversion in code section
function add_conversion(Data, conversion, pseudocode)
{
    Data.Hints[conversion] = {};
    var nc = [];
    
    var selectors = selectors_of(conversion);
    for (var i = 0; i < selectors.length; i++)
    {
        var sel_type = selector_type(selectors[i]);
        if (!Data.Selectors[sel_type]) Data.Selectors[sel_type] = {};
        Data.Selectors[sel_type][selector_select(selectors[i])] = true;
    }

    var ask_count = 0;
	for (var i = 0; i < pseudocode.length; i++)
	{
		var tmp = pseudocode[i].split(">");
		var ins = tmp[0];
		var data = tmp[1];
		switch(ins)
		{
            case "Hint":
                Data.Hints[conversion][HintIns(data)] = HintData(data);
                break;
			case "Enter":
                nc.push(pseudocode[i]);
                if (data === conversion) Data.Hints[data].Recursive = true;
                if (Data.Conversions[data] === undefined) Data.Missing[data] = true;
				if (!Data.Links[data]) Data.Links[data] = [];
				Data.Links[data].push(conversion + ">" + i);
				break;
            case "Selector":
                nc.push(pseudocode[i]);
                var sel_type = selector_type(data);
                if (!Data.Selectors[sel_type]) Data.Selectors[sel_type] = {};
                Data.Selectors[sel_type][selector_select(data)] = true;
                break;
            case "Ask":
                nc.push(pseudocode[i]);
                if (!Data.Asks[conversion]) Data.Asks[conversion] = {};
                if (Data.Asks[conversion][data] === undefined)
                    Data.Asks[conversion][data] = ask_count++;
                break;
            case "SubConversion":
                nc.push(pseudocode[i]);
                if (!Data.SubConversions[conversion]) Data.SubConversions[conversion] = [];
				var subconv = {};
				subconv.name = data;
				subconv.type = output_of(PSdata(pseudocode[i+1]));
                Data.SubConversions[conversion].push(subconv);
                break;
            case "Data Structure":
                Data.Types[output_of(conversion)] = conversion;
                nc.push(pseudocode[i]);
                break;
            default:
                nc.push(pseudocode[i]);
                break;
		}	
	}	
	if (nc[0].split(">")[0] == "Specification") 
    {
        Data.Types[output_of(conversion)] = conversion;
        Data.Specifics[output_of(conversion)] = true;
    }
    
    return nc;
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

function run_inline()
{
    LOG("Running Inline Conversions");
    function dataifyParamString(str)
    {
        function expand_string(str)
        {
            return [str[0], str.length > 1 ? expand_string(str.substring(1)) : "Nothing"];
        }
        
        str += ",";
        var result = [];
        var bracecount = 0;
        var needs_more_work = false;
        var last_substring = 0;
        
        var in_quotes = false;
        
        for(var i = 0; i < str.length; i++)
        {
            if (in_quotes && str[i] !== '"')
            {
                continue;
            }
            switch(str[i])
            {
                case '"':
                    in_quotes = !in_quotes;
                    break;
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
                    else result.push((substring[0] == '"' && substring[substring.length-1] == '"') ?
                                     expand_string(substring.substring(1, substring.length-1)) :
                                     (substring.length === 0 ? "Nothing" :
                                        isFinite(substring) ? parseInt(substring) : substring));
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

		//var test = Interpret(Data, call, params, {});
        var funct = CALL(Data, call);
        var test = funct.apply(Data.JITed, params);
        test = test !== undefined ? test : "Nothing";
        
        var logStr = assign + ": ";
        
        
        if (output_of(call) == "String") 
        {
            logStr += "\"" + compact_string(test) + "\" ";
        }
        
		console.log(call + " < " + params, test);
        
        logStr += test + " = " + call + " < " + params;

        LOG(logStr);
		LOG("Result: ");
		LOG([output_of(call)]);
		PrettyLogData(test);
		LOG([]);
    }
}

function compact_string(composedStr) {
	if (composedStr == "Nothing") return "";
	return composedStr[0] + compact_string(composedStr[1]);
}

function PrettyLogData(data, tab) {
	if (tab === undefined) tab = "";
	tab += "  ";

	if (data instanceof Array) {
		for (var key in data) {
			if (key == "addInOrder") continue;
			if (!isFinite(parseInt(key))) {
				LOG([key]);
				if (key == "List'Character'")
					PrettyLogData(compact_string(data[key]), tab);
				else
					PrettyLogData(data[key], tab);
				LOG([]);
			}
		}
	}
	else
		LOG(data.toString());
}
