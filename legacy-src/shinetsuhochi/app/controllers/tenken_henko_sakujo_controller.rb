class TenkenHenkoSakujoController < ApplicationController
    before_action :mainte_check
    before_action :login_check
    before_action :dialog_init
    def index

        @error = 0
        @m_pwd = MPwd.new
        @m_kind_select = MKind.where(:shubetuKbn => MKIND_KBN_TENKENTANTOSHA)	#種別区分が'0'は担当者種別

        @@global_select_tantoshacode = 0
        @@global_select_uid = 0
        @@global_pwd_select_id = 0
        @@global_checkpeople_select_id = 0
        @@global_select_tantoshamei = ''
        @@global_error = 0

        #初期表示種別番号 通常　社内= MKIND_TENKENTANTOSHA_SHANAI.to_s
        @default_hyouji_shubetumei = '社内'

        #点検担当者種別の配列を確保
        @m_tenken_kensu = MKind.where(:shubetuKbn => MKIND_KBN_TENKENTANTOSHA).count()
        @m_tenken = MKind.where(:shubetuKbn => MKIND_KBN_TENKENTANTOSHA).order('shubetu ASC')

        #点検担当者種別が配列の何番に入っているか
        @m_tenken_hash = Hash.new()
        @m_tenken_array = Array.new(@m_tenken_kensu).map{Array.new(@m_tenken_kensu,'')}

        #<%= select_tag(@m_tenken_array[0][0].sub("id","nm"), options_for_select(@m_checkpeople_array[0]),:id => @m_tenken_array[0][0], :class => 'select_220_tenken' ,:tabindex => 22, :style => @m_tenken_array[1][0]) %>
        #点検担当者のハッシュ配列を確保
        @m_check_moto = MCheckpeople.where(:tenkentantoshashubetuKbn => MKIND_KBN_TENKENTANTOSHA).order('sakujyoFlg,tenkentantoshashubetu')
        @m_checkpeople_array = Array.new(@m_tenken_kensu){ Hash.new() }

        @soeji = 0
        @m_tenken.each do | y |
            #点検担当者種別に対する添字をハッシュで保存 ※種別は３桁までを想定！
            @m_tenken_hash.store(format("%03d",y.shubetu), @soeji)

            #セレクトボックスのidを設定
            @m_tenken_array[0][@soeji] = "id_cmb_THS_Tenmei" + format("%03d",y.shubetu)

            #点検担当者種別=社内 を初期状態で表示
            @m_tenken_array[1][@soeji] = ( y.shubetumei != @default_hyouji_shubetumei ) ? 'display:none;' : ''
            @soeji += 1
        end

        @m_check_moto.each do | x |
            #削除フラグがあったら×印
            @flg = (x.sakujyoFlg == 1) ? '×' : ''
            #"点検担当者種別(3桁)+点検担当者コード"
            @value_id = format("%03d",x.tenkentantoshashubetu) + x.tenkentantoshaCode.to_s

            #@m_tenken_arrayにtenkentantoshashubetu順の"点検担当者名" => "点検担当者種別(3桁)+点検担当者コード" というハッシュ　で保存
            # @m_checkpeople_array[0] = { "　社員太郎" => "0008", "×社員五郎" => "0009"}
            # @m_checkpeople_array[1] = { "×社内太郎" => "00199", "　社内五郎" => "001100"}
            @m_checkpeople_array[@m_tenken_hash[format("%03d",x.tenkentantoshashubetu)]].store(@flg + x.tenkentantoshamei, @value_id)
        end

        render :layout => 'menu'
    end

    def commit
        #押されたボタンの種類
        @commit_kind = params[:commit]

        #----------#
        # 選択処理 #
        #----------#
        if @commit_kind == '選択' then
            logger.debug("params[@aaa]:" + params['nm_cmb_THS_Tenmei' + format("%03d",params[:nm_cmb_THS_Tenshu].to_i)].to_s)
            if params['nm_cmb_THS_Tenmei' + format("%03d",params[:nm_cmb_THS_Tenshu].to_i)].to_s != '' then
                #3文字目～最後までが点検担当者コード
                @@global_select_tantoshacode = params['nm_cmb_THS_Tenmei' + format("%03d",params[:nm_cmb_THS_Tenshu].to_i)].slice(3..-1).to_i
                #選択された点検担当者の　点検担当者(テーブル)情報
                @checkpeople_name = MCheckpeople.new
                @checkpeople_name = MCheckpeople.where(:tenkentantoshaCode => @@global_select_tantoshacode)
                #選択された点検担当者の　ユーザ管理(テーブル)情報
                @select_user = MPwd.new
                @select_user = MPwd.where(:tenkentantoshaCode => @@global_select_tantoshacode)

                @checkpeople_name.each do | checkpeople |
                    @select_checkpeople_name = checkpeople.tenkentantoshamei
                    @@global_checkpeople_select_id = checkpeople.id
                    @select_checkpeople_sakujyoFlg = checkpeople.sakujyoFlg
                end

                @select_uid = ''
                @select_upass = ''
                @select_user.each do | user |
                    @@global_pwd_select_id  = user.id
                    @select_uid = user.uid
                    @select_upass = user.upass
                end

                @@global_select_uid = @select_uid.to_s
                @@global_select_tantoshamei = @select_checkpeople_name
                @select_shubetu = params[:nm_cmb_THS_Tenshu]

                logger.debug('担当者コード:' + @@global_select_tantoshacode.to_s)
                logger.debug('選択時の担当者名' + @select_checkpeople_name)
                logger.debug('選択時のユーザID:' + @select_uid.to_s)
                logger.debug('選択時のパスワード:' + @select_upass.to_s)
                #検索結果欄に表示
                @error = 1

                #選択ボタン押下フラグ
                @@global_error = 1
                logger.debug("@error_sentaku:" + @error.to_s)
            else
                #点検担当者が選択されていない
                @error = 15
                @@global_error = 15
            end
            #------------#
            # 変更ボタン  #
            #------------#
        elsif @commit_kind == '変更' then
            #「選択」ボタンを押したかどうか。押していないとエラー
            @sentaku_flg = ( @@global_error == 1 ) ? true : false
            @error = 0
            #入力されたユーザID、パスワード
            @henshu_uid = params[:nm_txt_THS_Tenid]
            @henshu_pass = params[:nm_pas_THS_Tenpass]

            #フォーカス
            @focus = ""
            #入力された点検担当者名
            @m_checkpeople = params[:m_checkpeople][:tenkentantoshamei]

            #選択された種別名
            @shubetu = params[:nm_cmb_THS_Tenshu2]
            @m_kind_select = MKind.where(:shubetuKbn => MKIND_KBN_TENKENTANTOSHA)

            #削除フラグ
            @sakujyoFlg = params[:nm_txt_THS_SakujyoFlg]

            logger.debug("入力されたユーザID:" + @henshu_uid)
            logger.debug("入力されたパスワード:" + @henshu_pass)
            logger.debug("入力された点検担当者名:" + @m_checkpeople)
            logger.debug("入力された種別no:" + @shubetu.to_s)
            logger.debug("選択時のユーザID:" + @@global_select_uid.to_s)
            logger.debug('担当者コード:' + @@global_select_tantoshacode.to_s)
            logger.debug('選択時の担当者名:' + @@global_select_tantoshamei)

            #選択をしていない状態で変更
            if !@sentaku_flg  then
                @error_message = MESSAGE_81
                #削除フラグありの場合は変更できない
            elsif @sakujyoFlg == '1' then
                @focus = ".select_220_tenken"
                @error_message = MESSAGE_14
                #点検担当者名に入力が無い
            elsif @m_checkpeople == "" then
                @focus = "#id_txt_THS_Tenmei"
                @error_message = MESSAGE_05
                #種別：社内で、IDの長さが4でない
            elsif @shubetu == MKIND_TENKENTANTOSHA_SHANAI.to_s and ( !(@henshu_uid.to_s =~ /^[0-9]+$/ ) or @henshu_uid.to_s.size != 4 or  @henshu_uid.to_i < 1000 ) then
                @error_message = MESSAGE_08
                #種別：社内で、パスワードの長さが4未満
            elsif @shubetu == MKIND_TENKENTANTOSHA_SHANAI.to_s and ( !(@henshu_pass =~ /^[0-9]+$/ ) or @henshu_pass.to_s.size < 4 ) then
                @focus = "#id_pas_THS_Tenpass"
                @error_message = MESSAGE_11
                #種別：社内でなく、IDが入力されている
            elsif @shubetu != MKIND_TENKENTANTOSHA_SHANAI.to_s and @henshu_uid.to_s != '' then
                @error_message = MESSAGE_31
                #種別：社内でなく、パスワードが入力されている
            elsif @shubetu != MKIND_TENKENTANTOSHA_SHANAI.to_s and @henshu_pass != '' then
                @error_message = MESSAGE_32
            else
                @m_pwd_db = MPwd.where('uid = ?', @henshu_uid ).exists?
                @m_checkpeople_db = MCheckpeople.where('tenkentantoshamei = ?',@m_checkpeople).exists?
                #入力IDと選択時IDが異なっていて、入力IDのユーザが存在する 且つ　入力点検担当者名と選択時点検担当者が異なっていて、入力点検担当者名が既に登録されている
                if @henshu_uid != @@global_select_uid and @m_pwd_db and  @m_checkpeople !=  @@global_select_tantoshamei and @m_checkpeople_db then
                    @error_message = MESSAGE_80

                    #入力IDと選択時IDが異なっていて、入力IDのユーザが存在する
                elsif @henshu_uid != @@global_select_uid and @m_pwd_db  then
                    @focus = "#id_txt_THS_Tenid"
                    @error_message = MESSAGE_10

                    #入力点検担当者名と選択時点検担当者が異なっていて、入力点検担当者名が既に登録されている
                elsif @m_checkpeople !=  @@global_select_tantoshamei and @m_checkpeople_db then
                    @error_message = MESSAGE_07
                end
            end
            #入力内容にエラーが無ければ更新処理
            if @error_message[0] == '' then
                #ユーザ管理情報に登録されていれば
                if 	MPwd.where(:tenkentantoshaCode =>  @@global_select_tantoshacode).exists? then
                    transact_update_pwd

                    #無ければ点検担当者テーブルのみ更新
                else
                    #ID,パスワード入力されていなければ、点検担当者管理マスタ更新
                    if @henshu_uid == '' then
                        transact_update_checkpeople

                        #ID,パスワード入力されていれば、点検担当者管理マスタ更新とユーザ管理マスタ登録
                    else
                        transact_update_checkpeople
                        transact_insert_pwd
                    end
                end
            end

            #DB更新処理でエラーがなければ完了画面に遷移
            if 	@error_message[0] == '' then
                @error = 13
                #		redirect_to 	:controller => 'tenken_henko_kanryo',
                #		return nil
            end

            #-----------#
            # 削除ボタン #
            #-----------#
        elsif 	@commit_kind == '削除' then
            #削除フラグ
            @sakujyoFlg = params[:nm_txt_THS_SakujyoFlg]

            #「選択」ボタンを押したかどうか。押していないとエラー
            if @@global_error != 1  then
                @error_message = MESSAGE_81
                #削除フラグありの場合は変更できない
            elsif @sakujyoFlg == '1' then
                @focus = ".select_220_tenken"
                @error_message = MESSAGE_15
            else
                #action delete に:upper => 削除する担当者コード、:lower => その担当者コードのidのメッセージダイジェスト（MD5）で遷移する
                @query_str =  '/tenken_henko_sakujo/delete/' + @@global_select_tantoshacode.to_s + '/' + Digest::MD5.hexdigest(@@global_checkpeople_select_id.to_s)
                #削除確認メッセージ
                @error_message = MESSAGE_13
                @error = 14
            end
        end
        logger.debug("@error_message[0]:" + @error_message[0])
        #render :layout => 'menu'
    end

    #-------------#
    # 削除認証確認 #
    #-------------#
    def delete
        @m_kind_select = MKind.where(:shubetuKbn => 0)	#種別区分が'0'は担当者種別
        #action delete に@tantoshacode = 削除する担当者コード、@id_hash = その担当者コードのidのメッセージダイジェスト（MD5）
        @tantoshacode = params[:upper]
        @id_hash = params[:lower]

        logger.debug('DELETE処理:' + params[:upper] + " | " + @id_hash)
        logger.debug(Digest::MD5.hexdigest(@check_id.to_s))
        @check_people = MCheckpeople.where(:tenkentantoshaCode => @tantoshacode)
        #担当者コード（@tantoshacode）からid取得（@check_id）
        @check_people.each do | tantosha |
            @check_id  = tantosha.id
        end

        #一致すればURLの改ざん無しなのでOK
        if @id_hash == Digest::MD5.hexdigest(@check_id.to_s) then

            #ユーザ管理情報にもあればそちらも削除
            if 	MPwd.where(:tenkentantoshaCode => @tantoshacode).exists? then
                @@global_checkpeople_select_id = @id
                transact_delete_pwd
                #無ければ点検担当者テーブルのみ削除
            else
                transact_delete_checkpeople
            end

            logger.debug('error_message[0]' + @error_message[0])
            if 	@error_message[0] == '' then
                redirect_to :controller => 'tenken_sakujo_kanryo'
            else
                redirect_to :controller => 'tenken_henko_sakujo'
            end

        else
            redirect_to :controller => 'tenken_henko_sakujo'
        end
    end

    #----------#
    # MPwd更新 #
    #----------#
    private

    def transact_update_pwd
        MPwd.transaction do
            #ID,パスワード入力されていなければ、ユーザ管理マスタから削除
            if @henshu_uid == '' then
                logger.debug('DELETE_MPWD処理:@tantoshacode' + @@global_select_tantoshacode)
                MPwd.destroy_all(['tenkentantoshaCode = ?', @@global_select_tantoshacode])
                #ID,パスワード入力されていれば、ユーザ管理マスタ更新
            else
                MPwd.where(:id => @@global_pwd_select_id).update_all(:uid => @henshu_uid.to_i, :upass => @henshu_pass, :tenkentantoshaCode => @@global_select_tantoshacode)
            end
        end
        transact_update_checkpeople
    rescue => e
        @error_message  = MESSAGE_DBS_01
    end

    #--------------------#
    # MCheckpeople更新 #
    #--------------------#
    private

    def transact_update_checkpeople
        MCheckpeople.transaction do
            MCheckpeople.where(:id => @@global_checkpeople_select_id).update_all(:tenkentantoshamei => @m_checkpeople, :tenkentantoshashubetu => @shubetu)
        end
    rescue => e
        @error_message  = MESSAGE_DBS_02
    end

    #-----------#
    # MPwd削除 #
    #-----------#
    private

    def transact_delete_pwd
        logger.debug('DELETE_MPWD処理:@tantoshacode' + @tantoshacode)
        MPwd.transaction do
            MPwd.destroy_all(['tenkentantoshaCode = ?', @tantoshacode])
        end
        transact_delete_checkpeople
    rescue => e
        @error_message  = MESSAGE_DBS_01
    end
    #-----------------------------#
    # MCheckpeople削除(flg on)  #
    #-----------------------------#
    private

    def transact_delete_checkpeople
        MCheckpeople.where(:id => @check_id).update_all(:sakujyoFlg => 1)
    end

    #----------#
    # MPwd登録 #
    #----------#
    private

    def transact_insert_pwd
        MPwd.transaction do
            @m_pwd2 = MPwd.new
            @m_pwd2.uid = @henshu_uid.to_i
            @m_pwd2.upass = @henshu_pass
            @m_pwd2.tenkentantoshaCode = @@global_select_tantoshacode
            @m_pwd2.urole = @shubetu #楊健 2015-01-15
            @m_pwd2.save!
        end

    rescue => e
        @error_message  = MESSAGE_DBS_01
    end

end
