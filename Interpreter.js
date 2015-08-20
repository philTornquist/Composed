
function Interpret(Data, call, args, subconvs) {

	function L(obj) {
		return JSON.parse(JSON.stringifyOnce(obj));
	}

	var init = {
		call: call,
		args: args,
		stack: [[]],
		answers: [],
		subconvs: {},
		index: 0
	};
	var call_stack = [init];

	function ASK(asking) {
		var answer = frame.answers[0][asking];
		if (answer === undefined)
			frame.stack[frame.stack.length-1].push("Nothing");
		else {
			var ask = {
				call: answer.call,
				args: answer.args,
				stack: [[]],
				answers: answer.answers,
				subconvs: answer.subconvs,
				index: answer.index,
				end: answer.end
			};
			call_stack.push(ask);
			log_js_execution(["Asking: " + asking]);
		}
	}
	function SUB(subconv) {
		var subname = Data.SubConversions[frame.call][subconv.split(",")[0]].name;
		var sub = call_stack[call_stack.length-1].subconvs[subname];
		if (sub === undefined) throw 'error';
		var conv = {
			call: sub.call,
			args: sub.args,
			stack: [[]],
			answers: sub.answers,
			subconvs: sub.subconvs,
			index: sub.index,
			end: sub.end
		};
		call_stack.push(conv);
		log_js_execution(["Subconversion: " + subname]);
	}

	var insLimit = 4000000;
	while(call_stack.length > 0) {

		insLimit--;
		if (insLimit < 0)
			throw "Instruction Limit Reached";
		
		var frame = call_stack[call_stack.length-1];

		if (Data.Conversions[frame.call] === undefined)
			create_conversion(Data, frame.call);

		if (Data.Conversions[frame.call] === undefined) {
			
			var inputs = inputs_of(frame.call);
			var output = output_of(frame.call);
			if (is_selector(inputs[0]))
			{
				var selects = [];
				var newCall = output;
				
				var args = [];
				for (var i = 0; i < frame.args.length; i++)
					args.push(frame.args[i]);
				
				for (var i = 0; i < inputs.length; i++)
				{
					if (is_selector(inputs[i]))
					{
						var sel = args.splice(i, 1); 
						selects.push(sel[0]);
					}
					else
						newCall += "," + inputs[i];
				}
				
				newCall += ":" + selects.join(",");

				frame.call = newCall;
				frame.args = args;
			}
		}

		if (Data.Conversions[frame.call].length <= frame.index || (frame.end !== undefined && frame.index >= frame.end)) {
			call_stack.pop();
			if (call_stack.length == 0) {
				//console.log(Data);
				return frame.stack.pop().pop();
			}
			var stack = call_stack[call_stack.length-1].stack;
			var ret = frame.stack.pop().pop();
			log_js_execution("RETURN: " + ret);
			log_js_execution([]);
			stack[stack.length-1].push(ret);
			//console.log("RET", L(ret));
			continue;
		}


		var ins = Data.Conversions[frame.call][frame.index];
		frame.index++;
		
		//console.log(ins, L(frame), L(call_stack));


		switch(PSins(ins)) {
			case "SubConversion":
				var sub = {
					call: frame.call,
					args: frame.args,
					stack: [[]],
					answers: [frame.answers[0]],
					subconvs: frame.subconvs,
					index: frame.index
				};
				frame.subconvs[PSdata(ins)] = sub;

				var call_count = 0;
				for(; frame.index < Data.Conversions[frame.call].length; frame.index++) {
					var i = Data.Conversions[frame.call][frame.index];
					if (PSins(i) == "Enter" || PSins(i) == "Element") call_count++;
					if (PSins(i) == "Call" || PSins(i) == "Extract") call_count--;
					if (call_count === 0) break;
				}
				frame.index++;
				sub.end = frame.index;
				break;
			case "Enter":
				frame.stack.push([]);
				frame.answers.push({});
				break;    
			case "Call":
				var call = {
					call: PSdata(ins),
					args: frame.stack.pop(),
					stack: [[]],
					answers: [frame.answers.pop()],
					subconvs: {},
					index: 0
				};
				call_stack.push(call);
				log_js_execution([call.call + ": " + call.args]);
				break;
			case "Element":
				frame.stack.push([]);
				break;
			case "Extract":

				var inputs = inputs_of(frame.call);
				if (inputs.length == 1 && inputs_of(Data.Types[inputs[0].split("'")[0]]).length == 1) {
					var val = frame.stack.pop();
					var v = val[PSdata(ins)];
					frame.stack[frame.stack.length-1].push(v);
				}
				else {
					var val = frame.stack.pop();
					var v = val[0][PSdata(ins)];
					frame.stack[frame.stack.length-1].push(v);
				}
				break;
			case "Ask":
				ASK(PSdata(ins));
				break;
			case "Answer":
				var answer = {
					call: frame.call,
					args: frame.args,
					stack: [[]],
					answers: [frame.answers[0]],
					subconvs: frame.subconvs,
					index: frame.index
				};
				frame.answers[frame.answers.length-1][PSdata(ins)] = answer;

				var call_count = 0;
				for(; frame.index < Data.Conversions[frame.call].length; frame.index++) {
					var i = Data.Conversions[frame.call][frame.index];
					if (PSins(i) == "Enter" || PSins(i) == "Element") call_count++;
					if (PSins(i) == "Call" || PSins(i) == "Extract") call_count--;
					if (call_count === 0) break;
				}
				frame.index++;
				answer.end = frame.index;
				break;
			case "Param":
				frame.stack[frame.stack.length-1].push(frame.args[PSdata(ins)]);
				break;
			case "Sub":
				SUB(PSdata(ins));
				break;
			case "Data Structure":
				if (frame.args.length == 1)
					frame.stack[frame.stack.length-1].push(frame.args[0]);
				else {
					var inputs = inputs_of(frame.call);
					for (var key in inputs) {
						if (key == 'addInOrder') continue;
						frame.args[inputs[key]] = frame.args[key];
					}
					frame.stack[frame.stack.length-1].push(frame.args);
				}
				break;
			case "Number":
				frame.stack[frame.stack.length-1].push(PSdata(ins));
				break;
			case "Nothing":
				frame.stack[frame.stack.length-1].push("Nothing");
				break;
			case "Character":
				frame.stack[frame.stack.length-1].push(PSdata(ins));
				break;
			case "Selector":
				frame.stack[frame.stack.length-1].push(PSdata(ins));
				break;

			case "ENTER":
				throw "tyfgh";
				break;

			case "EXISTS":
				if (frame.args[0] === "Nothing")
					ASK("no");
				else
					ASK("yes");
				break;
			case "SUM":
				var a1 = (typeof frame.args[0] == 'string') ? parseFloat(frame.args[0]) : frame.args[0];
				var a2 = (typeof frame.args[1] == 'string') ? parseFloat(frame.args[1]) : frame.args[1];
				frame.stack[frame.stack.length-1].push(a1 + a2);
				break;
			case "DIFFERENCE":
				var a1 = (typeof frame.args[0] == 'string') ? parseFloat(frame.args[0]) : frame.args[0];
				var a2 = (typeof frame.args[1] == 'string') ? parseFloat(frame.args[1]) : frame.args[1];
				frame.stack[frame.stack.length-1].push(a1 - a2);
				break;
			case "PRODUCT":
				var a1 = (typeof frame.args[0] == 'string') ? parseFloat(frame.args[0]) : frame.args[0];
				var a2 = (typeof frame.args[1] == 'string') ? parseFloat(frame.args[1]) : frame.args[1];
				frame.stack[frame.stack.length-1].push(a1 * a2);
				break;
			case "QUOTIENT":
				var a1 = (typeof frame.args[0] == 'string') ? parseFloat(frame.args[0]) : frame.args[0];
				var a2 = (typeof frame.args[1] == 'string') ? parseFloat(frame.args[1]) : frame.args[1];
				frame.stack[frame.stack.length-1].push(a1 / a2);
				break;
			case "MODULUS":
				var a1 = (typeof frame.args[0] == 'string') ? parseFloat(frame.args[0]) : frame.args[0];
				var a2 = (typeof frame.args[1] == 'string') ? parseFloat(frame.args[1]) : frame.args[1];
				frame.stack[frame.stack.length-1].push(a1 % a2);
				break;
			case "SQRT":
				var a1 = (typeof frame.args[0] == 'string') ? parseFloat(frame.args[0]) : frame.args[0];
				frame.stack[frame.stack.length-1].push(Math.sqrt(a1));
				break;
			case "SQUARE":
				var a1 = (typeof frame.args[0] == 'string') ? parseFloat(frame.args[0]) : frame.args[0];
				frame.stack[frame.stack.length-1].push(a1 * a1);
				break;
			case "COMPARE":
				if (frame.args[0] == frame.args[1])
					ASK("equal");
				else if (frame.args[0] < frame.args[1])
					ASK("less");
				else
					ASK("greater");
				break;
		}
	}
}
JSON.stringifyOnce = function(obj, replacer, indent){
    var printedObjects = [];
    var printedObjectKeys = [];

    function printOnceReplacer(key, value){
        if ( printedObjects.length > 2000){ // browsers will not print more than 20K, I don't see the point to allow 2K.. algorithm will not be fast anyway if we have too many objects
        return 'object too long';
        }
        var printedObjIndex = false;
        printedObjects.forEach(function(obj, index){
            if(obj===value){
                printedObjIndex = index;
            }
        });

        if ( key == ''){ //root element
             printedObjects.push(obj);
            printedObjectKeys.push("root");
             return value;
        }

        else if(printedObjIndex+"" != "false" && typeof(value)=="object"){
            if ( printedObjectKeys[printedObjIndex] == "root"){
                return "(pointer to root)";
            }else{
                return "(see " + ((!!value && !!value.constructor) ? value.constructor.name.toLowerCase()  : typeof(value)) + " with key " + printedObjectKeys[printedObjIndex] + ")";
            }
        }else{

            var qualifiedKey = key || "(empty key)";
            printedObjects.push(value);
            printedObjectKeys.push(qualifiedKey);
            if(replacer){
                return replacer(key, value);
            }else{
                return value;
            }
        }
    }
    return JSON.stringify(obj, printOnceReplacer, indent);
};
