class BukenHenkoKanryoController < ApplicationController
    before_action :mainte_check
    before_action :login_check
    before_action :dialog_init
    def index
        if !params[:id].blank? then
            if !params[:first].blank? then  @bukenCode = params[:first] end
            if !params[:second].blank? then  @hachushaCode = params[:second] end
            case params[:id]
            when '1' then
                @action_title = '物件を削除しました。'
            when '2' then
                @action_title = '物件に対する発注者を変更しました。'
            when '3' then
                @action_title = '発注者情報(マスタ)を変更しました。'
            when '4' then
                @action_title = '物件情報を変更しました。'
            when '5' then
                @action_title = '点検情報を変更しました。'
            when '6' then
                @action_title = '点検情報を追加しました。'
            when '7' then
                @action_title = '点検情報を削除しました。'
            when '8' then
                @action_title = '物件を停止しました。'
            end
        else
            @action_title = ''
        end

        render :layout => 'menu'
    end

    def commit
        #押されたボタンの種類
        @commit_kind = params[:commit]
        logger.debug("params[:id]:" + params[:id].to_s)
        logger.debug("params[:first]:" + params[:first].to_s)
        logger.debug("params[:second]:" + params[:second].to_s)
        if @commit_kind == '物件変更・削除へ戻る' then
            redirect_to :controller => 'buken_henko_sakujo', :action => 'index', :first => params[:first], :second => params[:second]
        elsif @commit_kind == '物件検索' then
            redirect_to :controller => 'buken_kensaku'
        end

    end

    #--------------------------#
    # 物件検索画面からの削除処理 #
    #--------------------------#
    def delete

        @etc_buken_flg = false
        #入力されたURLのIDが全て
        if params[:first] != nil and params[:second] != nil and params[:third] != nil and params[:fourth] != nil then

            #:firstのMD５が:secondと等しく、:thrdのMD5が:fourthと等しければ改ざんなしなのでOK
            if params[:second] == Digest::MD5.hexdigest(params[:first]) and params[:fourth] == Digest::MD5.hexdigest(params[:third]) then

                @bukenCode = params[:first].to_i
                @bukenCode_hash = params[:second]
                @hachushaCode = params[:third].to_i
                @hachushaCode_hash = params[:fourth]
                logger.debug("@hachushaCode_hash:" + @hachushaCode_hash.to_s)
                #選択された発注者コードでT物件情報検索。
                @Thousing_buken = THousinginfo.where(:hachushaCode => @hachushaCode).select(:bukenCode).uniq

                @Thousing_buken.each do | list |
                    logger.debug("list.bukenCode:" + list.bukenCode.to_s)
                    #選択された物件コード以外の物件コードがみつかればbreak
                    if list.bukenCode != @bukenCode then
                        @etc_buken_flg = true
                        break
                    end
                end
                logger.debug("@etc_buken_flg:" + @etc_buken_flg.to_s)

                #選択された物件コード以外の物件があれば M発注者(発注者Code)消さず、T点検情報(物件Code)、T物件情報(物件Code)、M物件情報(物件Code)消す
                if @etc_buken_flg then
                    transact_delete_Tcheck(@bukenCode)
						#T点検実績情報とT補修情報も消す
						transact_delete_Tchktrackrec(@bukenCode)
						transact_delete_Trepair(@bukenCode)
                    #選択された物件コード以外の物件がなければ M発注者(発注者Code)、T点検情報(物件Code)、T物件情報(物件Code)、M物件情報(物件Code)消す
                else
                    transact_delete_Morder(@hachushaCode, @bukenCode)
						#T点検実績情報とT補修情報も消す
						transact_delete_Tchktrackrec(@bukenCode)
						transact_delete_Trepair(@bukenCode)
                end

                logger.debug('error_message[0]' + @error_message[0])
                #DBエラーなければ物件削除完了画面へ遷移
                if 	@error_message[0] == '' then
                    redirect_to :action => 'index', :id => '1'
                    return nil
                else
                    #redirect_to :action => 'delete'
                end

            else
                #MDが不一致
            end
        else
            #URLが不正
        end
        render :layout => 'menu'
    end

    # 発注者情報M削除 #
    def transact_delete_Morder(hachushaCode,bukenCode)
        logger.debug('DELETE_Morder:@hachushaCode:' + hachushaCode.to_s)
        MOrderingpatry.where(:hachushaCode => hachushaCode).delete_all()
        transact_delete_Tcheck(bukenCode)

    end

    # 点検情報T削除 #
    def transact_delete_Tcheck(bukenCode)
        logger.debug('DELETE_TCheckInfo:@bukenCode:' + bukenCode.to_s)
        TCheckInfo.where(:bukenCode => bukenCode).delete_all()
        transact_delete_Tbuken(bukenCode)
    end

    # 物件情報T削除 #
    def transact_delete_Tbuken(bukenCode)
        logger.debug('DELETE_Tbuken:@bukenCode:' + bukenCode.to_s)
        THousinginfo.where(:bukenCode => bukenCode).delete_all()
        transact_delete_Mbuken(bukenCode)
    end

    # 物件情報M削除 #
    def transact_delete_Mbuken(bukenCode)
        logger.debug('DELETE_Mbuken:@bukenCode:' + bukenCode.to_s)
        MHousinginfo.where(:bukenCode => bukenCode).delete_all()
    end

	# 点検実績情報T削除 #
    def transact_delete_Tchktrackrec(bukenCode)
        logger.debug('DELETE_TChktrackrecInfo:@bukenCode:' + bukenCode.to_s)
        TChktrackrecInfo.where(:bukenCode => bukenCode).delete_all()
    end
	
	# 補修情報T削除 #
    def transact_delete_Trepair(bukenCode)
        logger.debug('DELETE_TRepairInfo:@bukenCode:' + bukenCode.to_s)
        TRepairInfo.where(:bukenCode => bukenCode).delete_all()
    end

    #----------------------------------#
    # 物件変更・削除からの発注者更新処理 #
    #----------------------------------#
    def update_hachusha
        @hachusha = Hash.new
        @hachusha = Rack::Utils.parse_query(params[:first])

        #発注者データを登録(更新)→物件テーブル更新→点検情報更新
        transact_insert_morderingpatry(@hachusha)

        #新規登録する場合、差し替え前の発注者コードを発注者マスタから削除
        #if @hachusha["insert_flg"].to_s == 'true' then
        #	transact_delete_Morder_only(@hachusha["hachushaCode"])
        #end

        #DBエラーなければ物件削除完了画面へ遷移
        if 	@error_message[0] == '' and @hachusha["insert_flg"].to_s == 'true' then
            redirect_to :action => 'index', :id => '2', :first => @hachusha["bukenCode"] , :second => @@hachushaCode
            return nil
        elsif @error_message[0] == '' and @hachusha["insert_flg"].to_s == 'false' then
            redirect_to :action => 'index', :id => '3', :first => @hachusha["bukenCode"] , :second => @@hachushaCode
            return nil
        else
            #redirect_to :action => 'delete'
        end

        render :layout => 'menu'
    end

    # 発注者情報M削除 #
    def transact_delete_Morder_only(hachushaCode)
        logger.debug('transact_delete_Morder_only@hachushaCode:' + hachushaCode.to_s)
        MOrderingpatry.where(:hachushaCode => hachushaCode).delete_all()
    end

    #--------------------------------#
    # 物件変更・削除からの物件更新処理 #
    #--------------------------------#
    def update_buken

        @buken = Hash.new
        @buken = Rack::Utils.parse_query(params[:first])

        #物件マスタ更新→物件テーブル更新→点検情報更新
        transact_update_mhousinginfo(@buken)

        logger.debug('error_message[0]' + @error_message[0])
        #DBエラーなければ物件削除完了画面へ遷移
        if 	@error_message[0] == '' then
            redirect_to :action => 'index', :id => '4', :first => @buken["bukenCode"] , :second => @buken["hachushaCode"]
            return nil
        else
            #redirect_to :action => 'delete'
        end

        render :layout => 'menu'
    end

    #-------------------------------------------------#
    # 物件変更・削除からのT点検情報 -> T点検実績削除処理 #
    #-------------------------------------------------#
    def delete_tenken

        @tenken = Hash.new
        @shubetu = Array.new
        @tenken = Rack::Utils.parse_query(params[:first])
        @bukenCode = @tenken["bukenCode"].to_i
        @nendo = @tenken["nendo"].to_i
        @hachushaCode = @tenken["hachushaCode"].to_i
        @shubetu = @tenken["shubetu"].split(',')
        logger.debug("@bukenCode:" + @bukenCode.to_s)
        logger.debug("@nendo:" + @nendo.to_s)
        logger.debug('@shubetu[0]' + @shubetu[0])

        TCheckInfo.where(:bukenCode => @bukenCode, :nendo => @nendo, :tenkenshubetu => @shubetu,
        :setubishubetuKbn => MKIND_KBN_SETSUBISHUBETU, :tenkenshubetuKbn => MKIND_KBN_TENKENSHUBETU).delete_all()
        TChktrackrecInfo.where(:bukenCode => @bukenCode, :nendo => @nendo, :tenkenshubetu => @shubetu,
        :setubishubetuKbn => MKIND_KBN_SETSUBISHUBETU, :tenkenshubetuKbn => MKIND_KBN_TENKENSHUBETU).delete_all()

        #DBエラーなければ物件削除完了画面へ遷移
        if 	@error_message[0] == ''  then
            redirect_to :action => 'index', :id => '7', :first => @bukenCode , :second => @hachushaCode
            return nil
        end
        render :layout => 'menu'
    end

    #-----------------------------------#
    # 物件変更・削除からの点検情報停止処理 #
    #-----------------------------------#
    def stop_tenken

        @tenken = Hash.new
        @tenken = Rack::Utils.parse_query(params[:first])
        @bukenCode = @tenken["bukenCode"].to_i
        @nendo = @tenken["nendo"].to_i
        @hachushaCode = @tenken["hachushaCode"].to_i

        logger.debug("@bukenCode:" + @bukenCode.to_s)
        logger.debug("@nendo:" + @nendo.to_s)
        transact_stop_Tcheck(@bukenCode, @nendo)
        #DBエラーなければ物件削除完了画面へ遷移
        if 	@error_message[0] == ''  then
            redirect_to :action => 'index', :id => '8', :first => @bukenCode , :second => @hachushaCode
            return nil
        end
    end

    # 点検情報停止処理 #
    def transact_stop_Tcheck(bukenCode, nendo)
        TCheckInfo.transaction do
            TCheckInfo.where(:bukenCode => bukenCode, :nendo => nendo).delete_all()
        end
        transact_stop_Tchktrac(bukenCode, nendo)
    rescue => e
        @error_message  = MESSAGE_DBS_01
    end

    # 点検実績情報停止処理 #
    def transact_stop_Tchktrac(bukenCode, nendo)
        TChktrackrecInfo.transaction do
            TChktrackrecInfo.where(:bukenCode => bukenCode, :nendo => nendo).delete_all()
        end
        transact_stop_Mbuken(bukenCode, nendo)
    rescue => e
        @error_message  = MESSAGE_DBS_01
    end

    def transact_stop_Mbuken(bukenCode, nendo)
        MHousinginfo.transaction do
            MHousinginfo.where(:bukenCode => bukenCode).update_all(:tenkenteishiY => nendo, :teishiFlg => 1 )
        end
    rescue => e
        @error_message  = MESSAGE_DBS_01
    end

    #-----------------------------#
    # 発注者変更より発注者情報M登録 #
    #-----------------------------#
    def transact_insert_morderingpatry(hachusha)
        logger.debug('transact_insert_morderingpatry bukenCode:' + hachusha["bukenCode"].to_s)
        #発注者選択したときの処理
        if hachusha["sentaku_flg"].to_s == 'true' then
            #M物件変更処理
            MOrderingpatry.where(:hachushaCode => hachusha["sentaku_hachushaCode"]).update_all(	:hachushamei => hachusha["hachushamei"],
            :hachuTandoshamei => hachusha["hachuTandoshamei"],
            :hachuPostno => hachusha["hachuPostno"],
            :hachuAdrs => hachusha["hachuAdrs"],
            :hachuTelno => hachusha["hachuTelno"],
            :hachuFaxno => hachusha["hachuFaxno"],
            :edaban => 0,
            :sakujyoFlg => 0)
            logger.debug('◆◆◆発注者選択処理')
            logger.debug('hachushaCode' + hachusha["sentaku_hachushaCode"].to_s + 'の情報を')
            logger.debug('hachushamei' + hachusha["hachushamei"].to_s + 'で更新')

            #T物件、T点検更新処理
            #発注者新規登録処理
            if hachusha["insert_flg"].to_s == 'true' then
                logger.debug('◆◆◆発注者新規登録処理 T物件、T点検更新処理')
                logger.debug('hachushaCode' + hachusha["old_hachushaCode"].to_s + 'bukenCode' + hachusha["bukenCode"].to_s + 'の情報を')
                logger.debug('hachushaCode' + hachusha["sentaku_hachushaCode"].to_s + 'で更新')
                #古い(物件選択時の)発注者コードを発注者選択で選択した発注者コードに変更
                @cnt =	THousinginfo.where(:hachushaCode => hachusha["old_hachushaCode"],:bukenCode => hachusha["bukenCode"]).update_all(:hachushaCode => hachusha["sentaku_hachushaCode"])
                logger.debug('transact_update_thousinginfo@cnt:' + @cnt.to_s)

                #点検情報テーブル更新
                @cnt =	TCheckInfo.where(:hachushaCode => hachusha["old_hachushaCode"],:bukenCode => hachusha["bukenCode"]).update_all(:hachushaCode => hachusha["sentaku_hachushaCode"])
                logger.debug('transact_update_tcheckinfo@cnt:' + @cnt.to_s)
                @@hachushaCode = hachusha["sentaku_hachushaCode"]
            else
                logger.debug('◆◆◆発注者変更処理 T物件、T点検更新処理')
                #発注者変更処理
                #古い(物件選択時の)発注者コードを発注者選択で選択した発注者コードに変更
                logger.debug('hachushaCode' + hachusha["old_hachushaCode"].to_s + 'の情報を')
                logger.debug('hachushaCode' + hachusha["sentaku_hachushaCode"].to_s + 'で更新')
                @cnt =	THousinginfo.where(:hachushaCode => hachusha["old_hachushaCode"]).update_all(:hachushaCode => hachusha["sentaku_hachushaCode"])
                logger.debug('transact_update_thousinginfo@cnt:' + @cnt.to_s)

                #点検情報テーブル更新
                @cnt =	TCheckInfo.where(:hachushaCode => hachusha["old_hachushaCode"]).update_all(:hachushaCode => hachusha["sentaku_hachushaCode"])
                logger.debug('transact_update_tcheckinfo@cnt:' + @cnt.to_s)
                @@hachushaCode = hachusha["sentaku_hachushaCode"]
            end

            #古い発注者コードが無い場合は削除
            if THousinginfo.where(:hachushaCode => hachusha["old_hachushaCode"]).exists? then
                logger.debug('T物件、T点検にhachushaCode' + hachusha["old_hachushaCode"].to_s + 'の情報あり')
            else
                MOrderingpatry.where(:hachushaCode => hachusha["old_hachushaCode"]).delete_all()
                logger.debug('T物件、T点検にhachushaCode' + hachusha["old_hachushaCode"].to_s + 'の情報なし＝削除')
            end
        else
            #直接入力したときの処理
            #M物件変更処理
            if hachusha["insert_flg"].to_s == 'true' then
                @m_orderingpatry = MOrderingpatry.new()
                @m_orderingpatry.id = MOrderingpatry.maximum(:id) + 1
                @m_orderingpatry.hachushaCode = MOrderingpatry.maximum(:hachushaCode) + 1
                @new_hachushaCode = @m_orderingpatry.hachushaCode
                @m_orderingpatry.hachushamei = hachusha["hachushamei"]
                @m_orderingpatry.hachuTandoshamei = hachusha["hachuTandoshamei"]
                @m_orderingpatry.hachuPostno = hachusha["hachuPostno"]
                @m_orderingpatry.hachuAdrs = hachusha["hachuAdrs"]
                @m_orderingpatry.hachuTelno = hachusha["hachuTelno"]
                @m_orderingpatry.hachuFaxno = hachusha["hachuFaxno"]
                @m_orderingpatry.edaban = 0
                @m_orderingpatry.sakujyoFlg = 0
                @m_orderingpatry.save!
                logger.debug('◆◆◆直接入力処理　新規登録')
                logger.debug('新発注者ID' + @m_orderingpatry.hachushaCode.to_s)
                logger.debug('◆◆◆直接入力処理 T物件、T点検更新処理')
                logger.debug('hachushaCode' + hachusha["old_hachushaCode"].to_s + 'bukenCode' + hachusha["bukenCode"].to_s + 'の情報を')
                logger.debug('hachushaCode' + @new_hachushaCode.to_s + 'で更新')
                #古い(物件選択時の)発注者コードを発注者選択で選択した発注者コードに変更
                @cnt =	THousinginfo.where(:hachushaCode => hachusha["old_hachushaCode"],:bukenCode => hachusha["bukenCode"]).update_all(:hachushaCode => @new_hachushaCode)
                logger.debug('transact_update_thousinginfo@cnt:' + @cnt.to_s)

                #点検情報テーブル更新
                @cnt =	TCheckInfo.where(:hachushaCode => hachusha["old_hachushaCode"],:bukenCode => hachusha["bukenCode"]).update_all(:hachushaCode => @new_hachushaCode)
                logger.debug('transact_update_tcheckinfo@cnt:' + @cnt.to_s)

                #古い発注者コードが無い場合は削除
                if THousinginfo.where(:hachushaCode => hachusha["old_hachushaCode"]).exists? then
                    logger.debug('T物件、T点検にhachushaCode' + hachusha["old_hachushaCode"].to_s + 'の情報あり')
                else
                    MOrderingpatry.where(:hachushaCode => hachusha["old_hachushaCode"]).delete_all()
                    logger.debug('T物件、T点検にhachushaCode' + hachusha["old_hachushaCode"].to_s + 'の情報なし=削除')
                end
                @@hachushaCode = @new_hachushaCode
            else
                logger.debug('◆◆◆直接入力処理　変更処理')
                logger.debug('hachushaCode' + hachusha["old_hachushaCode"].to_s + 'の情報を')
                logger.debug('hachushamei' + hachusha["hachushamei"].to_s + 'で更新')
                MOrderingpatry.where(:hachushaCode => hachusha["old_hachushaCode"]).update_all(	:hachushamei => hachusha["hachushamei"],
                :hachuTandoshamei => hachusha["hachuTandoshamei"],
                :hachuPostno => hachusha["hachuPostno"],
                :hachuAdrs => hachusha["hachuAdrs"],
                :hachuTelno => hachusha["hachuTelno"],
                :hachuFaxno => hachusha["hachuFaxno"],
                :edaban => 0,
                :sakujyoFlg => 0)
                @@hachushaCode = hachusha["old_hachushaCode"]
            end

        end

    end

    #------------------------------#
    # 物件情報T更新 -> 点検情報T更新#
    #------------------------------#
    def transact_update_thousinginfo(hachushaCode,bukenCode)
        logger.debug('transact_update_thousinginfo@hachushaCode,@bukenCode:' + hachushaCode.to_s + "," + bukenCode.to_s)
        #bukenCodeの条件でhachushaCodeを更新
        @cnt =	THousinginfo.where(:bukenCode => bukenCode).update_all(:hachushaCode => hachushaCode)
        logger.debug('transact_update_thousinginfo@cnt:' + @cnt.to_s)

        #点検情報テーブル更新
        @cnt =	TCheckInfo.where(:bukenCode => bukenCode).update_all(:hachushaCode => hachushaCode)
        @@hachushaCode = hachushaCode
        logger.debug('transact_update_tcheckinfo@cnt:' + @cnt.to_s)

    end

    #以下
    #----------------------------------------------------------------#
    # 物件情報変更より　物件情報M更新 -> 物件情報T更新 -> 点検情報T更新 #
    #----------------------------------------------------------------#
    def transact_update_mhousinginfo(buken)
        logger.debug('transact_update_mhousinginfo@bukenCode:' + buken["bukenCode"].to_s)
        @cnt =	MHousinginfo.where(:bukenCode => buken["bukenCode"].to_i).update_all(:bukenmei => buken["bukenmei"], :tenkenkaishiY => buken["tenkenkaishiY"].to_i, :tenkenKbn => buken["tenkenKbn"].to_i, :memo1 => buken["memo1"], :memo2 => buken["memo2"])
        logger.debug('transact_update_mhousinginfo@cnt:' + @cnt.to_s)

        @cnt =	THousinginfo.where(:bukenCode => buken["bukenCode"].to_i).update_all(:bukenmei => buken["bukenmei"], :bukenPostno => buken["bukenPostno"], :bukenAdrs => buken["bukenAdrs"], :bukenTelno => buken["bukenTelno"], :bukenFaxno => buken["bukenFaxno"], :bukenTandoshamei => buken["bukenTantoshamei"])
        logger.debug('transact_update_thousinginfo@cnt:' + @cnt.to_s)

        #次年度点検Yはスポットならnendoに、
        if buken["tenkenKbn"].to_i == 4 then
            @cnt =	TCheckInfo.where(:bukenCode => buken["bukenCode"].to_i).update_all(:seikyuhouhou => buken["seikyuhouhou"],:jinendotenkenY => CommonUtil.konnendo )
        else
            #それ以外なら年度に点検区分を足した値
            @sql_exe = ActiveRecord::Base.connection.update("UPDATE t_check_infos
																	SET	seikyuhouhou = #{buken['seikyuhouhou']},
					 													jinendotenkenY = nendo + #{buken['tenkenKbn']}
					 												WHERE bukenCode = #{buken['bukenCode']} ")
        end
        logger.debug('transact_update_tcheckinfo@cnt:' + @cnt.to_s)
    end

end
