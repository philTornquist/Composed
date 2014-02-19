function Test_JSCompiler()
{
	var log_compiler = false;
    
    LOG(["TEST!!! JSCompiler"]);
    
    Data = new DataStore();
    Data.JITName = js_conversion_rename;
    
        var SAVED = log_compiler_conversions;
        log_compiler_conversions = log_compiler ? LOG : NLOG;
    //var conversions = parse(TEST_CODE + List_CPS);
        log_compiler_conversions = SAVED;
    
    var conversions = compile(TEST_CODE + List_CPS);
    
    document.getElementById("bytecode").value = conversions;
    document.getElementById("jsCode").value = "";
    
    load_bytecode(Data, conversions);
    load_bytecode(Data, document.getElementById("inputBytecode").value);
    
    LOG(["LOADED: Conversions"]);
    for (var key in Data.Conversions) LOG(key);
    LOG([]);
    
    LOG(["LOADED: Generics"]);
    for (var key in Data.Generics) LOG(key);
    LOG([]);
    
    LOG(["LOADED: Selectors"]);
    for (var key in Data.Selectors) { LOG([key]); for(var sel in Data.Selectors[key]) LOG(sel); LOG([]); }
    LOG([]);
    
    link_conversions(Data);

    Run_Tests();
}
