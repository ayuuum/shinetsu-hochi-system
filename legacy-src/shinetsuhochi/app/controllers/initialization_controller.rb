class InitializationController < ApplicationController
    before_action :mainte_check
    before_action :login_check
    before_action :dialog_init
    def index

        #年度開始月のセレクトボックス
        @tuki_select =  Hash.new
        for num in 1..12 do
            @tuki_select.store(format("% 2d",num.to_s) + '月',num)
        end

        #初期（クエリパラメータが無い）
        if params[:first].blank? then
            #初期設定マスタからフォームに設定
            @m_init = MInit.all.limit(1)
            @m_init.each do |list|
                @tenkenmei1 = list.tenkenmei1
                @tenkenmei2 = list.tenkenmei2
                @tenkenmei3 = list.tenkenmei3
                @tenkenmei4 = list.tenkenmei4
                @tenkenmei5 = list.tenkenmei5
                @tenkenmei6 = list.tenkenmei6
                @hoshu_statusmei1 = list.hoshustatusmei1
                @hoshu_statusmei2 = list.hoshustatusmei2
                @hoshu_statusmei3 = list.hoshustatusmei3
                @hoshu_statusmei4 = list.hoshustatusmei4
                @hoshu_statusmei5 = list.hoshustatusmei5
                @hoshu_statusmei6 = list.hoshustatusmei6
                @tenken_statusmei1 = list.tenkenstatusmei1
                @tenken_statusmei2 = list.tenkenstatusmei2
                @tenken_statusmei3 = list.tenkenstatusmei3
                @tenken_statusmei4 = list.tenkenstatusmei4
                @tenken_statusmei5 = list.tenkenstatusmei5
                @kaishiM = list.nendokaishiM
                @kaishiYMD = (list.nendokaishiYMD.nil?) ? '' : list.nendokaishiYMD.strftime('%Y/%m/%d')
                @shuryoYMD = (list.nendoshuryoYMD.nil?) ? '' : list.nendoshuryoYMD.strftime('%Y/%m/%d')
            end
            #設定実行（クエリパラメータ有り）
        else
            @m_init = Hash.new
            @m_init = Rack::Utils.parse_query(params[:first])
            @tenkenmei1 = @m_init["tenkenmei1"]
            @tenkenmei2 = @m_init["tenkenmei2"]
            @tenkenmei3 = @m_init["tenkenmei3"]
            @tenkenmei4 = @m_init["tenkenmei4"]
            @tenkenmei5 = @m_init["tenkenmei5"]
            @tenkenmei6 = @m_init["tenkenmei6"]
            @hoshu_statusmei1 = @m_init["hoshu_statusmei1"]
            @hoshu_statusmei2 = @m_init["hoshu_statusmei2"]
            @hoshu_statusmei3 = @m_init["hoshu_statusmei3"]
            @hoshu_statusmei4 = @m_init["hoshu_statusmei4"]
            @hoshu_statusmei5 = @m_init["hoshu_statusmei5"]
            @hoshu_statusmei6 = @m_init["hoshu_statusmei6"]
            @tenken_statusmei1 = @m_init["tenken_statusmei1"]
            @tenken_statusmei2 = @m_init["tenken_statusmei2"]
            @tenken_statusmei3 = @m_init["tenken_statusmei3"]
            @tenken_statusmei4 = @m_init["tenken_statusmei4"]
            @tenken_statusmei5 = @m_init["tenken_statusmei5"]
            @kaishiM = @m_init["kaishiM"]
            @kaishiYMD = @m_init["kaishiYMD"].gsub("-","/")
            @shuryoYMD = @m_init["shuryoYMD"].gsub("-","/")
            transact_update_minits(@m_init)
            if 	@error_message[0] == '' then
                @success = 'true'
            else

            end
        end

        render :layout => 'menu'
    end

    def	commit

        #押されたボタンの種類
        @commit_kind = params[:commit]
        if @commit_kind == '設定' then
            #フォームにセットされた値をハッシュにセットしてindexにクエリを渡す
            @t_init_joho = Hash.new
            @t_init_joho.store("tenkenmei1", params[:nm_txt_INI_Tenken1])
            @t_init_joho.store("tenkenmei2", params[:nm_txt_INI_Tenken2])
            @t_init_joho.store("tenkenmei3", params[:nm_txt_INI_Tenken3])
            @t_init_joho.store("tenkenmei4", params[:nm_txt_INI_Tenken4])
            @t_init_joho.store("tenkenmei5", params[:nm_txt_INI_Tenken5])
            @t_init_joho.store("tenkenmei6", params[:nm_txt_INI_Tenken6])
            @t_init_joho.store("tenken_statusmei1", params[:nm_txt_INI_TenkenStatus1])
            @t_init_joho.store("tenken_statusmei2", params[:nm_txt_INI_TenkenStatus2])
            @t_init_joho.store("tenken_statusmei3", params[:nm_txt_INI_TenkenStatus3])
            @t_init_joho.store("tenken_statusmei4", params[:nm_txt_INI_TenkenStatus4])
            @t_init_joho.store("tenken_statusmei5", params[:nm_txt_INI_TenkenStatus5])
            @t_init_joho.store("hoshu_statusmei1", params[:nm_txt_INI_HoshuStatus1])
            @t_init_joho.store("hoshu_statusmei2", params[:nm_txt_INI_HoshuStatus2])
            @t_init_joho.store("hoshu_statusmei3", params[:nm_txt_INI_HoshuStatus3])
            @t_init_joho.store("hoshu_statusmei4", params[:nm_txt_INI_HoshuStatus4])
            @t_init_joho.store("hoshu_statusmei5", params[:nm_txt_INI_HoshuStatus5])
            @t_init_joho.store("hoshu_statusmei6", params[:nm_txt_INI_HoshuStatus6])
            @t_init_joho.store("kaishiM", params[:kaishiM])
            @t_init_joho.store("kaishiYMD", params[:nm_txt_INI_KaishiYMD].gsub("/","-"))
            @t_init_joho.store("shuryoYMD", params[:nm_txt_INI_ShuryoYMD].gsub("/","-"))
            @error = 1
            #確認メッセージを表示してindexに遷移する。遷移先で更新処理を行う
            @query_str = 'initialization/index/' + @t_init_joho.to_query

            @error = 1
            @error_message = MESSAGE_57
        end
    end

    def transact_update_minits(m_init)
        MInit.transaction do
            #初期設定マスタ更新
            MInit.update_all(:tenkenmei1 => m_init["tenkenmei1"],
            :tenkenmei2 => m_init["tenkenmei2"],
            :tenkenmei3 => m_init["tenkenmei3"],
            :tenkenmei4 => m_init["tenkenmei4"],
            :tenkenmei5 => m_init["tenkenmei5"],
            :tenkenmei6 => m_init["tenkenmei6"],
            :hoshustatusmei1 => m_init["hoshu_statusmei1"],
            :hoshustatusmei2 => m_init["hoshu_statusmei2"],
            :hoshustatusmei3 => m_init["hoshu_statusmei3"],
            :hoshustatusmei4 => m_init["hoshu_statusmei4"],
            :hoshustatusmei5 => m_init["hoshu_statusmei5"],
            :hoshustatusmei6 => m_init["hoshu_statusmei6"],
            :tenkenstatusmei1 => m_init["tenken_statusmei1"],
            :tenkenstatusmei2 => m_init["tenken_statusmei2"],
            :tenkenstatusmei3 => m_init["tenken_statusmei3"],
            :tenkenstatusmei4 => m_init["tenken_statusmei4"],
            :tenkenstatusmei5 => m_init["tenken_statusmei5"],
            :nendokaishiM => m_init["kaishiM"],
            :nendokaishiYMD => m_init["kaishiYMD"],
            :nendoshuryoYMD => m_init["shuryoYMD"])
        end
        transact_update_mkinds(m_init)
    rescue => e
        @error_message  = MESSAGE_DBS_01
    end

    def	transact_update_mkinds(m_init)
        MKind.transaction do
            #種別マスタ更新 shubetuKbn = 2、 shubetuの31から36を更新
            MKind.where(:shubetuKbn => MKIND_KBN_TENKENSHUBETU, :shubetu => MKIND_TENKENSHUBETU_ITV).update_all(:shubetumei => m_init["tenkenmei1"])
            MKind.where(:shubetuKbn => MKIND_KBN_TENKENSHUBETU, :shubetu => MKIND_TENKENSHUBETU_TELEPHONE).update_all(:shubetumei => m_init["tenkenmei2"])
            MKind.where(:shubetuKbn => MKIND_KBN_TENKENSHUBETU, :shubetu => MKIND_TENKENSHUBETU_ONKYO).update_all(:shubetumei => m_init["tenkenmei3"])
            MKind.where(:shubetuKbn => MKIND_KBN_TENKENSHUBETU, :shubetu => MKIND_TENKENSHUBETU_RENKETSUSOU).update_all(:shubetumei => m_init["tenkenmei4"])
            MKind.where(:shubetuKbn => MKIND_KBN_TENKENSHUBETU, :shubetu => MKIND_TENKENSHUBETU_CHIKATANK).update_all(:shubetumei => m_init["tenkenmei5"])
            MKind.where(:shubetuKbn => MKIND_KBN_TENKENSHUBETU, :shubetu => MKIND_TENKENSHUBETU_ETC).update_all(:shubetumei => m_init["tenkenmei6"])
        end
        #取得した発注者コードで物件テーブル更新
    rescue => e
        @error_message  = MESSAGE_DBS_01
    end

end
