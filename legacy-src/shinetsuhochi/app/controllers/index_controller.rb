class IndexController < ApplicationController
    before_action :mainte_check
    before_action :nendo_check
    def index
        session[:user_id] = nil
        session[:user_id_tenekn] = nil
        session[:login_name_tenekn] = nil

        render :layout => 'normal'
    end
end
