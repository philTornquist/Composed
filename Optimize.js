function remove_redundant_conversions(Data, conversion, bytecode, i)
{
    var nc = [];
    for(; i < bytecode.length; i++)
    {
        if (PSins(bytecode[i]) == "Enter")
        {
            var call = PSdata(bytecode[i]);
            if (inputs_of(call).length == 1)
            {
                var revC = inputs_of(call)[0]+","+output_of(call);
                if ((Data.Types[output_of(call)] == call && PSins(Data.Conversions[call][1]) == "Data Structure") ||
                    (Data.Types[output_of(revC)] == revC && PSins(Data.Conversions[revC][1]) == "Data Structure") ||
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

function expand_element(Data, conversion, bytecode, i)
{
    var nc = [];
    for (; i < bytecode.length; i++)
    {
        if (PSins(bytecode[i]) == "Element")
        {
            var typeconv = Data.Types[inputs_of(conversion)[0]];
            if (typeconv && 
                (Data.Conversions[typeconv][1] == "Data Structure>1" ||
                 PSins(Data.Conversions[typeconv][0]) == "Specification"))
            {
                nc.push("Param>0");
                i += 2;
            }
            else
                nc.push(bytecode[i]);
        }
        else
            nc.push(bytecode[i]);
    }
    return nc;
}

function reorder_answers(Data, conversion, bytecode, i)
{
    var nc = [];
    for (; i < bytecode.length; i++)
    {
        switch(PSins(bytecode[i]))
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
                var entered = PSdata(bytecode[i]);
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

function tail_call_optimization(Data, conversion, bytecode, i)
{
    if (!Data.Hints[conversion].TailRecursive) return bytecode;
    var nc = [];
    
    nc.push(bytecode[0]);
    nc.push("Loop>");
    
    
}

function inline_conversions(Data, conversion, bytecode, i)
{
    var nc = [];
    
    for (; i < bytecode.length; i++)
    {
        if (PSins(bytecode[i]) == "Enter")
        {
            var counter = {};
            var ast = ast_call(bytecode, i, counter); 
            
            var inlineConversion = PSdata(ast[0]);
    
            var lookupConversion = Data.PassCompiled[Data.CurrentPass-1][inlineConversion];
            if (lookupConversion instanceof Function) { nc.push(bytecode[i]); continue; }
            
            if (Data.Hints[inlineConversion].Recursive) { nc.push(bytecode[i]); continue; }
            
            //  Contains selector type
            if (inputs_of(inlineConversion)[0][0] == "-") { nc.push(bytecode[i]); continue; }
            
            var inlinePS = lookupConversion;
            if (inlinePS === undefined) { nc.push(bytecode[i]); continue; }
            if (PSins(inlinePS[1]) !== "Enter" &&
                PSins(inlinePS[1]) !== "ENTER" &&
                PSins(inlinePS[1]) !== "Element") { nc.push(bytecode[i]); continue; }
            
            for (var j = 1; j < inlinePS.length; j++)
            {
                switch(PSins(inlinePS[j]))
                {
                    case "Param":
                        //  Get param from call
                        //   +1 since the ast starts with the Enter instruction
                        var bc = ast[parseInt(PSdata(inlinePS[j])) + 1];
                        bc = inline_conversions(Data, conversion, bc, 0);
                        for (var k = 0; k < bc.length; k++)
                            nc.push(bc[k]);
                        break;
                    case "Ask":
                        var askOffset = Data.Asks[inlineConversion][PSdata(inlinePS[j])];
                        var bc = ast[1 + inputs_of(inlineConversion).length + askOffset];
                        bc = inline_conversions(Data, conversion, bc, 0);
                        //  First index is the Answer instruction
                        for (var k = 1; k < bc.length; k++)
                            nc.push(bc[k]);
                        break;
                    default:
                        nc.push(inlinePS[j]);
                        break;
                }
            }
            
            i += counter.value;
        }
        else
            nc.push(bytecode[i]);
    }
    
    return nc;
}
