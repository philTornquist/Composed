/*  BYTECODE SYNTAX

Conversion | Specification | Combination

Hint*

SubConversion*

Enter | ENTER | Element | Param | Character | Number | Ask | Sub | Selector

*/


function BCins(bytecode)
{
    return bytecode.split(">")[0];
}
function BCdata(bytecode)
{
    return bytecode.split(">")[1];
}
function HintIns(hint)
{
    return hint.split(":")[0];
}
function HintData(hint)
{
    var split = hint.split(":");
    return (split.length > 1) ? split[1] : true;
}

function value_at(bytecode, i)
{
    var entercount = 0;
    var value = [];
    do
    {
        if (BCins(bytecode[i]) == "Enter" ||
            BCins(bytecode[i]) == "ENTER" ||
            BCins(bytecode[i]) == "Element" )
        {
            entercount++;
        }
        else if (BCins(bytecode[i]) == "Call" ||
                 BCins(bytecode[i]) == "EXIT" ||
                 BCins(bytecode[i]) == "Extract")
        {
            entercount--;
        }
        value.push(bytecode[i++]);
    } while(entercount > 0);
    return value;
}

function ast_call(bytecode, i, counter)
{
    if (counter) counter.value = -i;
    if (BCins(bytecode[i]) !== "Enter") throw "Error";
    var code = [];
    
    code.push(bytecode[i++]);
    
    while (BCins(bytecode[i]) == "IGNORE") 
        code.push(bytecode[i++]);
    
    do
    {
        var inp = value_at(bytecode, i);
        i += inp.length;
        
        code.push(inp);
        
        while (BCins(bytecode[i]) == "IGNORE") 
            code.push(bytecode[i++]);
    } while(BCins(bytecode[i]) !== "Call" && BCins(bytecode[i]) !== "Answer");
    
    while (BCins(bytecode[i]) == "Answer")
    {
        var ansIns = bytecode[i];
        var ans = value_at(bytecode, i+1);
        
        i += ans.length+1;
        while (BCins(bytecode[i]) == "IGNORE") 
            ans.push(bytecode[i++]);
        
        ans.unshift(ansIns);
        code.push(ans);
    }
    
    code.push(bytecode[i]);
    
    while (BCins(bytecode[i]) == "IGNORE")
        code.push(bytecode[i++]);
        
    if (counter) counter.value += i;
    return code;
}

function forall_inputs(bytecode, i, input_funct, answer_funct, counter)
{
    if (counter) counter.value = -i;
    if (BCins(bytecode[i]) !== "Enter") return [bytecode[i]];
    var code = [];
    
    code.push(bytecode[i++]);
    
    while (BCins(bytecode[i]) == "IGNORE") 
        code.push(bytecode[i++]);
    
    do
    {
        var inp = value_at(bytecode, i);
        var res = input_funct ? input_funct(inp, 0) : undefined;
        var sel = res !== undefined ? res : inp;
        i += inp.length;
        for (var j = 0; j < sel.length; j++)
            code.push(sel[j]);
        
        
        while (BCins(bytecode[i]) == "IGNORE") 
            code.push(bytecode[i++]);
    } while(BCins(bytecode[i]) !== "Call" && BCins(bytecode[i]) !== "Answer");
    
    while (BCins(bytecode[i]) == "Answer")
    {
        var ansIns = bytecode[i];
        var ans = value_at(bytecode, i+1);
        
        i += ans.length+1;
        while (BCins(bytecode[i]) == "IGNORE") 
            ans.push(bytecode[i++]);
        
        var res = answer_funct ? answer_funct(ans, 0, BCdata(ansIns)) : undefined;
        var sel = res !== undefined ? res : ans;
        
        if (sel.length != 0) 
            code.push(ansIns);
        for (var j = 0; j < sel.length; j++)
            code.push(sel[j]);
    }
    
    code.push(bytecode[i]);
    
    while (BCins(bytecode[i]) == "IGNORE")
        code.push(bytecode[i++]);
        
    if (counter) counter.value += i;
    
    return code;
}   
