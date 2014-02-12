var log_js_execution = NLOG;
var log_js_compilation = log_jitting == NLOG ? NLOG: NLOG;

function js_conversion_rename(conversion) {
    return conversion.replace(/'/g,"_").replace(/,/g,"$").replace(/-/g,"_$_");
}

function JS_JITTER(Data, conversion)
{
    if (conversion === undefined)
       return js_conversion_rename(Data);
    
    if (Data.Optimized[conversion] instanceof Function) {
        return Data.Optimized[conversion];
    }
    
    
    log_js_compilation(["JS Compile: " + conversion]);
    log_js_compilation(conversion);
    
    var s0 = Data.Optimized[conversion];
    var s1 = operateAST(Data, s0, undefined, inlineConversion, conversion);
    var s2 = operateAST(Data, s1, undefined, JS_addEndConversion);
    var s3 = operateAST(Data, s2, undefined, JS_insertCommas);
    var s4 = operateAST(Data, s3, undefined, JS_insertParamNames, conversion);
    var s5 = operateAST(Data, s4, JS_Compile, undefined, conversion);
    var bc = JS_collapse_structure(s5).join("");
    var args = s4[1].split(">")[1];
    
    
    log_js_compilation(["Bytecode"]);
    log_js_compilation(Data.Conversions[conversion]);
    log_js_compilation([]);
    
    log_js_compilation(["JS"]);
    log_js_compilation(bc);
    log_js_compilation([]);
    log_js_compilation([]);

    
    document.getElementById("jsCode").value += "function " + conversion + "(" + args + ") {\n" + bc + "\n}\n\n";
    
    
    var funct = new Function(args, bc);
    if (log_js_execution == NLOG) return funct;
    
    return function() {
        var args = [];
        for (var i = 0; i < arguments.length; i++)
            args.push(arguments[i]);
        log_js_execution([conversion]);
        log_js_execution("ARGUMENTS: " + args.toString() + "\n");
        var res = funct.apply(this, arguments);
        if (res === undefined) throw "error with result";
        log_js_execution("Returns: " + res.toString() + " from " + args.toString());
        log_js_execution([]);
        return res;
    };
};

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
}

function JS_insertParamNames(Data, struc, call, extras)
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
}

function JS_reorderAnswers(Data, struc, call)
{
    var nc = [];
    var ans = [];
    var endcall = undefined;
    
    var entered = undefined;
    
    for (var i = 0; i < struc.length; i++)
    {
        if (struc[i] instanceof Array)
        {
            nc.push(struc[i]);
        }
        else
        {
            var split = struc[i].split(">");
            var ins = split[0];
            var data = split[1];
            switch(ins)
            {
                case "Enter":
                    entered = data;
                    nc.push(struc[i]);
                    
                    
                    for (var key in Data.Asks[entered])
                        ans.push(["Answer>" + key, "Nothing>"]);
                    break;
                case "Answer":
                    for (var key in Data.Asks[entered])
                        if (key == data)
                            ans[Data.Asks[entered][key]] = ["Answer>"+key, struc[i+1]];
                    i++;
                    break;
                case "End Answers":
                    break;
                case "Call":
                    endcall = struc[i];
                    break;
                default:
                    nc.push(struc[i]);
                    break;
            }
        }
    }
    
    if (endcall === undefined) return struc;
    
    for (var i = 0; i < ans.length; i++) { 
        if (ans[i] === undefined) throw "EE"; 
        nc.push([ans[i][0],ans[i][1],"End Answer>"]); 
    }
    nc.push(endcall);
    
    return nc;
}

function JS_insertCommas(Data, struc)
{
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
}

function JS_Compile(Data, ins, data, conversion, extras)
{
    var jsString = "";
        
    switch (ins) {
        case "Conversion":
            //jsString = "this.$"+data+"=function(";
            break;
        case "Arguments":
            //jsString = data + ") { \n ";
            break;
        case "Return":
            jsString = "return ";
            break
        case "End Conversion":
            //jsString = ";\n}";
            jsString = ";";
            break;
        case "SubConversion":
            jsString = "var " + data + " = ";
            break;
        case "End SubConversion":
            jsString = ";\n";
            break;
        case "Enter":
            jsString = "this." + js_conversion_rename(data) + "(\n";
            break;    
        case "Call":
            jsString = "\n)";
            break;
        case "Ask":
            jsString = "($" + data + " ? $" + data + ".apply(this):\"Nothing\") ";
            break;
        case "Answer":
            jsString = "function(){//Answer: "+data + "\nreturn ";
            break;
        case "End Answer":
            jsString = "\n}";
            break;
        case "Param":
            jsString = data;
            break;
        case "Sub":
            jsString = data;
            break;
        case "Data Structure":
            if (data == "1")
            {
                jsString = inputs_of(conversion)[0].replace(/'/g,"_") + "1;";
            }
            else
            {
                var inputs = inputs_of(conversion);
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
              
                jsString += "function() {\n";
                jsString += "var r = ";
                jsString += "[" + args[0].replace(/'/g,"_");
                for (var i = 1; i < args.length; i++)
                    jsString += "," + args[i].replace(/'/g,"_");
                jsString += "];\n";
                    
                jsString += "for(var i=0;i<r.length;i++)\n";
                jsString += "if(r[i]!==\"Nothing\")\n";
                jsString += "return r;\n";
                jsString += "return \"Nothing\";"
                jsString += "\n}()";
            }
            break;
        case "Element":
            //  If the conversions is a specification just return the data
            if (Data.Specifics[inputs_of(conversion)[0]])
            {
               jsString = inputs_of(conversion)[0].replace(/'/g,"_") + "1";
            }
            else
            {
                jsString = inputs_of(conversion)[0].replace(/'/g,"_") + "1==\"Nothing\"?\"Nothing\":" + inputs_of(conversion)[0].replace(/'/g,"_") + "1[" + data + "]";
            }
            break;
        case "Number":
            jsString = data;
            break;
        case "Nothing":
            jsString = "\"Nothing\"";
            break;
        case "Character":
            jsString = "\"" + data + "\"";
            break;
        case "Selector":
            jsString = '"' + data + '"' + "\n";
            break;
    }
          
    return jsString;
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
