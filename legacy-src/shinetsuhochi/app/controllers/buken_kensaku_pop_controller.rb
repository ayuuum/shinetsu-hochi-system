class BukenKensakuPopController < ApplicationController
    before_action :mainte_check
    before_action :dialog_init
    def index
        #初期化
        #search_action("", "")
        @error = 0
        @sql_housinginfos = ''
        @sql_count = 0
        #ヘッダー、フッターなし
        render :layout => 'normal2'
    end

    def commit

        #押されたボタン
        @commit_kind = params[:commit]

        if @commit_kind == '検索' then
            @hachushamei = params[:kensakuhachusha]
            @bukenmei = params[:kensakubuken]

            if @hachushamei == '' && @bukenmei == '' then
                @error_message = MESSAGE_24
            else
                @buken_sql = ( params[:kensakubuken] == '' )? "" :
                "AND THo.bukenmei LIKE '%" +  params[:kensakubuken].gsub(Str_pattern2,ESCAPE_SQL) + "%'"
                @hachusha_sql = ( params[:kensakuhachusha] == '' )? "" :
                " AND MOr.hachushamei LIKE '%" +  params[:kensakuhachusha].gsub(Str_pattern2,ESCAPE_SQL) + "%'"

                #条件を加え検索
                search_action(@buken_sql, @hachusha_sql)
                @error = 1
            end
        end

        if @commit_kind == '物件選択' then
            #クリア
            @teishiFlg = ''
            @buken_sentaku = ''
            @hachushamei = ''
            @bukenmei = ''

            #選択した値取得
            @buken_sentaku = params[:bukensentaku]

            if @buken_sentaku == nil then
                @error_message = MESSAGE_27
            else
                @teishiFlg = params[:bukensentaku][-1]
                @bukenCode = params[:bukensentaku].split(",")
                @bukenCode = @bukenCode[0]

                if @teishiFlg == '1' then
                    @error_message = MESSAGE_51
                else
                    #点検予定/実績一覧に物件名を表示して、画面を閉じる
                    @m_housinginfos = MHousinginfo.where(:bukenCode => @bukenCode)
                    @error = 3
                    @kensakubukenmei = @m_housinginfos[0]["bukenmei"].to_s
                    print @kensakubukenmei
                end
            end

        end

        if @commit_kind == '閉じる' then
            @error = 2
        end
    end

    def search_action(hachusha, buken)
        #初期化
        @html_string = ''
        @sql_count = 0

        @sql_housinginfos = ActiveRecord::Base.connection.
        select("	SELECT DISTINCT MHo.bukenCode, MHo.teishiFlg, A.bukenmei, A.hachushaCode, A.hachushamei
						FROM m_housinginfos AS MHo
						INNER JOIN
							( SELECT DISTINCT THo.bukenCode, THo.bukenmei, MOr.hachushaCode, MOr.hachushamei
							  FROM t_housinginfos AS THo, m_orderingpatries AS MOr
							  WHERE THo.hachushaCode = MOr.hachushaCode " \
        + hachusha + buken + ") A
							  ON MHo.bukenCode = A.bukenCode ORDER BY A.hachushamei ASC ")

        @sql_count = @sql_housinginfos.count

        for num in 0.. @sql_count - 1 do
            @html_string += '<div class="bkp_info01"><input type="radio" name="bukensentaku" value="' \
            + @sql_housinginfos[num]["bukenCode"].to_s + ',' + @sql_housinginfos[num]["teishiFlg"].to_s + '"></div>' \
            + '<input type="text" class="bkp_info10" name="hachushamei" readonly value="' + @sql_housinginfos[num]["hachushamei"].to_s.gsub(Str_pattern1,ESCAPE_HTML) + '" tabindex="' + (4 + 2*num).to_s + '">' \
            + '<input type="text" class="bkp_info1' + @sql_housinginfos[num]["teishiFlg"].to_s + '" name="bukenhamei" readonly value="' \
            + @sql_housinginfos[num]["bukenmei"].to_s.gsub(Str_pattern1,ESCAPE_HTML) + '" tabindex="' + (5 + 2*num).to_s + '">'
        end
    end

end
