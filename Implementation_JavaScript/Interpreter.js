var log_interpret_run = NLOG;

function interpret(Data, ip, params, answers, tab) {

    if (!tab) tab = " ";
    else tab += "    ";
    tab = "";

    if (ip instanceof Function) return ip(params, answers, tab);

    var callParams = [];
    var callAnswers = {};

    var inAnswer = false;
    var enteredCall;

    for (; ip < Data.Text.length; ip++) {
        var tmp = Data.Text[ip].split(">");
        var ins = tmp[0];
        var data = tmp[1];
        if (inAnswer)
        {
            switch(ins)
            {
                case "Answer":
                    var dt = [Data, ip+1, params, answers];
                    callAnswers[data] = function(d, z, p, a) {
                        return function() {  return interpret(d, z, p, a); };
                    } (dt[0], dt[1], dt[2], dt[3]);
                    break;
                case "End Answers":
                    inAnswer = false;
                    break;
            }
        }
        else
        {    
            switch (ins) {
                case "Enter":
                    if (enteredCall) {
                        var start_ip = ip;
                        var enterCount = 1;
                        for (ip++; ip < Data.Text.length; ip++) {
                            if (Data.Text[ip].split(">")[0] == "Enter") enterCount++;
                            if (Data.Text[ip].split(">")[0] == "Call") enterCount--;
                            if (Data.Text[ip].split(">")[0] == "Inject") enterCount--;
                            if (enterCount <= 0) break;
                        }
                        
                        var result = interpret(Data, start_ip, params, answers, tab);
                        /*
                        if (result === "Nothing") {
                            //  Nothing is allowed to be returned here so
                            //  push it onto the callParams
                            if (isDataStructureConversion(Data, enteredCall) ||
                                accepts_nothing(Data, enteredCall)) {
                                callParams.push("Nothing");
                                break;
                            }

                            //  Call the nothing Answer
                            else {
                                return call_answer("Nothing", callAnswers, tab);
                            }
                        }
                        else callParams.push(result);
                        */
                        callParams.push(
                            result !== "Nothing" ?
                                result :
                                call_answer("Nothing", callAnswers, tab)
                            );
                    }
                    else {
                        enteredCall = data;
                    }
                    break;
                case "Ask":
                    var result = call_answer(data, answers, tab);
                    /*
                    if (result === "Nothing") {

                        //  Nothing is allowed to be returned here so
                        //  push it onto the callParams
                        if (isDataStructureConversion(Data, enteredCall)) {
                            callParams.push("Nothing");
                            break;
                        }

                        //  Call the nothing Answer
                        else {
                            return call_answer("Nothing", answers, tab);
                        }
                    }
                    else callParams.push(result);
                        */
                    callParams.push(
                        result !== "Nothing" ?
                            result :
                            call_answer("Nothing", answers, tab)
                        );
                    break;
                case "Return Ask":
                    var result = call_answer(data, answers, tab);
                    /*
                    if (result === "Nothing") {
                        return call_answer("Nothing", answer, tab);
                    }
                    else return result;
                    */
                    return result !== "Nothing" ?
                             result :
                             call_answer("Nothing", answers, tab) ;

                    break;
                case "Answer":
                    inAnswer = true;
                    ip--;
                    break;
                case "Push Param":
                    log_interpret_run(tab + "Push Param [" + data + "] > " + params[parseInt(data)]);
                    callParams.push(params[parseInt(data)]);
                    break;
                case "Return Param":
                    log_interpret_run(tab + "Return Param [" + data + "] > " + params[parseInt(data)]);
                    return params[parseInt(data)];
                case "Data Structure":

                    //  Created data structure will be an array
                    //  Params is already the array of all the data 
                    //  to go into the data structure and in order

                    if (data == "1")
                    {
                        log_interpret_run(tab + "Specification > " + params);
                        return params[0];
                    }

                    log_interpret_run(tab + "Make Data [" + data + "] > " + params);
                    for (var i = params.length - 1; i >= 0; i--) if (params[i] !== "Nothing") break;
                    return i >= 0 ? params : "Nothing";
                    break;
                case "Return Data":
                    //  If the conversions is a specification just return the data
                    for (var conversion in Data.Conversions)
                        if (Data.Conversions[conversion] == ip)
                        {
                            if (conversion == "Number,Bit") {return params[0];}
                            //if (Data.Text[Data.Conversions[Data.DataStructures[inputs_of(conversion)[0]]]] === "Data Structure>1")
                            if (Data.Specifics[inputs_of(conversion)[0]])
                                return params[0];
                        }

                    var result = params[0][parseInt(data)];
                    /*
                    if (value === "Nothing") {
                        return call_answer("Nothing", answers, tab);
                    }
                    else return value;
                    */
                    return result !== "Nothing" ?
                             result :
                             call_answer("Nothing", answers, tab) ;
                    break;
                case "Call":
                    log_interpret_run([tab + "Call > " + data + ": with " + callParams.toString()]);

                    var code_pointer = get_code_pointer(Data, data, callParams);
                    
                    result = interpret(Data, code_pointer, callParams, callAnswers, tab);

                    log_interpret_run(tab + "Results [" + data + "] > " + result);
                    log_interpret_run([]);
                    return result !== "Nothing" ? result : call_answer("Nothing", callAnswers, tab);
                    break;
                case "Inject":
                    var def = Data.DataStructures[output_of(data)];
                    var inputs = inputs_of(def);
                    var newVal = [];
                    for (var j = 0; j < inputs.length; j++) {
                        if (inputs[j] == inputs_of(data)[0])
                            newVal.push(callParams[0]);
                        else
                            newVal.push(callParams[1][j]);
                    }
                    return newVal;
                    break;
                case "Push Number":
                    callParams.push(parseInt(data));
                    break;
                case "Return Number":
                    return parseInt(data);
                case "Push Nothing":
                    callParams.push("Nothing");
                    break;
                case "Push Character":
                    callParams.push(data);
                    break;
            }
        }
    }
}


function get_code_pointer(Data, conversion, params)
{
    var code_pointer = Data.Conversions[conversion];
    var result = 1;

    //  Case Conversion of format "TYPE,Nothing"
    if (code_pointer === undefined) 
    {
        if (inputs_of(conversion).length == 1 && inputs_of(conversion)[0] === "Nothing") 
            return function() { return "Nothing"; };
    }

    //  Case Conversion contains a selector as an input so perform lookup
    if (code_pointer === undefined)
    {
        var newCall = output_of(conversion);
        var selects = [];
        var inputs = inputs_of(conversion);
        for (var i = 0; i < inputs.length; i++)
        {
            if (Data.Selectors[inputs[i]])
            {
                var sel = params.splice(i, 1); 
                selects.push(sel[0]);
            }
            else
                newCall += "," + inputs[i];
        }
    
        newCall += ":" + selects.join(","); 
        code_pointer = Data.Conversions[newCall];
    }

    if (code_pointer === undefined)
        throw "Conversion does not exist: " + conversion;

    return code_pointer;
}

function call_answer(which, answers, tab)
{
    log_interpret_run(["ASKING > " + which]);

    var answer = answers[which];
    var result = answer ? answer() : "Nothing";

    log_interpret_run("Asked [" + which + "] > " + result);
    log_interpret_run([]);
    return result;
}

function accepts_nothing(Data, call) {
    return call.substring(0,6) === "Exists";
}

function runInline()
{
    LOG(["INTERPRETING Inline"]);
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

        var code_pointer = Data.Conversions[split[0]];
        if (code_pointer === undefined)
        {
            code_pointer = create_conversion(Data, split[0]);
        }
        var test = interpret(Data, code_pointer, params, {});
        test = test ? test : "Nothing";
        LOG(test + " = " + Data.ToRun[i]);
    }
    LOG([]);
}
