class BukenHenkoSakujoController < ApplicationController
    include ActionView::Helpers::NumberHelper
    before_action :mainte_check
    before_action :login_check
    before_action :dialog_init

    #点検情報の表
    #点検種別を 総合・機器12を除いて(11,12は消防設備１行になるため)取得
    @@m_kind_table = MKind.where('shubetuKbn = ? AND shubetu <> ?',MKIND_KBN_TENKENSHUBETU, MKIND_TENKENSHUBETU_KIKI).order('shubetu ASC')
    def index
        #点検種別を 総合・機器12を除いて(11,12は消防設備１行になるため)取得
        @@m_kind_table = MKind.where('shubetuKbn = ? AND shubetu <> ?',MKIND_KBN_TENKENSHUBETU, MKIND_TENKENSHUBETU_KIKI).order('shubetu ASC')
        #点検情報表
        @html_str = ''
        #点検区分セレクトボックス
        @m_kind_t = MKind.where(:shubetuKbn => MKIND_KBN_TENKEN)
        @tenkenKbn =  Hash.new

        @m_kind_t.each do |list|
            @tenkenKbn.store(list.shubetumei,list.shubetu)
        end

        #請求方法セレクトボックス
        @m_kind_s = MKind.where(:shubetuKbn => MKIND_KBN_SEIKYU)
        @seikyuhouhou = Hash.new
        @seikyuhouhou.store('',-1)
        @m_kind_s.each do |list|
            @seikyuhouhou.store(list.shubetumei,list.shubetu)
        end
        #点検実績情報

        #点検開始年度セレクトボックス
        @tenkenkaishiY =  Hash.new
        #年度変更用セレクトボックス
        @tenken_nendo_list = Hash.new
        #点検停止用セレクトボックス
        @tenken_nendo_list_t = Hash.new
        #点検情報から年度を受け取る

        #物件コードは数値なので :first, :secondが数値以外なら表示無効
        #以下（のボタン動作は物件情報、発注者情報が無い(@@bukenCodeと@@hachushaCodeにデータが無い)場合は操作不可＝＞物件検索へ戻る）
        if params[:first].blank? or !(params[:first].to_s =~ /^[0-9]+$/ ) or params[:second].blank? or !(params[:second].to_s =~ /^[0-9]+$/ ) then

            redirect_to :controller => 'buken_kensaku'
            return false
        else

            @@bukenCode = params[:first].to_i
            @@hachushaCode = params[:second].to_i

            #点検開始年度セレクトボックス　再利用の場合、現在の物件マスタから重複を除いて点検開始年度を取得する
            @tenkenkaishiY =  Hash.new

            @tenkenkaishiY_list = MHousinginfo.all.where(:bukenCode => @@bukenCode).select('tenkenkaishiY')
            @tenkenkaishiY.store(@tenkenkaishiY_list[0]["tenkenkaishiY"].to_s + '年度', @tenkenkaishiY_list[0]["tenkenkaishiY"])
            @konnendo = CommonUtil.konnendo
            for num in @konnendo..@konnendo + 1 do
                @tenkenkaishiY.store(num.to_s + '年度',num)
            end

            #現在年度を取得
            @@genzai_nendo = CommonUtil.konnendo

            @tenken_nendo = TCheckInfo.select('nendo').where(:bukenCode => @@bukenCode, :setubishubetuKbn => MKIND_KBN_SETSUBISHUBETU, :tenkenshubetuKbn => MKIND_KBN_TENKENSHUBETU).order('nendo DESC')
            #降順に取得し最初のデータが最新年度
            #もし点検情報が無ければ

            if @tenken_nendo.blank? then
                @tenken_nendo_max = @@genzai_nendo
            elsif 	@tenken_nendo[0]['nendo'] >= @@genzai_nendo - 2 and @tenken_nendo[0]['nendo'] <= @@genzai_nendo + 1 then
                @tenken_nendo_max = @tenken_nendo[0]['nendo']
            else
                (@@genzai_nendo + 1).downto(@@genzai_nendo - 2) { |num|
                    if @tenken_nendo.find{|k,v| k.nendo == num } != nil then
                        @tenken_nendo_max = num
                        break
                    else
                        @tenken_nendo_max = @@genzai_nendo
                    end
                }
            end

            @tenken_nendo_list = CommonUtil.nendo_hash_default(-1,1)
            @tenken_nendo_list_t = CommonUtil.nendo_hash_default(0,1)

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
            #総合テスト追加
            @@moto_hachushamei = @hachushamei
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

            @@tenken_data = @tenken_data
        end
        #デフォルトは登録されている最新年度で点検情報を検索
        @checkInfo = make_tracinfo_hash(@@bukenCode, @tenken_nendo_max)
        #@checkInfo = TCheckInfo.where(:bukenCode => @@bukenCode, :nendo => @tenken_nendo_max, :setubishubetuKbn => MKIND_KBN_SETSUBISHUBETU, :tenkenshubetuKbn => MKIND_KBN_TENKENSHUBETU).order('tenkenshubetu ASC, kaisumeisai ASC')
        tenkenjoho_table(@checkInfo,@tenken_nendo_max)
        render :layout => 'menu'

    end

    #ボタンクリック処理
    def commit
        #ダイアログタイトルが入力確認
        @mes_title = 1
        #エラーフォーカス
        @focus = ""
        #押されたボタンの種類
        @commit_kind = params[:commit]
        if @commit_kind == '物件検索へ戻る' then
            @error = 1
            @query_str = 'buken_kensaku/index/'
        elsif @commit_kind == '物件詳細参照へ' then
            @error = 1
            @query_str = 'buken_joho_shosai/index/' + @@bukenCode.to_s + '/' + @@hachushaCode.to_s

        elsif @commit_kind == '発注者情報変更' then
            if params[:hachushamei] == '' then
                @error_message[0] = MESSAGE_16[0]
                @error_message[1] = '発注者が未入力です。'
                @error_message[2] = MESSAGE_16[2]
                @focus = "id_txt_BTR_Hachushamei"

                #↓総合テスト修正	 元の発注者名以外で重複していたらエラー
            elsif params[:nm_Hid_HachushaCode] == '0' and @@moto_hachushamei != params[:hachushamei] and MOrderingpatry.where(:hachushamei => params[:hachushamei]).exists? then
                @error_message = MESSAGE_22
                #↑
            else
                @error_message  = MESSAGE_29
                #ダイアログタイトルが確認
                @mes_title = 2
                update_orderingpatry(false)
            end
        elsif @commit_kind == '発注者新規登録' then
            if params[:hachushamei] == '' then
                @error_message[0] = MESSAGE_16[0]
                @error_message[1] = '発注者が未入力です。'
                @error_message[2] = MESSAGE_16[2]
                @focus = "id_txt_BTR_Hachushamei"
                #発注者選択から選ばず、且つ既に発注者名が登録されている場合
            elsif params[:nm_Hid_HachushaCode] == '0' and MOrderingpatry.where(:hachushamei => params[:hachushamei]).exists? then
                @error_message = MESSAGE_22
            else
                @error_message  = MESSAGE_30
                #ダイアログタイトルが確認
                @mes_title = 2
                update_orderingpatry(true)
            end
        elsif @commit_kind == '発注者検索' then
            @error = 2
            @query_str = 'hachusha_kensaku/index'
        elsif @commit_kind == '物件情報変更' then

            @mes_str = ''
            @mes_str += params[:bukenmei] == '' ? '物件名 ' : ''
            @mes_str += params[:tenkenkaishiY] == '' ? '点検開始年度 ' : ''
            @mes_str += params[:tenkenKbn] == '' ? '点検区分 ' : ''
            logger.debug("物件情報変更:" + @mes_str)
            if @mes_str != '' then
                @mes_str += MESSAGE_16[1]
                @error_message[0] = MESSAGE_16[0]
                @error_message[1] = @mes_str
                #エラー時のフォーカス
                @focus = "id_txt_BTR_Bukenmei"
            else
                update_housing
            end
        elsif @commit_kind == '年度切替' then
            nendo_kirikae
        elsif @commit_kind == '点検情報変更' or @commit_kind == '点検情報追加' or @commit_kind == '点検情報削除' then
            #チェックされている点検種別を配列にセットする
            @shubetu = Array.new
            #@shubetu = ''
            #選択チェックひとつでもチェックされていたらOK
            @@m_kind_table.each do |list|
                logger.debug("list.shubetu" + list.shubetu.to_s)
                if (params['sentaku' + list.shubetu.to_s].to_s != '')
                    #@shubetu += list.shubetu.to_s + ','
                    @shubetu.push(list.shubetu)
                    if params['sentaku' + list.shubetu.to_s].to_s == MKIND_TENKENSHUBETU_SOUGOU.to_s then
                        @shubetu.push(MKIND_TENKENSHUBETU_KIKI)
                    end
                    logger.debug("@shubetu" + @shubetu.to_s)
                end
            end
            #logger.debug("@shubetu.count" + @shubetu.count.to_s)
            if @shubetu.count == 0 then
                #チェックなければエラー
                @error_message[0] = MESSAGE_36[0]
                @error_message[1] = @commit_kind.slice(-2,2) + MESSAGE_36[1]
                @error_message[2] = MESSAGE_36[2]
            else
                #↓
                @error_message = CommonUtil.buken_toroku_henshu_check(params,@@m_kind_table)
                if @error_message[0] == "" then
                    #↑
                    if @commit_kind == '点検情報変更' then
                        #変更の場合、削除の後insertする
                        transact_update_tcheck(@shubetu)
                    elsif @commit_kind == '点検情報追加' then
                        transact_insert_tcheck(@shubetu)
                    elsif @commit_kind == '点検情報削除' then
                        #変更年度セレクトボックスの値、確認メッセージ、遷移先をセットする
                        #urlクエリは配列では渡せない(?)ので文字列にする
                        @shubetu_str = @shubetu.join(",")
                        transact_del_stop_tcheck(params[:nendo_kirikae],MESSAGE_83,'buken_henko_kanryo/delete_tenken/',@shubetu_str)
                    end

                    #↓
                end
                #↑
            end
        elsif @commit_kind == '点検停止' then
            #点検停止セレクトボックスの値が選択されていない場合
            if params[:teishi_nendo] == '' then
                @error_message = MESSAGE_41
            else
                #点検停止セレクトボックスの値、確認メッセージ、遷移先をセットする
                transact_del_stop_tcheck(params[:teishi_nendo],MESSAGE_84,'buken_henko_kanryo/stop_tenken/',nil)
            end
        end

        logger.debug("@error_message[1]:" + @error_message[1])
    end

    #発注者変更/新規登録
    def update_orderingpatry(insert_flg)
        # params[:nm_Hid_HachushaCode].blank?
        @hachusha_joho = Hash.new
        #発注者検索から発注者を選んでいない:false
        #発注者検索から発注者を選んだ:true
        @sentaku_flg =  (params[:nm_Hid_HachushaCode] != '0')

        @hachusha_joho.store("old_hachushaCode",@@hachushaCode)
        @hachusha_joho.store("sentaku_hachushaCode",params[:nm_Hid_HachushaCode])

        @hachusha_joho.store("hachushamei", params[:hachushamei])
        @hachusha_joho.store("hachuTandoshamei", params[:hachuTantoshamei])
        @hachusha_joho.store("hachuPostno", params[:hachuPostno1] + params[:hachuPostno2])
        @hachusha_joho.store("hachuAdrs", params[:hachuAdrs])
        @hachusha_joho.store("hachuTelno", params[:hachuTelno])
        @hachusha_joho.store("hachuFaxno", params[:hachuFaxno])
        @hachusha_joho.store("insert_flg", insert_flg)
        @hachusha_joho.store("bukenCode", @@bukenCode)
        @hachusha_joho.store("sentaku_flg", @sentaku_flg)
        logger.debug("@hachusha_joho_HachushaCode]" +@hachusha_joho["hachushaCode"].to_s)
        @error = 1
        @query_str = 'buken_henko_kanryo/update_hachusha/' + @hachusha_joho.to_query
    end

    def update_housing
        @buken_joho = Hash.new
        if params[:nm_Hid_HachushaCode] == '0' then
            @buken_joho.store("hachushaCode",@@hachushaCode)
        else
            @buken_joho.store("hachushaCode",params[:nm_Hid_HachushaCode])
        end
        @buken_joho.store("bukenCode", @@bukenCode)
        @buken_joho.store("bukenmei", params[:bukenmei])
        @buken_joho.store("bukenTantoshamei", params[:bukenTantoshamei])
        @buken_joho.store("bukenPostno", params[:bukenPostno1] + params[:bukenPostno2])
        @buken_joho.store("bukenAdrs", params[:bukenAdrs])
        @buken_joho.store("bukenTelno", params[:bukenTelno])
        @buken_joho.store("bukenFaxno", params[:bukenFaxno])
        @buken_joho.store("tenkenkaishiY", params[:tenkenkaishiY])
        @buken_joho.store("tenkenKbn", params[:tenkenKbn])
        @buken_joho.store("seikyuhouhou", params[:seikyuhouhou])
        @buken_joho.store("memo1", params[:memo1])
        @buken_joho.store("memo2", params[:memo2])
        logger.debug("@buken_joho" + @buken_joho.to_s)
        @error = 1
        @query_str = 'buken_henko_kanryo/update_buken/' + @buken_joho.to_query
    end

    def tenkentantosha_select_box(tenkentantosha_Code,m_check_moto)
        #点検担当者セレクトボックス一覧作成

        @m_check_html = '<option value=""></option>'
        if (tenkentantosha_Code == 0) then
            m_check_moto.each do | x |
                #削除フラグがあったら×印、なければ全角空白
                @flg = (x.sakujyoFlg == 1) ? '×' : ''
                #種別が外注ならば◆印
                @flg_b = (x.tenkentantoshashubetu == MKIND_TENKENTANTOSHA_GAICHU) ? '◆' : ''
                #valueに１桁の削除フラグ、３桁の点検担当者種別、１０桁の点検担当者コードを設定（いずれも０埋め）
                @m_check_html += '<option value="' + x.sakujyoFlg.to_s + format("%03d",x.tenkentantoshashubetu) +
                format("%010d",x.tenkentantoshaCode) + '">' + @flg + x.tenkentantoshamei.gsub(Str_pattern1,ESCAPE_HTML) + @flg_b + '</option>'
            end
        else
            m_check_moto.each do | x |
                #削除フラグがあったら×印、なければ全角空白
                @flg = (x.sakujyoFlg == 1) ? '×' : ''
                #種別が外注ならば◆印
                @flg_b = (x.tenkentantoshashubetu == MKIND_TENKENTANTOSHA_GAICHU) ? '◆' : ''
                #valueに１桁の削除フラグ、３桁の点検担当者種別、１０桁の点検担当者コードを設定（いずれも０埋め）
                @m_check_html += x.tenkentantoshaCode == tenkentantosha_Code ?
                '<option value="' + x.sakujyoFlg.to_s +
                format("%03d",x.tenkentantoshashubetu) +
                format("%010d",x.tenkentantoshaCode) + '" selected>' +
                @flg + x.tenkentantoshamei.gsub(Str_pattern1,ESCAPE_HTML) + @flg_b + '</option>':
                '<option value="' + x.sakujyoFlg.to_s +
                format("%03d",x.tenkentantoshashubetu) +
                format("%010d",x.tenkentantoshaCode) + '">' +
                @flg + x.tenkentantoshamei.gsub(Str_pattern1,ESCAPE_HTML) + @flg_b + '</option>'
            end
        end
        return @m_check_html
    end

    #
    def init_MCheckinfo(t_check_info, maintantosha_no, arr ,default_yoteiM_html, default_tenkentantosha_select_str, check_radio, tenkenyoteiM1_str,keiyakukingaku,track_id)
        #データ無し（初期状態のオブジェクト）
        for i in 0..1 do
            keiyakukingaku[i] = ''
            t_check_info[i].boukataishobututenkenkaisu = ''
            maintantosha_no[i] = [' checked ','','','','','','','','','']
            tenkenyoteiM1_str[i] = default_yoteiM_html
            track_id[i] = ''
            for j in 0..9 do
                arr[2 * i][j] = default_tenkentantosha_select_str
                arr[2 * i + 1][j] = ''
            end
        end
        check_radio[0] = ' checked '
        check_radio[1] = ''
        check_check = ''
        offset = 0
    end

    def transact_update_tcheckinfo(hachushaCode,bukenCode,nendo, inser_flg )

        @@m_kind_table.each do |list|
            #チェックされたデータ（params['sentaku+種別(2桁)']=種別となるデータ）を
            #１行ずつ(種別ごと) tcheckinfoにinsertする
            if (params['sentaku' + list.shubetu.to_s].to_s == list.shubetu.to_s) then
                #点検回数分(1回or2回)insert
                @tenkenkaisu = params['tenkenkaisu' + list.shubetu.to_s].to_i
                #防火対象物回数は種別=21(防火対象物)のとき、その回数をセット
                @boukatenkenkaisu = ( list.shubetu == MKIND_TENKENSHUBETU_BOUKATAISHOBUTU ) ? params[:boukatenkenkaisu].to_i : 0
                for num in 1..@tenkenkaisu do

                    #種別は総合の場合、2行目種別は12(:総合・機器)をセット
                    @shubetu = ( list.shubetu == MKIND_TENKENSHUBETU_SOUGOU && num == 2) ? MKIND_TENKENSHUBETU_KIKI : list.shubetu

                    @t_check_info = TCheckInfo.new
                    @t_check_info.bukenCode = bukenCode
                    @t_check_info.hachushaCode = hachushaCode
                    @t_check_info.nendo = nendo #params[:tenkenkaishiY]
                    @t_check_info.seikyuhouhou = params[:seikyuhouhou]
                    @t_check_info.setubishubetuKbn = MKIND_KBN_SETSUBISHUBETU
                    #設備種別は点検種別を１０で割った数
                    @t_check_info.setubishubetu = GetSetsubishubetu[list.shubetu]
                    @t_check_info.tenkenshubetuKbn = MKIND_KBN_TENKENSHUBETU
                    @t_check_info.tenkenshubetu = @shubetu
                    @t_check_info.nenkantenkenkaisu = @tenkenkaisu
                    @t_check_info.tenkenyoteiM1 = params['tenkenyoteiM' + list.shubetu.to_s + '_' + num.to_s]
                    @t_check_info.kaisumeisai = num
                    #金額はカンマと円記号を削除
                    @t_check_info.keiyakukingaku1 = params['keiyakukingaku' + list.shubetu.to_s + '_' + num.to_s].delete(',').delete("\u00A5").to_i
                    @t_check_info.keiyakukingaku2 = 0
                    @t_check_info.boukataishobututenkenkaisu = @boukatenkenkaisu
                    #点検担当者の１桁の削除フラグ、３桁の点検担当者種別を除去（３桁目から１０桁分セット）

                    @t_check_info.tenkentantosha1 = params["tenkentantousha#{list.shubetu}_#{num}_1"].slice(4,10).to_i
                    @t_check_info.tenkentantosha2 = params["tenkentantousha#{list.shubetu}_#{num}_2"].slice(4,10).to_i
                    @t_check_info.tenkentantosha3 = params["tenkentantousha#{list.shubetu}_#{num}_3"].slice(4,10).to_i

                    #@t_check_info.gaichuhi1 = params['gaichuhi' + list.shubetu.to_s + '_' + num.to_s + '_' + '1'].delete(',').delete("\u00A5").to_i
                    @t_check_info.gaichuhi1 = params["gaichuhi#{list.shubetu}_#{num}_1"].delete(',').delete("\u00A5").to_i
                    @t_check_info.gaichuhi2 = params["gaichuhi#{list.shubetu}_#{num}_2"].delete(',').delete("\u00A5").to_i
                    @t_check_info.gaichuhi3 = params["gaichuhi#{list.shubetu}_#{num}_3"].delete(',').delete("\u00A5").to_i

                    #次年度点検Y＝点検区分が４(スポット)なら０、それ以外なら年度＋点検区分
                    @t_check_info.jinendotenkenY = (@@tenken_data != 4) ? (nendo.to_i + @@tenken_data.to_i) : 0

                    #消防設備の場合点検担当者、外注費４～１０を登録
                    if (list.shubetu == MKIND_TENKENSHUBETU_SOUGOU or list.shubetu == MKIND_TENKENSHUBETU_KIKI) then
                        @t_check_info.tenkentantosha4 = params["tenkentantousha#{list.shubetu}_#{num}_4"].slice(4,10).to_i
                        @t_check_info.tenkentantosha5 = params["tenkentantousha#{list.shubetu}_#{num}_5"].slice(4,10).to_i
                        @t_check_info.tenkentantosha6 = params["tenkentantousha#{list.shubetu}_#{num}_6"].slice(4,10).to_i
                        @t_check_info.tenkentantosha7 = params["tenkentantousha#{list.shubetu}_#{num}_7"].slice(4,10).to_i
                        @t_check_info.tenkentantosha8 = params["tenkentantousha#{list.shubetu}_#{num}_8"].slice(4,10).to_i
                        @t_check_info.tenkentantosha9 = params["tenkentantousha#{list.shubetu}_#{num}_9"].slice(4,10).to_i
                        @t_check_info.tenkentantosha10 = params["tenkentantousha#{list.shubetu}_#{num}_10"].slice(4,10).to_i

                        @t_check_info.gaichuhi4 = params["gaichuhi#{list.shubetu}_#{num}_4"].delete(',').delete("\u00A5").to_i
                        @t_check_info.gaichuhi5 = params["gaichuhi#{list.shubetu}_#{num}_5"].delete(',').delete("\u00A5").to_i
                        @t_check_info.gaichuhi6 = params["gaichuhi#{list.shubetu}_#{num}_6"].delete(',').delete("\u00A5").to_i
                        @t_check_info.gaichuhi7 = params["gaichuhi#{list.shubetu}_#{num}_7"].delete(',').delete("\u00A5").to_i
                        @t_check_info.gaichuhi8 = params["gaichuhi#{list.shubetu}_#{num}_8"].delete(',').delete("\u00A5").to_i
                        @t_check_info.gaichuhi9 = params["gaichuhi#{list.shubetu}_#{num}_9"].delete(',').delete("\u00A5").to_i
                        @t_check_info.gaichuhi10 = params["gaichuhi#{list.shubetu}_#{num}_10"].delete(',').delete("\u00A5").to_i
                    end

                    #メイン点検担当者番号はメイン点検担当者ボタン番号をもつ点検担当者
                    @t_check_info.maintantosha = params['tenkentantousha' + list.shubetu.to_s + '_' + num.to_s + '_' + params['meintantousha' + list.shubetu.to_s + '_' + num.to_s].to_s].slice(4,10).to_i

                    @t_check_info.save!

                    #点検実績情報への追加、更新
                    #insert_flgがtrueまたはレコードが点検実績情報になければ挿入
                    logger.debug('更新track_id' + list.shubetu.to_s + '_' + num.to_s + ':' + params['track_id' + list.shubetu.to_s + '_' + num.to_s])
                    if inser_flg or params['track_id' + list.shubetu.to_s + '_' + num.to_s] == '' then
                        @t_chktrack_info = TChktrackrecInfo.new
                        @t_chktrack_info.bukenCode = bukenCode
                        @t_chktrack_info.nendo = nendo
                        @t_chktrack_info.checkFlg = 0
                        @t_chktrack_info.setubishubetuKbn = MKIND_KBN_SETSUBISHUBETU
                        @t_chktrack_info.setubishubetu = GetSetsubishubetu[list.shubetu]
                        @t_chktrack_info.tenkenshubetuKbn = MKIND_KBN_TENKENSHUBETU
                        @t_chktrack_info.tenkenshubetu = @shubetu
                        @t_chktrack_info.edaban = 0
                        @t_chktrack_info.tenkenyoteiM = params['tenkenyoteiM' + list.shubetu.to_s + '_' + num.to_s]
                        @t_chktrack_info.keiyakukingaku = params['keiyakukingaku' + list.shubetu.to_s + '_' + num.to_s].delete(',').delete("\u00A5").to_i
                        @t_chktrack_info.gaichuhi = 0
                        @t_chktrack_info.tenkenkanryoYMD = nil
                        @t_chktrack_info.tenkenstatus = 1
                        @t_chktrack_info.jinko = 0
                        @t_chktrack_info.hoshuumu = 2
                        @t_chktrack_info.biko = ''
                        @t_chktrack_info.hoshukanrenumu = 0

                        @t_chktrack_info.save!
                        #insert_flgがfalseかつレコードがあれば更新
                        #物件コード、年度、設備種別区分、設備種別、点検種別区分、点検種別をキーに 点検予定月、契約金額を更新
                    else
                        TChktrackrecInfo.where(:bukenCode => @@bukenCode, :nendo => params[:nendo_kirikae], :tenkenshubetu => @shubetu).update_all(:tenkenyoteiM => params['tenkenyoteiM' + list.shubetu.to_s + '_' + num.to_s],
                        :keiyakukingaku => params['keiyakukingaku' + list.shubetu.to_s + '_' + num.to_s].delete(',').delete("\u00A5").to_i )
                    end
                end

            end

        end

    end

    #種別マスタを元に表を作り、点検情報からデータを入れる
    def tenkenjoho_table(checkInfo, nendo)
        #点検情報表の作成
        @html_str = ''

        #点検担当者の一覧取得
        @m_check_moto = MCheckpeople.where(:tenkentantoshashubetuKbn => 0).order('sakujyoFlg,tenkentantoshashubetu')
        #"選択無し"のセレクトボックス作成
        @default_tenkentantosha_select_str = tenkentantosha_select_box(0,@m_check_moto)

        #点検予定月セレクトボックス作成
        @default_yoteiM_html = CommonUtil.get_kaishiM_selectbox_html(0)
        @m_yoteiM_html_kaishi = CommonUtil.get_kaishiM_selectbox_html(CommonUtil.kaishiM)

        #M種別から表示する種別を取得　種別=12の'消防設備(機器)'は'消防設備(総合)'とダブるため除外
        @m_kind_table = MKind.where('shubetuKbn = ? AND shubetu <> ?',MKIND_KBN_TENKENSHUBETU, MKIND_TENKENSHUBETU_KIKI)

        #点検情報を取得
        #年間点検回数分(Max2回)のモデルハッシュを確保
        @t_check_info = Array.new(MaxMmeisai).map{ TCheckInfo.new() }

        #点検情報の表
        #添字0,2:点検担当者の一覧、 添字1,3:外注費
        arr = Array.new(4).map{Array.new(10)}
        #年間点検回数のラジオボタン
        check_radio = Array.new(MaxMmeisai)
        #メイン点検担当者のラジオボタンのチェック
        @maintantosha_no = Array.new(MaxMmeisai).map{Array.new(10,'')}
        #点検予定月の一覧
        tenkenyoteiM1_str = Array.new(MaxMmeisai)
        #契約金額
        keiyakukingaku = Array.new(MaxMmeisai)

        #契約金額
        track_id = Array.new(MaxMmeisai)

        @@m_kind_table.each do |list|

            init_MCheckinfo(@t_check_info, @maintantosha_no, arr ,@default_yoteiM_html, @default_tenkentantosha_select_str, check_radio, tenkenyoteiM1_str,keiyakukingaku,track_id)
            check_check = ''
            offset = 0
            #点検情報にあるデータからデータをセット
            checkInfo.each do |t_check|
                #作成する表の種別shubetuと点検情報のtenkenshubetuが等しいときセット
                #総合、機器は同じ行

                if list.shubetu == t_check["tenkenshubetu"] or
                ( list.shubetu == MKIND_TENKENSHUBETU_SOUGOU and t_check["tenkenshubetu"] == MKIND_TENKENSHUBETU_KIKI ) then

                    tenkenyoteiM1_str[offset] = CommonUtil.get_kaishiM_selectbox_html(t_check["tenkenyoteiM1"])

                    keiyakukingaku[offset] = "\u00A5" + number_with_delimiter(t_check["keiyakukingaku1"].round)
                    track_id[offset] = t_check["id"].to_s
                    @t_check_info[offset].boukataishobututenkenkaisu = t_check["boukataishobututenkenkaisu"]
                    #点検担当者が0のときは選択されていないセレクトボックス、そうでなければその担当者が選択されているセレクトボックス
                    if t_check["tenkentantosha1"] != 0 then arr[2 * offset][0] = tenkentantosha_select_box(t_check["tenkentantosha1"],@m_check_moto) end
                    if t_check["tenkentantosha2"] != 0 then arr[2 * offset][1] = tenkentantosha_select_box(t_check["tenkentantosha2"],@m_check_moto) end
                    if t_check["tenkentantosha3"] != 0 then arr[2 * offset][2] = tenkentantosha_select_box(t_check["tenkentantosha3"],@m_check_moto) end

                    if t_check["gaichuhi1"] != 0 and t_check["gaichuhi1"] != nil then arr[2 * offset + 1][0] = "\u00A5" + number_with_delimiter(t_check["gaichuhi1"].round) end
                    if t_check["gaichuhi2"] != 0 and t_check["gaichuhi2"] != nil then arr[2 * offset + 1][1] = "\u00A5" + number_with_delimiter(t_check["gaichuhi2"].round) end
                    if t_check["gaichuhi3"] != 0 and t_check["gaichuhi3"] != nil then arr[2 * offset + 1][2] = "\u00A5" + number_with_delimiter(t_check["gaichuhi3"].round) end

                    check_radio[(offset + 1) % MaxMmeisai] = ''
                    check_radio[offset] = ' checked '
                    check_check = ' checked '

                    if  t_check["tenkentantosha1"] != 0 && t_check["tenkentantosha1"] == t_check["maintantosha"] then @maintantosha_no[offset][0] = ' checked ' end
                    if  t_check["tenkentantosha2"] != 0 && t_check["tenkentantosha2"] == t_check["maintantosha"] then @maintantosha_no[offset][1] = ' checked ' end
                    if  t_check["tenkentantosha3"] != 0 && t_check["tenkentantosha3"] == t_check["maintantosha"] then @maintantosha_no[offset][2] = ' checked ' end

                    #消防設備の場合点検担当者、外注費４～１０をセット
                    if (list.shubetu == MKIND_TENKENSHUBETU_SOUGOU or list.shubetu == MKIND_TENKENSHUBETU_KIKI) then
                        if t_check["tenkentantosha4"] != 0 then arr[2 * offset][3] = tenkentantosha_select_box(t_check["tenkentantosha4"],@m_check_moto) end
                        if t_check["tenkentantosha5"] != 0 then arr[2 * offset][4] = tenkentantosha_select_box(t_check["tenkentantosha5"],@m_check_moto) end
                        if t_check["tenkentantosha6"] != 0 then arr[2 * offset][5] = tenkentantosha_select_box(t_check["tenkentantosha6"],@m_check_moto) end
                        if t_check["tenkentantosha7"] != 0 then arr[2 * offset][6] = tenkentantosha_select_box(t_check["tenkentantosha7"],@m_check_moto) end
                        if t_check["tenkentantosha8"] != 0 then arr[2 * offset][7] = tenkentantosha_select_box(t_check["tenkentantosha8"],@m_check_moto) end
                        if t_check["tenkentantosha9"] != 0 then arr[2 * offset][8] = tenkentantosha_select_box(t_check["tenkentantosha9"],@m_check_moto) end
                        if t_check["tenkentantosha10"] != 0 then arr[2 * offset][9] = tenkentantosha_select_box(t_check["tenkentantosha10"],@m_check_moto) end

                        if t_check["gaichuhi4"] != 0 and t_check["gaichuhi4"] != nil then arr[2 * offset + 1][3] = "\u00A5" + number_with_delimiter(t_check["gaichuhi4"].round) end
                        if t_check["gaichuhi5"] != 0 and t_check["gaichuhi5"] != nil then arr[2 * offset + 1][4] = "\u00A5" + number_with_delimiter(t_check["gaichuhi5"].round) end
                        if t_check["gaichuhi6"] != 0 and t_check["gaichuhi6"] != nil then arr[2 * offset + 1][5] = "\u00A5" + number_with_delimiter(t_check["gaichuhi6"].round) end
                        if t_check["gaichuhi7"] != 0 and t_check["gaichuhi7"] != nil then arr[2 * offset + 1][6] = "\u00A5" + number_with_delimiter(t_check["gaichuhi7"].round) end
                        if t_check["gaichuhi8"] != 0 and t_check["gaichuhi8"] != nil then arr[2 * offset + 1][7] = "\u00A5" + number_with_delimiter(t_check["gaichuhi8"].round) end
                        if t_check["gaichuhi9"] != 0 and t_check["gaichuhi9"] != nil then arr[2 * offset + 1][8] = "\u00A5" + number_with_delimiter(t_check["gaichuhi9"].round) end
                        if t_check["gaichuhi10"] != 0 and t_check["gaichuhi10"] != nil then arr[2 * offset + 1][9] ="\u00A5" + number_with_delimiter(t_check["gaichuhi10"].round) end

                        if  t_check["tenkentantosha4"] != 0 && t_check["tenkentantosha4"] == t_check["maintantosha"] then @maintantosha_no[offset][3] = ' checked ' end
                        if  t_check["tenkentantosha5"] != 0 && t_check["tenkentantosha5"] == t_check["maintantosha"] then @maintantosha_no[offset][4] = ' checked ' end
                        if  t_check["tenkentantosha6"] != 0 && t_check["tenkentantosha6"] == t_check["maintantosha"] then @maintantosha_no[offset][5] = ' checked ' end
                        if  t_check["tenkentantosha7"] != 0 && t_check["tenkentantosha7"] == t_check["maintantosha"] then @maintantosha_no[offset][6] = ' checked ' end
                        if  t_check["tenkentantosha8"] != 0 && t_check["tenkentantosha8"] == t_check["maintantosha"] then @maintantosha_no[offset][7] = ' checked ' end
                        if  t_check["tenkentantosha9"] != 0 && t_check["tenkentantosha9"] == t_check["maintantosha"] then @maintantosha_no[offset][8] = ' checked ' end
                        if  t_check["tenkentantosha10"] != 0 && t_check["tenkentantosha10"] == t_check["maintantosha"] then @maintantosha_no[offset][9] = ' checked ' end
                    end
                    #同じ種別の場合次の行offsetが1
                    offset = ( offset + 1 ) % MaxMmeisai

                    #残り明細行

                    #２行目もデータを入れたら同じ種別はもう無いのでbreak
                    if offset == 0 then
                        break
                    end
                else

                end
            end

            @gyousu = 0
            #点検種別
            #「選択」～「防火対象物」列のhtml(種別によって異なる)
            case list.shubetu
            #消防設備(総合)
            when MKIND_TENKENSHUBETU_SOUGOU then
                #「点検予定月」～「外注費」までの行数
                @gyousu = 2
                @tanto_suu = 10
                @style_s = "0"
                #「選択」～「防火対象物」列のhtml
                @html_str += '<div class="btr_info01"><input id="sentaku' + list.shubetu.to_s + '" name="sentaku' + list.shubetu.to_s  +  '" type="checkbox" value="' + list.shubetu.to_s + '" ' + check_check + '/></div>' + '<div class="btr_info02">消防設備</div>' + '<div class="btr_info03">' + '<label><input class="rad_ttr" id="tenkenkaisu' + list.shubetu.to_s + '_1" name="tenkenkaisu' + list.shubetu.to_s + '" type="radio" value="1" ' + check_radio[0] + '/>総合のみ(１回)</label><br>' + '<label><input id="tenkenkaisu' + list.shubetu.to_s + '_2" name="tenkenkaisu' + list.shubetu.to_s + '" type="radio" value="2" ' + check_radio[1] + '/>総合･機器(２回)</label>' + '</div>' + '<div class="btr_info04"></div>'

                #防火対象物
            when MKIND_TENKENSHUBETU_BOUKATAISHOBUTU then
                @gyousu = 1
                @tanto_suu = 3
                @style_s = "2"
                @html_str += '<div class="btr_info29"><input id="sentaku' + list.shubetu.to_s + '" name="sentaku' + list.shubetu.to_s + '" type="checkbox" value="' + list.shubetu.to_s + '" ' + check_check + '/></div>' + '<div class="btr_info30">' + list.shubetumei + '</div>' + '<div class="btr_info31">' + '<label><input id="tenkenkaisu' + list.shubetu.to_s + '_1" name="tenkenkaisu' + list.shubetu.to_s + '" type="radio" value="1" ' + check_radio[0] + '/>１回</label>' + '</div>' + '<div class="btr_info32">' + '<input class="klimit-digit input_11" id="id_txt_BTR_boukatenkenkaisu" maxlength="3" name="boukatenkenkaisu" type="text" value="' + @t_check_info[0].boukataishobututenkenkaisu.to_s + '" /><div style="margin-top:4px;">回目</div></div>'
                #連結送水管耐圧
            when MKIND_TENKENSHUBETU_RENKETSUSOU then
                @gyousu = 1
                @tanto_suu = 3
                @style_s = "2"
                @html_str += '<div class="btr_info29"><input id="sentaku' + list.shubetu.to_s + '" name="sentaku' + list.shubetu.to_s + '" type="checkbox" value="' + list.shubetu.to_s + '" ' + check_check + '/></div>' + '<div class="btr_info30">' + list.shubetumei + '</div>' + '<div class="btr_info31">' + '<label><input id="tenkenkaisu' + list.shubetu.to_s + '_1" name="tenkenkaisu' + list.shubetu.to_s + '" type="radio" value="1" ' + check_radio[0] + '/>１回</label>'  + '</div>' + '<div class="btr_info32"></div>'
            else
                @gyousu = 2
                @tanto_suu = 3
                @style_s = "2"
                @html_str += '<div class="btr_info21"><input id="sentaku' + list.shubetu.to_s + '" name="sentaku' + list.shubetu.to_s + '" type="checkbox" value="' + list.shubetu.to_s + '" ' + check_check + '/></div>' + '<div class="btr_info22">' + list.shubetumei + '</div>' + '<div class="btr_info23">' + '<label><input class="rad_ttr" id="tenkenkaisu' + list.shubetu.to_s + '_1" name="tenkenkaisu' + list.shubetu.to_s + '" type="radio" value="1" ' + check_radio[0] + '/>１回</label><br>' + '<label><input id="tenkenkaisu' + list.shubetu.to_s + '_2" name="tenkenkaisu' + list.shubetu.to_s + '" type="radio" value="2" ' + check_radio[1] + '/>２回</label>' + '</div>' + '<div class="btr_info24"></div>'
            end

            #「点検予定月」～「外注費」までのhtml
            for num in 1..@gyousu do
                @selectbox = (check_check != ' checked ' and num == 1) ? @m_yoteiM_html_kaishi : tenkenyoteiM1_str[num-1]

                #点検予定月
                @html_str += '<div class="btr_info' + @style_s + '5"><select class="select_100" id="id_cmb_BTR_Tenkenyoteim' + list.shubetu.to_s + '_' + num.to_s + '" name="tenkenyoteiM' + list.shubetu.to_s + '_' + num.to_s + '" value="">' + @selectbox + '</select></div>'

                #契約金額
                @html_str += '<div class="btr_info' + @style_s + '6"><input class="klimit-digit input_9" maxlength="12" id="id_txt_BTR_keiyakukingaku' + list.shubetu.to_s + '_' + num.to_s + '" name="keiyakukingaku' + list.shubetu.to_s + '_' + num.to_s + '" type="text" value="' + keiyakukingaku[num-1].to_s + '"/></div>'

                #点検実績情報id
                @html_str += '<input name="track_id' + list.shubetu.to_s + '_' + num.to_s + '" type="hidden" value="' + track_id[num-1] + '"/>'
                #メイン点検担当者
                #初期チェックする位置
                #@checked = [' checked ','','','','','','','','','',]

                @html_str += '<div class="btr_info' + @style_s + '7">'
                for index in 1..@tanto_suu do
                    @html_str += '<label><input ' + @maintantosha_no[num-1][index-1] + ' id="meintantousha' + list.shubetu.to_s + '_' + num.to_s + '_' + index.to_s + '" name="meintantousha' + list.shubetu.to_s + '_' + num.to_s + '" class="rad_ttr" type="radio" value="' + index.to_s + '" tabindex="-1" /></label><br>'
                end
                @html_str += '</div>'

                #点検担当者		<option value=""></option>
                @html_str += '<div class="btr_info' + @style_s + '8">'
                for index in 1..@tanto_suu do
                    @html_str += '<select class="select_115" id="id_cmb_BTR_Tenkentantousha' + list.shubetu.to_s + '_' + num.to_s + '_' + index.to_s + '" name="tenkentantousha' + list.shubetu.to_s + '_' + num.to_s + '_' + index.to_s + '" value="' + '' + '"  >' + arr[2*num-2][index-1] + '</select>'
                end
                @html_str += '</div>'

                #外注費
                @html_str += '<div class="btr_info' + @style_s + '8">'
                for index in 1..@tanto_suu do
                    @html_str += '<input class="klimit-digit input_10" maxlength="12" id="id_txt_BTR_gaichuhi' + list.shubetu.to_s + '_' + num.to_s + '_' + index.to_s + '" name="gaichuhi' + list.shubetu.to_s + '_'  + num.to_s + '_' + index.to_s + '"  type="text" value="' + arr[2*num-1][index-1].to_s + '" />'
                    #logger.debug('arr[2*num-1][index-1].to_s' + arr[2*num-1][index-1].to_s)
                end
                @html_str += '</div>'
            end
            @html_str += '<div class="kugiri"></div>'

        end
        #return @html_str
    end

    #年度切替クリック
    def nendo_kirikae
        @checkInfo = TCheckInfo.where(:bukenCode => @@bukenCode, :nendo => params[:nendo_kirikae], :setubishubetuKbn => MKIND_KBN_SETSUBISHUBETU, :tenkenshubetuKbn => MKIND_KBN_TENKENSHUBETU).order('tenkenshubetu ASC, kaisumeisai ASC')
        @error = 4
        logger.debug("@checkInfo.count" + @checkInfo.count.to_s)
        if @checkInfo.count == 0 then
            @error_message  = MESSAGE_35
        end
        tenkenjoho_table(@checkInfo,params[:nendo_kirikae])

    end

    def transact_insert_tcheck(shubetu)
        #変更年度セレクトボックスの年度、チェックされた点検区分で検索。レコードが存在する場合
        if TCheckInfo.where(:bukenCode => @@bukenCode, :tenkenshubetu => shubetu, :nendo => params[:nendo_kirikae]).exists? then
            @error_message  = MESSAGE_39

            #存在しない場合は挿入
        else
            transact_update_tcheckinfo(@@hachushaCode,@@bukenCode,params[:nendo_kirikae],true)
            if 	@error_message[0] == '' then
                @error = 1
                #挿入成功した場合　完了画面に遷移
                @query_str = 'buken_henko_kanryo/6/'	+ @@bukenCode.to_s + '/' + @@hachushaCode.to_s
            end
        end
    end

    def transact_update_tcheck(shubetu)
        #選択チェックした種別データが無い場合
        if !TCheckInfo.where(:bukenCode => @@bukenCode, :tenkenshubetu => shubetu, :nendo => params[:nendo_kirikae]).exists? then
            @error_message  = MESSAGE_35
        else
            #変更の場合　削除→フォームの内容で新規登録
            #削除(ここでチェックされたものだけを削除！！！)
            TCheckInfo.where(:bukenCode => @@bukenCode, :nendo => params[:nendo_kirikae], :tenkenshubetu => shubetu).delete_all()
            #登録
            transact_update_tcheckinfo(@@hachushaCode,@@bukenCode,params[:nendo_kirikae],false)
            if 	@error_message[0] == '' then
                @error = 1
                @query_str = 'buken_henko_kanryo/5/' + @@bukenCode.to_s + '/' + @@hachushaCode.to_s
            end
        end
    end

    #点検削除または点検停止が押された場合
    def transact_del_stop_tcheck(nendo,message,url_str,shubetu)

        @t_check_joho = Hash.new
        @t_check_joho.store("bukenCode", @@bukenCode)
        @t_check_joho.store("hachushaCode", @@hachushaCode)
        @t_check_joho.store("nendo", nendo)
        @t_check_joho.store("shubetu", shubetu)
        logger.debug("transact_del_stop_tcheck")
        @error = 1
        @error_message = message
        #確認メッセージを表示して点検情報削除完了画面に遷移する。遷移先で停止または削除処理行う
        @query_str = url_str + @t_check_joho.to_query

    end

    def make_tracinfo_hash(bukenCode,nendo)
        @sql_str = ActiveRecord::Base.connection.
        select("SELECT MCi.bukenCode, MCi.nendo, MCi.seikyuhouhou, MCi.setubishubetu, MCi.tenkenshubetu, MCi.nenkantenkenkaisu, 							MCi.tenkenyoteiM1, MCi.kaisumeisai , MCi.keiyakukingaku1 , MCi.keiyakukingaku2 ,
						MCi.boukataishobututenkenkaisu, MCi.tenkentantosha1, MCi.tenkentantosha2, MCi.tenkentantosha3,
						MCi.tenkentantosha4, MCi.tenkentantosha5, MCi.tenkentantosha6,MCi.tenkentantosha7,
						MCi.tenkentantosha8, MCi.tenkentantosha9, MCi.tenkentantosha10, MCi.gaichuhi1, MCi.gaichuhi2,
						MCi.gaichuhi3,MCi.gaichuhi4, MCi.gaichuhi5, MCi.gaichuhi6, MCi.gaichuhi7, MCi.gaichuhi8, MCi.gaichuhi9,
						MCi.gaichuhi10, MCi.maintantosha, MCi.jinendotenkenY, A.id
			   	FROM t_check_infos AS MCi
			 	LEFT OUTER JOIN
				   (SELECT id, tenkenshubetu, tenkenyoteiM
				    FROM t_chktrackrec_infos
				     WHERE bukenCode = " + bukenCode.to_s + "
				     AND  nendo = " + nendo.to_s + "
				     AND setubishubetuKbn = " + MKIND_KBN_SETSUBISHUBETU.to_s + "
				     AND tenkenshubetuKbn = " + MKIND_KBN_TENKENSHUBETU.to_s + " ) A
			    	ON A.tenkenyoteiM = MCi.tenkenyoteiM1
			    	AND A.tenkenshubetu = MCi.tenkenshubetu
			 	WHERE MCi.bukenCode = " + bukenCode.to_s + "
			   	AND MCi.nendo = " + nendo.to_s + "
			   AND MCi.setubishubetuKbn = " + MKIND_KBN_SETSUBISHUBETU.to_s + "
			   AND MCi.tenkenshubetuKbn = " + MKIND_KBN_TENKENSHUBETU.to_s + "
		   	ORDER BY MCi.tenkenshubetu ASC, MCi.kaisumeisai ASC ")
        return  @sql_str
    end

end
