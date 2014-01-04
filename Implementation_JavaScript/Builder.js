function RunCompiler()
{
    LOG(["Compiler Testing"]);
    
    
    function call(conv, params) {
        try 
        {    var code_pointer = get_code_pointer(Data, conv, params);
        }
        catch (e)
        {
            code_pointer = create_conversion(Data, conv);
            if (code_pointer === undefined) throw "Conversion could not be created";
        }
        return interpret(Data, code_pointer, params, {});
    }
    
    function Test(header, conversion, params)
    {
        LOG(["Test " + header]);
        
        LOG("Test Code: " + params[0][1]);
        
        var res = call(conversion, params);
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
    
    
    var conversion = "Parser\'Type\',Parser\'Number\'";
    var params = [ [123, "Test'Type'_", 0, "SIGNAT"] ];
    Test("Parse Type", conversion, params);
    
    
    LOG([]);
}

function AddParserConversions()
{
    Data.Generics["[A]Parser,[A],[B]Parser"] = function(params)
    {
        var code = (params[1] && params[1][3] === "SIGNAT") ? params[1] : params[0];
        var data = (params[1] && params[1][3] === "SIGNAT") ? params[0] : params[1];
        return [data, code[1], code[2], code[3]];
    }
    Data.Generics["[A],[A]Parser"] = function(params)
    {
        return params[0][0];
    }
    
    Data.Generics["[A],[A]Next"] = function(params)
    {
        return params[0];
    }
    Data.Generics["[A]Next'Parser',[A]Parser"] = function(params)
    {
        var code = params[0];
        return [code[0], code[1], code[2] + 1, code[3]];
    }
    
    Data.Generics["[A],[A]Get"] = function(params)
    {
        return params[0];
    }
    Data.Generics["Character,[A]Parser"] = function(params)
    {
        var code = params[0];
        return code[1][code[2]];
    }
    
    Data.Generics["[A]Compare,Character,Character"] = function(params, answers)
    {
        return call_answer( params[0] < params[1] ? "less" : (params[0] == params[1] ? "equal" : "greater"), answers);
    }
}
