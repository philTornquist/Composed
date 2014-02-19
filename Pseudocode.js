/*  PSEUDOCODE SYNTAX

Conversion | Specification | Combination

Hint*

SubConversion*

Enter | ENTER | Element | Param | Character | Number | Ask | Sub | Selector

*/

var NONE = '';
var NOTHING = "" +
"Conversion>[A],Nothing\n"+
"Nothing>\n";

var EXISTS = "" +
"Conversion>[A],[A]Exists\n"+
"Element>0\n"+
"Param>0\n"+
"Extract>0\n"+
"\n"+
"Specification>[B]Exists,[A]\n"+
"ENTER>\n"+
"IGNORE>(\n"+
"Param>0\n"+
"IGNORE> !== \"Nothing\" ? \n"+
"Ask>yes\n"+
"IGNORE> : \n"+ 
"Ask>no\n"+
"IGNORE>)\n"+
"EXIT>\n";

var SUM = "" + 
"Conversion>Number,Sum\n"+
"Element>0\n"+
"Param>0\n"+
"Extract>0\n"+
"\n"+
"Conversion>Sum,Number\n"+
"Data Structure>1\n"+
"\n"+
"Conversion>Sum,Number,Number\n"+
"ENTER>\n"+
"IGNORE>(\n"+
"Param>0\n"+
"IGNORE> + \n"+
"Param>1\n"+
"IGNORE>)\n"+
"EXIT>\n";

var DIFFERENCE = "" + 
"Conversion>Number,Difference\n"+
"Element>0\n"+
"Param>0\n"+
"Extract>0\n"+
"\n"+
"Conversion>Difference,Number\n"+
"Data Structure>1\n"+
"\n"+
"Conversion>Difference,Number,Number\n"+
"ENTER>\n"+
"IGNORE>(\n"+
"Param>0\n"+
"IGNORE> - \n"+
"Param>1\n"+
"IGNORE>)\n"+
"EXIT>\n";

var QUOTIENT = "" + 
"Conversion>Quotient,Number\n"+
"Data Structure>1\n"+
"\n"+
"Conversion>Number,Quotient\n"+
"Element>0\n"+
"Param>0\n"+
"Extract>0\n"+
"\n"+
"Conversion>Quotient,Number,Number\n"+
"ENTER>\n"+
"IGNORE>(\n"+
"Param>0\n"+
"IGNORE> / \n"+
"Param>1\n"+
"IGNORE>)\n"+
"EXIT>\n";

var SQUARE = "" + 
"Conversion>Number,Square\n"+
"Element>0\n"+
"Param>0\n"+
"Extract>0\n"+
"\n"+
"Specification>Square,Number\n"+
"ENTER>\n"+
"IGNORE>(\n"+
"Param>0\n"+
"IGNORE> * \n"+
"Param>0\n"+
"IGNORE>)\n"+
"EXIT>\n";

var SQRT = "" + 
"Conversion>Number,SquareRoot\n"+
"Element>0\n"+
"Param>0\n"+
"Extract>0\n"+
"\n"+
"Specification>SquareRoot,Number\n"+
"ENTER>\n"+
"IGNORE>Math.sqrt(\n"+
"Param>0\n"+
"IGNORE>)\n"+
"EXIT>\n";
    
var COMPARE = "" +
"Conversion>[A]Compare,[A]\n"+
"Data Structure>1\n"+
"\n"+
"Conversion>[A],[A]Compare\n"+
"Element>0\n"+
"Param>0\n"+
"Extract>0\n"+
"\n"+
"Conversion>[A]Compare,Character,Character\n"+
"ENTER\n"+
"Param>0\n"+
"IGNORE> < \n"+
"Param>1\n"+
"IGNORE> ? \n"+
"Ask>less\n"+
"IGNORE> : (\n"+
"Param>0\n"+
"IGNORE> == \n"+
"Param>1\n"+
"IGNORE> ? \n"+
"Ask>equal\n"+
"IGNORE> : \n"+
"Ask>greater\n"+
"IGNORE>)\n"+
"EXIT>\n"+
"\n"+
"Conversion>[A]Compare,Number,Number\n"+
"ENTER>\n"+
"Param>0\n"+
"IGNORE> < \n"+
"Param>1\n"+
"IGNORE> ? \n"+
"Ask>less\n"+
"IGNORE> : (\n"+
"Param>0\n"+
"IGNORE> == \n"+
"Param>1\n"+
"IGNORE> ? \n"+
"Ask>equal\n"+
"IGNORE> : \n"+
"Ask>greater\n"+
"IGNORE>)\n"+
"EXIT>\n";


function PSins(pseudocode)
{
    return pseudocode.split(">")[0];
}
function PSdata(pseudocode)
{
    return pseudocode.split(">")[1];
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

function value_at(pseudocode, i)
{
    var entercount = 0;
    var value = [];
    do
    {
        if (PSins(pseudocode[i]) == "Enter" ||
            PSins(pseudocode[i]) == "ENTER" ||
            PSins(pseudocode[i]) == "Element" )
        {
            entercount++;
        }
        else if (PSins(pseudocode[i]) == "Call" ||
                 PSins(pseudocode[i]) == "EXIT" ||
                 PSins(pseudocode[i]) == "Extract")
        {
            entercount--;
        }
        value.push(pseudocode[i++]);
    } while(entercount > 0);
    return value;
}

function ast_call(pseudocode, i, counter)
{
    if (counter) counter.value = -i;
    if (PSins(pseudocode[i]) !== "Enter") throw "Error";
    var code = [];
    
    code.push(pseudocode[i++]);
    
    while (PSins(pseudocode[i]) == "IGNORE") 
        code.push(pseudocode[i++]);
    
    do
    {
        var inp = value_at(pseudocode, i);
        i += inp.length;
        
        code.push(inp);
        
        while (PSins(pseudocode[i]) == "IGNORE") 
            code.push(pseudocode[i++]);
    } while(PSins(pseudocode[i]) !== "Call" && PSins(pseudocode[i]) !== "Answer");
    
    while (PSins(pseudocode[i]) == "Answer")
    {
        var ansIns = pseudocode[i];
        var ans = value_at(pseudocode, i+1);
        
        i += ans.length+1;
        while (PSins(pseudocode[i]) == "IGNORE") 
            ans.push(pseudocode[i++]);
        
        ans.unshift(ansIns);
        code.push(ans);
    }
    
    code.push(pseudocode[i]);
    
    while (PSins(pseudocode[i]) == "IGNORE")
        code.push(pseudocode[i++]);
        
    if (counter) counter.value += i;
    return code;
}

function forall_inputs(pseudocode, i, input_funct, answer_funct, counter)
{
    if (counter) counter.value = -i;
    if (PSins(pseudocode[i]) !== "Enter") return [pseudocode[i]];
    var code = [];
    
    code.push(pseudocode[i++]);
    
    while (PSins(pseudocode[i]) == "IGNORE") 
        code.push(pseudocode[i++]);
    
    do
    {
        var inp = value_at(pseudocode, i);
        var res = input_funct ? input_funct(inp, 0) : undefined;
        var sel = res !== undefined ? res : inp;
        i += inp.length;
        for (var j = 0; j < sel.length; j++)
            code.push(sel[j]);
        
        
        while (PSins(pseudocode[i]) == "IGNORE") 
            code.push(pseudocode[i++]);
    } while(PSins(pseudocode[i]) !== "Call" && PSins(pseudocode[i]) !== "Answer");
    
    while (PSins(pseudocode[i]) == "Answer")
    {
        var ansIns = pseudocode[i];
        var ans = value_at(pseudocode, i+1);
        
        i += ans.length+1;
        while (PSins(pseudocode[i]) == "IGNORE") 
            ans.push(pseudocode[i++]);
        
        var res = answer_funct ? answer_funct(ans, 0, PSdata(ansIns)) : undefined;
        var sel = res !== undefined ? res : ans;
        
        if (sel.length != 0) 
            code.push(ansIns);
        for (var j = 0; j < sel.length; j++)
            code.push(sel[j]);
    }
    
    code.push(pseudocode[i]);
    
    while (PSins(pseudocode[i]) == "IGNORE")
        code.push(pseudocode[i++]);
        
    if (counter) counter.value += i;
    
    return code;
}   
