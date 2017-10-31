/**
 * Execute the user's code.
 * Just a quick and dirty eval.  No checks for infinite loops, etc.
 */

 
function runJS() {
	var code = Blockly.Generator.workspaceToCode('JavaScript');
	try {
		eval(code);
	} catch (e) {
		alert('Program error:\n' + e);
	}
    
    
    // 황태상 여기 수정 !!
}

/**
 * Backup code blocks to localStorage.
 */
function backup_blocks() {
	if ('localStorage' in window) {
		var xml = Blockly.Xml.workspaceToDom(Blockly.mainWorkspace);
		window.localStorage.setItem('arduino', Blockly.Xml.domToText(xml));
	}
}

/**
 * Restore code blocks from localStorage.
 */
function restore_blocks() {
	if ('localStorage' in window && window.localStorage.arduino) {
		var xml = Blockly.Xml.textToDom(window.localStorage.arduino);
		Blockly.Xml.domToWorkspace(Blockly.mainWorkspace, xml);

		renderContent();
	}
}

/**
 * Save Arduino generated code to local file.
 */
function saveCode() {
	var fileName = window.prompt('What would you like to name your file?', 'BlocklyDuino')
		//doesn't save if the user quits the save prompt
		if (fileName) {
			var blob = new Blob([Blockly.Arduino.workspaceToCode()], {
					type: 'text/plain;charset=utf-8'
				});
			saveAs(blob, fileName + '.ino');
		}
}

/**
 * Save blocks to local file.
 * better include Blob and FileSaver for browser compatibility
 */
function save() {
	var xml = Blockly.Xml.workspaceToDom(Blockly.mainWorkspace);
	var data = Blockly.Xml.domToText(xml);
	var fileName = window.prompt('What would you like to name your file?', 'BlocklyDuino');
	// Store data in blob.
	// var builder = new BlobBuilder();
	// builder.append(data);
	// saveAs(builder.getBlob('text/plain;charset=utf-8'), 'blockduino.xml');
	if (fileName) {
		var blob = new Blob([data], {
				type: 'text/xml'
			});
		saveAs(blob, fileName + ".xml");
	}
}

/**
 * Load blocks from local file.
 */
function load(event) {
	var files = event.target.files;
	// Only allow uploading one file.
	if (files.length != 1) {
		return;
	}

	// FileReader
	var reader = new FileReader();
	reader.onloadend = function (event) {
		var target = event.target;
		// 2 == FileReader.DONE
		if (target.readyState == 2) {
			try {
				var xml = Blockly.Xml.textToDom(target.result);
			} catch (e) {
				alert('Error parsing XML:\n' + e);
				return;
			}
			var count = Blockly.mainWorkspace.getAllBlocks().length;
			if (count && confirm('Replace existing blocks?\n"Cancel" will merge.')) {
				Blockly.mainWorkspace.clear();
			}
			Blockly.Xml.domToWorkspace(Blockly.mainWorkspace, xml);
		}
		// Reset value of input after loading because Chrome will not fire
		// a 'change' event if the same file is loaded again.
		document.getElementById('load').value = '';
	};
	reader.readAsText(files[0]);
}

/**
 * Discard all blocks from the workspace.
 */
function discard() {
	var count = Blockly.mainWorkspace.getAllBlocks().length;
	//if (count < 2 || window.confirm('Delete all ' + count + ' blocks?')) {
	if (count < 2 || window.confirm('총 ' + count + ' 개의 블럭이 있습니다. 정말 지우시겠습니까?')) {
		Blockly.mainWorkspace.clear();
		renderContent();
	}
}

/*
 * auto save and restore blocks
 */
function auto_save_and_restore_blocks() {
	// Restore saved blocks in a separate thread so that subsequent   // 저장된 블록을 별도의 스레드로 복원하면 이후의
	// initialization is not affected from a failed load.          // 초기화는 실패한로드의 영향을받지 않습니다.
	window.setTimeout(restore_blocks, 0);
	// Hook a save function onto unload.                     // unload시 저장함수를 연결함.
	bindEvent(window, 'unload', backup_blocks);
	tabClick(selected);

	// Init load event.
	var loadInput = document.getElementById('load');
	loadInput.addEventListener('change', load, false);
	document.getElementById('fakeload').onclick = function () {
		loadInput.click();
	};
}

/**
 * Bind an event to a function call.
 * @param {!Element} element Element upon which to listen.
 * @param {string} name Event name to listen to (e.g. 'mousedown').
 * @param {!Function} func Function to call when event is triggered.
 *     W3 browsers will call the function with the event object as a parameter,
 *     MSIE will not.
 */
function bindEvent(element, name, func) {
	if (element.addEventListener) { // W3C
		element.addEventListener(name, func, false);
	} else if (element.attachEvent) { // IE
		element.attachEvent('on' + name, func);
	}
}

//loading examples via ajax
var ajax;
function createAJAX() {
	if (window.ActiveXObject) { //IE
		try {
			return new ActiveXObject("Msxml2.XMLHTTP");
		} catch (e) {
			try {
				return new ActiveXObject("Microsoft.XMLHTTP");
			} catch (e2) {
				return null;
			}
		}
	} else if (window.XMLHttpRequest) {
		return new XMLHttpRequest();
	} else {
		return null;
	}
}

function onSuccess() {
	if (ajax.readyState == 4) {
		if (ajax.status == 200) {
			try {
				var xml = Blockly.Xml.textToDom(ajax.responseText);
			} catch (e) {
				alert('Error parsing XML:\n' + e);
				return;
			}
			var count = Blockly.mainWorkspace.getAllBlocks().length;
			if (count && confirm('Replace existing blocks?\n"Cancel" will merge.')) {
				Blockly.mainWorkspace.clear();
			}
			Blockly.Xml.domToWorkspace(Blockly.mainWorkspace, xml);
		} else {
			alert("Server error");
		}
	}
}

function load_by_url(uri) {
	ajax = createAJAX();
	if (!ajax) {
		　　 alert('Not compatible with XMLHttpRequest');
		　　 return 0;
		　
	}
	if (ajax.overrideMimeType) {
		ajax.overrideMimeType('text/xml');
	}

	　　ajax.onreadystatechange = onSuccess;
	　　ajax.open("GET", uri, true);
	　　ajax.send("");
}

// Spinner 를 찾지 못하는 오류때문에 주석처리를 하였지만, 뭔지 파악하여 진짜 필요없는건지 있는건지 알아내야함. BY.HTS
function uploadCode(code, url, method, callback) {
	var target = document.getElementById('content_arduino');
	//alert("target : " + target);
	//var spinner = new Spinner().spin(target);

	// var url = "http://127.0.0.1:8080/";
	// var method = "POST";

	// You REALLY want async = true.
	// Otherwise, it'll block ALL execution waiting for server response.
	var async = true;

	var request = new XMLHttpRequest();

	request.onreadystatechange = function () {
		if (request.readyState != 4) {
			return;
		}

		//spinner.stop();

		var status = parseInt(request.status); // HTTP response status, e.g., 200 for "200 OK"
		var errorInfo = null;
		switch (status) {
		case 200:
			break;
		case 0:
			errorInfo = "code 0\n\nCould not connect to server at " + url + ".  Is the local web server running?";
			break;
		case 400:
			errorInfo = "code 400\n\nBuild failed - probably due to invalid source code.  Make sure that there are no missing connections in the blocks.";
			break;
		case 500:
			errorInfo = "code 500\n\nUpload failed.  Is the Arduino connected to USB port?";
			break;
		case 501:
			errorInfo = "code 501\n\nUpload failed.  Is 'ino' installed and in your path?  This only works on Mac OS X and Linux at this time.";
			break;
		default:
			errorInfo = "code " + status + "\n\nUnknown error.";
			break;
		};

		callback(status, errorInfo);
	};

	request.open(method, url, async);
	request.setRequestHeader("Content-Type", "text/plain;charset=UTF-8");
	request.send(code);
}

function uploadClick() {
	var code = document.getElementById('content_arduino').value;

	alert("Ready to upload to Arduino.");

	uploadCode(code, "http://127.0.0.1:8080/", "POST", function (status, errorInfo) {
		if (status == 200) {
			alert("Program uploaded ok");
		} else {
			alert("Error uploading program: " + errorInfo);
		}
	});
}

var i = 1; //  set your counter to 1

function myLoop() { //  create a loop function
	setTimeout(function () { //  call a 3s setTimeout when the loop is called
		alert('hello'); //  your code here
		i++; //  increment the counter
		if (i < 10) { //  if the counter < 10, call the loop function
			myLoop(); //  ..  again which will trigger another
		} //  ..  setTimeout()
	}, 3000)
}

// arduino - delay와 같은 기능을 가진 함수. await 접두어를 붙여 호출해야하며, async method에서만 작동을 한다.
function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

var code = "";
var BT_ARR = new Array();
var BT_ARR_IDX = 0;
// var Call_Status=true;

var GLOBAL_LINE = 0;
// var GLOBAL_LENGTH = 0;

var repeat_cnt = 0;
var call_BT_WORK = 0;

var R_Idx_Arr = new Array();
var I_Idx_Arr = new Array();

async function BT_Data_Sending() {
	var Repeat_index = 0; // 블록중 Repeat 블록의 개수를 저장할 변수
	var Repeat_count = 0; // Repeat 블록을 만나서 is_Reeart_If 함수로 뛸때마다 카운트.
	// if(code == "")
	// {
	// bluetooth 코드가 실행될 때마다 이전의 명령어들은 지워준다.
	if (BT_ARR.length > 0) {
		BT_ARR = null;
		BT_ARR = new Array();
	}

	code = Blockly.Arduino.workspaceToCode();

	var loop = code.split("loop()\n{");
	var slice_loop = loop[1].slice(0, -1);
	//console.log("slice_loop : "+ slice_loop);
	var OneLine_Arr = slice_loop.split("\n");
	//console.log("OneLine_Arr : "+ OneLine_Arr);
	var length = 0;

	for (key in OneLine_Arr) {
		if (OneLine_Arr[key] != "") {
			//console.log("OneLine_Arr["+length+"] : " + OneLine_Arr);
			length++;
		}

	}
	for (var index = 0; index <= length; index++) {
		if ((OneLine_Arr[index] == "" && index > 0)) {
			break;
		}
		if (OneLine_Arr[index] != "" && OneLine_Arr[index].indexOf("//") != -1) {
			var Comments = OneLine_Arr[index].split("//");
			var Comments_Arr = Comments[1].split("_");
			if (Comments_Arr[0] == " REPEATSTART") {
				Repeat_index++;
			}
			// console.log("Comments_Arr : " + Comments_Arr);
		}
	}

	//console.log("length = " + length);

	for (var i = 0; i <= length; i++) {
		/* block이 결합되어 있지 않다면 end.*/
		// if((OneLine_Arr[i] == "" && i > 0))
		// {
		// break;
		// }

		// 공백이 아니거나 // 주석이 달려있는 놈들 중에서..
		if (OneLine_Arr[i] != "" && OneLine_Arr[i].indexOf("//") != -1) {
			var Comments = OneLine_Arr[i].split("//"); // 주석 뗌 ex) [0] : for~~~~, [1] : REPEATSTART_3
			//console.log("Comments : "+ Comments);

			var Comments_Arr = Comments[1].split("_"); // _ 뗌
			//console.log("Comments_Arr : "+ Comments_Arr); // ex ) [0] : REPEATSTART, [1]: 3
			var Action = Comments_Arr;
			//console.log(" " + i + "LineAction : " + Action);
			switch (Action[0]) {
				// LOGIC & DEVICE
				/*case " FORSTART":
				// alert("switch in FORSTART");
				var Repeat = Action[2] - Action[1] + 1; // 반복횟수

				var line = 0;

				for(var j = 1; j <= Repeat; j++)
			{
				while(OneLine_Arr[i+line] != "  } // FOREND")
			{
				// alert("OneLine_Arr[i+line] = " + OneLine_Arr[i+line]);
				line++;
				if(OneLine_Arr[i+line].indexOf("//") != -1)
			{
				var operator = OneLine_Arr[i+line].split("//");

				if(operator[1] != " FOREND")
			{
				var operator2 = operator[1].split("_");
				BT_ARR[BT_ARR_IDX] = operator2;
				BT_ARR_IDX++;
				// BT_ARR[BT_ARR_IDX] = OneLine_Arr[i+line];
				}
				}
				}
				// BT_ARR[BT_ARR_IDX] = OneLine_Arr[i+j];
				if(j < Repeat)
				line = 0;
				else
				i = line;
				}
				break;

				case " FOREND":
				break;*/

			case " REPEATSTART":	// REPEATSTART_IDX_REPEAT
				BT_Sending_Work("REPEAT", Action[1], Action[2], i);
				i = GLOBAL_LINE;
				

				break;

			case " REPEATEND":
				//console.log("IN RepeatEnd");
				break;

			case " IFSTART": // 조건이 true이건 false이건 둘다 if 문 안의 line counting은 되어야 한다. 실제 명령어는 true일 때만 만들어주자.
				// Action[1] -> condition
				// alert("switch in IFSTART");
				//console.log("InIF case");
				
				// IFSTART_CONDITION
				BT_Sending_Work("IF", Action[1], Action[2], i);

				break;

			case " IFEND":
				// alert("switch in IFEND");
				break;
			case " ELSEIFSTART":
				var line = i;
				var repeat_line = 0;
				while (OneLine_Arr[line] != "  } // ELSEIFEND") {
					line++;
					if (OneLine_Arr[line].indexOf("REPEATSTART") != -1 && Action[1] == "true") {
						// alert("OneLine_Arr[line] = " + OneLine_Arr[line]);

						var repeat_ins_arr = OneLine_Arr[line].split("//");
						var repeat_arr = repeat_ins_arr[1].split("_");
						var repeat = repeat_arr[1];

						for (var repeat_i = 0; repeat_i < repeat; repeat_i++) {
							// alert("repeat = " + repeat);
							repeat_line = line + 1;
							while (true) {
								var isRepeatEnd_Arr = OneLine_Arr[repeat_line].split("//");

								if (isRepeatEnd_Arr[1] == " REPEATEND")
									break;

								var Repeat_oper = isRepeatEnd_Arr[1].split("_");
								BT_ARR[BT_ARR_IDX] = Repeat_oper;
								BT_ARR_IDX++;

								repeat_line++;
							}
						}

						line = repeat_line;
					} else if (OneLine_Arr[line].indexOf("//") != -1) {
						var operator = OneLine_Arr[line].split("//");

						if (operator[1] != " ELSEIFEND") {
							// alert("operator = " + operator[1]);
							// alert("operator = " + operator);
							if (Action[1] == "true") {
								var operator2 = operator[1].split("_");
								BT_ARR[BT_ARR_IDX] = operator2;
								BT_ARR_IDX++;
							}
						}
					}
				}

				i = line;
				break;
			case " ELSEIFEND":
				break;
			case " ELSESTART":
				var line = i;
				var repeat_line = 0;
				while (OneLine_Arr[line] != "  } // ELSEEND") {
					// alert("OneLine_Arr[line] = " + OneLine_Arr[line]);
					line++;
					if (OneLine_Arr[line].indexOf("REPEATSTART") != -1 && Action[1] == "true") {
						// alert("in if in repeat!");
						// alert("OneLine_Arr[line] = " + OneLine_Arr[line]);

						var repeat_ins_arr = OneLine_Arr[line].split("//");
						var repeat_arr = repeat_ins_arr[1].split("_");
						var repeat = repeat_arr[1];

						for (var repeat_i = 0; repeat_i < repeat; repeat_i++) {
							// alert("repeat = " + repeat);
							repeat_line = line + 1;
							while (true) {
								var isRepeatEnd_Arr = OneLine_Arr[repeat_line].split("//");

								if (isRepeatEnd_Arr[1] == " REPEATEND")
									break;

								var Repeat_oper = isRepeatEnd_Arr[1].split("_");
								BT_ARR[BT_ARR_IDX] = Repeat_oper;
								BT_ARR_IDX++;

								repeat_line++;
							}
						}

						line = repeat_line;
					} else if (OneLine_Arr[line].indexOf("//") != -1) {
						var operator = OneLine_Arr[line].split("//");

						// alert("operator = " + operator);

						if (operator[1] != " ELSEEND") {
							// alert("operator = " + operator[1]);
							// alert("operator = " + operator);
							if (Action[1] == "true") {
								var operator2 = operator[1].split("_");
								BT_ARR[BT_ARR_IDX] = operator2;
								BT_ARR_IDX++;
							}
						}
					}
				}

				i = line;
				break;
			case " ELSEEND":
				break;
			default:
				BT_ARR[BT_ARR_IDX] = Action;
				BT_ARR_IDX++;
				GLOBAL_LINE++;
				break;

			}
		}
	}
	BT_ARR_IDX = 0;

	// alert("BT_ARR.length = " + BT_ARR.length);

	for (var k = 0; k < BT_ARR.length; k++) {
		//console.log("BT_ARR.length : " + BT_ARR.length);
		//console.log("BT_ARR[" + k + "] : " + BT_ARR[k]);
		switch (BT_ARR[k][0]) {
			// DEVICE
		case " LCD":
			// BT_ARR[k][1] = method
			// BT_ARR[k][2] = parameter
			var KindOfAction = BT_ARR[k][1];
			//console.log("index : " + k + " KindOfAction : " + KindOfAction);
			switch (KindOfAction) {
			case "FILLSCREEN":
				// BT_ARR[k][2] = color
				var screen_color = BT_ARR[k][2];

				uploadCode(code, "http://127.0.0.1:8000/LCD.html?action=fillscreen&param=" + screen_color, "get", function (status, errorInfo) {});
				break;
			case "DRAWFACE":
				// BT_ARR[k][2] = kind of face
				var KindOfFace = BT_ARR[k][2];
				//console.log("KindOfFace11 : " + KindOfFace);
				uploadCode(code, "http://127.0.0.1:8000/LCD.html?action=drawface&param=" + KindOfFace, "get", function (status, errorInfo) {});
				break;
			case "TEXT":
				// BT_ARR[k][2] = cursor_x;
				// BT_ARR[k][3] = cursor_y;
				// BT_ARR[k][4] = textsize;
				// BT_ARR[k][5] = textcolor;
				// BT_ARR[k][6] = text;
				var cursor_x = BT_ARR[k][2];
				var cursor_y = BT_ARR[k][3];
				var textsize = BT_ARR[k][4];
				var textcolor = BT_ARR[k][5];
				var text = BT_ARR[k][6];

				uploadCode(code, "http://127.0.0.1:8000/LCD.html?action=text&cursor_x=" + cursor_x +
					"&cursor_y=" + cursor_y +
					"&textsize=" + textsize +
					"&textcolor=" + textcolor +
					"&text=" + text, "get", function (status, errorInfo) {});
				break;
			}
			break;
		case " RGB":
			// BT_ARR[k][1] = method;
			// BT_ARR[k][2] = time;
			var KindOfAction = BT_ARR[k][1];

			switch (KindOfAction) {
			case "COLORWIPE":
				// BT_ARR[k][2] = red value
				// BT_ARR[k][3] = green value
				// BT_ARR[k][4] = blue value
				var red = BT_ARR[k][2];
				var green = BT_ARR[k][3];
				var blue = BT_ARR[k][4];

				uploadCode(code, "http://127.0.0.1:8000/RGB.html?action=colorwipe&red=" + red +
					"&green=" + green +
					"&blue=" + blue, "get", function (status, errorInfo) {});
				break;
			default:
				// Rainbow & RainbowCycle & TheaterChaseRainbow

				// BT_ARR[k][2] = interval time
				var time = BT_ARR[k][2];

				uploadCode(code, "http://127.0.0.1:8000/RGB.html?action=" + KindOfAction.toLowerCase() + "&time=" + time, "get", function (status, errorInfo) {});
				break;
			}
			break;
		case " TONE":
			// BT_ARR[k][1] = tone frequency;
			var fre = BT_ARR[k][1];
			var fre_delay = BT_ARR[k][2];
			console.log(BT_ARR);
			uploadCode(code, "http://127.0.0.1:8000/tone_state.html?state=play&fre=" + fre +"&fre_delay=" + fre_delay, "get", function (status, errorInfo) {}); // seo_170731
			break;
		case " NOTONE":
			uploadCode(code, "http://127.0.0.1:8000/tone_state.html?state=stop", "get", function (status, errorInfo) {});
			break;
		case " LED":
			// BT_ARR[k][1] = pin_number;
			// BT_ARR[k][2] = pin_state;
			var state = "";
			if (BT_ARR[k][2] == "HIGH") {
				state = "on";
			} else if (BT_ARR[k][2] == "LOW") {
				state = "off"
			}

			uploadCode(code, "http://127.0.0.1:8000/led_state.html?state=" + state, "get", function (status, errorInfo) {});
			break;
		case " DELAY":
			// BT_ARR[k][1] = delay_time;
			var delay_time = BT_ARR[k][1];
			await sleep(delay_time);
			break;
		case " MOTOR":
			// BT_ARR[k][1] = motor_direction;
			// BT_ARR[k][2] = motor_speed;
			var direction = "";

			if (BT_ARR[k][1] == "FORWARD") {
				direction = "forward";
			}
			if (BT_ARR[k][1] == "BACKWARD") {
				direction = "backward";
			} else if (BT_ARR[k][1] == "LEFT") {
				direction = "left";
			} else if (BT_ARR[k][1] == "RIGHT") {
				direction = "right";
			} else if (BT_ARR[k][1] == "STOP") {
				direction = "stop";
			}

			// alert("direction = " + direction);

			uploadCode(code, "http://127.0.0.1:8000/motor_direction.html?direction=" + direction + "&speed=" + BT_ARR[k][2], "get", function (status, errorInfo) {});
			break;
		default:
			// alert("switch in default ---------- Action[0] = " + Action[0]);
			break;
		}

	}
	// BT_Sending_Work(BT_ARR);
	function is_Reeart_If(Action, Idx, Param, i) {
		console.log("In_is_Reeart_If");
		Repeat_count++;

		if (Action == " IFSTART") {
			Action = "IF";

			BT_Sending_Work(Action, null, Param, i);
		} else if (Action == " REPEATSTART") {
			Action = "REPEAT";

			BT_Sending_Work(Action, Idx, Param, i);
		}
	}
	
	// var Is_Escape = false;

	async function BT_Sending_Work(Action, Idx, Param, i) // Action[0], Action[1]값
	{
		call_BT_WORK++;
		var R_line = 0;
		var I_line = 0;
		var isEscape_Idx = -1;
		switch (Action) {
		case "REPEAT":
			// if(Is_Escape) Is_Escape = false;
			var Repeat = Param;
			R_Idx_Arr.push(Idx);
			
			var escape_Arr;
			
			for (var j = 1; j <= Repeat; j++) {
				// console.log("[push]R_Idx_Arr = " + R_Idx_Arr);
				var Idx_Arr_length = R_Idx_Arr.length - 1;
				
				// while (OneLine_Arr[i + R_line].indexOf("REPEATEND") == -1 && R_Idx_Arr[Idx_Arr_length] != isEscape_Idx) // && S_Idx != isEscape_Idx && j <= Repeat) {
				while (OneLine_Arr[i + R_line].indexOf("REPEATEND_" + R_Idx_Arr[Idx_Arr_length]) == -1) // && R_Idx_Arr[Idx_Arr_length] != isEscape_Idx) // && S_Idx != isEscape_Idx && j <= Repeat) {
				{
					R_line++;
					
					if (OneLine_Arr[i + R_line].indexOf("//") != -1) // OneLine_Arr 에 "//"라는 문자열이 없다면 -1 리턴 // 있으면 해당 index가 return.
					{
						var operator = OneLine_Arr[i + R_line].split("//");
						escape_Arr = operator[1].split("_");
						
						if (operator[1].indexOf("REPEATEND") == -1) {
							var operator2 = operator[1].split("_"); // IFSTART,true
							if (operator2[0] == " REPEATSTART") {
								is_Reeart_If(operator2[0], operator2[1], operator2[2], (i + R_line)); //Action, Idx, Param, i
								R_line += repeat_cnt;
								repeat_cnt = 0;
							} else if(operator2[0] == " IFSTART") {
								is_Reeart_If(operator2[0], null, operator2[2], (i + R_line)); //Action, Idx, Param, i
							} else {
								BT_ARR[BT_ARR_IDX] = operator2;
								BT_ARR_IDX++;
							}
						}
					}
					
					//console.log("OneLine_Arr[i + R_line] = " + OneLine_Arr[i + R_line]);
					// console.log("R_Idx_Arr[" + Idx_Arr_length + "] = " + R_Idx_Arr[Idx_Arr_length] + " // isEscape_Idx = " + isEscape_Idx);
				}

				if (j < Repeat)
					R_line = 0;
				else {
					repeat_cnt = R_line;
				}
				//console.log("while 탈출");
			}

			R_Idx_Arr.pop();
			// console.log("[pop]R_Idx_Arr = " + R_Idx_Arr);
			//console.log("for 탈출");
			GLOBAL_LINE = i + R_line;
			break;

		case "IF":
			// is_Reeart_If(Action, Param, i);
			// var line = i;
			
			var I_Idx_Arr_Sub = new Array();
			I_Idx_Arr_Sub.push(Idx);
			I_Idx_Arr_Sub.push(Param);
			
			I_Idx_Arr.push(I_Idx_Arr_Sub);
			
			console.log("I_Idx_Arr = " + I_Idx_Arr);
			
			console.log("In IF");
			console.log("OneLine_Arr[" + (i + I_line) + "] = " + OneLine_Arr[i + I_line]);
			
			// while (OneLine_Arr[i + I_line] != "  } // IFEND") {
			while (OneLine_Arr[i + I_line].indexOf("IFEND") == -1) {
				I_line++;
				if (OneLine_Arr[i + I_line].indexOf("//") != -1) //
				{
					var operator = OneLine_Arr[i + I_line].split("//");
					console.log("operator = " + operator);
					if (operator[1] != " IFEND") {
						// var if_param = Param;
						var if_param = operator[1].split("_");
						console.log("if_param[1] : " + if_param[1]);
						if (if_param[1] == "true") {
							var operator2 = OneLine_Arr[i + I_line].split("//");
							operator2 = operator2[1].split("_"); // LCD,DRAWFACE,NORMAL-RT
							// BT_ARR[BT_ARR_IDX] = operator2;
							// BT_ARR_IDX++;
							
							console.log("operator2 = " + operator2);

							// is_Reeart_If(operator2[0], operator[1], i+I_line);
							if (operator2[0] == " REPEATSTART") {
								is_Reeart_If(operator2[0], operator2[1], operator2[2], (i + I_line)); //Action, Idx, Param, i
								I_line += repeat_cnt;
								repeat_cnt = 0;
							} else if(operator2[0] == " IFSTART") {
								is_Reeart_If(operator2[0], null, operator2[2], (i + I_line)); //Action, Idx, Param, i
							} else {
								console.log("BT_ARR ADDED => " + operator2);
								BT_ARR[BT_ARR_IDX] = operator2;
								BT_ARR_IDX++;
							}
						}
					} else {
						break;
					}
				}
			}
			console.log(" i = " + i + " // I_line = " + I_line);
			GLOBAL_LINE = i + I_line;
			console.log("In Out");
			I_line = 0;
			break;

		default:
			// GLOBAL_LINE++;
			//console.log("Default");
			break;

		}
		// GLOBAL_LINE++;
		//console.log("method END");
	}
	//console.log("Repeat_index : " + Repeat_index);
	// Call_Status=true;
}
// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@


function resetClick() {
	//var code = "void setup() {" + "\n\tpinMode(5, OUTPUT);\n\tpinMode(6, OUTPUT);\n\tdigitalWrite(5, LOW);\n\tdigitalWrite(6, LOW);\n" + "} void loop() {}";

	var code = "void setup() {} void loop() {}";

	uploadCode(code, "http://127.0.0.1:8080/", "POST", function (status, errorInfo) {
		if (status != 200) {
			alert("Error resetting program: " + errorInfo);
		}
	});
}
