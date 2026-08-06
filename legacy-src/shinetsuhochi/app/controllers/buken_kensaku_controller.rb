class BukenKensakuController < ApplicationController
    before_action :mainte_check
    before_action :login_check
    before_action :dialog_init
    def index

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
        #初期表示は条件クリアで検索
        #search_action("", "", "")

        render :layout => 'menu'
    end

    def commit

        @error = 0

        #押されたボタンの種類
        @commit_kind = params[:commit]

        #ラジオボタンのvalue
        @buken_list = params[:buken_list]
        @select_buken_code = 0
        @select_hachusha_code = 0
        @select_buken_teishiflg = 0
        if !@buken_list.nil? then
            #0から10桁が発注者コード
            @select_hachusha_code = @buken_list.slice(0,10).to_i
            #10から10桁が物件コード
            @select_buken_code = @buken_list.slice(10,10).to_i
            #20から1桁が停止フラグ
            @select_buken_teishiflg = @buken_list.slice(20,1).to_i
        end
        logger.debug("@select_buken_teishiflg:" + @select_buken_teishiflg.to_s)
        logger.debug("@select_buken_code:" + @select_buken_code.to_s)
        logger.debug("@select_hachusha_code:" + @select_hachusha_code.to_s)
        #----------#
        # 検索処理 #ber.gsub(Str_pattern2,ESCAPE_SQL))
        #----------#
        if @commit_kind == '検索' then

            @buken_sql = ( params[:nm_txt_BKS_Buken] == '' )? "" :
            "AND THo.bukenmei LIKE '%" +  params[:nm_txt_BKS_Buken].gsub(Str_pattern2,ESCAPE_SQL) + "%'"
            @hachusha_sql = ( params[:nm_txt_BKS_Hachusha] == '' )? "" :
            " AND MOr.hachushamei LIKE '%" +  params[:nm_txt_BKS_Hachusha].gsub(Str_pattern2,ESCAPE_SQL) + "%'"
            @tenken_sql = ( params[:nm_Rad_TenkenKbn] == '0' )? "" : "WHERE MHo.tenkenKbn = " + params[:nm_Rad_TenkenKbn]

            #条件を加え検索
            search_action(@buken_sql, @hachusha_sql, @tenken_sql)
            @error = 1

            #検索以外のボタン押された場合
        else
            @tsh = 0
            #ラジオボタンが選択されていない場合
            if @select_buken_code == 0 then
                @error_message = MESSAGE_27

                #ラジオボタンが選択されている場合
            elsif @commit_kind == '物件変更／停止へ' then
                #物件変更/停止ボタン押され、選択された物件が停止されている場合
                if @select_buken_teishiflg == 1 then
                    @error_message = MESSAGE_51
                    @tsh = 1
                    #物件変更/停止ボタン押され、選択された物件が停止されていない場合
                else
                    @error = 2
                    #buken_henko_sakujo/:bukenCodeに遷移
                    @query_str = 'buken_henko_sakujo/index/' + @select_buken_code.to_s + '/' + @select_hachusha_code.to_s
                end

                #物件参照ボタン押された場合
            elsif @commit_kind == '物件詳細参照へ' then
                @error = 3
                #buken_joho_shosai/:bukenCodeに遷移
                @query_str = 'buken_joho_shosai/index/' + @select_buken_code.to_s + '/' + @select_hachusha_code.to_s

            elsif @commit_kind == '再利用' then
                #再利用ボタン押され、選択された物件が停止されている場合
                if @select_buken_teishiflg == 1 then
                    @error = 4
                    #buken_toroku/:bukenCodeに遷移
                    @query_str = 'buken_toroku/index/' + @select_buken_code.to_s + '/' + @select_hachusha_code.to_s

                    #再利用ボタン押され、選択された物件が停止されてない場合
                else
                    @error_message = MESSAGE_82
                end

            elsif @commit_kind == '削除' then
                #物件削除完了画面(delete) に:first => 削除する物件コード、:second => 物件コードのMD5
                #                       :third => 発注者コード、 :fourth => 発注者コードMD5で遷移する
                @query_str = 'buken_henko_kanryo/delete/' + @select_buken_code.to_s + '/' + Digest::MD5.hexdigest(@select_buken_code.to_s) + '/' + @select_hachusha_code.to_s + '/' + Digest::MD5.hexdigest(@select_hachusha_code.to_s)
                @error_message = MESSAGE_28
                @error = 5
            end
        end
        logger.debug("@error:" + @error.to_s)
        logger.debug("@error_message[0]:" + @error_message[0])
        #	render :layout => 'menu'
    end

    #-----------------------#
    # 検索実行と表のhtml作成 #
    #-----------------------#
    def search_action(hachusha, buken, tenken)

        @sql_housinginfos = ActiveRecord::Base.connection.
        select("	SELECT DISTINCT MHo.bukenCode, MHo.teishiFlg, A.bukenmei, A.hachushaCode, A.hachushamei
						FROM m_housinginfos AS MHo
						INNER JOIN
							( SELECT DISTINCT THo.bukenCode, THo.bukenmei, MOr.hachushaCode, MOr.hachushamei
							  FROM t_housinginfos AS THo, m_orderingpatries AS MOr
							  WHERE THo.hachushaCode = MOr.hachushaCode " \
        + buken + hachusha +  ") A
							  ON MHo.bukenCode = A.bukenCode " \
        + tenken + "  ORDER BY A.hachushamei ASC ")
        #
        @sql_count = @sql_housinginfos.count

        @html_string = ''
        for num in 0.. @sql_count - 1 do
            #１列目：ラジオボタンのvalueに 10桁の発注者コード+10桁の物件コード+1桁の停止フラグをセット
            #２列目：発注者名　３列目：物件名(停止物件にはフォント赤スタイル適用)　
            #		@html_string += '<div class="kugiri"></div><div class="bks_body01"><input type="radio" name="buken_list" value="' \
            #		+ format("%010d",@sql_housinginfos[num]["hachushaCode"]) + format("%010d",@sql_housinginfos[num]["bukenCode"]) \
            #		+ @sql_housinginfos[num]["teishiFlg"].to_s + '" class="bks_radio"></div>' \

            @html_string += '<div class="kugiri"></div><span class="bks_body01"><input type="radio" name="buken_list" value="' \
            + format("%010d",@sql_housinginfos[num]["hachushaCode"]) + format("%010d",@sql_housinginfos[num]["bukenCode"]) \
            + @sql_housinginfos[num]["teishiFlg"].to_s + '" class="bks_radio"></span>' \
            + '<input type="text" class="bks_body020" readonly="true" value="' + @sql_housinginfos[num]["hachushamei"].to_s.gsub(Str_pattern1,ESCAPE_HTML) + '" tabindex="24">' \
            + '<input type="text" class="bks_body02' + @sql_housinginfos[num]["teishiFlg"].to_s + '" readonly="true" value="' + @sql_housinginfos[num]["bukenmei"].to_s.gsub(Str_pattern1,ESCAPE_HTML) + '" tabindex="24">'
        end
        #			+ '<textarea class="bks_body020" readonly>' + @sql_housinginfos[num]["hachushamei"].to_s.gsub(Str_pattern1,ESCAPE_HTML) + '</textarea>' \
        #			+ '<textarea class="bks_body02' + @sql_housinginfos[num]["teishiFlg"].to_s + '" readonly>' + @sql_housinginfos[num]["bukenmei"].to_s.gsub(Str_pattern1,ESCAPE_HTML) + '</textarea>'
    end

end
