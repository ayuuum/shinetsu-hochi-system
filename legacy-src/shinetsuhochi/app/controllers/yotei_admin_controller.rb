class YoteiAdminController < ApplicationController
    include ActionView::Helpers::NumberHelper
    #thinreportsをロード
    require 'rubygems'
    require 'benchmark'
    #ログインチェック
    before_action :mainte_check
    before_action :login_check
    before_action :dialog_init

	#sort sql定義
	 SortByTenkenStatus = "ORDER BY B.tenkenstatus, B.tenkenkanryoYMD ASC"
	 SortByHachushamei = "ORDER BY MOp.hachushamei ASC"

    def index
        #初期化
        
		
        #@sort_by_tenkentantosha = "ORDER BY B.tenkentantosha1 ASC"
		 session[:sort_sql] = SortByTenkenStatus

        @error = 0
        @sql_housinginfos = ''

        #点検ステータス
        @m_init_select = MInit.all.limit(1)

        @m_nendo_array = Hash.new()

        str1 = "年度"
        @m_init_select.each do | y |
            @m_nendo_array.store((y.tounenY - 1).to_s + str1, (y.tounenY - 1))
            @m_nendo_array.store((y.tounenY).to_s + str1, y.tounenY)
            @m_nendo_array.store((y.tounenY + 1).to_s + str1, (y.tounenY + 1))
            @kaishi_m = y.nendokaishiM
            @nendo = y.tounenY
        end
        session[:from_nendo] = @nendo
        #点検予定月
        @m_yoteitsuki = Hash.new()

        str2 = "月"
        for num in 0..11 do
            @m_yoteitsuki.store(((@kaishi_m + num - 1) % 12 + 1).to_s + str2, ((@kaishi_m + num - 1) % 12 + 1))
        end

        #点検担当者
        @m_checkpeople_select = MCheckpeople.order("sakujyoFlg,tenkentantoshashubetu")

        @m_checkpeople_array = Hash.new
        @m_checkpeople_select.each do | i |
            @m_checkpeople_array.store(((i.sakujyoFlg == 1) ? "×" : "") + i.tenkentantoshamei + ((i.tenkentantoshashubetu == 2) ? "◆" : ""), i.tenkentantoshaCode)
        end

        #設備種別取得
        @m_setubi_select = MKind.where(:shubetuKbn => MKIND_KBN_SETSUBISHUBETU).order('shubetu ASC')

        @ten = Array.new(5,false)
        @hoshu = Array.new(6,false)
        @tenkenyoteiM_sql = ""
        @tenkenjishiM_sql = ""
        @tenkenstatus_sql = ""
        @hoshustatus_sql = ""
        @default_tuki = ""
        #月別一覧からの遷移(1～4番目のパラメータが整数値の場合有効)
        if (!params[:first].blank? and params[:first] =~ /^[0-9]+$/ and !params[:second].blank? and params[:second] =~ /^[0-9]+$/ and !params[:third].blank? and params[:third] =~ /^[0-9]+$/ and !params[:fourth].blank? and params[:fourth] =~ /^[0-9]+$/  and !params[:fifth].blank? and params[:fifth] =~ /^[0-9]+$/  and !params[:sixth].blank? and params[:sixth] =~ /^[0-9]+$/)
            then
            if  params[:fourth].to_i < 10000 and params[:fourth].to_i > 0 and params[:sixth].to_i == 0 then
                @nendo = params[:fourth].to_i
                logger.debug("nendo on" + @nendo.to_s)
                @hyoji_nendo = @nendo
                session[:renzoku_flg] = false
            elsif  params[:fourth].to_i < 10000 and params[:fourth].to_i > 0 and params[:sixth].to_i == 1  then
                @str = "#{@m_init_select[0]['tounenY'] - 1}年度～#{@m_init_select[0]['tounenY'] + 1}年度"
                session[:from_nendo] = params[:fourth].to_i
                @nendo = Array.new(3) # params[:fourth].to_i
                @nendo = [@m_init_select[0]['tounenY'] - 1, @m_init_select[0]['tounenY'] ,@m_init_select[0]['tounenY'] + 1]
                @m_nendo_array.store( @str, -(@m_init_select[0]['tounenY'] - 1) )
                @hyoji_nendo = -(@m_init_select[0]['tounenY'] - 1)
                session[:renzoku_flg] = true
            end

            if params[:first].to_i < 13 and params[:first].to_i > 0 then
                @tenkenyoteiM_sql = " AND TCt.tenkenyoteiM = #{params[:first]}"
                @default_tuki =  params[:first]
                logger.debug("@default_tuki  on" + @default_tuki.to_s)
            end

            if params[:second].to_i < 6 and params[:second].to_i > 0 then
                @tenkenstatus_sql = " AND TCt.tenkenstatus = #{params[:second]}"
                @ten[params[:second].to_i - 1] = true
                session[:search_tenken] = params[:second]
            else
                @ten = [true,true,true,true,true]
                session[:search_tenken] = '1_2_3_4_5'
            end
            #補修ステータスを選択したばあい
            if params[:third].to_i < 7 and params[:third].to_i > 0 then
                @hoshustatus_sql = hoshu_sql(params['third'],@nendo)
                @hoshu[params[:third].to_i - 1] = true
                session[:search_hoshu] = params['third']
                #補修ステータス総件数を選択したばあい
            elsif params[:third].to_i == 7 then
                @hoshustatus_sql = hoshu_sql("1,2,3,4,5,6",@nendo)
                for i in 0..5 do
                    @hoshu[i] = true
                end
                session[:search_hoshu] = '1_2_3_4_5_6'
            else
                session[:search_hoshu] = '0_1_2_3_4_5_6'
            end

            if params[:fifth].to_i < 13 and params[:fifth].to_i > 0 then
                @default_jishituki =  params[:fifth]
                session[:search_month] = params[:fifth].to_i
                @tenkenjishiM_sql = "AND MONTH(TCt.tenkenkanryoYMD) = #{params[:fifth]}"
            else
                @default_jishituki = ""
                session[:search_month] = 0
                @tenkenjishiM_sql = ""
            end

        else
            @ten = [true,true,true,true,true]
            @default_tuki = Time.now.strftime("%m")
            @tenkenyoteiM_sql = " AND TCt.tenkenyoteiM = #{@default_tuki}"
            @default_jishituki = ""
            @hyoji_nendo = @nendo
            session[:renzoku_flg] = false
            #実績登録に渡す現在の検索条件
            session[:search_tenken] = '1_2_3_4_5'
            session[:search_hoshu] = '0_1_2_3_4_5_6'
            session[:search_month] = 0
        end

        #帳票作成実行時に使う検索条件
        session[:s_repo_nendo] = @nendo
        session[:s_repo_kensakubukenmei] = ''
        session[:s_repo_yoteituki] = @default_tuki
        session[:s_repo_jishituki] = @default_jishituki
        session[:s_repo_kensakutantoshamei] = ''

        #補修情報セット
        repair_info_set(@nendo)

        #名前ハッシュなどデータセット
        list_meisai

        #初期表示の検索条件  (点検予定月、点検実施月、点検担当者、物件、設備種別、点検ステータス、補修ステータスでの検索は無し)
        Benchmark.bm(7) do |x|
            e = x.report("each:"){ search_action(@nendo,@tenkenyoteiM_sql,@tenkenjishiM_sql,'','','',@tenkenstatus_sql,@hoshustatus_sql,session[:sort_sql]) }
            logger.debug(e.to_s)
        end

        render :layout => 'menu'
    end

    def commit
        #ダイアログ設定
        @error = 0

        #何のボタンが押されたか
        @commit_kind = params[:commit]
		logger.debug("commit = " + @commit_kind)
        #一括チェックのチェックを外すか
        @check_clear = 0
        #値取得
        @tenkenstatus = params[:tenkenstatus]
        @ikatsusentaku = params['ikatsusentaku']
        @hoshustatus = params[:hoshustatus]
        @yoteisentaku = params[:yoteisentaku]

        #物件検索
        if @commit_kind == '物件検索' then
            @error = 3
            @query_str = 'buken_kensaku_pop/index'
        elsif @commit_kind == '点検ステータス一括変更' then
            if @tenkenstatus == nil then
                @error_message = MESSAGE_43
            elsif @ikatsusentaku == nil then
                @error_message = MESSAGE_45
            else

                #提出済み以外へのステータス変更
                if @tenkenstatus.to_i != 3 then
                    @ikatsusentaku.each do |list,val|
                        s = list.split(',')
                        #チェックボックスに設定したkeyのうち7番目が点検ステータス。
                        #この値＋１が更新しようとする点検ステータスでなければNG
                        #if s[6].to_i + 1 != @tenkenstatus.to_i then
                           #@error_message = MESSAGE_46
                           #break
                        #end
                    end
                    #提出済みへのステータス変更
                else
                    @ikatsusentaku.each do |list,val|
                        s = list.split(',')
                        #未着手の場合
                        if s[6].to_i == 1 then
                            @error_message = MESSAGE_48
                            break
                        #elsif s[6].to_i + 1 != @tenkenstatus.to_i then
                            #@error_message = MESSAGE_46
                            #break
                        end
                    end
                end
                logger.debug("@error_message[1]" + @error_message[1])
                #エラーが無ければ一括更新
                if @error_message[0] == '' then
                    transact_tenken_update(@ikatsusentaku,@tenkenstatus.to_i)
                    #更新後、検索(表示更新)処理
                    search_set('検索')
                else
                    #エラーがある場合は一括チェック外す
                    #@check_clear = 1
                end
            end

        elsif @commit_kind == '補修ステータス一括変更' then
            if @hoshustatus == nil then
                @error_message = MESSAGE_44
            elsif @ikatsusentaku == nil then
                @error_message = MESSAGE_45
            else
                @ikatsusentaku.each do |list,val|
                    s = list.split(',')
                    #チェックボックスにに設定したkeyのうち6番目が補修ステータス。
                    #この値＋１が更新しようとする点検ステータスでなければNG
                    if s[5].to_i == 0 then
                        @error_message = MESSAGE_49
                        break
                    #elsif s[5].to_i + 1 != @hoshustatus.to_i then
                        #@error_message = MESSAGE_47
                        #break
                    end
                end

                #エラーが無ければ一括更新
                if @error_message[0] == '' then
                    transact_hoshu_update(@ikatsusentaku,@hoshustatus.to_i)
                    #更新後、検索(表示更新)処理
                    search_set('検索')
                else
                    #エラーがある場合は一括チェック外す
                    #@check_clear = 1
                end
            end

        elsif @commit_kind == '実績登録' then
            if @yoteisentaku == nil then
                @error_message = MESSAGE_50
            else
                #ラジオボタンに設定したkeyを分解、urlクエリにセット
                @tenken_joho = Hash.new
                s = @yoteisentaku.split(',')
                for num in 0..12 do
                    @tenken_joho.store(num, s[num])
                end
                @error = 3
                #実績登録画面へ	物件コード,年度,点検種別,点検予定月,枝番,補修ステータス,点検ステータス設定,発注者コード、点検担当者コード、
                #行番号、検索条件点検、検索条件補修,検索点検実施月のクエリを付け遷移
                @query_str = "jiseki_toroku/index/" + @tenken_joho.to_query
            end
        elsif @commit_kind == '帳票出力' then

            #点検予定/実績一覧から値取得

            t = Time.now
            @t_date = t.year.to_s + '年' +  t.month.to_s + '月' + t.day.to_s + '日'
            session[:renzoku_flg]
            str1 = "年度"
            str2 = "月"
            @nendo = (session[:renzoku_flg]) ? "#{session[:s_repo_nendo][0]}年度～#{session[:s_repo_nendo][2]}年度" : session[:s_repo_nendo].to_s + str1

            @yoteituki = (session[:s_repo_yoteituki] == '') ? '全月' :  session[:s_repo_yoteituki] + str2
            @jishituki = (session[:s_repo_jishituki] == '') ? '全月' :  session[:s_repo_jishituki] + str2

            @kensakutantoshamei = session[:s_repo_kensakutantoshamei]
            if @kensakutantoshamei == '' then
                @kensakutantoshamei = '全担当者'
            else
                @kensakutantoshamei = MCheckpeople.where(:tenkentantoshaCode => @kensakutantoshamei)
                @kensakutantoshamei.each do | name |
                    @kensakutantoshamei = name.tenkentantoshamei
                end
            end

            #赤字になるステータス名を取得
            @kuroji_tenken = CommonUtil.kuroji_statusmei
            @kuroji_hoshu1 = CommonUtil.kuroji_statusmei_hoshu_1
            @kuroji_hoshu2 = CommonUtil.kuroji_statusmei_hoshu_2

            data = []
            d1 = {	:txtToday => @t_date,
                :txtNendo => @nendo,
                :txtKensakuBukenmei => session[:s_repo_kensakubukenmei],
                :txtKensakuYoteituki => @yoteituki,
                :txtKensakutantoshamei => @kensakutantoshamei,
                :txtJishituki => @jishituki,
                :default		=> []}

            #帳票用にリストを再取得
            #@sql_chktrackrecinfos = CommonUtil.get_yotei_sql(session[:report_nendo],session[:report_yoteiM], session[:report_jishiM], session[:report_tantosha], session[:report_bukenmei],session[:report_setubi],session[:report_tstatus],session[:report_hstatus])

            @sql_chktrackrecinfos = (session[:renzoku_flg]) ? CommonUtil.get_yotei_ren_sql(session[:report_nendo].join(","),session[:report_yoteiM], session[:report_jishiM], session[:report_tantosha], session[:report_bukenmei],session[:report_setubi],session[:report_tstatus],session[:report_hstatus]): CommonUtil.get_yotei_sql(session[:report_nendo],session[:report_yoteiM], session[:report_jishiM], session[:report_tantosha], session[:report_bukenmei],session[:report_setubi],session[:report_tstatus],session[:report_hstatus])

            @sql_count = @sql_chktrackrecinfos.count
            @chklist = Array.new(@sql_count).map{Array.new(12,'')}

            for num in 0.. @sql_count - 1 do
                @hoshustatus_id = session[:hoshustatus][format("%010d%04d%05d%02d%02d",@sql_chktrackrecinfos[num]["bukenCode"],@sql_chktrackrecinfos[num]["nendo"],@sql_chktrackrecinfos[num]["tenkenshubetu"],@sql_chktrackrecinfos[num]["tenkenyoteiM"], @sql_chktrackrecinfos[num]["edaban"])].to_s.slice(0..2).to_i

                d1[:default] << {	:txtHachushamei => @sql_chktrackrecinfos[num]["hachushamei"].to_s,
                    :txtBukenmei => session[:bukenmei][@sql_chktrackrecinfos[num]["bukenCode"]],
                    :txtTenkenshubetu => session[:shubetumei][@sql_chktrackrecinfos[num]["tenkenshubetu"]].to_s,
                    :txtTantoshamei => session[:tantoshamei][@sql_chktrackrecinfos[num]["tenkentantosha1"]].to_s,
                    :txtTenkenstatus => session[:tenkenstatusmei][@sql_chktrackrecinfos[num]["tenkenstatus"]].to_s,
                    :txtHoshustatus => session[:hoshustatusmei][@hoshustatus_id].to_s,
                    :txtHoshurireki => session[:hoshurireki][@sql_chktrackrecinfos[num]["hoshukanrenumu"]].to_s,
                    :txtTenkenyoteituki => @sql_chktrackrecinfos[num]["tenkenyoteiM"].to_s + '月',
                    :txtTenkenkanryo => @sql_chktrackrecinfos[num]["tenkenkanryoYMD"].to_s,
                    :txtHoshukanryo => session[:hoshustatus][format("%010d%04d%05d%02d%02d",@sql_chktrackrecinfos[num]["bukenCode"],@sql_chktrackrecinfos[num]["nendo"],@sql_chktrackrecinfos[num]["tenkenshubetu"],@sql_chktrackrecinfos[num]["tenkenyoteiM"], @sql_chktrackrecinfos[num]["edaban"])].to_s.slice(3..-1).to_s.gsub('-','/').to_s,
                    :txtBikou => @sql_chktrackrecinfos[num]["biko"].to_s}
            end

            data << d1

            report = ThinReports::Report.create do |r|
                r.use_layout  File.join(Rails.root, 'app','views', 'yotei_admin', 'report_yotei.tlf') do |config|
                end

                data.each do |header|
                    r.start_new_page

                    r.page.values(:txtToday => header[:txtToday],
                    :txtNendo => header[:txtNendo],
                    :txtKensakuBukenmei => header[:txtKensakuBukenmei],
                    :txtKensakuYoteituki => header[:txtKensakuYoteituki],
                    :txtKensakutantoshamei => header[:txtKensakutantoshamei],
                    :txtJishituki => header[:txtJishituki])

                    header[:default].each do |detail|

                        r.page.list(:default).add_row do |row|
                            row.item(:txtHachushamei).value(detail[:txtHachushamei])
                            row.item(:txtBukenmei).value(detail[:txtBukenmei])
                            row.item(:txtTenkenshubetu).value(detail[:txtTenkenshubetu])
                            row.item(:txtTantoshamei).value(detail[:txtTantoshamei])
                            row.item(:txtTenkenstatus).value(detail[:txtTenkenstatus])
                            row.item(:txtHoshustatus).value(detail[:txtHoshustatus])
                            row.item(:txtHoshurireki).value(detail[:txtHoshurireki])
                            row.item(:txtTenkenyoteituki).value(detail[:txtTenkenyoteituki])
                            row.item(:txtTenkenkanryo).value(detail[:txtTenkenkanryo])
                            row.item(:txtHoshukanryo).value(detail[:txtHoshukanryo])
                            row.item(:txtBikou).value(detail[:txtBikou])
                            #「請求済み」以外は赤字
                            if detail[:txtHoshustatus] != @kuroji_hoshu1 and detail[:txtHoshustatus] != @kuroji_hoshu2 then
                                row.item(:txtHoshustatus).style(:color,'#ff0000')
                            end
                            #請求済み・対応不要以外は赤字
                            if detail[:txtTenkenstatus] != @kuroji_tenken then
                                row.item(:txtTenkenstatus).style(:color,'#ff0000')
                            end
                        end

                    end
                end
            end
=begin
		@prepath = 'report_yotei_admin'
		@preid = format("%05d",session[:user_id])
		FileUtils.rm(Dir.glob(File.join(Rails.root, 'public','pdf', @prepath) + @preid + "*.pdf"))

		@random_str = Time.now.strftime("%Y%m%d%H%M%S").to_s + SecureRandom.hex(16).to_s
		report.generate_file(File.join(Rails.root, 'public','pdf', @prepath + @preid + @random_str + '.pdf'))
		@pdf_name = 'pdf/' + @prepath + @preid + @random_str + '.pdf'
=end
            @pdf_name = CommonUtil.open_pdf(report, 'report_yotei_admin', format("%05d",session[:user_id]))

            @error = 2
        elsif @commit_kind == '検索' then
            search_set(@commit_kind)
		 elsif @commit_kind == '発注者名順' then
			  session[:sort_sql] = SortByHachushamei
			  search_set(@commit_kind)
		 elsif @commit_kind == '点検ステータス順' then
            session[:sort_sql] = SortByTenkenStatus
            search_set(@commit_kind)
        elsif @commit_kind == '月別件数一覧へ' then
            @error = 4
            #セレクトボックスの年度が連続年度の場合、月別件数一覧から遷移したときの年度
            @link = (params[:nendo].to_i < 0) ? session[:from_nendo].to_s : params[:nendo]
            @query_str = 'monthlist/index/' + @link
        end
    end

    def search_set(commit_kind)
        #クリア
        @tenkenyoteiM = ''
        @tenkenjishiM = ''

        session[:s_repo_nendo] = params[:nendo]
        session[:s_repo_kensakubukenmei] = params[:kensakubukenmei]
        session[:s_repo_yoteituki] = params[:tenkenyoteiM]
        session[:s_repo_jishituki] = params[:tenkenjishiM]
        session[:s_repo_kensakutantoshamei] = params[:kensakutantoshamei]

        #検索条件取得
        #年度
        if params[:nendo].to_i < 0 then
            @nendo = [-(params[:nendo].to_i) , -(params[:nendo].to_i - 1 ), -(params[:nendo].to_i - 2 )]
            session[:renzoku_flg] = true
        else
            @nendo = params[:nendo].to_i
            session[:renzoku_flg] = false
        end

        #点検予定月
        @tenkenyoteiM_sql = ( params[:tenkenyoteiM] == '' )? "" : "AND TCt.tenkenyoteiM = #{params[:tenkenyoteiM]}"

        #点検実施月
        if params[:tenkenjishiM] == '' then
            session[:search_month] = 0
            @tenkenjishiM_sql = ''
        else
            session[:search_month] = params[:tenkenjishiM].to_i
            @tenkenjishiM_sql = "AND MONTH(TCt.tenkenkanryoYMD) = #{params[:tenkenjishiM]}"
        end

        #担当者名
        @kensakutantoshamei_sql = ( params[:kensakutantoshamei] == '' )? "" : " AND TCi.tenkentantosha1 = #{params[:kensakutantoshamei]}"

        #物件名
        @kensakubukenmei_sql = ( params[:kensakubukenmei] == '' )? "" : " AND EXISTS ( SELECT *
																					FROM m_housinginfos AS MHi
																					WHERE MHi.bukenCode = TCi.bukenCode
																					AND  MHi.bukenmei LIKE '%#{params[:kensakubukenmei]}%' )"
        #設備種別：
        if params['condsetubi'].blank? or params['condsetubi'].count == 0
            #１チェックなければエラー
            @error_message = MESSAGE_85
            return false
        else
            #３つ全てチェックがあれば全検索
            @setubi_sql = (params['condsetubi'].count == 3) ? "" : " AND TCt.setubishubetu IN (" + params['condsetubi'].join(",") + ")"
        end
        #点検ステータス：チェックが０または５つ全てなら全検索、そうでなければチェックされたものを検索
        if (params['condtenstatus'].blank? or params['condtenstatus'].count == 5) then
            @tenkenstatus_sql = ""
            session[:search_tenken] = '1_2_3_4_5'
        else
            @tenkenstatus_sql =  " AND TCt.tenkenstatus IN (" + params['condtenstatus'].join(",") + ")"
            session[:search_tenken] = params['condtenstatus'].join("_")
            logger.debug("点検サーチ session[:search_tenken].to_s：" + session[:search_tenken].to_s)
            logger.debug("点検サーチsession[:search_tenken].split：" + session[:search_tenken].split("_").to_s)
        end

        #補修ステータス：チェックが無ければ全検索
        if (params['condhostatus'].blank?) then
            @hoshustatus_sql = ""
            session[:search_hoshu] = '0_1_2_3_4_5_6'
        else
            @hoshustatus_sql = hoshu_sql(params['condhostatus'].join(","),@nendo)
            session[:search_hoshu] = params['condhostatus'].join("_")
            logger.debug("点検サーチ session[:search_hoshu].to_s：" + session[:search_hoshu].to_s)
            logger.debug("点検サーチsession[:search_hoshu].split：" + session[:search_hoshu].split("_").to_s)
        end

        #補修情報セット
        repair_info_set(@nendo)

        #再検索
		 #session[:sort_sql] = "ORDER BY B.tenkenstatus, B.tenkenkanryoYMD ASC"
        search_action(@nendo,@tenkenyoteiM_sql, @tenkenjishiM_sql, @kensakutantoshamei_sql, @kensakubukenmei_sql,@setubi_sql,@tenkenstatus_sql,@hoshustatus_sql,session[:sort_sql])
        @error = 1
    end

    #検索実行
    def search_action(nendo,tenkenyoteiM, tenkenjishiM, kensakutantoshamei, kensakubukenmei,setubi,tenkenstatus,hoshustatus,sort)

        #初期化
        @html_string = ''

        session[:report_nendo] = nendo
        session[:report_yoteiM] = tenkenyoteiM
        session[:report_jishiM] = tenkenjishiM
        session[:report_tantosha] = kensakutantoshamei
        session[:report_bukenmei] = kensakubukenmei
        session[:report_setubi] = setubi
        session[:report_tstatus] = tenkenstatus
        session[:report_hstatus] = hoshustatus
		
		 @isKoushin = CommonUtil.isJinendokoushin
        if !session[:renzoku_flg] and nendo.to_i == CommonUtil.konnendo + 1 then
            if @isKoushin then
		 		@jinen_flg = false
				@sql_chktrackrecinfos = CommonUtil.get_yotei_admin_jinendo_after_sql(nendo,tenkenyoteiM, tenkenjishiM, kensakutantoshamei, kensakubukenmei,setubi,tenkenstatus,hoshustatus,sort)
			else
				@jinen_flg = true
      	    	@sql_chktrackrecinfos = CommonUtil.get_yotei_admin_jinendo_before_sql(nendo,tenkenyoteiM, tenkenjishiM, kensakutantoshamei, kensakubukenmei,setubi,tenkenstatus,hoshustatus,sort)
			end
            
        else
            @jinen_flg = false
            @sql_chktrackrecinfos = (session[:renzoku_flg]) ? CommonUtil.get_yotei_admin_ren_sql(nendo.join(","),tenkenyoteiM, tenkenjishiM, kensakutantoshamei, kensakubukenmei,setubi,tenkenstatus,hoshustatus,sort)	: CommonUtil.get_yotei_admin_sql(nendo,tenkenyoteiM, tenkenjishiM, kensakutantoshamei, kensakubukenmei,setubi,tenkenstatus,hoshustatus,sort)
        end

        @sql_count = @sql_chktrackrecinfos.count
        session[:sql_count] = @sql_count
        for num in 0.. @sql_count - 1 do
            #session[:hoshustatus]にセットされた最初の３桁が補修ステータス番号、それ以降が補修完了YMD
            @hoshustatus_id = session[:hoshustatus][format("%010d%04d%05d%02d%02d",@sql_chktrackrecinfos[num]["bukenCode"],@sql_chktrackrecinfos[num]["nendo"],@sql_chktrackrecinfos[num]["tenkenshubetu"],@sql_chktrackrecinfos[num]["tenkenyoteiM"], @sql_chktrackrecinfos[num]["edaban"])].to_s.slice(0..2).to_i
            @hoshukanryoYMD = session[:hoshustatus][format("%010d%04d%05d%02d%02d",@sql_chktrackrecinfos[num]["bukenCode"],@sql_chktrackrecinfos[num]["nendo"],@sql_chktrackrecinfos[num]["tenkenshubetu"],@sql_chktrackrecinfos[num]["tenkenyoteiM"], @sql_chktrackrecinfos[num]["edaban"])].to_s.slice(3..-1).to_s.gsub('-','/')
            #一括変更チェックに物件コード,年度,点検種別,点検予定月,枝番,補修ステータス,点検ステータス設定

            @sentaku_key = "#{@sql_chktrackrecinfos[num]['bukenCode']},#{@sql_chktrackrecinfos[num]['nendo']},#{@sql_chktrackrecinfos[num]['tenkenshubetu']},#{@sql_chktrackrecinfos[num]['tenkenyoteiM']},#{@sql_chktrackrecinfos[num]['edaban']},#{@hoshustatus_id},#{@sql_chktrackrecinfos[num]['tenkenstatus']},#{@sql_chktrackrecinfos[num]['hachushaCode']},#{@sql_chktrackrecinfos[num]['tenkentantosha1']},#{num},#{session[:search_tenken]},#{session[:search_hoshu]},#{session[:search_month]}"

            @to_hoshu = (@sql_chktrackrecinfos[num]["hoshukanrenumu"] == 1 or @sql_chktrackrecinfos[num]["hoshukanrenumu"] == 2) ? ' style="cursor:pointer;" onClick="to_hoshurireki(' + @sql_chktrackrecinfos[num]["bukenCode"].to_s + ',' + @sql_chktrackrecinfos[num]["hachushaCode"].to_s  + ');"' : ''
            #jinendotenkenYが来年度でない場合背景ピンク
            @jinen_style = (@jinen_flg and CommonUtil.konnendo + 1 != @sql_chktrackrecinfos[num]["jinendotenkenY"]) ?
            ' style="background-color:#FFCCFF;"' : ''
            #html明細行を１件ずつ作成
            @html_string +=  '<tr id="rec_a' + num.to_s + '"><td ' + @jinen_style + ' class="yti_info01" rowspan="4"><label><input type="radio" name="yoteisentaku" value="' +
            @sentaku_key + '" id="rec_e' + num.to_s + '"></label></td><td ' + @jinen_style + ' class="yti_info01" rowspan="4">' +
            '<input type="checkbox" name="ikatsusentaku[]" value="' + @sentaku_key + '" id="rec_f' + num.to_s + '" class="ikatu_check"></td>' +
            '<td ' + @jinen_style + ' class="yti_info07" rowspan="2" tabindex="' + (13*num+36).to_s + '">' + @sql_chktrackrecinfos[num]["tenkenyoteiM"].to_s + '月</td>' +
            '<td ' + @jinen_style + ' class="yti_info02" rowspan="2" tabindex="' + (13*num+37).to_s + '">' + @sql_chktrackrecinfos[num]["hachushamei"].to_s.gsub(Str_pattern1,ESCAPE_HTML) + '</td>' +
            '<td ' + @jinen_style + ' class="yti_info02" rowspan="2" tabindex="' + (13*num+38).to_s + '">' + session[:bukenmei][@sql_chktrackrecinfos[num]["bukenCode"]].to_s.gsub(Str_pattern1,ESCAPE_HTML) + '</td>' +
            '<td ' + @jinen_style + ' class="yti_info03"  tabindex="' + (13*num+39).to_s + '">' + session[:shubetumei][@sql_chktrackrecinfos[num]["tenkenshubetu"]].to_s + '</td>' +
            '<td ' + @jinen_style + ' class="yti_info04" rowspan="2" tabindex="' + (13*num+41).to_s + '">' + session[:tantoshamei][@sql_chktrackrecinfos[num]["tenkentantosha1"]].to_s.gsub(Str_pattern1,ESCAPE_HTML) + '</td>' +
            '<td ' + @jinen_style + ' class="yti_info07' + @sql_chktrackrecinfos[num]["tenkenstatus"].to_s + '" id="rec_g' + num.to_s + '" tabindex="' + (13*num+42).to_s + '">' + session[:tenkenstatusmei][@sql_chktrackrecinfos[num]["tenkenstatus"]].to_s + '</td>' +
            '<td ' + @jinen_style + ' class="yti_info08" id="rec_h' + num.to_s + '" tabindex="' + (13*num+44).to_s + '">' + session[:hoshustatusmei][@hoshustatus_id].to_s + '</td>' +
            '<td ' + @jinen_style + ' class="yti_info06" rec_x' + @sql_chktrackrecinfos[num]["bukenCode"].to_s + '" rowspan="2" ' + @to_hoshu +'  tabindex="' + (13*num+46).to_s + '">' + session[:hoshurireki][@sql_chktrackrecinfos[num]["hoshukanrenumu"]].to_s + '</td></tr>' +
            '<tr id="rec_b' + num.to_s + '"><td ' + @jinen_style + ' class="yti_info03_2" tabindex="' + (13*num+40).to_s + '">' + "\u00A5" + number_with_delimiter( @sql_chktrackrecinfos[num]["keiyakukingaku"].round).to_s + '</td>' +
            '<td ' + @jinen_style + ' class="yti_info03" id="rec_i' + num.to_s + '" tabindex="' + (13*num+43).to_s + '">' + @sql_chktrackrecinfos[num]["tenkenkanryoYMD"].to_s + '</td>' +
            '<td ' + @jinen_style + ' class="yti_info03" id="rec_j' + num.to_s + '" tabindex="' + (13*num+45).to_s + '">' + @hoshukanryoYMD.to_s + '</td></tr>' +
            '<tr id="rec_c' + num.to_s + '"><td ' + @jinen_style + ' class="yti_info05" colspan="8" tabindex="' + (13*num+47).to_s + '">' + session[:memo2][@sql_chktrackrecinfos[num]["bukenCode"]].to_s.gsub(Str_pattern1,ESCAPE_HTML) + '</td></tr>' +
            '<tr id="rec_d' + num.to_s + '"><td ' + @jinen_style + ' class="yti_info05" colspan="8" id="rec_k' + num.to_s + '" tabindex="' + (13*num+48).to_s + '">' + @sql_chktrackrecinfos[num]["biko"].to_s.gsub(Str_pattern1,ESCAPE_HTML) + '</td></tr>'

        end
    end

    #テーブル内容セット
    def list_meisai
        session[:bukenmei] = Hash.new
        session[:memo2] =  Hash.new
        session[:shubetumei] = Hash.new
        session[:tantoshamei] = Hash.new
        session[:tenkenstatusmei] = Hash.new
        session[:hoshustatusmei] = Hash.new
        session[:hoshurireki] = Hash.new

        #物件コードから物件名、メモ２を返すハッシュ
        @buken_joho =  MHousinginfo.all.select('bukenCode,bukenmei,memo2')
        @buken_joho.each do |list|
            session[:bukenmei].store(list.bukenCode, list.bukenmei)
            session[:memo2].store(list.bukenCode, list.memo2)
        end

        #点検種別から点検種別名を返すハッシュ
        @shubetu_joho = MKind.where(:shubetuKbn => MKIND_KBN_TENKENSHUBETU).select('shubetu,shubetumei')
        @shubetu_joho.each do |list|
            session[:shubetumei].store(list.shubetu, list.shubetumei)
        end
        #点検担当者コードから点検担当者名を返すハッシュ
        @mcheckpeople_joho = MCheckpeople.select('tenkentantoshaCode,tenkentantoshamei')
        @mcheckpeople_joho.each do |list|
            session[:tantoshamei].store(list.tenkentantoshaCode, list.tenkentantoshamei)
        end
        #点検、補修ステータスコードから点検名、補修名を返すハッシュ
        @minit_joho = MInit.all.limit(1)
        @minit_joho.each do |list|
            session[:tenkenstatusmei].store(1, list.tenkenstatusmei1)
            session[:tenkenstatusmei].store(2, list.tenkenstatusmei2)
            session[:tenkenstatusmei].store(3, list.tenkenstatusmei3)
            session[:tenkenstatusmei].store(4, list.tenkenstatusmei4)
            session[:tenkenstatusmei].store(5, list.tenkenstatusmei5)
            session[:hoshustatusmei].store(1, list.hoshustatusmei1)
            session[:hoshustatusmei].store(2, list.hoshustatusmei2)
            session[:hoshustatusmei].store(3, list.hoshustatusmei3)
            session[:hoshustatusmei].store(4, list.hoshustatusmei4)
            session[:hoshustatusmei].store(5, list.hoshustatusmei5)
            session[:hoshustatusmei].store(6, list.hoshustatusmei6)
        end

        #補修関連有無による表示
        session[:hoshurireki].store(0,'')
        session[:hoshurireki].store(1,'あり(残件あり)')
        session[:hoshurireki].store(2,'あり')

    end

    def repair_info_set(nendo)
        session[:hoshustatus] = Hash.new
        #物件コード(10桁)・年度(4桁)・点検種別(5桁)・点検予定月(2桁)・枝番(2桁)から補修ステータス(3桁)・補修完了日を返すハッシュ
        @mrepairinfo_joho = TRepairInfo.where(:nendo => nendo)
        @mrepairinfo_joho.each do |list|
            session[:hoshustatus].store(format("%010d%04d%05d%02d%02d",list.bukenCode,list.nendo,list.tenkenshubetu,list.tenkenyoteiM, list.edaban), format("%03d",list.hoshuStatus) + list.hoshukanryoYMD.to_s)
        end
    end

    def hoshu_sql(hoshustatus,nendo)
        return " INNER JOIN ( SELECT TRi.bukenCode, TRi.nendo, TRi.tenkenshubetu, TRi.tenkenyoteiM, TRi.edaban, TRi.hoshuStatus
									FROM t_repair_infos AS TRi
									WHERE TRi.hoshuStatus IN (#{hoshustatus})
									AND TRi.nendo IN  (#{nendo}) ) A
					ON TCt.bukenCode = A.bukenCode
					AND TCt.tenkenshubetu = A.tenkenshubetu
					AND TCt.tenkenyoteiM = A.tenkenyoteiM
					AND TCt.edaban = A.edaban"
    end

    #物件コード,年度,点検種別,点検予定月,枝番,補修ステータス,点検ステータス
    #点検ステータス更新
    def transact_tenken_update(list,status)
        #「点検済み」にした場合は完了日をセット
        if status == 2 then
            list.each do |val,key|
                s = val.split(',')
                TChktrackrecInfo.where(:bukenCode => s[0].to_i, :nendo => s[1].to_i, :tenkenshubetu => s[2].to_i, :tenkenyoteiM => s[3].to_i, :edaban => s[4].to_i).update_all(:tenkenstatus => status, :tenkenkanryoYMD => Time.now.strftime("%Y-%m-%d"))
            end
        else
            list.each do |val,key|
                s = val.split(',')
                TChktrackrecInfo.where(:bukenCode => s[0].to_i, :nendo => s[1].to_i, :tenkenshubetu => s[2].to_i, :tenkenyoteiM => s[3].to_i, :edaban => s[4].to_i).update_all(:tenkenstatus => status)
            end
        end
    end

    #補修ステータス更新
    def transact_hoshu_update(list,status)
        #「補修済み」にした場合は完了日をセット
        if status == 3 then
            list.each do |val,key|
                s = val.split(',')
                TRepairInfo.where(:bukenCode => s[0].to_i, :nendo => s[1].to_i, :tenkenshubetu => s[2].to_i, :tenkenyoteiM => s[3].to_i, :edaban => s[4].to_i).update_all(:hoshuStatus => status, :hoshukanryoYMD => Time.now.strftime("%Y-%m-%d"))
            end
        else
            list.each do |val,key|
                s = val.split(',')
                TRepairInfo.where(:bukenCode => s[0].to_i, :nendo => s[1].to_i, :tenkenshubetu => s[2].to_i, :tenkenyoteiM => s[3].to_i, :edaban => s[4].to_i).update_all(:hoshuStatus => status)
            end
        end
    end

end
