var HISTORY = [];
var BEGIN = "";
var END = "";
var DOM = "";
function LOG(str)
{
    if (str instanceof Array)
    {
        //var blank_line = false;
        //var title = "";
        if (str.length != 1)
        {
           // blank_line = true;
           // BEGIN = BEGIN.substring(2);
           // HISTORY.pop();

			DOM += "</div></div>";
        }
        else
        {
         //   title = str[0].toString();
          //  HISTORY.push(str[0]);

			DOM += "<div><label onclick=\"var div=this.parentNode.children[1];console.log(div); if (div.style.display == 'none'){div.style.display='block';this.innerHTML='-'+this.innerHTML.substring(1);}else{div.style.display='none'; this.innerHTML = '+'+this.innerHTML.substring(1);}\">+ " + str[0].toString() + '</label><div style="display:none;margin-left:30px; border:1px solid #000;">';
        }

/*
        var end_stuff = "";
        for(var i = title.length; i < 80; i++)
            end_stuff += "-";

        print(BEGIN + "+--" + title + end_stuff);
        if (blank_line)
            print(BEGIN);

        if (str.length == 1) BEGIN += "| ";
		*/
    }
    else
    {
		DOM += '<pre style="margin: 0; padding: 0;">' + str.toString() + '</pre>';
	/*
        var split = str !== undefined ? str.toString().split('\n') : ["undefined"];
        for (var i = 0; i < split.length; i++){
            print(BEGIN + split[i]);

			DOM += split[i];
		}
		*/
    }

	document.getElementById("LOG_DIV").innerHTML = DOM;
}
NLOG = function(){};
if (print === undefined)
{
    function print(str)
    {
        document.getElementById("output").value += str + "\n";
    }
}
