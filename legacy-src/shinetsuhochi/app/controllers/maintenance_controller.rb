class MaintenanceController < ApplicationController
    def index
        @backupfiles = []
        list = ""
        if !params[:first].blank? and params[:first] =~ /^[0-9]+$/ then
            logger.debug("クエリパラメータ：" +params[:first])
            list = params[:first]
            @backupfiles = CommonUtil.recursive_dir("./db/backup/" + list.slice(0,4) + "/" + list.slice(4,2))
            if @backupfiles.count != 0 then
                @backupfiles.each do |data|
                    if ( data.slice(0,12) == list ) then
                        @success = true
                        break
                    end
                end
            else
                @success = false
            end
        else

            @success = false
        end

        if @success then
            @cnt = MSysstatus.update_all(:sstatus => 0 )
            logger.info("@cnt" + @cnt.to_s)
            o,s = CommonUtil.backup
            logger.info("back" + o.to_s)
            logger.info("back" + s.to_s)

            o,s = CommonUtil.restore(list)
            logger.info("restore" + o.to_s)
            logger.info("restore" + s.to_s)

            @cnt = MSysstatus.update_all(:sstatus => 0 )
            logger.info("@cnt" + @cnt.to_s)
        else

        end

        render :layout => 'normal'
    end

end
