class BukenJohoShosaiController < ApplicationController
    include ActionView::Helpers::NumberHelper
    before_action :mainte_check
    before_action :login_check
    before_action :dialog_init
    def index
        #物件コードは数値なので :first, :secondが数値以外なら表示無効
        if params[:first] == nil or !(params[:first].to_s =~ /^[0-9]+$/ ) or params[:second] == nil or !(params[:second].to_s =~ /^[0-9]+$/ ) then
            redirect_to :controller => buken_kensaku
            return nil
        else
            @@bukenCode = params[:first].to_i
            @@hachushaCode = params[:second].to_i
            #現在年度を取得
            @@genzai_nendo = CommonUtil.konnendo
            @genzai_nendo_str = @@genzai_nendo.to_s + '年度'

            #--------------------------#
            #発注者情報をフォームにセット#
            #--------------------------#
            @hachusha_joho = MOrderingpatry.where(:hachushaCode => @@hachushaCode)
            @@hachusha_list = @hachusha_joho
            @hachusha_kensaku_code = 0

            @hachusha_joho.each do |hachusha_list|
                @hachushamei = hachusha_list.hachushamei.to_s
                @hachuTandoshamei = hachusha_list.hachuTandoshamei.to_s
                @hachuPostno = hachusha_list.hachuPostno.to_s
                @hachuAdrs = hachusha_list.hachuAdrs.to_s
                @hachuTelno = hachusha_list.hachuTelno.to_s
                @hachuFaxno = hachusha_list.hachuFaxno.to_s
            end
            #-------------------------#
            #物件情報をフォームにセット#
            #-------------------------#
            @buken_joho = CommonUtil.buken_joho_str(@@bukenCode)
            @@buken_list = @buken_joho

            @buken_joho.each do |buken_list|
                @bukenmei = buken_list["bukenmei"].to_s
                @bukenTandoshamei = buken_list["bukenTandoshamei"].to_s
                @bukenPostno = buken_list["bukenPostno"].to_s
                @bukenAdrs = buken_list["bukenAdrs"].to_s
                @bukenTelno = buken_list["bukenTelno"].to_s
                @bukenFaxno = buken_list["bukenFaxno"].to_s
                @memo1 = buken_list["memo1"].to_s
                @memo2 = buken_list["memo2"].to_s
                @tenkenkaishi_data = buken_list["tenkenkaishiY"].to_s
                @tenken_data = buken_list["tenkenKbn"].to_s
                @seikyuhouhou_data = buken_list["seikyuhouhou"].to_s
            end

            #請求方法セレクトボックス
            @m_kind_s = MKind.where(:shubetuKbn => MKIND_KBN_SEIKYU)
            @m_kind_s.each do |list|

                if list.shubetu.to_s == @seikyuhouhou_data then
                    @seikyu_houhou = list.shubetumei
                    break
                end
            end

            @m_kind_s = MKind.where(:shubetuKbn => MKIND_KBN_TENKEN)
            @m_kind_s.each do |list|

                if list.shubetu.to_s == @tenken_data then
                    @tenken_Kbn = list.shubetumei
                    @@tenken_Kbn = list.shubetumei
                    break
                end
            end

            #点検情報(外注費合計) 契約金額、外注費の年度別合計
            @tenken_joho = TCheckInfo.where(:bukenCode => @@bukenCode).group(:nendo).select('nendo, SUM(COALESCE( keiyakukingaku1, 0 ) ) AS SUM_1, SUM( COALESCE( gaichuhi1, 0 ) + COALESCE( gaichuhi2, 0 ) + COALESCE( gaichuhi3, 0 ) + COALESCE( gaichuhi4, 0 ) + COALESCE( gaichuhi5, 0 ) + COALESCE( gaichuhi6, 0 ) + COALESCE( gaichuhi7, 0 ) + COALESCE( gaichuhi8, 0 ) + COALESCE( gaichuhi9, 0 ) + COALESCE( gaichuhi10, 0 ) ) AS SUM_2')

            @@keiyakukingaku_array =  Hash.new()

            #契約金額が０ならカッコ「（外注費）」は表示しない
            @tenken_joho.each do |keiyakukingaku|
                if keiyakukingaku.SUM_2 == 0 then
                    @@keiyakukingaku_array.store(keiyakukingaku.nendo, '&yen;' + number_with_delimiter(keiyakukingaku.SUM_1.round))
                else
                    @@keiyakukingaku_array.store(keiyakukingaku.nendo, '&yen;' + number_with_delimiter(keiyakukingaku.SUM_1.round) + '(' + '&yen;' + number_with_delimiter(keiyakukingaku.SUM_2.round) + ')')
                end
            end

            #上の行の年度と担当者コード初期化
            @zenkai_nendo = ''
            @tenkenjoho_html = ''
            #点検情報 A.nendo, A.shubetumei, A.nenkantenkenkaisu, A.tenkenyoteiM1, A.keiyakukingaku1, A.tenkentantoshamei,  A.gaichuhi tenkentantoshaCode
            @@chktrackrec_str = chktrackrec_str(@@bukenCode, @@genzai_nendo)
            @@chktrackrec_str.each do |tenkenjoho|
                #上の行の年度が等しければ年度、契約費合計は表示しない
                if @zenkai_nendo == tenkenjoho["nendo"].to_s then
                    @nendo_str = ''
                    @keiyakukingaku = ''
                else
                    @nendo_str = tenkenjoho["nendo"].to_s + '年度'
                    @keiyakukingaku = @@keiyakukingaku_array[tenkenjoho["nendo"]]
                end
                @str = (tenkenjoho["gaichuhi"].round == 0)? '-' : '&yen;' + number_with_delimiter(tenkenjoho["gaichuhi"].round)
                #メイン担当者 = 点検担当者ならば★印を付ける
                @main_mark = (tenkenjoho["maintantosha"] == tenkenjoho["tenkentantoshaCode"])? '★' : ''
                @shubetumei = (tenkenjoho["shubetu"] == MKIND_TENKENSHUBETU_BOUKATAISHOBUTU) ?tenkenjoho["shubetumei"].to_s + '(' + tenkenjoho["boukataishobututenkenkaisu"].to_s + '回目)': tenkenjoho["shubetumei"].to_s
                #現在年度はbgcolor薄い黄色のstyle適用
                @bg_style = (@@genzai_nendo == tenkenjoho["nendo"])? 'style="background-color:#f0f080;"' : ''
                #tenkenjoho["nenkantenkenkaisu"].to_s
                @kaisu = '1回'
				  @tenkenyotei = tenkenjoho["tenkenyoteiM1"].to_s + '月'
				  @keiyakukingakuM = '&yen;' + number_with_delimiter(tenkenjoho["keiyakukingaku1"].round)
				  if tenkenjoho["maintantosha"] != tenkenjoho["tenkentantoshaCode"] then
				  	  @shubetumei = ''
   					  @kaisu = ''
				     @tenkenyotei = ''
				     @keiyakukingaku = ''
					  @keiyakukingakuM = ''
                end
                #表のhtmlタグをセット
                @tenkenjoho_html += '<div class="kugiri"></div><input type="text" class="bjs_body01" ' + @bg_style +' readonly="true" value="' + @nendo_str + '">' + \
                '<input type="text" class="bjs_body02" ' + @bg_style +' readonly="true" value="' + @keiyakukingaku + '">' + \
                '<input type="text" class="bjs_body03" ' + @bg_style +' readonly="true" value="' + @shubetumei + '">'+ \
                '<input type="text" class="bjs_body04" ' + @bg_style +' readonly="true" value="' + @kaisu + '">'+ \
                '<div class="bjs_body05">' + \
                '<input type="text" class="bjs_body05_2_l" ' + @bg_style +' readonly="true" value="' + @tenkenyotei + '">'+ \
                '<input type="text" class="bjs_body05_2" ' + @bg_style +' readonly="true" value="' + @keiyakukingakuM + '">'+ \
                '<input type="text" class="bjs_body05_3_l" ' + @bg_style +' readonly="true" value="' + @main_mark + tenkenjoho["tenkentantoshamei"].to_s.gsub(Str_pattern1,ESCAPE_HTML) + '">'+ \
                '<input type="text" class="bjs_body05_2" ' + @bg_style +' readonly="true" value="' + @str +  '"></div>'

                #年度と担当者コード保存
                @zenkai_nendo = tenkenjoho["nendo"].to_s
            end

            #上の行の年度と担当者コード初期化
            @zenkai_nendo = ''
            @zenkai_tantoshaCode = ''
            @tenkenjiseki_html = ''
            #赤字以外のステータス名を取得
            @@kuroji_status = CommonUtil.kuroji_statusmei.to_s
            @@kuroji_status_h1 = CommonUtil.kuroji_statusmei_hoshu_1.to_s
            @@kuroji_status_h2 = CommonUtil.kuroji_statusmei_hoshu_2.to_s
            #点検実績/補修情報表
            @@chktrackrec_hoshu_str = chktrackrec_hoshu_str(@@bukenCode, @@genzai_nendo)
            @@chktrackrec_hoshu_str.each do |tenkenjiseki|
                #htmlフォームに表示するのは3年分＋来年度
                if (@@genzai_nendo - 2 == tenkenjiseki["nendo"] or  @@genzai_nendo - 1 == tenkenjiseki["nendo"] or @@genzai_nendo == tenkenjiseki["nendo"] or @@genzai_nendo + 1 == tenkenjiseki["nendo"]) then

                    @jinko = (tenkenjiseki["jinko"].to_s == '' or tenkenjiseki["jinko"].to_s == '0.0')? '' : tenkenjiseki["jinko"].to_s + '人工'
                    #ステータス名が@kuroji_statusならば黒字、それ以外は赤字
                    @str = (tenkenjiseki["t_status"] == @@kuroji_status)? 'bjs_body10' : 'bjs_body10_r'
                    @str_h = (tenkenjiseki["h_status"] == @@kuroji_status_h1 or tenkenjiseki["h_status"] == @@kuroji_status_h2)? 'bjs_body10' : 'bjs_body10_r'
                    @shubetumei_j = (tenkenjiseki["tenkenshubetu"] == MKIND_TENKENSHUBETU_BOUKATAISHOBUTU) ?tenkenjiseki["shubetumei"].to_s + '(' + tenkenjiseki["boukataishobututenkenkaisu"].to_s + '回目)': tenkenjiseki["shubetumei"].to_s
                    #現在年度はbgcolor薄い黄色のstyle適用
                    @bg_style = (@@genzai_nendo == tenkenjiseki["nendo"])? 'style="background-color:#f0f080;"' : ''
                    #表のhtmlタグをセット
                    @tenkenjiseki_html += '<div class="kugiri"></div><input type="text" class="bjs_body06" ' + @bg_style +' readonly="true" value="' + tenkenjiseki["nendo"].to_s + '年度' + '">' + \
                    '<input type="text" class="bjs_body07" ' + @bg_style +' readonly="true" value="' + @shubetumei_j + '">' + \
                    '<input type="text" class="bjs_body08" ' + @bg_style +' readonly="true" value="' + tenkenjiseki["tenkentantoshamei"].to_s.gsub(Str_pattern1,ESCAPE_HTML) + '">' + \
                    '<input type="text" class="bjs_body09_c" ' + @bg_style +' readonly="true" value="' + tenkenjiseki["tenkenkanryoYMD"].to_s.gsub('-','/') + '">' + \
                    '<input type="text" class="bjs_body09" ' + @bg_style +' readonly="true" value="' + @jinko + '">' + \
                    '<input type="text" class="' + @str + '" ' + @bg_style +' readonly="true" value="' + tenkenjiseki["t_status"].to_s + '">' + \
                    '<input type="text" class="' + @str_h + '" ' + @bg_style +' readonly="true" value="' + tenkenjiseki["h_status"].to_s + '">' + \
                    '<input type="text" class="bjs_body11" ' + @bg_style +' readonly="true" value="' + tenkenjiseki["biko"].to_s.gsub(Str_pattern1,ESCAPE_HTML) + '">'
                    #年度と担当者コード保存
                    @zenkai_nendo = tenkenjiseki["nendo"].to_s
                    @zenkai_tantoshaCode = tenkenjiseki["tenkentantoshaCode"].to_s
                end
            end

        end
        render :layout => 'menu'

    end

    def commit

        #押されたボタンの種類
        @commit_kind = params[:commit]
        if @commit_kind == '帳票出力(実績補修)' then
            #帳票出力関数hohyo_tenken_hoshu
            chohyo_tenken_hoshu
        elsif @commit_kind == '帳票出力(点検情報)' then
            #帳票出力関数chohyo_buken_sansho
            chohyo_buken_sansho
        elsif @commit_kind == '補修履歴' then
            @error = 3
            @query_str = 'hoshurireki/index/' + @@bukenCode.to_s + '/' + @@hachushaCode.to_s
        elsif @commit_kind == '物件変更／削除へ' then
            @error = 1
            @query_str = 'buken_henko_sakujo/index/' + @@bukenCode.to_s + '/' + @@hachushaCode.to_s
        elsif @commit_kind == '検索一覧へ戻る' then
            @error = 1
            @query_str = 'hachulist'
        elsif @commit_kind == '物件検索へ戻る' then
            @error = 1
            @query_str = 'buken_kensaku'
        end

    end

    #帳票出力(実績補修)
    def chohyo_tenken_hoshu

        #帳票１ページあたりの表示件数
        @page_max_kensu =	14

        @count_u = @@chktrackrec_hoshu_str.count

        @total_page = (@count_u.to_f / @page_max_kensu.to_f).ceil
        t = Time.now
        @t_date = t.year.to_s + '年' +  t.month.to_s + '月' + t.day.to_s + '日'

        #header　実績補修・点検情報　共通部分　
        data = []
        @postno_h = (@@hachusha_list[0]["hachuPostno"].blank?) ? '' :
        @@hachusha_list[0]["hachuPostno"].to_s.slice(0,3) + '-' + @@hachusha_list[0]["hachuPostno"].to_s.slice(3,4)

        @postno_b = (@@buken_list[0]["bukenPostno"].blank?) ? '' :
        @@buken_list[0]["bukenPostno"].to_s.slice(0,3) + '-' + @@buken_list[0]["bukenPostno"].to_s.slice(3,4)

        @tenkenkaishi = @@buken_list[0]["tenkenkaishiY"].to_s + '年度'
        #請求方法セレクトボックス
        @m_kind_s = MKind.where(:shubetuKbn => MKIND_KBN_SEIKYU)
        @m_kind_s.each do |list|
            if list.shubetu == @@buken_list[0]["seikyuhouhou"] then
                @seikyu_houhou = list.shubetumei
                break
            end
        end

        d1 = {	:text_date		=> @t_date,
            :text_hachushamei => @@hachusha_list[0]["hachushamei"],
            :text_hachuPostno => @postno_h,
            :text_hachuAdrs => @@hachusha_list[0]["hachuAdrs"],
            :text_hachuTelno => @@hachusha_list[0]["hachuTelno"],
            :text_hachuFaxno => @@hachusha_list[0]["hachuFaxno"],
            :text_hachuTantoshamei => @@hachusha_list[0]["hachuTandoshamei"],
            :text_tenkenkaishiY => @tenkenkaishi,
            :text_tenkenKbn => @@tenken_Kbn,
            :text_memo1 => @@buken_list[0]["memo1"],
            :text_memo2 => @@buken_list[0]["memo2"],
            :text_bukenmei => @@buken_list[0]["bukenmei"],
            :text_bukenPostno => @postno_b,
            :text_bukenAdrs => @@buken_list[0]["bukenAdrs"],
            :text_bukenTelno => @@buken_list[0]["bukenTelno"],
            :text_bukenFaxno => @@buken_list[0]["bukenFaxno"],
            :text_bukenTantoshamei => @@buken_list[0]["bukenTandoshamei"],
            :text_seikyuhouhou => @seikyu_houhou,
            :default		=> []}

        for @soeji in 0..@count_u - 1 do
            @shubetumei = (@@chktrackrec_hoshu_str[@soeji]["tenkenshubetu"] == MKIND_TENKENSHUBETU_BOUKATAISHOBUTU) ?
            @@chktrackrec_hoshu_str[@soeji]["shubetumei"].to_s + '(' + @@chktrackrec_hoshu_str[@soeji]["boukataishobututenkenkaisu"].to_s + '回目)' 	: @@chktrackrec_hoshu_str[@soeji]["shubetumei"].to_s
            d1[:default] << {	:text_nendo => @@chktrackrec_hoshu_str[@soeji]["nendo"],
                :text_tenkenshubetu => @shubetumei,
                :text_tenkentantoshamei => @@chktrackrec_hoshu_str[@soeji]["tenkentantoshamei"],
                :text_tenkenjishibi => @@chktrackrec_hoshu_str[@soeji]["tenkenkanryoYMD"].to_s.gsub("-","/"),
                :text_jinko => @@chktrackrec_hoshu_str[@soeji]["jinko"],
                :text_t_status  => @@chktrackrec_hoshu_str[@soeji]["t_status"],
                :text_h_status  => @@chktrackrec_hoshu_str[@soeji]["h_status"],
                :text_biko  => @@chktrackrec_hoshu_str[@soeji]["biko"]}
        end

        data << d1

        report = ThinReports::Report.create do |r|
            r.use_layout  File.join(Rails.root, 'app','views', 'buken_joho_shosai', 'tenken_hoshu.tlf') do |config|

                r.events.on :page_create do |e|
                    e.page.item(:text_page).value(e.page.no.to_s + '/' +  @total_page.to_s + 'ページ')
                end

            end

            data.each do |header|
                r.start_new_page

                r.page.values(:text_date		=> header[:text_date],
                :text_hachushamei => header[:text_hachushamei],
                :text_hachuPostno => header[:text_hachuPostno],
                :text_hachuAdrs => header[:text_hachuAdrs],
                :text_hachuTelno => header[:text_hachuTelno],
                :text_hachuFaxno => header[:text_hachuFaxno],
                :text_hachuTantoshamei => header[:text_hachuTantoshamei],
                :text_tenkenkaishiY => header[:text_tenkenkaishiY],
                :text_tenkenKbn => header[:text_tenkenKbn],
                :text_memo1 => header[:text_memo1],
                :text_memo2 => header[:text_memo2],
                :text_bukenmei => header[:text_bukenmei],
                :text_bukenPostno => header[:text_bukenPostno],
                :text_bukenAdrs => header[:text_bukenAdrs],
                :text_bukenTelno => header[:text_bukenTelno],
                :text_bukenFaxno => header[:text_bukenFaxno],
                :text_bukenTantoshamei => header[:text_bukenTantoshamei],
                :text_seikyuhouhou => header[:text_seikyuhouhou])

                header[:default].each do |detail|
                    #r.page.list(:default).add_row(detail)

                    r.page.list(:default).add_row do |row|
                        row.item(:text_nendo).value(detail[:text_nendo])
                        row.item(:text_tenkenshubetu).value(detail[:text_tenkenshubetu])
                        row.item(:text_tenkentantoshamei).value(detail[:text_tenkentantoshamei])
                        row.item(:text_tenkenjishibi).value(detail[:text_tenkenjishibi])
                        row.item(:text_jinko).value(detail[:text_jinko])
                        row.item(:text_t_status).value(detail[:text_t_status])
                        row.item(:text_h_status).value(detail[:text_h_status])
                        row.item(:text_biko).value(detail[:text_biko])
                        if detail[:text_h_status] != @@kuroji_status_h1 and detail[:text_h_status] != @@kuroji_status_h2 then
                            row.item(:text_h_status).style(:color,'#ff0000')
                        end
                        if	detail[:text_t_status] != @@kuroji_status then
                            row.item(:text_t_status).style(:color,'#ff0000')
                        end
                    end

                end
            end
        end
        #report.generate_file(File.join(Rails.root, 'public', @pdf_name))
        @pdf_name = CommonUtil.open_pdf(report, 'tenken_hoshu', format("%05d",session[:user_id]))
        @error = 2

    end

    #帳票出力(点検情報)
    def chohyo_buken_sansho

        #帳票１ページあたりの表示件数
        @page_max_kensu =	16
        #出力件数
        @count_u = @@chktrackrec_str.count
        #総ページ数
        @total_page = (@count_u.to_f / @page_max_kensu.to_f).ceil
        t = Time.now
        #日付取得
        @t_date = t.year.to_s + '年' +  t.month.to_s + '月' + t.day.to_s + '日'

        #header　実績補修・点検情報　共通部分　
        data = []
        @postno_h = (@@hachusha_list[0]["hachuPostno"].blank?) ? '' :
        @@hachusha_list[0]["hachuPostno"].to_s.slice(0,3) + '-' + @@hachusha_list[0]["hachuPostno"].to_s.slice(3,4)

        @postno_b = (@@buken_list[0]["bukenPostno"].blank?) ? '' :
        @@buken_list[0]["bukenPostno"].to_s.slice(0,3) + '-' + @@buken_list[0]["bukenPostno"].to_s.slice(3,4)

        @tenkenkaishi = @@buken_list[0]["tenkenkaishiY"].to_s + '年度'

        #請求方法セレクトボックス
        @m_kind_s = MKind.where(:shubetuKbn => MKIND_KBN_SEIKYU)
        @m_kind_s.each do |list|
            if list.shubetu == @@buken_list[0]["seikyuhouhou"] then
                @seikyu_houhou = list.shubetumei
                break
            end
        end

        d1 = {	:text_date		=> @t_date,
            :text_hachushamei => @@hachusha_list[0]["hachushamei"],
            :text_hachuPostno => @postno_h,
            :text_hachuAdrs => @@hachusha_list[0]["hachuAdrs"],
            :text_hachuTelno => @@hachusha_list[0]["hachuTelno"],
            :text_hachuFaxno => @@hachusha_list[0]["hachuFaxno"],
            :text_hachuTantoshamei => @@hachusha_list[0]["hachuTandoshamei"],
            :text_tenkenkaishiY => @tenkenkaishi,
            :text_tenkenKbn => @@tenken_Kbn,
            :text_memo1 => @@buken_list[0]["memo1"],
            :text_memo2 => @@buken_list[0]["memo2"],
            :text_bukenmei => @@buken_list[0]["bukenmei"],
            :text_bukenPostno => @postno_b,
            :text_bukenAdrs => @@buken_list[0]["bukenAdrs"],
            :text_bukenTelno => @@buken_list[0]["bukenTelno"],
            :text_bukenFaxno => @@buken_list[0]["bukenFaxno"],
            :text_bukenTantoshamei => @@buken_list[0]["bukenTandoshamei"],
            :text_seikyuhouhou => @seikyu_houhou,
            :default		=> []}

        #メイン担当者 = 点検担当者ならば★印を付ける
        @imanen = -1
        for @soeji in 0..@count_u - 1 do
            if @@chktrackrec_str[@soeji]["nendo"] != 	@imanen then
                @nendo = @@chktrackrec_str[@soeji]["nendo"].to_s + '年度'
                @keiyakukingaku_kei = @@keiyakukingaku_array[@@chktrackrec_str[@soeji]["nendo"]].gsub('&yen;','\\')
            else
                @nendo = ''
                @keiyakukingaku_kei = ''
            end
            @imanen = @@chktrackrec_str[@soeji]["nendo"]
            @keiyaku_kingaku = '\\' + number_with_delimiter(@@chktrackrec_str[@soeji]["keiyakukingaku1"].round)
            @tsuki = @@chktrackrec_str[@soeji]["tenkenyoteiM1"].to_s + '月'
            @kaisu = '1回'
            @main_mark_tantosha = (@@chktrackrec_str[@soeji]["maintantosha"] == @@chktrackrec_str[@soeji]["tenkentantoshaCode"])? '★' : ''
            @main_mark_tantosha += @@chktrackrec_str[@soeji]["tenkentantoshamei"]
            @str = ( @@chktrackrec_str[@soeji]["gaichuhi"].round == 0)? '-' : '\\' + number_with_delimiter( @@chktrackrec_str[@soeji]["gaichuhi"].round)
            @shubetumei = (@@chktrackrec_str[@soeji]["shubetu"] == MKIND_TENKENSHUBETU_BOUKATAISHOBUTU) ?
            @@chktrackrec_str[@soeji]["shubetumei"].to_s + '(' + @@chktrackrec_str[@soeji]["boukataishobututenkenkaisu"].to_s + '回目)' 	: @@chktrackrec_str[@soeji]["shubetumei"].to_s
			 #点検担当者がメイン担当者でなければ「点検種別名」「年間点検回数」「点検予定月」「契約金額」を表示しない
			  if @@chktrackrec_str[@soeji]["maintantosha"] != @@chktrackrec_str[@soeji]["tenkentantoshaCode"] then
					@shubetumei = ''
					@kaisu = ''
					@tsuki = ''
					@keiyaku_kingaku = ''
			  end
            d1[:default] << {	:text_nendo => @nendo,
                :text_keiyakukingaku_kei => @keiyakukingaku_kei,
                :text_tenkenshubetu => @shubetumei,
                :text_nenkantenkenkaisu  => @kaisu,
                :text_tenkenyoteiM  => @tsuki,
                :text_keiyakukingaku => @keiyaku_kingaku,
                :text_tenkentantoshamei => @main_mark_tantosha,
                :text_gaichuhi  => @str}
        end

        data << d1

        report = ThinReports::Report.create do |r|#buken_sansho
            r.use_layout  File.join(Rails.root, 'app','views', 'buken_joho_shosai', 'buken_sansho.tlf') do |config|

                r.events.on :page_create do |e|
                    e.page.item(:text_page).value(e.page.no.to_s + '/' +  @total_page.to_s + 'ページ')
                end

                config.list(:default) do

                end
            end

            data.each do |header|
                r.start_new_page

                r.page.values(:text_date		=> header[:text_date],
                :text_hachushamei => header[:text_hachushamei],
                :text_hachuPostno => header[:text_hachuPostno],
                :text_hachuAdrs => header[:text_hachuAdrs],
                :text_hachuTelno => header[:text_hachuTelno],
                :text_hachuFaxno => header[:text_hachuFaxno],
                :text_hachuTantoshamei => header[:text_hachuTantoshamei],
                :text_tenkenkaishiY => header[:text_tenkenkaishiY],
                :text_tenkenKbn => header[:text_tenkenKbn],
                :text_memo1 => header[:text_memo1],
                :text_memo2 => header[:text_memo2],
                :text_bukenmei => header[:text_bukenmei],
                :text_bukenPostno => header[:text_bukenPostno],
                :text_bukenAdrs => header[:text_bukenAdrs],
                :text_bukenTelno => header[:text_bukenTelno],
                :text_bukenFaxno => header[:text_bukenFaxno],
                :text_bukenTantoshamei => header[:text_bukenTantoshamei],
                :text_seikyuhouhou => header[:text_seikyuhouhou])

                header[:default].each do |detail|
                    r.page.list(:default).add_row(detail)
                end
            end
        end
        #report.generate_file(File.join(Rails.root, 'public', @pdf_name))
        @pdf_name = CommonUtil.open_pdf(report, 'buken_sansho', format("%05d",session[:user_id]))
        @error = 2

    end

    def buken_joho(bukenCode)
        return ActiveRecord::Base.connection.
        select(" SELECT DISTINCT T.bukenmei, T.bukenTandoshamei, T.bukenPostno, T.bukenAdrs, T.bukenTelno, T.bukenFaxno, M.tenkenkaishiY, K.shubetumei, C.seikyuhouhou, M.memo1, M.memo2
  						FROM m_housinginfos AS M,  t_housinginfos AS T, t_check_infos AS C, m_kinds AS K
						WHERE M.bukenCode = " + bukenCode.to_s + "
						 AND  M.bukenCode = T.bukenCode
						 AND  M.bukenCode = C.bukenCode
						 AND  M.tenkenKbn = K.shubetu
						 AND  K.shubetuKbn = " + MKIND_KBN_TENKEN.to_s )
    end

    #点検情報表の取得SQL
    def chktrackrec_str(bukenCode, konnendo)
        return ActiveRecord::Base.connection.
        select(" SELECT   A.nendo, A.shubetumei, A.nenkantenkenkaisu, A.tenkenyoteiM1, A.keiyakukingaku1, A.tenkentantoshamei,  COALESCE(A.gaichuhi,0) AS gaichuhi, A.maintantosha, A.tenkentantoshaCode, A.shubetu, A.boukataishobututenkenkaisu, A.hantei
				  FROM
  					( SELECT  TC.nendo, MK.shubetumei, TC.nenkantenkenkaisu,TC.tenkenyoteiM1, TC.keiyakukingaku1,  MC.tenkentantoshamei,  gaichuhi1 AS gaichuhi, TC.maintantosha, MC.tenkentantoshaCode, MK.shubetu, TC.boukataishobututenkenkaisu,
  					CASE WHEN TC.maintantosha = MC.tenkentantoshaCode THEN 0 ELSE 1 END AS hantei
  					  FROM m_checkpeople AS MC, t_check_infos AS TC, m_kinds AS MK
  						WHERE TC.bukenCode = " +  bukenCode.to_s + "
  						 AND MC.tenkentantoshaCode = TC.tenkentantosha1
  						AND TC.tenkenshubetuKbn = MK.shubetuKbn
  						AND TC.tenkenshubetu = MK.shubetu
  						AND TC.nendo IN (" + (konnendo - 2).to_s + "," + (konnendo - 1).to_s + "," + (konnendo).to_s + "," + (konnendo + 1).to_s + ")
  					UNION ALL
  						SELECT  TC.nendo, MK.shubetumei, TC.nenkantenkenkaisu,TC.tenkenyoteiM1, TC.keiyakukingaku1,  MC.tenkentantoshamei,  gaichuhi2 AS gaichuhi, TC.maintantosha, MC.tenkentantoshaCode, MK.shubetu, TC.boukataishobututenkenkaisu,
  						CASE WHEN TC.maintantosha = MC.tenkentantoshaCode THEN 0 ELSE 1 END AS hantei
  							FROM m_checkpeople AS MC, t_check_infos AS TC, m_kinds AS MK
  							WHERE TC.bukenCode = " +  bukenCode.to_s + "
  							 AND MC.tenkentantoshaCode = TC.tenkentantosha2
   							AND TC.tenkenshubetuKbn = MK.shubetuKbn
  							AND TC.tenkenshubetu = MK.shubetu
  							AND TC.nendo IN (" + (konnendo - 2).to_s + "," + (konnendo - 1).to_s + "," + (konnendo).to_s + "," + (konnendo + 1).to_s + ")
  					UNION ALL
  					SELECT  TC.nendo, MK.shubetumei, TC.nenkantenkenkaisu,TC.tenkenyoteiM1, TC.keiyakukingaku1,  MC.tenkentantoshamei,  gaichuhi3 AS gaichuhi, TC.maintantosha, MC.tenkentantoshaCode, MK.shubetu, TC.boukataishobututenkenkaisu,
  						CASE WHEN TC.maintantosha = MC.tenkentantoshaCode THEN 0 ELSE 1 END AS hantei
  							FROM m_checkpeople AS MC, t_check_infos AS TC, m_kinds AS MK
  							WHERE TC.bukenCode = " +  bukenCode.to_s + "
  							 AND MC.tenkentantoshaCode = TC.tenkentantosha3
   							AND TC.tenkenshubetuKbn = MK.shubetuKbn
  							AND TC.tenkenshubetu = MK.shubetu
  							AND TC.nendo IN (" + (konnendo - 2).to_s + "," + (konnendo - 1).to_s + "," + (konnendo).to_s + "," + (konnendo + 1).to_s + ")
  					UNION ALL
  					SELECT  TC.nendo, MK.shubetumei, TC.nenkantenkenkaisu,TC.tenkenyoteiM1, TC.keiyakukingaku1,  MC.tenkentantoshamei,  gaichuhi4 AS gaichuhi, TC.maintantosha, MC.tenkentantoshaCode, MK.shubetu, TC.boukataishobututenkenkaisu,
  						CASE WHEN TC.maintantosha = MC.tenkentantoshaCode THEN 0 ELSE 1 END AS hantei
  							FROM m_checkpeople AS MC, t_check_infos AS TC, m_kinds AS MK
  							WHERE TC.bukenCode = " +  bukenCode.to_s + "
  							 AND MC.tenkentantoshaCode = TC.tenkentantosha4
   							AND TC.tenkenshubetuKbn = MK.shubetuKbn
  							AND TC.tenkenshubetu = MK.shubetu
  							AND TC.nendo IN (" + (konnendo - 2).to_s + "," + (konnendo - 1).to_s + "," + (konnendo).to_s + "," + (konnendo + 1).to_s + ")
  					UNION ALL
  					SELECT  TC.nendo, MK.shubetumei, TC.nenkantenkenkaisu,TC.tenkenyoteiM1, TC.keiyakukingaku1,  MC.tenkentantoshamei,  gaichuhi5 AS gaichuhi, TC.maintantosha, MC.tenkentantoshaCode, MK.shubetu, TC.boukataishobututenkenkaisu,
  						CASE WHEN TC.maintantosha = MC.tenkentantoshaCode THEN 0 ELSE 1 END AS hantei
  							FROM m_checkpeople AS MC, t_check_infos AS TC, m_kinds AS MK
  							WHERE TC.bukenCode = " +  bukenCode.to_s + "
  							 AND MC.tenkentantoshaCode = TC.tenkentantosha5
   							AND TC.tenkenshubetuKbn = MK.shubetuKbn
  							AND TC.tenkenshubetu = MK.shubetu
  							AND TC.nendo IN (" + (konnendo - 2).to_s + "," + (konnendo - 1).to_s + "," + (konnendo).to_s + "," + (konnendo + 1).to_s + ")
  					UNION ALL
  					SELECT  TC.nendo, MK.shubetumei, TC.nenkantenkenkaisu,TC.tenkenyoteiM1, TC.keiyakukingaku1,  MC.tenkentantoshamei,  gaichuhi6 AS gaichuhi, TC.maintantosha, MC.tenkentantoshaCode, MK.shubetu, TC.boukataishobututenkenkaisu,
  						CASE WHEN TC.maintantosha = MC.tenkentantoshaCode THEN 0 ELSE 1 END AS hantei
  							FROM m_checkpeople AS MC, t_check_infos AS TC, m_kinds AS MK
  							WHERE TC.bukenCode = " +  bukenCode.to_s + "
  							 AND MC.tenkentantoshaCode = TC.tenkentantosha6
   							AND TC.tenkenshubetuKbn = MK.shubetuKbn
  							AND TC.tenkenshubetu = MK.shubetu
  							AND TC.nendo IN (" + (konnendo - 2).to_s + "," + (konnendo - 1).to_s + "," + (konnendo).to_s + "," + (konnendo + 1).to_s + ")
  					UNION ALL
  					SELECT  TC.nendo, MK.shubetumei, TC.nenkantenkenkaisu,TC.tenkenyoteiM1, TC.keiyakukingaku1,  MC.tenkentantoshamei,  gaichuhi7 AS gaichuhi, TC.maintantosha, MC.tenkentantoshaCode, MK.shubetu, TC.boukataishobututenkenkaisu,
  						CASE WHEN TC.maintantosha = MC.tenkentantoshaCode THEN 0 ELSE 1 END AS hantei
  							FROM m_checkpeople AS MC, t_check_infos AS TC, m_kinds AS MK
  							WHERE TC.bukenCode = " +  bukenCode.to_s + "
  							 AND MC.tenkentantoshaCode = TC.tenkentantosha7
   							AND TC.tenkenshubetuKbn = MK.shubetuKbn
  							AND TC.tenkenshubetu = MK.shubetu
  							AND TC.nendo IN (" + (konnendo - 2).to_s + "," + (konnendo - 1).to_s + "," + (konnendo).to_s + "," + (konnendo + 1).to_s + ")
  					UNION ALL
  					SELECT  TC.nendo, MK.shubetumei, TC.nenkantenkenkaisu,TC.tenkenyoteiM1, TC.keiyakukingaku1,  MC.tenkentantoshamei,  gaichuhi8 AS gaichuhi, TC.maintantosha, MC.tenkentantoshaCode, MK.shubetu, TC.boukataishobututenkenkaisu,
  						CASE WHEN TC.maintantosha = MC.tenkentantoshaCode THEN 0 ELSE 1 END AS hantei
  							FROM m_checkpeople AS MC, t_check_infos AS TC, m_kinds AS MK
  							WHERE TC.bukenCode = " +  bukenCode.to_s + "
  							 AND MC.tenkentantoshaCode = TC.tenkentantosha8
   							AND TC.tenkenshubetuKbn = MK.shubetuKbn
  							AND TC.tenkenshubetu = MK.shubetu
  							AND TC.nendo IN (" + (konnendo - 2).to_s + "," + (konnendo - 1).to_s + "," + (konnendo).to_s + "," + (konnendo + 1).to_s + ")
  					UNION ALL
  					SELECT  TC.nendo, MK.shubetumei, TC.nenkantenkenkaisu,TC.tenkenyoteiM1, TC.keiyakukingaku1,  MC.tenkentantoshamei,  gaichuhi9 AS gaichuhi, TC.maintantosha, MC.tenkentantoshaCode, MK.shubetu, TC.boukataishobututenkenkaisu,
  						CASE WHEN TC.maintantosha = MC.tenkentantoshaCode THEN 0 ELSE 1 END AS hantei
  							FROM m_checkpeople AS MC, t_check_infos AS TC, m_kinds AS MK
  							WHERE TC.bukenCode = " +  bukenCode.to_s + "
  							 AND MC.tenkentantoshaCode = TC.tenkentantosha9
   							AND TC.tenkenshubetuKbn = MK.shubetuKbn
  							AND TC.tenkenshubetu = MK.shubetu
  							AND TC.nendo IN (" + (konnendo - 2).to_s + "," + (konnendo - 1).to_s + "," + (konnendo).to_s + "," + (konnendo + 1).to_s + ")
  					UNION ALL
  					SELECT  TC.nendo, MK.shubetumei, TC.nenkantenkenkaisu,TC.tenkenyoteiM1, TC.keiyakukingaku1,  MC.tenkentantoshamei,  gaichuhi10 AS gaichuhi, TC.maintantosha, MC.tenkentantoshaCode, MK.shubetu, TC.boukataishobututenkenkaisu,
  					CASE WHEN TC.maintantosha = MC.tenkentantoshaCode THEN 0 ELSE 1 END AS hantei
  							FROM m_checkpeople AS MC, t_check_infos AS TC, m_kinds AS MK
  							WHERE TC.bukenCode = " +  bukenCode.to_s + "
  							 AND MC.tenkentantoshaCode = TC.tenkentantosha10
   							AND TC.tenkenshubetuKbn = MK.shubetuKbn
  							AND TC.tenkenshubetu = MK.shubetu
  							AND TC.nendo IN (" + (konnendo - 2).to_s + "," + (konnendo - 1).to_s + "," + (konnendo).to_s + "," + (konnendo + 1).to_s + ") ) A
  				ORDER BY A.nendo ASC, A.shubetu ASC, A.hantei ASC ")
    end

    #点検実績/補修情報表の取得SQL
    def chktrackrec_hoshu_str(bukenCode, konnendo)
        return ActiveRecord::Base.connection.
        select(" SELECT TCt.nendo, MKi.shubetumei, MCp.tenkentantoshamei, TCt.tenkenkanryoYMD,
				      TCt.jinko, MCp.tenkentantoshaCode,A.h_status,TCi.tenkenshubetu, TCi.boukataishobututenkenkaisu,
						CASE TCt.tenkenstatus WHEN 1 THEN MIn.tenkenstatusmei1
												 WHEN 2 THEN MIn.tenkenstatusmei2
		 										 WHEN 3 THEN MIn.tenkenstatusmei3
		 										 WHEN 4 THEN MIn.tenkenstatusmei4
		 										 WHEN 5 THEN MIn.tenkenstatusmei5 ELSE NULL END AS t_status, TCt.biko ,
		 				CASE  WHEN TCt.tenkenkanryoYMD is NULL THEN 1 ELSE 0 END AS tenkenYMDisnotnull
	           FROM m_inits AS MIn, m_kinds AS MKi, m_checkpeople AS MCp, t_check_infos AS TCi, t_chktrackrec_infos AS TCt
               LEFT OUTER JOIN
                 ( SELECT bukenCode, nendo, setubishubetuKbn, setubishubetu, tenkenshubetuKbn,
                         tenkenshubetu, tenkenyoteiM, edaban,
        	        	 CASE TRi.hoshuStatus  WHEN 1 THEN MIn.hoshustatusmei1
		 										  WHEN 2 THEN MIn.hoshustatusmei2
		 										  WHEN 3 THEN MIn.hoshustatusmei3
		 										  WHEN 4 THEN MIn.hoshustatusmei4
		 										  WHEN 5 THEN MIn.hoshustatusmei5
		                                     WHEN 6 THEN MIn.hoshustatusmei6 ELSE NULL END AS h_status
                 		FROM t_repair_infos AS TRi, m_inits AS MIn
                  	WHERE bukenCode = #{bukenCode}
                ) A
                		ON  A.bukenCode = TCt.bukenCode
            			AND A.nendo = TCt.nendo
	         			AND A.setubishubetuKbn = TCt.setubishubetuKbn
             			AND A.setubishubetu = TCt.setubishubetu
        				AND A.tenkenshubetuKbn = TCt.tenkenshubetuKbn
						AND A.tenkenshubetu = TCt.tenkenshubetu
						AND A.tenkenyoteiM = TCt.tenkenyoteiM
        				AND A.edaban = TCt.edaban
				WHERE  TCt.bukenCode = #{bukenCode}
		   		AND	TCi.bukenCode = TCt.bukenCode
		  	 	AND	TCi.nendo = TCt.nendo
		   		AND	TCi.setubishubetuKbn = TCt.setubishubetuKbn
		   		AND	TCi.setubishubetu = TCt.setubishubetu
		   		AND	TCi.tenkenshubetuKbn = TCt.tenkenshubetuKbn
		   		AND TCi.tenkenshubetu = TCt.tenkenshubetu
		   		AND TCi.tenkenyoteiM1 = TCt.tenkenyoteiM
		   		AND MCp.tenkentantoshaCode = TCi.maintantosha
		   		AND TCt.tenkenshubetuKbn = MKi.shubetuKbn
		   		AND TCi.tenkenshubetu = MKi.shubetu
				ORDER BY TCt.nendo ASC, tenkenYMDisnotnull ASC, TCt.tenkenkanryoYMD ASC	")
    end
end
