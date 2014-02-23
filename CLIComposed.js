load('LogHistory.js')
load('ConversionUtils.js')
load('Pseudocode.js')
load('Library/List.cps.js')
load('Library/String.cps.js')
load('Library/Bool.cps.js')
load('Tests.js')
load('Compiler.js')
load('Linker.js')
load('Optimize.js')
load('JSCompiler.js')

log_compiler_conversions    = NLOG;

log_linking                 = NLOG;
log_linker_restructure      = NLOG;
log_missing                 = NLOG;
log_passes                  = NLOG;
log_jitting                 = NLOG;

log_loaded_conversions      = NLOG;
log_loaded_generics         = NLOG;
log_loaded_selectors        = NLOG;


var indexFile = read("ComposedCompiler.html");
var start_of_bytecode = indexFile.indexOf("code");
    start_of_bytecode = indexFile.indexOf(">", start_of_bytecode)+1;

var Data = new DataStore();
Data.JITName = js_conversion_rename;

var CPS = indexFile.substring(start_of_bytecode, indexFile.indexOf("</", start_of_bytecode));

load_pseudocode(Data, compile(List_Library));
load_pseudocode(Data, compile(String_CPS));
load_pseudocode(Data, compile(Bool_CPS));
load_pseudocode(Data, compile(CPS));
load_pseudocode(Data, BUILT_IN);

link_conversions(Data);

var missingMsg = "";
for (var key in Data.Missing)
    missingMsg += key + "\n";
    
if (missingMsg == "")
    run_inline();
else
    print("Missing: " + missingMsg);

//Run_Tests();
