class JisekiTorokuController < ApplicationController
    before_action :mainte_check
    before_action :dialog_init
    def index

        if (!params[:id1].blank?) then
            #0:物件コード,1:年度,2:点検種別,3:点検予定月,4:枝番,5:補修ステータス,6:点検ステータス設定,7:発注者コード、8:点検担当者コード、9:行番号、10:検索点検、11:検索補修
            @tenken = Rack::Utils.parse_query(params[:id1])
            session[:tenken_joho] = Array.new(13)
            for num in 0..9 do
                logger.debug(num.to_s + ':'+ @tenken[num.to_s].to_s)
                session[:tenken_joho][num] = @tenken[num.to_s].to_i
            end
            session[:search_tenken] = @tenken["10"]
            session[:search_hoshu] = @tenken["11"]
            session[:search_month] = @tenken["12"].to_i
        else
            @return_address = (session[:user_id].nil?) ? 'yotei' : 'yotei_admin'
            redirect_to :controller => @return_address
            return false
        end

        @error = 0
        #物件名取得
        @buken_joho = MHousinginfo.where(:bukenCode => session[:tenken_joho][0])
        #発注者名取得
        @hachusha_joho = MOrderingpatry.where(:hachushaCode => session[:tenken_joho][7])
        @m_kind_joho = MKind.where(:shubetuKbn => MKIND_KBN_TENKENSHUBETU,:shubetu =>  session[:tenken_joho][2])
        @m_checkpeople_joho = MCheckpeople.where(:tenkentantoshaCode => session[:tenken_joho][8])
        @t_chktrack_joho = TChktrackrecInfo.where(:bukenCode => session[:tenken_joho][0], :nendo => session[:tenken_joho][1], :setubishubetuKbn => MKIND_KBN_SETSUBISHUBETU,:setubishubetu => GetSetsubishubetu[session[:tenken_joho][2]], :tenkenshubetuKbn => MKIND_KBN_TENKENSHUBETU,:tenkenshubetu => session[:tenken_joho][2], :tenkenyoteiM => session[:tenken_joho][3], :edaban => session[:tenken_joho][4])

        @t_check_joho = TCheckInfo.where(:bukenCode => session[:tenken_joho][0], :nendo => session[:tenken_joho][1], :setubishubetuKbn => MKIND_KBN_SETSUBISHUBETU,:setubishubetu => GetSetsubishubetu[session[:tenken_joho][2]], :tenkenshubetuKbn => MKIND_KBN_TENKENSHUBETU,:tenkenshubetu => session[:tenken_joho][2], :tenkenyoteiM1 => session[:tenken_joho][3])

        @t_repair_joho = TRepairInfo.where(:bukenCode => session[:tenken_joho][0], :nendo => session[:tenken_joho][1], :setubishubetuKbn => MKIND_KBN_SETSUBISHUBETU,:setubishubetu => GetSetsubishubetu[session[:tenken_joho][2]], :tenkenshubetuKbn => MKIND_KBN_TENKENSHUBETU,:tenkenshubetu => session[:tenken_joho][2], :tenkenyoteiM => session[:tenken_joho][3], :edaban => session[:tenken_joho][4])

        session[:trac_id] = @t_chktrack_joho[0]["id"]

        #表示する場合
        #「点検完了年月日」があり、「補修有無」が１、補修情報にレコードがある場合、
        if @t_repair_joho.count != 0 and @t_chktrack_joho[0]["hoshuumu"] == 1 then
            #補修情報表示
            @hyouji_css = 'display:block;'
            @hoshu_umu = true
        else
            #表示しない場合
            @hyouji_css = 'display:none;'
            @hoshu_umu = false
        end

        #点検ステータス
        @tenken_status = Array.new(8,false)
        #点検ステータスが未着手１の場合
        if session[:tenken_joho][6] == 1 then
            @tenkenkanryo = Time.now.strftime("%Y/%m/%d")
            @tenken_status[2] = true
        else
            @tenkenkanryo =  @t_chktrack_joho[0]["tenkenkanryoYMD"].to_s.gsub('-','/')
            @tenken_status[7] = true
        end

        #補修ステータス
        @hoshu_status = Array.new(8,false)
        if session[:tenken_joho][5] == 0 then
            @hoshu_status[1] = true
        else
            @hoshu_status[7] = true
        end

        #補修情報
        if @t_repair_joho.count == 0 then
            session[:t_repair_id] = 0
            #発生年月日は値が無ければ当日日付
            @haseiYMD = Time.now.strftime("%Y/%m/%d")
            @hoshukanryoYMD = ''
            @mitsumori = ''
            @hasei_ymd_ari = 0
        else
            session[:t_repair_id] =  @t_repair_joho[0]["id"]
            @haseiYMD = (@t_repair_joho[0]["haseiYMD"].nil?) ? Time.now.strftime("%Y/%m/%d") : @t_repair_joho[0]["haseiYMD"].to_s.gsub('-','/')
            @hoshukanryoYMD =  @t_repair_joho[0]["hoshukanryoYMD"].to_s.gsub('-','/').to_s
            @mitsumori = @t_repair_joho[0]["mitumorinaiyou"].to_s
            @hasei_ymd_ari = 1
        end
        session[:hoshukanryoYMD] = @hoshukanryoYMD
        #人工
        @jinko = @t_chktrack_joho[0]["jinko"].round == 0 ? 1.0: @t_chktrack_joho[0]["jinko"]

        @m_init_select = MInit.all
        session[:m_init_select] = @m_init_select
        @hoshu_statusmei = ( @tenken["5"] == "0" )? 'なし' : @m_init_select[0]["hoshustatusmei" + @tenken["5"].to_s]

        render :layout => 'normal2'
    end

    def commit
        #エラー表示ダイアログ設定

        #押されたボタン
        @commit_kind = params[:commit]

        if @commit_kind == '閉じる' then
            @error = 2
        elsif @commit_kind == '登録' then
            #値取得

            #点検ステータス：７は前とデータ同じ
            @tenkenstatus = params[:tenkenstatus].to_i == 7 ? session[:tenken_joho][6] :  params[:tenkenstatus].to_i
            @tenkenkanryoYMD = params[:tenkenkanryoYMD]
            @hoshustatus = (params[:hoshustatus].to_i == 7 or params[:hoshuumu] == '2') ? session[:tenken_joho][5] : params[:hoshustatus].to_i
            @hoshukanryoYMD = ( params[:hoshuumu] == '2') ? session[:hoshukanryoYMD] : params[:hoshukanryoYMD]
			 
			if @tenkenstatus == 1 && @tenkenkanryoYMD != '' then
				@error_message = MESSAGE_89
				@error = 4
				return
			end
			if @hoshustatus == 1 && @hoshukanryoYMD != '' then
				@error_message = MESSAGE_90
				@error = 5
				return
			end
            #点検ステータスが１でなく、点検完了日に入力が無い場合エラー
            if @tenkenstatus != 1 && @tenkenkanryoYMD == '' then
                @focus = "datepicker1"
                @error_message = MESSAGE_52
            else
                #エラーが無ければ実績登録処理
                @hoshukanren = ''
				  if @tenkenkanryoYMD == '' then
				      TChktrackrecInfo.where(:id => session[:trac_id]).update_all(:tenkenkanryoYMD => nil,:jinko => params[:jinko], :tenkenstatus => @tenkenstatus, :hoshuumu => params[:hoshuumu].to_i, :biko => params[:biko])
                else
				      TChktrackrecInfo.where(:id => session[:trac_id]).update_all(:tenkenkanryoYMD => @tenkenkanryoYMD, :jinko => params[:jinko], :tenkenstatus => @tenkenstatus, :hoshuumu => params[:hoshuumu].to_i, :biko => params[:biko])
				  end
                

                #補修情報が「あり」ならば補修情報も更新
                if params[:hoshuumu] == '1' then
                    #発生年月日が無い場合エラー
                    if params[:haseiYMD] == '' then
                        @focus = "datepicker2"
                        @error_message = MESSAGE_53
							return
                        #補修ステータス３で完了年月日の入力が無い場合はエラー
                    elsif @hoshustatus == 3 && @hoshukanryoYMD == '' then
                        @focus = "datepicker3"
                        @error_message = MESSAGE_54
							return
                        #登録されている情報が無ければ新規登録
                    elsif session[:t_repair_id] == 0 then
                        @t_repair_info = TRepairInfo.new
                        @t_repair_info.bukenCode = session[:tenken_joho][0]
                        @t_repair_info.nendo = session[:tenken_joho][1]
                        @t_repair_info.setubishubetuKbn = MKIND_KBN_SETSUBISHUBETU
                        @t_repair_info.setubishubetu = GetSetsubishubetu[session[:tenken_joho][2]]
                        @t_repair_info.tenkenshubetuKbn = MKIND_KBN_TENKENSHUBETU
                        @t_repair_info.tenkenshubetu = session[:tenken_joho][2]
                        @t_repair_info.tenkenyoteiM = session[:tenken_joho][3]
                        @t_repair_info.edaban = session[:tenken_joho][4]
                        @t_repair_info.haseiYMD = params[:haseiYMD]
                        @t_repair_info.hoshukanryoYMD = @hoshukanryoYMD
                        @t_repair_info.hoshuStatus = @hoshustatus
                        @t_repair_info.mitumorinaiyou =  params[:mitumorinaiyou]
                        @t_repair_info.save!

                        #登録されている情報があれば更新
                    else
							if @hoshukanryoYMD == '' then
								TRepairInfo.where(:id => session[:t_repair_id]).update_all(:haseiYMD => params[:haseiYMD], :hoshukanryoYMD => nil,:hoshuStatus => @hoshustatus, :mitumorinaiyou => params[:mitumorinaiyou])
							else
                        		TRepairInfo.where(:id => session[:t_repair_id]).update_all(:haseiYMD => params[:haseiYMD], :hoshukanryoYMD => @hoshukanryoYMD, :hoshuStatus => @hoshustatus, :mitumorinaiyou => params[:mitumorinaiyou])
							end
                    end
                    #補修情報：物件コード毎に 補修ステータス０～４のレコードがあれば 点検実績の物件コード、年度毎に補修関連有無＝１(あり（残件あり））
                    #                                    ５、６のレコードだけなら 補修関連有無＝２(あり）に更新する
                    @zanken = [0,1,2,3,4]
                    @zanken_f = [5,6]
                    if TRepairInfo.where(:bukenCode => session[:tenken_joho][0], :hoshuStatus => @zanken).exists? then
                        TChktrackrecInfo.where(:bukenCode => session[:tenken_joho][0]).update_all(:hoshukanrenumu => 1)
                        @hoshukanren = 1
                    elsif RepairInfo.where(:bukenCode => session[:tenken_joho][0], :hoshuStatus => @zanken_f).exists? then
                        TChktrackrecInfo.where(:bukenCode => session[:tenken_joho][0]).update_all(:hoshukanrenumu => 2)
                        @hoshukanren = 2
                    end
				  elsif session[:t_repair_id] != 0 then
						TRepairInfo.where(:id => session[:t_repair_id]).delete_all();
                end

                #一括変更チェックに物件コード,年度,点検種別,点検予定月,枝番,補修ステータス,点検ステータス設定,発注者コード、点検担当者コード、行番号、検索件数,検索条件点検、検索条件補修
                #呼び出し元(点検予定/実績一覧)画面更新
                @no = session[:tenken_joho][9]
                @search_tenken = Array.new(8,0)
                @search_hoshu = Array.new(8,0)
                @search_tenken = session[:search_tenken].split('_')
                @search_hoshu = session[:search_hoshu].split('_')
                #検索されている点検ステータス、補修ステータスに存在するか
                tenken_flg = @search_tenken.find {|item| item == @tenkenstatus.to_s }
                hoshu_flg = @search_hoshu.find {|item| item == @hoshustatus.to_s }
                #変更したレコードが点検ステータス、補修ステータス、点検実施月=点検完了日の検索条件に合わなければ
                #点検予定/実績一覧画面で、当該行を一覧から削除、検索数を変更

                if (tenken_flg.nil? or hoshu_flg.nil? or (session[:search_month] != 0 and CommonUtil.get_month(@tenkenkanryoYMD) != session[:search_month])) then
                    @henko = 1
                    #そうでなければ情報変更
                else

                    @bukenCode = session[:tenken_joho][0]
                    @hachushaCode = session[:tenken_joho][7]
                    @sentaku_key = "#{@bukenCode},#{session[:tenken_joho][1]},#{session[:tenken_joho][2]},#{session[:tenken_joho][3]},#{session[:tenken_joho][4]},#{@hoshustatus},#{@tenkenstatus},#{session[:tenken_joho][7]},#{session[:tenken_joho][8]},#{@no},#{session[:search_tenken]},#{session[:search_hoshu]},#{session[:search_month]}"
                    @tenken_statusmei =  session[:m_init_select][0]["tenkenstatusmei" + @tenkenstatus.to_s]
                    @hoshu_statusmei = session[:m_init_select][0]["hoshustatusmei" + @hoshustatus.to_s]
                    @biko = params[:biko]
                    @henko = 2
                end

                @error = 3
                #ページ遷移は完了画面へ
                @query_str = 'jiseki_toroku_kanryo'

            end

        end
    end
end
