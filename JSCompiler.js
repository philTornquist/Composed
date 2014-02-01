var log_js_execution = NLOG;
var log_js_compilation = log_jitting == NLOG ? NLOG: NLOG;

function js_conversion_rename(conversion) {
    return conversion.replace(/'/g,"_").replace(/,/g,"$").replace(/-/g,"_$_");
}

function js_conversion(Data, call) {

    if (call === undefined)
        return js_conversion_rename(Data);

    if (Data.Conversions[call] instanceof Function) 
        return Data.Conversions[call];

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

    log_js_compilation(["JS Compile"]);
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
        log_js_execution("ARGUMENTS: " + args.toString());
        var res = funct.apply(this, arguments);
        log_js_execution(res.toString() + " = " + args.toString());
        log_js_execution([]);
        return res;
    };
}

//  Returns {jsString, ip}
function js_bytecode(Data, call, args, ip, tab, entered) {

    var bytecode = Data.Conversions[call];
    var tab_size = '   ';
    var jsString = "";
    var subString = "";
    var ansJS = [];
    var inAnswers = false;
    if (tab !== undefined)
        tab += tab_size;
    else
        tab = '';
    
    if (entered)
    {
        if (Data.Conversions[entered] === undefined)
        {
            create_conversion(Data, entered);
            link_conversions(Data);
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
                if (inputs_of(data).length == 1 &&
                    (Data.DataStructures[output_of(data)] == data ||
                     Data.DataStructures[inputs_of(data)[0]] == inputs_of(data)[0]+","+output_of(data)))
                    {
                        var nextIns = bytecode[ip+1].split(">");
                        if (nextIns[0] == "Enter")
                        {
                            var res = js_bytecode(Data, call, args, ip+1, tab.substring(tab_size.length, tab.length), nextIns[1]);
                            ip = res.ip;
                            //if (res.ansJS.length == 0)
                                res.jsString = res.jsString.substring(0,res.jsString.length-2);
                            if (entered !== undefined) jsString += tab;
                            jsString += res.jsString + ',';//res.ansJS.join(",\n") + ',';
                            if (entered === undefined) return ret();
                            break;
                        }
                    }
            
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
                    jsString += tab + "function() {var r = \n";
                    jsString += "[" + args[0].replace(/'/g,"_");
                    for (var i = 1; i < args.length; i++)
                        jsString += "," + args[i].replace(/'/g,"_");
                    jsString += "];\n";
                    
                    jsString += tab+"for(var i=0;i<r.length;i++)\n";
                    jsString += tab+tab_size+"if(r[i]!==\"Nothing\")\n";
                    jsString += tab+tab_size+tab_size+"return r;\n";
                    jsString += tab+"return \"Nothing\"}(),";
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
            case "Push Selector":
                jsString += '"' + data + '"' + ",";
                break;
        }
        if (ins !== "Answer" && ins !== "End Answers" && ins !== "SubConversion")
            jsString += '\n';
    }
}

function CALL(Data, call) 
{
	var funct = Data.JITed[Data.JIT(call)];
    if (funct === undefined)
    {
      var ip = create_conversion(Data, call);
      funct = Data.JITed[Data.JIT(call)];
    }
	if (funct === undefined)
		throw "Conversion does not exist: " + call;

	return funct;
}
