class TantolistController < ApplicationController
    include ActionView::Helpers::NumberHelper
    before_action :mainte_check
    before_action :login_check
    before_action :dialog_init
    @@sql_tantolist = '' #楊健 2014-11-14 40-83不具合対応
    def index
        @@sql_tantolist = ''
        #種別区分が'3'は点検区分
        @m_kind_select = MKind.where(:shubetuKbn => MKIND_KBN_TENKEN)

        #表html
        @html_string = ''
        #SQL文の実行結果
        @@sql_hachulist = ''
        #実行されたSQLの件数(行数)
        @sql_count = 0
        #状態
        @error = 0

        #遷移先
        @query_str = ''
        @@tantoshacode = 0
        @@tantoshamei = ''
        @@global_error = 0

        @m_kind_select = MKind.where(:shubetuKbn => MKIND_KBN_TENKENTANTOSHA)
        @default_hyouji_shubetumei = @m_kind_select[0]["shubetumei"]
        @nendo_select = CommonUtil.nendo_hash_default(-2,1)

        @kaishi_m = CommonUtil.kaishiM

        @tuki_select = Hash.new()
        @tuki_select.store('全月','-1')
        for num in 0..11 do
            @tuki_select.store(((@kaishi_m + num - 1) % 12 + 1).to_s + '月', ((@kaishi_m + num - 1) % 12 + 1).to_s)
        end

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
            @m_tenken_array[0][@soeji] = "id_cmb_TTL_Tenmei" + format("%03d",y.shubetu)

            #点検担当者種別=社内 を初期状態で表示
            @m_tenken_array[1][@soeji] = ( y.shubetumei != @default_hyouji_shubetumei ) ? 'display:none;' : ''
            @soeji += 1
        end

        @m_check_moto.each do | x |
            #削除フラグがあったら×印、なければ全角空白
            @flg = (x.sakujyoFlg == 1) ? '×' : ''
            #"点検担当者種別(3桁)+点検担当者コード"
            @value_id = format("%03d",x.tenkentantoshashubetu) + x.tenkentantoshaCode.to_s

            #@m_tenken_arrayにtenkentantoshashubetu順の"点検担当者名" => "点検担当者種別(3桁)+点検担当者コード" というハッシュ　で保存
            # @m_checkpeople_array[0] = { "　社員太郎" => "0008", "×社員五郎" => "0009"}
            # @m_checkpeople_array[1] = { "×社内太郎" => "00199", "　社内五郎" => "001100"}
            @m_checkpeople_array[@m_tenken_hash[format("%03d",x.tenkentantoshashubetu)]].store(@flg + x.tenkentantoshamei, @value_id)
        end
        @default_n = CommonUtil.konnendo #楊健 2014-11-14(40-63番対応する)
        render :layout => 'menu'
    end

    def commit

        @error = 0

        #押されたボタンの種類
        @commit_kind = params[:commit]

        #----------#
        # 検索処理 #
        #----------#
        if @commit_kind == '検索' then

            @@nendo = params[:sanshonendo]
            @@tuki = params[:sanshotuki]
            logger.debug("@@nendo:" + @@nendo.to_s)
            logger.debug("@@tuki:" + @@tuki.to_s)
            logger.debug('担当者コード:' + params['nm_cmb_TTL_Tenmei' + format("%03d",params[:nm_cmb_TTL_Tenshu].to_i)].to_s)
            if params['nm_cmb_TTL_Tenmei' + format("%03d",params[:nm_cmb_TTL_Tenshu].to_i)].to_s == '' then
                @error_message  = MESSAGE_05
            else
                @@tantoshacode = params['nm_cmb_TTL_Tenmei' + format("%03d",params[:nm_cmb_TTL_Tenshu].to_i)].slice(3..-1).to_i
                @x = MCheckpeople.where(:tenkentantoshaCode => @@tantoshacode)
                @@tantoshamei = @x[0]["tenkentantoshamei"]
                @tantoshashubetu = params['nm_cmb_TTL_Tenmei' + format("%03d",params[:nm_cmb_TTL_Tenshu].to_i)].slice(0,3).to_i
                logger.debug("@tantoshashubetu:" + @tantoshashubetu.to_s)
                @x = MKind.where(:shubetuKbn => MKIND_KBN_TENKENTANTOSHA, :shubetu => @tantoshashubetu)
                @@tantoshashubetumei = @x[0]["shubetumei"]

                @@kensaku_bukenmei = ''
                @@kensaku_hachushamei = ''
                #条件を加え検索
                search_action(@@nendo.to_s, @@tuki, @@tantoshacode.to_s, @@tantoshamei,CommonUtil.kaishiM)
                @error = 1

            end
            #検索以外のボタン押された場合
        elsif @commit_kind == '帳票出力' then
            if (@@sql_tantolist!='' && @@sql_tantolist.count > 0) then #楊健 2014-11-14 40-83不具合対応
                chohyo_tantolist
            else
                @error_message  = MESSAGE_56
            end
        end
        logger.debug("@error:" + @error.to_s)
        logger.debug("@error_message[0]:" + @error_message[0])
        #	render :layout => 'menu'
    end

    #-----------------------#
    # 検索実行と表のhtml作成 #
    #-----------------------#
    def search_action(nendo, tuki,tantoshaCode, tantoshamei, kaishiM)
        tuki_sql = (tuki != '' and tuki != '-1') ? ' AND TCi.tenkenyoteiM1 = ' + tuki : ''
        #SUM3:発注者別契約保有高、SUM4:発注者別外注費合計、SUM1:物件別契約保有高、SUM2:物件別外注費合計
        #外注費、契約金額にNULLが設定されていた場合０として計算する ,CASE WHEN A.tenkenyoteiM1 < #{kaishiM} THEN 1 ELSE 0 END AS ushiro
        @@sql_tantolist = ActiveRecord::Base.connection.
        select("SELECT MHo.bukenmei, MHo.bukenCode, A.gaichuhi, MOp.hachushamei, A.nendo, A.boukataishobututenkenkaisu,
						A.tenkenyoteiM1,  COALESCE(B.sum_keiyakukingaku,0) AS sum_keiyakukingaku,  MKi.shubetumei, A.tenkenshubetu

				 FROM m_housinginfos AS MHo, m_orderingpatries AS MOp, m_kinds AS MKi,
					(SELECT TCi.bukenCode , TCi.tenkentantosha1, COALESCE(TCi.gaichuhi1,0) AS gaichuhi,
							 TCi.hachushaCode,TCi.nendo, TCi.setubishubetuKbn, TCi.tenkenshubetuKbn, TCi.tenkenshubetu,
							 TCi.tenkenyoteiM1, TCi.setubishubetu, TCi.boukataishobututenkenkaisu
					FROM t_check_infos AS TCi
					WHERE TCi.tenkentantosha1 = " + tantoshaCode + "
					AND TCi.nendo = " + nendo + "
					 " + tuki_sql + "
					UNION ALL
					SELECT TCi.bukenCode , TCi.tenkentantosha2, COALESCE(TCi.gaichuhi2,0) AS gaichuhi, TCi.hachushaCode, TCi.nendo,
					       TCi.setubishubetuKbn, TCi.tenkenshubetuKbn, TCi.tenkenshubetu, TCi.tenkenyoteiM1, TCi.setubishubetu, TCi.boukataishobututenkenkaisu
					FROM t_check_infos AS TCi
					WHERE TCi.tenkentantosha2 = " + tantoshaCode + "
					AND TCi.nendo = " + nendo + "
					 " + tuki_sql + "
					UNION ALL
					SELECT TCi.bukenCode , TCi.tenkentantosha3, COALESCE(TCi.gaichuhi3,0) AS gaichuhi, TCi.hachushaCode, TCi.nendo,
					       TCi.setubishubetuKbn, TCi.tenkenshubetuKbn, TCi.tenkenshubetu, TCi.tenkenyoteiM1, TCi.setubishubetu, TCi.boukataishobututenkenkaisu
					FROM t_check_infos AS TCi
					WHERE TCi.tenkentantosha3 = " + tantoshaCode + "
					AND TCi.nendo = " + nendo + "
					 " + tuki_sql + "
					UNION ALL
					SELECT TCi.bukenCode , TCi.tenkentantosha4, COALESCE(TCi.gaichuhi4,0) AS gaichuhi, TCi.hachushaCode, TCi.nendo,
					      TCi.setubishubetuKbn, TCi.tenkenshubetuKbn, TCi.tenkenshubetu, TCi.tenkenyoteiM1, TCi.setubishubetu, TCi.boukataishobututenkenkaisu
					FROM t_check_infos AS TCi
					WHERE TCi.tenkentantosha4 = " + tantoshaCode + "
					AND TCi.nendo = " + nendo + "
					 " + tuki_sql + "
					UNION ALL
					SELECT TCi.bukenCode ,TCi.tenkentantosha5, COALESCE(TCi.gaichuhi5,0) AS gaichuhi, TCi.hachushaCode, TCi.nendo,
							 TCi.setubishubetuKbn, TCi.tenkenshubetuKbn, TCi.tenkenshubetu, TCi.tenkenyoteiM1, TCi.setubishubetu, TCi.boukataishobututenkenkaisu
					FROM t_check_infos AS TCi
					WHERE TCi.tenkentantosha5 = " + tantoshaCode + "
					AND TCi.nendo = " + nendo + "
					 " + tuki_sql + "
					UNION ALL
					SELECT TCi.bukenCode , TCi.tenkentantosha6, COALESCE(TCi.gaichuhi6,0) AS gaichuhi, TCi.hachushaCode, TCi.nendo,
					       TCi.setubishubetuKbn, TCi.tenkenshubetuKbn, TCi.tenkenshubetu, TCi.tenkenyoteiM1, TCi.setubishubetu, TCi.boukataishobututenkenkaisu
					FROM t_check_infos AS TCi
					WHERE TCi.tenkentantosha6 = " + tantoshaCode + "
					AND TCi.nendo = " + nendo + "
					 " + tuki_sql + "
					UNION ALL
					SELECT TCi.bukenCode , TCi.tenkentantosha7, COALESCE(TCi.gaichuhi7,0) AS gaichuhi, TCi.hachushaCode, TCi.nendo,
					       TCi.setubishubetuKbn, TCi.tenkenshubetuKbn, TCi.tenkenshubetu, TCi.tenkenyoteiM1, TCi.setubishubetu, TCi.boukataishobututenkenkaisu
					FROM t_check_infos AS TCi
					WHERE TCi.tenkentantosha7 = " + tantoshaCode + "
					AND TCi.nendo = " + nendo + "
					 " + tuki_sql + "
					UNION ALL
					SELECT TCi.bukenCode , TCi.tenkentantosha8, COALESCE(TCi.gaichuhi8,0) AS gaichuhi, TCi.hachushaCode, TCi.nendo,
					       TCi.setubishubetuKbn, TCi.tenkenshubetuKbn, TCi.tenkenshubetu, TCi.tenkenyoteiM1, TCi.setubishubetu, TCi.boukataishobututenkenkaisu
					FROM t_check_infos AS TCi
					WHERE TCi.tenkentantosha8 = " + tantoshaCode + "
					AND TCi.nendo = " + nendo + "
					 " + tuki_sql + "
					UNION ALL
					SELECT TCi.bukenCode , TCi.tenkentantosha9, COALESCE(TCi.gaichuhi9,0) AS gaichuhi, TCi.hachushaCode, TCi.nendo,
					       TCi.setubishubetuKbn, TCi.tenkenshubetuKbn, TCi.tenkenshubetu, TCi.tenkenyoteiM1, TCi.setubishubetu, TCi.boukataishobututenkenkaisu
					FROM t_check_infos AS TCi
					WHERE TCi.tenkentantosha9 = " + tantoshaCode + "
					AND TCi.nendo = " + nendo + "
					UNION ALL
					SELECT TCi.bukenCode ,TCi.tenkentantosha10, COALESCE(TCi.gaichuhi10,0) AS gaichuhi, TCi.hachushaCode,TCi.nendo,
					       TCi.setubishubetuKbn, TCi.tenkenshubetuKbn, TCi.tenkenshubetu, TCi.tenkenyoteiM1, TCi.setubishubetu, TCi.boukataishobututenkenkaisu
					FROM t_check_infos AS TCi
					WHERE TCi.tenkentantosha10 = " + tantoshaCode + "
					AND TCi.nendo = " + nendo + "
					 " + tuki_sql + " ) A
				LEFT OUTER JOIN
     				(SELECT TCi.bukenCode,  TCi.nendo, SUM(COALESCE(TCi.keiyakukingaku1,0)) AS sum_keiyakukingaku,
     						TCi.setubishubetuKbn, TCi.setubishubetu, TCi.tenkenshubetuKbn, TCi.tenkenshubetu, TCi.tenkenyoteiM1
					  FROM  t_check_infos AS TCi
					  WHERE TCi.maintantosha = " + tantoshaCode + "
					  AND TCi.nendo = " + nendo + "
					  GROUP BY TCi.bukenCode,  TCi.setubishubetuKbn, TCi.setubishubetu, TCi.tenkenshubetuKbn,
					        TCi.tenkenshubetu, TCi.tenkenyoteiM1 ) B
				ON  A.bukenCode = B.bukenCode
				AND A.nendo = B.nendo
				AND A.tenkenyoteiM1 = B.tenkenyoteiM1
				AND A.setubishubetuKbn = B.setubishubetuKbn
				AND A.setubishubetu = B.setubishubetu
				AND A.tenkenshubetuKbn = B.tenkenshubetuKbn
				AND A.tenkenshubetu = B.tenkenshubetu

			WHERE A.bukenCode = MHo.bukenCode
			AND A.hachushaCode = MOp.hachushaCode
			AND A.tenkenshubetu = MKi.shubetu
			ORDER BY MOp.hachushamei ASC , A.tenkenyoteiM1 ASC ")

        @@sql_sum_jinko = ActiveRecord::Base.connection.select(
        "SELECT SUM(TCt.jinko) AS sum_jinko
					FROM t_check_infos AS TCi, t_chktrackrec_infos AS TCt
					WHERE  TCi.nendo = " + nendo + "
					AND TCt.nendo = " + nendo + "
					 " + tuki_sql + "
					AND (	TCi.tenkentantosha1 = " + tantoshaCode + "
						OR TCi.tenkentantosha2 = " + tantoshaCode + "
						OR TCi.tenkentantosha3 = " + tantoshaCode + "
						OR TCi.tenkentantosha4 = " + tantoshaCode + "
						OR TCi.tenkentantosha5 = " + tantoshaCode + "
						OR TCi.tenkentantosha6 = " + tantoshaCode + "
						OR TCi.tenkentantosha7 = " + tantoshaCode + "
						OR TCi.tenkentantosha8 = " + tantoshaCode + "
						OR TCi.tenkentantosha9 = " + tantoshaCode + "
						OR TCi.tenkentantosha10 = " + tantoshaCode + ")
					AND TCi.bukenCode = TCt.bukenCode
					AND TCi.setubishubetuKbn = TCt.setubishubetuKbn
					AND TCi.setubishubetu = TCt.setubishubetu
					AND TCi.tenkenshubetuKbn = TCt.tenkenshubetuKbn
					AND TCi.tenkenshubetu = TCt.tenkenshubetu
					AND TCi.tenkenyoteiM1 = TCt.tenkenyoteiM ")
        #youken 2015/01/17 for bug 17
        @@sql_jinko = ActiveRecord::Base.connection.select(
        "SELECT TCt.jinko
					FROM t_check_infos AS TCi, t_chktrackrec_infos AS TCt
					WHERE  TCi.nendo = " + nendo + "
					AND TCt.nendo = " + nendo + "
					 " + tuki_sql + "
					AND (	TCi.tenkentantosha1 = " + tantoshaCode + "
						OR TCi.tenkentantosha2 = " + tantoshaCode + "
						OR TCi.tenkentantosha3 = " + tantoshaCode + "
						OR TCi.tenkentantosha4 = " + tantoshaCode + "
						OR TCi.tenkentantosha5 = " + tantoshaCode + "
						OR TCi.tenkentantosha6 = " + tantoshaCode + "
						OR TCi.tenkentantosha7 = " + tantoshaCode + "
						OR TCi.tenkentantosha8 = " + tantoshaCode + "
						OR TCi.tenkentantosha9 = " + tantoshaCode + "
						OR TCi.tenkentantosha10 = " + tantoshaCode + ")
					AND TCi.bukenCode = TCt.bukenCode
					AND TCi.setubishubetuKbn = TCt.setubishubetuKbn
					AND TCi.setubishubetu = TCt.setubishubetu
					AND TCi.tenkenshubetuKbn = TCt.tenkenshubetuKbn
					AND TCi.tenkenshubetu = TCt.tenkenshubetu
					AND TCi.tenkenyoteiM1 = TCt.tenkenyoteiM ")
        data_count = @@sql_jinko.count
        for num in 0.. data_count - 1 do
            @@sql_tantolist[num]["jinko"] = @@sql_jinko[num]["jinko"]
        end
        #youken 2015/01/17 for bug 17 end
        @html_string = ''
        @@keiyakukingaku_total = 0
        @@gaichuhi_total = 0
        @sql_count = @@sql_tantolist.count
        if @sql_count > 0 then
            #帳票用配列
            # MHo.bukenmei, MHo.bukenCode, A.gaichuhi, MOp.hachushamei, A.nendo, A.tenkenyoteiM1,  B.sum_keiyakukingaku,  MKi.shubetumei  , TCi.
            @shubetumei = (@@sql_tantolist[0]["tenkenshubetu"] == MKIND_TENKENSHUBETU_BOUKATAISHOBUTU) ?
            "#{@@sql_tantolist[0]['shubetumei']}(#{@@sql_tantolist[0]['boukataishobututenkenkaisu']}回目)" : "#{@@sql_tantolist[0]['shubetumei']}"
            @@report_array = Array.new(@sql_count){ Hash.new() }
            @html_string +=
            '<textarea class="ttl_body02" cols="20" rows="2" tabindex="26" readonly >' + tantoshamei + '</textarea>' +
            '<textarea class="ttl_body03" cols="20" rows="2" tabindex="26" readonly>' + @sql_count.to_s + '</textarea>' +
            '<textarea class="ttl_body05" cols="20" rows="2" tabindex="26" readonly>insert</textarea>' +
            '<textarea class="ttl_body05" cols="20" rows="2" tabindex="26" readonly>' + '&yen;' + number_with_delimiter(@@sql_tantolist[0]["gaichuhi"].round) + '</textarea>' +
            '<textarea class="ttl_body03" cols="20" rows="2" tabindex="26" readonly>' + @@sql_tantolist[0]["jinko"].to_s + '</textarea>' +
            '<textarea class="ttl_body01" cols="20" rows="2" tabindex="26" readonly>' + @@sql_tantolist[0]["hachushamei"] + '</textarea>' +
            '<textarea class="ttl_body01" cols="20" rows="2" tabindex="26" readonly>' + @@sql_tantolist[0]["bukenmei"]  + '</textarea>' +
            '<textarea class="ttl_body07" cols="20" rows="2" tabindex="26" readonly>' + @shubetumei + '</textarea>' +
            '<textarea class="ttl_body04" cols="20" rows="2" tabindex="26" readonly>' + @@sql_tantolist[0]["tenkenyoteiM1"].to_s + '月' + '</textarea>' +
            '<textarea class="ttl_body06" cols="20" rows="2" tabindex="26" readonly>' + '&yen;' + number_with_delimiter(@@sql_tantolist[0]["sum_keiyakukingaku"].round) + '</textarea>' +
            '<textarea class="ttl_body06" cols="20" rows="2" tabindex="26" readonly>' + '&yen;' + number_with_delimiter(@@sql_tantolist[0]["gaichuhi"].round) + '</textarea>' +
            '<div class="kugiri"></div>'

            @@report_array[0].store("tantoshamei",tantoshamei)
            @@report_array[0].store("count",@sql_count.to_s)
            @@report_array[0].store("keiyaku_total",'')
            @@report_array[0].store("gaichu_total",'\\' + number_with_delimiter(@@sql_tantolist[0]["gaichuhi"].round))
            @@report_array[0].store("jinko_total",@@sql_tantolist[0]["jinko"].to_s)
            @@report_array[0].store("hachushamei",@@sql_tantolist[0]["hachushamei"])
            @@report_array[0].store("bukenmei",@@sql_tantolist[0]["bukenmei"])
            @@report_array[0].store("shubetumei", @shubetumei)
            @@report_array[0].store("tenkenyoteiM1", @@sql_tantolist[0]["tenkenyoteiM1"].to_s + '月')
            @@report_array[0].store("keiyaku",'\\' + number_with_delimiter(@@sql_tantolist[0]["sum_keiyakukingaku"].round))

            #契約金額計（別計算）
            @@keiyakukingaku_total += @@sql_tantolist[0]["sum_keiyakukingaku"]
            @@gaichuhi_total += @@sql_tantolist[0]["gaichuhi"]

            for num in 1.. @sql_count - 1 do
                @shubetumei = (@@sql_tantolist[num]["tenkenshubetu"] == MKIND_TENKENSHUBETU_BOUKATAISHOBUTU) ?
                "#{@@sql_tantolist[num]['shubetumei']}(#{@@sql_tantolist[num]['boukataishobututenkenkaisu']}回目)" : "#{@@sql_tantolist[num]['shubetumei']}"
                #明細行のhtmlタグ
                @html_string +=
                '<textarea class="ttl_body02" cols="20" rows="2" tabindex="26" readonly></textarea>' +
                '<textarea class="ttl_body03" cols="20" rows="2" tabindex="26" readonly></textarea>' +
                '<textarea class="ttl_body05" cols="20" rows="2" tabindex="26" readonly>&yen;0</textarea>' +
                '<textarea class="ttl_body05" cols="20" rows="2" tabindex="26" readonly>' + '&yen;' + number_with_delimiter(@@sql_tantolist[num]["gaichuhi"].round) + '</textarea>' +
                '<textarea class="ttl_body03" cols="20" rows="2" tabindex="26" readonly>' + @@sql_tantolist[num]["jinko"].to_s + '</textarea>' +
                '<textarea class="ttl_body01" cols="20" rows="2" tabindex="26" readonly>' + @@sql_tantolist[num]["hachushamei"].to_s.gsub(Str_pattern1,ESCAPE_HTML) + '</textarea>' +
                '<textarea class="ttl_body01" cols="20" rows="2" tabindex="26" readonly>' + @@sql_tantolist[num]["bukenmei"].to_s.gsub(Str_pattern1,ESCAPE_HTML) + '</textarea>' +
                '<textarea class="ttl_body07" cols="20" rows="2" tabindex="26" readonly>' + @shubetumei + '</textarea>' +
                '<textarea class="ttl_body04" cols="20" rows="2" tabindex="26" readonly>' + @@sql_tantolist[num]["tenkenyoteiM1"].to_s + '月' + '</textarea>' +
                '<textarea class="ttl_body06" cols="20" rows="2" tabindex="26" readonly>' + '&yen;' + number_with_delimiter(@@sql_tantolist[num]["sum_keiyakukingaku"].round) + '</textarea>' +
                '<textarea class="ttl_body06" cols="20" rows="2" tabindex="26" readonly>' + '&yen;' + number_with_delimiter(@@sql_tantolist[num]["gaichuhi"].round) + '</textarea>' +
                '<div class="kugiri"></div>'
                #帳票用配列にセット
                @@report_array[num].store("tantoshamei",'')
                @@report_array[num].store("count",'')
                @@report_array[num].store("keiyaku_total",'')
                @@report_array[num].store("gaichu_total",'\\' + number_with_delimiter(@@sql_tantolist[num]["gaichuhi"].round))
                @@report_array[num].store("jinko_total",@@sql_tantolist[num]["jinko"].to_s)
                @@report_array[num].store("hachushamei",@@sql_tantolist[num]["hachushamei"])
                @@report_array[num].store("bukenmei",@@sql_tantolist[num]["bukenmei"])
                @@report_array[num].store("shubetumei", @shubetumei)
                @@report_array[num].store("tenkenyoteiM1", @@sql_tantolist[num]["tenkenyoteiM1"].to_s + '月')
                @@report_array[num].store("keiyaku",'\\' + number_with_delimiter(@@sql_tantolist[num]["sum_keiyakukingaku"].round))
                #契約金額計（別計算）
                @@keiyakukingaku_total += @@sql_tantolist[num]["sum_keiyakukingaku"]
                @@gaichuhi_total += @@sql_tantolist[num]["gaichuhi"]
            end
            @keiyaku_k = (@@keiyakukingaku_total == 0) ? '' : '&yen;' + number_with_delimiter(@@keiyakukingaku_total.round)
            @gaichuh_k = (@@gaichuhi_total == 0) ? '' : '&yen;' + number_with_delimiter(@@gaichuhi_total.round)

            @html_string = @html_string.sub('<textarea class="ttl_body05" cols="20" rows="2" tabindex="26" readonly>insert</textarea>','<textarea class="ttl_body05" cols="20" rows="2" tabindex="26" readonly>' + '&yen;' + number_with_delimiter(@@keiyakukingaku_total.round) + '</textarea>')
            @html_string +=
            '<div class="ttl_footer02">合計</div>' +
            '<textarea class="ttl_footer03" cols="20" rows="1" tabindex="26" readonly>' + @sql_count.to_s + '</textarea>' +
            '<textarea class="ttl_footer05" cols="20" rows="1" tabindex="26" readonly>' + @keiyaku_k + '</textarea>' +
            '<textarea class="ttl_footer05" cols="20" rows="1" tabindex="26" readonly>' + @gaichuh_k + '</textarea>' +
            '<textarea class="ttl_footer03" cols="20" rows="1" tabindex="26" readonly>' + @@sql_sum_jinko[0]["sum_jinko"].to_s + '</textarea>' +
            '<div class="ttl_footer01"></div>' +
            '<div class="ttl_footer01"></div>' +
            '<div class="ttl_footer07"></div>' +
            '<div class="ttl_footer03_r"></div>' +
            '<textarea class="ttl_footer06" cols="20" rows="1" tabindex="26" readonly>' + @keiyaku_k + '</textarea>' +
            '<textarea class="ttl_footer06" cols="20" rows="1" tabindex="26" readonly>' + @gaichuh_k + '</textarea>' + '<div class="kugiri"></div>'
            #帳票用契約保有高合計
            @@report_array[0].store("keiyaku_total",'\\' + number_with_delimiter(@@keiyakukingaku_total.round))

        end
    end

    def chohyo_tantolist

        #帳票１ページあたりの表示件数
        @page_max_kensu =	19

        @count_u = @@sql_tantolist.count

        @total_page = (@count_u.to_f / @page_max_kensu.to_f).ceil
        t = Time.now
        @t_date = t.year.to_s + '年' +  t.month.to_s + '月' + t.day.to_s + '日'

        #header　実績補修・点検情報　共通部分　
        data = []

        @nendo_str = @@nendo.to_s + '年度'
        @tuki_str = (@@tuki != '' and @@tuki != '-1') ? @@tuki.to_s + '月' : '全月'
        @@text_keiyaku_total_s = '\\' + number_with_delimiter(@@keiyakukingaku_total.round)
        @@text_gaichuhi_total_s  =  '\\' + number_with_delimiter(@@gaichuhi_total.round)
        @@text_jinko_total_s = @@sql_sum_jinko[0]["sum_jinko"].to_s
        @@text_keiyaku_s  = '\\' + number_with_delimiter(@@keiyakukingaku_total.round)
        @@text_gaichuhi_s  = '\\' + number_with_delimiter(@@gaichuhi_total.round)

        d1 = {	:text_date	=> @t_date,
            :text_nendo => @nendo_str,
            :text_tuki => @tuki_str,
            :text_tenkentantoshamei => @@tantoshamei,
            :text_tantoshashubetu => @@tantoshashubetumei,
            :default		=> []}
        @mae_buken = ''
        @mae_hachu = ''
        for @soeji in 0..@count_u - 1 do
            @hyoji_bukenmei = (@mae_buken == @@report_array[@soeji]["bukenmei"]) ? '' : @@report_array[@soeji]["bukenmei"]
            @hyoji_hachushamei = (@mae_hachu == @@report_array[@soeji]["hachushamei"]) ? '' : @@report_array[@soeji]["hachushamei"]
            #明細部のデータ
            #html用の円記号'&yen;'を帳票用'\\'に入れ替え
            d1[:default] << {	:text_tantoshamei => @@report_array[@soeji]["tantoshamei"],
                :text_kensu => @@report_array[@soeji]["count"],
                :text_keiyaku_total => @@report_array[@soeji]["keiyaku_total"],
                :text_gaichuhi_total => @@report_array[@soeji]["gaichu_total"],
                :text_jinko => @@report_array[@soeji]["jinko_total"],
                :text_hachushamei => @hyoji_hachushamei,
                :text_bukenmei => @hyoji_bukenmei,
                :text_shubetumei => @@report_array[@soeji]["shubetumei"],
                :text_tenkenM => @@report_array[@soeji]["tenkenyoteiM1"],
                :text_keiyaku => @@report_array[@soeji]["keiyaku"],
                :text_gaichuhi => @@report_array[@soeji]["gaichu_total"]}
            @mae_buken = @@report_array[@soeji]["bukenmei"]
            @mae_hachu = @@report_array[@soeji]["hachushamei"]
        end

        data << d1

        report = ThinReports::Report.create do |r|
            r.use_layout  File.join(Rails.root, 'app','views', 'tantolist', 'tantoshalist.tlf') do |config|

                r.events.on :page_create do |e|
                    e.page.item(:text_page).value(e.page.no.to_s + '/' +  @total_page.to_s + 'ページ')

                end

                config.list(:default) do

                    events.on :footer_insert do |e|

                        e.section.item(:text_kensu_s).value(@@sql_tantolist.count)
                        e.section.item(:text_keiyaku_total_s).value(@@text_keiyaku_total_s.to_s)
                        e.section.item(:text_gaichuhi_total_s).value(@@text_gaichuhi_total_s.to_s)
                        e.section.item(:text_jinko_total_s).value(@@text_jinko_total_s.to_s)
                        e.section.item(:text_keiyaku_s).value(@@text_keiyaku_s)
                        e.section.item(:text_gaichuhi_s).value(@@text_gaichuhi_s.to_s)
                    end

                end

            end

            data.each do |header|
                r.start_new_page

                r.page.values(:text_date	 => header[:text_date],
                :text_nendo => header[:text_nendo],
                :text_tuki => header[:text_tuki],
                :text_tenkentantoshamei => header[:text_tenkentantoshamei],
                :text_tantoshashubetu => header[:text_tantoshashubetu])

                header[:default].each do |detail|
                    r.page.list(:default).add_row(detail)
                end
            end
        end
        @pdf_name = CommonUtil.open_pdf(report, 'tantoshalist', format("%05d",session[:user_id]))
        #report.generate_file(File.join(Rails.root, 'public', @pdf_name))
        @error = 2

    end

end

