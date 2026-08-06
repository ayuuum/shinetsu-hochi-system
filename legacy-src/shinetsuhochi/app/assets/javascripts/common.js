/* ■共通■HTMLの入力エリアに入力された文字、特に半角と全角文字が混ざっている時、
 バイト数(長さ)を半角は1、全角は2としてをカウントする */
 

function countLength(str) { 
    var r = 0; 
    for (var i = 0; i < str.length; i++) { 
        var c = str.charCodeAt(i); 
        // Shift_JIS: 0x0 ～ 0x80, 0xa0 , 0xa1 ～ 0xdf , 0xfd ～ 0xff 
        // Unicode : 0x0 ～ 0x80, 0xf8f0, 0xff61 ～ 0xff9f, 0xf8f1 ～ 0xf8f3 
        if ( (c >= 0x0 && c < 0x81) || (c == 0xf8f0) || (c >= 0xff61 && c < 0xffa0) || (c >= 0xf8f1 && c < 0xf8f4)) { 
            r += 1; 
        } else { 
            r += 2; 
        } 
    } 
    return r; 
}

function mySubmit(formName, url, method)
{
    // サブミットするフォームを取得
    var f = document.forms[formName];

    f.method = method; // method(GET or POST)を設定する
    f.action = url;    // action(遷移先URL)を設定する
    f.submit();        // submit する
    return true;
}

/*3桁区切りのカンマを挿入する*/
function format( comma, period) {

    comma = comma || ',';
    period = period || '.';
	var stri = this.replace("\u00A5","");
	
    var split = stri.toString().split('.');
    
    var numeric = split[0];
    var decimal = split.length > 1 ? period + split[1] : '';
    var reg = /(\d+)(\d{3})/;
    while ( reg.test(numeric)) {
        numeric = numeric.replace( reg, '$1' + comma + '$2');
    }
    return  "\u00A5" + numeric + decimal;
}

function to_hoshurireki(bukenCode, hachushaCode) {
	var url = "http://" + location.host + "/hoshurireki/index/" + bukenCode + "/" + hachushaCode;
	win = window.open(url,"hoshurireki","resizeable=no,scrollbars=yes,status=no");
}


