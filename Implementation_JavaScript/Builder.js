function RunCompiler()
{
    LOG(["Compiler Testing"]);
    var call = function(conv, params) {
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
