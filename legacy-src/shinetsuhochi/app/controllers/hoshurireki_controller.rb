class HoshurirekiController < ApplicationController
    #	before_action :login_check_common
    before_action :mainte_check
    before_action :dialog_init
    def index

        #物件コードは数値なので :first, :secondが数値以外なら表示無効
        if params[:first].blank? or !(params[:first].to_s =~ /^[0-9]+$/ ) or params[:second].blank? or !(params[:second].to_s =~ /^[0-9]+$/ ) then
            redirect_to :controller => 'buken_kensaku'
            return false
        else
            @@bukenCode = params[:first].to_i
            @@hachushaCode = params[:second].to_i
            #--------------------------#
            #発注者情報をフォームにセット#
            #--------------------------#
            @hachusha_joho = MOrderingpatry.where(:hachushaCode => @@hachushaCode)

            @hachusha_joho.each do |hachusha_list|
                @hachushamei = hachusha_list.hachushamei
            end
            #-------------------------#
            #物件情報をフォームにセット#
            #-------------------------#
            @buken_joho = MHousinginfo.where(:bukenCode => @@bukenCode)

            @buken_joho.each do |buken_list|
                @bukenmei = buken_list.bukenmei
            end

            #
            @hoshulist = ActiveRecord::Base.connection.
            select(" SELECT haseiYMD, mitumorinaiyou, hoshukanryoYMD,
							CASE TRi.hoshuStatus WHEN 1 THEN MIn.hoshustatusmei1
		   											WHEN 2 THEN MIn.hoshustatusmei2
                     							WHEN 3 THEN MIn.hoshustatusmei3
                    								WHEN 4 THEN MIn.hoshustatusmei4
                     							WHEN 5 THEN MIn.hoshustatusmei5
                     							WHEN 6 THEN MIn.hoshustatusmei6 ELSE NULL END AS hoshuStatusmei
						  FROM m_inits AS MIn, t_repair_infos AS TRi
						  WHERE TRi.bukenCode = " + @@bukenCode.to_s +  "
						  ORDER BY haseiYMD DESC ")
            @kensu = @hoshulist.count
            @@hoshulist = @hoshulist
            @@bukenmei = @bukenmei
            @@hachushamei = @hachushamei
            @kuroji_status1 = CommonUtil.kuroji_statusmei_hoshu_1
            @kuroji_status2 = CommonUtil.kuroji_statusmei_hoshu_2
            @@kuroji_status1 = @kuroji_status1
            @@kuroji_status2 = @kuroji_status2
        end

        render :layout => 'normal2'
    end

    def commit

        @error = 0
        #押されたボタンの種類
        @commit_kind = params[:commit]

        if @commit_kind == '帳票出力' then
            #押されたボタンの種類
            chohyo_hoshurireki
        elsif @commit_kind == '閉じる' then
            @error = 2
        end

    end

    def chohyo_hoshurireki
        #帳票１ページあたりの表示件数
        @page_max_kensu =	3

        @count_u = @@hoshulist.count

        @total_page = (@count_u.to_f / @page_max_kensu.to_f).ceil
        t = Time.now
        @t_date = t.year.to_s + '年' +  t.month.to_s + '月' + t.day.to_s + '日'

        #header　実績補修・点検情報　共通部分　
        data = []

        d1 = {	:text_date		=> @t_date,
            :default		=> []}

        for @soeji in 0..@count_u - 1 do

            d1[:default] << {	:text_no => @soeji + 1,
                :text_bukenmei => @@bukenmei,
                :text_hachushamei => @@hachushamei,
                :text_date1 =>  @@hoshulist[@soeji]["haseiYMD"].to_s.gsub("-","/"),
                :text_date2 => @@hoshulist[@soeji]["hoshukanryoYMD"].to_s.gsub("-","/"),
                :text_hoshu_statusmei  => @@hoshulist[@soeji]["hoshuStatusmei"],
                :text_mitsumori => @@hoshulist[@soeji]["mitumorinaiyou"]}
        end

        data << d1

        report = ThinReports::Report.create do |r|
            r.use_layout  File.join(Rails.root, 'app','views', 'hoshurireki', 'hoshurireki.tlf') do |config|

                r.events.on :page_create do |e|
                    e.page.item(:text_page).value(e.page.no.to_s + '/' +  @total_page.to_s + 'ページ')
                end

                config.list(:default) do

                end
            end

            data.each do |header|
                r.start_new_page

                r.page.values(:text_date		=> header[:text_date])

                header[:default].each do |detail|
=begin
					r.page.list(:default).add_row do |row|
						row.item(:text_no).value(@soeji + 1)
						row.item(:text_bukenmei).value(detail[:text_bukenmei])
						row.item(:text_hachushamei).value(detail[:text_hachushamei])
						row.item(:text_date1).value(detail[:text_date1])
						row.item(:text_date2).value(detail[:text_date2])
						row.item(:text_hoshu_statusmei).value(detail[:text_hoshu_statusmei])
						row.item(:text_mitsumori).value(detail[:text_mitsumori])
						if detail[:text_hoshu_statusmei] != @@kuroji_status1 and detail[:text_hoshu_statusmei] != @@kuroji_status2 then
							row.item(:text_hoshu_statusmei).style(:color,'#ff0000')
						end
					end
=end

                    r.page.list(:default).add_row(detail)
                end
            end
        end
        #report.generate_file(File.join(Rails.root, 'public', @pdf_name))
        @id = (session[:user_id].nil?) ? session[:user_id_tenekn] : session[:user_id]
        @pdf_name = CommonUtil.open_pdf(report, 'hoshurireki', format("%05d",@id))
        @error = 1
    end

end
