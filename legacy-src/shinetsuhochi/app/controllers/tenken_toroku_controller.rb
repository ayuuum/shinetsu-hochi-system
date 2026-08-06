class TenkenTorokuController < ApplicationController
    before_action :mainte_check
    before_action :login_check
    before_action :dialog_init
    def index
        @m_pwd = MPwd.new
        @m_checkpeople = MCheckpeople.new
        #種別区分が'0'は担当者種別
        @m_kind_select = MKind.where(:shubetuKbn => MKIND_KBN_TENKENTANTOSHA)
        @m_kind_name = MKind.new

        render :layout => 'menu'
    end

    def commit

        #押されたボタンの種類を取得
        @commit_kind = params[:commit]

        #入力されたID,パスワードを取得
        @m_pwd = MPwd.new
        #@m_pwd = params[:m_pwd]
        @m_pwd[:uid] = params[:uid]
        @m_pwd[:upass] = params[:upass]

        #入力された点検担当者名を取得
        @m_checkpeople = params[:m_checkpeople][:tenkentantoshamei]

        #選択された種別名を取得
        @shubetumei = params[:m_kind][:shubetumei]
        @m_kind_select = MKind.where(:shubetuKbn => 0)

        #種別名から種別を取得
        @shubetu_mei = MKind.where(:shubetuKbn => 0, :shubetumei => @shubetumei )

        @shubetu_mei.each do | shubetu |
            @shubetu = shubetu.shubetu.to_s
        end

        @error = 0

        #フォーカス
        @focus = "" #楊健 2014-11-17

        #ID取得が押されたとき
        if @commit_kind == 'ID取得' then
            #種別：社内以外のとき
            if @shubetumei != '社内' then
                @focus="#id_txt_TTR_Tenid" #楊健 2014-11-17
                @error_message = MESSAGE_31
            else
                @error = 1
                @uid_select = MPwd.maximum(:uid) + 1
            end

            #登録が押されたとき
        elsif @commit_kind == "登録" then
            #点検担当者名に入力が無い
            if @m_checkpeople == "" then
                @focus="#id_txt_TTR_Tenmei" #楊健 2014-11-17
                @error_message = MESSAGE_05
                #種別：社内で、IDが数字でなく、長さが4でない
            elsif @shubetumei == "社内" and ( !(@m_pwd[:uid].to_s =~ /^[0-9]+$/ ) or @m_pwd[:uid].to_s.size != 4 or @m_pwd[:uid].to_i < 1000 ) then
                @focus="#id_txt_TTR_Tenid" #楊健 2014-11-17
                @error_message = MESSAGE_08
                #種別：社内で、パスワードに入力されていない
            elsif @shubetumei == "社内" and @m_pwd[:upass].to_s.size == 0 then
                @focus="#id_pas_TTR_Tenpass" #楊健 2014-11-17
                @error_message = MESSAGE_09
                #種別：社内で、パスワードの長さが4未満
            elsif @shubetumei == "社内" and ( !(@m_pwd[:upass] =~ /^[0-9]+$/ ) or @m_pwd[:upass].to_s.size < 4 ) then
                @focus="#id_pas_TTR_Tenpass" #楊健 2014-11-17
                @error_message = MESSAGE_11
                #種別：社内でなく、IDが入力されている
            elsif @shubetumei != "社内" and @m_pwd[:uid].to_s != '' then
                @focus="#id_txt_TTR_Tenid" #楊健 2014-11-17
                @error_message = MESSAGE_31
                #種別：社内でなく、パスワードが入力されている
            elsif @shubetumei != "社内" and @m_pwd[:upass] != '' then
                @focus="#id_pas_TTR_Tenpass" #楊健 2014-11-17
                @error_message = MESSAGE_32
            else
                #入力されたIDが既に登録されているか
                @m_pwd_db = MPwd.where('uid = ?', @m_pwd[:uid] ).exists?
                @m_checkpeople_db = MCheckpeople.where('tenkentantoshamei = ?',@m_checkpeople).exists?
                #点検担当者IDと点検担当者名が既に登録されている
                if @m_pwd_db and  @m_checkpeople_db then
                    @focus="#id_txt_TTR_Tenid" #楊健 2014-11-17
                    @error_message = MESSAGE_80
                    #点検担当者IDが既に登録されている
                elsif @m_pwd_db then
                    @focus="#id_txt_TTR_Tenid" #楊健 2014-11-17
                    @error_message = MESSAGE_10
                    #点検担当者名が既に登録されている
                elsif @m_checkpeople_db then
                    @focus="#id_txt_TTR_Tenmei" #楊健 2014-11-17
                    @error_message = MESSAGE_07
                end
            end

            #以下の登録処理で登録する担当者コードを点検担当者マスタからtenkentantoshaCodeのMAX＋１を取得
            @@m_tantoshacode = MCheckpeople.maximum(:tenkentantoshaCode) + 1

            #IDが入力されて入ればユーザ管理マスタに登録
            if @error_message[0] == '' and @m_pwd[:uid].to_s != '' then
                transact_pwd_checkpeople

                #IDが入力されていなければ点検担当者マスタのみ登録
            elsif @error_message[0] == '' then
                transact_checkpeople
            end

            #登録処理でエラーが無ければ=> (commit.js.erbから)点検登録担当者完了画面に遷移
            if 	@error_message[0] == '' then
                #logger.debug("@error:" + @error.to_s)
                #redirect_to :controller => 'tenken_toroku_kanryo'
                @error = 3
            end

        end
        logger.debug("@error_message[0]:" + @error_message[0])
        #render :layout => 'menu'
    end

    private

    #必要なデータをセットしてユーザ管理マスタに登録
    def transact_pwd_checkpeople
        MPwd.transaction do
            @m_pwd_s = MPwd.new
            @m_pwd_s.uid = @m_pwd[:uid].to_i
            @m_pwd_s.upass = @m_pwd[:upass]
            @m_pwd_s.tenkentantoshaCode = @@m_tantoshacode
            @m_pwd_s.urole = @shubetu #楊健 2014-11-14 新規点検担当者の役割を指定する
            @m_pwd_s.save!
            #続けて点検担当者マスタに登録
            transact_checkpeople
        end
    rescue => e
        @error_message  = MESSAGE_DBS_01
    end

    private

    #必要なデータをセットして点検担当者マスタに登録
    def transact_checkpeople
        MCheckpeople.transaction do
            @m_check = MCheckpeople.new
            @m_check.tenkentantoshaCode = @@m_tantoshacode
            @m_check.tenkentantoshamei = @m_checkpeople
            @m_check.tenkentantoshashubetuKbn = 0
            @m_check.tenkentantoshashubetu = @shubetu
            @m_check.sakujyoFlg = 0
            @m_check.save!
        end
    rescue => e
        @error_message  = MESSAGE_DBS_02
    end

end
