
function operateAST(Data, struc, component_funct, ast_funct, conversion, extras)
{
    extras = extras ? extras : {};
    
    if ( !(struc instanceof Array)) {
        throw 'ee';
    }
    
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

function removeRedundantConversions(Data, struc)
{
    var nc = operateAST(Data, struc, undefined, ast_fun);
    if (nc[0].indexOf("Push") == 0)
    {
        nc[0] = nc[0].replace("Push", "Return");
    }
    return nc;
}


