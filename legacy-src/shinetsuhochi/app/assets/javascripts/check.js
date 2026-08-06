var message_str;
$(function(e) {

	$('#jump').click(function(e) {

		$("#message").html('<img align="left" src="/assets/images/message_question.png" />ログアウトしてトップページに戻ります。<br>よろしいですか？');	
		
		$("#message").dialog({
		autoOpen: true,
		modal: true,
		height:200,
		width:400,
		title: "確認",
		dialogClass: 'dlgclass',
		buttons: {    // ボタンを設定
		// 「はい」ボタンのテキストとイベントハンドラ
		'はい': function(event) {
			// event.target でボタンの要素を参照
			location.href = "http://" + location.host + "/index.html";
			$(this).dialog('close');
		},
        // 「いいえ」ボタンのテキストとイベントハンドラ
        'いいえ': function() { $(this).dialog('close'); }
   		}
	});
		
		
		
	});


	
});




function login_submit_chk1() { 			
	var str1 = $("input[name='txtId']").val();
	var str2 = $("input[name='txtPass']").val();

	if(str1.match( /[^0-9]+/ ) || countLength(str1) != 4) { 
        if (confirm ("IDは半角数字4文字で入力して下さい")){ 
			document.frmLogin.txtId.focus();
		}
      return false; 
	}  else if(str2.match( /[^0-9]+/ ) || countLength(str2) != 4) { 
        if (confirm ("パスワードは半角数字4文字で入力して下さい")){ 
			document.frmLogin.txtPass.focus();
		}
      return false; 
    } 
	document.frmLogin.ID = document.frmLogin.txtId.value;
	document.frmLogin.PASS = document.frmLogin.txtPass.value;
	mySubmit('frmLogin', 'admin_login.html', 'POST');
}

function jumpHome() {
	location.href = "http://" + location.host + "/index";
}

