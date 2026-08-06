module CommonUtil
	require 'open3'

	#現在の「年度」を数値(yyyy)で返す　m_initテーブルの"nendokaishiM"を年度開始月とする　
	#現在の月が開始年度月 x以上なら現在yyyy年が現在の年度。xより少なければyyyy-1が現在の年度
	def konnendo	
		#m_initsテーブルの最初の１件を取得
		#@m_kind_select = MInit.all.limit(1)
		#@m_kind_select.each do | y |
		#	@x = y.nendokaishiM	
		#end
		#t = Time.now
		#( t.month >= @x ) ? t.year : t.year - 1

		@m_kind_select = MInit.all
		@m_kind_select[0]["tounenY"]

	end
	module_function :konnendo
	
	def kaishiM
		#m_initsテーブルの最初の１件を取得
		@m_kind_select = MInit.all
		@m_kind_select[0]["nendokaishiM"]
	end
	module_function :kaishiM	
	
	def isJinendokoushin
		#m_initsテーブルの最初の１件を取得
		@m_kind_select = MInit.all
		@zenkaikoushinDate = @m_kind_select[0]["zenkaikoushinYMD"]
		@nendokaishiDate = @m_kind_select[0]["nendokaishiYMD"]
		 
		if (@zenkaikoushinDate.nil?) then
			return false
		end
		if (@zenkaikoushinDate > @nendokaishiDate) then
		   return true
		end

		return false
	end
	module_function :isJinendokoushin	

	#物件詳細参照画面で点検ステータスが黒字（赤字としない）点検ステータスを取得
	def kuroji_statusmei
		#m_initsテーブルの最初の１件を取得
		@m_kind_select = MInit.all
		@m_kind_select[0]["tenkenstatusmei5"]
	end
	module_function :kuroji_statusmei
	
	#物件詳細参照/補修履歴画面で補修ステータスが黒字（赤字としない）補修ステータス１を取得
	def kuroji_statusmei_hoshu_1
		#m_initsテーブルの最初の１件を取得
		@m_kind_select = MInit.all
		@m_kind_select[0]["hoshustatusmei5"]
	end
	module_function :kuroji_statusmei_hoshu_1
	
	#物件詳細参照/補修履歴画面で補修ステータスが黒字（赤字としない）補修ステータス２を取得
	def kuroji_statusmei_hoshu_2
		#m_initsテーブルの最初の１件を取得
		@m_kind_select = MInit.all
		@m_kind_select[0]["hoshustatusmei6"]
	end
	module_function :kuroji_statusmei_hoshu_2
	
   #物件コードから物件情報を返す
 	def buken_joho_str(bukenCode)
		return ActiveRecord::Base.connection.
			select(" SELECT DISTINCT T.bukenmei, T.bukenTandoshamei, T.bukenPostno, T.bukenAdrs, T.bukenTelno, T.bukenFaxno, M.tenkenkaishiY, M.tenkenKbn, A.seikyuhouhou, M.memo1, M.memo2
  						FROM t_housinginfos AS T, m_housinginfos AS M
  						LEFT OUTER JOIN (
							SELECT  DISTINCT bukenCode, seikyuhouhou
							FROM t_check_infos
							WHERE bukenCode = #{bukenCode}  ) A
						ON M.bukenCode = A.bukenCode
 						WHERE M.bukenCode = #{bukenCode} 
						 AND  M.bukenCode = T.bukenCode ")
	end
	module_function :buken_joho_str
   
   #前々年度、前年度、今年度、来年度のハッシュ配列を返す
   #例{"2012年度" => 2012, "2013年度" => 2013, "2014年度" => 2014, "2015年度" => 2015}
   def	nendo_hash_default(from,to)
   		@nendo_hash_default =  Hash.new
   		@konnendo = CommonUtil.konnendo
   		for num in @konnendo + from..@konnendo + to do
   			@nendo_hash_default.store(num.to_s + '年度',num)
   		end
		@nendo_hash_default
	end
	module_function :nendo_hash_default
	
	   #YYYY/mm/ddから月を返す
 	def get_month(date)
		if (date =~ /^\d{4}\/\d{2}\/\d{2}$/ ) then
			@date_ary = date.split('/')
			@date = @date_ary[1].to_i
		else
			@date = 0
		end
		@date
	end
	module_function :get_month
	
	#共通検索(点検ステータス、点検完了日順)
	def get_yotei_sql(nendo,tenkenyoteiM, tenkenjishiM, kensakutantoshamei, kensakubukenmei,setubi,tenkenstatus,hoshustatus)
		return ActiveRecord::Base.connection.select("
				 	SELECT MOp.hachushamei, MOp.hachushaCode, B.tenkenkanryoYMD, B.bukenCode, B.hachushaCode,
  			                 B.tenkenshubetu, B.tenkenyoteiM, B.biko, B.jinko,B.edaban, B.tenkenkanryoYMD, 
  			                 B.tenkentantosha1, B.tenkenstatus, B.hoshukanrenumu, B.keiyakukingaku, B.nendo, B.jinendotenkenY
				  		FROM 	m_orderingpatries AS MOp
				  		INNER JOIN				
					       ( SELECT TCt.bukenCode, TCi.hachushaCode, TCt.tenkenshubetu, TCt.tenkenyoteiM, TCt.biko,
					                TCt.jinko,TCt.edaban, DATE_FORMAT(TCt.tenkenkanryoYMD,'%Y/%m/%d') AS tenkenkanryoYMD,
					                TCi.tenkentantosha1, TCt.tenkenstatus, TCt.hoshukanrenumu, TCt.keiyakukingaku, TCi.nendo, 
					                	TCi.jinendotenkenY
  					         FROM t_check_infos AS TCi, t_chktrackrec_infos AS TCt
  					         #{hoshustatus}
  								WHERE TCi.nendo = #{nendo} 
  								AND TCt.nendo = #{nendo}
  								#{tenkenyoteiM} #{tenkenjishiM} #{kensakutantoshamei} #{setubi} #{tenkenstatus} 
  								AND TCi.bukenCode = TCt.bukenCode
  								AND TCi.tenkenyoteiM1 = TCt.tenkenyoteiM 
  								AND TCi.tenkenshubetu = TCt.tenkenshubetu
								#{kensakubukenmei} 
							) B
	  				ON MOp.hachushaCode = B.hachushaCode                
	  				ORDER BY B.tenkenstatus, B.tenkenkanryoYMD ASC ")
	  				
	end
	module_function :get_yotei_sql
	
	#担当者検索(発注者名順)
	def get_yotei_tanto_sql(nendo,tenkenyoteiM, tenkenjishiM, kensakutantoshamei, kensakubukenmei,setubi,tenkenstatus,hoshustatus)
		return ActiveRecord::Base.connection.select("
				 	SELECT MOp.hachushamei, MOp.hachushaCode, B.tenkenkanryoYMD, B.bukenCode, B.hachushaCode,
  			                 B.tenkenshubetu, B.tenkenyoteiM, B.biko, B.jinko,B.edaban, B.tenkenkanryoYMD, 
  			                 B.tenkentantosha1, B.tenkenstatus, B.hoshukanrenumu, B.keiyakukingaku, B.nendo, B.jinendotenkenY
				  		FROM 	m_orderingpatries AS MOp
				  		INNER JOIN				
					       ( SELECT TCt.bukenCode, TCi.hachushaCode, TCt.tenkenshubetu, TCt.tenkenyoteiM, TCt.biko,
					                TCt.jinko,TCt.edaban, DATE_FORMAT(TCt.tenkenkanryoYMD,'%Y/%m/%d') AS tenkenkanryoYMD,
					                TCi.tenkentantosha1, TCt.tenkenstatus, TCt.hoshukanrenumu, TCt.keiyakukingaku, TCi.nendo, 
					                	TCi.jinendotenkenY
  					         FROM t_check_infos AS TCi, t_chktrackrec_infos AS TCt
  					         #{hoshustatus}
  								WHERE TCi.nendo = #{nendo} 
  								AND TCt.nendo = #{nendo}
  								#{tenkenyoteiM} #{tenkenjishiM} #{kensakutantoshamei} #{setubi} #{tenkenstatus} 
  								AND TCi.bukenCode = TCt.bukenCode
  								AND TCi.tenkenyoteiM1 = TCt.tenkenyoteiM 
  								AND TCi.tenkenshubetu = TCt.tenkenshubetu
								#{kensakubukenmei} 
							) B
	  				ON MOp.hachushaCode = B.hachushaCode                
	  				ORDER BY MOp.hachushamei ASC ")
	  				
	end
	module_function :get_yotei_tanto_sql
	
	#管理者連続検索(点検ステータス、点検完了日順)
	def get_yotei_ren_sql(nendo,tenkenyoteiM, tenkenjishiM, kensakutantoshamei, kensakubukenmei,setubi,tenkenstatus,hoshustatus)
		return ActiveRecord::Base.connection.select("
				 	SELECT MOp.hachushamei, MOp.hachushaCode, B.tenkenkanryoYMD, B.bukenCode, B.hachushaCode,
  			                 B.tenkenshubetu, B.tenkenyoteiM, B.biko, B.jinko,B.edaban, B.tenkenkanryoYMD, 
  			                 B.tenkentantosha1, B.tenkenstatus, B.hoshukanrenumu, B.keiyakukingaku, B.nendo, B.jinendotenkenY
				  		FROM 	m_orderingpatries AS MOp
				  		INNER JOIN				
					       ( SELECT TCt.bukenCode, TCi.hachushaCode, TCt.tenkenshubetu, TCt.tenkenyoteiM, TCt.biko,
					                TCt.jinko,TCt.edaban, DATE_FORMAT(TCt.tenkenkanryoYMD,'%Y/%m/%d') AS tenkenkanryoYMD,
					                TCi.tenkentantosha1, TCt.tenkenstatus, TCt.hoshukanrenumu, TCt.keiyakukingaku, TCi.nendo, 
					                	TCi.jinendotenkenY
  					         FROM t_check_infos AS TCi, t_chktrackrec_infos AS TCt
  					         #{hoshustatus}
  								WHERE TCi.nendo IN (#{nendo}) 
  								AND TCt.nendo = TCi.nendo
  								#{tenkenyoteiM} #{tenkenjishiM} #{kensakutantoshamei} #{setubi} #{tenkenstatus} 
  								AND TCi.bukenCode = TCt.bukenCode
  								AND TCi.tenkenyoteiM1 = TCt.tenkenyoteiM 
  								AND TCi.tenkenshubetu = TCt.tenkenshubetu
								#{kensakubukenmei} 
							) B
	  				ON MOp.hachushaCode = B.hachushaCode                
	  				ORDER BY B.tenkenstatus, B.tenkenkanryoYMD ASC ")
	  				
	end
	module_function :get_yotei_ren_sql
	
	#担当者次年度（次年度更新前）
	def get_yotei_tanto_jinendo_before_sql(jinendo,tenkenyoteiM, tenkenjishiM, kensakutantoshamei, kensakubukenmei,setubi,tenkenstatus,hoshustatus)
		return ActiveRecord::Base.connection.select("
				 	SELECT MOp.hachushamei, MOp.hachushaCode, B.tenkenkanryoYMD, B.bukenCode, B.hachushaCode,
  			                 B.tenkenshubetu, B.tenkenyoteiM, B.biko, B.jinko,B.edaban, B.tenkenkanryoYMD, 
  			                 B.tenkentantosha1, B.tenkenstatus, B.hoshukanrenumu, B.keiyakukingaku, B.nendo, B.jinendotenkenY
				  		FROM 	m_orderingpatries AS MOp
				  		INNER JOIN				
					       ( SELECT TCt.bukenCode, TCi.hachushaCode, TCt.tenkenshubetu, TCt.tenkenyoteiM, TCt.biko,
					                TCt.jinko,TCt.edaban, DATE_FORMAT(TCt.tenkenkanryoYMD,'%Y/%m/%d') AS tenkenkanryoYMD,
					                TCi.tenkentantosha1, TCt.tenkenstatus, TCt.hoshukanrenumu, TCt.keiyakukingaku, TCi.nendo, 
					                	TCi.jinendotenkenY
  					         FROM t_check_infos AS TCi, t_chktrackrec_infos AS TCt
  					         #{hoshustatus}
  								WHERE TCt.nendo = TCi.nendo
  								#{tenkenyoteiM} #{tenkenjishiM} #{kensakutantoshamei} #{setubi} #{tenkenstatus} 
  								AND TCi.bukenCode = TCt.bukenCode
  								AND TCi.tenkenyoteiM1 = TCt.tenkenyoteiM 
  								AND TCi.tenkenshubetu = TCt.tenkenshubetu
								#{kensakubukenmei} 
								AND TCi.jinendotenkenY >= #{jinendo}
								AND (TCi.jinendotenkenY - 2 = TCi.nendo OR TCi.jinendotenkenY - 3 = TCi.nendo)
							) B
	  				ON MOp.hachushaCode = B.hachushaCode                
	  				ORDER BY MOp.hachushamei ASC ")
	  				
	end
	#担当者次年度（次年度更新後）
	module_function :get_yotei_tanto_jinendo_before_sql
	
	def get_yotei_tanto_jinendo_after_sql(jinendo,tenkenyoteiM, tenkenjishiM, kensakutantoshamei, kensakubukenmei,setubi,tenkenstatus,hoshustatus)
		return ActiveRecord::Base.connection.select("
				 	SELECT MOp.hachushamei, MOp.hachushaCode, B.tenkenkanryoYMD, B.bukenCode, B.hachushaCode,
  			                 B.tenkenshubetu, B.tenkenyoteiM, B.biko, B.jinko,B.edaban, B.tenkenkanryoYMD, 
  			                 B.tenkentantosha1, B.tenkenstatus, B.hoshukanrenumu, B.keiyakukingaku, B.nendo, B.jinendotenkenY
				  		FROM 	m_orderingpatries AS MOp
				  		INNER JOIN				
					       ( SELECT TCt.bukenCode, TCi.hachushaCode, TCt.tenkenshubetu, TCt.tenkenyoteiM, TCt.biko,
					                TCt.jinko,TCt.edaban, DATE_FORMAT(TCt.tenkenkanryoYMD,'%Y/%m/%d') AS tenkenkanryoYMD,
					                TCi.tenkentantosha1, TCt.tenkenstatus, TCt.hoshukanrenumu, TCt.keiyakukingaku, TCi.nendo, 
					                	TCi.jinendotenkenY
  					         FROM t_check_infos AS TCi, t_chktrackrec_infos AS TCt
  					         #{hoshustatus}
  								WHERE TCt.nendo = TCi.nendo
  								#{tenkenyoteiM} #{tenkenjishiM} #{kensakutantoshamei} #{setubi} #{tenkenstatus} 
  								AND TCi.bukenCode = TCt.bukenCode
  								AND TCi.tenkenyoteiM1 = TCt.tenkenyoteiM 
  								AND TCi.tenkenshubetu = TCt.tenkenshubetu
								#{kensakubukenmei} 
								AND TCt.nendo = #{jinendo}
								AND TCi.nendo = #{jinendo}
							) B
	  				ON MOp.hachushaCode = B.hachushaCode                
	  				ORDER BY MOp.hachushamei ASC ")
	end
	module_function :get_yotei_tanto_jinendo_after_sql
	#管理者普通検索
	def get_yotei_admin_sql(nendo,tenkenyoteiM, tenkenjishiM, kensakutantoshamei, kensakubukenmei,setubi,tenkenstatus,hoshustatus,sort)
		return ActiveRecord::Base.connection.select("
				 	SELECT MOp.hachushamei, MOp.hachushaCode, B.tenkenkanryoYMD, B.bukenCode, B.hachushaCode,
  			                 B.tenkenshubetu, B.tenkenyoteiM, B.biko, B.jinko,B.edaban, B.tenkenkanryoYMD, 
  			                 B.tenkentantosha1, B.tenkenstatus, B.hoshukanrenumu, B.keiyakukingaku, B.nendo, B.jinendotenkenY
				  		FROM 	m_orderingpatries AS MOp
				  		INNER JOIN				
					       ( SELECT TCt.bukenCode, TCi.hachushaCode, TCt.tenkenshubetu, TCt.tenkenyoteiM, TCt.biko,
					                TCt.jinko,TCt.edaban, DATE_FORMAT(TCt.tenkenkanryoYMD,'%Y/%m/%d') AS tenkenkanryoYMD,
					                TCi.tenkentantosha1, TCt.tenkenstatus, TCt.hoshukanrenumu, TCt.keiyakukingaku, TCi.nendo, 
					                	TCi.jinendotenkenY
  					         FROM t_check_infos AS TCi, t_chktrackrec_infos AS TCt
  					         #{hoshustatus}
  								WHERE TCi.nendo = #{nendo} 
  								AND TCt.nendo = #{nendo}
  								#{tenkenyoteiM} #{tenkenjishiM} #{kensakutantoshamei} #{setubi} #{tenkenstatus} 
  								AND TCi.bukenCode = TCt.bukenCode
  								AND TCi.tenkenyoteiM1 = TCt.tenkenyoteiM 
  								AND TCi.tenkenshubetu = TCt.tenkenshubetu
								#{kensakubukenmei} 
							) B
	  				ON MOp.hachushaCode = B.hachushaCode                
	  				#{sort} ")#ORDER BY B.tenkenstatus, B.tenkenkanryoYMD ASC
	  				
	end
	module_function :get_yotei_admin_sql
	
	#管理者連続検索
	def get_yotei_admin_ren_sql(nendo,tenkenyoteiM, tenkenjishiM, kensakutantoshamei, kensakubukenmei,setubi,tenkenstatus,hoshustatus,sort)
		return ActiveRecord::Base.connection.select("
				 	SELECT MOp.hachushamei, MOp.hachushaCode, B.tenkenkanryoYMD, B.bukenCode, B.hachushaCode,
  			                 B.tenkenshubetu, B.tenkenyoteiM, B.biko, B.jinko,B.edaban, B.tenkenkanryoYMD, 
  			                 B.tenkentantosha1, B.tenkenstatus, B.hoshukanrenumu, B.keiyakukingaku, B.nendo, B.jinendotenkenY
				  		FROM 	m_orderingpatries AS MOp
				  		INNER JOIN				
					       ( SELECT TCt.bukenCode, TCi.hachushaCode, TCt.tenkenshubetu, TCt.tenkenyoteiM, TCt.biko,
					                TCt.jinko,TCt.edaban, DATE_FORMAT(TCt.tenkenkanryoYMD,'%Y/%m/%d') AS tenkenkanryoYMD,
					                TCi.tenkentantosha1, TCt.tenkenstatus, TCt.hoshukanrenumu, TCt.keiyakukingaku, TCi.nendo, 
					                	TCi.jinendotenkenY
  					         FROM t_check_infos AS TCi, t_chktrackrec_infos AS TCt
  					         #{hoshustatus}
  								WHERE TCi.nendo IN (#{nendo}) 
  								AND TCt.nendo = TCi.nendo
  								#{tenkenyoteiM} #{tenkenjishiM} #{kensakutantoshamei} #{setubi} #{tenkenstatus} 
  								AND TCi.bukenCode = TCt.bukenCode
  								AND TCi.tenkenyoteiM1 = TCt.tenkenyoteiM 
  								AND TCi.tenkenshubetu = TCt.tenkenshubetu
								#{kensakubukenmei} 
							) B
	  				ON MOp.hachushaCode = B.hachushaCode                
	  				#{sort} ") #ORDER BY B.tenkenstatus, B.tenkenkanryoYMD ASC
	  				
	end
	module_function :get_yotei_admin_ren_sql
	
	#管理者次年度検索（次年度更新前）
	def get_yotei_admin_jinendo_before_sql(jinendo,tenkenyoteiM, tenkenjishiM, kensakutantoshamei, kensakubukenmei,setubi,tenkenstatus,hoshustatus,sort)
		return ActiveRecord::Base.connection.select("
				 	SELECT MOp.hachushamei, MOp.hachushaCode, B.tenkenkanryoYMD, B.bukenCode, B.hachushaCode,
  			                 B.tenkenshubetu, B.tenkenyoteiM, B.biko, B.jinko,B.edaban, B.tenkenkanryoYMD, 
  			                 B.tenkentantosha1, B.tenkenstatus, B.hoshukanrenumu, B.keiyakukingaku, B.nendo, B.jinendotenkenY
				  		FROM 	m_orderingpatries AS MOp
				  		INNER JOIN				
					       ( SELECT TCt.bukenCode, TCi.hachushaCode, TCt.tenkenshubetu, TCt.tenkenyoteiM, TCt.biko,
					                TCt.jinko,TCt.edaban, DATE_FORMAT(TCt.tenkenkanryoYMD,'%Y/%m/%d') AS tenkenkanryoYMD,
					                TCi.tenkentantosha1, TCt.tenkenstatus, TCt.hoshukanrenumu, TCt.keiyakukingaku, TCi.nendo, 
					                	TCi.jinendotenkenY
  					         FROM t_check_infos AS TCi, t_chktrackrec_infos AS TCt
  					         #{hoshustatus}
  								WHERE TCt.nendo = TCi.nendo
  								#{tenkenyoteiM} #{tenkenjishiM} #{kensakutantoshamei} #{setubi} #{tenkenstatus} 
  								AND TCi.bukenCode = TCt.bukenCode
  								AND TCi.tenkenyoteiM1 = TCt.tenkenyoteiM 
  								AND TCi.tenkenshubetu = TCt.tenkenshubetu
								#{kensakubukenmei} 
								AND TCi.jinendotenkenY >= #{jinendo}
								AND (TCi.jinendotenkenY - 2 = TCi.nendo OR TCi.jinendotenkenY - 3 = TCi.nendo)
							) B
	  				ON MOp.hachushaCode = B.hachushaCode 
					#{sort} ") #ORDER BY B.tenkenstatus, B.tenkenkanryoYMD ASC 
	  				
	end
	module_function :get_yotei_admin_jinendo_before_sql
	#管理者次年度検索（次年度更新後）
	def get_yotei_admin_jinendo_after_sql(jinendo,tenkenyoteiM, tenkenjishiM, kensakutantoshamei, kensakubukenmei,setubi,tenkenstatus,hoshustatus,sort)
		return ActiveRecord::Base.connection.select("
				 	SELECT MOp.hachushamei, MOp.hachushaCode, B.tenkenkanryoYMD, B.bukenCode, B.hachushaCode,
  			                 B.tenkenshubetu, B.tenkenyoteiM, B.biko, B.jinko,B.edaban, B.tenkenkanryoYMD, 
  			                 B.tenkentantosha1, B.tenkenstatus, B.hoshukanrenumu, B.keiyakukingaku, B.nendo, B.jinendotenkenY
				  		FROM 	m_orderingpatries AS MOp
				  		INNER JOIN				
					       ( SELECT TCt.bukenCode, TCi.hachushaCode, TCt.tenkenshubetu, TCt.tenkenyoteiM, TCt.biko,
					                TCt.jinko,TCt.edaban, DATE_FORMAT(TCt.tenkenkanryoYMD,'%Y/%m/%d') AS tenkenkanryoYMD,
					                TCi.tenkentantosha1, TCt.tenkenstatus, TCt.hoshukanrenumu, TCt.keiyakukingaku, TCi.nendo, 
					                	TCi.jinendotenkenY
  					         FROM t_check_infos AS TCi, t_chktrackrec_infos AS TCt
  					         #{hoshustatus}
  								WHERE TCt.nendo = TCi.nendo
  								#{tenkenyoteiM} #{tenkenjishiM} #{kensakutantoshamei} #{setubi} #{tenkenstatus} 
  								AND TCi.bukenCode = TCt.bukenCode
  								AND TCi.tenkenyoteiM1 = TCt.tenkenyoteiM 
  								AND TCi.tenkenshubetu = TCt.tenkenshubetu
								#{kensakubukenmei} 
								AND TCt.nendo = #{jinendo}
								AND TCi.nendo = #{jinendo}
							) B
	  				ON MOp.hachushaCode = B.hachushaCode 
					#{sort} ") #ORDER BY B.tenkenstatus, B.tenkenkanryoYMD ASC 
	  				
	end
	module_function :get_yotei_admin_jinendo_after_sql
	
	def get_kaishiM_selectbox_html(sentaku_tuki)
		@m_kind_select = MInit.all
		@kaishi_m = @m_kind_select[0]["nendokaishiM"]	
		@html = '<option value=""></option>'
		if sentaku_tuki == 0 then
			for num in 0..11 do
				data = ((@kaishi_m + num - 1) % 12 + 1).to_s
				@html += '<option value="' + data + '">' + data + '月</option>'
			end
		else
			for num in 0..11 do
				data = ((@kaishi_m + num - 1) % 12 + 1).to_s
				@html += (data == sentaku_tuki.to_s) ? '<option value="' + data + '" selected>' + data + '月</option>'
														: '<option value="' + data + '">' + data + '月</option>'
			end
		end	
		@html
	end
	module_function :get_kaishiM_selectbox_html
	
	def open_pdf(report, type, preid)
		#同種類、同ユーザの前回のpdfを削除
		FileUtils.rm(Dir.glob(File.join(Rails.root, 'public','pdf', type) + preid + "*.pdf"))
		#ユーザID＋タイムスタンプ＋ランダム16桁をパスとして新規作成
		@random_str = Time.now.strftime("%Y%m%d%H%M%S").to_s + SecureRandom.hex(16).to_s
		report.generate_file(File.join(Rails.root, 'public','pdf', type + preid + @random_str + '.pdf'))
		'pdf/' + type + preid + @random_str + '.pdf'
	end
	module_function :open_pdf
	
	#指定ディレクトリからファイル一覧を取得
	def recursive_dir(path)
		@backup = Array.new
		if File.exists?(path) then
	  Dir::foreach(path) do |v|
		next if v == "." or v == ".."
		if path =~ /\/$/
		  v = path + v
		else
		  v = path + "/" + v
		end
		if FileTest::directory?(v)
		  recursive_dir(v) #再帰呼び出し
		else
		  @backup.push getfile(v)
		  
#		  getyear(v)
#		  getmonth(v)			
#		  logger.info(v)
		end
	  end
	  end
	  @backup
	end
	module_function :recursive_dir
	
	
	#バックアップファイル名取得
	def getfile(str)
		file=/[\d]+.sql/.match(str)
		string= file[0]
		#year=year[1,4]
#		logger.info("get year = "+string)
		return string
	end
	module_function :getfile
	
	##バックアップファイル名の年を取得
	def getyear(str)
		year=/\/\d{4}\//.match(str)
		string= year[0][1,4]
		#year=year[1,4]
#		logger.info("get year = "+string)
		return
	end
	module_function :getyear
	
	##バックアップファイル名の月を取得
	def getmonth(str)
		month=/\/\d{2}\//.match(str)
		string= month[0][1,2]
		#year=year[1,4]
#		logger.info("get month = "+string)
		return
	end
	module_function :getmonth
	
	#バックアップ実行シェル起動
	def autobackup
		o,s = Open3.capture2("./app/backrestore/autobackup.sh")
	end
	module_function :autobackup

	#バックアップ実行シェル起動
	def backup
#		logger.info("run backup")
		o,s = Open3.capture2("./app/backrestore/backup.sh")
#		logger.info(o.to_s)
	end
	module_function :backup
	
	#リストア実行
	def restore(file)
#		logger.info("run restore")
		year = file.slice(0,4)
		month = file.slice(4,2)

		o,s = Open3.capture2("./app/backrestore/restore.sh ./db/backup/#{year}/#{month}/#{file}.sql")
#		logger.info(o.to_s)
#		logger.info(s.to_s)
	end
	module_function :restore
	
	#年度開始年月日、終了年月日の読み込み
	def read_file
	@string = ''
		open(File.join(Rails.root, 'public/') + "nendo.txt") {|file|
			@string = file.read
		}
		@string
	end
	module_function :read_file
	
	#年度開始年月日、終了年月日の書き込み
	def write_file(str)
		open(File.join(Rails.root, 'public/') + "nendo.txt", "w") {|file|
			file.write = str
		}
	end
	module_function :write_file
	
	
	
	
	def buken_toroku_henshu_check(params,m_kind_table)
		@error = ["","","",""]
		m_kind_table.each do |list|
			if (params['sentaku' + list.shubetu.to_s].to_s != '') then
				@tantosha_flg1 = false
				@focus = ""
				if params["tenkenkaisu#{list.shubetu}"] == '1' then
					@flg = false
  					for num in 1..10 do
						if !params["tenkentantousha#{list.shubetu}_1_#{num}"].blank? && params["tenkentantousha#{list.shubetu}_1_#{num}"].slice(0..0) == '1'  then
  							@error = ['message_warning', '選択した担当者は削除されています。','入力確認','']
  							@flg = true
  							break
						end
					end	
				elsif params["tenkenkaisu#{list.shubetu}"] == '2' then
					@flg = false
  					for num in 1..10 do
						if !params["tenkentantousha#{list.shubetu}_2_#{num}"].blank? && params["tenkentantousha#{list.shubetu}_1_#{num}"].slice(0..0) == '1'  then
  							@error = ['message_warning', '選択した担当者は削除されています。','入力確認','']
  							@flg = true
  							break
						end
					end	
				end	
				
	
			end
		end
		@error[3] = @focus
		@error
	end
	module_function :buken_toroku_henshu_check
	
end		
