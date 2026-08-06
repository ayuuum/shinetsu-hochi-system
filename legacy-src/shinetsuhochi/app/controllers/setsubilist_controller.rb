class SetsubilistController < ApplicationController
    #require 'thinreports'
    include ActionView::Helpers::NumberHelper
    include ThinReports::Generator::PDF::Graphics
    before_action :mainte_check
    before_action :login_check
    before_action :dialog_init
    def index
        @@global_error = 0
        @error = 0
        #検索結果件数
        @@count_u = 0
        #ひとまず全部読み込み最終レコードの情報を取得
        @m_kind_select = MInit.all

        #現在年度を取得
        @genzai_nendo = CommonUtil.konnendo

        @m_tenken_array = Array.new(4)
        for num in 0..3 do
            @m_tenken_array[num] = (@genzai_nendo - 2 + num).to_s + '年度'
        end

        @kaishi_m = CommonUtil.kaishiM

        @m_checkpeople_array = Hash.new()

        @m_checkpeople_array.store('全月','-1')
        for num in 0..11 do
            @m_checkpeople_array.store(((@kaishi_m + num - 1) % 12 + 1).to_s + '月', ((@kaishi_m + num - 1) % 12 + 1).to_s)
        end
        @default_n = (CommonUtil.konnendo).to_s+ '年度' #楊健 2014-11-14(41-53番対応する)
		 #楊健 2016-3-4
        @m_init = MInit.all
        @@kaishiM = @m_init[0]["nendokaishiM"]
		 #楊健 2016-3-4 end

        render :layout => 'menu'
    end

    def commit
        #押されたボタンの種類
        @commit_kind = params[:commit]
        #----------#
        # 選択処理 #
        #----------#
        if @commit_kind == '検索' then
            #セレクトボックス作成で付けた'年度'を文字列から削除
            @@nendo = params[:nm_cmb_SBL_Nendo].delete('年度')
            @@tsuki = params[:nm_cmb_SBL_Tsuki]

            @sql_count = 0

            if @@nendo == '' then
                @error_message = MESSAGE_55
            else
                @@sql_str_array = Array.new(10){ Hash.new() }
                #もし月の指定があればSQLの「TCi.tenkenyoteiM1 = " + @@tsuki + " AND 」の条件を加える
                @kaishi_m = CommonUtil.kaishiM

                #　終了月（開始月ー１）を文字型２桁でセット
                @s_kaishi_m = format("%02d",@kaishi_m)
                @s_shuryo_m = format("%02d",(@kaishi_m + 11).modulo(13) +  (@kaishi_m + 11).div(13))
                @kuriage  = (@kaishi_m + 11).div(13)
                @shuryo_nendo = @@nendo.to_i + @kuriage
                if   @@tsuki == '-1' then
                    @sql_str = ''
                    @sql_str2 = "DATE_FORMAT(TCt.tenkenkanryoYMD,'%Y%m') BETWEEN #{@@nendo}#{@s_kaishi_m} AND #{@shuryo_nendo}#{@s_shuryo_m}"
                else
                    @sql_str = 'TCi.tenkenyoteiM1 = ' + @@tsuki.to_s + ' AND'
						#楊健 2016-3-4
						@zen = Array.new(12)
						for ind in 1..12 do
            				@zen[ind - 1] = (ind < @@kaishiM) ? 1 : 0
        				end
						
                    @sql_str2 = "YEAR(TCt.tenkenkanryoYMD) = #{@@nendo}+#{@zen[@@tsuki.to_i-1]} AND MONTH(TCt.tenkenkanryoYMD) = #{@@tsuki}"
					   #楊健 2016-3-4
                end

                @sql_setsubi = ActiveRecord::Base.connection.
                select("
					SELECT 
						MKi.shubetu AS shubetu_check
						, MKi.shubetumei
						, COALESCE(A.cnt_check,0) AS cnt_check
						, COALESCE(A.sum_check,0) AS sum_check
						, COALESCE(B.cnt_chrec,0) AS cnt_chrec
						, COALESCE(B.sum_chrec,0) AS sum_chrec
					FROM
						m_kinds AS MKi
						LEFT OUTER JOIN (
							SELECT
								MKi.shubetu								
								, COUNT(TCi.bukenCode) AS cnt_check
								, SUM(TCi.keiyakukingaku1) AS sum_check
							FROM
								m_kinds AS MKi
								, t_check_infos AS TCi
							WHERE
								TCi.nendo = " + @@nendo.to_s + "
								AND #{@sql_str}
								TCi.setubishubetuKbn = MKi.shubetuKbn
								AND TCi.setubishubetu = MKi.shubetu
							GROUP BY
								TCi.setubishubetu
						) A
							ON MKi.shubetu = A.shubetu
						LEFT OUTER JOIN (
							SELECT
								MKi.shubetu
								, COUNT(TCt.bukenCode) AS cnt_chrec
								, SUM(TCt.keiyakukingaku) AS sum_chrec
							FROM
								m_kinds AS MKi
								, t_chktrackrec_infos AS TCt
							WHERE
								#{@sql_str2}
								AND TCt.setubishubetuKbn = MKi.shubetuKbn
								AND TCt.setubishubetu = MKi.shubetu
							GROUP BY
								TCt.setubishubetu
						) B
							ON MKi.shubetu = B.shubetu
					WHERE
						MKi.shubetuKbn = #{MKIND_KBN_SETSUBISHUBETU}
					ORDER BY
						shubetu_check ASC ")

                @sql_tenken = ActiveRecord::Base.connection.
                select("
					SELECT
						MKi.shubetu AS shubetu_check
						, MKi.shubetumei
						, COALESCE(A.cnt_check,0) AS cnt_check
						, COALESCE(A.sum_check,0) AS sum_check
						, COALESCE(B.cnt_chrec,0) AS cnt_chrec
						, COALESCE(B.sum_chrec,0) AS sum_chrec
					FROM
						m_kinds AS MKi
						LEFT OUTER JOIN (
							SELECT
								MKi.shubetu
								, COUNT(TCi.bukenCode) AS cnt_check
								, SUM(TCi.keiyakukingaku1) AS sum_check
							FROM
								m_kinds AS MKi
								, t_check_infos AS TCi
							WHERE
								TCi.nendo = " + @@nendo.to_s + "
								AND #{@sql_str}
                				TCi.tenkenshubetuKbn = MKi.shubetuKbn
								AND TCi.tenkenshubetu = MKi.shubetu
							GROUP BY
								TCi.tenkenshubetu
						) A
							ON MKi.shubetu = A.shubetu
						LEFT OUTER JOIN (
							SELECT
								MKi.shubetu
								, COUNT(TCt.bukenCode) AS cnt_chrec
								, SUM(TCt.keiyakukingaku) AS sum_chrec
							FROM 
								m_kinds AS MKi
								, t_chktrackrec_infos AS TCt
							WHERE
								#{@sql_str2}
								AND TCt.tenkenshubetuKbn = MKi.shubetuKbn
								AND TCt.tenkenshubetu = MKi.shubetu
							GROUP BY
								TCt.tenkenshubetu
						) B
							ON MKi.shubetu = B.shubetu
					WHERE
						MKi.shubetuKbn = #{MKIND_KBN_TENKENSHUBETU}
					ORDER BY
						shubetu_check ASC ")
                #多い方の件数を設定
                @@count_u = @sql_setsubi.count >= @sql_tenken.count ? @sql_setsubi.count : @sql_tenken.count
                #setsubilist.js.erbに受け渡す
                @sql_count = @@count_u

                if @sql_count > 0 then
                    @mae_tenkenshubetu = 0
                    @error = 1
                    #表のhtmlタグ
                    @html_string = ''
                    #点検種別表のインデックス
                    @soeji = 0
                    #設備種別表のインデックス
                    @soeji_s = -1
                    #設備種別、点検種別　それぞれ４種の合計
                    @@total_cnt = Array.new(8,0)

                    while @sql_tenken.count > @soeji do
                        #どちらか表示する件数があれば表を作成
                        #設備種別表(左側)
                        if GetSetsubishubetu[@mae_tenkenshubetu] == GetSetsubishubetu[@sql_tenken[@soeji]["shubetu_check"]] then
                            #点検種別の十の位が上の行と同じ場合、（同じ設備種別の場合）設備種別の行は：設備種別名は上と同じ、それ以外は０を表示
                            @kensu_yotei = '0'
                            @hoyudaka_yotei = '0'
                            @kensu_jisseki = '0'
                            @hoyudaka_jisseki = '0'
                        else
                            @soeji_s += 1
                            #設備種別が変わる(新しい設備種別)行
                            @kensu_yotei = number_with_delimiter(@sql_setsubi[@soeji_s]["cnt_check"]).to_s
                            @hoyudaka_yotei = number_with_delimiter(@sql_setsubi[@soeji_s]["sum_check"].round).to_s
                            @kensu_jisseki = number_with_delimiter(@sql_setsubi[@soeji_s]["cnt_chrec"]).to_s
                            @hoyudaka_jisseki = number_with_delimiter(@sql_setsubi[@soeji_s]["sum_chrec"].round).to_s
                            @@total_cnt[0] += @sql_setsubi[@soeji_s]["cnt_check"]
                            @@total_cnt[1] += @sql_setsubi[@soeji_s]["sum_check"]
                            @@total_cnt[2] += @sql_setsubi[@soeji_s]["cnt_chrec"]
                            @@total_cnt[3] += @sql_setsubi[@soeji_s]["sum_chrec"]
                        end
                        @mae_tenkenshubetu = @sql_tenken[@soeji]["shubetu_check"]
=begin
						@html_string += '<div class="kugiri"></div>' \
						+ '<textarea class="sbl_body01" readonly>' + @sql_setsubi[@soeji_s]["shubetumei"] + '</textarea>' \
						+ '<textarea class="sbl_body02_2" readonly>' + @kensu_yotei + "</textarea>" \
						+ '<textarea class="sbl_body02_3" readonly>' + @hoyudaka_yotei  + '</textarea>' \
						+ '<textarea class="sbl_body02_2" readonly>' + @kensu_jisseki + '</textarea>' \
						+ '<textarea class="sbl_body02_3" readonly>' + @hoyudaka_jisseki + '</textarea>'
=end
                        @html_string += '<div class="kugiri"></div>' \
                        + '<input type="text" class="sbl_body01" value="' + @sql_setsubi[@soeji_s]["shubetumei"] +'" readonly="true" tabindex="24">' \
                        + '<input type="text" class="sbl_body02_2" value="' + @kensu_yotei +'" readonly="true" tabindex="24">' \
                        + '<input type="text" class="sbl_body02_3" value="' + @hoyudaka_yotei +'" readonly="true" tabindex="24">' \
                        + '<input type="text" class="sbl_body02_2" value="' + @kensu_jisseki +'" readonly="true" tabindex="24">' \
                        + '<input type="text" class="sbl_body02_3" value="' + @hoyudaka_jisseki +'" readonly="true" tabindex="24">'
                        #帳票用の配列ハッシュに格納
                        @@sql_str_array[@soeji].store("setsubishubetumei",@sql_setsubi[@soeji_s]["shubetumei"])
                        @@sql_str_array[@soeji].store("setsubi_cnt_check",@kensu_yotei)
                        @@sql_str_array[@soeji].store("setsubi_sum_check", '\\' + @hoyudaka_yotei)
                        @@sql_str_array[@soeji].store("setsubi_cnt_chrec",@kensu_jisseki)
                        @@sql_str_array[@soeji].store("setsubi_sum_chrec", '\\' + @hoyudaka_jisseki)

                        #点検種別表(右側)
=begin
						@html_string +=
			  			'<textarea class="sbl_body03" readonly>' + @sql_tenken[@soeji]["shubetumei"] + '</textarea>' \
						+ '<textarea class="sbl_body02_2" readonly>' + number_with_delimiter(@sql_tenken[@soeji]["cnt_check"]) + '</textarea>' \
						+ '<textarea class="sbl_body02_3" readonly>' + number_with_delimiter(@sql_tenken[@soeji]["sum_check"].round) + '</textarea>' \
						+ '<textarea class="sbl_body02_2" readonly>' + number_with_delimiter(@sql_tenken[@soeji]["cnt_chrec"]) + '</textarea>' \
						+ '<textarea class="sbl_body02_3" readonly>' + number_with_delimiter(@sql_tenken[@soeji]["sum_chrec"].round) + '</textarea>'
=end
                        @html_string +=
                        '<input type="text" class="sbl_body03" value="' +@sql_tenken[@soeji]["shubetumei"] +'" readonly="true" tabindex="24">' \
                        +'<input type="text" class="sbl_body02_2" value="' +number_with_delimiter(@sql_tenken[@soeji]["cnt_check"]) +'" readonly="true" tabindex="24">' \
                        +'<input type="text" class="sbl_body02_3" value="' +number_with_delimiter(@sql_tenken[@soeji]["sum_check"].round) +'" readonly="true" tabindex="24">' \
                        +'<input type="text" class="sbl_body02_2" value="' +number_with_delimiter(@sql_tenken[@soeji]["cnt_chrec"]) +'" readonly="true" tabindex="24">' \
                        +'<input type="text" class="sbl_body02_3" value="' +number_with_delimiter(@sql_tenken[@soeji]["sum_chrec"].round) +'" readonly="true" tabindex="24">'

                        @@total_cnt[4] += @sql_tenken[@soeji]["cnt_check"]
                        @@total_cnt[5] += @sql_tenken[@soeji]["sum_check"]
                        @@total_cnt[6] += @sql_tenken[@soeji]["cnt_chrec"]
                        @@total_cnt[7] += @sql_tenken[@soeji]["sum_chrec"]

                        #帳票用の配列ハッシュに格納
                        @@sql_str_array[@soeji].store("tenkenshubetumei", @sql_tenken[@soeji]["shubetumei"])
                        @@sql_str_array[@soeji].store("tenken_cnt_check",number_with_delimiter(@sql_tenken[@soeji]["cnt_check"].to_s))
                        @@sql_str_array[@soeji].store("tenken_sum_check", '\\' + number_with_delimiter(@sql_tenken[@soeji]["sum_check"].round.to_s))
                        @@sql_str_array[@soeji].store("tenken_cnt_chrec",number_with_delimiter(@sql_tenken[@soeji]["cnt_chrec"].to_s))
                        @@sql_str_array[@soeji].store("tenken_sum_chrec", '\\' + number_with_delimiter(@sql_tenken[@soeji]["sum_chrec"].round.to_s))

                        @soeji += 1
                        #while終わり
                    end
                    #合計表示
=begin
					@html_string += '<div class="kugiri"></div><textarea class="sbl_footer01">合計</textarea>' \
						+ '<textarea class="sbl_footer02_2" readonly>' + number_with_delimiter(@@total_cnt[0]) + '</textarea>' \
						+ '<textarea class="sbl_footer02_3" readonly>' + number_with_delimiter(@@total_cnt[1].round) + '</textarea>' \
						+ '<textarea class="sbl_footer02_2" readonly>' + number_with_delimiter(@@total_cnt[2]) + '</textarea>' \
						+ '<textarea class="sbl_footer02_3" readonly>' + number_with_delimiter(@@total_cnt[3].round) + '</textarea>' \
						+ '<textarea class="sbl_footer03"></textarea>' \
						+ '<textarea class="sbl_footer02_2" readonly>' + number_with_delimiter(@@total_cnt[4]) + '</textarea>' \
						+ '<textarea class="sbl_footer02_3" readonly>' + number_with_delimiter(@@total_cnt[5].round) + '</textarea>' \
						+ '<textarea class="sbl_footer02_2" readonly>' + number_with_delimiter(@@total_cnt[6]) + '</textarea>' \
						+ '<textarea class="sbl_footer02_3" readonly>' + number_with_delimiter(@@total_cnt[7].round) + '</textarea>'
=end
                    @html_string += '<div class="kugiri"></div><input type="text" class="sbl_footer01" readonly="true" value="合計" >' \
                    + '<input type="text" class="sbl_footer02_2" readonly="true" value="' + number_with_delimiter(@@total_cnt[0]) + '" tabindex="25">' \
                    + '<input type="text" class="sbl_footer02_3" readonly="true" value="' + number_with_delimiter(@@total_cnt[1].round) + '" tabindex="25">' \
                    + '<input type="text" class="sbl_footer02_2" readonly="true" value="' + number_with_delimiter(@@total_cnt[2]) + '">' \
                    + '<input type="text" class="sbl_footer02_3" readonly="true" value="' + number_with_delimiter(@@total_cnt[3].round) + '" tabindex="25">' \
                    + '<input type="text" class="sbl_footer03" readonly="true">' \
                    + '<input type="text" class="sbl_footer02_2" readonly="true" value="' + number_with_delimiter(@@total_cnt[4]) + '" tabindex="25">' \
                    + '<input type="text" class="sbl_footer02_3" readonly="true" value="' + number_with_delimiter(@@total_cnt[5].round) + '" tabindex="25">' \
                    + '<input type="text" class="sbl_footer02_2" readonly="true" value="' + number_with_delimiter(@@total_cnt[6]) + '" tabindex="25">' \
                    + '<input type="text" class="sbl_footer02_3" readonly="true" value="' + number_with_delimiter(@@total_cnt[7].round) + '" tabindex="25">'
                else
                    #検索結果が１件も無いとき
                end
            end
            #	render :layout => 'menu'
            #-------------#
            # 帳票出力処理 #
            #-------------#
        elsif @commit_kind == '帳票出力' then

            #検索結果が１件も無いとき
            if 	@@count_u == 0 then
                @error_message = MESSAGE_56
            else
                @soeji = 0
                #設備種別、点検種別　それぞれ４種の合計

                @tsuki_hyouji = (@@tsuki == '-1') ? '全月' : @@tsuki.to_s + '月'
                logger.debug("@@tsuki" + @@tsuki.to_s)
                logger.debug("@tsuki_hyouji" + @tsuki_hyouji)
                #帳票１ページあたりの表示件数
                @page_max_kensu =	24
                #設備種別、点検種別　それぞれ４種の合計
                total_array = Array.new(8,'')

                total_array[0] = number_with_delimiter(@@total_cnt[0])
                total_array[1] =	'\\' + number_with_delimiter(@@total_cnt[1].round)
                total_array[2] =	number_with_delimiter(@@total_cnt[2])
                total_array[3] =	'\\' + number_with_delimiter(@@total_cnt[3].round)
                total_array[4] =	number_with_delimiter(@@total_cnt[4])
                total_array[5] ='\\' + number_with_delimiter(@@total_cnt[5].round)
                total_array[6] =	number_with_delimiter(@@total_cnt[6])
                total_array[7] =	'\\' + number_with_delimiter(@@total_cnt[7].round)

                @total_page = (@@count_u.to_f / @page_max_kensu.to_f).ceil
                t = Time.now
                @t_date = t.year.to_s + '年' +  t.month.to_s + '月' + t.day.to_s + '日'

                data = []
                d1 = {	:text_nendo	=> @@nendo,
                    :text_tsuki	=> @tsuki_hyouji,
                    :text_date		=> @t_date,
                    :default		=> []}

                for @soeji in 0..@@count_u - 1 do
                    d1[:default] << {	:setsubishubetumei => @@sql_str_array[@soeji]["setsubishubetumei"],
                        :setsubi_cnt_check => @@sql_str_array[@soeji]["setsubi_cnt_check"],
                        :setsubi_sum_check => @@sql_str_array[@soeji]["setsubi_sum_check"],
                        :setsubi_cnt_chrec => @@sql_str_array[@soeji]["setsubi_cnt_chrec"],
                        :setsubi_sum_chrec => @@sql_str_array[@soeji]["setsubi_sum_chrec"],
                        :tenkenshubetumei  => @@sql_str_array[@soeji]["tenkenshubetumei"],
                        :tantou_cnt_check  => @@sql_str_array[@soeji]["tenken_cnt_check"],
                        :tantou_sum_check  => @@sql_str_array[@soeji]["tenken_sum_check"],
                        :tantou_cnt_chrec  => @@sql_str_array[@soeji]["tenken_cnt_chrec"],
                        :tantou_sum_chrec  => @@sql_str_array[@soeji]["tenken_sum_chrec"]}
                end

                data << d1

                report = ThinReports::Report.create do |r|
                    r.use_layout  File.join(Rails.root, 'app','views', 'setsubilist', 'setsubilist.tlf') do |config|

                        r.events.on :page_create do |e|
                            e.page.item(:text_page).value(e.page.no.to_s + '/' +  @total_page.to_s + 'ページ')
                        end

                        config.list(:default) do
                            use_stores	:text_nendo => @@nendo,
                            :text_tsuki => @tsuki_hyouji,
                            :text_date => @t_date

                            events.on :footer_insert do |e|
                                e.section.item(:setsubi_cnt_check_total).value(total_array[0])
                                e.section.item(:setsubi_sum_check_total).value(total_array[1])
                                e.section.item(:setsubi_cnt_chrec_total).value(total_array[2])
                                e.section.item(:setsubi_sum_chrec_total).value(total_array[3])
                                e.section.item(:tantou_cnt_check_total).value(total_array[4])
                                e.section.item(:tantou_sum_check_total).value(total_array[5])
                                e.section.item(:tantou_cnt_chrec_total).value(total_array[6])
                                e.section.item(:tantou_sum_chrec_total).value(total_array[7])
                            end

                        end
                    end

                    data.each do |header|
                        r.start_new_page

                        r.page.values(:text_tsuki => header[:text_tsuki],
                        :text_nendo => header[:text_nendo],
                        :text_date => header[:text_date])
                        header[:default].each do |detail|
                            r.page.list(:default).add_row(detail)
                        end
                    end
                end
                #report.generate_file(File.join(Rails.root, 'public', @pdf_name))
                @pdf_name = CommonUtil.open_pdf(report, 'setsubilist', format("%05d",session[:user_id]))
                @error = 2
                #帳票出力終了

            end
        end

    end

end
