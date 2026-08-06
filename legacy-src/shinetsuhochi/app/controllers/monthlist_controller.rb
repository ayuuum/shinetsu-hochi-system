class MonthlistController < ApplicationController
    include ActionView::Helpers::NumberHelper
    before_action :mainte_check
    before_action :login_check
    before_action :dialog_init
    def index

        #点検情報からの遷移(idが入力されていて整数ならそれを年度とみなす)
	session[:konnendo] = CommonUtil.konnendo
        @nendo = (!params[:id].blank? and params[:id] =~ /^[0-9]+$/) ? params[:id].to_i : CommonUtil.konnendo
        @@monthlist_ary = Array.new(13).map{Array.new(12,0)}
        @@sum_ary = Array.new(10){0}
        @nendo_select = CommonUtil.nendo_hash_default(-2,1)

        @m_init = MInit.all
        @@m_int = @m_init
        @@kaishiM = @m_init[0]["nendokaishiM"]

        monthlist_search(@nendo)
        hoshujoho_search(@nendo)

        render :layout => 'menu'
    end

    def commit
        @error = 0
        #押されたボタンの種類
        @@nendo = params[:sanshonendo]
        @nendo = @@nendo
        @commit_kind = params[:commit]
        if @commit_kind == '検索' then
            if @@nendo == '' then
                @error_message  = MESSAGE_42
            else
                monthlist_search(@@nendo)
                hoshujoho_search(@@nendo)
                @error = 1
            end

        elsif @commit_kind == '帳票出力' then
            #押されたボタンの種類
            chohyo_monthlist
            @error = 2
            logger.debug("@error " + @error.to_s)
        end
    end

    def monthlist_search(nendo)
        @monthlist_ary = Array.new(13).map{Array.new(12,0)}
        @sum_ary = Array.new(10){0}
        @zen = Array.new(12)
        for ind in 1..12 do
            @zen[ind - 1] = (ind < @@kaishiM) ? 1 : 0
        end
        @@sql_jissekilist = ActiveRecord::Base.connection.
        select("SELECT COALESCE(COUNT( * ),0) AS count, COALESCE(SUM( keiyakukingaku),0 ) AS kingaku, COALESCE(SUM(jinko),0) AS jinko
						FROM t_chktrackrec_infos
						WHERE year( tenkenkanryoYMD ) = #{nendo} + #{@zen[0]}
						AND month( tenkenkanryoYMD ) = 1
						AND ( month( tenkenkanryoYMD ) <> tenkenyoteiM OR year( tenkenkanryoYMD ) <> nendo +#{@zen[0]})
						UNION ALL
						SELECT COALESCE(COUNT( * ),0) AS count, COALESCE(SUM( keiyakukingaku),0 ) AS kingaku, COALESCE(SUM(jinko),0) AS jinko
						FROM t_chktrackrec_infos
						WHERE year( tenkenkanryoYMD ) = #{nendo} + #{@zen[1]}
						AND month( tenkenkanryoYMD ) = 2
						AND ( month( tenkenkanryoYMD ) <> tenkenyoteiM OR year( tenkenkanryoYMD ) <> nendo +#{@zen[1]})
						UNION ALL
						SELECT COALESCE(COUNT( * ),0) AS count, COALESCE(SUM( keiyakukingaku),0 ) AS kingaku, COALESCE(SUM(jinko),0) AS jinko
						FROM t_chktrackrec_infos
						WHERE year( tenkenkanryoYMD ) = #{nendo} + #{@zen[2]}
						AND month( tenkenkanryoYMD ) = 3
						AND ( month( tenkenkanryoYMD ) <> tenkenyoteiM OR year( tenkenkanryoYMD ) <> nendo +#{@zen[2]})
						UNION ALL
						SELECT COALESCE(COUNT( * ),0) AS count, COALESCE(SUM( keiyakukingaku),0 ) AS kingaku, COALESCE(SUM(jinko),0) AS jinko
						FROM t_chktrackrec_infos
						WHERE year( tenkenkanryoYMD ) = #{nendo} + #{@zen[3]}
						AND month( tenkenkanryoYMD ) = 4
						AND ( month( tenkenkanryoYMD ) <> tenkenyoteiM OR year( tenkenkanryoYMD ) <> nendo +#{@zen[3]})
						UNION ALL
						SELECT COALESCE(COUNT( * ),0) AS count, COALESCE(SUM( keiyakukingaku),0 ) AS kingaku, COALESCE(SUM(jinko),0) AS jinko
						FROM t_chktrackrec_infos
						WHERE year( tenkenkanryoYMD ) = #{nendo} + #{@zen[4]}
						AND month( tenkenkanryoYMD ) = 5
						AND ( month( tenkenkanryoYMD ) <> tenkenyoteiM OR year( tenkenkanryoYMD ) <> nendo +#{@zen[4]})
						UNION ALL
						SELECT COALESCE(COUNT( * ),0) AS count, COALESCE(SUM( keiyakukingaku),0 ) AS kingaku, COALESCE(SUM(jinko),0) AS jinko
						FROM t_chktrackrec_infos
						WHERE year( tenkenkanryoYMD ) = #{nendo} + #{@zen[5]}
						AND month( tenkenkanryoYMD ) = 6
						AND ( month( tenkenkanryoYMD ) <> tenkenyoteiM OR year( tenkenkanryoYMD ) <> nendo +#{@zen[5]})
						UNION ALL
						SELECT COALESCE(COUNT( * ),0) AS count, COALESCE(SUM( keiyakukingaku),0 ) AS kingaku, COALESCE(SUM(jinko),0) AS jinko
						FROM t_chktrackrec_infos
						WHERE year( tenkenkanryoYMD ) = #{nendo} + #{@zen[6]}
						AND month( tenkenkanryoYMD ) = 7
						AND ( month( tenkenkanryoYMD ) <> tenkenyoteiM OR year( tenkenkanryoYMD ) <> nendo +#{@zen[6]})
						UNION ALL
						SELECT COALESCE(COUNT( * ),0) AS count, COALESCE(SUM( keiyakukingaku),0 ) AS kingaku, COALESCE(SUM(jinko),0) AS jinko
						FROM t_chktrackrec_infos
						WHERE year( tenkenkanryoYMD ) = #{nendo} + #{@zen[7]}
						AND month( tenkenkanryoYMD ) = 8
						AND ( month( tenkenkanryoYMD ) <> tenkenyoteiM OR year( tenkenkanryoYMD ) <> nendo +#{@zen[7]})
						UNION ALL
						SELECT COALESCE(COUNT( * ),0) AS count, COALESCE(SUM( keiyakukingaku),0 ) AS kingaku, COALESCE(SUM(jinko),0) AS jinko
						FROM t_chktrackrec_infos
						WHERE year( tenkenkanryoYMD ) = #{nendo} + #{@zen[8]}
						AND month( tenkenkanryoYMD ) = 9
						AND ( month( tenkenkanryoYMD ) <> tenkenyoteiM OR year( tenkenkanryoYMD ) <> nendo +#{@zen[8]})
						UNION ALL
						SELECT COALESCE(COUNT( * ),0) AS count, COALESCE(SUM( keiyakukingaku),0 ) AS kingaku, COALESCE(SUM(jinko),0) AS jinko
						FROM t_chktrackrec_infos
						WHERE year( tenkenkanryoYMD ) = #{nendo} + #{@zen[9]}
						AND month( tenkenkanryoYMD ) = 10
						AND ( month( tenkenkanryoYMD ) <> tenkenyoteiM OR year( tenkenkanryoYMD ) <> nendo +#{@zen[9]})
						UNION ALL
						SELECT COALESCE(COUNT( * ),0) AS count, COALESCE(SUM( keiyakukingaku),0 ) AS kingaku, COALESCE(SUM(jinko),0) AS jinko
						FROM t_chktrackrec_infos
						WHERE year( tenkenkanryoYMD ) = #{nendo} + #{@zen[10]}
						AND month( tenkenkanryoYMD ) = 11
						AND ( month( tenkenkanryoYMD ) <> tenkenyoteiM OR year( tenkenkanryoYMD ) <> nendo +#{@zen[10]})
						UNION ALL
						SELECT COALESCE(COUNT( * ),0) AS count, COALESCE(SUM( keiyakukingaku),0 ) AS kingaku, COALESCE(SUM(jinko),0) AS jinko
						FROM t_chktrackrec_infos
						WHERE year( tenkenkanryoYMD ) = #{nendo} + #{@zen[11]}
						AND month( tenkenkanryoYMD ) = 12
						AND ( month( tenkenkanryoYMD ) <> tenkenyoteiM OR year( tenkenkanryoYMD ) <> nendo +#{@zen[11]})" )

        @@sql_monthlist = ActiveRecord::Base.connection.
        select("SELECT tenkenyoteiM
						, COUNT(bukenCode) AS count
   						, SUM(keiyakukingaku) AS kingaku
   						, SUM(CASE tenkenstatus WHEN 1 THEN 1 ELSE 0 END) AS st1
   						, SUM(CASE tenkenstatus WHEN 2 THEN 1 ELSE 0 END) AS st2
   						, SUM(CASE tenkenstatus WHEN 3 THEN 1 ELSE 0 END) AS st3
   						, SUM(CASE tenkenstatus WHEN 4 THEN 1 ELSE 0 END) AS st4
   						, SUM(CASE tenkenstatus WHEN 5 THEN 1 ELSE 0 END) AS st5
					 	, SUM(CASE WHEN (MONTH(tenkenkanryoYMD) = tenkenyoteiM AND
								((tenkenyoteiM >= #{@@kaishiM} AND YEAR (tenkenkanryoYMD) = nendo) OR
								(tenkenyoteiM < #{@@kaishiM} AND YEAR (tenkenkanryoYMD) = nendo+1))) THEN 1 ELSE 0 END) AS nai_suu
   						, SUM(CASE WHEN ( MONTH(tenkenkanryoYMD) = tenkenyoteiM AND
								((tenkenyoteiM >= #{@@kaishiM} AND YEAR (tenkenkanryoYMD) = nendo) OR
								(tenkenyoteiM < #{@@kaishiM} AND YEAR (tenkenkanryoYMD) = nendo+1))) THEN keiyakukingaku ELSE 0 END) AS nai_kingaku
   						, SUM(CASE WHEN ( MONTH(tenkenkanryoYMD) = tenkenyoteiM AND
								((tenkenyoteiM >= #{@@kaishiM} AND YEAR (tenkenkanryoYMD) = nendo) OR
								(tenkenyoteiM < #{@@kaishiM} AND YEAR (tenkenkanryoYMD) = nendo+1))) THEN jinko ELSE 0 END) AS jinko
					   FROM t_chktrackrec_infos
					   WHERE nendo = #{nendo}
					   GROUP BY tenkenyoteiM
					   ORDER BY tenkenyoteiM ASC ")
        @sql_monthlist = @@sql_monthlist
        @count = @sql_monthlist.count
        @soeji = 0

        for num in 0..11 do
            #表示は年度開始月から１２ヶ月分 , SUM(CASE WHEN MONTH(tenkenkanryoYMD) = tenkenyoteiM THEN jinko ELSE 0 END) AS jinko
            @i = (num  + 13 - @@kaishiM) % 12

            if @soeji < @count and @sql_monthlist[@soeji]["tenkenyoteiM"] == num + 1 then
                #月
                @monthlist_ary[@i][0] = @sql_monthlist[@soeji]["tenkenyoteiM"].to_s
                #総件数（契約保有高）
                @monthlist_ary[@i][1] = @sql_monthlist[@soeji]["count"].to_s + '(' + "\u00A5" + number_with_delimiter(@sql_monthlist[@soeji]["kingaku"].round) + ')'
                #総件数（点検ステータス１～５）
                @monthlist_ary[@i][2] = @sql_monthlist[@soeji]["st1"]
                @monthlist_ary[@i][3] = @sql_monthlist[@soeji]["st2"]
                @monthlist_ary[@i][4] = @sql_monthlist[@soeji]["st3"]
                @monthlist_ary[@i][5] = @sql_monthlist[@soeji]["st4"]
                @monthlist_ary[@i][6] = @sql_monthlist[@soeji]["st5"]
                #１＋２点検実績件数（１＋２契約保有高）
                #@monthlist_ary[@i][7] = (@sql_monthlist[@soeji]["nai_suu"] + @sql_monthlist[@soeji]["gai_suu"]).to_s + '(' + "\u00A5" + number_with_delimiter(@sql_monthlist[@soeji]["nai_kingaku"].round + @sql_monthlist[@soeji]["gai_kingaku"].round) + ')'
                @monthlist_ary[@i][7] = number_with_delimiter(@sql_monthlist[@soeji]["nai_suu"] + @@sql_jissekilist[@soeji]["count"]).to_s + '(' + "\u00A5" + number_with_delimiter(@sql_monthlist[@soeji]["nai_kingaku"].round + @@sql_jissekilist[@soeji]["kingaku"].round) + ')'
                #@@sql_jissekilist count, kingaku, jinko
                #１予定内点検実績件数（１契約保有高）
                @monthlist_ary[@i][8] = number_with_delimiter(@sql_monthlist[@soeji]["nai_suu"]).to_s + '(' + "\u00A5" + number_with_delimiter(@sql_monthlist[@soeji]["nai_kingaku"].round) + ')'

                #２予定外点検実績件数（２契約保有高）
                #@monthlist_ary[@i][9] = (@sql_monthlist[@soeji]["gai_suu"]).to_s + '(' + "\u00A5" + number_with_delimiter(@sql_monthlist[@soeji]["gai_kingaku"].round) + ')'
                @monthlist_ary[@i][9] = number_with_delimiter(@@sql_jissekilist[@soeji]["count"]).to_s + '(' + "\u00A5" + number_with_delimiter( @@sql_jissekilist[@soeji]["kingaku"].round) + ')'
                #人工合計
                @monthlist_ary[@i][10] = @sql_monthlist[@soeji]["jinko"] + @@sql_jissekilist[@soeji]["jinko"]

                #合計欄計算
                @monthlist_ary[12][0] += @sql_monthlist[@soeji]["count"]
                @monthlist_ary[12][1] += @sql_monthlist[@soeji]["kingaku"].round
                @monthlist_ary[12][2] += @sql_monthlist[@soeji]["st1"]
                @monthlist_ary[12][3] += @sql_monthlist[@soeji]["st2"]
                @monthlist_ary[12][4] += @sql_monthlist[@soeji]["st3"]
                @monthlist_ary[12][5] += @sql_monthlist[@soeji]["st4"]
                @monthlist_ary[12][6] += @sql_monthlist[@soeji]["st5"]
                @monthlist_ary[12][7] += @sql_monthlist[@soeji]["nai_suu"]
                @monthlist_ary[12][8] += @@sql_jissekilist[@soeji]["count"] #@sql_monthlist[@soeji]["gai_suu"]
                @monthlist_ary[12][9] += @sql_monthlist[@soeji]["nai_kingaku"].round
                @monthlist_ary[12][10] += @@sql_jissekilist[@soeji]["kingaku"].round #@sql_monthlist[@soeji]["gai_kingaku"].round
                @monthlist_ary[12][11] += @sql_monthlist[@soeji]["jinko"] + @@sql_jissekilist[@soeji]["jinko"]

                @soeji += 1
            else
                @monthlist_ary[@i][0] = (num + 1).to_s
                @monthlist_ary[@i][1] = "0(\u00A50)"
                #総件数（点検ステータス１～５）
                @monthlist_ary[@i][2] = '0'
                @monthlist_ary[@i][3] = '0'
                @monthlist_ary[@i][4] = '0'
                @monthlist_ary[@i][5] = '0'
                @monthlist_ary[@i][6] = '0'
                #１＋２点検実績件数（１＋２契約保有高）
                @monthlist_ary[@i][7] = "0(\u00A50)"
                #１予定内点検実績件数（１契約保有高）
                @monthlist_ary[@i][8] = "0(\u00A50)"
                #２予定外点検実績件数（２契約保有高）
                @monthlist_ary[@i][9] = "0(\u00A50)"
                #人工合計
                @monthlist_ary[@i][10] = '0.0'
            end

            @sum_ary[0] = number_with_delimiter(@monthlist_ary[12][0]) + '(' + "\u00A5" + number_with_delimiter(@monthlist_ary[12][1]) + ')'
            @sum_ary[1] = @monthlist_ary[12][2]
            @sum_ary[2] = @monthlist_ary[12][3]
            @sum_ary[3] = @monthlist_ary[12][4]
            @sum_ary[4] = @monthlist_ary[12][5]
            @sum_ary[5] = @monthlist_ary[12][6]
            @sum_ary[6] = number_with_delimiter(@monthlist_ary[12][7] + @monthlist_ary[12][8]).to_s + '(' + "\u00A5" + number_with_delimiter(@monthlist_ary[12][9] + @monthlist_ary[12][10]) + ')'
            @sum_ary[7] = number_with_delimiter(@monthlist_ary[12][7]).to_s + '(' + "\u00A5" + number_with_delimiter(@monthlist_ary[12][9]) + ')'
            @sum_ary[8] = number_with_delimiter(@monthlist_ary[12][8]).to_s + '(' + "\u00A5" + number_with_delimiter(@monthlist_ary[12][10]) + ')'
            @sum_ary[9] = (@monthlist_ary[12][11] == 0) ? '0.0' : @monthlist_ary[12][11]

            @@monthlist_ary = @monthlist_ary
            @@sum_ary = @sum_ary

        end

    end

    def hoshujoho_search(nendo)
        @@sql_hoshujoho = ActiveRecord::Base.connection.
        select("SELECT COUNT(bukenCode) AS count
       				, COALESCE(SUM(CASE hoshustatus WHEN 1 THEN 1 ELSE 0 END),0) AS st1
       				, COALESCE(SUM(CASE hoshustatus WHEN 2 THEN 1 ELSE 0 END),0) AS st2
       				, COALESCE(SUM(CASE hoshustatus WHEN 3 THEN 1 ELSE 0 END),0) AS st3
       				, COALESCE(SUM(CASE hoshustatus WHEN 4 THEN 1 ELSE 0 END),0) AS st4
       				, COALESCE(SUM(CASE hoshustatus WHEN 5 THEN 1 ELSE 0 END),0) AS st5
       				, COALESCE(SUM(CASE hoshustatus WHEN 6 THEN 1 ELSE 0 END),0) AS st6
     					FROM t_repair_infos
						WHERE nendo = #{nendo} ")
        @sql_hoshujoho = @@sql_hoshujoho
        @hoshu_list1 = number_with_delimiter(@sql_hoshujoho[0]["count"])
        @hoshu_list2 = number_with_delimiter(@sql_hoshujoho[0]["st1"])
        @hoshu_list3 = number_with_delimiter(@sql_hoshujoho[0]["st2"])
        @hoshu_list4 = number_with_delimiter(@sql_hoshujoho[0]["st3"])
        @hoshu_list5 = number_with_delimiter(@sql_hoshujoho[0]["st4"])
        @hoshu_list6 = number_with_delimiter(@sql_hoshujoho[0]["st5"])
        @hoshu_list7 = number_with_delimiter(@sql_hoshujoho[0]["st6"])
    end

    def chohyo_monthlist
        #帳票１ページあたりの表示件数
        @page_max_kensu =	12

        @count_u = @@sql_monthlist.count

        t = Time.now
        @t_date = t.year.to_s + '年' +  t.month.to_s + '月' + t.day.to_s + '日'
        @nendo_str = @@nendo.to_s + '年度'
        #header　実績補修・点検情報　共通部分　
        data = []
        @monthlist_ary = Array.new(13).map{Array.new(12,0)}
        @sum_ary = Array.new(10){0}

        d1 = {	:txtNendo	=> @nendo_str,
            :txtToday	=> @t_date,
            :txtHosta1 => @@m_int[0]["hoshustatusmei1"],
            :txtHosta2 => @@m_int[0]["hoshustatusmei2"],
            :txtHosta3 => @@m_int[0]["hoshustatusmei3"],
            :txtHosta4 => @@m_int[0]["hoshustatusmei4"],
            :txtHosta5 => @@m_int[0]["hoshustatusmei5"],
            :txtHosta6 => @@m_int[0]["hoshustatusmei6"],
            :txtHoshuTotal => number_with_delimiter(@@sql_hoshujoho[0]["count"]),
            :txtTotalHo1 => number_with_delimiter(@@sql_hoshujoho[0]["st1"]),
            :txtTotalHo2 => number_with_delimiter(@@sql_hoshujoho[0]["st2"]),
            :txtTotalHo3 => number_with_delimiter(@@sql_hoshujoho[0]["st3"]),
            :txtTotalHo4 => number_with_delimiter(@@sql_hoshujoho[0]["st4"]),
            :txtTotalHo5 => number_with_delimiter(@@sql_hoshujoho[0]["st5"]),
            :txtTotalHo6 => number_with_delimiter(@@sql_hoshujoho[0]["st6"]),

            :default	=> []}

        for @soeji in 0..11 do
            @kingaku_1_2 = (@@monthlist_ary[@soeji][7] == "0(" + "\u00A5" +"0)") ? '' : @@monthlist_ary[@soeji][7].sub("\u00A5",'\\')
            @kingaku_1 = (@@monthlist_ary[@soeji][8] == "0(" + "\u00A5" +"0)") ? '' : @@monthlist_ary[@soeji][8].sub("\u00A5",'\\')
            @kingaku_2 = (@@monthlist_ary[@soeji][9] == "0(" + "\u00A5" +"0)") ? '' : @@monthlist_ary[@soeji][9].sub("\u00A5",'\\')
            d1[:default] << { 	:txtMonth => @@monthlist_ary[@soeji][0].to_s + '月',
                :txtMonthKensu => @@monthlist_ary[@soeji][1].sub("\u00A5",'\\'),
                :txtMonthTen1 => @@monthlist_ary[@soeji][2],
                :txtMonthTen2 => @@monthlist_ary[@soeji][3],
                :txtMonthTen3 => @@monthlist_ary[@soeji][4],
                :txtMonthTen4 => @@monthlist_ary[@soeji][5],
                :txtMonthTen5 => @@monthlist_ary[@soeji][6],
                :txtMonthJisshi => @kingaku_1_2,
                :txtMonthYoteinai => @kingaku_1,
                :txtMonthYoteigai => @kingaku_2,
                :txtMonthNinku => @@monthlist_ary[@soeji][10]}
        end

        data << d1

        report = ThinReports::Report.create do |r|
            r.use_layout  File.join(Rails.root, 'app','views', 'monthlist', 'monthlist.tlf') do |config|

                config.list(:lstTenken) do

                    events.on :page_footer_insert do |e|
                        @sum_kingaku_1_2 = (@@sum_ary[6]== "0(" + "\u00A5" +"0)") ? '' : @@sum_ary[6].sub("\u00A5",'\\')
                        @sum_kingaku_1 = (@@sum_ary[7]== "0(" + "\u00A5" +"0)") ? '' : @@sum_ary[7].sub("\u00A5",'\\')
                        @sum_kingaku_2 = (@@sum_ary[8]== "0(" + "\u00A5" +"0)") ? '' : @@sum_ary[8].sub("\u00A5",'\\')
                        e.section.item(:txtTotalKensu).value(@@sum_ary[0].sub("\u00A5",'\\'))
                        e.section.item(:txtTotalTen1).value(@@sum_ary[1])
                        e.section.item(:txtTotalTen2).value(@@sum_ary[2])
                        e.section.item(:txtTotalTen3).value(@@sum_ary[3])
                        e.section.item(:txtTotalTen4).value(@@sum_ary[4])
                        e.section.item(:txtTotalTen5).value(@@sum_ary[5])
                        e.section.item(:txtTotalJisshi).value(@sum_kingaku_1_2)
                        e.section.item(:txtTotalYoteinai).value(@sum_kingaku_1)
                        e.section.item(:txtTotalYoteigai).value(@sum_kingaku_2)
                        e.section.item(:txtTotalNinku).value(@@sum_ary[9])
                    end
                end

            end
            data.each do |header|
                r.start_new_page

                r.page.values(:txtNendo	=> header[:txtNendo],
                :txtToday	=> header[:txtToday],
                :txtHosta1 => header[:txtHosta1],
                :txtHosta2 => header[:txtHosta2],
                :txtHosta3 => header[:txtHosta3],
                :txtHosta4 => header[:txtHosta4],
                :txtHosta5 => header[:txtHosta5],
                :txtHosta6 => header[:txtHosta6],
                :txtHoshuTotal => header[:txtHoshuTotal],
                :txtTotalHo1 => header[:txtTotalHo1],
                :txtTotalHo2 => header[:txtTotalHo2],
                :txtTotalHo3 => header[:txtTotalHo3],
                :txtTotalHo4 => header[:txtTotalHo4],
                :txtTotalHo5 => header[:txtTotalHo5],
                :txtTotalHo6 => header[:txtTotalHo6])
                r.page.list(:lstTenken).header do |h|
                    h.item(:txtTensta1).value(@@m_int[0]["tenkenstatusmei1"])
                    h.item(:txtTensta2).value(@@m_int[0]["tenkenstatusmei2"])
                    h.item(:txtTensta3).value(@@m_int[0]["tenkenstatusmei3"])
                    h.item(:txtTensta4).value(@@m_int[0]["tenkenstatusmei4"])
                    h.item(:txtTensta5).value(@@m_int[0]["tenkenstatusmei5"])
                end
                header[:default].each do |detail|
                    r.page.list(:lstTenken).add_row(detail)
                end
            end
        end
        #report.generate_file(File.join(Rails.root, 'public', @pdf_name))
        @pdf_name = CommonUtil.open_pdf(report, 'monthlist', format("%05d",session[:user_id]))
    end

end
