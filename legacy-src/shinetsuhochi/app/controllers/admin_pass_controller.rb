class AdminPassController < ApplicationController
    before_action :mainte_check
    before_action :login_check
    before_action :dialog_init
    def index
        render :layout => 'menu'
    end

    def commit

        #押されたボタンの種類
        @commit_kind = params[:commit]

        #----------#
        # 変更処理 #
        #----------#
        if @commit_kind == "変更" then
            @error = 0
            @pass_1 = params[:nm_pas_ADP_Adminpass1]
            @pass_2 = params[:nm_pas_ADP_Adminpass2]
            @pass_3 = params[:nm_pas_ADP_Adminpass3]

            @correct_user = MPwd.where(:uid => session[:user_id])

            @correct_user.each do | user |
                @correct_user_id = user.uid
                @correct_user_upass = user.upass
            end
            #現在のパスワードが未入力
            if @pass_1 == '' then
                @error_message = MESSAGE_86 #楊健 2014-11-14 不具合43-15対応する

                #新しいパスワードが未入力
            elsif @pass_2 == '' then
                @error_message = MESSAGE_61

                #新しいパスワード(確認用)が未入力
            elsif @pass_3 == '' then
                @error_message = MESSAGE_62

                #新しいパスワードが４桁未満
            elsif @pass_2.length < 4 then
                @error_message = MESSAGE_63

                #新しいパスワードが確認用と一致しない
            elsif @pass_2 != @pass_3 then
                @error_message = MESSAGE_64

                #現在のパスワードが未入力
            elsif 	@pass_1 == '' then
                @error_message = MESSAGE_59

                #現在のパスワードが間違っている
            elsif @correct_user_upass != @pass_1 then
                @error_message = MESSAGE_60

                #更新
            else
                MPwd.where(:uid => @correct_user_id).update_all(:upass => @pass_2)
                @error = 1
                @dialog_title = MESSAGE_MESSAGE2_TITLE
                @error_message = MESSAGE_65
            end
            #------------#
            # クリア処理 #
            #------------#
        elsif @commit_kind == 'クリア' then
            @error = 2
        end

    end

end
