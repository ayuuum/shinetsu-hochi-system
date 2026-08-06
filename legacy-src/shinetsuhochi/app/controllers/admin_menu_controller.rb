class AdminMenuController < ApplicationController
    before_action :mainte_check
    before_action :login_check
    before_action :dialog_init
    def index
        if params[:first] == nil then

        else

            @konnendo = CommonUtil.konnendo
            CommonUtil.autobackup
            update()#次年度更新
            delete_old_data(@konnendo)#三年前のデータを削除する
            #hidden属性にセット、表示時に完了ダイアログ表示
            @success = 'true'
        end
        render :layout => 'normal'
    end

    def	commit
        @error = 1
        @konnendo = CommonUtil.konnendo
        @query_str = 'admin_menu/index/'+Digest::MD5.hexdigest(@konnendo.to_s)
        @error_message = ['message_question', '次年度データを作成し、'+(@konnendo-2).to_s+'年度より前のデータを削除します。よろしいですか？']
    end

    def update()
        @init = MInit.all
        nendo = @init[0]["jinenY"].to_i
        update_by_year(nendo)
		 
		 t = Time.now
        today = t.year.to_s + "-" + t.month.to_s + "-" + t.day.to_s
		 MInit.update_all(:zenkaikoushinYMD => today )

    end

    def update_by_year(year)
        t = Time.now
        time_now = "\"" + t.year.to_s + "-" + t.month.to_s + "-" + t.day.to_s + " " + t.hour.to_s + ":" + t.min.to_s + ":" + t.sec.to_s + "\""

        #T物件情報
        ActiveRecord::Base.connection.insert("INSERT INTO t_housinginfos (bukenCode, hachushaCode, nendo, bukenmei, bukenPostno, bukenAdrs, bukenTelno, bukenFaxno, bukenTandoshamei,created_at,updated_at)
        SELECT bukenCode, hachushaCode, #{year}, bukenmei, bukenPostno, bukenAdrs, bukenTelno, bukenFaxno, bukenTandoshamei,#{time_now},#{time_now}
        FROM t_housinginfos AS tmo WHERE EXISTS (SELECT * FROM t_check_infos as tci WHERE 
        tci.jinendotenkenY = #{year} AND tci.bukenCode = tmo.bukenCode ) AND
        EXISTS (SELECT * FROM m_housinginfos AS mho WHERE saishusakuseiY = #{year} - tenkenKbn AND
        tenkenKbn < 4 AND tmo.bukenCode = mho.bukenCode AND tmo.nendo = mho.saishusakuseiY AND teishiFlg = 0) AND
        NOT EXISTS (SELECT * FROM t_housinginfos AS tmo2 WHERE tmo2.nendo = #{year} AND tmo2.bukenCode = tmo.bukenCode)")

        #T点検実績情報
        ActiveRecord::Base.connection.insert("INSERT INTO t_chktrackrec_infos (bukenCode, nendo, checkFlg, setubishubetuKbn, setubishubetu, tenkenshubetuKbn, tenkenshubetu, edaban,
        tenkenyoteiM,keiyakukingaku,gaichuhi,tenkenkanryoYMD,tenkenstatus,jinko,hoshuumu,biko,hoshukanrenumu,created_at,updated_at)
        SELECT tci.bukenCode, #{year}, checkFlg, setubishubetuKbn, setubishubetu, tenkenshubetuKbn, tenkenshubetu, edaban,
        tenkenyoteiM,keiyakukingaku,gaichuhi,NULL,1,0,0,biko,0,#{time_now},#{time_now}
        FROM t_chktrackrec_infos AS tci WHERE 
        EXISTS (SELECT * FROM m_housinginfos AS mho WHERE saishusakuseiY = #{year} - tenkenKbn AND tenkenKbn < 4
        AND tci.bukenCode = mho.bukenCode AND tci.nendo = mho.saishusakuseiY AND teishiFlg = 0)AND
        NOT EXISTS (SELECT * FROM t_chktrackrec_infos AS tci2 WHERE tci2.nendo = #{year} AND tci2.bukenCode = tci.bukenCode)")

        #T点検情報 点検種別は21以外なレコード
        ActiveRecord::Base.connection.insert("INSERT INTO t_check_infos (bukenCode,hachushaCode, nendo, seikyuhouhou, setubishubetuKbn, setubishubetu, tenkenshubetuKbn, tenkenshubetu, nenkantenkenkaisu,tenkenyoteiM1,
        kaisumeisai,keiyakukingaku1,keiyakukingaku2,boukataishobututenkenkaisu,tenkentantosha1,tenkentantosha2,tenkentantosha3,tenkentantosha4,tenkentantosha5,tenkentantosha6,tenkentantosha7,tenkentantosha8,tenkentantosha9,tenkentantosha10,
        gaichuhi1,gaichuhi2,gaichuhi3,gaichuhi4,gaichuhi5,gaichuhi6,gaichuhi7,gaichuhi8,gaichuhi9,gaichuhi10,maintantosha,jinendotenkenY,created_at,updated_at)
        SELECT tci.bukenCode,hachushaCode, #{year}, seikyuhouhou,
        setubishubetuKbn, setubishubetu,tenkenshubetuKbn, tenkenshubetu, nenkantenkenkaisu,tenkenyoteiM1,kaisumeisai,
        keiyakukingaku1,keiyakukingaku2,boukataishobututenkenkaisu ,tenkentantosha1,tenkentantosha2,tenkentantosha3,
        tenkentantosha4,tenkentantosha5,tenkentantosha6,tenkentantosha7,tenkentantosha8,tenkentantosha9,tenkentantosha10,
        gaichuhi1,gaichuhi2,gaichuhi3,gaichuhi4,gaichuhi5,gaichuhi6,gaichuhi7,gaichuhi8,gaichuhi9,gaichuhi10,maintantosha,
        #{year}+mho.tenkenKbn,#{time_now},#{time_now}
        FROM t_check_infos AS tci,m_housinginfos AS mho WHERE tci.jinendotenkenY = #{year} AND teishiFlg = 0 AND
        NOT EXISTS
        (SELECT * FROM t_check_infos AS tci2 WHERE tci2.nendo = #{year} AND tci2.bukenCode = tci.bukenCode AND tci2.tenkenshubetu = tci.tenkenshubetu)
        AND saishusakuseiY = #{year} - mho.tenkenKbn
        AND tenkenKbn < 4
        AND tci.bukenCode = mho.bukenCode
        AND tci.nendo = mho.saishusakuseiY
        AND tci.tenkenshubetu <> 21 ")

        #T点検情報 点検種別は21なレコード
        ActiveRecord::Base.connection.insert("INSERT INTO t_check_infos (bukenCode,hachushaCode, nendo, seikyuhouhou, setubishubetuKbn, setubishubetu, tenkenshubetuKbn, tenkenshubetu, nenkantenkenkaisu,tenkenyoteiM1,
        kaisumeisai,keiyakukingaku1,keiyakukingaku2,boukataishobututenkenkaisu,tenkentantosha1,tenkentantosha2,tenkentantosha3,tenkentantosha4,tenkentantosha5,tenkentantosha6,tenkentantosha7,tenkentantosha8,tenkentantosha9,tenkentantosha10,
        gaichuhi1,gaichuhi2,gaichuhi3,gaichuhi4,gaichuhi5,gaichuhi6,gaichuhi7,gaichuhi8,gaichuhi9,gaichuhi10,maintantosha,jinendotenkenY,created_at,updated_at)
        SELECT tci.bukenCode,hachushaCode, #{year}, seikyuhouhou,
        setubishubetuKbn, setubishubetu,tenkenshubetuKbn, tenkenshubetu, nenkantenkenkaisu,tenkenyoteiM1,kaisumeisai,
        keiyakukingaku1,keiyakukingaku2,boukataishobututenkenkaisu ,tenkentantosha1,tenkentantosha2,tenkentantosha3,
        tenkentantosha4,tenkentantosha5,tenkentantosha6,tenkentantosha7,tenkentantosha8,tenkentantosha9,tenkentantosha10,
        gaichuhi1,gaichuhi2,gaichuhi3,gaichuhi4,gaichuhi5,gaichuhi6,gaichuhi7,gaichuhi8,gaichuhi9,gaichuhi10,maintantosha,
        #{year}+mho.tenkenKbn,#{time_now},#{time_now}
        FROM t_check_infos AS tci,m_housinginfos AS mho WHERE tci.jinendotenkenY = #{year} AND teishiFlg = 0 AND
        NOT EXISTS
        (SELECT * FROM t_check_infos AS tci2 WHERE tci2.nendo = #{year} AND tci2.bukenCode = tci.bukenCode AND tci2.tenkenshubetu = 21)
        AND saishusakuseiY = #{year} - mho.tenkenKbn
        AND tenkenKbn < 4
        AND tci.bukenCode = mho.bukenCode
        AND tci.nendo = mho.saishusakuseiY
        AND tci.tenkenshubetu = 21 ")

        #M物件
        ActiveRecord::Base.connection.update("UPDATE m_housinginfos AS mhi SET saishusakuseiY = #{year} ,
        updated_at = #{time_now} WHERE saishusakuseiY = #{year} - tenkenKbn AND tenkenKbn < 4 AND
        EXISTS (SELECT * FROM t_check_infos as tci WHERE 
        tci.jinendotenkenY = #{year} AND tci.bukenCode = mhi.bukenCode AND teishiFlg = 0 )")

    end

    def delete_old_data(nendo)

        #3年前以前のデータを削除
        @init = MInit.all
        @kaishi_m = @init[0]["nendoshuryoYMD"].strftime('%m').to_i
        TCheckInfo.where(['nendo < ? ',nendo.to_i - 2]).delete_all()
        TChktrackrecInfo.where(['nendo < ? ',nendo.to_i - 2]).delete_all()

    end
end
