function operateAST(Data, struc, component_funct, ast_funct, conversion, extras)
{
    extras = extras ? extras : {};
    
    if ( !(struc instanceof Array)) {
        throw 'ee';
    }
    
    var save = struc;
    struc = ast_funct ? ast_funct(Data, struc, conversion, extras) : struc;
    
    if (!(struc instanceof Array)) return struc;
    
    var nc = [];
    for (var i = 0; i < struc.length; i++)
    {
        var ast = struc[i];
        if (ast instanceof Array)
        {
            nc.push(operateAST(Data, ast, component_funct, ast_funct, conversion, extras));
        }
        else
        {
            var split = ast.split(">");
            var ins = split[0];
            var data = split[1];
            
            switch(ins)
            {
                case "IGNORE":
                    nc.push(ast);
                    break;
                default:
                    ast = component_funct ? component_funct(Data, ins, data, conversion, extras) : ast;
                    if (ast instanceof Array)
                    {
                        for (var j = 0; j < ast.length; j++)
                            nc.push(ast[j]);
                    }
                    else
                        nc.push(ast);
                    break;
             }
        }
    }
    return nc;
}

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
            }
        }
    }
    return struc;
};


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
        //if (lookupConversion.length > 10) return struc;
        //  Contains selector type
        if (inputs_of(inlineConversion)[0][0] == "-") return struc;
        
        var bcStruc = lookupConversion;
        if (bcStruc === undefined) 
            return struc;
        if (!(bcStruc[1] instanceof Array)) return struc;
        
        LOG("Inlining: " + inlineConversion + " into: " + conversion);
        
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