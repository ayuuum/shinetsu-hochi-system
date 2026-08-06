class TenkenLoginController < ApplicationController
    before_action :mainte_check
    before_action :nendo_check
    def index
        @m_pwd = MPwd.new
        @uid = ''
        render :layout => 'normal'
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
            elsif  @uid.length != 4
                @error = 2
                @error_text = '<div class="login_message3">' + MESSAGE_02[1] + '</d>'
            else
                @tantosha = MPwd.where(:uid => @uid, :upass => @upass, :urole => MPWD_UROLE_TENKEN )

                if @tantosha.count != 0 then
                    session[:user_id_tenekn] = @uid
                    @user = MCheckpeople.where(:tenkentantoshaCode => @tantosha[0]["tenkentantoshaCode"])
                    session[:login_name_tenekn] = @user[0]["tenkentantoshamei"]
                    @error = 1
                    @query_str = 'yotei'
                else
                    @error = 2
                    @error_text = '<div class="login_message3">' + MESSAGE_02[1] + '</div>'
                end
            end
        end
    end

end
