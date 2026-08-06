class ApplicationController < ActionController::Base
    # Prevent CSRF attacks by raising an exception. 260, 450
    # For APIs, you may want to use :null_session instead.
    #ダイアログ初期定義
    MESSAGE_DEFAULT_HEIGHT = 200
    MESSAGE_DEFAULT_WIDTH = 400
    MESSAGE_DEFAULT_TITLE = '入力確認'
    MESSAGE_MESSAGE1_TITLE = '（入力確認）'
    MESSAGE_MESSAGE2_TITLE = '確認'
    MESSAGE_MESSAGE3_TITLE = '削除確認'

    #種別マスタの種別区分
    MKIND_KBN_TENKENTANTOSHA = 0 	#点検担当者区分
    MKIND_KBN_SETSUBISHUBETU = 1 	#設備種別区分
    MKIND_KBN_TENKENSHUBETU = 2 	#点検種別区分
    MKIND_KBN_TENKEN = 3 			#点検区分
    MKIND_KBN_SEIKYU = 4				#請求方法

    #点検担当者種別
    MKIND_TENKENTANTOSHA_SHANAI = 1		#社内
    MKIND_TENKENTANTOSHA_GAICHU = 2		#外注
    MKIND_TENKENTANTOSHA_KOJIN = 3		#個人
    MKIND_TENKENTANTOSHA_KAISHA = 4		#会社

    #設備種別
    MKIND_SETSUBISHUBETU_BOUKASETSUBI = 1		#防火設備
    MKIND_SETSUBISHUBETU_BOUKATAISHOBUTU = 2	#防火対象物
    MKIND_SETSUBISHUBETU_ETC = 3				#その他

    #点検種別
    MKIND_TENKENSHUBETU_SOUGOU = 11				#消防設備(総合)
    MKIND_TENKENSHUBETU_KIKI = 12				#消防設備(機器)
    MKIND_TENKENSHUBETU_BOUKATAISHOBUTU = 21	#防火対象物
    MKIND_TENKENSHUBETU_ITV = 31				#ITV
    MKIND_TENKENSHUBETU_TELEPHONE = 32			#電話
    MKIND_TENKENSHUBETU_ONKYO = 33				#音響
    MKIND_TENKENSHUBETU_RENKETSUSOU = 34		#連結送水管耐圧
    MKIND_TENKENSHUBETU_CHIKATANK = 35			#地下タンク
    MKIND_TENKENSHUBETU_ETC = 36				#その他

    #点検種別から設備種別を取得するハッシュ
    GetSetsubishubetu = {MKIND_TENKENSHUBETU_SOUGOU => MKIND_SETSUBISHUBETU_BOUKASETSUBI,
        MKIND_TENKENSHUBETU_KIKI => MKIND_SETSUBISHUBETU_BOUKASETSUBI,
        MKIND_TENKENSHUBETU_BOUKATAISHOBUTU => MKIND_SETSUBISHUBETU_BOUKATAISHOBUTU,
        MKIND_TENKENSHUBETU_ITV => MKIND_SETSUBISHUBETU_ETC,
        MKIND_TENKENSHUBETU_TELEPHONE => MKIND_SETSUBISHUBETU_ETC,
        MKIND_TENKENSHUBETU_ONKYO => MKIND_SETSUBISHUBETU_ETC,
        MKIND_TENKENSHUBETU_RENKETSUSOU => MKIND_SETSUBISHUBETU_ETC,
        MKIND_TENKENSHUBETU_CHIKATANK => MKIND_SETSUBISHUBETU_ETC,
        MKIND_TENKENSHUBETU_ETC => MKIND_SETSUBISHUBETU_ETC	}

    #点検区分
    MKIND_TENKENKUBUN_MAITOSHI = 1		#毎年
    MKIND_TENKENKUBUN_2NENGOTO = 2		#２年に１回
    MKIND_TENKENKUBUN_3NENGOTO = 3		#３年に１回
    MKIND_TENKENKUBUN_SPOT = 4			#スポット

    #請求方法
    MKIND_SEIKYUHOUHOU_IKKATSU = 1		#一括
    MKIND_SEIKYUHOUHOU_BUNKATSU = 2		#分割
    MKIND_SEIKYUHOUHOU_ZUIJI = 3		#随時

    #ユーザ管理　役割
    MPWD_UROLE_ADMIN = 0		#管理者
    MPWD_UROLE_TENKEN = 1	#点検担当者
    MPWD_UROLE_SYSTEM = 2	#システム

    MESSAGE_01 = ['message_warning', 'ログインIDまたはパスワードの入力が必要です。<br>&nbsp;&nbsp;','入力確認']
    MESSAGE_02 = ['message_warning', 'ログインIDまたはパスワードが間違っています。<br>もう一度入力して下さい。','入力確認']
    MESSAGE_03 = ['message_question', '業務を終了します。よろしいですか？','確認']
    MESSAGE_04 = ['message_warning', '点検担当者名,点検担当者種別が未入力です。','入力確認']
    MESSAGE_05 = ['message_warning', '点検担当者名が未入力です。','入力確認']
    MESSAGE_06 = ['message_warning', '点検担当者種別が未入力です。','入力確認']
    MESSAGE_07 = ['message_warning', 'この担当者名は既に登録されています。','入力確認']
    MESSAGE_08 = ['message_warning', '点検担当者IDを4桁の数値で入力してください。','入力確認']
    MESSAGE_09 = ['message_warning', '点検担当者パスワードを入力してください。','入力確認']

    MESSAGE_10 = ['message_warning', 'この点検担当者IDは既に登録されています。','入力確認']
    MESSAGE_11 = ['message_warning', 'パスワードは4桁以上の数字を入力してください。','入力確認']
    MESSAGE_12 = ['message_warning', '担当者名を選択してください。','入力確認']
    MESSAGE_13 = ['message_question', '選択した点検担当者を削除します。よろしいですか？','削除確認']
    MESSAGE_14 = ['message_warning', 'この担当者は変更できません。','確認']
    MESSAGE_15 = ['message_warning', 'この担当者は削除できません。','削除確認']
    MESSAGE_16 = ['message_warning', 'が未入力です。','入力確認']
    MESSAGE_17 = ['message_warning', '点検情報が未入力です。','入力確認']
    MESSAGE_18 = ['message_warning', '点検回数','入力確認']
    MESSAGE_19 = ['message_warning', '選択した担当者は削除されています。','入力確認']

    MESSAGE_20 = ['message_warning', '回目の外注費は入力できません。','入力確認']
    MESSAGE_21 = ['message_warning', '点検回数2回目の点検予定月は入力できません。','確認']
    MESSAGE_22 = ['message_warning', '発注者名に同一名がある場合、新規に登録はできません。','入力確認']
    MESSAGE_23 = ['message_question', 'ログアウトしてトップページに戻ります。よろしいですか？','確認']
    MESSAGE_24 = ['message_warning', '発注者名、または物件名のどちらかを入力してください。','入力確認']
    MESSAGE_25 = ['message_warning', '発注者を選択してください。','入力確認']
    MESSAGE_26 = ['message_warning', '複数選択できません。','入力確認']
    MESSAGE_27 = ['message_warning', '物件を選択してください。','入力確認']
    MESSAGE_28 = ['message_question', '物件情報を削除します。よろしいですか？','入力確認']
    MESSAGE_29 = ['message_question', '発注者マスタを変更します。\n登録されているこの発注者の情報が全て変更されますが、よろしいですか？','確認']

    MESSAGE_30 = ['message_question', 'この発注者を新規登録します。\nよろしいですか？','確認']
    MESSAGE_31 = ['message_warning', '点検担当者IDは社内の方のみへの発行となります。\n点検担当者種別または点検担当者IDを確認してください。','入力確認']
    MESSAGE_32 = ['message_warning', '点検担当者パスワードは社内の方のみへの発行となります。点検担当者種別または点検担当者パスワードを確認してください。','入力確認']
    MESSAGE_33 = ['message_question', '発行した点検担当者IDが無効となります。よろしいですか？','確認']
    MESSAGE_34 = ['message_warning', '過去分の情報が存在するため変更はできません。','入力確認']
    MESSAGE_35 = ['message_warning', '該当の点検情報はありません。','入力確認']
    MESSAGE_36 = ['message_warning', 'する点検情報を選択してください。','確認']
    MESSAGE_37 = ['message_warning', '追加する点検情報を選択してください。','確認']
    MESSAGE_38 = ['message_warning', '削除する点検情報を選択してください。','確認']
    MESSAGE_39 = ['message_warning', '選択した点検情報は登録済みです。','入力確認']

    MESSAGE_40 = ['message_warning', '該当の点検情報はありません。','入力確認']
    MESSAGE_41 = ['message_warning', '点検停止年度を選択してください。','入力確認']
    MESSAGE_42 = ['message_warning', '年度を選択してください。','入力確認']
    MESSAGE_43 = ['message_warning', '変更後点検ステータスを選択してください。','入力確認']
    MESSAGE_44 = ['message_warning', '変更後補修ステータスを選択してください。','入力確認']
    MESSAGE_45 = ['message_warning', 'ステータス変更するデータを選択してください。','入力確認']
    MESSAGE_46 = ['message_warning', '点検ステータスの順番に沿っていないため、点検ステータスを変更できません。','入力確認']
    MESSAGE_47 = ['message_warning', '補修ステータスの順番に沿っていないため、補修ステータスを変更できません。','入力確認']
    MESSAGE_48 = ['message_warning', '点検実績を登録してください。','入力確認']
    MESSAGE_49 = ['message_warning', '補修情報を登録してください。','入力確認']

    MESSAGE_50 = ['message_warning', '実績登録するデータを選択してください。','入力確認']
    MESSAGE_51 = ['message_warning', '点検停止されている物件は選択できません。','入力確認']
    MESSAGE_52 = ['message_warning', '点検完了日を入力してください。','入力確認']
    MESSAGE_53 = ['message_warning', '発生年月日を入力してください。','入力確認']
    MESSAGE_54 = ['message_warning', '補修完了日を入力してください。','入力確認']
    MESSAGE_55 = ['message_warning', '参照年度を選択してください。','入力確認']
    MESSAGE_56 = ['message_warning', '出力するデータがありません。','確認']
    MESSAGE_57 = ['message_question', '初期設定を行います。よろしいですか？','確認']
    MESSAGE_58 = ['message_info', '初期設定が終了しました。','確認']
    MESSAGE_59 = ['message_warning', '現在のパスワードを入力してください。','入力確認']

    MESSAGE_60 = ['message_warning', '現在のパスワードが間違っています。<br>もう一度入力して下さい。','入力確認']
    MESSAGE_61 = ['message_warning', '新しいパスワードを入力してください。<br>','入力確認']
    MESSAGE_62 = ['message_warning', '新しいパスワード（確認用）を入力してください。<br>','入力確認']
    MESSAGE_63 = ['message_warning', '新しいパスワードは4桁以上入力してください。<br>','入力確認']
    MESSAGE_64 = ['message_warning', '新しいパスワード（確認用）が間違っています。<br>もう一度入力して下さい。','入力確認']
    MESSAGE_65 = ['message_info', 'パスワードを変更しました。','確認']
    MESSAGE_66 = ['message_warning', '次年度データを作成し、','確認']
    MESSAGE_67 = ['message_info', '次年度データ作成と、データ削除が完了しました。','確認']
    MESSAGE_68 = ['message_info', '現在のデータをバックアップ後、','確認']
    MESSAGE_69 = ['message_warning', '補修情報を登録してください。','入力確認']

    MESSAGE_70 = ['message_warning', '該当の点検情報はありません。','入力確認']
    MESSAGE_71 = ['message_warning', '点検停止年度を選択してください。','入力確認']
    MESSAGE_72 = ['message_warning', '年度を選択してください。','入力確認']
    MESSAGE_73 = ['message_warning', '変更後点検ステータスを選択してください。','入力確認']
    MESSAGE_74 = ['message_warning', '変更後補修ステータスを選択してください。','入力確認']
    MESSAGE_75 = ['message_warning', 'ステータス変更するデータを選択してください。','入力確認']
    MESSAGE_76 = ['message_warning', '点検ステータスの順番に沿っていないため、点検ステータスを変更できません。','入力確認']
    MESSAGE_77 = ['message_warning', '補修ステータスの順番に沿っていないため、補修ステータスを変更できません。','入力確認']
    MESSAGE_78 = ['message_warning', '点検実績を登録してください。','入力確認']
    MESSAGE_79 = ['message_warning', '補修情報を登録してください。','入力確認']

    MESSAGE_80 = ['message_warning', 'この担当者名と点検担当者IDは既に登録されています。','入力確認']
    MESSAGE_81 = ['message_warning', '変更・削除する点検担当者を選択してください。','入力確認']
    MESSAGE_82 = ['message_warning', '選択した物件は再利用できません。','入力確認']
    MESSAGE_83 = ['message_question', '選択した点検情報を削除します。よろしいですか？','入力確認']
    MESSAGE_84 = ['message_question', '選択した点検情報を停止します。よろしいですか？','確認']
    MESSAGE_85 = ['message_warning', '設備種別にチェックがありません。','入力確認']

    MESSAGE_86 = ['message_warning', '現在のパスワードを入力してください。<br>','入力確認'] #楊健 2014-11-14 不具合43-15対応する
    MESSAGE_87 = ['message_question', 'リストアを','確認']
    MESSAGE_88 = ['message_warning', 'リストアするデータを選択してください。','入力確認']
    
    MESSAGE_89 = ['message_info', '点検が完了していないため、点検完了日を削除します。再度、登録ボタンを押してください。','入力確認']
    MESSAGE_90 = ['message_info', '補修が完了していないため、補修完了日を削除します。再度、登録ボタンを押してください。','入力確認']
    MESSAGE_91 = ['message_info', '実績が更新されている可能性があります。\n検索から再度行って下さい。','確認']

    MESSAGE_DBS_01 = ['message_warning','データベースの処理でエラーが発生しました。管理者に報告してください。01','入力確認']
    MESSAGE_DBS_02 = ['message_warning','データベースの処理でエラーが発生しました。管理者に報告してください。02','入力確認']

    #html表示(タグを直接記述)時にエスケープする文字列
    Str_pattern1 = /[<>&"]/
    ESCAPE_HTML = Hash["<" => "&lt;", ">" => "&gt;", "&" => "&amp;", '"' => "&quot;"]

    #SQLを直接実行する時エスケープする文字列
    Str_pattern2 = /[%_"']/
    ESCAPE_SQL = Hash['%' => '\%', '_' => '\_', '"' => '""', "'" => "''"]

    #明細行最大値
    MaxMmeisai = 2

    def current_user
        @current_user ||= MPwd.find(session[:user_id]) if session[:user_id]
    end
    helper_method :current_user

    #---------------------#
    # loginチェック管理者 #
    #---------------------#
    private

    def login_check
        if (session[:user_id].nil?)
            redirect_to :controller => 'admin_login'
            return false
        end
        return true
    end

    #-------------------------#
    # loginチェック点検担当者 #
    #-------------------------#
    def login_check_tenken
        if (session[:user_id_tenekn].nil?)
            redirect_to :controller => 'tenken_login'
            return false
        end
        @login_name = session[:login_name_tenekn]
        return true
    end

    #-------------------------#
    # loginチェック共通ページ #
    #-------------------------#
    def login_check_common
        if (session[:user_id_tenekn].nil? or session[:user_id_tenekn].nil?)
            redirect_to :controller => 'tenken_login'
            return false
        end
        return true
    end

    #---------------#
    #ダイアログ初期化#
    #---------------#
    def dialog_init
        @dialog_height = MESSAGE_DEFAULT_HEIGHT
        @dialog_width  = MESSAGE_DEFAULT_WIDTH
        @dialog_title  = MESSAGE_DEFAULT_TITLE
        @error_message = ['','']
    end

    #---------------------------------#
    #メンテナンスチェック #
    #---------------------------------#
    def mainte_check
        if MSysstatus.where(:sstatus => 0).exists? then

        else
            redirect_to :controller => 'maintenance'
        end
        return nil
    end

    #----------------#
    #年度更新チェック #
    #----------------#
    def nendo_check
        @init = MInit.all
        #今日
        d1 = Date.today
        #年度開始年月日
        d2 = Date.new(@init[0]["nendokaishiYMD"].strftime('%Y').to_i, @init[0]["nendokaishiYMD"].strftime('%m').to_i, @init[0]["nendokaishiYMD"].strftime('%d').to_i)
        #年度終了年月日
        d3 = Date.new(@init[0]["nendoshuryoYMD"].strftime('%Y').to_i, @init[0]["nendoshuryoYMD"].strftime('%m').to_i, @init[0]["nendoshuryoYMD"].strftime('%d').to_i)

        #年度終了日が今日より過去ならば
        if d3 - d1 < 0 then
            #初期設定Mのカラムを更新する
            #zennenY, tounenY, jinenY => 1プラス
            #新nendokaishiYMD => nendoshuryoYMD + 1日
            #新nendoshuryoYMD => 新nendokaishiYMD + １年 - 1日
            #kaishinendoM => 新nendokaishiYMDの年月
            @zennenY = @init[0]["zennenY"] + 1
            @tounenY = @init[0]["tounenY"] + 1
            @jinenY = @init[0]["jinenY"] + 1
            @nendokaishiYMD = d3 + 1
            @nendoshuryoYMD = (@nendokaishiYMD >> 12) - 1
            @kaishinendoM = @nendokaishiYMD.strftime('%Y%m')

            MInit.update_all(	:zennenY => @zennenY,
            :tounenY => @tounenY,
            :jinenY => @jinenY,
            :kaishinendoM => @kaishinendoM,
            :nendokaishiYMD => @nendokaishiYMD,
            :nendoshuryoYMD => @nendoshuryoYMD)

        end
    end

end
