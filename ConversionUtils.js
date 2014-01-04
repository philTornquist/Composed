function output_of(conversion)
{
	return conversion.split(",")[0];
}

function inputs_of(conversion) 
{
	var split = conversion.split(":")[0].split(",");
	split.shift();
	return split;
}
function selectors_of(conversion) 
{
    var split = conversion.split(":");
    if (split.length == 1) return [];
    split = split[1].split(",");
    return split;
}
function selector_type(selector) 
{
    return selector.split("-")[0];
}
function selector_select(selector) 
{
    return selector.split("-")[1];
}
function is_generic(type) 
{
	return type.indexOf("[") !== -1;
}
function generic_variable(type) 
{
	return type.substring(type.indexOf("[")+1, type.indexOf("]"));
}
function generic_type(type) 
{
	return type.substring(type.indexOf("]")+1, type.length);
}
