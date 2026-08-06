class RestoreController < ApplicationController
    require 'open3'
    #ログインチェック
    before_action :mainte_check
    before_action :login_check
    before_action :dialog_init

    def index
	     
		 t = Time.now
        @genY= t.year.to_s
        @genM = format("%02d",t.month)

        @restoreY =  Hash.new

        #年のセレクトボックス作成
        for year in (@genY.to_i-4)..@genY.to_i do
            @restoreY.store(year.to_s + '年',year)
        end

        #月のセレクトボックス作成
        @restoreM =  Hash.new
        @restoreM.store('全月',-1)
        for month in 1..12 do
            @restoreM.store(month.to_s + '月',format("%02d",month))
        end

        @backupfiles = []


        @backupfiles = CommonUtil.recursive_dir("./db/backup/#{@genY}/#{@genM}")
        @backupfiles = @backupfiles.sort.reverse
        @count = @backupfiles.count

        @error = 0
        #backup
        #		restore("")
        #		recursive_dir("./db/backup/")
        #			@backupfiles.each_index do |file|
        #			p file
        #		end
        #render :layout => 'normal'

        render :layout => 'menu'
    end

    def commit

        @error = 0
        #押されたボタンの種類
        @commit_kind = params[:commit]

        @error_message = ["","",""]
        if @commit_kind == '検索' then
            @backupfiles = []
            year = params[:restoreY]
            month = params[:restoreM]
            #全月の場合
            if (month == "-1") then
                for index in 1..12 do
                    @backupfiles.concat(CommonUtil.recursive_dir("./db/backup/#{year}/" + format("%02d",index)))
                end
            else
                #月指定の場合
                @backupfiles = CommonUtil.recursive_dir("./db/backup/#{year}/#{month}")
            end
            @backupfiles = @backupfiles.sort.reverse
            @html_string = ""
            @count = @backupfiles.count
            @backupfiles.each do |list|
                #バックアップファイル一覧の作成
                @date = "#{list.slice(0,4)}年 #{list.slice(4,2)}月 #{list.slice(6,2)}日  #{list.slice(8,2)}:#{list.slice(10,2)}"
                @html_string += '<div class="kugiri"></div><div class="rst_body01"><input type="radio" name="restore_list" value="' + list + '" class="bks_radio" tabindex="24"></div><input type="text" class="rst_body02" readonly="true" value="' + @date + '" tabindex="25">'
            end
            @error = 1
            #リストアボタンクリック
        elsif @commit_kind == 'リストア' then
            if params[:restore_list].blank? then
                #ラジオボタンが選択されていない場合
                @error_message = MESSAGE_88
            else
                #選択されていたら確認ダイアログ表示。OKならメンテナンス画面に遷移
                @error = 3
                list = params[:restore_list]
                @date = "#{list.slice(0,4)}年 #{list.slice(4,2)}月#{list.slice(6,2)}日 #{list.slice(8,2)}:#{list.slice(10,2)}"
                @error_message = MESSAGE_87
                @error_message[1] = "現在のデータをバックアップ後、#{@date}のデータをリストアします。よろしいですか？"
                @error_message[2] = "確認"
                #リストア時間をクエリパラメータとして送信
                @query_str = "maintenance/index/" + list.slice(0,12)

            end
        end

    end

end
