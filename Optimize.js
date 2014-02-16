function remove_redundant_conversions(Data, conversion, bytecode, i)
{
    var nc = [];
    for(; i < bytecode.length; i++)
    {
        if (BCins(bytecode[i]) == "Enter")
        {
            var call = BCdata(bytecode[i]);
            if (inputs_of(call).length == 1)
            {
                var revC = inputs_of(call)[0]+","+output_of(call);
                if ((Data.Types[output_of(call)] == call && BCins(Data.Conversions[call][0]) !== "Specification") ||
                    (Data.Types[output_of(revC)] == revC && BCins(Data.Conversions[revC][0]) !== "Specification") ||
                    (inputs_of(call)[0] === "Nothing"))
                {
                    var input = value_at(bytecode, i+1);
                    i += input.length + 1;
                    input = remove_redundant_conversions(Data, conversion, input, 0);
                    for (var j = 0; j < input.length; j++)
                        nc.push(input[j]);
                    continue;
                }
            }
        }
        
        nc.push(bytecode[i]);
    }
    return nc;
}

/*
function removeRedundantConversions(Data, struc) {
    if (struc.length == 3)
    {
        var split = struc[0].split('>');
        var data = split[1];
        if (split[0] === "Enter")
        {
            if (inputs_of(data).length == 1)
            {
                if (Data.DataStructures[output_of(data)] == data && !Data.TypeSpecification[output_of(data)])
                    return struc[1];
                if (Data.DataStructures[inputs_of(data)[0]] == inputs_of(data)[0]+","+output_of(data) && !Data.TypeSpecification[inputs_of(data)[0]])
                    return struc[1];
                if (inputs_of(data)[0] === "Nothing")
                    return "Nothing>";
            }
        }
    }
    return struc;
};*/


function reorder_answers(Data, conversion, bytecode, i)
{
    var nc = [];
    for (; i < bytecode.length; i++)
    {
        switch(BCins(bytecode[i]))
        {
            case "SubConversion":
                nc.push(bytecode[i]);
                
                var code = value_at(bytecode, i+1);
                i += code.length;
                code = reorder_answers(Data, conversion, code, 0);
                
                for (var j = 0; j < code.length; j++)
                    nc.push(code[j]);
                break;
            case "Enter":
                var entered = BCdata(bytecode[i]);
                var ans = [];
                var counter = {};
                for (var key in Data.Asks[entered])
                    ans.push(["Answer>" + key, "Nothing>"]);
            
                var code = forall_inputs(bytecode, i, 
                    function(bc, i) { return reorder_answers(Data, conversion, bc, i); },
                    function(bc, i, answer) {
                    
                        for (var key in Data.Asks[entered])
                        {
                            if (key == answer)
                            {
                                var nc = [];
                                nc.push("Answer>" + key);
                                for (var j = 0; j < bc.length; j++)
                                    nc.push(bc[j]);
                                ans[Data.Asks[entered][key]] = nc;
                            }
                        }
                        return [];
                    }
                , counter);
                
                i += counter.value;
                
                for (var j = 0; j < code.length; j++)
                    nc.push(code[j]);
                    
                var callIns = nc.pop();
                for (var j = 0; j < ans.length; j++)
                    for (var k = 0; k < ans[j].length; k++)
                        nc.push(ans[j][k]);
                nc.push(callIns);
                break;
            default:
                nc.push(bytecode[i]);
                break;
        }
    }
    return nc;
}

/*
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
*/

function inlineConversion(Data, struc, conversion) 
{
    if (struc[0].split(">")[0] == "Enter")
    {
        var args = [];
        for (var i = 1; i < struc.length-1; i++)
        {
            args.push(struc[i]);
        }

        var inlineConversion = struc[0].split(">")[1];

        if (Data.Recursive[inlineConversion]) return struc;

        var lookupConversion = Data.PassCompiled[Data.CurrentPass-1][inlineConversion];
        if (lookupConversion instanceof Function) return struc;
        
        //  Contains selector type
        if (inputs_of(inlineConversion)[0][0] == "-") return struc;
        
        var bcStruc = lookupConversion;
        if (bcStruc === undefined) 
            return struc;
        if (!(bcStruc[1] instanceof Array)) return struc;
        
        var inlineBC = [];
        for (var i = 1; i < bcStruc.length; i++)
            inlineBC.push(bcStruc[i]);

        var res = operateAST(Data, inlineBC, function(Data, ins, data, conversion, extras)
        {
            if (ins == "Param")
            {
                return [extras[parseInt(data)]];
            }
            if (ins == "Ask")
            {
                var askOffset = Data.Asks[inlineConversion][data];
                var res = [extras[inputs_of(inlineConversion).length + askOffset][1]];
                return res;
            }
            return ins + ">" + data;
        }, undefined, inlineConversion, args);
        
        return res[0];
    }
    return struc;
}