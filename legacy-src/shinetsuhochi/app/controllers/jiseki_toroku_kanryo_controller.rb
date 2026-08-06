class JisekiTorokuKanryoController < ApplicationController
    before_action :dialog_init
    def index
        #ヘッダー、フッターなし
        render :layout => 'normal2'
    end

    def commit
        #押されたボタン
        @commit_kind = params[:commit]
        @error = @commit_kind == '閉じる' ? 2: 1
    end
end
