var log_jitting = NLOG;

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
    var addReturn = PSins(bytecode[0]) == "Conversion" ||
                    PSins(bytecode[0]) == "Specification";
    for (; i < bytecode.length; i++)
    {
        switch(PSins(bytecode[i]))
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
                nc.push("IGNORE>;\n");
                break;
            case "Conversion":
            case "Specification":
            case "Hint":
                nc.push(bytecode[i]);
                break;
            case "Enter":
                if (!addReturn) nc.push("IGNORE>\n");
            default:
                if (addReturn) nc.push("IGNORE>return ");
                addReturn = false;
                nc.push(bytecode[i]);
                break;
        }
    }
    
    if (PSins(bytecode[0]) == "Conversion" || PSins(bytecode[0]) == "Specification")
        nc.push("IGNORE>;");
    
    return nc;
}

function JS_insert_param_names(Data, conversion, bytecode, i)
{
    if (PSins(bytecode[i]) !== "Conversion" &&
        PSins(bytecode[i]) !== "Specification")
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
        switch(PSins(bytecode[i]))
        {
            case "Param":
                nc.push(PSins(bytecode[i]) + ">" + args[parseInt(PSdata(bytecode[i]))]);
                break;
            case "Sub":
                nc.push(PSins(bytecode[i]) + ">" + Data.SubConversions[conversion][parseInt(PSdata(bytecode[i]))].name);
                break;
            default:
                nc.push(bytecode[i]);
                break;
        }
    }
    
    return nc;
}

function JS_insert_commas(Data, conversion, bytecode, i)
{
    var nc = [];
    for (; i < bytecode.length; i++)
    {
        if (PSins(bytecode[i]) == "Enter" || PSins(bytecode[i]) == "StartLoop")
        {
            var ans = [];
            var counter = {};
            var first_param = false;
            var commas_to_insert = inputs_of(PSdata(bytecode[i])).length - 1;
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

function JS_compile(Data, conversion, bytecode, i)
{
    var jsString = "";
    var jsEnd = "";
    var arguments = "";
    for(; i < bytecode.length; i++)
    {
        var ins = PSins(bytecode[i]);
        var data = PSdata(bytecode[i]);
        switch (ins) {
            case "Arguments":
                arguments = data;
                break;
            case "SubConversion":
                jsString += "var " + data + " = ";
                break;
            case "Switch":
                var args = arguments.split(",");

                var new_conv = output_of(conversion) + ',' + inputs_of(conversion).slice(1).join(',');

                jsString += "this['" + js_conversion_rename(new_conv) + ":' + js_conversion_rename(" + args[0] + ")](";
                jsString += args.slice(1).join(', ');
                jsString += ")";
                break;
            case "Enter":
                jsString += "this." + js_conversion_rename(data) + "(";
                break;    
            case "Call":
                jsString += ")";
                break;
            case "Element":
                //jsString += "function(r){return (r instanceof String && r==\"Nothing\")?\"Nothing\":";
                //jsString += "r["+PSdata(bytecode[i])+"];";
                //jsString += "}(";
                break;
            case "Extract":
                //jsString += ")";
				jsString += "[" + PSdata(bytecode[i]) + "]";
                break;
            case "Ask":
                jsString += "($" + data + " ? $" + data + ".apply(this):\"Nothing\") ";
                break;
            case "Answer":
                jsString += "\nfunction(){//Answer: "+data + "\nreturn ";
                break;
            case "Param":
                jsString += data;
                break;
            case "Sub":
                jsString += data;
                break;
            case "StartLoop":
                jsString = "function loop_call("+arguments+"){\n" + jsString;
                jsString += "function(){var args = arguments; return function() {return loop_call.apply(this,args);}}(";

                jsEnd += "}\nvar call_args = arguments;\nvar loop_var = function(){return loop_call.apply(this, call_args);};\nwhile(loop_var instanceof Function) loop_var = loop_var.apply(this);\nreturn loop_var;";
                break;
            case "EndLoop":
                jsString += ")";
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
                  
                    /*
                    jsString += "function() {\n";
                    jsString += "var r = [";
                    jsString += "[" + args[0].replace(/'/g,"_");
                    for (var j = 1; j < args.length; j++)
                        jsString += "," + args[j].replace(/'/g,"_");
                    jsString += "];\n";
                        
                    jsString += "for(var i=0;i<r.length;i++)\n";
                    jsString += "if(!(r instanceof String && r==\"Nothing\"))\n";
                    jsString += "return r;\n";
                    jsString += "return \"Nothing\";"
                    jsString += "\n}()";*/
                    jsString += "function() {\n";
                    jsString += "var r = []\n";
                    for (var j = 0; j < args.length; j++)
                    {
                        jsString += "r[" + j + "] = " + args[j].replace(/'/g,"_") + "\n";
                        jsString += "r[\"" + inputs[j] + "\"] = " + args[j].replace(/'/g,"_") + "\n";
                    }
                        
                    jsString += "for(var i=0;i<" + args.length + ";i++)\n";
                    jsString += "if(!(r instanceof String && r==\"Nothing\"))\n";
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
     
    log_jitting(["JS: " + conversion])
    log_jitting("function " + conversion + "(" + arguments + ") {\n" + jsString + jsEnd + "\n}\n\n");
    log_jitting([]);

    if (jsEnd != "") console.log(conversion, jsString + jsEnd);
             
    return new Function(arguments, "/*" + conversion + "*/\n" + jsString + jsEnd);
}
