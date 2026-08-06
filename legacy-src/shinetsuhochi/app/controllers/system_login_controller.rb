class SystemLoginController < ApplicationController
    before_action :mainte_check
    before_action :login_check
    def index
        @error = 0
        @m_pwd = MPwd.new
        @uid = ''
        render :layout => 'menu'
    end

    def commit

        @error = 0

        #押されたボタンの種類
        @commit_kind = params[:commit]
        if @commit_kind == 'ログイン' then
            @m_pwd = MPwd.new
            @uid = params[:uid]
            @upass = params[:upass]

            if @uid == '' or @upass == '' then
                @error = 2
                @error_text = '<div class="login_message3">' + MESSAGE_01[1] + '</div>'
                #	render :layout => 'normal'
            elsif  @uid.length != 4
                @error = 2
                @error_text = '<div class="login_message3">' + MESSAGE_02[1] + '</d>'
            elsif MPwd.where(:uid => @uid, :upass => @upass, :urole => MPWD_UROLE_SYSTEM).exists? then
                #session[:user_id] = @uid
                @error = 1
                @query_str = 'restore'
                #	redirect_to :controller => 'admin_menu'
            else
                @error = 2
                @error_text = '<div class="login_message3">' + MESSAGE_02[1] + '</div>'
                #render :layout => 'normal'
            end
            #------------#
            # クリア処理 #
            #------------#
        elsif @commit_kind == 'キャンセル' then
            @error = 3
        end

    end

end
