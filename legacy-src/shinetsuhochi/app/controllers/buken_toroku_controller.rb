class BukenTorokuController < ApplicationController
    before_action :mainte_check
    before_action :login_check
    before_action :dialog_init
    #点検情報の表
    #点検種別を 総合・機器12を除いて(11,12は消防設備１行になるため)取得
    def index
        @@m_kind_table = MKind.where('shubetuKbn = ? AND shubetu <> ?',MKIND_KBN_TENKENSHUBETU, MKIND_TENKENSHUBETU_KIKI).order('shubetu ASC')
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

        #----------------------------------#
        #通常(物件検索：再利用からでない)アクセス#
        #----------------------------------#
        #物件コードは数値なので :first, :secondが数値以外なら表示無効
        if params[:first].blank? or !(params[:first].to_s =~ /^[0-9]+$/ ) or params[:second].blank? or !(params[:second].to_s =~ /^[0-9]+$/ ) then
            @@bukenCode = ''
            @@hachushaCode = ''

            #点検開始年度セレクトボックス（今年度、来年度）
            @tenkenkaishiY =  Hash.new
            @tenkenkaishiY = CommonUtil.nendo_hash_default(0,1)

            @tenkenkaishi_data = ''
            @tenken_data = ''
            @seikyuhouhou_data = ''

            #---------------------#
            #物件検索から再利用実行 #
            #---------------------#
        else
            @@bukenCode = params[:first].to_i
            @@hachushaCode = params[:second].to_i

            #点検開始年度セレクトボックス　再利用の場合、現在の物件マスタから点検開始年度を取得、プラス今年度、来年度
            @tenkenkaishiY =  Hash.new

            @tenkenkaishiY_list = MHousinginfo.all.where(:bukenCode => @@bukenCode).select('tenkenkaishiY')
            @konnendo = CommonUtil.konnendo
            #@tenkenkaishiY.store(@tenkenkaishiY_list[0]["tenkenkaishiY"].to_s + '年度', @tenkenkaishiY_list[0]["tenkenkaishiY"])
            @default_nendo = (@tenkenkaishiY_list[0]["tenkenkaishiY"] == @konnendo or @tenkenkaishiY_list[0]["tenkenkaishiY"] == @konnendo + 1) ? false : true

            for num in @konnendo..@konnendo + 1 do
                @tenkenkaishiY.store(num.to_s + '年度',num)
            end

            #現在年度を取得
            @@genzai_nendo = CommonUtil.konnendo
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
            logger.debug("@buken_joho" + @buken_joho[0].to_s)
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

        end
        tenkenjoho_table
        render :layout => 'menu'
    end

    def commit

        #押されたボタンの種類
        @commit_kind = params[:commit]
        #発注者検索ボタン押された場合
        if @commit_kind == '発注者検索' then
            @error = 2
            @query_str = 'hachusha_kensaku/index'

            #登録ボタン押された場合
        elsif @commit_kind == '登録' then
            @mes_str = ''
            @mes_str += params[:hachushamei] == '' ? '発注者名 ' : ''
            @mes_str += params[:bukenmei] == '' ? '物件名 ' : ''
            @mes_str += params[:tenkenkaishiY] == '' ? '点検開始年度 ' : ''
            @mes_str += params[:tenkenKbn] == '' ? '点検区分 ' : ''
            #@pink = CommonUtil.buken_toroku_henshu_check(params,@@m_kind_table)
            #logger.debug("common0:" + @pink[0].to_s)
            #logger.debug("common1:" + @pink[1].to_s)
            #logger.debug("common2:" + @pink[2].to_s)
            #logger.debug("common3:" + @pink[3].to_s)
            #	@mes_str += '発注者名 '
            @focus = ''
            #発注者名 物件名  点検開始年度 点検区分ひとつでも入力されていないとNG
            if @mes_str != '' then
                @mes_str += MESSAGE_16[1]
                @error_message[0] = MESSAGE_16[0]
                @error_message[1] = @mes_str
                if @mes_str.include?('発注者名 ') then
                    @focus = 'id_txt_BTR_Hachushamei'
                elsif @mes_str.include?('物件名 ') then
                    @focus = 'id_txt_BTR_Bukenmei'
                elsif @mes_str.include?('点検開始年度 ') then
                    @focus = 'id_cmb_BTR_TenkenkaishiY'
                elsif @mes_str.include?('点検区分 ') then
                    @focus = 'id_cmb_BTR_Tenkenkbn'
                end
                #入力された発注者名が存在してる　且つ　発注者選択していない　且つ　再利用でない場合　発注者名重複エラー　params[:nm_Hid_HachushaCode] == '' and　削除
            elsif  MOrderingpatry.where(:hachushamei => params[:hachushamei]).exists? and params[:nm_Hid_HachushaCode] == '' and (@@bukenCode == '' or @@hachushaCode == '') then
                @focus = 'id_txt_BTR_Hachushamei'
                @error_message = MESSAGE_22
            else
                @setaku_flg = false
                #選択チェックひとつでもチェックされていたらOK
                @@m_kind_table.each do |list|
                    if (params['sentaku' + list.shubetu.to_s].to_s != '')
                        @setaku_flg = true
                        break
                    end
                end
                if @setaku_flg then
                    #入力チェックエラーが無ければ登録
                    #↓
                    @error_message = CommonUtil.buken_toroku_henshu_check(params,@@m_kind_table)
                    if @error_message[0] == "" then
                        #↑
                        logger.debug('@@bukenCode == '' or @@hachushaCode == '':' +  (@@bukenCode == '' or @@hachushaCode == '').to_s)
                        # 引数：発注者コード、物件コード、新規登録(true)か再利用(false)か
                        transact_insert_morderingpatry(@@hachushaCode,@@bukenCode, (@@bukenCode == '' or @@hachushaCode == ''),params[:nm_Hid_HachushaCode])
                        if 	@error_message[0] == '' then
                            @error = 3
                            #buken_toroku_kanryoに遷移
                            @query_str = 'buken_toroku_kanryo'
                        else

                        end
                        #↓
                    end
                    #↑
                else
                    @error_message = MESSAGE_17
                end
            end
        end
    end

    #---------------#
    # 発注者情報M登録 #
    #---------------#
    def transact_insert_morderingpatry(hachushaCode,bukenCode,insert_flg,sentaku_hachushaCode)

        #発注者検索画面で発注者選択をしていない場合、入力された発注者を新たに登録、または変更(再利用から遷移)
        if sentaku_hachushaCode == '' then
            if insert_flg then
                #新規登録
                hachushaCode = MOrderingpatry.maximum(:hachushaCode) + 1

                @m_orderingpatry = MOrderingpatry.new
                @m_orderingpatry.hachushaCode = hachushaCode
                @m_orderingpatry.hachushamei = params[:hachushamei]
                @m_orderingpatry.hachuTandoshamei = params[:hachuTantoshamei]
                @m_orderingpatry.hachuPostno = params[:hachuPostno1] + params[:hachuPostno2]
                @m_orderingpatry.hachuAdrs = params[:hachuAdrs]
                @m_orderingpatry.hachuTelno = params[:hachuTelno]
                @m_orderingpatry.hachuFaxno = params[:hachuFaxno]
                @m_orderingpatry.edaban = 0
                @m_orderingpatry.sakujyoFlg = 0
                @m_orderingpatry.save!
            else
                #再利用の場合
                #入力した内容で更新
                MOrderingpatry.where(:hachushaCode => hachushaCode).update_all(:hachushamei => params[:hachushamei],
                :hachuTandoshamei => params[:hachuTantoshamei],
                :hachuPostno => params[:hachuPostno1] + params[:hachuPostno2],
                :hachuAdrs => params[:hachuAdrs],
                :hachuTelno => params[:hachuTelno],
                :hachuFaxno => params[:hachuFaxno])
                #:edaban => 1,
                #:sakujyoFlg => 0)
            end
        else
            #発注者検索画面で発注者選択をしている場合
            #入力した内容で更新
            hachushaCode = sentaku_hachushaCode.to_i
            MOrderingpatry.where(:hachushaCode => hachushaCode).update_all(:hachushamei => params[:hachushamei],
            :hachuTandoshamei => params[:hachuTantoshamei],
            :hachuPostno => params[:hachuPostno1] + params[:hachuPostno2],
            :hachuAdrs => params[:hachuAdrs],
            :hachuTelno => params[:hachuTelno],
            :hachuFaxno => params[:hachuFaxno])
        end

        #取得した発注者コードで物件テーブル更新
        transact_insert_mhousinginfo(hachushaCode,bukenCode,insert_flg)
    end

    #-----------#
    # 物件M登録 #
    #-----------#
    def transact_insert_mhousinginfo(hachushaCode,bukenCode,insert_flg)
        #	MHousinginfo.transaction do
        tenkenKbn = params[:tenkenKbn].to_i
        if insert_flg then
            #@buken_id= MHousinginfo.maximum(:id) + 1
            bukenCode = MHousinginfo.maximum(:bukenCode) + 1
            @m_housinginfo = MHousinginfo.new
            #@m_housinginfo.id = @buken_id
            @m_housinginfo.bukenCode = bukenCode
            @m_housinginfo.bukenmei = params[:bukenmei]
            #最終作成年月日：現在年度を取得
            @m_housinginfo.saishusakuseiY = CommonUtil.konnendo
            @m_housinginfo.tenkenkaishiY = params[:tenkenkaishiY]
            @m_housinginfo.tenkenKbn = tenkenKbn
            @m_housinginfo.memo1 = params[:memo1]
            @m_housinginfo.memo2 = params[:memo2]
            @m_housinginfo.teishiFlg = 0
            @m_housinginfo.tenkenjyohoumuFlg = 0
            @m_housinginfo.save!

        else
            MHousinginfo.where(:bukenCode => bukenCode).update_all(:bukenmei => params[:bukenmei],
            :saishusakuseiY => CommonUtil.konnendo,
            :tenkenkaishiY => params[:tenkenkaishiY],
            :tenkenKbn => tenkenKbn,
            :memo1 => params[:memo1],
            :memo2 => params[:memo2],
            :teishiFlg => 0,
            :tenkenjyohoumuFlg => 0)
        end

        #		end

        #取得した発注者コードで物件テーブル更新
        transact_insert_thousinginfo(hachushaCode,bukenCode,insert_flg, tenkenKbn)
        #		rescue => e
        #			@error_message  = MESSAGE_DBS_01
    end

    #-----------#
    # 物件T登録 #
    #-----------#
    def transact_insert_thousinginfo(hachushaCode,bukenCode,insert_flg, tenkenKbn)
        #	THousinginfo.transaction do
        if insert_flg then
            @t_housinginfo = THousinginfo.new
            @t_housinginfo.bukenCode = bukenCode
            @t_housinginfo.hachushaCode = hachushaCode
            @t_housinginfo.nendo = params[:tenkenkaishiY]
            @t_housinginfo.bukenmei = params[:bukenmei]
            @t_housinginfo.bukenPostno = params[:bukenPostno1] + params[:bukenPostno2]
            @t_housinginfo.bukenAdrs = params[:bukenAdrs]
            @t_housinginfo.bukenTelno = params[:bukenTelno]
            @t_housinginfo.bukenFaxno = params[:bukenFaxno]
            @t_housinginfo.bukenTandoshamei = params[:bukenTantoshamei]
            @t_housinginfo.save!
        else
            THousinginfo.where(:bukenCode => bukenCode).update_all(:hachushaCode => hachushaCode,
            :nendo => params[:tenkenkaishiY],
            :bukenmei => params[:bukenmei],
            :bukenPostno => params[:bukenPostno1] + params[:bukenPostno2],
            :bukenAdrs => params[:bukenAdrs],
            :bukenTelno => params[:bukenTelno],
            :bukenFaxno => params[:bukenFaxno],
            :bukenTandoshamei => params[:bukenTantoshamei])
        end

        #		end
        #取得した発注者コードで物件テーブル更新
        transact_insert_tcheckinfo(hachushaCode,bukenCode,insert_flg, tenkenKbn)
        #		rescue => e
        #			@error_message  = MESSAGE_DBS_01
    end

    def transact_insert_tcheckinfo(hachushaCode,bukenCode,insert_flg ,tenkenKbn)

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
                    @t_check_info.nendo = params[:tenkenkaishiY]
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
                    @t_check_info.gaichuhi1 = params["gaichuhi#{list.shubetu}_#{num}_1"].delete(',').delete("\u00A5").to_i
                    @t_check_info.gaichuhi2 = params["gaichuhi#{list.shubetu}_#{num}_2"].delete(',').delete("\u00A5").to_i
                    @t_check_info.gaichuhi3 = params["gaichuhi#{list.shubetu}_#{num}_3"].delete(',').delete("\u00A5").to_i

                    #点検担当者、外注費４～１０は消防設備の時のみ
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
                    #次年度点検Yは　年度　＋　点検区分(毎年：１, ２年に１回：２, ３年に１回：３)（スポットは０とする）
                    @t_check_info.jinendotenkenY = (tenkenKbn == 4) ? @t_check_info.nendo : @t_check_info.nendo + tenkenKbn

                    #メイン点検担当者番号はメイン点検担当者ボタン番号をもつ点検担当者
                    @t_check_info.maintantosha = params['tenkentantousha' + list.shubetu.to_s + '_' + num.to_s + '_' + params['meintantousha' + list.shubetu.to_s + '_' + num.to_s].to_s].slice(4,10).to_i

                    @t_check_info.save!

                    @t_chktrack_info = TChktrackrecInfo.new
                    @t_chktrack_info.bukenCode = bukenCode
                    @t_chktrack_info.nendo = params[:tenkenkaishiY]
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
                end

            end

        end

    end

    def tenkenjoho_table

        #点検担当者セレクトボックス一覧作成
        @m_check_moto = MCheckpeople.where(:tenkentantoshashubetuKbn => 0).order('sakujyoFlg,tenkentantoshashubetu')
        @m_check =  Hash.new
        @m_check_html = '<option value=""></option>'
        @m_check_moto.each do | x |
            #削除フラグがあったら×印
            @flg = (x.sakujyoFlg == 1) ? '×' : ''
            #種別が外注ならば◆印
            @flg_b = (x.tenkentantoshashubetu == MKIND_TENKENTANTOSHA_GAICHU) ? '◆' : ''
            #valueに１桁の削除フラグ、３桁の点検担当者種別、１０桁の点検担当者コードを設定（いずれも０埋め）
            @m_check_html += '<option value="' +  x.sakujyoFlg.to_s + format("%03d",x.tenkentantoshashubetu) +
            format("%010d",x.tenkentantoshaCode)  + '">' + @flg + x.tenkentantoshamei.gsub(Str_pattern1,ESCAPE_HTML) + @flg_b + '</option>'
        end

        #点検予定月セレクトボックス一覧作成
        @m_yoteiM_html = CommonUtil.get_kaishiM_selectbox_html(0)
        @m_yoteiM_html_kaishi = CommonUtil.get_kaishiM_selectbox_html(CommonUtil.kaishiM)

        #M種別から表示する種別を取得　種別=12の'消防設備(機器)'は'消防設備(総合)'とダブるため除外
        @m_kind_table = MKind.where('shubetuKbn = ? AND shubetu <> ?',MKIND_KBN_TENKENSHUBETU, 12)

        #点検情報表の作成
        @html_str = ''

        @@m_kind_table.each do |list|

            @gyousu = 0
            #点検種別
            #「選択」～「防火対象物」列のhtml(種別によって異なる)
            case list.shubetu
            when MKIND_TENKENSHUBETU_SOUGOU then
                #「点検予定月」～「外注費」までの行数
                @gyousu = 2
                @tanto_suu = 10
                @style_s = "0"
                #「選択」～「防火対象物」列のhtml
                @html_str += '<div class="btr_info01"><input
  								id="sentaku' + list.shubetu.to_s + '"
  								name="sentaku' + list.shubetu.to_s  +  '"
  								type="checkbox" value="' + list.shubetu.to_s + '" /></div>' + "\n" +
                '<div class="btr_info02">消防設備</div>' + "\n" +
                '<div class="btr_info03">' +
                '<label><input checked="checked" class="rad_ttr" id="tenkenkaisu' + list.shubetu.to_s  +  '_1" name="tenkenkaisu' + list.shubetu.to_s  +  '" type="radio" value="1" />総合のみ(１回)&nbsp;</label><br>' + "\n" +
                '<label><input id="tenkenkaisu' + list.shubetu.to_s  +  '_2" name="tenkenkaisu' + list.shubetu.to_s  +  '" type="radio" value="2" />総合･機器(２回)</label>' +
                '</div>' + "\n" +
                '<div class="btr_info04"></div>' + "\n"
            when MKIND_TENKENSHUBETU_BOUKATAISHOBUTU then
                @gyousu = 1
                @tanto_suu = 3
                @style_s = "2"
                @html_str +=	'<div class="btr_info29"><input id="sentaku' + list.shubetu.to_s  +  '" name="sentaku' + list.shubetu.to_s  +  '" type="checkbox" value="' + list.shubetu.to_s + '" /></div>' +"\n" +
                '<div class="btr_info30">' + list.shubetumei + '</div>' +"\n" +
                '<div class="btr_info31">' +
                '<label><input checked="checked" id="tenkenkaisu' + list.shubetu.to_s  +  '_1" name="tenkenkaisu' + list.shubetu.to_s  +  '" type="radio" value="1" />１回</label>' +"\n" +
                '</div>' +
                '<div class="btr_info32">' +"\n" +
                '<input class="klimit-digit input_11" id="id_txt_BTR_boukatenkenkaisu" maxlength="3" name="boukatenkenkaisu" type="text" value="" /><div style="margin-top:4px;">回目</div></div>' + "\n"
            when MKIND_TENKENSHUBETU_RENKETSUSOU then
                @gyousu = 1
                @tanto_suu = 3
                @style_s = "2"
                @html_str +=	'<div class="btr_info29"><input id="sentaku' + list.shubetu.to_s  +  '" name="sentaku' + list.shubetu.to_s  +  '" type="checkbox" value="' + list.shubetu.to_s + '" /></div>' + "\n" +
                '<div class="btr_info30">' + list.shubetumei + '</div>' + "\n" +
                '<div class="btr_info31">' +
                '<label><input checked="checked" id="tenkenkaisu' + list.shubetu.to_s  +  '_1" name="tenkenkaisu' + list.shubetu.to_s  +  '" type="radio" value="1" />１回</label>' + "\n" +
                '</div>' +
                '<div class="btr_info32"></div>' + "\n"
            else
                @gyousu = 2
                @tanto_suu = 3
                @style_s = "2"
                @html_str +=	'<div class="btr_info21"><input id="sentaku' + list.shubetu.to_s  +  '" name="sentaku' + list.shubetu.to_s  +  '" type="checkbox" value="' + list.shubetu.to_s + '" /></div>' + "\n" +
                '<div class="btr_info22">' + list.shubetumei + '</div>' + "\n" +
                '<div class="btr_info23">' +
                '<label><input checked="checked" class="rad_ttr" id="tenkenkaisu' + list.shubetu.to_s  +  '_1" name="tenkenkaisu' + list.shubetu.to_s  +  '" type="radio" value="1" />１回</label><br>' + "\n" +
                '<label><input id="tenkenkaisu' + list.shubetu.to_s  +  '_2" name="tenkenkaisu' + list.shubetu.to_s  +  '" type="radio" value="2" />２回</label>' + "\n" +
                '</div>' +
                '<div class="btr_info24"></div>' + "\n"
            end

            #「点検予定月」～「外注費」までのhtml

            for num in 1..@gyousu do
                #点検予定月
                @selectbox = (num == 1) ? @m_yoteiM_html_kaishi : @m_yoteiM_html
                @html_str += '<div class="btr_info' + @style_s + '5"><select class="select_100"
   							id="id_cmb_BTR_Tenkenyoteim' + list.shubetu.to_s + '_' + num.to_s + '"
   							name="tenkenyoteiM' + list.shubetu.to_s + '_' + num.to_s + '"
   							>' + @selectbox + '</select></div>' + "\n"

                #契約金額
                @html_str += '<div class="btr_info' + @style_s + '6"><input class="klimit-digit input_9" maxlength="12"
							id="id_txt_BTR_keiyakukingaku' + list.shubetu.to_s + '_' + num.to_s + '"
							name="keiyakukingaku' + list.shubetu.to_s + '_' + num.to_s + '"
							 type="text" value=""/></div>' + "\n"

                #メイン点検担当者
                #初期チェックする位置
                @checked = ['checked="checked"','','','','','','','','','',]

                @html_str += '<div class="btr_info' + @style_s + '7">' + "\n"
                for index in 1..@tanto_suu do
                    @html_str += '<label><input ' + @checked[index-1] + '
								id="meintantousha' + list.shubetu.to_s + '_' + num.to_s + '_' + index.to_s + '"
								name="meintantousha' + list.shubetu.to_s + '_' + num.to_s + '"
								class="rad_ttr" tabindex="-1"
								type="radio" value="' + index.to_s + '" /></label><br>' + "\n"
                end
                @html_str += '</div>' + "\n"

                #点検担当者		<option value=""></option>
                @html_str += '<div class="btr_info' + @style_s + '8">' + "\n"
                for index in 1..@tanto_suu do
                    @html_str += '<select class="select_115"
					id="id_cmb_BTR_Tenkentantousha' + list.shubetu.to_s + '_' + num.to_s + '_' + index.to_s + '"
					name="tenkentantousha' + list.shubetu.to_s + '_' + num.to_s + '_' + index.to_s + '"
					>' + @m_check_html + '</select>' + "\n"
                end
                @html_str += '</div>' + "\n"

                #外注費
                @html_str += '<div class="btr_info' + @style_s + '8">' + "\n"
                for index in 1..@tanto_suu do
                    @html_str += '<input class="klimit-digit input_10" maxlength="12"
					id="id_txt_BTR_gaichuhi' + list.shubetu.to_s + '_' + num.to_s + '_' + index.to_s + '"
					name="gaichuhi' + list.shubetu.to_s + '_'  + num.to_s + '_' + index.to_s + '"
					 type="text" value="" />' + "\n"
                end
                @html_str += '</div>' + "\n"
            end
            @html_str += '<div class="kugiri"></div>' + "\n"
        end
    end

end
