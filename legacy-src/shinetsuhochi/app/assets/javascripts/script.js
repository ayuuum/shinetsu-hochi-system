/* ■共通■HTMLの入力エリアに入力された文字、特に半角と全角文字が混ざっている時、
 バイト数(長さ)を半角は1、全角は2としてをカウントする */
 

function Common_countLength(str) { 
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

function Common_mySubmit(formName, url, method)
{
    // サブミットするフォームを取得
    var f = document.forms[formName];

    f.method = method; // method(GET or POST)を設定する
    f.action = url;    // action(遷移先URL)を設定する
    f.submit();        // submit する
    return true;
}

function Common_RetConfirm() {
	var ret = confirm("ログアウトしてトップページに戻ります。\nよろしいですか？");
	if (ret) {
		location.href = "http://" + location.host + "/index.html";
	}
}




