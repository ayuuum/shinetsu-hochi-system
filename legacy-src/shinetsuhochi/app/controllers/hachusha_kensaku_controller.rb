class HachushaKensakuController < ApplicationController
    before_action :mainte_check
    before_action :login_check
    before_action :dialog_init
    def index
        @buken_toroku_flg = (params[:first].nil?) ? false : true

        #種別区分が'3'は点検区分 m_housinginfos AS MHo,MHo.bukenCode = THo.bukenCode AND MHo.bukenCode,
        @m_kind_select = MKind.where(:shubetuKbn => MKIND_KBN_TENKEN)

        #表html
        @html_string = ''
        #SQL文の実行結果
        @sql_housinginfos = ''
        #実行されたSQLの件数(行数)
        @sql_count = 0
        #状態
        @error = 0

        #遷移先
        @query_str = ''

        render :layout => 'normal2'
    end

    def commit
        @error = 0

        #押されたボタンの種類
        @commit_kind = params[:commit]

        #ラジオボタンのvalue
        @buken_list = params[:buken_list]
        @select_hachusha_code = 0
        if !@buken_list.nil? then
            #0から10桁が発注者コード
            @select_hachusha_code = @buken_list.slice(0,10).to_i
        end
        logger.debug("@select_hachusha_code:" + @select_hachusha_code.to_s)
        #----------#
        # 検索処理 #
        #----------#
        if @commit_kind == '検索' then
            if params[:nm_txt_BKS_Buken] == '' and params[:nm_txt_BKS_Hachusha] == '' then
                @error_message = MESSAGE_24
                @focus = 'id_txt_BKS_Hachusha'
            else
                @buken_sql = ( params[:nm_txt_BKS_Buken] == '' )? "" :
                "AND THo.bukenmei LIKE '%" +  params[:nm_txt_BKS_Buken].gsub(Str_pattern2,ESCAPE_SQL) + "%'"
                @hachusha_sql = ( params[:nm_txt_BKS_Hachusha] == '' )? "" :
                " WHERE A.hachushamei LIKE '%" +  params[:nm_txt_BKS_Hachusha].gsub(Str_pattern2,ESCAPE_SQL) + "%'"

                #条件を加え検索
                search_action(@buken_sql, @hachusha_sql)
                @error = 3
            end
            #発注者選択ボタンが押された場合
        elsif @commit_kind == '発注者選択' then
            #ラジオボタンが選択されていない場合
            if @select_hachusha_code == 0 then
                @error_message = MESSAGE_25

            else
                @m_orderingpatry = MOrderingpatry.where(:hachushaCode => @select_hachusha_code)
                @error = 1
                @m_hachushaCode = @m_orderingpatry[0]["hachushaCode"].to_s
                @m_hachushamei = @m_orderingpatry[0]["hachushamei"].to_s
                @m_hachuPostno = @m_orderingpatry[0]["hachuPostno"].to_s
                @m_hachuAdrs = @m_orderingpatry[0]["hachuAdrs"].to_s
                @m_hachuTelno = @m_orderingpatry[0]["hachuTelno"].to_s
                @m_hachuFaxno = @m_orderingpatry[0]["hachuFaxno"].to_s
                @m_hachuTandoshamei = @m_orderingpatry[0]["hachuTandoshamei"].to_s
                @m_sakujyoFlg = @m_orderingpatry[0]["sakujyoFlg"].to_s
                @b_torokuFlg = params[:nm_Hid_bukentorokuflg]

                logger.debug('@m_orderingpatry[0][hachushamei]:' + @m_orderingpatry[0]["hachushamei"])
            end
        elsif @commit_kind == '閉じる' then
            @error = 2
        end
        logger.debug("@error:" + @error.to_s)
        logger.debug("@error_message[0]:" + @error_message[0])
        #		render :layout => 'normal'
    end

    #-----------------------#
    # 検索実行と表のhtml作成 #
    #-----------------------#
    def search_action(buken, hachusha)
        @sql_housinginfos = (buken == '') ?
        #物件名に条件入らなければ　発注者マスタのみ検索
        ActiveRecord::Base.connection.select("	SELECT A.hachushaCode, A.hachushamei
						FROM m_orderingpatries AS A
						#{hachusha}
						ORDER BY A.hachushamei ASC ") :
        #検索条件与えられたら下記で検索
        ActiveRecord::Base.connection.select("	SELECT DISTINCT A.hachushaCode, A.hachushamei
						FROM m_housinginfos AS MHo
						INNER JOIN
							( SELECT DISTINCT MOr.hachushaCode, MOr.hachushamei,  THo.bukenCode, THo.bukenmei
							  FROM t_housinginfos AS THo, m_orderingpatries AS MOr
							  WHERE THo.hachushaCode = MOr.hachushaCode " +
        buken + "  ) A ON MHo.bukenCode = A.bukenCode " +
        hachusha +" ORDER BY A.hachushamei ASC  ")
        #'<textarea class="bks_body020" readonly wrap="off">' + @sql_housinginfos[num]["hachushamei"].to_s.gsub(Str_pattern1,ESCAPE_HTML) + '</textarea>'
        @sql_count = @sql_housinginfos.count

        @html_string = ''
        for num in 0.. @sql_count - 1 do

            #１列目：ラジオボタンのvalueに 10桁の発注者コードをセット
            #２列目：発注者名　３列目：物件名(停止物件にはフォント赤スタイル適用)　
            @html_string += '<div class="kugiri"></div><div class="bks_body01"><input type="radio" name="buken_list" value="' +
            format("%010d",@sql_housinginfos[num]["hachushaCode"]) + '"></div>' +
            '<input type="text" class="bks_body020" readonly="true" value="' + @sql_housinginfos[num]["hachushamei"].to_s.gsub(Str_pattern1,ESCAPE_HTML) + '" tabindex="24" >'
        end

    end

end
