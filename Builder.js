function RunCompiler()
{
    LOG(["Compiler Testing"]);
    
    function Test(header, conversion, params)
    {
        LOG(["Test " + header]);
        
        LOG("Test Code: " + params[0][1]);
        
        var res = CALL(Data, conversion).apply(Data.JITed, params);
        LOG("Parsed: " + res[0].toString());
        LOG("Index:  " + res[2].toString());
        LOG([]);
        return res;
    }
    
    AddParserConversions();
    
    var CODE = 
        List_CPS +
        Bool_CPS +
        String_CPS+
        CCompiler_CPS;
    
    
    var conversions = parse(CODE)[0];
    for (var i = 0; i < conversions.length; i++)
        load_conversion(Data, conversions[i].name, conversions[i].bytecode);
    
    link_conversions(Data);
    
    var conversion = "Parser\'Literal\',Parser\'Number\'";
    var params = [ [123, "Test Type_", 0, "SIGNAT"] ];
    var res = Test("Parse Literal", conversion, params);
    
    var conversion = "Parser'ClearedWhite',Parser'Literal'";
    var params = [res];
    var res = Test("Clear White", conversion, params);
    
    
    var conversion = "Parser\'Literal\',Parser\'Number\'";
    var params = [res];
    var res = Test("Parse Literal", conversion, params);
    
    
    var conversion = "Parser\'DataType\',Parser\'Number\'";
    var params = [ [123, "Test'Type'_", 0, "SIGNAT"] ];
    Test("Parse Type", conversion, params);
    
    
    LOG([]);
}

function AddParserConversions()
{
    Data.Generics["[A]Parser,[A],[B]Parser"] = function()
    {
        var code = (arguments[1] && arguments[1][3] === "SIGNAT") ? arguments[1] : arguments[0];
        var data = (arguments[1] && arguments[1][3] === "SIGNAT") ? arguments[0] : arguments[1];
        return [data, code[1], code[2], code[3]];
    }
    Data.Generics["[A],[A]Parser"] = function()
    {
        return arguments[0][0];
    }
    
    Data.Generics["[A],[A]Next"] = function()
    {
        return arguments[0];
    }
    Data.Generics["[A]Next'Parser',[A]Parser"] = function()
    {
        var code = arguments[0];
        return [code[0], code[1], code[2] + 1, code[3]];
    }
    
    Data.Generics["[A],[A]Get"] = function()
    {
        return arguments[0];
    }
    Data.Generics["Character,[A]Parser"] = function()
    {
        var code = arguments[0];
        return code[1][code[2]];
    }
    
    Data.Asks["[A]Compare,Character,Character"] = {};
    Data.Asks["[A]Compare,Character,Character"]["$less"] = 0;
    Data.Asks["[A]Compare,Character,Character"]["$equal"] = 1;
    Data.Asks["[A]Compare,Character,Character"]["$greater"] = 2;
    Data.Generics["[A]Compare,Character,Character"] = function(C1,C2,less,equal,greater)
    {
        return C1 < C2 ? less.apply(this) : (C1 == C2 ? equal.apply(this) : greater.apply(this));
    }
}
