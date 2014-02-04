
function removeRedundantConversions(Data, struc)
{
    function subfun(Data, struc) {
        if (!(struc instanceof Array)) return struc;
        
        var nc = [];
        for (var i = 0; i < struc.length; i++) {
            if (struc[i] instanceof Array) nc.push(removeRedundantConversions(Data, struc[i]));
            
            else { 
                var split = struc[i].split('>');
                var data = split[1];
                switch(split[0]) {
                    case "Enter":
                        if (inputs_of(data).length == 1)
                        {
                            if (Data.DataStructures[output_of(data)] == data && !Data.TypeSpecification[output_of(data)])
                                return removeRedundantConversions(Data, struc[i+1]);
                            if (Data.DataStructures[inputs_of(data)[0]] == inputs_of(data)[0]+","+output_of(data) && !Data.TypeSpecification[inputs_of(data)[0]])
                                return removeRedundantConversions(Data, struc[i+1]);
                        }
                        nc.push(struc[i]);
                        break;
                    default:
                        nc.push(struc[i]);
                        break;
                }
            }
        }
        return nc;
    };
    
    var nc = subfun(Data, struc);
    if (nc[0].indexOf("Push") == 0)
    {
        nc[0] = nc[0].replace("Push", "Return");
    }
    return nc;
}