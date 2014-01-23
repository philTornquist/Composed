function js_conversion(Data, ip) {

    for(var key in Data.Conversions) if (Data.Conversions[key] == ip) break;
    NLOG(["CONVERSION:" + key]);

    var jsString = "var CV=\"" + key + "\";\nvar answers=[];var params=[];\n";
    var inAnswers = false;
    var entered = false;
    var enterCount = 0;
    var inAnsSave = [];

    var return_arg_r = "if(r===\"Nothing\"){var ask=arguments[arguments.length-1][\"Nothing\"];r=ask?ask():r}return r;";

    for (; ip < Data.Text.length && (!entered || enterCount > 0 || inAnswers); ip++) {
        var tmp = Data.Text[ip].split(">");
        var ins = tmp[0];
        var data = tmp[1];
        switch (ins) {
            case "Enter":
                jsString += "answers.unshift({});";
                jsString += "params.unshift([]);";
                entered = true;
                enterCount++;
                break;
            case "Ask":
                jsString += "var ask=arguments[arguments.length-1][\"" + data + "\"];params[0].push(ask?ask():\"Nothing\");";
                break;
            case "Return Ask":
                jsString += "var ask=arguments[arguments.length-1][\"" + data + "\"];var r=ask?ask():\"Nothing\";" + return_arg_r;
                break;
            case "Answer":
                if (inAnswers) jsString += "};}(arguments);";
                else inAnsSave.push(enterCount);
                jsString += "answers[0][\"" + data + "\"]=function(args){return function(){var answers=[];var params=[];arguments=args;";
                inAnswers = true;
                enterCount = 0;
                entered = false;
                break;
            case "End Answers":
                jsString += "};}(arguments);";
                inAnswers = false;
                enterCount = inAnsSave.pop();
                entered = enterCount != 0;
                break;
            case "Push Param":
                jsString += "params[0].push(arguments[" + parseInt(data) +"]);";
                break;
            case "Return Param":
                jsString += "return arguments[" + parseInt(data) + "];";
                break;
            case "Data Structure":
                if (data == "1")
                {
                    jsString += "return arguments[0];";
                }
                else
                {
                    jsString += "var r=[];for (var i=arguments.length-2;i>=0;i--){r.unshift(arguments[i]);if(arguments[i]!==\"Nothing\") {for(i--;i>=0;i--)r.unshift(arguments[i]); return r;}}return \"Nothing\"";
                }
                break;
            case "Return Data":
                //  If the conversions is a specification just return the data
                var complete = false;
                for (var conversion in Data.Conversions)
                    if (Data.Conversions[conversion] == ip)
                    {
                        if (conversion == "Number,Bit" ||
                            Data.Specifics[inputs_of(conversion)[0]])
                        {
                            jsString += "return arguments[0]";
                            complete = true;
                        }
                    }
                if (complete) break;

                jsString += "var r=arguments[0][" + parseInt(data) + "];" + return_arg_r;
                break;
            case "Call":
                enterCount--;
                jsString += "var a=params.shift();a.push(answers.shift());var r=Conversion.apply(this,[\""+data+"\",a]);";
                if (enterCount == 0) jsString += "return r;";
                else jsString += "params[0].push(r);";
                break;
            case "Inject":
                enterCount--;
                var def = Data.DataStructures[output_of(data)];
                var inputs = inputs_of(def);
                var ds = inputs[0] == output_of(data) ? 0 : 1;
                var ij = ds == 0 ? 1 : 0;
                for (var j = 0; j < inputs.length; j++) {
                    if (inputs[j] == inputs_of(data)[0])
                        break;
                }
                jsString += "var r = [];";
                jsString += "\n";
                jsString += "var a = params.shift(); a.push(answers.shift());";
                jsString += "\n";
                jsString += "if (a["+ds+"].length === undefined) r=a["+ij+"];";
                jsString += "\n";
                jsString += "else for(var i = a["+ds+"].length-1; i>=0; i--) {";
                jsString += "\n";
                jsString += "if (i == "+j+") r.unshift(a["+ij+"]);";
                jsString += "\n";
                jsString += "else r.unshift(a["+ds+"][i]);";
                jsString += "\n";
                jsString += "if (r[0] !== \"Nothing\") var cleared = true;";
                jsString += "\n";
                jsString += "} if (cleared === undefined) r = \"Nothing\";";
                jsString += "\n";
                
                if (enterCount == 0) jsString += "return r;";
                else jsString += "params[0].push(r);";

                break;
            case "Push Number":
                jsString += "params[0].push(" + parseInt(data) + ");";
                break;
            case "Return Number":
                jsString += "return " + data + ";";
                break;
            case "Push Nothing":
                jsString += "params[0].push(\"Nothing\");";
                break;
            case "Return Nothing":
                jsString += "return \"Nothing\";";
                break;
            case "Push Character":
                jsString += "params[0].push(\"" + data + "\");";
                break;
        }
        jsString += "\n";
    }

    NLOG(jsString);
    NLOG([]);
    var funct = new Function(jsString);
    funct.name = key;
    return funct;
}