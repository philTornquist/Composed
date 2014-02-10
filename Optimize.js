
function operateAST(Data, struc, component_funct, ast_funct, extras)
{
    extras = extras ? extras : {};
    var nc = [];
    for (var i = 0; i < struc.length; i++)
    {
        if (struc[i] instanceof Array)
        {
             var ast = ast_funct ? ast_funct(Data, struc[i], extras) : struc[i];
             nc.push(operateAST(Data, ast, compontent_funct, ast_funct, extras));
        }
        else
            nc.push(component_funct ? component_funct(Data, struc[i], extras) : struc[i]);
    }
    return nc;
}

function removeRedundantConversions(Data, struc)
{
    function ast_fun(Data, struc) {
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
    
    var nc = operateAST(Data, struc, undefined, ast_fun);
    if (nc[0].indexOf("Push") == 0)
    {
        nc[0] = nc[0].replace("Push", "Return");
    }
    return nc;
}