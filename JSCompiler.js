var log_js_execution = NLOG;
var log_js_compilation = log_jitting == NLOG ? NLOG: NLOG;

function js_conversion_rename(conversion) {
    return conversion.replace(/'/g,"_").replace(/,/g,"$").replace(/-/g,"_$_");
}

function JS_collapse_structure(struc, nc)
{
	if (!nc) nc = [];
	for (var i = 0; i < struc.length; i++) {
		if (struc[i] instanceof Array) JS_collapse_structure(struc[i], nc);
        else if (struc[i].indexOf("IGNORE") === 0) 
            nc.push(struc[i].split(">")[1]);
		else nc.push(struc[i]);
	}
	return nc;
}


function JS_insert_end_tags(Data, conversion, bytecode, i)
{
    var nc = [];
    var addReturn = BCins(bytecode[0]) == "Conversion" ||
                    BCins(bytecode[0]) == "Specification";
    for (; i < bytecode.length; i++)
    {
        switch(BCins(bytecode[i]))
        {
            case "Answer":
                nc.push(bytecode[i]);
                var code = value_at(bytecode, i+1);
                for (var j = 0; j < code.length; j++)
                    nc.push(code[j]);
                i += code.length;
                nc.push("IGNORE>;\n}");
                break;
            case "SubConversion":
                nc.push(bytecode[i]);
                var code = value_at(bytecode, i+1);
                i += code.length;
                
                code = JS_insert_end_tags(Data, conversion, code, 0);
                for (var j = 0; j < code.length; j++)
                    nc.push(code[j]);
                nc.push("IGNORE>;");
                break;
            case "Conversion":
            case "Specification":
            case "Hint":
                nc.push(bytecode[i]);
                break;
            default:
                if (addReturn) nc.push("IGNORE>return ");
                addReturn = false;
                nc.push(bytecode[i]);
                break;
        }
    }
    
    if (BCins(bytecode[0]) == "Conversion" || BCins(bytecode[0]) == "Specification")
        nc.push("IGNORE>;");
    
    return nc;
}
/*
function JS_addEndConversion(Data, struc) {
    var ins = struc[0].split(">")[0];
    if (ins == "Conversion")
    {
        var nc = []
        for (var i = 0; i < struc.length; i++) {
            if (struc[i].indexOf("SubConversion") == 0)
            {
                nc.push([struc[i], struc[++i], "End SubConversion>"]);
            }
            else 
            {
                if (i == struc.length - 1)
                    nc.push("Return>");
                nc.push(struc[i]);
            }
        }
        nc.push("End Conversion>");
        return nc;
    }
    else
        return struc;
}*/


function JS_insert_param_names(Data, conversion, bytecode, i)
{
    if (BCins(bytecode[i]) !== "Conversion" &&
        BCins(bytecode[i]) !== "Specification")
        return;
        
    var inputs = inputs_of(conversion);
    var count = 1;
    var args = [inputs[0].replace(/'/g,"_").replace(/-/g,"_$_")+count];
    for (var j = 1; j < inputs.length; j++)
    {
        if (inputs[j] == inputs[j-1])
            count++;
        else
            count=1;
        args.push(inputs[j].replace(/'/g,"_").replace(/-/g,"_$_") + count);
    }
    
    for (var ask in Data.Asks[conversion])
        args.push("$"+ask);
        
    var nc = [];
    
    nc.push(bytecode[i]);
    nc.push("Arguments>"+args.join(","));
        
    for (i++; i < bytecode.length; i++)
    {
        switch(BCins(bytecode[i]))
        {
            case "Param":
                nc.push(BCins(bytecode[i]) + ">" + args[parseInt(BCdata(bytecode[i]))]);
                break;
            case "Sub":
                nc.push(BCins(bytecode[i]) + ">" + Data.SubConversions[conversion][parseInt(BCdata(bytecode[i]))]);
                break;
            default:
                nc.push(bytecode[i]);
                break;
        }
    }
    
    return nc;
}


/*function JS_insertParamNames(Data, struc, call, extras)
{
    if (struc[0].split(">")[0] !== "Conversion") return struc;
    
    var inputs = inputs_of(call);
    var count = 1;
    var args = [inputs[0].replace(/'/g,"_").replace(/-/g,"_$_")+count];
    for (var i = 1; i < inputs.length; i++)
    {
        if (inputs[i] == inputs[i-1])
            count++;
        else
            count=1;
        args.push(inputs[i].replace(/'/g,"_").replace(/-/g,"_$_") + count);
    }
    
    for (var ask in Data.Asks[call])
        args.push("$"+ask);
        
    var bc = operateAST(Data, struc, function(Data, ins, data, args)
    {   
        var nc = [];
        
        if (ins == "Param")
        {
            nc.push(ins + ">" + args[parseInt(data)]);
        }
        else if (ins == "Sub")
        {
            nc.push(ins + ">" + Data.SubConversions[call][parseInt(data)]);
        }
        else
        {
            nc.push(ins + ">" + data);
        }
        return nc;
    }, undefined, args);
    
    var nc = [bc[0], "Arguments>"+args.join(",")];
    for (var i = 1; i < bc.length; i++)
    {
        nc.push(bc[i]);
    }
    return nc;
}*/

function JS_insert_commas(Data, conversion, bytecode, i)
{
    var nc = [];
    for (; i < bytecode.length; i++)
    {
        if (BCins(bytecode[i]) == "Enter")
        {
            var ans = [];
            var counter = {};
            var first_param = false;
            var commas_to_insert = inputs_of(BCdata(bytecode[i])).length - 1;
            var code = forall_inputs(bytecode, i,
                function(bc, i) 
                { 
                    var nc = JS_insert_commas(Data, conversion, bc, i);
                    if (first_param)
                    {
                        if (commas_to_insert-- > 0) 
                            nc.unshift("IGNORE>,\n");
                    }
                    else
                        first_param = true;
                        
                    return nc;
                },
                function(bc, i, answer)
                {
                    var nc = JS_insert_commas(Data, conversion, bc, i);
                    
                    ans.push("IGNORE>,\n");
                    ans.push("Answer>" + answer);
                    
                    for (var j = 0; j < nc.length; j++)
                        ans.push(nc[j]);
                    
                    return [];
                }, counter);
            
            i += counter.value;
            
            
            var callIns = code.pop();
            for (var j = 0; j < code.length; j++)
                nc.push(code[j]);
            for (var j = 0; j < ans.length; j++)
                nc.push(ans[j]);
                
            nc.push(callIns);
        }
        else
            nc.push(bytecode[i]);
    }
    
    return nc;
}
    /*
  insertCommas
    var nc = [];
    var started = false;
    var firstParam = false;
    
    for (var i = 0; i < struc.length; i++)
    {
        var ins = (struc[i] instanceof Array) ? "" : struc[i].split(">")[0];
        
        if (started)
        {
            if (firstParam)
            {
                if (ins === "Call")
                    started = false;
                else
                    nc.push("IGNORE>,\n");
            }
            else
                firstParam = true;
        }
        
        if (ins === "Enter")
            started = true;
            
        nc.push(struc[i]);
    }
    return nc;
}*/

function JS_expand_element(Data, conversion, bytecode, i)
{
    var nc = [];
    for (; i < bytecode.length; i++)
    {
        if (BCins(bytecode[i]) == "Element")
        {
            var typeconv = Data.Types[inputs_of(conversion)[0]];
            if (typeconv && 
                (Data.Conversions[typeconv][1] == "Data Structure>1" ||
                 BCins(Data.Conversions[typeconv][0]) == "Specification"))
                nc.push("Param>0");
            else
            {
                nc.push("IGNORE>function(r){if (r === undefined) throw 'err'; return r==\"Nothing\"?\"Nothing\":");
                nc.push("IGNORE>r["+BCdata(bytecode[i])+"];");
                nc.push("IGNORE>}(");
                nc.push("Param>0");
                nc.push("IGNORE>)");
            }
        }
        else
            nc.push(bytecode[i]);
    }
    return nc;
}



/*
function JS_expandElement(Data, struc)
{
    if (!(struc[1] instanceof Array) &&
        struc[1].split(">")[0] === "Element")
    {
        var clone = [];
        for (var i = 0; i < struc.length; i++)
            clone.push(struc[i]);
            
        
        if (Data.Specifics[inputs_of(struc[0].split(">")[1])[0]])
        {
            clone[1] = "Param>0";
        }
        else
        {
            clone[1] = ["IGNORE>function(r){return r==\"Nothing\"?\"Nothing\":",
                        "IGNORE>r["+struc[1].split(">")[1] + "]",
                        "IGNORE>}(",
                        "Param>0",
                        "IGNORE>)"];
        }
        return clone;
    }
    return struc;
}*/

function JS_compile(Data, conversion, bytecode, i)
{
    var jsString = "";
    var arguments = "";
    for(; i < bytecode.length; i++)
    {
        var ins = BCins(bytecode[i]);
        var data = BCdata(bytecode[i]);
        switch (ins) {
            case "Arguments":
                arguments = data;
                break;
            case "SubConversion":
                jsString += "var " + data + " = ";
                break;
            case "Enter":
                jsString += "this." + js_conversion_rename(data) + "(\n";
                break;    
            case "Call":
                /* DATA LOG
                jsString = "\n,$myeval$\n)";
                */
                jsString += "\n)";
                break;
            case "Ask":
                jsString += "($" + data + " ? $" + data + ".apply(this):\"Nothing\") ";
                break;
            case "Answer":
                jsString += "function(){//Answer: "+data + "\nreturn ";
                break;
            case "Param":
                jsString += data;
                break;
            case "Sub":
                jsString += data;
                break;
            case "Data Structure":
                if (data == "1")
                {
                    jsString += inputs_of(conversion)[0].replace(/'/g,"_") + "1";
                }
                else
                {
                    var inputs = inputs_of(conversion);
                    var count = 1;
                    var args = [inputs[0].replace(/'/g,"_").replace(/-/g,"_$_")+count];
                    for (var j = 1; j < inputs.length; j++)
                    {
                        if (inputs[j] == inputs[j-1])
                            count++;
                        else
                            count=1;
                        args.push(inputs[j].replace(/'/g,"_").replace(/-/g,"_$_") + count);
                    }
                  
                    jsString += "function() {\n";
                    jsString += "var r = ";
                    jsString += "[" + args[0].replace(/'/g,"_");
                    for (var j = 1; j < args.length; j++)
                        jsString += "," + args[j].replace(/'/g,"_");
                    jsString += "];\n";
                        
                    jsString += "for(var i=0;i<r.length;i++)\n";
                    jsString += "if(r[i]!==\"Nothing\")\n";
                    jsString += "return r;\n";
                    jsString += "return \"Nothing\";"
                    jsString += "\n}()";
                }
                break;
            case "Number":
                jsString += data;
                break;
            case "Nothing":
                jsString += "\"Nothing\"";
                break;
            case "Character":
                jsString += "\"" + data + "\"";
                break;
            case "Selector":
                jsString += '"' + data + '"' + "\n";
                break;
            case "IGNORE":
                jsString += data;
                break;
        }
    }
     
    document.getElementById("jsCode").value += "function " + conversion + "(" + arguments + ") {\n" + jsString + "\n}\n\n";
             
    return new Function(arguments, jsString);
}











/*
function js_conversion(Data, call) {

    if (call === undefined)
        return js_conversion_rename(Data);

    if (Data.Optimized[call] instanceof Function) {
        log_js_compilation(["JS Compile: " + call]);
        log_js_compilation("BUILT-IN");
        log_js_compilation([]);
        return Data.Optimized[call];
    }

    var inputs = inputs_of(call);
    var count = 1;
    var args = [inputs[0].replace(/'/g,"_").replace(/-/g,"_$_")+count];
    for (var i = 1; i < inputs.length; i++)
    {
        if (inputs[i] == inputs[i-1])
            count++;
        else
            count=1;
        args.push(inputs[i].replace(/'/g,"_").replace(/-/g,"_$_") + count);
    }
    
    for (var ask in Data.Asks[call])
        args.push(ask);

    log_js_compilation(["JS Compile: " + call]);
    log_js_compilation(call);
    log_js_compilation(["Bytecode"]);
    var jsString = js_bytecode(Data, call, args, 0).jsString;
    log_js_compilation([]);
    
    jsString = jsString.substring(0,jsString.length-1) + ';';
    log_js_compilation(["JS"]);
    log_js_compilation(jsString);
    log_js_compilation([]);
    log_js_compilation([]);

    
    document.getElementById("jsCode").value += "function " + call + "(" + args.join(',') + ") {\n" + jsString + "\n}\n\n";
    

    var funct = new Function(args.join(','), jsString);
    if (log_js_execution == NLOG) return funct;
    
    return function() {
        var args = [];
        for (var i = 0; i < arguments.length; i++)
            args.push(arguments[i]);
        log_js_execution([call]);
        log_js_execution("ARGUMENTS: " + args.toString() + "\n");
        var res = funct.apply(this, arguments);
        if (res === undefined) res = "undefined";
        log_js_execution("Returns: " + res.toString() + " from " + args.toString());
        log_js_execution([]);
        return res;
    };
}

//  Returns {jsString, ip}
function js_bytecode(Data, call, args, ip, tab, entered) {

    var bytecode = Data.Optimized[call];
    var tab_size = '   ';
    var jsString = "";
    var subString = "";
    var ansJS = [];
    var inAnswers = false;
    if (tab !== undefined)
        tab += tab_size;
    else
        tab = tab_size;
    
    if (entered)
    {
        if (Data.Conversions[entered] === undefined)
        {
            throw "Conversion not created";
            //create_conversion(Data, entered);
            //link_conversions(Data);
        }
        for (var key in Data.Asks[entered])
            ansJS.push(tab + "function(){return\"Nothing\";}");
    }

    function ret() {
        //var res = "function(){ var answers = {}; " + ansJS + jsString.substring(0,jsString.length-1) + " }(),";
        if (entered === undefined)
            jsString = subString + "return " + jsString;
        return {"jsString": jsString, "ansJS":ansJS, "ip":ip};
    }

    for (; ip < bytecode.length; ip++) {
        var tmp = bytecode[ip].split(">");
        var ins = tmp[0];
        var data = tmp[1];
        log_js_compilation(bytecode[ip]);
        switch (ins) {
            case "SubConversion":
                var res = js_bytecode(Data, call, args, ip+1, tab);
                subString += "var " + data + " = " + res.jsString.substring(7,res.jsString.length-1) + ";\n";
                ip = res.ip;
                break;
            case "Enter":
                var res = js_bytecode(Data, call, args, ip+1, tab, data);
                ip = res.ip;
                if (res.ansJS.length == 0)
                    res.jsString = res.jsString.substring(0,res.jsString.length-2);
                //jsString += "function(){ \nvar answers = {};\n" + res.ansJS + " return CALL(\"" + data + "\")(\n" + res.jsString + "\n}(),";
                if (entered !== undefined) jsString += tab;
                //jsString += "CALL(\"" + data + "\")(\n" + res.jsString + res.ansJS.join(",\n") + "\n" + tab + "),";
                jsString += "this." + js_conversion_rename(data) + "(\n" + res.jsString + res.ansJS.join(",\n") + "\n" + tab + "),";
                if (entered === undefined) return ret();
                break;
            case "Ask":
                //jsString += "(answers." + data + "? answers." + data + "():\"Nothing\")";
                jsString += tab + "($" + data + " ? $" + data + ".apply(this):\"Nothing\") ";
                break;
            case "Return Ask":
                jsString += "($" + data + " ? $" + data + ".apply(this):\"Nothing\") ";
                return ret();
                break;
            case "Answer":
                var res = js_bytecode(Data, call, args, ip+1, tab);
                var ans = tab + "function(){//Answer: "+data + "\n" + tab + tab_size;
                ans += res.jsString.substring(0,res.jsString.length-1);
                ans += "\n" + tab + "}";
                ip = res.ip;
                
                for (var key in Data.Asks[entered])
                    if (key == "$"+data)
                        ansJS[Data.Asks[entered][key]] = ans;
                
                break;
            case "End Answers":
                break;
            case "Push Param":
                jsString += tab + args[parseInt(data)] + ",";
                break;
            case "Return Param":
                jsString += args[parseInt(data)] + ",";
                return ret();
                break;
            case "Push Sub":
                jsString += tab + Data.SubConversions[call][parseInt(data)] + ",";
                break;
            case "Return Sub":
                jsString += Data.SubConversions[call][parseInt(data)] + ",";
                return ret();
                break;
            case "Data Structure":
                if (data == "1")
                {
                    jsString += tab + inputs_of(call)[0].replace(/'/g,"_") + "1;";
                }
                else
                {
                    //jsString += "function(){\nvar r=[];\nfor (var i=arguments.length-2;i>=0;i--){\nr.unshift(arguments[i]);\nif(arguments[i]!==\"Nothing\") {\nfor(i--;i>=0;i--)\nr.unshift(arguments[i]); \nreturn r;}}\nreturn \"Nothing\";\n}(),";
                    jsString += tab + "function() {\n";
                    jsString += tab+tab_size+"var r = ";
                    jsString += "[" + args[0].replace(/'/g,"_");
                    for (var i = 1; i < args.length; i++)
                        jsString += "," + args[i].replace(/'/g,"_");
                    jsString += "];\n";
                    
                    jsString += tab+tab_size+"for(var i=0;i<r.length;i++)\n";
                    jsString += tab+tab_size+tab_size+"if(r[i]!==\"Nothing\")\n";
                    jsString += tab+tab_size+tab_size+tab_size+"return r;\n";
                    jsString += tab+tab_size+"return \"Nothing\";"
                    jsString += tab + "\n}(),";
                }
                return ret();
                break;
            case "Return Data":
                //  If the conversions is a specification just return the data
                if (call == "Number,Bit" ||
                    Data.Specifics[inputs_of(call)[0]])
                {
                   jsString += inputs_of(call)[0].replace(/'/g,"_") + "1;";
                   return ret();
                }
                jsString += inputs_of(call)[0].replace(/'/g,"_") + "1==\"Nothing\"?\"Nothing\":" + inputs_of(call)[0].replace(/'/g,"_") + "1[" + data + "],";
                return ret();
                break;
            case "Call":
                return ret();
                break;
            case "Push Number":
                jsString += tab + data + ",";
                break;
            case "Return Number":
                jsString = data + ";";
                return ret();
                break;
            case "Push Nothing":
                jsString += tab + "\"Nothing\",";
                break;
            case "Return Nothing":
                jsString = "\"Nothing\";";
                return ret();
                break;
            case "Push Character":
                jsString += tab + "\"" + data + "\",";
                break;
            case "Return Character":
                jsString += "\"" + data + "\"; ";
                return ret();
                break;
            case "Push Selector":
                jsString += '"' + data + '"' + ",";
                break;
        }
        if (ins !== "Answer" && ins !== "End Answers" && ins !== "SubConversion" && ins !== "Specification")
            jsString += '\n';
    }
    
    //  throw "Error in bytecode";
    return ret();
}*/
