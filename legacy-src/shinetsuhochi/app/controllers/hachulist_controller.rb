class HachulistController < ApplicationController
    include ActionView::Helpers::NumberHelper
    #require 'thinreports'
    before_action :mainte_check
    before_action :login_check
    before_action :dialog_init
    def index
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

        @@sql_hachulist = []
        #遷移先
        @query_str = ''

        @nendo_select = CommonUtil.nendo_hash_default(-2,1)
        @default_n = CommonUtil.konnendo #楊健 2014-11-14(39-38番対応する)
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

            @buken_sql = ( params[:nm_txt_HCL_Buken] == '' )? "" :
            "AND THo.bukenmei LIKE '%" +  params[:nm_txt_HCL_Buken].gsub(Str_pattern2,ESCAPE_SQL) + "%'"
            @hachusha_sql = ( params[:nm_txt_HCL_Hachusha] == '' )? "" :
            " AND MOr.hachushamei LIKE '%" +  params[:nm_txt_HCL_Hachusha].gsub(Str_pattern2,ESCAPE_SQL) + "%'"
            @@nendo = params[:sanshonendo]
            #物件名、発注者名どちらも空欄の場合
            if @buken_sql == '' and @hachusha_sql == '' then
                @focus = "id_txt_HCL_Hachusha"
                @error_message  = MESSAGE_24
            else
                @@kensaku_bukenmei = params[:nm_txt_HCL_Buken]
                @@kensaku_hachushamei = params[:nm_txt_HCL_Hachusha]
                #条件を加え検索
                search_action(@buken_sql, @hachusha_sql, @@nendo.to_s)
                @error = 1
            end
            #検索以外のボタン押された場合
        elsif @commit_kind == '帳票出力' then
            if @@sql_hachulist.count > 0 then
                chohyo_hachulist
            else
                @focus = "id_txt_HCL_Hachusha"
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
    def search_action(hachusha, buken, nendo)
        #SUM3:発注者別契約保有高、SUM4:発注者別外注費合計、SUM1:物件別契約保有高、SUM2:物件別外注費合計
        #外注費、契約金額にNULLが設定されていた場合０として計算する
        @@sql_hachulist = ActiveRecord::Base.connection.
        select("	SELECT B.hachushamei, C.SUM3, C.SUM4, B.bukenmei, B.SUM1, B.SUM2, B.hachushaCode, B.bukenCode, B.teishiFlg
					FROM  ( SELECT  MHo.teishiFlg, A.bukenmei, A.hachushaCode, A.hachushamei,   MHo.bukenCode,
						        SUM(COALESCE( TCi.keiyakukingaku1, 0 )) AS SUM1,  SUM( COALESCE( TCi.gaichuhi1, 0 ) + COALESCE( TCi.gaichuhi2, 0 ) + COALESCE( TCi.gaichuhi3, 0 ) + COALESCE( TCi.gaichuhi4, 0 ) + COALESCE( TCi.gaichuhi5, 0 ) + COALESCE( TCi.gaichuhi6, 0 ) + COALESCE( TCi.gaichuhi7, 0 ) + COALESCE( TCi.gaichuhi8, 0 ) + COALESCE( TCi.gaichuhi9, 0 ) + COALESCE( TCi.gaichuhi10, 0 ) ) AS SUM2
                             FROM m_housinginfos AS MHo, t_check_infos AS TCi
                             INNER JOIN
                               ( SELECT  DISTINCT THo.bukenCode, THo.bukenmei, MOr.hachushaCode, MOr.hachushamei
                                 FROM t_housinginfos AS THo, m_orderingpatries AS MOr
                                 WHERE THo.hachushaCode = MOr.hachushaCode " +
        buken + hachusha +  ") A
						        ON TCi.hachushaCode = A.hachushaCode
                             AND TCi.bukenCode = A.bukenCode
                   		WHERE MHo.bukenCode = TCi.bukenCode
	              		AND TCi.nendo = " + nendo + "
							GROUP BY  MHo.bukenCode
							 ) B
              	INNER JOIN
					    (	SELECT  hachushaCode, SUM(COALESCE( keiyakukingaku1, 0 )) AS SUM3,
					      SUM( COALESCE( gaichuhi1, 0 ) + COALESCE( gaichuhi2, 0 ) + COALESCE( gaichuhi3, 0 ) + COALESCE( gaichuhi4, 0 ) + COALESCE( gaichuhi5, 0 ) + COALESCE( gaichuhi6, 0 ) + COALESCE( gaichuhi7, 0 ) + COALESCE( gaichuhi8, 0 ) + COALESCE( gaichuhi9, 0 ) + COALESCE( gaichuhi10, 0 ) ) AS SUM4
							FROM  t_check_infos
							WHERE nendo = " + nendo + "
							GROUP BY hachushaCode ) C
					ON B.hachushaCode = C.hachushaCode
					ORDER BY B.hachushamei ASC ")
        @html_string = ''
        @sql_count = @@sql_hachulist.count
        if @sql_count > 0 then
            #帳票用配列
            @@report_array = Array.new(@sql_count){ Hash.new() }
            #SUM3:発注者別契約保有高、SUM4:発注者別外注費合計、SUM1:物件別契約保有高、SUM2:物件別外注費合計
            #それぞれの合計
            @total_sum1 = 0
            @total_sum2 = 0
            @total_sum3 = 0
            @total_sum4 = 0
            @mae_hachushamei = ''

            for num in 0.. @sql_count - 1 do
                #上の行と同じ発注者名(@mae_hachushamei)、または金額なら０は表示しない
                @sum1 = (@@sql_hachulist[num]["SUM1"].round == 0) ? '' : '&yen;' + number_with_delimiter(@@sql_hachulist[num]["SUM1"].round)
                @total_sum1 += @@sql_hachulist[num]["SUM1"].round
                @sum2 = (@@sql_hachulist[num]["SUM2"].round == 0) ? '' : '&yen;' + number_with_delimiter(@@sql_hachulist[num]["SUM2"].round)
                @total_sum2 += @@sql_hachulist[num]["SUM2"].round

                if @@sql_hachulist[num]["SUM3"].round == 0 or @@sql_hachulist[num]["hachushamei"] == @mae_hachushamei then
                    @sum3 = ''
                else
                    @sum3 = '&yen;' + number_with_delimiter(@@sql_hachulist[num]["SUM3"].round)
                    @total_sum3 += @@sql_hachulist[num]["SUM3"].round
                end

                if @@sql_hachulist[num]["SUM4"].round == 0 or @@sql_hachulist[num]["hachushamei"] == @mae_hachushamei then
                    @sum4 = ''
                else
                    @sum4 = '&yen;' + number_with_delimiter(@@sql_hachulist[num]["SUM4"].round)
                    @total_sum4 += @@sql_hachulist[num]["SUM4"].round
                end

                @hachushamei = ( @@sql_hachulist[num]["hachushamei"] == @mae_hachushamei) ? '' : @@sql_hachulist[num]["hachushamei"].to_s
                #明細行のhtmlタグ
                @html_string +=
                '<textarea class="hcl_body01" cols="20" rows="2" tabindex="25" readonly>' + @hachushamei.gsub(Str_pattern1,ESCAPE_HTML) + '</textarea>' +
                #'<input type="text" class="hcl_body01"  cols="20" rows="2" tabindex="21" readonly="true" wrap="soft" value="' + @hachushamei.gsub(Str_pattern1,ESCAPE_HTML) + '">' +
                '<textarea class="hcl_body02" cols="20" rows="2" tabindex="25" readonly>' + @sum3 + '</textarea>' +
                '<textarea class="hcl_body02" cols="20" rows="2" tabindex="25" readonly>' + @sum4 + '</textarea>' +
                '<textarea class="hcl_body03" cols="20" rows="2" tabindex="25" readonly onClick="to_buken_joho_shosai(' + @@sql_hachulist[num]["bukenCode"].to_s + ',' + @@sql_hachulist[num]["hachushaCode"].to_s + ')">' + @@sql_hachulist[num]["bukenmei"] + '</textarea>' +
                '<textarea class="hcl_body02" cols="20"  rows="2" tabindex="25" readonly>' + @sum1 + '</textarea>' +
                '<textarea class="hcl_body02" cols="20"  rows="2" tabindex="25" readonly>' + @sum2 + '</textarea>' +
                '<div class="kugiri"></div>'
                @mae_hachushamei = @@sql_hachulist[num]["hachushamei"]
                #帳票用配列にセット
                @@report_array[num].store("hachushamei",@hachushamei)
                @@report_array[num].store("SUM3",@sum3)
                @@report_array[num].store("SUM4",@sum4)
                @@report_array[num].store("bukenmei",@@sql_hachulist[num]["bukenmei"])
                @@report_array[num].store("SUM1",@sum1)
                @@report_array[num].store("SUM2",@sum2)
            end
            @@total_sum1_str = (@total_sum1 == 0) ? '' : '&yen;' + number_with_delimiter(@total_sum1)
            @@total_sum2_str = (@total_sum2 == 0) ? '' : '&yen;' + number_with_delimiter(@total_sum2)
            @@total_sum3_str = (@total_sum3 == 0) ? '' : '&yen;' + number_with_delimiter(@total_sum3)
            @@total_sum4_str = (@total_sum4 == 0) ? '' : '&yen;' + number_with_delimiter(@total_sum4)

            @html_string += '<div class="hcl_footer01">合計</div>' +
            '<textarea class="hcl_footer02" cols="20" rows="1" tabindex="26" readonly>' + @@total_sum3_str + '</textarea>' +
            '<textarea class="hcl_footer02" cols="20" rows="1" tabindex="26" readonly>' + @@total_sum4_str + '</textarea>' +
            '<div class="hcl_footer01"></div>' +
            '<textarea class="hcl_footer02" cols="20" rows="1" tabindex="26" readonly>' + @@total_sum1_str + '</textarea>' +
            '<textarea class="hcl_footer02" cols="20" rows="1" tabindex="26" readonly>' + @@total_sum2_str + '</textarea>'
        end
    end

    def chohyo_hachulist

        #帳票１ページあたりの表示件数
        @page_max_kensu =	17

        @count_u = @@sql_hachulist.count

        @total_page = (@count_u.to_f / @page_max_kensu.to_f).ceil
        t = Time.now
        @t_date = t.year.to_s + '年' +  t.month.to_s + '月' + t.day.to_s + '日'

        #header　実績補修・点検情報　共通部分　
        data = []

        @nendo_str = @@nendo.to_s + '年度'

        d1 = {	:text_date	=> @t_date,
            :text_nendo => @nendo_str,
            :text_kensaku_hachushamei => @@kensaku_hachushamei,
            :text_kensaku_bukenmei => @@kensaku_bukenmei,
            :default		=> []}

        for @soeji in 0..@count_u - 1 do
            #明細部のデータ
            #html用の円記号'&yen;'を帳票用'\\'に入れ替え
            d1[:default] << {	:text_hachushamei => @@report_array[@soeji]["hachushamei"],
                :text_h_keiyaku => @@report_array[@soeji]["SUM3"].sub('&yen;','\\'),
                :text_h_gaichu => @@report_array[@soeji]["SUM4"].sub('&yen;','\\'),
                :text_bukenmei => @@report_array[@soeji]["bukenmei"],
                :text_b_keiyaku => @@report_array[@soeji]["SUM1"].sub('&yen;','\\'),
                :text_b_gaichu => @@report_array[@soeji]["SUM2"].sub('&yen;','\\')}
        end

        data << d1

        report = ThinReports::Report.create do |r|
            r.use_layout  File.join(Rails.root, 'app','views', 'hachulist', 'hachulist.tlf') do |config|

                r.events.on :page_create do |e|
                    e.page.item(:text_page).value(e.page.no.to_s + '/' +  @total_page.to_s + 'ページ')

                end

                config.list(:default) do

                    events.on :footer_insert do |e|
                        e.section.item(:text_h_keiyaku_total).value(@@total_sum3_str.sub('&yen;','\\') )
                        e.section.item(:text_h_gaichu_total).value(@@total_sum4_str.sub('&yen;','\\') )
                        e.section.item(:text_b_keiyaku_total).value(@@total_sum1_str.sub('&yen;','\\'))
                        e.section.item(:text_b_gaichu_total).value(@@total_sum2_str.sub('&yen;','\\') )
                    end

                end

            end

            data.each do |header|
                r.start_new_page

                r.page.values(:text_date		=> header[:text_date],
                :text_nendo => header[:text_nendo],
                :text_kensaku_hachushamei => header[:text_kensaku_hachushamei],
                :text_kensaku_bukenmei => header[:text_kensaku_bukenmei])

                header[:default].each do |detail|
                    r.page.list(:default).add_row(detail)
                end
            end
        end
        #report.generate_file(File.join(Rails.root, 'public', @pdf_name))
        @pdf_name = CommonUtil.open_pdf(report, 'hachulist', format("%05d",session[:user_id]))
        @error = 2

    end

end
